#!/bin/bash
# =============================================================================
# scripts/install/tasks/config.sh — Write Jekyll config files
# =============================================================================
# Writes: _config.yml, _config_dev.yml (if profile != minimal/github-pages)
# All writes go through template.sh::tmpl_apply → fs.sh.
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_CONFIG:-}" ]] && return 0
_HAS_TASK_CONFIG=1

task_config_run() {
    local target="$1"

    log_info "Writing Jekyll configuration..."

    # Choose template variant based on theme.source
    local config_tmpl
    case "${SPEC_THEME_SOURCE:-${THEME_SOURCE:-gem}}" in
        remote)    config_tmpl="config/_config.remote.yml.template" ;;
        fork)      config_tmpl="config/_config.fork.yml.template" ;;
        *)         config_tmpl="config/_config.starter.yml.template" ;;
    esac

    tmpl_apply "$config_tmpl" "${target}/_config.yml"

    # Dev config — skip for github-pages (remote_theme) and minimal profiles
    local profile="${SPEC_PROFILE:-default}"
    case "$profile" in
        minimal|github-pages) ;;
        *)
            tmpl_apply "config/_config_dev.yml.template" "${target}/_config_dev.yml"
            ;;
    esac

    log_success "Jekyll configuration written"
}
