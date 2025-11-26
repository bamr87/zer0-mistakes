#!/bin/bash

# Test runner for library unit tests
# Usage: ./scripts/lib/test/run_tests.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test result tracking
declare -a FAILED_TESTS=()

# Test assertions
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-}"
    
    ((TESTS_RUN++))
    
    if [[ "$expected" == "$actual" ]]; then
        ((TESTS_PASSED++))
        echo -e "${GREEN}✓${NC} $message"
        return 0
    else
        ((TESTS_FAILED++))
        echo -e "${RED}✗${NC} $message"
        echo -e "  Expected: ${YELLOW}$expected${NC}"
        echo -e "  Actual:   ${YELLOW}$actual${NC}"
        FAILED_TESTS+=("$message")
        return 1
    fi
}

assert_true() {
    local condition="$1"
    local message="${2:-}"
    
    ((TESTS_RUN++))
    
    if eval "$condition"; then
        ((TESTS_PASSED++))
        echo -e "${GREEN}✓${NC} $message"
        return 0
    else
        ((TESTS_FAILED++))
        echo -e "${RED}✗${NC} $message"
        echo -e "  Condition failed: ${YELLOW}$condition${NC}"
        FAILED_TESTS+=("$message")
        return 1
    fi
}

assert_false() {
    local condition="$1"
    local message="${2:-}"
    
    ((TESTS_RUN++))
    
    if ! eval "$condition"; then
        ((TESTS_PASSED++))
        echo -e "${GREEN}✓${NC} $message"
        return 0
    else
        ((TESTS_FAILED++))
        echo -e "${RED}✗${NC} $message"
        echo -e "  Condition should have failed: ${YELLOW}$condition${NC}"
        FAILED_TESTS+=("$message")
        return 1
    fi
}

# Test suite header
print_suite_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Testing: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Run test files
run_test_file() {
    local test_file="$1"
    
    if [[ -f "$test_file" && -x "$test_file" ]]; then
        bash "$test_file"
    else
        echo -e "${YELLOW}Skipping $test_file (not found or not executable)${NC}"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Library Unit Test Suite            ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
    
# Export test functions for use in test files
export -f assert_equals assert_true assert_false print_suite_header
export RED GREEN YELLOW BLUE NC
export LIB_DIR
    
# Run individual test files (sourced, not executed)
source "$SCRIPT_DIR/test_version.sh"
source "$SCRIPT_DIR/test_validation.sh"
source "$SCRIPT_DIR/test_git.sh"
source "$SCRIPT_DIR/test_changelog.sh"
source "$SCRIPT_DIR/test_gem.sh"    # Summary
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Total:  $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e "\n${RED}Failed tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗${NC} $test"
        done
        exit 1
    else
        echo -e "\n${GREEN}All tests passed! 🎉${NC}"
        exit 0
    fi
}

main "$@"
