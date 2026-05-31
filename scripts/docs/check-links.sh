#!/usr/bin/env bash
# =========================================================================
# scripts/docs/check-links.sh — Internal link checker for docs/
# =========================================================================
# Validates that relative markdown links in docs/**/*.md resolve to files
# that actually exist in the repository. Does not validate external URLs.
#
# Usage:
#   ./scripts/docs/check-links.sh
#   ./scripts/docs/check-links.sh --verbose
# =========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"

ERRORS=0
FILES_CHECKED=0

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --verbose) export VERBOSE=true ;;
            --help|-h) show_usage; exit 0 ;;
            *) warn "Unknown option: $1" ;;
        esac
        shift
    done
}

show_usage() {
    cat << 'EOF'
Internal Link Checker for docs/

USAGE:
    ./scripts/docs/check-links.sh [--verbose]

Checks relative markdown links ([text](path)) in docs/**/*.md and
pages/_docs/**/*.md to verify the target file exists.
External URLs (http://, https://) are skipped.
Anchors (#section) on their own are skipped.
EOF
}

# Extract relative markdown links from a file, excluding external and anchor-only
extract_relative_links() {
    local filepath="$1"
    # Match [text](link) where link doesn't start with http(s):// or #
    grep -oP '\]\((?!https?://|#)[^)]+\)' "$filepath" 2>/dev/null \
        | grep -oP '(?<=\()[^)]+' \
        | sed 's/#.*//' \
        | grep -v '^$' \
        || true
}

parse_args "$@"

log "Checking internal links in docs and pages/_docs..."
echo ""

for filepath in $(find "$REPO_ROOT/docs" "$REPO_ROOT/pages/_docs" -name "*.md" 2>/dev/null | sort); do
    relpath="${filepath#$REPO_ROOT/}"
    filedir="$(dirname "$filepath")"
    file_errors=0

    while IFS= read -r link; do
        [[ -z "$link" ]] && continue

        # Resolve relative to the file's directory
        if [[ "$link" == /* ]]; then
            # Absolute path from repo root
            target="$REPO_ROOT$link"
        else
            target="$filedir/$link"
        fi

        # Normalize (remove ./ and resolve ..)
        target="$(cd "$(dirname "$target")" 2>/dev/null && pwd)/$(basename "$target")" 2>/dev/null || target="$filedir/$link"

        if [[ ! -f "$target" && ! -d "$target" ]]; then
            warn "  BROKEN: $relpath → $link"
            file_errors=$((file_errors + 1))
            ERRORS=$((ERRORS + 1))
        else
            debug "  OK: $relpath → $link"
        fi
    done < <(extract_relative_links "$filepath")

    FILES_CHECKED=$((FILES_CHECKED + 1))
done

echo ""
log "Results: $FILES_CHECKED files checked, $ERRORS broken links"

[[ $ERRORS -eq 0 ]] || exit 1
