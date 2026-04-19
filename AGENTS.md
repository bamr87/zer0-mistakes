# AGENTS.md — AI Agent Guide for zer0-mistakes

> **Cross-tool entry point** for AI coding agents working in this repository
> (GitHub Copilot, OpenAI Codex, Cursor, Aider, Jules, Continue, Claude Code,
> and any future agent that follows the [agents.md](https://agents.md/)
> convention).

This file is intentionally short. It tells an agent **where to look** for the
detailed, file-scoped guidance that already lives under `.github/`.
**It does not duplicate that content** — keep changes here minimal and instead
update the targeted instruction files when patterns evolve.

---

## 🧭 Project Snapshot

- **What it is**: A Docker-first Jekyll theme (Ruby gem `jekyll-theme-zer0`)
  with Bootstrap 5.3.3, GitHub Pages remote-theme support, automated semantic
  releases to RubyGems, and privacy-compliant analytics.
- **Primary language(s)**: Ruby (gem), Liquid/HTML (theme), SCSS, Bash (tooling).
- **Version source of truth**: `lib/jekyll-theme-zer0/version.rb`.
- **Default dev environment**: Docker Compose (`docker-compose up`). A local
  Ruby/Bundler workflow also works.

For the full architectural and product overview, see
[`README.md`](./README.md) and [`.github/copilot-instructions.md`](./.github/copilot-instructions.md).

---

## 📚 Where Agent Guidance Lives

This repo follows a layered guidance model. Read the layers that match the
files you are about to touch — do **not** load everything up front.

| Layer | Location | When to read |
| --- | --- | --- |
| **Cross-tool entry point** | `AGENTS.md` (this file) | Always — first |
| **Project-wide Copilot instructions** | `.github/copilot-instructions.md` | Always — second; full architecture, commands, conventions |
| **File-scoped instructions** | `.github/instructions/*.instructions.md` | When editing files matching the `applyTo:` glob in each file's front matter |
| **Reusable prompts (chat/agent modes)** | `.github/prompts/*.prompt.md` | When asked to perform a multi-step task that matches a prompt |
| **Project "seed" blueprint** | `.github/seed/*.md` | For deep architectural decisions or rebuilding subsystems from scratch |
| **Obsidian vault docs** | `pages/_docs/obsidian/` | When working with `[[wiki-links]]`, `![[embeds]]`, callouts, or the wiki-index/JS resolver |
| **Cursor slash-commands** | `.cursor/commands/*.md` | Auto-loaded by Cursor; mirrors the prompts above |
| **CI / quality config** | `.github/config/`, `.github/workflows/` | When changing lint rules, tests, or release automation |

### File-scoped instruction map

Apply the instruction file whose `applyTo:` glob matches the path you are
editing (most editors do this automatically; agents without that capability
should load them manually):

| Editing files in… | Read |
| --- | --- |
| `_layouts/**` | `.github/instructions/layouts.instructions.md` |
| `_includes/**` | `.github/instructions/includes.instructions.md` |
| `scripts/**` | `.github/instructions/scripts.instructions.md` |
| `test/**` | `.github/instructions/testing.instructions.md` |
| `docs/**`, `pages/_docs/**`, `*docs*.md` | `.github/instructions/documentation.instructions.md` |
| `CHANGELOG.md`, `**/version.*`, `*.gemspec`, `package.json` | `.github/instructions/version-control.instructions.md` |

### Reusable prompts

| Task | Prompt |
| --- | --- |
| Full release pipeline (analyze → validate → version → publish → verify) | `.github/prompts/commit-publish.prompt.md` |
| Front matter audit / fix across content | `.github/prompts/frontmatter-maintainer.prompt.md` |
| Rebuild the theme from scratch (deep blueprint) | `.github/prompts/seed.prompt.md` |

---

## ⚡ Essential Commands

> Wrappers at `scripts/{build,release,test}` forward to the canonical
> `scripts/bin/` implementations. Both forms work.

```bash
# Development
docker-compose up                          # Start Jekyll dev server (recommended)
docker-compose exec jekyll bash            # Shell into the container
docker-compose down -v                     # Clean up

# Build / test
./scripts/bin/build                        # Build the gem
./scripts/bin/test                         # Run all test suites (lib + theme + integration)
./test/test_runner.sh                      # Theme test orchestrator
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'   # Validate Jekyll build

# Release (semantic-version aware)
./scripts/bin/release patch                # 0.0.X
./scripts/bin/release minor                # 0.X.0
./scripts/bin/release major                # X.0.0
./scripts/bin/release patch --dry-run      # Preview only

# Quality
markdownlint "**/*.md" --ignore node_modules
yamllint -c .github/config/.yamllint.yml .
```

---

## ✅ Operating Rules for Agents

1. **Make minimal, surgical changes.** Match the existing style. Do not refactor
   unrelated code.
2. **Respect the layered guidance.** When a file-scoped instruction conflicts
   with a generic best practice, the file-scoped instruction wins.
3. **Validate before declaring done.** At minimum, run the relevant test
   command(s) above. For theme/layout/include changes, run the Docker Jekyll
   build.
4. **Update `CHANGELOG.md`** for any user-visible change. Follow the
   [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format already in
   the file.
5. **Bump the version only via `./scripts/bin/release`** (or by editing
   `lib/jekyll-theme-zer0/version.rb` as part of a release commit). Never bump
   it in unrelated PRs.
6. **Do not commit secrets.** Use environment variables; `RUBYGEMS_API_KEY` and
   `GITHUB_TOKEN` are provided in CI.
7. **Prefer existing libraries and patterns.** Bootstrap 5 components, the
   Bootstrap Icons set, and the modular `_includes/` system already cover most
   UI needs.
8. **Document non-obvious decisions** in the relevant instruction file so the
   next agent benefits from the context.

---

## 🧩 Extending Agent Capabilities

This repository is designed to be **extendable** by both humans and agents.
To add new agent capabilities, follow these patterns:

### Add a new file-scoped instruction set

1. Create `.github/instructions/<area>.instructions.md` with front matter:

   ```yaml
   ---
   applyTo: "<glob pattern>"
   description: "One-line summary of what these instructions cover"
   ---
   ```

2. Cover: overview, structure, standards, patterns, best practices, testing,
   documentation (mirror existing files such as `layouts.instructions.md`).
3. List it in [`.github/instructions/README.md`](./.github/instructions/README.md)
   and add a row to the **File-scoped instruction map** above.

### Add a reusable prompt / agent mode

1. Create `.github/prompts/<task>.prompt.md` with front matter:

   ```yaml
   ---
   agent: agent
   mode: agent
   description: "Short description of the multi-step task"
   tools: [optional, list, of, tool, names]
   ---
   ```

2. Write the prompt as a numbered, checkable workflow (see
   `commit-publish.prompt.md` for the canonical pattern).
3. If you want it available as a Cursor slash-command, mirror the file into
   `.cursor/commands/<task>.md`.

### Add a new tool-specific config

When onboarding a new agent or IDE that uses its own config file, add it
**without** duplicating instruction content — point the new file at this
`AGENTS.md` and the layered guidance under `.github/`. Examples:

- Claude Code: `CLAUDE.md` → "See `AGENTS.md`."
- Aider: `.aider.conf.yml` with `read: [AGENTS.md, .github/copilot-instructions.md]`.
- Continue: `.continuerc.json` referencing the same files.

This keeps a single source of truth and prevents drift.

### Add a new automation script

1. Place the implementation under `scripts/bin/<name>` (executable, `set -euo pipefail`).
2. Share logic via `scripts/lib/*.sh` modules.
3. Optionally add a thin wrapper at `scripts/<name>` for backward compatibility.
4. Follow the conventions in `.github/instructions/scripts.instructions.md`
   (logging helpers, parameter validation, `--dry-run` support, help text).

---

## 🔗 Quick Links

- Project README: [`README.md`](./README.md)
- Contributing: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Main Copilot instructions: [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)
- Instruction index: [`.github/instructions/README.md`](./.github/instructions/README.md)

---

_Last reviewed: 2026-04-18. Keep this file short — push detail into
`.github/instructions/` and `.github/prompts/`._
