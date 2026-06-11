#!/usr/bin/env bash
# =========================================================================
# scripts/docs/validate.sh — Docs validation orchestrator
# =========================================================================
# Runs all docs health checks: front matter, links, and freshness.
#
# Usage:
#   ./scripts/docs/validate.sh              # run all checks
#   ./scripts/docs/validate.sh --lint       # front matter only
#   ./scripts/docs/validate.sh --links      # links only
#   ./scripts/docs/validate.sh --freshness  # freshness only
#   ./scripts/docs/validate.sh --fix        # inject missing front matter
#   ./scripts/docs/validate.sh --verbose    # detailed output
# =========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"

RUN_LINT=true
RUN_LINKS=true
RUN_FRESHNESS=true
FIX_MODE=false
OVERALL_STATUS=0

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --lint)       RUN_LINKS=false; RUN_FRESHNESS=false ;;
            --links)      RUN_LINT=false;  RUN_FRESHNESS=false ;;
            --freshness)  RUN_LINT=false;  RUN_LINKS=false ;;
            --fix)        FIX_MODE=true ;;
            --verbose)    export VERBOSE=true ;;
            --help|-h)    show_usage; exit 0 ;;
            *) warn "Unknown option: $1" ;;
        esac
        shift
    done
}

show_usage() {
    cat << 'EOF'
Docs Validation Suite for zer0-mistakes

USAGE:
    ./scripts/docs/validate.sh [OPTIONS]

OPTIONS:
    --lint        Front matter compliance only
    --links       Link checking only
    --freshness   Staleness check only
    --fix         Inject skeleton front matter into files that lack it
    --verbose     Detailed output
    --help        Show this message

CHECKS:
    lint        Every docs/**/*.md (non-README, non-archive) has required
                front matter: title, description, date, lastmod, categories,
                tags, author
    links       Internal markdown links resolve to existing files
    freshness   Files where lastmod trails the last git commit by > 60 days
EOF
}

run_check() {
    local name="$1"; local script="$2"; shift 2
    log "Running: $name"
    if "$script" "$@"; then
        log "  PASS: $name"
    else
        warn "  FAIL: $name"
        OVERALL_STATUS=1
    fi
}

parse_args "$@"

[[ "$FIX_MODE" == "true" ]] && EXTRA="--fix" || EXTRA=""

[[ "$RUN_LINT"      == "true" ]] && run_check "Front matter lint" "$SCRIPT_DIR/lint-frontmatter.sh" $EXTRA
[[ "$RUN_LINKS"     == "true" ]] && run_check "Link check"        "$SCRIPT_DIR/check-links.sh"
[[ "$RUN_FRESHNESS" == "true" ]] && run_check "Freshness check"   "$SCRIPT_DIR/check-freshness.sh"

if [[ $OVERALL_STATUS -eq 0 ]]; then
    log "All docs checks passed."
else
    error "One or more docs checks failed."
    exit 1
fi
