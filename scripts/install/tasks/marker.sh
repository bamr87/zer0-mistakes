#!/bin/bash
# =============================================================================
# scripts/install/tasks/marker.sh — Write .zer0-installed marker
# =============================================================================
# Writes: .zer0/install.spec.json (persists final spec)
#         .zer0-installed (simple marker for upgrade detection)
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_MARKER:-}" ]] && return 0
_HAS_TASK_MARKER=1

task_marker_run() {
    local target="$1"

    log_info "Writing installation marker..."

    # Create .zer0 directory and persist the spec
    fs_ensure_dir "${target}/.zer0"
    spec_write "$(spec_path "$target")"

    # Write a human-readable marker file
    local marker_content
    marker_content=$(cat <<MARKER
# zer0-mistakes installation marker
# Do not delete this file — it is used by the upgrade and repair commands.
installed_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
profile: ${SPEC_PROFILE:-default}
theme_source: ${SPEC_THEME_SOURCE:-gem}
installer_version: "2"
MARKER
)

    if [[ -f "${target}/.zer0-installed" ]]; then
        # Append an upgrade entry
        local append_content
        append_content=$(printf '\n# Upgrade: %s\nprofile: %s\n' \
            "$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date)" \
            "${SPEC_PROFILE:-default}")
        fs_write_file "${target}/.zer0-installed" \
            "$(cat "${target}/.zer0-installed")${append_content}"
    else
        fs_write_file "${target}/.zer0-installed" "$marker_content"
    fi

    log_success "Installation marker written"
}
