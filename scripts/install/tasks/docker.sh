#!/bin/bash
# =============================================================================
# scripts/install/tasks/docker.sh — Write Docker files
# =============================================================================
# Writes: docker-compose.yml, docker/Dockerfile
# Skipped for: minimal and github-pages profiles.
# Bash 3.2 compatible. No set -euo pipefail here.
# =============================================================================
[[ -n "${_HAS_TASK_DOCKER:-}" ]] && return 0
_HAS_TASK_DOCKER=1

task_docker_run() {
    local target="$1"
    local profile="${SPEC_PROFILE:-default}"

    case "$profile" in
        minimal|github-pages)
            log_info "Docker task: skipped for profile '$profile'"
            return 0
            ;;
    esac

    log_info "Writing Docker configuration..."

    tmpl_apply "config/docker-compose.yml.template" "${target}/docker-compose.yml"
    tmpl_apply "config/Dockerfile.consumer.template" "${target}/docker/Dockerfile"

    log_success "Docker files written"
}
