---
mode: agent
description: "Complete technical blueprint to rebuild zer0-mistakes Jekyll theme from scratch using only this document as source of truth"
date: 2025-11-24T00:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Zer0-Mistakes — Rebuild Blueprint (Seed)

Use this document to reconstruct the `jekyll-theme-zer0` theme from scratch. Embedded snippets are the canonical minimal versions; full implementations live under `scripts/`, `_layouts/`, `_includes/`, and `_sass/` in the repo.

## 1. Project Identity

```yaml
project_name: zer0-mistakes
gem_name: jekyll-theme-zer0
license: MIT
author:
  name: Amr Abdel-Motaleb
  email: amr@it-journey.dev
  github: bamr87
repository: https://github.com/bamr87/zer0-mistakes
rubygems_url: https://rubygems.org/gems/jekyll-theme-zer0
live_site: https://zer0-mistakes.com

project_type:
  - Ruby Gem
  - Jekyll Theme
  - GitHub Pages Remote Theme
  - Docker-First Development Environment

requirements:
  ruby: ">= 2.7.0"
  jekyll: "3.9.5"
  bundler: "~> 2.3"
  docker: latest
  node: ">= 16.0"      # optional, for package.json scripts only

tech_stack:
  static_site: Jekyll 3.9.5
  frontend: Bootstrap 5.3.3 + Bootstrap Icons
  containerization: Docker / Docker Compose (linux/amd64)
  analytics: PostHog (consent-gated, GDPR/CCPA)
  ci_cd: GitHub Actions
  automation: Bash + GNU Make
```

## 2. Architecture

- **GitHub-Pages-compatible** — Jekyll 3.9.x, no plugins outside the GH Pages whitelist except where supported via `jekyll-remote-theme`.
- **Dual configuration** — `_config.yml` (production, `remote_theme:`) layered with `_config_dev.yml` (local, `remote_theme: false`, livereload).
- **Docker-first dev** — single `docker-compose up` serves the theme with watch + livereload on port 4000.
- **Single source of truth for version** — `lib/jekyll-theme-zer0/version.rb`.
- **Self-contained vendor assets** — Bootstrap CSS/JS + Bootstrap Icons committed under `assets/vendor/` (no CDN dependency).
- **Modular includes** — components split by responsibility under `_includes/{core,components,navigation,analytics,content}/`.

## 3. Core Principles (one-liners)

Full discussion lives in `.github/copilot-instructions.md`. The blueprint depends on these:

- **DFF — Design for Failure:** validate inputs, fall back gracefully, never crash on missing config.
- **DRY:** one canonical implementation per concept (includes, layouts, scripts).
- **KIS:** prefer plain Liquid/Bootstrap over custom abstractions.
- **DFD — Docker-first:** every dev path must work inside the container.
- **AIPD — AI-powered dev:** scripts are designed for AI agents to invoke (clear flags, dry-run, idempotent).
- **SHC — Self-healing config:** `init_setup.sh` / `install.sh` detect environment and self-correct.

## 4. Directory Structure

```
zer0-mistakes/
├── .github/
│   ├── config/                       # yamllint, markdownlint, link-check configs
│   ├── instructions/                 # File-scoped AI instructions (applyTo globs)
│   ├── prompts/                      # Reusable AI prompts (this file is one)
│   ├── workflows/                    # ci.yml, gem-release.yml, github-release.yml
│   └── copilot-instructions.md
├── _includes/
│   ├── core/         {head,header,footer,scripts}.html
│   ├── components/   {cookie-consent,theme-info,breadcrumbs,…}.html
│   ├── navigation/   {navbar,sidebar}.html
│   ├── analytics/    posthog.html
│   ├── content/      {backlinks,wiki-graph,…}.html
│   └── README.md
├── _layouts/
│   ├── root.html                     # base <html>
│   ├── default.html                  # main wrapper (extends root)
│   ├── {home,journals,blog,collection,landing,stats}.html
│   └── README.md
├── _sass/
│   ├── core/                         # variables, mixins, resets
│   └── custom.scss
├── _data/
│   ├── navigation/   {main,about,docs}.yml
│   └── content_statistics.yml
├── _plugins/
│   ├── theme_version.rb              # exposes VERSION to Liquid
│   └── obsidian_links.rb             # optional wiki-link converter
├── assets/
│   ├── css/                          # compiled main.css
│   ├── js/
│   ├── vendor/                       # Bootstrap, Bootstrap Icons (committed)
│   └── images/
├── pages/
│   ├── _posts/        # blog posts
│   ├── _docs/         # documentation
│   ├── _quickstart/   # quickstart guides
│   ├── _about/
│   └── _notes/
├── docs/                             # MDX technical docs
├── scripts/
│   ├── bin/          {build,release,test,install}   # canonical entry points
│   ├── lib/          common.sh, git.sh, gem.sh, version.sh, …
│   ├── {build,release,test}              # backward-compat wrappers
│   ├── analyze-commits.sh, vendor-install.sh
│   └── README.md
├── test/
│   ├── test_runner.sh, test_core.sh, test_deployment.sh, test_quality.sh
│   └── README.md
├── lib/
│   ├── jekyll-theme-zer0.rb
│   └── jekyll-theme-zer0/version.rb  # ← SINGLE SOURCE OF TRUTH for VERSION
├── _config.yml, _config_dev.yml
├── docker-compose.yml
├── Gemfile, Gemfile.lock, jekyll-theme-zer0.gemspec
├── package.json, Makefile, Rakefile
├── install.sh, init_setup.sh
├── CHANGELOG.md, README.md, LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md
└── .gitignore
```

## 5. Configuration Files

### `_config.yml` (production)

```yaml
remote_theme: "bamr87/zer0-mistakes"
url: https://zer0-mistakes.com
baseurl: ""
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-mermaid
```

### `_config_dev.yml` (local overrides)

```yaml
url: "http://localhost:4000"
remote_theme: false           # use local theme files
incremental: true
livereload: true
```

### `docker-compose.yml`

```yaml
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64       # Apple Silicon + Intel compatibility
    command: jekyll serve --watch --force_polling
      --config "_config.yml,_config_dev.yml"
      --host 0.0.0.0 --port 4000
    volumes:
      - ./:/app
    ports:
      - "4000:4000"
    working_dir: /app
    environment:
      JEKYLL_ENV: development
```

### `Gemfile` (key deps)

```ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
gem "jekyll-remote-theme"
gem "jekyll-feed"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"
gem "jekyll-paginate"
gem "jekyll-mermaid", "~> 1.0"
gem "webrick", "~> 1.7"
gem "ffi", "~> 1.17.0"
gem "commonmarker", "0.23.10"
```

## 6. Gem Specification

### `lib/jekyll-theme-zer0/version.rb`

```ruby
# frozen_string_literal: true
module JekyllThemeZer0
  VERSION = "0.6.0" unless defined?(JekyllThemeZer0::VERSION)
end
```

### `jekyll-theme-zer0.gemspec`

```ruby
# frozen_string_literal: true
require_relative "lib/jekyll-theme-zer0/version"

Gem::Specification.new do |s|
  s.name        = "jekyll-theme-zer0"
  s.version     = JekyllThemeZer0::VERSION
  s.authors     = ["Amr Abdel"]
  s.email       = ["amr@it-journey.dev"]
  s.summary     = "Jekyll theme based on Bootstrap, compatible with GitHub Pages"
  s.description = "Bootstrap Jekyll theme for headless GitHub Pages CMS with Docker-first development"
  s.homepage    = "https://github.com/bamr87/zer0-mistakes"
  s.license     = "MIT"

  s.metadata["plugin_type"] = "theme"
  s.metadata["allowed_push_host"] = "https://rubygems.org"

  s.files = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(data|includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end

  s.required_ruby_version = ">= 2.7.0"
  s.add_runtime_dependency "jekyll"
  s.add_development_dependency "bundler", "~> 2.3"
  s.add_development_dependency "rake", "~> 13.0"
  s.add_development_dependency "rspec", "~> 3.0"
end
```

### `package.json`

```json
{
  "name": "zer0-mistakes",
  "private": true,
  "version": "0.6.0",
  "description": "Bootstrap Jekyll theme for headless Github Pages CMS.",
  "repository": { "type": "git", "url": "https://github.com/bamr87/zer0-mistakes.git" },
  "keywords": ["jekyll", "theme", "zer0"],
  "author": "Amr Abdel-Motaleb",
  "license": "MIT",
  "homepage": "https://bamr87.github.io/zer0-mistakes/"
}
```

## 7. Makefile (entry point)

```makefile
.DEFAULT_GOAL := help
VERSION := $(shell jq -r '.version' package.json 2>/dev/null || echo unknown)

##@ Setup
setup:           ; @./scripts/bin/install
##@ Development
test:            ; @./scripts/bin/test
##@ Version
version-patch:   ; @./scripts/lib/version.sh patch
version-minor:   ; @./scripts/lib/version.sh minor
version-major:   ; @./scripts/lib/version.sh major
##@ Build & Release
build: test      ; @./scripts/bin/build
release-patch:   ; @./scripts/bin/release patch
release-minor:   ; @./scripts/bin/release minor
release-major:   ; @./scripts/bin/release major
help:
	@awk 'BEGIN{FS=":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
```

## 8. Automation Scripts (reference, don't duplicate here)

| Script | Purpose |
|---|---|
| `scripts/bin/install` | Self-healing installer (env detection, fallback) |
| `scripts/bin/build` | Build gem to `pkg/` |
| `scripts/bin/test` | Run lib + theme + integration test suites |
| `scripts/bin/release [patch|minor|major]` | Full release pipeline (see `.github/prompts/commit-publish.prompt.md`) |
| `scripts/lib/version.sh` | Bump version in `version.rb` + `package.json` + tag |
| `scripts/lib/gem.sh` | Build + push gem to RubyGems |
| `scripts/lib/git.sh`, `scripts/lib/common.sh` | Shared shell helpers |
| `scripts/analyze-commits.sh` | Conventional-commit → version-bump analyzer |
| `scripts/vendor-install.sh` | Refresh Bootstrap / Bootstrap Icons under `assets/vendor/` |
| `install.sh` | One-line installer entry point (delegates to `scripts/bin/install`) |
| `init_setup.sh` | Environment initialization |

When rebuilding, derive these scripts from the conventions in [`.github/instructions/scripts.instructions.md`](../instructions/scripts.instructions.md) and the release contract in [`.github/prompts/commit-publish.prompt.md`](commit-publish.prompt.md).

## 9. CI/CD Workflows

Required under `.github/workflows/`:

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push, PR | Lint + test + Jekyll build |
| `auto-version-bump.yml` | push to main | Analyze commits → bump version |
| `gem-release.yml` | tag `v*` | Build + push gem to RubyGems |
| `github-release.yml` | tag `v*` | Create GitHub Release with notes from `CHANGELOG.md` |

Standards: pin actions by major version, least-privilege `permissions:`, `concurrency:` block per workflow.

## 10. Rebuild Checklist

In this order:

1. Init repo, add `.gitignore`, `LICENSE`, `README.md`, `CHANGELOG.md`.
2. Create `Gemfile`, `lib/jekyll-theme-zer0/version.rb`, `jekyll-theme-zer0.gemspec`, `package.json`.
3. Add `_config.yml`, `_config_dev.yml`, `docker-compose.yml`.
4. Scaffold `_layouts/`, `_includes/`, `_sass/`, `_data/`, `_plugins/`, `assets/`.
5. Vendor Bootstrap + Bootstrap Icons via `scripts/vendor-install.sh`.
6. Build `scripts/bin/{install,build,test,release}` from the contracts in `.github/instructions/scripts.instructions.md`.
7. Add `.github/workflows/` (ci, version, release).
8. Add `.github/instructions/` and `.github/prompts/` (incl. this seed and `commit-publish`).
9. Verify: `docker-compose up` serves the site, `./scripts/bin/test` passes, `./scripts/bin/build` produces a gem.
10. Cut `v0.1.0` via `./scripts/bin/release minor`.

## 11. Hard Constraints

- Never break GitHub Pages compatibility (no plugins outside the whitelist + `jekyll-remote-theme`).
- Never load two copies of Bootstrap.
- Never bypass the version source of truth in `version.rb`.
- Never ship a release without updating `CHANGELOG.md`.
- Never commit secrets, `.env`, or `pkg/*.gem`.
- Privacy: analytics gated on explicit consent; disabled in `_config_dev.yml`.

---

**Related:** [`commit-publish.prompt.md`](commit-publish.prompt.md) for the release pipeline · `.github/instructions/{layouts,includes,sass,scripts,version-control}.instructions.md` for component-level standards.
