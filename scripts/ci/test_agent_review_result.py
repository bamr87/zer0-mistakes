#!/usr/bin/env python3
"""Unit tests for scripts/ci/agent_review_result.py (issue #418).

The bug these guard against: the Claude tier of ai-content-review.yml posted

    Failed to authenticate. API Error: 401 OAuth access token has been revoked.

into PR #414 as its review, and the job still reported success. The credential
has since been rotated, but the SWALLOW is the durable defect — it would hide
the next revoked token exactly as well as it hid this one.

The first fixture below is that output verbatim, copied from the comment the
workflow actually posted (2026-08-23T04:51:47Z, run 32618860829). If the guard
ever stops failing on it, the regression is back.

Both directions are covered. A real review must NOT be flagged — including one
whose prose legitimately quotes an auth error, which is the false positive a
bare `grep 'Failed to authenticate'` would produce (and which would fire on this
repo's own troubleshooting docs).

Dependency-light on purpose: standard library only, so it runs anywhere the
workflow does.

    python3 scripts/ci/test_agent_review_result.py
"""

from __future__ import annotations

import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import agent_review_result as arr  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "ai-content-review.yml"

CHECKS: list[tuple[str, bool]] = []


def check(label: str, ok: bool) -> None:
    CHECKS.append((label, bool(ok)))


# The 401 exactly as the CLI printed it and the workflow posted it.
AUTH_401 = "Failed to authenticate. API Error: 401 OAuth access token has been revoked.\n"

REAL_REVIEW = """**Verdict:** approve with minor suggestions

### pages/_docs/getting-started.md

- The `description` front matter reads as a keyword list rather than a sentence.
  Rewrite it as prose so search snippets are readable.
- The second H2 duplicates the page title; demote it to an H3 or cut it.
- Two code fences are missing a language tag, so they render unhighlighted.
- Alt text on the architecture diagram describes the file, not the picture.

### pages/_docs/configuration.md

- Consistent terminology: this page says "config file" where the rest of the
  docs say `_config.yml`. Pick one.
- The table of collection defaults is missing the `books` collection added in
  v1.19, so the page is incomplete rather than merely terse.
- Sentence length in "Advanced overrides" averages 38 words; split the longest.

### Summary

Both files are accurate and well-organised. The findings above are polish, not
correctness — nothing here blocks the merge.
"""

# A real review that TALKS about auth failures. Must not be mistaken for one.
REVIEW_ABOUT_AUTH = """**Verdict:** approve

### docs/troubleshooting/credentials.md

- The page explains what to do when the CLI prints "Failed to authenticate. API
  Error: 401 OAuth access token has been revoked." — good, that is the exact
  string users will search for, so keep it verbatim rather than paraphrasing.
- Add a cross-link to the rotation runbook; the reader is told to "rotate the
  token" with no pointer to how.
- The `authentication_error` example block is missing a language tag.
- Consider noting that the deterministic review tier keeps working while the
  credential is broken, since that surprised at least one reader.
- Front matter `lastmod` is stale by two releases.

### Summary

Accurate and genuinely useful. Only polish items above; the troubleshooting
steps themselves check out against the current workflow definition.
"""


def run_guard(status: int, stdout: str, stderr: str = "") -> tuple[int, str]:
    """Invoke the guard end-to-end; return (exit code, comment body)."""
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        (d / "out.txt").write_text(stdout, encoding="utf-8")
        (d / "err.txt").write_text(stderr, encoding="utf-8")
        rc = arr.main([
            "--status", str(status),
            "--stdout", str(d / "out.txt"),
            "--stderr", str(d / "err.txt"),
            "--out", str(d / "body.md"),
        ])
        return rc, (d / "body.md").read_text(encoding="utf-8")


def main() -> int:
    # --- the observed failure, verbatim ------------------------------------ #
    rc, body = run_guard(0, AUTH_401)
    check("the verbatim PR #414 401 fails the step (exit 1) even on claude exit 0", rc == 1)
    check("the 401 comment body says the review did not run", "did not run" in body)
    check("the raw 401 line is no longer posted as if it were the review",
          not body.startswith(f"{arr.TITLE}\n\nFailed to authenticate"))
    check("the failure notice is visibly a caution, not a review", "[!CAUTION]" in body)

    rc, _ = run_guard(1, AUTH_401)
    check("a non-zero claude exit fails the step", rc == 1)

    # --- nothing came back -------------------------------------------------- #
    rc, body = run_guard(0, "")
    check("empty agent output fails the step", rc == 1)
    check("the empty-output notice names the reason", "no output" in body)

    rc, _ = run_guard(0, "\n   \n\t\n")
    check("whitespace-only agent output fails the step", rc == 1)

    # --- other credential failures ------------------------------------------ #
    rc, _ = run_guard(0, "API Error: 400 Credit balance is too low to access the API.\n")
    check("a credit-balance failure fails the step", rc == 1)
    rc, _ = run_guard(0, "Invalid API key · Please run `claude login`\n")
    check("an invalid-key failure fails the step", rc == 1)
    rc, _ = run_guard(0, "API Error: 429 rate limit exceeded\n")
    check("a rate-limit failure fails the step", rc == 1)

    # --- real reviews pass --------------------------------------------------- #
    rc, body = run_guard(0, REAL_REVIEW)
    check("a genuine multi-section review passes", rc == 0)
    check("the real review is posted under the review heading", "**Verdict:**" in body)

    rc, _ = run_guard(0, REVIEW_ABOUT_AUTH)
    check("a long review that QUOTES an auth error is not mistaken for a failure", rc == 0)

    # --- the workflow actually uses the guard -------------------------------- #
    # Without this the fix is one deleted line away from returning, and nothing
    # in the fixture tests above would notice.
    wf = WORKFLOW.read_text(encoding="utf-8")
    check("ai-content-review.yml invokes the guard",
          "scripts/ci/agent_review_result.py" in wf)
    check("the agent step no longer ends by piping stdout into the comment body",
          not re.search(r"cat /tmp/agent-review\.md\s*\n\s*\}\s*>\s*/tmp/agent-review-final\.md", wf))
    check("the AI gate no longer implies a present credential is a working one",
          "not validity" in wf)

    failed = [label for label, ok in CHECKS if not ok]
    print()
    for label, ok in CHECKS:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}")
    print()
    if failed:
        print(f"FAILED ({len(failed)}/{len(CHECKS)})")
        return 1
    print(f"OK ({len(CHECKS)} checks)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
