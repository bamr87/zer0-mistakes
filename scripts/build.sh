#!/bin/bash

# Build and publish script for zer0-mistakes Jekyll theme
# Usage: ./scripts/build.sh [--publish] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PUBLISH=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --publish)
            PUBLISH=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to log messages
log() {
    echo -e "${GREEN}[BUILD]${NC} $1"
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

# Check if gemspec exists
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "jekyll-theme-zer0.gemspec not found"
fi

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    error "package.json not found"
fi

# Get version from package.json
VERSION=$(jq -r '.version' package.json)
if [[ "$VERSION" == "null" ]]; then
    error "Could not read version from package.json"
fi

log "Building jekyll-theme-zer0 version $VERSION"

# Create build directory
log "Creating build directory..."
mkdir -p build

# Clean up old gem files
log "Cleaning up old gem files..."
rm -f jekyll-theme-zer0-*.gem
rm -f build/jekyll-theme-zer0-*.gem

# Validate dependencies
log "Checking dependencies..."
if ! command -v bundle &> /dev/null; then
    error "Bundler is not installed. Run 'gem install bundler' first."
fi

if ! command -v jq &> /dev/null; then
    error "jq is not installed. Run 'brew install jq' (macOS) or appropriate package manager."
fi

# Run bundle install to ensure dependencies are up to date
log "Installing/updating dependencies..."
if [[ "$DRY_RUN" != true ]]; then
    bundle install
fi

# Validate gemspec
log "Validating gemspec..."
if [[ "$DRY_RUN" != true ]]; then
    ruby -c jekyll-theme-zer0.gemspec > /dev/null
    info "✓ Gemspec is valid"
fi

# Build the gem
log "Building gem..."
if [[ "$DRY_RUN" == true ]]; then
    log "Dry run mode - would build jekyll-theme-zer0-${VERSION}.gem"
else
    if gem build jekyll-theme-zer0.gemspec; then
        # Move gem to build directory
        mv jekyll-theme-zer0-${VERSION}.gem build/
        info "✓ Successfully built jekyll-theme-zer0-${VERSION}.gem"
    else
        error "Failed to build gem"
    fi
fi

# List gem contents for verification
if [[ "$DRY_RUN" != true ]] && [[ -f "build/jekyll-theme-zer0-${VERSION}.gem" ]]; then
    log "Gem contents:"
    # Use tar to list contents since gem contents only works for installed gems
    tar -tzf build/jekyll-theme-zer0-${VERSION}.gem | head -20
    echo "..."
    echo "Total files: $(tar -tzf build/jekyll-theme-zer0-${VERSION}.gem | wc -l)"
fi

# Check if we should publish
if [[ "$PUBLISH" == true ]]; then
    if [[ "$DRY_RUN" == true ]]; then
        log "Dry run mode - would publish jekyll-theme-zer0-${VERSION}.gem to RubyGems"
    else
        log "Publishing gem to RubyGems..."
        
        # Check if user is authenticated with RubyGems
        if [[ ! -f ~/.gem/credentials ]]; then
            error "Not authenticated with RubyGems. Run 'gem signin' first."
        fi
        
        # Check if this version already exists on RubyGems
        if gem list --remote jekyll-theme-zer0 | grep -q "jekyll-theme-zer0 (${VERSION})"; then
            warn "Version ${VERSION} already exists on RubyGems"
            echo -e "${YELLOW}You need to bump the version first. Use ./scripts/version.sh --bump [--major|--minor|--patch]${NC}"
            error "Cannot republish existing version ${VERSION}"
        fi
        
        # Confirm publication
        echo -e "${YELLOW}Are you sure you want to publish jekyll-theme-zer0-${VERSION}.gem to RubyGems? (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if gem push build/jekyll-theme-zer0-${VERSION}.gem; then
                info "✓ Successfully published jekyll-theme-zer0-${VERSION}.gem"
                log "Gem is now available at: https://rubygems.org/gems/jekyll-theme-zer0"
            else
                error "Failed to publish gem"
            fi
        else
            log "Publication cancelled"
        fi
    fi
else
    log "Build complete! Gem file: jekyll-theme-zer0-${VERSION}.gem"
    log "To publish, run: ./scripts/build.sh --publish"
fi

# Cleanup option
if [[ "$PUBLISH" == true ]] && [[ "$DRY_RUN" != true ]]; then
    echo -e "${YELLOW}Remove local gem file? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -f build/jekyll-theme-zer0-${VERSION}.gem
        log "Local gem file removed"
    fi
fi
