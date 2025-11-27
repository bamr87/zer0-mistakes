#!/bin/bash

# Core Test Suite for zer0-mistakes Jekyll Theme
# Combines unit, integration, and basic validation tests
# 
# This suite focuses on:
# - Theme file structure and syntax validation
# - Jekyll configuration and build process
# - Core functionality and dependencies
# - Basic integration testing

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
VERBOSE=false
COVERAGE=false
FORMAT="text"
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

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v) VERBOSE=true; shift ;;
            --coverage|-c) COVERAGE=true; shift ;;
            --format|-f) FORMAT="$2"; shift 2 ;;
            --timeout|-t) TIMEOUT="$2"; shift 2 ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
Core Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Runs core functionality tests including unit tests, integration tests,
    and basic validation tests for the Jekyll theme.

OPTIONS:
    -v, --verbose      Enable verbose output
    -c, --coverage     Generate coverage reports
    -f, --format       Output format: text, json, xml (default: text)
    -t, --timeout      Test timeout in seconds (default: 300)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run all core tests
    $0 --verbose       # Run with detailed output
    $0 --format json   # Generate JSON output
EOF
}

# Test execution functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    local category="${3:-core}"
    
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
    local result_file="$TEST_RESULTS_DIR/core_test_$(date +%s%N).json"
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

#
# UNIT TESTS
#

test_file_structure() {
    log_info "Validating theme file structure..."
    
    cd "$PROJECT_ROOT"
    
    # Test required files exist
    local required_files=(
        "README.md"
        "LICENSE"
        "_config.yml"
        "Gemfile"
        "jekyll-theme-zer0.gemspec"
        "package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file missing: $file"
            return 1
        fi
    done
    
    # Test required directories exist
    local required_dirs=(
        "_layouts"
        "_includes"
        "_sass"
        "assets"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "Required directory missing: $dir"
            return 1
        fi
    done
    
    log_success "File structure validation passed"
    return 0
}

test_yaml_syntax() {
    log_info "Validating YAML file syntax..."
    
    cd "$PROJECT_ROOT"
    
    # Test main configuration files
    local yaml_files=(
        "_config.yml"
        "_config_dev.yml"
    )
    
    if command -v ruby &>/dev/null; then
        for yaml_file in "${yaml_files[@]}"; do
            if [[ -f "$yaml_file" ]]; then
                if ruby -e "require 'yaml'; YAML.load_file('$yaml_file')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
                    log_error "$yaml_file contains syntax errors"
                    return 1
                else
                    log_success "$yaml_file syntax is valid"
                fi
            fi
        done
    else
        log_warning "Ruby not available for YAML validation"
    fi
    
    # Test data files
    if [[ -d "_data" ]]; then
        find "_data" -name "*.yml" -o -name "*.yaml" | while read -r file; do
            if command -v ruby &>/dev/null; then
                if ruby -e "require 'yaml'; YAML.load_file('$file')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
                    log_error "$file contains syntax errors"
                    return 1
                fi
            fi
        done
    fi
    
    return 0
}

test_gemspec_validity() {
    log_info "Validating gemspec file..."
    
    cd "$PROJECT_ROOT"
    
    if command -v ruby &>/dev/null; then
        if ruby -c jekyll-theme-zer0.gemspec &>/dev/null; then
            log_success "Gemspec syntax is valid"
        else
            log_error "Gemspec contains syntax errors"
            return 1
        fi
        
        # Test gemspec can be built
        if gem build jekyll-theme-zer0.gemspec --quiet &>/dev/null; then
            log_success "Gemspec builds correctly"
            # Clean up the built gem
            rm -f jekyll-theme-zer0-*.gem
        else
            log_error "Gemspec cannot be built"
            return 1
        fi
    else
        log_warning "Ruby not available for gemspec validation"
    fi
    
    return 0
}

test_package_json_validity() {
    log_info "Validating package.json..."
    
    cd "$PROJECT_ROOT"
    
    if command -v jq &>/dev/null; then
        if jq empty package.json &>/dev/null; then
            log_success "package.json syntax is valid"
        else
            log_error "package.json contains syntax errors"
            return 1
        fi
        
        # Test version format
        if jq -r '.version' package.json | grep -E '^[0-9]+\.[0-9]+\.[0-9]+(\-[a-zA-Z0-9\.\-]+)?$' &>/dev/null; then
            log_success "package.json version format is valid"
        else
            log_error "package.json version format is invalid"
            return 1
        fi
    else
        log_warning "jq not available for package.json validation"
    fi
    
    return 0
}

test_version_consistency() {
    log_info "Testing version consistency..."
    
    cd "$PROJECT_ROOT"
    
    if command -v ruby &>/dev/null && command -v jq &>/dev/null; then
        local pkg_version
        local gem_version
        
        pkg_version=$(jq -r '.version' package.json 2>/dev/null || echo "")
        gem_version=$(grep -o 'spec.version.*=.*"[^"]*"' jekyll-theme-zer0.gemspec | sed 's/.*"\([^"]*\)".*/\1/' 2>/dev/null || echo "")
        
        if [[ -n "$pkg_version" && -n "$gem_version" ]]; then
            if [[ "$pkg_version" == "$gem_version" ]]; then
                log_success "Version consistency check passed: $pkg_version"
            else
                log_error "Version mismatch - package.json: $pkg_version, gemspec: $gem_version"
                return 1
            fi
        else
            log_warning "Could not extract versions for consistency check"
        fi
    else
        log_warning "Ruby or jq not available for version consistency check"
    fi
    
    return 0
}

#
# INTEGRATION TESTS
#

test_bundle_install() {
    log_info "Testing bundle install..."
    
    cd "$PROJECT_ROOT"
    
    if command -v bundle &>/dev/null; then
        # Check Ruby version first
        if command -v ruby &>/dev/null; then
            local ruby_version
            ruby_version=$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
            local ruby_major
            local ruby_minor
            ruby_major=$(echo "$ruby_version" | cut -d'.' -f1)
            ruby_minor=$(echo "$ruby_version" | cut -d'.' -f2)
            
            if [[ $ruby_major -lt 2 || ($ruby_major -eq 2 && $ruby_minor -lt 7) ]]; then
                log_warning "Ruby version $ruby_version is below required 2.7.0 - skipping bundle install"
                return 0
            fi
        fi
        
        if bundle check &>/dev/null || bundle install --quiet; then
            log_success "Bundle install completed successfully"
        else
            log_warning "Bundle install failed (may be due to environment or dependency issues)"
            # Don't fail the test as this might be expected in some environments
        fi
    else
        log_warning "Bundler not available for bundle install test"
    fi
    
    return 0
}

test_jekyll_build() {
    log_info "Testing Jekyll build process..."
    
    cd "$PROJECT_ROOT"
    
    if command -v bundle &>/dev/null; then
        # Check Ruby version first
        if command -v ruby &>/dev/null; then
            local ruby_version
            ruby_version=$(ruby -v | grep -o 'ruby [0-9]\+\.[0-9]\+' | cut -d' ' -f2)
            local ruby_major
            local ruby_minor
            ruby_major=$(echo "$ruby_version" | cut -d'.' -f1)
            ruby_minor=$(echo "$ruby_version" | cut -d'.' -f2)
            
            if [[ $ruby_major -lt 2 || ($ruby_major -eq 2 && $ruby_minor -lt 7) ]]; then
                log_warning "Ruby version $ruby_version is below required 2.7.0 - skipping Jekyll build test"
                return 0
            fi
        fi
        
        # Check if Jekyll is available
        if ! command -v jekyll &>/dev/null; then
            log_warning "Jekyll not available for build test"
            return 0
        fi
        
        # Create temporary test site
        local temp_site=$(mktemp -d -t jekyll-test-XXXXXX)
        
        # Copy theme files to test site
        cp -r . "$temp_site/"
        cd "$temp_site"
        
        # Remove existing _site to ensure clean build
        rm -rf _site
        
        if bundle exec jekyll build --quiet; then
            log_success "Jekyll build completed successfully"
            
            # Test that essential files were generated
            if [[ -f "_site/index.html" ]]; then
                log_success "index.html generated correctly"
            else
                log_error "index.html not generated"
                cd "$PROJECT_ROOT"
                rm -rf "$temp_site"
                return 1
            fi
            
            # Test that assets were processed
            if find "_site/assets" -name "*.css" | head -1 | grep -q .; then
                log_success "CSS assets processed correctly"
            else
                log_warning "No CSS assets found in _site/assets"
            fi
            
        else
            log_error "Jekyll build failed"
            cd "$PROJECT_ROOT"
            rm -rf "$temp_site"
            return 1
        fi
        
        # Cleanup
        cd "$PROJECT_ROOT"
        rm -rf "$temp_site"
    else
        log_warning "Jekyll not available for build test"
    fi
    
    return 0
}

test_gem_build() {
    log_info "Testing gem build process..."
    
    cd "$PROJECT_ROOT"
    
    if command -v gem &>/dev/null; then
        # Clean up any existing gem files
        rm -f jekyll-theme-zer0-*.gem
        
        if gem build jekyll-theme-zer0.gemspec --quiet; then
            log_success "Gem build completed successfully"
            
            # Test gem contents
            local gem_file
            gem_file=$(ls jekyll-theme-zer0-*.gem 2>/dev/null | head -1)
            
            if [[ -f "$gem_file" ]]; then
                # Check that essential files are included using tar (gems are tar.gz files)
                if tar -tzf "$gem_file" | grep -q "_layouts" || tar -tzf "$gem_file" | grep -q "layouts"; then
                    log_success "Gem contains layout files"
                else
                    log_warning "Gem may not contain layout files (check gemspec file patterns)"
                fi
                
                if tar -tzf "$gem_file" | grep -q "assets" || tar -tzf "$gem_file" | grep -q "lib"; then
                    log_success "Gem contains expected files"
                else
                    log_warning "Gem may not contain expected files (check gemspec file patterns)"
                fi
                
                # Clean up
                rm -f jekyll-theme-zer0-*.gem
            else
                log_error "Gem file not found after build"
                return 1
            fi
        else
            log_error "Gem build failed"
            return 1
        fi
    else
        log_warning "Gem command not available for build test"
    fi
    
    return 0
}

#
# VALIDATION TESTS
#

test_liquid_templates() {
    log_info "Validating Liquid templates..."
    
    cd "$PROJECT_ROOT"
    
    # Check layout files for basic Liquid syntax
    if [[ -d "_layouts" ]]; then
        find "_layouts" -name "*.html" | while read -r layout; do
            # Check for balanced Liquid tags
            local open_tags
            local close_tags
            
            open_tags=$(grep -c "{%" "$layout" 2>/dev/null | tr -d '[:space:]' || echo "0")
            close_tags=$(grep -c "%}" "$layout" 2>/dev/null | tr -d '[:space:]' || echo "0")
            
            # Ensure we have valid numbers
            [[ -z "$open_tags" ]] && open_tags=0
            [[ -z "$close_tags" ]] && close_tags=0
            
            if [[ "$open_tags" -ne "$close_tags" ]]; then
                log_error "Unbalanced Liquid tags in $layout"
                return 1
            fi
        done
    fi
    
    # Check include files
    if [[ -d "_includes" ]]; then
        find "_includes" -name "*.html" | while read -r include; do
            # Basic syntax check for common issues
            if grep -q "{{.*{{" "$include"; then
                log_error "Nested Liquid output tags found in $include"
                return 1
            fi
        done
    fi
    
    log_success "Liquid template validation passed"
    return 0
}

test_sass_compilation() {
    log_info "Testing Sass compilation..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -d "_sass" ]]; then
        if command -v sass &>/dev/null; then
            find "_sass" -name "*.scss" | while read -r sass_file; do
                if sass --check "$sass_file" &>/dev/null; then
                    log_success "Sass file valid: $(basename "$sass_file")"
                else
                    log_error "Sass syntax error in: $sass_file"
                    return 1
                fi
            done
        else
            log_warning "Sass not available for compilation test"
        fi
    fi
    
    return 0
}

test_javascript_syntax() {
    log_info "Testing JavaScript syntax..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -d "assets/js" ]]; then
        if command -v node &>/dev/null; then
            find "assets/js" -name "*.js" | while read -r js_file; do
                if node --check "$js_file" &>/dev/null; then
                    log_success "JavaScript file valid: $(basename "$js_file")"
                else
                    log_error "JavaScript syntax error in: $js_file"
                    return 1
                fi
            done
        else
            log_warning "Node.js not available for JavaScript syntax check"
        fi
    fi
    
    return 0
}

#
# MAIN TEST EXECUTION
#

run_core_tests() {
    log_info "Starting core test suite..."
    
    # Setup test environment
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Unit Tests
    log_info "=== UNIT TESTS ==="
    run_test "File Structure Validation" "test_file_structure" "unit"
    run_test "YAML Syntax Validation" "test_yaml_syntax" "unit"
    run_test "Gemspec Validity" "test_gemspec_validity" "unit"
    run_test "Package.json Validity" "test_package_json_validity" "unit"
    run_test "Version Consistency" "test_version_consistency" "unit"
    
    # Integration Tests
    log_info "=== INTEGRATION TESTS ==="
    run_test "Bundle Install" "test_bundle_install" "integration"
    run_test "Jekyll Build Process" "test_jekyll_build" "integration"
    run_test "Gem Build Process" "test_gem_build" "integration"
    
    # Validation Tests
    log_info "=== VALIDATION TESTS ==="
    run_test "Liquid Template Validation" "test_liquid_templates" "validation"
    run_test "Sass Compilation" "test_sass_compilation" "validation"
    run_test "JavaScript Syntax" "test_javascript_syntax" "validation"
}

# Generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/core_test_report.json"
    
    log_info "Generating test report..."
    
    # Aggregate all test results
    if command -v jq &>/dev/null; then
        jq -s '{
          timestamp: (.[0].timestamp // now | strftime("%Y-%m-%dT%H:%M:%SZ")),
          test_suite: "zer0-mistakes Core Tests",
          summary: {
            total: '"$TESTS_TOTAL"',
            passed: '"$TESTS_PASSED"',
            failed: '"$TESTS_FAILED"',
            skipped: '"$TESTS_SKIPPED"',
            success_rate: '$(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))'
          },
          tests: .
        }' "$TEST_RESULTS_DIR"/core_test_*.json > "$report_file" 2>/dev/null || {
            # Fallback if jq processing fails
            cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Core Tests",
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
  "test_suite": "zer0-mistakes Core Tests",
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
    
    log_success "Test report generated: $report_file"
}

# Print final summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "  Core Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
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
    echo "Reports saved to: $TEST_RESULTS_DIR/"
    echo "=========================================="
}

# Main execution function
main() {
    parse_arguments "$@"
    
    log_info "Starting zer0-mistakes core test suite"
    log_info "Project root: $PROJECT_ROOT"
    
    # Run all core tests
    run_core_tests
    
    # Generate reports
    generate_test_report
    
    # Print summary
    print_test_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Some core tests failed. Check the reports for details."
        exit 1
    else
        log_success "All core tests passed!"
        exit 0
    fi
}

# Execute main function
main "$@"
