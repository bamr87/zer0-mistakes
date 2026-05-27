#!/bin/bash
# =============================================================================
# scripts/install/tasks/data.sh — Generate seed data files
# =============================================================================
# Writes: _data/authors.yml
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_DATA:-}" ]] && return 0
_HAS_TASK_DATA=1

task_data_run() {
    local target="$1"

    log_info "Writing seed data..."
    fs_ensure_dir "${target}/_data"
    tmpl_apply "data/authors.yml.template" "${target}/_data/authors.yml"
    log_success "Seed data written"
}
