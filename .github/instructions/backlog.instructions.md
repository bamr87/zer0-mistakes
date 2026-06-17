---
applyTo: "_data/backlog.yml,scripts/sync-backlog.rb,scripts/sync-backlog.sh,.github/workflows/sync.yml"
description: "Tactical backlog maintenance — schema, sync contract, and ownership rules for the continuous-evolution loop."
date: 2026-05-31T12:00:00.000Z
lastmod: 2026-05-31T12:00:00.000Z
---

# Backlog Instructions

`_data/backlog.yml` is the single source of truth for **tactical tasks** (granular,
pickup-able work items). It is mirrored to GitHub Issues by `scripts/sync-backlog.rb`
and drives the continuous-evolution loop. Full design:
[`docs/systems/continuous-evolution.md`](../../docs/systems/continuous-evolution.md).

## 📂 Files in Scope

| File | Role |
| --- | --- |
| `_data/backlog.yml` | Editable task queue (source of truth); schema in the file header |
| `scripts/sync-backlog.rb` | Validates schema + creates/updates/closes GitHub Issues |
| `scripts/sync-backlog.sh` | Thin wrapper forwarding to the Ruby script |
| `.github/workflows/sync.yml` | Runs sync on push to `main`; `--check` gate on PRs |

## Rules

- **Edit the file, never the issues.** Issue bodies are auto-generated and
  overwritten on every sync (they carry a `<!-- backlog-id: T-NNN -->` marker used
  for matching). Issue state follows the task `status`.
- **Ids are stable and never reused.** New tasks take the next `T-NNN` from
  `meta.next_id`; increment `meta.next_id` and bump `meta.updated` when adding.
- **Every task needs checkable `acceptance` criteria.** The implement routine
  verifies them before opening a PR.
- **Set `risk` honestly.** `risk: low` is reserved for `docs`/`deps`/`lint` work
  with no public-API or schema change — only those are auto-merge eligible.
- **Validate before committing:** `ruby scripts/sync-backlog.rb --check` (this is
  also the PR gate; a malformed backlog fails CI).
- **Mark completion in the backlog, not by closing the issue.** Set the task to
  `status: done`; the next sync closes its issue.
- **Keep the script dependency-free** (Ruby stdlib only) and compatible with the
  macOS system Ruby 2.6 — mirror the YAML-load fallback used in
  `scripts/generate-roadmap.rb`.

## Sync contract

- Tasks with status `open` / `in-progress` / `blocked` → an **open** issue.
- Tasks with status `done` → their issue is **closed** (`completed`).
- Managed labels (owned by the script, safe to reconcile): `agent-ready`,
  `agent-hold`, `priority:P0..P3`, `area:*`, `risk:*`. Human-applied labels are
  never removed.
