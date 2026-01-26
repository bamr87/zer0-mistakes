#!/bin/bash

# =============================================================================
# Install Test Utilities for zer0-mistakes Jekyll Theme
# =============================================================================
# 
# Shared utility functions for testing the install.sh script.
# Provides assertion helpers, workspace management, and test execution utilities.
#
# Usage: source this file in test scripts
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/install_test_utils.sh"
#

# Color codes for output
readonly TEST_RED='\033[0;31m'
readonly TEST_GREEN='\033[0;32m'
readonly TEST_YELLOW='\033[1;33m'
readonly TEST_BLUE='\033[0;34m'
readonly TEST_PURPLE='\033[0;35m'
readonly TEST_NC='\033[0m' # No Color

# Test counters
INSTALL_TESTS_TOTAL=0
INSTALL_TESTS_PASSED=0
INSTALL_TESTS_FAILED=0
INSTALL_TESTS_SKIPPED=0

# Test workspace tracking
TEST_WORKSPACE=""
TEST_WORKSPACES=()

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

test_log_info() {
    echo -e "${TEST_BLUE}[INFO]${TEST_NC} $1"
}

test_log_success() {
    echo -e "${TEST_GREEN}[PASS]${TEST_NC} $1"
}

test_log_warning() {
    echo -e "${TEST_YELLOW}[WARN]${TEST_NC} $1"
}

test_log_error() {
    echo -e "${TEST_RED}[FAIL]${TEST_NC} $1"
}

test_log_skip() {
    echo -e "${TEST_YELLOW}[SKIP]${TEST_NC} $1"
}

test_log_test() {
    echo -e "${TEST_PURPLE}[TEST]${TEST_NC} $1"
}

# =============================================================================
# WORKSPACE MANAGEMENT
# =============================================================================

# Create an isolated test workspace
# Returns: path to the created workspace (prints to stdout)
create_test_workspace() {
    local prefix="${1:-install-test}"
    local workspace
    workspace=$(mktemp -d -t "${prefix}-XXXXXX")
    
    if [[ ! -d "$workspace" ]]; then
        test_log_error "Failed to create test workspace" >&2
        return 1
    fi
    
    TEST_WORKSPACE="$workspace"
    TEST_WORKSPACES+=("$workspace")
    
    # Log to stderr so it doesn't interfere with return value
    test_log_info "Created test workspace: $workspace" >&2
    echo "$workspace"
}

# Cleanup a specific test workspace
cleanup_test_workspace() {
    local workspace="${1:-$TEST_WORKSPACE}"
    
    if [[ -n "$workspace" && -d "$workspace" ]]; then
        # Stop any Docker containers that might be running
        if [[ -f "$workspace/docker-compose.yml" ]]; then
            (cd "$workspace" && docker-compose down 2>/dev/null) || true
        fi
        
        rm -rf "$workspace"
        test_log_info "Cleaned up workspace: $workspace"
    fi
}

# Cleanup all test workspaces
cleanup_all_workspaces() {
    if [[ ${#TEST_WORKSPACES[@]} -gt 0 ]]; then
        for workspace in "${TEST_WORKSPACES[@]}"; do
            cleanup_test_workspace "$workspace"
        done
    fi
    TEST_WORKSPACES=()
    TEST_WORKSPACE=""
}

# Setup cleanup trap
setup_cleanup_trap() {
    trap cleanup_all_workspaces EXIT
}

# =============================================================================
# ASSERTION FUNCTIONS
# =============================================================================

# Assert that a file exists
# Usage: assert_file_exists "/path/to/file" "Error message"
assert_file_exists() {
    local file="$1"
    local message="${2:-File should exist: $file}"
    
    if [[ -f "$file" ]]; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Expected file: $file"
        return 1
    fi
}

# Assert that a file does NOT exist
# Usage: assert_file_not_exists "/path/to/file" "Error message"
assert_file_not_exists() {
    local file="$1"
    local message="${2:-File should not exist: $file}"
    
    if [[ ! -f "$file" ]]; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Unexpected file: $file"
        return 1
    fi
}

# Assert that a directory exists
# Usage: assert_dir_exists "/path/to/dir" "Error message"
assert_dir_exists() {
    local dir="$1"
    local message="${2:-Directory should exist: $dir}"
    
    if [[ -d "$dir" ]]; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Expected directory: $dir"
        return 1
    fi
}

# Assert that a directory does NOT exist
# Usage: assert_dir_not_exists "/path/to/dir" "Error message"
assert_dir_not_exists() {
    local dir="$1"
    local message="${2:-Directory should not exist: $dir}"
    
    if [[ ! -d "$dir" ]]; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Unexpected directory: $dir"
        return 1
    fi
}

# Assert that a file contains a specific string
# Usage: assert_file_contains "/path/to/file" "search string" "Error message"
assert_file_contains() {
    local file="$1"
    local search="$2"
    local message="${3:-File should contain: $search}"
    
    if [[ ! -f "$file" ]]; then
        test_log_error "File does not exist: $file"
        return 1
    fi
    
    # Use grep -F for fixed string matching, -- to prevent pattern interpretation
    if grep -qF -- "$search" "$file"; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  File: $file"
        test_log_error "  Expected to find: $search"
        return 1
    fi
}

# Assert that a file does NOT contain a specific string
# Usage: assert_file_not_contains "/path/to/file" "search string" "Error message"
assert_file_not_contains() {
    local file="$1"
    local search="$2"
    local message="${3:-File should not contain: $search}"
    
    if [[ ! -f "$file" ]]; then
        # File doesn't exist, so it certainly doesn't contain the string
        return 0
    fi
    
    # Use grep -F for fixed string matching, -- to prevent pattern interpretation
    if ! grep -qF -- "$search" "$file"; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  File: $file"
        test_log_error "  Should not contain: $search"
        return 1
    fi
}

# Assert that a backup file was created for the given original file
# Usage: assert_backup_created "/path/to/original" "Error message"
assert_backup_created() {
    local original="$1"
    local message="${2:-Backup should exist for: $original}"
    local dir
    local base
    
    dir=$(dirname "$original")
    base=$(basename "$original")
    
    # Look for backup files with pattern: filename.backup.YYYYMMDD_HHMMSS
    if find "$dir" -maxdepth 1 -name "${base}.backup.*" 2>/dev/null | grep -q .; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Expected backup for: $original"
        return 1
    fi
}

# Assert command exit code
# Usage: assert_exit_code 0 "Command should succeed"
assert_exit_code() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Exit code mismatch}"
    
    if [[ "$actual" -eq "$expected" ]]; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Expected exit code: $expected"
        test_log_error "  Actual exit code: $actual"
        return 1
    fi
}

# Assert string equality
# Usage: assert_equals "expected" "actual" "Error message"
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Values should be equal}"
    
    if [[ "$expected" == "$actual" ]]; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Expected: $expected"
        test_log_error "  Actual: $actual"
        return 1
    fi
}

# Assert string not empty
# Usage: assert_not_empty "$value" "Value should not be empty"
assert_not_empty() {
    local value="$1"
    local message="${2:-Value should not be empty}"
    
    if [[ -n "$value" ]]; then
        return 0
    else
        test_log_error "$message"
        return 1
    fi
}

# Assert output contains string
# Usage: assert_output_contains "$output" "expected string" "Error message"
assert_output_contains() {
    local output="$1"
    local expected="$2"
    local message="${3:-Output should contain: $expected}"
    
    # Use grep -F for fixed string matching to avoid pattern interpretation
    # Use -- to prevent arguments starting with - from being treated as options
    if echo "$output" | grep -qF -- "$expected"; then
        return 0
    else
        test_log_error "$message"
        test_log_error "  Expected to find: $expected"
        test_log_error "  In output: ${output:0:200}..."
        return 1
    fi
}

# =============================================================================
# INSTALL SCRIPT EXECUTION
# =============================================================================

# Run the install.sh script with arguments and capture output
# Usage: run_install_script [args...]
# Sets: INSTALL_STDOUT, INSTALL_STDERR, INSTALL_EXIT_CODE
# Note: Always returns 0 - check INSTALL_EXIT_CODE for actual result
run_install_script() {
    local project_root
    project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    local install_script="$project_root/install.sh"
    
    if [[ ! -f "$install_script" ]]; then
        test_log_error "Install script not found: $install_script"
        INSTALL_EXIT_CODE=127
        INSTALL_STDOUT=""
        INSTALL_STDERR="Install script not found"
        return 0  # Return 0 to not trigger errexit
    fi
    
    # Create temp files for capturing output
    local stdout_file
    local stderr_file
    stdout_file=$(mktemp)
    stderr_file=$(mktemp)
    
    # Run the install script (disable errexit during execution)
    set +e
    "$install_script" "$@" > "$stdout_file" 2> "$stderr_file"
    INSTALL_EXIT_CODE=$?
    set -e
    
    # Capture output
    INSTALL_STDOUT=$(cat "$stdout_file")
    INSTALL_STDERR=$(cat "$stderr_file")
    
    # Cleanup temp files
    rm -f "$stdout_file" "$stderr_file"
    
    # Always return 0 - callers should check INSTALL_EXIT_CODE
    return 0
}

# Run install script and expect success
# Usage: run_install_expect_success [args...]
run_install_expect_success() {
    run_install_script "$@"
    
    if [[ $INSTALL_EXIT_CODE -ne 0 ]]; then
        test_log_error "Install script failed unexpectedly"
        test_log_error "Exit code: $INSTALL_EXIT_CODE"
        test_log_error "Stderr: $INSTALL_STDERR"
        return 1
    fi
    
    return 0
}

# Run install script and expect failure
# Usage: run_install_expect_failure [args...]
run_install_expect_failure() {
    run_install_script "$@"
    
    if [[ $INSTALL_EXIT_CODE -eq 0 ]]; then
        test_log_error "Install script succeeded but was expected to fail"
        return 1
    fi
    
    return 0
}

# Simulate remote installation environment
# Removes source files to trigger REMOTE_INSTALL=true
mock_remote_install() {
    local workspace="$1"
    
    # Create a minimal workspace that looks like a remote install
    mkdir -p "$workspace"
    
    # The install.sh checks for _config.yml to detect remote install
    # Don't create _config.yml so REMOTE_INSTALL=true
    
    test_log_info "Mocked remote installation environment in: $workspace"
}

# =============================================================================
# TEST EXECUTION FRAMEWORK
# =============================================================================

# Run a single test function and track results
# Usage: run_test "test_name" "test_function"
run_test() {
    local test_name="$1"
    local test_function="$2"
    local category="${3:-general}"
    
    test_log_test "Running: $test_name"
    INSTALL_TESTS_TOTAL=$((INSTALL_TESTS_TOTAL + 1))
    
    local start_time
    local end_time
    local duration
    start_time=$(date +%s)
    
    local test_result="FAIL"
    local error_message=""
    
    # Run the test function
    set +e
    eval "$test_function" 2>&1
    local exit_code=$?
    set -e
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    if [[ $exit_code -eq 0 ]]; then
        test_result="PASS"
        INSTALL_TESTS_PASSED=$((INSTALL_TESTS_PASSED + 1))
        test_log_success "$test_name (${duration}s)"
    else
        test_result="FAIL"
        INSTALL_TESTS_FAILED=$((INSTALL_TESTS_FAILED + 1))
        test_log_error "$test_name (${duration}s)"
    fi
    
    # Record result to JSON if results dir exists
    local results_dir
    results_dir="$(dirname "${BASH_SOURCE[0]}")/../results"
    if [[ -d "$results_dir" ]]; then
        local result_file="$results_dir/install_test_$(date +%s%N).json"
        cat > "$result_file" << EOF
{
  "name": "$test_name",
  "category": "$category",
  "result": "$test_result",
  "duration": $duration,
  "exit_code": $exit_code,
  "timestamp": "$(date -Iseconds)"
}
EOF
    fi
    
    return $exit_code
}

# Skip a test with reason
# Usage: skip_test "test_name" "reason"
skip_test() {
    local test_name="$1"
    local reason="${2:-No reason provided}"
    
    INSTALL_TESTS_TOTAL=$((INSTALL_TESTS_TOTAL + 1))
    INSTALL_TESTS_SKIPPED=$((INSTALL_TESTS_SKIPPED + 1))
    
    test_log_skip "$test_name - $reason"
}

# Print test summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "  Installation Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo ""
    echo "Results:"
    echo "  Total Tests: $INSTALL_TESTS_TOTAL"
    echo "  Passed: $INSTALL_TESTS_PASSED"
    echo "  Failed: $INSTALL_TESTS_FAILED"
    echo "  Skipped: $INSTALL_TESTS_SKIPPED"
    echo ""
    if [[ $INSTALL_TESTS_TOTAL -gt 0 ]]; then
        local success_rate=$(( (INSTALL_TESTS_PASSED * 100) / INSTALL_TESTS_TOTAL ))
        echo "Success Rate: ${success_rate}%"
    else
        echo "Success Rate: N/A (no tests run)"
    fi
    echo "=========================================="
}

# =============================================================================
# VALIDATION HELPERS
# =============================================================================

# Validate full installation created all expected files
# Usage: validate_full_installation "/path/to/install"
validate_full_installation() {
    local install_dir="$1"
    local errors=0
    
    # Required files for full installation
    local required_files=(
        "_config.yml"
        "_config_dev.yml"
        "docker-compose.yml"
        "Gemfile"
        "INSTALLATION.md"
        ".gitignore"
    )
    
    # Required directories for full installation
    local required_dirs=(
        "_data"
        "_includes"
        "_layouts"
        "_sass"
        "assets"
        ".github/workflows"
    )
    
    # Check files
    for file in "${required_files[@]}"; do
        if [[ ! -f "$install_dir/$file" ]]; then
            test_log_error "Missing required file: $file"
            errors=$((errors + 1))
        fi
    done
    
    # Check directories
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$install_dir/$dir" ]]; then
            test_log_error "Missing required directory: $dir"
            errors=$((errors + 1))
        fi
    done
    
    return $errors
}

# Validate minimal installation created only expected files
# Usage: validate_minimal_installation "/path/to/install"
validate_minimal_installation() {
    local install_dir="$1"
    local errors=0
    
    # Required files for minimal installation
    local required_files=(
        "_config.yml"
        "Gemfile"
        "INSTALLATION.md"
        ".gitignore"
        "index.md"
    )
    
    # Files that should NOT exist in minimal installation
    local excluded_files=(
        "docker-compose.yml"
        "_config_dev.yml"
    )
    
    # Directories that should NOT exist in minimal installation
    local excluded_dirs=(
        "_includes"
        "_layouts"
        "_sass"
    )
    
    # Check required files exist
    for file in "${required_files[@]}"; do
        if [[ ! -f "$install_dir/$file" ]]; then
            test_log_error "Missing required file: $file"
            errors=$((errors + 1))
        fi
    done
    
    # Check excluded files don't exist
    for file in "${excluded_files[@]}"; do
        if [[ -f "$install_dir/$file" ]]; then
            test_log_error "Unexpected file in minimal install: $file"
            errors=$((errors + 1))
        fi
    done
    
    # Check excluded directories don't exist
    for dir in "${excluded_dirs[@]}"; do
        if [[ -d "$install_dir/$dir" ]]; then
            test_log_error "Unexpected directory in minimal install: $dir"
            errors=$((errors + 1))
        fi
    done
    
    return $errors
}

# =============================================================================
# PLATFORM DETECTION HELPERS
# =============================================================================

# Get current platform identifier
get_platform() {
    local os_type
    local arch
    
    case "$(uname -s)" in
        Darwin*) os_type="macos" ;;
        Linux*) os_type="linux" ;;
        CYGWIN*|MINGW*|MSYS*) os_type="windows" ;;
        *) os_type="unknown" ;;
    esac
    
    case "$(uname -m)" in
        arm64|aarch64) arch="arm64" ;;
        x86_64|amd64) arch="x64" ;;
        *) arch="unknown" ;;
    esac
    
    echo "${os_type}_${arch}"
}

# Check if Docker is available
is_docker_available() {
    command -v docker &>/dev/null && docker info &>/dev/null
}

# Check if running in CI environment
is_ci_environment() {
    [[ -n "${CI:-}" || -n "${GITHUB_ACTIONS:-}" || -n "${TRAVIS:-}" || -n "${CIRCLECI:-}" ]]
}

# =============================================================================
# INITIALIZATION
# =============================================================================

# Initialize test utilities
init_install_test_utils() {
    INSTALL_TESTS_TOTAL=0
    INSTALL_TESTS_PASSED=0
    INSTALL_TESTS_FAILED=0
    INSTALL_TESTS_SKIPPED=0
    TEST_WORKSPACES=()
    TEST_WORKSPACE=""
    
    test_log_info "Install test utilities initialized"
    test_log_info "Platform: $(get_platform)"
    test_log_info "Docker available: $(is_docker_available && echo 'yes' || echo 'no')"
    test_log_info "CI environment: $(is_ci_environment && echo 'yes' || echo 'no')"
}

# Export functions for subshells
export -f test_log_info test_log_success test_log_warning test_log_error test_log_skip test_log_test
export -f create_test_workspace cleanup_test_workspace cleanup_all_workspaces
export -f assert_file_exists assert_file_not_exists assert_dir_exists assert_dir_not_exists
export -f assert_file_contains assert_file_not_contains assert_backup_created
export -f assert_exit_code assert_equals assert_not_empty assert_output_contains
export -f run_install_script run_install_expect_success run_install_expect_failure
export -f run_test skip_test print_test_summary
export -f validate_full_installation validate_minimal_installation
export -f get_platform is_docker_available is_ci_environment
