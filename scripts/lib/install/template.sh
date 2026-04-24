#!/bin/bash
# =========================================================================
# scripts/lib/install/template.sh
# =========================================================================
# Template rendering for install.sh.
#
# Functions exported:
#   render_template TEMPLATE_FILE [OUTPUT_FILE]
#       Replace {{VAR_NAME}} placeholders. If OUTPUT_FILE omitted, writes
#       to stdout.
#
#   create_from_template TEMPLATE_REL OUTPUT_FILE [FALLBACK_CONTENT]
#       Resolution order:
#         1. Local templates ($TEMPLATES_DIR/$TEMPLATE_REL)
#         2. Remote fetch from $GITHUB_RAW_URL/templates/$TEMPLATE_REL
#            (only when REMOTE_INSTALL=true)
#         3. FALLBACK_CONTENT (literal string)
#       Existing OUTPUT_FILE is preserved (skipped with a warning).
#
#   templates_available
#       Returns 0 when $TEMPLATES_DIR is set and points to an existing dir.
#
# Required globals (provided by install.sh / install.conf):
#   THEME_NAME, THEME_GEM_NAME, THEME_DISPLAY_NAME,
#   GITHUB_USER, GITHUB_REPO, GITHUB_URL, GITHUB_RAW_URL,
#   DEFAULT_PORT, DEFAULT_URL,
#   JEKYLL_VERSION, FFI_VERSION, WEBRICK_VERSION, COMMONMARKER_VERSION,
#   GITHUB_PAGES_MAX_VERSION, COMMONMARKER_MACOS_VERSION,
#   RUBY_MIN_VERSION_MACOS, INSTALL_MODE, REMOTE_INSTALL, TEMPLATES_DIR
#
# Optional globals (used when set):
#   FORK_GITHUB_USER, FORK_SITE_NAME, FORK_AUTHOR, FORK_EMAIL,
#   SITE_TITLE, SITE_DESCRIPTION, SITE_AUTHOR, SITE_EMAIL,
#   REPOSITORY_NAME
# =========================================================================

# Render a template file, replacing {{VAR_NAME}} placeholders.
render_template() {
    local template_file="$1"
    local output_file="${2:-}"

    if [[ ! -f "$template_file" ]]; then
        return 1
    fi

    local content
    content=$(cat "$template_file")

    # Replace all known placeholders. Order matches the original install.sh
    # implementation to guarantee identical output.
    content=$(echo "$content" | sed \
        -e "s|{{THEME_NAME}}|${THEME_NAME}|g" \
        -e "s|{{THEME_GEM_NAME}}|${THEME_GEM_NAME}|g" \
        -e "s|{{THEME_DISPLAY_NAME}}|${THEME_DISPLAY_NAME}|g" \
        -e "s|{{GITHUB_USER}}|${FORK_GITHUB_USER:-$GITHUB_USER}|g" \
        -e "s|{{GITHUB_REPO}}|${GITHUB_REPO}|g" \
        -e "s|{{GITHUB_URL}}|${GITHUB_URL}|g" \
        -e "s|{{GITHUB_RAW_URL}}|${GITHUB_RAW_URL}|g" \
        -e "s|{{DEFAULT_PORT}}|${DEFAULT_PORT}|g" \
        -e "s|{{DEFAULT_URL}}|${DEFAULT_URL}|g" \
        -e "s|{{JEKYLL_VERSION}}|${JEKYLL_VERSION}|g" \
        -e "s|{{FFI_VERSION}}|${FFI_VERSION}|g" \
        -e "s|{{WEBRICK_VERSION}}|${WEBRICK_VERSION}|g" \
        -e "s|{{COMMONMARKER_VERSION}}|${COMMONMARKER_VERSION}|g" \
        -e "s|{{GITHUB_PAGES_MAX_VERSION}}|${GITHUB_PAGES_MAX_VERSION:-232}|g" \
        -e "s|{{COMMONMARKER_MACOS_VERSION}}|${COMMONMARKER_MACOS_VERSION:-~> 0.23}|g" \
        -e "s|{{RUBY_MIN_VERSION_MACOS}}|${RUBY_MIN_VERSION_MACOS:-2.6.0}|g" \
        -e "s|{{SITE_TITLE}}|${FORK_SITE_NAME:-${SITE_TITLE:-My Jekyll Site}}|g" \
        -e "s|{{SITE_DESCRIPTION}}|${SITE_DESCRIPTION:-A Jekyll site built with ${THEME_NAME}}|g" \
        -e "s|{{SITE_AUTHOR}}|${FORK_AUTHOR:-${SITE_AUTHOR:-Site Author}}|g" \
        -e "s|{{SITE_EMAIL}}|${FORK_EMAIL:-${SITE_EMAIL:-your@email.com}}|g" \
        -e "s|{{CURRENT_DATE}}|$(date +%Y-%m-%d)|g" \
        -e "s|{{CURRENT_YEAR}}|$(date +%Y)|g" \
        -e "s|{{REPOSITORY_NAME}}|${REPOSITORY_NAME:-$THEME_NAME}|g" \
        -e "s|{{RAW_GITHUB_URL}}|${GITHUB_RAW_URL}|g" \
        -e "s|{{FORK_GITHUB_USER}}|${FORK_GITHUB_USER:-${GITHUB_USER}}|g" \
        -e "s|{{INSTALL_MODE}}|${INSTALL_MODE:-full}|g" \
        -e "s|{{GITHUB_PAGES_URL}}|https://${FORK_GITHUB_USER:-${GITHUB_USER}}.github.io/${REPOSITORY_NAME:-$THEME_NAME}|g")

    if [[ -n "$output_file" ]]; then
        mkdir -p "$(dirname "$output_file")"
        echo "$content" > "$output_file"
    else
        echo "$content"
    fi
}

# Create a file from template with automatic fallback to embedded content.
create_from_template() {
    local template_path="$1"
    local output_file="$2"
    local fallback_content="${3:-}"

    # Skip if output already exists
    if [[ -f "$output_file" ]]; then
        log_warning "$(basename "$output_file") already exists, skipping to preserve content"
        return 0
    fi

    # Try local template first
    if [[ -n "${TEMPLATES_DIR:-}" ]] && [[ -f "$TEMPLATES_DIR/$template_path" ]]; then
        render_template "$TEMPLATES_DIR/$template_path" "$output_file"
        log_info "Created $(basename "$output_file") from template"
        return 0
    fi

    # Try to fetch from GitHub for remote installs
    if [[ "${REMOTE_INSTALL:-false}" == "true" ]]; then
        local remote_url="${GITHUB_RAW_URL}/templates/$template_path"
        local remote_content
        if remote_content=$(curl -fsSL "$remote_url" 2>/dev/null); then
            local temp_file
            temp_file=$(mktemp)
            echo "$remote_content" > "$temp_file"
            render_template "$temp_file" "$output_file"
            rm -f "$temp_file"
            log_info "Created $(basename "$output_file") from remote template"
            return 0
        fi
    fi

    # Use fallback content if provided
    if [[ -n "$fallback_content" ]]; then
        mkdir -p "$(dirname "$output_file")"
        echo "$fallback_content" > "$output_file"
        log_info "Created $(basename "$output_file") from fallback"
        return 0
    fi

    log_warning "Could not create $(basename "$output_file") (no template or fallback)"
    return 1
}

# Check if templates are available (TEMPLATES_DIR set + directory exists).
templates_available() {
    [[ -n "${TEMPLATES_DIR:-}" ]] && [[ -d "$TEMPLATES_DIR" ]]
}
