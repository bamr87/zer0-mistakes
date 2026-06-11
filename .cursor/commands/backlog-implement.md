---
agent: agent
mode: agent
description: "Implement the highest-priority open task from _data/backlog.yml on a branch, validate, and open a PR (auto-merge only low-risk docs/deps/lint)."
tools: [run_in_terminal, read_file, apply_patch, get_changed_files, grep_search]
---

# Backlog Implement

Follow the canonical, numbered workflow in
[`.github/prompts/backlog-implement.prompt.md`](../../.github/prompts/backlog-implement.prompt.md).

In short: pick the top `status: open` task (P0→P3), mark it `in-progress`,
implement it minimally per the matching `.github/instructions/*`, validate
(`ruby scripts/sync-backlog.rb --check` + tests + Jekyll build as relevant),
set it `done`, and open one PR. Apply the `auto-merge` label only for
`risk: low` work in `docs`/`deps`/`lint` with no API/schema/version change;
everything else is PR-only. Never bump the version or publish a gem.
