#!/bin/bash

# End-to-End Tests for zer0-mistakes Jekyll Theme
# Tests complete user workflows and deployment scenarios

# E2E test functions
run_e2e_tests() {
    log "Running end-to-end tests..."

    # Setup test environment
    local test_site_dir="/tmp/zer0-e2e-test-$(date +%s)"
    mkdir -p "$test_site_dir"

    # Test 1: Complete site installation
    run_test "Complete site installation workflow" "
        cd '$test_site_dir' &&
        cp -r /Users/bamr87/github/zer0-mistakes/* . &&
        bundle install --quiet &&
        bundle exec jekyll build --quiet &&
        test -f _site/index.html
    " "e2e"

    # Test 2: Docker deployment workflow
    if command -v docker &> /dev/null; then
        run_test "Docker deployment workflow" "
            cd '$test_site_dir' &&
            docker build -t zer0-e2e-test . --quiet &&
            docker run -d -p 4000:4000 --name zer0-e2e-container zer0-e2e-test &&
            sleep 10 &&
            curl -f http://localhost:4000 > /dev/null &&
            docker stop zer0-e2e-container &&
            docker rm zer0-e2e-container
        " "e2e"
    else
        skip "Docker not available, skipping Docker deployment test"
    fi

    # Test 3: Content creation workflow
    run_test "Content creation and build workflow" "
        cd '$test_site_dir' &&
        mkdir -p pages/_posts &&
        cat > pages/_posts/$(date +%Y-%m-%d)-test-post.md << 'EOF'
---
title: Test Post
date: $(date +%Y-%m-%d)
---
# Test Post

This is a test post for E2E testing.
EOF
        bundle exec jekyll build --quiet &&
        test -f _site/pages/_posts/$(date +%Y-%m-%d)-test-post.html
    " "e2e"

    # Test 4: Theme customization workflow
    run_test "Theme customization workflow" "
        cd '$test_site_dir' &&
        echo '\$primary-color: #ff0000;' >> _sass/custom.scss &&
        bundle exec jekyll build --quiet &&
        grep -q 'color.*#ff0000' _site/assets/css/main.css
    " "e2e"

    # Test 5: Multi-environment configuration
    run_test "Multi-environment configuration" "
        cd '$test_site_dir' &&
        bundle exec jekyll build --config _config_dev.yml --quiet &&
        test -f _site/index.html &&
        bundle exec jekyll build --config _config.yml --quiet &&
        test -f _site/index.html
    " "e2e"

    # Test 6: Plugin functionality
    run_test "Plugin functionality test" "
        cd '$test_site_dir' &&
        bundle exec jekyll build --quiet &&
        test -f _site/feed.xml &&
        test -f _site/sitemap.xml
    " "e2e"

    # Test 7: Asset pipeline
    run_test "Asset pipeline test" "
        cd '$test_site_dir' &&
        bundle exec jekyll build --quiet &&
        find _site -name '*.css' | grep -q css &&
        find _site -name '*.js' | grep -q js
    " "e2e"

    # Test 8: Error handling
    run_test "Error handling test" "
        cd '$test_site_dir' &&
        echo 'invalid yaml: :' > _config_error.yml &&
        ! bundle exec jekyll build --config _config_error.yml --quiet 2>/dev/null
    " "e2e"

    # Test 9: Performance validation
    run_test "Performance validation" "
        cd '$test_site_dir' &&
        local start_time=\$(date +%s) &&
        bundle exec jekyll build --quiet &&
        local end_time=\$(date +%s) &&
        local build_time=\$((end_time - start_time)) &&
        [ \$build_time -lt 60 ]  # Should build in under 60 seconds
    " "e2e"

    # Test 10: Cross-platform compatibility (if running on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        run_test "macOS compatibility test" "
            cd '$test_site_dir' &&
            bundle exec jekyll build --quiet &&
            test -f _site/index.html
        " "e2e"
    fi

    # Cleanup
    rm -rf "$test_site_dir"

    log "End-to-end tests completed."
}
