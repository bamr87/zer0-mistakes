#!/bin/bash
# =============================================================================
# scripts/install/diff.sh — Spec-vs-disk diff renderer
# =============================================================================
# Shows what apply.sh WOULD do before it does it.
#
# Provides:
#   diff_spec SPEC_FILE
#       Print a human-readable diff of spec intent vs. current target dir.
#       Each task prints: MISSING | EXISTS | CHANGED | WOULD-WRITE
#       Returns 0 when target matches spec (no-op), 1 when changes needed.
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_DIFF_LIB:-}" ]] && return 0
_HAS_DIFF_LIB=1

# Internal: compare a single file using diff or hash
_diff_compare_file() {
    local src="$1"
    local dest="$2"
    local label="$3"

    if [[ ! -e "$dest" ]]; then
        printf "  ${_LOG_GREEN:-}+ MISSING${_LOG_NC:-}  %s\n" "$label" >&2
        return 1  # change needed
    fi

    if command -v diff >/dev/null 2>&1; then
        if ! diff -q "$src" "$dest" >/dev/null 2>&1; then
            printf "  ${_LOG_YELLOW:-}~ CHANGED${_LOG_NC:-}  %s\n" "$label" >&2
            return 1
        fi
    fi

    printf "  ${_LOG_CYAN:-}= EXISTS${_LOG_NC:-}   %s\n" "$label" >&2
    return 0
}

# ---------------------------------------------------------------------------
# diff_spec SPEC_FILE
# ---------------------------------------------------------------------------
diff_spec() {
    local spec_file="$1"

    if [[ ! -f "$spec_file" ]]; then
        log_error "diff_spec: spec file not found: $spec_file"
        return 1
    fi

    spec_read "$spec_file"
    local target="${SPEC_TARGET_DIR:-}"

    if [[ -z "$target" ]]; then
        log_error "diff_spec: spec.target_dir is empty"
        return 1
    fi

    printf "\n${_LOG_BOLD:-}Diff: spec vs. %s${_LOG_NC:-}\n\n" "$target" >&2

    local changes=0

    # Check known output paths per task
    local task
    for task in ${SPEC_TASKS:-}; do
        printf "${_LOG_BLUE:-}[task: %s]${_LOG_NC:-}\n" "$task" >&2
        case "$task" in
            config)
                [[ -f "${target}/_config.yml" ]] || { printf "  + MISSING  _config.yml\n" >&2; changes=$(( changes + 1 )); }
                ;;
            gemfile)
                [[ -f "${target}/Gemfile" ]] || { printf "  + MISSING  Gemfile\n" >&2; changes=$(( changes + 1 )); }
                ;;
            docker)
                [[ -f "${target}/docker-compose.yml" ]] || { printf "  + MISSING  docker-compose.yml\n" >&2; changes=$(( changes + 1 )); }
                [[ -f "${target}/docker/Dockerfile" ]] || { printf "  + MISSING  docker/Dockerfile\n" >&2; changes=$(( changes + 1 )); }
                ;;
            theme)
                [[ -d "${target}/_layouts" ]] || { printf "  + MISSING  _layouts/\n" >&2; changes=$(( changes + 1 )); }
                [[ -d "${target}/_includes" ]] || { printf "  + MISSING  _includes/\n" >&2; changes=$(( changes + 1 )); }
                ;;
            pages)
                [[ -f "${target}/index.md" ]] || [[ -f "${target}/index.html" ]] || \
                    { printf "  + MISSING  index.md\n" >&2; changes=$(( changes + 1 )); }
                ;;
            nav)
                [[ -f "${target}/_data/navigation/main.yml" ]] || \
                    { printf "  + MISSING  _data/navigation/main.yml\n" >&2; changes=$(( changes + 1 )); }
                ;;
            data)
                [[ -f "${target}/_data/authors.yml" ]] || \
                    { printf "  + MISSING  _data/authors.yml\n" >&2; changes=$(( changes + 1 )); }
                ;;
            devcontainer)
                [[ -f "${target}/.devcontainer/devcontainer.json" ]] || \
                    { printf "  + MISSING  .devcontainer/devcontainer.json\n" >&2; changes=$(( changes + 1 )); }
                ;;
            agents)
                [[ -f "${target}/AGENTS.md" ]] || \
                    { printf "  + MISSING  AGENTS.md\n" >&2; changes=$(( changes + 1 )); }
                ;;
            gitignore)
                [[ -f "${target}/.gitignore" ]] || \
                    { printf "  + MISSING  .gitignore\n" >&2; changes=$(( changes + 1 )); }
                ;;
            readme)
                [[ -f "${target}/INSTALLATION.md" ]] || \
                    { printf "  + MISSING  INSTALLATION.md\n" >&2; changes=$(( changes + 1 )); }
                ;;
            marker)
                [[ -f "${target}/.zer0-installed" ]] || \
                    { printf "  + MISSING  .zer0-installed\n" >&2; changes=$(( changes + 1 )); }
                ;;
            *)
                printf "  ? UNKNOWN  task: %s\n" "$task" >&2
                ;;
        esac
        printf "\n" >&2
    done

    if [[ $changes -eq 0 ]]; then
        printf "${_LOG_GREEN:-}No changes needed — target matches spec.${_LOG_NC:-}\n\n" >&2
        return 0
    else
        printf "${_LOG_YELLOW:-}%d change(s) would be applied.${_LOG_NC:-}\n\n" "$changes" >&2
        return 1
    fi
}
