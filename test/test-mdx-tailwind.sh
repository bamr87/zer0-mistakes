#!/bin/bash

# Test script for MDX and Tailwind CSS integration

set -eo pipefail

echo "🧪 Testing MDX and Tailwind CSS Integration"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_file_exists() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

test_dir_exists() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Directory missing: $1"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

test_string_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Missing '$2' in $1"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Configuration files
echo "Test 1: Configuration Files"
echo "----------------------------"
test_file_exists "package.json"
test_file_exists "tailwind.config.js"
test_file_exists "postcss.config.js"
echo ""

# Test 2: Source files
echo "Test 2: Source Files"
echo "--------------------"
test_file_exists "assets/css/tailwind.css"
test_file_exists "scripts/build-mdx.js"
test_file_exists "mdx-demo.mdx"
test_file_exists "pages/_docs/mdx-examples.mdx"
echo ""

# Test 3: Build artifacts
echo "Test 3: Build Artifacts"
echo "-----------------------"
test_file_exists "assets/css/tailwind.output.css"
test_dir_exists "_mdx-generated"
test_file_exists "_mdx-generated/mdx-demo.md"
test_file_exists "_mdx-generated/pages/_docs/mdx-examples.md"
echo ""

# Test 4: MDX processing
echo "Test 4: MDX Processing"
echo "----------------------"
test_string_in_file "_mdx-generated/mdx-demo.md" "class=\"tw-bg-gradient-to-r"
test_string_in_file "_mdx-generated/mdx-demo.md" "layout: \"default\""
test_string_in_file "_mdx-generated/mdx-demo.md" "permalink: \"/mdx-demo/\""
echo ""

# Test 5: Tailwind CSS compilation
echo "Test 5: Tailwind CSS Compilation"
echo "---------------------------------"
test_string_in_file "assets/css/tailwind.output.css" ".tw-bg-gradient-to-r"
test_string_in_file "assets/css/tailwind.output.css" ".tw-btn-primary"
test_string_in_file "assets/css/tailwind.output.css" ".tw-flex"
echo ""

# Test 6: Jekyll integration
echo "Test 6: Jekyll Integration"
echo "---------------------------"
test_string_in_file "_config.yml" "_mdx-generated"
test_string_in_file "_includes/core/head.html" "tailwind.output.css"
echo ""

# Test 7: Documentation
echo "Test 7: Documentation"
echo "---------------------"
test_file_exists "docs/MDX_TAILWIND_GUIDE.md"
test_file_exists "docs/QUICK_START_MDX.md"
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
