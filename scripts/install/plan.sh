#!/bin/bash
# =============================================================================
# scripts/install/plan.sh — Build an install spec from inputs
# =============================================================================
# Accepts: profile, CLI flags, environment variables, detected platform.
# Produces: populated SPEC_* globals (see spec.sh for the full list).
# The three front-ends (flags, tui.sh, ai/wizard.sh) all call plan_build.
#
# Provides:
#   plan_build TARGET_DIR [PROFILE]
#       Merge layers (profile → env-var overrides → CLI flags → platform
#       defaults) into SPEC_* globals. Does NOT write any files.
#
#   plan_load_profile PROFILE_FILE
#       Read a templates/profiles/*.yml file into SPEC_* globals
#       (lower priority than explicit flag overrides).
#
#   plan_apply_flags
#       Copy flag globals (_FLAG_*) set by cli.sh into SPEC_* globals.
#
#   plan_apply_platform
#       Auto-detect SPEC_THEME_SOURCE if not set:
#         - Docker available → gem
#         - GitHub Pages mode → remote
#         - fallback → gem
#
#   plan_print [FILE]
#       Print the spec to stdout or FILE as formatted JSON.
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_PLAN_LIB:-}" ]] && return 0
_HAS_PLAN_LIB=1

# ---------------------------------------------------------------------------
# plan_load_profile PROFILE_FILE
# ---------------------------------------------------------------------------
plan_load_profile() {
    local profile_file="$1"
    [[ -f "$profile_file" ]] || return 0

    # Read scalar fields
    local val
    # profile_get_scalar is provided by profile.sh if sourced; fall back to awk
    _plan_yaml_scalar() {
        local file="$1" key="$2"
        awk -v k="$key" '
            $0 ~ "^[[:space:]]*" k "[[:space:]]*:" {
                sub("^[[:space:]]*" k "[[:space:]]*:[[:space:]]*", "")
                sub(/[[:space:]]+#.*$/, "")
                gsub(/^["'"'"']|["'"'"']$/, "")
                print; exit
            }
        ' "$file"
    }

    val=$(_plan_yaml_scalar "$profile_file" "profile")
    [[ -n "$val" ]] && SPEC_PROFILE="$val"

    val=$(_plan_yaml_scalar "$profile_file" "theme_source")
    [[ -n "$val" ]] && SPEC_THEME_SOURCE="$val"

    val=$(_plan_yaml_scalar "$profile_file" "theme_version")
    [[ -n "$val" ]] && SPEC_THEME_VERSION="$val"

    val=$(_plan_yaml_scalar "$profile_file" "site_title")
    [[ -n "$val" ]] && : "${SPEC_SITE_TITLE:=$val}"

    val=$(_plan_yaml_scalar "$profile_file" "site_description")
    [[ -n "$val" ]] && : "${SPEC_SITE_DESCRIPTION:=$val}"

    val=$(_plan_yaml_scalar "$profile_file" "site_timezone")
    [[ -n "$val" ]] && : "${SPEC_SITE_TIMEZONE:=$val}"

    val=$(_plan_yaml_scalar "$profile_file" "github_pages_branch")
    [[ -n "$val" ]] && : "${SPEC_GITHUB_PAGES_BRANCH:=$val}"

    # Tasks list from profile (space-separated after join)
    local tasks
    tasks=$(awk '
        /^[[:space:]]*tasks[[:space:]]*:/ { found=1; next }
        found && /^[[:space:]]*-[[:space:]]+/ {
            line=$0; sub(/^[[:space:]]*-[[:space:]]+/, "", line)
            gsub(/[[:space:]]/, "", line)
            printf "%s ", line
        }
        found && !/^[[:space:]]*-/ && NF { exit }
    ' "$profile_file" | sed 's/[[:space:]]*$//')
    [[ -n "$tasks" ]] && SPEC_TASKS="$tasks"

    # Deploy list from profile (accepts `deploy:` or `deploy_targets:`)
    local deploy
    deploy=$(awk '
        /^[[:space:]]*deploy(_targets)?[[:space:]]*:/ { found=1; next }
        found && /^[[:space:]]*-[[:space:]]+/ {
            line=$0; sub(/^[[:space:]]*-[[:space:]]+/, "", line)
            gsub(/[[:space:]]/, "", line)
            printf "%s ", line
        }
        found && !/^[[:space:]]*-/ && NF { exit }
    ' "$profile_file" | sed 's/[[:space:]]*$//')
    [[ -n "$deploy" ]] && : "${SPEC_DEPLOY:=$deploy}"

    # Agents list from profile (accepts top-level `agents:` or nested `ai_features.agent_files:`)
    local agents
    agents=$(awk '
        /^[[:space:]]*agents[[:space:]]*:/ { in_agents=1; in_af=0; next }
        /^[[:space:]]*ai_features[[:space:]]*:/ { in_af_block=1; next }
        in_af_block && /^[[:space:]]*agent_files[[:space:]]*:/ {
            in_af=1
            # Inline flow form: agent_files: [foo, bar]
            line=$0; sub(/^[^\[]*\[/, "", line); sub(/\].*$/, "", line)
            gsub(/[[:space:],]+/, " ", line)
            if (length(line) > 0 && line !~ /^[[:space:]]*$/) printf "%s ", line
            next
        }
        (in_agents || in_af) && /^[[:space:]]*-[[:space:]]+/ {
            line=$0; sub(/^[[:space:]]*-[[:space:]]+/, "", line)
            gsub(/[[:space:]]/, "", line)
            printf "%s ", line
            next
        }
        (in_agents || in_af) && /^[^[:space:]-]/ { in_agents=0; in_af=0 }
        /^[^[:space:]]/ { in_af_block=0 }
    ' "$profile_file" | sed 's/[[:space:]]*$//')
    [[ -n "$agents" ]] && : "${SPEC_AGENTS:=$agents}"
    return 0
}

# ---------------------------------------------------------------------------
# plan_apply_flags — copy _FLAG_* set by cli.sh → SPEC_* (highest priority)
# ---------------------------------------------------------------------------
plan_apply_flags() {
    # Strings — only override when flag was explicitly set (non-empty)
    [[ -n "${_FLAG_PROFILE:-}" ]]     && SPEC_PROFILE="$_FLAG_PROFILE"
    [[ -n "${_FLAG_SITE_TITLE:-}" ]]  && SPEC_SITE_TITLE="$_FLAG_SITE_TITLE"
    [[ -n "${_FLAG_SITE_DESC:-}" ]]   && SPEC_SITE_DESCRIPTION="$_FLAG_SITE_DESC"
    [[ -n "${_FLAG_SITE_URL:-}" ]]    && SPEC_SITE_URL="$_FLAG_SITE_URL"
    [[ -n "${_FLAG_SITE_AUTHOR:-}" ]] && SPEC_SITE_AUTHOR="$_FLAG_SITE_AUTHOR"
    [[ -n "${_FLAG_SITE_EMAIL:-}" ]]  && SPEC_SITE_EMAIL="$_FLAG_SITE_EMAIL"
    [[ -n "${_FLAG_GITHUB_USER:-}" ]] && SPEC_GITHUB_USER="$_FLAG_GITHUB_USER"
    [[ -n "${_FLAG_GITHUB_REPO:-}" ]] && SPEC_GITHUB_REPO="$_FLAG_GITHUB_REPO"
    [[ -n "${_FLAG_THEME_SOURCE:-}" ]] && SPEC_THEME_SOURCE="$_FLAG_THEME_SOURCE"
    [[ -n "${_FLAG_DEPLOY:-}" ]]      && SPEC_DEPLOY="$_FLAG_DEPLOY"
    [[ -n "${_FLAG_AGENTS:-}" ]]      && SPEC_AGENTS="$_FLAG_AGENTS"
    [[ -n "${_FLAG_TASKS:-}" ]]       && SPEC_TASKS="$_FLAG_TASKS"

    # Booleans — flags are set to "1" when present
    [[ "${_FLAG_DRY_RUN:-0}" == "1" ]]     && SPEC_OPT_DRY_RUN=true
    [[ "${_FLAG_FORCE:-0}" == "1" ]]        && SPEC_OPT_FORCE=true
    [[ "${_FLAG_NO_BACKUP:-0}" == "1" ]]    && SPEC_OPT_BACKUP=false
    [[ "${_FLAG_NON_INTERACTIVE:-0}" == "1" ]] && SPEC_OPT_NON_INTERACTIVE=true
    [[ "${_FLAG_AUTO_ACCEPT:-0}" == "1" ]]  && SPEC_OPT_AUTO_ACCEPT=true
    [[ "${_FLAG_SKIP_DOCTOR:-0}" == "1" ]]  && SPEC_OPT_SKIP_DOCTOR=true
    [[ "${_FLAG_VERBOSE:-0}" == "1" ]]      && SPEC_OPT_VERBOSE=true
    [[ -n "${_FLAG_OUTPUT:-}" ]]            && SPEC_OPT_OUTPUT="$_FLAG_OUTPUT"

    # Scrape flags — when --scrape URL is given, register the scrape task
    # so apply.sh runs it (after pages so it can overlay).
    if [[ -n "${_FLAG_SCRAPE_URL:-}" ]]; then
        SPEC_SCRAPE_SOURCE_URL="$_FLAG_SCRAPE_URL"
        [[ -n "${_FLAG_SCRAPE_DEPTH:-}" ]]     && SPEC_SCRAPE_DEPTH="$_FLAG_SCRAPE_DEPTH"
        [[ -n "${_FLAG_SCRAPE_MAX_PAGES:-}" ]] && SPEC_SCRAPE_MAX_PAGES="$_FLAG_SCRAPE_MAX_PAGES"
        case " ${SPEC_TASKS:-} " in
            *" scrape "*) ;;
            *) SPEC_TASKS="${SPEC_TASKS:-} scrape" ;;
        esac
    fi
    return 0
}

# ---------------------------------------------------------------------------
# plan_apply_platform — fill platform-dependent defaults when not set
# ---------------------------------------------------------------------------
plan_apply_platform() {
    # Theme source heuristic
    if [[ -z "${SPEC_THEME_SOURCE:-}" ]]; then
        case "${SPEC_PROFILE:-default}" in
            github-pages) SPEC_THEME_SOURCE="remote" ;;
            *)            SPEC_THEME_SOURCE="gem"     ;;
        esac
    fi

    # Ensure github.repo defaults to REPOSITORY_NAME from env when set
    if [[ -z "${SPEC_GITHUB_REPO:-}" && -n "${REPOSITORY_NAME:-}" ]]; then
        SPEC_GITHUB_REPO="$REPOSITORY_NAME"
    fi

    # Devcontainer task auto-include for github-pages profile
    if [[ "${SPEC_PROFILE:-}" == "github-pages" && -n "${SPEC_TASKS:-}" ]]; then
        case "$SPEC_TASKS" in
            *devcontainer*) ;;
            *) SPEC_TASKS="$SPEC_TASKS devcontainer" ;;
        esac
    fi
}

# ---------------------------------------------------------------------------
# plan_build TARGET_DIR [PROFILE]
# Orchestrates: set target_dir, resolve profile file, load it, apply flags,
# apply platform defaults.
# ---------------------------------------------------------------------------
plan_build() {
    local target_dir="$1"
    local profile_hint="${2:-${_FLAG_PROFILE:-default}}"

    # Canonical absolute path
    case "$target_dir" in
        /*) ;;
        *) target_dir="$(pwd)/${target_dir}" ;;
    esac

    # Seed required fields
    SPEC_TARGET_DIR="$target_dir"
    SPEC_PROFILE="${profile_hint}"

    # Set global template variable mirrors used by template.sh
    SITE_TITLE="${SPEC_SITE_TITLE:-${SITE_TITLE:-My Jekyll Site}}"
    INSTALL_PROFILE="$SPEC_PROFILE"

    # Locate profile file
    local profile_file=""
    if [[ -n "${TEMPLATES_DIR:-}" ]]; then
        profile_file="${TEMPLATES_DIR}/profiles/${SPEC_PROFILE}.yml"
        if [[ ! -f "$profile_file" ]]; then
            log_warning "Profile not found: ${SPEC_PROFILE} — using defaults"
            profile_file=""
        fi
    fi

    # Layer 1: Profile defaults
    [[ -n "$profile_file" ]] && plan_load_profile "$profile_file"

    # Layer 2: Environment variable overrides (ZER0_SITE_* etc.)
    [[ -n "${ZER0_SITE_TITLE:-}" ]]  && SPEC_SITE_TITLE="$ZER0_SITE_TITLE"
    [[ -n "${ZER0_SITE_AUTHOR:-}" ]] && SPEC_SITE_AUTHOR="$ZER0_SITE_AUTHOR"
    [[ -n "${ZER0_SITE_EMAIL:-}" ]]  && SPEC_SITE_EMAIL="$ZER0_SITE_EMAIL"
    [[ -n "${ZER0_GITHUB_USER:-}" ]] && SPEC_GITHUB_USER="$ZER0_GITHUB_USER"
    [[ -n "${ZER0_GITHUB_REPO:-}" ]] && SPEC_GITHUB_REPO="$ZER0_GITHUB_REPO"

    # Layer 3: CLI flags (highest priority)
    plan_apply_flags

    # Layer 4: Platform defaults
    plan_apply_platform

    # Ensure tasks list is never empty
    if [[ -z "${SPEC_TASKS:-}" ]]; then
        SPEC_TASKS="config gemfile docker pages nav data gitignore readme marker"
    fi

    # Propagate spec values to template.sh globals
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
    THEME_SOURCE="${SPEC_THEME_SOURCE:-gem}"
    REPOSITORY_NAME="${SPEC_GITHUB_REPO:-${REPOSITORY_NAME:-}}"

    export SPEC_TARGET_DIR SPEC_PROFILE SPEC_TASKS SPEC_DEPLOY SPEC_AGENTS \
        SPEC_SITE_TITLE SPEC_SITE_DESCRIPTION SPEC_SITE_URL \
        SPEC_SITE_AUTHOR SPEC_SITE_EMAIL SPEC_SITE_TIMEZONE SPEC_SITE_LOCALE \
        SPEC_GITHUB_USER SPEC_GITHUB_REPO SPEC_GITHUB_PAGES_BRANCH \
        SPEC_GITHUB_ENABLE_PAGES SPEC_THEME_SOURCE SPEC_THEME_VERSION \
        SPEC_OPT_DRY_RUN SPEC_OPT_FORCE SPEC_OPT_BACKUP \
        SPEC_OPT_NON_INTERACTIVE SPEC_OPT_OUTPUT SPEC_OPT_AUTO_ACCEPT \
        SPEC_OPT_SKIP_DOCTOR SPEC_OPT_VERBOSE \
        SITE_TITLE SITE_DESCRIPTION SITE_AUTHOR SITE_EMAIL SITE_URL \
        SITE_TIMEZONE SITE_LOCALE GITHUB_USER GITHUB_REPO \
        GITHUB_PAGES_BRANCH THEME_SOURCE REPOSITORY_NAME INSTALL_PROFILE

    log_debug "plan_build: target=$SPEC_TARGET_DIR profile=$SPEC_PROFILE tasks='$SPEC_TASKS'"
}

# ---------------------------------------------------------------------------
# plan_print [FILE] — print the spec (uses spec_write to a tmp then cat)
# ---------------------------------------------------------------------------
plan_print() {
    local out="${1:-}"
    # Temporarily disable dry-run so spec_write actually writes
    local saved_dry="${_FS_DRY_RUN:-0}"
    _FS_DRY_RUN=0
    if [[ -n "$out" ]]; then
        spec_write "$out"
    else
        local tmp
        tmp=$(mktemp /tmp/zer0-plan-XXXXXX.json)
        spec_write "$tmp"
        cat "$tmp"
        rm -f "$tmp"
    fi
    _FS_DRY_RUN="$saved_dry"
}
