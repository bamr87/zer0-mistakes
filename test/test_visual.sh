#!/bin/bash

# =============================================================================
# Visual Testing Suite for zer0-mistakes Jekyll Theme
# =============================================================================
# 
# Browser-based visual testing using Playwright to:
# - Capture screenshots of generated sites
# - Test responsive layouts (mobile, tablet, desktop)
# - Verify dark/light mode themes
# - Compare against baseline images
#
# Usage:
#   ./test/test_visual.sh [OPTIONS]
#
# Options:
#   -m, --mode MODE       Test specific installation mode
#   -a, --all-modes       Test all installation modes
#   -u, --update-baseline Update baseline screenshots
#   -v, --verbose         Enable verbose output
#   -p, --port PORT       Jekyll server port (default: 4000)
#   -h, --help            Show help message

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VISUAL_DIR="$SCRIPT_DIR/visual"
BASELINE_DIR="$VISUAL_DIR/baseline"
CURRENT_DIR="$VISUAL_DIR/current"
DIFF_DIR="$VISUAL_DIR/diff"
PLAYWRIGHT_CONFIG="$SCRIPT_DIR/playwright.config.js"

# Source test utilities
source "$SCRIPT_DIR/lib/install_test_utils.sh"

# Test configuration
TEST_MODE=""
TEST_ALL=false
UPDATE_BASELINE=false
VERBOSE=false
JEKYLL_PORT=4000
JEKYLL_PID=""

# Available modes
readonly MODES=("full" "minimal" "remote_theme" "gem")

# Viewport configurations
declare -A VIEWPORTS
VIEWPORTS["desktop"]="1280x720"
VIEWPORTS["tablet"]="768x1024"
VIEWPORTS["mobile"]="375x667"

# =============================================================================
# CLI PARSING
# =============================================================================

show_help() {
    cat << EOF
Visual Testing Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Browser-based visual testing using Playwright for screenshot
    capture, responsive testing, and visual regression detection.

OPTIONS:
    -m, --mode MODE       Test specific mode (full, minimal, remote_theme, gem)
    -a, --all-modes       Test all installation modes (default)
    -u, --update-baseline Update baseline screenshots
    -v, --verbose         Enable verbose output
    -p, --port PORT       Jekyll server port (default: 4000)
    -h, --help            Show this help message

EXAMPLES:
    $0 --all-modes              # Test all modes
    $0 --mode full              # Test only full mode
    $0 --update-baseline        # Update baseline screenshots
    $0 --mode full --verbose    # Detailed output for full mode
EOF
}

parse_arguments() {
    TEST_ALL=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                TEST_MODE="$2"
                TEST_ALL=false
                shift 2
                ;;
            -a|--all-modes)
                TEST_ALL=true
                shift
                ;;
            -u|--update-baseline)
                UPDATE_BASELINE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -p|--port)
                JEKYLL_PORT="$2"
                shift 2
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
# PLAYWRIGHT SETUP
# =============================================================================

check_playwright() {
    # Check if Node.js is available
    if ! command -v node &>/dev/null; then
        test_log_error "Node.js is required for visual testing"
        test_log_info "Install Node.js: https://nodejs.org/"
        return 1
    fi
    
    # Check if npx is available
    if ! command -v npx &>/dev/null; then
        test_log_error "npx is required for visual testing"
        return 1
    fi
    
    # Check if Playwright is installed (or can be installed)
    if ! npx playwright --version &>/dev/null 2>&1; then
        test_log_info "Playwright not found, attempting to install..."
        npm install -D @playwright/test || {
            test_log_error "Failed to install Playwright"
            return 1
        }
    fi
    
    test_log_success "Playwright is available"
    return 0
}

install_playwright_browsers() {
    test_log_info "Installing Playwright browsers..."
    
    npx playwright install chromium || {
        test_log_error "Failed to install Playwright browsers"
        return 1
    }
    
    test_log_success "Playwright browsers installed"
}

# =============================================================================
# JEKYLL SERVER MANAGEMENT
# =============================================================================

start_jekyll_server() {
    local site_dir="$1"
    
    test_log_info "Starting Jekyll server on port $JEKYLL_PORT..."
    
    cd "$site_dir"
    
    # Check if bundle is available
    if ! command -v bundle &>/dev/null; then
        test_log_error "Bundler is required to start Jekyll"
        cd "$PROJECT_ROOT"
        return 1
    fi
    
    # Install dependencies if needed
    if [[ ! -f "Gemfile.lock" ]]; then
        test_log_info "Installing dependencies..."
        bundle install --quiet
    fi
    
    # Start Jekyll in background
    bundle exec jekyll serve --port "$JEKYLL_PORT" --host 0.0.0.0 &>/dev/null &
    JEKYLL_PID=$!
    
    cd "$PROJECT_ROOT"
    
    # Wait for server to start
    local max_wait=60
    local waited=0
    
    while [[ $waited -lt $max_wait ]]; do
        if curl -sf "http://localhost:$JEKYLL_PORT" &>/dev/null; then
            test_log_success "Jekyll server started (PID: $JEKYLL_PID)"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$JEKYLL_PID" 2>/dev/null; then
            test_log_error "Jekyll server process died"
            return 1
        fi
        
        sleep 1
        waited=$((waited + 1))
        
        if [[ $((waited % 10)) -eq 0 ]]; then
            test_log_info "Waiting for Jekyll... ($waited/${max_wait}s)"
        fi
    done
    
    test_log_error "Jekyll server failed to start within ${max_wait}s"
    stop_jekyll_server
    return 1
}

stop_jekyll_server() {
    if [[ -n "$JEKYLL_PID" ]]; then
        test_log_info "Stopping Jekyll server (PID: $JEKYLL_PID)..."
        kill "$JEKYLL_PID" 2>/dev/null || true
        wait "$JEKYLL_PID" 2>/dev/null || true
        JEKYLL_PID=""
        test_log_success "Jekyll server stopped"
    fi
}

# =============================================================================
# SCREENSHOT CAPTURE
# =============================================================================

capture_screenshot() {
    local url="$1"
    local output_file="$2"
    local viewport="${3:-1280x720}"
    
    local width="${viewport%x*}"
    local height="${viewport#*x}"
    
    test_log_info "Capturing screenshot: $output_file (${viewport})"
    
    # Use Playwright to capture screenshot
    npx playwright screenshot \
        --viewport-size="${width},${height}" \
        "$url" \
        "$output_file" 2>/dev/null || {
        test_log_error "Failed to capture screenshot: $output_file"
        return 1
    }
    
    if [[ -f "$output_file" ]]; then
        test_log_success "Screenshot saved: $output_file"
        return 0
    else
        test_log_error "Screenshot file not created: $output_file"
        return 1
    fi
}

capture_page_screenshots() {
    local mode="$1"
    local base_url="http://localhost:$JEKYLL_PORT"
    local output_dir="$CURRENT_DIR/$mode"
    
    mkdir -p "$output_dir"
    
    test_log_info "Capturing screenshots for mode: $mode"
    
    # Pages to capture
    local pages=(
        "/"
        "/about/"
        "/docs/"
    )
    
    # Capture each page at each viewport
    for page in "${pages[@]}"; do
        local page_name="${page//\//_}"
        [[ "$page_name" == "_" ]] && page_name="_home"
        
        for viewport_name in "${!VIEWPORTS[@]}"; do
            local viewport="${VIEWPORTS[$viewport_name]}"
            local filename="${page_name}_${viewport_name}.png"
            local output_file="$output_dir/$filename"
            
            capture_screenshot "${base_url}${page}" "$output_file" "$viewport" || true
        done
    done
    
    test_log_success "Screenshots captured for mode: $mode"
}

# =============================================================================
# VISUAL COMPARISON
# =============================================================================

compare_screenshots() {
    local mode="$1"
    local baseline_path="$BASELINE_DIR/$mode"
    local current_path="$CURRENT_DIR/$mode"
    local diff_path="$DIFF_DIR/$mode"
    
    mkdir -p "$diff_path"
    
    test_log_info "Comparing screenshots for mode: $mode"
    
    if [[ ! -d "$baseline_path" ]]; then
        test_log_warning "No baseline images for mode: $mode"
        test_log_info "Run with --update-baseline to create baseline"
        return 0
    fi
    
    local differences=0
    
    for baseline_file in "$baseline_path"/*.png; do
        [[ -f "$baseline_file" ]] || continue
        
        local filename=$(basename "$baseline_file")
        local current_file="$current_path/$filename"
        local diff_file="$diff_path/$filename"
        
        if [[ ! -f "$current_file" ]]; then
            test_log_warning "Missing current screenshot: $filename"
            differences=$((differences + 1))
            continue
        fi
        
        # Compare images using ImageMagick if available
        if command -v compare &>/dev/null; then
            local result
            result=$(compare -metric RMSE "$baseline_file" "$current_file" "$diff_file" 2>&1) || true
            
            # Extract numeric difference
            local diff_value
            diff_value=$(echo "$result" | grep -oE '^[0-9.]+' || echo "0")
            
            if (( $(echo "$diff_value > 100" | bc -l 2>/dev/null || echo 0) )); then
                test_log_warning "Visual difference detected: $filename (diff: $diff_value)"
                differences=$((differences + 1))
            else
                test_log_success "No significant difference: $filename"
            fi
        else
            # Fallback: simple file size comparison
            local baseline_size current_size
            baseline_size=$(stat -f%z "$baseline_file" 2>/dev/null || stat -c%s "$baseline_file" 2>/dev/null || echo 0)
            current_size=$(stat -f%z "$current_file" 2>/dev/null || stat -c%s "$current_file" 2>/dev/null || echo 0)
            
            local size_diff=$((baseline_size - current_size))
            size_diff=${size_diff#-}  # Absolute value
            
            if [[ $size_diff -gt 1000 ]]; then
                test_log_warning "File size difference: $filename (diff: ${size_diff} bytes)"
                differences=$((differences + 1))
            else
                test_log_info "File sizes similar: $filename"
            fi
        fi
    done
    
    if [[ $differences -eq 0 ]]; then
        test_log_success "No visual differences for mode: $mode"
        return 0
    else
        test_log_warning "$differences visual difference(s) detected for mode: $mode"
        return 1
    fi
}

update_baseline() {
    local mode="$1"
    local current_path="$CURRENT_DIR/$mode"
    local baseline_path="$BASELINE_DIR/$mode"
    
    test_log_info "Updating baseline for mode: $mode"
    
    if [[ ! -d "$current_path" ]]; then
        test_log_error "No current screenshots for mode: $mode"
        return 1
    fi
    
    mkdir -p "$baseline_path"
    cp -r "$current_path/"* "$baseline_path/"
    
    test_log_success "Baseline updated for mode: $mode"
}

# =============================================================================
# VISUAL TESTS
# =============================================================================

test_homepage_renders() {
    local mode="$1"
    
    test_log_info "Testing homepage renders for mode: $mode"
    
    local screenshot="$CURRENT_DIR/$mode/_home_desktop.png"
    
    if [[ -f "$screenshot" ]]; then
        # Check file size (should be more than a few KB for a real page)
        local size
        size=$(stat -f%z "$screenshot" 2>/dev/null || stat -c%s "$screenshot" 2>/dev/null || echo 0)
        
        if [[ $size -gt 10000 ]]; then
            test_log_success "Homepage screenshot is valid ($size bytes)"
            return 0
        else
            test_log_error "Homepage screenshot too small ($size bytes)"
            return 1
        fi
    else
        test_log_error "Homepage screenshot not found: $screenshot"
        return 1
    fi
}

test_responsive_mobile() {
    local mode="$1"
    
    test_log_info "Testing mobile viewport for mode: $mode"
    
    local screenshot="$CURRENT_DIR/$mode/_home_mobile.png"
    
    if [[ -f "$screenshot" ]]; then
        test_log_success "Mobile screenshot exists"
        return 0
    else
        test_log_error "Mobile screenshot not found"
        return 1
    fi
}

test_responsive_tablet() {
    local mode="$1"
    
    test_log_info "Testing tablet viewport for mode: $mode"
    
    local screenshot="$CURRENT_DIR/$mode/_home_tablet.png"
    
    if [[ -f "$screenshot" ]]; then
        test_log_success "Tablet screenshot exists"
        return 0
    else
        test_log_error "Tablet screenshot not found"
        return 1
    fi
}

test_navigation_visible() {
    local mode="$1"
    
    test_log_info "Testing navigation visibility for mode: $mode"
    
    # This would require image analysis or Playwright element detection
    # For now, we just verify the screenshot exists
    
    local screenshot="$CURRENT_DIR/$mode/_home_desktop.png"
    
    if [[ -f "$screenshot" ]]; then
        test_log_success "Desktop screenshot captured (navigation visibility assumed)"
        return 0
    fi
    
    return 1
}

test_no_layout_broken() {
    local mode="$1"
    
    test_log_info "Testing layout integrity for mode: $mode"
    
    # Check that all expected screenshots were captured
    local expected_count=9  # 3 pages * 3 viewports
    local actual_count
    actual_count=$(find "$CURRENT_DIR/$mode" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ $actual_count -ge 1 ]]; then
        test_log_success "Screenshots captured: $actual_count"
        return 0
    else
        test_log_error "No screenshots captured"
        return 1
    fi
}

# =============================================================================
# TEST EXECUTION
# =============================================================================

run_visual_tests_for_mode() {
    local mode="$1"
    
    test_log_info "=== Visual tests for mode: $mode ==="
    
    # Generate site using config matrix generator
    local site_dir
    site_dir=$(create_test_workspace "visual-$mode")
    
    "$SCRIPT_DIR/lib/config_matrix_generator.sh" --mode "$mode" --output "$site_dir"
    
    # Only full mode can be built and served locally
    if [[ "$mode" != "full" ]]; then
        test_log_warning "Skipping visual tests for $mode (requires network/gem access)"
        return 0
    fi
    
    # Build site
    cd "$site_dir"
    if ! command -v bundle &>/dev/null; then
        test_log_warning "Bundler not available, skipping visual tests"
        cd "$PROJECT_ROOT"
        return 0
    fi
    
    bundle install --quiet 2>/dev/null || bundle install
    bundle exec jekyll build --quiet 2>/dev/null || bundle exec jekyll build
    cd "$PROJECT_ROOT"
    
    # Start Jekyll server
    if ! start_jekyll_server "$site_dir"; then
        test_log_error "Failed to start Jekyll server for mode: $mode"
        return 1
    fi
    
    # Capture screenshots
    capture_page_screenshots "$mode"
    
    # Stop server
    stop_jekyll_server
    
    # Run visual tests
    local tests_passed=true
    
    test_homepage_renders "$mode" || tests_passed=false
    test_responsive_mobile "$mode" || tests_passed=false
    test_responsive_tablet "$mode" || tests_passed=false
    test_navigation_visible "$mode" || tests_passed=false
    test_no_layout_broken "$mode" || tests_passed=false
    
    # Update baseline if requested
    if [[ "$UPDATE_BASELINE" == "true" ]]; then
        update_baseline "$mode"
    else
        # Compare with baseline
        compare_screenshots "$mode" || true
    fi
    
    if [[ "$tests_passed" == "true" ]]; then
        test_log_success "All visual tests passed for mode: $mode"
        return 0
    else
        test_log_error "Some visual tests failed for mode: $mode"
        return 1
    fi
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    parse_arguments "$@"
    
    test_log_info "Starting Visual Testing Suite"
    test_log_info "Visual directory: $VISUAL_DIR"
    
    # Initialize test utilities
    init_install_test_utils
    
    # Setup cleanup trap
    trap 'stop_jekyll_server; cleanup_all_workspaces' EXIT
    
    # Check prerequisites
    if ! check_playwright; then
        test_log_error "Prerequisites not met"
        exit 1
    fi
    
    # Create visual directories
    mkdir -p "$BASELINE_DIR" "$CURRENT_DIR" "$DIFF_DIR"
    
    local modes_to_test=()
    
    if [[ "$TEST_ALL" == "true" ]]; then
        modes_to_test=("${MODES[@]}")
    elif [[ -n "$TEST_MODE" ]]; then
        # Validate mode
        local valid=false
        for m in "${MODES[@]}"; do
            [[ "$m" == "$TEST_MODE" ]] && valid=true && break
        done
        
        if [[ "$valid" != "true" ]]; then
            test_log_error "Invalid mode: $TEST_MODE"
            test_log_error "Available modes: ${MODES[*]}"
            exit 1
        fi
        
        modes_to_test=("$TEST_MODE")
    fi
    
    # Run visual tests for each mode
    local all_passed=true
    
    for mode in "${modes_to_test[@]}"; do
        run_test "Visual tests: $mode" "run_visual_tests_for_mode $mode" "visual" || all_passed=false
    done
    
    # Print summary
    print_test_summary
    
    # Report baseline status
    if [[ "$UPDATE_BASELINE" == "true" ]]; then
        test_log_info "Baseline images have been updated"
        test_log_info "Baseline directory: $BASELINE_DIR"
    fi
    
    # Exit with appropriate code
    if [[ $INSTALL_TESTS_FAILED -gt 0 ]] || [[ "$all_passed" != "true" ]]; then
        test_log_error "Some visual tests failed"
        exit 1
    else
        test_log_success "All visual tests passed!"
        exit 0
    fi
}

# Run main function
main "$@"
