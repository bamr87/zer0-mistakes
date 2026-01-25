---
title: Scripts
description: Guide to the shell script automation library for building, testing, and releasing the Zer0-Mistakes theme.
layout: default
categories:
    - docs
    - development
tags:
    - scripts
    - automation
    - bash
    - utilities
permalink: /docs/development/scripts/
difficulty: intermediate
estimated_time: 15 minutes
prerequisites:
    - Bash shell
    - Docker (optional)
sidebar:
    nav: docs
---

# Shell Script Automation Library

The Zer0-Mistakes theme includes a comprehensive library of shell scripts for automating common development tasks.

## Script Inventory

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `version.sh` | Semantic version management | `./scripts/version.sh [patch\|minor\|major]` |
| `build.sh` | Build Jekyll site and gem | `./scripts/build.sh` |
| `release.sh` | Complete release workflow | `./scripts/release.sh` |
| `setup.sh` | Initial project setup | `./scripts/setup.sh` |

### Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `convert-notebooks.sh` | Convert Jupyter notebooks | `./scripts/convert-notebooks.sh` |
| `generate-preview-images.sh` | Generate post previews | `./scripts/generate-preview-images.sh` |
| `analyze-commits.sh` | Analyze commit history | `./scripts/analyze-commits.sh` |
| `fix-markdown-format.sh` | Fix Markdown formatting | `./scripts/fix-markdown-format.sh` |

## Version Management

### `version.sh`

Manages semantic versioning for the theme:

```bash
# Bump patch version (0.0.x) - bug fixes
./scripts/version.sh patch

# Bump minor version (0.x.0) - new features
./scripts/version.sh minor

# Bump major version (x.0.0) - breaking changes
./scripts/version.sh major

# Preview changes (dry run)
./scripts/version.sh patch --dry-run
```

**What it does:**
- Updates `lib/jekyll-theme-zer0/version.rb`
- Updates `package.json`
- Creates git commit and tag
- Optionally pushes to remote

## Building

### `build.sh`

Builds the Jekyll site and gem package:

```bash
# Standard build
./scripts/build.sh

# Clean build (removes _site first)
./scripts/build.sh --clean

# Build gem only
./scripts/build.sh --gem-only

# Build site only
./scripts/build.sh --site-only
```

**Output:**
- `_site/` - Built Jekyll site
- `jekyll-theme-zer0-X.Y.Z.gem` - Gem package

## Releasing

### `release.sh`

Complete release workflow automation:

```bash
# Full release (tests, build, publish)
./scripts/release.sh

# Skip tests
./scripts/release.sh --skip-tests

# Dry run (preview only)
./scripts/release.sh --dry-run

# Create draft release
./scripts/release.sh --draft

# Mark as prerelease
./scripts/release.sh --prerelease
```

**Release steps:**
1. Run test suite
2. Build gem package
3. Publish to RubyGems.org
4. Create GitHub release
5. Upload assets

## Setup

### `setup.sh`

Initial project setup for new contributors:

```bash
# Full setup
./scripts/setup.sh

# Skip dependency installation
./scripts/setup.sh --skip-deps

# Docker-only setup
./scripts/setup.sh --docker
```

**What it configures:**
- Ruby environment
- Bundler dependencies
- Docker containers
- Git hooks

## Script Development Standards

### Template Structure

```bash
#!/bin/bash
#
# Script Name: example.sh
# Description: Brief description
# Usage: ./scripts/example.sh [options]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logging functions
log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1" >&2; }

# Error handling
trap 'log_error "Error on line $LINENO"' ERR

# Main function
main() {
    log_info "Starting script..."
    # Script logic here
    log_success "Done!"
}

main "$@"
```

### Error Handling

Always use strict mode:

```bash
set -euo pipefail

# -e: Exit on error
# -u: Error on undefined variables
# -o pipefail: Fail on pipe errors
```

### Logging Functions

Consistent colored output:

```bash
log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}
```

### Parameter Validation

```bash
# Validate required arguments
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <argument>"
    exit 1
fi

# Validate specific values
case "$1" in
    patch|minor|major)
        VERSION_TYPE="$1"
        ;;
    *)
        log_error "Invalid version type"
        exit 1
        ;;
esac
```

### Environment Detection

```bash
# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        MINGW*)     echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64)     echo "amd64" ;;
        arm64)      echo "arm64" ;;
        aarch64)    echo "arm64" ;;
        *)          echo "unknown" ;;
    esac
}
```

## Running Scripts

### Direct Execution

```bash
# Make executable (if needed)
chmod +x ./scripts/script-name.sh

# Run script
./scripts/script-name.sh
```

### In Docker

```bash
# Run in Jekyll container
docker-compose exec jekyll ./scripts/script-name.sh
```

### Via Make

```bash
# If Makefile targets exist
make build
make release
make test
```

## Troubleshooting

### Permission Denied

```bash
chmod +x ./scripts/script-name.sh
```

### Command Not Found

Ensure dependencies are installed:

```bash
# Check Ruby
ruby --version

# Check Bundler
bundle --version

# Check Git
git --version
```

### Script Fails in Docker

Check container is running:

```bash
docker-compose ps
docker-compose up -d
```

## Related

- [Testing Guide](/docs/development/testing/)
- [Release Management](/docs/development/release-management/)
- [CI/CD Pipeline](/docs/development/ci-cd/)
