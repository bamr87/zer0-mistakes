#!/bin/bash

# Consolidated Test Runner for zer0-mistakes Jekyll Theme
# Orchestrates the three main test suites: Core, Deployment, and Quality
# 
# This runner provides:
# - Unified interface for all test suites
# - Advanced reporting and analysis
# - Flexible execution options
# - CI/CD integration support

set -euo pipefail

# Colors for output
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
COVERAGE_DIR="$SCRIPT_DIR/coverage"
REPORTS_DIR="$SCRIPT_DIR/reports"

# Enhanced default values
VERBOSE=false
COVERAGE=false
FORMAT="text"
PARALLEL=false
RETRY_FAILED=false
TIMEOUT=300
TEST_SUITES="all"  # Changed from TEST_PATTERN
ENVIRONMENT="local"
FAIL_FAST=false
BASELINE_COMPARE=false
SKIP_DOCKER=false
SKIP_REMOTE=false

# Show help function
show_help() {
    cat << EOF
Consolidated Test Runner for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Orchestrates the three main test suites: Core, Deployment, and Quality.
    Provides unified interface with advanced reporting and CI/CD integration.

OPTIONS:
    -v, --verbose         Enable verbose output
    -c, --coverage        Generate coverage reports  
    -f, --format          Output format: text, json, xml, html (default: text)
    -p, --parallel        Run test suites in parallel
    -r, --retry-failed    Retry failed tests automatically
    -t, --timeout         Test timeout in seconds (default: 300)
    -s, --suites          Test suites to run: all, core, deployment, quality (default: all)
    -e, --environment     Test environment: local, ci, docker (default: local)
    --fail-fast           Stop on first test suite failure
    --baseline-compare    Compare results with baseline
    --skip-docker         Skip Docker-related tests
    --skip-remote         Skip remote installation tests
    -h, --help            Show this help message

TEST SUITES:
    core                  Unit, integration, and validation tests
    deployment            Installation, Docker, and E2E tests
    quality               Security, accessibility, compatibility, and performance tests
    all                   Run all test suites (default)

EXAMPLES:
    $0                                    # Run all test suites
    $0 --verbose --format json           # Detailed output with JSON reporting
    $0 --suites core,deployment          # Run only core and deployment suites
    $0 --parallel --environment ci       # Parallel execution for CI
    $0 --suites quality --skip-docker    # Quality tests without Docker
EOF
}

# Parse arguments with enhanced options
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --format|-f)
            FORMAT="$2"
            shift 2
            ;;
        --parallel|-p)
            PARALLEL=true
            shift
            ;;
        --retry-failed|-r)
            RETRY_FAILED=true
            shift
            ;;
        --timeout|-t)
            TIMEOUT="$2"
            shift 2
            ;;
        --suites|-s)
            TEST_SUITES="$2"
            shift 2
            ;;
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --fail-fast)
            FAIL_FAST=true
            shift
            ;;
        --baseline-compare)
            BASELINE_COMPARE=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-remote)
            SKIP_REMOTE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Test suites configuration (using indexed arrays for bash 3.2 compatibility)
TEST_SUITE_KEYS=("core" "deployment" "quality")
TEST_SUITE_SCRIPTS=("test_core.sh" "test_deployment.sh" "test_quality.sh")
TEST_SUITE_NAMES=("Core Tests (Unit, Integration, Validation)" "Deployment Tests (Installation, Docker, E2E)" "Quality Tests (Security, Accessibility, Compatibility, Performance)")

# Helper function to get suite script by name
get_suite_script() {
    local suite_name="$1"
    for i in "${!TEST_SUITE_KEYS[@]}"; do
        if [[ "${TEST_SUITE_KEYS[$i]}" == "$suite_name" ]]; then
            echo "${TEST_SUITE_SCRIPTS[$i]}"
            return 0
        fi
    done
    return 1
}

# Helper function to get suite description by name
get_suite_name() {
    local suite_name="$1"
    for i in "${!TEST_SUITE_KEYS[@]}"; do
        if [[ "${TEST_SUITE_KEYS[$i]}" == "$suite_name" ]]; then
            echo "${TEST_SUITE_NAMES[$i]}"
            return 0
        fi
    done
    return 1
}

# Create test directories
mkdir -p "$TEST_RESULTS_DIR" "$COVERAGE_DIR" "$REPORTS_DIR"

# Test counters
SUITES_TOTAL=0
SUITES_PASSED=0
SUITES_FAILED=0
SUITES_SKIPPED=0

# Legacy associative arrays removed for bash 3.2 compatibility

# Function definitions
log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

skip() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Parse test suites to run
parse_test_suites() {
    local suites_input="$1"
    local -a suites_to_run=()
    
    if [[ "$suites_input" == "all" ]]; then
        suites_to_run=("core" "deployment" "quality")
    else
        IFS=',' read -ra suites_to_run <<< "$suites_input"
    fi
    
    # Validate suite names
    for suite in "${suites_to_run[@]}"; do
        local valid=false
        for valid_suite in "${TEST_SUITE_KEYS[@]}"; do
            if [[ "$suite" == "$valid_suite" ]]; then
                valid=true
                break
            fi
        done
        if [[ "$valid" == "false" ]]; then
            error "Unknown test suite: $suite"
            error "Available suites: ${TEST_SUITE_KEYS[*]}"
            exit 1
        fi
    done
    
    echo "${suites_to_run[@]}"
}

# Initialize test results
init_test_results() {
    echo "{
  \"timestamp\": \"$(date -Iseconds)\",
  \"test_run\": {
    \"total\": 0,
    \"passed\": 0,
    \"failed\": 0,
    \"skipped\": 0
  },
  \"categories\": {},
  \"tests\": []
}" > "$TEST_RESULTS_DIR/results.json"
}

# Update test counters
update_counters() {
    local result="$1"
    case "$result" in
        "PASS")
            TESTS_PASSED=$((TESTS_PASSED + 1))
            ;;
        "FAIL")
            TESTS_FAILED=$((TESTS_FAILED + 1))
            ;;
        "SKIP")
            TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
            ;;
    esac
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Run a single test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local category="${3:-general}"
    local timeout="${4:-30}"

    info "Running: $test_name"

    if [[ "$VERBOSE" == true ]]; then
        echo "Command: $test_command"
        echo "Category: $category"
        echo "Timeout: ${timeout}s"
    fi

    # Run test with timeout
    local start_time=$(date +%s)
    if timeout "$timeout" bash -c "$test_command" 2>&1; then
        success "$test_name"
        update_counters "PASS"
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        # Record test result
        echo "{
  \"name\": \"$test_name\",
  \"category\": \"$category\",
  \"result\": \"PASS\",
  \"duration\": $duration,
  \"timestamp\": \"$(date -Iseconds)\"
}" >> "$TEST_RESULTS_DIR/test_${category}_$(date +%s%N).json"

        return 0
    else
        local exit_code=$?
        fail "$test_name"
        update_counters "FAIL"
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        # Record test result
        echo "{
  \"name\": \"$test_name\",
  \"category\": \"$category\",
  \"result\": \"FAIL\",
  \"duration\": $duration,
  \"exit_code\": $exit_code,
  \"timestamp\": \"$(date -Iseconds)\"
}" >> "$TEST_RESULTS_DIR/test_${category}_$(date +%s%N).json"

        if [[ "$VERBOSE" == true ]]; then
            echo "Exit code: $exit_code"
        fi
        return 1
    fi
}

# Run tests in parallel
run_parallel() {
    local test_commands=("$@")
    local pids=()
    local results=()

    # Start all tests
    for cmd in "${test_commands[@]}"; do
        bash -c "$cmd" &
        pids+=($!)
    done

    # Wait for all tests to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
        results+=($?)
    done

    # Check results
    local failed=0
    for result in "${results[@]}"; do
        if [[ $result -ne 0 ]]; then
            failed=1
            break
        fi
    done

    return $failed
}

# Generate test report
generate_report() {
    local format="$1"

    case "$format" in
        "json")
            generate_json_report
            ;;
        "xml")
            generate_xml_report
            ;;
        "html")
            generate_html_report
            ;;
        *)
            generate_text_report
            ;;
    esac
}

# Generate text report
generate_text_report() {
    {
        echo "=========================================="
        echo "  zer0-mistakes Test Results"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo ""
        echo "Summary:"
        echo "  Total Suites: $SUITES_TOTAL"
        echo "  Passed: $SUITES_PASSED"
        echo "  Failed: $SUITES_FAILED"
        echo "  Skipped: $SUITES_SKIPPED"
        echo ""
        if [[ $SUITES_TOTAL -gt 0 ]]; then
            echo "Success Rate: $(( (SUITES_PASSED * 100) / SUITES_TOTAL ))%"
        else
            echo "Success Rate: N/A"
        fi
        echo ""
        echo "=========================================="
    } > "$REPORTS_DIR/test_report.txt"
}

# Generate JSON report
generate_json_report() {
    local report_file="$REPORTS_DIR/test_report.json"

    # Aggregate all test results
    jq -s '{
      timestamp: .[0].timestamp,
      summary: {
        total: (. | length),
        passed: ([.[] | select(.result == "PASS")] | length),
        failed: ([.[] | select(.result == "FAIL")] | length),
        skipped: ([.[] | select(.result == "SKIP")] | length)
      },
      tests: .
    }' "$TEST_RESULTS_DIR"/test_*.json > "$report_file"
}

# Generate XML report
generate_xml_report() {
    local report_file="$REPORTS_DIR/test_report.xml"

    {
        echo '<?xml version="1.0" encoding="UTF-8"?>'
        echo '<testsuites>'
        echo "  <testsuite name=\"zer0-mistakes\" tests=\"$SUITES_TOTAL\" failures=\"$SUITES_FAILED\" skipped=\"$SUITES_SKIPPED\">"

        for result_file in "$TEST_RESULTS_DIR"/test_*.json; do
            if [[ -f "$result_file" ]]; then
                local name=$(jq -r '.name' "$result_file")
                local result=$(jq -r '.result' "$result_file")
                local duration=$(jq -r '.duration' "$result_file")

                echo "    <testcase name=\"$name\" time=\"$duration\">"
                if [[ "$result" == "FAIL" ]]; then
                    echo "      <failure message=\"Test failed\" />"
                fi
                echo "    </testcase>"
            fi
        done

        echo "  </testsuite>"
        echo "</testsuites>"
    } > "$report_file"
}

# Generate HTML report
generate_html_report() {
    local report_file="$REPORTS_DIR/test_report.html"

    {
        echo "<!DOCTYPE html>"
        echo "<html>"
        echo "<head>"
        echo "  <title>zer0-mistakes Test Report</title>"
        echo "  <style>"
        echo "    body { font-family: Arial, sans-serif; margin: 20px; }"
        echo "    .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; }"
        echo "    .passed { color: green; }"
        echo "    .failed { color: red; }"
        echo "    .skipped { color: orange; }"
        echo "    table { border-collapse: collapse; width: 100%; }"
        echo "    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }"
        echo "    th { background-color: #f2f2f2; }"
        echo "  </style>"
        echo "</head>"
        echo "<body>"
        echo "  <h1>zer0-mistakes Test Report</h1>"
        echo "  <div class=\"summary\">"
        echo "    <h2>Summary</h2>"
            echo "    <p><strong>Total Suites:</strong> $SUITES_TOTAL</p>"
            echo "    <p><strong>Passed:</strong> <span class=\"passed\">$SUITES_PASSED</span></p>"
            echo "    <p><strong>Failed:</strong> <span class=\"failed\">$SUITES_FAILED</span></p>"
            echo "    <p><strong>Skipped:</strong> <span class=\"skipped\">$SUITES_SKIPPED</span></p>"
            if [[ $SUITES_TOTAL -gt 0 ]]; then
                echo "    <p><strong>Success Rate:</strong> $(( (SUITES_PASSED * 100) / SUITES_TOTAL ))%</p>"
            else
                echo "    <p><strong>Success Rate:</strong> N/A</p>"
            fi
        echo "    <p><strong>Generated:</strong> $(date)</p>"
        echo "  </div>"
        echo "</body>"
        echo "</html>"
    } > "$report_file"
}

# Run a single test suite
run_test_suite() {
    local suite_name="$1"
    local suite_script
    local suite_description
    
    suite_script=$(get_suite_script "$suite_name")
    suite_description=$(get_suite_name "$suite_name")
    
    info "Running $suite_description..."
    SUITES_TOTAL=$((SUITES_TOTAL + 1))
    
    # Build command arguments
    local cmd_args=()
    [[ "$VERBOSE" == "true" ]] && cmd_args+=("--verbose")
    [[ "$COVERAGE" == "true" ]] && cmd_args+=("--coverage")
    [[ "$FORMAT" != "text" ]] && cmd_args+=("--format" "$FORMAT")
    [[ "$TIMEOUT" != "300" ]] && cmd_args+=("--timeout" "$TIMEOUT")
    
    # Suite-specific arguments
    if [[ "$suite_name" == "deployment" ]]; then
        [[ "$SKIP_DOCKER" == "true" ]] && cmd_args+=("--skip-docker")
        [[ "$SKIP_REMOTE" == "true" ]] && cmd_args+=("--skip-remote")
    fi
    
    local start_time=$(date +%s)
    local suite_result="FAIL"
    
    # Execute the test suite
    if [[ ${#cmd_args[@]} -gt 0 ]]; then
        if "$SCRIPT_DIR/$suite_script" "${cmd_args[@]}"; then
            suite_result="PASS"
        else
            suite_result="FAIL"
        fi
    else
        if "$SCRIPT_DIR/$suite_script"; then
            suite_result="PASS"
        else
            suite_result="FAIL"
        fi
    fi
    
    if [[ "$suite_result" == "PASS" ]]; then
        SUITES_PASSED=$((SUITES_PASSED + 1))
        success "$suite_description"
    else
        SUITES_FAILED=$((SUITES_FAILED + 1))
        fail "$suite_description"
        
        if [[ "$FAIL_FAST" == "true" ]]; then
            error "Fail-fast enabled, stopping on first suite failure"
            return 1
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Record suite result
    local result_file="$TEST_RESULTS_DIR/suite_${suite_name}_$(date +%s%N).json"
    cat > "$result_file" << EOF
{
  "suite": "$suite_name",
  "description": "$suite_description",
  "result": "$suite_result",
  "duration": $duration,
  "timestamp": "$(date -Iseconds)"
}
EOF

    if [[ "$suite_result" == "FAIL" ]]; then
        return 1
    else
        return 0
    fi
}

# Run test suites in parallel
run_suites_parallel() {
    local suites=("$@")
    local pids=()
    local results=()
    
    info "Running test suites in parallel..."
    
    # Start all suites
    for suite in "${suites[@]}"; do
        run_test_suite "$suite" &
        pids+=($!)
    done
    
    # Wait for all suites to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
        results+=($?)
    done
    
    # Check results
    local failed=0
    for i in "${!results[@]}"; do
        if [[ ${results[$i]} -ne 0 ]]; then
            failed=1
            if [[ "$FAIL_FAST" == "true" ]]; then
                break
            fi
        fi
    done
    
    return $failed
}

# Run test suites sequentially  
run_suites_sequential() {
    local suites=("$@")
    local failed=0
    
    info "Running test suites sequentially..."
    
    for suite in "${suites[@]}"; do
        if ! run_test_suite "$suite"; then
            failed=1
            if [[ "$FAIL_FAST" == "true" ]]; then
                break
            fi
        fi
    done
    
    return $failed
}

# Main test execution
main() {
    log "Starting consolidated test suite for zer0-mistakes..."
    
    # Parse which suites to run
    local -a suites_to_run
    IFS=' ' read -ra suites_to_run <<< "$(parse_test_suites "$TEST_SUITES")"
    
    info "Test suites to execute: ${suites_to_run[*]}"
    info "Environment: $ENVIRONMENT"
    info "Parallel execution: $PARALLEL"
    
    # Initialize results
    init_test_results
    
    # Run test suites
    local execution_failed=0
    if [[ "$PARALLEL" == "true" ]]; then
        if ! run_suites_parallel "${suites_to_run[@]}"; then
            execution_failed=1
        fi
    else
        if ! run_suites_sequential "${suites_to_run[@]}"; then
            execution_failed=1
        fi
    fi
    
    # Generate final report
    generate_report "$FORMAT"
    
    # Print summary
    echo ""
    log "Test execution completed!"
    log "Results saved to: $REPORTS_DIR/"
    log "Summary:"
    log "  Total Suites: $SUITES_TOTAL"
    log "  Passed: $SUITES_PASSED"
    log "  Failed: $SUITES_FAILED"
    log "  Skipped: $SUITES_SKIPPED"
    
    if [[ $execution_failed -eq 1 || $SUITES_FAILED -gt 0 ]]; then
        error "Some test suites failed. Check the reports for details."
        
        # Show retry command if retry is available
        if [[ "$RETRY_FAILED" == "true" ]]; then
            info "Retry failed suites with: $0 --retry-failed"
        fi
        
        exit 1
    else
        success "All test suites passed!"
        exit 0
    fi
}

# Run main function
main "$@"
