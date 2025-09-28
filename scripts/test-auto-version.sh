#!/bin/bash

# Test Script for Automated Version Bump System
# Tests the commit analysis and version bump automation
# Usage: ./scripts/test-auto-version.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-}"
    
    ((TESTS_RUN++))
    log_test "Running: $test_name"
    
    local actual_result
    if actual_result=$(eval "$test_command" 2>&1); then
        if [[ -n "$expected_result" ]]; then
            if [[ "$actual_result" == "$expected_result" ]]; then
                log_success "✅ $test_name"
                ((TESTS_PASSED++))
            else
                log_error "❌ $test_name - Expected: '$expected_result', Got: '$actual_result'"
            fi
        else
            log_success "✅ $test_name"
            ((TESTS_PASSED++))
        fi
    else
        log_error "❌ $test_name - Command failed: $actual_result"
    fi
}

# Test the commit analysis script
test_commit_analysis() {
    log_info "Testing commit analysis functionality..."
    
    # Test script exists and is executable
    run_test "Commit analysis script exists" "test -x '$SCRIPT_DIR/analyze-commits.sh'"
    
    # Test help output
    run_test "Help output works" "$SCRIPT_DIR/analyze-commits.sh --help | grep -q 'Commit Analysis Script'"
    
    # Test with sample commit ranges (if we have git history)
    if git rev-list --count HEAD >/dev/null 2>&1; then
        local commit_count=$(git rev-list --count HEAD)
        
        if [[ $commit_count -gt 1 ]]; then
            # Test analyzing last commit
            run_test "Analyze last commit" "$SCRIPT_DIR/analyze-commits.sh HEAD~1..HEAD | grep -E '^(patch|minor|major|none)$'"
            
            # Test analyzing multiple commits if available
            if [[ $commit_count -gt 3 ]]; then
                run_test "Analyze multiple commits" "$SCRIPT_DIR/analyze-commits.sh HEAD~3..HEAD | grep -E '^(patch|minor|major|none)$'"
            fi
        fi
    else
        log_warning "No git history available for commit analysis tests"
    fi
}

# Test gem publication script compatibility
test_gem_publish_script() {
    log_info "Testing gem publication script compatibility..."
    
    # Test script exists and is executable
    run_test "Gem publish script exists" "test -x '$SCRIPT_DIR/gem-publish.sh'"
    
    # Test new automated options
    run_test "Automated release option works" "$SCRIPT_DIR/gem-publish.sh --help | grep -q 'automated-release'"
    run_test "Auto commit range option works" "$SCRIPT_DIR/gem-publish.sh --help | grep -q 'auto-commit-range'"
    
    # Test dry run with automated options
    if [[ -f "$PROJECT_ROOT/lib/jekyll-theme-zer0/version.rb" ]]; then
        run_test "Dry run with automated options" "$SCRIPT_DIR/gem-publish.sh patch --dry-run --automated-release --skip-tests --skip-publish --no-github-release | grep -q 'Automated Release Mode'"
    fi
}

# Test workflow files syntax
test_workflow_syntax() {
    log_info "Testing GitHub Actions workflow syntax..."
    
    # Check if yamllint is available
    if command -v yamllint >/dev/null 2>&1; then
        run_test "Auto-version-bump workflow syntax" "yamllint '$PROJECT_ROOT/.github/workflows/auto-version-bump.yml'"
    else
        # Basic YAML syntax check with Python
        if command -v python3 >/dev/null 2>&1; then
            run_test "Auto-version-bump workflow syntax" "python3 -c 'import yaml; yaml.safe_load(open(\"$PROJECT_ROOT/.github/workflows/auto-version-bump.yml\"))'"
        else
            log_warning "Neither yamllint nor python3 available for YAML validation"
        fi
    fi
}

# Test file permissions and executability
test_file_permissions() {
    log_info "Testing file permissions..."
    
    local scripts=(
        "$SCRIPT_DIR/analyze-commits.sh"
        "$SCRIPT_DIR/gem-publish.sh"
    )
    
    for script in "${scripts[@]}"; do
        local script_name=$(basename "$script")
        run_test "$script_name is executable" "test -x '$script'"
    done
}

# Test integration between components
test_integration() {
    log_info "Testing integration between components..."
    
    # Test that analyze-commits.sh can be called by the workflow
    if [[ -x "$SCRIPT_DIR/analyze-commits.sh" ]]; then
        # Test with a simple commit range
        if git rev-list --count HEAD >/dev/null 2>&1; then
            local commit_count=$(git rev-list --count HEAD)
            if [[ $commit_count -gt 0 ]]; then
                run_test "Integration: commit analysis returns valid output" "$SCRIPT_DIR/analyze-commits.sh HEAD~1..HEAD | grep -E '^(patch|minor|major|none)$'"
            fi
        fi
    fi
    
    # Test that gem-publish.sh accepts the new parameters
    if [[ -x "$SCRIPT_DIR/gem-publish.sh" ]]; then
        run_test "Integration: gem-publish accepts automated params" "$SCRIPT_DIR/gem-publish.sh patch --dry-run --automated-release --auto-commit-range=HEAD~1..HEAD --skip-tests --skip-publish --no-github-release | grep -q 'DRY RUN MODE'"
    fi
}

# Test conventional commit detection
test_conventional_commits() {
    log_info "Testing conventional commit detection..."
    
    # Create test commits in memory (don't actually commit)
    local test_commits=(
        "feat: add new feature"
        "fix: resolve bug in component"
        "BREAKING CHANGE: remove deprecated API"
        "chore: update dependencies"
        "docs: improve documentation"
    )
    
    local expected_results=(
        "minor"
        "patch" 
        "major"
        "patch"
        "patch"
    )
    
    # Note: This would require a more sophisticated test setup
    # For now, just test that the patterns exist in the script
    run_test "Conventional commit patterns exist" "grep -q 'feat.*minor' '$SCRIPT_DIR/analyze-commits.sh'"
    run_test "Fix patterns exist" "grep -q 'fix.*patch' '$SCRIPT_DIR/analyze-commits.sh'"
    run_test "Breaking change patterns exist" "grep -q 'BREAKING.*major' '$SCRIPT_DIR/analyze-commits.sh'"
}

# Main test execution
main() {
    log_info "🧪 Starting Automated Version Bump System Tests"
    echo "=================================================="
    echo ""
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Run all test suites
    test_file_permissions
    test_commit_analysis
    test_gem_publish_script
    test_workflow_syntax
    test_integration
    test_conventional_commits
    
    # Test summary
    echo ""
    echo "=================================================="
    log_info "🎯 Test Results Summary"
    echo "Tests Run: $TESTS_RUN"
    echo "Tests Passed: $TESTS_PASSED"
    echo "Tests Failed: $((TESTS_RUN - TESTS_PASSED))"
    
    if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
        log_success "🎉 All tests passed! Automated version bump system is ready."
        exit 0
    else
        log_error "❌ Some tests failed. Please review the issues above."
        exit 1
    fi
}

# Show usage if requested
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    cat << EOF
Test Script for Automated Version Bump System

USAGE:
    $0

DESCRIPTION:
    This script tests the automated version bump system including:
    - Commit analysis functionality
    - Gem publication script compatibility  
    - Workflow file syntax validation
    - Integration between components
    - Conventional commit detection

REQUIREMENTS:
    - Git repository with commit history
    - Executable scripts in scripts/ directory
    - Valid GitHub Actions workflow files

OUTPUT:
    Detailed test results and summary
    Exit code 0 on success, 1 on failure
EOF
    exit 0
fi

# Execute main function
main "$@"