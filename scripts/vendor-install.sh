#!/bin/bash

# Vendor asset installer for zer0-mistakes Jekyll theme
# Downloads third-party JS/CSS libraries defined in vendor-manifest.json
#
# Usage: ./scripts/vendor-install.sh [--force] [--verbose] [--dry-run]
#
# Prerequisites: curl, jq, shasum (or sha256sum)

set -euo pipefail

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST="$PROJECT_ROOT/vendor-manifest.json"

# Source common library if available
if [[ -f "$SCRIPT_DIR/lib/common.sh" ]]; then
    source "$SCRIPT_DIR/lib/common.sh"
else
    # Minimal fallback logging (for CI environments without lib/common.sh)
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
    BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
    log()     { echo -e "${GREEN}[LOG]${NC} $1"; }
    info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
    step()    { echo -e "${CYAN}[STEP]${NC} $1"; }
    success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
    warn()    { echo -e "${YELLOW}[WARNING]${NC} $1"; }
    error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }
    DRY_RUN=${DRY_RUN:-false}
    VERBOSE=${VERBOSE:-false}
fi

# Script-specific flags
FORCE=${FORCE:-false}

show_usage() {
    cat << 'EOF'
📦 Vendor Asset Installer for zer0-mistakes

USAGE:
    ./scripts/vendor-install.sh [OPTIONS]

DESCRIPTION:
    Downloads third-party libraries defined in vendor-manifest.json
    into assets/vendor/. Verifies integrity via SHA-256 checksums.
    Idempotent: skips files that already exist with matching checksums.

OPTIONS:
    --force       Re-download all files even if they exist
    --dry-run     Show what would be downloaded without downloading
    --verbose     Show detailed output
    --help, -h    Show this help message

EXAMPLES:
    ./scripts/vendor-install.sh                 # Install vendor assets
    ./scripts/vendor-install.sh --force         # Re-download everything
    ./scripts/vendor-install.sh --dry-run       # Preview downloads
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)   FORCE=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        --verbose) VERBOSE=true; shift ;;
        --help|-h) show_usage; exit 0 ;;
        *) error "Unknown option: $1 (use --help for usage)" ;;
    esac
done

# Detect checksum command
if command -v sha256sum &>/dev/null; then
    SHA_CMD="sha256sum"
elif command -v shasum &>/dev/null; then
    SHA_CMD="shasum -a 256"
else
    error "Neither sha256sum nor shasum found. Install coreutils."
fi

# Verify file checksum; returns 0 if match, 1 if mismatch
verify_checksum() {
    local file="$1"
    local expected="$2"
    [[ -z "$expected" ]] && return 0  # no checksum to verify
    local actual
    actual=$($SHA_CMD "$file" | cut -d' ' -f1)
    [[ "$actual" == "$expected" ]]
}

# Main
main() {
    step "Vendor Asset Installer"

    # Validate prerequisites
    command -v curl &>/dev/null || error "curl is required but not found"
    command -v jq &>/dev/null  || error "jq is required but not found"
    [[ -f "$MANIFEST" ]]       || error "Manifest not found: $MANIFEST"

    local lib_count
    lib_count=$(jq '.libraries | length' "$MANIFEST")
    info "Manifest: $lib_count libraries"

    local total_files=0 downloaded=0 skipped=0 failed=0

    for i in $(seq 0 $((lib_count - 1))); do
        local lib_name lib_version file_count
        lib_name=$(jq -r ".libraries[$i].name" "$MANIFEST")
        lib_version=$(jq -r ".libraries[$i].version" "$MANIFEST")
        file_count=$(jq ".libraries[$i].files | length" "$MANIFEST")

        step "[$((i+1))/$lib_count] $lib_name v$lib_version ($file_count files)"

        for j in $(seq 0 $((file_count - 1))); do
            local url dest sha256
            url=$(jq -r ".libraries[$i].files[$j].url" "$MANIFEST")
            dest=$(jq -r ".libraries[$i].files[$j].dest" "$MANIFEST")
            sha256=$(jq -r ".libraries[$i].files[$j].sha256 // empty" "$MANIFEST")

            local dest_path="$PROJECT_ROOT/$dest"
            total_files=$((total_files + 1))

            # Check if file exists and checksum matches (skip unless --force)
            if [[ "$FORCE" != "true" && -f "$dest_path" ]]; then
                if [[ -n "$sha256" ]] && verify_checksum "$dest_path" "$sha256"; then
                    [[ "$VERBOSE" == "true" ]] && info "  ✓ $dest (cached)"
                    skipped=$((skipped + 1))
                    continue
                elif [[ -z "$sha256" ]]; then
                    [[ "$VERBOSE" == "true" ]] && info "  ✓ $dest (exists, no checksum)"
                    skipped=$((skipped + 1))
                    continue
                else
                    warn "  ✗ $dest checksum mismatch, re-downloading"
                fi
            fi

            if [[ "$DRY_RUN" == "true" ]]; then
                info "  → would download: $dest"
                downloaded=$((downloaded + 1))
                continue
            fi

            # Create directory and download
            mkdir -p "$(dirname "$dest_path")"
            if curl -fsSL --retry 3 --retry-delay 2 -o "$dest_path" "$url"; then
                # Verify checksum after download
                if [[ -n "$sha256" ]]; then
                    if verify_checksum "$dest_path" "$sha256"; then
                        [[ "$VERBOSE" == "true" ]] && info "  ✓ $dest (downloaded, verified)"
                    else
                        warn "  ✗ $dest checksum mismatch after download!"
                        rm -f "$dest_path"
                        failed=$((failed + 1))
                        continue
                    fi
                else
                    [[ "$VERBOSE" == "true" ]] && info "  ✓ $dest (downloaded)"
                fi
                downloaded=$((downloaded + 1))
            else
                warn "  ✗ Failed to download: $url"
                failed=$((failed + 1))
            fi
        done
    done

    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        info "Dry run complete: $downloaded would download, $skipped cached, $failed errors"
    else
        success "Vendor install complete: $downloaded downloaded, $skipped cached, $failed errors (total: $total_files)"
    fi

    [[ $failed -gt 0 ]] && exit 1

    # Mermaid: copy prebuilt dist from npm (avoids jsDelivr curl in the manifest).
    if [[ "$DRY_RUN" != "true" ]]; then
        copy_mermaid_from_npm() {
            local src="$PROJECT_ROOT/node_modules/mermaid/dist/mermaid.min.js"
            local dest="$PROJECT_ROOT/assets/vendor/mermaid/mermaid.min.js"
            if [[ ! -f "$src" ]]; then
                warn "Mermaid: node_modules/mermaid not found — run: npm install && npm run vendor:mermaid"
                return 0
            fi
            mkdir -p "$(dirname "$dest")"
            cp "$src" "$dest"
            success "Mermaid: copied from npm package to assets/vendor/mermaid/mermaid.min.js"
        }
        copy_mermaid_from_npm
    fi
    return 0
}

main "$@"
