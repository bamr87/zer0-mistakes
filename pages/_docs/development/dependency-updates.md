---
title: Dependency Updates
description: Guide to automated dependency management and Ruby gem updates for the Zer0-Mistakes theme.
layout: default
categories:
    - docs
    - development
tags:
    - dependencies
    - gems
    - automation
    - security
permalink: /docs/development/dependency-updates/
difficulty: beginner
estimated_time: 10 minutes
prerequisites:
    - GitHub repository access
sidebar:
    nav: docs
---

# Dependency Updates

The Zer0-Mistakes theme uses automated workflows to keep dependencies current and secure.

## Overview

Dependency management is handled through:

1. **Automated workflow** - Weekly scheduled updates
2. **Manual trigger** - On-demand updates
3. **Security scanning** - Vulnerability detection

## Update Workflow

### Triggers

```yaml
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:       # Manual trigger
```

### What Gets Updated

| Dependency Type | Tool | File Updated |
|-----------------|------|--------------|
| Ruby Gems | Bundler | `Gemfile.lock` |
| Jekyll Plugins | Bundler | `Gemfile.lock` |
| Node Packages | npm | `package-lock.json` |

## Running Updates

### Manual Update via GitHub UI

1. Go to **Actions** tab
2. Select **Update Dependencies** workflow
3. Click **Run workflow**

### Manual Update via Command Line

```bash
# Update all Ruby gems
bundle update

# Update specific gem
bundle update jekyll

# Update Node packages
npm update
```

### In Docker

```bash
docker-compose exec jekyll bundle update
docker-compose exec jekyll bundle outdated
```

## Workflow Process

### 1. Check for Updates

```bash
# List outdated gems
bundle outdated

# Show available updates
bundle outdated --only-explicit
```

### 2. Run Updates

```bash
# Update all dependencies
bundle update

# Conservative update (patch versions only)
bundle update --patch
```

### 3. Run Tests

The workflow automatically:
- Runs the full test suite
- Builds the Jekyll site
- Validates gem packaging

### 4. Create Pull Request

If updates are available, the workflow:
- Creates a branch (`deps/update-YYYYMMDD`)
- Commits changes
- Opens a PR for review

## Dependency Pinning

### Gemfile Constraints

Use pessimistic version constraints:

```ruby
# Good: Allows patch updates
gem "jekyll", "~> 4.3"

# Good: Specific version when needed
gem "bootstrap", "5.3.3"

# Avoid: Too loose
gem "jekyll", ">= 4.0"
```

### Version Constraint Guide

| Constraint | Meaning | Example |
|------------|---------|---------|
| `~> 4.3` | >= 4.3.0, < 5.0 | Allows 4.3.x |
| `~> 4.3.0` | >= 4.3.0, < 4.4 | Allows 4.3.x |
| `>= 4.0` | Any version >= 4.0 | Risky |
| `= 4.3.2` | Exact version only | For critical deps |

## Security Auditing

### Bundle Audit

```bash
# Install audit tool
gem install bundler-audit

# Run security audit
bundle audit check --update

# Fix vulnerabilities
bundle audit check --update --fix
```

### Automated Security

The CI pipeline includes:
- Weekly vulnerability scans
- PR checks for known vulnerabilities
- Alerts for critical issues

## Handling Breaking Changes

### When Updates Break Things

1. **Identify the culprit**:
   ```bash
   git diff Gemfile.lock
   ```

2. **Revert specific gem**:
   ```bash
   bundle update --source problematic-gem
   ```

3. **Lock to working version**:
   ```ruby
   gem "problematic-gem", "1.2.3"  # Pin to working version
   ```

4. **Open issue** for investigation

### Update Strategy

For major updates:

1. Create feature branch
2. Update single dependency
3. Run full test suite
4. Review changelog for breaking changes
5. Update code if needed
6. Merge when stable

## Key Dependencies

### Core Dependencies

| Gem | Purpose | Update Frequency |
|-----|---------|------------------|
| `jekyll` | Static site generator | Monthly |
| `kramdown` | Markdown parser | As needed |
| `rouge` | Syntax highlighting | As needed |

### Theme Dependencies

| Gem | Purpose | Update Frequency |
|-----|---------|------------------|
| `bootstrap` | CSS framework | Quarterly |
| `jekyll-feed` | RSS feed | As needed |
| `jekyll-sitemap` | Sitemap generation | As needed |

## Troubleshooting

### Dependency Conflicts

```bash
# See dependency tree
bundle viz

# Resolve conflicts
bundle update --all
```

### Bundler Cache Issues

```bash
# Clear Bundler cache
bundle clean --force

# Reinstall all gems
rm Gemfile.lock
bundle install
```

### Docker Gem Issues

```bash
# Rebuild container with new gems
docker-compose down
docker-compose up --build
```

## Best Practices

1. **Regular Updates**: Keep dependencies current
2. **Test Thoroughly**: Always run tests after updates
3. **Review Changelogs**: Check for breaking changes
4. **Pin Critical Deps**: Lock versions that matter
5. **Security First**: Prioritize security updates

## Related

- [Security Scanning](/docs/development/security/)
- [CI/CD Pipeline](/docs/development/ci-cd/)
- [Testing Guide](/docs/development/testing/)
