#!/usr/bin/env bash
# =========================================================================
# scripts/docs/lint-frontmatter.sh — Front matter validator for docs/
# =========================================================================
# Checks every content .md file under docs/ (excluding READMEs and archive/)
# for the required front matter fields defined in the schema.
#
# Usage:
#   ./scripts/docs/lint-frontmatter.sh           # validate
#   ./scripts/docs/lint-frontmatter.sh --fix     # inject skeleton where missing
#   ./scripts/docs/lint-frontmatter.sh --verbose # show per-file results
# =========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"
source "$SCRIPT_DIR/../lib/frontmatter.sh"

FIX_MODE=false
REQUIRED_FIELDS=(title description date lastmod categories tags author)
ERRORS=0
FILES_OK=0
FILES_MISSING=0

# Bash 3.2-compatible file-list builder (no mapfile)
list_docs_files() {
    find "$REPO_ROOT/docs" -name "*.md" \
        -not -name "README.md" \
        -not -path "*/archive/*" \
        | sort
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --fix)     FIX_MODE=true ;;
            --verbose) export VERBOSE=true ;;
            --help|-h) show_usage; exit 0 ;;
            *) warn "Unknown option: $1" ;;
        esac
        shift
    done
}

show_usage() {
    cat << 'EOF'
Front Matter Linter for docs/

USAGE:
    ./scripts/docs/lint-frontmatter.sh [OPTIONS]

REQUIRED FIELDS (per .github/instructions/documentation.instructions.md):
    title, description, date, lastmod, categories, tags, author

EXCLUDES:
    - README.md files (directory indexes)
    - docs/archive/** (historical docs)
EOF
}

# Determine tags from directory name
dir_tags() {
    local dir="$1"
    case "$dir" in
        ui)             echo "[ui, styling, theme]" ;;
        architecture)   echo "[architecture, design]" ;;
        development)    echo "[development, contributing]" ;;
        systems)        echo "[systems, automation]" ;;
        installation)   echo "[installation, setup]" ;;
        features)       echo "[features]" ;;
        implementation) echo "[implementation, changelog]" ;;
        releases)       echo "[releases]" ;;
        templates)      echo "[templates]" ;;
        *)              echo "[docs]" ;;
    esac
}

# Inject skeleton front matter at the top of a file
inject_frontmatter() {
    local filepath="$1"
    local relpath="${filepath#$REPO_ROOT/}"
    local subdir
    subdir="$(echo "$relpath" | cut -d'/' -f2)"

    # Extract title from first H1 heading
    local title
    title="$(grep -m1 "^# " "$filepath" 2>/dev/null | sed 's/^# //' || true)"
    [[ -z "$title" ]] && title="$(basename "$filepath" .md | tr '-' ' ' | sed 's/\b./\u&/g')"

    # Dates from git history
    local date lastmod now
    now="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
    date="$(git -C "$REPO_ROOT" log --diff-filter=A --follow --format="%aI" -- "$relpath" 2>/dev/null | tail -1 || true)"
    lastmod="$(git -C "$REPO_ROOT" log -1 --format="%aI" -- "$relpath" 2>/dev/null || true)"
    [[ -z "$date" ]]    && date="$now"
    [[ -z "$lastmod" ]] && lastmod="$now"

    # Normalize to ISO 8601 with milliseconds
    date="$(echo "$date" | ruby -rtime -e 'puts Time.parse(STDIN.read.strip).utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")' 2>/dev/null || echo "$now")"
    lastmod="$(echo "$lastmod" | ruby -rtime -e 'puts Time.parse(STDIN.read.strip).utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")' 2>/dev/null || echo "$now")"

    local tags
    tags="$(dir_tags "$subdir")"

    local skeleton
    skeleton="---
title: \"${title}\"
description: \"TODO: Add a 120-160 character description of this document.\"
date: ${date}
lastmod: ${lastmod}
categories: [docs]
tags: ${tags}
author: bamr87
---"

    # Prepend skeleton to file
    local tmpfile
    tmpfile="$(mktemp)"
    printf '%s\n\n' "$skeleton" | cat - "$filepath" > "$tmpfile"
    mv "$tmpfile" "$filepath"
    info "  Injected front matter: $relpath"
}

parse_args "$@"

total_files=0
for f in $(list_docs_files); do total_files=$((total_files + 1)); done
log "Checking $total_files docs files for required front matter..."
echo ""

for filepath in $(list_docs_files); do
    relpath="${filepath#$REPO_ROOT/}"
    missing=()

    # Check if front matter exists at all
    local_first_line=""
    IFS= read -r local_first_line < "$filepath" || true

    if [[ ! "$local_first_line" =~ ^--- ]]; then
        if [[ "$FIX_MODE" == "true" ]]; then
            inject_frontmatter "$filepath"
            FILES_OK=$((FILES_OK + 1))
            continue
        else
            warn "  MISSING front matter: $relpath"
            FILES_MISSING=$((FILES_MISSING + 1))
            ERRORS=$((ERRORS + 1))
            continue
        fi
    fi

    # Check each required field
    fm="$(extract_frontmatter "$filepath" 2>/dev/null || true)"
    missing_list=""
    for field in "${REQUIRED_FIELDS[@]}"; do
        if ! echo "$fm" | grep -q "^${field}:"; then
            missing_list="$missing_list $field"
        fi
    done

    if [[ -n "$missing_list" ]]; then
        warn "  INCOMPLETE ($relpath): missing:$missing_list"
        ERRORS=$((ERRORS + 1))
    else
        debug "  OK: $relpath"
        FILES_OK=$((FILES_OK + 1))
    fi
done

incomplete=$((ERRORS - FILES_MISSING))
echo ""
log "Results: ${FILES_OK} OK, ${FILES_MISSING} missing front matter, ${incomplete} incomplete"

if [[ $ERRORS -gt 0 ]]; then
    if [[ "$FIX_MODE" == "false" ]]; then
        info "Run with --fix to inject skeleton front matter into missing files."
    fi
    exit 1
fi
