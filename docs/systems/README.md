# System Documentation

Infrastructure, CI/CD, release automation, and dependency management for the Zer0-Mistakes Jekyll theme.

## Contents

| Document | Description |
|----------|-------------|
| [Release Automation](release-automation.md) | Canonical 10-step release workflow via `scripts/bin/release` |
| [Automated Version System](automated-version-system.md) | Conventional-commit analysis and semantic version bumping |
| [Gem Publication System](gem-publication-system.md) | Building and publishing to RubyGems.org |
| [Implementation Summary](implementation-summary.md) | What the automation system does and how it was built |
| [CI/CD Status Report](cicd-status-report.md) | GitHub Actions pipeline: stages, matrix, and current status |
| [Dependency Management](dependency-management.md) | Zero Pin + Lockfile + weekly automated update strategy |
| [Ruby Version Management](ruby-version-management.md) | Why Ruby 3.3, upgrade path, CI matrix |
| [GitHub Secrets Setup](github-secrets-setup.md) | Required GitHub Actions secrets (Docker Hub, RubyGems) |
| [Zero Pin Strategy](ZERO_PIN_STRATEGY.md) | Rationale for unpinned Gemfile with committed lockfile |

## Quick Reference

```bash
# Release (patch / minor / major)
./scripts/bin/release patch
./scripts/bin/release patch --dry-run   # preview

# Troubleshoot
docs/development/troubleshooting.md

# Dependency updates
bundle update && bundle exec jekyll build
```

## Related

- [Development Setup](../development/local-setup.md)
- [Troubleshooting](../development/troubleshooting.md)
- [Releases](../releases/)
