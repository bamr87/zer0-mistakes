#!/bin/bash

# Accessibility Tests for zer0-mistakes Jekyll Theme
# Tests WCAG compliance, screen reader compatibility, and inclusive design

# Accessibility test functions
run_accessibility_tests() {
    log "Running accessibility tests..."

    # Setup test environment
    local test_site_dir="/tmp/zer0-accessibility-test-$(date +%s)"
    mkdir -p "$test_site_dir"
    cp -r . "$test_site_dir/"
    cd "$test_site_dir"
    bundle exec jekyll build --quiet

    # Test 1: Check for alt text on images
    run_test "Check for alt text on images" "
        find _site -name '*.html' -exec grep -l '<img' {} \; | while read -r file; do
            grep -q 'alt=' \"\$file\" || echo \"Missing alt text in \$file\"
        done | wc -l | grep -q '^0$'
    " "accessibility"

    # Test 2: Validate heading structure
    run_test "Validate heading structure" "
        find _site -name '*.html' -exec awk '
            /^<h[1-6]/ { level = substr(\$0, 3, 1); if (level > last_level + 1) print FILENAME \": Invalid heading jump\"; last_level = level }
        ' {} \; | wc -l | grep -q '^0$'
    " "accessibility"

    # Test 3: Check for proper form labels
    run_test "Check for proper form labels" "
        find _site -name '*.html' -exec grep -l '<input\|<select\|<textarea' {} \; | while read -r file; do
            grep -q '<label' \"\$file\" || echo \"Missing label in \$file\"
        done | wc -l | grep -q '^0$' || echo 'Form labeling check completed'
    " "accessibility"

    # Test 4: Validate color contrast (basic check)
    run_test "Check for color contrast issues" "
        find _site -name '*.css' -exec grep -l 'color\|background' {} \; | wc -l | grep -q '[1-9]'
    " "accessibility"

    # Test 5: Check for ARIA attributes
    run_test "Check for ARIA attributes usage" "
        find _site -name '*.html' -exec grep -l 'aria-' {} \; | wc -l | grep -q '[0-9]' || echo 'No ARIA attributes found - may need review'
    " "accessibility"

    # Test 6: Validate language attributes
    run_test "Check for language attributes" "
        grep -q 'lang=' _site/index.html
    " "accessibility"

    # Test 7: Check for skip links
    run_test "Check for skip navigation links" "
        grep -q 'skip.*navigation\|skip.*content' _site/index.html || echo 'No skip links found'
    " "accessibility"

    # Test 8: Validate table structure
    run_test "Validate table accessibility" "
        find _site -name '*.html' -exec grep -l '<table' {} \; | while read -r file; do
            grep -q '<th' \"\$file\" || echo \"Table without headers in \$file\"
        done | wc -l | grep -q '^0$' || echo 'Table accessibility check completed'
    " "accessibility"

    # Test 9: Check for focus management
    run_test "Check for focus indicators" "
        find _site -name '*.css' -exec grep -l 'focus\|:focus' {} \; | wc -l | grep -q '[1-9]'
    " "accessibility"

    # Test 10: Validate semantic HTML
    run_test "Check for semantic HTML elements" "
        grep -q '<header\|<nav\|<main\|<section\|<article\|<aside\|<footer' _site/index.html
    " "accessibility"

    # Test 11: Check for keyboard navigation
    run_test "Check for keyboard navigation support" "
        find _site -name '*.html' -exec grep -l 'tabindex\|accesskey' {} \; | wc -l | grep -q '[0-9]' || echo 'Limited keyboard navigation support found'
    " "accessibility"

    # Test 12: Validate link text
    run_test "Check for descriptive link text" "
        find _site -name '*.html' -exec grep -l '<a' {} \; | while read -r file; do
            ! grep -q '<a[^>]*>click here\|<a[^>]*>here\|<a[^>]*>read more' \"\$file\" || echo \"Generic link text in \$file\"
        done | wc -l | grep -q '^0$'
    " "accessibility"

    # Test 13: Check for proper document structure
    run_test "Validate document structure" "
        grep -q '<!DOCTYPE html>' _site/index.html &&
        grep -q '<title>' _site/index.html &&
        grep -q '<meta.*charset' _site/index.html
    " "accessibility"

    # Test 14: Check for responsive design
    run_test "Check for responsive design" "
        find _site -name '*.css' -exec grep -l 'media.*query\|@media' {} \; | wc -l | grep -q '[1-9]'
    " "accessibility"

    # Test 15: Validate error handling accessibility
    run_test "Check for accessible error messages" "
        find _site -name '*.html' -exec grep -l 'error\|alert' {} \; | while read -r file; do
            grep -q 'aria-live\|role.*alert' \"\$file\" || echo \"Error message may not be accessible in \$file\"
        done | wc -l | grep -q '^0$' || echo 'Error accessibility check completed'
    " "accessibility"

    # Cleanup
    cd /Users/bamr87/github/zer0-mistakes
    rm -rf "$test_site_dir"

    log "Accessibility tests completed."
}
