#!/bin/bash
# =============================================================================
# scripts/install/upgrade.sh — Re-apply spec to an existing install
# =============================================================================
# Reads the existing .zer0/install.spec.json, applies flag overrides,
# and re-runs apply.sh — safely updating config/agent files without
# touching user content.
#
# Provides:
#   upgrade_run TARGET_DIR
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_UPGRADE_LIB:-}" ]] && return 0
_HAS_UPGRADE_LIB=1

upgrade_run() {
    local target="${1:-$(pwd)}"
    local spec_file
    spec_file="$(spec_path "$target")"

    if [[ ! -f "$spec_file" ]]; then
        log_error "upgrade: no spec found at $spec_file"
        log_info "Run 'install init $target' first, or use 'install init --force' to re-create."
        return 1
    fi

    log_info "Upgrading existing install at: $target"
    spec_read "$spec_file"

    # Apply any flag overrides
    plan_apply_flags
    plan_apply_platform

    # Never upgrade user content pages by default
    local safe_tasks=""
    local t
    for t in ${SPEC_TASKS}; do
        case "$t" in
            pages|nav|data) ;;   # skip content tasks on upgrade
            *) safe_tasks="${safe_tasks} $t" ;;
        esac
    done
    SPEC_TASKS="${safe_tasks# }"
    export SPEC_TASKS

    spec_write "$spec_file"
    apply_run "$spec_file"
}
