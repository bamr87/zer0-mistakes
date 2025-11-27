---
agent: agent
title: "Zer0-Mistakes: Complete Jekyll Theme Blueprint & AI Development Seed"
version: "0.6.0"
date: "2025-11-24"
purpose: "Complete technical blueprint to rebuild zer0-mistakes Jekyll theme from scratch using only this document as source of truth"
---

# Zer0-Mistakes: Complete Jekyll Theme Blueprint & AI Development Seed

> **🎯 Mission**: Build a production-ready Docker-first Jekyll theme from scratch using only this document as your blueprint. This is the **SINGLE SOURCE OF TRUTH** for complete project reconstruction.

## 📋 Project Identity & Metadata

```yaml
# Core Project Information
project_name: zer0-mistakes
gem_name: jekyll-theme-zer0
current_version: 0.6.0
license: MIT
license_year: 2024-2025

# Author Information
author:
  name: Amr Abdel-Motaleb
  email: amr@it-journey.dev
  github: bamr87
  website: https://it-journey.com

# Repository & Publication
repository: https://github.com/bamr87/zer0-mistakes
rubygems_url: https://rubygems.org/gems/jekyll-theme-zer0
live_site: https://zer0-mistakes.com
documentation: https://github.com/bamr87/zer0-mistakes#readme

# Project Classification
project_type:
  - Ruby Gem
  - Jekyll Theme
  - GitHub Pages Remote Theme
  - Docker-First Development Environment
  - AI-Powered Installation System

# Technical Requirements
requirements:
  ruby: ">= 2.7.0"
  jekyll: "3.9.5"
  bundler: "~> 2.3"
  docker: "latest"
  node: ">= 16.0" # Optional for package.json

# Core Technologies
tech_stack:
  backend: Ruby/Jekyll
  frontend: Bootstrap 5.3.3
  containerization: Docker/Docker Compose
  analytics: PostHog (privacy-first)
  ci_cd: GitHub Actions
  automation: Bash/GNU Make
```

## 🏗️ Architecture Foundations

### Technology Stack

**Core Technologies:**

- **Jekyll 3.9.5**: Static site generator (GitHub Pages compatible)
- **Ruby 2.7.0+**: Runtime environment
- **Bootstrap 5.3.3**: Responsive CSS framework
- **Docker**: Universal development environment (linux/amd64 platform)
- **PostHog**: Privacy-first analytics with GDPR/CCPA compliance

**Build Tools:**

- **Bundler 2.3+**: Ruby dependency management
- **GNU Make**: Command orchestration
- **Bash Scripts**: Automation and release management
- **GitHub Actions**: CI/CD pipeline

**Development Dependencies:**

```ruby
# From Gemfile
gem 'github-pages'              # GitHub Pages compatibility
gem 'jekyll-remote-theme'       # Remote theme support
gem 'jekyll-feed'               # RSS/Atom feeds
gem 'jekyll-sitemap'            # XML sitemap generation
gem 'jekyll-seo-tag'            # SEO meta tags
gem 'jekyll-paginate'           # Pagination support
gem 'jekyll-mermaid', '~> 1.0'  # Diagram support
gem 'webrick', '~> 1.7'         # Development server
gem 'ffi', '~> 1.17.0'          # Docker compatibility
gem 'commonmarker', '0.23.10'   # Markdown processing
```

### Dual Configuration Architecture

**Production Configuration** (`_config.yml`):

```yaml
remote_theme: "bamr87/zer0-mistakes"
url: https://zer0-mistakes.com
baseurl: ""
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-mermaid
```

**Development Configuration** (`_config_dev.yml`):

```yaml
# Overrides for local development
url: "http://localhost:4000"
remote_theme: false # Use local theme files
incremental: true
livereload: true
```

### Docker Development Environment

**Docker Compose Configuration** (`docker-compose.yml`):

```yaml
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64 # Apple Silicon + Intel compatibility
    command: jekyll serve --watch --force_polling --config "_config.yml,_config_dev.yml" --host 0.0.0.0 --port 4000
    volumes:
      - ./:/app
    ports:
      - "4000:4000"
    working_dir: /app
    environment:
      JEKYLL_ENV: development
```

## 🎯 Core Development Principles

## 🎯 Core Development Principles

### 1. Design for Failure (DFF)

**Philosophy**: Anticipate, prevent, and recover from errors gracefully.

**Implementation:**

- Comprehensive error handling in all scripts with `set -euo pipefail`
- Validation checks before destructive operations
- Automatic backup and rollback mechanisms
- Self-healing configuration that detects and fixes common issues
- Detailed error messages with actionable recovery steps

**Example Pattern:**

```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

handle_error() {
    log_error "Operation failed at line $1"
    log_error "Attempting automatic recovery..."
    # Recovery logic here
    exit 1
}
trap 'handle_error $LINENO' ERR
```

### 2. Don't Repeat Yourself (DRY)

**Philosophy**: Single source of truth for all data and functionality.

**Implementation:**

- Version defined once in `lib/jekyll-theme-zer0/version.rb`
- Synchronized across `package.json`, `_config.yml`, gemspec
- Reusable Bash functions in shared libraries
- Modular Jekyll includes and layouts
- Configuration inheritance (production → development)

**Version Management Pattern:**

```ruby
# lib/jekyll-theme-zer0/version.rb
module JekyllThemeZer0
  VERSION = "0.6.0"  # Single source of truth
end
```

### 3. Keep It Simple (KIS)

**Philosophy**: Complexity is the enemy of reliability.

**Implementation:**

- Makefile provides simple command interface
- Clear, descriptive function and variable names
- One responsibility per script/function
- Comprehensive inline documentation
- Standard tools and established patterns

**Makefile Interface:**

```makefile
make setup           # One command setup
make test            # Run all tests
make version-patch   # Bump version
make build           # Build gem
make release-patch   # Complete release workflow
```

### 4. Docker-First Development (DFD)

**Philosophy**: Universal compatibility through containerization.

**Implementation:**

- Docker as primary development environment
- Platform specification for Apple Silicon compatibility (`linux/amd64`)
- No local Ruby/Jekyll installation required
- Consistent behavior across all platforms
- Development parity with production

### 5. AI-Powered Development (AIPD)

**Philosophy**: Leverage AI to enhance development workflows.

**Implementation:**

- Comprehensive `.github/copilot-instructions.md` (805 lines)
- File-specific instruction files for layouts, includes, scripts, testing
- Structured front matter for AI context
- Semantic code organization for better AI comprehension
- Automated commit analysis for version bumping

### 6. Self-Healing Configuration (SHC)

**Philosophy**: Systems should diagnose and fix themselves.

**Implementation:**

- `install.sh` with 95% success rate through intelligent error recovery
- Automatic platform detection and optimization
- Content issue detection and automatic fixes
- Missing dependency resolution
- Configuration validation and auto-correction

## 📁 Complete Directory Structure

```
zer0-mistakes/
├── .github/                          # GitHub-specific files
│   ├── config/                       # Tool configurations
│   │   ├── .yamllint.yml             # YAML linting rules
│   │   ├── .markdownlint.json        # Markdown linting rules
│   │   ├── .markdown-link-check.json # Link checker config
│   │   ├── environment.yml           # Environment settings
│   │   └── README.md                 # Config documentation
│   ├── instructions/                 # AI Copilot instructions
│   │   ├── layouts.instructions.md   # Layout development guidelines
│   │   ├── includes.instructions.md  # Component development guidelines
│   │   ├── scripts.instructions.md   # Shell script standards
│   │   ├── testing.instructions.md   # Testing best practices
│   │   ├── version-control.instructions.md  # Git workflow
│   │   └── documentation.instructions.md    # Documentation standards
│   ├── workflows/                    # GitHub Actions
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── auto-version-bump.yml     # Automated versioning
│   │   ├── gem-release.yml           # Gem publishing
│   │   └── github-release.yml        # GitHub release creation
│   └── copilot-instructions.md       # Main AI instructions (805 lines)
│
├── _includes/                        # Reusable Jekyll components
│   ├── core/                         # Essential components
│   │   ├── head.html                 # HTML head with CDN links
│   │   ├── header.html               # Site header/navigation
│   │   ├── footer.html               # Site footer
│   │   └── scripts.html              # JavaScript loading
│   ├── components/                   # UI components
│   │   ├── cookie-consent.html       # GDPR cookie consent
│   │   ├── theme-info.html           # Version display modal
│   │   └── breadcrumbs.html          # Navigation breadcrumbs
│   ├── analytics/                    # Analytics integration
│   │   └── posthog.html              # PostHog tracking code
│   ├── navigation/                   # Navigation components
│   │   ├── navbar.html               # Main navigation bar
│   │   └── sidebar.html              # Sidebar navigation
│   ├── landing/                      # Landing page components
│   ├── stats/                        # Statistics components
│   └── README.md                     # Include documentation
│
├── _layouts/                         # Jekyll page templates
│   ├── root.html                     # Base HTML structure
│   ├── default.html                  # Main content wrapper
│   ├── home.html                     # Homepage layout
│   ├── journals.html                 # Blog post layout
│   ├── blog.html                     # Blog index layout
│   ├── collection.html               # Collection display
│   ├── landing.html                  # Landing page layout
│   ├── sitemap-collection.html       # Sitemap layout
│   ├── stats.html                    # Statistics dashboard
│   └── README.md                     # Layout documentation
│
├── _sass/                            # Sass stylesheets
│   ├── core/                         # Core styles
│   └── custom.scss                   # Custom overrides
│
├── _data/                            # Site data files
│   ├── navigation/                   # Navigation configs
│   │   ├── about.yml
│   │   ├── docs.yml
│   │   └── main.yml
│   ├── content_statistics.yml        # Generated statistics
│   └── generate_statistics.rb        # Statistics generator
│
├── _plugins/                         # Custom Jekyll plugins
│   └── theme_version.rb              # Version extraction plugin
│
├── assets/                           # Static assets
│   ├── css/                          # Compiled stylesheets
│   ├── js/                           # JavaScript files
│   └── images/                       # Image files
│
├── pages/                            # Content collections
│   ├── _posts/                       # Blog posts (Markdown)
│   ├── _docs/                        # Documentation (Markdown)
│   ├── _quickstart/                  # Quickstart guides
│   ├── _about/                       # About pages
│   └── _notes/                       # Personal notes
│
├── docs/                             # Technical documentation (MDX)
│   ├── releases/                     # Release documentation
│   ├── features/                     # Feature documentation
│   ├── systems/                      # System documentation
│   ├── configuration/                # Configuration guides
│   ├── templates/                    # Documentation templates
│   ├── jekyll/                       # Jekyll specific docs
│   ├── DOCUMENTATION_WORKFLOW.md     # Documentation workflow
│   ├── ORGANIZATION_SUMMARY.md       # Organization summary
│   ├── QUICK_ACCESS_GUIDE.md         # Quick access guide
│   ├── THEME_VERSION_FEATURE.md      # Theme version feature docs
│   └── README.md                     # Documentation index
│
├── scripts/                          # Automation scripts
│   ├── version.sh                    # Version management
│   ├── build.sh                      # Gem building
│   ├── gem-publish.sh                # Release automation
│   ├── analyze-commits.sh            # Commit analysis
│   ├── test.sh                       # Test runner
│   ├── setup.sh                      # Environment setup
│   ├── release.sh                    # Release workflow
│   ├── test-mermaid.sh               # Mermaid diagram testing
│   ├── fix-markdown-format.sh        # Markdown formatting fix
│   └── README.md                     # Script documentation
│
├── test/                             # Test suite
│   ├── test_runner.sh                # Main test orchestrator
│   ├── test_core.sh                  # Core functionality tests
│   ├── test_deployment.sh            # Deployment validation
│   ├── test_quality.sh               # Code quality checks
│   └── README.md                     # Testing documentation
│
├── lib/                              # Ruby library code
│   ├── jekyll-theme-zer0.rb          # Main entry point
│   └── jekyll-theme-zer0/
│       └── version.rb                # VERSION constant
│
├── pkg/                              # Built gem packages
│
├── _config.yml                       # Production Jekyll config
├── _config_dev.yml                   # Development overrides
├── docker-compose.yml                # Docker environment
├── Gemfile                           # Ruby dependencies
├── Gemfile.lock                      # Dependency lock file
├── jekyll-theme-zer0.gemspec         # Gem specification
├── package.json                      # Node.js metadata
├── Makefile                          # Command orchestration
├── Rakefile                          # Ruby tasks
├── install.sh                        # AI-powered installer (1090 lines)
├── init_setup.sh                     # Environment initialization
├── CHANGELOG.md                      # Version history
├── README.md                         # Project documentation
├── LICENSE                           # MIT License
├── CONTRIBUTING.md                   # Contribution guidelines
├── CODE_OF_CONDUCT.md                # Community standards
├── THEME_VERSION_IMPLEMENTATION.md   # Theme version implementation details
├── privacy-policy.md                 # Privacy policy
├── terms-of-service.md               # Terms of service
├── services.md                       # Services documentation
├── release_notes.md                  # Release notes
├── .gitignore                        # Git ignore rules
├── seed_prompt.md                    # This blueprint
└── .seed.md                          # Evolutionary seed
```

## 🔨 Critical File Contents

### 1. Version Management (`lib/jekyll-theme-zer0/version.rb`)

```ruby
# frozen_string_literal: true

module JekyllThemeZer0
  VERSION = "0.6.0"  # SINGLE SOURCE OF TRUTH
end
```

### 2. Gem Specification (`jekyll-theme-zer0.gemspec`)

```ruby
# frozen_string_literal: true

require_relative "lib/jekyll-theme-zer0/version"

Gem::Specification.new do |s|
  s.name                     = "jekyll-theme-zer0"
  s.version                  = JekyllThemeZer0::VERSION
  s.authors                  = ["Amr Abdel"]
  s.email                    = ["amr@it-journey.dev"]
  s.summary                  = "Jekyll theme based on bootstrap and compatible with github pages"
  s.description              = "Bootstrap Jekyll theme for headless Github Pages CMS with Docker-first development approach"
  s.homepage                 = "https://github.com/bamr87/zer0-mistakes"
  s.license                  = "MIT"

  s.metadata["plugin_type"]  = "theme"
  s.metadata["allowed_push_host"] = "https://rubygems.org"

  s.files                    = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(data|includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end

  s.required_ruby_version    = ">= 2.7.0"
  s.add_runtime_dependency "jekyll"
  s.add_development_dependency "bundler", "~> 2.3"
  s.add_development_dependency "rake", "~> 13.0"
  s.add_development_dependency "rspec", "~> 3.0"
end
```

### 3. Package Metadata (`package.json`)

```json
{
  "name": "zer0-mistakes",
  "private": true,
  "version": "0.6.0",
  "description": "Bootstrap Jekyll theme for headless Github Pages CMS.",
  "repository": {
    "type": "git",
    "url": "https://github.com/bamr87/zer0-mistakes.git"
  },
  "keywords": ["jekyll", "theme", "zer0"],
  "author": "Amr Abdel-Motaleb",
  "license": "MIT",
  "homepage": "https://bamr87.github.io/zer0-mistakes/"
}
```

### 4. Makefile Interface

```makefile
.DEFAULT_GOAL := help

# Version from package.json
VERSION := $(shell jq -r '.version' package.json 2>/dev/null || echo "unknown")

##@ Setup
setup: ## Set up development environment
	@./scripts/setup.sh

##@ Development
test: ## Run all tests
	@./scripts/test.sh

##@ Version Management
version-patch: ## Bump patch version (0.0.X)
	@./scripts/version.sh patch

version-minor: ## Bump minor version (0.X.0)
	@./scripts/version.sh minor

version-major: ## Bump major version (X.0.0)
	@./scripts/version.sh major

##@ Build & Release
build: test ## Build gem
	@./scripts/build.sh

release-patch: version-patch build publish ## Full patch release
	@echo "Patch release complete!"

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
```

## 🚀 Automated Release System

### Version Bump Automation (`scripts/version.sh`)

```bash
#!/bin/bash

# Version management script for zer0-mistakes Jekyll theme
# Usage: ./scripts/version.sh [patch|minor|major] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE="${1:-patch}"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        patch|minor|major)
            VERSION_TYPE="$1"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to log messages
log() {
    echo -e "${GREEN}[VERSION]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    error "Working directory is not clean. Please commit or stash changes first."
fi

# Check if version.rb exists
if [[ ! -f "lib/jekyll-theme-zer0/version.rb" ]]; then
    error "lib/jekyll-theme-zer0/version.rb not found"
fi

# Check if gemspec exists
if [[ ! -f "jekyll-theme-zer0.gemspec" ]]; then
    error "jekyll-theme-zer0.gemspec not found"
fi

# Get current version from Ruby version file
CURRENT_VERSION=$(grep -o 'VERSION = "[^"]*"' lib/jekyll-theme-zer0/version.rb | sed 's/VERSION = "\(.*\)"/\1/')
if [[ -z "$CURRENT_VERSION" ]]; then
    error "Could not read version from lib/jekyll-theme-zer0/version.rb"
fi

log "Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
log "New version: $NEW_VERSION"

if [[ "$DRY_RUN" == true ]]; then
    log "Dry run mode - no changes will be made"
    log "Would update version from $CURRENT_VERSION to $NEW_VERSION"
    exit 0
fi

# Update version.rb
log "Updating lib/jekyll-theme-zer0/version.rb..."
sed -i.bak "s/VERSION = \".*\"/VERSION = \"$NEW_VERSION\"/" lib/jekyll-theme-zer0/version.rb
rm lib/jekyll-theme-zer0/version.rb.bak 2>/dev/null || true

# Update package.json to keep in sync
if [[ -f "package.json" ]]; then
    log "Updating package.json..."
    jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
fi

# Validate gemspec can be built
log "Validating gemspec..."
if ! gem build jekyll-theme-zer0.gemspec > /dev/null 2>&1; then
    error "Failed to build gemspec"
fi

# Clean up test gem file
rm -f jekyll-theme-zer0-*.gem

# Update CHANGELOG if it exists
if [[ -f "CHANGELOG.md" ]]; then
    log "Updating CHANGELOG.md..."
    DATE=$(date +"%Y-%m-%d")
    sed -i.bak "1s/^/## [$NEW_VERSION] - $DATE\n\n### Changed\n- Version bump to $NEW_VERSION\n\n/" CHANGELOG.md
    rm CHANGELOG.md.bak 2>/dev/null || true
fi

# Git operations
log "Committing changes..."
git add lib/jekyll-theme-zer0/version.rb
[[ -f "package.json" ]] && git add package.json
[[ -f "CHANGELOG.md" ]] && git add CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"

log "Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

log "Version bump complete!"
log "Current version: $NEW_VERSION"
log "Tagged as: v$NEW_VERSION"
log ""
log "Next steps:"
log "1. Run 'git push origin main --tags' to push changes and tags"
log "2. Run './scripts/build.sh' to build and publish the gem"
```

### Gem Publication Automation (`scripts/gem-publish.sh`)

```bash
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

# ... (rest of the script logic, summarized for brevity in prompt but full in file)
# [See scripts/gem-publish.sh for full implementation]
```

### Installation Script (`install.sh`)

```bash
#!/bin/bash

# zer0-mistakes Jekyll Theme Installer
# IT-Journey Project - AI-Powered Development

set -euo pipefail

# ... (rest of the script logic, summarized for brevity in prompt but full in file)
# [See install.sh for full implementation]
```
