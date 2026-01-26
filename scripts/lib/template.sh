#!/bin/bash

# =========================================================================
# Template Loading and Processing Library
# =========================================================================
# Provides functions for loading configuration and rendering templates
# with {{VAR_NAME}} placeholder substitution.
#
# Source this file in other scripts:
#   source "$(dirname "$0")/lib/template.sh"
#
# Dependencies:
#   - common.sh (for logging functions, optional)
#
# Note: Compatible with bash 3.2+ (macOS default)
#       Uses simple exported variables instead of associative arrays
# =========================================================================

# -------------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------------

# Default paths (can be overridden before sourcing)
TEMPLATES_DIR="${TEMPLATES_DIR:-}"
CONFIG_FILE="${CONFIG_FILE:-}"

# List of known template variables (for iteration during rendering)
# Add new variables here when extending the template system
TEMPLATE_VAR_NAMES=(
    THEME_NAME
    THEME_GEM_NAME
    THEME_DISPLAY_NAME
    GITHUB_USER
    GITHUB_REPO
    GITHUB_URL
    GITHUB_RAW_URL
    GITHUB_PAGES_URL
    DEFAULT_PORT
    DEFAULT_HOST
    DEFAULT_URL
    JEKYLL_VERSION
    FFI_VERSION
    WEBRICK_VERSION
    COMMONMARKER_VERSION
    CURRENT_DATE
    CURRENT_YEAR
    SITE_TITLE
    SITE_DESCRIPTION
    SITE_AUTHOR
    SITE_EMAIL
)

# -------------------------------------------------------------------------
# Logging Helpers (fallback if common.sh not sourced)
# -------------------------------------------------------------------------

# Define logging functions if not already defined
if ! type debug &>/dev/null 2>&1; then
    debug() { 
        if [[ "${DEBUG:-false}" == "true" ]]; then
            echo "[DEBUG] $1" >&2
        fi
    }
fi

if ! type error &>/dev/null 2>&1; then
    error() { echo -e "\033[0;31m[ERROR]\033[0m $1" >&2; }
fi

if ! type info &>/dev/null 2>&1; then
    info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
fi

if ! type warn &>/dev/null 2>&1; then
    warn() { echo -e "\033[0;33m[WARN]\033[0m $1" >&2; }
fi

# -------------------------------------------------------------------------
# Configuration Loading
# -------------------------------------------------------------------------

# Find the templates directory relative to a script location
# Usage: find_templates_dir "/path/to/script"
find_templates_dir() {
    local script_path="${1:-${BASH_SOURCE[0]}}"
    local script_dir
    script_dir="$(dirname "$script_path")"
    
    # Build search paths manually for bash 3.2 compatibility
    local search_dir
    
    # Try relative paths from script location
    for relative in "templates" "../templates" "../../templates"; do
        search_dir="$script_dir/$relative"
        if [[ -d "$search_dir" ]] && [[ -f "$search_dir/config/install.conf" ]]; then
            (cd "$search_dir" && pwd)
            return 0
        fi
    done
    
    # Try git root if available
    local git_root=""
    git_root=$(git rev-parse --show-toplevel 2>/dev/null) || true
    if [[ -n "$git_root" ]] && [[ -d "$git_root/templates" ]] && [[ -f "$git_root/templates/config/install.conf" ]]; then
        echo "$git_root/templates"
        return 0
    fi
    
    return 1
}

# Set default configuration values (used when config file not found)
_set_default_config() {
    export THEME_NAME="${THEME_NAME:-zer0-mistakes}"
    export THEME_GEM_NAME="${THEME_GEM_NAME:-jekyll-theme-zer0}"
    export THEME_DISPLAY_NAME="${THEME_DISPLAY_NAME:-Zer0-Mistakes Jekyll Theme}"
    export GITHUB_USER="${GITHUB_USER:-bamr87}"
    export GITHUB_REPO="${GITHUB_REPO:-bamr87/zer0-mistakes}"
    export GITHUB_URL="${GITHUB_URL:-https://github.com/bamr87/zer0-mistakes}"
    export GITHUB_RAW_URL="${GITHUB_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}"
    export GITHUB_PAGES_URL="${GITHUB_PAGES_URL:-https://bamr87.github.io/zer0-mistakes}"
    export DEFAULT_PORT="${DEFAULT_PORT:-4000}"
    export DEFAULT_HOST="${DEFAULT_HOST:-localhost}"
    export DEFAULT_URL="${DEFAULT_URL:-http://localhost:4000}"
    export JEKYLL_VERSION="${JEKYLL_VERSION:-~> 4.3}"
    export FFI_VERSION="${FFI_VERSION:-~> 1.17.0}"
    export WEBRICK_VERSION="${WEBRICK_VERSION:-~> 1.7}"
    export COMMONMARKER_VERSION="${COMMONMARKER_VERSION:-0.23.10}"
    export CURRENT_DATE="${CURRENT_DATE:-$(date +%Y-%m-%d)}"
    export CURRENT_YEAR="${CURRENT_YEAR:-$(date +%Y)}"
}

# Load configuration from install.conf
# Usage: load_config [config_file]
load_config() {
    local config_file="${1:-}"
    
    # Find config file if not specified
    if [[ -z "$config_file" ]]; then
        if [[ -n "$TEMPLATES_DIR" ]] && [[ -f "$TEMPLATES_DIR/config/install.conf" ]]; then
            config_file="$TEMPLATES_DIR/config/install.conf"
        else
            local templates_dir
            if templates_dir=$(find_templates_dir 2>/dev/null); then
                config_file="$templates_dir/config/install.conf"
                TEMPLATES_DIR="$templates_dir"
            fi
        fi
    fi
    
    if [[ -z "$config_file" ]] || [[ ! -f "$config_file" ]]; then
        debug "Configuration file not found, using defaults"
        _set_default_config
        return 1
    fi
    
    debug "Loading configuration from: $config_file"
    
    # Source the config file (it exports variables)
    # shellcheck source=/dev/null
    source "$config_file"
    
    # Set dynamic values
    export CURRENT_DATE="${CURRENT_DATE:-$(date +%Y-%m-%d)}"
    export CURRENT_YEAR="${CURRENT_YEAR:-$(date +%Y)}"
    
    CONFIG_FILE="$config_file"
    debug "Configuration loaded successfully"
    return 0
}

# Set a template variable
# Usage: set_template_var "VAR_NAME" "value"
set_template_var() {
    local name="$1"
    local value="$2"
    export "$name"="$value"
    debug "Set template variable: $name"
}

# Get a template variable value
# Usage: get_template_var "VAR_NAME" ["default"]
get_template_var() {
    local name="$1"
    local default="${2:-}"
    
    # Use indirect expansion (bash 3.2 compatible)
    eval "echo \"\${$name:-$default}\""
}

# -------------------------------------------------------------------------
# Template Processing
# -------------------------------------------------------------------------

# Render a template file, replacing {{VAR_NAME}} placeholders
# Usage: render_template "template_file" ["output_file"]
# If output_file is omitted, outputs to stdout
render_template() {
    local template_file="$1"
    local output_file="${2:-}"
    
    if [[ ! -f "$template_file" ]]; then
        error "Template file not found: $template_file"
        return 1
    fi
    
    debug "Rendering template: $template_file"
    
    local content
    content=$(cat "$template_file")
    
    # Replace all {{VAR_NAME}} placeholders
    local var_name var_value
    for var_name in "${TEMPLATE_VAR_NAMES[@]}"; do
        # Get variable value using indirect expansion
        eval "var_value=\"\${$var_name:-}\""
        if [[ -n "$var_value" ]]; then
            # Escape special characters in replacement value
            var_value=$(printf '%s\n' "$var_value" | sed -e 's/[\/&]/\\&/g')
            content=$(echo "$content" | sed "s/{{${var_name}}}/${var_value}/g")
        fi
    done
    
    if [[ -n "$output_file" ]]; then
        # Create output directory if needed
        mkdir -p "$(dirname "$output_file")"
        echo "$content" > "$output_file"
        debug "Rendered template to: $output_file"
    else
        echo "$content"
    fi
}

# Render a template string (not from file)
# Usage: render_template_string "string with {{VAR_NAME}}"
render_template_string() {
    local template_string="$1"
    local content="$template_string"
    
    local var_name var_value
    for var_name in "${TEMPLATE_VAR_NAMES[@]}"; do
        eval "var_value=\"\${$var_name:-}\""
        if [[ -n "$var_value" ]]; then
            var_value=$(printf '%s\n' "$var_value" | sed -e 's/[\/&]/\\&/g')
            content=$(echo "$content" | sed "s/{{${var_name}}}/${var_value}/g")
        fi
    done
    
    echo "$content"
}

# -------------------------------------------------------------------------
# Template Fetching (for remote installs)
# -------------------------------------------------------------------------

# Fetch a template, trying local first then remote
# Usage: fetch_template "relative/path/to/template.template" ["output_file"]
fetch_template() {
    local template_path="$1"
    local output_file="${2:-}"
    
    local local_path=""
    local content=""
    
    # Try local templates directory first
    if [[ -n "$TEMPLATES_DIR" ]]; then
        local_path="$TEMPLATES_DIR/$template_path"
        if [[ -f "$local_path" ]]; then
            debug "Using local template: $local_path"
            if [[ -n "$output_file" ]]; then
                render_template "$local_path" "$output_file"
            else
                render_template "$local_path"
            fi
            return 0
        fi
    fi
    
    # Try fetching from GitHub
    local remote_url="${GITHUB_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}/templates/$template_path"
    debug "Fetching remote template: $remote_url"
    
    if command -v curl &>/dev/null; then
        content=$(curl -fsSL "$remote_url" 2>/dev/null) || true
    elif command -v wget &>/dev/null; then
        content=$(wget -qO- "$remote_url" 2>/dev/null) || true
    fi
    
    if [[ -n "$content" ]]; then
        # Render inline (without temp file for efficiency)
        local var_name var_value
        for var_name in "${TEMPLATE_VAR_NAMES[@]}"; do
            eval "var_value=\"\${$var_name:-}\""
            if [[ -n "$var_value" ]]; then
                var_value=$(printf '%s\n' "$var_value" | sed -e 's/[\/&]/\\&/g')
                content=$(echo "$content" | sed "s/{{${var_name}}}/${var_value}/g")
            fi
        done
        
        if [[ -n "$output_file" ]]; then
            mkdir -p "$(dirname "$output_file")"
            echo "$content" > "$output_file"
            debug "Rendered remote template to: $output_file"
        else
            echo "$content"
        fi
        return 0
    fi
    
    debug "Template not found locally or remotely: $template_path"
    return 1
}

# -------------------------------------------------------------------------
# Validation
# -------------------------------------------------------------------------

# Check if all required template variables are set
# Usage: validate_required_vars "VAR1" "VAR2" ...
validate_required_vars() {
    local missing=()
    local var_name var_value
    
    for var_name in "$@"; do
        eval "var_value=\"\${$var_name:-}\""
        if [[ -z "$var_value" ]]; then
            missing+=("$var_name")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        error "Missing required template variables: ${missing[*]}"
        return 1
    fi
    
    return 0
}

# Check if templates directory is available
# Usage: templates_available
templates_available() {
    [[ -n "$TEMPLATES_DIR" ]] && [[ -d "$TEMPLATES_DIR" ]]
}

# -------------------------------------------------------------------------
# Helper Functions for Install Scripts
# -------------------------------------------------------------------------

# Create a file from template with automatic fallback
# Usage: create_from_template "template_path" "output_file" "fallback_content"
create_from_template() {
    local template_path="$1"
    local output_file="$2"
    local fallback_content="${3:-}"
    
    # Skip if output already exists
    if [[ -f "$output_file" ]]; then
        debug "File already exists, skipping: $output_file"
        return 0
    fi
    
    # Try to use template
    if fetch_template "$template_path" "$output_file" 2>/dev/null; then
        info "Created from template: $output_file"
        return 0
    fi
    
    # Use fallback content if provided
    if [[ -n "$fallback_content" ]]; then
        mkdir -p "$(dirname "$output_file")"
        echo "$fallback_content" > "$output_file"
        info "Created from fallback: $output_file"
        return 0
    fi
    
    warn "Could not create file: $output_file (no template or fallback)"
    return 1
}

# -------------------------------------------------------------------------
# Initialization
# -------------------------------------------------------------------------

# Auto-load configuration if templates directory exists
_init_template_lib() {
    # Try to find templates directory
    if [[ -z "$TEMPLATES_DIR" ]]; then
        TEMPLATES_DIR=$(find_templates_dir 2>/dev/null) || true
    fi
    
    # Load config if available, otherwise set defaults
    if [[ -n "$TEMPLATES_DIR" ]]; then
        load_config 2>/dev/null || _set_default_config
    else
        _set_default_config
    fi
}

# Run initialization
_init_template_lib

# Export functions for use in subshells
export -f find_templates_dir load_config set_template_var get_template_var 2>/dev/null || true
export -f render_template render_template_string fetch_template 2>/dev/null || true
export -f validate_required_vars templates_available create_from_template 2>/dev/null || true
