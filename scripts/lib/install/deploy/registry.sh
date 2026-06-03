#!/usr/bin/env bash
# scripts/lib/install/deploy/registry.sh
#
# Discovery + dispatch helpers for deploy target modules.
#
# Each module under scripts/lib/install/deploy/<slug>.sh must define the
# four hooks below (the registry verifies presence after sourcing):
#
#   deploy_<slug>_check_prereqs <target_dir>
#       Print warnings / errors. Return 0 if safe to proceed.
#
#   deploy_<slug>_install <target_dir>
#       Render templates / copy files into <target_dir>. Idempotent.
#
#   deploy_<slug>_verify <target_dir>
#       Confirm the install produced the expected files. Return 0 on OK.
#
#   deploy_<slug>_doc_url
#       Print a single URL pointing at upstream documentation.
#
# A target's display name + one-line description live next to the module
# in scripts/lib/install/deploy/<slug>.sh as `DEPLOY_<SLUG_UPPER>_TITLE`
# and `DEPLOY_<SLUG_UPPER>_SUMMARY` (sourced via `eval`).
#
# Bash 3.2 compatible. No associative arrays, no mapfile.

# Canonical list of supported targets (alphabetical).
DEPLOY_TARGETS_LIST="azure-swa docker-prod github-pages"

# Resolve REPO_ROOT lazily so callers can override via $1.
deploy_repo_root() {
    if [ -n "${REPO_ROOT:-}" ]; then
        echo "$REPO_ROOT"
        return 0
    fi
    local here
    here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ( cd "$here/../../.." && pwd )
}

deploy_targets_dir() {
    local repo_root="${1:-$(deploy_repo_root)}"
    echo "$repo_root/templates/deploy"
}

deploy_modules_dir() {
    local repo_root="${1:-$(deploy_repo_root)}"
    echo "$repo_root/scripts/lib/install/deploy"
}

deploy_target_known() {
    local slug="$1" t
    for t in $DEPLOY_TARGETS_LIST; do
        [ "$t" = "$slug" ] && return 0
    done
    return 1
}

# Convert kebab-case to function-name fragment: github-pages -> github_pages
deploy_slug_fn() {
    echo "$1" | tr '-' '_'
}

# Convert kebab-case to upper var fragment: github-pages -> GITHUB_PAGES
deploy_slug_var() {
    echo "$1" | tr '[:lower:]-' '[:upper:]_'
}

# Source a target module (idempotent). Sets DEPLOY_LAST_LOADED on success.
deploy_load_module() {
    local slug="$1"
    local repo_root="${2:-$(deploy_repo_root)}"
    local module="$(deploy_modules_dir "$repo_root")/${slug}.sh"
    if [ ! -f "$module" ]; then
        log_error "Deploy module not found: $module"
        return 1
    fi
    # shellcheck disable=SC1090
    . "$module"
    DEPLOY_LAST_LOADED="$slug"
}

# Print one-line summary for `install list-targets`.
deploy_print_summary() {
    local slug="$1"
    local repo_root="${2:-$(deploy_repo_root)}"
    deploy_load_module "$slug" "$repo_root" >/dev/null 2>&1 || return 0
    local var_frag title summary
    var_frag="$(deploy_slug_var "$slug")"
    eval "title=\${DEPLOY_${var_frag}_TITLE:-$slug}"
    eval "summary=\${DEPLOY_${var_frag}_SUMMARY:-(no summary)}"
    printf '  %-13s %s\n' "$slug" "$title"
    printf '                %s\n' "$summary"
}

# Run the four hooks for a single target.
deploy_run_target() {
    local slug="$1" target_dir="$2"
    local repo_root="${3:-$(deploy_repo_root)}"
    local fn

    if ! deploy_target_known "$slug"; then
        log_error "Unknown deploy target: $slug"
        log_info  "Available targets: $DEPLOY_TARGETS_LIST"
        return 1
    fi

    if [ ! -d "$target_dir" ]; then
        log_error "Target directory does not exist: $target_dir"
        return 1
    fi

    deploy_load_module "$slug" "$repo_root" || return 1
    fn="$(deploy_slug_fn "$slug")"

    log_info "▶ Configuring deploy target: $slug"

    if ! "deploy_${fn}_check_prereqs" "$target_dir"; then
        log_error "Prerequisite check failed for $slug"
        return 1
    fi

    if ! "deploy_${fn}_install" "$target_dir"; then
        log_error "Install step failed for $slug"
        return 1
    fi

    if ! "deploy_${fn}_verify" "$target_dir"; then
        log_warning "Verification reported issues for $slug (manual review recommended)"
    else
        log_success "Deploy target $slug installed successfully"
    fi

    local url
    url="$("deploy_${fn}_doc_url" 2>/dev/null || true)"
    [ -n "$url" ] && log_info "Documentation: $url"
}

# Lightweight renderer used by all deploy modules. Operates on a small,
# explicit allow-list of placeholders so modules don't need to set up
# install.sh's full global environment.
#
# Usage: deploy_render <template_file> <output_file>
# Variables consulted (with defaults):
#   DEPLOY_RUBY_VERSION   (default 3.3)
#   DEPLOY_DEFAULT_BRANCH (default main)
#   DEPLOY_GITHUB_USER    (default $GITHUB_USER, then $USER, then "me")
#   DEPLOY_SITE_NAME      (default basename of target dir, then "site")
deploy_render() {
    local src="$1" dest="$2"
    [ -f "$src" ] || { log_error "Template not found: $src"; return 1; }

    local ruby_v branch user site
    ruby_v="${DEPLOY_RUBY_VERSION:-3.3}"
    branch="${DEPLOY_DEFAULT_BRANCH:-main}"
    user="${DEPLOY_GITHUB_USER:-${GITHUB_USER:-${USER:-me}}}"
    site="${DEPLOY_SITE_NAME:-site}"

    mkdir -p "$(dirname "$dest")"
    sed \
        -e "s|{{RUBY_VERSION}}|${ruby_v}|g" \
        -e "s|{{DEFAULT_BRANCH}}|${branch}|g" \
        -e "s|{{GITHUB_USER}}|${user}|g" \
        -e "s|{{SITE_NAME}}|${site}|g" \
        "$src" > "$dest"
}

# Copy a file verbatim (no rendering). Skips when destination exists
# unless DEPLOY_FORCE=1.
deploy_copy() {
    local src="$1" dest="$2"
    [ -f "$src" ] || { log_error "Source not found: $src"; return 1; }
    if [ -f "$dest" ] && [ "${DEPLOY_FORCE:-0}" != "1" ]; then
        log_warning "Exists, skipping: ${dest}"
        return 0
    fi
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    log_info "Wrote: ${dest}"
}

# Same as deploy_copy but for rendered templates (logs accordingly).
deploy_render_if_absent() {
    local src="$1" dest="$2"
    if [ -f "$dest" ] && [ "${DEPLOY_FORCE:-0}" != "1" ]; then
        log_warning "Exists, skipping: ${dest}"
        return 0
    fi
    deploy_render "$src" "$dest" && log_info "Rendered: ${dest}"
}
