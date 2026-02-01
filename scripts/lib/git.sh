#!/bin/bash

# Git operations library for zer0-mistakes release scripts
# Provides functions for tags, commits, and repository operations

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get the last version tag
get_last_version_tag() {
    debug "Finding last version tag..."
    
    local last_tag
    last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    if [[ -z "$last_tag" ]]; then
        # If no tags exist, use initial commit
        last_tag=$(git rev-list --max-parents=0 HEAD)
        debug "No tags found, using initial commit: $last_tag"
    else
        debug "Last version tag: $last_tag"
    fi
    
    echo "$last_tag"
}

# Check if tag exists
tag_exists() {
    local tag="$1"
    git tag -l | grep -q "^$tag$"
}

# Get commits between two references
get_commits_between() {
    local from_ref="$1"
    local to_ref="${2:-HEAD}"
    
    debug "Getting commits: $from_ref..$to_ref"
    
    git log --pretty=format:"%H|%s|%an|%ad" --date=short "$from_ref..$to_ref" 2>/dev/null || echo ""
}

# Get files changed in a commit
get_commit_files() {
    local commit_hash="$1"
    
    git diff-tree --no-commit-id --name-only -r "$commit_hash" 2>/dev/null || echo ""
}

# Get commit message
get_commit_message() {
    local commit_hash="$1"
    
    git log --format="%s%n%b" -n 1 "$commit_hash"
}

# Get commit subject (first line)
get_commit_subject() {
    local commit_hash="$1"
    
    git log --format="%s" -n 1 "$commit_hash"
}

# Create git commit
create_commit() {
    local version="$1"
    local message="${2:-Release version $version}"
    
    step "Creating commit..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would create commit: $message"
        return 0
    fi
    
    # Add files (including Gemfile.lock which is updated when version changes)
    git add lib/jekyll-theme-zer0/version.rb CHANGELOG.md
    [[ -f "package.json" ]] && git add package.json
    [[ -f "Gemfile.lock" ]] && git add Gemfile.lock
    
    # Create commit
    git commit -m "chore: release version $version

- Version bump to $version
- Updated changelog with commit history
- Regenerated Gemfile.lock for version sync
- Automated release via release script" || error "Failed to create commit"
    
    success "Created commit for version $version"
}

# Create git tag
create_tag() {
    local version="$1"
    local tag="v$version"
    local message="${2:-Release version $version}"
    
    step "Creating tag $tag..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would create tag: $tag"
        return 0
    fi
    
    if tag_exists "$tag"; then
        warn "Tag $tag already exists"
        if ! confirm "Overwrite existing tag $tag?"; then
            error "Tag creation cancelled"
        fi
        
        # Delete existing tag
        git tag -d "$tag"
    fi
    
    # Create annotated tag
    git tag -a "$tag" -m "$message" || error "Failed to create tag $tag"
    
    success "Created tag $tag"
}

# Commit and tag together
commit_and_tag() {
    local version="$1"
    
    create_commit "$version"
    create_tag "$version"
}

# Push changes to remote
push_changes() {
    local remote="${1:-origin}"
    local branch="${2:-main}"
    
    step "Pushing changes to $remote/$branch..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would push to $remote $branch --tags"
        return 0
    fi
    
    if ! confirm "Push changes and tags to $remote/$branch?"; then
        warn "Push cancelled by user"
        return 1
    fi
    
    # Push branch and tags
    git push "$remote" "$branch" --tags || error "Failed to push changes"
    
    success "Pushed changes and tags to $remote/$branch"
}

# Get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Get remote URL
get_remote_url() {
    local remote="${1:-origin}"
    
    git remote get-url "$remote" 2>/dev/null || echo ""
}

# Extract owner/repo from remote URL
get_repo_info() {
    local remote="${1:-origin}"
    local url
    
    url=$(get_remote_url "$remote")
    
    if [[ -z "$url" ]]; then
        error "Could not get remote URL for $remote"
    fi
    
    # Extract owner/repo from various Git URL formats
    if [[ "$url" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        local owner="${BASH_REMATCH[1]}"
        local repo="${BASH_REMATCH[2]}"
        echo "$owner/$repo"
    else
        error "Could not parse GitHub owner/repo from URL: $url"
    fi
}

# Count commits since tag
count_commits_since() {
    local from_ref="$1"
    
    git rev-list --count "$from_ref..HEAD" 2>/dev/null || echo "0"
}

# Export functions
export -f get_last_version_tag
export -f tag_exists
export -f get_commits_between
export -f get_commit_files
export -f get_commit_message
export -f get_commit_subject
export -f create_commit
export -f create_tag
export -f commit_and_tag
export -f push_changes
export -f get_current_branch
export -f get_remote_url
export -f get_repo_info
export -f count_commits_since
