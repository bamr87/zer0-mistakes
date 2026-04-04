#!/bin/bash
#
# Script Name: sync-github-pages-docs.sh
# Description: Sync GitHub Pages documentation from github/docs repository
#              into the Zer0-Mistakes Jekyll theme documentation.
# Usage:
#   ./scripts/sync-github-pages-docs.sh [OPTIONS]
#
# Options:
#   --check       Check if updates are available (no changes made)
#   --sync        Download and convert documentation (default action)
#   --dry-run     Preview changes without writing files
#   --force       Overwrite existing files even if up-to-date
#   --verbose     Show detailed output
#   -h, --help    Show this help message
#
# Source: https://github.com/github/docs/tree/main/content/pages
# License: CC-BY-4.0 (Creative Commons Attribution 4.0 International)
#
# Dependencies: curl, jq (optional, for JSON parsing)
#

set -euo pipefail

# ============================================================
# Configuration
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source repository
SOURCE_OWNER="github"
SOURCE_REPO="docs"
SOURCE_PATH="content/pages"
SOURCE_BRANCH="main"
API_BASE="https://api.github.com/repos/${SOURCE_OWNER}/${SOURCE_REPO}"

# Target paths
TARGET_DIR="${PROJECT_ROOT}/pages/_docs/github-pages"
SYNC_MANIFEST="${PROJECT_ROOT}/_data/github-pages-docs-sync.yml"
NAV_FILE="${PROJECT_ROOT}/_data/navigation/docs.yml"

# Script options
ACTION="sync"
DRY_RUN=false
FORCE=false
VERBOSE=false

# Section mapping: source directory → target directory
declare -A SECTION_MAP=(
    ["getting-started-with-github-pages"]="getting-started"
    ["setting-up-a-github-pages-site-with-jekyll"]="jekyll-setup"
    ["configuring-a-custom-domain-for-your-github-pages-site"]="custom-domains"
)

# Category mapping for front matter
declare -A CATEGORY_MAP=(
    ["getting-started"]="getting-started"
    ["jekyll-setup"]="jekyll-setup"
    ["custom-domains"]="custom-domains"
)

# ============================================================
# Logging
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_debug()   { [[ "$VERBOSE" == "true" ]] && echo -e "${CYAN}[DEBUG]${NC} $1"; }
log_step()    { echo -e "${CYAN}[STEP]${NC} $1"; }

# ============================================================
# Help
# ============================================================

show_help() {
    cat << 'EOF'
Usage: sync-github-pages-docs.sh [OPTIONS]

Sync GitHub Pages documentation from the official GitHub docs repository
(github/docs) into the Zer0-Mistakes Jekyll theme.

Options:
    --check       Check if updates are available (no changes made)
    --sync        Download and convert documentation (default)
    --dry-run     Preview changes without writing files
    --force       Overwrite existing files even if up-to-date
    --verbose     Show detailed output
    -h, --help    Show this help message

Source: https://github.com/github/docs/tree/main/content/pages
License: CC-BY-4.0

Examples:
    ./scripts/sync-github-pages-docs.sh --check
    ./scripts/sync-github-pages-docs.sh --sync
    ./scripts/sync-github-pages-docs.sh --sync --dry-run
    ./scripts/sync-github-pages-docs.sh --sync --force --verbose

EOF
}

# ============================================================
# Utility functions
# ============================================================

# Make an API request with optional auth token
api_request() {
    local url="$1"
    local headers=(-H "Accept: application/vnd.github.v3+json")

    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        headers+=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
    fi

    curl -fsSL "${headers[@]}" "$url" 2>/dev/null
}

# Get the latest commit SHA for the source path
# Falls back to date-based identifier if API is unavailable
get_source_sha() {
    local response
    response=$(api_request "${API_BASE}/commits?path=${SOURCE_PATH}&per_page=1&sha=${SOURCE_BRANCH}" 2>/dev/null) || true

    local sha=""
    if [[ -n "$response" ]]; then
        if command -v jq &>/dev/null; then
            sha=$(echo "$response" | jq -r '.[0].sha // empty' 2>/dev/null) || true
        else
            sha=$(echo "$response" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['sha'] if data else '')" 2>/dev/null) || true
        fi
    fi

    if [[ -z "$sha" ]]; then
        # Fallback: use date-based identifier when API is unavailable
        echo "sync-$(date -u +%Y%m%d)" # date-based fallback
    else
        echo "$sha"
    fi
}

# Known files manifest — used when API listing is unavailable
# Updated periodically to reflect the source repository structure
KNOWN_FILES_ROOT="quickstart.md"
KNOWN_FILES_GETTING_STARTED="index.md
what-is-github-pages.md
creating-a-github-pages-site.md
configuring-a-publishing-source-for-your-github-pages-site.md
creating-a-custom-404-page-for-your-github-pages-site.md
securing-your-github-pages-site-with-https.md
changing-the-visibility-of-your-github-pages-site.md
deleting-a-github-pages-site.md
unpublishing-a-github-pages-site.md
using-submodules-with-github-pages.md
using-custom-workflows-with-github-pages.md
troubleshooting-404-errors-for-github-pages-sites.md
github-pages-limits.md"
KNOWN_FILES_JEKYLL="index.md
about-github-pages-and-jekyll.md
creating-a-github-pages-site-with-jekyll.md
adding-content-to-your-github-pages-site-using-jekyll.md
adding-a-theme-to-your-github-pages-site-using-jekyll.md
setting-a-markdown-processor-for-your-github-pages-site-using-jekyll.md
testing-your-github-pages-site-locally-with-jekyll.md
about-jekyll-build-errors-for-github-pages-sites.md
troubleshooting-jekyll-build-errors-for-github-pages-sites.md"
KNOWN_FILES_CUSTOM_DOMAINS="index.md
about-custom-domains-and-github-pages.md
managing-a-custom-domain-for-your-github-pages-site.md
verifying-your-custom-domain-for-github-pages.md
troubleshooting-custom-domains-and-github-pages.md"

# Get the current synced SHA from manifest
get_synced_sha() {
    if [[ -f "$SYNC_MANIFEST" ]]; then
        grep "^source_commit:" "$SYNC_MANIFEST" 2>/dev/null | sed 's/source_commit: *//' | tr -d '"' || true
    fi
}

# Download a raw file from the source repo
download_file() {
    local path="$1"
    local raw_url="https://raw.githubusercontent.com/${SOURCE_OWNER}/${SOURCE_REPO}/${SOURCE_BRANCH}/${path}"
    curl -fsSL "$raw_url" 2>/dev/null
}

# ============================================================
# Content conversion functions
# ============================================================

# Convert GitHub docs custom markdown to Jekyll-compatible markdown
convert_content() {
    local content="$1"

    # Replace GitHub docs variable references with plain text
    content=$(echo "$content" | perl -pe '
        # Product name variables
        s/\{%\s*data\s+variables\.product\.prodname_pages\s*%\}/GitHub Pages/g;
        s/\{%\s*data\s+variables\.product\.prodname_dotcom\s*%\}/GitHub/g;
        s/\{%\s*data\s+variables\.product\.prodname_actions\s*%\}/GitHub Actions/g;
        s/\{%\s*data\s+variables\.product\.github\s*%\}/GitHub/g;
        s/\{%\s*data\s+variables\.product\.prodname_free_user\s*%\}/GitHub Free/g;
        s/\{%\s*data\s+variables\.product\.prodname_pro\s*%\}/GitHub Pro/g;
        s/\{%\s*data\s+variables\.product\.prodname_ghe_cloud\s*%\}/GitHub Enterprise Cloud/g;
        s/\{%\s*data\s+variables\.product\.prodname_learning\s*%\}/GitHub Skills/g;
        s/\{%\s*data\s+variables\.product\.prodname_team\s*%\}/GitHub Team/g;
        s/\{%\s*data\s+variables\.product\.prodname_emus\s*%\}/Enterprise Managed Users/g;
        s/\{%\s*data\s+variables\.product\.prodname_github_community\s*%\}/GitHub Community/g;
        s/\{%\s*data\s+variables\.product\.[^\}]+\}/GitHub/g;

        # Remove reusable content references (these are expanded includes)
        s/\{%\s*data\s+reusables\.[^\}]+\}/<!-- See official GitHub docs for full instructions -->/g;

        # Remove indented data references
        s/\{%\s*indented_data_reference\s+[^\}]+\}/<!-- See official GitHub docs for full details -->/g;

        # Remove version conditionals - keep the fpt/ghec content (most relevant)
        s/\{%-?\s*ifversion\s+fpt\s+or\s+ghec\s*-?%\}\n?//g;
        s/\{%-?\s*ifversion\s+fpt\s*-?%\}\n?//g;
        s/\{%-?\s*ifversion\s+ghec\s*-?%\}\n?//g;
        s/\{%-?\s*endif\s*-?%\}\n?//g;
        s/\{%-?\s*else\s*-?%\}\n?//g;
        s/\{%-?\s*elsif\s+[^%]*-?%\}\n?//g;

        # Remove ghes-only content blocks (less relevant for GitHub Pages users)
        s/\{%-?\s*ifversion\s+ghes\s*-?%\}.*?\{%-?\s*endif\s*-?%\}//gs;

        # Remove any remaining platform-specific blocks
        s/\{%\s*windows\s*%\}.*?\{%\s*endwindows\s*%\}//gs;
        s/\{%\s*mac\s*%\}.*?\{%\s*endmac\s*%\}//gs;
        s/\{%\s*linux\s*%\}.*?\{%\s*endlinux\s*%\}//gs;
        s/\{%\s*cli\s*%\}.*?\{%\s*endcli\s*%\}//gs;
        s/\{%\s*webui\s*%\}.*?\{%\s*endwebui\s*%\}//gs;

        # Convert AUTOTITLE links to readable links
        s/\[AUTOTITLE\]\(\/pages\/getting-started-with-github-pages\/([^)]+)\)/[Getting Started: \1](\/docs\/github-pages\/getting-started\/\1\/)/g;
        s/\[AUTOTITLE\]\(\/pages\/setting-up-a-github-pages-site-with-jekyll\/([^)]+)\)/[Jekyll Setup: \1](\/docs\/github-pages\/jekyll-setup\/\1\/)/g;
        s/\[AUTOTITLE\]\(\/pages\/configuring-a-custom-domain-for-your-github-pages-site\/([^)]+)\)/[Custom Domains: \1](\/docs\/github-pages\/custom-domains\/\1\/)/g;
        s/\[AUTOTITLE\]\(\/pages\/([^)]+)\)/[\1](https:\/\/docs.github.com\/en\/pages\/\1)/g;
        s/\[AUTOTITLE\]\(\/([^)]+)\)/[\1](https:\/\/docs.github.com\/en\/\1)/g;

        # Convert octicon references to text/emoji
        s/\{%\s*octicon\s+"pencil"[^%]*%\}/✏️/g;
        s/\{%\s*octicon\s+"[^"]*"[^%]*%\}/●/g;

        # Remove product gating
        s/^product:.*$//gm;

        # Remove image references to GitHub assets (not available locally)
        s/!\[([^\]]*)\]\(\/assets\/images\/[^)]+\)/<!-- Image: \1 -->/g;

        # Catch-all: remove any remaining data variable references
        s/\{%\s*data\s+[^\}]+\}//g;

        # Remove any remaining ifversion/endif pairs that were not caught
        s/\{%-?\s*ifversion\s+[^%]*-?%\}\n?//g;
    ')

    # Final cleanup: remove any remaining Liquid-like tags that would break Jekyll
    # Preserve {% raw %} / {% endraw %} blocks
    content=$(echo "$content" | perl -pe '
        # Skip raw/endraw tags
        next if /\{%\s*(?:raw|endraw)\s*%\}/;
        # Remove any remaining GitHub docs custom tags (not standard Liquid)
        s/\{%-?\s*(?:windows|endwindows|mac|endmac|linux|endlinux|cli|endcli|webui|endwebui)\s*-?%\}//g;
        s/\{%-?\s*indented_data_reference\s+[^%]*-?%\}//g;
    ')

    echo "$content"
}

# Extract the title from GitHub docs front matter
extract_title() {
    local content="$1"
    local title
    title=$(echo "$content" | sed -n '/^---$/,/^---$/p' | grep "^title:" | head -1 | \
        sed "s/^title: *['\"]*//" | sed "s/['\"]* *$//")
    # Replace GitHub docs variables in title
    title=$(echo "$title" | sed \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_pages[[:space:]]*%}/GitHub Pages/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_dotcom[[:space:]]*%}/GitHub/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_actions[[:space:]]*%}/GitHub Actions/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.github[[:space:]]*%}/GitHub/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_ghe_cloud[[:space:]]*%}/GitHub Enterprise Cloud/g' \
        -e 's/{%[^%]*%}//g' \
        -e 's/  */ /g' -e 's/^ *//;s/ *$//')
    echo "$title"
}

# Extract intro from GitHub docs front matter
extract_intro() {
    local content="$1"
    local intro
    intro=$(echo "$content" | sed -n '/^---$/,/^---$/p' | grep "^intro:" | head -1 | \
        sed "s/^intro: *['\"]*//" | sed "s/['\"]* *$//")
    # Replace GitHub docs variables in intro
    intro=$(echo "$intro" | sed \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_pages[[:space:]]*%}/GitHub Pages/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_dotcom[[:space:]]*%}/GitHub/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_actions[[:space:]]*%}/GitHub Actions/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.github[[:space:]]*%}/GitHub/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_ghe_cloud[[:space:]]*%}/GitHub Enterprise Cloud/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_free_user[[:space:]]*%}/GitHub Free/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*variables\.product\.prodname_pro[[:space:]]*%}/GitHub Pro/g' \
        -e 's/{%[[:space:]]*data[[:space:]]*reusables\.[^%]*%}//g' \
        -e 's/{%[^%]*%}//g' \
        -e 's/  */ /g' -e 's/^ *//;s/ *$//')
    echo "$intro"
}

# Extract body content (everything after the second ---)
extract_body() {
    local content="$1"
    echo "$content" | awk '/^---$/{n++} n>=2{if(n==2 && /^---$/){n++; next} print}'
}

# Generate Jekyll front matter for a converted doc
generate_front_matter() {
    local title="$1"
    local description="$2"
    local section="$3"
    local filename="$4"
    local source_path="$5"

    local permalink="/docs/github-pages/"
    if [[ -n "$section" && "$filename" == "index" ]]; then
        permalink="/docs/github-pages/${section}/"
    elif [[ -n "$section" ]]; then
        permalink="/docs/github-pages/${section}/${filename}/"
    elif [[ "$filename" != "index" ]]; then
        permalink="/docs/github-pages/${filename}/"
    fi

    local today
    today=$(date -u +"%Y-%m-%d")

    cat << EOF
---
title: "${title}"
description: "${description}"
layout: default
categories:
    - docs
    - github-pages
    - ${section:-overview}
tags:
    - github-pages
    - documentation
    - reference
permalink: ${permalink}
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
source_url: "https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}/blob/${SOURCE_BRANCH}/${source_path}"
source_license: "CC-BY-4.0"
synced_date: "${today}"
---
EOF
}

# ============================================================
# Sync operations
# ============================================================

# Check for updates
check_updates() {
    log_step "Checking for updates..."

    local source_sha
    source_sha=$(get_source_sha)

    if [[ -z "$source_sha" ]]; then
        log_error "Could not retrieve source commit SHA. Check network/API access."
        return 1
    fi

    local synced_sha
    synced_sha=$(get_synced_sha)

    log_info "Source commit: ${source_sha:0:12}"
    log_info "Synced commit: ${synced_sha:-"(none)"}"

    if [[ "$source_sha" == "$synced_sha" ]]; then
        log_success "Documentation is up-to-date."
        return 0
    else
        log_warn "Updates available."
        log_info "Run './scripts/sync-github-pages-docs.sh --sync' to update."
        return 2
    fi
}

# Process a single file
process_file() {
    local source_path="$1"
    local target_section="$2"
    local filename="$3"

    log_debug "Processing: ${source_path}"

    # Download source content
    local content
    content=$(download_file "$source_path") || {
        log_warn "Failed to download: ${source_path}"
        return 1
    }

    # Extract metadata
    local title
    title=$(extract_title "$content")
    if [[ -z "$title" ]]; then
        title=$(echo "$filename" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    fi

    local description
    description=$(extract_intro "$content")
    if [[ -z "$description" ]]; then
        description="GitHub Pages documentation: ${title}"
    fi
    # Truncate description to 160 chars and clean YAML escaping
    description="${description:0:160}"
    # Fix doubled single quotes from YAML escaping
    description="${description//\'\'/\'}"

    # Extract and convert body
    local body
    body=$(extract_body "$content")
    body=$(convert_content "$body")

    # Determine target file path
    local target_file
    if [[ -z "$target_section" ]]; then
        target_file="${TARGET_DIR}/${filename}.md"
    elif [[ "$filename" == "index" ]]; then
        target_file="${TARGET_DIR}/${target_section}/index.md"
    else
        target_file="${TARGET_DIR}/${target_section}/${filename}.md"
    fi

    # Generate complete file
    local front_matter
    front_matter=$(generate_front_matter "$title" "$description" "$target_section" "$filename" "$source_path")

    local full_content="${front_matter}
${body}

---

> **Source**: This documentation is adapted from the [official GitHub Pages documentation](https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}/blob/${SOURCE_BRANCH}/${source_path}), licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
> Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.
"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would write: ${target_file}"
        log_debug "Title: ${title}"
        return 0
    fi

    # Create directory if needed
    mkdir -p "$(dirname "$target_file")"

    # Write file
    echo "$full_content" > "$target_file"
    log_success "Written: ${target_file#${PROJECT_ROOT}/}"
}

# List files in a source directory
# Tries API first, falls back to known files manifest
list_source_files() {
    local dir_path="$1"
    local source_dir_name
    source_dir_name=$(basename "$dir_path")

    # Try API first
    local response
    response=$(api_request "${API_BASE}/contents/${dir_path}?ref=${SOURCE_BRANCH}" 2>/dev/null) || true

    if [[ -n "$response" ]] && echo "$response" | grep -q '"type"'; then
        log_debug "Using API listing for ${source_dir_name}"
        if command -v jq &>/dev/null; then
            echo "$response" | jq -r '.[] | select(.type == "file" and (.name | endswith(".md"))) | .name' 2>/dev/null
        else
            echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
    if item['type'] == 'file' and item['name'].endswith('.md'):
        print(item['name'])
" 2>/dev/null
        fi
        return 0
    fi

    # Fallback to known files manifest
    log_debug "Using known files manifest for ${source_dir_name}"
    local known_files=""
    case "$source_dir_name" in
        getting-started-with-github-pages)
            known_files="$KNOWN_FILES_GETTING_STARTED"
            ;;
        setting-up-a-github-pages-site-with-jekyll)
            known_files="$KNOWN_FILES_JEKYLL"
            ;;
        configuring-a-custom-domain-for-your-github-pages-site)
            known_files="$KNOWN_FILES_CUSTOM_DOMAINS"
            ;;
    esac

    # Output trimmed file names (one per line)
    echo "$known_files" | sed '/^[[:space:]]*$/d' | sed 's/^[[:space:]]*//'
}

# Sync all documentation
sync_docs() {
    log_step "Starting documentation sync..."
    log_info "Source: https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}/tree/${SOURCE_BRANCH}/${SOURCE_PATH}"
    log_info "Target: ${TARGET_DIR#${PROJECT_ROOT}/}"

    local source_sha
    source_sha=$(get_source_sha)
    if [[ -z "$source_sha" ]]; then
        log_error "Could not retrieve source commit SHA."
        return 1
    fi

    local synced_sha
    synced_sha=$(get_synced_sha)

    if [[ "$source_sha" == "$synced_sha" ]] && [[ "$FORCE" != "true" ]]; then
        log_success "Documentation is already up-to-date (commit: ${source_sha:0:12})."
        return 0
    fi

    local file_count=0
    local error_count=0

    # Process root-level files (quickstart.md)
    log_step "Processing root-level files..."
    for file in quickstart.md; do
        local source_path="${SOURCE_PATH}/${file}"
        local filename="${file%.md}"
        if process_file "$source_path" "" "$filename"; then
            file_count=$((file_count + 1))
        else
            error_count=$((error_count + 1))
        fi
    done

    # Process each section
    for source_dir in "${!SECTION_MAP[@]}"; do
        local target_section="${SECTION_MAP[$source_dir]}"
        log_step "Processing section: ${source_dir} → ${target_section}"

        # List files in the source directory
        local files
        files=$(list_source_files "${SOURCE_PATH}/${source_dir}")

        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            local filename="${file%.md}"
            local source_path="${SOURCE_PATH}/${source_dir}/${file}"

            if process_file "$source_path" "$target_section" "$filename"; then
                file_count=$((file_count + 1))
            else
                error_count=$((error_count + 1))
            fi
        done <<< "$files"
    done

    # Create the section index page
    create_section_index

    # Update sync manifest
    update_manifest "$source_sha" "$file_count"

    # Summary
    echo ""
    log_success "Sync complete!"
    log_info "Files processed: ${file_count}"
    if [[ "$error_count" -gt 0 ]]; then
        log_warn "Errors: ${error_count}"
    fi
    log_info "Source commit: ${source_sha:0:12}"
    log_info "Manifest: ${SYNC_MANIFEST#${PROJECT_ROOT}/}"
}

# Create the main index page for the GitHub Pages docs section
create_section_index() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create section index"
        return 0
    fi

    local today
    today=$(date -u +"%Y-%m-%d")

    mkdir -p "$TARGET_DIR"

    cat > "${TARGET_DIR}/index.md" << EOF
---
title: "GitHub Pages Documentation"
description: "Official GitHub Pages documentation adapted for the Zer0-Mistakes Jekyll theme. Covers getting started, Jekyll setup, and custom domain configuration."
layout: default
categories:
    - docs
    - github-pages
tags:
    - github-pages
    - documentation
    - reference
    - hosting
permalink: /docs/github-pages/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
source_url: "https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}/tree/${SOURCE_BRANCH}/${SOURCE_PATH}"
source_license: "CC-BY-4.0"
synced_date: "${today}"
---

# GitHub Pages Documentation

This section contains documentation adapted from the [official GitHub Pages documentation](https://docs.github.com/en/pages), covering everything you need to deploy and manage sites with GitHub Pages.

> **Attribution**: This content is adapted from the [github/docs](https://github.com/github/docs) repository, licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

## Quick Start

- [GitHub Pages Quickstart](quickstart/) — Create your first GitHub Pages site

## Getting Started

Learn the fundamentals of GitHub Pages:

| Guide | Description |
|-------|-------------|
| [What is GitHub Pages?](getting-started/what-is-github-pages/) | Overview of GitHub Pages hosting service |
| [Creating a Site](getting-started/creating-a-github-pages-site/) | Step-by-step site creation |
| [Publishing Source](getting-started/configuring-a-publishing-source-for-your-github-pages-site/) | Configure branch and folder for deployment |
| [Custom Workflows](getting-started/using-custom-workflows-with-github-pages/) | Deploy with GitHub Actions |
| [HTTPS](getting-started/securing-your-github-pages-site-with-https/) | Secure your site with HTTPS |
| [Custom 404](getting-started/creating-a-custom-404-page-for-your-github-pages-site/) | Create a custom error page |
| [Limits](getting-started/github-pages-limits/) | Usage limits and guidelines |
| [Troubleshooting 404s](getting-started/troubleshooting-404-errors-for-github-pages-sites/) | Fix common 404 errors |

## Jekyll Setup

Set up and configure Jekyll for GitHub Pages:

| Guide | Description |
|-------|-------------|
| [About GitHub Pages & Jekyll](jekyll-setup/about-github-pages-and-jekyll/) | How Jekyll integrates with GitHub Pages |
| [Creating a Jekyll Site](jekyll-setup/creating-a-github-pages-site-with-jekyll/) | Build a Jekyll site for GitHub Pages |
| [Adding Content](jekyll-setup/adding-content-to-your-github-pages-site-using-jekyll/) | Add pages and posts |
| [Adding a Theme](jekyll-setup/adding-a-theme-to-your-github-pages-site-using-jekyll/) | Apply and customize themes |
| [Markdown Processor](jekyll-setup/setting-a-markdown-processor-for-your-github-pages-site-using-jekyll/) | Configure markdown rendering |
| [Local Testing](jekyll-setup/testing-your-github-pages-site-locally-with-jekyll/) | Test your site locally |
| [Build Errors](jekyll-setup/about-jekyll-build-errors-for-github-pages-sites/) | Understanding build errors |
| [Troubleshooting Builds](jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites/) | Fix Jekyll build issues |

## Custom Domains

Configure custom domains for your GitHub Pages site:

| Guide | Description |
|-------|-------------|
| [About Custom Domains](custom-domains/about-custom-domains-and-github-pages/) | Domain types and DNS setup |
| [Managing Domains](custom-domains/managing-a-custom-domain-for-your-github-pages-site/) | Add, change, or remove custom domains |
| [Verifying Domains](custom-domains/verifying-your-custom-domain-for-github-pages/) | Domain verification process |
| [Troubleshooting](custom-domains/troubleshooting-custom-domains-and-github-pages/) | Fix custom domain issues |

## Using with Zer0-Mistakes Theme

For Zer0-Mistakes specific deployment instructions, see:

- [Deploy to GitHub Pages](/docs/deployment/github-pages/) — Theme-specific deployment guide
- [Custom Domain Setup](/docs/deployment/custom-domain/) — Domain configuration for this theme
- [Installation](/docs/installation/) — Complete installation guide

## Syncing Documentation

This documentation is automatically synced from the official GitHub docs repository. To update:

\`\`\`bash
# Check for updates
./scripts/sync-github-pages-docs.sh --check

# Sync latest documentation
./scripts/sync-github-pages-docs.sh --sync

# Preview changes first
./scripts/sync-github-pages-docs.sh --sync --dry-run
\`\`\`

See the [sync manifest](https://github.com/bamr87/zer0-mistakes/blob/main/_data/github-pages-docs-sync.yml) for current sync status.
EOF

    log_success "Created section index: pages/_docs/github-pages/index.md"
}

# Update the sync manifest
update_manifest() {
    local source_sha="$1"
    local file_count="$2"
    local today
    today=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update manifest"
        return 0
    fi

    mkdir -p "$(dirname "$SYNC_MANIFEST")"

    cat > "$SYNC_MANIFEST" << EOF
# GitHub Pages Documentation Sync Manifest
# Auto-generated by scripts/sync-github-pages-docs.sh
# DO NOT EDIT MANUALLY

# Source repository
source_repo: "${SOURCE_OWNER}/${SOURCE_REPO}"
source_branch: "${SOURCE_BRANCH}"
source_path: "${SOURCE_PATH}"
source_url: "https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}/tree/${SOURCE_BRANCH}/${SOURCE_PATH}"

# Sync state
source_commit: "${source_sha}"
last_synced: "${today}"
files_synced: ${file_count}

# License
source_license: "CC-BY-4.0"
attribution: "Content adapted from the official GitHub Pages documentation"
attribution_url: "https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}"

# Target location
target_dir: "pages/_docs/github-pages"
target_permalink_base: "/docs/github-pages/"

# Sections synced
sections:
  - name: "Getting Started"
    source: "getting-started-with-github-pages"
    target: "getting-started"
  - name: "Jekyll Setup"
    source: "setting-up-a-github-pages-site-with-jekyll"
    target: "jekyll-setup"
  - name: "Custom Domains"
    source: "configuring-a-custom-domain-for-your-github-pages-site"
    target: "custom-domains"
EOF

    log_success "Updated manifest: ${SYNC_MANIFEST#${PROJECT_ROOT}/}"
}

# ============================================================
# Main
# ============================================================

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --check)
            ACTION="check"
            ;;
        --sync)
            ACTION="sync"
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --force)
            FORCE=true
            ;;
        --verbose)
            VERBOSE=true
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Header
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}GitHub Pages Documentation Sync${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Execute action
case "$ACTION" in
    check)
        check_updates
        ;;
    sync)
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "Dry run mode: no files will be written"
        fi
        sync_docs
        ;;
    *)
        log_error "Unknown action: $ACTION"
        exit 1
        ;;
esac
