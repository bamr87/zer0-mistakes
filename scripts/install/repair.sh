#!/bin/bash
# =============================================================================
# scripts/install/repair.sh — Re-apply spec to fix drift
# =============================================================================
# Compares spec intent against disk state (diff.sh), then re-applies
# only the tasks whose output files are missing or changed.
#
# Provides:
#   repair_run TARGET_DIR
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_REPAIR_LIB:-}" ]] && return 0
_HAS_REPAIR_LIB=1

repair_run() {
    local target="${1:-$(pwd)}"
    local spec_file
    spec_file="$(spec_path "$target")"

    if [[ ! -f "$spec_file" ]]; then
        log_error "repair: no spec found at $spec_file"
        return 1
    fi

    log_info "Checking for drift at: $target"

    # Run diff (non-destructive) — prints what needs repair
    diff_spec "$spec_file"
    local diff_ret=$?

    if [[ $diff_ret -eq 0 ]]; then
        log_success "No drift detected — nothing to repair."
        return 0
    fi

    log_info "Drift detected. Re-applying spec..."
    spec_read "$spec_file"

    # Force-rewrite everything to fix drift
    _FS_FORCE=1
    export _FS_FORCE

    apply_run "$spec_file"
}
