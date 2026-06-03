#!/bin/bash
# =============================================================================
# scripts/install/ai/diagnose.sh — AI-assisted site diagnosis
# =============================================================================
# Sends sanitized Jekyll build output + config to LLM for fix suggestions.
#
# Provides:
#   ai_diagnose_run TARGET_DIR [--log FILE]
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_AI_DIAGNOSE:-}" ]] && return 0
_HAS_AI_DIAGNOSE=1

_AI_DIAGNOSE_DIR="${_AI_DIAGNOSE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)}"

ai_diagnose_run() {
    local target="${1:-$(pwd)}"
    local log_file=""

    # Parse optional --log
    shift || true
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --log) shift; log_file="${1:-}" ;;
        esac
        shift
    done

    if [[ "$(type -t ai_client_available)" != "function" ]]; then
        source "${_AI_DIAGNOSE_DIR}/client.sh" || return 1
    fi

    if ! ai_client_available; then
        log_error "ai_diagnose_run: AI not available"
        return 1
    fi

    # Collect context
    local build_log=""
    if [[ -n "$log_file" && -f "$log_file" ]]; then
        build_log=$(tail -100 "$log_file")
    else
        # Run jekyll doctor for quick diagnostics
        if command -v bundle >/dev/null 2>&1 && [[ -f "${target}/Gemfile" ]]; then
            build_log=$(cd "$target" && bundle exec jekyll doctor 2>&1 | tail -50) || true
        fi
    fi

    local config_excerpt=""
    [[ -f "${target}/_config.yml" ]] && \
        config_excerpt=$(head -30 "${target}/_config.yml")

    local sys_prompt_file="${_AI_DIAGNOSE_DIR}/prompts/diagnose.system.md"
    local sys_prompt
    if [[ -f "$sys_prompt_file" ]]; then
        sys_prompt=$(cat "$sys_prompt_file")
    else
        sys_prompt="You are a Jekyll expert. Analyze the build output and config provided and suggest specific fixes. Be concise. Return a JSON object with keys: summary (string), fixes (array of {issue, fix, severity})."
    fi

    local user_prompt
    user_prompt=$(cat <<PROMPT
Target: $target

_config.yml (first 30 lines):
${config_excerpt:-[not found]}

Build output / doctor:
${build_log:-[no output captured]}
PROMPT
)

    log_info "Analyzing with AI..."
    local resp
    resp=$(ai_client_chat "$sys_prompt" "$user_prompt" '{"name":"diagnose","schema":{"type":"object","properties":{"summary":{"type":"string"},"fixes":{"type":"array","items":{"type":"object","properties":{"issue":{"type":"string"},"cause":{"type":"string"},"fix":{"type":"string"},"severity":{"type":"string"}},"required":["issue","fix","severity"]}}},"required":["summary","fixes"]}}') || { log_error "Diagnosis API call failed"; return 1; }

    local result
    result=$(ai_client_extract_text "$resp")
    printf '\n%s\n\n' "$result"
}
