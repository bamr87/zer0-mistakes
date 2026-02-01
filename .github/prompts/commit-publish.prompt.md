---
agent: agent
mode: agent
description: "Complete release pipeline: analyze changes → validate → document → version → publish → verify"
tools: [run_in_terminal, read_file, replace_string_in_file, get_changed_files, grep_search, manage_todo_list]
---

# Release Pipeline for Zer0-Mistakes Jekyll Theme

Execute a complete release: analyze changes, validate builds, update docs/changelog, bump version, publish gem, and verify publication.

> **Last Updated**: 2026-02-01 | **Current Version**: Check `lib/jekyll-theme-zer0/version.rb`

## 🎯 Release Checklist (Track Progress)

Use `manage_todo_list` to track progress through the release:

```
1. Review and analyze changes
2. Validate Docker Jekyll build
3. Update CHANGELOG.md
4. Bump version in version.rb
5. Commit and tag changes
6. Publish to RubyGems
7. Verify publication
```

### Quick Status Checks

| Check | Command | Expected |
|-------|---------|----------|
| Current version | `cat lib/jekyll-theme-zer0/version.rb \| grep VERSION` | `VERSION = "X.Y.Z"` |
| Last tag | `git describe --tags --abbrev=0` | `vX.Y.Z` |
| Docker status | `docker-compose ps` | Jekyll container "Up" |
| RubyGems version | `curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" \| python3 -c "import json,sys; print(json.load(sys.stdin)['version'])"` | Same as tag |

---

## 🚀 AI Agent Quick Start

When user says "commit", "push", "release", or "publish", follow this streamlined workflow:

### Step 1: Gather Context (Parallel)
```bash
# Run these together to gather all context
get_changed_files                                    # See what changed
docker-compose ps                                    # Check Docker status
cat lib/jekyll-theme-zer0/version.rb | grep VERSION  # Current version
git describe --tags --abbrev=0                       # Last tag
```

### Step 2: Validate Build (REQUIRED)
```bash
docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'
```
> 🛑 **STOP if build fails.** Do not proceed until fixed.

### Step 3: Update Documentation
1. Add changelog entry to top of `CHANGELOG.md`
2. Bump version in `lib/jekyll-theme-zer0/version.rb`

### Step 4: Commit, Tag, Push
```bash
git add -A && git status --short
git commit -m "feat(scope): summary - Bump version to X.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z - Brief description"
git push origin main --tags
```

### Step 5: Publish and Verify
```bash
gem build jekyll-theme-zer0.gemspec
gem push jekyll-theme-zer0-X.Y.Z.gem
mkdir -p pkg && mv jekyll-theme-zer0-X.Y.Z.gem pkg/
curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'✓ Published: {d[\"name\"]} v{d[\"version\"]}')"
```

---

## Choose a Release Mode

| Mode | Command | Use When |
|------|---------|----------|
| **AI-Assisted** | User says "commit and publish" | Recommended - AI handles all steps |
| **Automated** | `./scripts/release [patch\|minor\|major]` | Standard releases via script |
| **Dry Run** | `./scripts/release patch --dry-run` | Preview changes first |
| **Manual** | Follow Phases 0–7 below | Fine-grained control needed |

> ⚠️ **Important**: Always run Docker Jekyll build validation first. The release script runs `bundle exec rspec` but does NOT run a Docker Jekyll build.

---

## Semantic Versioning Guide

### Version Number Format: `MAJOR.MINOR.PATCH`

| Bump | When to Use | Examples |
|------|-------------|----------|
| **MAJOR** (X.0.0) | Breaking changes that require user action | Layout renames, removed features, config schema changes |
| **MINOR** (0.X.0) | New features, backward-compatible | New layouts, new includes, new collections, enhanced pages |
| **PATCH** (0.0.X) | Bug fixes, documentation, maintenance | Typo fixes, doc updates, dependency bumps, CI changes |

### Change Category Reference

| Category | Files | Impact | Changelog Section |
|----------|-------|--------|-------------------|
| **Breaking** | Layout renames, config changes | MAJOR | Changed/Removed |
| **Feature** | `_layouts/`, `_includes/`, collections | MINOR | Added |
| **Enhancement** | Improved components, new options | MINOR | Changed |
| **Content** | Posts, notes, notebooks, docs | PATCH | Added |
| **Fix** | Bug corrections, error handling | PATCH | Fixed |
| **Docs** | README, CHANGELOG, comments | PATCH | (often no entry) |
| **Chore** | CI, scripts, configs | PATCH | (often no entry) |

---

## Phase 0: Prerequisites ✓

### 0.1 Verify Docker Environment

```bash
# Check if Jekyll container is running
docker-compose ps

# If not running, start it and wait
docker-compose up -d jekyll && sleep 5 && docker-compose ps
```

**Expected**: Container shows "Up" status with ports mapped.

### 0.2 Check Working Directory

```bash
# View all changes (staged and unstaged)
git status --short

# Use get_changed_files tool for detailed diff
# get_changed_files
```

**Decision Point**:
- Changes to include → Proceed
- Changes to exclude → `git stash push -m "WIP: description"`
- No changes → Nothing to release

### 0.3 Verify Credentials (First-time setup)

```bash
# Check RubyGems credentials exist
test -f ~/.gem/credentials && echo "✓ RubyGems credentials found" || echo "⚠️ Run: gem signin"
```

### 0.4 Get Current State

```bash
# All-in-one status check
echo "Version: $(grep -o 'VERSION = \"[^\"]*\"' lib/jekyll-theme-zer0/version.rb)"
echo "Last Tag: $(git describe --tags --abbrev=0 2>/dev/null || echo 'None')"
echo "Commits since tag: $(git rev-list --count $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD)"
```

---

## Phase 1: Analyze Changes

### 1.1 Gather Change Information

Use the `get_changed_files` tool to see detailed diffs, then:

```bash
# Summary of changes by type
git diff --stat HEAD

# Recent commits for context
git log --oneline -10
```

### 1.2 Categorize Changes

Review each changed file and assign to ONE primary category:

| Category | Example Files | Version Impact |
|----------|---------------|----------------|
| **Breaking** | Layout renames, config schema changes, removed features | MAJOR |
| **Feature** | New `_layouts/`, `_includes/`, `pages/_notes/`, `pages/_notebooks/` | MINOR |
| **Enhancement** | Improved existing components, new options | MINOR |
| **Content** | New posts, notes, notebooks, documentation pages | PATCH |
| **Fix** | Bug fixes, corrections, error handling | PATCH |
| **Docs** | `README.md`, `docs/`, `CHANGELOG.md` only | PATCH |
| **Chore** | CI, scripts, dependencies, configs | PATCH |

### 1.3 Determine Version Bump

Apply the **highest impact** rule:
```
If ANY breaking change exists     → MAJOR (X.0.0)
Else if ANY new feature exists    → MINOR (0.X.0)  
Else                              → PATCH (0.0.X)
```

### 1.4 Prepare Change Summary

Document for CHANGELOG:
- **Added**: New files, features, content
- **Changed**: Modified behavior, improvements
- **Fixed**: Bug corrections
- **Removed**: Deleted features (potentially breaking)

---

## Phase 2: Validate

> 🛑 **Critical**: This phase is REQUIRED. Never skip validation.

### 2.1 Jekyll Build Test (REQUIRED)

```bash
# Primary validation - must pass before any release
docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'
```

**Expected output**: 
```
done in X.XXX seconds.
```

**If build fails**: Fix errors before proceeding. Common issues:
- YAML front matter syntax errors
- Missing include files
- Invalid Liquid template syntax

### 2.2 Jekyll Doctor (Advisory)

```bash
docker-compose exec -T jekyll bundle exec jekyll doctor
```

**Expected output**: `Everything looks fine.` (warnings are acceptable)

### 2.3 Validate Configuration Syntax

```bash
# Validate YAML configs
docker-compose exec -T jekyll ruby -ryaml -e "
  YAML.load_file('_config.yml')
  YAML.load_file('_config_dev.yml')
  puts '✓ YAML configs valid'
"
```

### 2.4 Validation Gate

| Check | Command | Required |
|-------|---------|----------|
| Jekyll Build | `docker-compose exec -T jekyll bundle exec jekyll build...` | ✅ **YES** |
| Jekyll Doctor | `docker-compose exec -T jekyll bundle exec jekyll doctor` | ⚠️ Warnings OK |
| YAML Syntax | Ruby validation | ✅ **YES** |

> 🛑 **STOP if Jekyll build fails.** Fix all errors before proceeding to Phase 3.

---

## Phase 3: Update Documentation

### 3.1 Update CHANGELOG.md

Add entry at **TOP** of file, immediately after `# Changelog` header:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **Component**: `filename.ext` - Description of what was added
- **Collection**: New collection with X items

### Changed  
- **Enhanced**: `filename.ext` - Description of improvement
- **Layout**: Updated from `old` to `new` layout

### Fixed
- **Issue**: Description - How it was fixed

### Removed
- **Deprecated**: `filename.ext` - Why it was removed
```

**Changelog Categories** (use only relevant ones):
- `Added` - New features, content, or files
- `Changed` - Modifications to existing functionality
- `Fixed` - Bug fixes
- `Removed` - Deleted features or files
- `Deprecated` - Features marked for future removal
- `Security` - Security-related changes

### 3.2 Update Version File

Edit `lib/jekyll-theme-zer0/version.rb`:

```ruby
# frozen_string_literal: true

module JekyllThemeZer0
  VERSION = "X.Y.Z" unless defined?(JekyllThemeZer0::VERSION)
end
```

**Use `replace_string_in_file` tool** to update the version string.

---

## Phase 4: Commit Changes

### 4.1 Stage All Changes

```bash
git add -A
git status --short
```

Review the output to ensure all expected files are staged.

### 4.2 Create Semantic Commit

Use a **single-line commit message** to avoid terminal issues:

```bash
git commit -m "<type>(<scope>): <summary> - Bump version to X.Y.Z"
```

**Commit Types**:
| Type | Use For |
|------|---------|
| `feat` | New features, new content collections |
| `fix` | Bug fixes |
| `docs` | Documentation only |
| `style` | Formatting, CSS changes |
| `refactor` | Code restructuring |
| `perf` | Performance improvements |
| `test` | Test additions |
| `chore` | Maintenance, dependencies |

**Scopes**: `search`, `navigation`, `layouts`, `includes`, `sass`, `config`, `ci`, `scripts`, `analytics`, `content`, `notes`, `notebooks`

**Example commits**:
```bash
git commit -m "feat(content): add notes collection and notebooks - Bump version to 0.20.3"
git commit -m "fix(search): correct JSON syntax in search index - Bump version to 0.20.1"
git commit -m "chore(deps): update Ruby dependencies - Bump version to 0.19.5"
```

### 4.3 Push to Main Branch

```bash
# Always pull first to avoid conflicts
git pull --rebase origin main

# Push commits
git push origin main
```

---

## Phase 5: Create and Push Tag

### 5.1 Create Annotated Tag

```bash
git tag -a vX.Y.Z -m "vX.Y.Z - Brief description of release"
```

**Tag naming**: Always prefix with `v` (e.g., `v0.20.3`)

### 5.2 Push Commits and Tag Together

```bash
# Push both commits and tags in one command
git push origin main --tags
```

### 5.3 Verify Tag

```bash
git describe --tags --abbrev=0
# Should output: vX.Y.Z
```

---

## Phase 6: Build and Publish Gem

### 6.1 Build the Gem

```bash
# Build from project root (NOT inside Docker - credentials issue)
gem build jekyll-theme-zer0.gemspec
```

**Expected output**: 
```
Successfully built RubyGem
  Name: jekyll-theme-zer0
  Version: X.Y.Z
  File: jekyll-theme-zer0-X.Y.Z.gem
```

**Note**: Warnings about open-ended dependencies are OK.

### 6.2 Publish to RubyGems

```bash
gem push jekyll-theme-zer0-X.Y.Z.gem
```

**Expected output**: `Successfully registered gem: jekyll-theme-zer0 (X.Y.Z)`

### 6.3 Clean Up

```bash
# Move gem file to pkg directory
mkdir -p pkg && mv jekyll-theme-zer0-X.Y.Z.gem pkg/
```

---

## Phase 7: Verify Publication

### 7.1 Verify on RubyGems.org

```bash
curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(f'✓ Published: {d[\"name\"]} v{d[\"version\"]}')"
```

**Expected**: Shows the version you just published.

### 7.2 Final Verification

```bash
# All three should show the same version
echo "Git tag:     $(git describe --tags --abbrev=0)"
echo "Version.rb:  $(grep -o '[0-9.]*' lib/jekyll-theme-zer0/version.rb | head -1)"
curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" | python3 -c "import json,sys; print(f'RubyGems:    {json.load(sys.stdin)[\"version\"]}')"
```

### 7.3 Optional: Create GitHub Release

```bash
# Using GitHub CLI (if installed)
gh release create vX.Y.Z \
  --title "vX.Y.Z - Brief description" \
  --notes "See CHANGELOG.md for details" \
  pkg/jekyll-theme-zer0-X.Y.Z.gem
```

---

## 📋 Output: Release Summary Template

Provide this summary after completing a release:

```markdown
## Release Summary

**Version**: X.Y.Z (from W.V.U) | **Type**: PATCH/MINOR/MAJOR | **Date**: YYYY-MM-DD

### Changes Included
| Category | Changes |
|----------|---------|
| **Added** | Description of new features/content |
| **Changed** | Description of modifications |
| **Fixed** | Description of bug fixes |
| **Removed** | Description of removed items |

### Validation Results
| Check | Status |
|-------|--------|
| Jekyll Build | ✅ Pass |
| Git Commit | ✅ <hash> |
| Git Tag | ✅ vX.Y.Z |
| Git Push | ✅ Pushed to origin |
| RubyGems | ✅ Published |

**Published**: [jekyll-theme-zer0 vX.Y.Z](https://rubygems.org/gems/jekyll-theme-zer0)
```

### For Theme Users
- **Bundler users**: `bundle update jekyll-theme-zer0`
- **Remote theme users**: Changes apply automatically on next build

---

## 🔧 Quick Reference

### Essential Commands

| Action | Command |
|--------|---------|
| Check Docker | `docker-compose ps` |
| Start Docker | `docker-compose up -d jekyll && sleep 5` |
| Jekyll build | `docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'` |
| Current version | `grep VERSION lib/jekyll-theme-zer0/version.rb` |
| Last tag | `git describe --tags --abbrev=0` |
| Stage all | `git add -A && git status --short` |
| Commit | `git commit -m "type(scope): summary - Bump version to X.Y.Z"` |
| Tag | `git tag -a vX.Y.Z -m "vX.Y.Z - Description"` |
| Push all | `git push origin main --tags` |
| Build gem | `gem build jekyll-theme-zer0.gemspec` |
| Publish gem | `gem push jekyll-theme-zer0-X.Y.Z.gem` |
| Verify publish | `curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" \| python3 -c "import json,sys; print(json.load(sys.stdin)['version'])"` |

### Automated Release Script

```bash
# Standard release (patch)
./scripts/release patch

# macOS with Homebrew bash (if default bash is old)
/opt/homebrew/bin/bash ./scripts/release patch

# Dry run to preview
./scripts/release patch --dry-run

# Skip publishing (build and test only)
./scripts/release patch --skip-publish --no-github-release
```

---

## 🔄 Rollback Procedure

If issues are discovered after publication:

### Option 1: Quick Fix (Preferred)

1. Fix the issue in code
2. Create new PATCH release with fix
3. Publish corrected version

### Option 2: Full Rollback

```bash
# Revert the commit
git revert <commit-hash>
git push origin main

# Delete local and remote tag
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z

# Yank gem from RubyGems (within 24 hours only)
gem yank jekyll-theme-zer0 -v X.Y.Z
```

---

## 🔥 Troubleshooting

### Docker Issues

| Problem | Solution |
|---------|----------|
| Container not running | `docker-compose down && docker-compose up -d jekyll && sleep 5` |
| Build hangs | `docker-compose restart jekyll` |
| Permission errors | Check volume mounts in `docker-compose.yml` |

### Git Issues

| Problem | Solution |
|---------|----------|
| Push rejected | `git pull --rebase origin main` then push again |
| Tag already exists | `git tag -d vX.Y.Z` then recreate |
| Commit message issues | Use single-line messages to avoid terminal problems |

### Gem Issues

| Problem | Solution |
|---------|----------|
| Build fails | `ruby -c jekyll-theme-zer0.gemspec` to check syntax |
| Push fails - auth | `gem signin` to re-authenticate |
| Push fails - version | Version already published; bump version and retry |
| Version mismatch | Ensure `version.rb`, tag, and CHANGELOG all match |

### Version Verification

```bash
# Check all version sources match
echo "CHANGELOG: $(head -3 CHANGELOG.md | grep -o '\[.*\]' | tr -d '[]')"
echo "version.rb: $(grep -o '[0-9.]*' lib/jekyll-theme-zer0/version.rb | head -1)"
echo "Git tag: $(git describe --tags --abbrev=0)"
curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" | python3 -c "import json,sys; print(f'RubyGems: {json.load(sys.stdin)[\"version\"]}')"
```

