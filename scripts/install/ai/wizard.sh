#!/bin/bash
# =============================================================================
# scripts/install/ai/wizard.sh — AI-driven spec generator
# =============================================================================
# Conversations with an LLM to gather site requirements and emit a valid
# install spec JSON. The AI is constrained to the spec.schema.json contract.
#
# The AI NEVER writes files. It returns a spec JSON only. apply.sh is the
# sole writer.
#
# Provides:
#   ai_wizard_run TARGET_DIR
#       → populate SPEC_* globals from AI-generated spec
#       → write spec to $(spec_path TARGET_DIR)
#       → return 0 on success
#
# Environment:
#   OPENAI_API_KEY / OPENAI_BASE_URL — see ai/client.sh
#   ZER0_NO_AI=1  — disable AI (returns error)
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_AI_WIZARD:-}" ]] && return 0
_HAS_AI_WIZARD=1

_AI_WIZARD_DIR="${_AI_WIZARD_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)}"

ai_wizard_run() {
    local target="$1"
    [[ -z "$target" ]] && target="$(pwd)"

    # Source client
    if [[ "$(type -t ai_client_available)" != "function" ]]; then
        local client="${_AI_WIZARD_DIR}/client.sh"
        [[ -f "$client" ]] || { log_error "ai/client.sh not found"; return 1; }
        # shellcheck source=./client.sh
        source "$client"
    fi

    if ! ai_client_available; then
        log_error "AI wizard requires OPENAI_API_KEY or OPENAI_BASE_URL"
        return 1
    fi

    # Load system prompt
    local sys_prompt_file="${_AI_WIZARD_DIR}/prompts/wizard.system.md"
    local sys_prompt
    if [[ -f "$sys_prompt_file" ]]; then
        sys_prompt=$(cat "$sys_prompt_file")
    else
        sys_prompt="You are the zer0-mistakes installer wizard. Ask the user questions to gather site requirements, then output a valid install spec JSON matching the provided schema. Output only the JSON object, no prose."
    fi

    # Load schema for reference (shown to AI in prompt, not as structured output)
    local schema_file="${_AI_WIZARD_DIR}/prompts/spec.schema.json"
    local schema_hint=""
    [[ -f "$schema_file" ]] && schema_hint=$(cat "$schema_file")

    # Build user context prompt
    local user_prompt
    user_prompt=$(cat <<PROMPT
Target directory: $target
Platform: $(uname -s) $(uname -m)
Current user: $(id -un 2>/dev/null || echo "unknown")

Please generate the install spec JSON for my zer0-mistakes Jekyll site.

Key info:
- Profile preference: ${SPEC_PROFILE:-not set}
- Site title: ${SPEC_SITE_TITLE:-not set}
- GitHub username: ${SPEC_GITHUB_USER:-not set}
- Deploy preference: ${SPEC_DEPLOY:-not set}
- AI agents needed: ${SPEC_AGENTS:-not set}

The JSON must conform to this schema:
${schema_hint}

Output ONLY the JSON object, no prose, no markdown fences.
PROMPT
)

    log_banner "AI Installation Wizard"
    log_info "Connecting to AI... (model: ${OPENAI_MODEL:-gpt-4o-mini})"

    local resp
    resp=$(ai_client_chat "$sys_prompt" "$user_prompt")
    local ret=$?

    if [[ $ret -ne 0 ]]; then
        log_error "AI wizard: API call failed"
        return 1
    fi

    # Extract JSON spec from response
    local spec_json
    spec_json=$(ai_client_extract_text "$resp")

    if [[ -z "$spec_json" ]]; then
        log_error "AI wizard: empty response"
        return 1
    fi

    # Write spec to temp file and read it
    local tmp
    tmp=$(mktemp /tmp/zer0-ai-spec-XXXXXX.json)
    printf '%s\n' "$spec_json" > "$tmp"

    if spec_validate "$tmp"; then
        log_success "AI generated a valid spec"
        # Populate globals
        spec_read "$tmp"
        # Override target dir (AI may not know the exact local path)
        SPEC_TARGET_DIR="$target"
        export SPEC_TARGET_DIR
        # If AI omitted deploy/agents, fall back to profile defaults so the
        # user still gets sensible files. CLI flags then win below.
        if [[ -z "${SPEC_DEPLOY:-}" || -z "${SPEC_AGENTS:-}" ]]; then
            local _profile_file="${TEMPLATES_DIR:-}/profiles/${SPEC_PROFILE:-default}.yml"
            if [[ -f "$_profile_file" && "$(type -t plan_load_profile)" == "function" ]]; then
                local _saved_deploy="$SPEC_DEPLOY"
                local _saved_agents="$SPEC_AGENTS"
                SPEC_DEPLOY=""; SPEC_AGENTS=""
                plan_load_profile "$_profile_file" 2>/dev/null || true
                [[ -n "$_saved_deploy" ]] && SPEC_DEPLOY="$_saved_deploy"
                [[ -n "$_saved_agents" ]] && SPEC_AGENTS="$_saved_agents"
            fi
        fi
        # Re-apply CLI flags so user-provided --site-title, --github-user, etc.
        # always win over AI guesses.
        if [[ "$(type -t plan_apply_flags)" == "function" ]]; then
            plan_apply_flags
        fi
        # Apply platform defaults
        plan_apply_platform
        # Record AI metadata
        SPEC_AI_USED=true
        SPEC_AI_PROVIDER="${OPENAI_PROVIDER:-openai}"
        SPEC_AI_MODEL="${OPENAI_MODEL:-gpt-4o-mini}"
        export SPEC_AI_USED SPEC_AI_PROVIDER SPEC_AI_MODEL
        # Write final spec
        spec_write "$(spec_path "$target")"
        rm -f "$tmp"
        return 0
    else
        log_error "AI returned an invalid spec. Review: $tmp"
        log_warning "Falling back to interactive wizard..."
        rm -f "$tmp"
        return 1
    fi
}
