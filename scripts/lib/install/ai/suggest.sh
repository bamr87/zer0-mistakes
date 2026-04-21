#!/usr/bin/env bash
# scripts/lib/install/ai/suggest.sh
#
# `install deploy --ai-suggest` — recommend a deploy target.
#
# Two modes:
#   - Rule-based (default): inspects target dir for signals and picks a slug.
#   - AI-assisted (--ai):  sends sanitized site stats to OpenAI for rationale.
#
# Public API:
#     suggest_deploy_target <target_dir> <repo_root> [--ai] [--auto-accept]
#
# Prints recommended slug to stdout (last line). All other output to stderr.

# shellcheck disable=SC2034
AI_SUGGEST_LIB_VERSION="1.0.0"

# Inspect the target dir and emit a human-readable summary on stdout.
_suggest_collect_signals() {
    local target_dir="$1"
    local total_size site_files has_dockerfile has_api has_cname has_workflows
    if command -v du >/dev/null 2>&1; then
        total_size="$(du -sh "$target_dir" 2>/dev/null | awk '{print $1}')"
    else
        total_size="?"
    fi
    site_files="$(find "$target_dir" -type f \( -name '*.md' -o -name '*.html' \) 2>/dev/null | wc -l | tr -d ' ')"
    has_dockerfile=no; [[ -f "$target_dir/Dockerfile" ]] || [[ -f "$target_dir/docker/Dockerfile.prod" ]] && has_dockerfile=yes
    has_api=no
    if find "$target_dir" -type d \( -name 'api' -o -name 'functions' \) 2>/dev/null | grep -q .; then
        has_api=yes
    fi
    has_cname=no; [[ -f "$target_dir/CNAME" ]] && has_cname=yes
    has_workflows=no; [[ -d "$target_dir/.github/workflows" ]] && has_workflows=yes

    cat <<EOF
size:         $total_size
content_files: $site_files
has_dockerfile: $has_dockerfile
has_api_or_functions: $has_api
has_cname: $has_cname
has_workflows: $has_workflows
EOF
}

# Pure rule-based scoring. Deterministic.
_suggest_rule_based() {
    local signals="$1"
    local has_api has_dockerfile has_cname
    has_api="$(printf '%s\n' "$signals" | grep '^has_api_or_functions:' | awk '{print $2}')"
    has_dockerfile="$(printf '%s\n' "$signals" | grep '^has_dockerfile:' | awk '{print $2}')"
    has_cname="$(printf '%s\n' "$signals" | grep '^has_cname:' | awk '{print $2}')"

    local slug rationale
    if [[ "$has_api" = "yes" ]]; then
        slug="azure-swa"
        rationale="API/functions directory present → Azure Static Web Apps integrates serverless functions out of the box."
    elif [[ "$has_dockerfile" = "yes" ]] && [[ "$has_cname" = "yes" ]]; then
        slug="docker-prod"
        rationale="Existing Dockerfile + custom domain (CNAME) → self-hosted Docker gives full control."
    else
        slug="github-pages"
        rationale="No API code, no custom Docker build → GitHub Pages is the simplest, cheapest target."
    fi
    {
        echo "Rule-based recommendation:"
        echo "  Target:    $slug"
        echo "  Rationale: $rationale"
    } >&2
    printf '%s\n' "$slug"
}

# AI-assisted recommendation. Returns slug on stdout.
_suggest_ai() {
    local signals="$1" repo_root="$2" auto_accept="$3"

    if ! ai_enabled; then
        log_warning "AI is disabled (ZER0_NO_AI=1) — using rule-based only."
        return 1
    fi
    if ! ai_require_key; then
        return 1
    fi

    local sys_prompt_file="$repo_root/templates/ai/prompts/suggest-system.md"
    if [[ ! -f "$sys_prompt_file" ]]; then
        log_error "System prompt missing: $sys_prompt_file"
        return 1
    fi
    local system_prompt
    system_prompt="$(cat "$sys_prompt_file")"

    local user_prompt="Site signals:
${signals}

Available deploy targets:
- github-pages: GitHub Pages with peaceiris/actions-gh-pages
- azure-swa:    Azure Static Web Apps (supports serverless functions)
- docker-prod:  Self-hosted Ruby builder + nginx:alpine container

Recommend exactly one target. Respond with two lines:
TARGET: <slug>
RATIONALE: <one sentence>"

    local model
    model="$(ai_default_model wizard)"
    local in_chars=$(( ${#system_prompt} + ${#user_prompt} ))
    {
        log_info "About to call OpenAI:"
        ai_estimate_cost "$model" "$in_chars" 200
    } >&2

    if [[ "$auto_accept" != "1" ]]; then
        printf "Proceed with API call? [y/N] " >&2
        local go
        read -r go
        if [[ ! "$go" =~ ^[Yy]$ ]]; then
            log_warning "Aborted by user."
            return 1
        fi
    fi

    log_info "Calling $model ..." >&2
    local resp
    if ! resp="$(ai_call_chat "$model" "$system_prompt" "$user_prompt" 200 0.2)"; then
        log_error "OpenAI call failed."
        return 1
    fi

    {
        echo "AI recommendation:"
        printf '%s\n' "$resp" | sed 's/^/  /'
    } >&2

    # Extract slug from "TARGET: <slug>" line
    local slug
    slug="$(printf '%s\n' "$resp" | sed -n 's/^TARGET:[[:space:]]*\([a-z-]*\).*/\1/p' | head -1)"
    if [[ -z "$slug" ]]; then
        log_error "Could not parse TARGET: line from AI response."
        return 1
    fi
    printf '%s\n' "$slug"
}

suggest_deploy_target() {
    local target_dir="$1" repo_root="$2"
    shift 2 || true

    local use_ai=0 auto_accept=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --ai) use_ai=1 ;;
            --auto-accept) auto_accept=1 ;;
            *) log_warning "suggest_deploy_target: ignoring unknown flag: $1" ;;
        esac
        shift
    done

    if [[ ! -d "$target_dir" ]]; then
        log_error "Target directory does not exist: $target_dir"
        return 1
    fi

    log_info "Inspecting target site for deploy signals ..." >&2
    local signals
    signals="$(_suggest_collect_signals "$target_dir")"
    {
        echo "Site signals:"
        printf '%s\n' "$signals" | sed 's/^/  /'
        echo
    } >&2

    local slug
    if [[ "$use_ai" = "1" ]]; then
        if slug="$(_suggest_ai "$signals" "$repo_root" "$auto_accept")"; then
            printf '%s\n' "$slug"
            return 0
        fi
        log_warning "AI suggestion failed — falling back to rule-based."
    fi
    _suggest_rule_based "$signals"
}
