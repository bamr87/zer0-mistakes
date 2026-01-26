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

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =========================================================================
# Template Rendering Functions
# =========================================================================

# Render a template file, replacing {{VAR_NAME}} placeholders
# Usage: render_template "template_file" ["output_file"]
render_template() {
    local template_file="$1"
    local output_file="${2:-}"
    
    if [[ ! -f "$template_file" ]]; then
        return 1
    fi
    
    local content
    content=$(cat "$template_file")
    
    # Replace all known placeholders
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
        -e "s|{{SITE_TITLE}}|${FORK_SITE_NAME:-${SITE_TITLE:-My Jekyll Site}}|g" \
        -e "s|{{SITE_DESCRIPTION}}|${SITE_DESCRIPTION:-A Jekyll site built with ${THEME_NAME}}|g" \
        -e "s|{{SITE_AUTHOR}}|${FORK_AUTHOR:-${SITE_AUTHOR:-Site Author}}|g" \
        -e "s|{{SITE_EMAIL}}|${FORK_EMAIL:-${SITE_EMAIL:-your@email.com}}|g" \
        -e "s|{{CURRENT_DATE}}|$(date +%Y-%m-%d)|g" \
        -e "s|{{CURRENT_YEAR}}|$(date +%Y)|g")
    
    if [[ -n "$output_file" ]]; then
        mkdir -p "$(dirname "$output_file")"
        echo "$content" > "$output_file"
    else
        echo "$content"
    fi
}

# Create a file from template with automatic fallback to embedded content
# Usage: create_from_template "template_path" "output_file" "fallback_content"
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
    if [[ -n "$TEMPLATES_DIR" ]] && [[ -f "$TEMPLATES_DIR/$template_path" ]]; then
        render_template "$TEMPLATES_DIR/$template_path" "$output_file"
        log_info "Created $(basename "$output_file") from template"
        return 0
    fi
    
    # Try to fetch from GitHub for remote installs
    if [[ "$REMOTE_INSTALL" == "true" ]]; then
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

# Check if templates are available
templates_available() {
    [[ -n "$TEMPLATES_DIR" ]] && [[ -d "$TEMPLATES_DIR" ]]
}

# =========================================================================

# Configuration - moved after logging functions to avoid undefined function calls
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd 2>/dev/null || echo "$(pwd)")"
SOURCE_DIR="$SCRIPT_DIR"
TARGET_DIR=""
TEMP_DIR=""
TEMPLATES_DIR=""

# Try to load configuration from templates/config/install.conf
_load_install_config() {
    local config_paths=(
        "$SCRIPT_DIR/templates/config/install.conf"
        "$SOURCE_DIR/templates/config/install.conf"
    )
    
    for config_path in "${config_paths[@]}"; do
        if [[ -f "$config_path" ]]; then
            # shellcheck source=/dev/null
            source "$config_path"
            TEMPLATES_DIR="$(dirname "$(dirname "$config_path")")"
            return 0
        fi
    done
    
    # Fallback defaults when templates not available
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
    return 1
}

# Load configuration
_load_install_config

# Installation mode
INSTALL_MODE="${DEFAULT_INSTALL_MODE:-full}"

# User-provided values for fork mode
SITE_TITLE=""
SITE_AUTHOR=""
SITE_EMAIL=""
FORK_GITHUB_USER=""

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
            --site-name)
                FORK_SITE_NAME="$2"
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

# File copying functions
copy_file_with_backup() {
    local src="$1"
    local dest="$2"
    local relative_path="${dest#$TARGET_DIR/}"
    
    # Create destination directory if it doesn't exist
    mkdir -p "$(dirname "$dest")"
    
    # Backup existing file if it exists
    if [[ -f "$dest" ]]; then
        local backup_file="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
        log_warning "File exists, creating backup: $relative_path -> ${backup_file##*/}"
        cp "$dest" "$backup_file"
    fi
    
    # Copy the file
    cp "$src" "$dest"
    log_info "Copied: $relative_path"
}

copy_directory_with_backup() {
    local src="$1"
    local dest="$2"
    local relative_path="${dest#$TARGET_DIR/}"
    
    if [[ -d "$dest" ]]; then
        local backup_dir="${dest}.backup.$(date +%Y%m%d_%H%M%S)"
        log_warning "Directory exists, creating backup: $relative_path -> ${backup_dir##*/}"
        cp -r "$dest" "$backup_dir"
        rm -rf "$dest"
    fi
    
    cp -r "$src" "$dest"
    log_info "Copied directory: $relative_path"
}

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
    
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
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
# gem "github-pages", group: :jekyll_plugins'
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
gem "commonmarker", "'"${COMMONMARKER_VERSION}"'"  # Fixed version to avoid compatibility issues'
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

create_starter_pages() {
    log_info "Creating essential starter pages..."
    
    # Create pages directory
    mkdir -p "$TARGET_DIR/pages"
    
    # Create Quick Start page
    create_quickstart_page
    
    # Create Docs index page
    create_docs_page
    
    # Create About page
    create_about_page
    
    # Create Blog page
    create_blog_page
    
    log_success "Starter pages created"
}

create_quickstart_page() {
    mkdir -p "$TARGET_DIR/pages/quickstart"
    
    local fallback_content='---
layout: default
title: Quick Start
permalink: /quickstart/
---

# Quick Start Guide

Get your site up and running in just a few minutes!

## Prerequisites

Before you begin, make sure you have:

- **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop))
- **Git** installed ([download](https://git-scm.com/))

## 1. Start Development Server

### Using Docker (Recommended)

```bash
docker-compose up
```

Your site will be available at **'"${DEFAULT_URL}"'**

### Using Local Ruby

```bash
bundle install
bundle exec jekyll serve
```

## 2. Customize Your Site

Edit `_config.yml` to personalize your site:

```yaml
title: Your Site Title
description: Your site description
author: Your Name
```

## 3. Add Content

- Create posts in `pages/_posts/`
- Create documentation in `pages/_docs/`
- Add static pages in `pages/`

## Next Steps

- [Read the Documentation](/docs/) - Learn about all features
- [Explore Configuration](/docs/configuration/) - Customize your site
- [Learn about Layouts](/docs/layouts/) - Understand page layouts

---

Need help? Check the [troubleshooting guide](/docs/troubleshooting/) or [open an issue]('"${GITHUB_URL}"'/issues).'

    create_from_template "pages/quickstart.md.template" "$TARGET_DIR/pages/quickstart/index.md" "$fallback_content"
}

create_docs_page() {
    mkdir -p "$TARGET_DIR/pages/_docs"
    mkdir -p "$TARGET_DIR/pages/_docs/configuration"
    
    local docs_index_fallback='---
layout: default
title: Documentation
permalink: /docs/
---

# Documentation

Welcome to the '"${THEME_NAME}"' theme documentation. Here you'\''ll find everything you need to build and customize your Jekyll site.

## Getting Started

<div class="row">
<div class="col-md-6 mb-3">

### Installation

The theme supports multiple installation methods:

- **Docker** (Recommended) - Zero dependencies
- **Remote Theme** - For GitHub Pages
- **Gem** - Traditional Ruby installation

[View Installation Guide →](/quickstart/)

</div>
<div class="col-md-6 mb-3">

### Configuration

Customize your site with `_config.yml`:

- Site title and description
- Navigation menus
- Social links
- Analytics integration

[View Configuration Guide →](/docs/configuration/)

</div>
</div>

## Need Help?

- [Troubleshooting Guide](/docs/troubleshooting/)
- [GitHub Issues]('"${GITHUB_URL}"'/issues)
- [GitHub Discussions]('"${GITHUB_URL}"'/discussions)'

    create_from_template "pages/docs-index.md.template" "$TARGET_DIR/pages/_docs/index.md" "$docs_index_fallback"
    
    # Create configuration page
    create_from_template "pages/configuration.md.template" "$TARGET_DIR/pages/_docs/configuration/index.md" ""
    
    # Create troubleshooting page
    create_from_template "pages/troubleshooting.md.template" "$TARGET_DIR/pages/_docs/troubleshooting.md" ""
}

create_about_page() {
    mkdir -p "$TARGET_DIR/pages/_about"
    
    local fallback_content='---
layout: default
title: About
permalink: /about/
---

# About This Site

This site is built with the **'"${THEME_DISPLAY_NAME}"'** - a professional Jekyll theme designed for GitHub Pages with Bootstrap 5.3.

## Theme Features

- ✅ Bootstrap 5.3 integration
- ✅ Dark/Light mode toggle
- ✅ Docker support
- ✅ GitHub Pages compatible
- ✅ SEO optimized

## Learn More

- [Theme Documentation](/docs/)
- [GitHub Repository]('"${GITHUB_URL}"')
- [Report an Issue]('"${GITHUB_URL}"'/issues)

## Customizing This Page

Edit `pages/_about/index.md` to customize this page with your own content.'

    create_from_template "pages/about.md.template" "$TARGET_DIR/pages/_about/index.md" "$fallback_content"
}

create_blog_page() {
    local fallback_content='---
layout: default
title: Blog
permalink: /blog/
---

# Blog

Welcome to the blog. Create your first post to get started!

## Creating Posts

Create markdown files in `pages/_posts/` with the format:

```
YYYY-MM-DD-your-post-title.md
```

## Recent Posts

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%B %d, %Y" }}
{% endfor %}

{% if site.posts.size == 0 %}
*No posts yet. Create your first post to see it here!*
{% endif %}'

    create_from_template "pages/blog.md.template" "$TARGET_DIR/pages/blog.md" "$fallback_content"
}

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

create_site_gemfile() {
    log_info "Creating site-appropriate Gemfile..."
    
    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        cat > "$TARGET_DIR/Gemfile" << 'EOF'
source "https://rubygems.org"

# Jekyll and essential plugins
gem "jekyll", "~> 4.3"
gem "jekyll-feed"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"

# Platform compatibility
gem "ffi", "~> 1.17.0"
gem "webrick", "~> 1.7"

# GitHub Pages compatibility (uncomment for GitHub Pages)
# gem "github-pages", group: :jekyll_plugins
EOF
    else
        cat > "$TARGET_DIR/Gemfile" << 'EOF'
source "https://rubygems.org"

# GitHub Pages gem includes Jekyll and compatible plugins
gem "github-pages", group: :jekyll_plugins

# Essential plugins (already included in github-pages but listed for clarity)
gem "jekyll-remote-theme"
gem "jekyll-feed"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"
gem "jekyll-paginate"

# Platform compatibility and performance
gem "ffi", "~> 1.17.0"
gem "webrick", "~> 1.7"
gem "commonmarker", "0.23.10"  # Fixed version to avoid compatibility issues
EOF
    fi
    
    log_info "Created Gemfile for ${INSTALL_MODE} installation"
}

update_docker_compose_config() {
    log_info "Updating Docker Compose configuration..."
    
    local docker_config="$TARGET_DIR/docker-compose.yml"
    
    # Read the current docker-compose.yml and add environment variable
    if [[ -f "$docker_config" ]]; then
        # Check if PAGES_REPO_NWO is already present
        if ! grep -q "PAGES_REPO_NWO" "$docker_config"; then
            # Add the environment variable
            sed -i.bak '/JEKYLL_ENV: development/a\
      PAGES_REPO_NWO: "bamr87/zer0-mistakes"' "$docker_config"
            rm -f "${docker_config}.bak"
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

ARGUMENTS:
    TARGET_DIRECTORY   Directory where theme will be installed (default: current directory)

OPTIONS:
    -f, --full         Full installation (default)
    -m, --minimal      Minimal installation
    --fork             Fork as template (removes example content)
    --site-name NAME   Set site title (for fork mode)
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
    else
        install_static_files  # This handles minimal index.md creation
        # For minimal installation, still create basic pages and navigation
        create_starter_pages
        create_starter_navigation
    fi
    
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
        log_warn "Fork may already exist or fork failed, attempting clone..."
    fi
    
    # Clone the forked repository
    local fork_user="${FORK_GITHUB_USER:-$(gh api user --jq '.login' 2>/dev/null)}"
    local clone_url="https://github.com/${fork_user}/${THEME_NAME}.git"
    
    if [[ ! -d "$TARGET_DIR" || "$(ls -A "$TARGET_DIR" 2>/dev/null)" == "" ]]; then
        log_info "Cloning forked repository..."
        if ! gh repo clone "${fork_user}/${THEME_NAME}" "$TARGET_DIR" 2>/dev/null; then
            # Fallback to original repo clone
            log_warn "Could not clone fork, cloning original repository..."
            gh repo clone "${GITHUB_REPO}" "$TARGET_DIR"
        fi
    else
        log_warn "Target directory not empty, skipping clone"
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
        log_warn "Target directory not empty"
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
        
        # Update configuration values using sed
        # Note: Patterns handle various YAML formats (with/without spaces, quotes, etc.)
        sed -i.tmp "s/^title[[:space:]]*:.*/title                    : \"${FORK_SITE_NAME:-My Jekyll Site}\"/" "$config_file"
        sed -i.tmp "s/^subtitle[[:space:]]*:.*/subtitle                 : \"A Jekyll site built with zer0-mistakes\"/" "$config_file"
        sed -i.tmp "s/^founder[[:space:]]*:.*/founder                  : \"${FORK_AUTHOR:-Site Author}\"/" "$config_file"
        sed -i.tmp "s/^github_user[[:space:]]*:.*/github_user              : \&github_user \"${FORK_GITHUB_USER:-your-username}\"/" "$config_file"
        
        # Clear analytics IDs
        sed -i.tmp "s/^google_analytics[[:space:]]*:.*/google_analytics         :/" "$config_file"
        sed -i.tmp "s/^posthog_api_key[[:space:]]*:.*/posthog_api_key          :/" "$config_file"
        
        rm -f "${config_file}.tmp"
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