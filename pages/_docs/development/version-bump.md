---
title: Version Bump Workflow
description: Guide to the automated version bump workflow for managing semantic versioning and releases.
layout: default
categories:
    - docs
    - development
tags:
    - version
    - automation
    - github-actions
permalink: /docs/development/version-bump/
difficulty: intermediate
estimated_time: 10 minutes
prerequisites:
    - GitHub repository access
    - Understanding of semantic versioning
sidebar:
    nav: docs
---

# Version Bump Workflow

The Zer0-Mistakes theme includes an automated version bump workflow that handles semantic versioning, changelog updates, and release preparation.

## Overview

The workflow supports two trigger modes:

1. **Manual**: Select version type via GitHub Actions UI
2. **Automatic**: Analyze commits to determine version bump type

## Manual Version Bump

### Using GitHub Actions UI

1. Go to **Actions** tab in GitHub
2. Select **Version Bump** workflow
3. Click **Run workflow**
4. Choose options:
   - **Version type**: `patch`, `minor`, `major`, or `auto`
   - **Skip tests**: Optional, for faster releases
   - **Dry run**: Preview changes without committing

### Using Command Line

```bash
# Bump patch version (bug fixes)
./scripts/version.sh patch

# Bump minor version (new features)
./scripts/version.sh minor

# Bump major version (breaking changes)
./scripts/version.sh major

# Push with tags
git push origin main --tags
```

## Automatic Version Detection

When triggered by a push to `main`, the workflow analyzes commit messages:

| Commit Pattern | Version Bump |
|----------------|--------------|
| `BREAKING CHANGE:` or `!:` | **Major** |
| `feat:` or `feature:` | **Minor** |
| `fix:`, `docs:`, `chore:` | **Patch** |

### Commit Message Examples

```bash
# Major bump (breaking change)
git commit -m "feat!: remove deprecated API endpoints"
git commit -m "refactor: new auth system

BREAKING CHANGE: authentication tokens now required"

# Minor bump (new feature)
git commit -m "feat: add dark mode toggle"
git commit -m "feature: implement search functionality"

# Patch bump (fix/maintenance)
git commit -m "fix: resolve navigation bug on mobile"
git commit -m "docs: update installation guide"
git commit -m "chore: update dependencies"
```

## Workflow Configuration

### Triggers

```yaml
on:
  push:
    branches: [ main ]
    paths-ignore:
      - 'CHANGELOG.md'
      - 'lib/jekyll-theme-zer0/version.rb'
      - '*.gem'
  workflow_dispatch:
    inputs:
      version_type:
        type: choice
        options: [patch, minor, major, auto]
```

### Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `version_type` | Type of version bump | `patch` |
| `skip_tests` | Skip test execution | `false` |
| `dry_run` | Preview changes only | `false` |

## What the Workflow Does

### 1. Analyze Changes

- Determines appropriate version bump type
- Counts commits since last release
- Identifies breaking changes

### 2. Run Tests (Optional)

- Executes full test suite
- Validates Jekyll build
- Checks gem packaging

### 3. Bump Version

Updates version in:
- `lib/jekyll-theme-zer0/version.rb`
- `package.json`

### 4. Update Changelog

- Extracts commit messages
- Categorizes changes (Added, Changed, Fixed)
- Updates `CHANGELOG.md`

### 5. Create Release

- Commits version changes
- Creates git tag
- Triggers downstream release workflows

## Workflow Outputs

| Output | Description |
|--------|-------------|
| `bump_type` | Detected version bump type |
| `commit_count` | Number of commits analyzed |
| `should_release` | Whether release should proceed |
| `new_version` | New version number |

## Best Practices

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons
- `refactor`: Code change (no feature/fix)
- `test`: Adding tests
- `chore`: Maintenance

### Breaking Changes

Indicate breaking changes with:

- `!` after type: `feat!: new API`
- Footer: `BREAKING CHANGE: description`

## Troubleshooting

### Workflow Not Triggering

Check that commit doesn't modify ignored paths:
- `CHANGELOG.md`
- `lib/jekyll-theme-zer0/version.rb`
- `*.gem`

### Infinite Loop Prevention

The workflow skips if:
- Commit message contains `chore: bump version`
- Author is `github-actions`

### Version Already Exists

If version tag already exists:

1. Delete the tag locally and remotely
2. Re-run the workflow

```bash
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
```

## Related

- [Release Management](/docs/development/release-management/)
- [CI/CD Pipeline](/docs/development/ci-cd/)
- [Testing Guide](/docs/development/testing/)
