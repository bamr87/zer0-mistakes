#!/bin/bash
# =============================================================================
# scripts/install/cli.sh — Subcommand dispatcher
# =============================================================================
# Entry point for all installer commands. Sources needed modules and
# routes to the appropriate handler based on the first positional argument.
#
# Usage:
#   cli_main [SUBCOMMAND] [OPTIONS] [TARGET_DIR]
#
# Subcommands:
#   init       Build spec from flags, run doctor, apply tasks
#   wizard     Interactive TUI (--ai flag invokes ai/wizard.sh)
#   agents     Install AI agent files only
#   deploy     Configure deployment target(s) only
#   doctor     Run health checks only
#   diagnose   AI-assisted diagnostics
#   upgrade    Re-run apply on an existing install
#   diff       Show what apply would change
#   plan       Print the spec that would be generated (without applying)
#   list-profiles   List available profiles
#   list-tasks      List available tasks
#   version         Print installer version
#   help            Print usage
#
# Global flags (accepted by all subcommands):
#   --dry-run           No filesystem writes
#   --force             Overwrite existing files
#   --no-backup         Skip file backups
#   --non-interactive   No prompts; use defaults
#   --auto-accept       Auto-confirm all prompts
#   --skip-doctor       Skip pre-install health checks
#   --verbose           Extra debug output
#   --output json|human Log format (default: human)
#   --profile NAME      Installation profile
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_CLI_LIB:-}" ]] && return 0
_HAS_CLI_LIB=1

_CLI_VERSION="2.0.0"

# ---- module root --------------------------------------------------------
_CLI_DIR="${_CLI_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)}"

# ---- source helpers -------------------------------------------------------
_cli_require() {
    local mod="$1"
    local f="${_CLI_DIR}/${mod}"
    if [[ -f "$f" ]]; then
        # shellcheck source=/dev/null
        source "$f"
    else
        echo "[ERROR] cli.sh: required module not found: $f" >&2
        return 1
    fi
}

_cli_load_core() {
    _cli_require "log.sh"
    _cli_require "platform.sh"
    _cli_require "fs.sh"
    _cli_require "template.sh"
    _cli_require "prompt.sh"
    _cli_require "spec.sh"
    _cli_require "plan.sh"
    _cli_require "apply.sh"
    _cli_require "diff.sh"
    _cli_require "doctor.sh"
}

# ---------------------------------------------------------------------------
# Flag parser — sets _FLAG_* and _CLI_SUBCOMMAND, _CLI_TARGET
# ---------------------------------------------------------------------------
_cli_parse_flags() {
    _FLAG_PROFILE=""
    _FLAG_DRY_RUN=0
    _FLAG_FORCE=0
    _FLAG_NO_BACKUP=0
    _FLAG_NON_INTERACTIVE=0
    _FLAG_AUTO_ACCEPT=0
    _FLAG_SKIP_DOCTOR=0
    _FLAG_VERBOSE=0
    _FLAG_OUTPUT=""
    _FLAG_SITE_TITLE=""
    _FLAG_SITE_DESC=""
    _FLAG_SITE_URL=""
    _FLAG_SITE_AUTHOR=""
    _FLAG_SITE_EMAIL=""
    _FLAG_GITHUB_USER=""
    _FLAG_GITHUB_REPO=""
    _FLAG_THEME_SOURCE=""
    _FLAG_DEPLOY=""
    _FLAG_AGENTS=""
    _FLAG_TASKS=""
    _FLAG_AI=0
    _FLAG_SPEC=""
    _CLI_TARGET=""

    # Export flag globals for plan.sh
    export _FLAG_PROFILE _FLAG_DRY_RUN _FLAG_FORCE _FLAG_NO_BACKUP \
           _FLAG_NON_INTERACTIVE _FLAG_AUTO_ACCEPT _FLAG_SKIP_DOCTOR \
           _FLAG_VERBOSE _FLAG_OUTPUT _FLAG_SITE_TITLE _FLAG_SITE_DESC \
           _FLAG_SITE_URL _FLAG_SITE_AUTHOR _FLAG_SITE_EMAIL \
           _FLAG_GITHUB_USER _FLAG_GITHUB_REPO _FLAG_THEME_SOURCE \
           _FLAG_DEPLOY _FLAG_AGENTS _FLAG_TASKS _FLAG_AI _FLAG_SPEC

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)           _FLAG_DRY_RUN=1 ;;
            --force)             _FLAG_FORCE=1 ;;
            --no-backup)         _FLAG_NO_BACKUP=1 ;;
            --non-interactive)   _FLAG_NON_INTERACTIVE=1 ;;
            --auto-accept)       _FLAG_AUTO_ACCEPT=1 ;;
            --skip-doctor)       _FLAG_SKIP_DOCTOR=1 ;;
            --verbose|-v)        _FLAG_VERBOSE=1 ;;
            --ai)                _FLAG_AI=1 ;;
            --profile)           shift; _FLAG_PROFILE="${1:-}" ;;
            --profile=*)         _FLAG_PROFILE="${1#--profile=}" ;;
            --output)            shift; _FLAG_OUTPUT="${1:-}" ;;
            --output=*)          _FLAG_OUTPUT="${1#--output=}" ;;
            --site-title)        shift; _FLAG_SITE_TITLE="${1:-}" ;;
            --site-title=*)      _FLAG_SITE_TITLE="${1#--site-title=}" ;;
            --site-desc)         shift; _FLAG_SITE_DESC="${1:-}" ;;
            --site-desc=*)       _FLAG_SITE_DESC="${1#--site-desc=}" ;;
            --site-url)          shift; _FLAG_SITE_URL="${1:-}" ;;
            --site-url=*)        _FLAG_SITE_URL="${1#--site-url=}" ;;
            --site-author)       shift; _FLAG_SITE_AUTHOR="${1:-}" ;;
            --site-author=*)     _FLAG_SITE_AUTHOR="${1#--site-author=}" ;;
            --site-email)        shift; _FLAG_SITE_EMAIL="${1:-}" ;;
            --site-email=*)      _FLAG_SITE_EMAIL="${1#--site-email=}" ;;
            --github-user)       shift; _FLAG_GITHUB_USER="${1:-}" ;;
            --github-user=*)     _FLAG_GITHUB_USER="${1#--github-user=}" ;;
            --github-repo)       shift; _FLAG_GITHUB_REPO="${1:-}" ;;
            --github-repo=*)     _FLAG_GITHUB_REPO="${1#--github-repo=}" ;;
            --theme-source)      shift; _FLAG_THEME_SOURCE="${1:-}" ;;
            --theme-source=*)    _FLAG_THEME_SOURCE="${1#--theme-source=}" ;;
            --deploy)            shift; _FLAG_DEPLOY="${1:-}" ;;
            --deploy=*)          _FLAG_DEPLOY="${1#--deploy=}" ;;
            --agents)            shift; _FLAG_AGENTS="${1:-}" ;;
            --agents=*)          _FLAG_AGENTS="${1#--agents=}" ;;
            --tasks)             shift; _FLAG_TASKS="${1:-}" ;;
            --tasks=*)           _FLAG_TASKS="${1#--tasks=}" ;;
            --spec)              shift; _FLAG_SPEC="${1:-}" ;;
            --spec=*)            _FLAG_SPEC="${1#--spec=}" ;;
            # Compat: --claude|--cursor|--aider|--copilot|--all (agents subcommand)
            --claude|--cursor|--aider|--copilot|--all)
                local _agent="${1#--}"
                _FLAG_AGENTS="${_FLAG_AGENTS:+$_FLAG_AGENTS }${_agent}"
                ;;
            --*)
                log_warning "Unknown flag: $1 (ignored)"
                ;;
            *)
                # First non-flag after subcommand is target dir
                if [[ -z "$_CLI_TARGET" ]]; then
                    _CLI_TARGET="$1"
                fi
                ;;
        esac
        shift
    done

    # Apply verbose immediately
    [[ "$_FLAG_VERBOSE" == "1" ]] && _LOG_VERBOSE=1

    export _CLI_TARGET
}

# ---------------------------------------------------------------------------
# Subcommand handlers
# ---------------------------------------------------------------------------
_cmd_init() {
    local target="${_CLI_TARGET:-$(pwd)}"

    plan_build "$target" "${_FLAG_PROFILE:-default}"

    # Optionally print the spec before applying
    if [[ "$_FLAG_VERBOSE" == "1" ]]; then
        log_debug "--- generated spec ---"
        plan_print >&2
        log_debug "--- end spec ---"
    fi

    local spec_file
    spec_file="$(spec_path "$target")"

    # Write spec first (apply.sh will re-read it)
    spec_write "$spec_file"

    apply_run "$spec_file"
}

_cmd_wizard() {
    local target="${_CLI_TARGET:-$(pwd)}"

    if [[ "$_FLAG_AI" == "1" ]]; then
        local wizard="${_CLI_DIR}/ai/wizard.sh"
        if [[ -f "$wizard" ]]; then
            # shellcheck source=/dev/null
            source "$wizard"
            if ai_wizard_run "$target"; then
                # Spec has been written; now apply it (unless dry-run)
                local spec_file="$(spec_path "$target")"
                apply_run "$spec_file"
                return $?
            else
                return 1
            fi
        else
            log_error "AI wizard not available: $wizard"
            return 1
        fi
    else
        local tui="${_CLI_DIR}/tui.sh"
        if [[ -f "$tui" ]]; then
            # shellcheck source=/dev/null
            source "$tui"
            tui_run "$target"
        else
            log_warning "Interactive wizard not available. Falling back to 'init'."
            _cmd_init
        fi
    fi
}

_cmd_agents() {
    local target="${_CLI_TARGET:-$(pwd)}"
    local spec_file

    # Load existing spec if present; otherwise build one with agents-only task
    spec_file="$(spec_path "$target")"
    if [[ -f "$spec_file" ]]; then
        spec_read "$spec_file"
    else
        plan_build "$target"
    fi

    # Override agents from flag
    [[ -n "${_FLAG_AGENTS:-}" ]] && SPEC_AGENTS="$_FLAG_AGENTS"
    SPEC_TASKS="agents"

    spec_write "$spec_file"
    apply_run "$spec_file"
}

_cmd_deploy() {
    local target="${_CLI_TARGET:-$(pwd)}"
    local spec_file="$(spec_path "$target")"

    if [[ -f "$spec_file" ]]; then
        spec_read "$spec_file"
    else
        plan_build "$target"
    fi

    [[ -n "${_FLAG_DEPLOY:-}" ]] && SPEC_DEPLOY="$_FLAG_DEPLOY"
    SPEC_TASKS=""   # only run deploy plugins

    spec_write "$spec_file"
    apply_run "$spec_file"
}

_cmd_doctor() {
    local target="${_CLI_TARGET:-$(pwd)}"
    local spec_file="$(spec_path "$target")"
    [[ -f "$spec_file" ]] && spec_read "$spec_file"
    doctor_run "$target"
}

_cmd_diff() {
    local target="${_CLI_TARGET:-$(pwd)}"
    local spec_file

    if [[ -n "${_FLAG_SPEC:-}" ]]; then
        spec_file="$_FLAG_SPEC"
    else
        spec_file="$(spec_path "$target")"
        if [[ ! -f "$spec_file" ]]; then
            log_info "No spec found at $spec_file — building from current flags..."
            plan_build "$target"
            local tmp
            tmp=$(mktemp /tmp/zer0-spec-XXXXXX.json)
            spec_write "$tmp"
            spec_file="$tmp"
        fi
    fi

    diff_spec "$spec_file"
}

_cmd_plan() {
    local target="${_CLI_TARGET:-$(pwd)}"
    plan_build "$target" "${_FLAG_PROFILE:-default}"
    plan_print
}

_cmd_upgrade() {
    local target="${_CLI_TARGET:-$(pwd)}"
    local spec_file="$(spec_path "$target")"

    if [[ ! -f "$spec_file" ]]; then
        log_error "upgrade: no spec found at $target — run 'init' first"
        return 1
    fi

    spec_read "$spec_file"

    # Flag overrides
    plan_apply_flags
    plan_apply_platform

    spec_write "$spec_file"
    apply_run "$spec_file"
}

_cmd_diagnose() {
    local target="${_CLI_TARGET:-$(pwd)}"

    if [[ "$_FLAG_AI" == "1" ]]; then
        local diag="${_CLI_DIR}/ai/diagnose.sh"
        if [[ -f "$diag" ]]; then
            # shellcheck source=/dev/null
            source "$diag"
            ai_diagnose_run "$target"
            return $?
        fi
        log_warning "AI diagnose module not available — falling back to doctor"
    fi
    _cmd_doctor
}

_cmd_list_profiles() {
    local profiles_dir="${TEMPLATES_DIR:-}/profiles"
    if [[ -d "$profiles_dir" ]]; then
        printf "Available profiles:\n" >&2
        for f in "${profiles_dir}"/*.yml; do
            [[ -f "$f" ]] || continue
            local name
            name=$(basename "$f" .yml)
            local desc
            desc=$(awk '/^description:/ {sub(/^description:[[:space:]]*/,""); print; exit}' "$f")
            printf "  %-20s %s\n" "$name" "${desc:-}" >&2
        done
    else
        printf "default  minimal  blog  docs  portfolio  github-pages  fork\n" >&2
    fi
}

_cmd_list_tasks() {
    local reg="${_CLI_DIR}/tasks/_registry.sh"
    if [[ -f "$reg" ]]; then
        # shellcheck source=/dev/null
        source "$reg"
        task_list_all | while read -r t; do
            printf "  %-20s %s\n" "$t" "$(task_description "$t")"
        done
    else
        echo "config gemfile docker theme pages nav data devcontainer agents gitignore readme marker"
    fi
}

_cmd_version() {
    echo "zer0-mistakes installer v${_CLI_VERSION}"
}

_cmd_help() {
    cat >&2 <<'USAGE'
zer0-mistakes installer

Usage:
  install <subcommand> [OPTIONS] [TARGET_DIR]

Subcommands:
  init           Install from flags + profile (default)
  wizard         Interactive wizard (--ai for AI-driven spec)
  agents         Install AI agent files only
  deploy         Configure deployment plugin(s)
  doctor         Run pre-install health checks
  diagnose       Diagnose an existing install (--ai for suggestions)
  upgrade        Re-apply spec to an existing install
  diff           Show what would change without applying
  plan           Print the spec that would be generated
  list-profiles  List available installation profiles
  list-tasks     List available installer tasks
  version        Print installer version
  help           Show this help

Global options:
  --profile NAME         Profile: default|minimal|blog|docs|portfolio|github-pages|fork
  --site-title TITLE     Site title
  --site-desc TEXT       Site description
  --site-url URL         Site URL
  --site-author NAME     Author name
  --site-email EMAIL     Author email
  --github-user USER     GitHub username
  --github-repo REPO     GitHub repository name
  --theme-source TYPE    gem|remote|vendored
  --deploy LIST          Comma/space-separated deploy targets
  --agents LIST          AI agent files: copilot,claude,cursor,aider,generic,all
  --tasks LIST           Override task execution list
  --dry-run              Simulate writes; no files modified
  --force                Overwrite existing files
  --no-backup            Skip file backups
  --non-interactive      No prompts; use defaults
  --auto-accept          Auto-confirm all yes/no prompts
  --skip-doctor          Skip pre-install health checks
  --verbose, -v          Extra debug output
  --output json|human    Log format (default: human)
  --ai                   Use AI assistant for wizard/diagnose
  --spec FILE            Load spec from FILE instead of detecting

Examples:
  install init . --profile blog --site-title "My Blog"
  install init ~/mysite --profile github-pages --github-user bamr87
  install wizard . --ai
  install agents . --copilot --claude
  install doctor .
  install diff .
  install upgrade . --force
  install plan . --profile docs
USAGE
}

# ---------------------------------------------------------------------------
# cli_main — entry point
# ---------------------------------------------------------------------------
cli_main() {
    # Set TEMPLATES_DIR if not already set (relative to installer root)
    if [[ -z "${TEMPLATES_DIR:-}" ]]; then
        local _repo_root
        _repo_root="$(cd "${_CLI_DIR}/../.." 2>/dev/null && pwd)"
        TEMPLATES_DIR="${_repo_root}/templates"
        export TEMPLATES_DIR
    fi

    _cli_load_core

    local subcommand="${1:-help}"
    shift || true

    _cli_parse_flags "$@"

    # Apply verbose from flags immediately
    [[ "$_FLAG_VERBOSE" == "1" ]] && _LOG_VERBOSE=1 && export _LOG_VERBOSE
    [[ -n "$_FLAG_OUTPUT" ]]       && _LOG_OUTPUT="$_FLAG_OUTPUT" && export _LOG_OUTPUT

    case "$subcommand" in
        init)           _cmd_init ;;
        wizard)         _cmd_wizard ;;
        agents)         _cmd_agents ;;
        deploy)         _cmd_deploy ;;
        doctor)         _cmd_doctor ;;
        diagnose)       _cmd_diagnose ;;
        upgrade)        _cmd_upgrade ;;
        diff)           _cmd_diff ;;
        plan)           _cmd_plan ;;
        list-profiles)  _cmd_list_profiles ;;
        list-tasks)     _cmd_list_tasks ;;
        version)        _cmd_version ;;
        help|--help|-h) _cmd_help ;;
        *)
            log_error "Unknown subcommand: $subcommand"
            _cmd_help
            return 1
            ;;
    esac
}
