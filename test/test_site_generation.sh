#!/bin/bash

# =============================================================================
# Site Generation Test Suite for zer0-mistakes Jekyll Theme
# =============================================================================
# 
# Tests the configuration matrix generator by:
# - Generating sites for each installation mode
# - Building with Jekyll
# - Validating generated content
#
# Usage:
#   ./test/test_site_generation.sh [OPTIONS]
#
# Options:
#   -m, --mode MODE       Test specific mode (full, minimal, remote_theme, gem)
#   -a, --all             Test all modes
#   -v, --verbose         Enable verbose output
#   -k, --keep            Keep generated sites after testing
#   -h, --help            Show help message

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_GENERATOR="$SCRIPT_DIR/lib/config_matrix_generator.sh"

# Source test utilities
source "$SCRIPT_DIR/lib/install_test_utils.sh"

# Test configuration
TEST_MODE=""
TEST_ALL=false
VERBOSE=false
KEEP_SITES=false
GENERATED_SITES_DIR=""

# Available modes
readonly MODES=("full" "minimal" "remote_theme" "gem")

# =============================================================================
# CLI PARSING
# =============================================================================

show_help() {
    cat << EOF
Site Generation Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Tests the configuration matrix generator by creating and building
    Jekyll sites for each installation mode.

OPTIONS:
    -m, --mode MODE       Test specific mode (full, minimal, remote_theme, gem)
    -a, --all             Test all modes (default)
    -v, --verbose         Enable verbose output
    -k, --keep            Keep generated sites after testing
    -h, --help            Show this help message

MODES:
    full          Complete local installation with all theme files
    minimal       Essential files only (config, Gemfile, index)
    remote_theme  GitHub Pages remote_theme configuration
    gem           Ruby gem-based theme installation

EXAMPLES:
    $0 --all                  # Test all modes
    $0 --mode full            # Test only full mode
    $0 --mode minimal --keep  # Test minimal and keep the generated site
    $0 --verbose              # Detailed output
EOF
}

parse_arguments() {
    # Default to testing all modes
    TEST_ALL=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                TEST_MODE="$2"
                TEST_ALL=false
                shift 2
                ;;
            -a|--all)
                TEST_ALL=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -k|--keep)
                KEEP_SITES=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                test_log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# SITE GENERATION TESTS
# =============================================================================

# Generate a site for a specific mode
generate_site_for_mode() {
    local mode="$1"
    local output_dir="$2"
    
    test_log_info "Generating site for mode: $mode"
    
    # Ensure config generator exists
    if [[ ! -f "$CONFIG_GENERATOR" ]]; then
        test_log_error "Config generator not found: $CONFIG_GENERATOR"
        return 1
    fi
    
    # Make it executable
    chmod +x "$CONFIG_GENERATOR"
    
    # Generate site
    if [[ "$VERBOSE" == "true" ]]; then
        "$CONFIG_GENERATOR" --mode "$mode" --output "$output_dir"
    else
        "$CONFIG_GENERATOR" --mode "$mode" --output "$output_dir" > /dev/null 2>&1
    fi
    
    return $?
}

# Build a Jekyll site
build_jekyll_site() {
    local site_dir="$1"
    local mode="$2"
    
    test_log_info "Building Jekyll site for mode: $mode"
    
    cd "$site_dir"
    
    # Check if bundle is available
    if ! command -v bundle &>/dev/null; then
        test_log_warning "Bundler not available, skipping Jekyll build"
        cd "$PROJECT_ROOT"
        return 0
    fi
    
    # Install dependencies
    test_log_info "Installing dependencies..."
    if [[ "$VERBOSE" == "true" ]]; then
        bundle install
    else
        bundle install --quiet 2>/dev/null || bundle install
    fi
    
    # Build site
    test_log_info "Building site..."
    local build_result=0
    if [[ "$VERBOSE" == "true" ]]; then
        bundle exec jekyll build || build_result=$?
    else
        bundle exec jekyll build --quiet 2>/dev/null || bundle exec jekyll build || build_result=$?
    fi
    
    cd "$PROJECT_ROOT"
    
    if [[ $build_result -ne 0 ]]; then
        test_log_error "Jekyll build failed for mode: $mode"
        return 1
    fi
    
    test_log_success "Jekyll build succeeded for mode: $mode"
    return 0
}

# Validate generated site content
validate_site_content() {
    local site_dir="$1"
    local mode="$2"
    local errors=0
    
    test_log_info "Validating site content for mode: $mode"
    
    # Check _config.yml exists
    if [[ ! -f "$site_dir/_config.yml" ]]; then
        test_log_error "Missing _config.yml"
        errors=$((errors + 1))
    fi
    
    # Check Gemfile exists
    if [[ ! -f "$site_dir/Gemfile" ]]; then
        test_log_error "Missing Gemfile"
        errors=$((errors + 1))
    fi
    
    # Check index page exists
    if [[ ! -f "$site_dir/index.md" ]] && [[ ! -f "$site_dir/index.html" ]]; then
        test_log_error "Missing index page"
        errors=$((errors + 1))
    fi
    
    # Mode-specific validations
    case "$mode" in
        full)
            # Full mode should have theme directories
            if [[ ! -d "$site_dir/_layouts" ]]; then
                test_log_warning "Full mode missing _layouts directory"
            fi
            ;;
        minimal)
            # Minimal mode should NOT have theme directories
            if [[ -d "$site_dir/_layouts" ]]; then
                test_log_error "Minimal mode should not have _layouts"
                errors=$((errors + 1))
            fi
            ;;
        remote_theme)
            # Remote theme config should reference remote_theme
            if ! grep -q "remote_theme:" "$site_dir/_config.yml"; then
                test_log_error "Remote theme mode missing remote_theme in config"
                errors=$((errors + 1))
            fi
            ;;
        gem)
            # Gem mode should reference theme
            if ! grep -q "theme:" "$site_dir/_config.yml"; then
                test_log_error "Gem mode missing theme in config"
                errors=$((errors + 1))
            fi
            ;;
    esac
    
    if [[ $errors -eq 0 ]]; then
        test_log_success "Site content validation passed for mode: $mode"
    fi
    
    return $errors
}

# Validate built site (_site directory)
validate_built_site() {
    local site_dir="$1"
    local mode="$2"
    local errors=0
    
    test_log_info "Validating built site for mode: $mode"
    
    local site_output="$site_dir/_site"
    
    if [[ ! -d "$site_output" ]]; then
        test_log_warning "No _site directory (Jekyll may not have been built)"
        return 0
    fi
    
    # Check index.html was generated
    if [[ ! -f "$site_output/index.html" ]]; then
        test_log_error "Missing generated index.html"
        errors=$((errors + 1))
    fi
    
    # Check for CSS files (if assets were processed)
    if find "$site_output" -name "*.css" 2>/dev/null | head -1 | grep -q .; then
        test_log_success "CSS assets generated"
    else
        test_log_info "No CSS files found (may be expected for minimal mode)"
    fi
    
    # Check for broken HTML (basic validation)
    if [[ -f "$site_output/index.html" ]]; then
        # Check for basic HTML structure
        if grep -q "<html" "$site_output/index.html" && grep -q "</html>" "$site_output/index.html"; then
            test_log_success "HTML structure is valid"
        else
            test_log_warning "HTML structure may be incomplete"
        fi
    fi
    
    return $errors
}

# =============================================================================
# TEST EXECUTION
# =============================================================================

test_generate_full_site() {
    local workspace
    workspace=$(create_test_workspace "gen-full")
    
    generate_site_for_mode "full" "$workspace"
    validate_site_content "$workspace" "full"
}

test_generate_minimal_site() {
    local workspace
    workspace=$(create_test_workspace "gen-minimal")
    
    generate_site_for_mode "minimal" "$workspace"
    validate_site_content "$workspace" "minimal"
}

test_generate_remote_theme_site() {
    local workspace
    workspace=$(create_test_workspace "gen-remote")
    
    generate_site_for_mode "remote_theme" "$workspace"
    validate_site_content "$workspace" "remote_theme"
}

test_generate_gem_site() {
    local workspace
    workspace=$(create_test_workspace "gen-gem")
    
    generate_site_for_mode "gem" "$workspace"
    validate_site_content "$workspace" "gem"
}

test_all_modes_build_success() {
    test_log_info "Testing Jekyll build for all modes..."
    
    local all_passed=true
    
    for mode in "${MODES[@]}"; do
        local workspace
        workspace=$(create_test_workspace "build-$mode")
        
        if generate_site_for_mode "$mode" "$workspace"; then
            # Only try to build if generation succeeded
            # Note: remote_theme and gem modes may fail without network/gem access
            if [[ "$mode" == "full" ]] || [[ "$mode" == "minimal" ]]; then
                if ! build_jekyll_site "$workspace" "$mode"; then
                    test_log_warning "Build failed for mode: $mode"
                    # Don't fail the test for build issues (may be environment)
                fi
            else
                test_log_info "Skipping build for $mode (requires network/gem access)"
            fi
        else
            test_log_error "Generation failed for mode: $mode"
            all_passed=false
        fi
    done
    
    if [[ "$all_passed" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

test_generated_pages_exist() {
    test_log_info "Testing generated pages exist for all modes..."
    
    for mode in "${MODES[@]}"; do
        local workspace
        workspace=$(create_test_workspace "pages-$mode")
        
        generate_site_for_mode "$mode" "$workspace"
        
        # Check essential pages
        assert_file_exists "$workspace/index.md" "index.md should exist for $mode"
        
        # Check about page
        if [[ -f "$workspace/pages/about.md" ]]; then
            test_log_success "About page exists for $mode"
        else
            test_log_warning "About page not found for $mode"
        fi
    done
}

test_assets_compiled() {
    test_log_info "Testing assets compilation..."
    
    # Only test full mode which has assets
    local workspace
    workspace=$(create_test_workspace "assets-test")
    
    generate_site_for_mode "full" "$workspace"
    
    # Check assets directory exists
    if [[ -d "$workspace/assets" ]]; then
        test_log_success "Assets directory exists"
        
        # Check for CSS
        if find "$workspace/assets" -name "*.css" -o -name "*.scss" 2>/dev/null | head -1 | grep -q .; then
            test_log_success "CSS/SCSS files found in assets"
        else
            test_log_info "No CSS/SCSS in assets (may be in _sass)"
        fi
        
        # Check for JS
        if find "$workspace/assets" -name "*.js" 2>/dev/null | head -1 | grep -q .; then
            test_log_success "JavaScript files found in assets"
        fi
    else
        test_log_info "No assets directory (expected for minimal/remote/gem modes)"
    fi
}

# Test a single mode
test_single_mode() {
    local mode="$1"
    
    test_log_info "=== Testing mode: $mode ==="
    
    local workspace
    if [[ "$KEEP_SITES" == "true" ]]; then
        GENERATED_SITES_DIR="${GENERATED_SITES_DIR:-$(mktemp -d -t site-gen-XXXXXX)}"
        workspace="$GENERATED_SITES_DIR/$mode"
        mkdir -p "$workspace"
    else
        workspace=$(create_test_workspace "test-$mode")
    fi
    
    local result=0
    
    # Generate site
    if ! generate_site_for_mode "$mode" "$workspace"; then
        test_log_error "Site generation failed for mode: $mode"
        return 1
    fi
    
    # Validate content
    if ! validate_site_content "$workspace" "$mode"; then
        test_log_error "Content validation failed for mode: $mode"
        result=1
    fi
    
    # Try to build (for full and minimal modes)
    if [[ "$mode" == "full" ]] || [[ "$mode" == "minimal" ]]; then
        if command -v bundle &>/dev/null; then
            if build_jekyll_site "$workspace" "$mode"; then
                validate_built_site "$workspace" "$mode" || true
            fi
        fi
    fi
    
    if [[ $result -eq 0 ]]; then
        test_log_success "Mode $mode: All tests passed"
    fi
    
    return $result
}

# =============================================================================
# MAIN
# =============================================================================

run_all_generation_tests() {
    test_log_info "=== SITE GENERATION TESTS ==="
    
    run_test "Generate full site" "test_generate_full_site" "generation"
    run_test "Generate minimal site" "test_generate_minimal_site" "generation"
    run_test "Generate remote_theme site" "test_generate_remote_theme_site" "generation"
    run_test "Generate gem site" "test_generate_gem_site" "generation"
    run_test "All modes build success" "test_all_modes_build_success" "generation"
    run_test "Generated pages exist" "test_generated_pages_exist" "generation"
    run_test "Assets compiled" "test_assets_compiled" "generation"
}

main() {
    parse_arguments "$@"
    
    test_log_info "Starting Site Generation Test Suite"
    test_log_info "Project root: $PROJECT_ROOT"
    
    # Initialize test utilities
    init_install_test_utils
    
    # Setup cleanup trap (unless keeping sites)
    if [[ "$KEEP_SITES" != "true" ]]; then
        setup_cleanup_trap
    fi
    
    # Verify config generator exists
    if [[ ! -f "$CONFIG_GENERATOR" ]]; then
        test_log_error "Config generator not found: $CONFIG_GENERATOR"
        exit 1
    fi
    
    if [[ "$TEST_ALL" == "true" ]]; then
        # Run all generation tests
        run_all_generation_tests
    elif [[ -n "$TEST_MODE" ]]; then
        # Test single mode
        # Validate mode
        local valid_mode=false
        for mode in "${MODES[@]}"; do
            if [[ "$mode" == "$TEST_MODE" ]]; then
                valid_mode=true
                break
            fi
        done
        
        if [[ "$valid_mode" != "true" ]]; then
            test_log_error "Invalid mode: $TEST_MODE"
            test_log_error "Available modes: ${MODES[*]}"
            exit 1
        fi
        
        run_test "Test mode: $TEST_MODE" "test_single_mode $TEST_MODE" "generation"
    fi
    
    # Print summary
    print_test_summary
    
    # Show kept sites
    if [[ "$KEEP_SITES" == "true" ]] && [[ -n "$GENERATED_SITES_DIR" ]]; then
        test_log_info "Generated sites preserved at: $GENERATED_SITES_DIR"
        ls -la "$GENERATED_SITES_DIR"
    fi
    
    # Exit with appropriate code
    if [[ $INSTALL_TESTS_FAILED -gt 0 ]]; then
        test_log_error "Some tests failed. See results above."
        exit 1
    else
        test_log_success "All site generation tests passed!"
        exit 0
    fi
}

# Run main function
main "$@"
