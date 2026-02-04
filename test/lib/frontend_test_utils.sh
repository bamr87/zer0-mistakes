#!/bin/bash

# =============================================================================
# Frontend Test Utilities Library
# =============================================================================
#
# Reusable utilities for frontend UI/UX testing including Bootstrap 5
# component validation, design token assertions, and visual testing helpers.
#
# Usage:
#   source test/lib/frontend_test_utils.sh
#   init_frontend_test_utils
#   assert_css_property ".btn" "border-radius" "0.375rem"
#
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Bootstrap 5 breakpoints (pixels)
readonly BS_BREAKPOINT_XS=0
readonly BS_BREAKPOINT_SM=576
readonly BS_BREAKPOINT_MD=768
readonly BS_BREAKPOINT_LG=992
readonly BS_BREAKPOINT_XL=1200
readonly BS_BREAKPOINT_XXL=1400

# Bootstrap 5 container max-widths
readonly BS_CONTAINER_SM=540
readonly BS_CONTAINER_MD=720
readonly BS_CONTAINER_LG=960
readonly BS_CONTAINER_XL=1140
readonly BS_CONTAINER_XXL=1320

# Design token files
readonly VARIABLES_FILE="_sass/core/_variables.scss"
readonly SHADOWS_FILE="_sass/core/_shadows.scss"
readonly TRANSITIONS_FILE="_sass/core/_transitions.scss"
readonly SKINS_FILE="_sass/core/_skins.scss"

# Test counters
FRONTEND_TESTS_TOTAL=0
FRONTEND_TESTS_PASSED=0
FRONTEND_TESTS_FAILED=0

# =============================================================================
# INITIALIZATION
# =============================================================================

init_frontend_test_utils() {
    FRONTEND_TESTS_TOTAL=0
    FRONTEND_TESTS_PASSED=0
    FRONTEND_TESTS_FAILED=0
    
    # Source install test utils if available
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [[ -f "$script_dir/install_test_utils.sh" ]]; then
        source "$script_dir/install_test_utils.sh"
    fi
}

# =============================================================================
# LOGGING
# =============================================================================

frontend_log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

frontend_log_success() {
    echo -e "\033[0;32m[PASS]\033[0m $1"
}

frontend_log_error() {
    echo -e "\033[0;31m[FAIL]\033[0m $1"
}

frontend_log_warning() {
    echo -e "\033[0;33m[WARN]\033[0m $1"
}

# =============================================================================
# ASSERTION HELPERS
# =============================================================================

# Assert that a file contains a pattern
# Usage: assert_file_contains_pattern "file.scss" "pattern" "description"
assert_file_contains_pattern() {
    local file="$1"
    local pattern="$2"
    local description="${3:-Pattern found in $file}"
    
    FRONTEND_TESTS_TOTAL=$((FRONTEND_TESTS_TOTAL + 1))
    
    if grep -qE "$pattern" "$file" 2>/dev/null; then
        FRONTEND_TESTS_PASSED=$((FRONTEND_TESTS_PASSED + 1))
        frontend_log_success "$description"
        return 0
    else
        FRONTEND_TESTS_FAILED=$((FRONTEND_TESTS_FAILED + 1))
        frontend_log_error "$description"
        frontend_log_error "  Expected pattern: $pattern"
        frontend_log_error "  In file: $file"
        return 1
    fi
}

# Assert that a file does NOT contain a pattern
# Usage: assert_file_not_contains_pattern "file.scss" "#ffffff" "No hardcoded white"
assert_file_not_contains_pattern() {
    local file="$1"
    local pattern="$2"
    local description="${3:-Pattern not found in $file}"
    
    FRONTEND_TESTS_TOTAL=$((FRONTEND_TESTS_TOTAL + 1))
    
    if ! grep -qE "$pattern" "$file" 2>/dev/null; then
        FRONTEND_TESTS_PASSED=$((FRONTEND_TESTS_PASSED + 1))
        frontend_log_success "$description"
        return 0
    else
        FRONTEND_TESTS_FAILED=$((FRONTEND_TESTS_FAILED + 1))
        frontend_log_error "$description"
        frontend_log_error "  Unexpected pattern found: $pattern"
        frontend_log_error "  In file: $file"
        # Show matching lines
        grep -nE "$pattern" "$file" 2>/dev/null | head -5 | while read -r line; do
            frontend_log_error "    $line"
        done
        return 1
    fi
}

# Assert CSS variable is defined
# Usage: assert_css_var_defined "--bs-primary" "Primary color defined"
assert_css_var_defined() {
    local var_name="$1"
    local description="${2:-CSS variable $var_name defined}"
    local search_files="${3:-_sass/core/*.scss}"
    
    FRONTEND_TESTS_TOTAL=$((FRONTEND_TESTS_TOTAL + 1))
    
    if grep -rq "$var_name:" $search_files 2>/dev/null; then
        FRONTEND_TESTS_PASSED=$((FRONTEND_TESTS_PASSED + 1))
        frontend_log_success "$description"
        return 0
    else
        FRONTEND_TESTS_FAILED=$((FRONTEND_TESTS_FAILED + 1))
        frontend_log_error "$description"
        return 1
    fi
}

# Assert SCSS variable is defined
# Usage: assert_scss_var_defined "\$shadow-sm" "Shadow token defined"
assert_scss_var_defined() {
    local var_name="$1"
    local description="${2:-SCSS variable $var_name defined}"
    local file="${3:-$VARIABLES_FILE}"
    
    FRONTEND_TESTS_TOTAL=$((FRONTEND_TESTS_TOTAL + 1))
    
    # Escape $ for grep
    local escaped_var="${var_name//\$/\\$}"
    
    if grep -q "${escaped_var}:" "$file" 2>/dev/null; then
        FRONTEND_TESTS_PASSED=$((FRONTEND_TESTS_PASSED + 1))
        frontend_log_success "$description"
        return 0
    else
        FRONTEND_TESTS_FAILED=$((FRONTEND_TESTS_FAILED + 1))
        frontend_log_error "$description"
        return 1
    fi
}

# =============================================================================
# DESIGN TOKEN VALIDATION
# =============================================================================

# Check for hardcoded hex colors outside allowed files
# Usage: check_no_hardcoded_colors "file.scss"
check_no_hardcoded_colors() {
    local file="$1"
    local allowed_pattern="${2:-_variables\.scss|_skins\.scss}"
    
    # Skip allowed files
    if echo "$file" | grep -qE "$allowed_pattern"; then
        return 0
    fi
    
    # Pattern for hex colors (#fff, #ffffff, #FFFFFF)
    local hex_pattern='#[0-9a-fA-F]{3,8}'
    
    if grep -qE "$hex_pattern" "$file" 2>/dev/null; then
        frontend_log_warning "Hardcoded hex colors found in $file"
        grep -nE "$hex_pattern" "$file" 2>/dev/null | head -5 | while read -r line; do
            frontend_log_warning "  $line"
        done
        return 1
    fi
    
    return 0
}

# Validate shadow token usage
# Usage: check_shadow_tokens "file.scss"
check_shadow_tokens() {
    local file="$1"
    
    # Skip the shadows definition file
    if [[ "$file" == *"_shadows.scss" ]]; then
        return 0
    fi
    
    # Pattern for raw box-shadow values (not using variables)
    local raw_shadow_pattern='box-shadow:\s*[0-9]'
    
    if grep -qE "$raw_shadow_pattern" "$file" 2>/dev/null; then
        frontend_log_warning "Raw box-shadow values found in $file (use \$shadow-* tokens)"
        grep -nE "$raw_shadow_pattern" "$file" 2>/dev/null | head -5 | while read -r line; do
            frontend_log_warning "  $line"
        done
        return 1
    fi
    
    return 0
}

# Validate border-radius token usage
# Usage: check_border_radius_tokens "file.scss"
check_border_radius_tokens() {
    local file="$1"
    
    # Skip variable definition files
    if [[ "$file" == *"_variables.scss" ]]; then
        return 0
    fi
    
    # Pattern for raw pixel border-radius
    local raw_radius_pattern='border-radius:\s*[0-9]+px'
    
    if grep -qE "$raw_radius_pattern" "$file" 2>/dev/null; then
        frontend_log_warning "Raw border-radius values found in $file (use \$border-radius-* tokens)"
        grep -nE "$raw_radius_pattern" "$file" 2>/dev/null | head -5 | while read -r line; do
            frontend_log_warning "  $line"
        done
        return 1
    fi
    
    return 0
}

# =============================================================================
# SKIN VALIDATION
# =============================================================================

# Validate all skins have both light and dark modes
# Usage: validate_skin_modes
validate_skin_modes() {
    local skins=("air" "aqua" "contrast" "dark" "dirt" "neon" "mint" "plum" "sunrise")
    local modes=("light" "dark")
    local all_valid=true
    
    frontend_log_info "Validating skin/mode combinations..."
    
    for skin in "${skins[@]}"; do
        for mode in "${modes[@]}"; do
            local selector="\[data-bs-theme=\"$skin\"\]\[data-bs-mode=\"$mode\"\]"
            
            if grep -q "$selector" "$SKINS_FILE" 2>/dev/null; then
                frontend_log_success "Skin: $skin / $mode defined"
            else
                frontend_log_error "Skin: $skin / $mode NOT defined"
                all_valid=false
            fi
        done
    done
    
    [[ "$all_valid" == "true" ]]
}

# Validate skin has required CSS variables
# Usage: validate_skin_variables "mint" "dark"
validate_skin_variables() {
    local skin="$1"
    local mode="$2"
    local required_vars=(
        "--bs-primary"
        "--bs-body-bg"
        "--bs-body-color"
        "--bs-link-color"
        "--bs-border-color"
    )
    
    local selector="\[data-bs-theme=\"$skin\"\]\[data-bs-mode=\"$mode\"\]"
    local all_valid=true
    
    for var in "${required_vars[@]}"; do
        # Check if variable is defined within the skin selector block
        if grep -A 50 "$selector" "$SKINS_FILE" 2>/dev/null | grep -q "$var:"; then
            : # Variable found
        else
            frontend_log_error "Skin $skin/$mode missing $var"
            all_valid=false
        fi
    done
    
    [[ "$all_valid" == "true" ]]
}

# =============================================================================
# BREAKPOINT VALIDATION
# =============================================================================

# Validate media query uses standard Bootstrap breakpoints
# Usage: validate_breakpoint_value "768px"
validate_breakpoint_value() {
    local value="$1"
    local valid_breakpoints=("0" "576px" "768px" "992px" "1200px" "1400px" 
                             "575.98px" "767.98px" "991.98px" "1199.98px" "1399.98px")
    
    for bp in "${valid_breakpoints[@]}"; do
        [[ "$value" == "$bp" ]] && return 0
    done
    
    return 1
}

# Check for non-standard breakpoints in a file
# Usage: check_breakpoints "file.scss"
check_breakpoints() {
    local file="$1"
    local issues=0
    
    # Extract media query breakpoints
    grep -oE '@media[^{]+\(.*?(min|max)-width:\s*[0-9.]+px' "$file" 2>/dev/null | while read -r match; do
        local width
        width=$(echo "$match" | grep -oE '[0-9.]+px')
        
        if ! validate_breakpoint_value "$width"; then
            frontend_log_warning "Non-standard breakpoint in $file: $width"
            issues=$((issues + 1))
        fi
    done
    
    return $issues
}

# =============================================================================
# BOOTSTRAP COMPONENT CHECKS
# =============================================================================

# Validate Bootstrap grid classes usage
# Usage: assert_valid_grid_class "col-md-6"
assert_valid_grid_class() {
    local class="$1"
    
    # Valid column patterns
    local valid_patterns=(
        "^col$"
        "^col-[0-9]{1,2}$"
        "^col-(sm|md|lg|xl|xxl)$"
        "^col-(sm|md|lg|xl|xxl)-[0-9]{1,2}$"
        "^col-(sm|md|lg|xl|xxl)-auto$"
    )
    
    for pattern in "${valid_patterns[@]}"; do
        if echo "$class" | grep -qE "$pattern"; then
            return 0
        fi
    done
    
    return 1
}

# =============================================================================
# TEST EXECUTION HELPERS
# =============================================================================

# Run a frontend test with proper tracking
# Usage: run_frontend_test "Test name" "test_function arg1 arg2"
run_frontend_test() {
    local test_name="$1"
    local test_command="$2"
    
    frontend_log_info "Running: $test_name"
    
    if eval "$test_command"; then
        return 0
    else
        return 1
    fi
}

# Print frontend test summary
# Usage: print_frontend_test_summary
print_frontend_test_summary() {
    echo ""
    echo "=========================================="
    echo "Frontend Test Summary"
    echo "=========================================="
    echo "Total:  $FRONTEND_TESTS_TOTAL"
    echo "Passed: $FRONTEND_TESTS_PASSED"
    echo "Failed: $FRONTEND_TESTS_FAILED"
    echo "=========================================="
    
    if [[ $FRONTEND_TESTS_FAILED -gt 0 ]]; then
        return 1
    fi
    return 0
}

# =============================================================================
# WCAG CONTRAST HELPERS
# =============================================================================

# Calculate relative luminance (simplified)
# Usage: relative_luminance "#ffffff"
# Note: For accurate contrast testing, use axe-playwright in actual tests
calculate_luminance() {
    local hex="$1"
    hex="${hex#\#}"
    
    # Extract RGB values
    local r=$((16#${hex:0:2}))
    local g=$((16#${hex:2:2}))
    local b=$((16#${hex:4:2}))
    
    # Normalize and apply gamma correction (simplified)
    r=$(echo "scale=6; $r / 255" | bc)
    g=$(echo "scale=6; $g / 255" | bc)
    b=$(echo "scale=6; $b / 255" | bc)
    
    # Calculate luminance (simplified)
    echo "scale=6; 0.2126 * $r + 0.7152 * $g + 0.0722 * $b" | bc
}

# =============================================================================
# CLI INTERFACE
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    init_frontend_test_utils
    
    case "${1:-help}" in
        validate-skins)
            validate_skin_modes
            ;;
        check-tokens)
            for file in _sass/core/*.scss _sass/*.scss; do
                [[ -f "$file" ]] || continue
                check_no_hardcoded_colors "$file"
                check_shadow_tokens "$file"
                check_border_radius_tokens "$file"
            done
            print_frontend_test_summary
            ;;
        summary)
            print_frontend_test_summary
            ;;
        *)
            echo "Frontend Test Utilities"
            echo ""
            echo "Usage: $0 {validate-skins|check-tokens|summary}"
            echo ""
            echo "Commands:"
            echo "  validate-skins  Validate all 18 skin/mode combinations"
            echo "  check-tokens    Check design token usage in SCSS files"
            echo "  summary         Print test summary"
            ;;
    esac
fi
