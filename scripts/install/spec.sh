#!/bin/bash
# =============================================================================
# scripts/install/spec.sh — Install spec JSON I/O and validation
# =============================================================================
# The spec is a JSON document that fully describes an installer run.
# This module handles creating, reading, writing, and validating specs
# without requiring jq (uses a pure-bash fallback for basic reads).
#
# Provides:
#   spec_default          → print a minimal valid spec to stdout
#   spec_write  FILE      → write current spec env-vars to FILE as JSON
#   spec_read   FILE      → export spec env-vars from FILE
#   spec_validate FILE    → validate FILE against schema; print errors
#   spec_get    FILE KEY  → print value for KEY (dot-notation: site.title)
#   spec_hash   FILE      → print sha256 of spec content
#   spec_path   TARGET    → canonical spec file path for TARGET dir
#
# Spec globals (populated by spec_read / plan.sh):
#   SPEC_SCHEMA_VERSION SPEC_TARGET_DIR SPEC_PROFILE
#   SPEC_SITE_TITLE SPEC_SITE_DESCRIPTION SPEC_SITE_URL
#   SPEC_SITE_AUTHOR SPEC_SITE_EMAIL SPEC_SITE_TIMEZONE SPEC_SITE_LOCALE
#   SPEC_GITHUB_USER SPEC_GITHUB_REPO SPEC_GITHUB_PAGES_BRANCH SPEC_GITHUB_ENABLE_PAGES
#   SPEC_THEME_SOURCE SPEC_THEME_VERSION
#   SPEC_TASKS (space-separated)
#   SPEC_DEPLOY (space-separated)
#   SPEC_AGENTS (space-separated)
#   SPEC_OPT_DRY_RUN SPEC_OPT_FORCE SPEC_OPT_BACKUP
#   SPEC_OPT_NON_INTERACTIVE SPEC_OPT_OUTPUT SPEC_OPT_AUTO_ACCEPT
#   SPEC_OPT_SKIP_DOCTOR SPEC_OPT_VERBOSE
#   SPEC_AI_USED SPEC_AI_PROVIDER SPEC_AI_MODEL
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_SPEC_LIB:-}" ]] && return 0
_HAS_SPEC_LIB=1

# Relative path inside target dir where the spec is stored
SPEC_FILE_NAME=".zer0/install.spec.json"

spec_path() {
    local target_dir="$1"
    echo "${target_dir}/${SPEC_FILE_NAME}"
}

# ---------------------------------------------------------------------------
# spec_default — print a minimal valid spec with sensible defaults
# ---------------------------------------------------------------------------
spec_default() {
    cat <<'SPEC'
{
  "schema_version": "1",
  "target_dir": "",
  "profile": "default",
  "site": {
    "title": "My Jekyll Site",
    "description": "A Jekyll site built with zer0-mistakes",
    "url": "",
    "author": "Site Author",
    "email": "",
    "timezone": "UTC",
    "locale": "en"
  },
  "github": {
    "user": "",
    "repo": "",
    "pages_branch": "gh-pages",
    "enable_pages": false
  },
  "theme": {
    "source": "gem",
    "version": ""
  },
  "tasks": ["config","gemfile","docker","pages","nav","data","gitignore","readme","marker"],
  "deploy": [],
  "agents": [],
  "options": {
    "dry_run": false,
    "force": false,
    "backup": true,
    "non_interactive": false,
    "output": "human",
    "auto_accept": false,
    "skip_doctor": false,
    "verbose": false
  },
  "ai": {
    "used": false,
    "provider": "openai",
    "model": "",
    "tokens_estimated": 0,
    "spec_hash": ""
  },
  "scrape": {
    "source_url": "",
    "depth": 2,
    "max_pages": 25,
    "out_dir": "",
    "include_nav": true
  }
}
SPEC
}

# ---------------------------------------------------------------------------
# spec_write FILE — serialise current SPEC_* globals to JSON
# ---------------------------------------------------------------------------
spec_write() {
    local out_file="$1"
    local dry_run="${_FS_DRY_RUN:-0}"

    # Build tasks array from space-separated SPEC_TASKS
    local tasks_json=""
    local t
    for t in ${SPEC_TASKS:-config gemfile docker pages nav data gitignore readme marker}; do
        tasks_json="${tasks_json}\"${t}\","
    done
    tasks_json="[${tasks_json%,}]"

    local deploy_json=""
    for t in ${SPEC_DEPLOY:-}; do
        deploy_json="${deploy_json}\"${t}\","
    done
    deploy_json="[${deploy_json%,}]"

    local agents_json=""
    for t in ${SPEC_AGENTS:-}; do
        agents_json="${agents_json}\"${t}\","
    done
    agents_json="[${agents_json%,}]"

    local json
    json=$(cat <<JSON
{
  "schema_version": "1",
  "target_dir": "${SPEC_TARGET_DIR:-}",
  "profile": "${SPEC_PROFILE:-default}",
  "site": {
    "title": "${SPEC_SITE_TITLE:-My Jekyll Site}",
    "description": "${SPEC_SITE_DESCRIPTION:-A Jekyll site built with zer0-mistakes}",
    "url": "${SPEC_SITE_URL:-}",
    "author": "${SPEC_SITE_AUTHOR:-Site Author}",
    "email": "${SPEC_SITE_EMAIL:-}",
    "timezone": "${SPEC_SITE_TIMEZONE:-UTC}",
    "locale": "${SPEC_SITE_LOCALE:-en}"
  },
  "github": {
    "user": "${SPEC_GITHUB_USER:-}",
    "repo": "${SPEC_GITHUB_REPO:-}",
    "pages_branch": "${SPEC_GITHUB_PAGES_BRANCH:-gh-pages}",
    "enable_pages": ${SPEC_GITHUB_ENABLE_PAGES:-false}
  },
  "theme": {
    "source": "${SPEC_THEME_SOURCE:-gem}",
    "version": "${SPEC_THEME_VERSION:-}"
  },
  "tasks": ${tasks_json},
  "deploy": ${deploy_json},
  "agents": ${agents_json},
  "options": {
    "dry_run": ${SPEC_OPT_DRY_RUN:-false},
    "force": ${SPEC_OPT_FORCE:-false},
    "backup": ${SPEC_OPT_BACKUP:-true},
    "non_interactive": ${SPEC_OPT_NON_INTERACTIVE:-false},
    "output": "${SPEC_OPT_OUTPUT:-human}",
    "auto_accept": ${SPEC_OPT_AUTO_ACCEPT:-false},
    "skip_doctor": ${SPEC_OPT_SKIP_DOCTOR:-false},
    "verbose": ${SPEC_OPT_VERBOSE:-false}
  },
  "ai": {
    "used": ${SPEC_AI_USED:-false},
    "provider": "${SPEC_AI_PROVIDER:-openai}",
    "model": "${SPEC_AI_MODEL:-}",
    "tokens_estimated": ${SPEC_AI_TOKENS:-0},
    "spec_hash": ""
  },
  "scrape": {
    "source_url": "${SPEC_SCRAPE_SOURCE_URL:-}",
    "depth": ${SPEC_SCRAPE_DEPTH:-2},
    "max_pages": ${SPEC_SCRAPE_MAX_PAGES:-25},
    "out_dir": "${SPEC_SCRAPE_OUT_DIR:-}",
    "include_nav": ${SPEC_SCRAPE_INCLUDE_NAV:-true}
  }
}
JSON
)

    if [[ "$dry_run" == "1" ]]; then
        log_debug "[dry-run] would write spec: $out_file"
        return 0
    fi

    if [[ "$(type -t fs_ensure_dir)" == "function" ]]; then
        fs_ensure_dir "$(dirname "$out_file")"
    else
        mkdir -p "$(dirname "$out_file")"
    fi

    printf '%s\n' "$json" > "$out_file"
    log_debug "Spec written: $out_file"
}

# ---------------------------------------------------------------------------
# spec_read FILE — parse JSON spec → export SPEC_* globals
# Use jq when available; fall back to pure-bash awk parser for core fields.
# ---------------------------------------------------------------------------
spec_read() {
    local in_file="$1"
    if [[ ! -f "$in_file" ]]; then
        log_error "spec_read: file not found: $in_file"
        return 1
    fi

    if command -v jq >/dev/null 2>&1; then
        _spec_read_jq "$in_file"
    else
        _spec_read_awk "$in_file"
    fi
}

# jq-powered reader
_spec_read_jq() {
    local f="$1"
    SPEC_SCHEMA_VERSION=$(jq -r '.schema_version // "1"' "$f")
    SPEC_TARGET_DIR=$(jq -r '.target_dir // ""' "$f")
    SPEC_PROFILE=$(jq -r '.profile // "default"' "$f")
    SPEC_SITE_TITLE=$(jq -r '.site.title // "My Jekyll Site"' "$f")
    SPEC_SITE_DESCRIPTION=$(jq -r '.site.description // ""' "$f")
    SPEC_SITE_URL=$(jq -r '.site.url // ""' "$f")
    SPEC_SITE_AUTHOR=$(jq -r '.site.author // ""' "$f")
    SPEC_SITE_EMAIL=$(jq -r '.site.email // ""' "$f")
    SPEC_SITE_TIMEZONE=$(jq -r '.site.timezone // "UTC"' "$f")
    SPEC_SITE_LOCALE=$(jq -r '.site.locale // "en"' "$f")
    SPEC_GITHUB_USER=$(jq -r '.github.user // ""' "$f")
    SPEC_GITHUB_REPO=$(jq -r '.github.repo // ""' "$f")
    SPEC_GITHUB_PAGES_BRANCH=$(jq -r '.github.pages_branch // "gh-pages"' "$f")
    SPEC_GITHUB_ENABLE_PAGES=$(jq -r '.github.enable_pages // false' "$f")
    SPEC_THEME_SOURCE=$(jq -r '.theme.source // "gem"' "$f")
    SPEC_THEME_VERSION=$(jq -r '.theme.version // ""' "$f")
    SPEC_TASKS=$(jq -r '.tasks // [] | join(" ")' "$f")
    SPEC_DEPLOY=$(jq -r '.deploy // [] | join(" ")' "$f")
    SPEC_AGENTS=$(jq -r '.agents // [] | join(" ")' "$f")
    SPEC_OPT_DRY_RUN=$(jq -r '.options.dry_run // false' "$f")
    SPEC_OPT_FORCE=$(jq -r '.options.force // false' "$f")
    SPEC_OPT_BACKUP=$(jq -r '.options.backup // true' "$f")
    SPEC_OPT_NON_INTERACTIVE=$(jq -r '.options.non_interactive // false' "$f")
    SPEC_OPT_OUTPUT=$(jq -r '.options.output // "human"' "$f")
    SPEC_OPT_AUTO_ACCEPT=$(jq -r '.options.auto_accept // false' "$f")
    SPEC_OPT_SKIP_DOCTOR=$(jq -r '.options.skip_doctor // false' "$f")
    SPEC_OPT_VERBOSE=$(jq -r '.options.verbose // false' "$f")
    SPEC_AI_USED=$(jq -r '.ai.used // false' "$f")
    SPEC_AI_PROVIDER=$(jq -r '.ai.provider // "openai"' "$f")
    SPEC_AI_MODEL=$(jq -r '.ai.model // ""' "$f")
    SPEC_AI_TOKENS=$(jq -r '.ai.tokens_estimated // 0' "$f")
    SPEC_SCRAPE_SOURCE_URL=$(jq -r '.scrape.source_url // ""' "$f")
    SPEC_SCRAPE_DEPTH=$(jq -r '.scrape.depth // 2' "$f")
    SPEC_SCRAPE_MAX_PAGES=$(jq -r '.scrape.max_pages // 25' "$f")
    SPEC_SCRAPE_OUT_DIR=$(jq -r '.scrape.out_dir // ""' "$f")
    SPEC_SCRAPE_INCLUDE_NAV=$(jq -r '.scrape.include_nav // true' "$f")
    export SPEC_SCHEMA_VERSION SPEC_TARGET_DIR SPEC_PROFILE \
        SPEC_SITE_TITLE SPEC_SITE_DESCRIPTION SPEC_SITE_URL \
        SPEC_SITE_AUTHOR SPEC_SITE_EMAIL SPEC_SITE_TIMEZONE SPEC_SITE_LOCALE \
        SPEC_GITHUB_USER SPEC_GITHUB_REPO SPEC_GITHUB_PAGES_BRANCH SPEC_GITHUB_ENABLE_PAGES \
        SPEC_THEME_SOURCE SPEC_THEME_VERSION \
        SPEC_TASKS SPEC_DEPLOY SPEC_AGENTS \
        SPEC_OPT_DRY_RUN SPEC_OPT_FORCE SPEC_OPT_BACKUP \
        SPEC_OPT_NON_INTERACTIVE SPEC_OPT_OUTPUT SPEC_OPT_AUTO_ACCEPT \
        SPEC_OPT_SKIP_DOCTOR SPEC_OPT_VERBOSE \
        SPEC_AI_USED SPEC_AI_PROVIDER SPEC_AI_MODEL SPEC_AI_TOKENS \
        SPEC_SCRAPE_SOURCE_URL SPEC_SCRAPE_DEPTH SPEC_SCRAPE_MAX_PAGES \
        SPEC_SCRAPE_OUT_DIR SPEC_SCRAPE_INCLUDE_NAV
}

# Minimal awk-based JSON reader for when jq is absent.
# Handles flat and one-level-deep scalar fields. Arrays are returned
# as space-separated values.
_spec_read_awk() {
    local f="$1"
    # Helper: extract a value for a given key pattern
    _awk_get() {
        local key="$1"
        local default="${2:-}"
        awk -v k="$key" '
            $0 ~ "\"" k "\"[[:space:]]*:[[:space:]]*\"" {
                # string value
                match($0, "\"" k "\"[[:space:]]*:[[:space:]]*\"([^\"]*)", a)
                # fallback awk for bash 3.2 (no match capture groups in some builds)
                line = $0
                sub(".*\"" k "\"[[:space:]]*:[[:space:]]*\"", "", line)
                sub("\".*", "", line)
                print line
                found=1
                exit
            }
            $0 ~ "\"" k "\"[[:space:]]*:[[:space:]]*[0-9tf]" {
                # boolean/number value
                line = $0
                sub(".*\"" k "\"[[:space:]]*:[[:space:]]*", "", line)
                sub("[,}].*", "", line)
                gsub(/[[:space:]]/, "", line)
                print line
                found=1
                exit
            }
            END { if (!found) print "" }
        ' "$f" || echo "$default"
    }

    SPEC_SCHEMA_VERSION=$(_awk_get "schema_version" "1")
    SPEC_TARGET_DIR=$(_awk_get "target_dir" "")
    SPEC_PROFILE=$(_awk_get "profile" "default")
    SPEC_SITE_TITLE=$(_awk_get "title" "My Jekyll Site")
    SPEC_SITE_AUTHOR=$(_awk_get "author" "")
    SPEC_SITE_EMAIL=$(_awk_get "email" "")
    SPEC_SITE_TIMEZONE=$(_awk_get "timezone" "UTC")
    SPEC_GITHUB_USER=$(_awk_get "user" "")
    SPEC_GITHUB_REPO=$(_awk_get "repo" "")
    SPEC_GITHUB_PAGES_BRANCH=$(_awk_get "pages_branch" "gh-pages")
    SPEC_THEME_SOURCE=$(_awk_get "source" "gem")
    SPEC_THEME_VERSION=$(_awk_get "version" "")
    SPEC_OPT_OUTPUT=$(_awk_get "output" "human")

    # Arrays: extract list items from JSON arrays
    SPEC_TASKS=$(awk '
        /"tasks"/ { found=1 }
        found && /\[/ { inlist=1 }
        inlist && /"[a-z]/ {
            val = $0
            gsub(/^[^"]*"/, "", val)
            gsub(/".*/, "", val)
            printf "%s ", val
        }
        inlist && /\]/ { exit }
    ' "$f" | sed 's/[[:space:]]*$//')

    SPEC_DEPLOY=$(awk '
        /"deploy"/ { found=1 }
        found && /\[/ { inlist=1 }
        inlist && /"[a-z]/ {
            val = $0
            gsub(/^[^"]*"/, "", val)
            gsub(/".*/, "", val)
            printf "%s ", val
        }
        inlist && /\]/ { exit }
    ' "$f" | sed 's/[[:space:]]*$//')

    SPEC_AGENTS=$(awk '
        /"agents"/ { found=1 }
        found && /\[/ { inlist=1 }
        inlist && /"[a-z]/ {
            val = $0
            gsub(/^[^"]*"/, "", val)
            gsub(/".*/, "", val)
            printf "%s ", val
        }
        inlist && /\]/ { exit }
    ' "$f" | sed 's/[[:space:]]*$//')

    # Fallback defaults for fields we couldn't parse without jq
    SPEC_SITE_DESCRIPTION="${SPEC_SITE_DESCRIPTION:-A Jekyll site built with zer0-mistakes}"
    SPEC_SITE_URL="${SPEC_SITE_URL:-}"
    SPEC_SITE_LOCALE="${SPEC_SITE_LOCALE:-en}"
    SPEC_GITHUB_ENABLE_PAGES="${SPEC_GITHUB_ENABLE_PAGES:-false}"
    SPEC_OPT_DRY_RUN="${SPEC_OPT_DRY_RUN:-false}"
    SPEC_OPT_FORCE="${SPEC_OPT_FORCE:-false}"
    SPEC_OPT_BACKUP="${SPEC_OPT_BACKUP:-true}"
    SPEC_OPT_NON_INTERACTIVE="${SPEC_OPT_NON_INTERACTIVE:-false}"
    SPEC_OPT_AUTO_ACCEPT="${SPEC_OPT_AUTO_ACCEPT:-false}"
    SPEC_OPT_SKIP_DOCTOR="${SPEC_OPT_SKIP_DOCTOR:-false}"
    SPEC_OPT_VERBOSE="${SPEC_OPT_VERBOSE:-false}"
    SPEC_AI_USED="${SPEC_AI_USED:-false}"
    SPEC_AI_PROVIDER="${SPEC_AI_PROVIDER:-openai}"
    SPEC_AI_MODEL="${SPEC_AI_MODEL:-}"
    SPEC_AI_TOKENS="${SPEC_AI_TOKENS:-0}"
    SPEC_SCRAPE_SOURCE_URL="${SPEC_SCRAPE_SOURCE_URL:-$(awk '/"source_url"/ { gsub(/.*"source_url"[[:space:]]*:[[:space:]]*"/, ""); gsub(/".*/, ""); print; exit }' "$f" 2>/dev/null)}"
    SPEC_SCRAPE_DEPTH="${SPEC_SCRAPE_DEPTH:-2}"
    SPEC_SCRAPE_MAX_PAGES="${SPEC_SCRAPE_MAX_PAGES:-25}"
    SPEC_SCRAPE_OUT_DIR="${SPEC_SCRAPE_OUT_DIR:-}"
    SPEC_SCRAPE_INCLUDE_NAV="${SPEC_SCRAPE_INCLUDE_NAV:-true}"

    export SPEC_SCHEMA_VERSION SPEC_TARGET_DIR SPEC_PROFILE \
        SPEC_SITE_TITLE SPEC_SITE_DESCRIPTION SPEC_SITE_URL \
        SPEC_SITE_AUTHOR SPEC_SITE_EMAIL SPEC_SITE_TIMEZONE SPEC_SITE_LOCALE \
        SPEC_GITHUB_USER SPEC_GITHUB_REPO SPEC_GITHUB_PAGES_BRANCH SPEC_GITHUB_ENABLE_PAGES \
        SPEC_THEME_SOURCE SPEC_THEME_VERSION \
        SPEC_TASKS SPEC_DEPLOY SPEC_AGENTS \
        SPEC_OPT_DRY_RUN SPEC_OPT_FORCE SPEC_OPT_BACKUP \
        SPEC_OPT_NON_INTERACTIVE SPEC_OPT_OUTPUT SPEC_OPT_AUTO_ACCEPT \
        SPEC_OPT_SKIP_DOCTOR SPEC_OPT_VERBOSE \
        SPEC_AI_USED SPEC_AI_PROVIDER SPEC_AI_MODEL SPEC_AI_TOKENS \
        SPEC_SCRAPE_SOURCE_URL SPEC_SCRAPE_DEPTH SPEC_SCRAPE_MAX_PAGES \
        SPEC_SCRAPE_OUT_DIR SPEC_SCRAPE_INCLUDE_NAV
}

# ---------------------------------------------------------------------------
# spec_validate FILE — lightweight validation (no jq required)
# ---------------------------------------------------------------------------
spec_validate() {
    local f="$1"
    local errors=0

    if [[ ! -f "$f" ]]; then
        log_error "spec_validate: file not found: $f"
        return 1
    fi

    # Check schema_version is present
    if ! grep -q '"schema_version"' "$f"; then
        log_error "spec_validate: missing required field: schema_version"
        errors=$(( errors + 1 ))
    fi

    # Check target_dir is present and non-empty
    if ! grep -q '"target_dir"[[:space:]]*:[[:space:]]*"[^"]' "$f"; then
        log_error "spec_validate: target_dir is missing or empty"
        errors=$(( errors + 1 ))
    fi

    # Check profile is a known value
    local profile
    if command -v jq >/dev/null 2>&1; then
        profile=$(jq -r '.profile // ""' "$f")
    else
        profile=$(awk '/"profile"/ { gsub(/.*"profile"[[:space:]]*:[[:space:]]*"/, ""); gsub(/".*/, ""); print; exit }' "$f")
    fi
    case "$profile" in
        default|minimal|blog|docs|portfolio|github-pages|fork) ;;
        *)
            log_error "spec_validate: unknown profile: '$profile'"
            errors=$(( errors + 1 ))
            ;;
    esac

    # Check theme.source
    local theme_src
    if command -v jq >/dev/null 2>&1; then
        theme_src=$(jq -r '.theme.source // ""' "$f")
    else
        theme_src=$(awk '/"source"/ { gsub(/.*"source"[[:space:]]*:[[:space:]]*"/, ""); gsub(/".*/, ""); print; exit }' "$f")
    fi
    case "$theme_src" in
        gem|remote|vendored) ;;
        *)
            log_error "spec_validate: invalid theme.source: '$theme_src'"
            errors=$(( errors + 1 ))
            ;;
    esac

    if [[ $errors -eq 0 ]]; then
        log_debug "spec_validate: OK — $f"
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# spec_get FILE KEY — print the value for a dot-notation key
# spec_get spec.json site.title
# ---------------------------------------------------------------------------
spec_get() {
    local f="$1"
    local key="$2"
    if command -v jq >/dev/null 2>&1; then
        jq -r ".${key} // \"\"" "$f"
    else
        # Fallback: load into SPEC_* and echo the matching var
        spec_read "$f"
        local var_name
        var_name=$(echo "SPEC_${key}" | tr '.' '_' | tr '[:lower:]' '[:upper:]')
        eval "echo \"\${${var_name}:-}\""
    fi
}

# ---------------------------------------------------------------------------
# spec_hash FILE — sha256 hex of the file content
# ---------------------------------------------------------------------------
spec_hash() {
    local f="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$f" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$f" | awk '{print $1}'
    else
        echo "unknown"
    fi
}
