---
title: Testing
description: Comprehensive testing guide including test suite structure, test development standards, and CI/CD integration.
layout: default
categories:
    - docs
    - development
tags:
    - testing
    - ci-cd
    - quality
permalink: /docs/development/testing/
difficulty: intermediate
estimated_time: 15 minutes
prerequisites:
    - Docker Desktop
    - Basic shell scripting
sidebar:
    nav: docs
---

# Testing Guide

This guide covers the comprehensive testing infrastructure for the Zer0-Mistakes Jekyll theme, ensuring reliability across all features and platforms.

## Test Suite Structure

```
test/
├── test_runner.sh       # Main test orchestration
├── test_core.sh         # Core functionality tests
├── test_deployment.sh   # Deployment and build tests
├── test_quality.sh      # Code quality and linting
├── results/             # Test results and reports
└── README.md            # Test documentation
```

## Running Tests

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

# Generate detailed report
./test/test_runner.sh --report
```

### Docker-Based Testing

```bash
# Run tests in Docker environment
docker-compose up -d
docker-compose exec jekyll ./test/test_runner.sh

# Run tests on clean container
docker-compose down
docker-compose up --build
docker-compose exec jekyll ./test/test_core.sh
```

## Test Categories

### Core Tests (`test_core.sh`)

Tests for Jekyll build and theme functionality:

| Test | Description |
|------|-------------|
| Jekyll Build | Verifies site builds without errors |
| Theme Configuration | Validates `_config.yml` syntax |
| Layout Files | Checks all required layouts exist |
| Include Components | Verifies include files are present |
| Asset Compilation | Tests CSS/JS asset processing |

### Deployment Tests (`test_deployment.sh`)

Tests for deployment compatibility:

| Test | Description |
|------|-------------|
| Docker Build | Verifies Docker image builds |
| Docker Run | Tests site accessibility in container |
| GitHub Pages | Checks remote_theme compatibility |
| Gem Build | Validates gem package creation |

### Quality Tests (`test_quality.sh`)

Code quality and linting tests:

| Test | Description |
|------|-------------|
| Markdown Linting | Validates Markdown syntax |
| YAML Linting | Checks YAML file validity |
| HTML Validation | Validates generated HTML |
| Link Checking | Verifies internal links work |

## Writing Tests

### Test Script Template

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
log_test_pass() {
    ((TESTS_PASSED++))
    echo -e "✅ PASS: $1"
}

log_test_fail() {
    ((TESTS_FAILED++))
    echo -e "❌ FAIL: $1"
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TESTS_RUN++))
    if eval "$test_command"; then
        log_test_pass "$test_name"
    else
        log_test_fail "$test_name"
    fi
}

# Your tests here
run_test "My Test" "[ -f _config.yml ]"

# Summary
echo "Tests: $TESTS_RUN, Passed: $TESTS_PASSED, Failed: $TESTS_FAILED"
exit $TESTS_FAILED
```

### Common Assertions

```bash
# Assert file exists
assert_file_exists() {
    [ -f "$1" ] || { echo "File not found: $1"; return 1; }
}

# Assert directory exists
assert_dir_exists() {
    [ -d "$1" ] || { echo "Directory not found: $1"; return 1; }
}

# Assert command succeeds
assert_command_success() {
    eval "$1" >/dev/null 2>&1 || { echo "Command failed: $1"; return 1; }
}

# Assert string contains
assert_contains() {
    echo "$1" | grep -q "$2" || { echo "'$2' not found"; return 1; }
}
```

## CI/CD Integration

Tests run automatically via GitHub Actions:

- On pull requests
- On pushes to main branch
- Scheduled nightly runs
- Before releases

### GitHub Actions Configuration

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Run test suite
      run: ./test/test_runner.sh --report
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test/results/
```

## Best Practices

### Test Isolation

- Each test should be independent
- Clean up after tests
- Don't rely on test execution order
- Use temporary directories for artifacts

### Test Coverage

- Test all critical paths
- Test error conditions
- Test edge cases
- Test platform-specific behavior

### Test Performance

- Keep tests fast (< 5 seconds each)
- Parallelize independent tests
- Cache test dependencies
- Use mocking when appropriate

## Test Reports

### JSON Report Format

```json
{
  "timestamp": "2025-01-25T05:00:00Z",
  "total": 15,
  "passed": 14,
  "failed": 1,
  "skipped": 0,
  "duration": "45 seconds"
}
```

### HTML Reports

Generate HTML reports for visual inspection:

```bash
./test/test_runner.sh --report --format html
```

## Troubleshooting

### Tests Fail Locally but Pass in CI

1. Check Docker version differences
2. Verify environment variables
3. Check for timing-sensitive tests
4. Review path differences

### Flaky Tests

1. Add retry logic for network tests
2. Increase timeouts for slow operations
3. Mock external dependencies
4. Check for race conditions

### Missing Dependencies

```bash
# Install test dependencies
bundle install --with test

# Install linting tools
npm install -g markdownlint-cli
pip install yamllint
```

## Related

- [CI/CD Pipeline](/docs/development/ci-cd/)
- [Security Scanning](/docs/development/security/)
- [Release Management](/docs/development/release-management/)
