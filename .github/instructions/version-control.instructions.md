---
applyTo: "**"
description: "Version control, releases, and publication guidelines for Ruby Gems and GitHub repositories"
---

# Version Control and Release Management Guidelines

## 🚀 Overview

This document outlines best practices for version control, releases, and publications for Ruby Gems using Git, GitHub, and RubyGems.org. The core goals are to ensure stability, traceability, and ease of contribution while following Semantic Versioning (SemVer) for releases.

## 📋 Table of Contents

- [Git Workflow Strategy](#git-workflow-strategy)
- [Branch Management](#branch-management)
- [Semantic Versioning](#semantic-versioning)
- [Testing Requirements](#testing-requirements)
- [Changelog Management](#changelog-management)
- [Documentation Updates](#documentation-updates)
- [Release Process](#release-process)
- [Publication Guidelines](#publication-guidelines)

## 🔄 Git Workflow Strategy

### Recommended Workflows

**Git Flow** (Recommended for gems with multiple supported versions):
- Supports versioned releases
- Handles features, bug fixes, and hotfixes separately
- Maintains stable releases
- Ideal for team collaboration

**GitHub Flow** (For smaller projects or solo development):
- Simpler workflow
- Work directly on feature branches from main
- Merge via PR and tag releases from main

### General Update Process

1. **Branch off** from the appropriate base (e.g., `main` or `develop`)
2. **Develop changes** with atomic commits (one logical change per commit)
3. **Test locally** (see [Testing Requirements](#testing-requirements))
4. **Push and open a PR** targeting the integration branch
5. **Review and merge** after approvals and passing CI tests
6. **Prepare release** if needed: bump version, update changelog, commit, tag
7. **Post-release**: Update documentation and announce via GitHub releases

### Commit Message Guidelines

Use descriptive, atomic commits with clear messages:
```
Fix bug in method X: add edge case handling

- Handle nil input parameters
- Add validation for empty strings
- Update tests to cover edge cases
```

## 🌳 Branch Management

### Git Flow Branch Structure

| Branch Type | Purpose | Created From | Merged To | Example Name |
|-------------|---------|--------------|-----------|--------------|
| `main` (or `master`) | Stable production code; only merged releases/hotfixes. Tags are created here for versions. | N/A (long-lived) | N/A | `main` |
| `develop` | Integration of features for the next release; ongoing development. | `main` | `main` (via release branches) | `develop` |
| `feature/*` | New features or enhancements; isolate work to avoid impacting others. | `develop` | `develop` | `feature/add-authentication` |
| `bugfix/*` or `fix/*` | Non-urgent bug fixes in development code. | `develop` | `develop` | `bugfix/handle-nil-error` |
| `hotfix/*` | Urgent fixes for bugs in released (production) versions; quick patches. | `main` (or a specific release tag/branch) | `main` and `develop` | `hotfix/v1.2.3-security-patch` |
| `release/*` | Preparing a new version: final tweaks, version bump, changelog update. | `develop` | `main` and `develop` | `release/v2.0.0` |

### Branch Naming Conventions

Use descriptive, short-lived branches prefixed by type:
- `feature/add-user-authentication`
- `bugfix/fix-memory-leak`
- `hotfix/security-vulnerability`
- `release/v2.1.0`
- `docs/update-readme`

### Branch Management Rules

- Keep branches short-lived to minimize conflicts
- Clean up merged branches regularly
- Avoid merging between topic branches to keep them independent
- Use pull requests (PRs) for all merges to enable code reviews

## 📈 Semantic Versioning

Follow SemVer strictly: `MAJOR.MINOR.PATCH`

### Version Types

- **PATCH (0.0.x)**: Backward-compatible bug fixes or minor implementation tweaks
  - Example: `1.2.3 → 1.2.4` for a hotfix
- **MINOR (0.x.0)**: Backward-compatible new features, deprecations, or additions
  - Example: `1.2.3 → 1.3.0` for a new method
- **MAJOR (x.0.0)**: Breaking changes, like API removals or incompatible updates
  - Example: `1.2.3 → 2.0.0`

### Prerelease Versions

For testing unstable changes, use suffixes:
- `2.0.0.rc1` (release candidate)
- `1.5.0.beta.3` (beta version)
- `2.1.0.alpha.1` (alpha version)

### Version Management

- Update version in `lib/gem_name/version.rb`
- Bump versions only on the release branch or before tagging
- In gemspecs/Gemfiles, pin dependencies with `~>` for safety
- Avoid loose constraints to prevent breaks

## 🧪 Testing Requirements

### Test Suite Structure

Maintain comprehensive tests in `spec/` (RSpec) or `test/` (Minitest):

```
spec/
├── unit/           # Individual methods/classes
├── integration/    # End-to-end functionality
├── generators/     # Custom generators (if applicable)
└── support/        # Test helpers and configuration
```

### Test Types

- **Unit tests**: Test individual methods/classes
  ```bash
  bundle exec rspec spec/unit/
  ```
- **Integration tests**: Test end-to-end functionality
  ```bash
  bundle exec rspec spec/integration/
  ```
- **Full suite**: Run all tests
  ```bash
  bundle exec rspec
  # or
  rake test
  ```

### Test Coverage

- Aim for high coverage (use SimpleCov)
- Add development dependencies in gemspec:
  ```ruby
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "simplecov", "~> 0.21"
  ```

### CI Integration

Set up GitHub Actions to run tests on PRs/pushes:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ruby-version: ['2.7', '3.0', '3.1', '3.2']
    steps:
      - uses: actions/checkout@v3
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby-version }}
          bundler-cache: true
      - run: bundle exec rspec
```

## 📝 Changelog Management

### CHANGELOG.md Structure

Keep a `CHANGELOG.md` file in the repo root, written for humans:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature descriptions

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Any bug fixes

### Security
- Vulnerability fixes

## [2.0.0] - 2025-01-15

### Added
- User authentication system
- API rate limiting

### Changed
- Updated Ruby requirement to 3.0+

### Removed
- Deprecated legacy methods

## [1.5.0] - 2024-12-01
...
```

### Changelog Best Practices

- **Structure**: One entry per version; group by type
- **Updates**: Add entries during development (in PRs)
- **Order**: Reverse chronological order
- **Content**: Summarize meaningfully (not raw git logs)
- **Timing**: Update before each release
- **Commit**: Include changelog updates in the release commit

## 📚 Documentation Updates

### Code Documentation

Use YARD syntax for auto-generated docs:

```ruby
# Authenticates a user with the given credentials
# 
# @param username [String] the user's login name
# @param password [String] the user's password
# @return [User, nil] the authenticated user or nil if authentication fails
# @raise [ArgumentError] if username or password is blank
# @example
#   user = authenticate_user("john_doe", "secret123")
#   puts user.name if user
def authenticate_user(username, password)
  # implementation
end
```

### Documentation Updates Required

For each change, update:

1. **Inline comments**: YARD documentation blocks
2. **README.md**: Public API changes, usage examples, installation
3. **Commit/PR docs**: Descriptive titles/messages, link to issues
4. **Breaking changes**: Add deprecation warnings in code
   ```ruby
   warn "Deprecated: use new_method instead of old_method"
   ```

### Generate Documentation

```bash
# Generate YARD documentation
yard doc

# View locally
yard server
```

## 🚢 Release Process

### Pre-Release Checklist

- [ ] All tests pass locally and in CI
- [ ] Version bumped in `lib/gem_name/version.rb`
- [ ] CHANGELOG.md updated with new version
- [ ] Documentation updated for API changes
- [ ] Dependencies reviewed and updated if needed

### Release Steps

#### Automated Release (Recommended)

1. **Trigger version bump workflow**:
   ```bash
   # Via GitHub Actions UI or API
   # This automatically handles steps 2-7 below
   ```

2. **Or use local version bump**:
   ```bash
   ./scripts/version.sh [patch|minor|major]
   git push origin main --tags
   ```

#### Manual Release Process

1. **Create release branch** (Git Flow):
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v2.1.0
   ```

2. **Bump version**:
   ```bash
   ./scripts/version.sh minor  # or patch/major
   ```

3. **Validate and test**:
   ```bash
   ./test/test_runner.sh --verbose
   ./scripts/build.sh
   ```

4. **Commit and tag** (if not done by version script):
   ```bash
   git add .
   git commit -m "chore: bump version to 2.1.0"
   git tag v2.1.0
   git push origin main --tags
   ```

5. **Deploy release**:
   ```bash
   ./scripts/release.sh  # Full automated deployment
   # Or step by step:
   ./scripts/release.sh --skip-publish  # Build and test only
   ./scripts/release.sh --draft         # Create draft release
   ```

6. **Merge back to develop** (Git Flow):
   ```bash
   git checkout develop
   git merge main
   git push origin develop
   ```

#### GitHub Release Automation

The repository includes comprehensive GitHub Release automation:

- **Automatic Release Creation**: Triggered by version bump or tag push
- **Smart Release Notes**: Extracted from CHANGELOG.md
- **Multiple Assets**: Gem file, installation script, documentation
- **Prerelease Detection**: Automatically detects alpha/beta/rc versions
- **Draft Support**: Option to create draft releases for review

## 📦 Publication Guidelines

### RubyGems.org Setup

1. **Sign up** on [RubyGems.org](https://rubygems.org)
2. **Configure credentials**:
   ```bash
   gem signin
   ```

### Gemspec Configuration

Ensure your gemspec includes:

```ruby
Gem::Specification.new do |spec|
  spec.name          = "gem_name"
  spec.version       = GemName::VERSION
  spec.authors       = ["Your Name"]
  spec.email         = ["your.email@example.com"]
  
  spec.summary       = "Short description"
  spec.description   = "Longer description"
  spec.homepage      = "https://github.com/username/gem_name"
  spec.license       = "MIT"
  
  # Security: restrict push to specific host
  spec.metadata["allowed_push_host"] = "https://rubygems.org"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"
  spec.metadata["documentation_uri"] = "#{spec.homepage}#readme"
  
  # Dependencies with pessimistic constraints
  spec.add_dependency "rails", "~> 7.0"
  spec.add_development_dependency "rspec", "~> 3.0"
end
```

### Automated Publication

#### Using Release Script

```bash
# Full automated deployment
./scripts/release.sh

# Options available:
./scripts/release.sh --dry-run          # Preview what would happen
./scripts/release.sh --skip-tests       # Skip test execution
./scripts/release.sh --draft            # Create draft GitHub release
./scripts/release.sh --prerelease       # Mark as prerelease
./scripts/release.sh --no-github-release # Skip GitHub release
```

#### Using GitHub Actions

The repository includes automated workflows:

1. **Version Bump Workflow** (`version-bump.yml`):
   - Manual trigger with version type selection
   - Automatic testing, version bumping, and tagging
   - Triggers downstream release workflows

2. **Gem Release Workflow** (`gem-release.yml`):
   - Triggered by tag push
   - Builds, tests, and publishes gem
   - Creates comprehensive GitHub release

3. **GitHub Release Workflow** (`github-release.yml`):
   - Creates detailed GitHub releases
   - Extracts release notes from CHANGELOG.md
   - Includes multiple assets and installation scripts

### Manual Publication

```bash
# Build the gem
gem build gem_name.gemspec

# Publish to RubyGems.org
gem push gem_name-2.1.0.gem

# For prereleases
gem push gem_name-2.1.0.rc1.gem
```

### GitHub Release Features

#### Automatic Release Notes
- Extracts from CHANGELOG.md for the specific version
- Includes installation instructions and links
- Adds developer documentation and examples

#### Release Assets
- Ruby gem package (`.gem` file)
- One-click installation script
- Detailed release notes (Markdown)
- Version and build information (JSON)

#### Smart Prerelease Detection
- Automatically detects `alpha`, `beta`, `rc` in version
- Marks releases appropriately
- Handles `make_latest` flag correctly

### Post-Publication

1. **Verify publication**: 
   - Check gem page on RubyGems.org
   - Verify GitHub release creation
   - Test installation from both sources

2. **Update documentation**: 
   - README installation instructions
   - API documentation if changed
   - Usage examples

3. **Announce and monitor**:
   - GitHub releases (automatic)
   - Social media, blog posts
   - Monitor for issues and feedback
   - Watch download statistics

### Team Management

```bash
# Add team members as gem owners
gem owner gem_name --add user@example.com

# List current owners
gem owner gem_name

# Remove owners if needed
gem owner gem_name --remove user@example.com
```

### Publication Security

- Use `allowed_push_host` to restrict publication
- Enable 2FA on RubyGems.org account
- Use GitHub repository secrets for automation
- Regularly audit gem ownership and access

## 🔒 Security Considerations

### Dependency Management

- Use pessimistic version constraints (`~>`)
- Regularly audit dependencies with `bundle audit`
- Update dependencies promptly for security patches

### Release Security

- Sign commits and tags when possible
- Use GitHub's security advisories for vulnerability disclosure
- Follow responsible disclosure practices

### Access Control

- Limit gem ownership to trusted team members
- Use organization accounts for team gems
- Enable two-factor authentication on RubyGems.org

## 🚨 Emergency Procedures

### Hotfix Process

For critical bugs in production:

1. **Create hotfix branch** from affected release tag:
   ```bash
   git checkout v2.0.1
   git checkout -b hotfix/v2.0.2-critical-fix
   ```

2. **Apply minimal fix** and test thoroughly

3. **Release hotfix**:
   ```bash
   # Bump patch version (2.0.1 → 2.0.2)
   git commit -m "Hotfix: critical security vulnerability"
   git tag v2.0.2
   gem build && gem push
   ```

4. **Merge forward** to all affected branches

### Gem Yanking

If a serious issue is discovered post-publication:

```bash
# Remove gem version from RubyGems.org (irreversible)
gem yank gem_name -v 2.1.0

# Users with installed versions are unaffected
# Cannot reuse yanked version numbers
```

## 📊 Metrics and Monitoring

### Track Key Metrics

- Download counts on RubyGems.org
- GitHub stars, forks, and issues
- Test coverage trends
- Dependency freshness

### Release Health

- Monitor for post-release issues
- Track user feedback and bug reports
- Measure adoption of new versions
- Watch for security vulnerabilities

---

## 📖 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [RubyGems Guides](https://guides.rubygems.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [YARD Documentation](https://yardoc.org/)

---

*This document should be reviewed and updated regularly to reflect current best practices and team preferences.*
