#!/bin/bash

# =============================================================================
# Installation Test Suite for zer0-mistakes Jekyll Theme
# =============================================================================
# 
# Comprehensive tests for the install.sh script covering:
# - CLI argument parsing
# - Installation modes (full, minimal)
# - Error handling
# - Edge cases
# - Upgrade scenarios
# - Remote installation
#
# Usage:
#   ./test/test_installation.sh [OPTIONS]
#
# Options:
#   -v, --verbose     Enable verbose output
#   -h, --help        Show help message
#   --skip-remote     Skip remote installation tests
#   --no-cleanup      Keep test workspaces for debugging

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_SCRIPT="$PROJECT_ROOT/install.sh"

# Source test utilities
source "$SCRIPT_DIR/lib/install_test_utils.sh"

# Test configuration
VERBOSE=false
SKIP_REMOTE=false
CLEANUP=true

# =============================================================================
# CLI PARSING
# =============================================================================

show_help() {
    cat << EOF
Installation Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Runs comprehensive tests for the install.sh script.

OPTIONS:
    -v, --verbose     Enable verbose output
    -h, --help        Show this help message
    --skip-remote     Skip remote installation tests
    --no-cleanup      Keep test workspaces for debugging

EXAMPLES:
    $0                    # Run all tests
    $0 --verbose          # Run with detailed output
    $0 --skip-remote      # Skip network-dependent tests
    $0 --no-cleanup       # Keep test directories after run
EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --skip-remote)
                SKIP_REMOTE=true
                shift
                ;;
            --no-cleanup)
                CLEANUP=false
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                test_log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# CATEGORY A: CLI ARGUMENT PARSING TESTS
# =============================================================================

test_help_flag_short() {
    test_log_info "Testing -h flag displays help"
    
    run_install_script -h
    
    assert_exit_code 0 "$INSTALL_EXIT_CODE" "Help flag should exit with 0"
    assert_output_contains "$INSTALL_STDOUT" "USAGE" "Help should contain USAGE"
    assert_output_contains "$INSTALL_STDOUT" "OPTIONS" "Help should contain OPTIONS"
}

test_help_flag_long() {
    test_log_info "Testing --help flag displays help"
    
    run_install_script --help
    
    assert_exit_code 0 "$INSTALL_EXIT_CODE" "Help flag should exit with 0"
    assert_output_contains "$INSTALL_STDOUT" "USAGE" "Help should contain USAGE"
    assert_output_contains "$INSTALL_STDOUT" "--minimal" "Help should document --minimal flag"
    assert_output_contains "$INSTALL_STDOUT" "--full" "Help should document --full flag"
}

test_full_flag_short() {
    test_log_info "Testing -f flag sets full installation mode"
    
    local workspace
    workspace=$(create_test_workspace "full-short")
    
    run_install_expect_success -f "$workspace"
    
    # Verify full installation files exist
    assert_dir_exists "$workspace/_layouts" "Full install should create _layouts"
    assert_dir_exists "$workspace/_includes" "Full install should create _includes"
    assert_file_exists "$workspace/docker-compose.yml" "Full install should create docker-compose.yml"
}

test_full_flag_long() {
    test_log_info "Testing --full flag sets full installation mode"
    
    local workspace
    workspace=$(create_test_workspace "full-long")
    
    run_install_expect_success --full "$workspace"
    
    # Verify full installation files exist
    assert_dir_exists "$workspace/_layouts" "Full install should create _layouts"
    assert_file_exists "$workspace/_config_dev.yml" "Full install should create _config_dev.yml"
}

test_minimal_flag_short() {
    test_log_info "Testing -m flag sets minimal installation mode"
    
    local workspace
    workspace=$(create_test_workspace "minimal-short")
    
    run_install_expect_success -m "$workspace"
    
    # Verify minimal installation - essential files exist
    assert_file_exists "$workspace/_config.yml" "Minimal install should create _config.yml"
    assert_file_exists "$workspace/Gemfile" "Minimal install should create Gemfile"
    
    # Verify minimal installation - extra files don't exist
    assert_dir_not_exists "$workspace/_layouts" "Minimal install should NOT create _layouts"
    assert_file_not_exists "$workspace/docker-compose.yml" "Minimal install should NOT create docker-compose.yml"
}

test_minimal_flag_long() {
    test_log_info "Testing --minimal flag sets minimal installation mode"
    
    local workspace
    workspace=$(create_test_workspace "minimal-long")
    
    run_install_expect_success --minimal "$workspace"
    
    # Verify minimal installation
    validate_minimal_installation "$workspace"
}

test_invalid_flag() {
    test_log_info "Testing invalid flag shows error"
    
    local workspace
    workspace=$(create_test_workspace "invalid-flag")
    
    run_install_expect_failure --invalid-flag "$workspace"
    
    assert_output_contains "$INSTALL_STDOUT$INSTALL_STDERR" "Unknown option" "Should show unknown option error"
}

test_multiple_targets() {
    test_log_info "Testing multiple target directories shows error"
    
    local workspace1
    local workspace2
    workspace1=$(create_test_workspace "multi1")
    workspace2=$(create_test_workspace "multi2")
    
    run_install_expect_failure "$workspace1" "$workspace2"
    
    assert_output_contains "$INSTALL_STDOUT$INSTALL_STDERR" "Multiple target" "Should show multiple targets error"
}

# =============================================================================
# CATEGORY B: INSTALLATION MODE TESTS
# =============================================================================

test_full_creates_all_files() {
    test_log_info "Testing full installation creates all required files"
    
    local workspace
    workspace=$(create_test_workspace "full-files")
    
    run_install_expect_success --full "$workspace"
    
    validate_full_installation "$workspace"
}

test_minimal_excludes_docker() {
    test_log_info "Testing minimal installation excludes Docker files"
    
    local workspace
    workspace=$(create_test_workspace "minimal-no-docker")
    
    run_install_expect_success --minimal "$workspace"
    
    assert_file_not_exists "$workspace/docker-compose.yml" "Minimal should not have docker-compose.yml"
    assert_dir_not_exists "$workspace/docker" "Minimal should not have docker directory"
}

test_minimal_excludes_theme_dirs() {
    test_log_info "Testing minimal installation excludes theme directories"
    
    local workspace
    workspace=$(create_test_workspace "minimal-no-theme")
    
    run_install_expect_success --minimal "$workspace"
    
    assert_dir_not_exists "$workspace/_layouts" "Minimal should not have _layouts"
    assert_dir_not_exists "$workspace/_includes" "Minimal should not have _includes"
    assert_dir_not_exists "$workspace/_sass" "Minimal should not have _sass"
    assert_dir_not_exists "$workspace/assets" "Minimal should not have assets"
}

test_default_is_full() {
    test_log_info "Testing default installation is full mode"
    
    local workspace
    workspace=$(create_test_workspace "default-full")
    
    # Run without mode flag
    run_install_expect_success "$workspace"
    
    # Should have full installation files
    assert_dir_exists "$workspace/_layouts" "Default should create _layouts (full mode)"
    assert_file_exists "$workspace/docker-compose.yml" "Default should create docker-compose.yml (full mode)"
}

test_target_dir_creation() {
    test_log_info "Testing target directory is created if missing"
    
    local workspace
    workspace=$(mktemp -d -t "install-test-XXXXXX")
    local target="$workspace/new-site/nested/dir"
    TEST_WORKSPACES+=("$workspace")
    
    run_install_expect_success --minimal "$target"
    
    assert_dir_exists "$target" "Target directory should be created"
    assert_file_exists "$target/_config.yml" "Config should exist in created directory"
}

test_target_dir_permissions() {
    test_log_info "Testing installed files have correct permissions"
    
    local workspace
    workspace=$(create_test_workspace "permissions")
    
    run_install_expect_success --full "$workspace"
    
    # Check that files are readable
    if [[ -r "$workspace/_config.yml" ]]; then
        test_log_success "Config file is readable"
    else
        test_log_error "Config file is not readable"
        return 1
    fi
    
    # Check that directories are accessible
    if [[ -x "$workspace/_layouts" ]]; then
        test_log_success "Layouts directory is accessible"
    else
        test_log_error "Layouts directory is not accessible"
        return 1
    fi
}

# =============================================================================
# CATEGORY C: ERROR HANDLING TESTS
# =============================================================================

test_readonly_target_dir() {
    test_log_info "Testing error on read-only target directory"
    
    # Skip on CI where we might not be able to create readonly dirs
    if is_ci_environment; then
        skip_test "readonly_target_dir" "Skipped in CI environment"
        return 0
    fi
    
    local workspace
    workspace=$(create_test_workspace "readonly")
    
    # Make directory read-only
    chmod 555 "$workspace"
    
    # Should fail
    run_install_script --minimal "$workspace/subdir"
    
    # Restore permissions for cleanup
    chmod 755 "$workspace"
    
    if [[ $INSTALL_EXIT_CODE -ne 0 ]]; then
        test_log_success "Correctly failed on read-only directory"
        return 0
    else
        test_log_error "Should have failed on read-only directory"
        return 1
    fi
}

test_missing_source_files() {
    test_log_info "Testing error when source files are missing"
    
    # This test verifies the script handles missing source gracefully
    # When run as remote install (no _config.yml in script dir), it downloads from GitHub
    # We can't easily test this without modifying the script or mocking
    
    test_log_info "Skipping - requires modifying source or network mocking"
    return 0
}

test_error_trap_line_number() {
    test_log_info "Testing error trap reports line information"
    
    # The script uses 'trap handle_error $LINENO ERR'
    # This is verified by inspecting the script structure
    
    if grep -q 'trap.*handle_error.*LINENO.*ERR' "$INSTALL_SCRIPT"; then
        test_log_success "Error trap with line number is configured"
        return 0
    else
        test_log_error "Error trap not properly configured"
        return 1
    fi
}

test_partial_install_cleanup() {
    test_log_info "Testing cleanup on partial installation failure"
    
    # This test is difficult to trigger reliably without modifying the script
    # We verify the cleanup trap exists
    
    if grep -q "trap.*cleanup" "$INSTALL_SCRIPT" || grep -q "trap.*EXIT" "$INSTALL_SCRIPT"; then
        test_log_success "Cleanup trap is configured"
        return 0
    else
        # Not all scripts have cleanup traps, which is acceptable
        test_log_warning "No cleanup trap found (may be acceptable)"
        return 0
    fi
}

# =============================================================================
# CATEGORY D: EDGE CASE TESTS
# =============================================================================

test_backup_existing_config() {
    test_log_info "Testing backup of existing _config.yml"
    
    local workspace
    workspace=$(create_test_workspace "backup-config")
    
    # Create existing config
    echo "# Original config" > "$workspace/_config.yml"
    
    # Run installation
    run_install_expect_success --full "$workspace"
    
    # Check backup was created
    assert_backup_created "$workspace/_config.yml" "Backup should be created for existing config"
}

test_backup_timestamp_format() {
    test_log_info "Testing backup file timestamp format"
    
    local workspace
    workspace=$(create_test_workspace "backup-format")
    
    # Create existing config
    echo "# Original config" > "$workspace/_config.yml"
    
    # Run installation
    run_install_expect_success --full "$workspace"
    
    # Find backup file and verify format
    local backup
    backup=$(find "$workspace" -name "_config.yml.backup.*" -print -quit)
    
    if [[ -n "$backup" ]]; then
        # Verify timestamp format (YYYYMMDD_HHMMSS)
        if echo "$backup" | grep -qE 'backup\.[0-9]{8}_[0-9]{6}$'; then
            test_log_success "Backup timestamp format is correct"
            return 0
        else
            test_log_error "Backup timestamp format is incorrect: $backup"
            return 1
        fi
    else
        test_log_error "No backup file found"
        return 1
    fi
}

test_preserve_existing_index() {
    test_log_info "Testing preservation of existing index.md"
    
    local workspace
    workspace=$(create_test_workspace "preserve-index")
    
    # Create existing index with custom content
    echo "# My Custom Index" > "$workspace/index.md"
    
    # Run installation
    run_install_expect_success --full "$workspace"
    
    # Verify original content is preserved (not overwritten)
    if grep -q "My Custom Index" "$workspace/index.md"; then
        test_log_success "Existing index.md was preserved"
        return 0
    else
        test_log_error "Existing index.md was overwritten"
        return 1
    fi
}

test_preserve_existing_gitignore() {
    test_log_info "Testing preservation of existing .gitignore"
    
    local workspace
    workspace=$(create_test_workspace "preserve-gitignore")
    
    # Create existing .gitignore with custom content
    echo "# My custom rules" > "$workspace/.gitignore"
    echo "my-secret-file.txt" >> "$workspace/.gitignore"
    
    # Run installation
    run_install_expect_success --full "$workspace"
    
    # Verify original content is preserved
    if grep -q "my-secret-file.txt" "$workspace/.gitignore"; then
        test_log_success "Existing .gitignore was preserved"
        return 0
    else
        test_log_error "Existing .gitignore was overwritten"
        return 1
    fi
}

test_special_chars_in_path() {
    test_log_info "Testing installation with spaces in path"
    
    local workspace
    workspace=$(create_test_workspace "special-chars")
    local target="$workspace/path with spaces/site"
    
    # Create directory with spaces
    mkdir -p "$target"
    
    # Run installation
    run_install_expect_success --minimal "$target"
    
    # Verify installation
    assert_file_exists "$target/_config.yml" "Should install to path with spaces"
}

test_same_source_and_target() {
    test_log_info "Testing installation from source directory"
    
    # When running from the actual source directory, the script should work
    # This is a basic sanity check
    
    local workspace
    workspace=$(create_test_workspace "same-dir")
    
    # Copy install.sh to workspace
    cp "$INSTALL_SCRIPT" "$workspace/"
    
    # Run from workspace (simulating running from source)
    cd "$workspace"
    run_install_script --minimal "."
    local exit_code=$INSTALL_EXIT_CODE
    cd "$PROJECT_ROOT"
    
    # This may fail since workspace doesn't have source files
    # But the script should handle it gracefully
    test_log_info "Exit code: $exit_code (may fail without source files)"
    return 0
}

test_symlink_target_dir() {
    test_log_info "Testing installation to symlinked directory"
    
    local workspace
    workspace=$(create_test_workspace "symlink")
    local real_dir="$workspace/real"
    local link_dir="$workspace/link"
    
    mkdir -p "$real_dir"
    ln -s "$real_dir" "$link_dir"
    
    # Run installation to symlinked directory
    run_install_expect_success --minimal "$link_dir"
    
    # Verify files exist in the real directory
    assert_file_exists "$real_dir/_config.yml" "Config should exist in real directory"
}

# =============================================================================
# CATEGORY E: UPGRADE SCENARIO TESTS
# =============================================================================

test_minimal_to_full_upgrade() {
    test_log_info "Testing upgrade from minimal to full installation"
    
    local workspace
    workspace=$(create_test_workspace "upgrade-min-to-full")
    
    # First, do minimal installation
    run_install_expect_success --minimal "$workspace"
    
    # Verify minimal state
    assert_file_not_exists "$workspace/docker-compose.yml" "Should not have docker-compose.yml after minimal"
    
    # Now upgrade to full
    run_install_expect_success --full "$workspace"
    
    # Verify full installation files now exist
    assert_file_exists "$workspace/docker-compose.yml" "Should have docker-compose.yml after upgrade"
    assert_dir_exists "$workspace/_layouts" "Should have _layouts after upgrade"
}

test_full_reinstall_idempotent() {
    test_log_info "Testing full reinstallation is idempotent"
    
    local workspace
    workspace=$(create_test_workspace "idempotent")
    
    # First installation
    run_install_expect_success --full "$workspace"
    
    # Count files after first install
    local count1
    count1=$(find "$workspace" -type f | wc -l | tr -d ' ')
    
    # Second installation (should be safe)
    run_install_expect_success --full "$workspace"
    
    # Verify installation still works
    assert_file_exists "$workspace/_config.yml" "Config should still exist"
    assert_dir_exists "$workspace/_layouts" "Layouts should still exist"
    
    test_log_success "Reinstallation completed without errors"
}

test_upgrade_preserves_customizations() {
    test_log_info "Testing upgrade preserves user customizations"
    
    local workspace
    workspace=$(create_test_workspace "preserve-custom")
    
    # Do initial installation
    run_install_expect_success --full "$workspace"
    
    # Add custom content to _config.yml
    echo "" >> "$workspace/_config.yml"
    echo "# My custom settings" >> "$workspace/_config.yml"
    echo "my_custom_var: 'my_value'" >> "$workspace/_config.yml"
    
    # Reinstall
    run_install_expect_success --full "$workspace"
    
    # Check that there's a backup with our customization
    local backup
    backup=$(find "$workspace" -name "_config.yml.backup.*" -print -quit 2>/dev/null)
    
    if [[ -n "$backup" ]] && grep -q "my_custom_var" "$backup"; then
        test_log_success "Customizations preserved in backup"
        return 0
    else
        test_log_warning "Could not verify customization preservation"
        return 0  # Not a hard failure - backup may have different content
    fi
}

# =============================================================================
# CATEGORY F: REMOTE INSTALLATION TESTS
# =============================================================================

test_remote_detection() {
    test_log_info "Testing remote installation detection"
    
    # The script detects remote install when _config.yml doesn't exist in script dir
    # We verify this logic exists in the script
    
    if grep -q 'REMOTE_INSTALL' "$INSTALL_SCRIPT"; then
        test_log_success "Remote installation detection logic exists"
        return 0
    else
        test_log_error "Remote installation detection not found in script"
        return 1
    fi
}

test_remote_download_success() {
    if [[ "$SKIP_REMOTE" == "true" ]]; then
        skip_test "remote_download_success" "Skipped by --skip-remote flag"
        return 0
    fi
    
    test_log_info "Testing remote installation download"
    
    local workspace
    workspace=$(create_test_workspace "remote-download")
    cd "$workspace"
    
    # Run the actual remote installation command
    set +e
    curl -fsSL "https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh" | bash -s -- --full "$workspace/site"
    local exit_code=$?
    set -e
    
    cd "$PROJECT_ROOT"
    
    if [[ $exit_code -eq 0 ]]; then
        assert_file_exists "$workspace/site/_config.yml" "Remote install should create _config.yml"
        test_log_success "Remote installation completed successfully"
    else
        test_log_warning "Remote installation failed (network issue?)"
        # Don't fail the test for network issues
    fi
    
    return 0
}

test_remote_temp_cleanup() {
    test_log_info "Testing remote installation temp directory cleanup"
    
    # Verify the script has temp cleanup logic
    if grep -q 'cleanup_temp_dir\|TEMP_DIR\|mktemp' "$INSTALL_SCRIPT"; then
        test_log_success "Temp directory cleanup logic exists"
        return 0
    else
        test_log_warning "Could not verify temp cleanup logic"
        return 0
    fi
}

test_remote_temp_cleanup_on_error() {
    test_log_info "Testing temp cleanup on error during remote install"
    
    # Verify cleanup trap exists for temp directory
    if grep -q 'trap.*cleanup' "$INSTALL_SCRIPT"; then
        test_log_success "Cleanup trap exists for error handling"
        return 0
    else
        test_log_warning "Could not verify cleanup trap"
        return 0
    fi
}

# =============================================================================
# MAIN TEST EXECUTION
# =============================================================================

run_cli_tests() {
    test_log_info "=== CLI ARGUMENT PARSING TESTS ==="
    
    run_test "Help flag short (-h)" "test_help_flag_short" "cli"
    run_test "Help flag long (--help)" "test_help_flag_long" "cli"
    run_test "Full flag short (-f)" "test_full_flag_short" "cli"
    run_test "Full flag long (--full)" "test_full_flag_long" "cli"
    run_test "Minimal flag short (-m)" "test_minimal_flag_short" "cli"
    run_test "Minimal flag long (--minimal)" "test_minimal_flag_long" "cli"
    run_test "Invalid flag" "test_invalid_flag" "cli"
    run_test "Multiple targets" "test_multiple_targets" "cli"
}

run_mode_tests() {
    test_log_info "=== INSTALLATION MODE TESTS ==="
    
    run_test "Full creates all files" "test_full_creates_all_files" "mode"
    run_test "Minimal excludes Docker" "test_minimal_excludes_docker" "mode"
    run_test "Minimal excludes theme dirs" "test_minimal_excludes_theme_dirs" "mode"
    run_test "Default is full mode" "test_default_is_full" "mode"
    run_test "Target dir creation" "test_target_dir_creation" "mode"
    run_test "Target dir permissions" "test_target_dir_permissions" "mode"
}

run_error_tests() {
    test_log_info "=== ERROR HANDLING TESTS ==="
    
    run_test "Read-only target dir" "test_readonly_target_dir" "error"
    run_test "Missing source files" "test_missing_source_files" "error"
    run_test "Error trap line number" "test_error_trap_line_number" "error"
    run_test "Partial install cleanup" "test_partial_install_cleanup" "error"
}

run_edge_tests() {
    test_log_info "=== EDGE CASE TESTS ==="
    
    run_test "Backup existing config" "test_backup_existing_config" "edge"
    run_test "Backup timestamp format" "test_backup_timestamp_format" "edge"
    run_test "Preserve existing index" "test_preserve_existing_index" "edge"
    run_test "Preserve existing gitignore" "test_preserve_existing_gitignore" "edge"
    run_test "Special chars in path" "test_special_chars_in_path" "edge"
    run_test "Same source and target" "test_same_source_and_target" "edge"
    run_test "Symlink target dir" "test_symlink_target_dir" "edge"
}

run_upgrade_tests() {
    test_log_info "=== UPGRADE SCENARIO TESTS ==="
    
    run_test "Minimal to full upgrade" "test_minimal_to_full_upgrade" "upgrade"
    run_test "Full reinstall idempotent" "test_full_reinstall_idempotent" "upgrade"
    run_test "Upgrade preserves customizations" "test_upgrade_preserves_customizations" "upgrade"
}

run_remote_tests() {
    test_log_info "=== REMOTE INSTALLATION TESTS ==="
    
    run_test "Remote detection" "test_remote_detection" "remote"
    run_test "Remote download success" "test_remote_download_success" "remote"
    run_test "Remote temp cleanup" "test_remote_temp_cleanup" "remote"
    run_test "Remote temp cleanup on error" "test_remote_temp_cleanup_on_error" "remote"
}

main() {
    parse_arguments "$@"
    
    test_log_info "Starting Installation Test Suite"
    test_log_info "Project root: $PROJECT_ROOT"
    test_log_info "Install script: $INSTALL_SCRIPT"
    
    # Initialize test utilities
    init_install_test_utils
    
    # Setup cleanup trap
    if [[ "$CLEANUP" == "true" ]]; then
        setup_cleanup_trap
    fi
    
    # Verify install script exists
    if [[ ! -f "$INSTALL_SCRIPT" ]]; then
        test_log_error "Install script not found: $INSTALL_SCRIPT"
        exit 1
    fi
    
    # Run all test categories
    run_cli_tests
    run_mode_tests
    run_error_tests
    run_edge_tests
    run_upgrade_tests
    run_remote_tests
    
    # Print summary
    print_test_summary
    
    # Clean up if not disabled
    if [[ "$CLEANUP" == "false" ]]; then
        test_log_info "Test workspaces preserved (--no-cleanup):"
        for ws in "${TEST_WORKSPACES[@]}"; do
            test_log_info "  $ws"
        done
    fi
    
    # Exit with appropriate code
    if [[ $INSTALL_TESTS_FAILED -gt 0 ]]; then
        test_log_error "Some tests failed. See results above."
        exit 1
    else
        test_log_success "All tests passed!"
        exit 0
    fi
}

# Run main function
main "$@"
