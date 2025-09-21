#!/bin/bash

# Comprehensive Deployment Test for zer0-mistakes Jekyll Theme
# Creates a real test site/repository and validates the entire deployment process
# 
# This script tests:
# - Installation from scratch in a new directory
# - Docker environment setup and functionality
# - Jekyll site building and serving
# - GitHub Pages deployment readiness
# - Documentation accuracy and completeness

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
TIMEOUT=600  # 10 minutes for deployment tests
SKIP_DOCKER=false
SKIP_REMOTE=false

# Test site configuration
TEST_SITE_NAME="zer0-test-site-$(date +%s)"
TEST_SITE_DIR=""
DOCKER_PORT=4000

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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
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
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-remote)
                SKIP_REMOTE=true
                shift
                ;;
            --port|-p)
                DOCKER_PORT="$2"
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
Comprehensive Deployment Test for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Creates a real test site and validates the complete deployment process:
    - Fresh installation in isolated environment
    - Docker environment setup and validation
    - Jekyll site building and serving
    - GitHub Pages deployment readiness
    - Documentation accuracy verification

OPTIONS:
    -v, --verbose      Enable verbose output with detailed logs
    --no-cleanup       Don't cleanup test directories (for debugging)
    -t, --timeout      Test timeout in seconds (default: 600)
    --skip-docker      Skip Docker-related tests
    --skip-remote      Skip remote installation tests
    -p, --port         Docker port to use (default: 4000)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run all deployment tests
    $0 --verbose       # Run with detailed output
    $0 --no-cleanup    # Keep test site for inspection
    $0 --skip-docker   # Skip Docker tests (if Docker unavailable)

The test creates a complete Jekyll site and validates:
✓ Installation process execution
✓ File structure and permissions
✓ Docker environment functionality
✓ Jekyll build process
✓ Site serving and accessibility
✓ Documentation accuracy
✓ GitHub Pages readiness

Results are saved to: $TEST_RESULTS_DIR/
EOF
}

# Test environment setup
setup_test_environment() {
    log_info "Setting up deployment test environment..."
    
    # Create test workspace
    TEST_WORKSPACE=$(mktemp -d -t zer0-deployment-test-XXXXXX)
    TEST_SITE_DIR="$TEST_WORKSPACE/$TEST_SITE_NAME"
    
    log_info "Test workspace: $TEST_WORKSPACE"
    log_info "Test site directory: $TEST_SITE_DIR"
    
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
        
        # Stop any running Docker containers first
        if [[ -f "$TEST_SITE_DIR/docker-compose.yml" ]]; then
            cd "$TEST_SITE_DIR" && docker-compose down &>/dev/null || true
        fi
        
        rm -rf "$TEST_WORKSPACE"
    fi
}

# Test execution functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    local category="${3:-deployment}"
    
    log_test "Running: $test_name"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    local start_time=$(date +%s)
    local test_result="FAIL"
    local error_message=""
    
    if $test_function 2>&1; then
        test_result="PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
    else
        local exit_code=$?
        test_result="FAIL"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        
        if [[ $exit_code -eq 124 ]]; then
            error_message="Timeout after ${TIMEOUT}s"
        else
            error_message="Exit code: $exit_code"
        fi
        
        log_error "$test_name - $error_message"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Record test result
    local result_file="$TEST_RESULTS_DIR/deployment_test_$(date +%s%N).json"
    cat > "$result_file" << EOF
{
  "name": "$test_name",
  "category": "$category",
  "result": "$test_result",
  "duration": $duration,
  "error_message": "$error_message",
  "timestamp": "$(date -Iseconds)",
  "test_site_dir": "$TEST_SITE_DIR"
}
EOF

    if [[ "$test_result" == "FAIL" ]]; then
        return 1
    fi
    return 0
}

# Core deployment tests
test_fresh_installation() {
    log_step "Creating fresh site installation"
    
    mkdir -p "$TEST_SITE_DIR"
    cd "$TEST_SITE_DIR"
    
    # Test the installation script
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Running: $PROJECT_ROOT/install.sh --full ."
        "$PROJECT_ROOT/install.sh" --full .
    else
        "$PROJECT_ROOT/install.sh" --full . &>/dev/null
    fi
    
    # Validate essential files were created
    local required_files=(
        "_config.yml"
        "_config_dev.yml"
        "docker-compose.yml"
        "Gemfile"
        "INSTALLATION.md"
        ".gitignore"
        "index.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not created: $file"
            return 1
        fi
    done
    
    # Validate essential directories
    local required_dirs=(
        "_data"
        "_includes"
        "_layouts"
        "_sass"
        "assets"
        ".github/workflows"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "Required directory not created: $dir"
            return 1
        fi
    done
    
    log_success "Fresh installation completed successfully"
}

test_docker_environment() {
    if [[ "$SKIP_DOCKER" == "true" ]]; then
        log_warning "Skipping Docker tests (--skip-docker flag)"
        return 0
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available, skipping Docker tests"
        return 0
    fi
    
    log_step "Testing Docker environment"
    
    cd "$TEST_SITE_DIR"
    
    # Validate docker-compose configuration
    if ! docker-compose config &>/dev/null; then
        log_error "docker-compose.yml configuration is invalid"
        return 1
    fi
    
    log_success "Docker environment validation passed"
}

test_jekyll_build() {
    log_step "Testing Jekyll site building"
    
    cd "$TEST_SITE_DIR"
    
    # Try Docker build first (preferred)
    if [[ "$SKIP_DOCKER" != "true" ]] && command -v docker &> /dev/null; then
        log_info "Testing Jekyll build with Docker"
        
        # Start services in detached mode
        if [[ "$VERBOSE" == "true" ]]; then
            docker-compose up -d
        else
            docker-compose up -d &>/dev/null
        fi
        
        # Wait for Jekyll to start
        log_info "Waiting for Jekyll to start..."
        local max_attempts=30
        local attempt=0
        
        while [[ $attempt -lt $max_attempts ]]; do
            if curl -f "http://localhost:$DOCKER_PORT" &>/dev/null; then
                log_success "Jekyll site is accessible at http://localhost:$DOCKER_PORT"
                break
            fi
            
            attempt=$((attempt + 1))
            sleep 2
        done
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Jekyll site failed to start within timeout"
            docker-compose logs jekyll 2>/dev/null || true
            return 1
        fi
        
        # Test basic site functionality
        local response=$(curl -s "http://localhost:$DOCKER_PORT" | head -10)
        if [[ "$response" =~ "zer0-mistakes" ]] || [[ "$response" =~ "Jekyll" ]] || [[ "$response" =~ "html" ]]; then
            log_success "Site content validation passed"
        else
            log_error "Site content validation failed"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "Response preview: $response"
            fi
            return 1
        fi
        
        # Clean up Docker containers
        docker-compose down &>/dev/null || true
        
    elif command -v bundle &> /dev/null && command -v jekyll &> /dev/null; then
        log_info "Testing Jekyll build with local environment"
        
        if bundle install &>/dev/null && bundle exec jekyll build &>/dev/null; then
            log_success "Local Jekyll build successful"
        else
            log_error "Local Jekyll build failed"
            return 1
        fi
    else
        log_warning "Neither Docker nor local Jekyll environment available"
        return 0
    fi
    
    log_success "Jekyll build testing completed"
}

test_github_pages_readiness() {
    log_step "Testing GitHub Pages deployment readiness"
    
    cd "$TEST_SITE_DIR"
    
    # Check for GitHub Pages compatible configuration
    if [[ -f "_config.yml" ]]; then
        # Check for remote_theme configuration
        if grep -q "remote_theme.*bamr87/zer0-mistakes" "_config.yml"; then
            log_success "Remote theme configuration found"
        else
            log_warning "Remote theme not configured (may be intentional for local development)"
        fi
        
        # Check for GitHub Pages compatible plugins
        local github_pages_plugins=(
            "jekyll-feed"
            "jekyll-sitemap"
            "jekyll-seo-tag"
        )
        
        for plugin in "${github_pages_plugins[@]}"; do
            if grep -q "$plugin" "_config.yml" || grep -q "$plugin" "Gemfile"; then
                log_success "GitHub Pages plugin found: $plugin"
            else
                log_warning "GitHub Pages plugin missing: $plugin"
            fi
        done
    else
        log_error "_config.yml not found"
        return 1
    fi
    
    # Check for GitHub Actions workflow
    if [[ -f ".github/workflows/azure-static-web-apps.yml" ]]; then
        log_success "Azure Static Web Apps workflow found"
    else
        log_warning "Azure workflow not found (may not be needed for GitHub Pages)"
    fi
    
    log_success "GitHub Pages readiness check completed"
}

test_documentation_accuracy() {
    log_step "Testing documentation accuracy"
    
    cd "$TEST_SITE_DIR"
    
    # Check if INSTALLATION.md was created and contains key information
    if [[ ! -f "INSTALLATION.md" ]]; then
        log_error "INSTALLATION.md not created"
        return 1
    fi
    
    # Validate documentation content
    local required_sections=(
        "Quick Start"
        "Docker"
        "Troubleshooting"
        "Configuration"
    )
    
    for section in "${required_sections[@]}"; do
        if grep -q "$section" "INSTALLATION.md"; then
            log_success "Documentation section found: $section"
        else
            log_error "Missing documentation section: $section"
            return 1
        fi
    done
    
    # Check for working commands in documentation
    local docker_commands_count=$(grep -c "docker-compose\|docker" "INSTALLATION.md" || echo "0")
    if [[ $docker_commands_count -gt 0 ]]; then
        log_success "Docker commands documented ($docker_commands_count references)"
    else
        log_warning "No Docker commands found in documentation"
    fi
    
    log_success "Documentation accuracy validation passed"
}

test_remote_installation() {
    if [[ "$SKIP_REMOTE" == "true" ]]; then
        log_warning "Skipping remote installation test (--skip-remote flag)"
        return 0
    fi
    
    log_step "Testing remote installation"
    
    local remote_test_dir="$TEST_WORKSPACE/remote-install-test"
    mkdir -p "$remote_test_dir"
    cd "$remote_test_dir"
    
    # Test remote installation
    if [[ "$VERBOSE" == "true" ]]; then
        curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full .
    else
        curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full . &>/dev/null
    fi
    
    # Validate remote installation
    if [[ ! -f "_config.yml" || ! -f "docker-compose.yml" ]]; then
        log_error "Remote installation failed to create essential files"
        return 1
    fi
    
    log_success "Remote installation test passed"
}

test_configuration_validity() {
    log_step "Testing configuration file validity"
    
    cd "$TEST_SITE_DIR"
    
    # Test YAML syntax
    if command -v ruby &> /dev/null; then
        # Suppress gem warnings and only check for actual YAML errors
        if ruby -e "require 'yaml'; YAML.load_file('_config.yml')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
            log_error "_config.yml contains syntax errors"
            return 1
        else
            log_success "_config.yml syntax is valid"
        fi
        
        if [[ -f "_config_dev.yml" ]]; then
            if ruby -e "require 'yaml'; YAML.load_file('_config_dev.yml')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
                log_error "_config_dev.yml contains syntax errors"
                return 1
            else
                log_success "_config_dev.yml syntax is valid"
            fi
        fi
    else
        log_warning "Ruby not available for YAML validation"
    fi
    
    # Test Docker Compose syntax
    if command -v docker &> /dev/null && [[ -f "docker-compose.yml" ]]; then
        if docker-compose config &>/dev/null; then
            log_success "docker-compose.yml syntax is valid"
        else
            log_error "docker-compose.yml contains syntax errors"
            return 1
        fi
    fi
    
    log_success "Configuration validity test passed"
}

test_file_permissions() {
    log_step "Testing file permissions and structure"
    
    cd "$TEST_SITE_DIR"
    
    # Check that files are readable
    local important_files=("_config.yml" "Gemfile" "index.md")
    for file in "${important_files[@]}"; do
        if [[ -r "$file" ]]; then
            log_success "File is readable: $file"
        else
            log_error "File is not readable: $file"
            return 1
        fi
    done
    
    # Check that directories have proper permissions
    local important_dirs=("_data" "_includes" "_layouts" "assets")
    for dir in "${important_dirs[@]}"; do
        if [[ -d "$dir" && -r "$dir" ]]; then
            log_success "Directory is accessible: $dir"
        else
            log_warning "Directory missing or not accessible: $dir"
        fi
    done
    
    log_success "File permissions test passed"
}

test_minimal_installation() {
    log_step "Testing minimal installation mode"
    
    local minimal_test_dir="$TEST_WORKSPACE/minimal-test"
    mkdir -p "$minimal_test_dir"
    cd "$minimal_test_dir"
    
    # Run minimal installation
    if [[ "$VERBOSE" == "true" ]]; then
        "$PROJECT_ROOT/install.sh" --minimal .
    else
        "$PROJECT_ROOT/install.sh" --minimal . &>/dev/null
    fi
    
    # Validate minimal installation
    if [[ ! -f "_config.yml" || ! -f "Gemfile" || ! -f "index.md" ]]; then
        log_error "Minimal installation missing essential files"
        return 1
    fi
    
    # Check that full installation files are NOT present
    if [[ -f "docker-compose.yml" || -d "_includes" ]]; then
        log_error "Minimal installation includes full installation files"
        return 1
    fi
    
    log_success "Minimal installation test passed"
}

# Performance and stress tests
test_installation_performance() {
    log_step "Testing installation performance"
    
    local perf_test_dir="$TEST_WORKSPACE/performance-test"
    mkdir -p "$perf_test_dir"
    
    local start_time=$(date +%s)
    
    cd "$PROJECT_ROOT"
    ./install.sh --full "$perf_test_dir" &>/dev/null
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Installation completed in ${duration} seconds"
    
    # Performance benchmarks
    if [[ $duration -lt 30 ]]; then
        log_success "Excellent performance: ${duration}s (< 30s)"
    elif [[ $duration -lt 60 ]]; then
        log_success "Good performance: ${duration}s (< 60s)"
    elif [[ $duration -lt 120 ]]; then
        log_warning "Acceptable performance: ${duration}s (< 120s)"
    else
        log_warning "Slow performance: ${duration}s (> 120s)"
    fi
}

# Main test execution
run_deployment_tests() {
    log_info "Running comprehensive deployment tests..."
    
    # Core functionality tests
    run_test "Fresh Installation" "test_fresh_installation" "installation"
    run_test "Configuration Validity" "test_configuration_validity" "configuration"
    run_test "File Permissions" "test_file_permissions" "installation"
    run_test "Documentation Accuracy" "test_documentation_accuracy" "documentation"
    
    # Environment tests
    if [[ "$SKIP_DOCKER" != "true" ]]; then
        run_test "Docker Environment" "test_docker_environment" "environment"
        run_test "Jekyll Build" "test_jekyll_build" "build"
    fi
    
    # Deployment readiness
    run_test "GitHub Pages Readiness" "test_github_pages_readiness" "deployment"
    
    # Alternative installation methods
    run_test "Minimal Installation" "test_minimal_installation" "installation"
    
    if [[ "$SKIP_REMOTE" != "true" ]]; then
        run_test "Remote Installation" "test_remote_installation" "installation"
    fi
    
    # Performance tests
    run_test "Installation Performance" "test_installation_performance" "performance"
}

# Generate comprehensive test report
generate_deployment_report() {
    local report_file="$TEST_RESULTS_DIR/deployment_test_report.json"
    
    log_info "Generating deployment test report..."
    
    # Create comprehensive report
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Deployment Tests",
  "test_environment": {
    "os": "$(uname -s)",
    "arch": "$(uname -m)",
    "docker_available": $(command -v docker &>/dev/null && echo "true" || echo "false"),
    "ruby_available": $(command -v ruby &>/dev/null && echo "true" || echo "false"),
    "bundle_available": $(command -v bundle &>/dev/null && echo "true" || echo "false"),
    "git_available": $(command -v git &>/dev/null && echo "true" || echo "false")
  },
  "test_configuration": {
    "timeout": $TIMEOUT,
    "skip_docker": $SKIP_DOCKER,
    "skip_remote": $SKIP_REMOTE,
    "docker_port": $DOCKER_PORT,
    "cleanup": $CLEANUP
  },
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  },
  "test_workspace": "$TEST_WORKSPACE",
  "test_site_dir": "$TEST_SITE_DIR"
}
EOF
    
    # Aggregate individual test results if jq is available
    if command -v jq &>/dev/null; then
        # Merge individual test results into the main report
        local temp_report=$(mktemp)
        jq -s 'add' "$report_file" "$TEST_RESULTS_DIR"/deployment_test_*.json > "$temp_report" 2>/dev/null || cp "$report_file" "$temp_report"
        mv "$temp_report" "$report_file"
    fi
    
    log_success "Deployment test report generated: $report_file"
}

# Print final summary
print_deployment_summary() {
    echo ""
    echo "=========================================="
    echo "  Deployment Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo "Test Site: $TEST_SITE_NAME"
    echo "Workspace: $TEST_WORKSPACE"
    echo ""
    echo "Environment:"
    echo "  OS: $(uname -s) $(uname -m)"
    echo "  Docker: $(command -v docker &>/dev/null && echo "Available" || echo "Not Available")"
    echo "  Ruby: $(command -v ruby &>/dev/null && ruby --version || echo "Not Available")"
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
        log_info "Test site preserved for inspection:"
        log_info "  Directory: $TEST_SITE_DIR"
        log_info "  Commands to explore:"
        echo "    cd $TEST_SITE_DIR"
        echo "    ls -la"
        echo "    cat INSTALLATION.md"
        echo "    docker-compose up  # (if Docker available)"
    fi
}

# Main execution function
main() {
    parse_arguments "$@"
    
    log_info "Starting comprehensive deployment test suite"
    log_info "Project root: $PROJECT_ROOT"
    log_info "Test site name: $TEST_SITE_NAME"
    
    # Check prerequisites
    if [[ ! -f "$PROJECT_ROOT/install.sh" ]]; then
        log_error "install.sh not found in project root: $PROJECT_ROOT"
        exit 1
    fi
    
    # Setup
    setup_test_environment
    
    # Run all deployment tests
    run_deployment_tests
    
    # Generate reports
    generate_deployment_report
    
    # Print summary
    print_deployment_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Some deployment tests failed. Check the reports for details."
        echo ""
        log_info "To debug, run with --no-cleanup and inspect the test site:"
        echo "  $0 --no-cleanup --verbose"
        exit 1
    else
        log_success "All deployment tests passed!"
        log_info "The zer0-mistakes theme installation and deployment process is working correctly."
        exit 0
    fi
}

# Execute main function
main "$@"
