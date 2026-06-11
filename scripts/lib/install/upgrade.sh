#!/usr/bin/env bash
# scripts/lib/install/upgrade.sh
#
# `install upgrade` — version-aware migration over an existing site.
#
# Strategy:
#   1. Detect installed version from .zer0-installed (drop-marker) or
#      _config.yml's `version:` field, or fall back to "unknown".
#   2. Print a diff-summary of what will change (theme files only — never
#      touches user content under pages/, _posts/, _drafts/).
#   3. Re-runs the agent-files install (always safe, additive) and offers
#      to refresh templated workflows under .github/workflows/.
#   4. Writes a fresh .zer0-installed marker with the new version + date.
#
# Public API:
#     upgrade_run <target_dir> <repo_root> [--from <version>] [--force]
#                                          [--dry-run] [--auto-accept]
#
# Bash 3.2-compatible. Idempotent. Never destructive without explicit --force.

# shellcheck disable=SC2034
UPGRADE_LIB_VERSION="1.0.0"

UPGRADE_MARKER=".zer0-installed"

# Read theme version from lib/jekyll-theme-zer0/version.rb
_upgrade_theme_version() {
    local repo_root="$1"
    local vfile="$repo_root/lib/jekyll-theme-zer0/version.rb"
    [[ -f "$vfile" ]] || { echo "unknown"; return; }
    grep -E 'VERSION\s*=' "$vfile" | head -n1 | sed -E 's/.*"([^"]+)".*/\1/'
}

# Detect the previously installed version (best-effort).
_upgrade_detect_installed() {
    local target_dir="$1"
    if [[ -f "$target_dir/$UPGRADE_MARKER" ]]; then
        grep -E '^version:' "$target_dir/$UPGRADE_MARKER" 2>/dev/null \
            | head -n1 | sed -E 's/version:[[:space:]]*//'
        return
    fi
    # Fallback: probe _config.yml for a `version:` line
    if [[ -f "$target_dir/_config.yml" ]]; then
        local v
        v="$(grep -E '^version:' "$target_dir/_config.yml" 2>/dev/null \
            | head -n1 | sed -E 's/version:[[:space:]]*//' \
            | tr -d '"' | tr -d "'")"
        [[ -n "$v" ]] && { echo "$v"; return; }
    fi
    echo "unknown"
}

# Write/update the install marker.
_upgrade_write_marker() {
    local target_dir="$1" version="$2" dry_run="$3"
    local marker="$target_dir/$UPGRADE_MARKER"
    local content
    content="$(cat <<EOF
# zer0-mistakes install marker — do not edit manually
version: $version
upgraded_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
)"
    if [[ "$dry_run" = "1" ]]; then
        log_info "[dry-run] Would write marker: $marker"
        return
    fi
    printf '%s\n' "$content" > "$marker"
    log_success "Wrote $UPGRADE_MARKER (version: $version)"
}

# Re-run agents install in --force mode (theme files are safe to refresh).
_upgrade_refresh_agents() {
    local target_dir="$1" repo_root="$2" force="$3" dry_run="$4"
    if ! declare -F agents_install >/dev/null 2>&1; then
        log_warning "agents.sh not loaded — skipping agent-file refresh"
        return 0
    fi
    if [[ "$dry_run" = "1" ]]; then
        log_info "[dry-run] Would refresh agent files in $target_dir"
        return 0
    fi
    local force_flag=""
    [[ "$force" = "1" ]] && force_flag="--force"
    log_info "Refreshing AI agent files..."
    agents_install "$target_dir" "$repo_root" $force_flag || true
}

# Compare a workflow file in target_dir vs theme template — list
# differences so user can decide whether to merge.
_upgrade_check_workflows() {
    local target_dir="$1" repo_root="$2"
    local wf_dir="$target_dir/.github/workflows"
    [[ -d "$wf_dir" ]] || return 0
    local f base tpl
    log_info "Checking .github/workflows/ for theme-managed files..."
    local found=0
    for f in "$wf_dir"/*.yml "$wf_dir"/*.yaml; do
        [[ -f "$f" ]] || continue
        base="$(basename "$f")"
        # Look for a matching template under templates/deploy/*/
        for tpl in "$repo_root/templates/deploy"/*/"$base.template" \
                   "$repo_root/templates/deploy"/*/"$base"; do
            [[ -f "$tpl" ]] || continue
            found=$((found+1))
            if diff -q "$f" "$tpl" >/dev/null 2>&1; then
                log_success "  $base — up to date"
            else
                log_warning "  $base — differs from theme template"
                log_info "    Compare: diff $f $tpl"
            fi
            break
        done
    done
    [[ "$found" = "0" ]] && log_info "  No theme-managed workflows detected"
}

# Public entrypoint.
upgrade_run() {
    local target_dir="$1" repo_root="$2"
    shift 2 || true

    local from_version="" force=0 dry_run=0 auto_accept=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --from)        from_version="${2:-}"; shift ;;
            -f|--force)    force=1 ;;
            -n|--dry-run)  dry_run=1 ;;
            --auto-accept) auto_accept=1 ;;
            *) log_warning "upgrade_run: ignoring unknown flag: $1" ;;
        esac
        shift
    done

    if [[ ! -d "$target_dir" ]]; then
        log_error "Target directory does not exist: $target_dir"
        return 1
    fi

    local installed_version theme_version
    installed_version="${from_version:-$(_upgrade_detect_installed "$target_dir")}"
    theme_version="$(_upgrade_theme_version "$repo_root")"

    log_info "🔧 Upgrading site at: $target_dir"
    log_info "  From version: $installed_version"
    log_info "  To   version: $theme_version"
    [[ "$dry_run" = "1" ]] && log_warning "  Mode: dry-run (no files will be changed)"
    echo

    if [[ "$installed_version" = "$theme_version" ]] && [[ "$force" != "1" ]]; then
        log_success "Already on $theme_version. Use --force to re-run anyway."
        return 0
    fi

    # Confirmation gate (skipped when --auto-accept or --dry-run)
    if [[ "$auto_accept" != "1" ]] && [[ "$dry_run" != "1" ]]; then
        printf "Proceed with upgrade? [y/N] "
        local reply
        read -r reply || reply=""
        case "$reply" in
            y|Y|yes|YES) ;;
            *) log_warning "Upgrade cancelled by user."; return 0 ;;
        esac
    fi

    # 1. Refresh agent files (always additive/safe)
    _upgrade_refresh_agents "$target_dir" "$repo_root" "$force" "$dry_run"
    echo

    # 2. Check workflows (read-only — never auto-overwrite)
    _upgrade_check_workflows "$target_dir" "$repo_root"
    echo

    # 3. Write/update marker (only if not dry-run)
    _upgrade_write_marker "$target_dir" "$theme_version" "$dry_run"
    echo

    log_success "Upgrade complete."
    log_info "Next steps:"
    log_info "  1. Run 'install doctor' to verify environment"
    log_info "  2. Review any workflow files flagged above"
    log_info "  3. Check CHANGELOG.md in the theme repo for breaking changes"
    return 0
}
