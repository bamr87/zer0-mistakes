# 🤖 Automated Version Bump System

This system automatically analyzes commits pushed to the main branch and performs appropriate version bumps with automated releases.

## 🚀 How It Works

### 1. Trigger Conditions

The automated version bump workflow triggers when:

- Code is pushed to the `main` branch
- The commit is not from GitHub Actions (prevents infinite loops)
- Changes are made to significant files (excludes docs, workflows, etc.)

### 2. Commit Analysis

The system analyzes commit messages and file changes to determine the appropriate version bump:

#### Version Bump Rules

- **MAJOR (X.0.0)**: Breaking changes, major refactors
  - Commit messages: `BREAKING CHANGE:`, `breaking:`, `major:`
  - Significant changes to critical files (Gemfile, gemspec, configs)

- **MINOR (0.X.0)**: New features, enhancements
  - Commit messages: `feat:`, `feature:`, `add:`, `new:`
  - Addition of new layouts, includes, or major functionality

- **PATCH (0.0.X)**: Bug fixes, small improvements, maintenance
  - Commit messages: `fix:`, `bug:`, `patch:`, `chore:`, `docs:`
  - Small changes, documentation updates, dependency updates

### 3. Automated Process

When triggered, the system:

1. **Analyzes** all commits since the last version tag
2. **Determines** the highest appropriate version bump type
3. **Generates** changelog from commit history using conventional commit patterns
4. **Updates** version files (`lib/jekyll-theme-zer0/version.rb`, `package.json`)
5. **Runs** validation tests
6. **Builds** the gem package
7. **Publishes** to RubyGems.org
8. **Creates** GitHub release with automated release notes
9. **Commits** and pushes version bump changes

## 📋 Conventional Commit Format

To ensure proper automatic version bumping, use conventional commit messages:

```bash
# New features (MINOR bump)
git commit -m "feat: add responsive navigation menu"
git commit -m "feature: implement user authentication"

# Bug fixes (PATCH bump)
git commit -m "fix: resolve mobile layout issue"
git commit -m "bug: correct typo in footer"

# Breaking changes (MAJOR bump)
git commit -m "feat: redesign theme structure

BREAKING CHANGE: This updates the layout structure and requires manual migration"

# Maintenance (PATCH bump)
git commit -m "chore: update dependencies"
git commit -m "docs: improve installation instructions"
```

## 🛠️ Manual Override

If you need to manually trigger a version bump or override the automation:

```bash
# Manual version bump (bypasses automation)
./scripts/gem-publish.sh [patch|minor|major]

# Preview what automation would do
./scripts/analyze-commits.sh HEAD~5..HEAD

# Test the system
./scripts/test-auto-version.sh
```

## 🔧 Configuration

### Workflow Configuration

The automation is configured in `.github/workflows/auto-version-bump.yml`:

- **Trigger paths**: Excludes changelog, version files, docs, workflows
- **Safety checks**: Prevents infinite loops from automated commits
- **Error handling**: Comprehensive validation and rollback capabilities

### Script Configuration

Key scripts and their purposes:

- `scripts/analyze-commits.sh`: Analyzes commit history for version bump determination
- `scripts/gem-publish.sh`: Enhanced publication script with automation support
- `scripts/test-auto-version.sh`: Comprehensive test suite for the automation system

## 🚫 Preventing Automation

To skip automated version bumping on specific commits:

```bash
# Include [skip-release] in commit message
git commit -m "docs: update README [skip-release]"

# Or push to a different branch first
git push origin feature-branch
# Create PR instead of direct push to main
```

## 📊 Monitoring

The automation system provides:

- **Detailed logs** in GitHub Actions workflow runs
- **Release notes** automatically generated from commit history
- **Error notifications** if the automation fails
- **Manual fallback** procedures if intervention is needed

## 🧪 Testing

Test the automation system locally:

```bash
# Run full test suite
./scripts/test-auto-version.sh

# Test commit analysis only
./scripts/analyze-commits.sh HEAD~3..HEAD

# Test publication script with automation
./scripts/gem-publish.sh patch --dry-run --automated-release
```

## 🔍 Troubleshooting

### Common Issues

1. **Infinite Loop Protection**
   - The workflow skips if commit author is 'github-actions'
   - Version bump commits include 'chore: bump version' pattern

2. **No Version Bump Triggered**
   - Check commit messages follow conventional format
   - Verify changes aren't in excluded paths
   - Review workflow conditions and filters

3. **Publication Failures**
   - Validate RubyGems credentials in repository secrets
   - Check gem specification and dependencies
   - Review build logs for detailed error messages

4. **Manual Recovery**
   ```bash
   # If automation fails, recover manually:
   git tag -d v[version]  # Remove failed tag
   ./scripts/gem-publish.sh [type] --skip-publish  # Test locally
   ./scripts/gem-publish.sh [type]  # Full release
   ```

## 🎯 Best Practices

1. **Use Conventional Commits**: Ensures proper categorization and version bumping
2. **Small, Focused Commits**: Makes analysis more accurate and changelogs cleaner
3. **Test Before Pushing**: Use `--dry-run` options to preview changes
4. **Monitor Automation**: Review automated releases for accuracy
5. **Manual Override When Needed**: Don't hesitate to use manual processes for complex releases

---

_This automated system follows semantic versioning and conventional commit standards to provide reliable, hands-off release management while maintaining full manual control when needed._
