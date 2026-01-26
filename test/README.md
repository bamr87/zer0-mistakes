# Consolidated Testing Framework for zer0-mistakes Jekyll Theme

## 🎯 Overview

The zer0-mistakes testing framework provides **6 comprehensive test suites** for validating the Jekyll theme across installation modes, site generation, and visual rendering.

## 📋 Test Suite Architecture

### Quick Reference

| Suite | Script | Purpose | Runtime |
|-------|--------|---------|---------|
| Core | `test_core.sh` | Unit, integration, validation | ~2-3 min |
| Deployment | `test_deployment.sh` | Docker, E2E workflows | ~5-8 min |
| Quality | `test_quality.sh` | Security, accessibility | ~4-6 min |
| Installation | `test_installation.sh` | CLI, modes, edge cases | ~3-5 min |
| Site Generation | `test_site_generation.sh` | Config matrix builds | ~5-10 min |
| Visual | `test_visual.sh` | Screenshots, responsive | ~10-15 min |

### 🔧 Core Test Suite (`test_core.sh`)

**Purpose:** Fundamental functionality validation  
**Runtime:** ~2-3 minutes  
**Focus Areas:**

- **Unit Tests**: File structure, YAML syntax, gemspec validity, version consistency
- **Integration Tests**: Bundle install, Jekyll build, gem build process
- **Validation Tests**: Liquid templates, Sass compilation, JavaScript syntax

```bash
# Run core tests only
./test/test_core.sh

# With verbose output
./test/test_core.sh --verbose

# Generate JSON report
./test/test_core.sh --format json
```

### 🚀 Deployment Test Suite (`test_deployment.sh`)

**Purpose:** Installation and deployment validation  
**Runtime:** ~5-8 minutes  
**Focus Areas:**

- **Installation Tests**: Local full/minimal installation, remote installation
- **Docker Tests**: Environment setup, volume mounting, Jekyll build in Docker
- **End-to-End Tests**: Complete workflow, GitHub Pages readiness

```bash
# Run deployment tests
./test/test_deployment.sh

# Skip Docker tests (if Docker unavailable)
./test/test_deployment.sh --skip-docker

# Skip remote installation tests
./test/test_deployment.sh --skip-remote

# Keep test environment for debugging
./test/test_deployment.sh --no-cleanup --verbose
```

### 🏆 Quality Test Suite (`test_quality.sh`)

**Purpose:** Security, accessibility, and performance validation  
**Runtime:** ~4-6 minutes  
**Focus Areas:**

- **Security Tests**: Vulnerability scanning, sensitive files, hardcoded secrets
- **Accessibility Tests**: Semantic HTML, alt text, color contrast, keyboard navigation
- **Compatibility Tests**: Ruby/Jekyll versions, cross-platform files, browser compatibility
- **Performance Tests**: Build performance, asset optimization, page generation

```bash
# Run quality tests
./test/test_quality.sh

# With detailed output
./test/test_quality.sh --verbose
```

### 📦 Installation Test Suite (`test_installation.sh`)

**Purpose:** Comprehensive install.sh script validation  
**Runtime:** ~3-5 minutes  
**Focus Areas:**

- **CLI Tests**: All argument combinations (-h, --help, -f, --full, -m, --minimal)
- **Mode Tests**: Full vs minimal installation file verification
- **Error Handling**: Read-only directories, missing files, graceful failures
- **Edge Cases**: Backups, path with spaces, symlinks, existing files
- **Upgrade Scenarios**: Minimal to full, idempotent reinstalls, customization preservation

```bash
# Run installation tests
./test/test_installation.sh

# Skip remote installation tests (faster)
./test/test_installation.sh --skip-remote

# Keep test workspaces for debugging
./test/test_installation.sh --no-cleanup --verbose
```

### 🔧 Site Generation Test Suite (`test_site_generation.sh`)

**Purpose:** Configuration matrix site building and validation  
**Runtime:** ~5-10 minutes  
**Focus Areas:**

- **Full Mode**: Complete theme installation with all files
- **Minimal Mode**: Essential files only
- **Remote Theme Mode**: GitHub Pages remote_theme configuration
- **Gem Mode**: Ruby gem-based theme installation
- **Build Validation**: Jekyll build success, HTML generation, asset compilation

```bash
# Test all installation modes
./test/test_site_generation.sh --all

# Test specific mode
./test/test_site_generation.sh --mode full

# Keep generated sites for inspection
./test/test_site_generation.sh --mode minimal --keep
```

### 👁️ Visual Test Suite (`test_visual.sh`)

**Purpose:** Browser-based screenshot and visual regression testing  
**Runtime:** ~10-15 minutes  
**Focus Areas:**

- **Screenshot Capture**: Homepage, docs, about pages
- **Responsive Testing**: Desktop (1280px), tablet (768px), mobile (375px)
- **Theme Verification**: Dark/light mode toggle
- **Visual Regression**: Baseline comparison with diff generation

**Prerequisites:** Node.js 18+, Playwright

```bash
# Run visual tests for all modes
./test/test_visual.sh --all-modes

# Test specific mode
./test/test_visual.sh --mode full

# Update baseline screenshots
./test/test_visual.sh --mode full --update-baseline

# Verbose output
./test/test_visual.sh --verbose
```

## 🎮 Unified Test Runner (`test_runner.sh`)

The **consolidated test runner** orchestrates all test suites with advanced features:

### Basic Usage

```bash
# Run all core test suites (excludes visual for speed)
./test/test_runner.sh

# Run ALL suites including visual tests
./test/test_runner.sh --suites full

# Run specific suites
./test/test_runner.sh --suites core
./test/test_runner.sh --suites core,deployment
./test/test_runner.sh --suites installation,site_generation

# Run with advanced options
./test/test_runner.sh --suites all --verbose --format json --parallel
```

### Advanced Options

```bash
# CI/CD Integration
./test/test_runner.sh --suites all --environment ci --skip-docker --skip-remote

# Parallel execution (faster)
./test/test_runner.sh --suites all --parallel

# Fail-fast mode
./test/test_runner.sh --suites all --fail-fast

# Custom timeout
./test/test_runner.sh --suites all --timeout 600
```

## 🔄 Migration from Legacy Tests

### Before (Legacy Structure)

```
test/
├── test_unit.sh              # ❌ Replaced by test_core.sh
├── test_integration.sh       # ❌ Replaced by test_core.sh
├── test_e2e.sh              # ❌ Replaced by test_deployment.sh
├── test_installation_complete.sh # ❌ Replaced by test_deployment.sh
├── test_docker_deployment.sh # ❌ Replaced by test_deployment.sh
├── test_security.sh         # ❌ Replaced by test_quality.sh
├── test_accessibility.sh    # ❌ Replaced by test_quality.sh
├── test_compatibility.sh    # ❌ Replaced by test_quality.sh
├── test_performance.sh      # ❌ Replaced by test_quality.sh
└── ... (6+ more scripts)
```

### After (Consolidated Structure)

```
test/
├── test_core.sh             # ✅ Unit + Integration + Validation
├── test_deployment.sh       # ✅ Installation + Docker + E2E
├── test_quality.sh          # ✅ Security + Accessibility + Compatibility + Performance
├── test_installation.sh     # ✅ CLI + Modes + Error Handling + Edge Cases
├── test_site_generation.sh  # ✅ Config Matrix + Jekyll Build + Content Validation
├── test_visual.sh           # ✅ Screenshots + Responsive + Visual Regression
├── test_runner.sh           # ✅ Orchestrates all suites
├── playwright.config.js     # ✅ Playwright visual test configuration
├── lib/                     # ✅ Shared test utilities
│   ├── install_test_utils.sh
│   └── config_matrix_generator.sh
├── visual/                  # ✅ Visual test artifacts
│   ├── baseline/            # Reference screenshots by mode
│   ├── current/             # Current run screenshots
│   └── diff/                # Visual diff images
├── results/                 # ✅ Test results (JSON)
├── reports/                 # ✅ Aggregated reports
└── coverage/                # ✅ Coverage reports
```

## 🚀 Quick Start Guide

### For Developers

```bash
# Quick validation during development
./test/test_runner.sh --suites core

# Full validation before commit
./test/test_runner.sh --suites core,deployment

# Complete quality check
./test/test_runner.sh --suites all
```

### For CI/CD

```bash
# Fast feedback in PR checks
./test/test_runner.sh --suites core --environment ci

# Comprehensive testing on main branch
./test/test_runner.sh --suites all --environment ci --skip-remote

# Docker integration testing
./test/test_runner.sh --suites deployment --environment docker
```

### For Quality Assurance

```bash
# Security and accessibility audit
./test/test_runner.sh --suites quality --verbose

# Performance benchmarking
./test/test_quality.sh --verbose

# Cross-platform compatibility
./test/test_quality.sh
```

## 📊 Test Reporting

### Output Formats

- **Text**: Human-readable console output (default)
- **JSON**: Machine-readable for CI/CD integration
- **XML**: JUnit-compatible for test reporting tools
- **HTML**: Rich web-based reports

```bash
# Generate JSON reports for CI/CD
./test/test_runner.sh --format json

# Generate HTML reports for review
./test/test_runner.sh --format html

# All formats
./test/test_runner.sh --format json
./test/test_runner.sh --format xml
./test/test_runner.sh --format html
```

### Report Locations

```
test/
├── results/          # Individual test results (JSON)
├── reports/          # Aggregated reports (JSON/XML/HTML)
└── coverage/         # Coverage reports (when enabled)
```

## 🔧 Configuration & Environment Variables

### Environment Detection

The test framework automatically detects and adapts to different environments:

- **`local`**: Developer workstation with full toolchain
- **`ci`**: Continuous Integration environment (GitHub Actions)
- **`docker`**: Docker-based testing environment

### Skip Options

- **`--skip-docker`**: Skip Docker-related tests (when Docker unavailable)
- **`--skip-remote`**: Skip remote installation tests (for offline/private environments)

### Timeout Configuration

- **Default**: 300 seconds per test suite
- **Deployment**: 600 seconds (includes Docker operations)
- **Custom**: Use `--timeout <seconds>`

## 🎯 CI/CD Integration

### GitHub Actions Workflows

#### New Consolidated Workflow

```yaml
# .github/workflows/consolidated-testing.yml
- name: Run Core Tests
  run: ./test/test_runner.sh --suites core --environment ci

- name: Run Deployment Tests
  run: ./test/test_runner.sh --suites deployment --environment ci --skip-docker

- name: Run Quality Tests
  run: ./test/test_runner.sh --suites quality --environment ci
```

#### Legacy Workflow Updates

```yaml
# Before
- run: ./test/test_runner.sh --verbose --format json

# After
- run: ./test/test_runner.sh --suites all --verbose --format json --environment ci
```

### Test Matrix Strategy

- **Pull Requests**: Core tests only (fast feedback)
- **Main Branch**: Core + Deployment tests
- **Releases**: All test suites (comprehensive validation)
- **Nightly**: All tests + Docker integration

## 📈 Performance Improvements

### Execution Time Comparison

| Test Scope     | Legacy Framework | Consolidated Framework | Improvement    |
| -------------- | ---------------- | ---------------------- | -------------- |
| **Core Tests** | ~8-10 minutes    | ~2-3 minutes           | **65% faster** |
| **Deployment** | ~12-15 minutes   | ~5-8 minutes           | **50% faster** |
| **Quality**    | ~10-12 minutes   | ~4-6 minutes           | **55% faster** |
| **Full Suite** | ~25-30 minutes   | ~8-12 minutes          | **60% faster** |

### Benefits Achieved

- ✅ **Reduced Complexity**: 15+ scripts → 3 main suites
- ✅ **Faster Execution**: 60% reduction in total runtime
- ✅ **Better Maintainability**: Unified interfaces and consistent patterns
- ✅ **Improved CI/CD**: Flexible suite selection and parallel execution
- ✅ **Enhanced Reporting**: Consolidated results and better visualization

## 🛠️ Troubleshooting

### Common Issues

#### "Unknown test suite" Error

```bash
# Error: Unknown test suite: xyz
./test/test_runner.sh --suites xyz

# Solution: Use valid suite names
./test/test_runner.sh --suites core,deployment,quality,installation,site_generation,visual
```

#### Docker Tests Failing

```bash
# Skip Docker tests if Docker unavailable
./test/test_runner.sh --suites deployment --skip-docker

# Or run Docker-specific tests separately
./test/test_deployment.sh --verbose
```

#### Remote Installation Timeouts

```bash
# Skip remote tests in restricted environments
./test/test_runner.sh --suites deployment --skip-remote
```

### Debug Mode

```bash
# Keep test environments for inspection
./test/test_deployment.sh --no-cleanup --verbose

# Check individual test results
ls -la test/results/
cat test/results/core_test_*.json
```

### Performance Issues

```bash
# Use parallel execution for faster runs
./test/test_runner.sh --suites all --parallel

# Increase timeout for slow environments
./test/test_runner.sh --suites all --timeout 900
```

## 🧰 Configuration Matrix Generator

The `config_matrix_generator.sh` utility creates Jekyll sites for each installation mode:

### Available Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `full` | Complete theme with all files | Local development |
| `minimal` | Essential files only | Lightweight setup |
| `remote_theme` | GitHub Pages remote_theme | GitHub Pages deployment |
| `gem` | Ruby gem-based installation | Gem distribution |

### Usage

```bash
# Generate a site for a specific mode
./test/lib/config_matrix_generator.sh --mode full --output ./my-test-site

# Generate sites for all modes
./test/lib/config_matrix_generator.sh --all --output-base ./test-sites

# List available modes
./test/lib/config_matrix_generator.sh --list
```

### Generated Files

Each mode generates:
- `_config.yml` - Mode-specific Jekyll configuration
- `Gemfile` - Appropriate gem dependencies
- `index.md` - Sample homepage
- `pages/about.md` - Sample about page
- `pages/_docs/getting-started.md` - Sample docs
- `pages/_posts/` - Sample blog post

## 🔮 Future Enhancements

### Planned Features

- **Test Coverage Reporting**: Detailed coverage metrics across all suites
- **Baseline Comparison**: Performance regression detection
- **Smart Test Selection**: Run only tests affected by code changes
- **Enhanced Parallel Execution**: Fine-grained parallel test execution
- **Visual Test Reports**: Rich HTML dashboards with trends and insights
- **Cross-Browser Testing**: Firefox, Safari visual tests
- **Accessibility Automation**: WCAG compliance checking in visual tests

### Contributing

The consolidated testing framework is designed for easy extension:

1. **Adding Tests**: Add new test functions to appropriate suite files
2. **New Test Categories**: Extend existing suites or propose new ones
3. **New Installation Modes**: Add to `config_matrix_generator.sh`
4. **Visual Baselines**: Update with `--update-baseline` flag
5. **CI/CD Integration**: Update workflow files to leverage new features
6. **Documentation**: Keep this README updated with changes

---

## 🎉 Success Criteria

The consolidated testing framework is working correctly when:

- ✅ **All six test suites execute successfully**
- ✅ **CI/CD workflows complete without errors**
- ✅ **Test reports are generated in expected formats**
- ✅ **Performance targets are met (< 20 minutes for full suite)**
- ✅ **No regressions in test coverage or quality**
- ✅ **All installation modes (full, minimal, remote_theme, gem) build successfully**
- ✅ **Visual tests show no unexpected regressions**

**Ready for production use!** 🚀

---

## 📚 Additional Documentation

- [Installation Test Plan](../docs/systems/testing-framework.md)
- [Configuration Matrix](lib/config_matrix_generator.sh)
- [Playwright Configuration](playwright.config.js)

---

**Test Framework Version**: 3.0 (Extended with Installation & Visual Tests)  
**Last Updated**: January 2026  
**Compatibility**: Jekyll 4.0+, Ruby 3.0+, Node.js 18+, Docker (optional), Playwright (for visual tests)
