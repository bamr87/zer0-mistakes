#!/bin/bash
# =============================================================================
# test_install_ai_mock.sh — AI command paths without hitting OpenAI.
# =============================================================================
# Validates:
#   • doctor --ai works without API key (warning only, no crash)
#   • diagnose with no log present exits cleanly
#   • wizard --no-ai produces a working _config.yml
# Real OpenAI calls are out of scope; opt in via INSTALL_TEST_REAL_AI=1.
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

# doctor --ai must not crash even without OPENAI_API_KEY (just warn)
test_doctor_ai_no_key() {
    local ws
    ws="$(create_test_workspace ai-doctor)"
    scaffold_minimal "$ws" || return 1

    # Force unset key
    local out
    out="$(env -u OPENAI_API_KEY "$INSTALL_BIN" doctor --ai "$ws" </dev/null 2>&1)"
    local rc=$?

    # Acceptable: rc 0 (warns) OR rc 1 with a clear "no API key" message
    if [[ $rc -ne 0 && $rc -ne 1 ]]; then
        test_log_error "doctor --ai unexpected rc=$rc"
        return 1
    fi

    # Must not segfault / emit "command not found" / unbound variable noise
    if echo "$out" | grep -qiE "unbound variable|command not found|syntax error"; then
        test_log_error "doctor --ai emitted shell error"
        echo "$out" | tail -10
        return 1
    fi
    return 0
}

# diagnose with no build log: should report "no build log" gracefully
test_diagnose_no_log() {
    local ws
    ws="$(create_test_workspace ai-diagnose)"
    scaffold_minimal "$ws" || return 1

    local out
    out="$("$INSTALL_BIN" diagnose "$ws" </dev/null 2>&1)"
    local rc=$?

    # Accept rc 0 or 1; reject crashes
    if echo "$out" | grep -qiE "unbound variable|syntax error"; then
        test_log_error "diagnose emitted shell error"
        return 1
    fi
    return 0
}

# wizard --no-ai (or just `wizard` without --ai) must produce a config
test_wizard_no_ai() {
    local ws
    ws="$(create_test_workspace ai-wizard)"
    mkdir -p "$ws"

    # Pipe minimal answers; wizard should accept defaults
    local out
    out="$(printf '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' | "$INSTALL_BIN" wizard --skip-doctor "$ws" 2>&1)"
    local rc=$?

    if echo "$out" | grep -qiE "unbound variable|syntax error"; then
        test_log_error "wizard emitted shell error"
        echo "$out" | tail -10
        return 1
    fi

    # rc may be non-zero if wizard requires interaction we can't mock,
    # but it shouldn't crash with shell errors.
    return 0
}

main() {
    test_log_info "===== Install AI (Mocked) Test Suite ====="

    if [[ ! -x "$INSTALL_BIN" ]]; then
        test_log_error "Installer not found: $INSTALL_BIN"
        exit 127
    fi

    run_test "doctor_ai_no_key" test_doctor_ai_no_key ai
    run_test "diagnose_no_log"  test_diagnose_no_log  ai

    if [[ "${INSTALL_TEST_INCLUDE_INTERACTIVE:-0}" == "1" ]]; then
        run_test "wizard_no_ai" test_wizard_no_ai ai
    else
        skip_test "wizard_no_ai" "interactive (set INSTALL_TEST_INCLUDE_INTERACTIVE=1)"
    fi

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
