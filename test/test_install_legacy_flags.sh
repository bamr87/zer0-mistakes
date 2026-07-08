#!/bin/bash
# =============================================================================
# test_install_legacy_flags.sh — Old-style flags must still work.
# =============================================================================
# `install.sh --minimal /tmp/...` and `install.sh --full /tmp/...` should keep
# producing the same file tree as the corresponding profile invocations.
#
# Also covers scenarios ported from the retired test_installation.sh:
#   • Short flags -m / -f (aliases for --minimal / --full)
#   • --help / -h output validation
#   • Invalid flag rejection
#   • Gemfile platform sections (Windows/JRuby) present in both modes
#   • Backup file created and timestamp format correct
#   • Existing index.md and .gitignore content preserved
#   • Installation into a path containing spaces
#   • Installation into a symlinked directory
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

# ---------------------------------------------------------------------------
# Existing tests
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Ported from retired test_installation.sh
# ---------------------------------------------------------------------------

# -h / --help: exit 0 and document key flags
test_help_flag_short() {
    local out
    out="$(bash "$INSTALL_SH" -h 2>&1)" || {
        test_log_error "install.sh -h exited non-zero"
        return 1
    }
    echo "$out" | grep -qiE 'USAGE|usage' \
        || { test_log_error "-h: missing USAGE section"; return 1; }
    echo "$out" | grep -qiE '\-\-minimal|\-m' \
        || { test_log_error "-h: --minimal not documented"; return 1; }
    echo "$out" | grep -qiE '\-\-full|\-f' \
        || { test_log_error "-h: --full not documented"; return 1; }
}

test_help_flag_long() {
    local out
    out="$(bash "$INSTALL_SH" --help 2>&1)" || {
        test_log_error "install.sh --help exited non-zero"
        return 1
    }
    echo "$out" | grep -qiE 'USAGE|usage' \
        || { test_log_error "--help: missing USAGE section"; return 1; }
    echo "$out" | grep -qiE '\-\-minimal|\-m' \
        || { test_log_error "--help: --minimal not documented"; return 1; }
    echo "$out" | grep -qiE '\-\-full|\-f' \
        || { test_log_error "--help: --full not documented"; return 1; }
}

# Short flag -m is an alias for --minimal
test_short_flag_minimal() {
    local ws
    ws="$(create_test_workspace short-m)"
    run_legacy -m "$ws" || return 1
    assert_file_exists "$ws/_config.yml" || return 1
    assert_file_exists "$ws/Gemfile"     || return 1
    assert_file_exists "$ws/index.md"    || return 1
}

# Short flag -f is an alias for --full
test_short_flag_full() {
    local ws
    ws="$(create_test_workspace short-f)"
    run_legacy -f "$ws" || return 1
    assert_file_exists "$ws/_config.yml"        || return 1
    assert_file_exists "$ws/Gemfile"            || return 1
    assert_file_exists "$ws/docker-compose.yml" || return 1
}

# An unrecognised flag must exit non-zero with an error message
test_invalid_flag_rejected() {
    local out rc
    out="$(bash "$INSTALL_SH" --totally-unknown-flag /tmp/zer0-noop 2>&1)"; rc=$?
    if [[ $rc -eq 0 ]]; then
        test_log_error "install.sh accepted an unknown flag (expected non-zero exit)"
        return 1
    fi
    # The output (stdout+stderr merged) should mention the unknown option
    echo "$out" | grep -qiE 'unknown|unrecognized|invalid' \
        || { test_log_error "Unknown flag error message missing from output"; return 1; }
}

# Both minimal and full Gemfiles must contain Windows/JRuby platform block
test_gemfile_platform_sections_minimal() {
    local ws
    ws="$(create_test_workspace gemfile-platform-min)"
    run_legacy --minimal "$ws" || return 1
    assert_file_contains "$ws/Gemfile" "platforms :windows" \
        "Minimal Gemfile must include Windows platform section" || return 1
    assert_file_contains "$ws/Gemfile" "tzinfo" \
        "Minimal Gemfile must include tzinfo gem" || return 1
    assert_file_contains "$ws/Gemfile" "wdm" \
        "Minimal Gemfile must include wdm gem" || return 1
}

test_gemfile_platform_sections_full() {
    local ws
    ws="$(create_test_workspace gemfile-platform-full)"
    run_legacy --full "$ws" || return 1
    assert_file_contains "$ws/Gemfile" "platforms :windows" \
        "Full Gemfile must include Windows platform section" || return 1
    assert_file_contains "$ws/Gemfile" "tzinfo" \
        "Full Gemfile must include tzinfo gem" || return 1
    assert_file_contains "$ws/Gemfile" "wdm" \
        "Full Gemfile must include wdm gem" || return 1
}

# When _config.yml already exists a timestamped backup must be created
test_backup_existing_config() {
    local ws
    ws="$(create_test_workspace backup-config)"
    echo "# original" > "$ws/_config.yml"
    run_legacy --full "$ws" || return 1
    assert_backup_created "$ws/_config.yml" \
        "A backup file should be created for the pre-existing _config.yml"
}

# Backup file name must match the pattern *.backup.YYYYMMDD_HHMMSS
test_backup_timestamp_format() {
    local ws
    ws="$(create_test_workspace backup-format)"
    echo "# original" > "$ws/_config.yml"
    run_legacy --full "$ws" || return 1
    local backup
    backup="$(find "$ws" -maxdepth 1 -name "_config.yml.backup.*" -print -quit 2>/dev/null)"
    if [[ -z "$backup" ]]; then
        test_log_error "No backup file found under $ws"
        return 1
    fi
    echo "$backup" | grep -qE 'backup\.[0-9]{8}_[0-9]{6}$' \
        || { test_log_error "Backup timestamp format wrong: $backup"; return 1; }
}

# Existing index.md content must be preserved (not overwritten)
test_preserve_existing_index() {
    local ws
    ws="$(create_test_workspace preserve-index)"
    echo "# My Custom Index" > "$ws/index.md"
    run_legacy --full "$ws" || return 1
    grep -q "My Custom Index" "$ws/index.md" \
        || { test_log_error "Existing index.md was overwritten"; return 1; }
}

# Existing .gitignore content must be preserved
test_preserve_existing_gitignore() {
    local ws
    ws="$(create_test_workspace preserve-gitignore)"
    printf '%s\n' "# custom rules" "my-secret-file.txt" > "$ws/.gitignore"
    run_legacy --full "$ws" || return 1
    grep -q "my-secret-file.txt" "$ws/.gitignore" \
        || { test_log_error "Existing .gitignore content was overwritten"; return 1; }
}

# Paths containing spaces must be handled correctly
test_path_with_spaces() {
    local base ws
    base="$(create_test_workspace path-spaces-base)"
    ws="$base/path with spaces/site"
    mkdir -p "$ws"
    run_legacy --minimal "$ws" || return 1
    assert_file_exists "$ws/_config.yml" \
        "Should install into a path containing spaces"
}

# Installing into a symlinked directory must write files to the real target
test_symlink_target_dir() {
    local ws real link
    ws="$(create_test_workspace symlink-base)"
    real="$ws/real"
    link="$ws/link"
    mkdir -p "$real"
    ln -s "$real" "$link"
    run_legacy --minimal "$link" || return 1
    assert_file_exists "$real/_config.yml" \
        "Files should land in the real directory behind the symlink"
}

# ---------------------------------------------------------------------------

main() {
    test_log_info "===== Legacy Flags Compatibility Suite ====="

    if [[ ! -f "$INSTALL_SH" ]]; then
        test_log_error "install.sh not found: $INSTALL_SH"
        exit 127
    fi

    run_test "legacy_minimal"  test_legacy_minimal  legacy
    run_test "legacy_full"     test_legacy_full     legacy
    run_test "remote_fallback_loader_returns_success" test_remote_fallback_loader_returns_success legacy
    run_test "remote_download_uses_absolute_github_url" test_remote_download_uses_absolute_github_url legacy
    run_test "stdin_bootstrap_minimal" test_stdin_bootstrap_minimal legacy

    # Ported from retired test_installation.sh
    run_test "help_flag_short"               test_help_flag_short               legacy
    run_test "help_flag_long"                test_help_flag_long                legacy
    run_test "short_flag_minimal"            test_short_flag_minimal            legacy
    run_test "short_flag_full"               test_short_flag_full               legacy
    run_test "invalid_flag_rejected"         test_invalid_flag_rejected         legacy
    run_test "gemfile_platform_sections_minimal" test_gemfile_platform_sections_minimal legacy
    run_test "gemfile_platform_sections_full"    test_gemfile_platform_sections_full    legacy
    run_test "backup_existing_config"        test_backup_existing_config        legacy
    run_test "backup_timestamp_format"       test_backup_timestamp_format       legacy
    run_test "preserve_existing_index"       test_preserve_existing_index       legacy
    run_test "preserve_existing_gitignore"   test_preserve_existing_gitignore   legacy
    run_test "path_with_spaces"              test_path_with_spaces              legacy
    run_test "symlink_target_dir"            test_symlink_target_dir            legacy

    print_test_summary
    [[ $INSTALL_TESTS_FAILED -eq 0 ]]
}

main "$@"
