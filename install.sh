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

# Configuration - moved after logging functions to avoid undefined function calls
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd 2>/dev/null || echo "$(pwd)")"
SOURCE_DIR="$SCRIPT_DIR"
TARGET_DIR=""
THEME_NAME="zer0-mistakes"
GITHUB_REPO="https://github.com/bamr87/zer0-mistakes"
TEMP_DIR=""
INSTALL_MODE="full"  # Default to full installation

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

create_minimal_index() {
    if [[ ! -f "$TARGET_DIR/index.md" ]]; then
        cat > "$TARGET_DIR/index.md" << 'EOF'
---
layout: default
title: Welcome
---

# Welcome to Your Jekyll Site

This site was created using the zer0-mistakes theme minimal installation.

## Getting Started

1. Install Jekyll dependencies: `bundle install`
2. Start the development server: `bundle exec jekyll serve`
3. Visit your site at: http://localhost:4000

## Next Steps

- Customize your `_config.yml` file
- Add content to your site
- Consider upgrading to a full installation for more features

For full theme features, run the installer with the `--full` flag.
EOF
        log_info "Created minimal index.md"
    else
        log_warning "index.md already exists, skipping to preserve content"
    fi
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
    curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- [OPTIONS]

DESCRIPTION:
    Installs the zer0-mistakes Jekyll theme with support for full or minimal installation modes.
    Supports both local and remote installation from GitHub.

INSTALLATION MODES:
    --full, -f         Full installation (default) - includes all theme files, Docker support, 
                       Azure workflows, and complete theme structure
    --minimal, -m      Minimal installation - only essential config files and dependencies
                       for users who want to start with a basic Jekyll setup

ARGUMENTS:
    TARGET_DIRECTORY   Directory where theme will be installed (default: current directory)

OPTIONS:
    -f, --full         Full installation (default)
    -m, --minimal      Minimal installation
    -h, --help         Show this help message

EXAMPLES:
    # Full installation (default)
    $0                           # Install in current directory
    $0 my-new-site              # Install in ./my-new-site
    $0 --full /path/to/site     # Install in absolute path
    
    # Minimal installation
    $0 --minimal                # Minimal install in current directory
    $0 -m my-minimal-site       # Minimal install in ./my-minimal-site
    
    # Remote installation
    curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full
    curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --minimal

FULL INSTALLATION INCLUDES:
    • Configuration: _config.yml, _config_dev.yml, frontmatter.json
    • Dependencies: Gemfile, Rakefile, package.json
    • Docker: docker-compose.yml
    • Theme: _data/, _sass/, _includes/, _layouts/, assets/
    • Static: 404.html, favicon.ico, index.md
    • Git: .gitignore with comprehensive rules
    • Azure: .github/workflows/azure-static-web-apps.yml
    • Build: build/ directory with logs
    • Docs: Complete INSTALLATION.md

MINIMAL INSTALLATION INCLUDES:
    • Configuration: _config.yml only
    • Dependencies: Gemfile only
    • Static: Basic index.md
    • Git: .gitignore with basic rules
    • Docs: Minimal INSTALLATION.md with upgrade instructions

UPGRADE PATH:
    You can upgrade from minimal to full installation at any time by running:
    $0 --full [same_directory]

For more information, visit: https://github.com/bamr87/zer0-mistakes
EOF
}

# Main installation function
main() {
    # Parse command line arguments first
    parse_arguments "$@"
    
    log_info "Starting zer0-mistakes Jekyll theme installation"
    log_info "Installation mode: $INSTALL_MODE"
    log_info "Source: $SOURCE_DIR"
    log_info "Target: $TARGET_DIR"
    echo
    
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
    else
        install_static_files  # This handles minimal index.md creation
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
        echo "  4. Visit http://localhost:4000 to see your site"
        echo
        log_info "To upgrade to full installation:"
        echo "  $0 --full $TARGET_DIR"
    else
        log_info "Next steps:"
        echo "  1. cd $TARGET_DIR"
        echo "  2. Review and customize _config.yml"
        echo "  3. Run 'docker-compose up' or 'bundle install && bundle exec jekyll serve'"
        echo "  4. Visit http://localhost:4000 to see your site"
    fi
    
    echo
    log_info "For detailed instructions, see INSTALLATION.md"
}

# Script execution
# Handle both direct execution and curl piping
if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]] || [[ -z "${BASH_SOURCE[0]:-}" ]]; then
    main "$@"
fi