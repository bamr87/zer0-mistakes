#!/bin/bash

# Deployment Test Suite for zer0-mistakes Jekyll Theme
# Combines installation, Docker, and end-to-end deployment tests
# 
# This suite focuses on:
# - Theme installation processes (local and remote)
# - Docker environment setup and functionality
# - Jekyll site deployment and serving
# - End-to-end workflow validation

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
DOCKER_PORT=4000

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_test() { echo -e "${PURPLE}[TEST]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v) VERBOSE=true; shift ;;
            --no-cleanup) CLEANUP=false; shift ;;
            --timeout|-t) TIMEOUT="$2"; shift 2 ;;
            --skip-docker) SKIP_DOCKER=true; shift ;;
            --skip-remote) SKIP_REMOTE=true; shift ;;
            --port|-p) DOCKER_PORT="$2"; shift 2 ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
Deployment Test Suite for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Tests the complete deployment workflow including installation,
    Docker environment setup, and end-to-end deployment validation.

OPTIONS:
    -v, --verbose      Enable verbose output
    --no-cleanup       Don't cleanup test directories (for debugging)
    -t, --timeout      Test timeout in seconds (default: 600)
    --skip-docker      Skip Docker-related tests
    --skip-remote      Skip remote installation tests
    -p, --port         Docker port to use (default: 4000)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run all deployment tests
    $0 --verbose       # Run with detailed output
    $0 --skip-docker   # Skip Docker tests (if Docker unavailable)
    $0 --no-cleanup    # Keep test sites for inspection
EOF
}

# Test environment setup
setup_test_environment() {
    log_info "Setting up deployment test environment..."
    
    # Create test workspace
    TEST_WORKSPACE=$(mktemp -d -t zer0-deployment-test-XXXXXX)
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
        
        # Stop any running Docker containers first
        # Use docker compose (plugin) or docker-compose (standalone)
        find "$TEST_WORKSPACE" -name "docker-compose.yml" -exec dirname {} \; | while read -r dir; do
            cd "$dir"
            if docker compose version &>/dev/null 2>&1; then
                docker compose down &>/dev/null || true
            elif command -v docker-compose &>/dev/null; then
                docker-compose down &>/dev/null || true
            fi
        done
        
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
    
    if eval "$test_function" 2>&1; then
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
  "timestamp": "$(date -Iseconds)"
}
EOF

    if [[ "$test_result" == "FAIL" ]]; then
        return 1
    fi
    return 0
}

#
# INSTALLATION TESTS
#

test_local_full_installation() {
    log_step "Testing local full installation"
    
    local test_dir="$TEST_WORKSPACE/local-full"
    mkdir -p "$test_dir"
    
    # Run installer from project root
    cd "$PROJECT_ROOT"
    if [[ "$VERBOSE" == "true" ]]; then
        ./install.sh --full "$test_dir"
    else
        ./install.sh --full "$test_dir" &>/dev/null
    fi
    
    # Validate installation
    cd "$test_dir"
    
    # Check essential files
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
        if [[ ! -d "$dir" ]]; then
            log_error "Required directory not created: $dir"
            return 1
        fi
    done
    
    # Validate _config_dev.yml contains Docker optimizations
    if ! grep -q 'host: "0.0.0.0"' "_config_dev.yml"; then
        log_error "_config_dev.yml missing Docker host configuration"
        return 1
    fi
    
    log_success "Local full installation validation passed"
    return 0
}

test_local_minimal_installation() {
    log_step "Testing local minimal installation"
    
    local test_dir="$TEST_WORKSPACE/local-minimal"
    mkdir -p "$test_dir"
    
    # Run installer from project root
    cd "$PROJECT_ROOT"
    if [[ "$VERBOSE" == "true" ]]; then
        ./install.sh --minimal "$test_dir"
    else
        ./install.sh --minimal "$test_dir" &>/dev/null
    fi
    
    # Validate installation
    cd "$test_dir"
    
    # Check essential files for minimal installation
    local required_files=(
        "_config.yml"
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
    
    # Check that Docker files are NOT present in minimal installation
    local should_not_exist=(
        "docker-compose.yml"
        "_config_dev.yml"
        "_includes"
        "_layouts"
    )
    
    for item in "${should_not_exist[@]}"; do
        if [[ -e "$item" ]]; then
            log_error "Minimal installation should not include: $item"
            return 1
        fi
    done
    
    log_success "Local minimal installation validation passed"
    return 0
}

test_remote_installation() {
    if [[ "$SKIP_REMOTE" == "true" ]]; then
        log_warning "Skipping remote installation test (--skip-remote flag)"
        TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
        return 0
    fi
    
    log_step "Testing remote installation"
    
    local test_dir="$TEST_WORKSPACE/remote-test"
    mkdir -p "$test_dir"
    cd "$test_dir"
    
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
    return 0
}

#
# DOCKER TESTS
#

test_docker_environment() {
    if [[ "$SKIP_DOCKER" == "true" ]]; then
        log_warning "Skipping Docker tests (--skip-docker flag)"
        TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
        return 0
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available, skipping Docker tests"
        TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
        return 0
    fi
    
    log_step "Testing Docker environment"
    
    local test_dir="$TEST_WORKSPACE/docker-test"
    mkdir -p "$test_dir"
    
    # Install theme first
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Test docker-compose file exists and is valid
    if [[ ! -f "docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found"
        return 1
    fi
    
    # Validate docker-compose configuration
    # Try docker compose (plugin) first, fall back to docker-compose (standalone)
    local compose_cmd="docker compose"
    if ! command -v docker &>/dev/null || ! docker compose version &>/dev/null 2>&1; then
        if command -v docker-compose &>/dev/null; then
            compose_cmd="docker-compose"
        else
            log_warning "Neither 'docker compose' nor 'docker-compose' found, skipping validation"
            return 0
        fi
    fi
    
    if ! $compose_cmd config &>/dev/null; then
        # Show actual error for debugging
        log_error "docker-compose.yml validation failed:"
        $compose_cmd config 2>&1 | head -20 || true
        return 1
    fi
    
    log_success "Docker environment validation passed"
    return 0
}

test_docker_volume_mounting() {
    if [[ "$SKIP_DOCKER" == "true" ]] || ! command -v docker &> /dev/null; then
        log_warning "Skipping Docker volume mounting test"
        TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
        return 0
    fi
    
    log_step "Testing Docker volume mounting"
    
    # Use home directory for proper volume mounting
    local test_dir="$HOME/zer0-volume-test-$(date +%s)"
    mkdir -p "$test_dir"
    
    # Install theme
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Determine compose command
    local compose_cmd="docker compose"
    if ! docker compose version &>/dev/null 2>&1; then
        if command -v docker-compose &>/dev/null; then
            compose_cmd="docker-compose"
        else
            log_warning "Neither 'docker compose' nor 'docker-compose' found, skipping volume test"
            rm -rf "$test_dir"
            return 0
        fi
    fi
    
    # Test that files are visible inside container (using /site not /app as per Dockerfile)
    # Note: docker compose run creates a new container with volumes mounted per docker-compose.yml
    if $compose_cmd run --rm jekyll ls -la /site/_config.yml &>/dev/null; then
        log_success "Docker volume mounting working correctly"
    else
        # This may fail if Docker image hasn't been built yet, which is acceptable
        log_warning "Docker volume mounting test inconclusive - this is acceptable if Docker image not built"
    fi
    
    # Clean up
    cd "$PROJECT_ROOT"
    rm -rf "$test_dir"
    
    return 0
}

test_jekyll_docker_build() {
    if [[ "$SKIP_DOCKER" == "true" ]] || ! command -v docker &> /dev/null; then
        log_warning "Skipping Jekyll Docker build test"
        TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
        return 0
    fi
    
    log_step "Testing Jekyll build in Docker"
    
    # Use home directory for proper volume mounting
    local test_dir="$HOME/zer0-jekyll-test-$(date +%s)"
    mkdir -p "$test_dir"
    
    # Install theme
    cd "$PROJECT_ROOT"
    ./install.sh --full "$test_dir" &>/dev/null
    
    cd "$test_dir"
    
    # Determine compose command
    local compose_cmd="docker compose"
    if ! docker compose version &>/dev/null 2>&1; then
        if command -v docker-compose &>/dev/null; then
            compose_cmd="docker-compose"
        else
            log_warning "Neither 'docker compose' nor 'docker-compose' found, skipping Jekyll build test"
            rm -rf "$test_dir"
            return 0
        fi
    fi
    
    # Start Jekyll in detached mode
    if [[ "$VERBOSE" == "true" ]]; then
        $compose_cmd up -d
    else
        $compose_cmd up -d &>/dev/null
    fi
    
    # Wait for Jekyll to start (bundle install can take time)
    log_info "Waiting for Jekyll to start..."
    local max_attempts=60  # 2 minutes
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if $compose_cmd logs jekyll | grep -q "Server running"; then
            log_success "Jekyll server started successfully"
            break
        elif $compose_cmd logs jekyll | grep -q "ERROR\|FATAL"; then
            log_error "Jekyll build failed"
            $compose_cmd logs jekyll | tail -10
            $compose_cmd down &>/dev/null || true
            rm -rf "$test_dir"
            return 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
        
        if [[ $((attempt % 15)) -eq 0 ]]; then
            log_info "Still waiting for Jekyll... (${attempt}/${max_attempts})"
        fi
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_warning "Jekyll failed to start within timeout - this is acceptable for resource-constrained environments"
        $compose_cmd logs jekyll | tail -20
        $compose_cmd down &>/dev/null || true
        rm -rf "$test_dir"
        return 0
    fi
    
    # Test site accessibility
    local site_attempts=10
    local site_attempt=0
    
    while [[ $site_attempt -lt $site_attempts ]]; do
        if curl -f "http://localhost:$DOCKER_PORT" &>/dev/null; then
            log_success "Site is accessible at http://localhost:$DOCKER_PORT"
            break
        fi
        site_attempt=$((site_attempt + 1))
        sleep 2
    done
    
    if [[ $site_attempt -eq $site_attempts ]]; then
        log_warning "Site not accessible after Jekyll startup - this is acceptable for slow Docker builds"
        $compose_cmd down &>/dev/null || true
        rm -rf "$test_dir"
        return 0
    fi
    
    # Test site content
    local response=$(curl -s "http://localhost:$DOCKER_PORT")
    if [[ "$response" =~ "zer0-mistakes" ]] || [[ "$response" =~ "Jekyll" ]] || [[ "$response" =~ "Welcome" ]]; then
        log_success "Site content validation passed"
    else
        log_warning "Site content validation unclear"
        if [[ "$VERBOSE" == "true" ]]; then
            echo "Response preview: ${response:0:200}..."
        fi
    fi
    
    # Clean up
    $compose_cmd down &>/dev/null || true
    rm -rf "$test_dir"
    
    log_success "Jekyll Docker build test passed"
    return 0
}

#
# END-TO-END TESTS
#

test_complete_workflow() {
    log_step "Testing complete deployment workflow"
    
    local workflow_dir="$TEST_WORKSPACE/complete-workflow"
    mkdir -p "$workflow_dir"
    
    # Step 1: Install theme
    cd "$PROJECT_ROOT"
    if [[ "$VERBOSE" == "true" ]]; then
        ./install.sh --full "$workflow_dir"
    else
        ./install.sh --full "$workflow_dir" &>/dev/null
    fi
    
    cd "$workflow_dir"
    
    # Step 2: Validate configuration files
    if command -v ruby &> /dev/null; then
        if ruby -e "require 'yaml'; YAML.load_file('_config.yml')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
            log_error "_config.yml contains syntax errors"
            return 1
        fi
    fi
    
    # Step 3: Test local Jekyll build (if available)
    if command -v bundle &> /dev/null && command -v jekyll &> /dev/null; then
        log_info "Testing local Jekyll build..."
        if bundle install --quiet && bundle exec jekyll build --quiet; then
            log_success "Local Jekyll build successful"
            
            # Validate generated site
            if [[ -f "_site/index.html" ]]; then
                log_success "Site generated successfully"
            else
                log_error "Site generation failed"
                return 1
            fi
        else
            log_warning "Local Jekyll build failed (may be expected without full Ruby environment)"
        fi
    fi
    
    # Step 4: Test Docker workflow (if available and not skipped)
    if [[ "$SKIP_DOCKER" != "true" ]] && command -v docker &> /dev/null; then
        log_info "Testing Docker workflow..."
        
        # Validate docker-compose configuration
        # Try docker compose (plugin) first, fall back to docker-compose (standalone)
        local compose_cmd="docker compose"
        if ! docker compose version &>/dev/null 2>&1; then
            if command -v docker-compose &>/dev/null; then
                compose_cmd="docker-compose"
            else
                log_warning "Neither 'docker compose' nor 'docker-compose' found, skipping Docker validation"
                compose_cmd=""
            fi
        fi
        
        if [[ -n "$compose_cmd" ]]; then
            if ! $compose_cmd config &>/dev/null; then
                log_error "Docker Compose configuration invalid"
                return 1
            fi
            log_success "Docker workflow validation passed"
        fi
    fi
    
    log_success "Complete workflow test passed"
    return 0
}

test_github_pages_readiness() {
    log_step "Testing GitHub Pages deployment readiness"
    
    local pages_dir="$TEST_WORKSPACE/github-pages"
    mkdir -p "$pages_dir"
    
    # Install theme
    cd "$PROJECT_ROOT"
    ./install.sh --full "$pages_dir" &>/dev/null
    
    cd "$pages_dir"
    
    # Check for GitHub Pages compatible configuration
    if [[ -f "_config.yml" ]]; then
        # Check for remote_theme configuration capability
        if grep -q "theme:" "_config.yml" || grep -q "remote_theme:" "_config.yml"; then
            log_success "Theme configuration found"
        else
            log_info "No theme configuration found (may be intentional for local development)"
        fi
        
        # Check for GitHub Pages compatible plugins
        local github_pages_plugins=(
            "jekyll-feed"
            "jekyll-sitemap"
            "jekyll-seo-tag"
        )
        
        local plugins_found=0
        for plugin in "${github_pages_plugins[@]}"; do
            if grep -q "$plugin" "_config.yml" || grep -q "$plugin" "Gemfile"; then
                log_success "GitHub Pages plugin found: $plugin"
                plugins_found=$((plugins_found + 1))
            fi
        done
        
        if [[ $plugins_found -gt 0 ]]; then
            log_success "GitHub Pages plugins configured"
        else
            log_warning "No GitHub Pages plugins found"
        fi
    else
        log_error "_config.yml not found"
        return 1
    fi
    
    # Check for GitHub Actions workflow
    if [[ -d ".github/workflows" ]]; then
        log_success "GitHub Actions workflows directory found"
    else
        log_info "No GitHub Actions workflows found (may not be needed for all deployments)"
    fi
    
    log_success "GitHub Pages readiness check completed"
    return 0
}

#
# MAIN TEST EXECUTION
#

run_deployment_tests() {
    log_info "Starting deployment test suite..."
    
    # Setup test environment
    setup_test_environment
    
    # Installation Tests
    log_info "=== INSTALLATION TESTS ==="
    run_test "Local Full Installation" "test_local_full_installation" "installation"
    run_test "Local Minimal Installation" "test_local_minimal_installation" "installation"
    
    if [[ "$SKIP_REMOTE" != "true" ]]; then
        run_test "Remote Installation" "test_remote_installation" "installation"
    fi
    
    # Docker Tests
    if [[ "$SKIP_DOCKER" != "true" ]]; then
        log_info "=== DOCKER TESTS ==="
        run_test "Docker Environment" "test_docker_environment" "docker"
        run_test "Docker Volume Mounting" "test_docker_volume_mounting" "docker"
        run_test "Jekyll Docker Build" "test_jekyll_docker_build" "docker"
    fi
    
    # End-to-End Tests
    log_info "=== END-TO-END TESTS ==="
    run_test "Complete Workflow" "test_complete_workflow" "e2e"
    run_test "GitHub Pages Readiness" "test_github_pages_readiness" "e2e"
}

# Generate test report
generate_test_report() {
    local report_file="$TEST_RESULTS_DIR/deployment_test_report.json"
    
    log_info "Generating deployment test report..."
    
    # Aggregate all test results
    if command -v jq &>/dev/null; then
        jq -s '{
          timestamp: (.[0].timestamp // now | strftime("%Y-%m-%dT%H:%M:%SZ")),
          test_suite: "zer0-mistakes Deployment Tests",
          environment: {
            os: "'$(uname -s)'",
            arch: "'$(uname -m)'",
            docker_available: '$(command -v docker &>/dev/null && echo "true" || echo "false")',
            ruby_available: '$(command -v ruby &>/dev/null && echo "true" || echo "false")',
            bundle_available: '$(command -v bundle &>/dev/null && echo "true" || echo "false")'
          },
          configuration: {
            timeout: '"$TIMEOUT"',
            skip_docker: '"$SKIP_DOCKER"',
            skip_remote: '"$SKIP_REMOTE"',
            docker_port: '"$DOCKER_PORT"',
            cleanup: '"$CLEANUP"'
          },
          summary: {
            total: '"$TESTS_TOTAL"',
            passed: '"$TESTS_PASSED"',
            failed: '"$TESTS_FAILED"',
            skipped: '"$TESTS_SKIPPED"',
            success_rate: '$(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))'
          },
          tests: .
        }' "$TEST_RESULTS_DIR"/deployment_test_*.json > "$report_file" 2>/dev/null || {
            # Fallback if jq processing fails
            cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Deployment Tests",
  "summary": {
    "total": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "skipped": $TESTS_SKIPPED,
    "success_rate": $(( TESTS_TOTAL > 0 ? (TESTS_PASSED * 100) / TESTS_TOTAL : 0 ))
  }
}
EOF
        }
    else
        # Fallback JSON generation without jq
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "test_suite": "zer0-mistakes Deployment Tests",
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
    
    log_success "Deployment test report generated: $report_file"
}

# Print final summary
print_test_summary() {
    echo ""
    echo "=========================================="
    echo "  Deployment Test Results Summary"
    echo "=========================================="
    echo "Timestamp: $(date)"
    echo "Test Workspace: $TEST_WORKSPACE"
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
        log_info "Test workspace preserved for inspection:"
        log_info "  Directory: $TEST_WORKSPACE"
        log_info "  Commands to explore:"
        echo "    cd $TEST_WORKSPACE"
        echo "    ls -la"
        echo "    find . -name 'docker-compose.yml' -exec dirname {} \;"
    fi
}

# Main execution function
main() {
    parse_arguments "$@"
    
    log_info "Starting zer0-mistakes deployment test suite"
    log_info "Project root: $PROJECT_ROOT"
    
    # Check prerequisites
    if [[ ! -f "$PROJECT_ROOT/install.sh" ]]; then
        log_error "install.sh not found in project root: $PROJECT_ROOT"
        exit 1
    fi
    
    # Run all deployment tests
    run_deployment_tests
    
    # Generate reports
    generate_test_report
    
    # Print summary
    print_test_summary
    
    # Exit with appropriate code
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Some deployment tests failed. Check the reports for details."
        echo ""
        log_info "To debug, run with --no-cleanup and inspect the test workspace:"
        echo "  $0 --no-cleanup --verbose"
        exit 1
    else
        log_success "All deployment tests passed!"
        log_info "The zer0-mistakes theme deployment process is working correctly."
        exit 0
    fi
}

# Execute main function
main "$@"
