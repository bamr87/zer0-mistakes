#!/bin/bash
# =============================================================================
# scripts/install/tasks/devcontainer.sh — Write .devcontainer config
# =============================================================================
# Writes: .devcontainer/devcontainer.json
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_DEVCONTAINER:-}" ]] && return 0
_HAS_TASK_DEVCONTAINER=1

task_devcontainer_run() {
    local target="$1"
    local profile="${SPEC_PROFILE:-default}"

    case "$profile" in
        minimal)
            log_info "devcontainer task: skipped for profile 'minimal'"
            return 0
            ;;
    esac

    log_info "Writing devcontainer configuration..."
    fs_ensure_dir "${target}/.devcontainer"
    tmpl_apply "config/devcontainer.json.template" "${target}/.devcontainer/devcontainer.json"
    log_success "devcontainer.json written"
}
