---
agent: agent
mode: agent
description: "Complete release pipeline: analyze changes → validate → document → version → publish → verify"
tools: [run_in_terminal, read_file, replace_string_in_file, get_changed_files, grep_search]
---

# Release Pipeline for Zer0-Mistakes Jekyll Theme

Execute a complete release: analyze changes, validate builds, update docs/changelog, bump version, publish gem, and verify publication.

## 🎯 Release Checklist (Track Progress)

Use this checklist to ensure all steps are completed:

- [ ] **Phase 0**: Prerequisites verified (Docker running, clean working directory)
- [ ] **Phase 1**: Changes analyzed and categorized
- [ ] **Phase 2**: All validations pass (Jekyll build, doctor, JSON/YAML syntax)
- [ ] **Phase 3**: Documentation updated (CHANGELOG.md, version file)
- [ ] **Phase 4**: Changes committed with semantic message
- [ ] **Phase 5**: Tag created and pushed
- [ ] **Phase 6**: Gem built and published to RubyGems
- [ ] **Phase 7**: Publication verified on RubyGems.org

---

## Choose a Release Mode

| Mode | Command | Use When |
|------|---------|----------|
| **Automated** | `./scripts/release [patch\|minor\|major]` | Standard releases |
| **Dry Run** | `./scripts/release patch --dry-run` | Preview changes first |
| **Manual** | Follow Phases 0–7 below | Fine-grained control needed |

> ⚠️ **Important**: Even in automated mode, run **Phase 2: Validate** first. The release script runs `bundle exec rspec` but does NOT run a Docker Jekyll build.

---

## Phase 0: Prerequisites ✓

### 0.1 Verify Docker Environment

```bash
# Check if Jekyll container is running
docker-compose ps

# If not running, start it
docker-compose up -d jekyll

# Wait for container to be ready (5 seconds)
sleep 5 && docker-compose ps
```

### 0.2 Check Working Directory

```bash
# View current git status
git status --short

# If there are uncommitted changes you want to include, proceed
# If there are changes you want to exclude, stash them:
# git stash push -m "WIP: description"
```

### 0.3 Verify RubyGems Credentials

```bash
# Check if credentials exist
cat ~/.gem/credentials 2>/dev/null | head -1 || echo "⚠️ No RubyGems credentials found"

# If missing, configure with: gem signin
```

### 0.4 Get Current Version

```bash
# Display current version
cat lib/jekyll-theme-zer0/version.rb | grep VERSION

# Get last tag
git describe --tags --abbrev=0 2>/dev/null || echo "No tags found"
```

---

## Phase 1: Analyze Changes

### 1.1 Gather Change Information

```bash
# Staged changes (will be committed)
echo "=== STAGED CHANGES ===" && git diff --cached --stat

# Unstaged changes
echo "=== UNSTAGED CHANGES ===" && git diff --stat

# Recent commits (context)
echo "=== RECENT COMMITS ===" && git log --oneline -5
```

### 1.2 Categorize Changes

Classify each changed file into ONE primary category:

| Category | Example Files | Version Impact |
|----------|---------------|----------------|
| **Breaking** | Layout renames, config schema changes, removed features | MAJOR |
| **Feature** | New `_layouts/`, `_includes/`, `assets/js/modules/` | MINOR |
| **Enhancement** | Improved existing components, new options | MINOR |
| **Fix** | Bug fixes, corrections, error handling | PATCH |
| **Docs** | `README.md`, `docs/`, `CHANGELOG.md` only | PATCH |
| **Chore** | CI, scripts, dependencies, configs | PATCH |

### 1.3 Determine Version Bump

```
MAJOR (X.0.0): Any breaking change exists
MINOR (0.X.0): New features/enhancements, no breaking changes  
PATCH (0.0.X): Fixes, docs, chores only
```

### 1.4 Document Change Summary

Create a mental or written summary:
- **What changed**: List of files and their purpose
- **Why it changed**: Problem solved or feature added
- **Who benefits**: Theme users, developers, both
- **Version bump**: MAJOR / MINOR / PATCH

---

## Phase 2: Validate

### 2.1 Jekyll Build Test (REQUIRED)

```bash
# Primary validation - must pass
docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'
```

**Expected output**: `done in X.XXX seconds` with no errors.

### 2.2 Jekyll Doctor (Advisory)

```bash
# Check for configuration issues
docker-compose exec -T jekyll bundle exec jekyll doctor
```

**Expected output**: `Everything looks fine.` (warnings are OK)

### 2.3 Validate Generated Output

```bash
# If search.json exists, validate it
if [ -f _site/search.json ]; then
  cat _site/search.json | python3 -m json.tool > /dev/null && echo "✓ search.json: Valid JSON"
  cat _site/search.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'✓ search.json: {len(d)} items indexed')"
fi

# Validate key files exist
ls -la _site/index.html _site/404.html 2>/dev/null && echo "✓ Core pages generated"
```

### 2.4 YAML Configuration Syntax

```bash
# Validate config files
docker-compose exec -T jekyll ruby -ryaml -e "
  YAML.load_file('_config.yml')
  YAML.load_file('_config_dev.yml')
  puts '✓ YAML configs valid'
"
```

### 2.5 Validation Gate

| Check | Command | Must Pass |
|-------|---------|-----------|
| Jekyll Build | Phase 2.1 | ✅ **REQUIRED** |
| Jekyll Doctor | Phase 2.2 | ⚠️ Warnings OK |
| Output Validation | Phase 2.3 | ✅ **REQUIRED** |
| YAML Syntax | Phase 2.4 | ✅ **REQUIRED** |

> 🛑 **STOP if any required check fails.** Fix issues before proceeding.

---

## Phase 3: Update Documentation

### 3.1 Update CHANGELOG.md

Add entry at **TOP** of file, immediately after `# Changelog` header:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **Component**: `filename.ext` - Description of what was added

### Changed  
- **Enhanced**: `filename.ext` - Description of improvement

### Fixed
- **Issue**: Description - How it was fixed

### Technical Details
- Brief technical notes for developers (optional)
```

**Categories** (use only relevant ones): Added, Changed, Fixed, Removed, Deprecated, Security

### 3.2 Update Version File

Edit `lib/jekyll-theme-zer0/version.rb`:

```ruby
# frozen_string_literal: true

module JekyllThemeZer0
  VERSION = "X.Y.Z" unless defined?(JekyllThemeZer0::VERSION)
end
```

### 3.3 Update Component Documentation (if applicable)

- **New layouts/includes**: Add documentation header comment in file
- **New features**: Update relevant `docs/` or `pages/_docs/` pages
- **API changes**: Update `README.md` usage examples
- **Configuration changes**: Update `_config.yml` comments

---

## Phase 4: Commit Changes

### 4.1 Stage All Changes

```bash
git add -A
git status --short
```

### 4.2 Create Semantic Commit

```bash
git commit -m "<type>(<scope>): <summary>

<detailed description of what changed and why>

- Change 1
- Change 2
- Change 3

Bump version to X.Y.Z"
```

**Commit Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Scopes**: `search`, `navigation`, `layouts`, `includes`, `sass`, `config`, `ci`, `scripts`, `analytics`

### 4.3 Push to Main Branch

```bash
# Sync with remote first (in case of remote changes)
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

### 5.2 Push Tag to Remote

```bash
git push origin vX.Y.Z
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
# Build from project root (not Docker - credentials issue)
gem build jekyll-theme-zer0.gemspec
```

**Expected output**: `Successfully built RubyGem` with `jekyll-theme-zer0-X.Y.Z.gem`

### 6.2 Publish to RubyGems

```bash
gem push jekyll-theme-zer0-X.Y.Z.gem
```

**Expected output**: `Successfully registered gem: jekyll-theme-zer0 (X.Y.Z)`

### 6.3 Clean Up Gem File

```bash
# Move to pkg directory for organization
mkdir -p pkg
mv jekyll-theme-zer0-X.Y.Z.gem pkg/
```

---

## Phase 7: Verify Publication

### 7.1 Verify on RubyGems.org

```bash
# Check published version via API
curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(f'''
✓ Published Successfully!
  Version: {d[\"version\"]}
  Downloads: {d[\"downloads\"]}
  Published: {d[\"version_created_at\"]}
  URL: https://rubygems.org/gems/jekyll-theme-zer0
''')"
```

### 7.2 Verify GitHub Release (Optional)

If you want to create a GitHub release:

```bash
# Using GitHub CLI
gh release create vX.Y.Z \
  --title "vX.Y.Z - Brief description" \
  --notes "See CHANGELOG.md for details" \
  pkg/jekyll-theme-zer0-X.Y.Z.gem
```

### 7.3 Final Verification Checklist

```bash
echo "=== FINAL VERIFICATION ==="
echo "Git tag: $(git describe --tags --abbrev=0)"
echo "Version file: $(grep VERSION lib/jekyll-theme-zer0/version.rb | grep -o '[0-9.]*')"
curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" | python3 -c "import json,sys; print(f'RubyGems: {json.load(sys.stdin)[\"version\"]}')"
```

All three should show the same version number.

---

## Output: Release Summary

Provide this summary after completion:

```markdown
## Release Summary

**Version**: X.Y.Z (from W.V.U) | **Type**: PATCH/MINOR/MAJOR | **Date**: YYYY-MM-DD

### Changes Included
- [x] Change description 1
- [x] Change description 2
- [x] Change description 3

### Validation Results
| Check | Status |
|-------|--------|
| Jekyll Build | ✅ Pass (X.XXs) |
| Jekyll Doctor | ✅ Pass |
| Output Validation | ✅ Valid |
| YAML Syntax | ✅ Valid |

### Files Modified
| File | Change |
|------|--------|
| `path/to/file.ext` | Added/Modified/Deleted |

### Publication Status
| Item | Status | Details |
|------|--------|---------|
| Git Commit | ✅ | `<hash>` |
| Git Push | ✅ | main branch |
| Git Tag | ✅ | vX.Y.Z |
| RubyGems | ✅ | [jekyll-theme-zer0 vX.Y.Z](https://rubygems.org/gems/jekyll-theme-zer0) |

### For Theme Users
To update: `bundle update jekyll-theme-zer0`
Remote theme users get changes automatically.
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Docker | `docker-compose up -d jekyll` |
| Check Docker | `docker-compose ps` |
| Jekyll build | `docker-compose exec -T jekyll bundle exec jekyll build --config '_config.yml,_config_dev.yml'` |
| Jekyll doctor | `docker-compose exec -T jekyll bundle exec jekyll doctor` |
| Check version | `cat lib/jekyll-theme-zer0/version.rb \| grep VERSION` |
| Automated release | `./scripts/release patch` |
| macOS Homebrew bash | `/opt/homebrew/bin/bash ./scripts/release patch` |
| Dry run preview | `./scripts/release patch --dry-run` |
| Build gem | `gem build jekyll-theme-zer0.gemspec` |
| Publish gem | `gem push jekyll-theme-zer0-X.Y.Z.gem` |
| Verify RubyGems | `curl -s "https://rubygems.org/api/v1/gems/jekyll-theme-zer0.json" \| python3 -m json.tool` |

---

## Rollback Procedure

If issues are discovered after publication:

### Revert Git Changes

```bash
# Revert the commit
git revert <commit-hash>
git push origin main

# Delete local and remote tag
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

### Unpublish Gem (within 24 hours only)

```bash
# Yank the gem version (removes from installation, keeps in history)
gem yank jekyll-theme-zer0 -v X.Y.Z
```

### Create Fix Release

1. Fix the issues on main branch
2. Follow this workflow again with incremented PATCH version
3. Publish the corrected version

---

## Troubleshooting

### Docker Issues

```bash
# Container not running
docker-compose down && docker-compose up -d jekyll && sleep 5

# Container unhealthy
docker-compose logs jekyll | tail -20
```

### Gem Build Fails

```bash
# Check gemspec syntax
ruby -c jekyll-theme-zer0.gemspec

# Verify all files exist
gem build jekyll-theme-zer0.gemspec --strict
```

### Gem Push Fails

```bash
# Re-authenticate with RubyGems
gem signin

# Check API key
cat ~/.gem/credentials
```

### Version Mismatch

```bash
# Ensure all versions match
grep VERSION lib/jekyll-theme-zer0/version.rb
git describe --tags --abbrev=0
head -5 CHANGELOG.md
```

