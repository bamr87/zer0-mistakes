#!/bin/bash
# =============================================================================
# scripts/install/tasks/gitignore.sh — Write .gitignore
# =============================================================================
# Writes: .gitignore (profile-aware variant)
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_GITIGNORE:-}" ]] && return 0
_HAS_TASK_GITIGNORE=1

task_gitignore_run() {
    local target="$1"
    local profile="${SPEC_PROFILE:-default}"

    log_info "Writing .gitignore..."

    local tmpl
    case "$profile" in
        fork)    tmpl="config/gitignore.full.template" ;;
        minimal) tmpl="config/gitignore.minimal.template" ;;
        *)       tmpl="config/gitignore.full.template" ;;
    esac

    tmpl_apply "$tmpl" "${target}/.gitignore"
    log_success ".gitignore written"
}
