#!/bin/bash
# =============================================================================
# scripts/install/tasks/deploy_docker-prod.sh — Production Docker deploy
# =============================================================================
[[ -n "${_HAS_TASK_DEPLOY_DOCKER_PROD:-}" ]] && return 0
_HAS_TASK_DEPLOY_DOCKER_PROD=1

task_deploy_docker-prod_run() {
    local target="$1"
    log_info "Configuring production Docker deploy..."
    fs_ensure_dir "${target}/docker"
    tmpl_apply "deploy/docker-prod/Dockerfile.prod.template" \
        "${target}/docker/Dockerfile.prod"
    tmpl_apply "deploy/docker-prod/docker-compose.prod.yml.template" \
        "${target}/docker-compose.prod.yml"
    fs_copy_file "${TEMPLATES_DIR}/deploy/docker-prod/nginx.conf" \
        "${target}/docker/nginx.conf"
    fs_copy_file "${TEMPLATES_DIR}/deploy/docker-prod/.dockerignore" \
        "${target}/.dockerignore"
    log_success "Production Docker config written"
}
