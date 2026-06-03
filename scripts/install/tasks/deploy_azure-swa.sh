#!/bin/bash
# =============================================================================
# scripts/install/tasks/deploy_azure-swa.sh — Azure Static Web Apps deploy
# =============================================================================
[[ -n "${_HAS_TASK_DEPLOY_AZURE_SWA:-}" ]] && return 0
_HAS_TASK_DEPLOY_AZURE_SWA=1

task_deploy_azure-swa_run() {
    local target="$1"
    log_info "Configuring Azure Static Web Apps deploy..."
    fs_ensure_dir "${target}/.github/workflows"
    tmpl_apply "deploy/azure-swa/azure-static-web-apps.yml.template" \
        "${target}/.github/workflows/azure-static-web-apps.yml"
    fs_copy_file "${TEMPLATES_DIR}/deploy/azure-swa/staticwebapp.config.json" \
        "${target}/staticwebapp.config.json"
    log_success "Azure SWA config written"
}
