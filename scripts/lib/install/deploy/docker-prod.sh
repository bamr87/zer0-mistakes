#!/usr/bin/env bash
# scripts/lib/install/deploy/docker-prod.sh
#
# Deploy module: self-hosted production Docker (multi-stage Ruby + Nginx).
# Installs docker/Dockerfile.prod, docker-compose.prod.yml, docker/nginx.conf,
# and (if absent) a .dockerignore tuned for the build context.

DEPLOY_DOCKER_PROD_TITLE="Self-hosted production Docker"
DEPLOY_DOCKER_PROD_SUMMARY="Two-stage build (Ruby builder + nginx:alpine runtime) with healthcheck + compose."

deploy_docker_prod_check_prereqs() {
    local target_dir="$1"
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "docker CLI not found in PATH — files will be installed but you cannot build the image locally."
    fi
    if [ ! -f "$target_dir/Gemfile" ]; then
        log_warning "Gemfile not found in $target_dir — Docker build will fail until one exists."
    fi
    return 0
}

deploy_docker_prod_install() {
    local target_dir="$1"
    local repo_root="${REPO_ROOT:-$(deploy_repo_root)}"
    local src_dir="$repo_root/templates/deploy/docker-prod"

    DEPLOY_SITE_NAME="${DEPLOY_SITE_NAME:-$(basename "$target_dir")}"

    deploy_render_if_absent \
        "$src_dir/Dockerfile.prod.template" \
        "$target_dir/docker/Dockerfile.prod"

    deploy_render_if_absent \
        "$src_dir/docker-compose.prod.yml.template" \
        "$target_dir/docker-compose.prod.yml"

    deploy_copy \
        "$src_dir/nginx.conf" \
        "$target_dir/docker/nginx.conf"

    # .dockerignore: only install when missing so we never clobber user rules.
    if [ ! -f "$target_dir/.dockerignore" ]; then
        deploy_copy "$src_dir/.dockerignore" "$target_dir/.dockerignore"
    else
        log_warning ".dockerignore already exists, leaving untouched."
    fi
}

deploy_docker_prod_verify() {
    local target_dir="$1"
    local ok=0
    for f in \
        "$target_dir/docker/Dockerfile.prod" \
        "$target_dir/docker-compose.prod.yml" \
        "$target_dir/docker/nginx.conf"; do
        if [ ! -f "$f" ]; then
            log_error "Missing $f"
            ok=1
        fi
    done
    [ "$ok" = "0" ] || return 1
    grep -q 'nginx:alpine' "$target_dir/docker/Dockerfile.prod" || {
        log_warning "Dockerfile.prod is missing the nginx:alpine runtime stage"
        return 1
    }
    return 0
}

deploy_docker_prod_doc_url() {
    echo "https://docs.docker.com/compose/production/"
}
