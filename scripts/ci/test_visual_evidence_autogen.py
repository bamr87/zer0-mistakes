#!/usr/bin/env python3
# Feature: ZER0-085
"""Unit tests for scripts/ci/visual_evidence_autogen.py — the deterministic half
of the visual-evidence autogen lane.

What these pin, and why:

* the PLAN — from a PR's changed files alone, does the lane decide to act, and
  on what? The shape of PR #454 (UI + spec + generator + README-only evidence)
  must yield exactly one bespoke job; a docs-only PR must yield nothing; the
  loop guard and the budget must stop it cold;
* the DECISION — only a well-formed `intentional` verdict on a genuinely failing
  verify pass may bless baselines (issue #417: a blessed regression and a green
  check are indistinguishable, so "the check is red" must never be enough);
* the CONTRACT with the workflows — the evidence gate's UI paths, ci.yml's
  `styling` filter coverage, the hooks update-snapshots.sh exposes, and the
  subcommands the workflow calls all exist where this script expects them.

Standard library only; no Docker, no network.

    python3 scripts/ci/test_visual_evidence_autogen.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import visual_evidence_autogen as vea  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
FAILURES: list[str] = []
PASSED = 0


def check(label: str, ok: bool) -> None:
    global PASSED
    if ok:
        PASSED += 1
        print(f"  ✓ {label}")
    else:
        FAILURES.append(label)
        print(f"  ✗ {label}")


class FakeFS:
    """A head tree: {path: content}; PNGs are any key ending in .png."""

    def __init__(self, files: dict[str, str]):
        self.files = files

    def exists(self, path: str) -> bool:
        return path in self.files

    def pngs(self, folder: str) -> list[str]:
        return sorted(p for p in self.files if p.startswith(folder + "/") and p.endswith(".png"))

    def read(self, path: str) -> str:
        return self.files[path]

    def generators(self) -> list[str]:
        return sorted(p for p in self.files if vea.GENERATOR_RE.match(p))


GEN_405 = "test/visual/navbar-tiers-evidence.mjs"
GEN_405_SRC = "import { generateEvidence } from './evidence-kit.mjs';\nawait generateEvidence({\n  slug: 'navbar-tiers-405',\n});\n"
SHA = "e34e4065b99983b2960015e8e27e2d09fc1bf2c6"


def plan_for(changed, files, *, head_subject="feat(navigation): tiers", subjects=(), default_slug="agent-issue-405"):
    return vea.make_plan(changed=changed, head_sha=SHA, head_subject=head_subject,
                         branch_subjects=list(subjects), fs=FakeFS(files),
                         default_slug=default_slug, base_ref="origin/main", head_ref="agent/issue-405")


def test_detect_slug() -> None:
    print("detect_slug")
    check("reads `slug: '…'` from a kit-based generator", vea.detect_slug(GEN_405_SRC) == "navbar-tiers-405")
    check("reads OUT = 'test/visual/evidence/<slug>' from a hand-rolled one",
          vea.detect_slug("const OUT = 'test/visual/evidence/navbar-fit';") == "navbar-fit")
    check("returns None when nothing names a folder", vea.detect_slug("console.log('hi')") is None)


def test_plan_pr_454_shape() -> None:
    print("plan — PR #454: UI + spec + generator + README-only evidence")
    changed = ["_sass/core/_navbar.scss", "_includes/core/header.html", "CHANGELOG.md",
               "test/visual/features/navbar-tiers.spec.js", GEN_405,
               "test/visual/evidence/navbar-tiers-405/README.md"]
    files = {GEN_405: GEN_405_SRC, "test/visual/evidence/navbar-tiers-405/README.md": "# pending"}
    plan = plan_for(changed, files)
    check("needed", plan["needed"] is True)
    check("exactly one job", len(plan["jobs"]) == 1)
    job = plan["jobs"][0] if plan["jobs"] else {}
    check("it is the bespoke generator for navbar-tiers-405",
          job.get("kind") == "bespoke" and job.get("generator") == GEN_405 and job.get("slug") == "navbar-tiers-405")
    check("its folder is the evidence dir", job.get("dir") == "test/visual/evidence/navbar-tiers-405")
    check("the pixel tier is in scope (sass changed)", plan["snapshots_in_scope"] is True)
    check("no skip reason", plan["skip_reason"] is None)
    check("the spec is recorded", plan["specs"] == ["test/visual/features/navbar-tiers.spec.js"])


def test_plan_loop_guard_and_budget() -> None:
    print("plan — loop guard + budget")
    changed = ["_sass/core/_navbar.scss", "test/visual/evidence/x/01.png"]
    files = {"test/visual/evidence/x/01.png": ""}
    plan = plan_for(changed, files, head_subject=f"test(visual): auto-generate evidence {vea.MARKER}")
    check("an autogen head commit stops the lane", plan["needed"] is False and "loop guard" in plan["skip_reason"])
    subjects = [f"x {vea.MARKER}"] * vea.MAX_COMMITS + ["feat: something"]
    plan = plan_for(changed, files, subjects=subjects)
    check(f"{vea.MAX_COMMITS} prior autogen commits exhaust the budget",
          plan["needed"] is False and "budget" in plan["skip_reason"])
    plan = plan_for(changed, files, subjects=[f"x {vea.MARKER}"] * (vea.MAX_COMMITS - 1))
    check("one under the budget still runs", plan["needed"] is True)


def test_plan_generic_fallback() -> None:
    print("plan — UI change with no evidence at all → generic generator")
    plan = plan_for(["_layouts/home.html"], {})
    check("one generic job named after the branch", len(plan["jobs"]) == 1 and plan["jobs"][0]["kind"] == "generic"
          and plan["jobs"][0]["slug"] == "agent-issue-405" and plan["jobs"][0]["generator"] is None)
    plan = plan_for(["_layouts/home.html"], {}, default_slug=None)
    check("…but only when a default slug is known", plan["jobs"] == [] and plan["needed"] is True)


def test_plan_respects_author_evidence() -> None:
    print("plan — author-produced evidence is never regenerated")
    folder = "test/visual/evidence/hover-flicker"
    changed = ["_sass/core/_navbar.scss", f"{folder}/01-box-shift.png", f"{folder}/metrics.json"]
    files = {f"{folder}/01-box-shift.png": "", f"{folder}/metrics.json": "{}"}
    plan = plan_for(changed, files)
    check("proof present + no manifest → no job", plan["jobs"] == [])
    check("…the pixel tier still gets verified", plan["needed"] is True and plan["snapshots_in_scope"] is True)
    files[f"{folder}/{vea.MANIFEST}"] = '{"rendered_from": "0000000deadbeef"}'
    plan = plan_for(changed + [f"{folder}/{vea.MANIFEST}"], files)
    check("autogen evidence from an OLDER head is refreshed", len(plan["jobs"]) == 1 and "rendered from" in plan["jobs"][0]["why"])
    files[f"{folder}/{vea.MANIFEST}"] = f'{{"rendered_from": "{SHA}"}}'
    plan = plan_for(changed + [f"{folder}/{vea.MANIFEST}"], files)
    check("autogen evidence from THIS head is left alone", plan["jobs"] == [])


def test_plan_out_of_scope() -> None:
    print("plan — nothing visual")
    plan = plan_for(["docs/systems/x.md", "pages/_posts/2026-09-05-x.md", "_data/backlog.yml"], {})
    check("docs/content/backlog → not needed", plan["needed"] is False and plan["jobs"] == []
          and plan["snapshots_in_scope"] is False)
    plan = plan_for(["_data/ui-text.yml"], {})
    check("a chrome data file alone → pixel tier in scope, no evidence job",
          plan["needed"] is True and plan["jobs"] == [] and plan["snapshots_in_scope"] is True)


def test_styling_matches_ci_filter() -> None:
    print("contract — styling scope covers every chrome-affecting file lint-workflows.yml pins")
    for f in ["_data/navigation/main.yml", "_data/ui-text.yml", "_data/i18n/en.yml", "_data/theme_skins.yml",
              "_includes/components/theme-info.html", "_layouts/default.html", "_sass/main.scss",
              "test/visual/features/x.spec.js", "test/playwright.config.js", "assets/js/x.js"]:
        check(f"is_styling({f})", vea.is_styling(f))
    check("a backlog edit is not styling", not vea.is_styling("_data/backlog.yml"))


def test_ui_prefixes_match_gate() -> None:
    print("contract — UI paths agree with evidence-gate.yml")
    gate = (REPO_ROOT / ".github/workflows/evidence-gate.yml").read_text(encoding="utf-8")
    m = re.search(r"grep -E '\^\(([^)]+)\)'", gate)
    gate_prefixes = tuple(m.group(1).split("|")) if m else ()
    check("gate regex parsed", bool(gate_prefixes))
    check("same prefix set", set(gate_prefixes) == set(vea.UI_PREFIXES))
    check("gate requires generated proof (metrics.json)", "metrics.json" in gate)
    check("gate points at the autogen", "visual_evidence_autogen.py" in gate)


def test_parse_results() -> None:
    print("parse_playwright_results")
    results = {"suites": [{"title": "appearance-snapshot.spec.js", "suites": [{"title": "Theme skins", "suites": [
        {"title": "skin: sunrise", "specs": [{"title": "homepage visual snapshot", "tests": [{"results": [
            {"status": "failed", "error": {"message": "\x1b[2mexpect(\x1b[22mpage\x1b[2m).\x1b[22mtoHaveScreenshot failed\n\n  1939 pixels (ratio 0.01 of all image pixels) are different."},
             "attachments": [
                 {"name": "homepage-sunrise-expected", "path": "/work/test/visual-results/output/a/homepage-sunrise-expected.png"},
                 {"name": "homepage-sunrise-actual", "path": "/work/test/visual-results/output/a/homepage-sunrise-actual.png"},
                 {"name": "homepage-sunrise-diff", "path": "/work/test/visual-results/output/a/homepage-sunrise-diff.png"}]}]}]}]},
        {"title": "skin: air", "specs": [{"title": "homepage visual snapshot", "tests": [{"results": [{"status": "passed"}]}]}]},
    ]}]}]}
    parsed = vea.parse_playwright_results(results)
    check("2 tests, 1 passed", parsed["total"] == 2 and parsed["passed"] == 1)
    check("one failure", len(parsed["failures"]) == 1)
    f = parsed["failures"][0] if parsed["failures"] else {}
    check("skin taken from the describe title", f.get("skin") == "sunrise")
    check("pixel count parsed through the ANSI noise", f.get("diff_px") == 1939)
    check("container paths made repo-relative",
          f.get("diff") == "test/visual-results/output/a/homepage-sunrise-diff.png")


def test_decide() -> None:
    print("decide — only `intentional` on a failing verify may bless")
    fail = {"snapshots": {"verified": "fail"}}
    ok = {"snapshots": {"verified": "pass"}}
    v = lambda kind, summary="looks right": {"schema": "visual-evidence-verdict/v1", "snapshots": {"verdict": kind, "summary": summary}}
    check("fail + intentional → bless", vea.decide(fail, v("intentional"))[0] is True)
    check("fail + regression → no", vea.decide(fail, v("regression"))[0] is False)
    check("fail + unclear → no", vea.decide(fail, v("unclear"))[0] is False)
    check("fail + no verdict → no (missing)", vea.decide(fail, None) == (False, "missing", vea.decide(fail, None)[2]))
    check("fail + wrong schema → no", vea.decide(fail, {"snapshots": {"verdict": "intentional"}})[0] is False)
    check("fail + invented verdict → no", vea.decide(fail, v("ship-it"))[0] is False)
    check("pass + intentional → nothing to bless", vea.decide(ok, v("intentional")) [1] == "not-applicable")
    check("error + intentional → nothing to bless", vea.decide({"snapshots": {"verified": "error"}}, v("intentional"))[0] is False)


def test_stage_and_messages() -> None:
    print("stage / commit message / comment")
    state = {"plan": "", "jobs": [{"slug": "navbar-tiers-405", "kind": "bespoke", "generator": GEN_405,
                                   "dir": "test/visual/evidence/navbar-tiers-405", "why": "w",
                                   "files": ["test/visual/evidence/navbar-tiers-405/01-x.png"], "has_proof": True},
                                  {"slug": "nope", "kind": "generic", "generator": None,
                                   "dir": "test/visual/evidence/nope", "why": "w", "files": [], "has_proof": False}],
             "snapshots": {"in_scope": True, "verified": "fail", "total": 9, "passed": 0,
                           "failures": [{"skin": "air", "diff_px": 1939}], "montage": None},
             "generators_status": "1"}
    check("stage: only folders with proof, no snapshots when not blessed",
          vea.stage_paths(state) == ["test/visual/evidence/navbar-tiers-405"])
    state["blessed"] = {"baselines": ["test/visual/snapshots/x.png"], "evidence_home": "test/visual/evidence/navbar-tiers-405"}
    state["decision"] = {"bless": True, "verdict": "intentional", "reason": "subtitle moved to the hero"}
    check("stage: snapshots included once blessed", vea.SNAPSHOT_DIR in vea.stage_paths(state))
    msg = vea.render_commit_message(state, "https://example/run/1")
    check("commit subject carries the loop-guard marker", msg.splitlines()[0].endswith(vea.MARKER))
    check("commit body carries the trailer", vea.TRAILER in msg and "baselines=yes" in msg)
    plan = {"head_sha": SHA, "head_ref": "agent/issue-405", "base_ref": "origin/main"}
    body = vea.render_comment(plan=plan, state=state, verdict=None, repo="bamr87/zer0-mistakes",
                              sha="abc1234def", run_url="https://example/run/1", pushed=True)
    check("comment carries the sticky marker", body.startswith(vea.COMMENT_MARKER))
    check("comment names the blessed verdict and the reviewer duty", "Verdict: intentional" in body and "Files tab" in body)
    check("comment lists the evidence that could not be generated", "could not be generated" in body)
    quiet = {"plan": "", "jobs": [], "snapshots": {"in_scope": True, "verified": "pass", "failures": []}}
    check("nothing noteworthy → empty comment",
          vea.render_comment(plan=plan, state=quiet, verdict=None, repo="r", sha=None, run_url="", pushed=False) == "")


def test_workflow_wiring() -> None:
    print("contract — the workflow, the hooks, the hand-offs")
    wf = REPO_ROOT / ".github/workflows/visual-evidence-autogen.yml"
    check("workflow exists", wf.exists())
    text = wf.read_text(encoding="utf-8") if wf.exists() else ""
    for sub in ("plan", "generate", "decide", "bless", "stage", "commit-message", "comment", "teardown"):
        check(f"workflow calls `{sub}`", f"visual_evidence_autogen.py {sub}" in text)
    check("same-repo guard", "head.repo.full_name == github.repository" in text)
    check("kill switch", "VISUAL_EVIDENCE_AUTOGEN_ENABLED" in text)
    check("evidence-gate opt-out labels honoured", "skip-evidence" in text and "no-visual-change" in text)
    check("the reviewer agent is the one invoked", "agent: visual-evidence-reviewer" in text)
    check("never `git add -A`", not re.search(r"^\s*git add -A", text, re.M) and 'git add -- "${paths[@]}"' in text)
    check("reviewer agent file exists", (REPO_ROOT / ".claude/agents/visual-evidence-reviewer.md").exists())
    us = (REPO_ROOT / "test/update-snapshots.sh").read_text(encoding="utf-8")
    for hook in ("PRE_TEST_SCRIPT", "POST_TEST_SCRIPT", "SKIP_PLAYWRIGHT"):
        check(f"update-snapshots.sh exposes {hook}", hook in us)
    for f in (vea.GENERIC_GENERATOR, vea.DIFF_MONTAGE_SCRIPT):
        check(f"{f} exists", (REPO_ROOT / f).exists())
    repair = (REPO_ROOT / ".github/workflows/ci-self-repair.yml").read_text(encoding="utf-8")
    check("ci-self-repair hands a red Visual Snapshots job to this lane", "Visual Snapshots" in repair and "visual-evidence-autogen" in repair)


def main() -> int:
    for t in (test_detect_slug, test_plan_pr_454_shape, test_plan_loop_guard_and_budget, test_plan_generic_fallback,
              test_plan_respects_author_evidence, test_plan_out_of_scope, test_styling_matches_ci_filter,
              test_ui_prefixes_match_gate, test_parse_results, test_decide, test_stage_and_messages, test_workflow_wiring):
        t()
    print(f"\n{PASSED} passed, {len(FAILURES)} failed")
    for f in FAILURES:
        print(f"  FAILED: {f}")
    return 1 if FAILURES else 0


if __name__ == "__main__":
    sys.exit(main())
