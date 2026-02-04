#!/bin/bash

# =============================================================================
# Matrix Configuration Library for Frontend Testing
# =============================================================================
#
# Defines test matrices for skin/mode/breakpoint/post_type combinations.
# Supports full matrix (864 combinations), quick matrix (27), and smoke (6).
#
# Usage:
#   source test/lib/matrix_configs.sh
#   get_full_matrix    # Returns all 864 combinations
#   get_quick_matrix   # Returns 27 CI-optimized combinations
#   get_smoke_matrix   # Returns 6 pre-commit combinations
#
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION CONSTANTS
# =============================================================================

# All available skins (9 total)
readonly ALL_SKINS=(
    "air"
    "aqua"
    "contrast"
    "dark"
    "dirt"
    "neon"
    "mint"
    "plum"
    "sunrise"
)

# All available modes (2 total)
readonly ALL_MODES=(
    "light"
    "dark"
)

# All available breakpoints (6 total)
# Values are viewport widths in pixels
readonly ALL_BREAKPOINTS=(
    "320"   # Mobile small
    "576"   # Bootstrap sm
    "768"   # Bootstrap md
    "992"   # Bootstrap lg
    "1200"  # Bootstrap xl
    "1400"  # Bootstrap xxl
)

# Breakpoint names for reporting
declare -A BREAKPOINT_NAMES
BREAKPOINT_NAMES["320"]="mobile-sm"
BREAKPOINT_NAMES["576"]="sm"
BREAKPOINT_NAMES["768"]="md"
BREAKPOINT_NAMES["992"]="lg"
BREAKPOINT_NAMES["1200"]="xl"
BREAKPOINT_NAMES["1400"]="xxl"

# All available post types (8 total)
readonly ALL_POST_TYPES=(
    "standard"
    "featured"
    "breaking"
    "opinion"
    "review"
    "tutorial"
    "listicle"
    "interview"
)

# =============================================================================
# QUICK MATRIX CONFIGURATION (CI Default - ~1 minute)
# 3 skins × 2 modes × 3 breakpoints = 18 visual tests
# + 3 post_types for functional tests = 27 total
# =============================================================================

# Representative skins for quick testing
readonly QUICK_SKINS=(
    "dark"      # Default skin
    "contrast"  # Accessibility-critical
    "mint"      # Color variation
)

# Representative breakpoints for quick testing
readonly QUICK_BREAKPOINTS=(
    "375"   # Mobile (iPhone)
    "768"   # Tablet
    "1280"  # Desktop
)

# Representative post types for quick testing
readonly QUICK_POST_TYPES=(
    "standard"  # Default
    "featured"  # Full-width variant
    "review"    # Complex layout
)

# =============================================================================
# SMOKE MATRIX CONFIGURATION (Pre-commit - ~10 seconds)
# 1 skin × 2 modes × 3 breakpoints = 6 combinations
# =============================================================================

readonly SMOKE_SKINS=("dark")
readonly SMOKE_BREAKPOINTS=("375" "768" "1280")

# =============================================================================
# MATRIX GENERATION FUNCTIONS
# =============================================================================

# Generate full test matrix (864 combinations)
# Output: JSON array of test configurations
get_full_matrix() {
    local output="["
    local first=true
    
    for skin in "${ALL_SKINS[@]}"; do
        for mode in "${ALL_MODES[@]}"; do
            for breakpoint in "${ALL_BREAKPOINTS[@]}"; do
                for post_type in "${ALL_POST_TYPES[@]}"; do
                    if [[ "$first" == "true" ]]; then
                        first=false
                    else
                        output+=","
                    fi
                    output+="{\"skin\":\"$skin\",\"mode\":\"$mode\",\"breakpoint\":$breakpoint,\"post_type\":\"$post_type\"}"
                done
            done
        done
    done
    
    output+="]"
    echo "$output"
}

# Generate quick test matrix (27 combinations)
# Output: JSON array of test configurations
get_quick_matrix() {
    local output="["
    local first=true
    
    for skin in "${QUICK_SKINS[@]}"; do
        for mode in "${ALL_MODES[@]}"; do
            for breakpoint in "${QUICK_BREAKPOINTS[@]}"; do
                for post_type in "${QUICK_POST_TYPES[@]}"; do
                    if [[ "$first" == "true" ]]; then
                        first=false
                    else
                        output+=","
                    fi
                    output+="{\"skin\":\"$skin\",\"mode\":\"$mode\",\"breakpoint\":$breakpoint,\"post_type\":\"$post_type\"}"
                done
            done
        done
    done
    
    output+="]"
    echo "$output"
}

# Generate smoke test matrix (6 combinations)
# Output: JSON array of test configurations
get_smoke_matrix() {
    local output="["
    local first=true
    
    for skin in "${SMOKE_SKINS[@]}"; do
        for mode in "${ALL_MODES[@]}"; do
            for breakpoint in "${SMOKE_BREAKPOINTS[@]}"; do
                if [[ "$first" == "true" ]]; then
                    first=false
                else
                    output+=","
                fi
                output+="{\"skin\":\"$skin\",\"mode\":\"$mode\",\"breakpoint\":$breakpoint}"
            done
        done
    done
    
    output+="]"
    echo "$output"
}

# Generate skin-only matrix (18 combinations)
# Output: JSON array of skin/mode combinations
get_skins_matrix() {
    local output="["
    local first=true
    
    for skin in "${ALL_SKINS[@]}"; do
        for mode in "${ALL_MODES[@]}"; do
            if [[ "$first" == "true" ]]; then
                first=false
            else
                output+=","
            fi
            output+="{\"skin\":\"$skin\",\"mode\":\"$mode\"}"
        done
    done
    
    output+="]"
    echo "$output"
}

# Generate contrast audit matrix (18 skin/mode combinations)
# Output: JSON array for WCAG testing
get_contrast_matrix() {
    get_skins_matrix
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Get count of combinations in a matrix
# Usage: get_matrix_count "full" | "quick" | "smoke" | "skins"
get_matrix_count() {
    local matrix_type="${1:-full}"
    
    case "$matrix_type" in
        full)
            echo $(( ${#ALL_SKINS[@]} * ${#ALL_MODES[@]} * ${#ALL_BREAKPOINTS[@]} * ${#ALL_POST_TYPES[@]} ))
            ;;
        quick)
            echo $(( ${#QUICK_SKINS[@]} * ${#ALL_MODES[@]} * ${#QUICK_BREAKPOINTS[@]} * ${#QUICK_POST_TYPES[@]} ))
            ;;
        smoke)
            echo $(( ${#SMOKE_SKINS[@]} * ${#ALL_MODES[@]} * ${#SMOKE_BREAKPOINTS[@]} ))
            ;;
        skins)
            echo $(( ${#ALL_SKINS[@]} * ${#ALL_MODES[@]} ))
            ;;
        *)
            echo "0"
            ;;
    esac
}

# Get estimated runtime for matrix
# Usage: get_estimated_runtime "full" | "quick" | "smoke"
# Assumes ~2 seconds per visual test
get_estimated_runtime() {
    local matrix_type="${1:-full}"
    local count
    count=$(get_matrix_count "$matrix_type")
    local seconds=$((count * 2))
    
    if [[ $seconds -lt 60 ]]; then
        echo "${seconds}s"
    elif [[ $seconds -lt 3600 ]]; then
        echo "$((seconds / 60))m $((seconds % 60))s"
    else
        echo "$((seconds / 3600))h $((seconds % 3600 / 60))m"
    fi
}

# Get breakpoint name from width
# Usage: get_breakpoint_name 768
get_breakpoint_name() {
    local width="$1"
    echo "${BREAKPOINT_NAMES[$width]:-unknown}"
}

# Validate skin name
# Usage: is_valid_skin "mint" && echo "valid"
is_valid_skin() {
    local skin="$1"
    for s in "${ALL_SKINS[@]}"; do
        [[ "$s" == "$skin" ]] && return 0
    done
    return 1
}

# Validate mode name
# Usage: is_valid_mode "dark" && echo "valid"
is_valid_mode() {
    local mode="$1"
    for m in "${ALL_MODES[@]}"; do
        [[ "$m" == "$mode" ]] && return 0
    done
    return 1
}

# Print matrix summary
# Usage: print_matrix_summary
print_matrix_summary() {
    echo "=========================================="
    echo "Test Matrix Configuration Summary"
    echo "=========================================="
    echo ""
    echo "Available Skins (${#ALL_SKINS[@]}): ${ALL_SKINS[*]}"
    echo "Available Modes (${#ALL_MODES[@]}): ${ALL_MODES[*]}"
    echo "Available Breakpoints (${#ALL_BREAKPOINTS[@]}): ${ALL_BREAKPOINTS[*]}"
    echo "Available Post Types (${#ALL_POST_TYPES[@]}): ${ALL_POST_TYPES[*]}"
    echo ""
    echo "Matrix Sizes:"
    echo "  Full Matrix:  $(get_matrix_count full) combinations (~$(get_estimated_runtime full))"
    echo "  Quick Matrix: $(get_matrix_count quick) combinations (~$(get_estimated_runtime quick))"
    echo "  Smoke Matrix: $(get_matrix_count smoke) combinations (~$(get_estimated_runtime smoke))"
    echo "  Skins Only:   $(get_matrix_count skins) combinations"
    echo ""
}

# =============================================================================
# CLI INTERFACE (when run directly)
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-summary}" in
        full)
            get_full_matrix
            ;;
        quick)
            get_quick_matrix
            ;;
        smoke)
            get_smoke_matrix
            ;;
        skins)
            get_skins_matrix
            ;;
        contrast)
            get_contrast_matrix
            ;;
        count)
            get_matrix_count "${2:-full}"
            ;;
        runtime)
            get_estimated_runtime "${2:-full}"
            ;;
        summary)
            print_matrix_summary
            ;;
        *)
            echo "Usage: $0 {full|quick|smoke|skins|contrast|count|runtime|summary}"
            echo ""
            echo "Commands:"
            echo "  full      Output full matrix JSON (864 combinations)"
            echo "  quick     Output quick matrix JSON (27 combinations)"
            echo "  smoke     Output smoke matrix JSON (6 combinations)"
            echo "  skins     Output skins-only matrix JSON (18 combinations)"
            echo "  contrast  Output contrast audit matrix (18 combinations)"
            echo "  count     Get count for matrix type (default: full)"
            echo "  runtime   Get estimated runtime for matrix type"
            echo "  summary   Print configuration summary"
            exit 1
            ;;
    esac
fi
