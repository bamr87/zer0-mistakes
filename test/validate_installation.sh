#!/bin/bash

# Installation Validation Script for zer0-mistakes Jekyll Theme
# Quick validation that doesn't require Docker to work

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=========================================="
echo "  zer0-mistakes Installation Validator"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Project: $PROJECT_ROOT"
echo ""

# Test 1: Full installation
log_info "Testing full installation process..."

TEST_DIR=$(mktemp -d -t zer0-validate-XXXXXX)
cd "$TEST_DIR"

if "$PROJECT_ROOT/install.sh" --full . &>/dev/null; then
    log_success "Installation script executed successfully"
else
    log_error "Installation script failed"
    exit 1
fi

# Validate files
FILES=("_config.yml" "_config_dev.yml" "docker-compose.yml" "Gemfile" "index.md" "INSTALLATION.md")
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_success "✓ $file"
    else
        log_error "✗ $file missing"
        exit 1
    fi
done

# Validate directories
DIRS=("_data" "_includes" "_layouts" "_sass" "assets")
for dir in "${DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        log_success "✓ $dir/"
    else
        log_error "✗ $dir/ missing"
        exit 1
    fi
done

# Check YAML syntax if Ruby available
if command -v ruby &>/dev/null; then
    if ruby -e "require 'yaml'; YAML.load_file('_config.yml')" 2>/dev/null; then
        log_success "✓ _config.yml syntax valid"
    else
        log_warning "⚠ _config.yml syntax check failed (may be due to gem warnings)"
    fi
fi

cd - > /dev/null
rm -rf "$TEST_DIR"

echo ""

# Test 2: Minimal installation
log_info "Testing minimal installation..."

TEST_DIR=$(mktemp -d -t zer0-minimal-XXXXXX)
cd "$TEST_DIR"

if "$PROJECT_ROOT/install.sh" --minimal . &>/dev/null; then
    log_success "Minimal installation executed successfully"
else
    log_error "Minimal installation failed"
    exit 1
fi

# Validate minimal files
MINIMAL_FILES=("_config.yml" "Gemfile" "index.md" "INSTALLATION.md")
for file in "${MINIMAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_success "✓ $file"
    else
        log_error "✗ $file missing"
        exit 1
    fi
done

# Ensure full installation files are NOT present
SHOULD_NOT_EXIST=("docker-compose.yml" "_includes" "_layouts")
for item in "${SHOULD_NOT_EXIST[@]}"; do
    if [[ -e "$item" ]]; then
        log_error "✗ $item should not exist in minimal installation"
        exit 1
    else
        log_success "✓ $item correctly excluded"
    fi
done

cd - > /dev/null
rm -rf "$TEST_DIR"

echo ""

# Test 3: Documentation validation
log_info "Validating documentation..."

if [[ -f "$PROJECT_ROOT/README.md" ]]; then
    README_CONTENT=$(cat "$PROJECT_ROOT/README.md")
    
    if echo "$README_CONTENT" | grep -q "curl -fsSL"; then
        log_success "✓ Installation command found in README"
    else
        log_warning "⚠ Installation command not found in README"
    fi
    
    SECTIONS=("Quick Start" "Prerequisites" "Troubleshooting")
    for section in "${SECTIONS[@]}"; do
        if echo "$README_CONTENT" | grep -q "$section"; then
            log_success "✓ $section section found"
        else
            log_warning "⚠ $section section missing"
        fi
    done
else
    log_error "✗ README.md not found"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Validation Results: ALL PASSED ✓"
echo "=========================================="
echo ""
log_success "zer0-mistakes installation system is working correctly!"
echo ""
echo "Users can now run:"
echo "  curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash"
echo ""
echo "Or for local development:"
echo "  git clone https://github.com/bamr87/zer0-mistakes.git"
echo "  cd zer0-mistakes"
echo "  ./install.sh ../my-new-site"
echo ""
echo "Note: Docker functionality requires Docker Desktop to be running"
echo "      and proper volume mounting configuration."
echo ""