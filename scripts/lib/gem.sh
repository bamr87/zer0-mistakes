#!/bin/bash

# Gem operations library for zer0-mistakes release scripts
# Provides functions for building, validating, and publishing gems

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
source "$SCRIPT_DIR/git.sh"
source "$SCRIPT_DIR/changelog.sh"

# Constants (check if already defined)
if [[ -z "${GEMSPEC_FILE:-}" ]]; then
    readonly GEMSPEC_FILE="jekyll-theme-zer0.gemspec"
fi
if [[ -z "${GEM_NAME:-}" ]]; then
    readonly GEM_NAME="jekyll-theme-zer0"
fi

# Build the gem
build_gem() {
    local version="$1"
    local gem_file="${GEM_NAME}-${version}.gem"
    
    step "Building gem $gem_file..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would build $gem_file"
        return 0
    fi
    
    # Clean up old gem files
    rm -f ${GEM_NAME}-*.gem
    
    # Validate gemspec
    if ! ruby -c "$GEMSPEC_FILE" > /dev/null 2>&1; then
        error "Invalid gemspec: $GEMSPEC_FILE"
    fi
    
    # Build gem
    if ! gem build "$GEMSPEC_FILE"; then
        error "Failed to build gem"
    fi
    
    # Verify gem was created
    if [[ ! -f "$gem_file" ]]; then
        error "Gem file not found after build: $gem_file"
    fi
    
    # Show gem info (with error handling for tar extraction)
    local file_count="unknown"
    local file_size="unknown"
    
    # Try to get file count (may fail on some platforms/tar versions)
    if command -v tar &> /dev/null; then
        file_count=$(tar -tzf "$gem_file" 2>/dev/null | wc -l | tr -d ' ') || file_count="unknown"
    fi
    
    # Get file size (should always work)
    if command -v ls &> /dev/null; then
        file_size=$(ls -lh "$gem_file" 2>/dev/null | awk '{print $5}') || file_size="unknown"
    fi
    
    success "Built $gem_file"
    if [[ "$file_count" != "unknown" ]]; then
        info "  Files: $file_count"
    fi
    if [[ "$file_size" != "unknown" ]]; then
        info "  Size: $file_size"
    fi
}

# Check if gem version exists on RubyGems
gem_version_exists() {
    local version="$1"
    
    debug "Checking if $GEM_NAME ($version) exists on RubyGems..."
    
    if gem list --remote "$GEM_NAME" | grep -q "$GEM_NAME ($version)"; then
        debug "Version $version already exists on RubyGems"
        return 0
    else
        debug "Version $version does not exist on RubyGems"
        return 1
    fi
}

# Publish gem to RubyGems
publish_gem() {
    local version="$1"
    local gem_file="${GEM_NAME}-${version}.gem"
    
    step "Publishing gem to RubyGems..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would publish $gem_file to RubyGems"
        return 0
    fi
    
    # Verify gem file exists
    if [[ ! -f "$gem_file" ]]; then
        error "Gem file not found: $gem_file (run build first)"
    fi
    
    # Check if version already exists
    if gem_version_exists "$version"; then
        error "Version $version already exists on RubyGems"
    fi
    
    # Confirm publication
    if ! confirm "Publish $gem_file to RubyGems?"; then
        warn "Gem publication cancelled by user"
        return 1
    fi
    
    # Publish
    if ! gem push "$gem_file"; then
        error "Failed to publish gem to RubyGems"
    fi
    
    success "Published $gem_file to RubyGems"
    info "View at: https://rubygems.org/gems/$GEM_NAME/versions/$version"
}

# Create GitHub release
create_github_release() {
    local version="$1"
    local tag="v$version"
    local gem_file="${GEM_NAME}-${version}.gem"
    
    step "Creating GitHub release for $tag..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would create GitHub release for $tag"
        return 0
    fi
    
    # Check if gh CLI is available
    if ! command_exists "gh"; then
        warn "GitHub CLI (gh) not found. Skipping GitHub release."
        info "Install from: https://cli.github.com/"
        return 1
    fi
    
    # Extract release notes from CHANGELOG
    local release_notes
    release_notes=$(extract_release_notes "$version")
    
    if [[ -z "$release_notes" ]]; then
        warn "No release notes found in CHANGELOG for version $version"
        release_notes="Release version $version"
    fi
    
    # Save release notes to temp file
    local notes_file=$(mktemp)
    echo "$release_notes" > "$notes_file"
    
    # Create release
    local gh_args=(
        "release" "create" "$tag"
        "--title" "🚀 Jekyll Theme Zer0 $tag"
        "--notes-file" "$notes_file"
    )
    
    # Add gem file if it exists
    if [[ -f "$gem_file" ]]; then
        gh_args+=("$gem_file")
    fi
    
    if gh "${gh_args[@]}"; then
        success "Created GitHub release for $tag"
        info "View at: https://github.com/$(get_repo_info)/releases/tag/$tag"
    else
        warn "Failed to create GitHub release"
        rm -f "$notes_file"
        return 1
    fi
    
    rm -f "$notes_file"
}

# Run tests
run_tests() {
    step "Running test suite..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would run: bundle exec rspec"
        return 0
    fi
    
    # Install dependencies if needed
    if [[ ! -d "vendor/bundle" ]]; then
        info "Installing dependencies..."
        bundle install --quiet
    fi
    
    # Run tests
    if bundle exec rspec; then
        success "All tests passed"
    else
        error "Tests failed. Fix issues before proceeding."
    fi
}

# Clean up gem files
cleanup_gem_files() {
    local version="${1:-}"
    
    step "Cleaning up gem files..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would remove gem files"
        return 0
    fi
    
    if [[ -n "$version" ]]; then
        local gem_file="${GEM_NAME}-${version}.gem"
        if [[ -f "$gem_file" ]]; then
            if confirm "Remove local gem file $gem_file?"; then
                rm -f "$gem_file"
                info "Removed $gem_file"
            fi
        fi
    else
        if confirm "Remove all local gem files?"; then
            rm -f ${GEM_NAME}-*.gem
            info "Removed all gem files"
        fi
    fi
}

# Export functions
export -f build_gem
export -f gem_version_exists
export -f publish_gem
export -f create_github_release
export -f run_tests
export -f cleanup_gem_files
