---
title: Release Management
description: Comprehensive guide to semantic versioning, changelog management, and gem publishing for the Zer0-Mistakes theme.
layout: default
categories:
    - docs
    - development
tags:
    - release
    - versioning
    - changelog
    - rubygems
permalink: /docs/development/release-management/
difficulty: advanced
estimated_time: 20 minutes
prerequisites:
    - Git knowledge
    - RubyGems.org account
sidebar:
    nav: docs
---

# Release Management

This guide covers the complete release process for the Zer0-Mistakes Jekyll theme, including semantic versioning, changelog management, and gem publishing.

## Semantic Versioning

We follow [SemVer](https://semver.org/) strictly: `MAJOR.MINOR.PATCH`

### Version Types

| Type | When to Use | Example |
|------|-------------|---------|
| **PATCH** (0.0.x) | Bug fixes, minor tweaks | `1.2.3 → 1.2.4` |
| **MINOR** (0.x.0) | New features, deprecations | `1.2.3 → 1.3.0` |
| **MAJOR** (x.0.0) | Breaking changes | `1.2.3 → 2.0.0` |

### Prerelease Versions

For testing unstable changes:

- `2.0.0.rc1` — Release candidate
- `1.5.0.beta.3` — Beta version
- `2.1.0.alpha.1` — Alpha version

## Git Workflow

### Branch Strategy

We use **Git Flow** for release management:

```
main         ────●────────●────────●──────→ (stable releases)
                 │        │        │
release/*   ────┼────────┼────────┼───────→ (release prep)
                 │        │        │
develop     ────●────●───●────●───●────●──→ (integration)
                 │    │        │
feature/*   ────┴────┴────────┴───────────→ (development)
```

### Branch Types

| Branch | Purpose | Created From | Merged To |
|--------|---------|--------------|-----------|
| `main` | Stable production code | N/A | N/A |
| `develop` | Integration branch | `main` | `main` via release |
| `feature/*` | New features | `develop` | `develop` |
| `release/*` | Release preparation | `develop` | `main` and `develop` |
| `hotfix/*` | Urgent fixes | `main` | `main` and `develop` |

## Changelog Management

### CHANGELOG.md Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New features

### Changed
- Changes in existing functionality

### Fixed
- Bug fixes

## [2.0.0] - 2025-01-15

### Added
- User authentication system
```

### Best Practices

1. **Structure**: One entry per version, grouped by type
2. **Updates**: Add entries during development in PRs
3. **Order**: Reverse chronological order
4. **Content**: Summarize meaningfully (not raw git logs)

## Release Process

### Pre-Release Checklist

- [ ] All tests pass locally and in CI
- [ ] Version bumped in `lib/jekyll-theme-zer0/version.rb`
- [ ] CHANGELOG.md updated with new version
- [ ] Documentation updated for API changes
- [ ] Dependencies reviewed and updated

### Automated Release

The easiest way to release:

```bash
# Trigger version bump workflow
./scripts/version.sh patch  # or minor, major

# Push with tags
git push origin main --tags
```

This automatically:

1. Bumps the version
2. Updates CHANGELOG.md
3. Creates a git tag
4. Triggers gem build and publish
5. Creates GitHub release

### Manual Release Steps

1. **Create release branch**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v2.1.0
   ```

2. **Bump version**:

   ```bash
   ./scripts/version.sh minor
   ```

3. **Validate and test**:

   ```bash
   ./test/test_runner.sh --verbose
   ./scripts/build.sh
   ```

4. **Commit and tag**:

   ```bash
   git add .
   git commit -m "chore: bump version to 2.1.0"
   git tag v2.1.0
   git push origin main --tags
   ```

5. **Deploy release**:

   ```bash
   ./scripts/release.sh
   ```

## RubyGems Publishing

### Setup

1. Sign up on [RubyGems.org](https://rubygems.org)
2. Configure credentials:

   ```bash
   gem signin
   ```

### Gemspec Configuration

```ruby
Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-zer0"
  spec.version       = JekyllThemeZer0::VERSION
  spec.authors       = ["Your Name"]
  spec.email         = ["your.email@example.com"]

  spec.metadata["allowed_push_host"] = "https://rubygems.org"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"
end
```

### Manual Publishing

```bash
# Build the gem
gem build jekyll-theme-zer0.gemspec

# Publish to RubyGems.org
gem push jekyll-theme-zer0-2.1.0.gem
```

## GitHub Releases

### Automatic Features

- **Smart Release Notes**: Extracted from CHANGELOG.md
- **Multiple Assets**: Gem file, installation script, documentation
- **Prerelease Detection**: Automatically detects alpha/beta/rc versions

### Release Assets

Each GitHub release includes:

- Ruby gem package (`.gem` file)
- One-click installation script
- Detailed release notes
- Version and build information

## Hotfix Process

For critical bugs in production:

1. **Create hotfix branch**:

   ```bash
   git checkout v2.0.1
   git checkout -b hotfix/v2.0.2-critical-fix
   ```

2. **Apply minimal fix** and test thoroughly

3. **Release hotfix**:

   ```bash
   git commit -m "Hotfix: critical security vulnerability"
   git tag v2.0.2
   gem build && gem push
   ```

4. **Merge forward** to develop

## Troubleshooting

### Failed Release

If a release fails:

1. Check CI logs for errors
2. Verify RubyGems credentials
3. Ensure version isn't already published
4. Check for network issues

### Gem Yanking

For serious issues post-publication:

```bash
# Remove gem version (irreversible)
gem yank jekyll-theme-zer0 -v 2.1.0
```

**Note**: Cannot reuse yanked version numbers.

## Related

- [Version Bump Workflow](/docs/development/version-bump/)
- [CI/CD Pipeline](/docs/development/ci-cd/)
- [Testing Guide](/docs/development/testing/)
