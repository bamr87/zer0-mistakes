#!/bin/bash

# =========================================================================
# Migration Library for Zer0-Mistakes Theme
# =========================================================================
# Provides functions for migrating / installing optional theme features
# (admin pages, settings UI, etc.) into consumer Jekyll sites.
#
# Source this file in other scripts:
#   source "$(dirname "$0")/lib/migrate.sh"
#
# Dependencies:
#   - common.sh  (logging, dry_run_exec, confirm)
#   - template.sh (render_template, load_config)
# =========================================================================

# Admin page template names (without .md.template suffix)
ADMIN_PAGES=(
    theme
    config
    navigation
    collections
    analytics
    environment
)

# Default admin pages output directory (relative to site root)
ADMIN_OUTPUT_DIR="pages/_about/settings"

# -------------------------------------------------------------------------
# Detection & Validation
# -------------------------------------------------------------------------

# Detect whether a directory looks like a Jekyll site
# Usage: detect_jekyll_site "/path/to/site"
# Returns 0 if it looks like a Jekyll site, 1 otherwise
detect_jekyll_site() {
    local site_dir="${1:-.}"

    if [[ ! -f "$site_dir/_config.yml" ]]; then
        debug "No _config.yml found in $site_dir"
        return 1
    fi

    # Extra confidence checks (any one is enough)
    if [[ -f "$site_dir/Gemfile" ]] || [[ -d "$site_dir/_layouts" ]] || [[ -d "$site_dir/_includes" ]] || [[ -d "$site_dir/pages" ]]; then
        debug "Detected Jekyll site at $site_dir"
        return 0
    fi

    debug "Directory has _config.yml but doesn't look like a Jekyll site: $site_dir"
    return 1
}

# Check whether the target site uses the zer0-mistakes theme
# Usage: validate_theme_connection "/path/to/site"
# Returns 0 if connected, 1 otherwise. Sets THEME_CONNECTION_TYPE.
validate_theme_connection() {
    local site_dir="${1:-.}"
    local config="$site_dir/_config.yml"
    THEME_CONNECTION_TYPE=""

    if [[ ! -f "$config" ]]; then
        return 1
    fi

    # Check remote_theme
    if grep -qE 'remote_theme:\s*"?bamr87/zer0-mistakes' "$config" 2>/dev/null; then
        THEME_CONNECTION_TYPE="remote"
        debug "Theme connection: remote_theme"
        return 0
    fi

    # Check gem theme
    if grep -qE 'theme:\s*"?jekyll-theme-zer0' "$config" 2>/dev/null; then
        THEME_CONNECTION_TYPE="gem"
        debug "Theme connection: gem theme"
        return 0
    fi

    # Check Gemfile for local path
    if [[ -f "$site_dir/Gemfile" ]]; then
        if grep -qE 'jekyll-theme-zer0.*path:' "$site_dir/Gemfile" 2>/dev/null; then
            THEME_CONNECTION_TYPE="local"
            debug "Theme connection: local path gem"
            return 0
        fi
        if grep -q 'jekyll-theme-zer0' "$site_dir/Gemfile" 2>/dev/null; then
            THEME_CONNECTION_TYPE="gem"
            debug "Theme connection: Gemfile gem"
            return 0
        fi
    fi

    debug "No zer0-mistakes theme connection found"
    return 1
}

# -------------------------------------------------------------------------
# Admin Page Installation
# -------------------------------------------------------------------------

# Install admin pages from templates into a target site
# Usage: install_admin_pages "/path/to/site" [--force]
# Requires TEMPLATES_DIR to be set and config loaded
install_admin_pages() {
    local site_dir="${1:-.}"
    local force="${2:-false}"
    local output_dir="$site_dir/$ADMIN_OUTPUT_DIR"
    local installed=0
    local skipped=0

    step "Installing admin pages to $output_dir"

    # Ensure templates directory is available
    local admin_templates_dir=""
    if [[ -n "${TEMPLATES_DIR:-}" ]] && [[ -d "$TEMPLATES_DIR/pages/admin" ]]; then
        admin_templates_dir="$TEMPLATES_DIR/pages/admin"
    else
        # Try to find it
        local found_dir
        if found_dir=$(find_templates_dir "${BASH_SOURCE[0]}" 2>/dev/null); then
            admin_templates_dir="$found_dir/pages/admin"
            TEMPLATES_DIR="$found_dir"
        fi
    fi

    if [[ -z "$admin_templates_dir" ]] || [[ ! -d "$admin_templates_dir" ]]; then
        error "Admin templates directory not found. Ensure TEMPLATES_DIR is set or run from the theme repo."
        return 1
    fi

    # Ensure config is loaded for template rendering
    if [[ -z "${CURRENT_DATE:-}" ]]; then
        load_config 2>/dev/null || true
        export CURRENT_DATE="${CURRENT_DATE:-$(date +%Y-%m-%d)}"
    fi

    # Create output directory
    dry_run_exec "Create $output_dir" mkdir -p "$output_dir"

    local page template_file output_file
    for page in "${ADMIN_PAGES[@]}"; do
        template_file="$admin_templates_dir/${page}.md.template"
        output_file="$output_dir/${page}.md"

        if [[ ! -f "$template_file" ]]; then
            warn "Template not found: $template_file — skipping"
            ((skipped++))
            continue
        fi

        if [[ -f "$output_file" ]] && [[ "$force" != "true" ]]; then
            info "Already exists (use --force to overwrite): $output_file"
            ((skipped++))
            continue
        fi

        dry_run_exec "Render ${page}.md" render_template "$template_file" "$output_file"
        ((installed++))
        debug "Installed: $output_file"
    done

    if [[ "$installed" -gt 0 ]]; then
        success "Installed $installed admin page(s) ($skipped skipped)"
    else
        info "No new admin pages installed ($skipped skipped)"
    fi

    return 0
}

# -------------------------------------------------------------------------
# Verification
# -------------------------------------------------------------------------

# Verify that admin pages are installed and have required front matter
# Usage: verify_admin_pages "/path/to/site"
# Returns 0 if all pages are valid, 1 otherwise
verify_admin_pages() {
    local site_dir="${1:-.}"
    local output_dir="$site_dir/$ADMIN_OUTPUT_DIR"
    local errors=0
    local total=0

    step "Verifying admin pages in $output_dir"

    if [[ ! -d "$output_dir" ]]; then
        warn "Admin pages directory does not exist: $output_dir"
        return 1
    fi

    local page page_file
    for page in "${ADMIN_PAGES[@]}"; do
        page_file="$output_dir/${page}.md"
        ((total++))

        if [[ ! -f "$page_file" ]]; then
            warn "Missing: $page_file"
            ((errors++))
            continue
        fi

        # Check required front matter fields
        if ! grep -q 'layout: admin' "$page_file" 2>/dev/null; then
            warn "Missing 'layout: admin' in $page_file"
            ((errors++))
            continue
        fi

        if ! grep -q 'permalink:' "$page_file" 2>/dev/null; then
            warn "Missing 'permalink' in $page_file"
            ((errors++))
            continue
        fi

        debug "Verified: $page_file"
    done

    if [[ "$errors" -eq 0 ]]; then
        success "All $total admin pages verified"
        return 0
    else
        warn "$errors of $total admin page(s) have issues"
        return 1
    fi
}

# -------------------------------------------------------------------------
# Version Detection
# -------------------------------------------------------------------------

# Detect the installed theme version and warn if admin features may be missing
# Usage: detect_version_gap "/path/to/site"
detect_version_gap() {
    local site_dir="${1:-.}"
    local gemfile_lock="$site_dir/Gemfile.lock"
    local min_admin_version="0.22.10"

    if [[ ! -f "$gemfile_lock" ]]; then
        debug "No Gemfile.lock found — cannot check theme version"
        return 0
    fi

    local installed_version
    installed_version=$(grep -A1 'jekyll-theme-zer0' "$gemfile_lock" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)

    if [[ -z "$installed_version" ]]; then
        debug "Could not determine installed theme version"
        return 0
    fi

    info "Installed theme version: $installed_version"

    # Simple version comparison (works for same-major versions)
    if [[ "$(printf '%s\n' "$min_admin_version" "$installed_version" | sort -V | head -1)" != "$min_admin_version" ]]; then
        warn "Theme version $installed_version may not include admin layout/includes."
        warn "Admin pages require version >= $min_admin_version."
        warn "Consider updating: bundle update jekyll-theme-zer0"
        return 1
    fi

    debug "Theme version $installed_version >= $min_admin_version — admin features supported"
    return 0
}
