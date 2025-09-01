#!/bin/bash

# Enhanced Test Suite for zer0-mistakes Jekyll Theme
# This script runs all tests with advanced reporting and analysis capabilities

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
TEST_RESULTS_DIR="test/results"
COVERAGE_DIR="test/coverage"
REPORTS_DIR="test/reports"

# Enhanced default values
VERBOSE=false
COVERAGE=false
FORMAT="text"
PARALLEL=false
RETRY_FAILED=false
TIMEOUT=300
TEST_PATTERN="*"
ENVIRONMENT="local"
FAIL_FAST=false
BASELINE_COMPARE=false

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
        --pattern)
            TEST_PATTERN="$2"
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
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Enhanced Test Runner for zer0-mistakes Jekyll Theme"
            echo ""
            echo "Options:"
            echo "  -v, --verbose         Enable verbose output"
            echo "  -c, --coverage        Generate coverage reports"
            echo "  -f, --format          Output format: text, json, xml, html (default: text)"
            echo "  -p, --parallel        Run tests in parallel"
            echo "  -r, --retry-failed    Retry failed tests automatically"
            echo "  -t, --timeout         Test timeout in seconds (default: 300)"
            echo "  --pattern             Test pattern to match (default: *)"
            echo "  -e, --environment     Test environment: local, ci, docker (default: local)"
            echo "  --fail-fast           Stop on first test failure"
            echo "  --baseline-compare    Compare results with baseline"
            echo "  -h, --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --verbose --format json"
            echo "  $0 --parallel --coverage --environment ci"
            echo "  $0 --pattern unit --fail-fast"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "  -v, --verbose     Enable verbose output"
            echo "  -c, --coverage    Generate coverage reports"
            echo "  -f, --format      Output format: text, json, xml, html (default: text)"
            echo "  -p, --parallel    Run tests in parallel"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Create test directories
mkdir -p "$TEST_RESULTS_DIR" "$COVERAGE_DIR" "$REPORTS_DIR"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Test categories (using indexed arrays for bash 3.2 compatibility)
TEST_CATEGORIES=("unit" "integration" "e2e" "performance" "security" "accessibility" "compatibility")
TEST_CATEGORY_NAMES=("Unit Tests" "Integration Tests" "End-to-End Tests" "Performance Tests" "Security Tests" "Accessibility Tests" "Compatibility Tests")

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
        echo "  Total Tests: $TESTS_TOTAL"
        echo "  Passed: $TESTS_PASSED"
        echo "  Failed: $TESTS_FAILED"
        echo "  Skipped: $TESTS_SKIPPED"
        echo ""
        echo "Success Rate: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%"
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
        echo "  <testsuite name=\"zer0-mistakes\" tests=\"$TESTS_TOTAL\" failures=\"$TESTS_FAILED\" skipped=\"$TESTS_SKIPPED\">"

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
        echo "    <p><strong>Total Tests:</strong> $TESTS_TOTAL</p>"
        echo "    <p><strong>Passed:</strong> <span class=\"passed\">$TESTS_PASSED</span></p>"
        echo "    <p><strong>Failed:</strong> <span class=\"failed\">$TESTS_FAILED</span></p>"
        echo "    <p><strong>Skipped:</strong> <span class=\"skipped\">$TESTS_SKIPPED</span></p>"
        echo "    <p><strong>Success Rate:</strong> $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%</p>"
        echo "    <p><strong>Generated:</strong> $(date)</p>"
        echo "  </div>"
        echo "</body>"
        echo "</html>"
    } > "$report_file"
}

# Main test execution
main() {
    log "Starting comprehensive test suite for zer0-mistakes..."

    # Initialize results
    init_test_results

    # Source test files
    for test_file in test/test_*.sh; do
        if [[ -f "$test_file" && "$test_file" != "test/test_runner.sh" ]]; then
            info "Loading test file: $(basename "$test_file")"
            source "$test_file"
        fi
    done

    # Run all test categories
    for i in "${!TEST_CATEGORIES[@]}"; do
        category="${TEST_CATEGORIES[$i]}"
        category_name="${TEST_CATEGORY_NAMES[$i]}"
        info "Running $category_name..."

        # Run category-specific tests
        case "$category" in
            "unit")
                run_unit_tests
                ;;
            "integration")
                run_integration_tests
                ;;
            "e2e")
                run_e2e_tests
                ;;
            "performance")
                run_performance_tests
                ;;
            "security")
                run_security_tests
                ;;
            "accessibility")
                run_accessibility_tests
                ;;
            "compatibility")
                run_compatibility_tests
                ;;
        esac
    done

    # Generate final report
    generate_report "$FORMAT"

    # Print summary
    echo ""
    log "Test execution completed!"
    log "Results saved to: $REPORTS_DIR/"
    log "Summary:"
    log "  Total: $TESTS_TOTAL"
    log "  Passed: $TESTS_PASSED"
    log "  Failed: $TESTS_FAILED"
    log "  Skipped: $TESTS_SKIPPED"

    if [[ $TESTS_FAILED -gt 0 ]]; then
        error "Some tests failed. Check the reports for details."
        exit 1
    else
        success "All tests passed!"
        exit 0
    fi
}

# Run main function
main "$@"
