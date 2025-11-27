# Release Workflow Improvement Recommendations

## Current State Analysis

The project has three main release-related scripts with overlapping functionality:

- **`gem-publish.sh`** (700+ lines) - Comprehensive release automation
- **`release.sh`** (290+ lines) - Alternative release workflow
- **`build.sh`** (180+ lines) - Gem building utility

## Issues Identified

### 1. Script Overlap and Confusion

**Problem**: Three scripts with unclear responsibilities

- `gem-publish.sh` does everything (version bump, changelog, build, publish, GitHub release)
- `release.sh` duplicates most of this functionality
- `build.sh` is a subset of both

**Impact**: Contributors don't know which script to use

### 2. Excessive Complexity in gem-publish.sh

**Problem**: Single 700-line script trying to do too much

- 10+ command-line flags
- Complex argument parsing
- Difficult to test individual components
- Hard to maintain

**Example**: Changelog generation alone is ~200 lines embedded in the main script

### 3. Inconsistent Error Handling

**Problem**: Different validation patterns across scripts

```bash
# gem-publish.sh
if [[ ! -f "$file" ]]; then
    error "Required file not found: $file"
fi

# release.sh
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "Must be run from the repository root directory"
fi
```

### 4. Redundant Functionality

**Problem**: Same operations implemented multiple times

- Version validation (3 places)
- Git operations (3 places)
- Gem building (3 places)
- GitHub release creation (2 places)

## Recommended Refactoring

### Strategy: Modular Library + Simple Commands

Replace the three scripts with a modular approach:

```
scripts/
├── lib/
│   ├── version.sh          # Version operations library
│   ├── changelog.sh        # Changelog generation library
│   ├── validation.sh       # Environment validation library
│   ├── git.sh              # Git operations library
│   └── gem.sh              # Gem build/publish library
├── release                 # Main release command (simplified)
├── build                   # Build-only command
└── analyze-commits.sh      # Keep as-is (already focused)
```

### New Simplified Architecture

#### 1. Library Functions (scripts/lib/)

**version.sh** - Version management

```bash
#!/bin/bash
# Single responsibility: version operations

get_current_version() { ... }
calculate_new_version() { ... }
update_version_files() { ... }
validate_version_format() { ... }
```

**changelog.sh** - Changelog generation

```bash
#!/bin/bash
# Single responsibility: changelog operations

generate_changelog() { ... }
extract_release_notes() { ... }
categorize_commit() { ... }
```

**validation.sh** - Environment validation

```bash
#!/bin/bash
# Single responsibility: validation checks

validate_git_repo() { ... }
validate_clean_working_dir() { ... }
validate_dependencies() { ... }
validate_rubygems_auth() { ... }
```

**git.sh** - Git operations

```bash
#!/bin/bash
# Single responsibility: git operations

get_last_version_tag() { ... }
commit_release() { ... }
create_tag() { ... }
push_changes() { ... }
```

**gem.sh** - Gem operations

```bash
#!/bin/bash
# Single responsibility: gem build/publish

build_gem() { ... }
validate_gemspec() { ... }
publish_to_rubygems() { ... }
create_github_release() { ... }
```

#### 2. Simple Commands (scripts/)

**release** - Main release command (100 lines max)

```bash
#!/bin/bash
# Main release orchestrator

source "$(dirname "$0")/lib/validation.sh"
source "$(dirname "$0")/lib/version.sh"
source "$(dirname "$0")/lib/changelog.sh"
source "$(dirname "$0")/lib/gem.sh"
source "$(dirname "$0")/lib/git.sh"

main() {
    # Parse simple arguments
    local version_type="${1:-patch}"
    local dry_run="${2:-false}"

    # Validate
    validate_environment

    # Execute workflow
    local current_version=$(get_current_version)
    local new_version=$(calculate_new_version "$current_version" "$version_type")

    generate_changelog "$new_version"
    update_version_files "$new_version"
    build_gem "$new_version"
    commit_and_tag "$new_version"
    publish_gem "$new_version"
    create_github_release "$new_version"
    push_changes
}

main "$@"
```

**build** - Build-only command (50 lines max)

```bash
#!/bin/bash
# Simple gem builder

source "$(dirname "$0")/lib/validation.sh"
source "$(dirname "$0")/lib/gem.sh"

main() {
    validate_gemspec
    build_gem "$(get_current_version)"
}

main "$@"
```

## Migration Plan

### Phase 1: Extract Libraries (Week 1)

1. Create `scripts/lib/` directory
2. Extract version operations → `lib/version.sh`
3. Extract validation → `lib/validation.sh`
4. Add tests for each library

### Phase 2: Simplify Commands (Week 2)

1. Create new `scripts/release` using libraries
2. Test extensively with `--dry-run`
3. Keep old scripts as `*.legacy.sh`

### Phase 3: Update Documentation (Week 3)

1. Update CONTRIBUTING.md
2. Update VS Code tasks
3. Update GitHub Actions workflows
4. Deprecate old scripts

### Phase 4: Remove Legacy (Week 4)

1. Remove `gem-publish.sh`
2. Remove `release.sh`
3. Remove `build.sh`
4. Clean up documentation

## Benefits of Refactoring

### 1. Clarity

- Each file has ONE responsibility
- Easy to understand what each component does
- Clear entry points for common tasks

### 2. Testability

- Small, focused functions easy to test
- Can unit test libraries independently
- Easier to mock dependencies

### 3. Maintainability

- Changes isolated to specific files
- Less duplication means fewer places to update
- Easier for new contributors

### 4. Reusability

- Libraries can be used by other scripts
- GitHub Actions can source specific libraries
- No need to copy-paste code

### 5. Simplicity

- Main commands under 100 lines
- Fewer command-line flags
- Sensible defaults

## Example: Simplified Release Command

**Before** (gem-publish.sh):

```bash
./scripts/gem-publish.sh patch --dry-run --skip-tests --skip-changelog \
  --skip-publish --no-github-release --non-interactive \
  --automated-release --auto-commit-range=HEAD~5..HEAD
```

**After** (release):

```bash
# Most common case (patch release)
./scripts/release

# With options
./scripts/release minor --dry-run

# Advanced (still supported through env vars)
SKIP_TESTS=true ./scripts/release patch
```

## Testing Strategy

### Unit Tests for Libraries

```bash
scripts/lib/test/
├── test_version.sh
├── test_changelog.sh
├── test_validation.sh
├── test_git.sh
└── test_gem.sh
```

### Integration Tests

```bash
test/
├── test_release_workflow.sh
├── test_build_workflow.sh
└── test_dry_run.sh
```

## Backward Compatibility

### Transition Period (2 releases)

1. Keep old scripts with deprecation warnings
2. Redirect to new commands
3. Log usage to track adoption

**Example deprecation wrapper**:

```bash
#!/bin/bash
# gem-publish.sh (deprecated)

echo "⚠️  WARNING: gem-publish.sh is deprecated"
echo "    Use: ./scripts/release $*"
echo ""
echo "    This wrapper will be removed in v0.3.0"
echo ""

exec "$(dirname "$0")/release" "$@"
```

## Implementation Checklist

- [ ] Create `scripts/lib/` directory structure
- [ ] Extract and test `version.sh`
- [ ] Extract and test `changelog.sh`
- [ ] Extract and test `validation.sh`
- [ ] Extract and test `git.sh`
- [ ] Extract and test `gem.sh`
- [ ] Create new `release` command
- [ ] Create new `build` command
- [ ] Add deprecation wrappers for old scripts
- [ ] Update all documentation
- [ ] Update VS Code tasks
- [ ] Update GitHub Actions
- [ ] Test on real release
- [ ] Remove old scripts after 2 releases

## Success Metrics

After refactoring, we should see:

- **70% reduction** in total lines of code
- **100% test coverage** for library functions
- **50% reduction** in maintenance time
- **Zero confusion** about which script to use
- **Faster onboarding** for new contributors

## Questions to Consider

1. Should we keep the `Rakefile` approach instead?
   - Pro: Standard Ruby tooling
   - Con: Less flexible for shell-based automation

2. Should we migrate to a Ruby-based CLI?
   - Pro: Better for gem ecosystem
   - Con: Adds dependency, reduces portability

3. Should we use existing tools like `semantic-release`?
   - Pro: Battle-tested, feature-rich
   - Con: Node.js dependency, less customizable

## Recommendation

**Proceed with shell script refactoring** because:

1. Maintains zero external dependencies
2. Keeps Docker-first approach
3. Easier for contributors to understand
4. Bash is universal across dev environments
5. Custom workflow fits project needs

---

**Next Steps**: Review this proposal, get feedback, then start Phase 1 (library extraction) in a feature branch.
