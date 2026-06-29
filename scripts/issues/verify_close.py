#!/usr/bin/env python3
"""
verify_close.py — the deterministic gate of the Issue Autopilot verify-and-close lane.

The issue-verifier (an LLM, read-only) inspects each `verify_candidate` issue and
writes its verdicts to `.issues/verify.json`. This script is the DETERMINISTIC half:
it selects which of those verdicts may actually close an issue, and it does so ONLY
when `main`'s full CI/CD gate suite is green. The autopilot never closes a human
issue on an LLM's say-so alone — the green-CI gate here is the hard backstop.

A verdict closes its issue iff ALL of:
  1. verdict.resolved is true,
  2. verdict.confidence == "high" and verdict.evidence is non-empty,
  3. the issue is a `verify_candidate` in plan.json (defense in depth — never a
     protected/backlog-managed/bot/epic issue, even if the LLM names one),
  4. `main`'s combined commit status + every check-run on its HEAD are green.

`select` prints `<number>\t<evidence>` TSV for closable issues (the workflow does
the actual `gh issue close`, keeping the irreversible mutation in an auditable
step). If the CI/CD gate is not green, it prints NOTHING and the whole batch is
held — "close only if they pass all CI/CD gates" is all-or-nothing per run.

READ-ONLY against GitHub: this script only ever calls `gh api` GET endpoints. It
never closes, comments, or labels. Verdict text is treated strictly as DATA.

  Subcommands:
    select   print closable `<number>\t<evidence>` lines (gated on green CI)
    gate     print "green" / "not-green: <why>" for main's CI suite, then exit 0/1
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Optional

ISSUES_DIR = Path(".issues")
PLAN_PATH = ISSUES_DIR / "plan.json"
VERIFY_PATH = ISSUES_DIR / "verify.json"

# check-run conclusions that do NOT block a close (everything else does, and any
# check-run that has not `completed` blocks too — something is still running).
OK_CONCLUSIONS = {"success", "neutral", "skipped"}


def warn(msg: str) -> None:
    print(f"::warning::verify_close: {msg}", file=sys.stderr)


def _gh_api(path: str) -> Optional[Any]:
    """GET a gh api endpoint, returning parsed JSON or None on any failure."""
    try:
        out = subprocess.run(
            ["gh", "api", "-H", "Accept: application/vnd.github+json", path],
            capture_output=True, text=True, timeout=60,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        warn(f"gh api {path} failed to run: {exc}")
        return None
    if out.returncode != 0:
        warn(f"gh api {path} exited {out.returncode}: {out.stderr.strip()[:200]}")
        return None
    try:
        return json.loads(out.stdout or "null")
    except json.JSONDecodeError as exc:
        warn(f"gh api {path} returned non-JSON: {exc}")
        return None


def ci_gate(repo: str, ref: str = "main") -> tuple[bool, str]:
    """
    True iff `main`'s combined commit status AND every check-run on its HEAD are
    green. Fails CLOSED: any API error, pending run, or failure -> (False, why).
    """
    if not repo:
        return False, "no repo configured"

    status = _gh_api(f"repos/{repo}/commits/{ref}/status")
    if status is None:
        return False, "could not read commit status (failing closed)"
    state = str(status.get("state") or "")
    total = int(status.get("total_count") or 0)
    # A commit with zero classic statuses reports state=pending; that's only a
    # blocker if there are actually statuses. With statuses, require success.
    if total > 0 and state != "success":
        return False, f"combined commit status is '{state}' ({total} status(es))"

    runs = _gh_api(f"repos/{repo}/commits/{ref}/check-runs?per_page=100")
    if runs is None:
        return False, "could not read check-runs (failing closed)"
    for run in runs.get("check_runs") or []:
        name = str(run.get("name") or "?")
        if str(run.get("status")) != "completed":
            return False, f"check-run '{name}' is not completed (status={run.get('status')})"
        if str(run.get("conclusion")) not in OK_CONCLUSIONS:
            return False, f"check-run '{name}' concluded '{run.get('conclusion')}'"
    return True, f"green (state={state or 'none'}, {total} status(es), all check-runs passed)"


def _load(path: Path) -> Optional[Any]:
    if not path.exists():
        warn(f"{path} not found")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        warn(f"{path} unreadable: {exc}")
        return None


def closable(plan: dict[str, Any], verify: dict[str, Any]) -> list[dict[str, Any]]:
    """Verdicts that pass the policy filter (steps 1-3), before the CI gate."""
    candidates = {
        int(r["number"]): r
        for r in (plan.get("issues") or [])
        if r.get("verify_candidate") and r.get("number") is not None
    }
    out: list[dict[str, Any]] = []
    for v in (verify.get("verdicts") or []):
        try:
            num = int(v.get("number"))
        except (TypeError, ValueError):
            continue
        if not v.get("resolved"):
            continue
        if str(v.get("confidence") or "").lower() != "high":
            continue
        evidence = str(v.get("evidence") or "").strip()
        if not evidence:
            continue
        if num not in candidates:  # defense in depth — never close a non-candidate
            warn(f"#{num} verdict resolved but not a verify_candidate — skipping")
            continue
        out.append({"number": num, "evidence": evidence})
    return out


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("command", choices=["select", "gate"])
    ap.add_argument("--repo", default=None, help="owner/name (else from plan.json)")
    ap.add_argument("--ref", default="main", help="git ref to gate on (default: main)")
    args = ap.parse_args(argv)

    plan = _load(PLAN_PATH) or {}
    repo = args.repo or str(plan.get("repo") or "")

    if args.command == "gate":
        green, why = ci_gate(repo, args.ref)
        print("green" if green else f"not-green: {why}")
        return 0 if green else 1

    # select
    verify = _load(VERIFY_PATH)
    if not isinstance(verify, dict):
        print("no verdicts to act on.", file=sys.stderr)
        return 0
    picks = closable(plan, verify)
    if not picks:
        print("no resolved+high-confidence verdicts for a verify_candidate.", file=sys.stderr)
        return 0

    green, why = ci_gate(repo, args.ref)
    if not green:
        warn(f"CI/CD gate not green — holding {len(picks)} close(s) this run: {why}")
        return 0

    print(f"CI/CD gate {why}", file=sys.stderr)
    for p in picks:
        # TSV: the workflow closes these; evidence goes into the close comment.
        evidence = p["evidence"].replace("\t", " ").replace("\n", " ")
        print(f"{p['number']}\t{evidence}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
