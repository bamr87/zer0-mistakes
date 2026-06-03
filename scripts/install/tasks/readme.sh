#!/bin/bash
# =============================================================================
# scripts/install/tasks/readme.sh — Write INSTALLATION.md and README seed
# =============================================================================
# Writes: INSTALLATION.md
# Writes: README.md (only when target does not have one yet)
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_README:-}" ]] && return 0
_HAS_TASK_README=1

task_readme_run() {
    local target="$1"

    log_info "Writing documentation..."

    tmpl_apply "config/INSTALLATION.md.template" "${target}/INSTALLATION.md"

    # Write README.md only if missing (never overwrite an existing README)
    if [[ ! -f "${target}/README.md" ]]; then
        tmpl_apply "config/README.md.template" "${target}/README.md"
    else
        log_debug "README.md already exists — skipping (use --force to overwrite)"
    fi

    log_success "Documentation written"
}
