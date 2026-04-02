#!/bin/bash

# Configuration utilities library for zer0-mistakes theme
# Provides config parsing, version detection, backup, and migration functions
#
# Source this file in other scripts: source "$(dirname "$0")/lib/config-utils.sh"

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Config file names
readonly THEME_CONFIG="_config.theme.yml"
readonly USER_CONFIG="_config.yml"
readonly DEV_CONFIG="_config_dev.yml"
readonly CUSTOM_CONFIG="_config.custom.yml"

# GitHub raw URL for fetching latest theme config
readonly THEME_GITHUB_RAW="https://raw.githubusercontent.com/bamr87/zer0-mistakes"

# =========================================================================
# YAML Helpers (pure bash — no ruby/python dependency)
# =========================================================================

# Read a top-level scalar value from a YAML file
# Usage: yaml_read_key "_config.theme.yml" "theme_config_version"
yaml_read_key() {
    local file="$1"
    local key="$2"

    if [[ ! -f "$file" ]]; then
        debug "File not found: $file"
        return 1
    fi

    # Match "key: value" or "key : value" at top level (no leading whitespace)
    local value
    value=$(grep -m1 "^${key}[[:space:]]*:" "$file" | sed "s/^${key}[[:space:]]*:[[:space:]]*//" | sed 's/[[:space:]]*#.*//' | sed 's/^["'"'"']\(.*\)["'"'"']$/\1/')

    if [[ -z "$value" ]]; then
        debug "Key '$key' not found in $file"
        return 1
    fi

    echo "$value"
}

# Check if a top-level key exists in a YAML file
yaml_key_exists() {
    local file="$1"
    local key="$2"

    grep -q "^${key}[[:space:]]*:" "$file" 2>/dev/null
}

# =========================================================================
# Theme Config Version
# =========================================================================

# Get the theme_config_version from a file (returns empty string if not found)
get_theme_config_version() {
    local file="${1:-$THEME_CONFIG}"
    yaml_read_key "$file" "theme_config_version" 2>/dev/null || echo ""
}

# =========================================================================
# Detection: Legacy vs Layered Config
# =========================================================================

# Detect whether the site uses the new layered config or legacy monolithic
# Returns: "layered", "legacy", or "missing"
detect_config_layout() {
    if [[ -f "$THEME_CONFIG" ]] && [[ -f "$USER_CONFIG" ]]; then
        echo "layered"
    elif [[ -f "$USER_CONFIG" ]]; then
        # Check if the user config still contains theme-managed keys
        if yaml_key_exists "$USER_CONFIG" "plugins" && yaml_key_exists "$USER_CONFIG" "collections"; then
            echo "legacy"
        else
            echo "layered"  # Theme config might be provided by gem
        fi
    else
        echo "missing"
    fi
}

# =========================================================================
# Backup
# =========================================================================

# Create a timestamped backup of a file
# Usage: backup_file "_config.yml"
# Returns the backup path on stdout
backup_file() {
    local file="$1"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup="${file}.backup.${timestamp}"

    if [[ ! -f "$file" ]]; then
        debug "Nothing to back up: $file does not exist"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would back up: $file → $backup"
    else
        cp "$file" "$backup"
        debug "Backed up: $file → $backup"
    fi

    echo "$backup"
}

# =========================================================================
# Fetch Theme Config
# =========================================================================

# Fetch the latest _config.theme.yml from GitHub
# Usage: fetch_theme_config_github [branch_or_tag]
fetch_theme_config_github() {
    local ref="${1:-main}"
    local url="${THEME_GITHUB_RAW}/${ref}/_config.theme.yml"

    debug "Fetching theme config from: $url"

    local tmp
    tmp=$(mktemp)

    if curl -fsSL "$url" -o "$tmp" 2>/dev/null; then
        # Validate it's actually YAML with our version key
        if yaml_key_exists "$tmp" "theme_config_version"; then
            echo "$tmp"
            return 0
        else
            rm -f "$tmp"
            error "Downloaded file is not a valid theme config (missing theme_config_version)"
        fi
    else
        rm -f "$tmp"
        return 1
    fi
}

# Fetch the latest _config.theme.yml from the installed gem
fetch_theme_config_gem() {
    local gem_path
    gem_path=$(gem contents jekyll-theme-zer0 2>/dev/null | grep '_config.theme.yml' | head -1)

    if [[ -n "$gem_path" ]] && [[ -f "$gem_path" ]]; then
        debug "Found theme config in gem: $gem_path"
        echo "$gem_path"
        return 0
    fi

    debug "Theme config not found in installed gem"
    return 1
}

# Fetch theme config from templates directory (local dev)
fetch_theme_config_templates() {
    local script_dir="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
    local template_path="$script_dir/../../templates/config/_config.theme.yml.template"

    if [[ -f "$template_path" ]]; then
        debug "Found theme config template: $template_path"
        echo "$template_path"
        return 0
    fi

    debug "Theme config template not found"
    return 1
}

# =========================================================================
# Legacy Migration Helpers
# =========================================================================

# List of keys that belong in _config.theme.yml (theme-managed)
readonly THEME_MANAGED_KEYS=(
    "theme_config_version"
    "plugins"
    "markdown"
    "kramdown"
    "mermaid"
    "collections_dir"
    "collections"
    "permalink"
    "paginate"
    "paginate_path"
    "defaults"
    "exclude"
    "sass"
    "public_folder"
    "default_icon"
    "_posts_file_structure"
)

# Check if a legacy config contains theme-managed keys
# Returns the count of theme-managed keys found
count_theme_managed_keys() {
    local file="${1:-$USER_CONFIG}"
    local count=0

    for key in "${THEME_MANAGED_KEYS[@]}"; do
        if yaml_key_exists "$file" "$key"; then
            count=$((count + 1))
        fi
    done

    echo "$count"
}

# =========================================================================
# Docker-compose Config Chain
# =========================================================================

# Check if docker-compose.yml includes _config.theme.yml in its --config flag
docker_compose_has_theme_config() {
    if [[ ! -f "docker-compose.yml" ]]; then
        return 1
    fi

    grep -q "_config.theme.yml" "docker-compose.yml" 2>/dev/null
}

# =========================================================================
# Validation
# =========================================================================

# Validate YAML syntax of a file (uses ruby if available, falls back to basic check)
validate_yaml() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        warn "File not found for validation: $file"
        return 1
    fi

    if command_exists ruby; then
        if ruby -ryaml -e "YAML.load_file('$file')" 2>/dev/null; then
            debug "✓ YAML valid: $file"
            return 0
        else
            warn "YAML syntax error in: $file"
            return 1
        fi
    else
        # Basic check: file is non-empty and doesn't have obvious YAML errors
        if [[ -s "$file" ]]; then
            debug "✓ Basic validation passed: $file (ruby not available for full check)"
            return 0
        else
            warn "File is empty: $file"
            return 1
        fi
    fi
}

# Validate the full config chain builds successfully
validate_config_chain() {
    local configs=()

    [[ -f "$THEME_CONFIG" ]] && configs+=("$THEME_CONFIG")
    [[ -f "$USER_CONFIG" ]] && configs+=("$USER_CONFIG")

    if [[ ${#configs[@]} -eq 0 ]]; then
        error "No configuration files found"
    fi

    local config_str
    config_str=$(IFS=,; echo "${configs[*]}")

    info "Validating config chain: $config_str"

    for cfg in "${configs[@]}"; do
        validate_yaml "$cfg" || return 1
    done

    success "Config chain validation passed"
    return 0
}

# =========================================================================
# Override Detection
# =========================================================================

# Scan for local layout/include files that shadow theme files
# Prints warnings for any detected overrides
detect_theme_overrides() {
    local override_count=0

    if [[ -d "_layouts" ]]; then
        for file in _layouts/*.html; do
            [[ -f "$file" ]] || continue
            warn "Layout override detected: $file (shadows theme layout)"
            override_count=$((override_count + 1))
        done
    fi

    if [[ -d "_includes" ]]; then
        for file in _includes/**/*.html _includes/*.html; do
            [[ -f "$file" ]] || continue
            warn "Include override detected: $file (shadows theme include)"
            override_count=$((override_count + 1))
        done
    fi

    if [[ $override_count -gt 0 ]]; then
        info "$override_count local override(s) detected. These may need updating if the theme changed these files."
    else
        success "No local layout/include overrides detected"
    fi

    return 0
}
