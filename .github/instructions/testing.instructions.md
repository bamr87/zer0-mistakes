---
applyTo: "test/**"
description: "Testing guidelines and test development standards for the Jekyll theme"
---

# Testing Guidelines for Zer0-Mistakes

## 🧪 Overview

This document provides comprehensive guidelines for testing the Zer0-Mistakes Jekyll theme. The test suite ensures reliability, compatibility, and quality across all features and platforms.

## 📋 Test Structure

### Test Suite Organization

```
test/
├── test_runner.sh       # Main test orchestration script
├── test_core.sh         # Core functionality tests
├── test_deployment.sh   # Deployment and build tests
├── test_quality.sh      # Code quality and linting tests
├── results/             # Test results and reports
└── README.md            # Test documentation
```

### Test Categories

| Test Suite | Purpose | Command |
|------------|---------|---------|
| Core Tests | Jekyll build, theme functionality | `./test/test_core.sh` |
| Deployment Tests | Docker, GitHub Pages compatibility | `./test/test_deployment.sh` |
| Quality Tests | Linting, validation, best practices | `./test/test_quality.sh` |
| Full Suite | Run all tests with reporting | `./test/test_runner.sh` |

## 🔧 Running Tests

### Quick Start

```bash
# Run all tests
./test/test_runner.sh

# Run specific test suite
./test/test_core.sh
./test/test_deployment.sh
./test/test_quality.sh

# Run with verbose output
./test/test_runner.sh --verbose

# Run specific test category
./test/test_core.sh --category build

# Generate detailed report
./test/test_runner.sh --report
```

### Docker-Based Testing

```bash
# Run tests in Docker environment
docker-compose up -d
docker-compose exec jekyll bash -c "./test/test_runner.sh"

# Run tests on clean container
docker-compose down
docker-compose up --build
docker-compose exec jekyll ./test/test_core.sh
```

### CI/CD Testing

Tests are automatically executed in GitHub Actions:
- On pull requests
- On pushes to main branch
- Scheduled nightly runs
- Before releases

## 🎯 Test Development Standards

### Test Script Structure

```bash
#!/bin/bash
#
# Test Script: test_category.sh
# Description: Tests for specific category
# Exit Codes:
#   0 - All tests passed
#   1 - One or more tests failed
#   2 - Test setup error
#

set -euo pipefail

# Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_RESULTS_DIR="$SCRIPT_DIR/results"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_test_start() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 TEST: $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

log_test_pass() {
    ((TESTS_PASSED++))
    echo -e "✅ \033[0;32mPASS:\033[0m $1"
}

log_test_fail() {
    ((TESTS_FAILED++))
    echo -e "❌ \033[0;31mFAIL:\033[0m $1"
}

log_test_skip() {
    ((TESTS_SKIPPED++))
    echo -e "⏭️  \033[0;33mSKIP:\033[0m $1"
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TESTS_RUN++))
    log_test_start "$test_name"
    
    if eval "$test_command"; then
        log_test_pass "$test_name"
        return 0
    else
        log_test_fail "$test_name"
        return 1
    fi
}

# Test summary
print_test_summary() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 TEST SUMMARY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Total Tests: $TESTS_RUN"
    echo "✅ Passed: $TESTS_PASSED"
    echo "❌ Failed: $TESTS_FAILED"
    echo "⏭️  Skipped: $TESTS_SKIPPED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo "🎉 All tests passed!"
        return 0
    else
        echo "💥 Some tests failed!"
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up test artifacts..."
    # Add cleanup logic
}

trap cleanup EXIT

# Main test execution
main() {
    echo "🚀 Starting test suite: $(basename "$0")"
    
    # Run tests
    run_test "Test Name 1" "test_function_1"
    run_test "Test Name 2" "test_function_2"
    
    # Print summary and exit
    print_test_summary
}

main "$@"
```

### Test Assertions

```bash
# Assert file exists
assert_file_exists() {
    local file="$1"
    if [ -f "$file" ]; then
        return 0
    else
        echo "File not found: $file"
        return 1
    fi
}

# Assert directory exists
assert_dir_exists() {
    local dir="$1"
    if [ -d "$dir" ]; then
        return 0
    else
        echo "Directory not found: $dir"
        return 1
    fi
}

# Assert command succeeds
assert_command_success() {
    local command="$1"
    if eval "$command" >/dev/null 2>&1; then
        return 0
    else
        echo "Command failed: $command"
        return 1
    fi
}

# Assert command fails
assert_command_fails() {
    local command="$1"
    if ! eval "$command" >/dev/null 2>&1; then
        return 0
    else
        echo "Command should have failed: $command"
        return 1
    fi
}

# Assert string contains
assert_contains() {
    local haystack="$1"
    local needle="$2"
    if echo "$haystack" | grep -q "$needle"; then
        return 0
    else
        echo "String not found: '$needle' in '$haystack'"
        return 1
    fi
}

# Assert string equals
assert_equals() {
    local expected="$1"
    local actual="$2"
    if [ "$expected" = "$actual" ]; then
        return 0
    else
        echo "Expected: '$expected', Got: '$actual'"
        return 1
    fi
}
```

## 🧩 Test Categories

### Core Functionality Tests

```bash
# Test Jekyll build
test_jekyll_build() {
    log_test_start "Jekyll Build"
    
    # Clean build directory
    rm -rf _site
    
    # Build site
    if bundle exec jekyll build; then
        assert_dir_exists "_site"
        assert_file_exists "_site/index.html"
        log_test_pass "Jekyll Build"
        return 0
    else
        log_test_fail "Jekyll Build"
        return 1
    fi
}

# Test theme configuration
test_theme_config() {
    log_test_start "Theme Configuration"
    
    # Check _config.yml
    assert_file_exists "_config.yml"
    
    # Validate YAML syntax
    if ruby -ryaml -e "YAML.load_file('_config.yml')" 2>/dev/null; then
        log_test_pass "Theme Configuration"
        return 0
    else
        log_test_fail "Theme Configuration"
        return 1
    fi
}

# Test layouts
test_layouts() {
    log_test_start "Layout Files"
    
    local layouts=("default" "journals" "home" "root")
    
    for layout in "${layouts[@]}"; do
        if assert_file_exists "_layouts/${layout}.html"; then
            echo "✓ Layout found: $layout"
        else
            log_test_fail "Layout Files"
            return 1
        fi
    done
    
    log_test_pass "Layout Files"
    return 0
}
```

### Deployment Tests

```bash
# Test Docker build
test_docker_build() {
    log_test_start "Docker Build"
    
    if docker-compose build; then
        log_test_pass "Docker Build"
        return 0
    else
        log_test_fail "Docker Build"
        return 1
    fi
}

# Test Docker run
test_docker_run() {
    log_test_start "Docker Run"
    
    # Start container
    docker-compose up -d
    
    # Wait for Jekyll to start
    sleep 10
    
    # Check if site is accessible
    if curl -f http://localhost:4000 >/dev/null 2>&1; then
        log_test_pass "Docker Run"
        docker-compose down
        return 0
    else
        log_test_fail "Docker Run"
        docker-compose down
        return 1
    fi
}

# Test GitHub Pages compatibility
test_github_pages() {
    log_test_start "GitHub Pages Compatibility"
    
    # Check for remote_theme configuration
    if grep -q "remote_theme:" _config.yml; then
        log_test_pass "GitHub Pages Compatibility"
        return 0
    else
        log_test_fail "GitHub Pages Compatibility"
        return 1
    fi
}
```

### Quality Tests

```bash
# Test Markdown linting
test_markdown_lint() {
    log_test_start "Markdown Linting"
    
    if command -v markdownlint >/dev/null 2>&1; then
        if markdownlint "**/*.md" --ignore node_modules; then
            log_test_pass "Markdown Linting"
            return 0
        else
            log_test_fail "Markdown Linting"
            return 1
        fi
    else
        log_test_skip "Markdown Linting (markdownlint not installed)"
        return 0
    fi
}

# Test YAML linting
test_yaml_lint() {
    log_test_start "YAML Linting"
    
    if command -v yamllint >/dev/null 2>&1; then
        if yamllint -c .yamllint.yml .; then
            log_test_pass "YAML Linting"
            return 0
        else
            log_test_fail "YAML Linting"
            return 1
        fi
    else
        log_test_skip "YAML Linting (yamllint not installed)"
        return 0
    fi
}

# Test HTML validation
test_html_validation() {
    log_test_start "HTML Validation"
    
    # Build site first
    bundle exec jekyll build
    
    if command -v htmlproofer >/dev/null 2>&1; then
        if htmlproofer _site --check-html --disable-external; then
            log_test_pass "HTML Validation"
            return 0
        else
            log_test_fail "HTML Validation"
            return 1
        fi
    else
        log_test_skip "HTML Validation (htmlproofer not installed)"
        return 0
    fi
}
```

## 🎯 Best Practices

### Test Isolation
- Each test should be independent
- Clean up after tests
- Don't rely on test execution order
- Use temporary directories for test artifacts

### Test Coverage
- Test all critical paths
- Test error conditions
- Test edge cases
- Test platform-specific behavior

### Test Performance
- Keep tests fast (< 5 seconds each)
- Use mocking when appropriate
- Parallelize independent tests
- Cache test dependencies

### Test Maintenance
- Keep tests simple and readable
- Update tests with code changes
- Remove obsolete tests
- Document complex test logic

## 📊 Test Reporting

### Test Results Format

```bash
# Generate JSON test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/test_report_$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total": $TESTS_RUN,
  "passed": $TESTS_PASSED,
  "failed": $TESTS_FAILED,
  "skipped": $TESTS_SKIPPED,
  "duration": "$SECONDS seconds",
  "results": [
    $(echo "$TEST_RESULTS" | jq -Rs .)
  ]
}
EOF
    
    echo "📄 Test report saved: $report_file"
}
```

### CI/CD Integration

```yaml
# GitHub Actions test job
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Run test suite
      run: |
        ./test/test_runner.sh --report
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test/results/
```

## 🔒 Security Testing

### Security Checks
- Scan for hardcoded credentials
- Check for XSS vulnerabilities
- Validate input sanitization
- Test authentication/authorization
- Check dependency vulnerabilities

### Security Test Example

```bash
test_no_secrets() {
    log_test_start "No Hardcoded Secrets"
    
    # Scan for potential secrets
    if grep -r "password\|secret\|api_key" --include="*.yml" --include="*.rb" . | grep -v "test/"; then
        log_test_fail "Found potential secrets in code"
        return 1
    else
        log_test_pass "No Hardcoded Secrets"
        return 0
    fi
}
```

## 📖 Test Documentation

### Test README.md
Each test file should include:
- Purpose and scope
- Prerequisites
- Usage instructions
- Expected outputs
- Known issues

### Inline Documentation
- Document test setup
- Explain complex assertions
- Note platform-specific behavior
- Reference related issues

## 🚀 Continuous Improvement

### Test Metrics
- Track test execution time
- Monitor test stability
- Measure code coverage
- Analyze failure patterns

### Test Evolution
- Add tests for new features
- Update tests for bug fixes
- Refactor tests for clarity
- Remove obsolete tests

---

*These testing guidelines ensure reliable, maintainable, and comprehensive test coverage for the Zer0-Mistakes Jekyll theme. Always write tests for new features and bug fixes.*
