#!/bin/bash
# ===================================================================
# MIGRATE NAV MODES - Update Front Matter Navigation Values
# ===================================================================
#
# File: migrate-nav-modes.sh
# Path: scripts/migrate-nav-modes.sh
# Purpose: Update front matter nav values from old to new modes
#
# Migration Map:
#   dynamic    → auto
#   searchCats → categories
#   docs       → tree
#   about      → tree
#   quickstart → tree
#   main       → tree
#
# Usage:
#   ./scripts/migrate-nav-modes.sh           # Dry run (preview changes)
#   ./scripts/migrate-nav-modes.sh --apply   # Apply changes
#
# ===================================================================

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
PAGES_DIR="pages"
DRY_RUN=true

# Parse arguments
if [[ "${1:-}" == "--apply" ]]; then
    DRY_RUN=false
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Navigation Mode Migration Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if $DRY_RUN; then
    echo -e "${YELLOW}Running in DRY RUN mode. No files will be modified.${NC}"
    echo -e "${YELLOW}Use --apply to make actual changes.${NC}"
else
    echo -e "${RED}Running in APPLY mode. Files will be modified.${NC}"
fi
echo ""

# Migration patterns (old → new)
# Using simple arrays instead of associative arrays for compatibility
OLD_PATTERNS=("nav: dynamic" "nav: searchCats")
NEW_PATTERNS=("nav: auto" "nav: categories")

# Files that explicitly set nav values (not inherited from _config.yml)
EXPLICIT_NAV_PATTERNS=(
    "nav: dynamic"
    "nav: searchCats"
    "nav: docs"
    "nav: about"
    "nav: quickstart"
    "nav: main"
)

# Count changes
TOTAL_FILES=0
TOTAL_CHANGES=0

echo -e "${BLUE}Scanning for files with explicit nav values...${NC}"
echo ""

# Find all markdown files
while IFS= read -r -d '' file; do
    file_changes=0
    
    # Check if file has any nav patterns
    for pattern in "${EXPLICIT_NAV_PATTERNS[@]}"; do
        if grep -q "$pattern" "$file" 2>/dev/null; then
            ((file_changes++)) || true
        fi
    done
    
    if [[ $file_changes -gt 0 ]]; then
        ((TOTAL_FILES++)) || true
        echo -e "${GREEN}Found:${NC} $file"
        
        # Show what would change
        for i in "${!OLD_PATTERNS[@]}"; do
            old_pattern="${OLD_PATTERNS[$i]}"
            new_pattern="${NEW_PATTERNS[$i]}"
            if grep -q "$old_pattern" "$file" 2>/dev/null; then
                echo -e "  ${YELLOW}Change:${NC} '$old_pattern' → '$new_pattern'"
                ((TOTAL_CHANGES++)) || true
                
                if ! $DRY_RUN; then
                    # Apply the change using sed
                    if [[ "$OSTYPE" == "darwin"* ]]; then
                        sed -i '' "s/$old_pattern/$new_pattern/g" "$file"
                    else
                        sed -i "s/$old_pattern/$new_pattern/g" "$file"
                    fi
                fi
            fi
        done
        
        # Check for named nav files that should use tree mode
        # Note: These are trickier because we want to keep the YAML file reference
        # but change how the template interprets them
        for named_nav in "docs" "about" "quickstart" "main"; do
            if grep -q "nav: $named_nav" "$file" 2>/dev/null; then
                echo -e "  ${BLUE}Note:${NC} 'nav: $named_nav' - YAML file will be used with tree mode"
                # No automatic migration - sidebar-left.html handles this via fallthrough
            fi
        done
        
        echo ""
    fi
done < <(find "$PAGES_DIR" -name "*.md" -print0 2>/dev/null)

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Files scanned:  ${GREEN}$(find "$PAGES_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')${NC}"
echo -e "Files affected: ${GREEN}$TOTAL_FILES${NC}"
echo -e "Changes made:   ${GREEN}$TOTAL_CHANGES${NC}"
echo ""

if $DRY_RUN; then
    echo -e "${YELLOW}This was a dry run. To apply changes, run:${NC}"
    echo -e "  ${GREEN}./scripts/migrate-nav-modes.sh --apply${NC}"
else
    echo -e "${GREEN}Migration complete!${NC}"
fi

echo ""
echo -e "${BLUE}Navigation Mode Reference:${NC}"
echo "  auto       - Auto-generated from collection documents"
echo "  tree       - YAML-defined hierarchical navigation"
echo "  categories - Category-based grouping"
echo ""
