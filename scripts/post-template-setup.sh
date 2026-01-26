#!/bin/bash

# =========================================================================
# Post-Template Setup Script
# =========================================================================
# This script is designed to run after a repository is created from
# the zer0-mistakes template. It can be triggered by GitHub Actions
# or run manually.
#
# Usage:
#   ./scripts/post-template-setup.sh [options]
#
# Options:
#   --repo-name NAME       Repository name (from GitHub)
#   --repo-owner OWNER     Repository owner (from GitHub)
#   --auto                 Run in automated mode (no prompts)
# =========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
REPO_NAME="${REPO_NAME:-}"
REPO_OWNER="${REPO_OWNER:-}"
AUTO_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --repo-name)
            REPO_NAME="$2"
            shift 2
            ;;
        --repo-owner)
            REPO_OWNER="$2"
            shift 2
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "🚀 Post-Template Setup"
echo "======================"
echo ""

# Rename template README
if [[ -f "$REPO_ROOT/.github/TEMPLATE_README.md" ]]; then
    # Only move if main README still references the template
    if grep -q "bamr87/zer0-mistakes" "$REPO_ROOT/README.md" 2>/dev/null; then
        echo "📝 Updating README.md..."
        cp "$REPO_ROOT/.github/TEMPLATE_README.md" "$REPO_ROOT/README.md"
    fi
fi

# Update repository references if we have the info
if [[ -n "$REPO_NAME" ]] && [[ -n "$REPO_OWNER" ]]; then
    echo "📦 Repository: $REPO_OWNER/$REPO_NAME"
    
    # Update _config.yml with new repository info
    if [[ -f "$REPO_ROOT/_config.yml" ]]; then
        echo "⚙️  Updating _config.yml..."
        sed -i.tmp "s/github_user:.*/github_user: \"$REPO_OWNER\"/" "$REPO_ROOT/_config.yml"
        sed -i.tmp "s/repository_name:.*/repository_name: \"$REPO_NAME\"/" "$REPO_ROOT/_config.yml"
        rm -f "$REPO_ROOT/_config.yml.tmp"
    fi
fi

# Run full cleanup in auto mode
if [[ "$AUTO_MODE" == "true" ]]; then
    echo "🧹 Running fork cleanup..."
    if [[ -f "$SCRIPT_DIR/fork-cleanup.sh" ]]; then
        bash "$SCRIPT_DIR/fork-cleanup.sh" --non-interactive \
            ${REPO_OWNER:+--github-user "$REPO_OWNER"} \
            ${REPO_NAME:+--site-name "$REPO_NAME"}
    fi
fi

echo ""
echo "✅ Post-template setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/fork-cleanup.sh"
echo "  2. Start: docker-compose up"
echo "  3. Visit: http://localhost:4000"
