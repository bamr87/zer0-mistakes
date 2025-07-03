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
TARGET_DIR="${1:-$(pwd)}"
THEME_NAME="zer0-mistakes"
GITHUB_REPO="https://github.com/bamr87/zer0-mistakes"
TEMP_DIR=""

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
    
    # Check for essential files
    local required_files=(
        "_config.yml"
        "Gemfile"
        "Rakefile"
        "docker-compose.yml"
        "Dockerfile"
        "404.html"
        "favicon.ico"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$SOURCE_DIR/$file" ]]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    log_success "Source directory validation passed"
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
    copy_file_with_backup "$SOURCE_DIR/_config_dev.yml" "$TARGET_DIR/_config_dev.yml"
    copy_file_with_backup "$SOURCE_DIR/frontmatter.json" "$TARGET_DIR/frontmatter.json"
    
    log_success "Configuration files installed"
}

install_build_files() {
    log_info "Installing build and dependency files..."
    
    copy_file_with_backup "$SOURCE_DIR/Gemfile" "$TARGET_DIR/Gemfile"
    copy_file_with_backup "$SOURCE_DIR/Rakefile" "$TARGET_DIR/Rakefile"
    copy_file_with_backup "$SOURCE_DIR/package.json" "$TARGET_DIR/package.json"
    
    log_success "Build files installed"
}

install_docker_files() {
    log_info "Installing Docker files..."
    
    copy_file_with_backup "$SOURCE_DIR/docker-compose.yml" "$TARGET_DIR/docker-compose.yml"
    copy_file_with_backup "$SOURCE_DIR/Dockerfile" "$TARGET_DIR/Dockerfile"
    
    log_success "Docker files installed"
}

install_theme_directories() {
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
    log_info "Installing static files..."
    
    copy_file_with_backup "$SOURCE_DIR/404.html" "$TARGET_DIR/404.html"
    copy_file_with_backup "$SOURCE_DIR/favicon.ico" "$TARGET_DIR/favicon.ico"
    
    # Copy index.md if it doesn't exist in target
    if [[ ! -f "$TARGET_DIR/index.md" ]]; then
        copy_file_with_backup "$SOURCE_DIR/index.md" "$TARGET_DIR/index.md"
    else
        log_warning "index.md already exists in target, skipping to preserve content"
    fi
    
    log_success "Static files installed"
}

create_gitignore() {
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

create_readme_instructions() {
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
- \`_config_dev.yml\` - Development configuration
- \`_data/\` - Site data files
- \`_includes/\` - Reusable template components
- \`_layouts/\` - Page layouts
- \`_sass/\` - Sass stylesheets
- \`assets/\` - Static assets (images, JS, CSS)
- \`build/\` - Build logs and temporary files
- \`.github/workflows/\` - GitHub Actions for Azure deployment

## Support

For issues and documentation, visit: https://github.com/bamr87/zer0-mistakes

---
Installed on: $(date)
Theme Version: zer0-mistakes
Azure Static Web Apps: Ready
"
    
    if [[ ! -f "$TARGET_DIR/INSTALLATION.md" ]]; then
        echo "$readme_content" > "$TARGET_DIR/INSTALLATION.md"
        log_info "Created INSTALLATION.md"
    fi
    
    log_success "Installation instructions created"
}

create_azure_static_web_apps_workflow() {
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

create_build_directory() {
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
    $0 [TARGET_DIRECTORY]
    curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

DESCRIPTION:
    Installs the zer0-mistakes Jekyll theme by copying essential files
    and creating the necessary directory structure. Supports both local
    and remote installation from GitHub.

ARGUMENTS:
    TARGET_DIRECTORY    Directory where theme will be installed (default: current directory)

OPTIONS:
    -h, --help         Show this help message

EXAMPLES:
    $0                    # Install in current directory
    $0 my-new-site       # Install in ./my-new-site
    $0 /path/to/site     # Install in absolute path
    
    # Remote installation
    curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

FILES INSTALLED:
    • Configuration: _config.yml, _config_dev.yml, frontmatter.json
    • Dependencies: Gemfile, Rakefile, package.json
    • Docker: docker-compose.yml, Dockerfile
    • Theme: _data/, _sass/, _includes/, _layouts/, assets/
    • Static: 404.html, favicon.ico, index.md (if not exists)
    • Git: .gitignore (if not exists)
    • Azure: .github/workflows/azure-static-web-apps.yml
    • Build: build/ directory with logs
    • Docs: INSTALLATION.md

For more information, visit: https://github.com/bamr87/zer0-mistakes
EOF
}

# Main installation function
main() {
    # Check for help flag
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    log_info "Starting zer0-mistakes Jekyll theme installation"
    log_info "Source: $SOURCE_DIR"
    log_info "Target: $TARGET_DIR"
    echo
    
    # Download theme files if running remotely
    download_theme_files
    
    # Validation
    validate_source_directory
    validate_target_directory
    echo
    
    # Installation steps
    install_config_files
    install_build_files
    install_docker_files
    install_theme_directories
    install_static_files
    create_gitignore
    create_readme_instructions
    create_azure_static_web_apps_workflow
    create_build_directory
    
    echo
    log_success "Installation completed successfully!"
    log_info "Next steps:"
    echo "  1. cd $TARGET_DIR"
    echo "  2. Review and customize _config.yml"
    echo "  3. Run 'docker-compose up' or 'bundle install && bundle exec jekyll serve'"
    echo "  4. Visit http://localhost:4000 to see your site"
    echo
    log_info "For detailed instructions, see INSTALLATION.md"
}

# Script execution
# Handle both direct execution and curl piping
if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]] || [[ -z "${BASH_SOURCE[0]:-}" ]]; then
    main "$@"
fi