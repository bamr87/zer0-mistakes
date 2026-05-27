#!/bin/bash
# =============================================================================
# scripts/install/tasks/pages.sh — Generate starter content pages
# =============================================================================
# Copies pages listed in templates/pages/manifest.yml to target.
# Skips individual files that already exist (respects _FS_FORCE).
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_PAGES:-}" ]] && return 0
_HAS_TASK_PAGES=1

task_pages_run() {
    local target="$1"
    local profile="${SPEC_PROFILE:-default}"

    log_info "Generating starter pages..."

    # Locate pages template directory
    local pages_tmpl_dir="${TEMPLATES_DIR:-}/pages"
    if [[ ! -d "$pages_tmpl_dir" ]]; then
        log_warning "Pages template dir not found: $pages_tmpl_dir (skipping)"
        return 0
    fi

    # Read manifest if present
    local manifest="${pages_tmpl_dir}/manifest.yml"
    if [[ ! -f "$manifest" ]]; then
        log_warning "pages/manifest.yml not found (skipping)"
        return 0
    fi

    # Parse manifest: lines of format "- dest: path  src: template"
    local dest src
    while IFS= read -r line; do
        # Skip blank / comment lines
        case "$line" in
            ''|\#*) continue ;;
        esac

        # Extract dest and src fields
        dest=$(echo "$line" | sed 's/.*dest:[[:space:]]*//' | sed 's/[[:space:]].*//')
        src=$(echo "$line" | sed 's/.*src:[[:space:]]*//' | sed 's/[[:space:]].*//')

        [[ -z "$dest" || -z "$src" ]] && continue

        # Profile filter — lines can have a "profiles:" key
        local profiles_spec
        profiles_spec=$(echo "$line" | grep -o 'profiles:[^,}]*' | sed 's/profiles://') 
        if [[ -n "$profiles_spec" ]]; then
            case "$profiles_spec" in
                *"$profile"*) ;;
                *"all"*) ;;
                *) continue ;;   # not for this profile
            esac
        fi

        tmpl_apply "pages/${src}" "${target}/${dest}"
    done < "$manifest"

    log_success "Starter pages generated"
}
