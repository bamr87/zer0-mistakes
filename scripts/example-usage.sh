#!/bin/bash

# Example script demonstrating library usage
# This shows how simple release workflows become with the new libraries

set -euo pipefail

# Get library directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# Source all libraries
source "$LIB_DIR/common.sh"
source "$LIB_DIR/validation.sh"
source "$LIB_DIR/version.sh"
source "$LIB_DIR/git.sh"
source "$LIB_DIR/changelog.sh"
source "$LIB_DIR/gem.sh"

# Configuration
export DRY_RUN=true
export INTERACTIVE=false

# Main demonstration
main() {
    print_header "Library Usage Example"
    
    echo -e "${CYAN}This example shows how the new libraries work together.${NC}"
    echo -e "${CYAN}Running in DRY_RUN mode (no actual changes made).${NC}"
    echo ""
    
    # Step 1: Validation
    step "Step 1: Environment Validation"
    validate_git_repo
    validate_required_files
    validate_dependencies
    echo ""
    
    # Step 2: Version Management
    step "Step 2: Version Management"
    current_version=$(get_current_version)
    info "Current version: $current_version"
    
    new_version=$(calculate_new_version "$current_version" "minor")
    info "Next version would be: $new_version"
    echo ""
    
    # Step 3: Git Operations
    step "Step 3: Git Information"
    last_tag=$(get_last_version_tag)
    info "Last version tag: $last_tag"
    
    commit_count=$(count_commits_since "$last_tag")
    info "Commits since last tag: $commit_count"
    
    current_branch=$(get_current_branch)
    info "Current branch: $current_branch"
    echo ""
    
    # Step 4: Changelog Preview
    step "Step 4: Changelog Generation"
    info "Analyzing commits for changelog..."
    
    commits=$(get_commits_between "$last_tag" "HEAD" | head -5)
    if [[ -n "$commits" ]]; then
        echo -e "${PURPLE}Recent commits:${NC}"
        while IFS='|' read -r hash subject author date; do
            [[ -z "$hash" ]] && continue
            echo "  - $subject"
        done <<< "$commits"
    fi
    echo ""
    
    # Step 5: Gem Operations (dry run)
    step "Step 5: Gem Operations Preview"
    info "Would build: jekyll-theme-zer0-${new_version}.gem"
    info "Would run: bundle exec rspec"
    info "Would publish to: https://rubygems.org/gems/jekyll-theme-zer0"
    echo ""
    
    # Summary
    print_summary "Example Complete" \
        "✅ Environment validated" \
        "✅ Version calculated: $current_version → $new_version" \
        "✅ Git information retrieved" \
        "✅ Changelog preview generated" \
        "✅ Gem operations previewed"
    
    success "All library functions working correctly!"
    
    echo ""
    echo -e "${CYAN}To actually perform a release, use:${NC}"
    echo -e "  ${YELLOW}./scripts/release minor${NC}"
    echo ""
    echo -e "${CYAN}To learn more about the libraries:${NC}"
    echo -e "  ${YELLOW}cat scripts/lib/README.md${NC}"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
