#!/bin/bash
# =============================================================================
# scripts/install/template.sh — Template rendering
# =============================================================================
# Single source of truth: EVERY generated file comes from a template.
# Never inline heredocs anywhere else.
#
# Provides:
#   tmpl_render  TEMPLATE_FILE [OUTPUT_FILE]
#       Substitutes {{VAR}} placeholders from the current environment.
#       If OUTPUT_FILE is omitted, writes to stdout.
#
#   tmpl_apply  TEMPLATE_REL_PATH OUTPUT_FILE
#       Resolution order:
#         1. $TEMPLATES_DIR/TEMPLATE_REL_PATH  (local checkout)
#         2. Remote fetch from $ZER0_RAW_URL/templates/TEMPLATE_REL_PATH
#            (when ZER0_REMOTE_INSTALL=1)
#       Respects _FS_DRY_RUN, _FS_FORCE via fs.sh.
#       Returns 1 if template not found anywhere.
#
# Variables substituted (extend by editing the sed chain below):
#   SITE_TITLE, SITE_DESCRIPTION, SITE_AUTHOR, SITE_EMAIL, SITE_URL
#   SITE_TIMEZONE, SITE_LOCALE
#   GITHUB_USER, GITHUB_REPO, GITHUB_URL, ZER0_RAW_URL
#   GITHUB_PAGES_BRANCH, REPOSITORY_NAME
#   THEME_NAME, THEME_GEM_NAME, THEME_DISPLAY_NAME, THEME_VERSION
#   THEME_SOURCE (gem|remote|vendored)
#   DEFAULT_PORT, DEFAULT_URL
#   JEKYLL_VERSION, FFI_VERSION, WEBRICK_VERSION
#   COMMONMARKER_VERSION, COMMONMARKER_MACOS_VERSION
#   GITHUB_PAGES_MAX_VERSION
#   RUBY_MIN_VERSION_MACOS
#   CURRENT_DATE, CURRENT_YEAR
#   INSTALL_PROFILE, INSTALL_MODE (legacy compat)
#   REMOTE_BRANCH
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TEMPLATE_LIB:-}" ]] && return 0
_HAS_TEMPLATE_LIB=1

# Substitute all {{VAR}} tokens from the environment.
# BSD sed and GNU sed compatible. Processes one line at a time via awk-delegation.
tmpl_render() {
    local template_file="$1"
    local output_file="${2:-}"

    if [[ ! -f "$template_file" ]]; then
        log_error "tmpl_render: template not found: $template_file"
        return 1
    fi

    local content
    content=$(cat "$template_file")

    # Apply all substitutions. BSD-sed compatible (no -i without extension).
    # Pipe chain: each sed -e is one substitution pass.
    content=$(printf '%s' "$content" | sed \
        -e "s|{{THEME_NAME}}|${THEME_NAME:-zer0-mistakes}|g" \
        -e "s|{{THEME_GEM_NAME}}|${THEME_GEM_NAME:-jekyll-theme-zer0}|g" \
        -e "s|{{THEME_DISPLAY_NAME}}|${THEME_DISPLAY_NAME:-Zer0-Mistakes}|g" \
        -e "s|{{THEME_VERSION}}|${THEME_VERSION:-}|g" \
        -e "s|{{THEME_SOURCE}}|${THEME_SOURCE:-gem}|g" \
        -e "s|{{GITHUB_USER}}|${GITHUB_USER:-}|g" \
        -e "s|{{FORK_GITHUB_USER}}|${GITHUB_USER:-}|g" \
        -e "s|{{GITHUB_REPO}}|${GITHUB_REPO:-}|g" \
        -e "s|{{GITHUB_FULL_REPO}}|${GITHUB_USER:-}/${GITHUB_REPO:-}|g" \
        -e "s|{{GITHUB_URL}}|${GITHUB_URL:-https://github.com/bamr87/zer0-mistakes}|g" \
        -e "s|{{ZER0_RAW_URL}}|${ZER0_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}|g" \
        -e "s|{{GITHUB_RAW_URL}}|${ZER0_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}|g" \
        -e "s|{{GITHUB_PAGES_BRANCH}}|${GITHUB_PAGES_BRANCH:-gh-pages}|g" \
        -e "s|{{REMOTE_BRANCH}}|${REMOTE_BRANCH:-${GITHUB_PAGES_BRANCH:-gh-pages}}|g" \
        -e "s|{{REPOSITORY_NAME}}|${REPOSITORY_NAME:-${GITHUB_REPO:-my-site}}|g" \
        -e "s|{{SITE_TITLE}}|${SITE_TITLE:-My Jekyll Site}|g" \
        -e "s|{{SITE_DESCRIPTION}}|${SITE_DESCRIPTION:-A Jekyll site built with zer0-mistakes}|g" \
        -e "s|{{SITE_AUTHOR}}|${SITE_AUTHOR:-Site Author}|g" \
        -e "s|{{SITE_EMAIL}}|${SITE_EMAIL:-}|g" \
        -e "s|{{SITE_URL}}|${SITE_URL:-}|g" \
        -e "s|{{SITE_TIMEZONE}}|${SITE_TIMEZONE:-UTC}|g" \
        -e "s|{{SITE_LOCALE}}|${SITE_LOCALE:-en}|g" \
        -e "s|{{DEFAULT_PORT}}|${DEFAULT_PORT:-4000}|g" \
        -e "s|{{DEFAULT_URL}}|${DEFAULT_URL:-http://localhost:4000}|g" \
        -e "s|{{JEKYLL_VERSION}}|${JEKYLL_VERSION:-~> 4.3}|g" \
        -e "s|{{FFI_VERSION}}|${FFI_VERSION:-~> 1.15}|g" \
        -e "s|{{WEBRICK_VERSION}}|${WEBRICK_VERSION:-~> 1.8}|g" \
        -e "s|{{COMMONMARKER_VERSION}}|${COMMONMARKER_VERSION:-~> 0.23}|g" \
        -e "s|{{COMMONMARKER_MACOS_VERSION}}|${COMMONMARKER_MACOS_VERSION:-~> 0.23}|g" \
        -e "s|{{GITHUB_PAGES_MAX_VERSION}}|${GITHUB_PAGES_MAX_VERSION:-232}|g" \
        -e "s|{{RUBY_MIN_VERSION_MACOS}}|${RUBY_MIN_VERSION_MACOS:-2.6.0}|g" \
        -e "s|{{INSTALL_PROFILE}}|${INSTALL_PROFILE:-default}|g" \
        -e "s|{{INSTALL_MODE}}|${INSTALL_MODE:-full}|g" \
        -e "s|{{CURRENT_DATE}}|$(date +%Y-%m-%d)|g" \
        -e "s|{{CURRENT_YEAR}}|$(date +%Y)|g" \
    )

    if [[ -n "$output_file" ]]; then
        # Delegate to fs.sh for safe write (backup, dry-run, force awareness)
        if [[ "$(type -t fs_write_file)" == "function" ]]; then
            fs_write_file "$output_file" "$content"
        else
            mkdir -p "$(dirname "$output_file")"
            printf '%s\n' "$content" > "$output_file"
        fi
    else
        printf '%s\n' "$content"
    fi
}

# Apply a template by relative path → output file.
# Resolution: local TEMPLATES_DIR → remote fetch.
tmpl_apply() {
    local tmpl_rel="$1"
    local output_file="$2"

    # 1. Local templates dir
    if [[ -n "${TEMPLATES_DIR:-}" && -f "${TEMPLATES_DIR}/${tmpl_rel}" ]]; then
        tmpl_render "${TEMPLATES_DIR}/${tmpl_rel}" "$output_file"
        return $?
    fi

    # 2. Remote fetch (only in remote install mode)
    if [[ "${ZER0_REMOTE_INSTALL:-0}" == "1" ]]; then
        local raw_url="${ZER0_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}"
        local fetch_url="${raw_url}/templates/${tmpl_rel}"
        local tmp_file
        tmp_file=$(mktemp /tmp/zer0-tmpl-XXXXXX)
        if curl -fsSL --max-time 15 "$fetch_url" -o "$tmp_file" 2>/dev/null; then
            tmpl_render "$tmp_file" "$output_file"
            local ret=$?
            rm -f "$tmp_file"
            return $ret
        fi
        rm -f "$tmp_file"
    fi

    log_error "tmpl_apply: template not found: $tmpl_rel"
    return 1
}
