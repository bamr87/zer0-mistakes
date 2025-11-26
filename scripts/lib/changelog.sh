#!/bin/bash

# Changelog generation library for zer0-mistakes release scripts
# Provides automatic changelog generation from git commit history

# Check Bash version (need 4+ for associative arrays)
if [[ "${BASH_VERSINFO[0]}" -lt 4 ]]; then
    echo "[ERROR] This script requires Bash 4.0 or higher (current: ${BASH_VERSION})" >&2
    echo "[INFO] On macOS, install via: brew install bash" >&2
    echo "[INFO] Then update scripts to use: #!/usr/local/bin/bash" >&2
    exit 1
fi

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
source "$SCRIPT_DIR/git.sh"

# Constants (check if already defined)
if [[ -z "${CHANGELOG_FILE:-}" ]]; then
    readonly CHANGELOG_FILE="CHANGELOG.md"
fi

# Categorize a single commit based on conventional commit format
categorize_commit() {
    local commit_hash="$1"
    local subject
    
    subject=$(get_commit_subject "$commit_hash")
    local subject_lower=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
    
    debug "Categorizing: $subject"
    
    # Check commit message and body for breaking changes
    local commit_full
    commit_full=$(get_commit_message "$commit_hash")
    
    if echo "$commit_full" | grep -qi "BREAKING CHANGE\|breaking:"; then
        echo "breaking"
        return 0
    fi
    
    # Conventional commit patterns
    case "$subject_lower" in
        feat:*|feature:*|add:*|new:*)
            echo "added"
            ;;
        fix:*|bugfix:*|bug:*|patch:*)
            echo "fixed"
            ;;
        perf:*|performance:*)
            echo "changed"
            ;;
        refactor:*)
            echo "changed"
            ;;
        style:*)
            echo "changed"
            ;;
        docs:*|doc:*)
            echo "changed"
            ;;
        test:*)
            echo "changed"
            ;;
        chore:*)
            echo "changed"
            ;;
        ci:*)
            echo "changed"
            ;;
        build:*)
            echo "changed"
            ;;
        revert:*|remove:*|delete:*)
            echo "removed"
            ;;
        deprecate:*|deprecated:*)
            echo "deprecated"
            ;;
        security:*|sec:*)
            echo "security"
            ;;
        *)
            echo "other"
            ;;
    esac
}

# Clean commit message for changelog
clean_commit_message() {
    local subject="$1"
    
    # Remove conventional commit prefix
    subject=$(echo "$subject" | sed -E 's/^(feat|feature|fix|bugfix|bug|patch|perf|performance|refactor|style|docs|doc|test|chore|ci|build|revert|remove|delete|deprecate|deprecated|security|sec)(\([^)]*\))?:\s*//')
    
    # Capitalize first letter
    subject="$(echo "${subject:0:1}" | tr '[:lower:]' '[:upper:]')${subject:1}"
    
    echo "$subject"
}

# Generate changelog entry for a version
generate_changelog() {
    local new_version="$1"
    local from_ref="${2:-$(get_last_version_tag)}"
    local to_ref="${3:-HEAD}"
    
    step "Generating changelog for version $new_version..."
    
    debug "Commit range: $from_ref..$to_ref"
    
    # Get commits
    local commits_raw
    commits_raw=$(get_commits_between "$from_ref" "$to_ref")
    
    if [[ -z "$commits_raw" ]]; then
        warn "No commits found since $from_ref"
        return 0
    fi
    
    # Parse and categorize commits
    declare -A categories
    categories=(
        ["breaking"]=""
        ["added"]=""
        ["changed"]=""
        ["deprecated"]=""
        ["removed"]=""
        ["fixed"]=""
        ["security"]=""
        ["other"]=""
    )
    
    local commit_count=0
    while IFS='|' read -r hash subject author date; do
        [[ -z "$hash" ]] && continue
        
        ((commit_count++))
        
        # Skip merge commits
        if echo "$subject" | grep -qE "^Merge (branch|pull request|remote-tracking branch)"; then
            debug "Skipping merge commit: $hash"
            continue
        fi
        
        # Skip automated version/changelog commits
        if echo "$subject" | grep -qE "^(chore: (bump version|release version|update changelog)|Automated|Auto-update)"; then
            debug "Skipping automated commit: $hash"
            continue
        fi
        
        # Check if commit only modified version/changelog files
        local files
        files=$(get_commit_files "$hash")
        local has_significant_files=false
        
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            
            if ! echo "$file" | grep -qE "^(CHANGELOG\.md|lib/.*version\.rb|package\.json|\.github/workflows/)$"; then
                has_significant_files=true
                break
            fi
        done <<< "$files"
        
        if [[ "$has_significant_files" == "false" ]]; then
            debug "Skipping commit with only version/changelog files: $hash"
            continue
        fi
        
        # Categorize and store
        local category
        category=$(categorize_commit "$hash")
        
        local clean_msg
        clean_msg=$(clean_commit_message "$subject")
        
        if [[ -n "${categories[$category]}" ]]; then
            categories[$category]+=$'\n'
        fi
        categories[$category]+="- $clean_msg"
        
    done <<< "$commits_raw"
    
    info "Analyzed $commit_count commits"
    
    # Build changelog entry
    local changelog_entry=""
    local date
    date=$(date +"%Y-%m-%d")
    
    changelog_entry+="## [$new_version] - $date"$'\n\n'
    
    # Add sections in order
    for category in "breaking" "added" "changed" "deprecated" "removed" "fixed" "security" "other"; do
        if [[ -n "${categories[$category]}" ]]; then
            case "$category" in
                "breaking")
                    changelog_entry+="### ⚠️  BREAKING CHANGES"$'\n'
                    ;;
                "added")
                    changelog_entry+="### Added"$'\n'
                    ;;
                "changed")
                    changelog_entry+="### Changed"$'\n'
                    ;;
                "deprecated")
                    changelog_entry+="### Deprecated"$'\n'
                    ;;
                "removed")
                    changelog_entry+="### Removed"$'\n'
                    ;;
                "fixed")
                    changelog_entry+="### Fixed"$'\n'
                    ;;
                "security")
                    changelog_entry+="### Security"$'\n'
                    ;;
                "other")
                    changelog_entry+="### Other"$'\n'
                    ;;
            esac
            
            changelog_entry+="${categories[$category]}"$'\n\n'
        fi
    done
    
    # Preview changelog
    info "Changelog preview:"
    echo -e "${PURPLE}${changelog_entry}${NC}" | head -30
    
    # Update CHANGELOG.md
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would update $CHANGELOG_FILE"
        return 0
    fi
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        if ! confirm "Add this changelog entry to $CHANGELOG_FILE?"; then
            error "Changelog generation cancelled by user"
        fi
    fi
    
    update_changelog_file "$changelog_entry"
    
    success "Changelog generated for version $new_version"
}

# Update the CHANGELOG.md file with new entry
update_changelog_file() {
    local entry="$1"
    
    debug "Updating $CHANGELOG_FILE..."
    
    if [[ ! -f "$CHANGELOG_FILE" ]]; then
        warn "$CHANGELOG_FILE not found, creating new one"
        echo "# Changelog" > "$CHANGELOG_FILE"
        echo "" >> "$CHANGELOG_FILE"
        echo "All notable changes to this project will be documented in this file." >> "$CHANGELOG_FILE"
        echo "" >> "$CHANGELOG_FILE"
        echo "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)," >> "$CHANGELOG_FILE"
        echo "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)." >> "$CHANGELOG_FILE"
        echo "" >> "$CHANGELOG_FILE"
    fi
    
    # Create backup
    cp "$CHANGELOG_FILE" "${CHANGELOG_FILE}.bak"
    
    # Insert new entry after header (preserve first line)
    {
        head -n 1 "$CHANGELOG_FILE"
        echo ""
        echo "$entry"
        tail -n +2 "$CHANGELOG_FILE"
    } > "${CHANGELOG_FILE}.tmp"
    
    mv "${CHANGELOG_FILE}.tmp" "$CHANGELOG_FILE"
    rm -f "${CHANGELOG_FILE}.bak"
    
    debug "✓ Updated $CHANGELOG_FILE"
}

# Extract release notes for a specific version from CHANGELOG.md
extract_release_notes() {
    local version="$1"
    
    debug "Extracting release notes for version $version..."
    
    if [[ ! -f "$CHANGELOG_FILE" ]]; then
        warn "No CHANGELOG.md found"
        return 1
    fi
    
    # Extract section between version header and next version header
    awk -v version="$version" '
        /^## \[/ {
            if (found) exit
            if ($0 ~ "\\[" version "\\]") {
                found=1
                next
            }
        }
        found && !/^## \[/ { print }
    ' "$CHANGELOG_FILE"
}

# Export functions
export -f categorize_commit
export -f clean_commit_message
export -f generate_changelog
export -f update_changelog_file
export -f extract_release_notes
