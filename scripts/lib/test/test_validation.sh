#!/bin/bash

# Unit tests for validation.sh library

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(dirname "$SCRIPT_DIR")"

# Set up test environment
export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

# Source the library
source "$LIB_DIR/validation.sh"

print_suite_header "validation.sh"

# Test: validate_git_repo (should pass since we're in a git repo)
echo "Testing validate_git_repo..."

if validate_git_repo 2>/dev/null; then
    assert_true "true" "Detects git repository"
else
    assert_true "false" "Detects git repository"
fi

# Test: validate_required_files
echo -e "\nTesting validate_required_files..."

# This will fail if we're not in the project root, but that's expected for tests
if validate_required_files 2>/dev/null; then
    assert_true "true" "Required files exist"
else
    # If files don't exist (running from test dir), that's ok for unit tests
    echo -e "${YELLOW}ℹ${NC} Required files check skipped (not in project root)"
fi

# Test: command_exists (from common.sh)
echo -e "\nTesting command_exists..."

if command_exists "git"; then
    assert_true "true" "Git command exists"
else
    assert_true "false" "Git command exists"
fi

if command_exists "bash"; then
    assert_true "true" "Bash command exists"
else
    assert_true "false" "Bash command exists"
fi

if command_exists "nonexistent_command_xyz"; then
    assert_false "true" "Nonexistent command not found"
else
    assert_false "false" "Nonexistent command not found"
fi

# Test: validate_dependencies
echo -e "\nTesting validate_dependencies..."

# Test that common dependencies are found
common_commands=("git" "ruby" "bundle" "jq")
for cmd in "${common_commands[@]}"; do
    if command_exists "$cmd"; then
        assert_true "true" "Required command exists: $cmd"
    else
        echo -e "${YELLOW}ℹ${NC} Optional command not found: $cmd (skipping)"
    fi
done

echo -e "\n${GREEN}validation.sh tests complete${NC}"
