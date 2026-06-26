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

**Status:** ✅ Active
**Last Updated:** 2026-05-31
**Audience:** Maintainers & AI agents (technical tier)

> **User guide:** there is no separate end-user page for this system — it is
> contributor/maintainer infrastructure. Start here.

## Overview

The continuous-evolution loop lets AI agents keep improving this repository
between human sessions. It has two halves:

1. **Review → file work.** A scheduled agent audits the repo (tests, docs,
   roadmap delivery) and records granular tasks in
   [`_data/backlog.yml`](../../_data/backlog.yml).
2. **Pick up → implement.** A scheduled agent takes the highest-priority open
   task, builds it on a branch, validates, and opens a PR. Low-risk classes
   auto-merge once CI is green; everything else waits for human review.

`_data/backlog.yml` is the **single source of truth** for tactical tasks, the same
way [`_data/roadmap.yml`](../../_data/roadmap.yml) is for strategic milestones.
The backlog is mirrored to GitHub Issues for visibility, but you edit the file —
not the issues.

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
| Evidence gate | `.github/workflows/evidence-gate.yml` | Required check: fails a UI PR lacking test+evidence (opt-out `skip-evidence`) |
| Secret scan | `.github/workflows/secret-scan.yml` | Required gate: fails a PR whose diff/body leaks a credential shape |
| Forbidden-path guards | `.github/CODEOWNERS` + the `auto-merge.yml` denylist | Block release/CI/plugin/script/version PRs from the auto-merge fast path |
| Issue intake | `/repo-audit` Phase 1.D | Triages all open issues → `source: issue` tasks (adopted via `links.issue`, no duplicates) |
| Routing table | `_data/routing.yml` | `area:*` (+ path globs) → executor lane (agent + instructions + skills) |
| Issue-implement prompt | `.github/prompts/issue-implement.prompt.md` | `/issue-implement <#>` — routed, loop-until-green, one PR (human-dispatched) |
| Executor agents | `.claude/agents/{code-fixer,theme-ui,infra-scripts,test-author,a11y-fixer,deps-bumper}.md` | The routed lanes (docs reuse `content-reviewer`) |
| Committee prompt | `.github/prompts/issue-plan.prompt.md` + `committee-plan` skill | `/issue-plan` — 4 read-only lenses → order-only plan |
| Plan lenses | `.claude/agents/plan-lens-{priority,dependency,risk,test}.md` | Read-only committee perspectives |
| Plan artifact + sync | `_data/roadmap_plan.yml` · `scripts/sync-plan.rb` (+ `.sh`) | Order-only sequencing + validator + pinned tracking issue |

It deliberately reuses the existing **roadmap-sync** pattern
(`scripts/generate-roadmap.rb` + `.github/workflows/sync.yml`): a Ruby
generator/validator with `--check`, driven by a path-filtered workflow.

## Issue-first pipeline (the extension)

The loop also ingests **GitHub issues** (human-filed and bot), keeping
`_data/backlog.yml` the single source of truth — issues are a *mirror*.

1. **Intake (auto).** `/repo-audit` Phase 1.D triages every open issue into a
   `source: issue` backlog task carrying `links.issue:<#>`, with enriched
   `area`/`risk`/`priority`/`route`. `sync-backlog.rb` then **adopts** that issue
   (appends a managed block, preserving the author's text — no duplicate). Issue
   text is treated as **untrusted data**; external-author issues land `agent-hold`.
2. **Committee (auto).** `/issue-plan` fans out four read-only lenses (priority,
   dependency, risk, test-framework) and writes an **order-only** plan to
   `_data/roadmap_plan.yml` + one pinned tracking issue. It never re-encodes the
   autonomy policy (below) — eligibility is derived from each task.
3. **Implement (human-dispatched).** `/issue-implement <#|T-id>` routes the task
   via `_data/routing.yml` to a specialized executor, **loops build+test+evidence
   until green and compatible**, documents fully, and opens ONE PR — applying the
   autonomy label by the same policy. It **STOPs** on any CODEOWNERS path.

The **autonomy policy** below is the single canonical statement; the prompts and
`plan-lens-risk` point at it rather than restating it.

### Model tiers (per phase)

| Phase | Model | Why |
|---|---|---|
| Intake / triage (`/repo-audit` 1.D) | haiku | classification + structured writes |
| Committee (`/issue-plan` + 4 lenses) | sonnet | DAG / risk / merge reasoning |
| Implement (`/issue-implement` executors) | opus | real code where quality matters |

Set each via the `/schedule` routine's `--model` and the prompt front matter; no
phase silently inherits a heavier default.

### Substrate note

The committee prefers Task-subagent fan-out but falls back to **inline sequential
lenses**, and routing loads lane instructions **inline**, so the pipeline works
whether or not the cloud-routine runtime can delegate to named subagents.

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

Each task carries `priority` (P0–P3), `area`, `risk`, `effort`, `source`, and
**checkable `acceptance` criteria** that the implement routine must verify.

## Autonomy policy

A PR may **auto-merge** only when ALL hold (enforced by the implement prompt and
re-checked by `auto-merge.yml`):

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

This is the policy that lets **fixes** automate end-to-end: a `risk: low` bug fix
proven by a test + evidence is as safe to auto-merge as a docs/deps/lint change.
Everything else — `feat`, `refactor`, anything `risk: standard` — is **PR-only**
and waits for a human. CI is the merge gate in every case.

### Evidence & discovered issues — the standard for changes with visuals/tests

Any change that alters what a user sees or how the UI behaves carries, in the same
PR: a `test/visual/*.spec.js` regression test, before/after evidence under
`test/visual/evidence/<slug>/` (from `test/visual/evidence-kit.mjs`), and a
`CHANGELOG.md` link to that evidence (so it appears in release-please release
notes). The `evidence-gate` check enforces this; `skip-evidence` opts out genuinely
non-visual edits. Full checklist: the
[`visual-evidence`](../../.github/skills/visual-evidence/SKILL.md) skill.

When a fix **uncovers a new issue** (e.g. the navbar fix surfaced a
`version.rb`↔`Gemfile.lock` drift), the fixer files it as a new `_data/backlog.yml`
task (`source: issue`, referencing the PR) instead of silently fixing it. On merge
`sync.yml` opens the Issue, and the IMPLEMENT routine picks it up — so a discovered
issue is recorded and (if `risk: low` with tests+evidence) auto-fixed and
auto-merged, closing the loop without human prompting.

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
   status checks (from `ci.yml`) **and the `evidence-gate` check** to pass before
   merge. Marking `evidence-gate` required is what makes the test+evidence
   standard gate auto-merge of fixes.

Without these, the loop still works end-to-end — low-risk PRs just need a human to
click merge.

## Running the routines (Claude Code `/schedule`)

The loop is driven by two scheduled Claude Code routines. Create them with the
`/schedule` skill (they invoke the committed prompts, so the logic stays in-repo):

- **Routine A — Weekly audit + issue intake** (e.g. Mondays):
  *"In the zer0-mistakes repo, run `/repo-audit` (includes issue intake) and open
  the backlog PR."* — model `haiku`; token scope `issues:write` + PR-create.
- **Routine B — Implementation cadence** (e.g. 2–3×/week, unchanged):
  *"In the zer0-mistakes repo, run `/backlog-implement` for the next open task."*
- **Routine C — Committee planning** (e.g. Tuesdays, a day behind A):
  *"In the zer0-mistakes repo, run `/issue-plan` and refresh the plan + pinned
  issue."* — model `sonnet`.

**`/issue-implement` is deliberately NOT scheduled** — per-issue implementation is
**human-dispatched** (a person runs `/issue-implement <#>`), so nothing
auto-dispatches code changes. Auto-merge stays a no-op until branch protection is
enabled.

All routines can also be run on demand from an interactive session, and the
workflows can be triggered manually via `workflow_dispatch`.

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

To **pause** the loop: disable the routines (and/or set tasks to `blocked`).
To **remove a task from pickup**: set `status: blocked` or add the `agent-hold`
label to its issue.

## Related

- [`_data/backlog.yml`](../../_data/backlog.yml) — the task queue
- [`AGENTS.md`](../../AGENTS.md) — agent guidance entry point
- [`docs/systems/release-automation.md`](./release-automation.md) — the
  human-owned release path the loop never touches
- [`docs/systems/automated-version-system.md`](./automated-version-system.md)
