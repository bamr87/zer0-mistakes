# GitHub Actions Workflows

This directory contains the CI/CD workflows for the zer0-mistakes Jekyll theme.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKFLOW TRIGGERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to main ──────► version-bump.yml ──────► Creates tag v*   │
│                       (analyzes commits)                         │
│                                                                  │
│  Tag v* pushed ─────► release.yml ───────────► Publishes gem    │
│                                               + GitHub release   │
│                                                                  │
│  Push/PR ───────────► ci.yml ────────────────► Tests + Quality  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Workflows

### 1. `ci.yml` - Continuous Integration Pipeline

**Triggers:** Push to `main`/`develop`, Pull Requests, Daily schedule, Manual dispatch

The comprehensive CI pipeline that validates code quality, runs tests, and builds the gem.

#### Jobs:
| Job | Description | Timeout |
|-----|-------------|---------|
| `fast-checks` | Quick syntax validation | 5 min |
| `quality-checks` | Linting, security audit, markdown checks | 10 min |
| `test` | Full test suite across Ruby 3.0, 3.2, 3.3 | 15 min |
| `build` | Gem build and validation | 10 min |
| `performance` | Jekyll build performance (scheduled/comprehensive) | 15 min |
| `integration` | Docker integration tests (main branch) | 10 min |
| `summary` | Final status report | - |

#### Manual Dispatch Options:
- **test_scope**: `fast`, `standard`, or `comprehensive`
- **fix_markdown**: Auto-fix markdown formatting issues

---

### 2. `version-bump.yml` - Version Management

**Triggers:** Push to `main` (with commit analysis), Manual dispatch

Handles both automatic and manual version bumping with semantic versioning.

#### Automatic Mode (Push to main):
1. Analyzes commits since last tag using `scripts/analyze-commits.sh`
2. Determines bump type based on commit messages:
   - `feat:` → minor bump
   - `fix:` → patch bump
   - `BREAKING CHANGE:` → major bump
3. Updates version files and CHANGELOG.md
4. Creates and pushes tag (triggers `release.yml`)

#### Manual Mode (workflow_dispatch):
| Input | Options | Description |
|-------|---------|-------------|
| `version_type` | `patch`, `minor`, `major`, `auto` | Version bump type |
| `skip_tests` | `true`/`false` | Skip test execution |
| `dry_run` | `true`/`false` | Preview without changes |

#### Skip Conditions:
- Commits containing "chore: bump version"
- Commits from github-actions bot
- Changes only in: CHANGELOG.md, version.rb, workflows, docs

---

### 3. `release.yml` - Gem Publishing & GitHub Releases

**Triggers:** Tag push (`v*`), Manual dispatch

Unified release workflow that publishes to RubyGems and creates GitHub releases.

#### Jobs:
| Job | Description | Condition |
|-----|-------------|-----------|
| `validate` | Version consistency, test suite | Always |
| `build` | Build gem, generate install script | After validate |
| `publish-gem` | Publish to RubyGems | Tag push or manual with publish_gem |
| `github-release` | Create GitHub release with assets | After build |
| `summary` | Release pipeline summary | Always |

#### Manual Dispatch Options:
| Input | Type | Description |
|-------|------|-------------|
| `tag` | string | Tag to release (e.g., `v0.8.0`) |
| `publish_gem` | boolean | Publish to RubyGems |
| `draft` | boolean | Create as draft release |
| `prerelease` | boolean | Mark as prerelease |

#### Environment Requirements:
- **`production`** environment approval for RubyGems publishing
- **`RUBYGEMS_API_KEY`** secret for gem publishing

---

## Workflow Dependencies

```yaml
# Required Secrets
GITHUB_TOKEN       # Automatically provided
RUBYGEMS_API_KEY   # Required for gem publishing

# Required Environment
production         # For publish-gem job approval gate
```

## Composite Actions Used

All workflows use shared composite actions from `.github/actions/`:

- `setup-ruby` - Ruby environment setup with bundler cache
- `configure-git` - Git configuration for automated commits
- `test-suite` - Comprehensive test execution
- `quality-checks` - Code quality validation
- `prepare-release` - Build gem and prepare release assets

See [`.github/actions/README.md`](../actions/README.md) for action documentation.

## Local Development

To test workflows locally before pushing:

```bash
# Preview version bump
./scripts/release patch --dry-run

# Build gem locally
./scripts/build

# Run tests
./test/test_runner.sh --verbose

# Analyze commits for version bump type
./scripts/analyze-commits.sh HEAD~5..HEAD
```

## Troubleshooting

### Version bump not triggering
- Check that commit doesn't contain "chore: bump version"
- Verify paths-ignore isn't matching your changes
- Ensure commit author isn't "github-actions"

### Release workflow not starting
- Verify tag follows `v*` pattern (e.g., `v0.8.0`)
- Check that version in `lib/jekyll-theme-zer0/version.rb` matches tag

### Gem publish failing
- Verify `RUBYGEMS_API_KEY` secret is set
- Check production environment approval
- Ensure gem version doesn't already exist on RubyGems

### CI failures
- Check individual job logs for specific errors
- Run tests locally: `./test/test_runner.sh`
- Validate gem: `./scripts/build && gem spec jekyll-theme-zer0-*.gem`
