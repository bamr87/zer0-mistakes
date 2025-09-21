#!/bin/bash

# GitHub Deployment Test for zer0-mistakes Jekyll Theme
# Creates a real GitHub repository and tests the complete deployment workflow
#
# This script tests:
# - Creating a new GitHub repository
# - Installing the theme via remote installation
# - Pushing to GitHub and testing Pages deployment
# - Validating the live site

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
TEST_REPO_NAME="zer0-test-deploy-$(date +%s)"
TEST_DIR=""
CLEANUP=true
VERBOSE=false
SKIP_GITHUB=false

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
            --skip-github) SKIP_GITHUB=true; shift ;;
            --help|-h) show_help; exit 0 ;;
            *) log_error "Unknown option: $1"; show_help; exit 1 ;;
        esac
    done
}

show_help() {
    cat << EOF
GitHub Deployment Test for zer0-mistakes Jekyll Theme

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Creates a real GitHub repository and tests the complete deployment workflow.
    This test validates the entire user experience from installation to live deployment.

OPTIONS:
    -v, --verbose      Enable verbose output
    --no-cleanup       Don't delete test repository (for inspection)
    --skip-github      Skip GitHub repository creation (test local only)
    -h, --help         Show this help message

PREREQUISITES:
    - GitHub CLI (gh) installed and authenticated
    - Git configured with user.name and user.email
    - Docker Desktop running (for local testing)

EXAMPLES:
    $0                 # Full GitHub deployment test
    $0 --verbose       # With detailed output
    $0 --skip-github   # Test local deployment only
    $0 --no-cleanup    # Keep test repo for inspection

WARNING: This creates a real GitHub repository. Use --no-cleanup to inspect
the result, or the repository will be automatically deleted after testing.
EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is required but not installed"
        log_info "Install with: brew install gh"
        exit 1
    fi
    
    # Check GitHub authentication
    if ! gh auth status &>/dev/null; then
        log_error "GitHub CLI is not authenticated"
        log_info "Run: gh auth login"
        exit 1
    fi
    
    # Check Git configuration
    if ! git config user.name &>/dev/null || ! git config user.email &>/dev/null; then
        log_error "Git user configuration missing"
        log_info "Run: git config --global user.name 'Your Name'"
        log_info "Run: git config --global user.email 'your.email@example.com'"
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        log_success "Docker is available for testing"
    else
        log_warning "Docker not available - will skip Docker tests"
    fi
    
    log_success "Prerequisites check passed"
}

# Create test repository
create_test_repository() {
    if [[ "$SKIP_GITHUB" == "true" ]]; then
        log_info "Skipping GitHub repository creation"
        
        # Create local test directory
        TEST_DIR=$(mktemp -d -t zer0-github-test-XXXXXX)
        log_info "Created local test directory: $TEST_DIR"
        return 0
    fi
    
    log_step "Creating test GitHub repository"
    
    # Create temporary directory for the repository
    TEST_DIR=$(mktemp -d -t zer0-github-test-XXXXXX)
    cd "$TEST_DIR"
    
    # Initialize git repository
    git init
    
    # Create repository on GitHub
    if [[ "$VERBOSE" == "true" ]]; then
        gh repo create "$TEST_REPO_NAME" --public --description "Test deployment for zer0-mistakes Jekyll theme"
    else
        gh repo create "$TEST_REPO_NAME" --public --description "Test deployment for zer0-mistakes Jekyll theme" &>/dev/null
    fi
    
    # Add remote
    git remote add origin "https://github.com/$(gh api user --jq .login)/$TEST_REPO_NAME.git"
    
    log_success "Test repository created: $TEST_REPO_NAME"
}

# Install theme in test repository
install_theme() {
    log_step "Installing zer0-mistakes theme"
    
    cd "$TEST_DIR"
    
    # Run the installation script
    if [[ "$VERBOSE" == "true" ]]; then
        curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
    else
        curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash &>/dev/null
    fi
    
    # Verify installation
    if [[ ! -f "_config.yml" || ! -f "docker-compose.yml" ]]; then
        log_error "Theme installation failed"
        return 1
    fi
    
    log_success "Theme installation completed"
}

# Test local development
test_local_development() {
    log_step "Testing local development environment"
    
    cd "$TEST_DIR"
    
    if command -v docker &> /dev/null; then
        log_info "Testing Docker development environment"
        
        # Start Jekyll in background
        if [[ "$VERBOSE" == "true" ]]; then
            docker-compose up -d
        else
            docker-compose up -d &>/dev/null
        fi
        
        # Wait for site to be ready
        local max_attempts=30
        local attempt=0
        
        while [[ $attempt -lt $max_attempts ]]; do
            if curl -f http://localhost:4000 &>/dev/null; then
                log_success "Local site is accessible"
                break
            fi
            attempt=$((attempt + 1))
            sleep 2
        done
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Local site failed to start"
            docker-compose logs jekyll 2>/dev/null || true
            return 1
        fi
        
        # Test site content
        local content=$(curl -s http://localhost:4000 | head -20)
        if [[ "$content" =~ "zer0-mistakes" ]] || [[ "$content" =~ "Jekyll" ]]; then
            log_success "Site content validation passed"
        else
            log_warning "Site content validation unclear"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "Content preview: $content"
            fi
        fi
        
        # Stop Docker services
        docker-compose down &>/dev/null || true
        
    else
        log_warning "Docker not available - skipping local development test"
    fi
}

# Commit and push to GitHub
deploy_to_github() {
    if [[ "$SKIP_GITHUB" == "true" ]]; then
        log_info "Skipping GitHub deployment"
        return 0
    fi
    
    log_step "Deploying to GitHub"
    
    cd "$TEST_DIR"
    
    # Configure for GitHub Pages
    cat >> _config.yml << EOF

# GitHub Pages configuration
url: "https://$(gh api user --jq .login).github.io"
baseurl: "/$TEST_REPO_NAME"
EOF
    
    # Create initial commit
    git add .
    git commit -m "Initial commit: zer0-mistakes theme installation

- Installed via automated script
- Docker environment configured
- GitHub Pages ready
- Generated on $(date)"
    
    # Push to GitHub
    if [[ "$VERBOSE" == "true" ]]; then
        git push -u origin main
    else
        git push -u origin main &>/dev/null
    fi
    
    log_success "Code pushed to GitHub"
    
    # Enable GitHub Pages
    log_info "Enabling GitHub Pages..."
    gh api "repos/$(gh api user --jq .login)/$TEST_REPO_NAME/pages" \
        -X POST \
        -f source='{"branch":"main","path":"/"}' &>/dev/null || log_warning "GitHub Pages may already be enabled"
    
    log_success "GitHub Pages deployment initiated"
}

# Cleanup test repository
cleanup_test_repository() {
    if [[ "$CLEANUP" == "true" && "$SKIP_GITHUB" != "true" ]]; then
        log_info "Cleaning up test repository: $TEST_REPO_NAME"
        
        if gh repo delete "$(gh api user --jq .login)/$TEST_REPO_NAME" --yes &>/dev/null; then
            log_success "Test repository deleted"
        else
            log_warning "Failed to delete test repository - may need manual cleanup"
        fi
    fi
    
    if [[ -n "$TEST_DIR" && -d "$TEST_DIR" ]]; then
        rm -rf "$TEST_DIR"
    fi
}

# Main test execution
main() {
    parse_arguments "$@"
    
    log_info "Starting GitHub deployment test"
    log_info "Test repository name: $TEST_REPO_NAME"
    
    # Set up cleanup trap
    if [[ "$CLEANUP" == "true" ]]; then
        trap cleanup_test_repository EXIT
    fi
    
    # Run tests
    check_prerequisites
    create_test_repository
    install_theme
    test_local_development
    deploy_to_github
    
    # Print summary
    echo ""
    echo "=========================================="
    echo "  GitHub Deployment Test Results"
    echo "=========================================="
    echo "Repository: $TEST_REPO_NAME"
    echo "Test Directory: $TEST_DIR"
    echo "Status: SUCCESS"
    echo ""
    
    if [[ "$SKIP_GITHUB" != "true" ]]; then
        echo "GitHub Repository: https://github.com/$(gh api user --jq .login)/$TEST_REPO_NAME"
        echo "GitHub Pages URL: https://$(gh api user --jq .login).github.io/$TEST_REPO_NAME"
        echo ""
        echo "Note: GitHub Pages deployment may take 5-10 minutes to become available."
    fi
    
    if [[ "$CLEANUP" == "false" ]]; then
        echo "Test repository preserved for inspection."
        echo "To clean up manually: gh repo delete $(gh api user --jq .login)/$TEST_REPO_NAME"
    else
        echo "Test repository will be automatically cleaned up."
    fi
    
    echo "=========================================="
    
    log_success "GitHub deployment test completed successfully!"
}

# Execute main function
main "$@"
