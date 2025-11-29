#!/bin/bash

###############################################################################
# Mermaid Integration Test Script
# 
# Purpose: Comprehensive testing of Mermaid.js integration in Jekyll
# Usage: ./test-mermaid.sh [options]
# Options:
#   --verbose    Show detailed output
#   --headless   Run in headless mode (for CI/CD)
#   --quick      Run quick validation only
#   --local      Test local Jekyll server
#   --docker     Test Docker container
###############################################################################

# Note: Removed -e flag to avoid SIGPIPE issues with pipelines (curl | grep)
set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Configuration
VERBOSE=false
HEADLESS=false
QUICK=false
TEST_MODE="both"  # local, docker, both

# Parse arguments
for arg in "$@"; do
  case $arg in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --headless)
      HEADLESS=true
      shift
      ;;
    --quick)
      QUICK=true
      shift
      ;;
    --local)
      TEST_MODE="local"
      shift
      ;;
    --docker)
      TEST_MODE="docker"
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --verbose    Show detailed output"
      echo "  --headless   Run in headless mode (for CI/CD)"
      echo "  --quick      Run quick validation only"
      echo "  --local      Test local Jekyll server only"
      echo "  --docker     Test Docker container only"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$VERBOSE" = true ]; then
        log_info "Running: $test_name"
    fi
    
    if eval "$test_command" >/dev/null 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$test_name"
        return 1
    fi
}

# Test file existence
test_file_exists() {
    local file_path="$1"
    local description="$2"
    
    run_test "$description" "[ -f '$file_path' ]"
}

# Test file content
test_file_content() {
    local file_path="$1"
    local pattern="$2"
    local description="$3"
    
    run_test "$description" "grep -q '$pattern' '$file_path'"
}

# Test URL accessibility
test_url() {
    local url="$1"
    local description="$2"
    
    run_test "$description" "curl -s -f '$url' >/dev/null"
}

# Test Mermaid script loading
test_mermaid_script() {
    local url="$1"
    local description="$2"
    local response
    local count
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    response=$(curl -s "$url" 2>/dev/null) || true
    count=$(echo "$response" | grep -c 'mermaid.min.js' || true)
    if [ "$count" -gt 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$description"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$description"
        return 1
    fi
}

# Test Mermaid initialization
test_mermaid_init() {
    local url="$1"
    local description="$2"
    local response
    local count
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    response=$(curl -s "$url" 2>/dev/null) || true
    count=$(echo "$response" | grep -c 'mermaid.initialize' || true)
    if [ "$count" -gt 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$description"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$description"
        return 1
    fi
}

# Test diagram rendering
test_diagram_rendering() {
    local url="$1"
    local description="$2"
    local response
    local count
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    response=$(curl -s "$url" 2>/dev/null) || true
    count=$(echo "$response" | grep -c 'class="mermaid"' || true)
    if [ "$count" -gt 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$description"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$description"
        return 1
    fi
}

# Main test execution
main() {
    echo "🧪 Mermaid Integration Test Suite"
    echo "=================================="
    echo "Mode: $TEST_MODE"
    echo "Verbose: $VERBOSE"
    echo "Quick: $QUICK"
    echo ""
    
    # Core file tests
    log_info "Testing core files..."
    
    test_file_exists "_includes/components/mermaid.html" "Mermaid include file exists"
    test_file_exists "docs/jekyll/mermaid.md" "Main documentation exists"
    test_file_exists "docs/jekyll/mermaid-test-suite.md" "Test suite exists"
    test_file_exists "docs/jekyll/jekyll-diagram-with-mermaid.md" "Tutorial exists"
    
    # Configuration tests
    log_info "Testing configuration..."
    
    test_file_content "_config.yml" "jekyll-mermaid" "Jekyll-mermaid plugin configured"
    test_file_content "_config.yml" "mermaid:" "Mermaid configuration present"
    test_file_content "_includes/core/head.html" "page.mermaid" "Conditional loading configured"
    test_file_content "_includes/core/head.html" "mermaid.html" "Mermaid include referenced"
    
    # Mermaid include file tests
    log_info "Testing Mermaid include file..."
    
    test_file_content "_includes/components/mermaid.html" "mermaid@10" "Mermaid v10 CDN link"
    test_file_content "_includes/components/mermaid.html" "mermaid.initialize" "Mermaid initialization script"
    test_file_content "_includes/components/mermaid.html" "forest" "Forest theme configured"
    test_file_content "_includes/components/mermaid.html" "FontAwesome" "FontAwesome support included"
    
    # Documentation tests
    log_info "Testing documentation..."
    
    test_file_content "docs/jekyll/mermaid.md" "mermaid: true" "Main docs have front matter"
    test_file_content "docs/jekyll/mermaid-test-suite.md" "mermaid: true" "Test suite has front matter"
    test_file_content "docs/jekyll/mermaid.md" "graph TD" "Main docs have examples"
    test_file_content "docs/jekyll/mermaid-test-suite.md" "graph TD" "Test suite has examples"
    
    # Server tests (if not quick mode)
    if [ "$QUICK" = false ]; then
        log_info "Testing server functionality..."
        
        # Test local server if enabled
        if [ "$TEST_MODE" = "local" ] || [ "$TEST_MODE" = "both" ]; then
            log_info "Testing local Jekyll server..."
            
            # Check if local server is running
            if curl -s -f "http://localhost:4000" >/dev/null 2>&1; then
                test_url "http://localhost:4000/docs/jekyll/mermaid/" "Main documentation accessible"
                test_url "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Test suite accessible"
                test_mermaid_script "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Mermaid script loads on test page"
                test_mermaid_init "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Mermaid initializes on test page"
                test_diagram_rendering "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Diagrams render on test page"
            else
                log_warning "Local Jekyll server not running. Start with: bundle exec jekyll serve"
            fi
        fi
        
        # Test Docker server if enabled
        if [ "$TEST_MODE" = "docker" ] || [ "$TEST_MODE" = "both" ]; then
            log_info "Testing Docker container..."
            
            # Check if Docker container is running
            if docker ps | grep -q "zer0-mistakes-jekyll"; then
                test_url "http://localhost:4000/docs/jekyll/mermaid/" "Docker: Main documentation accessible"
                test_url "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Docker: Test suite accessible"
                test_mermaid_script "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Docker: Mermaid script loads"
                test_mermaid_init "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Docker: Mermaid initializes"
                test_diagram_rendering "http://localhost:4000/docs/jekyll/mermaid-test-suite/" "Docker: Diagrams render"
            else
                log_warning "Docker container not running. Start with: docker-compose up -d"
            fi
        fi
    fi
    
    # Summary
    echo ""
    echo "📊 Test Results Summary"
    echo "======================"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed! ✅"
        exit 0
    else
        log_error "Some tests failed! ❌"
        exit 1
    fi
}

# Run main function
main "$@"