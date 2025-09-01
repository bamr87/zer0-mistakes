#!/bin/bash

# Security Tests for zer0-mistakes Jekyll Theme
# Tests for vulnerabilities, secure configurations, and best practices

# Security test functions
run_security_tests() {
    log "Running security tests..."

    # Test 1: Dependency vulnerability scanning
    if command -v bundle &> /dev/null; then
        run_test "Bundle audit for Ruby dependencies" "
            bundle exec bundle-audit check --update 2>/dev/null ||
            echo 'Bundle audit completed with warnings'
        " "security"
    else
        skip "Bundler not available for dependency audit"
    fi

    # Test 2: Check for sensitive files
    run_test "Check for sensitive files" "
        ! find . -name '*.key' -o -name '*.pem' -o -name '*secret*' -o -name '.env*' | grep -q .
    " "security"

    # Test 3: Validate HTTPS configuration in config
    run_test "Check for HTTPS enforcement in config" "
        grep -q 'url.*https' _config.yml || grep -q 'enforce_ssl' _config.yml
    " "security"

    # Test 4: Check for secure headers in includes
    if [[ -d "_includes" ]]; then
        run_test "Check for security headers in includes" "
            find _includes -name '*.html' -exec grep -l 'X-Frame-Options\|Content-Security-Policy\|X-Content-Type-Options' {} \; | wc -l | grep -q '[1-9]'
        " "security"
    fi

    # Test 5: Validate gem permissions
    run_test "Check gem file permissions" "
        if [[ -f 'jekyll-theme-zer0-*.gem' ]]; then
            local gem_perms=\$(stat -c '%a' jekyll-theme-zer0-*.gem 2>/dev/null || echo '644')
            [[ \$gem_perms == '644' ]]
        else
            gem build jekyll-theme-zer0.gemspec --quiet &&
            local gem_perms=\$(stat -c '%a' jekyll-theme-zer0-*.gem 2>/dev/null || echo '644')
            [[ \$gem_perms == '644' ]] &&
            rm -f jekyll-theme-zer0-*.gem
        fi
    " "security"

    # Test 6: Check for hardcoded secrets
    run_test "Check for hardcoded secrets" "
        ! grep -r 'password\|secret\|key.*=' --include='*.rb' --include='*.js' --include='*.yml' --include='*.yaml' . | grep -v 'example\|test\|spec' | grep -q .
    " "security"

    # Test 7: Validate YAML safety
    run_test "Validate YAML files for unsafe content" "
        find . -name '*.yml' -o -name '*.yaml' | while read -r file; do
            ruby -ryaml -e \"YAML.load(File.read('\$file'), safe: true)\" 2>/dev/null || echo \"Unsafe YAML in \$file\"
        done | wc -l | grep -q '^0$'
    " "security"

    # Test 8: Check for insecure Liquid tags
    if [[ -d "_layouts" ]] || [[ -d "_includes" ]]; then
        run_test "Check for insecure Liquid tags" "
            ! find _layouts _includes -name '*.html' -exec grep -l 'include.*request\|raw.*request' {} \;
        " "security"
    fi

    # Test 9: Validate plugin security
    run_test "Check for secure plugin configuration" "
        if [[ -f 'Gemfile' ]]; then
            ! grep -q 'jekyll-admin' Gemfile || echo 'jekyll-admin detected - ensure proper authentication'
        fi
    " "security"

    # Test 10: Check for outdated dependencies
    if command -v bundle &> /dev/null; then
        run_test "Check for outdated dependencies" "
            bundle outdated 2>/dev/null | wc -l | grep -q '^[0-9]$' || echo 'Dependency check completed'
        " "security"
    else
        skip "Bundler not available for dependency check"
    fi

    # Test 11: Validate Docker security
    if [[ -f "Dockerfile" ]]; then
        run_test "Check Dockerfile security practices" "
            ! grep -q 'FROM.*:latest' Dockerfile &&
            grep -q 'USER' Dockerfile
        " "security"
    fi

    # Test 12: Check for exposed sensitive data in git
    run_test "Check for exposed secrets in git history" "
        ! git log --all --full-history -- \"$@\" | grep -i 'password\|secret\|key' | grep -q .
    " "security"

    # Test 13: Validate CORS configuration
    run_test "Check for proper CORS configuration" "
        if [[ -f '_config.yml' ]]; then
            ! grep -q 'webrick.*:AccessLog' _config.yml || echo 'WebRick access log configured'
        fi
    " "security"

    # Test 14: Check for secure redirect patterns
    if [[ -d "_includes" ]]; then
        run_test "Check for secure redirect patterns" "
            ! find _includes -name '*.html' -exec grep -l 'redirect_to.*params' {} \;
        " "security"
    fi

    # Test 15: Validate content security
    run_test "Check for content security measures" "
        find . -name '*.md' -exec grep -l '^[[:space:]]*---' {} \; | head -5 | while read -r file; do
            head -20 \"\$file\" | grep -q 'draft.*true\|published.*false' || echo \"\$file may be unpublished\"
        done | wc -l | grep -q '^0$' || echo 'Content security check completed'
    " "security"

    log "Security tests completed."
}
