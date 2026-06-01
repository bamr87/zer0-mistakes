---
agent: agent
mode: agent
description: "Review the repo and file tactical tasks into _data/backlog.yml (tests/docs/roadmap), then open a single backlog PR."
tools: [run_in_terminal, read_file, apply_patch, get_changed_files, grep_search]
---

# Repo Audit

Follow the canonical, numbered workflow in
[`.github/prompts/repo-audit.prompt.md`](../../.github/prompts/repo-audit.prompt.md).

In short: review test coverage & quality, documentation freshness, and roadmap
delivery; append right-sized tasks to `_data/backlog.yml` (validate with
`ruby scripts/sync-backlog.rb --check`); open one PR
`chore(backlog): audit YYYY-MM-DD`. Never bump the version or publish a gem; cap
new tasks at 5 per run.
