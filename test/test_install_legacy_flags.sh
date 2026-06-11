#!/bin/bash
# =============================================================================
# test_install_legacy_flags.sh — Old-style flags must still work.
# =============================================================================
# `install.sh --minimal /tmp/...` and `install.sh --full /tmp/...` should keep
# producing the same file tree as the corresponding profile invocations.
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_SH="$PROJECT_ROOT/install.sh"

# shellcheck source=lib/install_test_utils.sh
source "$SCRIPT_DIR/lib/install_test_utils.sh"
setup_cleanup_trap

run_legacy() {
    local flag="$1"
    local ws="$2"
    # install.sh (legacy) does not accept --skip-doctor; bin/install wraps it.
    bash "$INSTALL_SH" "$flag" "$ws" </dev/null >/dev/null 2>&1
}

run_stdin_bootstrap() {
    local ws="$1"
    (
        cd "$ws"
        # Simulate README one-liner behavior: script executed from stdin.
        # Use stdin redirection (not a pipe) to avoid pipefail false negatives.
        bash -s -- --minimal "$ws" < "$INSTALL_SH" >/dev/null 2>&1
    )
}

test_legacy_minimal() {
    local ws
    ws="$(create_test_workspace legacy-min)"
    run_legacy --minimal "$ws" || return 1
    assert_file_exists "$ws/_config.yml" || return 1
    assert_file_exists "$ws/Gemfile"     || return 1
    assert_file_exists "$ws/index.md"    || return 1
}

test_legacy_full() {
    local ws
    ws="$(create_test_workspace legacy-full)"
    run_legacy --full "$ws" || return 1
    assert_file_exists "$ws/_config.yml"        || return 1
    assert_file_exists "$ws/Gemfile"            || return 1
    assert_dir_exists  "$ws/_data"              || return 1
    assert_dir_exists  "$ws/pages"              || return 1
    assert_file_exists "$ws/docker-compose.yml" || return 1
}

test_remote_fallback_loader_returns_success() {
    # Regression guard: fallback config loader must return 0 under `set -e`.
    awk '
        /_load_install_config\(\)[[:space:]]*\{/ { in_fn=1 }
        in_fn && /return[[:space:]]+0/ { found=1 }
        in_fn && /^    }/ { exit }
        END { exit(found ? 0 : 1) }
    ' "$INSTALL_SH"
}

test_remote_download_uses_absolute_github_url() {
    # Regression guard: remote tarball URL must include protocol + host.
    assert_file_contains \
        "$INSTALL_SH" \
        'https://github.com/${GITHUB_REPO}/archive/refs/heads/main.tar.gz' \
        "Remote download URL should be absolute"
}

test_stdin_bootstrap_minimal() {
    # Network-dependent: only run when explicitly enabled in CI.
    if [[ "${INSTALL_TEST_INCLUDE_REMOTE:-0}" != "1" ]]; then
        skip_test "stdin_bootstrap_minimal" "Set INSTALL_TEST_INCLUDE_REMOTE=1 to enable"
        return 0
    fi

    local ws
    ws="$(create_test_workspace legacy-stdin)"
    run_stdin_bootstrap "$ws" || return 1

    assert_file_exists "$ws/_config.yml" || return 1
    assert_file_exists "$ws/Gemfile" || return 1
    assert_file_exists "$ws/index.md" || return 1
}

main() {
    test_log_info "===== Legacy Flags Compatibility Suite ====="

    if [[ ! -f "$INSTALL_SH" ]]; then
        test_log_error "install.sh not found: $INSTALL_SH"
        exit 127
    fi

    run_test "legacy_minimal" test_legacy_minimal legacy
    run_test "legacy_full"    test_legacy_full    legacy
    run_test "remote_fallback_loader_returns_success" test_remote_fallback_loader_returns_success legacy
    run_test "remote_download_uses_absolute_github_url" test_remote_download_uses_absolute_github_url legacy
    run_test "stdin_bootstrap_minimal" test_stdin_bootstrap_minimal legacy

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
