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
                              backlog-sync.yml → GitHub Issues (agent-ready)
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
| Sync workflow | `.github/workflows/backlog-sync.yml` | Runs sync on push to `main`; `--check` gate on PRs |
| Audit prompt | `.github/prompts/repo-audit.prompt.md` | `/repo-audit` — review repo, file tasks |
| Implement prompt | `.github/prompts/backlog-implement.prompt.md` | `/backlog-implement` — build one task, open PR |
| Auto-merge workflow | `.github/workflows/auto-merge.yml` | Enables native auto-merge for low-risk labelled PRs |

It deliberately reuses the existing **roadmap-sync** pattern
(`scripts/generate-roadmap.rb` + `.github/workflows/roadmap-sync.yml`): a Ruby
generator/validator with `--check`, driven by a path-filtered workflow.

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

- `area` ∈ { `docs`, `deps`, `lint` } **and** `risk: low`
- no change to public API, `lib/jekyll-theme-zer0/version.rb`, the gemspec, a
  dependency manifest, or a data schema
- no new runtime dependency
- all acceptance criteria verified green in CI

Everything else — `feat`, `refactor`, anything `risk: standard` — is **PR-only**
and waits for a human. CI is the merge gate in every case.

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
   status checks (from `ci.yml`) to pass before merge.

Without these, the loop still works end-to-end — low-risk PRs just need a human to
click merge.

## Running the routines (Claude Code `/schedule`)

The loop is driven by two scheduled Claude Code routines. Create them with the
`/schedule` skill (they invoke the committed prompts, so the logic stays in-repo):

- **Routine A — Weekly audit** (e.g. Mondays):
  *"In the zer0-mistakes repo, run `/repo-audit` and open the backlog PR."*
- **Routine B — Implementation cadence** (e.g. 2–3×/week):
  *"In the zer0-mistakes repo, run `/backlog-implement` for the next open task."*

Both can also be run on demand from an interactive session, and the workflows can
be triggered manually via `workflow_dispatch`.

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
