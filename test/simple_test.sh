#!/bin/bash

# Simple test of the fixed install script
# This simulates the curl | bash execution

echo "Testing the fixed install script..."

# Create a temporary test directory
TEST_DIR="/tmp/zer0-install-test-$(date +%s)"
mkdir -p "$TEST_DIR"

echo "Test directory: $TEST_DIR"

# Test the script by sourcing it in a subshell to check for basic errors
(
    cd "$TEST_DIR"
    
    # Simulate the curl | bash execution by setting variables that would be unset
    unset BASH_SOURCE
    
    # Source the script to test if it defines functions correctly
    if source /Users/bamr87/github/zer0-mistakes/install.sh --help > /dev/null 2>&1; then
        echo "✓ Script sources correctly without BASH_SOURCE errors"
    else
        echo "✗ Script has sourcing issues"
        exit 1
    fi
)

# Clean up
rm -rf "$TEST_DIR"
echo "Test completed successfully!"
