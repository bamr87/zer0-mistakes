#!/bin/bash
# =============================================================================
# scripts/install/tasks/deploy_github-pages.sh — GitHub Pages deploy plugin
# =============================================================================
# Writes .github/workflows/jekyll-gh-pages.yml so the repo deploys to
# GitHub Pages via Actions. Idempotent.
# =============================================================================
[[ -n "${_HAS_TASK_DEPLOY_GH_PAGES:-}" ]] && return 0
_HAS_TASK_DEPLOY_GH_PAGES=1

task_deploy_github-pages_run() {
    local target="$1"
    log_info "Configuring GitHub Pages deploy..."
    fs_ensure_dir "${target}/.github/workflows"
    tmpl_apply "deploy/github-pages/jekyll-gh-pages.yml.template" \
        "${target}/.github/workflows/jekyll-gh-pages.yml"
    log_success "GitHub Pages workflow written"
}
