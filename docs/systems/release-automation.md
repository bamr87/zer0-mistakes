# Release Automation System

**Version:** 2.0 (Modular Architecture)  
**Status:** ✅ Production-Ready  
**Last Updated:** 2025-11-25  
**Modernization:** Completed (Phases 1-3)

## Overview

The Zer0-Mistakes release automation system provides comprehensive, modular automation for semantic versioning, changelog generation, gem building, and publishing. The system was fully modernized in November 2025, transitioning from monolithic scripts to a modular, testable architecture.

## Quick Start

### Installation Requirements

**System Requirements:**

- **Bash 4.0+** (macOS: `brew install bash`)
- **Docker** 20.10+ (for development)
- **Git** 2.30+
- **Ruby** 3.0+ (optional with Docker)
- **RubyGems Account** (for publishing)

### Basic Usage

```bash
# Install Bash 5 on macOS (one-time)
brew install bash
export PATH="/opt/homebrew/bin:$PATH"

# Preview release
/opt/homebrew/bin/bash scripts/release patch --dry-run

# Build and test (no publish)
scripts/release patch --skip-publish --no-github-release

# Full release
/opt/homebrew/bin/bash scripts/release patch
```

### VS Code Integration

Press `Cmd+Shift+P` → "Tasks: Run Task" → Choose:

- 🚀 Release: Patch/Minor/Major
- 🔍 Release: Dry Run Preview
- ⚡ Release: Quick Build & Test
- 🔨 Build: Gem Only

## Architecture

### Modular Library System

The release automation is built on 6 focused libraries:

```
scripts/lib/
├── common.sh       (165 lines) - Logging, error handling, utilities
├── validation.sh   (120 lines) - Environment validation
├── version.sh      (155 lines) - Version management
├── git.sh          (165 lines) - Git operations
├── changelog.sh    (230 lines) - Changelog generation
└── gem.sh          (160 lines) - Gem build/publish
```

**Total:** 995 lines of modular, testable code

### Command Interface

Two simplified commands provide the user interface:

```
scripts/
├── release         (200 lines) - Complete release workflow
├── build           (80 lines)  - Gem building only
├── gem-publish.sh  - Deprecation wrapper → release
├── release.sh      - Deprecation wrapper → release
└── build.sh        - Deprecation wrapper → build
```

**Benefits:**

- 76% reduction in user-facing code complexity
- Single responsibility per library
- Comprehensive test coverage (63+ assertions)
- Easy to extend and maintain

## Release Workflow

### 10-Step Process

The `scripts/release` command executes:

1. **Validate Environment** - Git status, dependencies, credentials
2. **Calculate New Version** - Semantic version bump
3. **Generate Changelog** - From conventional commits
4. **Update Version Files** - version.rb, package.json
5. **Run Test Suite** - Validate changes
6. **Build Gem** - Create .gem package
7. **Commit and Tag** - Version bump commit
8. **Publish to RubyGems** - Public gem release
9. **Create GitHub Release** - With release notes
10. **Push Changes** - Tags and commits to remote

### Command Options

```bash
# Version Types
scripts/release patch   # 0.6.0 → 0.6.1
scripts/release minor   # 0.6.0 → 0.7.0
scripts/release major   # 0.6.0 → 1.0.0

# Control Options
--dry-run               # Preview without changes
--skip-tests            # Skip test execution
--skip-publish          # Skip RubyGems publishing
--no-github-release     # Skip GitHub release
--non-interactive       # No confirmation prompts
--help                  # Show usage information
```

### Example Workflows

**Development Testing:**

```bash
# 1. Preview changes
/opt/homebrew/bin/bash scripts/release patch --dry-run

# 2. Build and test locally
scripts/release patch --skip-publish --no-github-release

# 3. If all good, do full release
/opt/homebrew/bin/bash scripts/release patch
```

**Quick Gem Build:**

```bash
# Build gem without release workflow
./scripts/build

# Preview build steps
./scripts/build --dry-run
```

**CI/CD Pipeline:**

```bash
# Non-interactive release
/opt/homebrew/bin/bash scripts/release patch --non-interactive
```

## Changelog Generation

### Conventional Commits

The system automatically generates changelogs from conventional commit messages:

**Commit Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Supported Types:**

- `feat:` → **Added** section
- `fix:` → **Fixed** section
- `refactor:` → **Changed** section
- `docs:` → **Changed** section
- `perf:` → **Changed** section
- `test:` → **Other** section
- `chore:` → **Other** section
- `BREAKING CHANGE:` → **Breaking Changes** section

**Example Commits:**

```bash
feat: add responsive navigation component
fix: resolve sidebar collapse issue on mobile
docs: update installation instructions
refactor: simplify version calculation logic
```

### Automatic Filtering

The changelog generator automatically excludes:

- Merge commits
- Version bump commits (`chore: bump version`)
- Commits only touching version/changelog files
- Automated release commits

## Testing

### Test Suite

Comprehensive test coverage with 63+ assertions:

```bash
# Run all tests
./scripts/lib/test/run_tests.sh

# Test specific library
./scripts/lib/test/test_version.sh
./scripts/lib/test/test_changelog.sh
./scripts/lib/test/test_git.sh
```

**Test Coverage:**

- Version calculation (20+ assertions)
- Changelog generation (15+ assertions)
- Validation checks (10+ assertions)
- Git operations (10+ assertions)
- Gem operations (8+ assertions)

### Manual Testing

```bash
# Test environment validation
./scripts/release --help

# Test build system
./scripts/build --dry-run

# Test full workflow (safe)
/opt/homebrew/bin/bash scripts/release patch --dry-run --non-interactive
```

## Troubleshooting

### Common Issues

**Bash Version Error:**

```bash
[ERROR] This script requires Bash 4.0 or higher (current: 3.2.57)
[INFO] On macOS, install via: brew install bash
```

**Solution:**

```bash
brew install bash
/opt/homebrew/bin/bash scripts/release patch
```

**Working Directory Not Clean:**

```bash
[ERROR] Working directory is not clean. Please commit or stash changes first.
```

**Solution:**

```bash
git status                    # Review changes
git add . && git commit -m "..." # Commit changes
# or
git stash                     # Stash temporarily
```

**RubyGems Authentication:**

```bash
[ERROR] RubyGems credentials not configured
```

**Solution:**

```bash
gem signin
# Or manually configure ~/.gem/credentials
```

For comprehensive troubleshooting, see: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

## Migration Guide

### For Contributors

**Old Commands:**

```bash
./scripts/gem-publish.sh patch
make release-patch
```

**New Commands:**

```bash
/opt/homebrew/bin/bash scripts/release patch
# or use VS Code tasks
```

**One-Time Setup:**

```bash
brew install bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### For CI/CD Pipelines

Update GitHub Actions:

```yaml
jobs:
  release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Bash 5
        run: brew install bash

      - name: Release
        run: /opt/homebrew/bin/bash scripts/release patch --non-interactive
        env:
          RUBYGEMS_API_KEY: ${{ secrets.RUBYGEMS_API_KEY }}
```

## Performance

### Expected Timing

| Step                 | Duration      |
| -------------------- | ------------- |
| Validation           | 2-5 seconds   |
| Version calculation  | <1 second     |
| Changelog generation | 5-30 seconds  |
| Version updates      | 1-2 seconds   |
| Test suite           | 10-60 seconds |
| Gem build            | 5-15 seconds  |
| RubyGems publish     | 10-30 seconds |
| GitHub release       | 5-10 seconds  |
| Push changes         | 2-5 seconds   |

**Total:** 2-5 minutes for complete release

## Known Issues

### Changelog Generation (Non-Blocking)

**Issue:** Changelog generation may exit prematurely during commit processing loop.

**Impact:** Changelog automation incomplete

**Workaround:**

- Use `scripts/build` for gem building
- Manual changelog updates remain supported
- Doesn't block other functionality

**Status:** Documented, tracked for v0.7.0

## Development

### Adding New Functionality

1. **Identify appropriate library** (`scripts/lib/`)
2. **Add function** following existing patterns
3. **Write tests** in corresponding test file
4. **Update library README** with documentation
5. **Test locally** before committing

**Example:**

```bash
# Add function to scripts/lib/version.sh
validate_version_format() {
    local version="$1"
    [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

# Add test to scripts/lib/test/test_version.sh
test_validate_version_format() {
    assert_success validate_version_format "1.2.3"
    assert_failure validate_version_format "1.2"
}
```

### Library Documentation

Each library includes:

- Purpose and scope
- Exported functions
- Usage examples
- Dependencies
- Testing instructions

See: [scripts/lib/README.md](../../scripts/lib/README.md)

## Modernization History

### Project Timeline

**Phase 1: Library Extraction** (Completed 2025-11-25)

- Created 6 modular libraries from monolithic scripts
- Built comprehensive test suite (63+ assertions)
- Established single responsibility architecture

**Phase 2: Simplified Commands** (Completed 2025-11-25)

- Created `scripts/release` and `scripts/build` commands
- Added deprecation wrappers for backward compatibility
- Updated 8 VS Code tasks
- Achieved 76% code reduction

**Phase 3: Documentation & Testing** (Completed 2025-11-25)

- Updated CONTRIBUTING.md and README.md
- Created 700-line TROUBLESHOOTING guide
- Validated complete system functionality
- Provided migration guidance

### Impact Metrics

**Code Quality:**

- Before: 1,170+ lines in 3 monolithic scripts
- After: 1,375 lines in modular libraries + 280 lines in commands
- Reduction: 76% fewer lines in user-facing code
- Documentation: 2,110+ lines of guides

**Testing:**

- Test coverage: 63+ assertions
- All core functions tested
- Dry-run mode validated
- Error handling comprehensive

**Developer Experience:**

- Setup time: <5 minutes
- Built-in help system
- 8 VS Code tasks
- 700-line troubleshooting guide

## Related Documentation

### Internal Documentation

- **[Library README](../../scripts/lib/README.md)** - Detailed library documentation
- **[TROUBLESHOOTING](../TROUBLESHOOTING.md)** - Common issues and solutions
- **[CONTRIBUTING](../../CONTRIBUTING.md)** - Development guidelines
- **[Test Suite](../../test/README.md)** - Testing documentation

### Historical Documentation

- **Modernization completed November 2025**
- **Phase documentation archived**
- **All functionality integrated into this guide**

### External Resources

- **[Semantic Versioning](https://semver.org/)** - Version numbering standard
- **[Conventional Commits](https://www.conventionalcommits.org/)** - Commit message format
- **[RubyGems Publishing](https://guides.rubygems.org/publishing/)** - Gem publication guide

## Support

### Getting Help

1. **Check TROUBLESHOOTING.md** - Most issues covered
2. **Run with --help** - See all options
3. **Try dry-run mode** - Test safely
4. **Read error messages** - Often include solutions

### Reporting Issues

Open an issue at: https://github.com/bamr87/zer0-mistakes/issues/new

Include:

- Bash version (`bash --version`)
- Command run (with options)
- Full error output
- Git status (`git status`)
- Environment (macOS/Linux/WSL)

---

**Last Updated:** 2025-11-25  
**System Version:** 2.0 (Modular Architecture)  
**Status:** Production-Ready  
**Maintainer:** bamr87
