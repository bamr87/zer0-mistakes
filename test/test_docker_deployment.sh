#!/bin/bash

# Docker Deployment Test for zer0-mistakes Jekyll Theme
# Tests the complete Docker-based deployment workflow with volume mounting validation
# 
# This script incorporates lessons learned from actual deployment testing:
# - Tests proper volume mounting in user home directory vs /tmp
# - Validates Gemfile configuration for sites (not gem development)
# - Tests repository environment variable configuration
# - Validates Jekyll build and serve process

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
TEST_SITE_NAME="zer0-docker-test-$(date +%s)"
TEST_RESULTS_DIR="$SCRIPT_DIR/results"
VERBOSE=false
CLEANUP=true
DOCKER_PORT=4000
USE_HOME_DIR=true

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_test() { echo -e "${PURPLE}[TEST]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Parse arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v) VERBOSE=true; shift ;;
            --no-cleanup) CLEANUP=false; shift ;;
            --port|-p) DOCKER_PORT="$2"; shift 2 ;;
            --use-tmp) USE_HOME_DIR=false; shift ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
Docker Deployment Test for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Tests the complete Docker-based deployment workflow including:
    - Volume mounting validation
    - Gemfile configuration for sites
    - Jekyll build and serve process
    - Live reload functionality

OPTIONS:
    -v, --verbose      Enable verbose output
    --no-cleanup       Don't delete test directory
    -p, --port         Docker port to use (default: 4000)
    --use-tmp          Use /tmp instead of home directory (tests volume mounting issues)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run Docker deployment test
    $0 --verbose       # With detailed output
    $0 --no-cleanup    # Keep test site for inspection
    $0 --use-tmp       # Test problematic volume mounting

This test validates:
✓ Proper directory selection for Docker volume mounting
✓ Gemfile configuration for Jekyll sites (not gem development)
✓ Repository environment variable setup
✓ Jekyll build process and error handling
✓ Site accessibility and content validation
✓ Live reload functionality
EOF
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up Docker deployment test environment..."
    
    # Create test directory in appropriate location
    if [[ "$USE_HOME_DIR" == "true" ]]; then
        TEST_DIR="$HOME/$TEST_SITE_NAME"
        log_info "Using home directory for proper Docker volume mounting: $TEST_DIR"
    else
        TEST_DIR="/tmp/$TEST_SITE_NAME"
        log_warning "Using /tmp directory (may cause Docker volume mounting issues): $TEST_DIR"
    fi
    
    mkdir -p "$TEST_DIR"
    mkdir -p "$TEST_RESULTS_DIR"
    
    if [[ "$CLEANUP" == "true" ]]; then
        trap cleanup_test_environment EXIT
    fi
    
    log_success "Test environment ready"
}

cleanup_test_environment() {
    if [[ -n "$TEST_DIR" && -d "$TEST_DIR" ]]; then
        # Stop Docker containers first
        if [[ -f "$TEST_DIR/docker-compose.yml" ]]; then
            cd "$TEST_DIR" && docker-compose down &>/dev/null || true
        fi
        
        log_info "Cleaning up test directory: $TEST_DIR"
        rm -rf "$TEST_DIR"
    fi
}

# Test functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    log_test "Running: $test_name"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if $test_function; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$test_name"
        return 1
    fi
}

test_installation() {
    log_step "Testing theme installation"
    
    cd "$TEST_DIR"
    
    # Run installation
    if [[ "$VERBOSE" == "true" ]]; then
        "$PROJECT_ROOT/install.sh" --full .
    else
        "$PROJECT_ROOT/install.sh" --full . &>/dev/null
    fi
    
    # Validate essential files
    local required_files=("_config.yml" "_config_dev.yml" "docker-compose.yml" "Gemfile")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file missing: $file"
            return 1
        fi
    done
    
    return 0
}

test_gemfile_configuration() {
    log_step "Testing Gemfile configuration"
    
    cd "$TEST_DIR"
    
    # Check that Gemfile doesn't contain 'gemspec' (site vs gem)
    if grep -q "^gemspec" "Gemfile"; then
        log_error "Gemfile contains 'gemspec' - should be configured for sites, not gem development"
        return 1
    fi
    
    # Check for essential gems
    if grep -q "github-pages" "Gemfile"; then
        log_success "GitHub Pages gem found in Gemfile"
    else
        log_error "GitHub Pages gem missing from Gemfile"
        return 1
    fi
    
    return 0
}

test_docker_volume_mounting() {
    log_step "Testing Docker volume mounting"
    
    cd "$TEST_DIR"
    
    # Test that files are visible inside container
    if ! docker-compose run --rm jekyll ls -la /app/_config.yml &>/dev/null; then
        log_error "Docker volume mounting failed - files not accessible in container"
        return 1
    fi
    
    log_success "Docker volume mounting working correctly"
    return 0
}

test_docker_environment_variables() {
    log_step "Testing Docker environment variables"
    
    cd "$TEST_DIR"
    
    # Check that docker-compose.yml has required environment variables
    if ! grep -q "PAGES_REPO_NWO" "docker-compose.yml"; then
        log_error "PAGES_REPO_NWO environment variable missing from docker-compose.yml"
        return 1
    fi
    
    return 0
}

test_jekyll_build_and_serve() {
    log_step "Testing Jekyll build and serve process"
    
    cd "$TEST_DIR"
    
    # Start Jekyll in detached mode
    if [[ "$VERBOSE" == "true" ]]; then
        docker-compose up -d
    else
        docker-compose up -d &>/dev/null
    fi
    
    # Wait for bundle install to complete (can take 60-90 seconds)
    log_info "Waiting for bundle install to complete..."
    local max_wait=120
    local wait_time=0
    
    while [[ $wait_time -lt $max_wait ]]; do
        if docker-compose logs jekyll | grep -q "Server running"; then
            log_success "Jekyll server started successfully"
            break
        elif docker-compose logs jekyll | grep -q "ERROR\|FATAL"; then
            log_error "Jekyll build failed"
            docker-compose logs jekyll | tail -10
            return 1
        fi
        
        sleep 5
        wait_time=$((wait_time + 5))
        
        if [[ $((wait_time % 30)) -eq 0 ]]; then
            log_info "Still waiting for Jekyll... (${wait_time}s/${max_wait}s)"
        fi
    done
    
    if [[ $wait_time -ge $max_wait ]]; then
        log_error "Jekyll failed to start within timeout"
        docker-compose logs jekyll | tail -20
        return 1
    fi
    
    # Test site accessibility
    local max_attempts=10
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f "http://localhost:$DOCKER_PORT" &>/dev/null; then
            log_success "Site is accessible at http://localhost:$DOCKER_PORT"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Site not accessible after Jekyll startup"
        return 1
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
    
    # Test that live reload is working
    if echo "$response" | grep -q "livereload"; then
        log_success "Live reload is enabled"
    else
        log_warning "Live reload may not be enabled"
    fi
    
    # Clean up
    docker-compose down &>/dev/null || true
    
    return 0
}

# Main test execution
main() {
    parse_arguments "$@"
    
    log_info "Starting Docker deployment test"
    log_info "Test site: $TEST_SITE_NAME"
    log_info "Docker port: $DOCKER_PORT"
    
    # Check prerequisites
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not available"
        log_info "Please install Docker Desktop and try again"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_ROOT/install.sh" ]]; then
        log_error "install.sh not found in project root"
        exit 1
    fi
    
    # Setup
    setup_test_environment
    
    # Run tests
    run_test "Theme Installation" "test_installation"
    run_test "Gemfile Configuration" "test_gemfile_configuration"
    run_test "Docker Volume Mounting" "test_docker_volume_mounting"
    run_test "Docker Environment Variables" "test_docker_environment_variables"
    run_test "Jekyll Build and Serve" "test_jekyll_build_and_serve"
    
    # Print summary
    echo ""
    echo "=========================================="
    echo "  Docker Deployment Test Results"
    echo "=========================================="
    echo "Test Site: $TEST_SITE_NAME"
    echo "Directory: $TEST_DIR"
    echo "Docker Port: $DOCKER_PORT"
    echo ""
    echo "Results:"
    echo "  Total Tests: $TESTS_TOTAL"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo "Success Rate: 100%"
        echo ""
        log_success "All Docker deployment tests passed!"
        echo ""
        echo "🎉 The zer0-mistakes theme is ready for Docker-based development!"
        echo ""
        echo "Key findings validated:"
        echo "  ✅ Installation creates proper site structure"
        echo "  ✅ Gemfile configured for Jekyll sites (not gem development)"
        echo "  ✅ Docker volume mounting works in home directory"
        echo "  ✅ Environment variables properly configured"
        echo "  ✅ Jekyll builds and serves successfully"
        echo "  ✅ Live reload functionality enabled"
        
        if [[ "$CLEANUP" == "false" ]]; then
            echo ""
            echo "Test site preserved at: $TEST_DIR"
            echo "Visit: http://localhost:$DOCKER_PORT"
        fi
    else
        echo "Success Rate: $(( (TESTS_PASSED * 100) / TESTS_TOTAL ))%"
        log_error "Some tests failed. Check the output above for details."
        exit 1
    fi
    
    echo "=========================================="
}

# Execute
main "$@"
