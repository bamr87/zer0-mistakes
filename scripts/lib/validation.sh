#!/bin/bash

# Validation library for zer0-mistakes release scripts
# Provides environment, git, and dependency validation functions

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Validate git repository
validate_git_repo() {
    debug "Validating git repository..."
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
    fi
    
    debug "✓ Git repository validated"
}

# Validate working directory is clean
validate_clean_working_dir() {
    debug "Validating clean working directory..."
    
    if [[ -n $(git status --porcelain) ]]; then
        error "Working directory is not clean. Please commit or stash changes first."
    fi
    
    debug "✓ Working directory is clean"
}

# Validate required files exist
validate_required_files() {
    debug "Validating required files..."
    
    local required_files=(
        "lib/jekyll-theme-zer0/version.rb"
        "jekyll-theme-zer0.gemspec"
        "CHANGELOG.md"
    )
    
    for file in "${required_files[@]}"; do
        require_file "$file"
    done
    
    debug "✓ All required files present"
}

# Validate required commands
validate_dependencies() {
    debug "Validating dependencies..."
    
    require_command "git" "Install from https://git-scm.com/"
    require_command "ruby" "Install from https://www.ruby-lang.org/"
    require_command "gem" "Comes with Ruby"
    require_command "bundle" "Install with: gem install bundler"
    require_command "jq" "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    
    debug "✓ All dependencies available"
}

# Validate RubyGems authentication
validate_rubygems_auth() {
    local skip_publish="${1:-false}"
    
    if [[ "$skip_publish" == "true" ]]; then
        debug "Skipping RubyGems auth validation (publish not required)"
        return 0
    fi
    
    debug "Validating RubyGems authentication..."
    
    if [[ ! -f ~/.gem/credentials ]]; then
        error "Not authenticated with RubyGems. Run 'gem signin' first."
    fi
    
    debug "✓ RubyGems authentication present"
}

# Validate gemspec can be parsed
validate_gemspec() {
    debug "Validating gemspec..."
    
    if ! ruby -c jekyll-theme-zer0.gemspec > /dev/null 2>&1; then
        error "Invalid gemspec: jekyll-theme-zer0.gemspec"
    fi
    
    debug "✓ Gemspec is valid"
}

# Validate GitHub CLI availability
validate_github_cli() {
    local required="${1:-false}"
    
    if command_exists "gh"; then
        debug "✓ GitHub CLI (gh) available"
        return 0
    fi
    
    if [[ "$required" == "true" ]]; then
        error "GitHub CLI (gh) is required. Install from https://cli.github.com/"
    else
        warn "GitHub CLI (gh) not found. GitHub releases will be skipped."
        return 1
    fi
}

# Comprehensive environment validation
validate_environment() {
    local skip_publish="${1:-false}"
    local require_gh="${2:-false}"
    
    step "Validating environment..."
    
    validate_git_repo
    validate_clean_working_dir
    validate_required_files
    validate_dependencies
    validate_gemspec
    validate_rubygems_auth "$skip_publish"
    
    if [[ "$require_gh" == "true" ]]; then
        validate_github_cli true
    else
        validate_github_cli false
    fi
    
    success "Environment validation complete"
}

# Export functions
export -f validate_git_repo
export -f validate_clean_working_dir
export -f validate_required_files
export -f validate_dependencies
export -f validate_rubygems_auth
export -f validate_gemspec
export -f validate_github_cli
export -f validate_environment
