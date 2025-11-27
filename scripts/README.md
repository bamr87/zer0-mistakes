# Scripts Directory

Automation scripts for the `jekyll-theme-zer0` gem lifecycle, release management, and feature modules.

## 📁 Directory Structure

```
scripts/
├── bin/                    # Main entry point scripts
│   ├── release             # Full release workflow (version → changelog → publish)
│   ├── build               # Standalone gem building
│   └── test                # Unified test runner
├── lib/                    # Shared library modules
│   ├── common.sh           # Logging, colors, utilities
│   ├── validation.sh       # Environment and dependency validation
│   ├── version.sh          # Version management functions
│   ├── git.sh              # Git operations
│   ├── changelog.sh        # Changelog generation
│   ├── gem.sh              # Gem build and publish
│   └── README.md           # Library documentation
├── utils/                  # Utility scripts
│   ├── setup               # Development environment setup
│   ├── analyze-commits     # Commit analysis for auto-versioning
│   └── fix-markdown        # Markdown linting auto-fix
├── features/               # Feature-specific scripts
│   ├── generate-preview-images    # AI preview image generator
│   ├── install-preview-generator  # Preview generator installer
│   └── preview_generator.py       # Python preview generator
├── test/                   # Test suites
│   ├── lib/                # Library unit tests
│   │   ├── run_tests.sh    # Test runner
│   │   ├── test_version.sh
│   │   ├── test_changelog.sh
│   │   ├── test_git.sh
│   │   ├── test_validation.sh
│   │   └── test_gem.sh
│   ├── theme/              # Theme validation tests
│   │   └── validate
│   └── integration/        # Integration tests
│       ├── auto-version
│       └── mermaid
├── README.md               # This file
├── version.sh              # DEPRECATED - use bin/release
├── setup.sh                # Legacy - see utils/setup
├── test.sh                 # Legacy - see bin/test
├── analyze-commits.sh      # Legacy - see utils/analyze-commits
├── fix-markdown-format.sh  # Legacy - see utils/fix-markdown
├── generate-preview-images.sh  # Legacy - see features/generate-preview-images
├── install-preview-generator.sh # Legacy - see features/install-preview-generator
└── example-usage.sh        # Library usage examples
```

## 🚀 Quick Start

### Release a New Version

```bash
# Full release workflow (recommended)
./scripts/bin/release patch              # Bug fix release (0.8.1 → 0.8.2)
./scripts/bin/release minor              # Feature release (0.8.1 → 0.9.0)
./scripts/bin/release major              # Breaking change (0.8.1 → 1.0.0)

# Preview without making changes
./scripts/bin/release patch --dry-run

# Build without publishing
./scripts/bin/release patch --skip-publish
```

### Run Tests

```bash
# Run all tests
./scripts/bin/test

# Run specific test suites
./scripts/bin/test lib           # Library unit tests only
./scripts/bin/test theme         # Theme validation only
./scripts/bin/test integration   # Integration tests only

# Verbose output
./scripts/bin/test --verbose
```

### Build Gem Only

```bash
./scripts/bin/build              # Build gem with current version
./scripts/bin/build --dry-run    # Preview build
```

## 📦 Entry Points (`bin/`)

### `bin/release` - Full Release Workflow

The primary release command that orchestrates the entire release process.

```bash
./scripts/bin/release [patch|minor|major] [options]
```

**Options:**
- `--dry-run` - Preview changes without executing
- `--skip-tests` - Skip running test suite
- `--skip-publish` - Build but don't publish to RubyGems
- `--no-github-release` - Skip GitHub release creation
- `--non-interactive` - No confirmation prompts
- `--verbose` - Show detailed debug output

**Workflow:**
1. Validate environment (git clean, dependencies)
2. Calculate new version
3. Generate changelog from commits
4. Update version files
5. Run tests
6. Build gem
7. Commit and tag
8. Publish to RubyGems
9. Create GitHub release
10. Push changes

### `bin/build` - Standalone Gem Building

Quick gem building without the full release workflow.

```bash
./scripts/bin/build [options]
```

### `bin/test` - Unified Test Runner

Runs all test suites with a single command.

```bash
./scripts/bin/test [lib|theme|integration|all] [options]
```

## 📚 Libraries (`lib/`)

Modular shell libraries for shared functionality. See [lib/README.md](lib/README.md) for details.

### Dependency Graph

```
common.sh (base)
    ↓
validation.sh → common.sh
version.sh → common.sh
git.sh → common.sh
    ↓
changelog.sh → common.sh, git.sh
    ↓
gem.sh → common.sh, git.sh, changelog.sh
```

### Using Libraries in Scripts

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../lib"  # Adjust path as needed

source "$LIB_DIR/common.sh"
source "$LIB_DIR/validation.sh"

# Now use library functions
log "Starting script..."
validate_git_repo
```

## 🔧 Utilities (`utils/`)

### `utils/setup` - Development Environment Setup

Sets up the development environment for gem development.

```bash
./scripts/utils/setup
```

**What it does:**
- Checks system requirements (Ruby, Bundler, jq, Git)
- Installs dependencies
- Validates gemspec
- Sets up Git hooks

### `utils/analyze-commits` - Commit Analysis

Analyzes git commits to determine appropriate semantic version bump.

```bash
./scripts/utils/analyze-commits [commit-range]
# Output: patch|minor|major|none
```

### `utils/fix-markdown` - Markdown Fixer

Automatically fixes common markdown linting violations.

```bash
./scripts/utils/fix-markdown [options]
```

## 🖼️ Features (`features/`)

### `features/generate-preview-images` - AI Preview Generator

AI-powered preview image generator for Jekyll posts.

```bash
./scripts/features/generate-preview-images [options]
```

**Options:**
- `--list-missing` - List files missing previews
- `--dry-run` - Preview without changes
- `--collection NAME` - Generate for specific collection
- `-f FILE` - Process specific file
- `--provider PROVIDER` - AI provider (openai, stability, local)

### `features/install-preview-generator` - Installer

Install the preview generator feature into any Jekyll site.

```bash
# Remote installation
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/features/install-preview-generator | bash

# Local with options
./scripts/features/install-preview-generator --dry-run
```

## 🧪 Testing (`test/`)

### Library Tests (`test/lib/`)

Unit tests for each library module.

```bash
./scripts/test/lib/run_tests.sh
```

### Theme Tests (`test/theme/`)

Theme structure and configuration validation.

```bash
./scripts/test/theme/validate
```

### Integration Tests (`test/integration/`)

End-to-end workflow tests.

```bash
./scripts/test/integration/auto-version
./scripts/test/integration/mermaid
```

## 🔄 Migration from Legacy Scripts

The following scripts are **deprecated** and will be removed in a future release:

| Legacy Script | New Location | Notes |
|--------------|--------------|-------|
| `version.sh` | `bin/release` | Use `bin/release` for full workflow |
| `setup.sh` | `utils/setup` | Same functionality |
| `test.sh` | `bin/test` or `test/theme/validate` | Unified test runner |
| `analyze-commits.sh` | `utils/analyze-commits` | Same functionality |
| `fix-markdown-format.sh` | `utils/fix-markdown` | Same functionality |
| `generate-preview-images.sh` | `features/generate-preview-images` | Same functionality |
| `install-preview-generator.sh` | `features/install-preview-generator` | Same functionality |

## 📋 Requirements

### System Dependencies

- **Bash 4.0+** - Required for associative arrays (macOS: `brew install bash`)
- **Ruby >= 2.7.0** - For gem building
- **Bundler** - For dependency management
- **jq** - For JSON processing
- **Git** - For version control

### RubyGems Publishing

For publishing gems:

1. RubyGems account at [rubygems.org](https://rubygems.org)
2. API key from account settings
3. `RUBYGEMS_API_KEY` GitHub secret for CI/CD

## 🛠️ Development Workflow

### Local Development

```bash
# 1. Set up environment
./scripts/utils/setup

# 2. Make changes to theme files

# 3. Run tests
./scripts/bin/test

# 4. Release (when ready)
./scripts/bin/release patch
```

### CI/CD Integration

The scripts integrate with GitHub Actions:

- **CI Workflow**: Tests on push/PR
- **Release Workflow**: Triggered by tags
- **Version Bump**: Manual dispatch

## 📖 Additional Documentation

- [Library Documentation](lib/README.md) - Detailed library API
- [Preview Generator Docs](/docs/features/preview-image-generator.md) - AI preview feature
- [Release Process](/docs/releases/) - Full release documentation
