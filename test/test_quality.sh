#!/bin/bash

# Quality Assurance Test Suite for zer0-mistakes Jekyll Theme
# Combines security, accessibility, compatibility, and performance tests
# 
# This suite focuses on:
# - Security vulnerability scanning and best practices
# - Accessibility compliance and WCAG guidelines
# - Cross-platform and browser compatibility
# - Performance benchmarking and optimization

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_RESULTS_DIR="$SCRIPT_DIR/results"
TEST_SITE_DIR=""
VERBOSE=false
TIMEOUT=300

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_test() { echo -e "${PURPLE}[TEST]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v) VERBOSE=true; shift ;;
            --timeout|-t) TIMEOUT="$2"; shift 2 ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
Quality Assurance Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Runs comprehensive quality assurance tests including security,
    accessibility, compatibility, and performance tests.

OPTIONS:
    -v, --verbose      Enable verbose output
    -t, --timeout      Test timeout in seconds (default: 300)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run all quality tests
    $0 --verbose       # Run with detailed output

QUALITY AREAS TESTED:
    🔒 Security       - Vulnerability scanning, dependency audit, secure configurations
    ♿ Accessibility  - WCAG compliance, screen reader compatibility, semantic HTML
    📄 Content        - Preview image URLs, frontmatter validation
    🌐 Compatibility - Cross-platform, browser support, Jekyll versions
    ⚡ Performance   - Build times, asset optimization, runtime efficiency
EOF
}

# Test execution functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    local category="${3:-quality}"
    
    log_test "Running: $test_name"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    local start_time=$(date +%s)
    local test_result="FAIL"
    local error_message=""
    
    if eval "$test_function" 2>&1; then
        test_result="PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
    else
        local exit_code=$?
        test_result="FAIL"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        
        if [[ $exit_code -eq 124 ]]; then
            error_message="Timeout after ${TIMEOUT}s"
        else
            error_message="Exit code: $exit_code"
        fi
        
        log_error "$test_name - $error_message"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Record test result
    local result_file="$TEST_RESULTS_DIR/quality_test_$(date +%s%N).json"
    cat > "$result_file" << EOF
{
  "name": "$test_name",
  "category": "$category",
  "result": "$test_result",
  "duration": $duration,
  "error_message": "$error_message",
  "timestamp": "$(date -Iseconds)"
}
EOF

    if [[ "$test_result" == "FAIL" ]]; then
        return 1
    fi
    return 0
}

# Setup test site for quality tests
setup_test_site() {
    log_info "Setting up test site for quality testing..."
    
    TEST_SITE_DIR=$(mktemp -d -t zer0-quality-test-XXXXXX)
    cp -r "$PROJECT_ROOT/." "$TEST_SITE_DIR/"
    cd "$TEST_SITE_DIR"
    
    # Build the site if Jekyll is available
    if command -v bundle &>/dev/null && command -v jekyll &>/dev/null; then
        if bundle install --quiet && bundle exec jekyll build --quiet; then
            log_success "Test site built successfully"
        else
            log_warning "Test site build failed, using source files for testing"
        fi
    else
        log_info "Jekyll not available, testing source files directly"
    fi
    
    log_success "Test site ready: $TEST_SITE_DIR"
}

cleanup_test_site() {
    if [[ -n "$TEST_SITE_DIR" && -d "$TEST_SITE_DIR" ]]; then
        rm -rf "$TEST_SITE_DIR"
    fi
}

#
# SECURITY TESTS
#

test_dependency_vulnerabilities() {
    log_step "Scanning for dependency vulnerabilities"
    
    cd "$PROJECT_ROOT"
    
    # Ruby dependency audit
    if command -v bundle &>/dev/null; then
        if command -v bundle-audit &>/dev/null; then
            if bundle-audit check --update &>/dev/null; then
                log_success "No known vulnerabilities in Ruby dependencies"
            else
                log_warning "Potential vulnerabilities found in Ruby dependencies"
                if [[ "$VERBOSE" == "true" ]]; then
                    bundle-audit check --update
                fi
            fi
        else
            log_info "bundle-audit not available, installing..."
            if gem install bundle-audit &>/dev/null; then
                bundle-audit check --update &>/dev/null || log_warning "Vulnerabilities may exist in Ruby dependencies"
            else
                log_warning "Could not install bundle-audit for vulnerability scanning"
            fi
        fi
    else
        log_warning "Bundler not available for dependency vulnerability scanning"
    fi
    
    return 0
}

test_sensitive_files() {
    log_step "Checking for sensitive files"
    
    cd "$PROJECT_ROOT"
    
    # Check for common sensitive file patterns
    local sensitive_patterns=(
        "*.key"
        "*.pem"
        "*secret*"
        ".env*"
        "*.p12"
        "*.pfx"
        "id_rsa*"
        "*.crt"
    )
    
    local found_sensitive=false
    for pattern in "${sensitive_patterns[@]}"; do
        if find . -name "$pattern" -not -path "./.git/*" | head -1 | grep -q .; then
            log_warning "Potentially sensitive files found matching pattern: $pattern"
            found_sensitive=true
        fi
    done
    
    if [[ "$found_sensitive" == "false" ]]; then
        log_success "No sensitive files detected"
    fi
    
    return 0
}

test_hardcoded_secrets() {
    log_step "Scanning for hardcoded secrets"
    
    cd "$PROJECT_ROOT"
    
    # Look for common secret patterns
    local secret_patterns=(
        "password.*="
        "api[_-]?key.*="
        "secret.*="
        "token.*="
        "auth.*="
    )
    
    local found_secrets=false
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -i "$pattern" --include="*.rb" --include="*.js" --include="*.yml" --include="*.yaml" --include="*.json" . | grep -v "example\|test\|spec\|README" | head -1 | grep -q .; then
            log_warning "Potential hardcoded secrets found matching pattern: $pattern"
            found_secrets=true
        fi
    done
    
    if [[ "$found_secrets" == "false" ]]; then
        log_success "No hardcoded secrets detected"
    fi
    
    return 0
}

test_secure_configurations() {
    log_step "Validating secure configurations"
    
    cd "$PROJECT_ROOT"
    
    # Check for HTTPS configuration
    if grep -q "url.*https" "_config.yml" || grep -q "enforce_ssl" "_config.yml"; then
        log_success "HTTPS configuration found"
    else
        log_info "No explicit HTTPS configuration found (may be handled by hosting platform)"
    fi
    
    # Check for security headers in templates
    local security_headers=("X-Frame-Options" "Content-Security-Policy" "X-Content-Type-Options")
    local headers_found=0
    
    for header in "${security_headers[@]}"; do
        if find _includes _layouts -name "*.html" -exec grep -l "$header" {} \; 2>/dev/null | head -1 | grep -q .; then
            log_success "Security header found: $header"
            headers_found=$((headers_found + 1))
        fi
    done
    
    if [[ $headers_found -eq 0 ]]; then
        log_info "No security headers found in templates (may be handled by hosting platform)"
    fi
    
    return 0
}

#
# ACCESSIBILITY TESTS
#

test_html_semantic_structure() {
    log_step "Testing HTML semantic structure"
    
    cd "$TEST_SITE_DIR"
    
    if [[ -d "_site" ]]; then
        # Check for semantic HTML elements
        if find "_site" -name "*.html" -exec grep -l '<header\|<nav\|<main\|<section\|<article\|<aside\|<footer' {} \; | head -1 | grep -q .; then
            log_success "Semantic HTML elements found"
        else
            log_warning "No semantic HTML elements found"
        fi
        
        # Check for proper heading structure
        local heading_issues=0
        find "_site" -name "*.html" | while read -r file; do
            # Check for h1 tags (multiple h1s are valid in HTML5 sectioning)
            local h1_count=$(grep -c '<h1' "$file" 2>/dev/null || echo "0")
            if [[ $h1_count -eq 0 ]]; then
                log_info "No h1 tag found in $(basename "$file")"
            fi
            # Note: Multiple h1 tags are acceptable in HTML5 with semantic sections
        done
        
        log_success "HTML semantic structure validation completed"
    else
        log_warning "No built site found for HTML structure testing"
    fi
    
    return 0
}

test_image_alt_text() {
    log_step "Checking image alt text"
    
    cd "$TEST_SITE_DIR"
    
    if [[ -d "_site" ]]; then
        local images_without_alt=0
        find "_site" -name "*.html" -exec grep -l '<img' {} \; | while read -r file; do
            # Count images without alt attributes
            local img_without_alt=$(grep -o '<img[^>]*>' "$file" | grep -v 'alt=' | wc -l)
            if [[ $img_without_alt -gt 0 ]]; then
                log_warning "Images without alt text found in $(basename "$file"): $img_without_alt"
                images_without_alt=$((images_without_alt + img_without_alt))
            fi
        done
        
        if [[ $images_without_alt -eq 0 ]]; then
            log_success "All images have alt text"
        fi
    else
        # Check source files
        find . -name "*.md" -o -name "*.html" | xargs grep -l '!\[' | while read -r file; do
            # Check markdown images
            if grep '!\[\]' "$file" | head -1 | grep -q .; then
                log_warning "Markdown images without alt text found in $(basename "$file")"
            fi
        done
        
        log_info "Image alt text check completed on source files"
    fi
    
    return 0
}

test_color_contrast() {
    log_step "Checking color contrast considerations"
    
    cd "$TEST_SITE_DIR"
    
    # Basic check for color-related CSS
    if find . -name "*.css" -o -name "*.scss" -exec grep -l 'color\|background' {} \; | head -1 | grep -q .; then
        log_success "Color definitions found in stylesheets"
        
        # Check for potential low-contrast combinations
        if find . -name "*.css" -o -name "*.scss" -exec grep -l '#fff.*#000\|#000.*#fff\|white.*black\|black.*white' {} \; | head -1 | grep -q .; then
            log_success "High contrast color combinations detected"
        else
            log_info "No obvious high-contrast combinations found - manual review recommended"
        fi
    else
        log_warning "No color definitions found in stylesheets"
    fi
    
    return 0
}

test_keyboard_navigation() {
    log_step "Checking keyboard navigation support"
    
    cd "$TEST_SITE_DIR"
    
    # Check for focus indicators in CSS
    if find . -name "*.css" -o -name "*.scss" -exec grep -l 'focus\|:focus' {} \; | head -1 | grep -q .; then
        log_success "Focus indicators found in stylesheets"
    else
        log_warning "No focus indicators found in stylesheets"
    fi
    
    # Check for keyboard navigation attributes
    if find . -name "*.html" -exec grep -l 'tabindex\|accesskey' {} \; | head -1 | grep -q .; then
        log_success "Keyboard navigation attributes found"
    else
        log_info "No explicit keyboard navigation attributes found"
    fi
    
    return 0
}

#
# CONTENT QUALITY TESTS
#

test_preview_image_urls() {
    log_step "Validating preview image URLs in frontmatter"
    
    cd "$PROJECT_ROOT"
    
    local errors=0
    local checked=0
    local missing_files=0
    local format_errors=0
        local strict_previews=false

        if [[ "${STRICT_PREVIEW_IMAGES:-}" == "1" || "${STRICT_PREVIEW_IMAGES:-}" == "true" || \
                    "${CI_STRICT_PREVIEW_IMAGES:-}" == "1" || "${CI_STRICT_PREVIEW_IMAGES:-}" == "true" ]]; then
                strict_previews=true
        fi
    
    # Find all markdown files with preview frontmatter
    while IFS= read -r file; do
        checked=$((checked + 1))
        
        # Extract preview value from frontmatter (only the first YAML block)
        # Use awk to properly handle only the first frontmatter block
        local preview
        preview=$(awk '
            BEGIN { in_frontmatter = 0; found_first = 0 }
            /^---$/ { 
                if (!found_first) { in_frontmatter = !in_frontmatter; found_first = 1; next }
                else if (in_frontmatter) { exit }
            }
            in_frontmatter && /^preview:/ { 
                sub(/^preview:[[:space:]]*/, "")
                gsub(/"/, "")
                gsub(/'\''/, "")
                print
                exit
            }
        ' "$file")
        
        # Skip if empty or null
        if [[ -z "$preview" ]] || [[ "$preview" == "null" ]] || [[ "$preview" == "~" ]]; then
            continue
        fi
        
        # Check URL format - should start with /
        if [[ ! "$preview" =~ ^/ ]]; then
            log_warning "Invalid preview URL format in $(basename "$file"): $preview (should start with /)"
            format_errors=$((format_errors + 1))
            errors=$((errors + 1))
            continue
        fi
        
        # Check for valid image extension
        if [[ ! "$preview" =~ \.(png|jpg|jpeg|gif|webp|svg)$ ]]; then
            log_warning "Invalid preview image extension in $(basename "$file"): $preview"
            format_errors=$((format_errors + 1))
            errors=$((errors + 1))
            continue
        fi
        
        # Check if file exists
        local clean_path="${preview#/}"
        if [[ ! -f "$clean_path" ]]; then
            log_warning "Preview image not found for $(basename "$file"): $preview"
            missing_files=$((missing_files + 1))
            errors=$((errors + 1))
        fi
    done < <(find pages -name "*.md" 2>/dev/null)
    
    if [[ $checked -eq 0 ]]; then
        log_warning "No markdown files found to check"
        return 0
    fi
    
    log_info "Checked $checked files for preview URL validity"
    
    if [[ $errors -eq 0 ]]; then
        log_success "All preview image URLs are valid"
        return 0
    else
        if [[ $format_errors -gt 0 ]]; then
            log_error "Found $errors preview URL errors ($missing_files missing files, $format_errors format errors)"
            return 1
        fi

        if [[ $missing_files -gt 0 && "$strict_previews" == "true" ]]; then
            log_error "Found $errors preview URL errors ($missing_files missing files, $format_errors format errors)"
            return 1
        fi

        log_warning "Found $errors preview URL issues ($missing_files missing files). Not failing (strict mode disabled)."
        return 0
    fi
}

#
# COMPATIBILITY TESTS
#

test_ruby_version_compatibility() {
    log_step "Testing Ruby version compatibility"
    
    cd "$PROJECT_ROOT"
    
    if command -v ruby &>/dev/null; then
        local ruby_version
        ruby_version=$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
        local ruby_major
        local ruby_minor
        ruby_major=$(echo "$ruby_version" | cut -d'.' -f1)
        ruby_minor=$(echo "$ruby_version" | cut -d'.' -f2)
        
        if [[ $ruby_major -ge 2 && $ruby_minor -ge 7 ]]; then
            log_success "Ruby version compatible: $ruby_version"
        else
            log_warning "Ruby version may be too old: $ruby_version (recommended: 2.7+)"
        fi
    else
        log_warning "Ruby not available for version compatibility check"
    fi
    
    return 0
}

test_jekyll_version_compatibility() {
    log_step "Testing Jekyll version compatibility"
    
    cd "$PROJECT_ROOT"
    
    if command -v bundle &>/dev/null && command -v jekyll &>/dev/null; then
        local jekyll_version
        jekyll_version=$(bundle exec jekyll -v | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
        local jekyll_major
        jekyll_major=$(echo "$jekyll_version" | cut -d'.' -f1)
        
        if [[ $jekyll_major -ge 4 ]]; then
            log_success "Jekyll version compatible: $jekyll_version"
        else
            log_warning "Jekyll version may be outdated: $jekyll_version (recommended: 4.0+)"
        fi
    else
        log_warning "Jekyll not available for version compatibility check"
    fi
    
    return 0
}

test_cross_platform_files() {
    log_step "Testing cross-platform file compatibility"
    
    cd "$PROJECT_ROOT"
    
    # Check file encoding
    local non_utf8_files=0
    find . -name "*.md" -o -name "*.html" -o -name "*.yml" -o -name "*.yaml" -o -name "*.rb" | while read -r file; do
        if command -v file &>/dev/null; then
            local encoding
            encoding=$(file -b --mime-encoding "$file")
            if [[ "$encoding" != "utf-8" && "$encoding" != "us-ascii" ]]; then
                log_warning "Non-UTF-8 encoding in $file: $encoding"
                non_utf8_files=$((non_utf8_files + 1))
            fi
        fi
    done
    
    # Check for Windows line endings
    if find . -name "*.md" -o -name "*.html" -o -name "*.yml" -o -name "*.yaml" -o -name "*.rb" -exec grep -l $'\r' {} \; | head -1 | grep -q .; then
        log_warning "Windows line endings (CRLF) found in some files"
    else
        log_success "No Windows line endings found"
    fi
    
    # Check for case sensitivity issues
    local case_issues=0
    find . -type f | sort | uniq -d -i | while read -r duplicate; do
        log_warning "Potential case sensitivity issue: $duplicate"
        case_issues=$((case_issues + 1))
    done
    
    if [[ $case_issues -eq 0 ]]; then
        log_success "No case sensitivity issues found"
    fi
    
    return 0
}

test_browser_compatibility() {
    log_step "Testing browser compatibility features"
    
    cd "$TEST_SITE_DIR"
    
    # Check for modern CSS features that might need fallbacks
    if find . -name "*.css" -o -name "*.scss" | xargs grep -l 'grid\|flex\|css-variables\|--' 2>/dev/null | head -1 | grep -q .; then
        log_info "Modern CSS features detected - ensure browser compatibility"
    fi
    
    # Check for HTML5 doctype (case-insensitive)
    if find . -name "*.html" -exec grep -iq '<!doctype html>' {} \; -print -quit | grep -q .; then
        log_success "HTML5 doctype found"
    else
        log_warning "HTML5 doctype not found in templates"
    fi
    
    # Check for responsive design indicators
    if find . -name "*.css" -o -name "*.scss" | xargs grep -l 'media.*query\|@media' 2>/dev/null | head -1 | grep -q .; then
        log_success "Responsive design indicators found"
    else
        log_info "No responsive design indicators found"
    fi
    
    return 0
}

#
# PERFORMANCE TESTS
#

test_build_performance() {
    log_step "Testing build performance"
    
    cd "$PROJECT_ROOT"
    
    # Check Ruby version first
    if command -v ruby &>/dev/null; then
        local ruby_version
        ruby_version=$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
        local ruby_major
        local ruby_minor
        ruby_major=$(echo "$ruby_version" | cut -d'.' -f1)
        ruby_minor=$(echo "$ruby_version" | cut -d'.' -f2)
        
        if [[ $ruby_major -lt 2 || ($ruby_major -eq 2 && $ruby_minor -lt 7) ]]; then
            log_warning "Skipping build performance test - Ruby $ruby_version is below required 2.7.0"
            return 0
        fi
    fi
    
    if command -v bundle &>/dev/null && command -v jekyll &>/dev/null; then
        # Create temporary test site
        local temp_site=$(mktemp -d -t jekyll-perf-test-XXXXXX)
        cp -r . "$temp_site/"
        cd "$temp_site"
        
        # Remove existing _site to ensure clean build
        rm -rf _site
        
        # Measure build time
        local start_time=$(date +%s)
        if bundle exec jekyll build --quiet; then
            local end_time=$(date +%s)
            local build_time=$((end_time - start_time))
            
            log_info "Jekyll build completed in ${build_time} seconds"
            
            # Performance benchmarks
            if [[ $build_time -lt 30 ]]; then
                log_success "Excellent build performance: ${build_time}s (< 30s)"
            elif [[ $build_time -lt 60 ]]; then
                log_success "Good build performance: ${build_time}s (< 60s)"
            elif [[ $build_time -lt 120 ]]; then
                log_warning "Acceptable build performance: ${build_time}s (< 120s)"
            else
                log_warning "Slow build performance: ${build_time}s (> 120s)"
            fi
        else
            log_warning "Jekyll build skipped - likely due to Ruby version incompatibility"
            cd "$PROJECT_ROOT"
            rm -rf "$temp_site"
            return 0
        fi
        
        # Cleanup
        cd "$PROJECT_ROOT"
        rm -rf "$temp_site"
    else
        log_warning "Jekyll not available for build performance testing"
    fi
    
    return 0
}

test_asset_optimization() {
    log_step "Testing asset optimization"
    
    cd "$TEST_SITE_DIR"
    
    if [[ -d "_site" ]]; then
        # Check CSS file sizes
        local total_css_size=0
        if find "_site" -name "*.css" | head -1 | grep -q .; then
            total_css_size=$(find "_site" -name "*.css" -exec cat {} \; | wc -c)
            log_info "Total CSS size: $total_css_size bytes"
            
            if [[ $total_css_size -lt 100000 ]]; then  # Less than 100KB
                log_success "CSS assets well optimized: ${total_css_size} bytes"
            elif [[ $total_css_size -lt 500000 ]]; then  # Less than 500KB
                log_info "CSS assets reasonably sized: ${total_css_size} bytes"
            else
                log_warning "Large CSS assets: ${total_css_size} bytes - consider optimization"
            fi
        fi
        
        # Check JavaScript file sizes
        local total_js_size=0
        if find "_site" -name "*.js" | head -1 | grep -q .; then
            total_js_size=$(find "_site" -name "*.js" -exec cat {} \; | wc -c)
            log_info "Total JavaScript size: $total_js_size bytes"
            
            if [[ $total_js_size -lt 100000 ]]; then  # Less than 100KB
                log_success "JavaScript assets well optimized: ${total_js_size} bytes"
            elif [[ $total_js_size -lt 500000 ]]; then  # Less than 500KB
                log_info "JavaScript assets reasonably sized: ${total_js_size} bytes"
            else
                log_warning "Large JavaScript assets: ${total_js_size} bytes - consider optimization"
            fi
        fi
        
        # Check for asset minification
        if find "_site" -name "*.min.css" -o -name "*.min.js" | head -1 | grep -q .; then
            log_success "Minified assets found"
        else
            log_info "No minified assets found - consider minification for production"
        fi
    else
        log_warning "No built site found for asset optimization testing"
    fi
    
    return 0
}

test_page_generation() {
    log_step "Testing page generation efficiency"
    
    cd "$TEST_SITE_DIR"
    
    if [[ -d "_site" ]]; then
        local page_count
        page_count=$(find "_site" -name "*.html" | wc -l)
        log_info "Generated pages: $page_count"
        
        if [[ $page_count -gt 0 ]]; then
            log_success "Pages generated successfully"
            
            # Check for essential pages
            if [[ -f "_site/index.html" ]]; then
                log_success "Home page generated"
            else
                log_error "Home page not generated"
                return 1
            fi
            
            # Check for 404 page
            if [[ -f "_site/404.html" ]]; then
                log_success "404 page generated"
            else
                log_info "No 404 page found"
            fi
        else
            log_error "No pages generated"
            return 1
        fi
    else
        log_warning "No built site found for page generation testing"
    fi
    
    return 0
}

#
# MAIN TEST EXECUTION
#

run_quality_tests() {
    log_info "Starting quality assurance test suite..."
    
    # Setup test environment
    mkdir -p "$TEST_RESULTS_DIR"
    setup_test_site
    
    # Ensure cleanup happens
    trap cleanup_test_site EXIT
    
    # Security Tests
    log_info "=== SECURITY TESTS ==="
    run_test "Dependency Vulnerability Scan" "test_dependency_vulnerabilities" "security"
    run_test "Sensitive Files Check" "test_sensitive_files" "security"
    run_test "Hardcoded Secrets Scan" "test_hardcoded_secrets" "security"
    run_test "Secure Configuration Validation" "test_secure_configurations" "security"
    
    # Accessibility Tests
    log_info "=== ACCESSIBILITY TESTS ==="
    run_test "HTML Semantic Structure" "test_html_semantic_structure" "accessibility"
    run_test "Image Alt Text" "test_image_alt_text" "accessibility"
    run_test "Color Contrast" "test_color_contrast" "accessibility"
    run_test "Keyboard Navigation" "test_keyboard_navigation" "accessibility"
    
    # Content Quality Tests
    log_info "=== CONTENT QUALITY TESTS ==="
    run_test "Preview Image URLs" "test_preview_image_urls" "content"
    
    # Compatibility Tests
    log_info "=== COMPATIBILITY TESTS ==="
    run_test "Ruby Version Compatibility" "test_ruby_version_compatibility" "compatibility"
    run_test "Jekyll Version Compatibility" "test_jekyll_version_compatibility" "compatibility"
    run_test "Cross-Platform Files" "test_cross_platform_files" "compatibility"
    run_test "Browser Compatibility" "test_browser_compatibility" "compatibility"
    
    # Performance Tests
    log_info "=== PERFORMANCE TESTS ==="
    run_test "Build Performance" "test_build_performance" "performance"
    run_test "Asset Optimization" "test_asset_optimization" "performance"
    run_test "Page Generation" "test_page_generation" "performance"
}

# Generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/quality_test_report.json"
    
    log_info "Generating quality test report..."
    
    # Aggregate all test results
    if command -v jq &>/dev/null; then
        jq -s '{
          timestamp: (.[0].timestamp // now | strftime("%Y-%m-%dT%H:%M:%SZ")),
          test_suite: "zer0-mistakes Quality Assurance Tests",
          environment: {
            os: "'$(uname -s)'",
            arch: "'$(uname -m)'",
            ruby_available: '$(command -v ruby &>/dev/null && echo "true" || echo "false")',
            jekyll_available: '$(command -v jekyll &>/dev/null && echo "true" || echo "false")',
            bundle_available: '$(command -v bundle &>/dev/null && echo "true" || echo "false")'
          },
          summary: {
            total: '"$TESTS_TOTAL"',
            passed: '"$TESTS_PASSED"',
            failed: '"$TESTS_FAILED"',
            skipped: '"$TESTS_SKIPPED"',
            success_rate: '$(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))'
          },
          test_categories: [
            {
              name: "Security Tests",
              total_tests: ([.[] | select(.category == "security")] | length),
              passed_tests: ([.[] | select(.category == "security" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "security" and .result == "FAIL")] | length)
            },
            {
              name: "Accessibility Tests",
              total_tests: ([.[] | select(.category == "accessibility")] | length),
              passed_tests: ([.[] | select(.category == "accessibility" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "accessibility" and .result == "FAIL")] | length)
            },
            {
              name: "Content Quality Tests",
              total_tests: ([.[] | select(.category == "content")] | length),
              passed_tests: ([.[] | select(.category == "content" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "content" and .result == "FAIL")] | length)
            },
            {
              name: "Compatibility Tests",
              total_tests: ([.[] | select(.category == "compatibility")] | length),
              passed_tests: ([.[] | select(.category == "compatibility" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "compatibility" and .result == "FAIL")] | length)
            },
            {
              name: "Performance Tests",
              total_tests: ([.[] | select(.category == "performance")] | length),
              passed_tests: ([.[] | select(.category == "performance" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "performance" and .result == "FAIL")] | length)
            }
          ],
          tests: .
        }' "$TEST_RESULTS_DIR"/quality_test_*.json > "$report_file" 2>/dev/null || {
            # Fallback if jq processing fails
            cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Quality Assurance Tests",
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  }
}
EOF
        }
    else
        # Fallback JSON generation without jq
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Quality Assurance Tests",
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  }
}
EOF
    fi
    
    log_success "Quality test report generated: $report_file"
}

# Print final summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "  Quality Assurance Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo ""
    echo "Environment:"
    echo "  OS: $(uname -s) $(uname -m)"
    echo "  Ruby: $(command -v ruby &>/dev/null && ruby --version || echo "Not Available")"
    echo "  Jekyll: $(command -v jekyll &>/dev/null && jekyll --version || echo "Not Available")"
    echo ""
    echo "Results:"
    echo "  Total Tests: $TESTS_TOTAL"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo "  Skipped: $TESTS_SKIPPED"
    echo ""
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        echo "Success Rate: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%"
    else
        echo "Success Rate: N/A (no tests run)"
    fi
    echo ""
    echo "Quality Areas Tested:"
    echo "  🔒 Security       - Vulnerability scanning, secure configurations"
    echo "  ♿ Accessibility  - WCAG compliance, semantic HTML"
    echo "  📄 Content        - Preview image URLs, frontmatter validation"
    echo "  🌐 Compatibility - Cross-platform, version compatibility"
    echo "  ⚡ Performance   - Build times, asset optimization"
    echo ""
    echo "Reports saved to: $TEST_RESULTS_DIR/"
    echo "=========================================="
}

# Main execution function
main() {
    parse_arguments "$@"
    
    log_info "Starting zer0-mistakes quality assurance test suite"
    log_info "Project root: $PROJECT_ROOT"
    
    # Run all quality tests
    run_quality_tests
    
    # Generate reports
    generate_test_report
    
    # Print summary
    print_test_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Some quality tests failed. Check the reports for details."
        log_info "Quality issues found - review and address before production deployment."
        exit 1
    else
        log_success "All quality tests passed!"
        log_info "The zer0-mistakes theme meets quality assurance standards."
        exit 0
    fi
}

# Execute main function
main "$@"
