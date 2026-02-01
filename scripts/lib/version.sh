#!/bin/bash

# Version management library for zer0-mistakes release scripts
# Provides version reading, calculation, and update functions

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Version file paths (check if already defined)
if [[ -z "${VERSION_FILE:-}" ]]; then
    readonly VERSION_FILE="lib/jekyll-theme-zer0/version.rb"
fi
if [[ -z "${PACKAGE_JSON:-}" ]]; then
    readonly PACKAGE_JSON="package.json"
fi

# Get current version from version.rb
get_current_version() {
    debug "Reading current version from $VERSION_FILE..."
    
    local version
    version=$(grep -o 'VERSION = "[^"]*"' "$VERSION_FILE" | sed 's/VERSION = "\(.*\)"/\1/')
    
    if [[ -z "$version" ]]; then
        error "Could not read version from $VERSION_FILE"
    fi
    
    debug "Current version: $version"
    echo "$version"
}

# Validate version format (semantic versioning)
validate_version_format() {
    local version="$1"
    
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        error "Invalid version format: $version (expected: X.Y.Z)"
    fi
    
    debug "✓ Version format valid: $version"
}

# Calculate new version based on bump type
calculate_new_version() {
    local current_version="$1"
    local bump_type="$2"
    
    debug "Calculating new version: $current_version → $bump_type bump"
    
    validate_version_format "$current_version"
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case "$bump_type" in
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
        *)
            error "Invalid bump type: $bump_type (expected: major, minor, or patch)"
            ;;
    esac
    
    local new_version="$major.$minor.$patch"
    debug "New version: $new_version"
    echo "$new_version"
}

# Update version in version.rb
update_version_rb() {
    local new_version="$1"
    
    debug "Updating $VERSION_FILE to $new_version..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would update $VERSION_FILE to $new_version"
        return 0
    fi
    
    # Create backup
    cp "$VERSION_FILE" "${VERSION_FILE}.bak"
    
    # Update version
    sed -i.tmp "s/VERSION = \".*\"/VERSION = \"$new_version\"/" "$VERSION_FILE"
    rm -f "${VERSION_FILE}.tmp"
    
    # Verify update
    local updated_version
    updated_version=$(get_current_version)
    
    if [[ "$updated_version" != "$new_version" ]]; then
        # Restore backup
        mv "${VERSION_FILE}.bak" "$VERSION_FILE"
        error "Failed to update version in $VERSION_FILE"
    fi
    
    rm -f "${VERSION_FILE}.bak"
    debug "✓ Updated $VERSION_FILE"
}

# Update version in package.json
update_package_json() {
    local new_version="$1"
    
    if [[ ! -f "$PACKAGE_JSON" ]]; then
        debug "package.json not found, skipping"
        return 0
    fi
    
    debug "Updating $PACKAGE_JSON to $new_version..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would update $PACKAGE_JSON to $new_version"
        return 0
    fi
    
    # Update using jq
    jq ".version = \"$new_version\"" "$PACKAGE_JSON" > "${PACKAGE_JSON}.tmp"
    mv "${PACKAGE_JSON}.tmp" "$PACKAGE_JSON"
    
    debug "✓ Updated $PACKAGE_JSON"
}

# Update Gemfile.lock to reflect new gem version
# This is CRITICAL - when version.rb changes, Gemfile.lock must be regenerated
# because the gem is listed as a PATH dependency in Gemfile
update_gemfile_lock() {
    local new_version="$1"
    
    debug "Regenerating Gemfile.lock for version $new_version..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        info "[DRY RUN] Would regenerate Gemfile.lock"
        return 0
    fi
    
    # Unfreeze bundler to allow lockfile update
    bundle config set --local frozen false 2>/dev/null || true
    bundle config unset deployment 2>/dev/null || true
    
    # Regenerate lockfile
    if ! bundle install --quiet; then
        warn "bundle install returned non-zero, but may have succeeded"
    fi
    
    # Verify the lockfile was updated
    if grep -q "jekyll-theme-zer0 ($new_version)" Gemfile.lock 2>/dev/null; then
        debug "✓ Gemfile.lock updated to version $new_version"
    else
        warn "Gemfile.lock may not have been updated correctly"
        info "Current Gemfile.lock gem version:"
        grep "jekyll-theme-zer0" Gemfile.lock | head -3 || true
    fi
}

# Update version in all files
update_version_files() {
    local new_version="$1"
    
    step "Updating version to $new_version..."
    
    validate_version_format "$new_version"
    
    update_version_rb "$new_version"
    update_package_json "$new_version"
    update_gemfile_lock "$new_version"
    
    success "Version files updated to $new_version"
}

# Compare two versions (returns 0 if v1 < v2, 1 if v1 >= v2)
version_less_than() {
    local v1="$1"
    local v2="$2"
    
    # Convert versions to comparable format
    local v1_comparable=$(echo "$v1" | awk -F. '{ printf("%d%03d%03d\n", $1,$2,$3); }')
    local v2_comparable=$(echo "$v2" | awk -F. '{ printf("%d%03d%03d\n", $1,$2,$3); }')
    
    [[ $v1_comparable -lt $v2_comparable ]]
}

# Get version from git tag
get_version_from_tag() {
    local tag="$1"
    
    # Remove 'v' prefix if present
    echo "$tag" | sed 's/^v//'
}

# Export functions
export -f get_current_version
export -f validate_version_format
export -f calculate_new_version
export -f update_version_rb
export -f update_package_json
export -f update_gemfile_lock
export -f update_version_files
export -f version_less_than
export -f get_version_from_tag
