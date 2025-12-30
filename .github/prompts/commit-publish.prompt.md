---
agent: agent
mode: agent
description: "Complete release pipeline: analyze changes → test → document → version → publish"
tools: [run_in_terminal, read_file, apply_patch, get_changed_files, grep_search]
---

# Release Pipeline for Zer0-Mistakes Jekyll Theme

Execute a complete release: analyze changes, run tests, update docs/changelog, bump version, and publish gem.

## Choose a Release Mode

- **Recommended (Automated)**: `./scripts/release [patch|minor|major]` (updates changelog + version, runs tests, builds gem, tags, pushes, publishes)
- **Manual (Advanced)**: Follow Phases 1–5 below (use when you need fine-grained control)

Even in automated mode, run **Phase 2: Validate** first (the release script runs `bundle exec rspec`, but it does not guarantee a Docker Jekyll build).

## Prerequisites

- Docker running and service available:
  - Check: `docker-compose ps`
  - Start: `docker-compose up -d jekyll`
- Clean working directory preferred (stash uncommitted work if needed)
- RubyGems credentials configured for publishing

---

## Phase 1: Analyze Changes

### 1.1 Gather Change Information

```bash
# Get current status and diff summary
git status
git diff --stat
git log --oneline -5
```

### 1.2 Categorize Changes

Classify each changed file into ONE primary category:

| Category | Files | Version Impact |
|----------|-------|----------------|
| **Breaking** | Layout renames, config schema changes, removed features | MAJOR |
| **Feature** | New `_layouts/`, `_includes/`, `assets/js/modules/` | MINOR |
| **Enhancement** | Improved existing components, new options | MINOR |
| **Fix** | Bug fixes, corrections | PATCH |
| **Docs** | `README.md`, `docs/`, `CHANGELOG.md` only | PATCH |
| **Chore** | CI, scripts, dependencies, configs | PATCH |

### 1.3 Determine Version Bump

```
MAJOR (X.0.0): Any breaking change exists
MINOR (0.X.0): New features/enhancements, no breaking changes  
PATCH (0.0.X): Fixes, docs, chores only
```

**Current version**: Check `lib/jekyll-theme-zer0/version.rb`

---

## Phase 2: Validate

### 2.1 Run Tests

```bash
# Primary: Docker Jekyll build (REQUIRED)
docker-compose exec jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'

# Secondary: Jekyll doctor (warnings OK)
docker-compose exec jekyll bundle exec jekyll doctor
```

### 2.2 Front Matter Quick Check (Required)

Before publishing, run a quick front matter review on changed content files using:

- `.github/prompts/frontmatter-maintainer.prompt.md`

Focus on changed `*.md`, `*.markdown`, and `*.html` (exclude `_site/**`, `vendor/**`, `pkg/**`). Fix invalid YAML front matter, add missing required keys where appropriate, and update `lastmod` when content changed.

### 2.3 Validation Criteria

| Check | Command | Must Pass |
|-------|---------|-----------|
| Jekyll Build | `jekyll build` | ✅ Yes |
| Jekyll Doctor | `jekyll doctor` | ⚠️ Warnings OK |
| YAML Syntax | `docker-compose exec jekyll ruby -ryaml -e "YAML.load_file('_config.yml'); YAML.load_file('_config_dev.yml')"` | ✅ Yes |

**If tests fail**: Stop and report failures. Do not proceed.

---

## Phase 3: Update Documentation

### 3.1 Update CHANGELOG.md

Add entry at TOP of file, after `# Changelog` header:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **Component**: `name.html` - Description

### Changed
- **Enhanced**: `file.html` - What improved

### Fixed
- **Issue**: Description - How fixed

### Removed
- Removed features (MAJOR version only)
```

**Categories to include**: Added, Changed, Fixed, Removed, Security (use only relevant ones)

### 3.2 Update Component Docs (if applicable)

- New layouts/includes: Add front matter documentation header
- New features: Update relevant `docs/` pages
- API changes: Update `README.md` usage examples

---

## Phase 4: Bump Version

If you used `./scripts/release ...`, it handles version + changelog updates; skip **Phase 4** and go to **Output: Release Summary**.

### 4.1 Update Version File

Edit `lib/jekyll-theme-zer0/version.rb`:

```ruby
# frozen_string_literal: true

module JekyllThemeZer0
  VERSION = "X.Y.Z" unless defined?(JekyllThemeZer0::VERSION)
end
```

### 4.2 Update Gemfile.lock

```bash
# Use Docker to regenerate with correct version
docker-compose exec jekyll bundle install
```

---

## Phase 5: Commit & Publish

### 5.1 Stage and Commit

```bash
git add -A
git commit -m "<type>(<scope>): <summary>

<body - detailed description>

- Change 1
- Change 2

Version: <old> → <new>"
```

**Commit Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
**Scopes**: `navigation`, `layouts`, `includes`, `sass`, `config`, `ci`, `scripts`

### 5.2 Sync with Remote

```bash
# Pull any remote changes first
git pull --rebase origin main
```

### 5.3 Create Tag and Push

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: <summary>"
git push origin main
git push origin vX.Y.Z
```

### 5.4 Build and Publish Gem

```bash
# Build in Docker (ensures Ruby toolchain is present)
docker-compose exec jekyll gem build jekyll-theme-zer0.gemspec

# Publish from the environment that has RubyGems credentials configured
gem push jekyll-theme-zer0-X.Y.Z.gem

# Alternative (if RubyGems credentials are configured inside the container)
docker-compose exec jekyll gem push jekyll-theme-zer0-X.Y.Z.gem
```

---

## Output: Release Summary

Provide this summary after completion:

```markdown
## Release Summary

**Version**: X.Y.Z (from X.Y.Z) | **Type**: PATCH/MINOR/MAJOR | **Date**: YYYY-MM-DD

### Changes
- [x] Change description 1
- [x] Change description 2

### Validation
| Check | Status |
|-------|--------|
| Jekyll Build | ✅ Pass |
| Gemspec | ✅ Valid |

### Publication
- **Commit**: `<hash>` 
- **Tag**: `vX.Y.Z`
- **RubyGems**: https://rubygems.org/gems/jekyll-theme-zer0/versions/X.Y.Z
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Docker | `docker-compose up -d` |
| Jekyll build | `docker-compose exec jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'` |
| Check version | `cat lib/jekyll-theme-zer0/version.rb` |
| Automated release | `./scripts/release patch` |
| macOS (Homebrew bash) | `/opt/homebrew/bin/bash ./scripts/release patch` |
| Preview release | `./scripts/release patch --dry-run` |
| Build gem | `docker-compose exec jekyll gem build jekyll-theme-zer0.gemspec` |
| Publish gem | `gem push jekyll-theme-zer0-X.Y.Z.gem` |

## Rollback (if needed)

```bash
git revert <hash>                          # Revert commit
git tag -d vX.Y.Z                          # Delete local tag
git push origin :refs/tags/vX.Y.Z          # Delete remote tag
gem yank jekyll-theme-zer0 -v X.Y.Z        # Unpublish gem
```
