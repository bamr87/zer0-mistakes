#!/bin/bash
# =============================================================================
# scripts/install/ai/suggest.sh — AI-assisted profile + deploy suggestions
# =============================================================================
# Given a target directory and optional goal description, suggests:
#   - Best installation profile
#   - Best deploy target(s)
#
# Provides:
#   ai_suggest_run TARGET_DIR [GOAL_TEXT]
#       → print JSON: {"profile":"...", "deploy":["..."]}
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_AI_SUGGEST:-}" ]] && return 0
_HAS_AI_SUGGEST=1

_AI_SUGGEST_DIR="${_AI_SUGGEST_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)}"

ai_suggest_run() {
    local target="${1:-$(pwd)}"
    local goal="${2:-}"

    if [[ "$(type -t ai_client_available)" != "function" ]]; then
        source "${_AI_SUGGEST_DIR}/client.sh" || return 1
    fi

    if ! ai_client_available; then
        log_warning "ai_suggest: AI not available — using rule-based defaults"
        printf '{"profile":"default","deploy":["github-pages"]}\n'
        return 0
    fi

    local sys_prompt_file="${_AI_SUGGEST_DIR}/prompts/suggest.system.md"
    local sys_prompt
    if [[ -f "$sys_prompt_file" ]]; then
        sys_prompt=$(cat "$sys_prompt_file")
    else
        sys_prompt="You are a Jekyll setup advisor. Based on the user's goal and context, recommend the best zer0-mistakes profile and deploy target. Profiles: default, minimal, blog, docs, portfolio, github-pages, fork. Deploy targets: github-pages, azure-swa, docker-prod, vercel, netlify, cloudflare-pages. Return JSON: {\"profile\":\"...\",\"deploy\":[\"...\"]}."
    fi

    local user_prompt
    user_prompt="Target directory: $target"
    [[ -n "$goal" ]] && user_prompt="${user_prompt}
Goal: $goal"

    # Use json_object mode to prevent markdown wrapping
    local resp
    resp=$(ai_client_chat "$sys_prompt" "$user_prompt" '{"name":"suggest","schema":{"type":"object","properties":{"profile":{"type":"string"},"deploy":{"type":"array","items":{"type":"string"}},"rationale":{"type":"string"}},"required":["profile","deploy"]}}') || {
        printf '{"profile":"default","deploy":["github-pages"]}\n'
        return 0
    }

    local result
    result=$(ai_client_extract_text "$resp")
    printf '%s\n' "$result"
}
