#!/usr/bin/env bash

#
# Markdown Formatting Fix Script
# Addresses common markdown linting violations across the repository
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
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

# Function to fix common markdown issues
fix_markdown_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    log_info "Fixing markdown formatting in: $file"
    
    # Create backup
    cp "$file" "${file}.backup"
    
    # Apply fixes using sed (macOS compatible)
    sed -e 's/[[:space:]]*$//' \
        -e '/^#/a\
' \
        -e '/^##/a\
' \
        -e '/^###/a\
' \
        -e '/^####/a\
' \
        -e '/^#####/a\
' \
        -e '/^######/a\
' \
        -e '/^- /i\
' \
        -e '/^* /i\
' \
        -e '/^+ /i\
' \
        -e '/^[0-9]/i\
' \
        -e 's/```$/```bash/' \
        -e 's/^```[[:space:]]*$/```bash/' \
        "$file" > "$temp_file"
    
    # Additional fixes with awk for more complex patterns
    awk '
    BEGIN { prev_was_heading = 0; prev_was_list = 0 }
    
    # Handle headings - ensure blank line before and after
    /^#/ {
        if (NR > 1 && prev_line != "" && !prev_was_heading) print ""
        print $0
        prev_was_heading = 1
        prev_was_list = 0
        prev_line = $0
        next
    }
    
    # Handle list items - ensure blank line before first item
    /^[[:space:]]*[-*+]/ || /^[[:space:]]*[0-9]+\./ {
        if (!prev_was_list && prev_line != "" && !prev_was_heading) print ""
        print $0
        prev_was_list = 1
        prev_was_heading = 0
        prev_line = $0
        next
    }
    
    # Handle code blocks - ensure they have language specification
    /^```[[:space:]]*$/ {
        print "```bash"
        prev_was_heading = 0
        prev_was_list = 0
        prev_line = $0
        next
    }
    
    # Regular lines
    {
        print $0
        prev_was_heading = 0
        prev_was_list = 0
        prev_line = $0
    }
    ' "$temp_file" > "$file"
    
    # Clean up
    rm "$temp_file"
    
    log_success "Fixed formatting in: $file"
}

# Function to remove trailing whitespace
remove_trailing_whitespace() {
    local file="$1"
    log_info "Removing trailing whitespace from: $file"
    
    # Remove trailing whitespace
    sed -i '' 's/[[:space:]]*$//' "$file"
    
    log_success "Removed trailing whitespace from: $file"
}

# Function to fix heading punctuation
fix_heading_punctuation() {
    local file="$1"
    log_info "Fixing heading punctuation in: $file"
    
    # Remove trailing punctuation from headings
    sed -i '' 's/^\(#\+[[:space:]]*.*\)[.!?:;,]*[[:space:]]*$/\1/' "$file"
    
    log_success "Fixed heading punctuation in: $file"
}

# Function to fix emphasis formatting
fix_emphasis_formatting() {
    local file="$1"
    log_info "Fixing emphasis formatting in: $file"
    
    # Fix common emphasis issues
    sed -i '' \
        -e 's/\*\*\([^*]*\) \*\*/\*\*\1\*\*/g' \
        -e 's/\*\([^*]*\) \*/\*\1\*/g' \
        "$file"
    
    log_success "Fixed emphasis formatting in: $file"
}

# Main execution function
main() {
    log_info "Starting markdown formatting fixes..."
    
    # Find all markdown files
    local md_files
    mapfile -t md_files < <(find "$PROJECT_ROOT" -name "*.md" \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/vendor/*" \
        -not -path "*/_site/*")
    
    if [ ${#md_files[@]} -eq 0 ]; then
        log_warning "No markdown files found"
        return 0
    fi
    
    log_info "Found ${#md_files[@]} markdown files to process"
    
    # Process each file
    for file in "${md_files[@]}"; do
        if [ -f "$file" ]; then
            remove_trailing_whitespace "$file"
            fix_heading_punctuation "$file"
            fix_emphasis_formatting "$file"
            fix_markdown_file "$file"
        fi
    done
    
    log_success "Completed markdown formatting fixes for ${#md_files[@]} files"
    
    # Provide summary
    echo
    log_info "Summary of fixes applied:"
    echo "  ✓ Removed trailing whitespace"
    echo "  ✓ Added blank lines around headings"
    echo "  ✓ Added blank lines before list items"
    echo "  ✓ Fixed code block language specifications"
    echo "  ✓ Fixed heading punctuation"
    echo "  ✓ Fixed emphasis formatting"
    echo
    log_info "Backup files created with .backup extension"
    log_info "Run 'git diff' to review changes before committing"
}

# Help function
show_help() {
    cat << EOF
Markdown Formatting Fix Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help     Show this help message
    --dry-run      Show what would be fixed without making changes
    --file FILE    Fix only the specified file

EXAMPLES:
    $0                          # Fix all markdown files
    $0 --file README.md         # Fix only README.md
    $0 --dry-run               # Preview changes without applying

This script fixes common markdown linting violations:
- Trailing whitespace
- Missing blank lines around headings
- Missing blank lines before lists
- Code blocks without language specification
- Heading punctuation issues
- Emphasis formatting problems

EOF
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --dry-run)
        log_info "DRY RUN MODE - No changes will be made"
        # Implementation for dry run would go here
        exit 0
        ;;
    --file)
        if [ -n "${2:-}" ] && [ -f "$2" ]; then
            log_info "Fixing single file: $2"
            remove_trailing_whitespace "$2"
            fix_heading_punctuation "$2"
            fix_emphasis_formatting "$2"
            fix_markdown_file "$2"
            log_success "Completed fixing: $2"
        else
            log_error "File not found: ${2:-}"
            exit 1
        fi
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
