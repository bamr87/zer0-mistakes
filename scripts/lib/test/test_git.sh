#!/bin/bash

# Unit tests for git.sh library

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(dirname "$SCRIPT_DIR")"

# Set up test environment
export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

# Source the library
source "$LIB_DIR/git.sh"

print_suite_header "git.sh"

# Test: get_current_branch
echo "Testing get_current_branch..."

current_branch=$(get_current_branch)
if [[ -n "$current_branch" ]]; then
    assert_true "true" "Get current branch: $current_branch"
else
    assert_true "false" "Get current branch"
fi

# Test: get_remote_url
echo -e "\nTesting get_remote_url..."

remote_url=$(get_remote_url "origin" 2>/dev/null)
if [[ -n "$remote_url" ]]; then
    assert_true "true" "Get remote URL: $remote_url"
else
    echo -e "${YELLOW}ℹ${NC} No remote URL found (may not be in git repo)"
fi

# Test: get_repo_info
echo -e "\nTesting get_repo_info..."

if [[ -n "$remote_url" ]]; then
    repo_info=$(get_repo_info "origin" 2>/dev/null)
    if [[ -n "$repo_info" ]]; then
        assert_true "true" "Extract repo info: $repo_info"
    else
        echo -e "${YELLOW}ℹ${NC} Could not extract repo info from URL"
    fi
fi

# Test: tag_exists
echo -e "\nTesting tag_exists..."

# Test with a tag that likely doesn't exist
if tag_exists "v999.999.999"; then
    assert_false "true" "Non-existent tag not found"
else
    assert_false "false" "Non-existent tag not found"
fi

# Test: get_last_version_tag
echo -e "\nTesting get_last_version_tag..."

last_tag=$(get_last_version_tag 2>/dev/null)
if [[ -n "$last_tag" ]]; then
    assert_true "true" "Get last version tag: $last_tag"
else
    echo -e "${YELLOW}ℹ${NC} No version tags found (using initial commit)"
fi

# Test: count_commits_since
echo -e "\nTesting count_commits_since..."

if [[ -n "$last_tag" ]]; then
    commit_count=$(count_commits_since "$last_tag" 2>/dev/null)
    if [[ "$commit_count" =~ ^[0-9]+$ ]]; then
        assert_true "true" "Count commits since $last_tag: $commit_count"
    else
        assert_true "false" "Count commits returns number"
    fi
fi

echo -e "\n${GREEN}git.sh tests complete${NC}"
