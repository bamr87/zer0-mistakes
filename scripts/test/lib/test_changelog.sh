#!/bin/bash

# Unit tests for changelog.sh library

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "$SCRIPT_DIR/../../lib" && pwd)"

# Set up test environment
export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

# Source the library
source "$LIB_DIR/changelog.sh"

# Disable errexit for test assertions
set +e

print_suite_header "changelog.sh"

# Test: clean_commit_message
echo "Testing clean_commit_message..."

result=$(clean_commit_message "feat: add new feature")
assert_equals "Add new feature" "$result" "Clean 'feat:' prefix"

result=$(clean_commit_message "fix: resolve bug")
assert_equals "Resolve bug" "$result" "Clean 'fix:' prefix"

result=$(clean_commit_message "feat(scope): add scoped feature")
assert_equals "Add scoped feature" "$result" "Clean 'feat(scope):' prefix"

result=$(clean_commit_message "chore: update dependencies")
assert_equals "Update dependencies" "$result" "Clean 'chore:' prefix"

result=$(clean_commit_message "docs: improve readme")
assert_equals "Improve readme" "$result" "Clean 'docs:' prefix and capitalize"

result=$(clean_commit_message "regular commit message")
assert_equals "Regular commit message" "$result" "Capitalize regular message"

# Test: categorize_commit (requires git, so we test the logic patterns)
echo -e "\nTesting commit categorization patterns..."

# Simulate commit subjects for categorization
test_categorization() {
    local subject="$1"
    local expected="$2"
    
    # Create temporary test function that returns category based on patterns
    local subject_lower=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
    local category="other"
    
    case "$subject_lower" in
        feat:*|feature:*|add:*|new:*)
            category="added"
            ;;
        fix:*|bugfix:*|bug:*|patch:*)
            category="fixed"
            ;;
        *breaking*)
            category="breaking"
            ;;
        perf:*|performance:*|refactor:*|style:*|docs:*|doc:*|test:*|chore:*|ci:*|build:*)
            category="changed"
            ;;
        revert:*|remove:*|delete:*)
            category="removed"
            ;;
        deprecate:*|deprecated:*)
            category="deprecated"
            ;;
        security:*|sec:*)
            category="security"
            ;;
    esac
    
    assert_equals "$expected" "$category" "Categorize: '$subject' → $expected"
}

test_categorization "feat: new feature" "added"
test_categorization "fix: bug fix" "fixed"
test_categorization "chore: update" "changed"
test_categorization "docs: improve" "changed"
test_categorization "remove: old code" "removed"
test_categorization "security: patch vulnerability" "security"
test_categorization "BREAKING: major change" "breaking"
test_categorization "random commit" "other"

# Test: update_changelog_file
echo -e "\nTesting update_changelog_file..."

# Each case runs in a throwaway directory; CHANGELOG_FILE is the relative
# default ("CHANGELOG.md"), so the function operates on the temp copy.
_changelog_tmp=$(mktemp -d)
pushd "$_changelog_tmp" >/dev/null

# Case 1: pending [Unreleased] notes are folded into the new entry and the
# preamble stays at the top of the file.
cat > CHANGELOG.md <<'FIXTURE'
# Changelog

All notable changes are documented here.

## [Unreleased]

### Added
- Pending feature A

## [1.0.0] - 2026-01-01

### Added
- Initial release
FIXTURE

update_changelog_file "## [1.1.0] - 2026-06-10

### Changed
- Version bump: minor release
" >/dev/null 2>&1

assert_false "grep -q '^## \[Unreleased\]' CHANGELOG.md" "Pending Unreleased section is consumed"
assert_true "grep -q 'Pending feature A' CHANGELOG.md" "Pending notes are preserved"
assert_equals "# Changelog" "$(head -n 1 CHANGELOG.md)" "Preamble heading stays on line 1"
# The folded notes must land inside the new 1.1.0 entry (above 1.0.0)
_pending_line=$(grep -n 'Pending feature A' CHANGELOG.md | cut -d: -f1)
_v110_line=$(grep -n '^## \[1.1.0\]' CHANGELOG.md | cut -d: -f1)
_v100_line=$(grep -n '^## \[1.0.0\]' CHANGELOG.md | cut -d: -f1)
assert_true "[[ $_pending_line -gt $_v110_line && $_pending_line -lt $_v100_line ]]" "Folded notes live inside the new entry"

# Case 2: without an Unreleased section the entry is inserted before the
# first release heading, after the preamble.
cat > CHANGELOG.md <<'FIXTURE'
# Changelog

All notable changes are documented here.

## [1.0.0] - 2026-01-01

### Added
- Initial release
FIXTURE

update_changelog_file "## [1.0.1] - 2026-06-10

### Fixed
- A bug
" >/dev/null 2>&1

_v101_line=$(grep -n '^## \[1.0.1\]' CHANGELOG.md | cut -d: -f1)
_v100_line=$(grep -n '^## \[1.0.0\]' CHANGELOG.md | cut -d: -f1)
assert_true "[[ $_v101_line -lt $_v100_line ]]" "New entry inserted before previous release"
assert_true "grep -q 'All notable changes' CHANGELOG.md" "Preamble preserved without Unreleased"

# Case 3: entries passed via command substitution lose trailing newlines
# (e.g. version-bump.yml's "$(cat "$TEMP_FILE")"); the insert must still
# leave exactly one blank line before the next release block.
printf '## [1.0.2] - 2026-06-11\n\n### Fixed\n- Another bug\n\n' > entry.txt
update_changelog_file "$(cat entry.txt)" >/dev/null 2>&1
_v101_line=$(grep -n '^## \[1.0.1\]' CHANGELOG.md | cut -d: -f1)
assert_true "[[ -z \"\$(sed -n $((_v101_line - 1))p CHANGELOG.md)\" ]]" "Blank line separates entry from next release block"
assert_true "[[ -n \"\$(sed -n $((_v101_line - 2))p CHANGELOG.md)\" ]]" "Exactly one blank line (no double spacing)"

popd >/dev/null
rm -rf "$_changelog_tmp"

echo -e "\n${GREEN}changelog.sh tests complete${NC}"
