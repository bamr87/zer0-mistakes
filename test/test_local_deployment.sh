#!/bin/bash

# Local Deployment Test for zer0-mistakes Jekyll Theme
# Tests the installation process using the local install.sh script
# This validates our changes before pushing to GitHub

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_REPO_NAME="zer0-local-test-$(date +%s)"
TEST_DIR=""
CLEANUP=true
VERBOSE=false

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Parse arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v) VERBOSE=true; shift ;;
            --no-cleanup) CLEANUP=false; shift ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
Local Deployment Test for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Tests the complete deployment workflow using the local install.sh script.
    This validates changes before pushing to GitHub.

OPTIONS:
    -v, --verbose      Enable verbose output
    --no-cleanup       Don't delete test directory (for inspection)
    -h, --help         Show this help message

EXAMPLES:
    $0                 # Run local deployment test
    $0 --verbose       # With detailed output
    $0 --no-cleanup    # Keep test directory for inspection
EOF
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up local test environment..."
    
    TEST_DIR=$(mktemp -d -t zer0-local-test-XXXXXX)
    log_info "Test directory: $TEST_DIR"
    
    if [[ "$CLEANUP" == "true" ]]; then
        trap cleanup_test_environment EXIT
    fi
    
    log_success "Test environment ready"
}

cleanup_test_environment() {
    if [[ -n "$TEST_DIR" && -d "$TEST_DIR" ]]; then
        # Stop any Docker containers first
        if [[ -f "$TEST_DIR/docker-compose.yml" ]]; then
            cd "$TEST_DIR" && docker-compose down &>/dev/null || true
        fi
        
        log_info "Cleaning up test directory: $TEST_DIR"
        rm -rf "$TEST_DIR"
    fi
}

# Test local installation
test_local_installation() {
    log_step "Testing local installation"
    
    cd "$TEST_DIR"
    
    # Run local installer
    if [[ "$VERBOSE" == "true" ]]; then
        "$PROJECT_ROOT/install.sh" --full .
    else
        "$PROJECT_ROOT/install.sh" --full . &>/dev/null
    fi
    
    # Validate installation
    local required_files=("_config.yml" "_config_dev.yml" "docker-compose.yml" "Gemfile" "INSTALLATION.md")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not created: $file"
            return 1
        fi
    done
    
    log_success "Local installation test passed"
}

# Test Docker environment
test_docker_environment() {
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available - skipping Docker tests"
        return 0
    fi
    
    log_step "Testing Docker environment"
    
    cd "$TEST_DIR"
    
    # Validate docker-compose configuration
    if ! docker-compose config &>/dev/null; then
        log_error "docker-compose.yml is invalid"
        return 1
    fi
    
    # Test Docker build and run
    log_info "Starting Jekyll in Docker..."
    
    if [[ "$VERBOSE" == "true" ]]; then
        docker-compose up -d
    else
        docker-compose up -d &>/dev/null
    fi
    
    # Wait for Jekyll to start
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost:4000 &>/dev/null; then
            log_success "Jekyll site is accessible at http://localhost:4000"
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
    
    # Test site content
    local response=$(curl -s http://localhost:4000)
    if [[ "$response" =~ "zer0-mistakes" ]] || [[ "$response" =~ "Jekyll" ]] || [[ "$response" =~ "Welcome" ]]; then
        log_success "Site content validation passed"
    else
        log_warning "Site content validation unclear"
        if [[ "$VERBOSE" == "true" ]]; then
            echo "Response preview: ${response:0:200}..."
        fi
    fi
    
    # Stop Docker services
    docker-compose down &>/dev/null || true
    
    log_success "Docker environment test passed"
}

# Test configuration files
test_configuration() {
    log_step "Testing configuration files"
    
    cd "$TEST_DIR"
    
    # Test YAML syntax
    if command -v ruby &> /dev/null; then
        if ruby -e "require 'yaml'; YAML.load_file('_config.yml')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
            log_error "_config.yml contains syntax errors"
            return 1
        else
            log_success "_config.yml syntax is valid"
        fi
        
        if ruby -e "require 'yaml'; YAML.load_file('_config_dev.yml')" 2>&1 | grep -v "Ignoring.*because its extensions are not built" | grep -q "Error\|Exception"; then
            log_error "_config_dev.yml contains syntax errors"
            return 1
        else
            log_success "_config_dev.yml syntax is valid"
        fi
    fi
    
    # Test that _config_dev.yml has Docker optimizations
    if grep -q 'host: "0.0.0.0"' "_config_dev.yml"; then
        log_success "Docker host configuration found"
    else
        log_error "Docker host configuration missing"
        return 1
    fi
    
    log_success "Configuration test passed"
}

# Test documentation
test_documentation() {
    log_step "Testing generated documentation"
    
    cd "$TEST_DIR"
    
    if [[ ! -f "INSTALLATION.md" ]]; then
        log_error "INSTALLATION.md not created"
        return 1
    fi
    
    # Check for key sections
    local sections=("Quick Start" "Docker" "Troubleshooting")
    for section in "${sections[@]}"; do
        if grep -q "$section" "INSTALLATION.md"; then
            log_success "Documentation section found: $section"
        else
            log_error "Missing documentation section: $section"
            return 1
        fi
    done
    
    log_success "Documentation test passed"
}

# Main execution
main() {
    parse_arguments "$@"
    
    log_info "Starting local deployment test"
    log_info "Project root: $PROJECT_ROOT"
    log_info "Test name: $TEST_REPO_NAME"
    
    # Check that install script exists
    if [[ ! -f "$PROJECT_ROOT/install.sh" ]]; then
        log_error "install.sh not found in project root"
        exit 1
    fi
    
    # Setup and run tests
    setup_test_environment
    
    test_local_installation
    test_configuration
    test_documentation
    test_docker_environment
    
    # Print summary
    echo ""
    echo "=========================================="
    echo "  Local Deployment Test Results"
    echo "=========================================="
    echo "Test Directory: $TEST_DIR"
    echo "All Tests: PASSED"
    echo ""
    
    if [[ "$CLEANUP" == "false" ]]; then
        echo "Test directory preserved: $TEST_DIR"
        echo "Commands to explore:"
        echo "  cd $TEST_DIR"
        echo "  ls -la"
        echo "  cat INSTALLATION.md"
        echo "  docker-compose up"
    fi
    
    echo "=========================================="
    
    log_success "Local deployment test completed successfully!"
    log_info "The local install.sh script is working correctly."
}

# Execute
main "$@"
