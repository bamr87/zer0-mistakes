#!/bin/bash
#
# Script Name: convert-notebooks.sh
# Description: Converts Jupyter notebooks (.ipynb) to Jekyll-compatible Markdown
#              Adds proper front matter, extracts images, and prepares for Jekyll build
#
# Usage: ./scripts/convert-notebooks.sh [options]
#
# Options:
#   -h, --help              Show this help message
#   -d, --dry-run           Preview what would be converted (no actual changes)
#   -v, --verbose           Enable verbose output
#   -f, --file FILE         Convert a specific notebook file only
#   --output-dir DIR        Output directory for converted files (default: pages/_notebooks)
#   --image-dir DIR         Output directory for extracted images (default: assets/images/notebooks)
#   --force                 Reconvert notebooks even if .md exists
#   --clean                 Remove converted .md files before converting
#   --list                  Only list notebooks to be converted
#
# Dependencies:
#   - bash 4.0+
#   - python3 with jupyter nbconvert installed
#   - yq or python (for YAML parsing)
#
# Environment Variables:
#   NOTEBOOKS_DIR           Source directory for .ipynb files (default: pages/_notebooks)
#   OUTPUT_DIR              Output directory for .md files (default: pages/_notebooks)
#   IMAGE_DIR               Output directory for images (default: assets/images/notebooks)
#
# Examples:
#   ./scripts/convert-notebooks.sh --dry-run
#   ./scripts/convert-notebooks.sh --file pages/_notebooks/my-notebook.ipynb
#   ./scripts/convert-notebooks.sh --verbose --force
#   ./scripts/convert-notebooks.sh --clean
#

set -euo pipefail

# Get script directory and source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env file if it exists
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    while IFS='=' read -r key value; do
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        export "$key=$value"
    done < "$PROJECT_ROOT/.env"
fi

# Source common library if available
if [[ -f "$SCRIPT_DIR/lib/common.sh" ]]; then
    source "$SCRIPT_DIR/lib/common.sh"
else
    # Fallback logging functions
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'
    
    log() { echo -e "${GREEN}[LOG]${NC} $1"; }
    info() { echo -e "${BLUE}[INFO]${NC} $1"; }
    step() { echo -e "${CYAN}[STEP]${NC} $1"; }
    success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
    warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
    error() { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }
fi

# Default configuration
NOTEBOOKS_DIR="${NOTEBOOKS_DIR:-pages/_notebooks}"
OUTPUT_DIR="${OUTPUT_DIR:-pages/_notebooks}"
IMAGE_DIR="${IMAGE_DIR:-assets/images/notebooks}"
DRY_RUN=false
VERBOSE=false
FORCE=false
CLEAN=false
LIST_ONLY=false
SPECIFIC_FILE=""

# Parse command line arguments
show_help() {
    head -n 40 "$0" | grep "^#" | sed 's/^# //; s/^#//'
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--file)
            SPECIFIC_FILE="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --image-dir)
            IMAGE_DIR="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --list)
            LIST_ONLY=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate dependencies
check_dependencies() {
    step "Checking dependencies..."
    
    if ! command -v python3 &> /dev/null; then
        error "python3 is not installed"
    fi
    
    if ! python3 -c "import nbconvert" 2>/dev/null; then
        error "jupyter nbconvert is not installed. Install with: pip3 install jupyter nbconvert"
    fi
    
    success "All dependencies satisfied"
}

# Extract front matter from notebook metadata or filename
extract_front_matter() {
    local notebook_file="$1"
    local basename
    basename=$(basename "$notebook_file" .ipynb)
    
    # Try to extract metadata from notebook JSON
    local title description date
    
    # Use Python to parse notebook and extract metadata
    # Output as JSON to avoid delimiter issues with multiline content
    local metadata_json
    metadata_json=$(python3 -c "
import json
from datetime import datetime

with open('${notebook_file}', 'r') as f:
    nb = json.load(f)

metadata = nb.get('metadata', {})

# Try to get title from notebook metadata
title = metadata.get('title', '')
if not title:
    # Try to extract from first markdown cell
    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'markdown':
            source = ''.join(cell.get('source', []))
            if source.startswith('# '):
                title = source.split('\n')[0].replace('# ', '').strip()
                break

if not title:
    title = '${basename}'.replace('-', ' ').replace('_', ' ').title()

# Extract description (first non-heading markdown content)
description = metadata.get('description', '')
if not description:
    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'markdown':
            source = ''.join(cell.get('source', []))
            # Skip heading lines and empty lines
            for line in source.split('\n'):
                if line.strip() and not line.startswith('#'):
                    description = line.strip()[:200]
                    break
            if description:
                break

if not description:
    description = 'Jupyter notebook demonstration'

# Format date in ISO 8601 format
date_str = metadata.get('date', datetime.now().strftime('%Y-%m-%dT%H:%M:%S.000Z'))

# Generate permalink from basename
permalink = '/notebooks/${basename}/'

# Output as JSON to avoid parsing issues
result = {
    'title': title,
    'description': description,
    'date': date_str,
    'permalink': permalink
}
print(json.dumps(result))
" 2>/dev/null)
    
    # Parse JSON output
    local title description date permalink
    if [[ -n "$metadata_json" ]]; then
        title=$(echo "$metadata_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['title'])")
        description=$(echo "$metadata_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['description'])")
        date=$(echo "$metadata_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['date'])")
        permalink=$(echo "$metadata_json" | python3 -c "import sys, json; print(json.load(sys.stdin)['permalink'])")
    else
        # Fallback if Python parsing fails
        title="${basename//-/ }"
        description="Jupyter notebook"
        date=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
        permalink="/notebooks/${basename}/"
    fi
    
    # Generate front matter
    cat <<EOF
---
title: "${title}"
description: "${description}"
layout: notebook
collection: notebooks
date: ${date}
categories: [Notebooks]
tags: [jupyter, python]
comments: true
jupyter_metadata: true
lastmod: $(date -u +%Y-%m-%dT%H:%M:%S.000Z)
permalink: ${permalink}
---

EOF
}

# Convert a single notebook
convert_notebook() {
    local notebook_file="$1"
    local basename
    basename=$(basename "$notebook_file" .ipynb)
    local output_file="$OUTPUT_DIR/${basename}.md"
    
    # Check if conversion is needed
    if [[ -f "$output_file" && "$FORCE" != true ]]; then
        if [[ "$VERBOSE" == true ]]; then
            info "Skipping $notebook_file (output exists, use --force to reconvert)"
        fi
        return 0
    fi
    
    step "Converting: $notebook_file"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would convert: $notebook_file -> $output_file"
        return 0
    fi
    
    # Create output directories
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$IMAGE_DIR"
    
    # Create temp directory for conversion
    local temp_dir
    temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/notebook-XXXXXXXXXX")
    local temp_md="${temp_dir}/${basename}.md"
    
    if [[ "$VERBOSE" == true ]]; then
        info "Running nbconvert..."
    fi
    
    # Use nbconvert to convert to markdown with image extraction
    python3 -m nbconvert \
        --to markdown \
        --output-dir="$temp_dir" \
        --output="${basename}" \
        "$notebook_file" 2>&1 | \
        if [[ "$VERBOSE" == true ]]; then cat; else cat > /dev/null; fi
    
    # Move extracted images to assets directory
    local notebook_images="${temp_dir}/${basename}_files"
    if [[ -d "$notebook_images" ]]; then
        mkdir -p "$IMAGE_DIR/${basename}_files"
        cp -r "$notebook_images"/* "$IMAGE_DIR/${basename}_files/"
        if [[ "$VERBOSE" == true ]]; then
            info "Copied images to $IMAGE_DIR/${basename}_files/"
        fi
    fi
    
    # Extract front matter
    local front_matter
    front_matter=$(extract_front_matter "$notebook_file")
    
    # Combine front matter with converted content
    {
        echo "$front_matter"
        cat "$temp_md"
    } > "$output_file"
    
    # Fix image paths in the markdown to use Jekyll's asset path
    sed -i.bak "s|${basename}_files/|/assets/images/notebooks/${basename}_files/|g" "$output_file"
    rm -f "${output_file}.bak"
    
    # Clean up temp directory
    rm -rf "$temp_dir"
    
    success "Converted: $output_file"
}

# Clean converted files
clean_converted() {
    step "Cleaning converted markdown files..."
    
    local count=0
    while IFS= read -r -d '' md_file; do
        local basename
        basename=$(basename "$md_file" .md)
        
        # Only remove .md files if corresponding .ipynb exists
        if [[ -f "$NOTEBOOKS_DIR/${basename}.ipynb" ]]; then
            if [[ "$DRY_RUN" == true ]]; then
                info "Would remove: $md_file"
            else
                rm -f "$md_file"
                info "Removed: $md_file"
            fi
            ((count++))
        fi
    done < <(find "$OUTPUT_DIR" -name "*.md" -print0 2>/dev/null)
    
    if [[ $count -eq 0 ]]; then
        info "No converted files to clean"
    else
        success "Cleaned $count converted file(s)"
    fi
}

# List notebooks to be converted
list_notebooks() {
    step "Listing notebooks to convert..."
    
    local count=0
    
    if [[ -n "$SPECIFIC_FILE" ]]; then
        if [[ -f "$SPECIFIC_FILE" ]]; then
            echo "$SPECIFIC_FILE"
            count=1
        fi
    else
        while IFS= read -r -d '' notebook_file; do
            echo "$notebook_file"
            ((count++))
        done < <(find "$NOTEBOOKS_DIR" -name "*.ipynb" -print0 2>/dev/null)
    fi
    
    info "Found $count notebook(s)"
}

# Main conversion process
main() {
    info "Jupyter Notebook Converter for Jekyll"
    info "======================================"
    
    if [[ "$CLEAN" == true ]]; then
        clean_converted
        exit 0
    fi
    
    if [[ "$LIST_ONLY" == true ]]; then
        list_notebooks
        exit 0
    fi
    
    check_dependencies
    
    # Convert specific file or all notebooks
    if [[ -n "$SPECIFIC_FILE" ]]; then
        if [[ ! -f "$SPECIFIC_FILE" ]]; then
            error "File not found: $SPECIFIC_FILE"
        fi
        convert_notebook "$SPECIFIC_FILE"
    else
        step "Scanning for notebooks in: $NOTEBOOKS_DIR"
        
        local count=0
        while IFS= read -r -d '' notebook_file; do
            convert_notebook "$notebook_file"
            ((count++))
        done < <(find "$NOTEBOOKS_DIR" -name "*.ipynb" -print0 2>/dev/null)
        
        if [[ $count -eq 0 ]]; then
            warn "No notebooks found in $NOTEBOOKS_DIR"
        else
            success "Converted $count notebook(s)"
        fi
    fi
}

# Run main function
main
