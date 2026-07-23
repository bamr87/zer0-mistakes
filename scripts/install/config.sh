#!/bin/bash
# =============================================================================
# scripts/install/config.sh — User config-file layer
# =============================================================================
# Lets a site persist its installer choices in a small YAML file instead of
# re-typing flags every run. Discovered files are merged low→high precedence:
#
#   1. ~/.config/zer0/install.yml        (user-global defaults)
#   2. <target>/zer0.install.yml         (project-local)
#   3. <target>/.zer0/config.yml         (project-local, hidden)
#   4. $ZER0_CONFIG  /  --config FILE    (explicit — wins over the rest)
#
# In the plan pipeline this sits between profile defaults and env/flag
# overrides:  defaults < profile < CONFIG FILE < env vars < CLI flags.
#
# Recognised keys (nested or flat/dotted both work):
#   profile
#   site.title|description|author|email|url|timezone|locale
#   github.user|repo|pages_branch|enable_pages
#   theme.source|version
#   deploy            (scalar or list → space-joined)
#   agents            (scalar or list → space-joined)
#   tasks             (scalar or list → space-joined)
#   ai.provider       (auto|claude-cli|anthropic|openai|none)
#   ai.model
#
# API keys are deliberately NOT read from config files — they stay in the
# environment only (see ai/client.sh).
#
# Bash 3.2 compatible. No `declare -A`, no `set -euo pipefail` here.
# =============================================================================
[[ -n "${_HAS_CONFIG_LIB:-}" ]] && return 0
_HAS_CONFIG_LIB=1

# ---------------------------------------------------------------------------
# config_discover TARGET_DIR → print existing config files, low→high priority.
# ---------------------------------------------------------------------------
config_discover() {
    local target="${1:-$(pwd)}"
    local f
    for f in \
        "${HOME:-/nonexistent}/.config/zer0/install.yml" \
        "${target}/zer0.install.yml" \
        "${target}/zer0.install.yaml" \
        "${target}/.zer0/config.yml" \
        "${_FLAG_CONFIG:-}" \
        "${ZER0_CONFIG:-}" ; do
        [[ -n "$f" && -f "$f" ]] && printf '%s\n' "$f"
    done
}

# ---------------------------------------------------------------------------
# _config_flatten FILE → emit `key=value` for a small YAML subset:
#   - top-level scalars           foo: bar          → foo=bar
#   - one level of nested maps     site:\n  title: x → site.title=x
#   - block lists                  deploy:\n  - a    → deploy=a b
#   - inline flow lists            deploy: [a, b]    → deploy=a b
# Quotes and inline comments are stripped. Not a full YAML parser — just
# enough for installer config, mirroring plan.sh's awk profile reader.
# ---------------------------------------------------------------------------
_config_flatten() {
    local file="$1"
    [[ -f "$file" ]] || return 0
    awk '
        function strip(s) {
            sub(/[[:space:]]*#.*$/, "", s)               # trailing comment
            sub(/^[[:space:]]+/, "", s); sub(/[[:space:]]+$/, "", s)
            gsub(/^["'"'"']|["'"'"']$/, "", s)           # surrounding quotes
            return s
        }
        # blank / comment lines
        /^[[:space:]]*$/ { next }
        /^[[:space:]]*#/ { next }
        {
            indent = 0
            tmp = $0
            while (substr(tmp,1,1) == " ") { indent++; tmp = substr(tmp,2) }
        }
        # list item under the current parent key
        indent > 0 && tmp ~ /^-[[:space:]]+/ {
            if (listkey != "") {
                item = tmp; sub(/^-[[:space:]]+/, "", item); item = strip(item)
                vals[listkey] = (vals[listkey] == "" ? item : vals[listkey] " " item)
            }
            next
        }
        # key: value  (any depth we care about is 0 or 1)
        match(tmp, /^[A-Za-z0-9_.-]+[[:space:]]*:/) {
            key = tmp; sub(/[[:space:]]*:.*$/, "", key)
            val = tmp; sub(/^[A-Za-z0-9_.-]+[[:space:]]*:/, "", val); val = strip(val)

            if (indent == 0) {
                parent = key
                listkey = ""
                if (val == "") { listkey = key; next }        # map/list header
                # inline flow list?  key: [a, b, c]
                if (val ~ /^\[.*\]$/) {
                    gsub(/^\[|\]$/, "", val); gsub(/[[:space:],]+/, " ", val)
                    val = strip(val)
                }
                print key "=" val
            } else {
                # nested child of the last top-level parent
                if (parent != "") print parent "." key "=" val
            }
            next
        }
        END {
            for (k in vals) print k "=" vals[k]
        }
    ' "$file"
}

# ---------------------------------------------------------------------------
# config_apply_file FILE → map recognised keys onto SPEC_* globals + AI env.
# ---------------------------------------------------------------------------
config_apply_file() {
    local file="$1"
    [[ -f "$file" ]] || return 0
    log_debug "config: loading ${file}"

    local line key val
    while IFS= read -r line; do
        key="${line%%=*}"
        val="${line#*=}"
        [[ -z "$key" || "$key" == "$line" ]] && continue
        case "$key" in
            profile)              SPEC_PROFILE="$val" ;;
            site.title|site_title)             SPEC_SITE_TITLE="$val" ;;
            site.description|site_description) SPEC_SITE_DESCRIPTION="$val" ;;
            site.author|site_author)           SPEC_SITE_AUTHOR="$val" ;;
            site.email|site_email)             SPEC_SITE_EMAIL="$val" ;;
            site.url|site_url)                 SPEC_SITE_URL="$val" ;;
            site.timezone|site_timezone)       SPEC_SITE_TIMEZONE="$val" ;;
            site.locale|site_locale)           SPEC_SITE_LOCALE="$val" ;;
            github.user|github_user)           SPEC_GITHUB_USER="$val" ;;
            github.repo|github_repo)           SPEC_GITHUB_REPO="$val" ;;
            github.pages_branch)               SPEC_GITHUB_PAGES_BRANCH="$val" ;;
            github.enable_pages)               SPEC_GITHUB_ENABLE_PAGES="$val" ;;
            theme.source|theme_source)         SPEC_THEME_SOURCE="$val" ;;
            theme.version|theme_version)       SPEC_THEME_VERSION="$val" ;;
            deploy|deploy_targets)             SPEC_DEPLOY="$val" ;;
            agents|agent_files)                SPEC_AGENTS="$val" ;;
            tasks)                             SPEC_TASKS="$val" ;;
            ai.provider|ai_provider)
                SPEC_AI_PROVIDER="$val"
                export ZER0_AI_PROVIDER="${ZER0_AI_PROVIDER:-$val}" ;;
            ai.model|ai_model)
                SPEC_AI_MODEL="$val"
                export ZER0_AI_MODEL="${ZER0_AI_MODEL:-$val}" ;;
            *) log_debug "config: ignoring unknown key '${key}'" ;;
        esac
    done < <(_config_flatten "$file")
    return 0
}

# ---------------------------------------------------------------------------
# config_load TARGET_DIR → apply every discovered config file in order.
# ---------------------------------------------------------------------------
config_load() {
    local target="${1:-$(pwd)}"
    local f
    while IFS= read -r f; do
        [[ -n "$f" ]] && config_apply_file "$f"
    done < <(config_discover "$target")
    return 0
}
