#!/usr/bin/env bash
# =========================================================================
# scripts/docs/check-freshness.sh — Staleness detector for docs/
# =========================================================================
# Flags docs where the lastmod front matter field is more than THRESHOLD
# days behind the file's most recent git commit. This surfaces docs that
# describe code that has since changed without a corresponding doc update.
#
# Usage:
#   ./scripts/docs/check-freshness.sh
#   ./scripts/docs/check-freshness.sh --threshold 90   # custom days (default: 60)
#   ./scripts/docs/check-freshness.sh --verbose
# =========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"
source "$SCRIPT_DIR/../lib/frontmatter.sh"

THRESHOLD_DAYS=60
STALE_COUNT=0
FILES_CHECKED=0
STALE_FILES=""

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --threshold) shift; THRESHOLD_DAYS="$1" ;;
            --verbose)   export VERBOSE=true ;;
            --help|-h)   show_usage; exit 0 ;;
            *) warn "Unknown option: $1" ;;
        esac
        shift
    done
}

show_usage() {
    cat << EOF
Freshness Checker for docs/

USAGE:
    ./scripts/docs/check-freshness.sh [OPTIONS]

OPTIONS:
    --threshold N   Days of drift before flagging as stale (default: $THRESHOLD_DAYS)
    --verbose       Show all files, not just stale ones

A doc is stale when:
  git log -1 date for that file > (lastmod front matter + THRESHOLD days)

This catches docs describing code that changed but whose lastmod wasn't updated.
EOF
}

# Returns seconds since epoch for a date string, or empty on failure
date_to_epoch() {
    local d="$1"
    ruby -rtime -e "puts Time.parse('$d').to_i" 2>/dev/null || true
}

parse_args "$@"

THRESHOLD_SECS=$(( THRESHOLD_DAYS * 86400 ))

log "Checking freshness of docs (threshold: ${THRESHOLD_DAYS} days)..."
echo ""

for filepath in $(find "$REPO_ROOT/docs" -name "*.md" -not -name "README.md" -not -path "*/archive/*" | sort); do
    relpath="${filepath#$REPO_ROOT/}"

    # Skip files without front matter
    local_first=""
    IFS= read -r local_first < "$filepath" || true
    if [[ ! "$local_first" =~ ^--- ]]; then
        debug "  SKIP (no front matter): $relpath"
        continue
    fi

    lastmod_str="$(get_frontmatter_field "$filepath" "lastmod" 2>/dev/null || true)"
    if [[ -z "$lastmod_str" ]]; then
        debug "  SKIP (no lastmod field): $relpath"
        continue
    fi

    lastmod_epoch="$(date_to_epoch "$lastmod_str")"
    [[ -z "$lastmod_epoch" ]] && continue

    # Get last git commit date for this file
    git_date_str="$(git -C "$REPO_ROOT" log -1 --format="%aI" -- "$relpath" 2>/dev/null || true)"
    [[ -z "$git_date_str" ]] && continue

    git_epoch="$(date_to_epoch "$git_date_str")"
    [[ -z "$git_epoch" ]] && continue

    drift=$(( git_epoch - lastmod_epoch ))

    if [[ $drift -gt $THRESHOLD_SECS ]]; then
        drift_days=$(( drift / 86400 ))
        warn "  STALE (${drift_days}d behind): $relpath"
        warn "         lastmod: $lastmod_str"
        warn "         git:     $git_date_str"
        STALE_FILES="$STALE_FILES $relpath"
        STALE_COUNT=$((STALE_COUNT + 1))
    else
        debug "  FRESH: $relpath"
    fi

    FILES_CHECKED=$((FILES_CHECKED + 1))
done

echo ""
log "Results: $FILES_CHECKED files checked, $STALE_COUNT stale"

if [[ $STALE_COUNT -gt 0 ]]; then
    echo ""
    info "Stale files (update lastmod after reviewing content):"
    for f in $STALE_FILES; do
        echo "  - $f"
    done
    exit 1
fi
