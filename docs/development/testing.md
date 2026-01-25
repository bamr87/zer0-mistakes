# Testing

Run tests and validate changes before submitting pull requests.

## Test Suite

The theme includes a comprehensive test suite:

```bash
# Run all tests
./test/test_runner.sh

# Run specific test suites
./test/test_runner.sh --suites core,deployment

# Run with verbose output
./test/test_runner.sh --verbose

# Skip Docker tests
./test/test_runner.sh --skip-docker
```

## Test Categories

### Core Tests

Basic functionality and configuration:

```bash
./test/test_runner.sh --suites core
```

Tests include:
- Configuration validation
- Required files exist
- Jekyll build succeeds
- Layouts render correctly

### Deployment Tests

Production readiness:

```bash
./test/test_runner.sh --suites deployment
```

Tests include:
- GitHub Pages compatibility
- Remote theme functionality
- Build output validation

### Quality Tests

Code quality and best practices:

```bash
./test/test_runner.sh --suites quality
```

Tests include:
- Broken link detection
- HTML validation
- Accessibility checks

## Manual Testing

### Local Preview

```bash
# Start development server
docker-compose up

# Test different pages
# - Homepage: http://localhost:4000/
# - Blog: http://localhost:4000/blog/
# - Docs: http://localhost:4000/docs/
# - Features: Enable mermaid/mathjax on test pages
```

### Build Validation

```bash
# Check Jekyll configuration
bundle exec jekyll doctor

# Build with verbose output
bundle exec jekyll build --verbose --trace

# Validate HTML output
bundle exec htmlproofer _site --disable-external
```

### Cross-Browser Testing

Test in multiple browsers:
- Chrome
- Firefox
- Safari
- Edge

Check:
- Layout rendering
- JavaScript functionality
- Responsive design
- Font rendering

## Feature-Specific Testing

### Mermaid Diagrams

1. Create a page with `mermaid: true`
2. Add diagram code
3. Verify rendering in browser
4. Check browser console for errors

```bash
./scripts/test-mermaid.sh
```

### MathJax

1. Create a page with `mathjax: true`
2. Add math notation
3. Verify equations render
4. Check complex formulas

### Comments (Giscus)

Note: Giscus requires production deployment to test.

1. Deploy to staging
2. Verify comments load
3. Test posting a comment
4. Check theme matching

### Analytics (PostHog)

1. Set `JEKYLL_ENV=production`
2. Verify script loads
3. Check PostHog dashboard for events
4. Test DNT (Do Not Track) support

## Continuous Integration

GitHub Actions runs tests on:
- Pull requests
- Pushes to main branch
- Release tags

### CI Configuration

`.github/workflows/` contains:
- Build validation
- HTML proofer
- Deploy workflows

### Viewing CI Results

1. Go to repository → Actions
2. Click the workflow run
3. Review logs for failures

## Writing Tests

### Test Script Format

```bash
#!/bin/bash

test_something() {
    # Arrange
    local expected="value"
    
    # Act
    local result=$(some_command)
    
    # Assert
    if [[ "$result" == "$expected" ]]; then
        echo "[PASS] Test description"
        return 0
    else
        echo "[FAIL] Test description"
        echo "  Expected: $expected"
        echo "  Got: $result"
        return 1
    fi
}
```

### Test Best Practices

1. **Isolate tests** — Each test should be independent
2. **Clear assertions** — Make expected vs actual clear
3. **Descriptive names** — Test names explain what's tested
4. **Fast execution** — Keep tests quick when possible
5. **Document requirements** — Note any prerequisites

## Troubleshooting Tests

### Common Failures

| Error | Solution |
|-------|----------|
| Jekyll build failed | Check for syntax errors in Liquid/YAML |
| Missing file | Verify file exists and path is correct |
| Docker not found | Install Docker or use `--skip-docker` |
| Permission denied | Check file permissions |

### Debug Mode

```bash
# Enable debug output
DEBUG=1 ./test/test_runner.sh

# Run single test file
bash -x ./test/specific_test.sh
```

## Related

- [Local Setup](local-setup.md) — Development environment
- [Code Style](code-style.md) — Coding conventions
