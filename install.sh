#!/bin/bash

# zer0-mistakes Jekyll Theme Installer
# IT-Journey Project - AI-Powered Development
# 
# This script installs the zer0-mistakes Jekyll theme by copying essential files
# and creating the necessary directory structure for a new Jekyll site.
# 
# Usage: ./install.sh [target_directory]
# 
# Principles Applied:
# - Design for Failure (DFF): Comprehensive error handling and validation
# - Keep It Simple (KIS): Clear, readable script with descriptive output
# - Don't Repeat Yourself (DRY): Reusable functions for common operations

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =========================================================================
# Bootstrap script directory + library loading
# =========================================================================
# install.sh delegates platform detection, template rendering, file copy,
# and configuration loading to focused modules under
# scripts/lib/install/. When templates aren't bundled (curl|bash remote
# install), the libraries fall back to embedded defaults.
# =========================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd 2>/dev/null || echo "$(pwd)")"
SOURCE_DIR="$SCRIPT_DIR"
TARGET_DIR=""
TEMP_DIR=""
TEMPLATES_DIR=""

# Source library modules when running from a checkout. Remote (curl|bash)
# installs use the inlined fallbacks below.
_INSTALL_LIB_DIR="$SCRIPT_DIR/scripts/lib/install"
if [[ -d "$_INSTALL_LIB_DIR" ]]; then
    # shellcheck source=scripts/lib/install/logging.sh
    source "$_INSTALL_LIB_DIR/logging.sh"
    # shellcheck source=scripts/lib/install/platform.sh
    source "$_INSTALL_LIB_DIR/platform.sh"
    # shellcheck source=scripts/lib/install/fs.sh
    source "$_INSTALL_LIB_DIR/fs.sh"
    # shellcheck source=scripts/lib/install/template.sh
    source "$_INSTALL_LIB_DIR/template.sh"
    # shellcheck source=scripts/lib/install/config.sh
    source "$_INSTALL_LIB_DIR/config.sh"
    # shellcheck source=scripts/lib/install/pages.sh
    source "$_INSTALL_LIB_DIR/pages.sh"
    # Use the lib loader (same behavior as the previous private function).
    load_install_config "$SCRIPT_DIR" "$SOURCE_DIR" || true
else
    # ---------------------------------------------------------------------
    # Inlined fallbacks — used only when scripts/lib/install/ is absent
    # (e.g. running install.sh from a downloaded one-liner without the
    # bundled libraries). Keep these IDENTICAL to the lib copies above.
    # ---------------------------------------------------------------------
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
    BLUE='\033[0;34m'; NC='\033[0m'

    log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
    log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
    log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
    log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

    detect_os() { uname -s 2>/dev/null || echo "unknown"; }

    detect_ruby_version() {
        if ! command -v ruby >/dev/null 2>&1; then echo "none"; return; fi
        ruby --version 2>/dev/null | awk '{print $2}' | sed 's/p[0-9]*//' | sed 's/-.*//' | tr -d '\r'
    }

    ruby_version_lt_27() {
        local ver; ver=$(detect_ruby_version)
        [ "$ver" = "none" ] && return 1
        awk -v ver="$ver" 'BEGIN { n=split(ver,a,"."); if (a[1]+0==2 && a[2]+0<7) exit 0; exit 1 }'
    }

    needs_macos_gemfile() {
        local os; os=$(detect_os)
        [ "$os" = "Darwin" ] && ruby_version_lt_27
    }

    detect_platform() {
        if [[ "${PLATFORM:-auto}" != "auto" ]]; then echo "$PLATFORM"; return; fi
        if grep -qiE '(microsoft|wsl)' /proc/version 2>/dev/null; then echo "wsl"
        elif [[ "$(uname -s)" == "Darwin" ]]; then echo "macos"
        elif [[ "$(uname -s)" == "Linux" ]]; then echo "linux"
        else echo "unknown"; fi
    }

    copy_file_with_backup() {
        local src="$1" dest="$2"
        local relative_path="${dest#${TARGET_DIR:-}/}"
        mkdir -p "$(dirname "$dest")"
        if [[ -f "$dest" ]]; then
            local backup_file="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
            log_warning "File exists, creating backup: $relative_path -> ${backup_file##*/}"
            cp "$dest" "$backup_file"
        fi
        cp "$src" "$dest"
        log_info "Copied: $relative_path"
    }

    copy_directory_with_backup() {
        local src="$1" dest="$2"
        local relative_path="${dest#${TARGET_DIR:-}/}"
        if [[ -d "$dest" ]]; then
            local backup_dir="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
            log_warning "Directory exists, creating backup: $relative_path -> ${backup_dir##*/}"
            cp -r "$dest" "$backup_dir"
            rm -rf "$dest"
        fi
        cp -r "$src" "$dest"
        log_info "Copied directory: $relative_path"
    }

    render_template() {
        local template_file="$1" output_file="${2:-}"
        [[ ! -f "$template_file" ]] && return 1
        local content; content=$(cat "$template_file")
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

    create_from_template() {
        local template_path="$1" output_file="$2" fallback_content="${3:-}"
        if [[ -f "$output_file" ]]; then
            log_warning "$(basename "$output_file") already exists, skipping to preserve content"
            return 0
        fi
        if [[ -n "${TEMPLATES_DIR:-}" ]] && [[ -f "$TEMPLATES_DIR/$template_path" ]]; then
            render_template "$TEMPLATES_DIR/$template_path" "$output_file"
            log_info "Created $(basename "$output_file") from template"
            return 0
        fi
        if [[ "${REMOTE_INSTALL:-false}" == "true" ]]; then
            local remote_url="${GITHUB_RAW_URL}/templates/$template_path"
            local remote_content
            if remote_content=$(curl -fsSL "$remote_url" 2>/dev/null); then
                local temp_file; temp_file=$(mktemp)
                echo "$remote_content" > "$temp_file"
                render_template "$temp_file" "$output_file"
                rm -f "$temp_file"
                log_info "Created $(basename "$output_file") from remote template"
                return 0
            fi
        fi
        if [[ -n "$fallback_content" ]]; then
            mkdir -p "$(dirname "$output_file")"
            echo "$fallback_content" > "$output_file"
            log_info "Created $(basename "$output_file") from fallback"
            return 0
        fi
        log_warning "Could not create $(basename "$output_file") (no template or fallback)"
        return 1
    }

    templates_available() { [[ -n "${TEMPLATES_DIR:-}" ]] && [[ -d "$TEMPLATES_DIR" ]]; }

    # Inline config loader (same defaults as scripts/lib/install/config.sh).
    _load_install_config() {
        local config_paths=(
            "$SCRIPT_DIR/templates/config/install.conf"
            "$SOURCE_DIR/templates/config/install.conf"
        )
        local config_path
        for config_path in "${config_paths[@]}"; do
            if [[ -f "$config_path" ]]; then
                # shellcheck source=/dev/null
                source "$config_path"
                TEMPLATES_DIR="$(dirname "$(dirname "$config_path")")"
                return 0
            fi
        done
        THEME_NAME="${THEME_NAME:-zer0-mistakes}"
        THEME_GEM_NAME="${THEME_GEM_NAME:-jekyll-theme-zer0}"
        THEME_DISPLAY_NAME="${THEME_DISPLAY_NAME:-Zer0-Mistakes Jekyll Theme}"
        GITHUB_USER="${GITHUB_USER:-bamr87}"
        GITHUB_REPO="${GITHUB_REPO:-bamr87/zer0-mistakes}"
        GITHUB_URL="${GITHUB_URL:-https://github.com/bamr87/zer0-mistakes}"
        GITHUB_RAW_URL="${GITHUB_RAW_URL:-https://raw.githubusercontent.com/bamr87/zer0-mistakes/main}"
        DEFAULT_PORT="${DEFAULT_PORT:-4000}"
        DEFAULT_URL="${DEFAULT_URL:-http://localhost:4000}"
        JEKYLL_VERSION="${JEKYLL_VERSION:-~> 4.3}"
        FFI_VERSION="${FFI_VERSION:-~> 1.17.0}"
        WEBRICK_VERSION="${WEBRICK_VERSION:-~> 1.7}"
        COMMONMARKER_VERSION="${COMMONMARKER_VERSION:-0.23.10}"
        GITHUB_PAGES_MAX_VERSION="${GITHUB_PAGES_MAX_VERSION:-232}"
        COMMONMARKER_MACOS_VERSION="${COMMONMARKER_MACOS_VERSION:-~> 0.23}"
        RUBY_MIN_VERSION_MACOS="${RUBY_MIN_VERSION_MACOS:-2.6.0}"
        return 1
    }
    _load_install_config

    # ---------------------------------------------------------------------
    # Inlined starter-page renderer (mirror of scripts/lib/install/pages.sh).
    # Manifest-driven: replaces the legacy 8 create_*_page functions.
    # ---------------------------------------------------------------------
    _starter_pages_manifest() {
        cat <<'MANIFEST'
pages/quickstart.md.template|pages/quickstart/index.md|pages/quickstart|_fallback_quickstart
pages/docs-index.md.template|pages/_docs/index.md|pages/_docs|_fallback_docs_index
pages/configuration.md.template|pages/_docs/configuration/index.md|pages/_docs/configuration|
pages/troubleshooting.md.template|pages/_docs/troubleshooting.md|pages/_docs|
pages/about.md.template|pages/_about/index.md|pages/_about|_fallback_about
pages/blog.md.template|pages/blog.md||_fallback_blog
MANIFEST
    }
    _admin_settings_pages() { echo "theme config navigation collections analytics environment"; }

    _fallback_quickstart() {
        cat <<EOF
---
layout: default
title: Quick Start
permalink: /quickstart/
---

# Quick Start Guide

Get your site up and running in just a few minutes!

Start with: \`docker-compose up\` — site will be available at **${DEFAULT_URL}**.

See [docs](/docs/) and [troubleshooting](/docs/troubleshooting/), or [open an issue](${GITHUB_URL}/issues).
EOF
    }

    _fallback_docs_index() {
        cat <<EOF
---
layout: default
title: Documentation
permalink: /docs/
---

# Documentation

Welcome to the ${THEME_NAME} theme documentation.

- [Quick Start](/quickstart/)
- [Configuration](/docs/configuration/)
- [Troubleshooting](/docs/troubleshooting/)
- [GitHub](${GITHUB_URL})
EOF
    }

    _fallback_about() {
        cat <<EOF
---
layout: default
title: About
permalink: /about/
---

# About

This site is built with **${THEME_DISPLAY_NAME}**.

- [Documentation](/docs/) · [GitHub](${GITHUB_URL}) · [Issues](${GITHUB_URL}/issues)
EOF
    }

    _fallback_blog() {
        cat <<'EOF'
---
layout: default
title: Blog
permalink: /blog/
---

# Blog

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%B %d, %Y" }}
{% endfor %}

{% if site.posts.size == 0 %}
*No posts yet. Create your first post to see it here!*
{% endif %}
EOF
    }

    render_admin_settings_pages() {
        local admin_dir="$TARGET_DIR/pages/_about/settings"
        mkdir -p "$admin_dir"
        log_info "Creating admin settings pages..."
        local page
        for page in $(_admin_settings_pages); do
            create_from_template "pages/admin/${page}.md.template" "$admin_dir/${page}.md" ""
        done
    }

    render_starter_pages() {
        log_info "Creating essential starter pages..."
        mkdir -p "$TARGET_DIR/pages"
        local tmpl dest mkdir_rel fb_func fallback
        while IFS='|' read -r tmpl dest mkdir_rel fb_func; do
            [ -z "$tmpl" ] && continue
            [ -n "$mkdir_rel" ] && mkdir -p "$TARGET_DIR/$mkdir_rel"
            if [ -n "$fb_func" ] && declare -f "$fb_func" >/dev/null 2>&1; then
                fallback="$("$fb_func")"
            else
                fallback=""
            fi
            create_from_template "$tmpl" "$TARGET_DIR/$dest" "$fallback"
        done <<MANIFEST_EOF
$(_starter_pages_manifest)
MANIFEST_EOF
        render_admin_settings_pages
        log_success "Starter pages created"
    }

    create_starter_pages() { render_starter_pages "$@"; }
    create_admin_pages()   { render_admin_settings_pages "$@"; }
fi

DETECTED_PLATFORM="$(detect_platform)"

# Installation mode
INSTALL_MODE="${DEFAULT_INSTALL_MODE:-full}"

# User-provided values for fork mode
SITE_TITLE=""
SITE_AUTHOR=""
SITE_EMAIL=""
FORK_GITHUB_USER=""
FORK_REPO_NAME=""

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--minimal)
                INSTALL_MODE="minimal"
                shift
                ;;
            -f|--full)
                INSTALL_MODE="full"
                shift
                ;;
            --fork)
                INSTALL_MODE="fork"
                shift
                ;;
            --github)
                INSTALL_MODE="github"
                shift
                ;;
            --remote)
                INSTALL_MODE="remote"
                shift
                ;;
            --site-name)
                FORK_SITE_NAME="$2"
                shift 2
                ;;
            --repo-name)
                FORK_REPO_NAME="$2"
                shift 2
                ;;
            --github-user)
                FORK_GITHUB_USER="$2"
                shift 2
                ;;
            --author)
                FORK_AUTHOR="$2"
                shift 2
                ;;
            --email)
                FORK_EMAIL="$2"
                shift 2
                ;;
            --codespaces)
                INCLUDE_CODESPACES=true
                shift
                ;;
            --non-interactive)
                NON_INTERACTIVE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$TARGET_DIR" ]]; then
                    TARGET_DIR="$1"
                else
                    log_error "Multiple target directories specified"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Set default target directory if not specified
    if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="$(pwd)"
    fi
}

# Non-interactive mode flag
NON_INTERACTIVE="${NON_INTERACTIVE:-false}"

# Check if we're running from a downloaded script (remote installation)
REMOTE_INSTALL=false
if [[ ! -f "$SOURCE_DIR/_config.yml" ]]; then
    REMOTE_INSTALL=true
    log_info "Remote installation detected - will download theme files"
fi

# Error handling function
handle_error() {
    log_error "Installation failed at line $1"
    log_error "Please check the error above and try again"
    exit 1
}

# Set up error trap
trap 'handle_error $LINENO' ERR

# Validation functions
validate_source_directory() {
    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_error "Source directory does not exist: $SOURCE_DIR"
        exit 1
    fi
    
    # Check for essential files based on installation mode
    local required_files=()
    
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        required_files=(
            "_config.yml"
            "Gemfile"
        )
    else
        # For full installation, check for core files
        required_files=(
            "_config.yml"
            "Gemfile"
            "docker-compose.yml"
        )
        
        # Additional files that should exist but aren't critical for remote install
        local optional_files=(
            "Rakefile"
            "404.html"
            "favicon.ico"
        )
        
        # Check optional files and warn if missing
        for file in "${optional_files[@]}"; do
            if [[ ! -f "$SOURCE_DIR/$file" ]]; then
                log_warning "Optional file missing: $file (will be skipped)"
            fi
        done
    fi
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$SOURCE_DIR/$file" ]]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    log_success "Source directory validation passed (${INSTALL_MODE} mode)"
}

validate_target_directory() {
    if [[ ! -d "$TARGET_DIR" ]]; then
        log_warning "Target directory does not exist: $TARGET_DIR"
        log_info "Creating target directory..."
        mkdir -p "$TARGET_DIR"
    fi
    
    if [[ ! -w "$TARGET_DIR" ]]; then
        log_error "Target directory is not writable: $TARGET_DIR"
        exit 1
    fi
    
    log_success "Target directory validation passed"
}

# File copying functions: copy_file_with_backup / copy_directory_with_backup
# are provided by scripts/lib/install/fs.sh (or the inlined fallback at the
# top of this script when the lib directory isn't present).

# Installation functions
install_config_files() {
    log_info "Installing configuration files..."
    
    copy_file_with_backup "$SOURCE_DIR/_config.yml" "$TARGET_DIR/_config.yml"
    
    # Only install dev config in full mode
    if [[ "$INSTALL_MODE" == "full" ]]; then
        copy_file_with_backup "$SOURCE_DIR/_config_dev.yml" "$TARGET_DIR/_config_dev.yml"
        copy_file_with_backup "$SOURCE_DIR/frontmatter.json" "$TARGET_DIR/frontmatter.json"
    fi
    
    log_success "Configuration files installed (${INSTALL_MODE} mode)"
}

install_build_files() {
    log_info "Installing build and dependency files..."
    
    # Create site-appropriate Gemfile instead of copying theme's Gemfile
    create_site_gemfile
    
    # Full installation includes additional build files
    if [[ "$INSTALL_MODE" == "full" ]]; then
        if [[ -f "$SOURCE_DIR/Rakefile" ]]; then
            copy_file_with_backup "$SOURCE_DIR/Rakefile" "$TARGET_DIR/Rakefile"
        else
            log_warning "Rakefile not found, skipping"
        fi
        
        if [[ -f "$SOURCE_DIR/package.json" ]]; then
            copy_file_with_backup "$SOURCE_DIR/package.json" "$TARGET_DIR/package.json"
        else
            log_warning "package.json not found, skipping"
        fi
    fi
    
    log_success "Build files installed (${INSTALL_MODE} mode)"
}

install_docker_files() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Skipping Docker files (minimal installation)"
        return
    fi
    
    log_info "Installing Docker files..."
    
    copy_file_with_backup "$SOURCE_DIR/docker-compose.yml" "$TARGET_DIR/docker-compose.yml"
    
    # Copy the docker directory with Dockerfile (required by docker-compose.yml)
    if [[ -d "$SOURCE_DIR/docker" ]]; then
        copy_directory_with_backup "$SOURCE_DIR/docker" "$TARGET_DIR/docker"
        log_info "Docker directory with Dockerfile installed"
    else
        log_warning "docker/ directory not found, skipping"
    fi
    
    log_success "Docker files installed"
}

install_theme_directories() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Skipping theme directories (minimal installation)"
        return
    fi
    
    log_info "Installing theme directories..."
    
    # Core Jekyll directories
    copy_directory_with_backup "$SOURCE_DIR/_data" "$TARGET_DIR/_data"
    copy_directory_with_backup "$SOURCE_DIR/_sass" "$TARGET_DIR/_sass"
    copy_directory_with_backup "$SOURCE_DIR/_includes" "$TARGET_DIR/_includes"
    copy_directory_with_backup "$SOURCE_DIR/_layouts" "$TARGET_DIR/_layouts"
    copy_directory_with_backup "$SOURCE_DIR/assets" "$TARGET_DIR/assets"
    
    log_success "Theme directories installed"
}

install_static_files() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Creating minimal index.md file..."
        create_minimal_index
        return
    fi
    
    log_info "Installing static files..."
    
    # Install optional static files with graceful handling
    if [[ -f "$SOURCE_DIR/404.html" ]]; then
        copy_file_with_backup "$SOURCE_DIR/404.html" "$TARGET_DIR/404.html"
    else
        log_warning "404.html not found, skipping"
    fi
    
    if [[ -f "$SOURCE_DIR/favicon.ico" ]]; then
        copy_file_with_backup "$SOURCE_DIR/favicon.ico" "$TARGET_DIR/favicon.ico"
    else
        log_warning "favicon.ico not found, skipping"
    fi
    
    # Copy index.md if it doesn't exist in target
    if [[ ! -f "$TARGET_DIR/index.md" ]]; then
        if [[ -f "$SOURCE_DIR/index.md" ]]; then
            copy_file_with_backup "$SOURCE_DIR/index.md" "$TARGET_DIR/index.md"
        else
            log_warning "index.md not found in source, creating basic index"
            create_minimal_index
        fi
    else
        log_warning "index.md already exists in target, skipping to preserve content"
    fi
    
    log_success "Static files installed"
}

create_site_gemfile() {
    log_info "Creating site-appropriate Gemfile..."
    
    local template_path
    local fallback_content

    # On macOS with system Ruby < 2.7, use the compatibility-capped template.
    # All other environments (Linux, Docker, Ruby >= 2.7) stay zero-pin.
    if needs_macos_gemfile; then
        log_info "Detected macOS + Ruby < 2.7 — using macOS compatibility template"
        template_path="config/Gemfile.macos.template"
        fallback_content='source "https://rubygems.org"

# macOS system Ruby 2.6 compatibility caps (generated by install.sh)
gem "github-pages", ">= 228", "< '"${GITHUB_PAGES_MAX_VERSION:-232}"'", group: :jekyll_plugins
gem "jekyll-remote-theme"
gem "jekyll-feed"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"
gem "jekyll-paginate"
gem "ffi", "'"${FFI_VERSION}"'"
gem "webrick", "'"${WEBRICK_VERSION}"'"
gem "commonmarker", "'"${COMMONMARKER_MACOS_VERSION:-~> 0.23}"'"'
    elif [[ "$INSTALL_MODE" == "minimal" ]]; then
        template_path="config/Gemfile.minimal.template"
        fallback_content='source "https://rubygems.org"

# Jekyll and essential plugins
gem "jekyll", "'"${JEKYLL_VERSION}"'"
gem "jekyll-feed"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"

# Platform compatibility
gem "ffi", "'"${FFI_VERSION}"'"
gem "webrick", "'"${WEBRICK_VERSION}"'"

# GitHub Pages compatibility (uncomment for GitHub Pages)
# gem "github-pages", group: :jekyll_plugins

# Platform-specific dependencies
platforms :windows, :jruby do
  gem "tzinfo"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", :platforms => [:windows]'
    else
        template_path="config/Gemfile.full.template"
        fallback_content='source "https://rubygems.org"

# GitHub Pages gem includes Jekyll and compatible plugins
gem "github-pages", group: :jekyll_plugins

# Essential plugins (already included in github-pages but listed for clarity)
gem "jekyll-remote-theme"
gem "jekyll-feed"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"
gem "jekyll-paginate"

# Platform compatibility and performance
gem "ffi", "'"${FFI_VERSION}"'"
gem "webrick", "'"${WEBRICK_VERSION}"'"
gem "commonmarker", "'"${COMMONMARKER_VERSION}"'"  # Fixed version to avoid compatibility issues

# Platform-specific dependencies
platforms :windows, :jruby do
  gem "tzinfo"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", :platforms => [:windows]'
    fi
    
    create_from_template "$template_path" "$TARGET_DIR/Gemfile" "$fallback_content"
    log_info "Created Gemfile for ${INSTALL_MODE} installation"
}

create_minimal_index() {
    local fallback_content='---
layout: home
title: Home
permalink: /
---

# Welcome to Your Jekyll Site

This site was created using the **'"${THEME_DISPLAY_NAME}"'**.

<div class="row mt-4">
<div class="col-md-4 mb-3">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title"><i class="bi bi-rocket-takeoff"></i> Quick Start</h5>
<p class="card-text">Get your site up and running in minutes with our step-by-step guide.</p>
<a href="/quickstart/" class="btn btn-primary">Get Started</a>
</div>
</div>
</div>
<div class="col-md-4 mb-3">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title"><i class="bi bi-book"></i> Documentation</h5>
<p class="card-text">Learn how to customize and extend your site with comprehensive docs.</p>
<a href="/docs/" class="btn btn-outline-primary">Read Docs</a>
</div>
</div>
</div>
<div class="col-md-4 mb-3">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title"><i class="bi bi-info-circle"></i> About</h5>
<p class="card-text">Learn about the theme features and how to make the most of them.</p>
<a href="/about/" class="btn btn-outline-secondary">About Theme</a>
</div>
</div>
</div>
</div>'

    create_from_template "pages/index.md.template" "$TARGET_DIR/index.md" "$fallback_content"
}

# NOTE: create_starter_pages, create_admin_pages, create_quickstart_page,
# create_docs_page, create_about_page, and create_blog_page used to live
# here as 8 near-identical heredoc functions (~245 lines). They are now
# provided by scripts/lib/install/pages.sh (with an inlined fallback near
# the top of this file for remote curl|bash installs).

create_starter_navigation() {
    log_info "Creating navigation configuration..."
    
    mkdir -p "$TARGET_DIR/_data/navigation"
    
    local fallback_content='# Main Navigation Configuration
# Customize this file to change your site navigation

- title: Quick Start
  icon: bi-rocket-takeoff
  url: /quickstart/

- title: Blog
  icon: bi-journal-text
  url: /blog/

- title: Docs
  icon: bi-book
  url: /docs/
  children:
    - title: Documentation Home
      url: /docs/
    - title: Configuration
      url: /docs/configuration/
    - title: Troubleshooting
      url: /docs/troubleshooting/

- title: About
  icon: bi-info-circle
  url: /about/'
    
    create_from_template "data/navigation-main.yml.template" "$TARGET_DIR/_data/navigation/main.yml" "$fallback_content"
    log_success "Navigation configuration created"
}

create_gitignore() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        create_minimal_gitignore
        return
    fi
    
    log_info "Creating .gitignore file..."
    
    local gitignore_content="# Jekyll
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata

# Ruby
.bundle/
vendor/
Gemfile.lock

# Node.js
node_modules/
npm-debug.log*

# Environment
.env
env-variables.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Backup files
*.backup.*
"
    
    if [[ ! -f "$TARGET_DIR/.gitignore" ]]; then
        echo "$gitignore_content" > "$TARGET_DIR/.gitignore"
        log_info "Created .gitignore"
    else
        log_warning ".gitignore already exists, skipping to preserve existing rules"
    fi
    
    log_success "Git configuration completed"
}

create_minimal_gitignore() {
    log_info "Creating minimal .gitignore file..."
    
    local gitignore_content="# Jekyll
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata

# Ruby
.bundle/
vendor/
Gemfile.lock

# OS
.DS_Store
Thumbs.db
"
    
    if [[ ! -f "$TARGET_DIR/.gitignore" ]]; then
        echo "$gitignore_content" > "$TARGET_DIR/.gitignore"
        log_info "Created minimal .gitignore"
    else
        log_warning ".gitignore already exists, skipping to preserve existing rules"
    fi
    
    log_success "Git configuration completed (minimal)"
}

create_readme_instructions() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        create_minimal_readme
        return
    fi
    
    log_info "Creating installation instructions..."
    
    local readme_content="# zer0-mistakes Jekyll Theme Installation

This directory has been set up with the zer0-mistakes Jekyll theme.

## Quick Start

### Using Docker (Recommended)
\`\`\`bash
# Start the development server
docker-compose up

# Your site will be available at http://localhost:4000
\`\`\`

**Note**: The installation script has optimized \`_config_dev.yml\` for Docker compatibility.

### Using Local Ruby Environment
\`\`\`bash
# Install dependencies
bundle install

# Start the development server
bundle exec jekyll serve --config _config_dev.yml

# Your site will be available at http://localhost:4000
\`\`\`

## Azure Static Web Apps Deployment

This theme is pre-configured for Azure Static Web Apps deployment:

### Directory Structure for Azure
- **App Location**: \`.\" (root directory) - Contains Jekyll source files
- **API Location**: \`api/\" - For Azure Functions (optional)
- **Output Location**: \`_site/\" - Jekyll build output

### Deployment Setup
1. Create an Azure Static Web App in the Azure portal
2. Copy the deployment token to your GitHub repository secrets as \`AZURE_STATIC_WEB_APPS_API_TOKEN\`
3. Push to the \`main\` branch to trigger automatic deployment

### Adding Azure Functions (Optional)
\`\`\`bash
# Create Azure Functions API structure
mkdir -p api/hello

# The workflow file at .github/workflows/azure-static-web-apps.yml
# is already configured for Azure deployment
\`\`\`

## Configuration

1. Edit \`_config.yml\` to customize your site settings
2. Update the content in \`index.md\` to match your needs
3. Add your content in the \`pages/\` directory
4. Customize styling in \`_sass/custom.scss\`

## Directory Structure

- \`_config.yml\` - Main Jekyll configuration
- \`_config_dev.yml\` - Development configuration (Docker-optimized)
- \`_data/\` - Site data files
- \`_includes/\` - Reusable template components
- \`_layouts/\` - Page layouts
- \`_sass/\` - Sass stylesheets
- \`assets/\` - Static assets (images, JS, CSS)
- \`build/\` - Build logs and temporary files
- \`.github/workflows/\` - GitHub Actions for Azure deployment

## Troubleshooting

### Docker Issues

#### Theme Not Found Error
\`\`\`text
jekyll 3.10.0 | Error: The jekyll-theme-zer0 theme could not be found.
\`\`\`

**Solution**: The installation script has configured \`_config_dev.yml\` to disable theme dependencies for Docker compatibility.

#### Port Conflicts
If port 4000 is already in use, modify \`docker-compose.yml\`:
\`\`\`yaml
ports:
  - \"4001:4000\"  # Use different external port
\`\`\`

#### Platform Issues (Apple Silicon/ARM64)
If you encounter platform warnings on Apple Silicon Macs, this is normal and the container should still work.

#### Bundle Install Failures
If you encounter gem installation issues:
\`\`\`bash
# Clear bundle cache
docker-compose down
docker system prune -f

# Rebuild containers
docker-compose up --build
\`\`\`

### Local Development Issues

#### Missing Dependencies
\`\`\`bash
# Update bundler
gem update bundler

# Clean install
bundle clean --force
bundle install
\`\`\`

#### Ruby Version Issues
Ensure you're using a compatible Ruby version (3.0+):
\`\`\`bash
ruby --version
rbenv install 3.1.0  # If using rbenv
rbenv global 3.1.0
\`\`\`

## Support

For issues and documentation, visit: [zer0-mistakes GitHub Repository](https://github.com/bamr87/zer0-mistakes)

---
Installed on: \$(date)
Theme Version: zer0-mistakes
Azure Static Web Apps: Ready
Docker: Optimized for compatibility
"
    
    if [[ ! -f "$TARGET_DIR/INSTALLATION.md" ]]; then
        echo "$readme_content" > "$TARGET_DIR/INSTALLATION.md"
        log_info "Created INSTALLATION.md"
    fi
    
    log_success "Installation instructions created"
}

create_minimal_readme() {
    log_info "Creating minimal installation instructions..."
    
    local readme_content="# zer0-mistakes Jekyll Theme - Minimal Installation

This directory has been set up with a minimal zer0-mistakes Jekyll theme installation.

## Quick Start

\`\`\`bash
# Install dependencies
bundle install

# Start the development server
bundle exec jekyll serve

# Your site will be available at http://localhost:4000
\`\`\`

## What's Included (Minimal Installation)

- \`_config.yml\` - Main Jekyll configuration
- \`Gemfile\` - Ruby dependencies
- \`index.md\` - Basic homepage
- \`.gitignore\` - Git ignore rules

## Next Steps

1. **Customize Configuration**: Edit \`_config.yml\` to match your site needs
2. **Add Content**: Create pages and posts in markdown format
3. **Choose Layouts**: Use Jekyll's default layouts or create your own
4. **Style Your Site**: Add custom CSS or upgrade to full installation

## Upgrading to Full Installation

For complete theme features including:
- Custom layouts and includes
- Docker support
- Azure Static Web Apps deployment
- Pre-built styling and components

Run the installer again with the full flag:

\`\`\`bash
# Local installation
./install.sh --full

# Remote installation  
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full
\`\`\`

## Troubleshooting

### Missing Dependencies
\`\`\`bash
# Update bundler
gem update bundler

# Clean install
bundle clean --force
bundle install
\`\`\`

### Ruby Version Issues
Ensure you're using a compatible Ruby version (3.0+):
\`\`\`bash
ruby --version
\`\`\`

## Support

For issues and documentation, visit: [zer0-mistakes GitHub Repository](https://github.com/bamr87/zer0-mistakes)

---
Installed on: \$(date)
Installation Type: Minimal
Upgrade Available: Run with --full flag
"
    
    if [[ ! -f "$TARGET_DIR/INSTALLATION.md" ]]; then
        echo "$readme_content" > "$TARGET_DIR/INSTALLATION.md"
        log_info "Created minimal INSTALLATION.md"
    fi
    
    log_success "Minimal installation instructions created"
}

create_azure_static_web_apps_workflow() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Skipping Azure workflow (minimal installation)"
        return
    fi
    
    log_info "Creating Azure Static Web Apps workflow..."
    
    # Create .github/workflows directory
    mkdir -p "$TARGET_DIR/.github/workflows"
    
    # Create Azure Static Web Apps workflow file
    cat > "$TARGET_DIR/.github/workflows/azure-static-web-apps.yml" << 'EOF'
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          lfs: false
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.1'
          bundler-cache: true
      
      - name: Build Jekyll site
        run: |
          bundle install
          bundle exec jekyll build
      
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "."
          api_location: "api"
          output_location: "_site"
          skip_app_build: true

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
EOF
    
    log_success "Azure Static Web Apps workflow created"
}

# Post-installation configuration optimization
optimize_development_config() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Skipping development config optimization (minimal installation)"
        return
    fi
    
    log_info "Optimizing development configuration for Docker compatibility..."
    
    local dev_config="$TARGET_DIR/_config_dev.yml"
    
    # Create an enhanced _config_dev.yml that works with Docker
    cat > "$dev_config" << 'EOF'
# Dev config override for zer0-mistakes theme
# Optimized for Docker development environment

# Disable remote theme for initial setup - allows site to build with basic Jekyll functionality
# Enable remote_theme only when bamr87/zer0-mistakes repository is available and accessible
remote_theme             : false
# theme                    : "jekyll-theme-zer0"  # Commented out to avoid gem dependency issues

# Essential Jekyll plugins for development
plugins:
  - jekyll-feed
  - jekyll-sitemap  
  - jekyll-seo-tag
  - jekyll-paginate

# Override problematic settings for local development
url: ""
baseurl: ""

# Development-specific settings
host: "0.0.0.0"  # Allow Docker container access
port: 4000
livereload: true
incremental: true

# Exclude files for faster builds
exclude:
  - README.md
  - INSTALLATION.md
  - Gemfile.lock
  - vendor/
  - .bundle/
  - build/
  - .github/
  - docker-compose.yml
  - "*.backup.*"

# Markdown processing
markdown: kramdown
highlighter: rouge
kramdown:
  input: GFM
  syntax_highlighter: rouge
EOF
    
    # Update docker-compose.yml to include repository environment variable
    update_docker_compose_config
    
    log_success "Development configuration optimized for Docker"
}

update_docker_compose_config() {
    log_info "Updating Docker Compose configuration..."
    
    local docker_config="$TARGET_DIR/docker-compose.yml"
    
    # Read the current docker-compose.yml and add environment variable
    if [[ -f "$docker_config" ]]; then
        # Check if PAGES_REPO_NWO is already present
        if ! grep -q "PAGES_REPO_NWO" "$docker_config"; then
            # Add the environment variable after JEKYLL_ENV line
            # Use perl for cross-platform compatibility (BSD sed and GNU sed differ on in-place syntax)
            perl -pi -e '$_ .= "      PAGES_REPO_NWO: \"bamr87/zer0-mistakes\"\n" if /JEKYLL_ENV: development/' "$docker_config"
            log_info "Added PAGES_REPO_NWO environment variable to docker-compose.yml"
        fi
    fi
}

create_build_directory() {
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Skipping build directory (minimal installation)"
        return
    fi
    
    log_info "Creating build directory structure..."
    
    # Create build directory for logs and temporary files
    mkdir -p "$TARGET_DIR/build"
    
    # Create initial log file
    echo "$(date) - zer0-mistakes theme installation started" > "$TARGET_DIR/build/env-variables.log"
    
    log_success "Build directory created"
}

# Remote installation functions
download_theme_files() {
    if [[ "$REMOTE_INSTALL" == "true" ]]; then
        log_info "Downloading zer0-mistakes theme files from GitHub..."
        
        # Create temporary directory
        TEMP_DIR=$(mktemp -d)
        trap cleanup_temp_dir EXIT
        
        # Download and extract the repository
        if ! curl -fsSL "$GITHUB_REPO/archive/refs/heads/main.tar.gz" | tar -xz -C "$TEMP_DIR" --strip-components=1; then
            log_error "Failed to download theme files from GitHub"
            log_error "Please check your internet connection and try again"
            exit 1
        fi
        
        if [[ ! -f "$TEMP_DIR/_config.yml" ]]; then
            log_error "Downloaded files are incomplete or corrupted"
            exit 1
        fi
        
        # Update source directory to use downloaded files
        SOURCE_DIR="$TEMP_DIR"
        log_success "Theme files downloaded successfully"
    fi
}

cleanup_temp_dir() {
    if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
        log_info "Cleaned up temporary files"
    fi
}

# Help function
# =========================================================================
# GitHub Mode — interactive gh CLI fork + install
# =========================================================================
install_github_mode() {
    log_info "Starting GitHub mode installation..."
    log_info "Detected platform: $DETECTED_PLATFORM"

    # Optionally run platform setup
    local platform_script=""
    local platform_setup_function=""
    case "$DETECTED_PLATFORM" in
        macos)
            platform_script="$SOURCE_DIR/scripts/platform/setup-macos.sh"
            platform_setup_function="setup_macos"
            ;;
        linux)
            platform_script="$SOURCE_DIR/scripts/platform/setup-linux.sh"
            platform_setup_function="setup_linux"
            ;;
        wsl)
            platform_script="$SOURCE_DIR/scripts/platform/setup-wsl.sh"
            platform_setup_function="setup_wsl"
            ;;
    esac

    if [[ -n "$platform_script" && -f "$platform_script" ]]; then
        log_info "Running platform setup for $DETECTED_PLATFORM..."
        # shellcheck source=/dev/null
        source "$platform_script"

        if [[ -n "$platform_setup_function" ]] && declare -F "$platform_setup_function" >/dev/null 2>&1; then
            "$platform_setup_function"
        else
            log_error "Platform setup function '$platform_setup_function' not found after sourcing $platform_script"
            return 1
        fi
    fi

    # Delegate to github-setup.sh if available
    local gh_setup="$SOURCE_DIR/scripts/github-setup.sh"
    if [[ -f "$gh_setup" ]]; then
        log_info "Launching GitHub setup script..."

        # Keep repository name separate from the human-readable site title.
        local repo_name="${FORK_REPO_NAME:-${FORK_SITE_NAME:-}}"
        local site_name="${FORK_SITE_NAME:-}"
        local gh_args=()

        [[ -n "${FORK_GITHUB_USER:-}" ]] && gh_args+=(--github-user "$FORK_GITHUB_USER")
        [[ -n "$repo_name" ]]            && gh_args+=(--repo-name "$repo_name")
        [[ -n "$site_name" ]]            && gh_args+=(--site-name "$site_name")
        [[ -n "${FORK_AUTHOR:-}" ]]      && gh_args+=(--author "$FORK_AUTHOR")
        [[ -n "${FORK_EMAIL:-}" ]]       && gh_args+=(--email "$FORK_EMAIL")

        # `${arr[@]}` on an empty array is unbound under `set -u` in bash 4.x; guard with `+`
        bash "$gh_setup" ${gh_args[@]+"${gh_args[@]}"}
    else
        # Inline fallback — use fork mode logic
        log_info "github-setup.sh not found, falling back to fork mode"
        install_fork_mode
        return $?
    fi
}

# =========================================================================
# Remote Mode — fork repo + create orphan gh-pages branch with bare minimum
# =========================================================================
# This mode creates a GitHub Pages site that uses remote_theme to load
# zer0-mistakes. The gh-pages branch contains ONLY consumer files:
#   _config.yml, Gemfile, index.md, 404.html, starter pages, navigation data
# No theme source (_layouts, _includes, _sass, assets) is included.
# =========================================================================
install_remote_mode() {
    log_info "Starting remote mode installation..."
    log_info "This creates a lightweight GitHub Pages site using remote_theme."

    # Require gh CLI for this mode
    if ! command -v gh &> /dev/null; then
        log_error "Remote mode requires the GitHub CLI (gh)."
        log_error "Install it: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status &> /dev/null 2>&1; then
        log_error "GitHub CLI is not authenticated. Run: gh auth login"
        exit 1
    fi

    # Gather user input if not provided
    if [[ "$NON_INTERACTIVE" != "true" ]]; then
        gather_fork_user_input
    fi

    # Derive repo name — prefer explicit --repo-name, fall back to --site-name derived slug
    local repo_name="${FORK_REPO_NAME:-${FORK_SITE_NAME:-my-site}}"
    repo_name=$(echo "$repo_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    export REPOSITORY_NAME="$repo_name"

    # Detect the current GitHub user
    local gh_user="${FORK_GITHUB_USER:-$(gh api user --jq '.login' 2>/dev/null)}"
    if [[ -z "$gh_user" ]]; then
        log_error "Could not determine GitHub username."
        exit 1
    fi
    export FORK_GITHUB_USER="$gh_user"

    # Resolve the branch name (default: gh-pages)
    local branch="${REMOTE_BRANCH:-gh-pages}"

    # Make TARGET_DIR absolute
    if [[ ! "$TARGET_DIR" = /* ]]; then
        TARGET_DIR="$(pwd)/$TARGET_DIR"
    fi

    # ── Step 1: Fork the repository ────────────────────────────────────────
    log_info "Forking ${GITHUB_REPO} as ${gh_user}/${repo_name}..."
    if gh repo fork "${GITHUB_REPO}" --clone=false --fork-name "${repo_name}" 2>/dev/null; then
        log_info "Repository forked successfully"
    else
        log_warning "Fork may already exist — continuing"
    fi

    # ── Step 2: Clone fork (shallow) into target directory ─────────────────
    log_info "Cloning fork to ${TARGET_DIR}..."
    if [[ -d "$TARGET_DIR" && -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
        log_warning "Target directory not empty, using existing directory"
    else
        gh repo clone "${gh_user}/${repo_name}" "$TARGET_DIR" -- --depth=1 2>/dev/null || \
            git clone --depth=1 "https://github.com/${gh_user}/${repo_name}.git" "$TARGET_DIR"
    fi

    pushd "$TARGET_DIR" > /dev/null || { log_error "Cannot enter $TARGET_DIR"; exit 1; }

    # ── Step 3: Create orphan branch ───────────────────────────────────────
    log_info "Creating orphan branch '${branch}'..."
    git checkout --orphan "$branch"
    # Remove all tracked files from the index (we'll add back only what we need)
    git rm -rf . > /dev/null 2>&1 || true

    # ── Step 4: Populate with bare-minimum files ───────────────────────────
    log_info "Populating ${branch} branch with minimal consumer files..."

    # _config.yml  (remote_theme config)
    create_from_template "config/_config.remote.yml.template" "_config.yml" ""

    # Gemfile  (github-pages + remote theme)
    create_from_template "config/Gemfile.remote.template" "Gemfile" \
        "$(printf 'source \"https://rubygems.org\"\ngem \"github-pages\", group: :jekyll_plugins\ngem \"jekyll-remote-theme\"\n')"

    # index.md  (home page)
    create_from_template "pages/index.md.template" "index.md" ""

    # 404.html
    mkdir -p "$(dirname "404.html")"
    cat > 404.html << 'FOUROHFOUR'
---
layout: default
title: "Page Not Found"
permalink: /404.html
---

# 404 — Page Not Found

The page you're looking for doesn't exist.

[Go Home →]({{ '/' | relative_url }})
FOUROHFOUR

    # pages/ content stubs
    mkdir -p pages/_posts pages/_docs pages/_about

    # Welcome post
    create_from_template "pages/welcome-post.md.template" "pages/_posts/$(date +%Y-%m-%d)-welcome.md" ""

    # About page
    create_from_template "pages/about.md.template" "pages/_about/index.md" ""

    # Docs index
    create_from_template "pages/docs-index.md.template" "pages/_docs/index.md" ""

    # Blog listing page
    create_from_template "pages/blog.md.template" "pages/blog.md" ""

    # Quickstart
    create_from_template "pages/quickstart.md.template" "pages/quickstart.md" ""

    # Admin settings pages
    mkdir -p pages/_about/settings
    local admin_page
    for admin_page in theme config navigation collections analytics environment; do
        create_from_template "pages/admin/${admin_page}.md.template" "pages/_about/settings/${admin_page}.md" ""
    done

    # Navigation data
    mkdir -p _data/navigation
    create_from_template "data/navigation-main.yml.template" "_data/navigation/main.yml" ""

    # Authors data
    create_from_template "data/authors.yml.template" "_data/authors.yml" ""

    # Codespaces / devcontainer support
    install_codespaces_config

    # .gitignore
    cat > .gitignore << 'GITIGNORE'
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
Gemfile.lock
*.gem
GITIGNORE

    # README for the branch
    cat > README.md << EOF
# ${FORK_SITE_NAME:-My Site}

This site is built with [${THEME_DISPLAY_NAME}](${GITHUB_URL}) using \`remote_theme\`.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/${gh_user}/${THEME_NAME}?quickstart=1&ref=${branch})

## Local Development

\`\`\`bash
bundle install
bundle exec jekyll serve
\`\`\`

Visit \`http://localhost:4000/${repo_name}/\` to preview your site.

## GitHub Codespaces

Click the badge above or go to **Code → Codespaces → New codespace** to launch
a browser-based development environment. Jekyll starts automatically and the
site preview opens in a forwarded port.

## Deployment

This branch is configured for GitHub Pages. Enable Pages in your repository
settings and set the source to the \`${branch}\` branch.
EOF

    # ── Step 5: Initial commit ─────────────────────────────────────────────
    # Ensure git user identity is configured (needed on fresh envs / Codespaces)
    if [[ -z "$(git config user.name 2>/dev/null)" ]]; then
        local commit_name="${FORK_AUTHOR:-$(gh api user --jq '.name' 2>/dev/null || echo "${gh_user}")}"
        git config user.name "$commit_name" || log_warning "Could not set git user.name"
    fi
    if [[ -z "$(git config user.email 2>/dev/null)" ]]; then
        local commit_email="${FORK_EMAIL:-$(gh api user --jq '.email' 2>/dev/null || echo "${gh_user}@users.noreply.github.com")}"
        git config user.email "$commit_email" || log_warning "Could not set git user.email"
    fi

    git add -A
    git commit -m "feat: initial site from ${THEME_NAME} remote theme

Bare-minimum GitHub Pages site using remote_theme.
No local theme files — layouts, includes, and assets
are loaded from ${GITHUB_REPO}."

    # ── Step 6: Push the branch ────────────────────────────────────────────
    log_info "Pushing ${branch} branch to origin..."
    git push -u origin "$branch"

    # ── Step 7: Optionally enable GitHub Pages ─────────────────────────────
    if [[ "$NON_INTERACTIVE" != "true" ]]; then
        echo
        read -r -p "Enable GitHub Pages on the '${branch}' branch? (Y/n): " enable_pages
        if [[ ! "$enable_pages" =~ ^[Nn] ]]; then
            log_info "Enabling GitHub Pages..."
            gh api -X PUT "repos/${gh_user}/${repo_name}/pages" \
                --field "source[branch]=${branch}" \
                --field "source[path]=/" 2>/dev/null && \
                log_success "GitHub Pages enabled at https://${gh_user}.github.io/${repo_name}/" || \
                log_warning "Could not enable Pages automatically. Enable it in Settings → Pages."
        fi
    fi

    popd > /dev/null

    echo
    log_success "Remote mode installation completed!"
    log_info "Repository: https://github.com/${gh_user}/${repo_name}"
    log_info "Branch: ${branch}"
    log_info "Site URL: https://${gh_user}.github.io/${repo_name}/"
    echo
    log_info "Next steps:"
    echo "  1. cd ${TARGET_DIR}"
    echo "  2. git checkout ${branch}"
    echo "  3. Edit _config.yml with your site details"
    echo "  4. Create posts in pages/_posts/"
    echo "  5. Push changes — GitHub Pages will rebuild automatically"
    echo
    log_info "The site uses remote_theme — no local theme files to maintain!"
}

# =========================================================================
# Codespaces / Devcontainer — add .devcontainer/ config to target site
# =========================================================================
install_codespaces_config() {
    # In remote mode, always include devcontainer; in other modes, require flag
    if [[ "$INSTALL_MODE" != "remote" && "${INCLUDE_CODESPACES:-false}" != "true" ]]; then
        return 0
    fi

    log_info "Installing GitHub Codespaces configuration..."

    mkdir -p ".devcontainer"

    # Try the template first; fall back to embedded JSON
    if ! create_from_template "config/devcontainer.json.template" ".devcontainer/devcontainer.json" ""; then
        cat > ".devcontainer/devcontainer.json" << 'DEVCONTAINER'
{
  "name": "Jekyll Site",
  "image": "mcr.microsoft.com/devcontainers/jekyll:2-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "bundle install --jobs 4 --retry 3",
  "postStartCommand": "bundle exec jekyll serve --host 0.0.0.0 --port 4000 --livereload &",
  "forwardPorts": [4000, 35729],
  "portsAttributes": {
    "4000": { "label": "Jekyll Site", "onAutoForward": "openBrowser" },
    "35729": { "label": "LiveReload", "onAutoForward": "silent" }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "sissel.shopify-liquid",
        "yzhang.markdown-all-in-one",
        "DavidAnson.vscode-markdownlint"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "files.associations": { "*.html": "liquid" }
      }
    }
  },
  "remoteUser": "vscode"
}
DEVCONTAINER
        log_info "Created .devcontainer/devcontainer.json from fallback"
    fi

    log_success "Codespaces configuration installed"
}

# =========================================================================
# Setup Wizard — install dev-only wizard page and assets
# =========================================================================
install_setup_wizard() {
    if [[ "${WIZARD_ENABLED:-true}" != "true" ]]; then
        return 0
    fi
    log_info "Installing setup wizard page (dev-only)..."

    # Setup page
    create_from_template "pages/setup.html.template" "$TARGET_DIR/pages/setup.html" ""

    # Wizard include
    if [[ -n "$TEMPLATES_DIR" ]] && [[ -d "$TEMPLATES_DIR" ]]; then
        local wizard_src="$SOURCE_DIR/_includes/setup/wizard.html"
        if [[ -f "$wizard_src" ]]; then
            mkdir -p "$TARGET_DIR/_includes/setup"
            cp "$wizard_src" "$TARGET_DIR/_includes/setup/wizard.html"
            log_info "Copied wizard include"
        fi
    fi

    # Wizard JS
    local wizard_js="$SOURCE_DIR/assets/js/setup-wizard.js"
    if [[ -f "$wizard_js" ]]; then
        mkdir -p "$TARGET_DIR/assets/js"
        cp "$wizard_js" "$TARGET_DIR/assets/js/setup-wizard.js"
        log_info "Copied setup-wizard.js"
    fi

    log_success "Setup wizard installed (visible in development mode only)"
}

show_help() {
    cat << EOF
zer0-mistakes Jekyll Theme Installer

USAGE:
    $0 [OPTIONS] [TARGET_DIRECTORY]
    curl -fsSL ${GITHUB_RAW_URL}/install.sh | bash -s -- [OPTIONS]

DESCRIPTION:
    Installs the ${THEME_NAME} Jekyll theme with support for full, minimal, or fork modes.
    Supports both local and remote installation from GitHub.

INSTALLATION MODES:
    --full, -f         Full installation (default) - includes all theme files, Docker support, 
                       Azure workflows, and complete theme structure
    --minimal, -m      Minimal installation - only essential config files and dependencies
                       for users who want to start with a basic Jekyll setup
    --fork             Fork mode - clone/fork repository as a clean starting template
                       with example content removed and configuration reset
    --github           GitHub mode - interactive fork via gh CLI with platform setup
    --remote           Remote mode - fork repo and create a gh-pages branch with only
                       the bare minimum files to render via remote_theme (requires gh CLI)

ARGUMENTS:
    TARGET_DIRECTORY   Directory where theme will be installed (default: current directory)

OPTIONS:
    -f, --full         Full installation (default)
    -m, --minimal      Minimal installation
    --fork             Fork as template (removes example content)
    --github           Interactive GitHub fork via gh CLI
    --remote           Remote fork — gh-pages branch with bare minimum files
    --codespaces       Include .devcontainer/ config for GitHub Codespaces
    --site-name NAME   Set site title (for fork/remote mode)
    --github-user USER Set GitHub username (for fork mode)
    --author NAME      Set author name (for fork mode)
    --email EMAIL      Set contact email (for fork mode)
    --non-interactive  Skip prompts, use defaults/provided values
    -h, --help         Show this help message

EXAMPLES:
    # Full installation (default)
    $0                           # Install in current directory
    $0 my-new-site              # Install in ./my-new-site
    $0 --full /path/to/site     # Install in absolute path
    
    # Minimal installation
    $0 --minimal                # Minimal install in current directory
    $0 -m my-minimal-site       # Minimal install in ./my-minimal-site
    
    # Fork mode (clean template)
    $0 --fork my-site --site-name "My Blog" --github-user "myuser"
    
    # Remote mode (bare minimum gh-pages branch via remote_theme)
    $0 --remote --site-name "My Blog" --github-user "myuser"
    
    # Full install with Codespaces support
    $0 --full --codespaces my-site
    
    # Remote installation
    curl -fsSL ${GITHUB_RAW_URL}/install.sh | bash -s -- --full
    curl -fsSL ${GITHUB_RAW_URL}/install.sh | bash -s -- --fork

FULL INSTALLATION INCLUDES:
    • Configuration: _config.yml, _config_dev.yml, frontmatter.json
    • Dependencies: Gemfile, Rakefile, package.json
    • Docker: docker-compose.yml
    • Theme: _data/, _sass/, _includes/, _layouts/, assets/
    • Static: 404.html, favicon.ico, index.md
    • Content: Starter pages (quickstart, docs, about, blog)
    • Navigation: Working navigation configuration
    • Git: .gitignore with comprehensive rules
    • Azure: .github/workflows/azure-static-web-apps.yml
    • Codespaces: .devcontainer/ (when --codespaces is used)

MINIMAL INSTALLATION INCLUDES:
    • Configuration: _config.yml only
    • Dependencies: Gemfile only
    • Static: Home page with cards
    • Content: Starter pages (quickstart, docs, about, blog)
    • Navigation: Working navigation configuration
    • Git: .gitignore with basic rules

FORK MODE INCLUDES:
    • Complete theme framework (layouts, includes, assets)
    • Configuration reset to placeholder values
    • Example content removed (posts, notebooks, profile)
    • Welcome post created as starting point
    • Analytics IDs cleared
    • Ready for customization

REMOTE MODE INCLUDES:
    • _config.yml with remote_theme referencing ${GITHUB_REPO}
    • Minimal Gemfile (github-pages + jekyll-remote-theme)
    • Starter content pages (home, blog, docs, about, quickstart)
    • Welcome post as a starting point
    • Navigation data
    • .devcontainer/ config for GitHub Codespaces (auto-included)
    • Orphan gh-pages branch (no theme source code)
    • Optional automatic GitHub Pages enablement

UPGRADE PATH:
    You can upgrade from minimal to full installation at any time by running:
    $0 --full [same_directory]

For more information, visit: ${GITHUB_URL}
EOF
}

# Main installation function
main() {
    # Parse command line arguments first
    parse_arguments "$@"
    
    log_info "Starting ${THEME_NAME} Jekyll theme installation"
    log_info "Installation mode: $INSTALL_MODE"
    log_info "Source: $SOURCE_DIR"
    log_info "Target: $TARGET_DIR"
    echo
    
    # Fork mode has a different workflow
    if [[ "$INSTALL_MODE" == "fork" ]]; then
        install_fork_mode
        return $?
    fi

    # GitHub mode — platform detection + gh CLI fork
    if [[ "$INSTALL_MODE" == "github" ]]; then
        install_github_mode
        return $?
    fi

    # Remote mode — fork + orphan gh-pages branch with bare minimum files
    if [[ "$INSTALL_MODE" == "remote" ]]; then
        install_remote_mode
        return $?
    fi
    
    # Download theme files if running remotely
    download_theme_files
    
    # Validation
    validate_source_directory
    validate_target_directory
    echo
    
    # Installation steps based on mode
    install_config_files
    install_build_files
    
    if [[ "$INSTALL_MODE" == "full" ]]; then
        install_docker_files
        install_theme_directories
        install_static_files
        optimize_development_config
        create_azure_static_web_apps_workflow
        create_build_directory
        # Create starter pages and navigation (uses theme navigation if copied, otherwise creates new)
        create_starter_pages
        create_starter_navigation
        # Install interactive setup wizard (dev-only)
        install_setup_wizard
    else
        install_static_files  # This handles minimal index.md creation
        # For minimal installation, still create basic pages and navigation
        create_starter_pages
        create_starter_navigation
    fi
    
    # Codespaces support (when --codespaces flag is used)
    install_codespaces_config
    
    create_gitignore
    create_readme_instructions
    
    echo
    log_success "Installation completed successfully!"
    log_info "Installation mode: $INSTALL_MODE"
    
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        log_info "Next steps:"
        echo "  1. cd $TARGET_DIR"
        echo "  2. Review and customize _config.yml"
        echo "  3. Run 'bundle install && bundle exec jekyll serve'"
        echo "  4. Visit http://localhost:${DEFAULT_PORT} to see your site"
        echo
        log_info "To upgrade to full installation:"
        echo "  $0 --full $TARGET_DIR"
    else
        log_info "Next steps:"
        echo "  1. cd $TARGET_DIR"
        echo "  2. Review and customize _config.yml"
        echo "  3. Run 'docker-compose up' or 'bundle install && bundle exec jekyll serve'"
        echo "  4. Visit http://localhost:${DEFAULT_PORT} to see your site"
    fi
    
    echo
    log_info "For detailed instructions, see INSTALLATION.md"
}

# Fork mode installation - creates a clean template from the repository
install_fork_mode() {
    log_info "Starting fork mode installation..."
    
    # Gather user input if not provided
    if [[ "$NON_INTERACTIVE" != "true" ]]; then
        gather_fork_user_input
    fi
    
    # Check for gh CLI for repository forking
    if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
        log_info "GitHub CLI detected and authenticated"
        fork_with_gh_cli
    else
        log_info "GitHub CLI not available, using clone + cleanup method"
        fork_with_clone
    fi
    
    # Run cleanup and configuration
    run_fork_cleanup
    
    echo
    log_success "Fork mode installation completed successfully!"
    log_info "Your new site: ${FORK_SITE_NAME:-$THEME_NAME}"
    echo
    log_info "Next steps:"
    echo "  1. cd $TARGET_DIR"
    echo "  2. Review _config.yml and customize your site settings"
    echo "  3. Update pages/_about/index.md with your information"
    echo "  4. Run 'docker-compose up' or 'bundle exec jekyll serve'"
    echo "  5. Visit http://localhost:${DEFAULT_PORT} to see your site"
    echo
    log_info "Your site is ready for customization!"
}

# Gather user input for fork mode
gather_fork_user_input() {
    echo
    log_info "Fork mode configuration:"
    echo
    
    if [[ -z "${FORK_SITE_NAME:-}" ]]; then
        read -r -p "Site name [My Jekyll Site]: " FORK_SITE_NAME
        FORK_SITE_NAME="${FORK_SITE_NAME:-My Jekyll Site}"
    fi
    
    if [[ -z "${FORK_GITHUB_USER:-}" ]]; then
        local default_user=""
        if command -v gh &> /dev/null; then
            default_user=$(gh api user --jq '.login' 2>/dev/null || echo "")
        fi
        if [[ -z "$default_user" ]] && command -v git &> /dev/null; then
            default_user=$(git config --global user.name 2>/dev/null || echo "")
        fi
        read -r -p "GitHub username [${default_user:-your-username}]: " FORK_GITHUB_USER
        FORK_GITHUB_USER="${FORK_GITHUB_USER:-${default_user:-your-username}}"
    fi
    
    if [[ -z "${FORK_AUTHOR:-}" ]]; then
        local default_author=""
        if command -v git &> /dev/null; then
            default_author=$(git config --global user.name 2>/dev/null || echo "")
        fi
        read -r -p "Author name [${default_author:-Your Name}]: " FORK_AUTHOR
        FORK_AUTHOR="${FORK_AUTHOR:-${default_author:-Your Name}}"
    fi
    
    if [[ -z "${FORK_EMAIL:-}" ]]; then
        local default_email=""
        if command -v git &> /dev/null; then
            default_email=$(git config --global user.email 2>/dev/null || echo "")
        fi
        read -r -p "Email [${default_email:-your@email.com}]: " FORK_EMAIL
        FORK_EMAIL="${FORK_EMAIL:-${default_email:-your@email.com}}"
    fi
    
    echo
    log_info "Configuration:"
    echo "  Site name: $FORK_SITE_NAME"
    echo "  GitHub user: $FORK_GITHUB_USER"
    echo "  Author: $FORK_AUTHOR"
    echo "  Email: $FORK_EMAIL"
    echo
}

# Fork using GitHub CLI
fork_with_gh_cli() {
    log_info "Forking repository with GitHub CLI..."
    
    # Make TARGET_DIR absolute to avoid path issues later
    if [[ ! "$TARGET_DIR" = /* ]]; then
        TARGET_DIR="$(pwd)/$TARGET_DIR"
    fi
    
    local repo_name="${TARGET_DIR##*/}"
    if [[ "$TARGET_DIR" == "." || -z "$repo_name" ]]; then
        repo_name="${FORK_SITE_NAME:-my-site}"
        repo_name=$(echo "$repo_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
    fi
    
    # Fork the repository
    if gh repo fork "${GITHUB_REPO}" --clone=false 2>/dev/null; then
        log_info "Repository forked to ${FORK_GITHUB_USER:-$(gh api user --jq '.login')}/${repo_name}"
    else
        log_warning "Fork may already exist or fork failed, attempting clone..."
    fi
    
    # Clone the forked repository
    local fork_user="${FORK_GITHUB_USER:-$(gh api user --jq '.login' 2>/dev/null)}"
    local clone_url="https://github.com/${fork_user}/${THEME_NAME}.git"
    
    if [[ ! -d "$TARGET_DIR" || "$(ls -A "$TARGET_DIR" 2>/dev/null)" == "" ]]; then
        log_info "Cloning forked repository..."
        if ! gh repo clone "${fork_user}/${THEME_NAME}" "$TARGET_DIR" 2>/dev/null; then
            # Fallback to original repo clone
            log_warning "Could not clone fork, cloning original repository..."
            gh repo clone "${GITHUB_REPO}" "$TARGET_DIR"
        fi
    else
        log_warning "Target directory not empty, skipping clone"
    fi
}

# Fork using git clone (fallback)
fork_with_clone() {
    log_info "Cloning repository..."
    
    # Make TARGET_DIR absolute to avoid path issues later
    if [[ ! "$TARGET_DIR" = /* ]]; then
        TARGET_DIR="$(pwd)/$TARGET_DIR"
    fi
    
    if [[ ! -d "$TARGET_DIR" ]]; then
        mkdir -p "$TARGET_DIR"
    fi
    
    if [[ "$(ls -A "$TARGET_DIR" 2>/dev/null)" != "" ]]; then
        log_warning "Target directory not empty"
        if [[ "$NON_INTERACTIVE" != "true" ]]; then
            read -r -p "Proceed with clone in existing directory? (y/N): " confirm
            if [[ ! "$confirm" =~ ^[Yy] ]]; then
                log_error "Installation cancelled"
                exit 1
            fi
        fi
    fi
    
    git clone "${GITHUB_URL}.git" "$TARGET_DIR" || {
        log_error "Failed to clone repository"
        exit 1
    }
    
    # Remove origin to disconnect from original repo
    pushd "$TARGET_DIR" > /dev/null || exit 1
    git remote remove origin 2>/dev/null || true
    popd > /dev/null
    log_info "Removed git remote origin (you can add your own)"
}

# Run fork cleanup to remove example content and reset configuration
run_fork_cleanup() {
    log_info "Running fork cleanup..."
    
    # Save current directory and change to target
    pushd "$TARGET_DIR" > /dev/null || {
        log_error "Could not change to target directory: $TARGET_DIR"
        exit 1
    }
    
    # Load removal paths from template if available
    local remove_paths_file=""
    if [[ -f "${SOURCE_DIR}/templates/cleanup/remove-paths.txt" ]]; then
        remove_paths_file="${SOURCE_DIR}/templates/cleanup/remove-paths.txt"
    elif [[ -f "./templates/cleanup/remove-paths.txt" ]]; then
        remove_paths_file="./templates/cleanup/remove-paths.txt"
    fi
    
    if [[ -n "$remove_paths_file" ]]; then
        log_info "Using cleanup paths from: $remove_paths_file"
        while IFS= read -r path || [[ -n "$path" ]]; do
            # Skip comments and empty lines
            [[ -z "$path" || "$path" =~ ^[[:space:]]*# ]] && continue
            path=$(echo "$path" | tr -d '\r' | xargs)
            [[ -z "$path" ]] && continue
            
            if [[ -e "$path" ]]; then
                log_info "Removing: $path"
                rm -rf "$path"
            fi
        done < "$remove_paths_file"
    else
        # Fallback: embedded cleanup paths
        log_info "Using embedded cleanup paths..."
        local cleanup_paths=(
            "pages/_posts/*"
            "pages/_notebooks/*"
            "assets/images/previews/*"
            "CNAME"
            "logs/*"
            "reports/*"
            "_site/*"
            "*.gem"
        )
        
        for path in "${cleanup_paths[@]}"; do
            # Use glob expansion
            for file in $path; do
                if [[ -e "$file" ]]; then
                    log_info "Removing: $file"
                    rm -rf "$file"
                fi
            done
        done
    fi
    
    # Reset configuration
    reset_fork_configuration
    
    # Create welcome post
    create_welcome_post
    
    # Initialize git (if not already)
    if [[ ! -d ".git" ]]; then
        git init
        git add .
        git commit -m "Initial commit from ${THEME_NAME} template"
    fi
    
    log_info "Fork cleanup completed"
    
    # Return to original directory
    popd > /dev/null
}

# Reset configuration files for fork
reset_fork_configuration() {
    log_info "Resetting configuration..."
    
    local config_file="_config.yml"
    if [[ -f "$config_file" ]]; then
        # Create backup
        cp "$config_file" "${config_file}.bak"
        
        # Update configuration values using perl for cross-platform compatibility
        # (BSD sed and GNU sed differ in in-place edit syntax on macOS vs Linux)
        local site_name="${FORK_SITE_NAME:-My Jekyll Site}"
        local site_author="${FORK_AUTHOR:-Site Author}"
        local github_user="${FORK_GITHUB_USER:-your-username}"
        
        perl -pi -e "s/^title[[:space:]]*:.*/title                    : \"${site_name}\"/" "$config_file"
        perl -pi -e 's/^subtitle[[:space:]]*:.*/subtitle                 : "A Jekyll site built with zer0-mistakes"/' "$config_file"
        perl -pi -e "s/^founder[[:space:]]*:.*/founder                  : \"${site_author}\"/" "$config_file"
        perl -pi -e "s/^github_user[[:space:]]*:.*/github_user              : \&github_user \"${github_user}\"/" "$config_file"
        
        # Clear analytics IDs
        perl -pi -e 's/^google_analytics[[:space:]]*:.*/google_analytics         :/' "$config_file"
        perl -pi -e 's/^posthog_api_key[[:space:]]*:.*/posthog_api_key          :/' "$config_file"
        
        log_info "Updated _config.yml"
    fi
    
    # Update authors.yml if exists
    local authors_file="_data/authors.yml"
    if [[ -f "$authors_file" ]]; then
        if templates_available; then
            create_from_template "data/authors.yml.template" "$authors_file"
        else
            cat > "$authors_file" << EOF
# Site Authors Configuration
# Add your author profiles here

${FORK_GITHUB_USER:-your-username}:
  name: "${FORK_AUTHOR:-Your Name}"
  email: "${FORK_EMAIL:-your@email.com}"
  bio: "Add your bio here"
  avatar: "/assets/images/avatar.png"
  links:
    - label: "GitHub"
      icon: "fab fa-github"
      url: "https://github.com/${FORK_GITHUB_USER:-your-username}"
EOF
        fi
        log_info "Updated _data/authors.yml"
    fi
}

# Create a welcome post for fork mode
create_welcome_post() {
    log_info "Creating welcome post..."
    
    local posts_dir="pages/_posts"
    mkdir -p "$posts_dir"
    
    local today=$(date +%Y-%m-%d)
    local post_file="${posts_dir}/${today}-welcome-to-my-site.md"
    
    if templates_available; then
        create_from_template "pages/welcome-post.md.template" "$post_file"
    else
        cat > "$post_file" << EOF
---
title: "Welcome to ${FORK_SITE_NAME:-My Jekyll Site}"
date: ${today}
author: ${FORK_GITHUB_USER:-your-username}
categories: [General]
tags: [welcome, getting-started]
description: "Welcome to my new Jekyll site built with the ${THEME_NAME} theme!"
---

# Welcome!

This is your first post on **${FORK_SITE_NAME:-My Jekyll Site}**. 

This site was created using the [${THEME_NAME}](${GITHUB_URL}) Jekyll theme, which provides:

- 🎨 Modern responsive design with Bootstrap 5
- 🐳 Docker-first development workflow
- 📝 Blog and documentation layouts
- 🔍 Built-in search functionality
- 🎯 SEO optimized

## Getting Started

1. **Edit this post** - Customize or delete this welcome post
2. **Update \_config.yml** - Configure your site settings
3. **Add your content** - Create posts in \`pages/_posts/\`
4. **Customize the theme** - Modify layouts and styles as needed

## Next Steps

- Check out the [documentation](${GITHUB_URL}#readme)
- Explore the theme's features
- Start writing your content!

Happy blogging! 🚀
EOF
    fi
    
    log_info "Created welcome post: $post_file"
}

# Script execution
# Handle both direct execution and curl piping
if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]] || [[ -z "${BASH_SOURCE[0]:-}" ]]; then
    main "$@"
fi