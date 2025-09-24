---
title: "Automated Testing with HTMLProofer"
description: "Comprehensive guide to automated testing in the Zer0-Mistakes Jekyll theme using HTMLProofer"
layout: journals
permalink: /docs/testing/
date: 2025-01-27T10:00:00.000Z
lastmod: 2025-01-27T10:00:00.000Z
categories: [Documentation, Testing]
tags: [htmlproofer, testing, automation, ci-cd, quality-assurance]
excerpt: "Learn how to use the built-in HTMLProofer testing framework for automated validation of your Jekyll site"
---

# Automated Testing with HTMLProofer

The Zer0-Mistakes Jekyll theme includes comprehensive automated testing capabilities using **HTMLProofer**, a powerful Ruby gem that validates HTML output, links, images, and other critical site elements.

## 🎯 Overview

HTMLProofer integration provides:

- **HTML Validation**: Ensures proper HTML5 structure and syntax
- **Link Checking**: Validates internal and external links
- **Image Validation**: Checks image sources and alt attributes
- **Open Graph Validation**: Verifies social media meta tags
- **Bootstrap Compatibility**: Tests responsive design elements
- **Accessibility Checks**: Basic accessibility validation
- **Performance Monitoring**: Lighthouse integration for performance audits

## 🚀 Quick Start

### Basic Testing Commands

```bash
# Quick internal validation (recommended for development)
rake test_quick

# Comprehensive internal testing
rake test_internal

# Full test suite with external links
rake test_full

# Production-ready testing
rake test_prod
```

### Test with Docker

```bash
# Build and test in Docker environment
docker-compose up --build
docker-compose exec jekyll rake test

# Run specific test suite
docker-compose exec jekyll rake test_internal
```

## 📋 Available Rake Tasks

The theme provides several Rake tasks for different testing scenarios:

### Development Tasks

| Task | Description | Use Case |
|------|-------------|----------|
| `rake build` | Build site for development | Local development |
| `rake serve` | Serve with live reload | Development server |
| `rake test_quick` | Fast internal structure tests | Quick validation |
| `rake test_internal` | Comprehensive internal tests | Pre-commit testing |

### Production Tasks

| Task | Description | Use Case |
|------|-------------|----------|
| `rake build_prod` | Build for production | Production deployment |
| `rake test_prod` | Full production testing | Release validation |
| `rake test_external` | External link validation | Periodic maintenance |
| `rake test_full` | All tests (internal + external) | Comprehensive audit |

### Utility Tasks

| Task | Description | Use Case |
|------|-------------|----------|
| `rake clean` | Clean build directory | Reset environment |
| `rake deps` | Install dependencies | Setup |
| `rake help` | Show detailed help | Documentation |

## ⚙️ Configuration Options

### Environment Variables

Control test behavior with environment variables:

```bash
# Enable external link checking
HTMLPROOFER_EXTERNAL=true rake test

# Disable image validation
HTMLPROOFER_CHECK_IMAGES=false rake test

# Enforce HTTPS links
HTMLPROOFER_ENFORCE_HTTPS=true rake test_prod

# Skip external tests in full suite
SKIP_EXTERNAL=true rake test_full

# Skip HTMLProofer in core tests
SKIP_HTMLPROOFER=true ./test/test_runner.sh

# Enable production-level tests
RUN_PRODUCTION_TESTS=true ./test/test_core.sh
```

### Configuration in _config.yml

HTMLProofer settings can be customized in your `_config.yml`:

```yaml
htmlproofer:
  check_html: true
  check_img_http: true
  check_opengraph: true
  disable_external: true
  allow_hash_href: true
  empty_alt_ignore: true
  assume_extension: true
  enforce_https: false
  
  swap_urls:
    "/zer0-mistakes/": "/"
    "https://bamr87.github.io/zer0-mistakes/": "/"
  
  ignore_files:
    - "/404.html"
    - "/assets/vendor/"
  
  ignore_status_codes:
    - 999  # LinkedIn
    - 403  # Forbidden
  
  typhoeus:
    connecttimeout: 30
    timeout: 30
```

## 🔄 GitHub Actions Integration

The theme includes automated testing workflows:

### Workflow Triggers

- **Pull Requests**: Quick validation tests
- **Push to main**: Comprehensive testing
- **Manual Dispatch**: Configurable test levels
- **Scheduled**: Periodic external link validation

### Test Matrix

Tests run across multiple Ruby versions:
- Ruby 3.0, 3.1, 3.2
- Different test levels (quick, standard, comprehensive)
- Cross-platform compatibility validation

### Example Workflow Usage

```yaml
# Manual trigger with custom test level
workflow_dispatch:
  inputs:
    test_level:
      description: 'Test level'
      default: 'standard'
      type: choice
      options: ['quick', 'standard', 'comprehensive']
```

## 🧪 Test Suite Components

### Core Tests (`test_core.sh`)

- **File Structure**: Validates theme file organization
- **YAML Syntax**: Checks configuration file syntax
- **Gemspec Validity**: Validates gem specification
- **Version Consistency**: Ensures version alignment
- **Bundle Install**: Tests dependency installation
- **Jekyll Build**: Validates site generation
- **Liquid Templates**: Checks template syntax
- **HTMLProofer Validation**: Comprehensive HTML testing

### Deployment Tests (`test_deployment.sh`)

- **Docker Environment**: Container compatibility
- **Remote Installation**: GitHub Pages deployment
- **E2E Functionality**: End-to-end testing
- **Cross-platform**: macOS, Linux, Windows/WSL

### Quality Tests (`test_quality.sh`)

- **Security Scanning**: Vulnerability detection
- **Accessibility**: WCAG compliance checks
- **Performance**: Lighthouse audits
- **Compatibility**: Browser and device testing

## 🔍 Troubleshooting

### Common Issues

#### HTMLProofer Not Available
```bash
# Install HTMLProofer
bundle install

# Verify installation
bundle exec ruby -e "require 'html-proofer'"
```

#### External Link Failures
```bash
# Skip external checks for development
SKIP_EXTERNAL=true rake test_full

# Test external links separately
rake test_external
```

#### Bootstrap/CSS Issues
```bash
# Rebuild with fresh dependencies
rake clean
bundle install
rake build
```

#### Timeout Issues
```bash
# Increase timeout for slow connections
export HTMLPROOFER_TIMEOUT=60
rake test
```

### Debug Options

Enable verbose output for troubleshooting:

```bash
# Verbose Rake output
rake test --verbose

# Verbose test suite
./test/test_runner.sh --verbose

# Debug specific test
./test/test_core.sh --verbose
```

## 📊 Performance Monitoring

### Lighthouse Integration

Automated performance testing with Lighthouse:

```bash
# Manual Lighthouse audit
npx lighthouse http://localhost:4000 --output html

# CI/CD Lighthouse testing (GitHub Actions)
# Automatically runs on main branch pushes
```

### Metrics Tracked

- **Performance Score**: Page load speed and optimization
- **Accessibility Score**: WCAG compliance and usability
- **Best Practices**: Security and modern web standards
- **SEO Score**: Search engine optimization
- **Bootstrap Compatibility**: Framework-specific validation

## 🛠️ Advanced Usage

### Custom Test Scripts

Create custom validation scripts:

```bash
#!/bin/bash
# custom-test.sh

# Build site
bundle exec jekyll build

# Custom HTMLProofer options
bundle exec htmlproofer _site \
  --check-html \
  --check-img-http \
  --disable-external \
  --allow-hash-href \
  --swap-urls='/zer0-mistakes/:/'
```

### Integration with Other Tools

Combine HTMLProofer with other testing tools:

```bash
# Validate HTML + CSS + JavaScript
rake test_internal && \
npx stylelint "assets/css/**/*.css" && \
npx eslint "assets/js/**/*.js"

# Security + HTML validation
bundle audit && rake test_prod
```

### CI/CD Pipeline Integration

Example pipeline configuration:

```yaml
steps:
  - name: Setup Ruby
    uses: ruby/setup-ruby@v1
    with:
      bundler-cache: true
      
  - name: Build and Test
    run: |
      bundle exec rake test_internal
      
  - name: Deploy if tests pass
    if: success()
    run: |
      # Deploy to production
```

## 📖 Best Practices

### Development Workflow

1. **Local Testing**: Use `rake test_quick` for rapid feedback
2. **Pre-commit**: Run `rake test_internal` before committing
3. **Pre-release**: Execute `rake test_full` before releases
4. **Production**: Validate with `rake test_prod` after deployment

### Performance Optimization

- **Skip External**: Use `SKIP_EXTERNAL=true` for faster development testing
- **Parallel Testing**: Leverage GitHub Actions matrix for speed
- **Caching**: Enable Bundler cache in CI/CD pipelines
- **Incremental**: Test only changed files when possible

### Maintenance

- **Regular Audits**: Run `rake test_external` weekly
- **Dependency Updates**: Keep HTMLProofer updated
- **Configuration Reviews**: Adjust settings based on site changes
- **Performance Monitoring**: Track Lighthouse scores over time

## 🤝 Contributing

Help improve the testing framework:

1. **Report Issues**: Document test failures with reproduction steps
2. **Suggest Enhancements**: Propose new validation rules
3. **Submit PRs**: Add new test cases or improve existing ones
4. **Documentation**: Update guides and troubleshooting info

### Adding New Tests

Example of adding a custom test to `test_core.sh`:

```bash
test_custom_validation() {
    log_info "Running custom validation..."
    
    # Your custom test logic here
    if custom_check; then
        log_success "Custom validation passed"
        return 0
    else
        log_error "Custom validation failed"
        return 1
    fi
}

# Add to run_core_tests function
run_test "Custom Validation" "test_custom_validation" "validation"
```

## 📚 Resources

- **HTMLProofer Documentation**: https://github.com/gjtorikian/html-proofer
- **Jekyll Testing Guide**: https://jekyllrb.com/docs/continuous-integration/
- **Bootstrap Testing**: https://getbootstrap.com/docs/5.3/getting-started/introduction/
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **GitHub Actions**: https://docs.github.com/en/actions

---

*This comprehensive testing framework ensures your Zer0-Mistakes Jekyll theme maintains the highest quality standards for production deployment.*