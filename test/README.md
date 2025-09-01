# Comprehensive Test Framework for zer0-mistakes Jekyll Theme

This directory contains a comprehensive testing framework designed to ensure
the quality, security, performance, and accessibility of the zer0-mistakes
Jekyll theme.

## Overview

The test framework provides multiple categories of tests that run automatically
on every GitHub push and can also be executed locally for development.

## Test Categories

### 1. Unit Tests (`test_unit.sh`)

- **Purpose**: Validates individual components and configurations
- **Coverage**:
  - Package.json validation
  - Gemspec validation
  - File structure verification
  - YAML front matter validation
  - Version consistency checks

### 2. Integration Tests (`test_integration.sh`)

- **Purpose**: Tests component interactions and system integration
- **Coverage**:
  - Bundle installation and dependency resolution
  - Jekyll build process validation
  - Docker container integration
  - Plugin functionality verification
  - Asset pipeline testing

### 3. End-to-End Tests (`test_e2e.sh`)

- **Purpose**: Tests complete user workflows from installation to deployment
- **Coverage**:
  - Theme installation process
  - Docker deployment workflows
  - Content creation and publishing
  - Site generation and optimization

### 4. Performance Tests (`test_performance.sh`)

- **Purpose**: Benchmarks build performance and runtime efficiency
- **Coverage**:
  - Build time measurement
  - Memory usage tracking
  - Asset size optimization
  - Concurrent request handling
  - Resource utilization monitoring

### 5. Security Tests (`test_security.sh`)

- **Purpose**: Identifies security vulnerabilities and validates secure
  configurations
- **Coverage**:
  - Dependency vulnerability scanning
  - Sensitive file detection
  - HTTPS configuration validation
  - Security header verification
  - Plugin security assessment

### 6. Accessibility Tests (`test_accessibility.sh`)

- **Purpose**: Ensures WCAG compliance and inclusive design
- **Coverage**:
  - Alt text validation for images
  - Heading structure verification
  - Form accessibility checking
  - ARIA attribute validation
  - Keyboard navigation support
  - Color contrast analysis

### 7. Compatibility Tests (`test_compatibility.sh`)

- **Purpose**: Validates cross-platform and cross-environment compatibility
- **Coverage**:
  - Ruby version compatibility
  - Jekyll version validation
  - Docker compatibility testing
  - YAML/JSON syntax validation
  - Shell script compatibility
  - File encoding verification

## Usage

### Running All Tests

```bash
# Run all tests with default settings
./test/test_runner.sh

# Run with verbose output
./test/test_runner.sh --verbose

# Generate coverage reports
./test/test_runner.sh --coverage

# Run tests in parallel
./test/test_runner.sh --parallel

# Generate different report formats
./test/test_runner.sh --format json
./test/test_runner.sh --format xml
./test/test_runner.sh --format html
```

### Running Specific Test Categories

```bash
# Run only unit tests
./test/test_runner.sh unit

# Run multiple categories
./test/test_runner.sh unit integration security

# Run all except performance tests
./test/test_runner.sh unit integration e2e security accessibility compatibility
```

### Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--verbose` | `-v` | Enable detailed output |
| `--coverage` | `-c` | Generate coverage reports |
| `--format` | `-f` | Output format: text, json, xml, html |
| `--parallel` | `-p` | Run tests in parallel |
| `--help` | `-h` | Show help message |

## Output and Reports

### Test Results Directory Structure

```text
test/
├── results/          # Test execution results
│   ├── results.json  # Detailed test results
│   └── *.log         # Individual test logs
├── coverage/         # Coverage reports (when enabled)
└── reports/          # Generated reports
    ├── report.html   # HTML report
    ├── report.xml    # XML report
    └── report.json   # JSON report
```

### Report Formats

#### Text Format (Default)

- Human-readable console output
- Color-coded results (✓ PASS, ✗ FAIL, ⚠ SKIP)
- Summary statistics

#### JSON Format

- Machine-readable structured data
- Detailed test execution information
- Compatible with CI/CD systems

#### XML Format

- JUnit-compatible format
- Integrates with test reporting tools
- Supports test result visualization

#### HTML Format

- Web-based interactive reports
- Charts and graphs for test metrics
- Detailed failure analysis

## CI/CD Integration

The test framework is fully integrated with GitHub Actions and runs automatically on:

- **Push events** to main/develop branches
- **Pull requests** targeting main/develop branches
- **Manual workflow dispatch** for custom test runs

### Workflow Integration

```yaml
# Example GitHub Actions step
- name: Run comprehensive tests
  run: ./test/test_runner.sh --verbose --format json

- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results
    path: test/results/
    retention-days: 30
```

## Development Guidelines

### Adding New Tests

1. **Create test file**: `test/test_<category>.sh`
2. **Implement test function**: `run_<category>_tests()`
3. **Add test cases**: Use `run_test()` function for individual tests
4. **Update documentation**: Add new tests to this README

### Test Function Template

```bash
#!/bin/bash

# Test category description
run_<category>_tests() {
    log "Running <category> tests..."

    # Test 1: Description
    run_test "Test description" "
        # Test implementation
        command_to_test
    " "<category>"

    # Test 2: Another test
    run_test "Another test description" "
        # Another test implementation
        another_command
    " "<category>"

    log "<Category> tests completed."
}
```

### Test Result Handling

```bash
# Successful test
run_test "File exists" "
    [ -f 'package.json' ]
" "unit"

# Test with custom validation
run_test "Version consistency" "
    pkg_version=\$(jq -r '.version' package.json)
    gem_version=\$(grep 'version:' jekyll-theme-zer0.gemspec | cut -d\"'\" -f2)
    [ \"\$pkg_version\" = \"\$gem_version\" ]
" "unit"

# Test that may be skipped
run_test "Docker available" "
    if command -v docker >/dev/null 2>&1; then
        docker --version >/dev/null 2>&1
    else
        echo 'Docker not available - skipping'
        exit 1  # This will mark test as failed
    fi
" "integration"
```

## Dependencies

### Required Tools

- **bash**: Shell environment
- **jq**: JSON processing (for JSON reports)
- **Ruby**: Jekyll and gem validation
- **Docker**: Container testing (optional)
- **curl**: HTTP testing
- **time**: Performance measurement

### Optional Tools

- **bundle-audit**: Security vulnerability scanning
- **htmlproofer**: Link validation
- **rubocop**: Code quality checking

## Troubleshooting

### Common Issues

#### Tests Failing Due to Missing Dependencies

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y jq curl

# Install Ruby gems
gem install bundle-audit
```

#### Permission Issues

```bash
# Make test scripts executable
chmod +x test/*.sh
chmod +x scripts/*.sh
```

#### Docker Not Available

- Docker tests will be skipped if Docker is not installed
- Install Docker or run tests in a Docker environment

#### Performance Test Variations

- Performance tests may vary based on system resources
- Use `--verbose` flag to see detailed timing information
- Consider system load when interpreting results

### Debug Mode

```bash
# Enable debug output
export DEBUG=true
./test/test_runner.sh --verbose

# Run specific test with debug
bash -x test/test_unit.sh
```

## Contributing

### Test Development Guidelines

1. **Follow naming conventions**: `test_<category>.sh`
2. **Use consistent logging**: `log()`, `info()`, `warn()`, `error()`
3. **Handle failures gracefully**: Tests should not crash the runner
4. **Provide meaningful output**: Clear success/failure messages
5. **Document test purposes**: Comments explaining test objectives
6. **Consider edge cases**: Test both success and failure scenarios

### Code Quality Standards

- **ShellCheck compliance**: Run `shellcheck test/*.sh`
- **Consistent formatting**: Follow existing code style
- **Error handling**: Use `set -euo pipefail` in scripts
- **Documentation**: Update this README for new tests
- **Testing**: Test your tests before committing

## Performance Considerations

### Test Execution Time

- **Unit tests**: < 30 seconds
- **Integration tests**: < 2 minutes
- **E2E tests**: < 5 minutes
- **Performance tests**: < 3 minutes
- **Security tests**: < 1 minute
- **Accessibility tests**: < 1 minute
- **Compatibility tests**: < 1 minute

### Optimization Strategies

- **Parallel execution**: Use `--parallel` flag for faster runs
- **Selective testing**: Run only relevant test categories
- **Caching**: Docker layer caching for faster builds
- **Resource limits**: Configure appropriate timeouts

## Security Considerations

### Test Environment Security

- Tests run in isolated environments
- No production data used in testing
- Sensitive information masked in logs
- Security scans use read-only access

### Vulnerability Management

- Regular updates of security scanning tools
- Automated dependency vulnerability checks
- Security test results integrated into CI/CD

## Future Enhancements

### Planned Features

- **Test coverage integration**: Code coverage reporting
- **Performance regression detection**: Historical performance tracking
- **Accessibility automation**: Enhanced WCAG compliance testing
- **Cross-browser testing**: Browser compatibility validation
- **Load testing**: Stress testing capabilities
- **Integration with external services**: API testing and mocking

### Extension Points

- **Custom test categories**: Easy to add new test types
- **Plugin architecture**: Extensible test framework
- **Configuration management**: Environment-specific test settings
- **Result visualization**: Enhanced reporting and dashboards

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Make scripts executable
chmod +x test/*.sh scripts/*.sh

# Run all tests
./test/test_runner.sh --verbose

# View results
cat test/results/results.json
open test/reports/report.html
```

For more information, see the individual test files or check the GitHub Actions workflows for CI/CD integration examples.
