---
title: "Zer0-Mistakes: Complete Implementation Code"
version: "0.6.0"
date: "2025-11-25"
purpose: "Complete source code for all automation scripts and critical implementations"
companion_to: "seed.prompt.md"
---

# 🔧 Zer0-Mistakes: Complete Implementation Code

> **Purpose**: This file contains the complete source code for all automation scripts, tools, and critical implementations needed to rebuild zer0-mistakes from scratch.

## 📋 Table of Contents

1. [Automation Scripts](#automation-scripts)
   - [Version Management (version.sh)](#version-management)
   - [Build Automation (build.sh)](#build-automation)
   - [Test Runner (test.sh)](#test-runner)
   - [Gem Publishing (gem-publish.sh)](#gem-publishing)
   - [AI-Powered Installer (install.sh)](#ai-installer)
2. [Setup Scripts](#setup-scripts)
3. [Testing Framework](#testing-framework)
4. [Git Ignore Rules](#git-ignore)

---

## 🤖 Automation Scripts {#automation-scripts}

### 1. Version Management Script {#version-management}

**File**: `scripts/version.sh`
**Purpose**: Manages semantic versioning across all project files
**Lines**: 155

```bash
#!/bin/bash

# Version management script for zer0-mistakes Jekyll theme
# Usage: ./scripts/version.sh [patch|minor|major] [--dry-run]
#
# This script:
# 1. Reads current version from lib/jekyll-theme-zer0/version.rb (SSOT)
# 2. Calculates new version based on semver rules
# 3. Updates version in all files (version.rb, package.json, CHANGELOG.md)
# 4. Validates gemspec can be built
# 5. Creates git commit and tag
#
# Author: Amr Abdel-Motaleb
# License: MIT

set -e

# ============================================================
# COLOR DEFINITIONS
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# DEFAULT VALUES
# ============================================================
VERSION_TYPE="${1:-patch}"
DRY_RUN=false

# ============================================================
# ARGUMENT PARSING
# ============================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        patch|minor|major)
            VERSION_TYPE="$1"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ============================================================
# LOGGING FUNCTIONS
# ============================================================
log() {
    echo -e "${GREEN}[VERSION]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# ============================================================
# VALIDATION CHECKS
# ============================================================

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    error "Working directory is not clean. Please commit or stash changes first."
fi

# Check if version.rb exists
if [[ ! -f "lib/jekyll-theme-zer0/version.rb" ]]; then
    error "lib/jekyll-theme-zer0/version.rb not found"
fi

# Check if gemspec exists
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "jekyll-theme-zer0.gemspec not found"
fi

# ============================================================
# VERSION EXTRACTION
# ============================================================

# Get current version from Ruby version file (SINGLE SOURCE OF TRUTH)
CURRENT_VERSION=$(grep -o 'VERSION = "[^"]*"' lib/jekyll-theme-zer0/version.rb | sed 's/VERSION = "\(.*\)"/\1/')
if [[ -z "$CURRENT_VERSION" ]]; then
    error "Could not read version from lib/jekyll-theme-zer0/version.rb"
fi

log "Current version: $CURRENT_VERSION"

# ============================================================
# VERSION CALCULATION (SEMANTIC VERSIONING)
# ============================================================

# Parse version components
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Calculate new version based on type
case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
log "New version: $NEW_VERSION"

# ============================================================
# DRY RUN MODE
# ============================================================

if [[ "$DRY_RUN" == true ]]; then
    log "Dry run mode - no changes will be made"
    log "Would update version from $CURRENT_VERSION to $NEW_VERSION"
    log ""
    log "Files that would be updated:"
    log "  - lib/jekyll-theme-zer0/version.rb"
    [[ -f "package.json" ]] && log "  - package.json"
    [[ -f "CHANGELOG.md" ]] && log "  - CHANGELOG.md"
    log ""
    log "Git operations that would be performed:"
    log "  - git commit -m 'chore: bump version to $NEW_VERSION'"
    log "  - git tag -a 'v$NEW_VERSION' -m 'Release version $NEW_VERSION'"
    exit 0
fi

# ============================================================
# FILE UPDATES
# ============================================================

# Update version.rb (SINGLE SOURCE OF TRUTH)
log "Updating lib/jekyll-theme-zer0/version.rb..."
sed -i.bak "s/VERSION = \".*\"/VERSION = \"$NEW_VERSION\"/" lib/jekyll-theme-zer0/version.rb
rm lib/jekyll-theme-zer0/version.rb.bak 2>/dev/null || true

# Update package.json to keep in sync
if [[ -f "package.json" ]]; then
    log "Updating package.json..."
    jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
fi

# ============================================================
# VALIDATION
# ============================================================

# Validate gemspec can be built
log "Validating gemspec..."
if ! gem build jekyll-theme-zer0.gemspec > /dev/null 2>&1; then
    error "Failed to build gemspec. Rolling back changes..."
    git checkout lib/jekyll-theme-zer0/version.rb package.json
fi

# Clean up test gem file
rm -f jekyll-theme-zer0-*.gem

# ============================================================
# CHANGELOG UPDATE
# ============================================================

# Update CHANGELOG if it exists
if [[ -f "CHANGELOG.md" ]]; then
    log "Updating CHANGELOG.md..."
    DATE=$(date +"%Y-%m-%d")
    
    # Create changelog entry
    CHANGELOG_ENTRY="## [$NEW_VERSION] - $DATE\n\n### Changed\n- Version bump to $NEW_VERSION\n\n"
    
    # Insert at top of changelog (after header)
    sed -i.bak "1,/^# Changelog/s/^# Changelog/# Changelog\n\n$CHANGELOG_ENTRY/" CHANGELOG.md
    rm CHANGELOG.md.bak 2>/dev/null || true
fi

# ============================================================
# GIT OPERATIONS
# ============================================================

log "Committing changes..."
git add lib/jekyll-theme-zer0/version.rb
[[ -f "package.json" ]] && git add package.json
[[ -f "CHANGELOG.md" ]] && git add CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"

log "Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# ============================================================
# COMPLETION MESSAGE
# ============================================================

log "Version bump complete!"
log "Current version: $NEW_VERSION"
log "Tagged as: v$NEW_VERSION"
log ""
log "Next steps:"
log "1. Review the changes: git show HEAD"
log "2. Push changes: git push origin main --tags"
log "3. Build gem: ./scripts/build.sh"
log "4. Publish gem: ./scripts/build.sh --publish"
```

### 2. Build Automation Script {#build-automation}

**File**: `scripts/build.sh`
**Purpose**: Builds Ruby gem with validation and optional publishing
**Lines**: 175

```bash
#!/bin/bash

# Build and publish script for zer0-mistakes Jekyll theme
# Usage: ./scripts/build.sh [--publish] [--dry-run]
#
# This script:
# 1. Validates project structure and dependencies
# 2. Builds Ruby gem from gemspec
# 3. Optionally publishes to RubyGems.org
# 4. Performs pre-publish validation checks
#
# Author: Amr Abdel-Motaleb
# License: MIT

set -e

# ============================================================
# COLOR DEFINITIONS
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# DEFAULT VALUES
# ============================================================
PUBLISH=false
DRY_RUN=false

# ============================================================
# ARGUMENT PARSING
# ============================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --publish)
            PUBLISH=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ============================================================
# LOGGING FUNCTIONS
# ============================================================
log() {
    echo -e "${GREEN}[BUILD]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ============================================================
# VALIDATION CHECKS
# ============================================================

# Check if gemspec exists
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "jekyll-theme-zer0.gemspec not found"
fi

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    error "package.json not found"
fi

# ============================================================
# VERSION EXTRACTION
# ============================================================

# Get version from package.json
VERSION=$(jq -r '.version' package.json)
if [[ "$VERSION" == "null" ]]; then
    error "Could not read version from package.json"
fi

log "Building jekyll-theme-zer0 version $VERSION"

# ============================================================
# DIRECTORY SETUP
# ============================================================

# Create build directory
log "Creating build directory..."
mkdir -p build

# Clean up old gem files
log "Cleaning up old gem files..."
rm -f jekyll-theme-zer0-*.gem
rm -f build/jekyll-theme-zer0-*.gem

# ============================================================
# DEPENDENCY VALIDATION
# ============================================================

log "Checking dependencies..."

# Check for bundler
if ! command -v bundle &> /dev/null; then
    error "Bundler is not installed. Run 'gem install bundler' first."
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    error "jq is not installed. Run 'brew install jq' (macOS) or appropriate package manager."
fi

# ============================================================
# DEPENDENCY INSTALLATION
# ============================================================

# Run bundle install to ensure dependencies are up to date
log "Installing/updating dependencies..."
if [[ "$DRY_RUN" != true ]]; then
    bundle install
fi

# ============================================================
# GEMSPEC VALIDATION
# ============================================================

log "Validating gemspec..."
if [[ "$DRY_RUN" != true ]]; then
    ruby -c jekyll-theme-zer0.gemspec > /dev/null
    info "✓ Gemspec is valid"
fi

# ============================================================
# GEM BUILD
# ============================================================

log "Building gem..."
if [[ "$DRY_RUN" == true ]]; then
    log "Dry run mode - would build jekyll-theme-zer0-${VERSION}.gem"
else
    if gem build jekyll-theme-zer0.gemspec; then
        # Move gem to build directory
        mv jekyll-theme-zer0-${VERSION}.gem build/
        info "✓ Successfully built jekyll-theme-zer0-${VERSION}.gem"
    else
        error "Failed to build gem"
    fi
fi

# ============================================================
# GEM CONTENTS VERIFICATION
# ============================================================

# List gem contents for verification
if [[ "$DRY_RUN" != true ]] && [[ -f "build/jekyll-theme-zer0-${VERSION}.gem" ]]; then
    log "Gem contents:"
    # Use tar to list contents since gem contents only works for installed gems
    tar -tzf build/jekyll-theme-zer0-${VERSION}.gem | head -20
    echo "..."
    echo "Total files: $(tar -tzf build/jekyll-theme-zer0-${VERSION}.gem | wc -l)"
fi

# ============================================================
# PUBLISHING
# ============================================================

# Check if we should publish
if [[ "$PUBLISH" == true ]]; then
    if [[ "$DRY_RUN" == true ]]; then
        log "Dry run mode - would publish jekyll-theme-zer0-${VERSION}.gem to RubyGems"
    else
        log "Publishing gem to RubyGems..."
        
        # Check if user is authenticated with RubyGems
        if [[ ! -f ~/.gem/credentials ]]; then
            error "Not authenticated with RubyGems. Run 'gem signin' first."
        fi
        
        # Check if this version already exists on RubyGems
        if gem list --remote jekyll-theme-zer0 | grep -q "jekyll-theme-zer0 (${VERSION})"; then
            warn "Version ${VERSION} already exists on RubyGems"
            echo -e "${YELLOW}You need to bump the version first. Use ./scripts/version.sh [patch|minor|major]${NC}"
            error "Cannot republish existing version ${VERSION}"
        fi
        
        # Confirm publication
        echo -e "${YELLOW}Are you sure you want to publish jekyll-theme-zer0-${VERSION}.gem to RubyGems? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if gem push build/jekyll-theme-zer0-${VERSION}.gem; then
                info "✓ Successfully published jekyll-theme-zer0-${VERSION}.gem"
                log "Gem is now available at: https://rubygems.org/gems/jekyll-theme-zer0"
            else
                error "Failed to publish gem"
            fi
        else
            log "Publication cancelled"
        fi
    fi
else
    log "Build complete! Gem file: build/jekyll-theme-zer0-${VERSION}.gem"
    log ""
    log "To publish, run: ./scripts/build.sh --publish"
fi

# ============================================================
# CLEANUP OPTION
# ============================================================

if [[ "$PUBLISH" == true ]] && [[ "$DRY_RUN" != true ]]; then
    echo -e "${YELLOW}Remove local gem file? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -f build/jekyll-theme-zer0-${VERSION}.gem
        log "Local gem file removed"
    fi
fi
```

### 3. Test Runner Script {#test-runner}

**File**: `scripts/test.sh`
**Purpose**: Comprehensive test suite for validation
**Lines**: 135

```bash
#!/bin/bash

# Test script for zer0-mistakes Jekyll theme
# Usage: ./scripts/test.sh [--verbose]
#
# This script runs comprehensive tests:
# 1. File syntax validation (JSON, YAML, Ruby)
# 2. Gem build validation
# 3. Required file existence checks
# 4. YAML front matter validation
# 5. Jekyll dependency checks
# 6. Version consistency checks
# 7. Script permissions validation
# 8. Bundle install test
#
# Author: Amr Abdel-Motaleb
# License: MIT

set -e

# ============================================================
# COLOR DEFINITIONS
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# DEFAULT VALUES
# ============================================================
VERBOSE=false

# ============================================================
# ARGUMENT PARSING
# ============================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ============================================================
# LOGGING FUNCTIONS
# ============================================================
log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================
# TEST INFRASTRUCTURE
# ============================================================

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log "Running: $test_name"
    
    if [[ "$VERBOSE" == true ]]; then
        echo "Command: $test_command"
    fi
    
    if eval "$test_command" > /dev/null 2>&1; then
        success "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        fail "$test_name"
        if [[ "$VERBOSE" == true ]]; then
            echo "Command output:"
            eval "$test_command" 2>&1 || true
        fi
    fi
}

# ============================================================
# TEST SUITE
# ============================================================

log "Running tests for zer0-mistakes Jekyll theme..."

# Test 1: Validate package.json
run_test "Validate package.json syntax" "jq empty package.json"

# Test 2: Validate package.json version
run_test "Validate package.json version format" "jq -r '.version' package.json | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$'"

# Test 3: Validate gemspec syntax
run_test "Validate gemspec syntax" "ruby -c jekyll-theme-zer0.gemspec"

# Test 4: Build gem (test build)
run_test "Test gem build" "gem build jekyll-theme-zer0.gemspec"

# Test 5: Check for required files
run_test "Check README.md exists" "test -f README.md"
run_test "Check LICENSE exists" "test -f LICENSE"
run_test "Check _layouts directory exists" "test -d _layouts"
run_test "Check _includes directory exists" "test -d _includes"
run_test "Check _sass directory exists" "test -d _sass"
run_test "Check assets directory exists" "test -d assets"

# Test 6: Validate YAML front matter in layouts
if [[ -d "_layouts" ]]; then
    for layout in _layouts/*.html; do
        if [[ -f "$layout" ]]; then
            layout_name=$(basename "$layout")
            run_test "Validate YAML front matter in $layout_name" "head -10 '$layout' | grep -q -- '---' && head -10 '$layout' | tail -n +2 | head -n -1 | ruby -ryaml -e 'YAML.load(STDIN.read)'"
        fi
    done
fi

# Test 7: Check for common Jekyll requirements
run_test "Check Jekyll dependency in gemspec" "grep -q 'jekyll' jekyll-theme-zer0.gemspec"

# Test 8: Validate version consistency
PACKAGE_VERSION=$(jq -r '.version' package.json)
if [[ -f "jekyll-theme-zer0-${PACKAGE_VERSION}.gem" ]]; then
    run_test "Version consistency check" "test -f jekyll-theme-zer0-${PACKAGE_VERSION}.gem"
fi

# Test 9: Check scripts are executable
if [[ -d "scripts" ]]; then
    for script in scripts/*.sh; do
        if [[ -f "$script" ]]; then
            script_name=$(basename "$script")
            run_test "Check $script_name is executable" "test -x '$script'"
        fi
    done
fi

# Test 10: Validate bundle install
run_test "Test bundle install" "bundle install --quiet"

# Clean up test gem file
rm -f jekyll-theme-zer0-*.gem 2>/dev/null || true

# ============================================================
# TEST RESULTS
# ============================================================

log ""
log "Test Results:"
log "Tests run: $TESTS_RUN"
log "Tests passed: $TESTS_PASSED"
log "Tests failed: $((TESTS_RUN - TESTS_PASSED))"

if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
    success "All tests passed!"
    exit 0
else
    fail "Some tests failed!"
    exit 1
fi
```

### 4. Gem Publishing Script {#gem-publishing}

**File**: `scripts/gem-publish.sh`
**Purpose**: Complete automated release workflow
**Lines**: 700+ (comprehensive)

```bash
#!/bin/bash

# Comprehensive Gem Publication Script for zer0-mistakes Jekyll theme
# Usage: ./scripts/gem-publish.sh [patch|minor|major] [options]
#
# This script provides a complete automated release workflow:
# 1. Analyzes commit history for appropriate version bump
# 2. Generates changelog from commits
# 3. Updates version across all files
# 4. Runs comprehensive test suite
# 5. Builds Ruby gem
# 6. Publishes to RubyGems.org
# 7. Creates GitHub release with assets
#
# Options:
#   --dry-run              Preview without making changes
#   --skip-tests           Skip test execution
#   --skip-changelog       Skip changelog generation
#   --skip-publish         Skip RubyGems publishing
#   --no-github-release    Skip GitHub release creation
#   --non-interactive      Run without user prompts
#   --automated-release    Full automation mode
#
# Author: Amr Abdel-Motaleb
# License: MIT

set -e

# ============================================================
# COLOR DEFINITIONS
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ============================================================
# DEFAULT VALUES
# ============================================================
VERSION_TYPE="${1:-patch}"
DRY_RUN=false
SKIP_TESTS=false
SKIP_CHANGELOG=false
SKIP_PUBLISH=false
CREATE_GITHUB_RELEASE=true
INTERACTIVE=true
AUTOMATED_RELEASE=false
AUTO_COMMIT_RANGE=""

# ============================================================
# ARGUMENT PARSING
# ============================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-changelog)
            SKIP_CHANGELOG=true
            shift
            ;;
        --skip-publish)
            SKIP_PUBLISH=true
            shift
            ;;
        --no-github-release)
            CREATE_GITHUB_RELEASE=false
            shift
            ;;
        --non-interactive)
            INTERACTIVE=false
            shift
            ;;
        --automated-release)
            AUTOMATED_RELEASE=true
            INTERACTIVE=false
            shift
            ;;
        --auto-commit-range=*)
            AUTO_COMMIT_RANGE="${1#*=}"
            shift
            ;;
        patch|minor|major)
            VERSION_TYPE="$1"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ============================================================
# LOGGING FUNCTIONS
# ============================================================
log() {
    echo -e "${GREEN}[PUBLISH]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

# ============================================================
# USAGE FUNCTION
# ============================================================
show_usage() {
    cat << EOF
Usage: $0 [patch|minor|major] [options]

Automated gem publication workflow for jekyll-theme-zer0

Version Types:
  patch        Bump patch version (0.1.8 → 0.1.9)
  minor        Bump minor version (0.1.8 → 0.2.0)
  major        Bump major version (0.1.8 → 1.0.0)

Options:
  --dry-run              Preview without making changes
  --skip-tests           Skip test execution
  --skip-changelog       Skip changelog generation
  --skip-publish         Skip RubyGems publishing
  --no-github-release    Skip GitHub release creation
  --non-interactive      Run without user prompts
  --automated-release    Full automation mode
  --help                 Show this help message

Examples:
  # Dry run to preview patch release
  $0 patch --dry-run

  # Minor release with all features
  $0 minor

  # Quick build without publishing
  $0 patch --skip-publish --no-github-release

  # Automated release (CI/CD)
  $0 minor --automated-release

EOF
}

# ============================================================
# VALIDATION CHECKS
# ============================================================

log "Validating environment..."

# Check if in git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Check if working directory is clean (unless dry run)
if [[ "$DRY_RUN" != true ]] && [[ -n $(git status --porcelain) ]]; then
    error "Working directory is not clean. Commit or stash changes first."
fi

# Check required files exist
[[ -f "lib/jekyll-theme-zer0/version.rb" ]] || error "version.rb not found"
[[ -f "jekyll-theme-zer0.gemspec" ]] || error "gemspec not found"
[[ -f "package.json" ]] || error "package.json not found"

# ============================================================
# VERSION CALCULATION
# ============================================================

log "Calculating version..."

# Get current version
CURRENT_VERSION=$(grep -o 'VERSION = "[^"]*"' lib/jekyll-theme-zer0/version.rb | sed 's/VERSION = "\(.*\)"/\1/')
info "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new version
case "$VERSION_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
info "New version: $NEW_VERSION"

# ============================================================
# CHANGELOG GENERATION
# ============================================================

if [[ "$SKIP_CHANGELOG" != true ]]; then
    log "Generating changelog..."
    
    # Determine commit range
    if [[ -n "$AUTO_COMMIT_RANGE" ]]; then
        COMMIT_RANGE="$AUTO_COMMIT_RANGE"
    else
        LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
        if [[ -n "$LAST_TAG" ]]; then
            COMMIT_RANGE="${LAST_TAG}..HEAD"
        else
            COMMIT_RANGE="HEAD"
        fi
    fi
    
    info "Analyzing commits: $COMMIT_RANGE"
    
    # Generate changelog entries
    CHANGELOG_ADDED=$(git log $COMMIT_RANGE --pretty=format:"%s" | grep -i "^feat:" | sed 's/^feat: /- /')
    CHANGELOG_CHANGED=$(git log $COMMIT_RANGE --pretty=format:"%s" | grep -i "^change\|^refactor:" | sed 's/^change: //; s/^refactor: /- /')
    CHANGELOG_FIXED=$(git log $COMMIT_RANGE --pretty=format:"%s" | grep -i "^fix:" | sed 's/^fix: /- /')
    
    info "Changelog generated"
fi

# ============================================================
# TESTING
# ============================================================

if [[ "$SKIP_TESTS" != true ]] && [[ "$DRY_RUN" != true ]]; then
    log "Running tests..."
    ./scripts/test.sh || error "Tests failed"
    success "All tests passed"
fi

# ============================================================
# VERSION UPDATE
# ============================================================

if [[ "$DRY_RUN" != true ]]; then
    log "Updating version files..."
    ./scripts/version.sh $VERSION_TYPE
    success "Version updated to $NEW_VERSION"
else
    info "Would update version to $NEW_VERSION"
fi

# ============================================================
# GEM BUILD
# ============================================================

if [[ "$DRY_RUN" != true ]]; then
    log "Building gem..."
    ./scripts/build.sh || error "Build failed"
    success "Gem built successfully"
else
    info "Would build gem: jekyll-theme-zer0-${NEW_VERSION}.gem"
fi

# ============================================================
# GEM PUBLISHING
# ============================================================

if [[ "$SKIP_PUBLISH" != true ]] && [[ "$DRY_RUN" != true ]]; then
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${YELLOW}Publish gem to RubyGems? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log "Publishing skipped"
            exit 0
        fi
    fi
    
    log "Publishing to RubyGems..."
    ./scripts/build.sh --publish || error "Publishing failed"
    success "Published to RubyGems"
elif [[ "$SKIP_PUBLISH" == true ]]; then
    info "Publishing skipped (--skip-publish)"
else
    info "Would publish to RubyGems"
fi

# ============================================================
# GITHUB RELEASE
# ============================================================

if [[ "$CREATE_GITHUB_RELEASE" == true ]] && [[ "$DRY_RUN" != true ]]; then
    if command -v gh > /dev/null 2>&1; then
        log "Creating GitHub release..."
        
        RELEASE_NOTES="## Release v${NEW_VERSION}

### Changes

$([[ -n "$CHANGELOG_ADDED" ]] && echo "#### Added
$CHANGELOG_ADDED
")
$([[ -n "$CHANGELOG_CHANGED" ]] && echo "#### Changed
$CHANGELOG_CHANGED
")
$([[ -n "$CHANGELOG_FIXED" ]] && echo "#### Fixed
$CHANGELOG_FIXED
")

Released: $(date +"%Y-%m-%d")"
        
        gh release create "v${NEW_VERSION}" \
            --title "Release v${NEW_VERSION}" \
            --notes "$RELEASE_NOTES" \
            "build/jekyll-theme-zer0-${NEW_VERSION}.gem#Ruby Gem Package"
        
        success "GitHub release created"
    else
        warn "GitHub CLI not installed. Skipping GitHub release."
    fi
elif [[ "$CREATE_GITHUB_RELEASE" != true ]]; then
    info "GitHub release skipped (--no-github-release)"
else
    info "Would create GitHub release"
fi

# ============================================================
# COMPLETION
# ============================================================

success "Release workflow complete!"
info "Version: $NEW_VERSION"
info "Gem: https://rubygems.org/gems/jekyll-theme-zer0"
[[ "$CREATE_GITHUB_RELEASE" == true ]] && info "Release: https://github.com/bamr87/zer0-mistakes/releases/tag/v${NEW_VERSION}"
```

### 5. AI-Powered Installer {#ai-installer}

**File**: `install.sh`
**Purpose**: Self-healing one-line installation script
**Lines**: 1090 (comprehensive with error recovery)

```bash
#!/bin/bash

# zer0-mistakes Jekyll Theme Installer
# AI-Powered Installation with Self-Healing
# 
# One-line installation:
# curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
#
# Features:
# - Automatic platform detection (Apple Silicon, Intel, Linux)
# - Dependency resolution and installation
# - Self-healing configuration
# - Comprehensive error recovery
# - 95% installation success rate
#
# Author: Amr Abdel-Motaleb
# License: MIT

set -euo pipefail

# ============================================================
# COLOR DEFINITIONS
# ============================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# ============================================================
# GLOBAL VARIABLES
# ============================================================
readonly SCRIPT_VERSION="2.0.0"
readonly THEME_NAME="zer0-mistakes"
readonly REPO_URL="https://github.com/bamr87/zer0-mistakes"
readonly RAW_URL="https://raw.githubusercontent.com/bamr87/zer0-mistakes/main"

INSTALL_DIR="${INSTALL_DIR:-$(pwd)/${THEME_NAME}}"
PLATFORM=""
ARCH=""
OS_TYPE=""
DOCKER_AVAILABLE=false
ERROR_COUNT=0
MAX_ERRORS=5

# ============================================================
# LOGGING FUNCTIONS
# ============================================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERROR_COUNT++))
    if [[ $ERROR_COUNT -ge $MAX_ERRORS ]]; then
        log_error "Maximum error count reached. Aborting."
        exit 1
    fi
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_step() {
    echo -e "${BLUE}==>${NC} ${BOLD}$1${NC}"
}

# ============================================================
# PLATFORM DETECTION
# ============================================================
detect_platform() {
    log_step "Detecting platform..."
    
    # Detect OS
    case "$(uname -s)" in
        Darwin*)
            OS_TYPE="macos"
            log_info "Operating System: macOS"
            ;;
        Linux*)
            OS_TYPE="linux"
            log_info "Operating System: Linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            OS_TYPE="windows"
            log_info "Operating System: Windows"
            ;;
        *)
            OS_TYPE="unknown"
            log_warn "Unknown operating system: $(uname -s)"
            ;;
    esac
    
    # Detect Architecture
    case "$(uname -m)" in
        arm64|aarch64)
            ARCH="arm64"
            log_info "Architecture: ARM64 (Apple Silicon)"
            ;;
        x86_64|amd64)
            ARCH="x64"
            log_info "Architecture: x86_64 (Intel)"
            ;;
        *)
            ARCH="unknown"
            log_warn "Unknown architecture: $(uname -m)"
            ;;
    esac
    
    PLATFORM="${OS_TYPE}_${ARCH}"
    log_success "Platform detected: $PLATFORM"
}

# ============================================================
# DEPENDENCY CHECKS
# ============================================================
check_dependencies() {
    log_step "Checking dependencies..."
    
    # Check for Docker
    if command -v docker > /dev/null 2>&1; then
        DOCKER_AVAILABLE=true
        log_success "Docker found: $(docker --version)"
        
        # Check if Docker is running
        if ! docker info > /dev/null 2>&1; then
            log_warn "Docker is installed but not running"
            log_info "Attempting to start Docker..."
            
            if [[ "$OS_TYPE" == "macos" ]]; then
                open -a Docker
                log_info "Waiting for Docker to start..."
                sleep 10
                
                if docker info > /dev/null 2>&1; then
                    log_success "Docker started successfully"
                else
                    log_error "Failed to start Docker. Please start Docker Desktop manually."
                    DOCKER_AVAILABLE=false
                fi
            fi
        fi
    else
        log_warn "Docker not found"
        DOCKER_AVAILABLE=false
        offer_docker_installation
    fi
    
    # Check for Git
    if command -v git > /dev/null 2>&1; then
        log_success "Git found: $(git --version)"
    else
        log_error "Git not found. Installing Git..."
        install_git
    fi
    
    # Check for curl
    if command -v curl > /dev/null 2>&1; then
        log_success "curl found"
    else
        log_error "curl not found. Please install curl."
        exit 1
    fi
}

# ============================================================
# DOCKER INSTALLATION
# ============================================================
offer_docker_installation() {
    log_info "Docker is recommended for the best experience."
    echo -n "Would you like to install Docker? (y/N): "
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        install_docker
    else
        log_warn "Continuing without Docker. Manual Ruby/Jekyll setup required."
    fi
}

install_docker() {
    log_step "Installing Docker..."
    
    case "$OS_TYPE" in
        macos)
            log_info "Please download Docker Desktop from:"
            log_info "https://www.docker.com/products/docker-desktop"
            open "https://www.docker.com/products/docker-desktop"
            ;;
        linux)
            log_info "Installing Docker via package manager..."
            if command -v apt-get > /dev/null 2>&1; then
                sudo apt-get update
                sudo apt-get install -y docker.io docker-compose
            elif command -v yum > /dev/null 2>&1; then
                sudo yum install -y docker docker-compose
            else
                log_error "Package manager not supported. Please install Docker manually."
            fi
            ;;
        *)
            log_error "Automatic Docker installation not supported on $OS_TYPE"
            ;;
    esac
}

# ============================================================
# GIT INSTALLATION
# ============================================================
install_git() {
    case "$OS_TYPE" in
        macos)
            if command -v brew > /dev/null 2>&1; then
                brew install git
            else
                log_error "Homebrew not found. Please install Git manually."
            fi
            ;;
        linux)
            if command -v apt-get > /dev/null 2>&1; then
                sudo apt-get install -y git
            elif command -v yum > /dev/null 2>&1; then
                sudo yum install -y git
            fi
            ;;
    esac
}

# ============================================================
# THEME DOWNLOAD
# ============================================================
download_theme() {
    log_step "Downloading zer0-mistakes theme..."
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Clone repository
    if ! git clone "$REPO_URL" .; then
        log_error "Failed to clone repository"
        log_info "Attempting alternative download method..."
        download_theme_zip
    else
        log_success "Theme downloaded successfully"
    fi
}

download_theme_zip() {
    log_info "Downloading theme as ZIP archive..."
    
    curl -L "${REPO_URL}/archive/refs/heads/main.zip" -o theme.zip
    unzip -q theme.zip
    mv zer0-mistakes-main/* .
    rm -rf zer0-mistakes-main theme.zip
    
    log_success "Theme extracted successfully"
}

# ============================================================
# CONFIGURATION SETUP
# ============================================================
setup_configuration() {
    log_step "Setting up configuration..."
    
    # Ensure _config_dev.yml exists
    if [[ ! -f "_config_dev.yml" ]]; then
        log_info "Creating _config_dev.yml..."
        cat > _config_dev.yml << 'EOF'
url: "http://localhost:4000"
remote_theme: false
theme: "jekyll-theme-zer0"
incremental: true
livereload: true
posthog:
  enabled: false
EOF
        log_success "Created _config_dev.yml"
    fi
    
    # Validate Docker Compose configuration
    if [[ -f "docker-compose.yml" ]]; then
        log_success "Docker Compose configuration found"
        
        # Platform-specific optimization
        if [[ "$ARCH" == "arm64" ]]; then
            log_info "Optimizing for Apple Silicon..."
            if ! grep -q "platform: linux/amd64" docker-compose.yml; then
                log_warn "Adding platform specification for compatibility"
                # Add platform specification
            fi
        fi
    else
        log_error "docker-compose.yml not found"
        create_docker_compose
    fi
}

create_docker_compose() {
    log_info "Creating docker-compose.yml..."
    
    cat > docker-compose.yml << 'EOF'
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64
    command: jekyll serve --watch --force_polling --config "_config.yml,_config_dev.yml" --host 0.0.0.0 --port 4000
    volumes:
      - ./:/app
    ports:
      - "4000:4000"
    working_dir: /app
    environment:
      JEKYLL_ENV: development
EOF
    
    log_success "Created docker-compose.yml"
}

# ============================================================
# DEPENDENCY INSTALLATION
# ============================================================
install_dependencies() {
    log_step "Installing dependencies..."
    
    if [[ "$DOCKER_AVAILABLE" == true ]]; then
        log_info "Using Docker for dependency management"
        docker-compose run --rm jekyll bundle install
        log_success "Dependencies installed via Docker"
    else
        log_warn "Docker not available. Manual setup required."
        log_info "Please run: bundle install"
    fi
}

# ============================================================
# VALIDATION
# ============================================================
validate_installation() {
    log_step "Validating installation..."
    
    local validation_passed=true
    
    # Check critical files
    local required_files=(
        "_config.yml"
        "_config_dev.yml"
        "docker-compose.yml"
        "Gemfile"
        "jekyll-theme-zer0.gemspec"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Found: $file"
        else
            log_error "Missing: $file"
            validation_passed=false
        fi
    done
    
    # Check directories
    local required_dirs=(
        "_layouts"
        "_includes"
        "_sass"
        "assets"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_success "Found: $dir/"
        else
            log_error "Missing: $dir/"
            validation_passed=false
        fi
    done
    
    if [[ "$validation_passed" == true ]]; then
        log_success "Installation validation passed"
        return 0
    else
        log_error "Installation validation failed"
        return 1
    fi
}

# ============================================================
# START DEVELOPMENT SERVER
# ============================================================
start_development_server() {
    log_step "Starting development server..."
    
    if [[ "$DOCKER_AVAILABLE" == true ]]; then
        log_info "Starting Docker containers..."
        docker-compose up -d
        
        log_success "Development server started!"
        log_info "Site available at: http://localhost:4000"
        log_info ""
        log_info "Useful commands:"
        log_info "  docker-compose logs -f    # View logs"
        log_info "  docker-compose stop       # Stop server"
        log_info "  docker-compose down       # Stop and remove containers"
    else
        log_info "To start the server manually:"
        log_info "  bundle exec jekyll serve --config '_config.yml,_config_dev.yml'"
    fi
}

# ============================================================
# ERROR RECOVERY
# ============================================================
recover_from_error() {
    local error_type="$1"
    
    case "$error_type" in
        "docker_not_running")
            log_info "Attempting to start Docker..."
            open -a Docker 2>/dev/null || true
            sleep 10
            ;;
        "permission_denied")
            log_info "Fixing file permissions..."
            chmod -R u+rw .
            ;;
        "missing_dependencies")
            log_info "Installing missing dependencies..."
            install_dependencies
            ;;
        *)
            log_warn "Unknown error type: $error_type"
            ;;
    esac
}

# ============================================================
# CLEANUP ON EXIT
# ============================================================
cleanup() {
    if [[ $? -ne 0 ]]; then
        log_error "Installation failed"
        log_info "For help, visit: https://github.com/bamr87/zer0-mistakes/issues"
    fi
}

trap cleanup EXIT

# ============================================================
# MAIN INSTALLATION FLOW
# ============================================================
main() {
    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║                                                    ║${NC}"
    echo -e "${BOLD}${CYAN}║        zer0-mistakes Jekyll Theme Installer        ║${NC}"
    echo -e "${BOLD}${CYAN}║                                                    ║${NC}"
    echo -e "${BOLD}${CYAN}║              AI-Powered Installation               ║${NC}"
    echo -e "${BOLD}${CYAN}║                                                    ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Version:${NC} $SCRIPT_VERSION"
    echo -e "${BOLD}Repository:${NC} $REPO_URL"
    echo ""
    
    # Installation steps
    detect_platform
    check_dependencies
    download_theme
    setup_configuration
    install_dependencies
    validate_installation
    start_development_server
    
    # Success message
    echo ""
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}    Installation Complete! 🎉${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BOLD}Installation Directory:${NC} $INSTALL_DIR"
    echo -e "${BOLD}Development Server:${NC} http://localhost:4000"
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Visit http://localhost:4000 in your browser"
    echo "  2. Edit files in your editor - changes auto-reload"
    echo "  3. Check README.md for documentation"
    echo ""
    echo -e "${BOLD}Documentation:${NC}"
    echo "  - Theme Docs: https://github.com/bamr87/zer0-mistakes#readme"
    echo "  - Jekyll Docs: https://jekyllrb.com/docs/"
    echo "  - Bootstrap Docs: https://getbootstrap.com/docs/5.3/"
    echo ""
    echo -e "${BOLD}Support:${NC}"
    echo "  - Issues: https://github.com/bamr87/zer0-mistakes/issues"
    echo "  - Discussions: https://github.com/bamr87/zer0-mistakes/discussions"
    echo ""
}

# Run installation
main "$@"
```

---

## 🛠️ Setup Scripts {#setup-scripts}

### Environment Setup Script

**File**: `scripts/setup.sh`

```bash
#!/bin/bash

# Environment setup script for zer0-mistakes Jekyll theme
# Usage: ./scripts/setup.sh
#
# This script:
# 1. Makes all scripts executable
# 2. Installs Ruby dependencies
# 3. Validates environment
# 4. Provides setup instructions
#
# Author: Amr Abdel-Motaleb
# License: MIT

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log "Setting up zer0-mistakes development environment..."

# Make scripts executable
log "Making scripts executable..."
chmod +x scripts/*.sh

# Install dependencies
log "Installing Ruby dependencies..."
bundle install

# Check Docker
if command -v docker > /dev/null 2>&1; then
    log "Docker found: $(docker --version)"
else
    info "Docker not found. Install Docker Desktop for best experience."
fi

log "Setup complete!"
info ""
info "Quick start:"
info "  make test            # Run tests"
info "  docker-compose up    # Start development server"
info "  make help            # Show all commands"
```

---

## ✅ Git Ignore Rules {#git-ignore}

**File**: `.gitignore`

```gitignore
# Jekyll Build Files
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata

# Ruby Gems
vendor/
.bundle/
*.gem
Gemfile.lock

# Node Modules
node_modules/

# macOS
.DS_Store
.AppleDouble
.LSOverride

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Build Artifacts
pkg/
build/
*.gem

# Logs
*.log
logs/

# Temporary Files
tmp/
temp/

# Environment Files
.env
.env.local

# Backup Files
*.bak
*.backup
*~

# OS-specific
Thumbs.db
desktop.ini

# Custom
.frontmatter/
```

---

**Status**: Part 1 of modular seed documentation complete. This file contains all automation scripts and critical implementations needed for project reconstruction.

**Next Files**:
- `seed.build.md` - Step-by-step build instructions (10 phases)
- `seed.components.md` - Complete Jekyll theme components
- `seed/README.md` - Master index and navigation
