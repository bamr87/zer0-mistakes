#!/bin/bash

# Integration Tests for zer0-mistakes Jekyll Theme
# Tests component interactions and system integration

# Integration test functions
run_integration_tests() {
    log "Running integration tests..."

    # Test bundle installation
    run_test "Test bundle install" "bundle check || bundle install --quiet" "integration"

    # Test Jekyll build process
    run_test "Test Jekyll build" "bundle exec jekyll build --quiet" "integration"

    # Test site generation
    run_test "Verify _site directory created" "test -d _site" "integration"

    # Test key pages exist
    run_test "Check index.html generated" "test -f _site/index.html" "integration"
    run_test "Check 404.html exists" "test -f _site/404.html" "integration"

    # Test asset compilation
    run_test "Check CSS files generated" "find _site -name '*.css' | grep -q css" "integration"
    run_test "Check JS files copied" "find _site -name '*.js' | grep -q js" "integration"

    # Test Docker integration
    if command -v docker &> /dev/null; then
        run_test "Test Docker image build" "docker build -t zer0-test . --quiet" "integration"
        run_test "Test Docker container creation" "docker run --rm -d --name zer0-test-container zer0-test sleep 5 && docker stop zer0-test-container" "integration"
    else
        skip "Docker not available, skipping Docker integration tests"
    fi

    # Test gem building
    run_test "Test gem build process" "gem build jekyll-theme-zer0.gemspec --quiet" "integration"

    # Test gem contents
    if [[ -f "jekyll-theme-zer0-*.gem" ]]; then
        run_test "Verify gem contains required files" "gem contents jekyll-theme-zer0-*.gem | grep -q '_layouts'" "integration"
        run_test "Verify gem contains assets" "gem contents jekyll-theme-zer0-*.gem | grep -q 'assets'" "integration"
    fi

    # Test configuration integration
    run_test "Test development config loads" "bundle exec jekyll build --config _config_dev.yml --quiet" "integration"

    # Test plugin integration
    run_test "Test Jekyll plugins load" "bundle exec jekyll doctor --quiet" "integration"

    # Test feed generation
    run_test "Check RSS feed generated" "test -f _site/feed.xml" "integration"

    # Test sitemap generation
    run_test "Check sitemap generated" "test -f _site/sitemap.xml" "integration"

    # Clean up test artifacts
    rm -f jekyll-theme-zer0-*.gem
    rm -rf _site

    log "Integration tests completed."
}
