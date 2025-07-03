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

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"
TARGET_DIR="${1:-$(pwd)}"
THEME_NAME="zer0-mistakes"

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
- \`pages/\` - Your site pages

## Support

For issues and documentation, visit: https://github.com/bamr87/zer0-mistakes

---
Installed on: $(date)
Theme Version: zer0-mistakes
"
    
    if [[ ! -f "$TARGET_DIR/INSTALLATION.md" ]]; then
        echo "$readme_content" > "$TARGET_DIR/INSTALLATION.md"
        log_info "Created INSTALLATION.md"
    fi
    
    log_success "Installation instructions created"
}

# Help function
show_help() {
    cat << EOF
zer0-mistakes Jekyll Theme Installer

USAGE:
    $0 [TARGET_DIRECTORY]

DESCRIPTION:
    Installs the zer0-mistakes Jekyll theme by copying essential files
    and creating the necessary directory structure.

ARGUMENTS:
    TARGET_DIRECTORY    Directory where theme will be installed (default: current directory)

OPTIONS:
    -h, --help         Show this help message

EXAMPLES:
    $0                    # Install in current directory
    $0 my-new-site       # Install in ./my-new-site
    $0 /path/to/site     # Install in absolute path

FILES INSTALLED:
    • Configuration: _config.yml, _config_dev.yml, frontmatter.json
    • Dependencies: Gemfile, Rakefile, package.json
    • Docker: docker-compose.yml, Dockerfile
    • Theme: _data/, _sass/, _includes/, _layouts/, assets/
    • Static: 404.html, favicon.ico, index.md (if not exists)
    • Git: .gitignore (if not exists)
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
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi