#!/usr/bin/env bash
# scripts/lib/install/ai/openai.sh
#
# Shared OpenAI client + safety primitives for Phase 5 AI features.
#
# All AI features (wizard, diagnose, suggest) source this module. It provides:
#   - ai_enabled            — global kill-switch check (ZER0_NO_AI=1 disables)
#   - ai_require_key        — verify OPENAI_API_KEY is present
#   - ai_default_model      — model selection (env override: ZER0_AI_MODEL)
#   - ai_sanitize_text      — strip secrets/PII before sending to API
#   - ai_estimate_cost      — print rough token + USD estimate
#   - ai_call_chat          — POST to /v1/chat/completions (curl, 30s timeout)
#   - ai_show_diff_confirm  — diff-then-confirm gate for any AI-generated file
#
# All network I/O is curl-based — no SDK dependency. All keys read from env
# only — never persisted, never logged. All calls timeout at 30s with graceful
# fallback (callers should check the return code and degrade to non-AI path).

# shellcheck disable=SC2034
AI_OPENAI_LIB_VERSION="1.0.0"

AI_OPENAI_ENDPOINT="${AI_OPENAI_ENDPOINT:-https://api.openai.com/v1/chat/completions}"
AI_OPENAI_TIMEOUT_SECS="${AI_OPENAI_TIMEOUT_SECS:-30}"

# Default model per use-case. gpt-4o-mini is cheap; gpt-4o for harder tasks.
ai_default_model() {
    local kind="${1:-wizard}"
    if [[ -n "${ZER0_AI_MODEL:-}" ]]; then
        echo "$ZER0_AI_MODEL"
        return
    fi
    case "$kind" in
        diagnose) echo "gpt-4o" ;;
        *)        echo "gpt-4o-mini" ;;
    esac
}

# Returns 0 if AI is enabled (no kill-switch), 1 if disabled.
ai_enabled() {
    if [[ "${ZER0_NO_AI:-0}" = "1" ]]; then
        return 1
    fi
    return 0
}

# Verify OPENAI_API_KEY is present. Prints install hint on failure.
ai_require_key() {
    if [[ -z "${OPENAI_API_KEY:-}" ]]; then
        log_error "OPENAI_API_KEY environment variable is not set."
        log_info  "Get a key at https://platform.openai.com/api-keys then:"
        log_info  "  export OPENAI_API_KEY='sk-...'"
        log_info  "Or run without --ai for the rule-based fallback."
        return 1
    fi
    return 0
}

# Strip secrets and PII from a string before sending to the API.
# Reads from stdin, writes sanitized text to stdout.
#
# Strips:
#   - OPENAI_API_KEY / RUBYGEMS_API_KEY / GITHUB_TOKEN values
#   - sk-... API key patterns
#   - email addresses
#   - $HOME absolute paths (replaced with ~)
#   - 40+ char hex strings (likely tokens)
ai_sanitize_text() {
    local home_esc
    # Escape $HOME for sed (handle / in path)
    home_esc="$(printf '%s' "${HOME:-/Users/none}" | sed 's:/:\\/:g')"

    sed \
        -e "s/${home_esc}/~/g" \
        -e 's/sk-[A-Za-z0-9_-]\{20,\}/[REDACTED_API_KEY]/g' \
        -e 's/rubygems_[A-Za-z0-9]\{40,\}/[REDACTED_RUBYGEMS_KEY]/g' \
        -e 's/ghp_[A-Za-z0-9]\{20,\}/[REDACTED_GITHUB_TOKEN]/g' \
        -e 's/github_pat_[A-Za-z0-9_]\{20,\}/[REDACTED_GITHUB_PAT]/g' \
        -e 's/[A-Za-z0-9._%+-]\{1,\}@[A-Za-z0-9.-]\{1,\}\.[A-Za-z]\{2,\}/[REDACTED_EMAIL]/g' \
        -e 's/[^A-Fa-f0-9]\([A-Fa-f0-9]\{40,\}\)[^A-Fa-f0-9]/ [REDACTED_HASH] /g'
}

# Print a rough token + cost estimate so the user knows what they're spending
# before the call goes out. Writes to stderr so caller can capture stdout.
#
# Args: <model> <input_chars> <expected_output_tokens>
ai_estimate_cost() {
    local model="$1" input_chars="$2" out_tokens="${3:-500}"
    # ~4 chars per token (English text avg)
    local in_tokens=$(( input_chars / 4 + 1 ))
    local in_cents out_cents total_cents
    case "$model" in
        gpt-4o-mini)
            # $0.15/1M input, $0.60/1M output  (approx, Nov 2024)
            in_cents=$(( (in_tokens * 15 + 999999) / 1000000 ))
            out_cents=$(( (out_tokens * 60 + 999999) / 1000000 ))
            ;;
        gpt-4o)
            # $2.50/1M input, $10.00/1M output
            in_cents=$(( (in_tokens * 250 + 999999) / 1000000 ))
            out_cents=$(( (out_tokens * 1000 + 999999) / 1000000 ))
            ;;
        *)
            in_cents=0; out_cents=0 ;;
    esac
    total_cents=$(( in_cents + out_cents ))
    {
        echo "  Model:     $model"
        echo "  Input:     ~${in_tokens} tokens (${input_chars} chars)"
        echo "  Output:    ~${out_tokens} tokens (cap)"
        echo "  Est. cost: ≤ \$0.0$(printf '%02d' $total_cents)  (≤ ${total_cents}¢)"
    } >&2
}

# Make a chat completion call. Returns the assistant message content on stdout.
# Non-zero return on failure (network, auth, rate-limit, timeout).
#
# Args:
#   $1 = model
#   $2 = system prompt (string)
#   $3 = user prompt (string)
#   $4 = max_tokens (default 1024)
#   $5 = temperature (default 0.3)
ai_call_chat() {
    local model="$1" system="$2" user="$3"
    local max_tokens="${4:-1024}" temp="${5:-0.3}"

    if ! ai_require_key; then
        return 1
    fi

    # Build JSON payload via python (handles escaping safely; available on
    # all macOS + most Linux distros). Falls back to a naive heredoc if
    # python is missing — caller is expected to keep prompts ASCII-safe.
    local payload
    if command -v python3 >/dev/null 2>&1; then
        payload="$(python3 - "$model" "$system" "$user" "$max_tokens" "$temp" <<'PY'
import json, sys
model, system, user, max_tokens, temp = sys.argv[1:]
print(json.dumps({
    "model": model,
    "messages": [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ],
    "max_tokens": int(max_tokens),
    "temperature": float(temp),
}))
PY
)"
    else
        log_error "python3 not found — required for safe JSON payload construction."
        return 1
    fi

    local resp http_code tmpfile
    tmpfile="$(mktemp)"
    # Capture body to tmpfile, status code to stdout, so we can branch on HTTP code.
    http_code="$(curl -sS -o "$tmpfile" -w '%{http_code}' \
        --max-time "$AI_OPENAI_TIMEOUT_SECS" \
        -X POST "$AI_OPENAI_ENDPOINT" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -H 'Content-Type: application/json' \
        --data-binary "$payload" 2>/dev/null || echo "000")"

    resp="$(cat "$tmpfile")"
    rm -f "$tmpfile"

    if [[ "$http_code" != "200" ]]; then
        log_error "OpenAI API call failed (HTTP $http_code)"
        # Print first ~200 chars of response (already from API, no secrets)
        echo "$resp" | head -c 200 >&2
        echo >&2
        return 1
    fi

    # Extract message content
    if command -v python3 >/dev/null 2>&1; then
        echo "$resp" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    print(d["choices"][0]["message"]["content"])
except Exception as e:
    print(f"[parse error: {e}]", file=sys.stderr)
    sys.exit(1)
'
    else
        # Last-resort grep extraction (fragile; warn)
        log_warning "python3 unavailable — falling back to fragile JSON extraction"
        echo "$resp" | sed -n 's/.*"content":"\([^"]*\)".*/\1/p' | head -1
    fi
}

# Show a unified diff between an existing file and a proposed new content,
# and prompt the user to accept. Auto-accepts if --auto-accept (CI mode).
#
# Args: <existing_file_or_/dev/null> <proposed_content_string> <description> [auto_accept]
# Returns 0 if user accepts (or auto-accept), 1 if rejected.
ai_show_diff_confirm() {
    local existing="$1" proposed="$2" desc="$3" auto="${4:-0}"
    local tmp
    tmp="$(mktemp)"
    printf '%s\n' "$proposed" > "$tmp"

    echo
    log_info "Proposed change: $desc"
    echo "─────────────────────────── diff ───────────────────────────"
    if [[ -f "$existing" ]]; then
        diff -u "$existing" "$tmp" || true
    else
        echo "(new file)"
        diff -u /dev/null "$tmp" || true
    fi
    echo "────────────────────────────────────────────────────────────"
    echo

    if [[ "$auto" = "1" ]]; then
        log_info "Auto-accept enabled — applying change."
        echo "$tmp"  # caller reads this path then deletes
        return 0
    fi

    printf "Apply this change? [y/N] "
    local reply
    read -r reply
    if [[ "$reply" =~ ^[Yy]$ ]]; then
        echo "$tmp"
        return 0
    fi
    rm -f "$tmp"
    log_warning "Rejected by user — no changes written."
    return 1
}
