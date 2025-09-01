#!/bin/bash

# Version management script for zer0-mistakes Jekyll theme
# Usage: ./scripts/version.sh [patch|minor|major] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE="${1:-patch}"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        patch|minor|major)
            VERSION_TYPE="$1"
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
    echo -e "${GREEN}[VERSION]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    error "Working directory is not clean. Please commit or stash changes first."
fi

# Check if version.rb exists
if [[ ! -f "lib/jekyll-theme-zer0/version.rb" ]]; then
    error "lib/jekyll-theme-zer0/version.rb not found"
fi

# Check if gemspec exists
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "jekyll-theme-zer0.gemspec not found"
fi

# Get current version from Ruby version file
CURRENT_VERSION=$(grep -o 'VERSION = "[^"]*"' lib/jekyll-theme-zer0/version.rb | sed 's/VERSION = "\(.*\)"/\1/')
if [[ -z "$CURRENT_VERSION" ]]; then
    error "Could not read version from lib/jekyll-theme-zer0/version.rb"
fi

log "Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
log "New version: $NEW_VERSION"

if [[ "$DRY_RUN" == true ]]; then
    log "Dry run mode - no changes will be made"
    log "Would update version from $CURRENT_VERSION to $NEW_VERSION"
    exit 0
fi

# Update version.rb
log "Updating lib/jekyll-theme-zer0/version.rb..."
sed -i.bak "s/VERSION = \".*\"/VERSION = \"$NEW_VERSION\"/" lib/jekyll-theme-zer0/version.rb
rm lib/jekyll-theme-zer0/version.rb.bak 2>/dev/null || true

# Update package.json to keep in sync
if [[ -f "package.json" ]]; then
    log "Updating package.json..."
    jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
fi

# Validate gemspec can be built
log "Validating gemspec..."
if ! gem build jekyll-theme-zer0.gemspec > /dev/null 2>&1; then
    error "Failed to build gemspec"
fi

# Clean up test gem file
rm -f jekyll-theme-zer0-*.gem

# Update CHANGELOG if it exists
if [[ -f "CHANGELOG.md" ]]; then
    log "Updating CHANGELOG.md..."
    DATE=$(date +"%Y-%m-%d")
    sed -i.bak "1s/^/## [$NEW_VERSION] - $DATE\n\n### Changed\n- Version bump to $NEW_VERSION\n\n/" CHANGELOG.md
    rm CHANGELOG.md.bak 2>/dev/null || true
fi

# Git operations
log "Committing changes..."
git add lib/jekyll-theme-zer0/version.rb
[[ -f "package.json" ]] && git add package.json
[[ -f "CHANGELOG.md" ]] && git add CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"

log "Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

log "Version bump complete!"
log "Current version: $NEW_VERSION"
log "Tagged as: v$NEW_VERSION"
log ""
log "Next steps:"
log "1. Run 'git push origin main --tags' to push changes and tags"
log "2. Run './scripts/build.sh' to build and publish the gem"
