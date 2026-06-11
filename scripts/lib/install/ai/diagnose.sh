#!/usr/bin/env bash
# scripts/lib/install/ai/diagnose.sh
#
# `install diagnose [--ai]` — Jekyll build / runtime error analysis.
#
# Two modes:
#
# 1. Rule-based (default, no network). Pattern-matches a curated list of
#    known errors against a build log and prints structured fixes.
#
# 2. AI-assisted (`--ai`). Sends a sanitized error log + the most relevant
#    config files to OpenAI, returns a unified diff for user review.
#
# Public API:
#     diagnose_run <target_dir> <repo_root> [--log <file>] [--ai] [--auto-accept]
#
# If --log is not provided, runs `jekyll build` once and captures output.

# shellcheck disable=SC2034
AI_DIAGNOSE_LIB_VERSION="1.0.0"

# ----- Rule-based pattern table --------------------------------------------
# Each rule: [pattern_regex] [short_label] [explanation+fix]
# Order matters — first match wins. Keep patterns specific.
_diagnose_rules() {
    cat <<'EOF'
theme could not be found|MISSING_THEME|The Jekyll theme gem is not installed. Run `bundle install` (or `bundle update jekyll-theme-zer0`) and confirm the gem name in _config.yml matches your Gemfile entry.
Address already in use|PORT_IN_USE|Port 4000 is already bound. Either stop the existing process (`lsof -ti :4000 | xargs kill`) or run on a different port (`bundle exec jekyll serve --port 4001`).
You have requested:.*Could not find compatible versions|GEM_VERSION_CONFLICT|A gem version constraint cannot be satisfied. Run `bundle update` to refresh the lockfile, or pin to compatible versions in your Gemfile.
Liquid Exception:.*Could not locate the included file|MISSING_INCLUDE|A `{% include %}` tag references a file that doesn't exist. Verify the path inside `_includes/` and check for typos.
Liquid Exception|LIQUID_ERROR|A Liquid template raised an error. Check the file path printed above the exception and look for unmatched tags ({% if %} without {% endif %}, etc.).
SassC::SyntaxError|SASS_SYNTAX|Sass compilation failed. Review the file/line printed in the error and check for missing semicolons, unclosed braces, or invalid @import paths.
No such file or directory @ rb_sysopen|MISSING_FILE|Jekyll tried to open a file that doesn't exist. Common causes: deleted but still referenced in _config.yml or front matter; typo in include path.
incompatible character encodings|ENCODING_ISSUE|A file has mixed encodings. Re-save the offending file as UTF-8 without BOM.
EOF
}

_diagnose_rule_based() {
    local log_file="$1"
    local matched=0 line key label fix
    while IFS='|' read -r pattern label fix; do
        [[ -z "$pattern" ]] && continue
        if grep -qE "$pattern" "$log_file" 2>/dev/null; then
            log_info "Matched rule: $label"
            echo "  ↳ $fix"
            echo
            matched=$((matched+1))
        fi
    done < <(_diagnose_rules)

    if [[ "$matched" = "0" ]]; then
        log_warning "No known patterns matched. Re-run with --ai for AI analysis (requires OPENAI_API_KEY)."
        return 1
    fi
    log_success "Matched $matched rule(s)."
    return 0
}

_diagnose_capture_build_log() {
    local target_dir="$1" log_file="$2"
    log_info "Running 'jekyll build' to capture errors ..."
    (
        cd "$target_dir" || exit 1
        if [[ -f Gemfile ]] && command -v bundle >/dev/null 2>&1; then
            bundle exec jekyll build 2>&1 | tee "$log_file"
        elif command -v jekyll >/dev/null 2>&1; then
            jekyll build 2>&1 | tee "$log_file"
        else
            echo "neither bundler nor jekyll is installed" > "$log_file"
            return 1
        fi
    ) || true
}

_diagnose_ai() {
    local log_file="$1" target_dir="$2" repo_root="$3" auto_accept="$4"

    if ! ai_enabled; then
        log_warning "AI is disabled (ZER0_NO_AI=1) — using rule-based mode only."
        return 1
    fi
    if ! ai_require_key; then
        return 1
    fi

    local sys_prompt_file="$repo_root/templates/ai/prompts/diagnose-system.md"
    if [[ ! -f "$sys_prompt_file" ]]; then
        log_error "System prompt missing: $sys_prompt_file"
        return 1
    fi
    local system_prompt
    system_prompt="$(cat "$sys_prompt_file")"

    # Build sanitized context (last 80 lines of log + _config.yml + Gemfile)
    local sanitized_log sanitized_cfg sanitized_gem
    sanitized_log="$(tail -n 80 "$log_file" | ai_sanitize_text)"
    if [[ -f "$target_dir/_config.yml" ]]; then
        sanitized_cfg="$(ai_sanitize_text < "$target_dir/_config.yml")"
    else
        sanitized_cfg="(missing)"
    fi
    if [[ -f "$target_dir/Gemfile" ]]; then
        sanitized_gem="$(ai_sanitize_text < "$target_dir/Gemfile")"
    else
        sanitized_gem="(missing)"
    fi

    local user_prompt="===== BUILD LOG (last 80 lines) =====
${sanitized_log}

===== _config.yml =====
${sanitized_cfg}

===== Gemfile =====
${sanitized_gem}

Diagnose the failure and propose a minimal fix. If a file change is needed, output a unified diff. Be concise."

    local model
    model="$(ai_default_model diagnose)"
    local in_chars=$(( ${#system_prompt} + ${#user_prompt} ))
    log_info "About to call OpenAI:"
    ai_estimate_cost "$model" "$in_chars" 600

    if [[ "$auto_accept" != "1" ]]; then
        printf "Proceed with API call? [y/N] "
        local go
        read -r go
        if [[ ! "$go" =~ ^[Yy]$ ]]; then
            log_warning "Aborted by user."
            return 1
        fi
    fi

    log_info "Calling $model ..."
    local resp
    if ! resp="$(ai_call_chat "$model" "$system_prompt" "$user_prompt" 800 0.2)"; then
        log_error "OpenAI call failed."
        return 1
    fi

    echo
    log_info "AI diagnosis:"
    echo "─────────────────────────────────────────────────────────────"
    printf '%s\n' "$resp"
    echo "─────────────────────────────────────────────────────────────"
    log_info "If the response includes a unified diff, save it to a file and apply with: patch -p0 < fix.diff"
    return 0
}

diagnose_run() {
    local target_dir="$1" repo_root="$2"
    shift 2 || true

    local log_file="" use_ai=0 auto_accept=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --log) log_file="${2:-}"; shift ;;
            --ai)  use_ai=1 ;;
            --auto-accept) auto_accept=1 ;;
            *) log_warning "diagnose_run: ignoring unknown flag: $1" ;;
        esac
        shift
    done

    if [[ ! -d "$target_dir" ]]; then
        log_error "Target directory does not exist: $target_dir"
        return 1
    fi

    local cleanup_log=0
    if [[ -z "$log_file" ]]; then
        log_file="$(mktemp)"
        cleanup_log=1
        _diagnose_capture_build_log "$target_dir" "$log_file"
    fi

    if [[ ! -f "$log_file" ]]; then
        log_error "Log file not found: $log_file"
        [[ "$cleanup_log" = "1" ]] && rm -f "$log_file"
        return 1
    fi

    log_info "Diagnosing build log ($(wc -l < "$log_file" | tr -d ' ') lines) ..."
    echo

    # Always run rule-based first
    local rule_result=0
    _diagnose_rule_based "$log_file" || rule_result=1

    # AI if requested
    if [[ "$use_ai" = "1" ]]; then
        echo
        _diagnose_ai "$log_file" "$target_dir" "$repo_root" "$auto_accept" || true
    fi

    [[ "$cleanup_log" = "1" ]] && rm -f "$log_file"
    return $rule_result
}
