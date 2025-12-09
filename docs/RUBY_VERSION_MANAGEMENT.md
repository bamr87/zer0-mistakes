# Ruby Version Management Strategy

## Overview

This document explains our Ruby version management strategy for the Zer0-Mistakes Jekyll theme, including why we pin specific Ruby versions in Docker and how to handle Ruby upgrades safely.

## Current Ruby Version Strategy

### Production & Development
- **Docker**: Ruby 3.3-slim
- **CI Test Matrix**: Ruby 3.2, 3.3
- **Rationale**: Balance between modern features and gem ecosystem compatibility

### Why Not Ruby 3.4 (Latest)?

Ruby 3.4 introduced breaking changes to native extension APIs that affect many gems:

1. **Native Extension Breakage**: Changed function signatures (e.g., `rb_hash_foreach`)
2. **Old Gem Incompatibility**: Legacy gems like `posix-spawn@0.3.15` fail to compile
3. **Ecosystem Lag**: Many gems haven't updated for Ruby 3.4 compatibility yet

## The Problem We Solved

### Initial Issue (December 2025)
```
Error: posix-spawn (0.3.15) failed to compile on Ruby 3.4
Cause: github-pages v39 (from 2015) depends on incompatible gems
Result: Docker build failures in test-latest workflow
```

### Root Causes
1. **Gemfile.lock contained ancient dependencies** (github-pages v39 from 2015)
2. **Dockerfile used `ruby:slim`** which resolved to Ruby 3.4
3. **test-latest workflow** didn't update dependencies before building
4. **Native C extensions** in old gems incompatible with Ruby 3.4 API changes

## Solution Architecture

### 1. Pin Ruby Version in Dockerfile
```dockerfile
# Before: FROM ruby:slim AS base
# After: 
FROM ruby:3.3-slim AS base
```

**Benefits:**
- Aligns with CI test matrix
- Stable gem ecosystem compatibility
- Predictable behavior across environments

### 2. Update Dependencies in test-latest Workflow
```yaml
- name: Update Dependencies to Latest
  run: |
    docker run --rm -v "$PWD:/site" -w /site ruby:3.3-slim bash -c '
      apt-get update -qq && apt-get install -y build-essential git && 
      gem install bundler -v "~> 2.3" && 
      bundle update --all
    '
```

**Benefits:**
- Actually tests with latest compatible versions
- Catches dependency issues early
- Ensures Gemfile.lock stays current

### 3. Regular Dependency Updates
Our automated dependency update workflow runs weekly to keep gems current while Ruby version stays stable.

## How to Upgrade Ruby Version Safely

### Pre-Upgrade Checklist
1. ✅ Check Ruby release notes for breaking changes
2. ✅ Update Gemfile.lock with `bundle update`
3. ✅ Test in local Docker environment
4. ✅ Verify all native extensions compile
5. ✅ Run full test suite
6. ✅ Update CI test matrix

### Upgrade Process

#### Step 1: Update Test Matrix First
```yaml
# .github/workflows/ci.yml
matrix:
  ruby: ['3.3', '3.4']  # Add new version
```

#### Step 2: Update Dependencies
```bash
# Update to latest compatible versions
bundle update

# Check for warnings
bundle install --verbose
```

#### Step 3: Update Dockerfile
```dockerfile
# Only after CI passes with new Ruby version
FROM ruby:3.4-slim AS base
# ... 
FROM ruby:3.4-slim AS production
```

#### Step 4: Monitor & Rollback Plan
- Watch CI for 1-2 days
- Keep old Ruby version in git history
- Document any gem-specific issues

## Common Issues & Solutions

### Issue 1: Native Extension Compilation Failures
**Symptom**: `make failed, exit code 2` during gem installation

**Solution:**
```bash
# Option A: Update the gem
bundle update <gem-name>

# Option B: Pin Ruby to compatible version
# Dockerfile: FROM ruby:3.3-slim

# Option C: Replace problematic gem
# Check if newer alternatives exist
```

### Issue 2: API Compatibility Warnings
**Symptom**: Deprecation warnings or changed behavior

**Solution:**
```bash
# Check gem compatibility
gem list | grep <gem-name>

# Update or pin specific gem version
bundle update <gem-name>
# OR in Gemfile:
gem '<gem-name>', '~> X.Y'
```

### Issue 3: test-latest Workflow Failures
**Symptom**: Latest dependencies test fails but regular CI passes

**Solution:**
1. Check if it's a Ruby version issue or gem incompatibility
2. Update Gemfile.lock: `bundle update --all`
3. Test locally with same Ruby version
4. Consider pinning problematic gems temporarily

## Monitoring & Maintenance

### Weekly Tasks
- ✅ Review automated dependency update PRs
- ✅ Check for gem security vulnerabilities
- ✅ Monitor test-latest workflow results

### Monthly Tasks
- ✅ Review Ruby release notes
- ✅ Check gem compatibility status
- ✅ Update documentation if strategy changes

### Quarterly Tasks
- ✅ Evaluate Ruby version upgrade
- ✅ Review CI test matrix
- ✅ Update base images (security patches)

## Decision Matrix: When to Upgrade Ruby

| Criteria | Upgrade Now | Wait |
|----------|-------------|------|
| Ruby EOL approaching | ✅ | ❌ |
| All gems compatible | ✅ | ❌ |
| Security fixes needed | ✅ | ❌ |
| Breaking changes present | ❌ | ✅ |
| Gem ecosystem unstable | ❌ | ✅ |
| Active project development | ✅ | ❌ |

## Ruby Version Lifecycle

### Supported Versions (as of 2025)
- **Ruby 3.3**: Current stable (✅ Recommended)
- **Ruby 3.2**: Stable, widely supported
- **Ruby 3.1**: EOL March 2025 (⚠️ Avoid)
- **Ruby 3.0**: EOL March 2024 (❌ Unsupported)

### Our Policy
1. **Use latest stable** that gem ecosystem supports
2. **Test new versions** in CI before production
3. **Drop EOL versions** from CI within 3 months
4. **Document breaking changes** when they occur

## References

- [Ruby Release History](https://www.ruby-lang.org/en/downloads/releases/)
- [Ruby Maintenance Schedule](https://endoflife.date/ruby)
- [Bundler Best Practices](https://bundler.io/guides/best_practices.html)
- [Our CI Configuration](.github/workflows/ci.yml)
- [Dependency Management](DEPENDENCY_MANAGEMENT.md)

## Related Documentation

- [DEPENDENCY_MANAGEMENT.md](DEPENDENCY_MANAGEMENT.md) - Gem version strategy
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common build issues
- [docker/Dockerfile](../docker/Dockerfile) - Build configuration

---

**Last Updated**: December 2025  
**Ruby Version**: 3.3  
**Status**: Active
