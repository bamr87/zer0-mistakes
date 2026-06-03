#!/usr/bin/env bash
# scripts/lib/install/deploy/github-pages.sh
#
# Deploy module: GitHub Pages (Actions-based, peaceiris/actions-gh-pages).
# Generates .github/workflows/jekyll-gh-pages.yml.

DEPLOY_GITHUB_PAGES_TITLE="GitHub Pages (Actions)"
DEPLOY_GITHUB_PAGES_SUMMARY="Builds with Bundler and publishes _site/ to the gh-pages branch."

deploy_github_pages_check_prereqs() {
    local target_dir="$1"
    if [ ! -f "$target_dir/_config.yml" ]; then
        log_warning "_config.yml not found in $target_dir — workflow will still install but may not build."
    fi
    return 0
}

deploy_github_pages_install() {
    local target_dir="$1"
    local repo_root="${REPO_ROOT:-$(deploy_repo_root)}"
    local src="$repo_root/templates/deploy/github-pages/jekyll-gh-pages.yml.template"
    local dest="$target_dir/.github/workflows/jekyll-gh-pages.yml"

    DEPLOY_SITE_NAME="${DEPLOY_SITE_NAME:-$(basename "$target_dir")}"
    deploy_render_if_absent "$src" "$dest"
}

deploy_github_pages_verify() {
    local target_dir="$1"
    local f="$target_dir/.github/workflows/jekyll-gh-pages.yml"
    if [ ! -f "$f" ]; then
        log_error "Expected $f not present"
        return 1
    fi
    grep -q 'peaceiris/actions-gh-pages' "$f" || {
        log_warning "Workflow does not reference peaceiris/actions-gh-pages"
        return 1
    }
    return 0
}

deploy_github_pages_doc_url() {
    echo "https://docs.github.com/pages"
}
