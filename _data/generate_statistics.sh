#!/bin/bash

# Generate Content Statistics Script
# Used by: Manual execution or CI/CD workflows
# Purpose: Run the Ruby statistics generator with proper feedback

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RUBY_SCRIPT="$SCRIPT_DIR/generate_statistics.rb"
OUTPUT_FILE="$SCRIPT_DIR/content_statistics.yml"
CONFIG_FILE="$SCRIPT_DIR/statistics_config.yml"

echo -e "${BLUE}📊 Zer0-Mistakes Content Statistics Generator${NC}"
echo "=================================================="

# Check if Ruby is available
if ! command -v ruby &> /dev/null; then
    echo -e "${RED}❌ Error: Ruby is not installed or not in PATH${NC}"
    echo "Please install Ruby to run the statistics generator."
    exit 1
fi

echo -e "${GREEN}✅ Ruby found: $(ruby --version)${NC}"

# Check if the Ruby script exists
if [[ ! -f "$RUBY_SCRIPT" ]]; then
    echo -e "${RED}❌ Error: Ruby script not found at $RUBY_SCRIPT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Statistics generator script found${NC}"

# Check if config file exists
if [[ -f "$CONFIG_FILE" ]]; then
    echo -e "${GREEN}✅ Configuration file found: statistics_config.yml${NC}"
else
    echo -e "${YELLOW}⚠️  Configuration file not found, using defaults${NC}"
fi

# Check for content directories
POSTS_DIR="$PROJECT_ROOT/pages/_posts"
if [[ -d "$POSTS_DIR" ]]; then
    POST_COUNT=$(find "$POSTS_DIR" -name "*.md" -type f | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Found $POST_COUNT posts in pages/_posts${NC}"
fi

PAGES_DIR="$PROJECT_ROOT/pages"
if [[ -d "$PAGES_DIR" ]]; then
    PAGE_COUNT=$(find "$PAGES_DIR" -name "*.md" -type f ! -path "*/_posts/*" | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Found $PAGE_COUNT pages in pages/${NC}"
fi

# Run the Ruby script from project root
echo -e "${YELLOW}🔄 Generating statistics...${NC}"
cd "$PROJECT_ROOT"
if ruby "$RUBY_SCRIPT"; then
    echo -e "${GREEN}✅ Statistics generated successfully!${NC}"
else
    echo -e "${RED}❌ Error: Failed to generate statistics${NC}"
    exit 1
fi

# Check if output file was created
if [[ -f "$OUTPUT_FILE" ]]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✅ Output file created: $OUTPUT_FILE ($FILE_SIZE)${NC}"
    
    # Show a preview of the generated statistics
    echo -e "${BLUE}📋 Statistics Preview:${NC}"
    echo "------------------------"
    if command -v yq &> /dev/null; then
        echo "Generated at: $(yq '.generated_at' "$OUTPUT_FILE")"
        echo "Total Posts: $(yq '.overview.total_posts' "$OUTPUT_FILE")"
        echo "Total Pages: $(yq '.overview.total_pages' "$OUTPUT_FILE")"
        echo "Published: $(yq '.overview.published' "$OUTPUT_FILE")"
        echo "Categories: $(yq '.overview.total_categories' "$OUTPUT_FILE")"
        echo "Tags: $(yq '.overview.total_tags' "$OUTPUT_FILE")"
    else
        # Fallback to head if yq is not available
        echo "Preview of generated data:"
        head -25 "$OUTPUT_FILE"
    fi
else
    echo -e "${RED}❌ Error: Output file was not created${NC}"
    exit 1
fi

echo ""
echo "=========================="
echo -e "${GREEN}🎉 Content statistics generation complete!${NC}"
echo ""
echo "📝 The data is now available in _data/content_statistics.yml"
echo "📊 Use the stats layout for display: layout: stats"
echo ""
echo "🔄 To regenerate statistics, run this script again:"
echo "   bash _data/generate_statistics.sh"
