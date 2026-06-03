#!/bin/bash
# =========================================================================
# scripts/lib/install/config.sh
# =========================================================================
# Configuration loader for install.sh.
#
# load_install_config <SCRIPT_DIR> [<SOURCE_DIR>]
#   Searches for templates/config/install.conf in either of the supplied
#   directories. On success: sources it, exports TEMPLATES_DIR, returns 0.
#   On failure: applies hard-coded fallback defaults and returns 1.
#
# This function is identical in behaviour to the previous private
# `_load_install_config` inside install.sh; the only change is location +
# accepting the search roots as parameters (so the function is testable
# without globals).
# =========================================================================

load_install_config() {
    local script_dir="${1:-${SCRIPT_DIR:-$(pwd)}}"
    local source_dir="${2:-${SOURCE_DIR:-$script_dir}}"

    local config_paths=(
        "$script_dir/templates/config/install.conf"
        "$source_dir/templates/config/install.conf"
    )

    local config_path
    for config_path in "${config_paths[@]}"; do
        if [[ -f "$config_path" ]]; then
            # shellcheck source=/dev/null
            source "$config_path"
            export TEMPLATES_DIR="$(dirname "$(dirname "$config_path")")"
            return 0
        fi
    done

    # Fallback defaults when templates not available (remote install
    # without bundled templates/, or stripped distribution).
    export THEME_NAME="${THEME_NAME:-zer0-mistakes}"
    export THEME_GEM_NAME="${THEME_GEM_NAME:-jekyll-theme-zer0}"
    export THEME_DISPLAY_NAME="${THEME_DISPLAY_NAME:-Zer0-Mistakes Jekyll Theme}"
    export GITHUB_USER="${GITHUB_USER:-bamr87}"
    export GITHUB_REPO="${GITHUB_REPO:-bamr87/zer0-mistakes}"
    export GITHUB_URL="${GITHUB_URL:-https://github.com/bamr87/zer0-mistakes}"
    export GITHUB_RAW_URL="${GITHUB_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}"
    export DEFAULT_PORT="${DEFAULT_PORT:-4000}"
    export DEFAULT_URL="${DEFAULT_URL:-http://localhost:4000}"
    export JEKYLL_VERSION="${JEKYLL_VERSION:-~> 4.3}"
    export FFI_VERSION="${FFI_VERSION:-~> 1.17.0}"
    export WEBRICK_VERSION="${WEBRICK_VERSION:-~> 1.7}"
    export COMMONMARKER_VERSION="${COMMONMARKER_VERSION:-0.23.10}"
    export GITHUB_PAGES_MAX_VERSION="${GITHUB_PAGES_MAX_VERSION:-232}"
    export COMMONMARKER_MACOS_VERSION="${COMMONMARKER_MACOS_VERSION:-~> 0.23}"
    export RUBY_MIN_VERSION_MACOS="${RUBY_MIN_VERSION_MACOS:-2.6.0}"
    return 1
}
