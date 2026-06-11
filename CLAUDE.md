# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zer0-Mistakes is a Docker-first Jekyll theme published as the Ruby gem
`jekyll-theme-zer0`, with Bootstrap 5.3.3, GitHub Pages remote-theme support,
and automated semantic releases to RubyGems. Primary languages: Liquid/HTML
(theme), SCSS, Bash (tooling), Ruby (gem + plugins).

**Version source of truth**: `lib/jekyll-theme-zer0/version.rb`. Never bump it
by hand outside a release — use `./scripts/bin/release`.

## Layered Agent Guidance

This repo uses a layered guidance model — load only the layers matching the
files you touch:

- [`AGENTS.md`](./AGENTS.md) — cross-tool entry point and operating rules.
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) —
  canonical detailed conventions (architecture, commit/release workflow).
- `.github/instructions/*.instructions.md` — file-scoped rules; each file has
  an `applyTo:` glob in its front matter (layouts, includes, scripts, install,
  obsidian, sass, testing, documentation, version-control, backlog). Read the
  matching file before editing those paths.
- `.github/prompts/*.prompt.md` — reusable multi-step workflows
  (`commit-publish`, `repo-audit`, `backlog-implement`, `obsidian-add-syntax`,
  `frontmatter-maintainer`, `seed`). Mirrored as Cursor commands in
  `.cursor/commands/`.
- `_data/backlog.yml` — tactical task backlog (source of truth; synced to
  GitHub Issues by `.github/workflows/backlog-sync.yml`). See
  [`docs/systems/continuous-evolution.md`](./docs/systems/continuous-evolution.md).

When a file-scoped instruction conflicts with a generic best practice, the
file-scoped instruction wins.

## Essential Commands

```bash
# Development (recommended; serves http://localhost:4000)
docker-compose up                          # Jekyll dev server with live reload
docker-compose exec jekyll bash            # Shell into the container
docker-compose down -v                     # Clean up
bundle exec jekyll serve                   # Local (non-Docker) alternative

# Validate a Jekyll build (required before declaring theme changes done)
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'

# Tests
./scripts/bin/test                         # All suites: lib + theme + integration
./scripts/bin/test lib                     # One tier: lib | theme | integration | install
./test/test_runner.sh                      # Theme test orchestrator (core suites)
./test/test_runner.sh --suites core        # Single suite: core, deployment, quality,
                                           #   installation, installer, site_generation,
                                           #   obsidian, playwright, playwright_snapshots
./test/test_runner.sh --suites full        # Everything incl. Playwright tiers
./test/test_core.sh                        # Run one test script directly
npm run test:smoke                         # Playwright smoke tier
npm run test:snapshots                     # Playwright pixel snapshots
npm run test:update-snapshots              # Refresh snapshot baselines

# Quality / preflight
./scripts/validate                         # Canonical preflight validation
./scripts/validate --quick                 # Host-only checks
markdownlint "**/*.md" --ignore node_modules
yamllint -c .github/config/.yamllint.yml .

# Build / release (semantic-version aware; full pipeline:
# changelog → version bump → test → build → tag → publish)
./scripts/bin/build                        # Build the gem only
./scripts/bin/release patch|minor|major    # Release (use --dry-run to preview)
./scripts/analyze-commits.sh HEAD~5..HEAD  # Preview version-bump analysis

# Assets
./scripts/vendor-install.sh                # Refresh committed Bootstrap/icon vendor files
```

Make targets (`make test`, `make release-patch`, …) and Rake tasks
(`rake test:all`, `rake dev:serve`, `rake preview:generate`) wrap the same
scripts. Wrappers at `scripts/{build,release,test}` forward to the canonical
`scripts/bin/` implementations.

## Architecture

**Dual configuration system** — the core pattern to understand first:

- `_config.yml` — production; uses `remote_theme: "bamr87/zer0-mistakes"` for
  GitHub Pages, analytics enabled.
- `_config_dev.yml` — development overrides; `remote_theme: false`, loads the
  local theme files, analytics disabled. Docker runs Jekyll with both configs.

**Layout hierarchy**: `_layouts/root.html` (base) → `default.html` (main) →
content layouts (`article.html`, `home.html`, …).

**Modular includes** (`_includes/`): `core/` (head, header, footer),
`components/` (cookie consent, theme info), `analytics/` (PostHog —
production-only, consent-driven), `navigation/` (navbar, breadcrumbs).
Includes take parameters with safe defaults
(`{{ include.class | default: 'default-class' }}`) and carry a documentation
header block.

**Content collections** live under `pages/`: `_posts/` (layout `article`),
`_docs/`, `_about/`, `_notebooks/`, `_notes/`, `_quickstart/`. Front matter
drives behavior — `title`, `description`, `layout`, `categories`, `tags`,
`date`/`lastmod`, `permalink`.

**Custom Jekyll plugins** (`_plugins/`): `obsidian_links.rb` (Obsidian
`[[wiki-links]]`/embeds/callouts — paired with `assets/js/obsidian-*.js` and
`assets/data/wiki-index.json`; see `.github/instructions/obsidian.instructions.md`),
`search_and_sitemap_generator.rb` (`/search.json`, `/sitemap/`),
`theme_version.rb`, preview-image and content-statistics generators.

**Vendored assets**: Bootstrap 5.3.3 + Bootstrap Icons + Mermaid are committed
under `assets/vendor/` (GitHub Pages–safe, no CDN). Custom styles layer on via
`_sass/` → `assets/css/main.css`.

**Automation scripts**: canonical entry points in `scripts/bin/`
(`build`, `release`, `test`, `validate`, `install`) share modules from
`scripts/lib/*.sh`. Scripts use `set -euo pipefail`, logging helpers, and
support `--dry-run`. The self-healing installer is `install.sh` +
`scripts/lib/install/**` + `templates/`.

## Key Conventions

1. **Make minimal, surgical changes.** Match existing style; don't refactor
   unrelated code.
2. **Validate before declaring done.** Run the relevant test suite; for any
   layout/include/sass change, run the Docker Jekyll build above.
3. **Update `CHANGELOG.md`** for user-visible changes (Keep a Changelog
   format, newest entry at the top).
4. **Version bumps happen only via `./scripts/bin/release`** — never in
   unrelated PRs.
5. **Conventional commits**: types `feat|fix|docs|style|refactor|perf|test|chore`;
   scopes include `search`, `navigation`, `layouts`, `includes`, `sass`,
   `config`, `ci`, `scripts`, `analytics`. Commit analysis drives the
   automatic version-bump type.
6. **Prefer existing patterns**: Bootstrap 5 components, Bootstrap Icons, and
   the modular `_includes/` system cover most UI needs.
7. **Backlog**: edit `_data/backlog.yml`, not the mirrored GitHub Issues.
8. When asked to "commit", "release", or "publish", follow the structured
   workflow in `.github/copilot-instructions.md` (§ Commit and Release
   Workflow) or the `/commit-publish` prompt.
