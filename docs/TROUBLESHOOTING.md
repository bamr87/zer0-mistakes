# Troubleshooting Guide: Release Automation System

**Last Updated:** 2025-11-25  
**Applies To:** Release automation scripts (v0.6.0+)  
**Related:** [Release Automation System](systems/release-automation.md), [Contributing Guidelines](../CONTRIBUTING.md)

## Quick Reference

| Issue | Solution | Section |
|-------|----------|---------|
| Bash version error | Install Bash 4.0+ | [Bash Version Issues](#bash-version-issues) |
| Working directory not clean | Commit or stash changes | [Git Issues](#git-issues) |
| RubyGems authentication failed | Configure credentials | [RubyGems Issues](#rubygems-issues) |
| Changelog generation fails | Check commit format | [Changelog Issues](#changelog-issues) |
| Docker container errors | Rebuild containers | [Docker Issues](#docker-issues) |

## System Requirements

### Verified Platforms

✅ **macOS**
- macOS 12.0+ (Monterey)
- Apple Silicon (M1/M2/M3) and Intel
- Bash 4.0+ installed via Homebrew

✅ **Linux**
- Ubuntu 20.04+
- Debian 11+
- Fedora 35+
- Bash 4.0+ (usually pre-installed)

✅ **Windows**
- WSL2 (Windows Subsystem for Linux)
- Ubuntu 20.04+ or Debian 11+
- Bash 4.0+ in WSL environment

### Required Software Versions

| Software | Minimum Version | Recommended | Notes |
|----------|----------------|-------------|-------|
| Bash | 4.0 | 5.3+ | Required for associative arrays |
| Docker | 20.10 | 24.0+ | For containerized development |
| Git | 2.30 | 2.43+ | For version control |
| Ruby | 3.0 | 3.2+ | For gem building (optional with Docker) |
| Bundler | 2.0 | 2.5+ | For dependency management |

## Common Issues

### Bash Version Issues

#### Problem: "This script requires Bash 4.0 or higher"

**Error Message:**
```bash
[ERROR] This script requires Bash 4.0 or higher (current: 3.2.57)
[INFO] On macOS, install via: brew install bash
[INFO] Then run with: /opt/homebrew/bin/bash scripts/release
```

**Cause:** macOS ships with Bash 3.2 (released 2006) due to GPL licensing. The release automation uses associative arrays, which require Bash 4.0+.

**Solutions:**

**Option 1: Install Modern Bash (Recommended)**
```bash
# Install Bash 5 via Homebrew
brew install bash

# Verify installation
/opt/homebrew/bin/bash --version
# Should show: GNU bash, version 5.3.3 or higher

# Run release command with Bash 5
/opt/homebrew/bin/bash scripts/release patch --dry-run
```

**Option 2: Add to PATH**
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="/opt/homebrew/bin:$PATH"

# Reload shell
source ~/.zshrc

# Verify (should show Bash 5)
bash --version

# Now can run normally
./scripts/release patch --dry-run
```

**Option 3: Create Alias**
```bash
# Add to ~/.zshrc
alias release='/opt/homebrew/bin/bash scripts/release'
alias build='/opt/homebrew/bin/bash scripts/build'

# Usage
release patch --dry-run
build --dry-run
```

#### Problem: "declare: -A: invalid option"

**Error Message:**
```bash
/Users/bamr87/github/zer0-mistakes/scripts/lib/changelog.sh: line 115: declare: -A: invalid option
declare: usage: declare [-afFirtx] [-p] [name[=value] ...]
```

**Cause:** Script running with Bash 3.2 instead of Bash 4.0+.

**Solution:** Same as above - install and use Bash 5.

### Git Issues

#### Problem: "Working directory is not clean"

**Error Message:**
```bash
[ERROR] Working directory is not clean. Please commit or stash changes first.
```

**Cause:** You have uncommitted changes in your working directory. The release process requires a clean state to track changes accurately.

**Solutions:**

**Option 1: Commit Changes**
```bash
# Review changes
git status

# Stage and commit
git add .
git commit -m "chore: prepare for release"

# Run release
/opt/homebrew/bin/bash scripts/release patch
```

**Option 2: Stash Changes**
```bash
# Stash uncommitted changes
git stash push -u -m "WIP: temp stash for release"

# Run release
/opt/homebrew/bin/bash scripts/release patch

# Restore changes
git stash pop
```

**Option 3: Use Dry-Run Mode**
```bash
# If just testing, use dry-run (still requires clean directory)
git stash
/opt/homebrew/bin/bash scripts/release patch --dry-run
git stash pop
```

#### Problem: "No commits found since last tag"

**Error Message:**
```bash
[WARN] No commits found since v0.6.0
```

**Cause:** No new commits since the last release tag.

**Solutions:**

**If this is expected:**
```bash
# This is just a warning - release will continue
# But changelog will be empty
```

**If you expect commits:**
```bash
# Check commit history
git log --oneline v0.6.0..HEAD

# If commits exist, check conventional commit format
git log --pretty=format:"%s" v0.6.0..HEAD
```

### RubyGems Issues

#### Problem: "RubyGems API key not configured"

**Error Message:**
```bash
[ERROR] RubyGems credentials not configured
```

**Cause:** No RubyGems API key found in `~/.gem/credentials`.

**Solutions:**

**Option 1: Configure API Key**
```bash
# Get API key from https://rubygems.org/profile/edit
# Then configure:
gem signin

# Or manually:
mkdir -p ~/.gem
cat > ~/.gem/credentials << 'EOF'
---
:rubygems_api_key: YOUR_API_KEY_HERE
EOF
chmod 600 ~/.gem/credentials
```

**Option 2: Skip Publishing (for testing)**
```bash
# Build and test without publishing
/opt/homebrew/bin/bash scripts/release patch --skip-publish --no-github-release
```

#### Problem: "Gem push failed: 403 Forbidden"

**Cause:** Invalid or expired API key, or insufficient permissions.

**Solutions:**

```bash
# Re-authenticate with RubyGems
gem signin

# Verify credentials
cat ~/.gem/credentials

# Check gem ownership
gem owner jekyll-theme-zer0

# If not an owner, request access from bamr87
```

### Changelog Issues

#### Problem: "Changelog generation produces empty sections"

**Cause:** Commits don't follow conventional commit format.

**Conventional Commit Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Valid Types:**
- `feat:` - New features → **Added** section
- `fix:` - Bug fixes → **Fixed** section
- `docs:` - Documentation → **Changed** section
- `refactor:` - Code refactoring → **Changed** section
- `style:` - Code style → **Changed** section
- `test:` - Tests → **Other** section
- `chore:` - Maintenance → **Other** section
- `perf:` - Performance → **Changed** section
- `ci:` - CI/CD → **Other** section

**Solutions:**

**Check recent commits:**
```bash
# View commits since last tag
git log --oneline v0.6.0..HEAD

# Check commit format
git log --pretty=format:"%s" v0.6.0..HEAD
```

**Amend last commit:**
```bash
# If last commit needs fixing
git commit --amend -m "feat: add new feature description"
```

**Rewrite commit history (advanced):**
```bash
# Interactive rebase to fix multiple commits
git rebase -i v0.6.0

# Change 'pick' to 'reword' for commits to fix
# Save and update commit messages
```

#### Problem: "Changelog includes version bump commits"

**Cause:** The changelog generator filters these out automatically, but you might see them in raw git log.

**Expected Behavior:** Commits matching these patterns are automatically excluded:
- `chore: bump version`
- `chore: release version`
- `chore: update changelog`
- Merge commits
- Commits only touching `CHANGELOG.md`, `lib/*/version.rb`, `package.json`

**No action needed** - this is working as designed.

### Docker Issues

#### Problem: "Docker daemon not running"

**Error Message:**
```bash
Cannot connect to the Docker daemon
```

**Solutions:**

```bash
# macOS: Start Docker Desktop
open /Applications/Docker.app

# Linux: Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker is running
docker ps
```

#### Problem: "Port 4000 already in use"

**Error Message:**
```bash
Error: bind: address already in use
```

**Solutions:**

**Option 1: Stop conflicting service**
```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Restart Docker Compose
docker-compose up
```

**Option 2: Use different port**
```bash
# Edit docker-compose.yml
ports:
  - "4001:4000"

# Or use environment variable
PORT=4001 docker-compose up
```

#### Problem: "Container build fails on Apple Silicon"

**Cause:** Architecture mismatch between Apple Silicon (ARM64) and container images (AMD64).

**Solution:**

Our `docker-compose.yml` already includes:
```yaml
platform: linux/amd64
```

If still having issues:
```bash
# Rebuild with platform flag
docker-compose down
docker-compose build --platform linux/amd64
docker-compose up
```

### Test Suite Issues

#### Problem: "Tests fail but release continues"

**Error Message:**
```bash
[ERROR] Some tests failed
[INFO] Use --skip-tests to bypass this check
```

**Cause:** Test failures block the release by default (good!).

**Solutions:**

**Option 1: Fix tests (recommended)**
```bash
# Run tests to see failures
./test/test_runner.sh --verbose

# Fix issues
# Re-run tests
./test/test_runner.sh

# Then release
/opt/homebrew/bin/bash scripts/release patch
```

**Option 2: Skip tests (not recommended)**
```bash
# Only for emergency hotfixes
/opt/homebrew/bin/bash scripts/release patch --skip-tests
```

#### Problem: "Library tests pass but release tests fail"

**Cause:** Integration issues between components.

**Solutions:**

```bash
# Run specific test suite
./test/test_core.sh
./test/test_deployment.sh
./test/test_quality.sh

# Check for environment issues
./test/test_runner.sh --verbose

# Verify all dependencies
bundle install
```

## VS Code Integration Issues

### Problem: Tasks don't appear in VS Code

**Cause:** Tasks not properly loaded or workspace not configured.

**Solutions:**

```bash
# Reload VS Code window
# Cmd+Shift+P → "Developer: Reload Window"

# Verify tasks.json exists
ls -la .vscode/tasks.json

# Manually run task command
/opt/homebrew/bin/bash scripts/release --help
```

### Problem: Task runs but uses old script

**Cause:** Tasks pointing to deprecated wrapper scripts.

**Solutions:**

```bash
# Check what task executes
cat .vscode/tasks.json | grep "command.*release"

# Should show: ${workspaceFolder}/scripts/release
# NOT: ${workspaceFolder}/scripts/gem-publish.sh

# If incorrect, update tasks.json or pull latest:
git pull origin main .vscode/tasks.json
```

## Performance Issues

### Problem: "Changelog generation is slow"

**Cause:** Large commit history or complex repository.

**Expected Time:**
- Small repos (<100 commits): <5 seconds
- Medium repos (100-1000 commits): 5-30 seconds
- Large repos (>1000 commits): 30-120 seconds

**Solutions:**

**If unreasonably slow:**
```bash
# Check commit count since last tag
git rev-list --count v0.6.0..HEAD

# Use shallow clone for testing
git clone --depth 50 <repo-url>

# Or limit changelog range
# (modify scripts/lib/changelog.sh if needed)
```

### Problem: "Release process takes too long"

**Typical Times:**
1. Validation: 2-5 seconds
2. Version calculation: <1 second
3. Changelog generation: 5-30 seconds
4. Version file updates: 1-2 seconds
5. Test suite: 10-60 seconds
6. Gem build: 5-15 seconds
7. Commit & tag: 2-3 seconds
8. Gem publish: 10-30 seconds
9. GitHub release: 5-10 seconds
10. Push changes: 2-5 seconds

**Total Expected Time:** 2-5 minutes

**If significantly slower:**
```bash
# Run with timing info
time /opt/homebrew/bin/bash scripts/release patch --dry-run

# Check for network issues
ping rubygems.org
ping github.com

# Use local testing
./scripts/release patch --skip-publish --no-github-release
```

## Getting Help

### Before Asking for Help

1. **Check this guide** - Most issues are covered here
2. **Read error messages carefully** - They often include solutions
3. **Run with `--help`** - See all available options
4. **Try dry-run mode** - Test without making changes

### Diagnostic Commands

```bash
# System information
bash --version
docker --version
git --version
ruby --version

# Environment check
./scripts/release --help
./test/test_runner.sh

# Git status
git status
git log --oneline -10

# Docker status
docker ps
docker-compose config
```

### Where to Get Help

1. **[GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)** - Bug reports and feature requests
2. **[GitHub Discussions](https://github.com/bamr87/zer0-mistakes/discussions)** - Questions and community help
3. **[Contributing Guide](../CONTRIBUTING.md)** - Development guidelines
4. **[Documentation](README.md)** - Comprehensive documentation center

### Creating Good Bug Reports

Include in your issue:

```markdown
## Environment
- OS: macOS 14.5 (Sonoma)
- Bash version: 5.3.3
- Docker version: 24.0.6
- Ruby version: 3.2.2

## Steps to Reproduce
1. Run command: /opt/homebrew/bin/bash scripts/release patch
2. See error at step 3 (changelog generation)

## Expected Behavior
Should generate changelog with recent commits

## Actual Behavior
Error: declare: -A: invalid option

## Additional Context
```bash
$ git log --oneline v0.6.0..HEAD
32755cd refactor: implement modular release automation
b7ad237 Update README.md for version 0.6.0
```
```

## Advanced Topics

### Custom Changelog Categories

If you need custom commit categorization, modify `scripts/lib/changelog.sh`:

```bash
# Function: categorize_commit
# Add custom patterns:
elif echo "$subject" | grep -qiE "^(breaking|major):"; then
    echo "breaking"
```

### Debugging Script Execution

```bash
# Enable debug output
export DEBUG=true
/opt/homebrew/bin/bash scripts/release patch --dry-run

# Or use bash debug mode
/opt/homebrew/bin/bash -x scripts/release patch --dry-run 2>&1 | less

# Check specific library
/opt/homebrew/bin/bash scripts/lib/test/run_tests.sh
```

### CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Install Bash 5
  run: |
    if [[ "$OSTYPE" == "darwin"* ]]; then
      brew install bash
    fi

- name: Release
  run: |
    /opt/homebrew/bin/bash scripts/release patch --non-interactive
  env:
    RUBYGEMS_API_KEY: ${{ secrets.RUBYGEMS_API_KEY }}
```

## Changelog

### 2025-11-25
- Initial troubleshooting guide created
- Documented Bash version requirements
- Added common error solutions
- Included diagnostic commands

---

**Need more help?** Open an issue: https://github.com/bamr87/zer0-mistakes/issues/new
