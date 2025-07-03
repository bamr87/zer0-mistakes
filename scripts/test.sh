#!/bin/bash

# Test script for zer0-mistakes Jekyll theme
# Usage: ./scripts/test.sh [--verbose]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to log messages
log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log "Running: $test_name"
    
    if [[ "$VERBOSE" == true ]]; then
        echo "Command: $test_command"
    fi
    
    if eval "$test_command" > /dev/null 2>&1; then
        success "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        fail "$test_name"
        if [[ "$VERBOSE" == true ]]; then
            echo "Command output:"
            eval "$test_command" 2>&1 || true
        fi
    fi
}

log "Running tests for zer0-mistakes Jekyll theme..."

# Test 1: Validate package.json
run_test "Validate package.json syntax" "jq empty package.json"

# Test 2: Validate package.json version
run_test "Validate package.json version format" "jq -r '.version' package.json | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$'"

# Test 3: Validate gemspec syntax
run_test "Validate gemspec syntax" "gem specification jekyll-theme-zer0.gemspec"

# Test 4: Build gem (test build)
run_test "Test gem build" "gem build jekyll-theme-zer0.gemspec"

# Test 5: Check for required files
run_test "Check README.md exists" "test -f README.md"
run_test "Check LICENSE exists" "test -f LICENSE"
run_test "Check _layouts directory exists" "test -d _layouts"
run_test "Check _includes directory exists" "test -d _includes"
run_test "Check _sass directory exists" "test -d _sass"
run_test "Check assets directory exists" "test -d assets"

# Test 6: Validate YAML front matter in layouts
if [[ -d "_layouts" ]]; then
    for layout in _layouts/*.html; do
        if [[ -f "$layout" ]]; then
            layout_name=$(basename "$layout")
            run_test "Validate YAML front matter in $layout_name" "head -10 '$layout' | grep -q '---' && head -10 '$layout' | tail -n +2 | head -n -1 | ruby -ryaml -e 'YAML.load(STDIN.read)'"
        fi
    done
fi

# Test 7: Check for common Jekyll requirements
run_test "Check Jekyll dependency in gemspec" "grep -q 'jekyll' jekyll-theme-zer0.gemspec"

# Test 8: Validate version consistency
PACKAGE_VERSION=$(jq -r '.version' package.json)
if [[ -f "jekyll-theme-zer0-${PACKAGE_VERSION}.gem" ]]; then
    run_test "Version consistency check" "test -f jekyll-theme-zer0-${PACKAGE_VERSION}.gem"
fi

# Test 9: Check scripts are executable
if [[ -d "scripts" ]]; then
    for script in scripts/*.sh; do
        if [[ -f "$script" ]]; then
            script_name=$(basename "$script")
            run_test "Check $script_name is executable" "test -x '$script'"
        fi
    done
fi

# Test 10: Validate bundle install
run_test "Test bundle install" "bundle install --quiet"

# Clean up test gem file
rm -f jekyll-theme-zer0-*.gem 2>/dev/null || true

# Test results
log ""
log "Test Results:"
log "Tests run: $TESTS_RUN"
log "Tests passed: $TESTS_PASSED"
log "Tests failed: $((TESTS_RUN - TESTS_PASSED))"

if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
    success "All tests passed!"
    exit 0
else
    fail "Some tests failed!"
    exit 1
fi
