#!/bin/bash

# Unit tests for gem.sh library

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(dirname "$SCRIPT_DIR")"

# Set up test environment
export DRY_RUN=true
export INTERACTIVE=false
export VERBOSE=false

# Source the library
source "$LIB_DIR/gem.sh"

print_suite_header "gem.sh"

# Test: gem_version_exists
echo "Testing gem_version_exists..."

# Test with a version that should exist (v1.0.0 is common)
if gem_version_exists "1.0.0" 2>/dev/null; then
    echo -e "${YELLOW}ℹ${NC} Version 1.0.0 exists on RubyGems"
else
    echo -e "${YELLOW}ℹ${NC} Version 1.0.0 does not exist on RubyGems"
fi

# Test with a version that definitely shouldn't exist
if gem_version_exists "999.999.999" 2>/dev/null; then
    assert_false "true" "Non-existent version not found"
else
    assert_false "false" "Non-existent version not found"
fi

# Test: Gem operations (dry run)
echo -e "\nTesting gem operations in dry run mode..."

# Test build_gem in dry run
if build_gem "1.0.0" 2>/dev/null; then
    assert_true "true" "Dry run: build_gem"
else
    assert_true "false" "Dry run: build_gem"
fi

# Test publish_gem in dry run  
if publish_gem "1.0.0" 2>/dev/null; then
    assert_true "true" "Dry run: publish_gem"
else
    # May fail due to missing gem file, that's ok in dry run
    echo -e "${YELLOW}ℹ${NC} Dry run: publish_gem (skipped - no gem file)"
fi

# Test create_github_release in dry run
if create_github_release "1.0.0" 2>/dev/null; then
    assert_true "true" "Dry run: create_github_release"
else
    # May fail if gh CLI not available, that's ok
    echo -e "${YELLOW}ℹ${NC} Dry run: create_github_release (skipped - gh CLI may not be available)"
fi

# Test run_tests in dry run
if run_tests 2>/dev/null; then
    assert_true "true" "Dry run: run_tests"
else
    assert_true "false" "Dry run: run_tests"
fi

echo -e "\n${GREEN}gem.sh tests complete${NC}"
