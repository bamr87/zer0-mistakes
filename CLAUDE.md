# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For the full layered AI agent guidance system, see [`AGENTS.md`](./AGENTS.md) — it maps every area of the codebase to the relevant instruction file under `.github/instructions/`. This file covers Claude-specific essentials only.

---

## What This Repo Is

`zer0-mistakes` is a Jekyll theme distributed as a Ruby gem (`jekyll-theme-zer0`). It targets GitHub Pages users and ships Bootstrap 5.3.3, privacy-compliant PostHog analytics, Obsidian `[[wiki-link]]` support, Jupyter notebook rendering, and an automated semantic release pipeline.

- **Version source of truth**: `lib/jekyll-theme-zer0/version.rb`
- **Gemspec**: `jekyll-theme-zer0.gemspec`
- **Primary languages**: Ruby (gem), Liquid/HTML (theme), SCSS, Bash (tooling)

---

## Development Commands

```bash
# Start dev server (recommended — Docker handles Ruby version and deps)
docker-compose up

# Local dev without Docker
bundle exec jekyll serve --config '_config.yml,_config_dev.yml'

# Shell into the running container
docker-compose exec jekyll bash

# Install/update Ruby deps
bundle install
```

## Build

```bash
./scripts/bin/build          # Build the gem (canonical)
make build                   # Alias (runs tests first)
```

## Test

```bash
./scripts/bin/test                         # All test suites (canonical)
./test/test_runner.sh                      # Equivalent
./test/test_runner.sh --verbose
./test/test_core.sh                        # Core theme/Jekyll tests only
./test/test_quality.sh                     # Lint + link check
./test/test_runner.sh --suites playwright  # Playwright smoke tests

# Inside Docker
docker-compose exec -T jekyll ./test/test_runner.sh
```

## Lint

```bash
markdownlint "**/*.md" --ignore node_modules
yamllint -c .github/config/.yamllint.yml .
bundle exec jekyll doctor
htmlproofer _site --check-html --disable-external  # requires jekyll build first
```

## Release

```bash
./scripts/bin/release patch              # Patch release (0.0.X)
./scripts/bin/release minor              # Minor release (0.X.0)
./scripts/bin/release major              # Major release (X.0.0)
./scripts/bin/release patch --dry-run   # Preview only, no publish
```

The release script: bumps `version.rb` → updates `CHANGELOG.md` → runs tests → builds gem → git tag → publishes to RubyGems. Never bump the version manually outside this workflow.

---

## Architecture

### Dual Config System

- `_config.yml` — production; uses `remote_theme: "bamr87/zer0-mistakes"`
- `_config_dev.yml` — overrides for local dev; disables remote theme and analytics

### Layout Hierarchy

```
root.html (base)
  └─ default.html (main chrome)
       ├─ journals.html
       ├─ home.html
       ├─ landing.html
       └─ article.html (blog posts)
```

### Include System

```
_includes/
├── core/          # head.html, header.html, footer.html
├── components/    # cookie-consent.html, theme-info.html, …
├── analytics/     # posthog.html (production-only, consent-gated)
├── navigation/    # navbar.html, breadcrumbs.html, toc.html
└── content/       # backlinks.html (Obsidian), search widgets
```

### Scripts Layout

```
scripts/
├── bin/           # Canonical entry points: build, release, test, install
├── lib/           # Shared shell modules sourced by bin/ (common.sh, git.sh, …)
└── *.sh           # Standalone utilities + back-compat wrappers → bin/*
```

All scripts: `set -euo pipefail`, support `--dry-run` and `--verbose`, source `scripts/lib/common.sh` for logging helpers.

### Content Collections

```
pages/
├── _posts/        # Blog posts (layout: article)
├── _docs/         # Docs (layout: default)
├── _quickstart/   # Tutorial series
├── _notebooks/    # Jupyter notebooks (auto-converted to Markdown)
└── _notes/        # Short-form notes
```

### Bootstrap & Vendor Assets

Bootstrap 5.3.3 CSS/JS and Bootstrap Icons live in `assets/vendor/` (committed, GitHub Pages–safe). Refresh with:
```bash
./scripts/vendor-install.sh
# or: npm run vendor:install
```

---

## Key Conventions

### Commits — Conventional Commits

```
<type>(<scope>): <subject ≤ 50 chars>
```

Types: `feat fix docs style refactor perf test chore ci build revert security`.  
Common scopes: `layouts includes sass scripts ci search navigation analytics deps`.

### CHANGELOG.md

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format. Update for every user-visible change. The release script appends entries automatically from commit analysis — do not hand-edit version sections.

### Front Matter

Every content file needs at minimum `title`, `description`, `layout`, `date`, and `lastmod`. `lastmod` must be updated on every edit.

### Includes — Component Header

```html
<!--
  ===================================================================
  COMPONENT NAME - Brief Description
  ===================================================================
  File: filename.html  |  Path: _includes/category/filename.html
  Purpose: …
  Dependencies: …
  ===================================================================
-->
```

### Obsidian Wiki-Links

The `_plugins/obsidian_links.rb` plugin converts `[[wiki-links]]` and `![[embeds]]` to Jekyll URLs. See `.github/instructions/obsidian.instructions.md` before touching the plugin, the JS resolver (`assets/js/obsidian-*.js`), or `assets/data/wiki-index.json`.

---

## Docs Maintenance

Run docs validation:

```bash
./scripts/docs/validate.sh              # all checks
./scripts/docs/lint-frontmatter.sh      # front matter compliance
./scripts/docs/check-links.sh           # broken internal links
./scripts/docs/check-freshness.sh       # lastmod staleness (> 60 days)

# Inject skeleton front matter into any file missing it:
./scripts/docs/lint-frontmatter.sh --fix
```

**Mandatory update triggers** — update docs in the same PR as the code change:

| Code change | Doc to update |
|-------------|---------------|
| `_layouts/**` or `_includes/**` | `docs/ui/` or `docs/architecture/layouts-includes.md` |
| `_sass/**` or `assets/css/**` | `docs/ui/design-system.md` or `docs/ui/theming.md` |
| `scripts/**` | `docs/systems/` or `docs/development/` |
| `install.sh` or `templates/**` | `docs/installation/` |
| New feature | `docs/features/<feature>.md` + update `lastmod` |
| Breaking change | Relevant doc + `CHANGELOG.md` |

Front matter is required on every `docs/**/*.md` (except READMEs).
Schema: `.github/instructions/documentation.instructions.md`

**Post-edit hook** — add to `.claude/settings.json` to get in-session reminders:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "file=$(jq -r '.tool_input.file_path // \"\"' 2>/dev/null); if echo \"$file\" | grep -qE '(_layouts/|_includes/|_sass/|scripts/|install\\.sh|templates/)'; then echo ''; echo 'Doc update check: if you changed user-visible behavior, update the corresponding doc in docs/ or pages/_docs/ — see CLAUDE.md for the mapping table.'; echo ''; fi",
        "timeout": 5
      }]
    }]
  }
}
```

---

## File-Scoped Instruction Map

Load the relevant file before editing the matching area — these contain patterns, gotchas, and test requirements not obvious from the code:

| Editing… | Read |
|---|---|
| `_layouts/**` | `.github/instructions/layouts.instructions.md` |
| `_includes/**` | `.github/instructions/includes.instructions.md` |
| `scripts/**` | `.github/instructions/scripts.instructions.md` |
| `install.sh`, `templates/{profiles,deploy,agents,ai}/**` | `.github/instructions/install.instructions.md` |
| Obsidian plugin/resolver | `.github/instructions/obsidian.instructions.md` |
| `_sass/**`, `assets/css/**` | `.github/instructions/sass.instructions.md` |
| `test/**` | `.github/instructions/testing.instructions.md` |
| `docs/**`, `pages/_docs/**` | `.github/instructions/documentation.instructions.md` |
| `CHANGELOG.md`, `version.*`, `*.gemspec`, `package.json` | `.github/instructions/version-control.instructions.md` |
