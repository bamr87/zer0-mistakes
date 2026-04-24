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

main() {
    test_log_info "===== Legacy Flags Compatibility Suite ====="

    if [[ ! -f "$INSTALL_SH" ]]; then
        test_log_error "install.sh not found: $INSTALL_SH"
        exit 127
    fi

    run_test "legacy_minimal" test_legacy_minimal legacy
    run_test "legacy_full"    test_legacy_full    legacy

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
