#!/bin/bash

# Performance Tests for zer0-mistakes Jekyll Theme
# Tests build performance, asset optimization, and runtime efficiency

# Performance test functions
run_performance_tests() {
    log "Running performance tests..."

    # Setup test environment
    local test_site_dir="/tmp/zer0-performance-test-$(date +%s)"
    mkdir -p "$test_site_dir"
    cp -r . "$test_site_dir/"
    cd "$test_site_dir"

    # Test 1: Build time performance
    run_test "Build time under 30 seconds" "
        local start_time=\$(date +%s) &&
        bundle exec jekyll build --quiet &&
        local end_time=\$(date +%s) &&
        local build_time=\$((end_time - start_time)) &&
        echo \"Build time: \$build_time seconds\" &&
        [ \$build_time -lt 30 ]
    " "performance"

    # Test 2: Incremental build performance
    run_test "Incremental build performance" "
        bundle exec jekyll build --quiet &&
        local first_build_time=\$(date +%s) &&
        bundle exec jekyll build --quiet &&
        local second_build_time=\$(date +%s) &&
        local incremental_time=\$((second_build_time - first_build_time)) &&
        echo \"Incremental build time: \$incremental_time seconds\" &&
        [ \$incremental_time -lt 15 ]
    " "performance"

    # Test 3: Asset size optimization
    run_test "CSS asset size optimization" "
        bundle exec jekyll build --quiet &&
        local css_size=\$(find _site -name '*.css' -exec cat {} \; | wc -c) &&
        echo \"Total CSS size: \$css_size bytes\" &&
        [ \$css_size -lt 500000 ]  # Less than 500KB
    " "performance"

    # Test 4: Page load simulation
    run_test "Page count performance" "
        bundle exec jekyll build --quiet &&
        local page_count=\$(find _site -name '*.html' | wc -l) &&
        echo \"Generated pages: \$page_count\" &&
        [ \$page_count -gt 0 ]
    " "performance"

    # Test 5: Memory usage during build
    if command -v time &> /dev/null; then
        run_test "Memory usage during build" "
            rm -rf _site &&
            local mem_usage=\$(/usr/bin/time -l bundle exec jekyll build --quiet 2>&1 | grep 'maximum resident set size' | awk '{print \$1}') &&
            echo \"Memory usage: \$mem_usage KB\" &&
            [ \$mem_usage -lt 200000 ]  # Less than 200MB
        " "performance"
    else
        skip "time command not available for memory testing"
    fi

    # Test 6: Large content performance
    run_test "Large content handling" "
        mkdir -p pages/_posts &&
        for i in {1..50}; do
            cat > pages/_posts/\$(date +%Y-%m-%d)-\$i-test-post.md << EOF
---
title: Test Post \$i
date: \$(date +%Y-%m-%d)
---
# Test Post \$i

\$(for j in {1..100}; do echo \"This is paragraph \$j with some content. \"; done)
EOF
        done &&
        local start_time=\$(date +%s) &&
        bundle exec jekyll build --quiet &&
        local end_time=\$(date +%s) &&
        local large_build_time=\$((end_time - start_time)) &&
        echo \"Large content build time: \$large_build_time seconds\" &&
        [ \$large_build_time -lt 60 ]
    " "performance"

    # Test 7: Docker build performance
    if command -v docker &> /dev/null; then
        run_test "Docker build performance" "
            local start_time=\$(date +%s) &&
            docker build -t zer0-performance-test . --quiet &&
            local end_time=\$(date +%s) &&
            local docker_build_time=\$((end_time - start_time)) &&
            echo \"Docker build time: \$docker_build_time seconds\" &&
            [ \$docker_build_time -lt 120 ] &&
            docker rmi zer0-performance-test
        " "performance"
    else
        skip "Docker not available, skipping Docker performance test"
    fi

    # Test 8: Concurrent request handling (if server available)
    run_test "Static file serving performance" "
        bundle exec jekyll serve --detach --quiet &&
        sleep 5 &&
        local start_time=\$(date +%s) &&
        for i in {1..10}; do
            curl -s http://localhost:4000 > /dev/null &
        done &&
        wait &&
        local end_time=\$(date +%s) &&
        local request_time=\$((end_time - start_time)) &&
        echo \"Concurrent requests time: \$request_time seconds\" &&
        pkill -f jekyll &&
        [ \$request_time -lt 5 ]
    " "performance"

    # Test 9: Asset optimization
    run_test "Asset optimization check" "
        bundle exec jekyll build --quiet &&
        local total_assets=\$(find _site/assets -type f | wc -l) &&
        local optimized_css=\$(find _site -name '*.css' -exec grep -l 'min' {} \; | wc -l) &&
        echo \"Total assets: \$total_assets, Optimized CSS: \$optimized_css\" &&
        [ \$total_assets -gt 0 ]
    " "performance"

    # Test 10: Cache efficiency
    run_test "Build cache efficiency" "
        bundle exec jekyll build --quiet &&
        local first_size=\$(du -s _site | awk '{print \$1}') &&
        touch pages/_posts/\$(date +%Y-%m-%d)-cache-test.md &&
        bundle exec jekyll build --quiet &&
        local second_size=\$(du -s _site | awk '{print \$1}') &&
        local size_diff=\$((second_size - first_size)) &&
        echo \"Cache efficiency - Size difference: \$size_diff KB\" &&
        [ \$size_diff -lt 100 ]  # Minimal size increase for small change
    " "performance"

    # Cleanup
    cd /Users/bamr87/github/zer0-mistakes
    rm -rf "$test_site_dir"

    log "Performance tests completed."
}
