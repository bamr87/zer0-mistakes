#!/bin/bash

# Commit Analysis Script for Automated Version Bumping
# Analyzes git commits to determine appropriate semantic version bump
# Usage: ./scripts/analyze-commits.sh [commit-range]
# Output: patch|minor|major|none

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
COMMIT_RANGE="${1:-HEAD~1..HEAD}"
DEBUG=${DEBUG:-false}

# Logging functions
log_debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1" >&2
    fi
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Function to analyze individual commit
analyze_commit() {
    local commit_hash="$1"
    local commit_message
    local commit_files
    local bump_level="none"
    
    commit_message=$(git log --format="%s%n%b" -n 1 "$commit_hash")
    commit_files=$(git diff-tree --no-commit-id --name-only -r "$commit_hash" 2>/dev/null || echo "")
    
    log_debug "Analyzing commit: $commit_hash"
    log_debug "Message: $(echo "$commit_message" | head -1)"
    
    # Check for breaking changes (MAJOR)
    if echo "$commit_message" | grep -qi "BREAKING CHANGE\|breaking:"; then
        echo "major"
        return 0
    fi
    
    # Check for major version indicators in commit message
    if echo "$commit_message" | grep -qE "^(major|MAJOR|breaking|BREAKING)[\s:]"; then
        echo "major"
        return 0
    fi
    
    # Check commit message patterns for conventional commits
    local subject_line=$(echo "$commit_message" | head -1)
    
    # MAJOR changes
    if echo "$subject_line" | grep -qE "^(revert|remove|delete)[\s:].*[Bb]reaking"; then
        echo "major"
        return 0
    fi
    
    # MINOR changes (new features)
    if echo "$subject_line" | grep -qE "^(feat|feature|add|new)[\s:]"; then
        echo "minor"
        return 0
    fi
    
    # MINOR changes - significant additions
    if echo "$subject_line" | grep -qE "^(enhance|improve|update)[\s:].*[Ff]eature"; then
        echo "minor"
        return 0
    fi
    
    # PATCH changes (bug fixes, small improvements)
    if echo "$subject_line" | grep -qE "^(fix|bug|patch|hotfix|chore|docs|style|refactor|test|perf)[\s:]"; then
        echo "patch"
        return 0
    fi
    
    # PATCH changes - maintenance and small improvements
    if echo "$subject_line" | grep -qE "^(update|improve|enhance|optimize|clean)[\s:]"; then
        echo "patch"
        return 0
    fi
    
    # File-based analysis for changes without conventional commit messages
    if [[ -n "$commit_files" ]]; then
        local critical_files=0
        local feature_files=0
        local patch_files=0
        
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            
            log_debug "Analyzing file: $file"
            
            # Critical/breaking change files (MAJOR)
            if echo "$file" | grep -qE "(Gemfile|gemspec|_config\.yml|docker-compose\.yml|Dockerfile)$"; then
                ((critical_files++))
                log_debug "Critical file detected: $file"
            
            # Feature files (MINOR)  
            elif echo "$file" | grep -qE "(_layouts/|_includes/|assets/|pages/.*\.md$|\.rb$|\.js$)"; then
                ((feature_files++))
                log_debug "Feature file detected: $file"
            
            # Documentation and minor files (PATCH)
            elif echo "$file" | grep -qE "(README|CHANGELOG|\.md$|\.txt$|\.yml$|\.yaml$|test/)"; then
                ((patch_files++))
                log_debug "Patch file detected: $file"
            fi
        done <<< "$commit_files"
        
        # Determine bump level based on file analysis
        if [[ $critical_files -gt 0 ]]; then
            # But only if there are significant changes to critical files
            local lines_changed=$(git diff --shortstat "$commit_hash^" "$commit_hash" 2>/dev/null | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | grep -oE '[0-9]+' | paste -sd+ | bc 2>/dev/null || echo "0")
            if [[ $lines_changed -gt 10 ]]; then
                echo "minor"  # Significant changes to critical files = minor
                return 0
            else
                echo "patch"  # Small changes to critical files = patch
                return 0
            fi
        elif [[ $feature_files -gt 0 ]]; then
            echo "patch"  # Changes to feature files without explicit feat: = patch
            return 0
        elif [[ $patch_files -gt 0 ]]; then
            echo "patch"
            return 0
        fi
    fi
    
    # If we reach here, no clear classification - default to patch for any real changes
    if [[ -n "$commit_files" ]]; then
        echo "patch"
    else
        echo "none"
    fi
}

# Function to determine highest bump level from multiple commits
determine_overall_bump() {
    local commits=("$@")
    local highest_bump="none"
    local patch_count=0
    local minor_count=0
    local major_count=0
    
    log_info "Analyzing ${#commits[@]} commits for version bump determination"
    
    for commit in "${commits[@]}"; do
        local bump_level
        bump_level=$(analyze_commit "$commit")
        
        log_debug "Commit $commit: $bump_level"
        
        case "$bump_level" in
            "major")
                ((major_count++))
                highest_bump="major"
                ;;
            "minor")
                ((minor_count++))
                if [[ "$highest_bump" != "major" ]]; then
                    highest_bump="minor"
                fi
                ;;
            "patch")
                ((patch_count++))
                if [[ "$highest_bump" == "none" ]]; then
                    highest_bump="patch"
                fi
                ;;
        esac
    done
    
    log_info "Bump analysis summary:"
    log_info "  - Major changes: $major_count"
    log_info "  - Minor changes: $minor_count"  
    log_info "  - Patch changes: $patch_count"
    log_info "  - Overall recommendation: $highest_bump"
    
    echo "$highest_bump"
}

# Main execution
main() {
    local commit_range="$COMMIT_RANGE"
    
    log_info "Analyzing commits in range: $commit_range"
    
    # Validate git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Get list of commits in range
    local commits
    if ! commits=($(git rev-list --reverse "$commit_range" 2>/dev/null)); then
        log_warning "No commits found in range: $commit_range"
        echo "none"
        exit 0
    fi
    
    if [[ ${#commits[@]} -eq 0 ]]; then
        log_warning "No commits to analyze"
        echo "none"
        exit 0
    fi
    
    # Filter out merge commits and automated commits
    local filtered_commits=()
    for commit in "${commits[@]}"; do
        local commit_subject
        commit_subject=$(git log --format="%s" -n 1 "$commit")
        
        # Skip merge commits
        if echo "$commit_subject" | grep -qE "^Merge (branch|pull request|remote-tracking branch)"; then
            log_debug "Skipping merge commit: $commit"
            continue
        fi
        
        # Skip automated commits (version bumps, changelog updates)
        if echo "$commit_subject" | grep -qE "^(chore: bump version|chore: update changelog|Automated|Auto-update)"; then
            log_debug "Skipping automated commit: $commit"
            continue
        fi
        
        # Skip commits that only modify ignored files
        local commit_files
        commit_files=$(git diff-tree --no-commit-id --name-only -r "$commit" 2>/dev/null || echo "")
        
        local has_significant_files=false
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            
            # Skip if only changelog, version files, or workflow files changed
            if ! echo "$file" | grep -qE "^(CHANGELOG\.md|lib/.*version\.rb|package\.json|\.github/workflows/)$"; then
                has_significant_files=true
                break
            fi
        done <<< "$commit_files"
        
        if [[ "$has_significant_files" == "true" ]]; then
            filtered_commits+=("$commit")
        else
            log_debug "Skipping commit with only version/changelog files: $commit"
        fi
    done
    
    if [[ ${#filtered_commits[@]} -eq 0 ]]; then
        log_info "No significant commits found after filtering"
        echo "none"
        exit 0
    fi
    
    log_info "Analyzing ${#filtered_commits[@]} significant commits (filtered from ${#commits[@]} total)"
    
    # Determine the appropriate version bump
    determine_overall_bump "${filtered_commits[@]}"
}

# Show usage if requested
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    cat << EOF
Commit Analysis Script for Automated Version Bumping

USAGE:
    $0 [commit-range]

ARGUMENTS:
    commit-range    Git commit range to analyze (default: HEAD~1..HEAD)

OUTPUT:
    patch           Bug fixes, documentation, small improvements
    minor           New features, enhancements
    major           Breaking changes, major refactors
    none            No version bump needed

EXAMPLES:
    $0                          # Analyze last commit
    $0 HEAD~5..HEAD            # Analyze last 5 commits  
    $0 v1.0.0..HEAD            # Analyze since last tag

ENVIRONMENT:
    DEBUG=true                  # Enable debug output

CONVENTIONAL COMMIT PATTERNS:
    feat:, feature:, add:       → minor
    fix:, bug:, patch:          → patch
    BREAKING CHANGE, breaking:  → major
    chore:, docs:, style:       → patch
EOF
    exit 0
fi

# Execute main function
main "$@"