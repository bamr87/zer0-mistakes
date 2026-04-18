#!/bin/bash

# =========================================================================
# Zer0-Mistakes Theme — Migration Utility
# =========================================================================
# Install optional theme features (admin settings UI, etc.) into a
# consumer Jekyll site that uses the zer0-mistakes theme.
#
# Usage:
#   ./scripts/migrate.sh [options] [target_dir]
#
# Options:
#   --admin          Install admin settings pages (default action)
#   --force          Overwrite existing files
#   --verify         Verify an existing installation
#   --dry-run        Show what would be done without making changes
#   --verbose        Enable verbose output
#   --non-interactive  Skip confirmation prompts
#   -h, --help       Show this help message
#
# Examples:
#   # Install admin pages into current directory
#   ./scripts/migrate.sh .
#
#   # Install into another site with force overwrite
#   ./scripts/migrate.sh --force /path/to/my-site
#
#   # Verify existing installation
#   ./scripts/migrate.sh --verify /path/to/my-site
#
#   # Preview changes without writing
#   ./scripts/migrate.sh --dry-run /path/to/my-site
# =========================================================================

set -euo pipefail

# -------------------------------------------------------------------------
# Resolve script location and load libraries
# -------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared libraries
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=lib/template.sh
source "$SCRIPT_DIR/lib/template.sh"
# shellcheck source=lib/migrate.sh
source "$SCRIPT_DIR/lib/migrate.sh"

# -------------------------------------------------------------------------
# Defaults
# -------------------------------------------------------------------------
ACTION="install"   # install | verify
INSTALL_ADMIN=true
FORCE=false
TARGET_DIR=""

# -------------------------------------------------------------------------
# Usage
# -------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") [options] [target_dir]

Install optional zer0-mistakes theme features into a consumer Jekyll site.

Options:
  --admin              Install admin settings pages (default)
  --force              Overwrite existing files
  --verify             Verify an existing installation
  --dry-run            Show what would be done without writing files
  --verbose            Enable verbose/debug output
  --non-interactive    Skip confirmation prompts
  -h, --help           Show this help message

Arguments:
  target_dir           Path to the Jekyll site (default: current directory)

Examples:
  $(basename "$0") .                        # Install admin pages here
  $(basename "$0") --force ../my-site       # Force overwrite in another site
  $(basename "$0") --verify .               # Verify current installation
  $(basename "$0") --dry-run ../my-site     # Preview changes
EOF
    exit 0
}

# -------------------------------------------------------------------------
# Parse arguments
# -------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --admin)          INSTALL_ADMIN=true; shift ;;
        --force)          FORCE=true; shift ;;
        --verify)         ACTION="verify"; shift ;;
        --dry-run)        DRY_RUN=true; shift ;;
        --verbose)        VERBOSE=true; shift ;;
        --non-interactive) INTERACTIVE=false; shift ;;
        -h|--help)        usage ;;
        -*)               error "Unknown option: $1" ;;
        *)                TARGET_DIR="$1"; shift ;;
    esac
done

TARGET_DIR="${TARGET_DIR:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd)" || error "Directory not found: $TARGET_DIR"

# -------------------------------------------------------------------------
# Main
# -------------------------------------------------------------------------

main() {
    echo ""
    echo "╔══════════════════════════════════════════════════╗"
    echo "║  Zer0-Mistakes Theme — Migration Utility        ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo ""

    info "Target site: $TARGET_DIR"
    [[ "$DRY_RUN" == "true" ]] && info "Mode: DRY RUN (no files will be written)"
    echo ""

    # --- Step 1: Validate target ---
    step "Detecting Jekyll site..."
    if ! detect_jekyll_site "$TARGET_DIR"; then
        error "Target does not appear to be a Jekyll site: $TARGET_DIR"
    fi
    success "Jekyll site detected"

    # --- Step 2: Check theme connection ---
    step "Checking theme connection..."
    if validate_theme_connection "$TARGET_DIR"; then
        success "Theme connection: $THEME_CONNECTION_TYPE"
    else
        warn "Could not confirm zer0-mistakes theme connection."
        warn "Admin pages require the zer0-mistakes theme (layout: admin, includes, JS/CSS)."
        if [[ "$INTERACTIVE" == "true" ]]; then
            if ! confirm "Continue anyway?"; then
                info "Aborted."
                exit 0
            fi
        fi
    fi

    # --- Step 3: Check theme version ---
    detect_version_gap "$TARGET_DIR" || true

    # --- Step 4: Load template config ---
    step "Loading template configuration..."
    load_config || true
    export CURRENT_DATE="${CURRENT_DATE:-$(date +%Y-%m-%d)}"

    # --- Step 5: Execute action ---
    case "$ACTION" in
        install)
            if [[ "$INSTALL_ADMIN" == "true" ]]; then
                echo ""
                if [[ "$FORCE" == "true" ]]; then
                    info "Force mode enabled — existing files will be overwritten"
                fi

                if [[ "$INTERACTIVE" == "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
                    echo ""
                    info "This will install admin settings pages to:"
                    info "  $TARGET_DIR/$ADMIN_OUTPUT_DIR/"
                    echo ""
                    if ! confirm "Proceed with installation?"; then
                        info "Aborted."
                        exit 0
                    fi
                fi

                install_admin_pages "$TARGET_DIR" "$FORCE"
            fi
            ;;
        verify)
            verify_admin_pages "$TARGET_DIR"
            ;;
    esac

    # --- Step 6: Summary ---
    echo ""
    echo "────────────────────────────────────────────────────"
    if [[ "$ACTION" == "install" ]]; then
        success "Migration complete!"
        echo ""
        info "Next steps:"
        info "  1. Start your Jekyll server and visit the admin pages"
        info "  2. Theme Customizer:  /about/settings/theme/"
        info "  3. Configuration:     /about/config/"
        info "  4. Navigation Editor: /about/settings/navigation/"
        info "  5. Collection Manager:/about/settings/collections/"
        info "  6. Analytics:         /about/settings/analytics/"
        info "  7. Environment:       /about/settings/environment/"
    else
        success "Verification complete."
    fi
    echo ""
}

main
