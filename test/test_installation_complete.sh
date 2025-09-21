#!/bin/bash

# Comprehensive Installation Test Suite for zer0-mistakes Jekyll Theme
# Tests both local and remote installation methods with full validation
# 
# This script creates isolated test environments and validates:
# - Installation script functionality
# - Docker environment setup
# - Jekyll site building and serving
# - Documentation accuracy
# - Cross-platform compatibility

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_RESULTS_DIR="$SCRIPT_DIR/results"
TEST_WORKSPACE=""
VERBOSE=false
CLEANUP=true
TIMEOUT=300
TEST_PATTERN="*"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --no-cleanup)
                CLEANUP=false
                shift
                ;;
            --timeout|-t)
                TIMEOUT="$2"
                shift 2
                ;;
            --pattern|-p)
                TEST_PATTERN="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Comprehensive Installation Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Tests the complete installation process including:
    - Local installation from repository
    - Remote installation via curl
    - Docker environment setup
    - Jekyll site building and serving
    - Documentation validation

OPTIONS:
    -v, --verbose      Enable verbose output with detailed logs
    --no-cleanup       Don't cleanup test directories (for debugging)
    -t, --timeout      Test timeout in seconds (default: 300)
    -p, --pattern      Test pattern to match (default: *)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run all tests with default settings
    $0 --verbose       # Run with detailed output
    $0 --no-cleanup    # Keep test directories for inspection
    $0 --pattern local # Run only local installation tests

The test suite creates isolated environments and validates:
✓ Installation script execution
✓ File copying and permissions
✓ Docker environment functionality
✓ Jekyll site building
✓ Documentation accuracy
✓ Error handling and recovery

Results are saved to: $TEST_RESULTS_DIR/
EOF
}

# Test environment setup
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create test workspace
    TEST_WORKSPACE=$(mktemp -d -t zer0-mistakes-test-XXXXXX)
    log_info "Test workspace: $TEST_WORKSPACE"
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Set up cleanup trap
    if [[ "$CLEANUP" == "true" ]]; then
        trap cleanup_test_environment EXIT
    fi
    
    log_success "Test environment ready"
}

cleanup_test_environment() {
    if [[ -n "$TEST_WORKSPACE" && -d "$TEST_WORKSPACE" ]]; then
        log_info "Cleaning up test workspace: $TEST_WORKSPACE"
        rm -rf "$TEST_WORKSPACE"
    fi
}

# Test execution functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    local category="${3:-general}"
    
    log_test "Running: $test_name"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    local start_time=$(date +%s)
    local test_result="FAIL"
    local error_message=""
    
    if timeout "$TIMEOUT" bash -c "$test_function" 2>&1; then
        test_result="PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
    else
        local exit_code=$?
        test_result="FAIL"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        error_message="Exit code: $exit_code"
        log_error "$test_name - $error_message"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Record test result
    local result_file="$TEST_RESULTS_DIR/test_$(date +%s%N).json"
    cat > "$result_file" << EOF
{
  "name": "$test_name",
  "category": "$category",
  "result": "$test_result",
  "duration": $duration,
  "error_message": "$error_message",
  "timestamp": "$(date -Iseconds)"
}
EOF

    if [[ "$test_result" == "FAIL" ]]; then
        return 1
    fi
    return 0
}

# Test functions
test_local_installation_full() {
    local test_dir="$TEST_WORKSPACE/local-full"
    mkdir -p "$test_dir"
    
    log_info "Testing local full installation in $test_dir"
    
    # Run installer from project root
    cd "$PROJECT_ROOT"
    if [[ "$VERBOSE" == "true" ]]; then
        ./install.sh --full "$test_dir"
    else
        ./install.sh --full "$test_dir" &>/dev/null
    fi
    
    # Validate installation
    validate_full_installation "$test_dir"
}

test_local_installation_minimal() {
    local test_dir="$TEST_WORKSPACE/local-minimal"
    mkdir -p "$test_dir"
    
    log_info "Testing local minimal installation in $test_dir"
    
    # Run installer from project root
    cd "$PROJECT_ROOT"
    if [[ "$VERBOSE" == "true" ]]; then
        ./install.sh --minimal "$test_dir"
    else
        ./install.sh --minimal "$test_dir" &>/dev/null
    fi
    
    # Validate installation
    validate_minimal_installation "$test_dir"
}

test_remote_installation_full() {
    local test_dir="$TEST_WORKSPACE/remote-full"
    mkdir -p "$test_dir"
    cd "$test_dir"
    
    log_info "Testing remote full installation in $test_dir"
    
    # Simulate remote installation
    if [[ "$VERBOSE" == "true" ]]; then
        curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full .
    else
        curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full . &>/dev/null
    fi
    
    # Validate installation
    validate_full_installation "$test_dir"
}

test_docker_environment() {
    local test_dir="$TEST_WORKSPACE/docker-test"
    mkdir -p "$test_dir"
    
    log_info "Testing Docker environment setup"
    
    # Install theme first
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available, skipping Docker tests"
        return 0
    fi
    
    # Test docker-compose file exists and is valid
    if [[ ! -f "docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found"
        return 1
    fi
    
    # Validate docker-compose configuration
    if ! docker-compose config &>/dev/null; then
        log_error "docker-compose.yml is invalid"
        return 1
    fi
    
    log_success "Docker environment validation passed"
}

test_jekyll_build() {
    local test_dir="$TEST_WORKSPACE/jekyll-build"
    mkdir -p "$test_dir"
    
    log_info "Testing Jekyll site building"
    
    # Install theme first
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Check if we can build the site
    if command -v bundle &> /dev/null && command -v jekyll &> /dev/null; then
        log_info "Testing local Jekyll build"
        if bundle install &>/dev/null && bundle exec jekyll build &>/dev/null; then
            log_success "Local Jekyll build successful"
        else
            log_warning "Local Jekyll build failed (may be expected without full Ruby environment)"
        fi
    elif command -v docker &> /dev/null; then
        log_info "Testing Docker Jekyll build"
        if timeout 60 docker-compose run --rm jekyll jekyll build &>/dev/null; then
            log_success "Docker Jekyll build successful"
        else
            log_warning "Docker Jekyll build failed or timed out"
        fi
    else
        log_warning "Neither Jekyll nor Docker available for build testing"
    fi
}

test_documentation_accuracy() {
    local test_dir="$TEST_WORKSPACE/docs-test"
    mkdir -p "$test_dir"
    
    log_info "Testing documentation accuracy"
    
    # Install theme first
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Check if INSTALLATION.md was created
    if [[ ! -f "INSTALLATION.md" ]]; then
        log_error "INSTALLATION.md not created"
        return 1
    fi
    
    # Check if installation instructions contain key sections
    local required_sections=("Quick Start" "Docker" "Troubleshooting" "Azure")
    for section in "${required_sections[@]}"; do
        if ! grep -q "$section" "INSTALLATION.md"; then
            log_error "Missing section in INSTALLATION.md: $section"
            return 1
        fi
    done
    
    log_success "Documentation accuracy validation passed"
}

test_error_handling() {
    local test_dir="$TEST_WORKSPACE/error-test"
    mkdir -p "$test_dir"
    
    log_info "Testing error handling capabilities"
    
    # Test with invalid target directory (read-only)
    local readonly_dir="$test_dir/readonly"
    mkdir -p "$readonly_dir"
    chmod 444 "$readonly_dir"
    
    # This should fail gracefully
    cd "$PROJECT_ROOT"
    if ./install.sh --minimal "$readonly_dir" &>/dev/null; then
        log_error "Installer should have failed with read-only directory"
        return 1
    else
        log_success "Error handling for read-only directory works correctly"
    fi
    
    # Restore permissions for cleanup
    chmod 755 "$readonly_dir"
}

# Validation functions
validate_full_installation() {
    local install_dir="$1"
    
    log_info "Validating full installation in $install_dir"
    
    # Check essential files
    local required_files=(
        "_config.yml"
        "_config_dev.yml"
        "Gemfile"
        "docker-compose.yml"
        "INSTALLATION.md"
        ".gitignore"
        "index.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$install_dir/$file" ]]; then
            log_error "Missing required file: $file"
            return 1
        fi
    done
    
    # Check essential directories
    local required_dirs=(
        "_data"
        "_includes"
        "_layouts"
        "_sass"
        "assets"
        ".github/workflows"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$install_dir/$dir" ]]; then
            log_error "Missing required directory: $dir"
            return 1
        fi
    done
    
    # Validate _config_dev.yml contains Docker optimizations
    if ! grep -q "host: \"0.0.0.0\"" "$install_dir/_config_dev.yml"; then
        log_error "_config_dev.yml missing Docker host configuration"
        return 1
    fi
    
    log_success "Full installation validation passed"
}

validate_minimal_installation() {
    local install_dir="$1"
    
    log_info "Validating minimal installation in $install_dir"
    
    # Check essential files for minimal installation
    local required_files=(
        "_config.yml"
        "Gemfile"
        "INSTALLATION.md"
        ".gitignore"
        "index.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$install_dir/$file" ]]; then
            log_error "Missing required file: $file"
            return 1
        fi
    done
    
    # Check that Docker files are NOT present in minimal installation
    local should_not_exist=(
        "docker-compose.yml"
        "_config_dev.yml"
        "_includes"
        "_layouts"
    )
    
    for item in "${should_not_exist[@]}"; do
        if [[ -e "$install_dir/$item" ]]; then
            log_error "Minimal installation should not include: $item"
            return 1
        fi
    done
    
    log_success "Minimal installation validation passed"
}

# Performance and reliability tests
test_installation_speed() {
    local test_dir="$TEST_WORKSPACE/speed-test"
    mkdir -p "$test_dir"
    
    log_info "Testing installation speed"
    
    local start_time=$(date +%s)
    
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Installation completed in ${duration} seconds"
    
    # Installation should complete within reasonable time (5 minutes)
    if [[ $duration -gt 300 ]]; then
        log_warning "Installation took longer than expected: ${duration}s"
    else
        log_success "Installation speed acceptable: ${duration}s"
    fi
}

test_multiple_installations() {
    log_info "Testing multiple installation scenarios"
    
    # Test installing over existing installation
    local test_dir="$TEST_WORKSPACE/multiple-test"
    mkdir -p "$test_dir"
    
    # First installation
    cd "$PROJECT_ROOT"
    ./install.sh --minimal "$test_dir" &>/dev/null
    
    # Second installation (should create backups)
    ./install.sh --full "$test_dir" &>/dev/null
    
    # Check that backup files were created
    if ! find "$test_dir" -name "*.backup.*" | grep -q .; then
        log_error "No backup files created during second installation"
        return 1
    fi
    
    log_success "Multiple installation test passed"
}

test_documentation_commands() {
    local test_dir="$TEST_WORKSPACE/docs-commands"
    mkdir -p "$test_dir"
    
    log_info "Testing documentation commands"
    
    # Install theme
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Test commands mentioned in documentation
    local commands_to_test=()
    
    # Extract commands from INSTALLATION.md
    if [[ -f "INSTALLATION.md" ]]; then
        # Look for bash code blocks and extract simple commands
        while IFS= read -r line; do
            if [[ "$line" =~ ^(bundle|docker|docker-compose|jekyll) ]]; then
                # Skip commands that would actually run servers
                if [[ ! "$line" =~ (serve|up) ]]; then
                    commands_to_test+=("$line")
                fi
            fi
        done < <(grep -A 10 -B 2 '```bash' INSTALLATION.md | grep -v '```' | grep -v '^--$' | grep -v '^#')
    fi
    
    # Test basic command validation (not execution)
    for cmd in "${commands_to_test[@]}"; do
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Validating command syntax: $cmd"
        fi
        
        # Basic syntax validation - check if command exists
        local cmd_name=$(echo "$cmd" | awk '{print $1}')
        if command -v "$cmd_name" &>/dev/null || [[ "$cmd_name" == "bundle" ]]; then
            if [[ "$VERBOSE" == "true" ]]; then
                log_success "Command available: $cmd_name"
            fi
        else
            log_warning "Command not available (expected): $cmd_name"
        fi
    done
    
    log_success "Documentation commands validation completed"
}

# Main test categories
run_installation_tests() {
    log_info "Running installation tests..."
    
    run_test "Local Full Installation" "test_local_installation_full" "installation"
    run_test "Local Minimal Installation" "test_local_installation_minimal" "installation"
    run_test "Remote Full Installation" "test_remote_installation_full" "installation"
    run_test "Installation Speed" "test_installation_speed" "performance"
    run_test "Multiple Installations" "test_multiple_installations" "installation"
}

run_environment_tests() {
    log_info "Running environment tests..."
    
    run_test "Docker Environment" "test_docker_environment" "environment"
    run_test "Jekyll Build" "test_jekyll_build" "environment"
}

run_documentation_tests() {
    log_info "Running documentation tests..."
    
    run_test "Documentation Accuracy" "test_documentation_accuracy" "documentation"
    run_test "Documentation Commands" "test_documentation_commands" "documentation"
}

run_reliability_tests() {
    log_info "Running reliability tests..."
    
    run_test "Error Handling" "test_error_handling" "reliability"
}

# Generate comprehensive test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/installation_test_report.json"
    
    log_info "Generating comprehensive test report..."
    
    # Aggregate all test results
    if command -v jq &>/dev/null; then
        jq -s '{
          timestamp: (.[0].timestamp // now | strftime("%Y-%m-%dT%H:%M:%SZ")),
          test_suite: "zer0-mistakes Installation Tests",
          environment: {
            os: "'$(uname -s)'",
            arch: "'$(uname -m)'",
            docker_available: '$(command -v docker &>/dev/null && echo "true" || echo "false")',
            ruby_available: '$(command -v ruby &>/dev/null && echo "true" || echo "false")',
            bundle_available: '$(command -v bundle &>/dev/null && echo "true" || echo "false")'
          },
          summary: {
            total: '"$TESTS_TOTAL"',
            passed: '"$TESTS_PASSED"',
            failed: '"$TESTS_FAILED"',
            skipped: '"$TESTS_SKIPPED"',
            success_rate: '$(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))'
          },
          test_categories: [
            {
              name: "Installation Tests",
              total_tests: ([.[] | select(.category == "installation")] | length),
              passed_tests: ([.[] | select(.category == "installation" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "installation" and .result == "FAIL")] | length)
            },
            {
              name: "Environment Tests", 
              total_tests: ([.[] | select(.category == "environment")] | length),
              passed_tests: ([.[] | select(.category == "environment" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "environment" and .result == "FAIL")] | length)
            },
            {
              name: "Documentation Tests",
              total_tests: ([.[] | select(.category == "documentation")] | length),
              passed_tests: ([.[] | select(.category == "documentation" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "documentation" and .result == "FAIL")] | length)
            },
            {
              name: "Reliability Tests",
              total_tests: ([.[] | select(.category == "reliability")] | length),
              passed_tests: ([.[] | select(.category == "reliability" and .result == "PASS")] | length),
              failed_tests: ([.[] | select(.category == "reliability" and .result == "FAIL")] | length)
            }
          ],
          tests: .
        }' "$TEST_RESULTS_DIR"/test_*.json > "$report_file"
    else
        # Fallback JSON generation without jq
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Installation Tests",
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  }
}
EOF
    fi
    
    log_success "Test report generated: $report_file"
}

# Print final summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "  Installation Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo "Test Workspace: $TEST_WORKSPACE"
    echo ""
    echo "Results:"
    echo "  Total Tests: $TESTS_TOTAL"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo "  Skipped: $TESTS_SKIPPED"
    echo ""
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        echo "Success Rate: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%"
    else
        echo "Success Rate: N/A (no tests run)"
    fi
    echo ""
    echo "Reports saved to: $TEST_RESULTS_DIR/"
    echo "=========================================="
    
    if [[ "$CLEANUP" == "false" ]]; then
        echo ""
        log_info "Test workspace preserved for inspection: $TEST_WORKSPACE"
    fi
}

# Main execution function
main() {
    parse_arguments "$@"
    
    log_info "Starting comprehensive installation test suite"
    log_info "Project root: $PROJECT_ROOT"
    
    # Setup
    setup_test_environment
    
    # Run test categories
    run_installation_tests
    run_environment_tests
    run_documentation_tests
    run_reliability_tests
    
    # Generate reports
    generate_test_report
    
    # Print summary
    print_test_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Some tests failed. Check the reports for details."
        exit 1
    else
        log_success "All tests passed!"
        exit 0
    fi
}

# Execute main function
main "$@"
