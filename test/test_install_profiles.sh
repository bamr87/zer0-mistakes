#!/bin/bash
# =============================================================================
# test_install_profiles.sh — Validate every install profile end-to-end.
# =============================================================================
# For each profile, scaffold into a temp workspace and assert the file tree
# matches the profile's signature paths.
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_BIN="$PROJECT_ROOT/scripts/bin/install"

# shellcheck source=lib/install_test_utils.sh
source "$SCRIPT_DIR/lib/install_test_utils.sh"
setup_cleanup_trap

EXPECTED_minimal="Gemfile _config.yml index.md INSTALLATION.md"
EXPECTED_full="Gemfile _config.yml _data index.md pages/_about pages/_docs pages/blog.md docker-compose.yml"
EXPECTED_github="Gemfile _config.yml"
EXPECTED_fork="Gemfile _config.yml"

run_profile_test() {
    local profile="$1"
    local expected_var="EXPECTED_${profile}"
    local expected="${!expected_var}"

    local workspace
    workspace="$(create_test_workspace "profile-${profile}")"

    "$INSTALL_BIN" init --profile "$profile" --skip-doctor "$workspace" </dev/null >/dev/null 2>&1
    local rc=$?
    if [[ $rc -ne 0 ]]; then
        test_log_error "install init --profile $profile failed (rc=$rc)"
        return 1
    fi

    local missing=0
    for path in $expected; do
        if [[ ! -e "$workspace/$path" ]]; then
            test_log_error "  Profile $profile missing expected: $path"
            missing=$((missing + 1))
        fi
    done

    [[ $missing -eq 0 ]]
}

test_minimal()  { run_profile_test minimal; }
test_full()     { run_profile_test full; }
test_github()   { run_profile_test github; }
test_fork()     { run_profile_test fork; }

main() {
    test_log_info "===== Install Profile Test Suite ====="

    if [[ ! -x "$INSTALL_BIN" ]]; then
        test_log_error "Installer not found: $INSTALL_BIN"
        exit 127
    fi

    run_test "profile_minimal" test_minimal profiles
    run_test "profile_full"    test_full    profiles

    # github + fork profiles are interactive (gh auth, prompts). Opt in via env.
    if [[ "${INSTALL_TEST_INCLUDE_INTERACTIVE:-0}" == "1" ]]; then
        run_test "profile_github" test_github profiles
        run_test "profile_fork"   test_fork   profiles
    else
        skip_test "profile_github" "interactive (set INSTALL_TEST_INCLUDE_INTERACTIVE=1)"
        skip_test "profile_fork"   "interactive (set INSTALL_TEST_INCLUDE_INTERACTIVE=1)"
    fi

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
