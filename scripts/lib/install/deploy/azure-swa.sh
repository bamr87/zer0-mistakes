#!/usr/bin/env bash
# scripts/lib/install/deploy/azure-swa.sh
#
# Deploy module: Azure Static Web Apps. Replaces the legacy
# install.sh::create_azure_static_web_apps_workflow heredoc and adds
# a sensible staticwebapp.config.json.

DEPLOY_AZURE_SWA_TITLE="Azure Static Web Apps"
DEPLOY_AZURE_SWA_SUMMARY="Workflow + config for Azure SWA. Requires AZURE_STATIC_WEB_APPS_API_TOKEN secret."

deploy_azure_swa_check_prereqs() {
    local target_dir="$1"
    if [ ! -f "$target_dir/Gemfile" ]; then
        log_warning "Gemfile not found in $target_dir — Azure build step will fail until one exists."
    fi
    return 0
}

deploy_azure_swa_install() {
    local target_dir="$1"
    local repo_root="${REPO_ROOT:-$(deploy_repo_root)}"
    local src_dir="$repo_root/templates/deploy/azure-swa"

    deploy_render_if_absent \
        "$src_dir/azure-static-web-apps.yml.template" \
        "$target_dir/.github/workflows/azure-static-web-apps.yml"

    deploy_copy \
        "$src_dir/staticwebapp.config.json" \
        "$target_dir/staticwebapp.config.json"
}

deploy_azure_swa_verify() {
    local target_dir="$1"
    local wf="$target_dir/.github/workflows/azure-static-web-apps.yml"
    local cfg="$target_dir/staticwebapp.config.json"
    local ok=0
    [ -f "$wf" ]  || { log_error "Missing $wf"; ok=1; }
    [ -f "$cfg" ] || { log_error "Missing $cfg"; ok=1; }
    [ "$ok" = "0" ] || return 1
    grep -q 'Azure/static-web-apps-deploy' "$wf" || {
        log_warning "Workflow does not reference Azure/static-web-apps-deploy"
        return 1
    }
    return 0
}

deploy_azure_swa_doc_url() {
    echo "https://learn.microsoft.com/azure/static-web-apps/"
}
