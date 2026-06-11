#!/bin/bash
# =============================================================================
# scripts/install/tasks/nav.sh — Generate navigation data
# =============================================================================
# Writes: _data/navigation/main.yml
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_NAV:-}" ]] && return 0
_HAS_TASK_NAV=1

task_nav_run() {
    local target="$1"

    log_info "Writing navigation data..."
    fs_ensure_dir "${target}/_data/navigation"
    tmpl_apply "data/navigation-main.yml.template" "${target}/_data/navigation/main.yml"
    log_success "Navigation data written"
}
