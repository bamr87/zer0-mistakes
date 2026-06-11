#!/bin/bash
# =============================================================================
# scripts/install/ai/client.sh — HTTP client for AI providers
# =============================================================================
# Thin curl wrapper that:
#   - Targets OpenAI-compatible APIs (OpenAI, Azure OpenAI, Ollama)
#   - Enforces 30s timeout
#   - Redacts Authorization header from logs
#   - Returns raw JSON response body to stdout
#
# Provides:
#   ai_client_chat SYSTEM_PROMPT USER_PROMPT [JSON_SCHEMA]
#       → print raw API JSON response to stdout
#       → return 0 on success, 1 on error
#
#   ai_client_extract_text RESPONSE_JSON
#       → print the assistant's text content from a chat response
#
#   ai_client_available
#       → return 0 if OPENAI_API_KEY or OPENAI_BASE_URL is set, 1 otherwise
#
# Environment:
#   OPENAI_API_KEY      Required for openai.com
#   OPENAI_BASE_URL     Override base URL (Azure OpenAI / Ollama compatible)
#                       Default: https://api.openai.com/v1
#   OPENAI_MODEL        Model name (default: gpt-4o-mini)
#   ZER0_NO_AI          Set to 1 to disable all AI calls (kill-switch)
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_AI_CLIENT:-}" ]] && return 0
_HAS_AI_CLIENT=1

_AI_BASE_URL="${OPENAI_BASE_URL:-https://api.openai.com/v1}"
_AI_MODEL="${OPENAI_MODEL:-gpt-4o-mini}"
_AI_TIMEOUT=30

# ---------------------------------------------------------------------------
# ai_client_available
# ---------------------------------------------------------------------------
ai_client_available() {
    [[ "${ZER0_NO_AI:-0}" == "1" ]] && return 1
    [[ -n "${OPENAI_API_KEY:-}" ]] && return 0
    [[ -n "${OPENAI_BASE_URL:-}" ]] && return 0
    return 1
}

# ---------------------------------------------------------------------------
# ai_client_chat SYSTEM_PROMPT USER_PROMPT [JSON_SCHEMA]
# ---------------------------------------------------------------------------
ai_client_chat() {
    local system_prompt="$1"
    local user_prompt="$2"
    local json_schema="${3:-}"

    if ! ai_client_available; then
        log_error "ai_client_chat: AI not available (set OPENAI_API_KEY or OPENAI_BASE_URL)"
        return 1
    fi

    local api_key="${OPENAI_API_KEY:-}"
    local endpoint="${_AI_BASE_URL}/chat/completions"

    # Build request body — escape for JSON
    local sys_escaped user_escaped
    sys_escaped=$(printf '%s' "$system_prompt" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" 2>/dev/null \
        || printf '%s' "$system_prompt" | sed 's/\\/\\\\/g; s/"/\\"/g; s/$/\\n/g' | tr -d '\n' | sed 's/\\n$//')
    user_escaped=$(printf '%s' "$user_prompt" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" 2>/dev/null \
        || printf '%s' "$user_prompt" | sed 's/\\/\\\\/g; s/"/\\"/g')

    local body
    if [[ -n "$json_schema" ]]; then
        # Structured output (function calling)
        body=$(cat <<JSON
{
  "model": "${_AI_MODEL}",
  "response_format": {
    "type": "json_schema",
    "json_schema": ${json_schema}
  },
  "messages": [
    {"role": "system", "content": ${sys_escaped}},
    {"role": "user",   "content": ${user_escaped}}
  ]
}
JSON
)
    else
        body=$(cat <<JSON
{
  "model": "${_AI_MODEL}",
  "messages": [
    {"role": "system", "content": ${sys_escaped}},
    {"role": "user",   "content": ${user_escaped}}
  ]
}
JSON
)
    fi

    log_debug "ai_client_chat: POST ${endpoint} model=${_AI_MODEL}"

    local resp
    resp=$(curl -fsSL \
        --max-time "$_AI_TIMEOUT" \
        -H "Content-Type: application/json" \
        ${api_key:+-H "Authorization: Bearer ${api_key}"} \
        -d "$body" \
        "$endpoint" 2>&1)

    local ret=$?
    if [[ $ret -ne 0 ]]; then
        log_error "ai_client_chat: HTTP request failed (exit $ret)"
        return 1
    fi

    printf '%s\n' "$resp"
    return 0
}

# ---------------------------------------------------------------------------
# ai_client_extract_text RESPONSE_JSON
# Extracts assistant text and strips markdown code fences if present.
# ---------------------------------------------------------------------------
ai_client_extract_text() {
    local resp="$1"
    local text
    if command -v jq >/dev/null 2>&1; then
        text=$(printf '%s' "$resp" | jq -r '.choices[0].message.content // ""')
    else
        # Minimal awk extraction
        text=$(printf '%s' "$resp" | awk '
            /"content"[[:space:]]*:/ {
                line = $0
                sub(/.*"content"[[:space:]]*:[[:space:]]*"/, "", line)
                sub(/"[^"]*$/, "", line)
                gsub(/\\n/, "\n", line)
                print line
                exit
            }
        ')
    fi
    # Strip markdown code fences (```json, ```, etc.) — remove any line starting with ```
    printf '%s\n' "$text" | sed '/^[[:space:]]*```/d'
}

# ---------------------------------------------------------------------------
# _ai_json_object_body SYSTEM_PROMPT USER_PROMPT
# Build a request body that forces json_object output (no schema needed)
# ---------------------------------------------------------------------------
_ai_json_object_body() {
    local sys_escaped="$1"
    local user_escaped="$2"
    cat <<JSON
{
  "model": "${_AI_MODEL}",
  "response_format": {"type": "json_object"},
  "messages": [
    {"role": "system", "content": ${sys_escaped}},
    {"role": "user",   "content": ${user_escaped}}
  ]
}
JSON
}
