#!/bin/bash

# Comprehensive Gem Publication Script for zer0-mistakes Jekyll theme
# Usage: ./scripts/gem-publish.sh [patch|minor|major] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE="${1:-patch}"
DRY_RUN=false
SKIP_TESTS=false
SKIP_CHANGELOG=false
SKIP_PUBLISH=false
CREATE_GITHUB_RELEASE=true
INTERACTIVE=true
AUTOMATED_RELEASE=false
AUTO_COMMIT_RANGE=""

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
        --skip-changelog)
            SKIP_CHANGELOG=true
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
        --non-interactive)
            INTERACTIVE=false
            shift
            ;;
        --automated-release)
            AUTOMATED_RELEASE=true
            INTERACTIVE=false
            shift
            ;;
        --auto-commit-range=*)
            AUTO_COMMIT_RANGE="${1#*=}"
            shift
            ;;
        patch|minor|major)
            VERSION_TYPE="$1"
            shift
            ;;
        --help)
            # show_usage will be called after function definitions
            SHOW_HELP=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to show usage
show_usage() {
    cat << EOF
🚀 Comprehensive Gem Publication Script for zer0-mistakes

USAGE:
    ./scripts/gem-publish.sh [patch|minor|major] [OPTIONS]

VERSION TYPES:
    patch                    Bump patch version (0.0.X) - Bug fixes
    minor                    Bump minor version (0.X.0) - New features
    major                    Bump major version (X.0.0) - Breaking changes

OPTIONS:
    --dry-run                Show what would be done without making changes
    --skip-tests             Skip running tests before release
    --skip-changelog         Skip automatic changelog generation
    --skip-publish           Skip publishing to RubyGems
    --no-github-release      Skip creating GitHub release
    --non-interactive        Run without user prompts
    --automated-release      Enable fully automated release mode
    --auto-commit-range=RANGE Use specific commit range for changelog
    --help                   Show this help message

WORKFLOW:
    1. Validate environment and dependencies
    2. Generate changelog from commit history
    3. Version bump and update files
    4. Run comprehensive tests
    5. Build and validate gem
    6. Publish to RubyGems
    7. Create GitHub Release with assets
    8. Push changes and tags to repository

EXAMPLES:
    ./scripts/gem-publish.sh patch          # Patch release with full workflow
    ./scripts/gem-publish.sh minor --dry-run # Preview minor version bump
    ./scripts/gem-publish.sh major --skip-tests # Major release, skip tests

EOF
}

# Function to log messages with different levels
log() {
    echo -e "${GREEN}[GEM-PUBLISH]${NC} $1"
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

step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to ask for user confirmation
confirm() {
    if [[ "$INTERACTIVE" == false ]]; then
        return 0
    fi
    
    echo -e "${YELLOW}$1 (y/N)${NC}"
    read -r response
    [[ "$response" =~ ^[Yy]$ ]]
}

# Function to validate environment
validate_environment() {
    step "Validating environment..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
    fi
    
    # Check if working directory is clean
    if [[ -n $(git status --porcelain) ]]; then
        error "Working directory is not clean. Please commit or stash changes first."
    fi
    
    # Check required files
    local required_files=(
        "lib/jekyll-theme-zer0/version.rb"
        "jekyll-theme-zer0.gemspec"
        "CHANGELOG.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file not found: $file"
        fi
    done
    
    # Check required commands
    local required_commands=("git" "ruby" "gem" "bundle" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command not found: $cmd"
        fi
    done
    
    # Check if authenticated with RubyGems
    if [[ "$SKIP_PUBLISH" != true ]] && [[ ! -f ~/.gem/credentials ]]; then
        error "Not authenticated with RubyGems. Run 'gem signin' first."
    fi
    
    success "Environment validation complete"
}

# Function to get current version
get_current_version() {
    local version=$(grep -o 'VERSION = "[^"]*"' lib/jekyll-theme-zer0/version.rb | sed 's/VERSION = "\(.*\)"/\1/')
    if [[ -z "$version" ]]; then
        error "Could not read version from lib/jekyll-theme-zer0/version.rb"
    fi
    echo "$version"
}

# Function to calculate new version
calculate_new_version() {
    local current_version="$1"
    local version_type="$2"
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $version_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to get the last version tag
get_last_version_tag() {
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    if [[ -z "$last_tag" ]]; then
        # If no tags, use initial commit
        echo $(git rev-list --max-parents=0 HEAD)
    else
        echo "$last_tag"
    fi
}

# Function to generate changelog from commits
generate_changelog() {
    local current_version="$1"
    local new_version="$2"
    local last_tag="$3"
    
    step "Generating changelog from commit history..."
    
    # Get commits since last version or use provided range
    local commits
    if [[ -n "$AUTO_COMMIT_RANGE" ]]; then
        # Use the provided commit range for automated releases
        log "Using automated commit range: $AUTO_COMMIT_RANGE"
        commits=$(git log --pretty=format:"%H|%s|%an|%ad" --date=short "$AUTO_COMMIT_RANGE")
    elif [[ "$last_tag" =~ ^v[0-9] ]]; then
        commits=$(git log --pretty=format:"%H|%s|%an|%ad" --date=short "${last_tag}..HEAD")
    else
        commits=$(git log --pretty=format:"%H|%s|%an|%ad" --date=short "${last_tag}..HEAD")
    fi
    
    if [[ -z "$commits" ]]; then
        warn "No commits found since last version tag"
        return 0
    fi
    
    # Categorize commits
    local added=()
    local changed=()
    local fixed=()
    local deprecated=()
    local removed=()
    local security=()
    local other=()
    
    while IFS='|' read -r hash subject author date; do
        local subject_lower=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
        
        if [[ "$subject_lower" =~ ^(feat|feature)(\(.*\))?:.*$ ]]; then
            added+=("- $(echo "$subject" | sed 's/^[Ff]eat[ure]*(\([^)]*\)): *//' | sed 's/^[Ff]eat[ure]*: *//')")
        elif [[ "$subject_lower" =~ ^(fix|bugfix)(\(.*\))?:.*$ ]]; then
            fixed+=("- $(echo "$subject" | sed 's/^[Ff]ix[bugfix]*(\([^)]*\)): *//' | sed 's/^[Ff]ix[bugfix]*: *//')")
        elif [[ "$subject_lower" =~ ^(perf|performance)(\(.*\))?:.*$ ]]; then
            changed+=("- Performance: $(echo "$subject" | sed 's/^[Pp]erf[ormance]*(\([^)]*\)): *//' | sed 's/^[Pp]erf[ormance]*: *//')")
        elif [[ "$subject_lower" =~ ^(refactor)(\(.*\))?:.*$ ]]; then
            changed+=("- Refactor: $(echo "$subject" | sed 's/^[Rr]efactor(\([^)]*\)): *//' | sed 's/^[Rr]efactor: *//')")
        elif [[ "$subject_lower" =~ ^(style)(\(.*\))?:.*$ ]]; then
            changed+=("- Style: $(echo "$subject" | sed 's/^[Ss]tyle(\([^)]*\)): *//' | sed 's/^[Ss]tyle: *//')")
        elif [[ "$subject_lower" =~ ^(docs|doc)(\(.*\))?:.*$ ]]; then
            changed+=("- Documentation: $(echo "$subject" | sed 's/^[Dd]ocs*(\([^)]*\)): *//' | sed 's/^[Dd]ocs*: *//')")
        elif [[ "$subject_lower" =~ ^(chore)(\(.*\))?:.*$ ]]; then
            changed+=("- $(echo "$subject" | sed 's/^[Cc]hore(\([^)]*\)): *//' | sed 's/^[Cc]hore: *//')")
        elif [[ "$subject_lower" =~ ^(test)(\(.*\))?:.*$ ]]; then
            changed+=("- Testing: $(echo "$subject" | sed 's/^[Tt]est(\([^)]*\)): *//' | sed 's/^[Tt]est: *//')")
        elif [[ "$subject_lower" =~ ^(ci)(\(.*\))?:.*$ ]]; then
            changed+=("- CI/CD: $(echo "$subject" | sed 's/^[Cc][Ii](\([^)]*\)): *//' | sed 's/^[Cc][Ii]: *//')")
        elif [[ "$subject_lower" =~ ^(build)(\(.*\))?:.*$ ]]; then
            changed+=("- Build: $(echo "$subject" | sed 's/^[Bb]uild(\([^)]*\)): *//' | sed 's/^[Bb]uild: *//')")
        elif [[ "$subject_lower" =~ ^(security|sec)(\(.*\))?:.*$ ]]; then
            security+=("- $(echo "$subject" | sed 's/^[Ss]ec[urity]*(\([^)]*\)): *//' | sed 's/^[Ss]ec[urity]*: *//')")
        elif [[ "$subject_lower" =~ deprecat ]]; then
            deprecated+=("- $(echo "$subject")")
        elif [[ "$subject_lower" =~ ^(remove|rm)(\(.*\))?:.*$ ]]; then
            removed+=("- $(echo "$subject" | sed 's/^[Rr]m*[emove]*(\([^)]*\)): *//' | sed 's/^[Rr]m*[emove]*: *//')")
        else
            other+=("- $subject")
        fi
    done <<< "$commits"
    
    # Create changelog entry
    local changelog_entry=""
    local date=$(date +"%Y-%m-%d")
    
    changelog_entry+="## [$new_version] - $date\n\n"
    
    if [[ ${#added[@]} -gt 0 ]]; then
        changelog_entry+="### Added\n"
        for item in "${added[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    if [[ ${#changed[@]} -gt 0 ]]; then
        changelog_entry+="### Changed\n"
        for item in "${changed[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    if [[ ${#deprecated[@]} -gt 0 ]]; then
        changelog_entry+="### Deprecated\n"
        for item in "${deprecated[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    if [[ ${#removed[@]} -gt 0 ]]; then
        changelog_entry+="### Removed\n"
        for item in "${removed[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    if [[ ${#fixed[@]} -gt 0 ]]; then
        changelog_entry+="### Fixed\n"
        for item in "${fixed[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    if [[ ${#security[@]} -gt 0 ]]; then
        changelog_entry+="### Security\n"
        for item in "${security[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    if [[ ${#other[@]} -gt 0 ]]; then
        changelog_entry+="### Other\n"
        for item in "${other[@]}"; do
            changelog_entry+="$item\n"
        done
        changelog_entry+="\n"
    fi
    
    # Update CHANGELOG.md
    if [[ "$DRY_RUN" != true ]]; then
        # Create backup
        cp CHANGELOG.md CHANGELOG.md.bak
        
        # Insert new entry after the first line (preserving header)
        {
            head -n 1 CHANGELOG.md
            echo ""
            echo -e "$changelog_entry"
            tail -n +2 CHANGELOG.md
        } > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
        
        rm CHANGELOG.md.bak 2>/dev/null || true
    fi
    
    info "Generated changelog entry for version $new_version"
    echo -e "${PURPLE}Changelog Preview:${NC}"
    echo -e "$changelog_entry" | head -20
    
    if [[ "$INTERACTIVE" == true ]]; then
        echo -e "${YELLOW}Continue with this changelog? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            error "Changelog generation cancelled by user"
        fi
    fi
}

# Function to update version in files
update_version_files() {
    local new_version="$1"
    
    step "Updating version in files..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would update version to $new_version in:"
        info "  - lib/jekyll-theme-zer0/version.rb"
        info "  - package.json"
        return 0
    fi
    
    # Update version.rb
    sed -i.bak "s/VERSION = \".*\"/VERSION = \"$new_version\"/" lib/jekyll-theme-zer0/version.rb
    rm lib/jekyll-theme-zer0/version.rb.bak 2>/dev/null || true
    
    # Update package.json if it exists
    if [[ -f "package.json" ]]; then
        jq ".version = \"$new_version\"" package.json > package.json.tmp && mv package.json.tmp package.json
    fi
    
    success "Version files updated to $new_version"
}

# Function to run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warn "Skipping tests as requested"
        return 0
    fi
    
    step "Running test suite..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would run: bundle exec rspec"
        return 0
    fi
    
    # Install dependencies
    bundle install --quiet
    
    # Run tests
    if bundle exec rspec; then
        success "All tests passed"
    else
        error "Tests failed. Fix issues before proceeding."
    fi
}

# Function to build gem
build_gem() {
    local version="$1"
    
    step "Building gem..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would build jekyll-theme-zer0-${version}.gem"
        return 0
    fi
    
    # Clean up old gem files
    rm -f jekyll-theme-zer0-*.gem
    
    # Validate gemspec
    ruby -c jekyll-theme-zer0.gemspec > /dev/null
    
    # Build gem
    if gem build jekyll-theme-zer0.gemspec; then
        success "Successfully built jekyll-theme-zer0-${version}.gem"
        
        # Show gem contents summary
        info "Gem contents summary:"
        local file_count=$(tar -tzf "jekyll-theme-zer0-${version}.gem" | wc -l)
        info "  Total files: $file_count"
        info "  Gem size: $(ls -lh jekyll-theme-zer0-${version}.gem | awk '{print $5}')"
    else
        error "Failed to build gem"
    fi
}

# Function to publish gem
publish_gem() {
    local version="$1"
    
    if [[ "$SKIP_PUBLISH" == true ]]; then
        warn "Skipping gem publication as requested"
        return 0
    fi
    
    step "Publishing gem to RubyGems..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would publish jekyll-theme-zer0-${version}.gem to RubyGems"
        return 0
    fi
    
    # Check if version already exists
    if gem list --remote jekyll-theme-zer0 | grep -q "jekyll-theme-zer0 (${version})"; then
        error "Version ${version} already exists on RubyGems"
    fi
    
    # Publish
    if confirm "Publish jekyll-theme-zer0-${version}.gem to RubyGems?"; then
        if gem push "jekyll-theme-zer0-${version}.gem"; then
            success "Successfully published to RubyGems"
            info "Gem available at: https://rubygems.org/gems/jekyll-theme-zer0"
        else
            error "Failed to publish gem"
        fi
    else
        warn "Gem publication cancelled by user"
    fi
}

# Function to commit and tag
commit_and_tag() {
    local version="$1"
    
    step "Committing changes and creating tag..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would commit changes and create tag v$version"
        return 0
    fi
    
    # Add files to git
    git add lib/jekyll-theme-zer0/version.rb CHANGELOG.md
    [[ -f "package.json" ]] && git add package.json
    
    # Commit
    git commit -m "chore: release version $version

- Version bump to $version
- Updated changelog with commit history
- Automated release via gem-publish script"
    
    # Create tag
    git tag -a "v$version" -m "Release version $version"
    
    success "Created commit and tag v$version"
}

# Function to create GitHub release
create_github_release() {
    local version="$1"
    
    if [[ "$CREATE_GITHUB_RELEASE" != true ]]; then
        warn "Skipping GitHub release creation as requested"
        return 0
    fi
    
    step "Creating GitHub release..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would create GitHub release for v$version"
        return 0
    fi
    
    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        warn "GitHub CLI (gh) not found. Skipping GitHub release creation."
        info "You can create the release manually at: https://github.com/bamr87/zer0-mistakes/releases/new"
        return 0
    fi
    
    # Extract changelog for this version
    local release_notes=$(awk "/^## \[$version\]/{flag=1; next} /^## \[/{flag=0} flag" CHANGELOG.md)
    
    # Create release
    if gh release create "v$version" \
        --title "Release v$version" \
        --notes "$release_notes" \
        "jekyll-theme-zer0-${version}.gem"; then
        success "GitHub release created successfully"
    else
        warn "Failed to create GitHub release"
    fi
}

# Function to push changes
push_changes() {
    step "Pushing changes to repository..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "Would push changes and tags to origin"
        return 0
    fi
    
    if confirm "Push changes and tags to repository?"; then
        git push origin main --tags
        success "Changes and tags pushed to repository"
    else
        warn "Repository push cancelled by user"
    fi
}

# Function to cleanup
cleanup() {
    step "Cleaning up temporary files..."
    
    if [[ "$DRY_RUN" != true ]]; then
        # Remove gem file after successful publication
        if [[ "$SKIP_PUBLISH" != true ]] && [[ -f "jekyll-theme-zer0-${NEW_VERSION}.gem" ]]; then
            if confirm "Remove local gem file?"; then
                rm -f "jekyll-theme-zer0-${NEW_VERSION}.gem"
                info "Local gem file removed"
            fi
        fi
    fi
}

# Main execution function
main() {
    # Check if help was requested
    if [[ "${SHOW_HELP:-false}" == true ]]; then
        show_usage
        exit 0
    fi
    
    if [[ "$AUTOMATED_RELEASE" == true ]]; then
        echo -e "${CYAN}🤖 Automated Release Mode${NC}"
        echo -e "${CYAN}Version: $VERSION_TYPE bump (automatic)${NC}"
    else
        echo -e "${PURPLE}🚀 Comprehensive Gem Publication Script${NC}"
        echo -e "${PURPLE}Version: $VERSION_TYPE bump${NC}"
    fi
    echo ""
    
    # Validate environment
    validate_environment
    
    # Get current version
    local current_version=$(get_current_version)
    info "Current version: $current_version"
    
    # Calculate new version
    local new_version=$(calculate_new_version "$current_version" "$VERSION_TYPE")
    info "New version: $new_version"
    
    # Get last version tag for changelog
    local last_tag=$(get_last_version_tag)
    info "Last version tag: $last_tag"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
        echo ""
    fi
    
    # Show summary
    echo -e "${CYAN}📋 Release Summary:${NC}"
    echo -e "  Current Version: $current_version"
    echo -e "  New Version:     $new_version"
    echo -e "  Version Type:    $VERSION_TYPE"
    echo -e "  Last Tag:        $last_tag"
    echo ""
    
    if [[ "$INTERACTIVE" == true ]] && ! confirm "Continue with release?"; then
        info "Release cancelled by user"
        exit 0
    fi
    
    # Execute release workflow
    if [[ "$SKIP_CHANGELOG" != true ]]; then
        generate_changelog "$current_version" "$new_version" "$last_tag"
    fi
    
    update_version_files "$new_version"
    run_tests
    build_gem "$new_version"
    commit_and_tag "$new_version"
    publish_gem "$new_version"
    create_github_release "$new_version"
    push_changes
    cleanup
    
    # Final success message
    echo ""
    echo -e "${GREEN}🎉 Release Complete!${NC}"
    echo -e "${GREEN}Version $new_version has been successfully released${NC}"
    echo ""
    echo -e "${CYAN}📋 Release Information:${NC}"
    echo -e "  📦 RubyGems: https://rubygems.org/gems/jekyll-theme-zer0"
    echo -e "  🏷️  GitHub Release: https://github.com/bamr87/zer0-mistakes/releases/tag/v$new_version"
    echo -e "  🔄 Repository: https://github.com/bamr87/zer0-mistakes"
    echo ""
    
    export NEW_VERSION="$new_version"
}

# Run main function
main "$@"