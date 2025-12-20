#!/bin/bash
#
# update-preview-paths.sh
# 
# Updates all preview paths in markdown frontmatter to remove the /assets/ prefix.
# This aligns with the new auto_prefix feature that automatically prepends /assets/.
#
# Usage:
#   ./scripts/update-preview-paths.sh           # Dry run (preview changes)
#   ./scripts/update-preview-paths.sh --apply   # Apply changes
#
# Example transformation:
#   preview: /assets/images/previews/my-image.png
#   becomes:
#   preview: /images/previews/my-image.png
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Counters
TOTAL_FILES=0
MODIFIED_FILES=0
SKIPPED_FILES=0

# Mode
DRY_RUN=true

# Parse arguments
for arg in "$@"; do
    case $arg in
        --apply)
            DRY_RUN=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--apply]"
            echo ""
            echo "Updates preview paths in markdown frontmatter to remove /assets/ prefix."
            echo ""
            echo "Options:"
            echo "  --apply    Apply changes (default is dry run)"
            echo "  --help     Show this help message"
            exit 0
            ;;
    esac
done

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_change() {
    echo -e "${CYAN}[CHANGE]${NC} $1"
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔄 Preview Path Updater${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No files will be modified"
    log_info "Run with --apply to make changes"
else
    log_warning "APPLY MODE - Files will be modified"
fi
echo ""

# Find all markdown files in pages directory
find "$PROJECT_ROOT/pages" -name "*.md" -type f | while read -r file; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Check if file has a preview field with /assets/ prefix
    if grep -q "^preview: /assets/" "$file" 2>/dev/null; then
        # Extract current preview path
        current_path=$(grep "^preview:" "$file" | head -1 | sed 's/^preview: //')
        
        # Remove /assets/ prefix
        new_path=$(echo "$current_path" | sed 's|^/assets/|/|')
        
        log_change "$file"
        echo "  Old: $current_path"
        echo "  New: $new_path"
        
        if [ "$DRY_RUN" = false ]; then
            # Use sed to replace the preview line
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS sed requires empty string for -i
                sed -i '' "s|^preview: /assets/|preview: /|" "$file"
            else
                # Linux sed
                sed -i "s|^preview: /assets/|preview: /|" "$file"
            fi
            log_success "Updated: $file"
        fi
        
        MODIFIED_FILES=$((MODIFIED_FILES + 1))
    else
        SKIPPED_FILES=$((SKIPPED_FILES + 1))
    fi
done

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}📊 Summary${NC}"
echo -e "${CYAN}========================================${NC}"

# Re-count since subshell doesn't persist variables
MODIFIED_COUNT=$(find "$PROJECT_ROOT/pages" -name "*.md" -type f -exec grep -l "^preview: /assets/" {} \; 2>/dev/null | wc -l | tr -d ' ')
TOTAL_COUNT=$(find "$PROJECT_ROOT/pages" -name "*.md" -type f | wc -l | tr -d ' ')

if [ "$DRY_RUN" = true ]; then
    echo "  Files to update: $MODIFIED_COUNT"
    echo "  Total markdown files: $TOTAL_COUNT"
    echo ""
    log_info "Run with --apply to make these changes"
else
    # After applying, count should be 0
    REMAINING=$(find "$PROJECT_ROOT/pages" -name "*.md" -type f -exec grep -l "^preview: /assets/" {} \; 2>/dev/null | wc -l | tr -d ' ')
    echo "  Files updated: $MODIFIED_COUNT"
    echo "  Files remaining: $REMAINING"
    echo "  Total markdown files: $TOTAL_COUNT"
fi
echo ""
