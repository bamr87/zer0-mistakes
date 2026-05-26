#!/bin/bash
# =============================================================================
# scripts/install/tasks/gemfile.sh — Write Gemfile
# =============================================================================
# Selects the correct Gemfile template variant based on profile + platform:
#   remote   → Gemfile.remote.template   (github-pages gem)
#   macos    → Gemfile.macos.template    (system ruby < 2.7 compat caps)
#   minimal  → Gemfile.minimal.template  (bare jekyll, no gem-theme)
#   default  → Gemfile.full.template     (jekyll-theme-zer0 gem)
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_GEMFILE:-}" ]] && return 0
_HAS_TASK_GEMFILE=1

task_gemfile_run() {
    local target="$1"

    log_info "Writing Gemfile..."

    local tmpl
    local profile="${SPEC_PROFILE:-default}"
    local theme_source="${SPEC_THEME_SOURCE:-${THEME_SOURCE:-gem}}"

    case "$profile" in
        github-pages)
            tmpl="config/Gemfile.remote.template" ;;
        minimal)
            # macOS compat check
            if [[ "$(type -t platform_needs_macos_gemfile)" == "function" ]] && \
               platform_needs_macos_gemfile; then
                tmpl="config/Gemfile.macos.template"
            else
                tmpl="config/Gemfile.minimal.template"
            fi
            ;;
        *)
            tmpl="config/Gemfile.full.template" ;;
    esac

    tmpl_apply "$tmpl" "${target}/Gemfile"
    log_success "Gemfile written (template: $tmpl)"
}
