#!/usr/bin/env python3
"""
test_verify_close.py — dependency-free unit tests for the verify-and-close gate.

Run: python3 scripts/issues/test_verify_close.py   (no pytest needed; exits non-zero on failure)

Covers the policy filter (which verdicts may close) and the CI gate's fail-CLOSED
behaviour. The CI gate is exercised with a stubbed `_gh_api` so the tests never
touch the network. These are the safety-critical paths: a bug here could close a
real, unresolved issue.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import verify_close as vc  # noqa: E402

PASSED = 0


def check(name: str, cond: bool) -> None:
    global PASSED
    if not cond:
        print(f"FAIL: {name}")
        raise SystemExit(1)
    PASSED += 1
    print(f"ok: {name}")


PLAN = {
    "repo": "bamr87/zer0-mistakes",
    "issues": [
        {"number": 241, "verify_candidate": True},
        {"number": 242, "verify_candidate": True},
        {"number": 999, "verify_candidate": False},  # protected/bot — never closable
    ],
}


def test_policy_filter() -> None:
    verify = {"verdicts": [
        {"number": 241, "resolved": True, "confidence": "high", "evidence": "_config.yml:685"},
        {"number": 999, "resolved": True, "confidence": "high", "evidence": "x"},   # not a candidate
        {"number": 242, "resolved": True, "confidence": "low", "evidence": "weak"},  # low confidence
        {"number": 242, "resolved": False, "confidence": "high", "evidence": "open"},  # not resolved
        {"number": 241, "resolved": True, "confidence": "high", "evidence": ""},     # no evidence (dupe)
    ]}
    picks = {p["number"] for p in vc.closable(PLAN, verify)}
    check("only the resolved+high+evidenced candidate is closable", picks == {241})


def test_non_candidate_never_closable() -> None:
    verify = {"verdicts": [
        {"number": 999, "resolved": True, "confidence": "high", "evidence": "real-looking"},
    ]}
    check("a non-verify_candidate is dropped (defense in depth)", vc.closable(PLAN, verify) == [])


def _stub_api(mapping):
    """Return a fake _gh_api that yields mapping[path] (substring match) or None."""
    def fake(path: str):
        for key, val in mapping.items():
            if key in path:
                return val
        return None
    return fake


def test_ci_gate_green() -> None:
    orig = vc._gh_api
    vc._gh_api = _stub_api({
        "/status": {"state": "success", "total_count": 2},
        "/check-runs": {"check_runs": [
            {"name": "build", "status": "completed", "conclusion": "success"},
            {"name": "lint", "status": "completed", "conclusion": "skipped"},
        ]},
    })
    try:
        green, _ = vc.ci_gate("o/r")
        check("all-green status + check-runs passes the gate", green is True)
    finally:
        vc._gh_api = orig


def test_ci_gate_fails_closed() -> None:
    orig = vc._gh_api
    cases = {
        "failing check-run": {
            "/status": {"state": "success", "total_count": 1},
            "/check-runs": {"check_runs": [{"name": "build", "status": "completed", "conclusion": "failure"}]},
        },
        "pending check-run": {
            "/status": {"state": "success", "total_count": 1},
            "/check-runs": {"check_runs": [{"name": "build", "status": "in_progress", "conclusion": None}]},
        },
        "failing commit status": {
            "/status": {"state": "failure", "total_count": 1},
            "/check-runs": {"check_runs": []},
        },
        "api error (None)": {},  # _gh_api returns None for everything → fail closed
    }
    try:
        for label, mapping in cases.items():
            vc._gh_api = _stub_api(mapping)
            green, why = vc.ci_gate("o/r")
            check(f"gate fails CLOSED on {label}", green is False and bool(why))
    finally:
        vc._gh_api = orig


if __name__ == "__main__":
    test_policy_filter()
    test_non_candidate_never_closable()
    test_ci_gate_green()
    test_ci_gate_fails_closed()
    print(f"\nAll {PASSED} verify_close assertions passed.")
