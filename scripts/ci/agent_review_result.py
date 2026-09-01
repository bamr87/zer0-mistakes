#!/usr/bin/env python3
"""Decide whether the Claude content review ACTUALLY ran, and fail loudly if not.

WHY THIS EXISTS (issue #418)
----------------------------
`.github/workflows/ai-content-review.yml`'s agent step used to capture the
Claude CLI's exit status, echo it, and then never act on it. Whatever landed on
stdout was posted verbatim under the `ai-content-review-agent` sticky marker and
the step exited 0.

So when the OAuth credential was revoked (2026-08-18 → 08-24) the CLI printed

    Failed to authenticate. API Error: 401 OAuth access token has been revoked.

to STDOUT, that single line became the "review", and every job reported success.
Run 32618860829 concluded `success` while posting exactly that to PR #414; run
32656168775 shows all three agent steps green under the same conditions. Nothing
in the checks list, the run conclusion, or the annotations distinguished a
working editorial review from a dead one — for days, across several PRs.

Note what that rules out: a non-zero exit code is NOT sufficient to detect this.
The CLI reported the auth failure on stdout, and the step's own control flow
swallowed the status regardless. So all three ways the tier can be dead are
classified here:

  1. the CLI exited non-zero;
  2. it produced no output at all;
  3. it produced only a failure notice (the observed 401 case).

On any of those this writes an explicit failure notice for the sticky comment,
emits a ``::error::`` annotation so the condition is visible in the checks UI,
and exits 1 so the job goes red. The workflow's `Post agent review` step is
`if: always()`, so the comment is still posted — the reader gets a notice that
says the review did not run, instead of a raw API error dressed as a review.

Usage:
    python3 scripts/ci/agent_review_result.py \\
        --status <claude-exit-code> \\
        --stdout <file> [--stderr <file>] \\
        --out <comment-body-file>

Exit: 0 the review is real · 1 the tier failed · 2 bad invocation

Tests: scripts/ci/test_agent_review_result.py (run in CI via
scripts/test/lib/test_agent_review_result.sh → ./scripts/bin/test).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TITLE = "## 🤖 Claude Code Content Review"

# Failure signatures the Claude CLI prints INSTEAD of a review. Kept narrow on
# purpose: every entry is a string the CLI emits on its own.
FAILURE_SIGNATURES = re.compile(
    r"Failed to authenticate"
    r"|OAuth access token has been revoked"
    r"|API Error: (?:401|403|429|5\d\d)"
    r"|authentication_error"
    r"|invalid_api_key"
    r"|Invalid API key"
    r"|Credit balance is too low"
    r"|Please run [`'\"]?claude login",
    re.IGNORECASE,
)

# A genuine review is a structured Markdown document — a verdict, per-file
# findings, a summary. A failure notice is a line or two, and the failure is the
# FIRST thing on it. Requiring all three (short body, signature, signature near
# the top) stops a review that legitimately *discusses* an auth error from being
# thrown away as a failure — reviewing this repo's own credential-troubleshooting
# page would otherwise fail its own PR. Both directions are covered by the tests,
# and the bound is deliberately tight: an ambiguous LONG output containing an
# error is better shown to a human than silently discarded. A genuinely broken
# run that is also verbose almost always exits non-zero, which rule 1 catches.
MAX_FAILURE_NOTICE_LINES = 5
FAILURE_SIGNATURE_HEAD_LINES = 3


def nonblank_lines(text: str) -> list[str]:
    return [ln for ln in text.splitlines() if ln.strip()]


def classify(status: int, stdout: str) -> str | None:
    """Return a human-readable failure reason, or None if the review is real."""
    lines = nonblank_lines(stdout)
    if status != 0:
        return f"the Claude CLI exited with status `{status}`"
    if not lines:
        return "the agent produced no output"
    head = "\n".join(lines[:FAILURE_SIGNATURE_HEAD_LINES])
    if len(lines) <= MAX_FAILURE_NOTICE_LINES and FAILURE_SIGNATURES.search(head):
        return "the agent reported a credential / API failure instead of a review"
    return None


def _details(summary: str, body: str) -> list[str]:
    tail = "\n".join(body.splitlines()[-20:])
    return [f"<details><summary>{summary}</summary>", "", "```", tail, "```", "", "</details>", ""]


def render_failure(reason: str, status: int, stdout: str, stderr: str) -> str:
    out = [
        TITLE,
        "",
        "> [!CAUTION]",
        f"> **The editorial review did not run** — {reason}.",
        "> This comment is a failure notice, not a review. The job has been",
        "> failed on purpose so the condition is visible on the checks list",
        "> rather than only in this comment.",
        "",
        f"Claude CLI exit status: `{status}`",
        "",
    ]
    if stdout.strip():
        out += _details("Agent stdout", stdout)
    if stderr.strip():
        out += _details("Agent stderr (tail)", stderr)
    out += [
        "If this is a credential problem, rotate `CLAUDE_CODE_OAUTH_TOKEN` for this",
        "repository — see `docs/TOKEN-ROTATION.md` in bamr87/bamr87. The deterministic",
        "tier (`scripts/content-review.rb`) is unaffected and posts separately.",
        "",
    ]
    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--status", type=int, required=True, help="claude CLI exit code")
    p.add_argument("--stdout", required=True, help="file holding the agent's stdout")
    p.add_argument("--stderr", default=None, help="file holding the agent's stderr")
    p.add_argument("--out", required=True, help="file to write the sticky comment body to")
    args = p.parse_args(argv)

    stdout = Path(args.stdout).read_text(encoding="utf-8", errors="replace") \
        if Path(args.stdout).exists() else ""
    stderr = ""
    if args.stderr and Path(args.stderr).exists():
        stderr = Path(args.stderr).read_text(encoding="utf-8", errors="replace")

    reason = classify(args.status, stdout)
    out_path = Path(args.out)

    if reason is None:
        out_path.write_text(f"{TITLE}\n\n{stdout}", encoding="utf-8")
        print(f"agent-review-result: review looks real "
              f"({len(nonblank_lines(stdout))} non-blank lines).")
        return 0

    out_path.write_text(render_failure(reason, args.status, stdout, stderr), encoding="utf-8")
    print(f"::error title=Claude content review did not run::{reason} "
          f"(claude exit {args.status}). The sticky comment carries a failure notice, "
          f"not a review.")
    print(f"agent-review-result: FAILED — {reason}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
