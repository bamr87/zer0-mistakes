---
agent: agent
mode: agent
description: "Implement the highest-priority open task from _data/backlog.yml on a branch, validate, and open a PR (auto-merge low-risk docs/deps/lint, or a low-risk fix that ships tests + before/after evidence)."
tools: [run_in_terminal, read_file, apply_patch, get_changed_files, grep_search]
---

# Backlog Implement

Follow the canonical, numbered workflow in [`.github/prompts/backlog-implement.prompt.md`](../../.github/prompts/backlog-implement.prompt.md).

In short: pick the top `status: open` task (P0→P3), mark it `in-progress`, implement it minimally per the matching `.github/instructions/*`, validate (`ruby scripts/sync-backlog.rb --check` + tests + Jekyll build as relevant), set it `done`, and open one PR. For UI/behavioural changes, follow the [`visual-evidence`](../../.github/skills/visual-evidence/SKILL.md) skill (add a regression test + before/after evidence). Apply the `auto-merge` label only for `risk: low` work with no API/schema/version change that is **either** `docs`/`deps`/`lint` **or** a fix shipping tests + evidence (`evidence-gate` green); everything else is PR-only. Never bump the version or publish a gem.
