#!/bin/bash
# =============================================================================
# scripts/install/apply.sh — Execute an install spec
# =============================================================================
# apply.sh is THE ONLY WRITER in the installer. All tasks call fs.sh and
# template.sh — never write directly.
#
# Provides:
#   apply_run SPEC_FILE
#       Read spec, run doctor (unless skip_doctor), execute task sequence,
#       write marker on success.
#
#   apply_task TASK_NAME TARGET_DIR
#       Source and execute a single task from scripts/install/tasks/TASK.sh
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_APPLY_LIB:-}" ]] && return 0
_HAS_APPLY_LIB=1

# Directory where task modules live
_APPLY_TASKS_DIR="${_APPLY_TASKS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)/tasks}"

# ---------------------------------------------------------------------------
# apply_task TASK TARGET_DIR — source and run one task
# ---------------------------------------------------------------------------
apply_task() {
    local task="$1"
    local target="$2"
    local task_file="${_APPLY_TASKS_DIR}/${task}.sh"

    if [[ ! -f "$task_file" ]]; then
        log_warning "apply_task: task not found: $task (skipping)"
        return 0
    fi

    log_step "Task: $task"
    # shellcheck source=/dev/null
    source "$task_file"

    local fn_name="task_${task}_run"
    if [[ "$(type -t "$fn_name")" != "function" ]]; then
        log_error "apply_task: task file $task_file does not define $fn_name"
        log_step_done
        return 1
    fi

    "$fn_name" "$target"
    local ret=$?
    log_step_done

    return $ret
}

# ---------------------------------------------------------------------------
# apply_run SPEC_FILE
# ---------------------------------------------------------------------------
apply_run() {
    local spec_file="$1"

    if [[ ! -f "$spec_file" ]]; then
        log_error "apply_run: spec file not found: $spec_file"
        return 1
    fi

    # Load spec into SPEC_* globals
    spec_read "$spec_file"

    local target="${SPEC_TARGET_DIR:-}"
    if [[ -z "$target" ]]; then
        log_error "apply_run: spec.target_dir is empty"
        return 1
    fi

    # Sync option globals → fs.sh and prompt.sh
    [[ "$SPEC_OPT_DRY_RUN" == "true" ]]         && _FS_DRY_RUN=1    || _FS_DRY_RUN=0
    [[ "$SPEC_OPT_FORCE" == "true" ]]             && _FS_FORCE=1      || _FS_FORCE=0
    [[ "$SPEC_OPT_BACKUP" == "false" ]]           && _FS_BACKUP=0     || _FS_BACKUP=1
    [[ "$SPEC_OPT_VERBOSE" == "true" ]]           && _LOG_VERBOSE=1   || _LOG_VERBOSE=0
    [[ "$SPEC_OPT_NON_INTERACTIVE" == "true" ]]   && _PROMPT_NON_INTERACTIVE=1 || _PROMPT_NON_INTERACTIVE=0
    [[ "$SPEC_OPT_AUTO_ACCEPT" == "true" ]]       && _PROMPT_AUTO_ACCEPT=1     || _PROMPT_AUTO_ACCEPT=0
    [[ "$SPEC_OPT_OUTPUT" == "json" ]]            && _LOG_OUTPUT="json"         || _LOG_OUTPUT="human"

    export _FS_DRY_RUN _FS_FORCE _FS_BACKUP _LOG_VERBOSE \
           _PROMPT_NON_INTERACTIVE _PROMPT_AUTO_ACCEPT _LOG_OUTPUT

    # Propagate spec → template globals
    SITE_TITLE="${SPEC_SITE_TITLE:-My Jekyll Site}"
    SITE_DESCRIPTION="${SPEC_SITE_DESCRIPTION:-}"
    SITE_AUTHOR="${SPEC_SITE_AUTHOR:-}"
    SITE_EMAIL="${SPEC_SITE_EMAIL:-}"
    SITE_URL="${SPEC_SITE_URL:-}"
    SITE_TIMEZONE="${SPEC_SITE_TIMEZONE:-UTC}"
    SITE_LOCALE="${SPEC_SITE_LOCALE:-en}"
    GITHUB_USER="${SPEC_GITHUB_USER:-}"
    GITHUB_REPO="${SPEC_GITHUB_REPO:-}"
    GITHUB_PAGES_BRANCH="${SPEC_GITHUB_PAGES_BRANCH:-gh-pages}"
    REPOSITORY_NAME="${SPEC_GITHUB_REPO:-${REPOSITORY_NAME:-}}"
    THEME_SOURCE="${SPEC_THEME_SOURCE:-gem}"
    INSTALL_PROFILE="${SPEC_PROFILE:-default}"
    export SITE_TITLE SITE_DESCRIPTION SITE_AUTHOR SITE_EMAIL SITE_URL \
           SITE_TIMEZONE SITE_LOCALE GITHUB_USER GITHUB_REPO \
           GITHUB_PAGES_BRANCH REPOSITORY_NAME THEME_SOURCE INSTALL_PROFILE

    log_banner "zer0-mistakes installer — applying spec"
    log_info "Target : $target"
    log_info "Profile: ${SPEC_PROFILE:-default}"
    log_info "Tasks  : ${SPEC_TASKS}"
    [[ -n "${SPEC_DEPLOY:-}" ]] && log_info "Deploy : $SPEC_DEPLOY"
    [[ -n "${SPEC_AGENTS:-}" ]] && log_info "Agents : $SPEC_AGENTS"
    [[ "$_FS_DRY_RUN" == "1" ]] && log_warning "DRY RUN — no files will be written"

    # Ensure target directory exists
    if [[ "$(type -t fs_ensure_dir)" == "function" ]]; then
        fs_ensure_dir "$target"
    else
        mkdir -p "$target"
    fi

    # Run doctor unless skipped
    if [[ "$SPEC_OPT_SKIP_DOCTOR" != "true" ]]; then
        if [[ "$(type -t doctor_run)" == "function" ]]; then
            doctor_run "$target" || true   # warn but don't abort
        fi
    fi

    # Execute tasks in order
    local failed_tasks=""
    local task
    for task in ${SPEC_TASKS}; do
        apply_task "$task" "$target" || {
            log_error "Task failed: $task"
            failed_tasks="${failed_tasks} $task"
        }
    done

    # Deploy plugins
    for task in ${SPEC_DEPLOY:-}; do
        apply_task "deploy_${task}" "$target" || \
            log_warning "Deploy task failed: $task (continuing)"
    done

    # Agent files
    if [[ -n "${SPEC_AGENTS:-}" ]]; then
        apply_task "agents" "$target" || \
            log_warning "Agents task failed (continuing)"
    fi

    if [[ -n "$failed_tasks" ]]; then
        log_error "Some tasks failed:$failed_tasks"
        return 1
    fi

    log_success "All tasks completed for: $target"
    return 0
}
