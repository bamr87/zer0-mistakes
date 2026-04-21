#!/bin/bash
# =============================================================================
# test_install_deploy.sh — Validate deploy targets generate sane workflows.
# =============================================================================
# For each deploy target (github-pages, azure-swa, docker-prod), run
# `install deploy <target>` against a minimal workspace and verify the
# expected workflow / Dockerfile / config artifact lands.
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_BIN="$PROJECT_ROOT/scripts/bin/install"

# shellcheck source=lib/install_test_utils.sh
source "$SCRIPT_DIR/lib/install_test_utils.sh"
setup_cleanup_trap

scaffold_minimal() {
    local ws="$1"
    "$INSTALL_BIN" init --profile minimal --skip-doctor "$ws" </dev/null >/dev/null 2>&1
}

deploy_target() {
    local ws="$1"
    local target="$2"
    "$INSTALL_BIN" deploy "$target" "$ws" </dev/null >/tmp/deploy-$$-out 2>&1
    local rc=$?
    if [[ $rc -ne 0 ]]; then
        test_log_error "deploy $target failed (rc=$rc)"
        tail -10 /tmp/deploy-$$-out
        rm -f /tmp/deploy-$$-out
        return 1
    fi
    rm -f /tmp/deploy-$$-out
    return 0
}

assert_yaml_parses() {
    local file="$1"
    if ! command -v python3 >/dev/null 2>&1; then
        return 0  # skip if no python
    fi
    python3 -c "import sys, yaml; yaml.safe_load(open(sys.argv[1]))" "$file" 2>/dev/null
}

test_github_pages() {
    local ws
    ws="$(create_test_workspace deploy-ghp)"
    scaffold_minimal "$ws" || return 1
    deploy_target "$ws" github-pages || return 1

    local wf="$ws/.github/workflows/jekyll-gh-pages.yml"
    assert_file_exists "$wf" "GitHub Pages workflow missing" || return 1
    assert_yaml_parses "$wf" || { test_log_error "Invalid YAML: $wf"; return 1; }
}

test_azure_swa() {
    local ws
    ws="$(create_test_workspace deploy-azure)"
    scaffold_minimal "$ws" || return 1
    deploy_target "$ws" azure-swa || return 1

    local wf="$ws/.github/workflows/azure-static-web-apps.yml"
    assert_file_exists "$wf" "Azure SWA workflow missing" || return 1
    assert_yaml_parses "$wf" || { test_log_error "Invalid YAML: $wf"; return 1; }

    # swa config (optional, target may write either)
    [[ -f "$ws/staticwebapp.config.json" || -f "$ws/.github/workflows/azure-static-web-apps.yml" ]]
}

test_docker_prod() {
    local ws
    ws="$(create_test_workspace deploy-docker)"
    scaffold_minimal "$ws" || return 1
    deploy_target "$ws" docker-prod || return 1

    assert_file_exists "$ws/docker/Dockerfile.prod" "docker/Dockerfile.prod missing" || return 1
    assert_file_exists "$ws/docker-compose.prod.yml" "docker-compose.prod.yml missing" || return 1
    assert_file_exists "$ws/.dockerignore" ".dockerignore missing" || return 1
}

main() {
    test_log_info "===== Install Deploy Target Test Suite ====="

    if [[ ! -x "$INSTALL_BIN" ]]; then
        test_log_error "Installer not found: $INSTALL_BIN"
        exit 127
    fi

    run_test "deploy_github_pages" test_github_pages deploy
    run_test "deploy_azure_swa"    test_azure_swa    deploy
    run_test "deploy_docker_prod"  test_docker_prod  deploy

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
