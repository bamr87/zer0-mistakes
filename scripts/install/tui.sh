#!/bin/bash
# =============================================================================
# scripts/install/tui.sh — Non-AI interactive wizard
# =============================================================================
# Prompts the user through site configuration using prompt.sh and builds
# a spec. Replaces the old install.sh interactive path.
#
# Provides:
#   tui_run TARGET_DIR
#
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TUI_LIB:-}" ]] && return 0
_HAS_TUI_LIB=1

tui_run() {
    local target="${1:-$(pwd)}"

    log_banner "zer0-mistakes Setup Wizard"
    log_info "Let's configure your Jekyll site."
    log_info "(Press Enter to accept defaults shown in brackets)"
    printf "\n" >&2

    # Profile
    prompt_select SPEC_PROFILE "Installation profile" \
        default minimal blog docs portfolio github-pages fork
    export SPEC_PROFILE

    # Site info
    prompt_ask SPEC_SITE_TITLE "Site title" "My Jekyll Site"
    prompt_ask SPEC_SITE_DESCRIPTION "Short description" "A Jekyll site built with zer0-mistakes"
    prompt_ask SPEC_SITE_AUTHOR "Author name" "$(git config user.name 2>/dev/null || echo "Site Author")"
    prompt_ask SPEC_SITE_EMAIL "Author email" "$(git config user.email 2>/dev/null || echo "")"

    export SPEC_SITE_TITLE SPEC_SITE_DESCRIPTION SPEC_SITE_AUTHOR SPEC_SITE_EMAIL

    # GitHub
    if prompt_confirm "Configure GitHub integration?"; then
        prompt_ask SPEC_GITHUB_USER "GitHub username" "${SPEC_GITHUB_USER:-}"
        prompt_ask SPEC_GITHUB_REPO "Repository name" "$(basename "$target")"
        export SPEC_GITHUB_USER SPEC_GITHUB_REPO

        if prompt_confirm "Enable GitHub Pages?"; then
            SPEC_GITHUB_ENABLE_PAGES=true
        else
            SPEC_GITHUB_ENABLE_PAGES=false
        fi
        export SPEC_GITHUB_ENABLE_PAGES
    fi

    # Deploy
    if prompt_confirm "Add a deployment configuration?"; then
        prompt_select _TUI_DEPLOY "Deploy target" \
            github-pages azure-swa docker-prod vercel netlify cloudflare-pages none
        [[ "$_TUI_DEPLOY" != "none" ]] && SPEC_DEPLOY="$_TUI_DEPLOY"
        export SPEC_DEPLOY
    fi

    # Agent files
    if prompt_confirm "Install AI agent files (AGENTS.md, etc.)?"; then
        printf "\nSelect agent integrations (space-separated, e.g. 'copilot claude'):\n" >&2
        printf "  generic copilot claude cursor aider all\n" >&2
        prompt_ask _TUI_AGENTS "Agents" "generic"
        [[ "$_TUI_AGENTS" != "none" ]] && SPEC_AGENTS="$_TUI_AGENTS"
        export SPEC_AGENTS
    fi

    # Options
    if prompt_confirm "Enable dry-run preview (no files written)?"; then
        SPEC_OPT_DRY_RUN=true
    else
        SPEC_OPT_DRY_RUN=false
    fi
    export SPEC_OPT_DRY_RUN

    printf "\n" >&2

    # Build final spec
    SPEC_TARGET_DIR="$target"
    export SPEC_TARGET_DIR
    plan_apply_platform

    if [[ -z "${SPEC_TASKS:-}" ]]; then
        SPEC_TASKS="config gemfile docker pages nav data gitignore readme marker"
    fi
    export SPEC_TASKS

    # Show summary
    log_info "--- Configuration Summary ---"
    log_info "Profile   : ${SPEC_PROFILE}"
    log_info "Title     : ${SPEC_SITE_TITLE}"
    log_info "Author    : ${SPEC_SITE_AUTHOR}"
    log_info "GitHub    : ${SPEC_GITHUB_USER:-not set}/${SPEC_GITHUB_REPO:-not set}"
    log_info "Deploy    : ${SPEC_DEPLOY:-none}"
    log_info "Agents    : ${SPEC_AGENTS:-none}"
    log_info "Dry run   : ${SPEC_OPT_DRY_RUN}"
    log_info "Target    : ${target}"
    printf "\n" >&2

    if ! prompt_confirm "Proceed with installation?"; then
        log_info "Aborted."
        return 0
    fi

    # Write spec and apply
    local spec_file
    spec_file="$(spec_path "$target")"
    spec_write "$spec_file"
    apply_run "$spec_file"
}
