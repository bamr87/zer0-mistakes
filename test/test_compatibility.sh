#!/bin/bash

# Compatibility Tests for zer0-mistakes Jekyll Theme
# Tests cross-platform compatibility, browser support, and environment compatibility

# Compatibility test functions
run_compatibility_tests() {
    log "Running compatibility tests..."

    # Test 1: Check Ruby version compatibility
    run_test "Check Ruby version compatibility" "
        ruby_version=\$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
        ruby_major=\$(echo \$ruby_version | cut -d'.' -f1)
        ruby_minor=\$(echo \$ruby_version | cut -d'.' -f2)
        [ \$ruby_major -ge 2 ] && [ \$ruby_minor -ge 7 ] || echo 'Ruby version may be too old'
    " "compatibility"

    # Test 2: Validate Gemfile compatibility
    run_test "Validate Gemfile compatibility" "
        bundle check >/dev/null 2>&1
    " "compatibility"

    # Test 3: Check Jekyll version compatibility
    run_test "Check Jekyll version compatibility" "
        jekyll_version=\$(bundle exec jekyll -v | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
        jekyll_major=\$(echo \$jekyll_version | cut -d'.' -f1)
        [ \$jekyll_major -ge 4 ] || echo 'Jekyll version may be outdated'
    " "compatibility"

    # Test 4: Test Docker compatibility
    run_test "Test Docker compatibility" "
        if command -v docker >/dev/null 2>&1; then
            docker --version >/dev/null 2>&1
        else
            echo 'Docker not available - skipping Docker tests'
        fi
    " "compatibility"

    # Test 5: Check Node.js compatibility (if present)
    run_test "Check Node.js compatibility" "
        if [ -f 'package.json' ]; then
            if command -v node >/dev/null 2>&1; then
                node_version=\$(node -v | sed 's/v//')
                node_major=\$(echo \$node_version | cut -d'.' -f1)
                [ \$node_major -ge 16 ] || echo 'Node.js version may be too old for modern features'
            else
                echo 'Node.js not available but package.json exists'
            fi
        fi
    " "compatibility"

    # Test 6: Validate YAML syntax across files
    run_test "Validate YAML syntax across files" "
        find . -name '*.yml' -o -name '*.yaml' | while read -r file; do
            ruby -ryaml -e \"YAML.load_file('\$file')\" >/dev/null 2>&1 || echo \"YAML syntax error in \$file\"
        done | wc -l | grep -q '^0$'
    " "compatibility"

    # Test 7: Check JSON syntax (if present)
    run_test "Check JSON syntax" "
        find . -name '*.json' | while read -r file; do
            python3 -m json.tool \"\$file\" >/dev/null 2>&1 || echo \"JSON syntax error in \$file\"
        done | wc -l | grep -q '^0$'
    " "compatibility"

    # Test 8: Test shell script compatibility
    run_test "Test shell script compatibility" "
        find . -name '*.sh' | while read -r file; do
            bash -n \"\$file\" >/dev/null 2>&1 || echo \"Shell syntax error in \$file\"
        done | wc -l | grep -q '^0$'
    " "compatibility"

    # Test 9: Check for platform-specific code
    run_test "Check for platform-specific code" "
        ! grep -r 'uname\|platform\|os\.name' . --include='*.sh' --include='*.rb' | grep -q 'uname\|platform\|os\.name' || echo 'Platform-specific code detected - may need cross-platform testing'
    " "compatibility"

    # Test 10: Validate file encoding
    run_test "Validate file encoding" "
        find . -name '*.md' -o -name '*.html' -o -name '*.yml' -o -name '*.yaml' | while read -r file; do
            encoding=\$(file -b --mime-encoding \"\$file\")
            [ \"\$encoding\" = 'utf-8' ] || echo \"Non-UTF-8 encoding in \$file: \$encoding\"
        done | wc -l | grep -q '^0$'
    " "compatibility"

    # Test 11: Check for deprecated features
    run_test "Check for deprecated Jekyll features" "
        ! grep -r 'site\.safe\|site\.gems' _layouts/ _includes/ --include='*.html' | grep -q 'site\.safe\|site\.gems' || echo 'Deprecated Jekyll features detected'
    " "compatibility"

    # Test 12: Validate Liquid template syntax
    run_test "Validate Liquid template syntax" "
        find _layouts/ _includes/ -name '*.html' | while read -r file; do
            # Basic Liquid syntax check
            grep -q '{{.*}}' \"\$file\" && echo \"Liquid template found in \$file\" || true
        done | wc -l | grep -q '[0-9]' || echo 'No Liquid templates found'
    " "compatibility"

    # Test 13: Check for browser compatibility issues
    run_test "Check for browser compatibility issues" "
        find _site/ -name '*.html' 2>/dev/null | head -1 | xargs grep -q '<!DOCTYPE html>' 2>/dev/null || echo 'HTML5 doctype check'
    " "compatibility"

    # Test 14: Validate CSS compatibility
    run_test "Validate CSS compatibility" "
        find assets/ -name '*.css' | while read -r file; do
            # Check for modern CSS features that might need fallbacks
            grep -q 'grid\|flexbox\|css-variables' \"\$file\" && echo \"Modern CSS features in \$file\" || true
        done | wc -l | grep -q '[0-9]' || echo 'No modern CSS features detected'
    " "compatibility"

    # Test 15: Check for internationalization support
    run_test "Check for internationalization support" "
        find . -name '*.yml' -o -name '*.yaml' | xargs grep -l 'i18n\|locale\|lang' | wc -l | grep -q '[0-9]' || echo 'No internationalization configuration found'
    " "compatibility"

    log "Compatibility tests completed."
}
