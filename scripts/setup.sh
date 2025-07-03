#!/bin/bash

# Development setup script for zer0-mistakes Jekyll theme
# Usage: ./scripts/setup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log "Setting up zer0-mistakes Jekyll theme development environment..."

# Check system requirements
log "Checking system requirements..."

# Check Ruby
if ! command -v ruby &> /dev/null; then
    error "Ruby is not installed. Please install Ruby >= 2.7.0"
fi

RUBY_VERSION=$(ruby --version | awk '{print $2}')
log "Ruby version: $RUBY_VERSION"

# Check Bundler
if ! command -v bundle &> /dev/null; then
    log "Installing Bundler..."
    gem install bundler
fi

# Check jq
if ! command -v jq &> /dev/null; then
    warn "jq is not installed. Installing via Homebrew (macOS)..."
    if command -v brew &> /dev/null; then
        brew install jq
    else
        error "jq is required but not installed. Please install jq manually."
    fi
fi

# Check Git
if ! command -v git &> /dev/null; then
    error "Git is not installed"
fi

# Install dependencies
log "Installing Ruby dependencies..."
bundle install

# Make scripts executable
log "Making scripts executable..."
chmod +x scripts/*.sh

# Validate gemspec
log "Validating gemspec..."
if gem specification jekyll-theme-zer0.gemspec > /dev/null 2>&1; then
    info "✓ Gemspec is valid"
else
    error "Gemspec validation failed"
fi

# Create CHANGELOG if it doesn't exist
if [[ ! -f "CHANGELOG.md" ]]; then
    log "Creating CHANGELOG.md..."
    cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial development setup

EOF
fi

# Create .gitignore additions for gem development
if ! grep -q "*.gem" .gitignore 2>/dev/null; then
    log "Adding gem development entries to .gitignore..."
    cat >> .gitignore << 'EOF'

# Gem development
*.gem
.bundle/
vendor/
pkg/
EOF
fi

# Setup Git hooks (optional)
if [[ -d ".git" ]]; then
    log "Setting up Git hooks..."
    mkdir -p .git/hooks
    
    # Pre-commit hook to run basic validations
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for zer0-mistakes Jekyll theme

echo "Running pre-commit validations..."

# Validate gemspec
if ! gem specification jekyll-theme-zer0.gemspec > /dev/null 2>&1; then
    echo "❌ Gemspec validation failed"
    exit 1
fi

# Check if package.json version is valid
if ! jq -e '.version' package.json > /dev/null 2>&1; then
    echo "❌ Invalid version in package.json"
    exit 1
fi

echo "✅ Pre-commit validations passed"
EOF
    chmod +x .git/hooks/pre-commit
fi

log "Setup complete!"
log ""
log "Available commands:"
log "  ./scripts/version.sh [patch|minor|major]  - Bump version"
log "  ./scripts/build.sh [--publish]            - Build (and optionally publish) gem"
log "  ./scripts/test.sh                         - Run tests"
log ""
log "Development workflow:"
log "1. Make your changes"
log "2. Run ./scripts/test.sh to validate"
log "3. Run ./scripts/version.sh to bump version"
log "4. Run ./scripts/build.sh --publish to release"
