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

Checks relative markdown links ([text](path)) in docs/**/*.md to verify
the target file exists. The contributor docs under docs/ use filesystem
relative links between markdown files, so they can be resolved on disk.

Not covered here:
  - pages/_docs/**: the user-facing Jekyll site uses permalink URLs and
    the relative_url filter, which are not filesystem paths; those links
    are validated by htmlproofer against the built _site in CI.
  - External URLs (http://, https://, mailto:, etc.)
  - Anchor-only links (#section)
  - Absolute site URLs (/docs/..., /faq/, ...)
EOF
}

# Extract relative markdown links from a file, excluding external, anchor-only,
# and absolute site URLs. Uses Ruby (already required by this repo) so the
# extraction is portable across GNU and BSD/macOS environments.
extract_relative_links() {
    local filepath="$1"
    ruby -e '
        in_fence = false
        File.foreach(ARGV[0], encoding: "UTF-8") do |line|
            # Toggle fenced code blocks (``` or ~~~); skip their contents,
            # which are examples rather than real links.
            if line =~ /\A\s*(```|~~~)/
                in_fence = !in_fence
                next
            end
            next if in_fence
            # Ignore inline code spans so `[x](y)` written as code is skipped.
            scrubbed = line.gsub(/`[^`]*`/, "")
            scrubbed.scan(/\]\(([^)]+)\)/) do |m|
                link = m[0].strip
                next if link.empty?
                next if link.include?("{{") || link.include?("{%")  # Liquid template
                next if link =~ %r{\A[a-z][a-z0-9+.-]*:}i            # scheme: http:, mailto:, etc.
                next if link.start_with?("#")                        # anchor-only
                next if link.start_with?("/")                        # absolute site URL (Jekyll permalink)
                link = link.split("#", 2).first                      # strip anchor fragment
                puts link unless link.nil? || link.empty?
            end
        end
    ' "$filepath" 2>/dev/null || true
}

parse_args "$@"

log "Checking internal links in docs/..."
echo ""

# archive/ holds superseded historical docs; templates/ holds scaffolding with
# intentional placeholder links (link-to-config, etc.) — neither is "live" docs.
for filepath in $(find "$REPO_ROOT/docs" -name "*.md" \
        -not -path "*/archive/*" -not -path "*/templates/*" 2>/dev/null | sort); do
    relpath="${filepath#$REPO_ROOT/}"
    filedir="$(dirname "$filepath")"
    file_errors=0

    while IFS= read -r link; do
        [[ -z "$link" ]] && continue

        # Resolve relative to the file's directory (absolute site URLs are
        # filtered out in extract_relative_links)
        target="$filedir/$link"

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
