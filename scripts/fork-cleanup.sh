#!/bin/bash

# =========================================================================
# Zer0-Mistakes Fork Cleanup Script
# =========================================================================
# Prepares a freshly forked/cloned repository as a clean starting template
# by removing example content and resetting configuration to placeholders.
#
# Usage:
#   ./scripts/fork-cleanup.sh [options]
#
# Options:
#   --site-name NAME       Set site title
#   --github-user USER     Set GitHub username
#   --author NAME          Set author name
#   --email EMAIL          Set contact email
#   --dry-run              Preview changes without making them
#   --non-interactive      Skip prompts, use defaults/provided values
#   -h, --help             Show this help message
#
# This script can be run:
#   1. After using "Use this template" button on GitHub
#   2. After manually forking the repository
#   3. Via install.sh --fork mode
# =========================================================================

set -euo pipefail

# -------------------------------------------------------------------------
# Script Setup
# -------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source libraries
if [[ -f "$SCRIPT_DIR/lib/common.sh" ]]; then
    source "$SCRIPT_DIR/lib/common.sh"
else
    # Minimal logging if common.sh not available
    info() { echo "[INFO] $1"; }
    warn() { echo "[WARNING] $1"; }
    error() { echo "[ERROR] $1" >&2; exit 1; }
    success() { echo "[SUCCESS] $1"; }
    debug() { [[ "${VERBOSE:-false}" == "true" ]] && echo "[DEBUG] $1" || true; }
fi

if [[ -f "$SCRIPT_DIR/lib/template.sh" ]]; then
    source "$SCRIPT_DIR/lib/template.sh"
fi

# -------------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------------

# Default values
SITE_TITLE="My Jekyll Site"
SITE_DESCRIPTION="A Jekyll site built with zer0-mistakes theme"
SITE_AUTHOR="Site Author"
SITE_EMAIL="your@email.com"
GITHUB_USER_INPUT=""

# Flags
DRY_RUN="${DRY_RUN:-false}"
INTERACTIVE="${INTERACTIVE:-true}"
VERBOSE="${VERBOSE:-false}"

# Paths
TEMPLATES_DIR="$REPO_ROOT/templates"
REMOVE_PATHS_FILE="$TEMPLATES_DIR/cleanup/remove-paths.txt"

# -------------------------------------------------------------------------
# Argument Parsing
# -------------------------------------------------------------------------

show_help() {
    cat << 'EOF'
Zer0-Mistakes Fork Cleanup Script

Prepares a freshly forked repository as a clean starting template.

Usage:
    ./scripts/fork-cleanup.sh [options]

Options:
    --site-name NAME       Set site title (default: "My Jekyll Site")
    --github-user USER     Set GitHub username for repository
    --author NAME          Set author name (default: "Site Author")
    --email EMAIL          Set contact email
    --dry-run              Preview changes without making them
    --non-interactive      Skip prompts, use provided values
    -v, --verbose          Enable verbose output
    -h, --help             Show this help message

Examples:
    # Interactive mode (will prompt for values)
    ./scripts/fork-cleanup.sh

    # Non-interactive with values
    ./scripts/fork-cleanup.sh --non-interactive \
        --site-name "My Blog" \
        --github-user "myusername" \
        --author "John Doe"

    # Preview what would be removed
    ./scripts/fork-cleanup.sh --dry-run
EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --site-name)
                SITE_TITLE="$2"
                shift 2
                ;;
            --github-user)
                GITHUB_USER_INPUT="$2"
                shift 2
                ;;
            --author)
                SITE_AUTHOR="$2"
                shift 2
                ;;
            --email)
                SITE_EMAIL="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1. Use --help for usage."
                ;;
        esac
    done
}

# -------------------------------------------------------------------------
# User Input
# -------------------------------------------------------------------------

prompt_user_values() {
    if [[ "$INTERACTIVE" != "true" ]]; then
        return 0
    fi
    
    echo ""
    echo "🧹 Zer0-Mistakes Fork Cleanup"
    echo "=============================="
    echo ""
    echo "This will clean up example content and configure your site."
    echo "Press Enter to accept defaults shown in [brackets]."
    echo ""
    
    # Site title
    read -r -p "Site title [$SITE_TITLE]: " input
    SITE_TITLE="${input:-$SITE_TITLE}"
    
    # GitHub username
    local default_gh_user="${GITHUB_USER_INPUT:-$(git config user.name 2>/dev/null || echo "your-username")}"
    read -r -p "GitHub username [$default_gh_user]: " input
    GITHUB_USER_INPUT="${input:-$default_gh_user}"
    
    # Author name
    local default_author="${SITE_AUTHOR:-$(git config user.name 2>/dev/null || echo "Site Author")}"
    read -r -p "Author name [$default_author]: " input
    SITE_AUTHOR="${input:-$default_author}"
    
    # Email
    local default_email="${SITE_EMAIL:-$(git config user.email 2>/dev/null || echo "your@email.com")}"
    read -r -p "Contact email [$default_email]: " input
    SITE_EMAIL="${input:-$default_email}"
    
    # Site description
    read -r -p "Site description [$SITE_DESCRIPTION]: " input
    SITE_DESCRIPTION="${input:-$SITE_DESCRIPTION}"
    
    echo ""
    echo "Configuration:"
    echo "  Site title:    $SITE_TITLE"
    echo "  GitHub user:   $GITHUB_USER_INPUT"
    echo "  Author:        $SITE_AUTHOR"
    echo "  Email:         $SITE_EMAIL"
    echo "  Description:   $SITE_DESCRIPTION"
    echo ""
    
    if [[ "$DRY_RUN" != "true" ]]; then
        read -r -p "Proceed with cleanup? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            exit 0
        fi
    fi
}

# -------------------------------------------------------------------------
# Cleanup Functions
# -------------------------------------------------------------------------

# Read paths from remove-paths.txt
get_remove_paths() {
    local paths=()
    
    if [[ -f "$REMOVE_PATHS_FILE" ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip comments and empty lines
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "${line// }" ]] && continue
            paths+=("$line")
        done < "$REMOVE_PATHS_FILE"
    else
        # Fallback hardcoded list
        paths=(
            "pages/_posts"
            "pages/_notebooks"
            "pages/_about/profile"
            "pages/_about/stats.md"
            "assets/images/previews"
            "assets/images/gravatar.png"
            "assets/images/gravatar-small.png"
            "_data/content_statistics.yml"
            "CNAME"
            "jekyll-theme-zer0-*.gem"
            "_site"
            "logs"
            "reports"
            "vendor"
        )
    fi
    
    printf '%s\n' "${paths[@]}"
}

# Remove example content
remove_example_content() {
    info "Removing example content..."
    
    local count=0
    while IFS= read -r path; do
        local full_path="$REPO_ROOT/$path"
        
        # Handle glob patterns
        if [[ "$path" == *"*"* ]]; then
            # shellcheck disable=SC2086
            for match in $full_path; do
                if [[ -e "$match" ]]; then
                    if [[ "$DRY_RUN" == "true" ]]; then
                        echo "  [DRY RUN] Would remove: ${match#$REPO_ROOT/}"
                    else
                        rm -rf "$match"
                        debug "Removed: ${match#$REPO_ROOT/}"
                    fi
                    ((count++)) || true
                fi
            done
        elif [[ -e "$full_path" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                echo "  [DRY RUN] Would remove: $path"
            else
                rm -rf "$full_path"
                debug "Removed: $path"
            fi
            ((count++)) || true
        else
            debug "Path not found, skipping: $path"
        fi
    done < <(get_remove_paths)
    
    info "Removed $count items"
}

# Create starter posts directory with welcome post
create_welcome_post() {
    info "Creating welcome post..."
    
    local posts_dir="$REPO_ROOT/pages/_posts"
    local post_date
    post_date=$(date +%Y-%m-%d)
    local post_file="$posts_dir/${post_date}-welcome.md"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY RUN] Would create: pages/_posts/${post_date}-welcome.md"
        return 0
    fi
    
    mkdir -p "$posts_dir"
    
    # Use template if available
    if [[ -f "$TEMPLATES_DIR/pages/welcome-post.md.template" ]]; then
        # Set template variables
        set_template_var "SITE_AUTHOR" "$SITE_AUTHOR"
        set_template_var "CURRENT_DATE" "$post_date"
        render_template "$TEMPLATES_DIR/pages/welcome-post.md.template" "$post_file"
    else
        # Fallback embedded content
        cat > "$post_file" << EOF
---
layout: journals
title: "Welcome to Your New Site"
date: $post_date
categories: [General]
tags: [welcome, getting-started]
author: $SITE_AUTHOR
description: "Your first blog post on your new Jekyll site"
---

# Welcome!

This is your first blog post. Congratulations on setting up your new Jekyll site!

## Getting Started

1. **Customize your site** - Edit \`_config.yml\` to set your site title and settings
2. **Add more posts** - Create new files in \`pages/_posts/\`
3. **Create documentation** - Add pages to \`pages/_docs/\`
4. **Personalize the theme** - Modify styles in \`_sass/custom.scss\`

Happy writing! 🚀
EOF
    fi
    
    info "Created welcome post"
}

# Reset _config.yml with placeholder values
reset_config() {
    info "Resetting _config.yml..."
    
    local config_file="$REPO_ROOT/_config.yml"
    
    if [[ ! -f "$config_file" ]]; then
        warn "_config.yml not found"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY RUN] Would update _config.yml with new values"
        return 0
    fi
    
    # Create backup
    cp "$config_file" "${config_file}.backup.$(date +%Y%m%d%H%M%S)"
    
    # Use sed to replace specific values
    # Site identity
    sed -i.tmp "s/^founder:.*/founder: \"$SITE_AUTHOR\"/" "$config_file"
    sed -i.tmp "s/^github_user:.*/github_user: \"$GITHUB_USER_INPUT\"/" "$config_file"
    sed -i.tmp "s/^title:.*/title: \"$SITE_TITLE\"/" "$config_file"
    sed -i.tmp "s/^description:.*/description: \"$SITE_DESCRIPTION\"/" "$config_file"
    sed -i.tmp "s/^author:.*/author: \"$SITE_AUTHOR\"/" "$config_file"
    sed -i.tmp "s/^email:.*/email: \"$SITE_EMAIL\"/" "$config_file"
    sed -i.tmp "s/^name:.*/name: \"$SITE_AUTHOR\"/" "$config_file"
    
    # Clear analytics
    sed -i.tmp "s/^google_analytics:.*/google_analytics: \"\"/" "$config_file"
    
    # Clear domain for auto-detection
    sed -i.tmp "s/^domain:.*/domain: \"\"/" "$config_file"
    sed -i.tmp "s/^url:.*/url: \"\"/" "$config_file"
    
    # Clean up temp files
    rm -f "${config_file}.tmp"
    
    info "Updated _config.yml"
}

# Reset _data/authors.yml
reset_authors() {
    info "Resetting _data/authors.yml..."
    
    local authors_file="$REPO_ROOT/_data/authors.yml"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY RUN] Would reset _data/authors.yml"
        return 0
    fi
    
    mkdir -p "$(dirname "$authors_file")"
    
    # Use template if available
    if [[ -f "$TEMPLATES_DIR/data/authors.yml.template" ]]; then
        set_template_var "SITE_AUTHOR" "$SITE_AUTHOR"
        set_template_var "SITE_EMAIL" "$SITE_EMAIL"
        set_template_var "GITHUB_USER" "$GITHUB_USER_INPUT"
        render_template "$TEMPLATES_DIR/data/authors.yml.template" "$authors_file"
    else
        # Fallback embedded content
        cat > "$authors_file" << EOF
# Site Authors
# Add your author information here

default:
  name: "$SITE_AUTHOR"
  bio: "Update this in _data/authors.yml"
  avatar: "/assets/images/avatar-placeholder.png"
  github: "$GITHUB_USER_INPUT"
  twitter: ""
  email: "$SITE_EMAIL"
  role: "Site Owner"
EOF
    fi
    
    info "Updated _data/authors.yml"
}

# Create placeholder avatar if it doesn't exist
create_placeholder_avatar() {
    local avatar_path="$REPO_ROOT/assets/images/avatar-placeholder.png"
    
    if [[ -f "$avatar_path" ]]; then
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY RUN] Would create placeholder avatar"
        return 0
    fi
    
    mkdir -p "$(dirname "$avatar_path")"
    
    # Create a simple 1x1 pixel PNG (gray placeholder)
    # This is a minimal valid PNG file
    printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x05\xfe\xd4\x00\x00\x00\x00IEND\xaeB`\x82' > "$avatar_path"
    
    debug "Created placeholder avatar"
}

# -------------------------------------------------------------------------
# Main Execution
# -------------------------------------------------------------------------

main() {
    parse_arguments "$@"
    
    # Verify we're in a git repository
    if ! git -C "$REPO_ROOT" rev-parse --git-dir &>/dev/null; then
        error "Not in a git repository. Please run from the repository root."
    fi
    
    # Load template configuration
    if [[ -f "$TEMPLATES_DIR/config/install.conf" ]]; then
        source "$TEMPLATES_DIR/config/install.conf"
    fi
    
    # Initialize template library if available
    if type load_config &>/dev/null; then
        load_config 2>/dev/null || true
    fi
    
    # Prompt for user values
    prompt_user_values
    
    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "🔍 DRY RUN MODE - No changes will be made"
        echo ""
    fi
    
    # Execute cleanup steps
    remove_example_content
    create_welcome_post
    reset_config
    reset_authors
    create_placeholder_avatar
    
    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        success "Dry run complete! Run without --dry-run to apply changes."
    else
        success "Fork cleanup complete! Your site is ready to customize."
        echo ""
        echo "Next steps:"
        echo "  1. Review and customize _config.yml"
        echo "  2. Update _data/authors.yml with your information"
        echo "  3. Replace assets/images/avatar-placeholder.png with your avatar"
        echo "  4. Start the development server: docker-compose up"
        echo "  5. Visit http://localhost:4000 to see your site"
        echo ""
        echo "Happy coding! 🚀"
    fi
}

main "$@"
