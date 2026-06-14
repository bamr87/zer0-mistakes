---
lastmod: 2026-06-14T00:00:00.000Z
title: AGENTS.md — Cross-Tool AI Agent Entry Point
description: How the repository-root AGENTS.md file gives AI coding agents — Copilot, Codex, Cursor, Aider, Jules, Continue, and Claude Code — a single source of truth.
preview: /images/previews/agents-md-cross-tool-ai-agent-entry-point.png
layout: default
categories:
  - docs
  - development
tags:
  - ai
  - agents
  - documentation
  - copilot
  - cursor
permalink: /docs/development/agents/
difficulty: intermediate
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
---

# AGENTS.md — Cross-Tool AI Agent Entry Point

`AGENTS.md` in the repository root is a single, short entry-point file for AI coding agents. It follows the emerging [agents.md](https://agents.md/) convention and is read by GitHub Copilot, OpenAI Codex, Cursor, Aider, Jules, Continue, Claude Code, and any other agent that respects the convention.

## Why AGENTS.md?

Different AI tools each have their own config file format:

| Tool | Its own file |
|---|---|
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/` rules |
| Aider | `.aider.conf.yml` |
| Continue | `.continuerc.json` |

Rather than maintaining separate instruction files with duplicated content, `AGENTS.md` acts as a **cross-tool entry point** that links to the canonical, detailed guidance already in `.github/`. This prevents drift and keeps a single source of truth.

## File Location

```text
AGENTS.md   ← repository root
```

GitHub Copilot also reads it as supplementary context. Other tools that support the `AGENTS.md` convention will discover it automatically.

## What It Contains

`AGENTS.md` is intentionally short. It covers:

1. **Project snapshot** — what the repo is, primary languages, version source of truth
2. **Guidance map** — a table showing which file to read for which task
3. **Essential commands** — the handful of commands every agent needs
4. **Operating rules** — seven concise rules (minimal changes, validate before done, etc.)
5. **Extension guide** — how to add new agent capabilities

## Layered Guidance Model

```text
AGENTS.md          ← Cross-tool entry point (always read first)
    │
    ├── .github/copilot-instructions.md  ← Full architecture & conventions
    │
    └── .github/instructions/*.instructions.md  ← File-scoped rules
            layouts.instructions.md       → _layouts/**
            includes.instructions.md      → _includes/**
            scripts.instructions.md       → scripts/**
            sass.instructions.md          → _sass/**, assets/css/**
            obsidian.instructions.md      → _plugins/obsidian_links.rb, …
            testing.instructions.md       → test/**
            documentation.instructions.md → docs/**, pages/_docs/**
            version-control.instructions.md → CHANGELOG.md, version.*, …
            features.instructions.md      → features/features.yml, _data/features.yml
            install.instructions.md       → install.sh, scripts/lib/install/**, …
```

## Operating Rules for Agents

All agents working in this repository must follow these rules (quoted from `AGENTS.md`):

1. **Make minimal, surgical changes.** Match the existing style. Do not refactor unrelated code.
2. **Respect the layered guidance.** File-scoped instructions override generic best practices.
3. **Validate before declaring done.** Run relevant tests; for theme changes run the Docker Jekyll build.
4. **Update `CHANGELOG.md`** for any user-visible change.
5. **Bump the version only via `./scripts/bin/release`** — never in unrelated PRs.
6. **Do not commit secrets.** Use environment variables.
7. **Prefer existing libraries and patterns.**

## Adding a New Tool

To onboard a new AI tool without duplicating content:

1. Create the tool's own config file (e.g. `CLAUDE.md`)
2. In that file, write: *"See `AGENTS.md`."*
3. That's it — the layered guidance already covers everything

## Related

- [Scripts Overview](/docs/development/scripts/)
- [CI/CD Pipeline](/docs/development/ci-cd/)

## See also

- [[Development]]
- [[Documentation]]
