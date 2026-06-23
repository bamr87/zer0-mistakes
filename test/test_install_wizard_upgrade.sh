#!/bin/bash
# =============================================================================
# test_install_wizard_upgrade.sh — Interactive wizard + upgrade-path coverage.
# =============================================================================
# Per the T-005 coverage baseline, scripts/lib/install/wizard_interactive.sh
# (prompt helpers need a TTY) and scripts/lib/install/upgrade.sh had effectively
# no CI coverage (issue #147). This suite:
#
#   1. Drives the wizard prompt helpers non-interactively with piped answers
#      (the pattern from test_install_legacy_flags.sh) — defaults, explicit
#      input, yes/no confirmation, and numbered/by-name menu selection.
#   2. Exercises the upgrade path detect -> migrate -> verify over a version
#      gap, plus the dry-run (no write) and already-current (no-op) branches.
#
# Both libraries only define functions at source time, so they can be sourced
# directly and their public/private helpers called in isolation — no full
# install (and no network) required.
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=lib/install_test_utils.sh
source "$SCRIPT_DIR/lib/install_test_utils.sh"
# logging shim provides log_info/log_success/log_warning/log_error used by upgrade.sh
# shellcheck source=../scripts/lib/install/logging.sh
source "$PROJECT_ROOT/scripts/lib/install/logging.sh"
# functions under test
# shellcheck source=../scripts/lib/install/wizard_interactive.sh
source "$PROJECT_ROOT/scripts/lib/install/wizard_interactive.sh"
# shellcheck source=../scripts/lib/install/upgrade.sh
source "$PROJECT_ROOT/scripts/lib/install/upgrade.sh"

setup_cleanup_trap

# -----------------------------------------------------------------------------
# Wizard prompt helpers (piped, non-interactive)
# -----------------------------------------------------------------------------

test_wiz_prompt_uses_default_on_empty() {
    local out
    out="$(_wiz_prompt "Site name" "mysite" </dev/null)"
    assert_equals "mysite" "$out" "empty input falls back to the default"
}

test_wiz_prompt_returns_typed_value() {
    local out
    out="$(printf 'custom-name\n' | _wiz_prompt "Site name" "mysite")"
    assert_equals "custom-name" "$out" "typed input overrides the default"
}

test_wiz_confirm_default_yes() {
    _wiz_confirm "Proceed?" "y" </dev/null
    assert_equals 0 "$?" "empty input + default 'y' confirms (returns 0)"
}

test_wiz_confirm_default_no() {
    _wiz_confirm "Proceed?" "n" </dev/null
    assert_equals 1 "$?" "empty input + default 'n' declines (returns 1)"
}

test_wiz_confirm_explicit_no_over_yes_default() {
    printf 'n\n' | _wiz_confirm "Proceed?" "y"
    assert_equals 1 "$?" "explicit 'n' declines even when default is 'y'"
}

test_wiz_choose_default_on_empty() {
    local out
    out="$(_wiz_choose "Pick a profile" "full" minimal full fork </dev/null)"
    assert_equals "full" "$out" "empty choice returns the default option"
}

test_wiz_choose_by_number() {
    local out
    out="$(printf '1\n' | _wiz_choose "Pick a profile" "full" minimal full fork)"
    assert_equals "minimal" "$out" "numeric choice selects the Nth option"
}

test_wiz_choose_by_name() {
    local out
    out="$(printf 'fork\n' | _wiz_choose "Pick a profile" "full" minimal full fork)"
    assert_equals "fork" "$out" "by-name choice selects a valid option"
}

test_wiz_choose_out_of_range_falls_back() {
    local out
    out="$(printf '99\n' | _wiz_choose "Pick a profile" "full" minimal full fork)"
    assert_equals "full" "$out" "out-of-range choice falls back to the default"
}

# -----------------------------------------------------------------------------
# Upgrade: detect installed version
# -----------------------------------------------------------------------------

test_upgrade_detect_from_marker() {
    local ws
    ws="$(create_test_workspace upgrade-marker)"
    cat > "$ws/.zer0-installed" <<'EOF'
# zer0-mistakes install marker — do not edit manually
version: 1.10.0
upgraded_at: 2024-01-01T00:00:00Z
EOF
    local detected
    detected="$(_upgrade_detect_installed "$ws")"
    assert_equals "1.10.0" "$detected" "detects version from .zer0-installed marker"
}

test_upgrade_detect_from_config_fallback() {
    local ws
    ws="$(create_test_workspace upgrade-config)"
    cat > "$ws/_config.yml" <<'EOF'
title: Old Site
version: "1.9.0"
EOF
    local detected
    detected="$(_upgrade_detect_installed "$ws")"
    assert_equals "1.9.0" "$detected" "falls back to _config.yml version: when no marker"
}

test_upgrade_detect_unknown() {
    local ws
    ws="$(create_test_workspace upgrade-unknown)"
    local detected
    detected="$(_upgrade_detect_installed "$ws")"
    assert_equals "unknown" "$detected" "reports 'unknown' when nothing identifies the version"
}

# -----------------------------------------------------------------------------
# Upgrade: detect -> migrate -> verify across a version gap
# -----------------------------------------------------------------------------

test_upgrade_migrates_version_gap() {
    local ws theme_version
    ws="$(create_test_workspace upgrade-migrate)"
    theme_version="$(_upgrade_theme_version "$PROJECT_ROOT")"

    # Old install marker creates a real version gap (old -> current theme).
    cat > "$ws/.zer0-installed" <<'EOF'
# zer0-mistakes install marker — do not edit manually
version: 1.10.0
upgraded_at: 2024-01-01T00:00:00Z
EOF

    upgrade_run "$ws" "$PROJECT_ROOT" --auto-accept >/dev/null 2>&1
    assert_equals 0 "$?" "upgrade_run succeeds across a version gap" || return 1

    # Verify: marker now records the current theme version, not the old one.
    assert_file_contains "$ws/.zer0-installed" "version: $theme_version" \
        "marker is rewritten with the current theme version" || return 1
    assert_file_not_contains "$ws/.zer0-installed" "version: 1.10.0" \
        "old version is replaced in the marker" || return 1
    assert_equals "$theme_version" "$(_upgrade_detect_installed "$ws")" \
        "post-upgrade detection reports the new version"
}

test_upgrade_dry_run_does_not_write() {
    local ws
    ws="$(create_test_workspace upgrade-dryrun)"
    cat > "$ws/.zer0-installed" <<'EOF'
# zer0-mistakes install marker — do not edit manually
version: 1.10.0
upgraded_at: 2024-01-01T00:00:00Z
EOF
    upgrade_run "$ws" "$PROJECT_ROOT" --dry-run --auto-accept >/dev/null 2>&1
    assert_file_contains "$ws/.zer0-installed" "version: 1.10.0" \
        "dry-run leaves the existing marker untouched"
}

test_upgrade_already_current_is_noop() {
    local ws theme_version
    ws="$(create_test_workspace upgrade-current)"
    theme_version="$(_upgrade_theme_version "$PROJECT_ROOT")"
    cat > "$ws/.zer0-installed" <<EOF
# zer0-mistakes install marker — do not edit manually
version: $theme_version
upgraded_at: 2024-01-01T00:00:00Z
EOF
    upgrade_run "$ws" "$PROJECT_ROOT" --auto-accept >/dev/null 2>&1
    assert_equals 0 "$?" "already-current upgrade is a successful no-op"
}

# -----------------------------------------------------------------------------

main() {
    test_log_info "===== Wizard + Upgrade Coverage Suite ====="

    run_test "wiz_prompt_uses_default_on_empty"        test_wiz_prompt_uses_default_on_empty        wizard
    run_test "wiz_prompt_returns_typed_value"          test_wiz_prompt_returns_typed_value          wizard
    run_test "wiz_confirm_default_yes"                 test_wiz_confirm_default_yes                 wizard
    run_test "wiz_confirm_default_no"                  test_wiz_confirm_default_no                  wizard
    run_test "wiz_confirm_explicit_no_over_yes"        test_wiz_confirm_explicit_no_over_yes_default wizard
    run_test "wiz_choose_default_on_empty"             test_wiz_choose_default_on_empty             wizard
    run_test "wiz_choose_by_number"                    test_wiz_choose_by_number                    wizard
    run_test "wiz_choose_by_name"                      test_wiz_choose_by_name                      wizard
    run_test "wiz_choose_out_of_range_falls_back"      test_wiz_choose_out_of_range_falls_back       wizard

    run_test "upgrade_detect_from_marker"              test_upgrade_detect_from_marker              upgrade
    run_test "upgrade_detect_from_config_fallback"     test_upgrade_detect_from_config_fallback     upgrade
    run_test "upgrade_detect_unknown"                  test_upgrade_detect_unknown                  upgrade
    run_test "upgrade_migrates_version_gap"            test_upgrade_migrates_version_gap            upgrade
    run_test "upgrade_dry_run_does_not_write"          test_upgrade_dry_run_does_not_write          upgrade
    run_test "upgrade_already_current_is_noop"         test_upgrade_already_current_is_noop         upgrade

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
