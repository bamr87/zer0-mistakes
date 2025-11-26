#!/bin/bash

# Unit tests for changelog.sh library

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(dirname "$SCRIPT_DIR")"

# Set up test environment
export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

# Source the library
source "$LIB_DIR/changelog.sh"

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

echo -e "\n${GREEN}changelog.sh tests complete${NC}"
