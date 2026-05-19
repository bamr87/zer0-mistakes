---
mode: agent
description: "Complete release pipeline: analyze changes → validate → document → version → publish → verify"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Release Pipeline — `jekyll-theme-zer0`

When invoked with `/commit-publish`, execute a full release: analyze → validate → document → version → publish → verify. Use `./scripts/bin/release` whenever possible — it automates phases 3–6.

## Quick Path (default)

```bash
./scripts/bin/release patch --dry-run   # preview
./scripts/bin/release patch             # execute (patch | minor | major)
```

Fall through to manual phases below only if the script fails or the user requests step-by-step.

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

If user-visible changes touched docs under `docs/` or `pages/_docs/`, update those too.

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
- Always verify the published version matches the tag.

---

**Related:** `.github/instructions/version-control.instructions.md` · `.github/instructions/documentation.instructions.md` · `CHANGELOG.md`.
