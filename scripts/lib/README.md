# Release Script Libraries

Modular, tested, and reusable libraries for the zer0-mistakes release automation system.

## Overview

This directory contains focused, single-responsibility libraries that power the release automation. Each library can be used independently or composed together for complex workflows.

## Libraries

### 📦 `common.sh` - Shared Utilities
Core utilities used by all other libraries.

**Functions:**
- `log()`, `info()`, `warn()`, `error()` - Colored logging
- `confirm()` - User confirmation prompts
- `dry_run_exec()` - Dry run wrapper for commands
- `require_command()`, `require_file()` - Dependency validation
- `get_repo_root()` - Find repository root directory

**Usage:**
```bash
source "$(dirname "$0")/lib/common.sh"
log "Starting process..."
```

### 🔍 `validation.sh` - Environment Validation
Validates environment, dependencies, and prerequisites.

**Functions:**
- `validate_git_repo()` - Verify git repository
- `validate_clean_working_dir()` - Check for uncommitted changes
- `validate_required_files()` - Check required files exist
- `validate_dependencies()` - Verify all commands available
- `validate_rubygems_auth()` - Check RubyGems credentials
- `validate_environment()` - Comprehensive validation

**Usage:**
```bash
source "$(dirname "$0")/lib/validation.sh"
validate_environment false false  # skip_publish=false, require_gh=false
```

### 📝 `version.sh` - Version Management
Read, calculate, and update semantic versions.

**Functions:**
- `get_current_version()` - Read version from version.rb
- `calculate_new_version()` - Calculate new version (major/minor/patch)
- `update_version_files()` - Update all version files
- `validate_version_format()` - Validate semver format
- `version_less_than()` - Compare two versions

**Usage:**
```bash
source "$(dirname "$0")/lib/version.sh"

current=$(get_current_version)
new=$(calculate_new_version "$current" "minor")
update_version_files "$new"
```

### 📋 `changelog.sh` - Changelog Generation
Generate changelogs from conventional commits.

**Functions:**
- `generate_changelog()` - Generate changelog for version
- `categorize_commit()` - Categorize commit by type
- `clean_commit_message()` - Clean conventional commit prefixes
- `extract_release_notes()` - Extract notes for specific version

**Commit Categories:**
- `feat:` → Added
- `fix:` → Fixed
- `BREAKING:` → Breaking Changes
- `docs:`, `chore:`, `refactor:` → Changed
- `remove:` → Removed
- `security:` → Security

**Usage:**
```bash
source "$(dirname "$0")/lib/changelog.sh"

generate_changelog "1.2.0" "v1.1.0" "HEAD"
```

### 🔄 `git.sh` - Git Operations
Git commits, tags, and repository operations.

**Functions:**
- `get_last_version_tag()` - Find last version tag
- `commit_and_tag()` - Create release commit and tag
- `push_changes()` - Push to remote with tags
- `get_commits_between()` - Get commits in range
- `get_repo_info()` - Extract owner/repo from URL

**Usage:**
```bash
source "$(dirname "$0")/lib/git.sh"

commit_and_tag "1.2.0"
push_changes "origin" "main"
```

### 💎 `gem.sh` - Gem Operations
Build, test, publish, and release gems.

**Functions:**
- `build_gem()` - Build the gem package
- `publish_gem()` - Publish to RubyGems
- `create_github_release()` - Create GitHub release
- `run_tests()` - Execute test suite
- `gem_version_exists()` - Check if version exists on RubyGems

**Usage:**
```bash
source "$(dirname "$0")/lib/gem.sh"

build_gem "1.2.0"
run_tests
publish_gem "1.2.0"
create_github_release "1.2.0"
```

## Testing

Each library has comprehensive unit tests in `test/`.

### Run All Tests
```bash
./scripts/lib/test/run_tests.sh
```

### Run Individual Tests
```bash
./scripts/lib/test/test_version.sh
./scripts/lib/test/test_changelog.sh
./scripts/lib/test/test_git.sh
```

### Test Coverage
- ✅ Version calculations and validation
- ✅ Changelog generation and categorization
- ✅ Git operations and tag management
- ✅ Environment validation
- ✅ Gem build and publish workflows

## Environment Variables

Control library behavior with environment variables:

```bash
# Dry run mode (no actual changes)
DRY_RUN=true

# Non-interactive mode (auto-confirm prompts)
INTERACTIVE=false

# Verbose debug output
VERBOSE=true
```

## Example: Custom Release Script

```bash
#!/bin/bash
set -euo pipefail

# Source libraries
LIB_DIR="$(dirname "$0")/lib"
source "$LIB_DIR/common.sh"
source "$LIB_DIR/validation.sh"
source "$LIB_DIR/version.sh"
source "$LIB_DIR/changelog.sh"
source "$LIB_DIR/git.sh"
source "$LIB_DIR/gem.sh"

# Main workflow
main() {
    print_header "Custom Release"
    
    # Validate
    validate_environment
    
    # Version
    local current=$(get_current_version)
    local new=$(calculate_new_version "$current" "patch")
    update_version_files "$new"
    
    # Changelog
    generate_changelog "$new"
    
    # Build & Test
    build_gem "$new"
    run_tests
    
    # Commit & Tag
    commit_and_tag "$new"
    
    # Publish
    publish_gem "$new"
    create_github_release "$new"
    push_changes
    
    success "Release $new complete!"
}

main "$@"
```

## Architecture Benefits

### ✅ Modularity
Each library has ONE responsibility - easy to understand and modify.

### ✅ Testability
Small, focused functions can be unit tested independently.

### ✅ Reusability
Libraries can be used in different scripts or GitHub Actions.

### ✅ Maintainability
Changes isolated to specific files - less ripple effect.

### ✅ Clarity
Functions have clear names and single purposes.

## Migrating Old Scripts

Old monolithic scripts (`gem-publish.sh`, `release.sh`, `build.sh`) can now be:

1. **Deprecated** with warnings pointing to new libraries
2. **Replaced** with thin wrappers using libraries
3. **Removed** once adoption is confirmed

Example deprecation wrapper:
```bash
#!/bin/bash
echo "⚠️  WARNING: This script is deprecated"
echo "    Use: ./scripts/release"
exec "$(dirname "$0")/release" "$@"
```

## Contributing

When adding new functionality:

1. **Choose the right library** - or create a new one if needed
2. **Write tests first** - add tests to `test/test_*.sh`
3. **Keep functions small** - one function, one purpose
4. **Document thoroughly** - update this README
5. **Test in isolation** - each library should work standalone

## Questions?

- See `docs/RELEASE_WORKFLOW_IMPROVEMENTS.md` for the full refactoring plan
- Check existing library code for patterns and examples
- Run tests to ensure everything still works

---

**Phase 1 Complete** ✅  
All libraries extracted with comprehensive test coverage.
