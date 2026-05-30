---
mode: agent
description: "Run the full release pipeline for the jekyll-theme-zer0 gem: analyze changes → validate build → update CHANGELOG/version → commit → tag → publish to RubyGems → verify. Use when asked to commit, push, release, publish, cut a version, or ship a new gem."
argument-hint: "Bump type: patch | minor | major (defaults to patch)"
tools: [run_in_terminal, read_file, replace_string_in_file, multi_replace_string_in_file, get_changed_files, grep_search, file_search]
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-30T13:00:00.000Z
---

# Release Pipeline — `jekyll-theme-zer0`

When invoked with `/commit-publish`, execute a full release: analyze → validate → document → version → publish → verify. Use [`./scripts/bin/release`](../../scripts/bin/release) whenever possible — it automates phases 2–6 (tests, changelog, version bump, commit, tag, push, gem publish, GitHub release).

## Quick Path (default)

```bash
./scripts/bin/release patch --dry-run   # preview
./scripts/bin/release patch             # execute (patch | minor | major)
```

Add `--non-interactive` when running unattended (skips confirmation prompts). Fall through to the manual phases below only if the script fails or the user requests step-by-step.

## Branching & PRs (GitHub Flow)

This repo uses GitHub Flow — `main` is always deployable, feature work lands via PR.

- **Feature/fix work** → branch (`feature/<scope>-<desc>`, `fix/<scope>-<desc>`, `docs/<desc>`), open a PR early, squash-merge into `main`. Do **not** run the release here.
- **Cutting a release** → run the pipeline from an up-to-date `main` *after* the relevant PRs are merged and CI is green.
- **Release-via-PR (protected `main`)** → if direct pushes/tags to `main` are blocked, do the version bump + CHANGELOG on a `release/vX.Y.Z` branch, open a PR, merge it, then tag and publish from `main` (see Phase 5 alternative).

## Release Checklist

- [ ] Phase 0 — Prerequisites verified
- [ ] Phase 1 — Changes analyzed & version bump chosen
- [ ] Phase 2 — Build validated
- [ ] Phase 3 — `CHANGELOG.md` + `version.rb` updated
- [ ] Phase 4 — Commit + tag
- [ ] Phase 5 — Push + gem publish
- [ ] Phase 6 — Publication verified

## Phase 0 — Prerequisites

```bash
# Working tree clean (or only release-related changes)
git status --short

# Docker up (validation runs inside the container)
docker-compose ps | grep -q jekyll || docker-compose up -d jekyll && sleep 5

# Current version + last tag
cat lib/jekyll-theme-zer0/version.rb | grep VERSION
git describe --tags --abbrev=0
```

First-time only: `gem signin` (RubyGems API key in `~/.gem/credentials`, mode `0600`).

## Phase 1 — Analyze Changes

```bash
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:'%h %s'
git diff --stat $(git describe --tags --abbrev=0)..HEAD
```

Categorize each change → choose bump:

| Found | Bump |
|---|---|
| Any `BREAKING CHANGE:` footer, removed/renamed public API, schema change | **MAJOR** |
| Any `feat:` without breaking change | **MINOR** |
| Only `fix:`, `docs:`, `chore:`, `perf:`, `refactor:`, `test:` | **PATCH** |

## Phase 2 — Validate (required)

```bash
# Primary gate
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'

# Advisory
docker-compose exec -T jekyll bundle exec jekyll doctor

# YAML sanity
docker-compose exec -T jekyll ruby -ryaml -e "
  YAML.load_file('_config.yml');
  YAML.load_file('_config_dev.yml');
  puts 'configs OK'"

# Gemfile.lock in sync
docker-compose exec -T jekyll bundle check || \
  docker-compose exec -T jekyll bundle install
```

🛑 **Any failure → STOP.** Do not advance to phase 3.

## Phase 3 — Update Docs

**`CHANGELOG.md`** — add at top, under `# Changelog`:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **Component**: `path/to/file` - Short description

### Changed
- **Enhanced**: `path/to/file` - Short description

### Fixed
- **Issue**: Short description
```

**`lib/jekyll-theme-zer0/version.rb`**:

```ruby
# frozen_string_literal: true
module JekyllThemeZer0
  VERSION = "X.Y.Z" unless defined?(JekyllThemeZer0::VERSION)
end
```

Update any other doc surface a user-visible change touches:

- [ ] `CHANGELOG.md` — move `[Unreleased]` entries into the new version section
- [ ] `lib/jekyll-theme-zer0/version.rb` — bump to `X.Y.Z`
- [ ] `docs/` and `pages/_docs/` — feature/usage docs for changed behavior
- [ ] `README.md` — install/usage snippets, badges, version references
- [ ] `_data/features.yml` — if a feature was added, changed, or removed
- [ ] Migration notes — for any breaking change (MAJOR)

## Phase 4 — Commit

```bash
git add -A
git commit -m "<type>(<scope>): <summary>

<detailed why>

- change 1
- change 2

Bump version to X.Y.Z"
```

Use scopes: `search`, `navigation`, `layouts`, `includes`, `sass`, `config`, `ci`, `scripts`, `analytics`.

## Phase 5 — Push, Tag, Publish

```bash
git pull --rebase origin main
git push origin main

git tag -a vX.Y.Z -m "vX.Y.Z - <one-line summary>"
git push origin vX.Y.Z

gem build jekyll-theme-zer0.gemspec
gem push jekyll-theme-zer0-X.Y.Z.gem
mkdir -p pkg && mv jekyll-theme-zer0-X.Y.Z.gem pkg/
```

**Alternative — release via PR (protected `main`):**

```bash
git switch -c release/vX.Y.Z
git add -A && git commit -m "chore(release): vX.Y.Z"
git push -u origin release/vX.Y.Z
gh pr create --base main --fill --title "chore(release): vX.Y.Z"
# After review + squash-merge, pushing the tag triggers CI publication
# (.github/workflows/gem-release.yml on v* tags). Then:
git switch main && git pull --rebase origin main
git tag -a vX.Y.Z -m "vX.Y.Z - <one-line summary>" && git push origin vX.Y.Z
```

## Phase 6 — Verify

```bash
curl -s https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])'
```

Confirm matches `X.Y.Z`. Check GitHub release was created (or create with `gh release create vX.Y.Z --generate-notes`).

## Release Summary (return to user)

```markdown
## Release vX.Y.Z (from vW.V.U) — PATCH|MINOR|MAJOR — YYYY-MM-DD

### Included
- <change 1>
- <change 2>

### Validation
| Check | Status |
|---|---|
| Jekyll build | ✅ |
| Jekyll doctor | ✅ |
| YAML configs | ✅ |
| Gemfile.lock | ✅ |

### Publication
| Step | Status |
|---|---|
| Commit | ✅ |
| Tag vX.Y.Z | ✅ |
| RubyGems | ✅ |
| GitHub release | ✅ |
```

## Hard Rules

- Never skip Phase 2 validation, even for `docs:`-only releases.
- Never bump the version without updating `CHANGELOG.md` in the same commit.
- Never push tags before commits.
- Never publish a gem version that already exists on RubyGems (yank-and-republish is forbidden).
- Never edit `lib/jekyll-theme-zer0/version.rb` outside a release commit.
- Never run the release pipeline from a feature branch — cut releases from an up-to-date `main` after PRs merge.
- Always verify the published version matches the tag.

---

**Related:** [version-control.instructions.md](../instructions/version-control.instructions.md) · [documentation.instructions.md](../instructions/documentation.instructions.md) · [CHANGELOG.md](../../CHANGELOG.md) · [scripts/bin/release](../../scripts/bin/release).
