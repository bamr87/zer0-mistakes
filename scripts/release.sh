#!/bin/bash

# Release deployment script for Jekyll Theme Zer0
# Usage: ./scripts/release.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
SKIP_TESTS=false
SKIP_BUILD=false
SKIP_PUBLISH=false
CREATE_GITHUB_RELEASE=true
DRAFT_RELEASE=false
PRERELEASE=false

# Function to show usage
show_usage() {
    cat << EOF
🚀 Jekyll Theme Zer0 Release Deployment Script

USAGE:
    ./scripts/release.sh [OPTIONS]

OPTIONS:
    --dry-run                 Show what would be done without making changes
    --skip-tests             Skip running tests before release
    --skip-build             Skip building the gem
    --skip-publish           Skip publishing to RubyGems
    --no-github-release      Skip creating GitHub release
    --draft                  Create GitHub release as draft
    --prerelease             Mark GitHub release as prerelease
    --help                   Show this help message

EXAMPLES:
    ./scripts/release.sh                    # Full release deployment
    ./scripts/release.sh --dry-run          # Preview what would happen
    ./scripts/release.sh --draft            # Create draft GitHub release
    ./scripts/release.sh --skip-publish     # Build and test but don't publish

WORKFLOW:
    1. Validate current state (git clean, version consistency)
    2. Run tests (unless --skip-tests)
    3. Build gem (unless --skip-build)
    4. Publish to RubyGems (unless --skip-publish)
    5. Create GitHub Release (unless --no-github-release)

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-publish)
            SKIP_PUBLISH=true
            shift
            ;;
        --no-github-release)
            CREATE_GITHUB_RELEASE=false
            shift
            ;;
        --draft)
            DRAFT_RELEASE=true
            shift
            ;;
        --prerelease)
            PRERELEASE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Function to log messages
log() {
    echo -e "${GREEN}[RELEASE]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

dry_run() {
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would execute: $1"
        return 0
    else
        return 1
    fi
}

# Header
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🚀 Jekyll Theme Zer0 Release${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

if [[ "$DRY_RUN" == true ]]; then
    warn "DRY RUN MODE - No changes will be made"
    echo ""
fi

# Check if we're in the right directory
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "Must be run from the repository root directory"
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Get current version
if [[ ! -f "lib/jekyll-theme-zer0/version.rb" ]]; then
    error "Version file not found: lib/jekyll-theme-zer0/version.rb"
fi

CURRENT_VERSION=$(grep -o 'VERSION = "[^"]*"' lib/jekyll-theme-zer0/version.rb | sed 's/VERSION = "\(.*\)"/\1/')
if [[ -z "$CURRENT_VERSION" ]]; then
    error "Could not read version from lib/jekyll-theme-zer0/version.rb"
fi

TAG="v$CURRENT_VERSION"
GEM_FILE="jekyll-theme-zer0-$CURRENT_VERSION.gem"

log "Current version: $CURRENT_VERSION"
log "Release tag: $TAG"
log "Gem file: $GEM_FILE"
echo ""

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    error "Working directory is not clean. Please commit or stash changes first."
fi

# Check if tag already exists
if git tag -l | grep -q "^$TAG$"; then
    warn "Tag $TAG already exists"
    if [[ "$DRY_RUN" == false ]]; then
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Release cancelled"
            exit 0
        fi
    fi
fi

# Step 1: Run tests
if [[ "$SKIP_TESTS" == false ]]; then
    log "Step 1: Running tests..."
    if dry_run "./test/test_runner.sh --verbose"; then
        info "Would run tests"
    else
        if [[ -x "./test/test_runner.sh" ]]; then
            ./test/test_runner.sh --verbose
        else
            warn "Test runner not found or not executable, skipping tests"
        fi
    fi
    echo ""
else
    warn "Skipping tests (--skip-tests specified)"
    echo ""
fi

# Step 2: Build gem
if [[ "$SKIP_BUILD" == false ]]; then
    log "Step 2: Building gem..."
    if dry_run "./scripts/build.sh"; then
        info "Would build gem: $GEM_FILE"
    else
        ./scripts/build.sh
        if [[ ! -f "$GEM_FILE" ]]; then
            error "Gem build failed - $GEM_FILE not found"
        fi
        info "✅ Gem built successfully: $GEM_FILE"
    fi
    echo ""
else
    warn "Skipping gem build (--skip-build specified)"
    echo ""
fi

# Step 3: Publish to RubyGems
if [[ "$SKIP_PUBLISH" == false ]]; then
    log "Step 3: Publishing to RubyGems..."
    if dry_run "gem push $GEM_FILE"; then
        info "Would publish gem to RubyGems"
    else
        if [[ ! -f "$GEM_FILE" ]]; then
            error "Gem file not found: $GEM_FILE. Run with --skip-build=false first."
        fi
        
        # Check if we have RubyGems credentials
        if [[ ! -f ~/.gem/credentials ]]; then
            error "RubyGems credentials not found. Run 'gem signin' first."
        fi
        
        gem push "$GEM_FILE"
        info "✅ Gem published to RubyGems successfully"
    fi
    echo ""
else
    warn "Skipping RubyGems publication (--skip-publish specified)"
    echo ""
fi

# Step 4: Create GitHub Release
if [[ "$CREATE_GITHUB_RELEASE" == true ]]; then
    log "Step 4: Creating GitHub Release..."
    
    # Check if gh CLI is available
    if command -v gh >/dev/null 2>&1; then
        # Extract release notes from CHANGELOG.md
        RELEASE_NOTES=""
        if [[ -f "CHANGELOG.md" ]]; then
            RELEASE_NOTES=$(awk -v version="$CURRENT_VERSION" '
                /^## \[/ {
                    if (found) exit
                    if ($0 ~ "\\[" version "\\]") found=1
                    next
                }
                found && /^## \[/ { exit }
                found && !/^## \[/ { print }
            ' CHANGELOG.md | sed '/^$/d')
        fi
        
        if [[ -z "$RELEASE_NOTES" ]]; then
            RELEASE_NOTES="### Changed
- Released version $CURRENT_VERSION"
        fi
        
        # Create release notes file
        echo "$RELEASE_NOTES" > release_notes.md
        
        DRAFT_FLAG=""
        PRERELEASE_FLAG=""
        
        if [[ "$DRAFT_RELEASE" == true ]]; then
            DRAFT_FLAG="--draft"
        fi
        
        if [[ "$PRERELEASE" == true ]] || [[ "$CURRENT_VERSION" =~ (rc|beta|alpha) ]]; then
            PRERELEASE_FLAG="--prerelease"
        fi
        
        if dry_run "gh release create $TAG"; then
            info "Would create GitHub release: $TAG"
            info "Draft: $DRAFT_RELEASE, Prerelease: $PRERELEASE"
        else
            # Create or check if tag exists
            if ! git tag -l | grep -q "^$TAG$"; then
                git tag -a "$TAG" -m "Release version $CURRENT_VERSION"
                git push origin "$TAG"
            fi
            
            gh release create "$TAG" \
                --title "🚀 Jekyll Theme Zer0 v$CURRENT_VERSION" \
                --notes-file release_notes.md \
                $DRAFT_FLAG \
                $PRERELEASE_FLAG \
                "$GEM_FILE" \
                "release_notes.md"
            
            rm -f release_notes.md
            info "✅ GitHub Release created successfully"
        fi
    else
        warn "GitHub CLI (gh) not found. Please install it to create releases automatically."
        info "Manual steps:"
        info "1. Go to https://github.com/bamr87/zer0-mistakes/releases/new"
        info "2. Choose tag: $TAG"
        info "3. Upload: $GEM_FILE"
    fi
    echo ""
else
    warn "Skipping GitHub Release creation (--no-github-release specified)"
    echo ""
fi

# Cleanup
if [[ "$DRY_RUN" == false ]] && [[ -f "$GEM_FILE" ]]; then
    log "Cleaning up local gem file..."
    rm -f "$GEM_FILE"
fi

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Release Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "📋 Summary:"
echo -e "   Version: ${BLUE}$CURRENT_VERSION${NC}"
echo -e "   Tag: ${BLUE}$TAG${NC}"
echo ""
echo -e "🔗 Links:"
echo -e "   RubyGems: ${BLUE}https://rubygems.org/gems/jekyll-theme-zer0/versions/$CURRENT_VERSION${NC}"
echo -e "   GitHub Release: ${BLUE}https://github.com/bamr87/zer0-mistakes/releases/tag/$TAG${NC}"
echo -e "   Documentation: ${BLUE}https://github.com/bamr87/zer0-mistakes#readme${NC}"
echo ""

if [[ "$DRY_RUN" == true ]]; then
    warn "This was a dry run. No changes were made."
    echo "Run without --dry-run to perform the actual release."
fi
