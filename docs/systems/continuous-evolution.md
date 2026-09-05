---
title: "Continuous-Evolution Loop"
description: "The continuous-evolution loop that lets scheduled AI agents audit this repo into a backlog and implement the highest-priority tasks via PRs."
date: 2026-06-01T03:43:23.000Z
lastmod: 2026-06-01T03:43:23.000Z
categories: [docs]
tags: [systems, automation]
author: bamr87
---

# Continuous-Evolution Loop

**Status:** ✅ Active **Last Updated:** 2026-05-31 **Audience:** Maintainers & AI agents (technical tier)

> **User guide:** there is no separate end-user page for this system — it is
> contributor/maintainer infrastructure. Start here.

## Overview

The continuous-evolution loop lets AI agents keep improving this repository between human sessions. It has two halves:

1. **Review → file work.** A scheduled agent audits the repo (tests, docs,
roadmap delivery) and records granular tasks in [`_data/backlog.yml`](../../_data/backlog.yml).
2. **Pick up → implement.** A scheduled agent takes the highest-priority open
task, builds it on a branch, validates, and opens a PR. Low-risk classes auto-merge once CI is green; everything else waits for human review.

`_data/backlog.yml` is the **single source of truth** for tactical tasks, the same way [`_data/roadmap.yml`](../../_data/roadmap.yml) is for strategic milestones. The backlog is mirrored to GitHub Issues for visibility, but you edit the file — not the issues.

```text
  AUDIT routine (weekly)
    └─ /repo-audit  ──►  _data/backlog.yml  ──►  PR "chore(backlog): audit …"
                                                      │ (merged)
                                                      ▼
                              sync.yml → GitHub Issues (agent-ready)
                                                      │
  IMPLEMENT routine (2–3×/week)                       ▼
    └─ /backlog-implement ──► branch + PR ──► CI gate ──► auto-merge (low-risk)
                                                          └─ else human review
                                  on merge: task → done → issue closes (next sync)
```

## Components

| Component | Path | Role |
|---|---|---|
| Backlog (source of truth) | `_data/backlog.yml` | Tactical task queue; schema documented in the file header |
| Sync script | `scripts/sync-backlog.rb` (+ `.sh` wrapper) | Mirrors tasks → GitHub Issues; validates schema |
| Sync workflow | `.github/workflows/sync.yml` | Runs sync on push to `main`; `--check` gate on PRs |
| Audit prompt | `.github/prompts/repo-audit.prompt.md` | `/repo-audit` — review repo, file tasks |
| Implement prompt | `.github/prompts/backlog-implement.prompt.md` | `/backlog-implement` — build one task, open PR |
| Auto-merge workflow | `.github/workflows/auto-merge.yml` | Enables native auto-merge for low-risk labelled PRs |
| Visual-evidence skill | `.github/skills/visual-evidence/SKILL.md` | Standard: regression test + before/after evidence for UI/behavioural changes |
| Evidence kit | `test/visual/evidence-kit.mjs` | Reusable generator for the before/after montages + metrics |
| Evidence gate | `.github/workflows/evidence-gate.yml` | Required check: fails a UI PR lacking test + **generated** evidence (opt-out `skip-evidence`) |
| Visual-evidence autogen | `.github/workflows/visual-evidence-autogen.yml` + `scripts/ci/visual_evidence_autogen.py` | The **producer** behind that gate: renders a same-repo UI PR in the jammy image, generates its evidence (the PR's own generator or the generic base-vs-head `test/visual/pr-evidence.mjs`), verifies the 9-skin baselines and — only on the reviewer's `intentional` verdict — refreshes them, then pushes to the PR branch |
| Visual-evidence reviewer | `.claude/agents/visual-evidence-reviewer.md` | The one judgment call in that loop: views expected/actual/diff and says whether the diff is the change the PR describes; a code step disposes |
| Secret scan | `.github/workflows/secret-scan.yml` | Required gate: fails a PR whose diff/body leaks a credential shape |
| Forbidden-path guards | `.github/CODEOWNERS` + the `auto-merge.yml` denylist | Block release/CI/plugin/script/version PRs from the auto-merge fast path |
| Issue intake | `/repo-audit` Phase 1.D | Triages all open issues → `source: issue` tasks (adopted via `links.issue`, no duplicates) |
| Routing table | `_data/routing.yml` | `area:*` (+ path globs) → executor lane (agent + instructions + skills) |
| Issue-implement prompt | `.github/prompts/issue-implement.prompt.md` | `/issue-implement <#>` — routed, loop-until-green, one PR (human-dispatched) |
| Executor agents | `.claude/agents/{code-fixer,theme-ui,infra-scripts,test-author,a11y-fixer,deps-bumper}.md` | The routed lanes (docs reuse `content-reviewer`) |
| Committee prompt | `.github/prompts/issue-plan.prompt.md` + `committee-plan` skill | `/issue-plan` — 4 read-only lenses → order-only plan |
| Plan lenses | `.claude/agents/plan-lens-{priority,dependency,risk,test}.md` | Read-only committee perspectives |
| Plan artifact + sync | `_data/roadmap_plan.yml` · `scripts/sync-plan.rb` (+ `.sh`) | Order-only sequencing + validator + pinned tracking issue |
| CI self-repair | `.github/workflows/ci-self-repair.yml` + `ci-self-repair.prompt.md` | On a failed CI run for an `auto-fix`-labelled PR, fix the failure by root cause (bounded retries) or gate to draft |

It deliberately reuses the existing **roadmap-sync** pattern (`scripts/generate-roadmap.rb` + `.github/workflows/sync.yml`): a Ruby generator/validator with `--check`, driven by a path-filtered workflow.

## Issue-first pipeline (the extension)

The loop also ingests **GitHub issues** (human-filed and bot), keeping `_data/backlog.yml` the single source of truth — issues are a *mirror*.

1. **Intake (auto).** `/repo-audit` Phase 1.D triages every open issue into a
`source: issue` backlog task carrying `links.issue:<#>`, with enriched `area`/`risk`/`priority`/`route`. `sync-backlog.rb` then **adopts** that issue (appends a managed block, preserving the author's text — no duplicate). Issue text is treated as **untrusted data**; external-author issues land `agent-hold`.
2. **Committee (auto).** `/issue-plan` fans out four read-only lenses (priority,
dependency, risk, test-framework) and writes an **order-only** plan to `_data/roadmap_plan.yml` + one pinned tracking issue. It never re-encodes the autonomy policy (below) — eligibility is derived from each task.
3. **Implement (human-dispatched).** `/issue-implement <#|T-id>` routes the task
via `_data/routing.yml` to a specialized executor, **loops build+test+evidence until green and compatible**, documents fully, and opens ONE PR — applying the autonomy label by the same policy. It **STOPs** on any CODEOWNERS path.

The **autonomy policy** below is the single canonical statement; the prompts and `plan-lens-risk` point at it rather than restating it.

### Model tiers (per phase)

| Phase | Model | Why |
|---|---|---|
| Intake / triage (`/repo-audit` 1.D) | haiku | classification + structured writes |
| Committee (`/issue-plan` + 4 lenses) | sonnet | DAG / risk / merge reasoning |
| Implement (`/issue-implement` executors) | opus | real code where quality matters |

Set each via the `/schedule` routine's `--model` and the prompt front matter; no phase silently inherits a heavier default.

### Substrate note

The committee prefers Task-subagent fan-out but falls back to **inline sequential lenses**, and routing loads lane instructions **inline**, so the pipeline works whether or not the cloud-routine runtime can delegate to named subagents.

### CI self-repair (closing the loop post-PR)

The implement loop verifies **before** opening a PR, but local-green ≠ CI-green. `.github/workflows/ci-self-repair.yml` closes that gap: on a **failed** CI run (`Comprehensive CI Pipeline`) for a PR that opted in via the **`auto-fix`** label, it runs Claude Code headless ([`/ci-self-repair`](../../.github/prompts/ci-self-repair.prompt.md)) to diagnose and fix the failing check **by root cause**, verify locally, and push — bounded by a **3-commit retry budget**. If it can't reach green — or the only fix would touch a CODEOWNERS path or *weaken* a check (delete a test, `continue-on-error`, lower a threshold) — it converts the PR to a **draft** and applies `agent-hold` for a human. It uses `workflow_run` (reacts after CI, base-repo context) and only ever acts on an **opted-in, same-repo** PR; it deliberately ignores `Evidence gate` and `Secret scan` (those must never be auto-"fixed" by removing the gate). `/issue-implement` applies `auto-fix` to every ready PR it opens.

### Visual-evidence autogen (producing what the gate checks)

The evidence gate and the pixel-snapshot tier only ever **verified**. Their inputs — montages + `metrics.json` under `test/visual/evidence/<slug>/`, and the nine `test/visual/snapshots/**` baselines — can only be **rendered**: inside `mcr.microsoft.com/playwright:*-jammy`, against a live Jekyll, i.e. with Docker. The agents that author UI PRs mostly cannot: the fleet issue pipeline's tiers believed Docker was gated on their runner, and a Claude Code web session has no daemon. PR #454 was the case study — a correct navbar rework that arrived with a README-only evidence folder (which the gate accepted) and nine legitimately stale baselines, then collected three careful "one command on a Docker host finishes this" comments while staying red.

[`visual-evidence-autogen.yml`](../../.github/workflows/visual-evidence-autogen.yml) makes the runner that producer. On every same-repo PR event it runs [`scripts/ci/visual_evidence_autogen.py`](../../scripts/ci/visual_evidence_autogen.py), which is deterministic end to end except for one judgment call:

1. **plan** — from the diff: which evidence folders lack generated proof, which
`*-evidence.mjs` generators the PR ships, whether the pixel tier is in scope (the same paths as ci.yml's `styling` filter), and whether it may act at all (loop guard on its own commits; a three-commit budget per PR).
2. **generate** — `docker compose up`, then the PR's generators or the generic
   [`test/visual/pr-evidence.mjs`](../../test/visual/pr-evidence.mjs), which renders the **base branch** and the head side by side so nobody has to hand-write an `unfixCss`; then `UPDATE_SNAPSHOTS=0 ./test/update-snapshots.sh` to verify the baselines — all inside the same jammy image CI compares with, via that script's new `PRE_TEST_SCRIPT` / `POST_TEST_SCRIPT` hooks.
3. **review** — the [`visual-evidence-reviewer`](../../.claude/agents/visual-evidence-reviewer.md)
   agent reads the brief, views the expected | actual | diff montage and the evidence, and writes `verdict.json` (`intentional` / `regression` / `unclear`) plus the evidence README narrative. It never touches baselines.
4. **decide → bless** — code reads the verdict. Only a well-formed `intentional`
   on a genuinely failing verify may run `UPDATE_SNAPSHOTS=1`; the diff montage is kept beside the evidence so a human still sees what was blessed.
5. **stage → commit → push → comment** — only the planner's paths are ever
   `git add`ed; the commit carries a `[visual-autogen]` marker and a `Visual-Autogen:` trailer; one sticky comment shows the montages and the verdict.

Why the split matters: issue #417 was a regression blessed into the baselines because the check was red and the fix was one command. Here the model only *proposes* and code *disposes* — the same arrangement the issue autopilot uses before it closes an issue. Without a Claude credential the lane still generates evidence; baselines are then left alone and the comment says how a human blesses them (`bless --force` after looking).

**First-run green** is still the authoring agent's job: the fleet pipeline's tier 2/3 now run the same script before opening or finishing a PR (their runner has Docker; the allowlist and prompt say so). This lane is the safety net for every author that cannot — it turns a red first run into a green second one with no human in the loop.

Controls: repo variable `VISUAL_EVIDENCE_AUTOGEN_ENABLED=false` (kill switch), the `skip-evidence` / `no-visual-change` labels (per-PR opt-out, shared with the gate). `ci-self-repair` stands down when the only red job is `Visual Snapshots`, so the two lanes never race on one branch.

## Task lifecycle

```text
open ──► in-progress ──► done            (blocked is a parked state)
  ▲           │
  └───────────┘  (reopened if work is abandoned)
```

| Status | Meaning | Issue state |
|---|---|---|
| `open` | Ready to be picked up | Open, `agent-ready` |
| `in-progress` | An implement run is building it | Open |
| `blocked` | Parked; not eligible for pickup | Open, `agent-hold` |
| `done` | Merged | Closed (next sync) |

Each task carries `priority` (P0–P3), `area`, `risk`, `effort`, `source`, and **checkable `acceptance` criteria** that the implement routine must verify.

## Autonomy policy

A PR may **auto-merge** only when ALL hold (enforced by the implement prompt and re-checked by `auto-merge.yml`):

- `risk: low`
- no change to public API, `lib/jekyll-theme-zer0/version.rb`, the gemspec, a
  dependency manifest, or a data schema
- no new runtime dependency
- all acceptance criteria verified green in CI
- **and one of:**
  - the change is non-visual — `area` ∈ { `docs`, `deps`, `lint` }; **or**
  - it is a low-risk **fix** that ships a passing regression test **and**
    before/after visual evidence (the [`visual-evidence`](../../.github/skills/visual-evidence/SKILL.md)
    standard), with the required `evidence-gate` check green.

This is the policy that lets **fixes** automate end-to-end: a `risk: low` bug fix proven by a test + evidence is as safe to auto-merge as a docs/deps/lint change. Everything else — `feat`, `refactor`, anything `risk: standard` — is **PR-only** and waits for a human. CI is the merge gate in every case.

### Evidence & discovered issues — the standard for changes with visuals/tests

Any change that alters what a user sees or how the UI behaves carries, in the same PR: a `test/visual/*.spec.js` regression test, before/after evidence under `test/visual/evidence/<slug>/` (from `test/visual/evidence-kit.mjs`), and a `CHANGELOG.md` link to that evidence (so it appears in release-please release notes). The `evidence-gate` check enforces this; `skip-evidence` opts out genuinely non-visual edits. Full checklist: the [`visual-evidence`](../../.github/skills/visual-evidence/SKILL.md) skill.

When a fix **uncovers a new issue** (e.g. the navbar fix surfaced a `version.rb`↔`Gemfile.lock` drift), the fixer files it as a new `_data/backlog.yml` task (`source: issue`, referencing the PR) instead of silently fixing it. On merge `sync.yml` opens the Issue, and the IMPLEMENT routine picks it up — so a discovered issue is recorded and (if `risk: low` with tests+evidence) auto-fixed and auto-merged, closing the loop without human prompting.

### Guardrails

- **One task ⇒ one PR.** Conventional commits.
- **Agents never bump the version, edit `version.rb`, or publish gems** — releases
  stay human via [`/commit-publish`](../../.github/prompts/commit-publish.prompt.md).
- **Loop-prevention:** the audit dedupes by task id/intent and caps new tasks at 5
  per run; the implement routine does at most one task per invocation.
- **Default-safe:** with no branch protection, `auto-merge.yml` is a no-op and PRs
  simply wait for a human.

## One-time setup (maintainer)

To enable auto-merge of low-risk PRs:

1. **Settings → General → Pull Requests →** check **"Allow auto-merge"**.
2. **Settings → Branches →** add a protection rule for `main` requiring the CI
status checks (from `ci.yml`) **and the `evidence-gate` check** to pass before merge. Marking `evidence-gate` required is what makes the test+evidence standard gate auto-merge of fixes.

Without these, the loop still works end-to-end — low-risk PRs just need a human to click merge.

## Running the routines (Claude Code `/schedule`)

The loop is driven by two scheduled Claude Code routines. Create them with the `/schedule` skill (they invoke the committed prompts, so the logic stays in-repo):

- **Routine A — Weekly audit + issue intake** (e.g. Mondays):
*"In the zer0-mistakes repo, run `/repo-audit` (includes issue intake) and open the backlog PR."* — model `haiku`; token scope `issues:write` + PR-create.
- **Routine B — Implementation cadence** (e.g. 2–3×/week, unchanged):
  *"In the zer0-mistakes repo, run `/backlog-implement` for the next open task."*
- **Routine C — Committee planning** (e.g. Tuesdays, a day behind A):
*"In the zer0-mistakes repo, run `/issue-plan` and refresh the plan + pinned issue."* — model `sonnet`.

**`/issue-implement` is deliberately NOT scheduled** — per-issue implementation is **human-dispatched** (a person runs `/issue-implement <#>`), so nothing auto-dispatches code changes. Auto-merge stays a no-op until branch protection is enabled.

All routines can also be run on demand from an interactive session, and the workflows can be triggered manually via `workflow_dispatch`.

> **Portability:** because all logic lives in the prompt + script files, the same
> loop can later be driven by a GitHub Actions cron + the Claude Code GitHub
> Action without rewriting anything.

## Working with the backlog by hand

```bash
# Validate the file (CI runs this on every PR that touches it)
ruby scripts/sync-backlog.rb --check

# Preview the GitHub Issue calls without making changes
./scripts/sync-backlog.sh --dry-run

# Actually sync (needs gh authenticated with issues: write)
./scripts/sync-backlog.sh
```

To **pause** the loop: disable the routines (and/or set tasks to `blocked`). To **remove a task from pickup**: set `status: blocked` or add the `agent-hold` label to its issue.

## Related

- [`_data/backlog.yml`](../../_data/backlog.yml) — the task queue
- [`AGENTS.md`](../../AGENTS.md) — agent guidance entry point
- [`docs/systems/release-automation.md`](./release-automation.md) — the
  human-owned release path the loop never touches
- [`docs/systems/automated-version-system.md`](./automated-version-system.md)
