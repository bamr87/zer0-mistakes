#!/bin/bash
# =============================================================================
# scripts/install/ai/client.sh — Multi-provider AI client
# =============================================================================
# A thin curl/CLI wrapper that speaks to whichever AI provider is available.
# Three providers are supported, resolved in this order under `auto`:
#
#   1. claude-cli — the local, OAuth-authenticated `claude` CLI (Claude Code).
#                   Zero key handling: reuses the user's Claude Code session
#                   (`claude setup-token` / `claude login`). This is the
#                   flagship "Claude Code OAuth" integration.
#   2. anthropic  — Anthropic Messages API over HTTPS. Auth resolves from:
#                     CLAUDE_CODE_OAUTH_TOKEN → OAuth bearer + beta header
#                     ANTHROPIC_API_KEY       → x-api-key
#   3. openai     — OpenAI-compatible /chat/completions (OpenAI, Azure, Ollama).
#
# Public API (stable — wizard.sh / suggest.sh / diagnose.sh depend on it):
#   ai_client_available            → 0 if a usable provider exists, else 1
#   ai_client_provider             → echo resolved provider slug (or "none")
#   ai_client_model [PROVIDER]     → echo model id for a provider ("" = default)
#   ai_client_auth_source          → echo human-readable auth description
#   ai_client_chat SYS USER [SCHEMA]  → print raw provider JSON to stdout
#   ai_client_extract_text RESP    → print assistant text (any provider shape)
#
# Selection & tuning (all optional, env or config-file driven):
#   ZER0_AI_PROVIDER   auto | claude-cli | anthropic | openai | none
#   ZER0_AI_MODEL      Override model id for the active provider
#   ZER0_AI_MAX_TOKENS Output cap for the anthropic path (default 2048)
#   ZER0_NO_AI=1       Global kill-switch (disables every provider)
#   OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL   (openai path)
#   ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL / ANTHROPIC_MODEL   (anthropic path)
#   CLAUDE_CODE_OAUTH_TOKEN   (anthropic path, OAuth — takes precedence)
#
# Contract: API keys are read from the environment ONLY — never logged, never
# accepted via flag, never written to disk. All network I/O is single-attempt
# with a 30s timeout and degrades gracefully (callers check the return code).
#
# Bash 3.2 compatible. No `declare -A`, no `set -euo pipefail` here.
# =============================================================================
[[ -n "${_HAS_AI_CLIENT:-}" ]] && return 0
_HAS_AI_CLIENT=1

_AI_TIMEOUT="${ZER0_AI_TIMEOUT:-30}"

# ---------------------------------------------------------------------------
# Provider detection helpers
# ---------------------------------------------------------------------------
_ai_have_claude_cli() { command -v claude >/dev/null 2>&1; }

# _ai_provider_usable PROVIDER → 0 if that provider has what it needs.
_ai_provider_usable() {
    case "$1" in
        claude-cli) _ai_have_claude_cli ;;
        anthropic)  [[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" || -n "${ANTHROPIC_API_KEY:-}" ]] ;;
        openai)     [[ -n "${OPENAI_API_KEY:-}" || -n "${OPENAI_BASE_URL:-}" ]] ;;
        *)          return 1 ;;
    esac
}

# ai_client_provider → resolved provider slug. Honors an explicit choice
# (ZER0_AI_PROVIDER / SPEC_AI_PROVIDER); "auto"/"" picks the best available.
ai_client_provider() {
    [[ "${ZER0_NO_AI:-0}" == "1" ]] && { echo "none"; return 0; }

    local want="${ZER0_AI_PROVIDER:-${SPEC_AI_PROVIDER:-auto}}"
    case "$want" in
        claude|claude-cli|claude_cli) echo "claude-cli"; return 0 ;;
        anthropic|claude-api)         echo "anthropic";  return 0 ;;
        openai|azure|ollama)          echo "openai";     return 0 ;;
        none|off|disabled)            echo "none";       return 0 ;;
        auto|"") ;;                   # fall through to auto-detect
        *) log_warning "Unknown AI provider '$want' — falling back to auto" ;;
    esac

    if _ai_have_claude_cli; then echo "claude-cli"; return 0; fi
    if [[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" || -n "${ANTHROPIC_API_KEY:-}" ]]; then
        echo "anthropic"; return 0
    fi
    if [[ -n "${OPENAI_API_KEY:-}" || -n "${OPENAI_BASE_URL:-}" ]]; then
        echo "openai"; return 0
    fi
    echo "none"
}

# ai_client_available → 0 if the resolved provider is actually usable.
ai_client_available() {
    [[ "${ZER0_NO_AI:-0}" == "1" ]] && return 1
    local p
    p="$(ai_client_provider)"
    [[ "$p" == "none" ]] && return 1
    _ai_provider_usable "$p"
}

# ai_client_model [PROVIDER] → model id ("" means "use the provider default").
ai_client_model() {
    local p="${1:-$(ai_client_provider)}"
    if [[ -n "${ZER0_AI_MODEL:-}" ]];  then echo "$ZER0_AI_MODEL"; return 0; fi
    if [[ -n "${SPEC_AI_MODEL:-}" ]];  then echo "$SPEC_AI_MODEL"; return 0; fi
    case "$p" in
        anthropic)  echo "${ANTHROPIC_MODEL:-claude-sonnet-5}" ;;
        claude-cli) echo "${ANTHROPIC_MODEL:-}" ;;   # empty → CLI's own default
        *)          echo "${OPENAI_MODEL:-gpt-4o-mini}" ;;
    esac
}

# ai_client_auth_source → short description of how the active provider authenticates.
ai_client_auth_source() {
    case "$(ai_client_provider)" in
        claude-cli) echo "claude CLI session (OAuth)" ;;
        anthropic)
            if [[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]]; then echo "CLAUDE_CODE_OAUTH_TOKEN (OAuth)"
            else echo "ANTHROPIC_API_KEY"; fi ;;
        openai)
            if [[ -n "${OPENAI_API_KEY:-}" ]]; then echo "OPENAI_API_KEY"
            else echo "OPENAI_BASE_URL (keyless)"; fi ;;
        *) echo "none" ;;
    esac
}

# ---------------------------------------------------------------------------
# JSON + sanitization helpers
# ---------------------------------------------------------------------------
# _ai_json_string STR → STR encoded as a JSON string literal (with quotes).
_ai_json_string() {
    if command -v python3 >/dev/null 2>&1; then
        printf '%s' "$1" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"
    elif command -v jq >/dev/null 2>&1; then
        printf '%s' "$1" | jq -Rs .
    else
        printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' '\001' | sed 's/\o001/\\n/g')"
    fi
}

# _ai_sanitize STR → strip likely secrets/PII before a payload leaves the host.
# Reads from stdin. BSD/GNU-sed compatible. (Contract: sanitize before send.)
_ai_sanitize() {
    local home_esc
    home_esc="$(printf '%s' "${HOME:-/nonexistent}" | sed 's:/:\\/:g')"
    sed \
        -e "s/${home_esc}/~/g" \
        -e 's/sk-ant-[A-Za-z0-9_-]\{12,\}/[REDACTED_ANTHROPIC_KEY]/g' \
        -e 's/sk-[A-Za-z0-9_-]\{20,\}/[REDACTED_API_KEY]/g' \
        -e 's/ghp_[A-Za-z0-9]\{20,\}/[REDACTED_GITHUB_TOKEN]/g' \
        -e 's/github_pat_[A-Za-z0-9_]\{20,\}/[REDACTED_GITHUB_PAT]/g' \
        -e 's/[A-Za-z0-9._%+-]\{1,\}@[A-Za-z0-9.-]\{1,\}\.[A-Za-z]\{2,\}/[REDACTED_EMAIL]/g'
}

# ---------------------------------------------------------------------------
# ai_client_chat SYSTEM_PROMPT USER_PROMPT [JSON_SCHEMA]
# Dispatches to the resolved provider. Prints raw provider JSON to stdout.
# ---------------------------------------------------------------------------
ai_client_chat() {
    local system_prompt="$1"
    local user_prompt="$2"
    local json_schema="${3:-}"

    if ! ai_client_available; then
        log_error "ai_client_chat: no AI provider available (see 'install doctor')"
        return 1
    fi

    # Sanitize the user-supplied context (never the system prompt — it's ours).
    user_prompt="$(printf '%s' "$user_prompt" | _ai_sanitize)"

    local provider
    provider="$(ai_client_provider)"
    log_debug "ai_client_chat: provider=${provider} model=$(ai_client_model "$provider")"

    case "$provider" in
        claude-cli) _ai_chat_claude_cli "$system_prompt" "$user_prompt" "$json_schema" ;;
        anthropic)  _ai_chat_anthropic  "$system_prompt" "$user_prompt" "$json_schema" ;;
        openai)     _ai_chat_openai     "$system_prompt" "$user_prompt" "$json_schema" ;;
        *)          log_error "ai_client_chat: unresolved provider '$provider'"; return 1 ;;
    esac
}

# ---- claude-cli: shell out to the OAuth-authenticated Claude Code CLI --------
_ai_chat_claude_cli() {
    local system_prompt="$1" user_prompt="$2"
    local model prompt out
    model="$(ai_client_model claude-cli)"

    # Claude Code owns its own system prompt; append ours and put the request
    # in the user turn. The whole thing is fed on stdin (no prompt on argv, so
    # nothing sensitive lands in the process table).
    prompt="$(printf '%s\n\n%s' "$system_prompt" "$user_prompt")"

    local mflag
    mflag=()
    [[ -n "$model" ]] && mflag=(--model "$model")

    if out="$(printf '%s' "$prompt" | claude -p --output-format json \
                ${mflag[@]+"${mflag[@]}"} 2>/dev/null)"; then
        printf '%s\n' "$out"
        return 0
    fi

    # Fallback: plain-text output → wrap so ai_client_extract_text can read it.
    if out="$(printf '%s' "$prompt" | claude -p ${mflag[@]+"${mflag[@]}"} 2>/dev/null)"; then
        printf '{"result":%s}\n' "$(_ai_json_string "$out")"
        return 0
    fi

    log_error "ai_client_chat: claude CLI call failed (is it logged in? try 'claude login')"
    return 1
}

# ---- anthropic: Anthropic Messages API (OAuth token or API key) --------------
_ai_chat_anthropic() {
    local system_prompt="$1" user_prompt="$2"
    local base model endpoint
    base="${ANTHROPIC_BASE_URL:-https://api.anthropic.com}"
    model="$(ai_client_model anthropic)"
    endpoint="${base%/}/v1/messages"

    local auth
    auth=()
    if [[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]]; then
        # OAuth tokens require the beta header and a Claude Code system identity.
        auth=(-H "authorization: Bearer ${CLAUDE_CODE_OAUTH_TOKEN}" \
              -H "anthropic-beta: oauth-2025-04-20")
        system_prompt="$(printf '%s\n\n%s' \
            "You are Claude Code, Anthropic's official CLI for Claude." "$system_prompt")"
    elif [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
        auth=(-H "x-api-key: ${ANTHROPIC_API_KEY}")
    else
        log_error "ai_client_chat: anthropic provider needs CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY"
        return 1
    fi

    local sys_escaped user_escaped body
    sys_escaped="$(_ai_json_string "$system_prompt")"
    user_escaped="$(_ai_json_string "$user_prompt")"
    body="$(cat <<JSON
{
  "model": "${model}",
  "max_tokens": ${ZER0_AI_MAX_TOKENS:-2048},
  "system": ${sys_escaped},
  "messages": [ {"role": "user", "content": ${user_escaped}} ]
}
JSON
)"

    log_debug "ai_client_chat: POST ${endpoint} model=${model} (anthropic)"
    local resp
    resp="$(curl -fsSL --max-time "$_AI_TIMEOUT" \
        -H "content-type: application/json" \
        -H "anthropic-version: 2023-06-01" \
        ${auth[@]+"${auth[@]}"} \
        -d "$body" "$endpoint" 2>&1)"
    if [[ $? -ne 0 ]]; then
        log_error "ai_client_chat: anthropic request failed"
        return 1
    fi
    printf '%s\n' "$resp"
}

# ---- openai: OpenAI-compatible /chat/completions (unchanged behavior) --------
_ai_chat_openai() {
    local system_prompt="$1" user_prompt="$2" json_schema="$3"
    local base model endpoint api_key
    base="${OPENAI_BASE_URL:-https://api.openai.com/v1}"
    model="$(ai_client_model openai)"
    endpoint="${base}/chat/completions"
    api_key="${OPENAI_API_KEY:-}"

    local sys_escaped user_escaped
    sys_escaped="$(_ai_json_string "$system_prompt")"
    user_escaped="$(_ai_json_string "$user_prompt")"

    local body
    if [[ -n "$json_schema" ]]; then
        body="$(cat <<JSON
{
  "model": "${model}",
  "response_format": { "type": "json_schema", "json_schema": ${json_schema} },
  "messages": [
    {"role": "system", "content": ${sys_escaped}},
    {"role": "user",   "content": ${user_escaped}}
  ]
}
JSON
)"
    else
        body="$(cat <<JSON
{
  "model": "${model}",
  "messages": [
    {"role": "system", "content": ${sys_escaped}},
    {"role": "user",   "content": ${user_escaped}}
  ]
}
JSON
)"
    fi

    log_debug "ai_client_chat: POST ${endpoint} model=${model} (openai)"
    local resp
    resp="$(curl -fsSL --max-time "$_AI_TIMEOUT" \
        -H "Content-Type: application/json" \
        ${api_key:+-H "Authorization: Bearer ${api_key}"} \
        -d "$body" "$endpoint" 2>&1)"
    if [[ $? -ne 0 ]]; then
        log_error "ai_client_chat: openai request failed"
        return 1
    fi
    printf '%s\n' "$resp"
}

# ---------------------------------------------------------------------------
# ai_client_extract_text RESPONSE_JSON
# Normalizes across provider shapes and strips markdown code fences:
#   openai    → .choices[0].message.content
#   anthropic → concatenated .content[].text
#   claude    → .result   (claude -p --output-format json)
# ---------------------------------------------------------------------------
ai_client_extract_text() {
    local resp="$1"
    local text=""
    # Primary: jq. NOTE: test keys with plain truthiness (`if .choices`), NOT
    # `// empty` — an empty stream in an `if` condition makes jq emit nothing.
    if command -v jq >/dev/null 2>&1; then
        text="$(printf '%s' "$resp" | jq -r '
            if .choices    then (.choices[0].message.content // "")
            elif .content  then ([.content[]? | select(.type=="text") | .text] | join(""))
            elif (.result != null) then .result
            else "" end
        ' 2>/dev/null)"
    fi
    # Secondary: python3 (handles the same three shapes robustly).
    if [[ -z "$text" ]] && command -v python3 >/dev/null 2>&1; then
        text="$(printf '%s' "$resp" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
if isinstance(d, dict):
    if d.get("choices"):
        print(d["choices"][0].get("message", {}).get("content", ""))
    elif isinstance(d.get("content"), list):
        print("".join(b.get("text", "") for b in d["content"]
                      if isinstance(b, dict) and b.get("type") == "text"))
    elif d.get("result") is not None:
        print(d["result"])
' 2>/dev/null)"
    fi
    # Last resort: awk scan to the first unescaped closing quote of the value.
    if [[ -z "$text" ]]; then
        text="$(printf '%s' "$resp" | awk '
            function extract(s,   i,c,prev,out) {
                out=""; prev=""
                for (i=1; i<=length(s); i++) {
                    c=substr(s,i,1)
                    if (c=="\"" && prev!="\\") return out
                    out=out c; prev=(prev=="\\")?"":c
                }
                return out
            }
            {
                split("result content text", ks, " ")
                for (k=1; k<=3; k++) {
                    if (match($0, "\"" ks[k] "\"[[:space:]]*:[[:space:]]*\"")) {
                        v=extract(substr($0, RSTART+RLENGTH))
                        gsub(/\\n/, "\n", v); gsub(/\\"/, "\"", v)
                        print v; exit
                    }
                }
            }
        ')"
    fi
    printf '%s\n' "$text" | sed '/^[[:space:]]*```/d'
}
