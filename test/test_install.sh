#!/bin/bash

# Test script for the zer0-mistakes installer
# This simulates the curl | bash execution method

set -e

echo "Testing zer0-mistakes installer..."

# Create a temporary test directory
TEST_DIR=$(mktemp -d)
echo "Test directory: $TEST_DIR"

# Test 1: Local installation (should work if running from theme directory)
echo "Test 1: Local installation"
cd /Users/bamr87/github/zer0-mistakes
if ./install.sh "$TEST_DIR/local-test"; then
    echo "✓ Local installation test passed"
else
    echo "✗ Local installation test failed"
fi

# Test 2: Remote installation simulation
echo "Test 2: Remote installation simulation"
cd "$TEST_DIR"
if curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s "remote-test"; then
    echo "✓ Remote installation test passed"
else
    echo "✗ Remote installation test failed"
fi

# Test 3: Help flag
echo "Test 3: Help flag"
if /Users/bamr87/github/zer0-mistakes/install.sh --help > /dev/null; then
    echo "✓ Help flag test passed"
else
    echo "✗ Help flag test failed"
fi

echo "Test completed. Cleaning up..."
rm -rf "$TEST_DIR"
echo "Test directory cleaned up."
