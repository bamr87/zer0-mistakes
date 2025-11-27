---
agent: agent
title: "Zer0-Mistakes: Complete Jekyll Theme Blueprint & AI Development Seed"
version: "0.6.0"
date: "2025-11-24"
purpose: "Complete technical blueprint to rebuild zer0-mistakes Jekyll theme from scratch using only this document as source of truth"
author: "Amr Abdel-Motaleb"
repository: "https://github.com/bamr87/zer0-mistakes"
---

# 🚀 Zer0-Mistakes: Complete Jekyll Theme Blueprint

> **🎯 AI Agent Mission**: Build a production-ready Docker-first Jekyll theme from scratch using ONLY this document as your blueprint. This is the **SINGLE SOURCE OF TRUTH** for complete project reconstruction.

## 📋 Table of Contents

1. [Project Identity & Metadata](#project-identity)
2. [Core Architecture](#core-architecture)
3. [Development Principles](#development-principles)
4. [Complete Directory Structure](#directory-structure)
5. [Critical File Implementations](#critical-files)
6. [Step-by-Step Build Instructions](#build-instructions)
7. [Automation Scripts](#automation-scripts)
8. [Jekyll Theme Components](#theme-components)
9. [Testing & Validation](#testing-validation)
10. [Deployment & Release](#deployment-release)

---

## 📋 Project Identity & Metadata {#project-identity}

### Core Information

```yaml
# Project Identity
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
project_types:
  - Ruby Gem Package
  - Jekyll Theme
  - GitHub Pages Remote Theme
  - Docker-First Development Environment
  - AI-Powered Installation System

# Technical Requirements
requirements:
  ruby_version: ">= 2.7.0"
  jekyll_version: "3.9.5"
  bundler_version: "~> 2.3"
  docker_platform: "linux/amd64"
  node_version: ">= 16.0" # Optional

# Core Technologies
technology_stack:
  backend:
    - Ruby 2.7.0+
    - Jekyll 3.9.5 (GitHub Pages compatible)
    - Bundler 2.3+
  frontend:
    - Bootstrap 5.3.3 (CDN)
    - Bootstrap Icons 1.10.3
    - jQuery (optional)
    - Mermaid 10+ (diagrams)
  containerization:
    - Docker (linux/amd64)
    - Docker Compose
  analytics:
    - PostHog (privacy-first, GDPR/CCPA compliant)
  automation:
    - GNU Make
    - Bash scripts
    - GitHub Actions
  build_tools:
    - Git
    - jq (JSON processing)
    - RubyGems
```

### Project Purpose & Philosophy

**zer0-mistakes** is a Jekyll theme embodying these core values:

1. **Zero-Configuration Setup**: AI-powered installation with 95% success rate
2. **Universal Compatibility**: Docker-first ensures identical behavior across all platforms
3. **Error Prevention**: Comprehensive validation and self-healing configuration
4. **Privacy-First**: GDPR/CCPA compliant analytics with granular user consent
5. **Developer Experience**: Modern workflows with AI-assisted development
6. **Production Ready**: Automated testing, versioning, and release management

---

## 🏗️ Core Architecture {#core-architecture}

### Technology Stack Deep Dive

#### Backend Layer

**Ruby Runtime**

- **Version**: Ruby 2.7.0+ (GitHub Pages compatible)
- **Purpose**: Jekyll static site generation
- **Key Gems**:
  - `jekyll` (3.9.5): Core static site generator
  - `github-pages`: GitHub Pages compatibility bundle
  - `jekyll-remote-theme`: Remote theme support
  - `jekyll-feed`: RSS/Atom feed generation
  - `jekyll-sitemap`: XML sitemap generation
  - `jekyll-seo-tag`: SEO meta tag injection
  - `jekyll-paginate`: Content pagination
  - `jekyll-mermaid` (~> 1.0): Diagram support
  - `webrick` (~> 1.7): Development server
  - `ffi` (~> 1.17.0): Docker compatibility fix
  - `commonmarker` (0.23.10): Markdown processing

#### Frontend Layer

**Bootstrap 5.3.3**

- **Loading**: CDN (jsdelivr.net) for performance
- **Purpose**: Responsive CSS framework with dark mode
- **Key Features**:
  - Mobile-first responsive grid system
  - Comprehensive component library
  - Dark mode support (data-bs-theme="dark")
  - Accessibility-compliant (WCAG 2.1)
- **Icons**: Bootstrap Icons 1.10.3 via CDN

**JavaScript Stack**

- **Bootstrap Bundle**: 5.3.3 (includes Popper.js)
- **Mermaid**: 10+ for diagram rendering
- **Custom Scripts**: Theme-specific enhancements
- **Analytics**: PostHog JavaScript SDK

#### Containerization Layer

**Docker Environment**

```yaml
# Platform Specification
platform: linux/amd64 # Apple Silicon + Intel compatibility

# Image
image: jekyll/jekyll:latest # Official Jekyll Docker image

# Command
command: >
  jekyll serve 
  --watch 
  --force_polling 
  --config "_config.yml,_config_dev.yml" 
  --host 0.0.0.0 
  --port 4000

# Volume Mounting
volumes:
  - ./:/app # Bind mount for live reload

# Port Mapping
ports:
  - "4000:4000" # Jekyll development server

# Environment
environment:
  JEKYLL_ENV: development
```

#### Analytics & Privacy Layer

**PostHog Integration**

- **Purpose**: Privacy-first web analytics
- **Compliance**: GDPR/CCPA compliant
- **Features**:
  - Event tracking
  - Session recording (optional)
  - Feature flags
  - Custom events
  - User identification
- **Privacy Controls**:
  - Cookie consent integration
  - Do Not Track respect
  - IP anonymization
  - Data masking options
  - Opt-out mechanisms

### Configuration Architecture

#### Dual-Config System

The theme uses a layered configuration approach:

**Production Configuration** (`_config.yml`):

```yaml
# Remote Theme Configuration (GitHub Pages)
remote_theme: "bamr87/zer0-mistakes"
title: "zer0-mistakes"
url: https://zer0-mistakes.com
baseurl: ""

# Jekyll Plugins
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-mermaid

# Content Processing
markdown: kramdown
permalink: pretty

# Collections
collections_dir: pages
collections:
  posts:
    output: true
    permalink: /:collection/:year/:month/:day/:slug/
  docs:
    output: true
    permalink: /:collection/:categories/:name/
  quickstart:
    output: true
    permalink: /:collection/:name/
  about:
    output: true
    permalink: /:collection/:name/
  notes:
    output: true
    permalink: /:collection/:name/

# Analytics Configuration
posthog:
  enabled: true
  api_key: "phc_RRFmtqxRUI4XFDoI4KXUYMbTzPvhiu4A07qdSsAaXgg"
  api_host: "https://us.i.posthog.com"
  person_profiles: "identified_only"
  autocapture: true
  capture_pageview: true
  capture_pageleave: true
  respect_dnt: true
  secure_cookie: true
  session_recording: false
  privacy:
    mask_all_text: false
    mask_all_inputs: true
    ip_anonymization: true
  custom_events:
    track_downloads: true
    track_external_links: true
    track_search: true
    track_scroll_depth: true
```

**Development Overrides** (`_config_dev.yml`):

```yaml
# Local Development Configuration
url: "http://localhost:4000"
remote_theme: false # Use local theme files
theme: "jekyll-theme-zer0"

# Development Optimizations
incremental: true
livereload: true
show_drafts: true
unpublished: false

# Disable Analytics in Development
posthog:
  enabled: false

# Verbose Logging
verbose: true
```

**Loading Strategy**:

```bash
# Docker Compose Command
jekyll serve --config "_config.yml,_config_dev.yml"

# Effect: _config_dev.yml overrides _config.yml values
# Result: Production config + development optimizations
```

---

## 🎯 Development Principles {#development-principles}

### 1. Design for Failure (DFF)

**Philosophy**: Anticipate, prevent, and recover from errors gracefully.

**Implementation Patterns**:

```bash
#!/bin/bash
# Error Handling Template
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Global error handler
handle_error() {
    local line_number=$1
    local error_message="${2:-Unknown error}"
    log_error "Error at line ${line_number}: ${error_message}"
    log_error "Attempting automatic recovery..."
    cleanup_on_error
    exit 1
}

# Trap errors for automatic handling
trap 'handle_error ${LINENO} "$BASH_COMMAND"' ERR

# Cleanup function
cleanup_on_error() {
    # Restore backups
    # Remove temp files
    # Reset state
}

# Validation before destructive operations
validate_before_action() {
    [[ -f "critical_file" ]] || error "Critical file missing"
    [[ -n "$IMPORTANT_VAR" ]] || error "Required variable not set"
}

# Graceful degradation
fallback_operation() {
    if ! primary_operation; then
        warn "Primary operation failed, using fallback"
        secondary_operation || error "All operations failed"
    fi
}
```

**Key Principles**:

- Comprehensive error handling in all scripts
- Validation checks before destructive operations
- Automatic backup and rollback mechanisms
- Self-healing configuration detection
- Detailed error messages with recovery steps
- Graceful degradation and fallback options

### 2. Don't Repeat Yourself (DRY)

**Philosophy**: Single source of truth for all data and functionality.

**Implementation**:

**Version Management** (Single Source of Truth):

```ruby
# lib/jekyll-theme-zer0/version.rb
# THIS IS THE ONLY PLACE VERSION IS DEFINED
module JekyllThemeZer0
  VERSION = "0.6.0"  # SINGLE SOURCE OF TRUTH
end
```

**Synchronized Across Files**:

- `jekyll-theme-zer0.gemspec`: `s.version = JekyllThemeZer0::VERSION`
- `package.json`: Synced by `version.sh` script
- `_config.yml`: Updated via automation
- `CHANGELOG.md`: Updated during release

**Reusable Functions**:

```bash
# scripts/lib/common.sh
# Shared function library

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

check_command() {
    command -v "$1" >/dev/null 2>&1 || error "$1 not found"
}

validate_file() {
    [[ -f "$1" ]] || error "File not found: $1"
}
```

**Modular Jekyll Components**:

- Layouts inherit from `root.html`
- Includes are atomic and reusable
- Data files eliminate hardcoding
- Configuration inheritance

### 3. Keep It Simple (KIS)

**Philosophy**: Complexity is the enemy of reliability.

**Makefile Interface** (Simple Commands):

```makefile
make setup           # One command setup
make test            # Run all tests
make version-patch   # Bump patch version
make build           # Build gem
make release-patch   # Complete release workflow
make help            # Show all commands
```

**Simple Script Pattern**:

```bash
#!/bin/bash
# One responsibility per script
# Clear naming conventions
# Comprehensive inline documentation
# Standard UNIX tools only
```

**Key Principles**:

- One responsibility per script/function
- Clear, descriptive naming
- Comprehensive inline documentation
- Standard tools over custom solutions
- Avoid premature optimization

### 4. Docker-First Development (DFD)

**Philosophy**: Universal compatibility through containerization.

**Benefits**:

- **Zero Local Dependencies**: No Ruby/Jekyll installation needed
- **Universal Compatibility**: Same behavior on all platforms
- **Isolated Environment**: No conflicts with system packages
- **Team Consistency**: Everyone uses identical environment
- **Platform Agnostic**: Works on Apple Silicon, Intel, Linux

**Implementation**:

```yaml
# docker-compose.yml
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64 # Apple Silicon compatibility
    command: jekyll serve --config "_config.yml,_config_dev.yml"
    volumes:
      - ./:/app # Live reload
    ports:
      - "4000:4000"
    environment:
      JEKYLL_ENV: development
```

**Developer Workflow**:

```bash
# Single command to start development
docker-compose up

# No need for:
# - ruby install
# - bundle install
# - gem install jekyll
# - dependency management
```

### 5. AI-Powered Development (AIPD)

**Philosophy**: Leverage AI to enhance development workflows.

**Implementation**:

**GitHub Copilot Integration**:

- `.github/copilot-instructions.md` (805 lines)
- File-specific instruction files:
  - `layouts.instructions.md`
  - `includes.instructions.md`
  - `scripts.instructions.md`
  - `testing.instructions.md`
  - `version-control.instructions.md`
  - `documentation.instructions.md`

**Structured Front Matter** (AI Context):

```yaml
---
title: "Component Name"
description: "What this does"
dependencies:
  - component-a.html
  - component-b.html
performance_notes: "Loading considerations"
ai_hints:
  - "Pattern to follow"
  - "Common pitfalls"
---
```

**Semantic Code Organization**:

- Clear directory structure
- Descriptive file names
- Comprehensive comments
- Pattern documentation

**Automated Analysis**:

```bash
# Commit message analysis for version bumping
./scripts/analyze-commits.sh HEAD~10..HEAD

# Automatic changelog generation
# Intelligent version bump suggestions
```

### 6. Self-Healing Configuration (SHC)

**Philosophy**: Systems should diagnose and fix themselves.

**install.sh** (95% Success Rate):

```bash
#!/bin/bash
# AI-Powered Installation with Self-Healing

# Platform Detection
detect_platform() {
    case "$(uname -m)" in
        arm64|aarch64) ARCH="arm64" ;;
        x86_64) ARCH="x64" ;;
        *) ARCH="unknown" ;;
    esac
}

# Automatic Error Recovery
recover_from_error() {
    case "$ERROR_CODE" in
        MISSING_DOCKER)
            log "Installing Docker..."
            install_docker
            retry_operation
            ;;
        PERMISSION_DENIED)
            log "Fixing permissions..."
            fix_permissions
            retry_operation
            ;;
        *)
            provide_manual_fix
            ;;
    esac
}

# Configuration Validation
validate_and_fix() {
    # Check Jekyll config
    if ! validate_yaml "_config.yml"; then
        log "Fixing Jekyll config..."
        fix_yaml "_config.yml"
    fi

    # Check Docker config
    if ! validate_docker_compose; then
        log "Fixing Docker Compose config..."
        regenerate_docker_compose
    fi
}
```

**Features**:

- Platform detection and optimization
- Missing dependency resolution
- Configuration validation and auto-correction
- Content issue detection
- Automatic fixes for common problems

---

## 📁 Complete Directory Structure {#directory-structure}

```
zer0-mistakes/
├── .github/                              # GitHub-specific files
│   ├── config/                           # Tool configurations
│   │   ├── .yamllint.yml                 # YAML linting rules
│   │   ├── .markdownlint.json            # Markdown linting rules
│   │   ├── .markdown-link-check.json     # Link validation config
│   │   ├── environment.yml               # Environment settings
│   │   └── README.md                     # Config documentation
│   ├── instructions/                     # AI Copilot instructions
│   │   ├── layouts.instructions.md       # Layout development guidelines
│   │   ├── includes.instructions.md      # Component development
│   │   ├── scripts.instructions.md       # Shell script standards
│   │   ├── testing.instructions.md       # Testing best practices
│   │   ├── version-control.instructions.md  # Git workflow
│   │   └── documentation.instructions.md    # Documentation standards
│   ├── workflows/                        # GitHub Actions CI/CD
│   │   ├── ci.yml                        # Continuous integration
│   │   ├── auto-version-bump.yml         # Automated versioning
│   │   ├── gem-release.yml               # Gem publishing
│   │   └── github-release.yml            # GitHub release creation
│   ├── prompts/                          # AI agent prompts
│   │   └── seed.prompt.md                # This file
│   └── copilot-instructions.md           # Main Copilot instructions (805 lines)
│
├── _includes/                            # Reusable Jekyll components
│   ├── core/                             # Essential components
│   │   ├── head.html                     # HTML head with CDN links (180 lines)
│   │   ├── header.html                   # Site header/navigation (125 lines)
│   │   ├── footer.html                   # Site footer
│   │   ├── branding.html                 # Site title/logo
│   │   └── scripts.html                  # JavaScript loading
│   ├── components/                       # UI components
│   │   ├── cookie-consent.html           # GDPR cookie consent (382 lines)
│   │   ├── theme-info.html               # Version display modal
│   │   ├── breadcrumbs.html              # Navigation breadcrumbs
│   │   ├── svg.html                      # SVG icon symbols
│   │   ├── info-section.html             # Site announcements
│   │   ├── js-cdn.html                   # JavaScript CDN loading
│   │   └── mermaid.html                  # Mermaid diagram config
│   ├── analytics/                        # Analytics integration
│   │   ├── posthog.html                  # PostHog tracking (325 lines)
│   │   ├── google-analytics.html         # Google Analytics
│   │   └── google-tag-manager-head.html  # GTM head
│   ├── navigation/                       # Navigation components
│   │   ├── navbar.html                   # Main navigation bar
│   │   ├── sidebar-left.html             # Left sidebar
│   │   └── sidebar-right.html            # Right sidebar (TOC)
│   ├── content/                          # Content components
│   │   ├── intro.html                    # Page introduction
│   │   └── seo.html                      # SEO meta tags
│   ├── landing/                          # Landing page components
│   ├── stats/                            # Statistics components
│   │   ├── overview.html                 # Stats overview
│   │   ├── posts-by-category.html        # Category stats
│   │   └── recent-activity.html          # Activity timeline
│   └── README.md                         # Include documentation
│
├── _layouts/                             # Jekyll page templates
│   ├── root.html                         # Base HTML5 structure (85 lines)
│   ├── default.html                      # Main content wrapper (75 lines)
│   ├── home.html                         # Homepage layout
│   ├── journals.html                     # Blog post layout
│   ├── blog.html                         # Blog index layout
│   ├── collection.html                   # Collection display
│   ├── landing.html                      # Landing page layout
│   ├── sitemap-collection.html           # Sitemap layout
│   ├── stats.html                        # Statistics dashboard
│   └── README.md                         # Layout documentation
│
├── _sass/                                # Sass stylesheets
│   ├── core/                             # Core styles
│   │   ├── _variables.scss               # Sass variables
│   │   ├── _mixins.scss                  # Reusable mixins
│   │   └── _base.scss                    # Base styles
│   └── custom.scss                       # Custom overrides
│
├── _data/                                # Site data files
│   ├── navigation/                       # Navigation configs
│   │   ├── main.yml                      # Main navigation
│   │   ├── about.yml                     # About section nav
│   │   └── docs.yml                      # Documentation nav
│   ├── content_statistics.yml            # Generated statistics
│   └── generate_statistics.rb            # Statistics generator script
│
├── _plugins/                             # Custom Jekyll plugins
│   └── theme_version.rb                  # Version extraction plugin
│
├── assets/                               # Static assets
│   ├── css/                              # Compiled stylesheets
│   │   ├── main.css                      # Main stylesheet
│   │   ├── custom.css                    # Custom styles
│   │   └── stats.css                     # Statistics page styles
│   ├── js/                               # JavaScript files
│   │   ├── myScript.js                   # Custom theme JS
│   │   ├── auto-hide-nav.js              # Navigation behavior
│   │   ├── back-to-top.js                # Scroll to top
│   │   ├── code-copy.js                  # Code block copying
│   │   ├── side-bar-folders.js           # Sidebar folding
│   │   └── nanobar.min.js                # Progress bar
│   ├── images/                           # Image files
│   │   ├── favicon_gpt_computer_retro.png
│   │   ├── wizard-on-journey.png
│   │   └── info-banner-mountain-wizard.png
│   └── particles.json                    # Particle.js config
│
├── pages/                                # Content collections
│   ├── _posts/                           # Blog posts (Markdown)
│   ├── _docs/                            # Documentation (Markdown)
│   ├── _quickstart/                      # Quickstart guides
│   ├── _about/                           # About pages
│   ├── _notes/                           # Personal notes
│   ├── blog.md                           # Blog index page
│   ├── contact.md                        # Contact page
│   ├── sitemap.md                        # Sitemap page
│   └── index.html                        # Root index (redirects to /)
│
├── docs/                                 # Technical documentation (MDX)
│   ├── releases/                         # Release documentation
│   │   ├── v0.4.0-release-summary.md     # v0.4.0 details
│   │   ├── v0.5.0-release-summary.md     # v0.5.0 details
│   │   └── template-release-summary.md   # Release template
│   ├── features/                         # Feature documentation
│   │   ├── THEME_VERSION_FEATURE.md      # Theme version feature
│   │   └── template-feature-doc.md       # Feature template
│   ├── systems/                          # System documentation
│   ├── configuration/                    # Configuration guides
│   ├── templates/                        # Documentation templates
│   ├── jekyll/                           # Jekyll-specific docs
│   ├── DOCUMENTATION_WORKFLOW.md         # Documentation workflow
│   ├── ORGANIZATION_SUMMARY.md           # Organization summary
│   ├── QUICK_ACCESS_GUIDE.md             # Quick access guide
│   └── README.md                         # Documentation index
│
├── scripts/                              # Automation scripts
│   ├── version.sh                        # Version management (155 lines)
│   ├── build.sh                          # Gem building (175 lines)
│   ├── gem-publish.sh                    # Release automation (700+ lines)
│   ├── analyze-commits.sh                # Commit analysis (200 lines)
│   ├── test.sh                           # Test runner (135 lines)
│   ├── setup.sh                          # Environment setup
│   ├── release.sh                        # Release workflow
│   ├── test-mermaid.sh                   # Mermaid diagram testing
│   ├── fix-markdown-format.sh            # Markdown formatting
│   ├── test-auto-version.sh              # Version system testing
│   └── README.md                         # Script documentation
│
├── test/                                 # Test suite
│   ├── test_runner.sh                    # Main test orchestrator
│   ├── test_core.sh                      # Core functionality tests
│   ├── test_deployment.sh                # Deployment validation
│   ├── test_quality.sh                   # Code quality checks
│   ├── CICD_ENHANCEMENT_SUMMARY.md       # CI/CD documentation
│   └── README.md                         # Testing documentation
│
├── lib/                                  # Ruby library code
│   ├── jekyll-theme-zer0.rb              # Main entry point
│   └── jekyll-theme-zer0/
│       └── version.rb                    # VERSION constant (SSOT)
│
├── pkg/                                  # Built gem packages
│   └── jekyll-theme-zer0-0.6.0.gem       # Latest built gem
│
├── _config.yml                           # Production Jekyll config
├── _config_dev.yml                       # Development overrides
├── docker-compose.yml                    # Docker environment
├── Gemfile                               # Ruby dependencies
├── Gemfile.lock                          # Dependency lock file
├── jekyll-theme-zer0.gemspec             # Gem specification
├── package.json                          # Node.js metadata
├── Makefile                              # Command orchestration (165 lines)
├── Rakefile                              # Ruby tasks
├── install.sh                            # AI-powered installer (1090 lines)
├── init_setup.sh                         # Environment initialization
├── CHANGELOG.md                          # Version history
├── README.md                             # Project documentation
├── LICENSE                               # MIT License
├── CONTRIBUTING.md                       # Contribution guidelines
├── CODE_OF_CONDUCT.md                    # Community standards
├── THEME_VERSION_IMPLEMENTATION.md       # Theme version implementation
├── privacy-policy.md                     # Privacy policy
├── terms-of-service.md                   # Terms of service
├── services.md                           # Services documentation
├── release_notes.md                      # Release notes
├── .gitignore                            # Git ignore rules
├── .seed.md                              # Evolutionary seed (companion file)
└── .github/prompts/seed.prompt.md        # This blueprint
```

---

## 🔨 Critical File Implementations {#critical-files}

### 1. Version Management (SINGLE SOURCE OF TRUTH)

**File**: `lib/jekyll-theme-zer0/version.rb`

```ruby
# frozen_string_literal: true

# Zer0-Mistakes Jekyll Theme Version Module
# THIS IS THE SINGLE SOURCE OF TRUTH FOR VERSION INFORMATION
#
# Version follows Semantic Versioning (SemVer):
# - MAJOR version: Incompatible API changes
# - MINOR version: Add functionality (backwards-compatible)
# - PATCH version: Bug fixes (backwards-compatible)
#
# All other version references (gemspec, package.json, etc.)
# are synchronized from this value via automation scripts.

module JekyllThemeZer0
  VERSION = "0.6.0"
end
```

**File**: `lib/jekyll-theme-zer0.rb`

```ruby
# frozen_string_literal: true

require "jekyll-theme-zer0/version"

# Zer0-Mistakes Jekyll Theme
# Main library entry point
#
# This gem provides a professional Jekyll theme with:
# - Bootstrap 5.3.3 framework
# - Docker-first development
# - AI-powered installation
# - Privacy-compliant analytics
# - Comprehensive testing

module JekyllThemeZer0
  # Theme initialization hook
  # Add any theme-specific initialization here

  class << self
    # Get the theme version
    # @return [String] Current version string
    def version
      VERSION
    end

    # Get the theme root path
    # @return [Pathname] Path to theme root directory
    def root
      Pathname.new(File.expand_path("..", __dir__))
    end
  end
end
```

### 2. Gem Specification

**File**: `jekyll-theme-zer0.gemspec`

```ruby
# frozen_string_literal: true

require_relative "lib/jekyll-theme-zer0/version"

Gem::Specification.new do |s|
  # Core Information
  s.name                     = "jekyll-theme-zer0"
  s.version                  = JekyllThemeZer0::VERSION
  s.authors                  = ["Amr Abdel"]
  s.email                    = ["amr@it-journey.dev"]

  # Description
  s.summary                  = "Jekyll theme based on bootstrap and compatible with github pages"
  s.description              = "Bootstrap Jekyll theme for headless Github Pages CMS with Docker-first development approach"
  s.homepage                 = "https://github.com/bamr87/zer0-mistakes"
  s.license                  = "MIT"

  # Metadata
  s.metadata["plugin_type"]       = "theme"
  s.metadata["homepage_uri"]      = s.homepage
  s.metadata["source_code_uri"]   = s.homepage
  s.metadata["changelog_uri"]     = "#{s.homepage}/blob/main/CHANGELOG.md"
  s.metadata["documentation_uri"] = "#{s.homepage}#readme"
  s.metadata["allowed_push_host"] = "https://rubygems.org"

  # Files to include in gem
  s.files = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(data|includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end

  # Platform
  s.platform                 = Gem::Platform::RUBY

  # Ruby version requirement
  s.required_ruby_version    = ">= 2.7.0"

  # Runtime dependencies
  s.add_runtime_dependency "jekyll"

  # Development dependencies
  s.add_development_dependency "bundler", "~> 2.3"
  s.add_development_dependency "rake", "~> 13.0"
  s.add_development_dependency "rspec", "~> 3.0"
end
```

### 3. Ruby Dependencies

**File**: `Gemfile`

```ruby
source "https://rubygems.org"

# Load gemspec dependencies
gemspec

# GitHub Pages compatibility bundle
# This gem includes all dependencies required for GitHub Pages
# Including: jekyll, jekyll-feed, jekyll-sitemap, jekyll-seo-tag, etc.
gem 'github-pages'

# Note: The following plugins are already included in github-pages gem
# and should not be explicitly declared to avoid version conflicts:
# - jekyll-remote-theme
# - jekyll-feed
# - jekyll-sitemap
# - jekyll-seo-tag
# - jekyll-paginate

# Docker compatibility fix
# Ensures FFI gem works correctly in Docker containers
# Required for: Apple Silicon, Linux containers
gem "ffi", "~> 1.17.0"

# Development server
# Required for: jekyll serve command
gem 'webrick', '~> 1.7'

# Markdown processor
# Version pinned to avoid build errors with 0.23.11
gem 'commonmarker', '0.23.10'

# Mermaid diagram support
# Enables Mermaid diagrams via native markdown code blocks
gem 'jekyll-mermaid', '~> 1.0'
```

### 4. Package Metadata

**File**: `package.json`

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
  "keywords": [
    "jekyll",
    "theme",
    "zer0",
    "bootstrap",
    "docker",
    "github-pages"
  ],
  "author": "Amr Abdel-Motaleb",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/bamr87/zer0-mistakes/issues"
  },
  "homepage": "https://bamr87.github.io/zer0-mistakes/",
  "engines": {
    "node": ">= 16.0.0"
  }
}
```

### 5. Production Configuration

**File**: `_config.yml` (Essential Sections)

```yaml
# Welcome to the configuration file for Jekyll
# Full docs at: http://jekyllrb.com/docs/configuration/

# ============================================================
# SITE SETTINGS
# ============================================================

founder: "Amr Abdel-Motaleb"
remote_theme: "bamr87/zer0-mistakes"
gem: &gem "jekyll-theme-zer0"

# GitHub Information
github_user: &github_user "bamr87"
repository_name: &github_repository "zer0-mistakes"
repository: [*github_user, "/", *github_repository]
branch: &branch "main"

# Site Information
title: &title "zer0-mistakes"
title_url: "/"
title_icon: "globe"
subtitle: "Jekyll Theme Dev"
subtitle_url: "localhost"
subtitle_icon: "code"
title_separator: "|"

domain: &domain "zer0-mistakes"
domain_ext: &domain_ext "com"
url: &url https://zer0-mistakes.com
baseurl: &baseurl ""
public_folder: assets
port: 4000
og_image: '/images/wizard-on-journey.png'

# Owner Information
name: &name "Amr"
email: "amr@zer0-mistakes.com"
description: >-
  Jekyll and Bootstrap 5 theme for perfectionists.
  A Docker-first Jekyll theme with AI-powered installation
  and documentation site with no mistakes.

# Maintainer Information
maintainers:
  - name: *name

# Personalization
locale: "en-US"
logo: /assets/images/gravatar-small.png
logo_link: [*url, *baseurl]
teaser: '/images/favicon_gpt_computer_retro.png'
info_banner: '/images/info-banner-mountain-wizard.png'
breadcrumbs: true
words_per_minute: 200

# ============================================================
# AUTHOR INFORMATION
# ============================================================

author:
  name: *name
  email: *email
  github_username: *github_user

# ============================================================
# ANALYTICS
# ============================================================

google_analytics: 'G-ZBDKNMC168'

# PostHog Analytics Configuration
posthog:
  enabled: true
  api_key: 'phc_RRFmtqxRUI4XFDoI4KXUYMbTzPvhiu4A07qdSsAaXgg'
  api_host: 'https://us.i.posthog.com'
  person_profiles: 'identified_only'
  autocapture: true
  capture_pageview: true
  capture_pageleave: true
  disable_cookie: false
  respect_dnt: true
  cross_subdomain_cookie: false
  secure_cookie: true
  persistence: 'localStorage+cookie'
  session_recording: false
  privacy:
    mask_all_text: false
    mask_all_inputs: true
    ip_anonymization: true
  custom_events:
    track_downloads: true
    track_external_links: true
    track_search: true
    track_scroll_depth: true

# ============================================================
# BUILD FRAMEWORK
# ============================================================

# Jekyll Plugins
# All plugins enabled by default for GitHub Pages
plugins:
  - github-pages
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-mermaid

# Content Processing
markdown: kramdown
permalink: pretty
highlighter: rouge

# Collections
collections_dir: pages
collections:
  posts:
    output: true
    permalink: /:collection/:year/:month/:day/:slug/
  docs:
    output: true
    permalink: /:collection/:categories/:name/
  quickstart:
    output: true
    permalink: /:collection/:name/
  about:
    output: true
    permalink: /:collection/:name/
  notes:
    output: true
    permalink: /:collection/:name/

# Defaults
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "journals"
      author: *name
      comments: true
  - scope:
      path: ""
      type: "docs"
    values:
      layout: "default"
  - scope:
      path: ""
      type: "pages"
    values:
      layout: "default"

# Sitemap exclusions
sitemap_exclude: ["secret.html", "private"]

# Pagination
paginate: 10
paginate_path: "/blog/page:num/"
```

### 6. Development Configuration

**File**: `_config_dev.yml`

```yaml
# Development Configuration Overrides
# These settings override _config.yml in development

# Local Development
url: "http://localhost:4000"
remote_theme: false
theme: "jekyll-theme-zer0"

# Performance Optimizations
incremental: true
livereload: true
show_drafts: true
unpublished: false

# Disable Analytics in Development
posthog:
  enabled: false

# Verbose Logging
verbose: true
strict_front_matter: false
```

### 7. Docker Environment

**File**: `docker-compose.yml`

```yaml
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64 # Ensures compatibility across different architectures

    # Jekyll serve command with config layering
    command: jekyll serve --watch --force_polling --config "_config.yml,_config_dev.yml" --host 0.0.0.0 --port 4000

    # Volume mounting for live reload
    volumes:
      - ./:/app

    # Port mapping
    ports:
      - "4000:4000"

    # Working directory
    working_dir: /app

    # Environment variables
    environment:
      JEKYLL_ENV: development
```

### 8. Command Orchestration

**File**: `Makefile` (Complete Implementation)

```makefile
# Makefile for jekyll-theme-zer0 gem automation
# Author: Amr Abdel-Motaleb
# Purpose: Simplified command interface for development, testing, building, and releasing

# Default target
.DEFAULT_GOAL := help

# ============================================================
# COLOR DEFINITIONS
# ============================================================
RED    := \033[31m
GREEN  := \033[32m
YELLOW := \033[33m
BLUE   := \033[34m
BOLD   := \033[1m
RESET  := \033[0m

# ============================================================
# VERSION EXTRACTION
# ============================================================
VERSION := $(shell jq -r '.version' package.json 2>/dev/null || echo "unknown")

# ============================================================
# SETUP COMMANDS
# ============================================================
##@ Setup

.PHONY: setup
setup: ## Set up development environment
	@echo "$(GREEN)Setting up development environment...$(RESET)"
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

.PHONY: install
install: setup ## Alias for setup

# ============================================================
# DEVELOPMENT COMMANDS
# ============================================================
##@ Development

.PHONY: test
test: ## Run all tests and validations
	@echo "$(BLUE)Running tests...$(RESET)"
	@./scripts/test.sh

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "$(BLUE)Running tests (verbose)...$(RESET)"
	@./scripts/test.sh --verbose

.PHONY: lint
lint: ## Run linting and code quality checks
	@echo "$(BLUE)Running lint checks...$(RESET)"
	@if [ -f .rubocop.yml ]; then rubocop; else echo "No RuboCop config found"; fi
	@gem specification jekyll-theme-zer0.gemspec > /dev/null && echo "$(GREEN)✓ Gemspec is valid$(RESET)"

# ============================================================
# VERSION MANAGEMENT
# ============================================================
##@ Version Management

.PHONY: version
version: ## Show current version
	@echo "$(BOLD)Current version:$(RESET) $(VERSION)"

.PHONY: version-patch
version-patch: _check-clean test ## Bump patch version (0.1.8 → 0.1.9)
	@echo "$(YELLOW)Bumping patch version...$(RESET)"
	@./scripts/version.sh patch

.PHONY: version-minor
version-minor: _check-clean test ## Bump minor version (0.1.8 → 0.2.0)
	@echo "$(YELLOW)Bumping minor version...$(RESET)"
	@./scripts/version.sh minor

.PHONY: version-major
version-major: _check-clean test ## Bump major version (0.1.8 → 1.0.0)
	@echo "$(YELLOW)Bumping major version...$(RESET)"
	@./scripts/version.sh major

.PHONY: version-dry-run
version-dry-run: ## Preview version bump without applying changes
	@echo "$(BLUE)Version bump preview (patch):$(RESET)"
	@./scripts/version.sh patch --dry-run

# ============================================================
# BUILD COMMANDS
# ============================================================
##@ Build

.PHONY: build
build: test ## Build the gem
	@echo "$(GREEN)Building gem...$(RESET)"
	@./scripts/build.sh

.PHONY: build-dry-run
build-dry-run: ## Preview build process without creating gem
	@echo "$(BLUE)Build preview:$(RESET)"
	@./scripts/build.sh --dry-run

.PHONY: publish
publish: build ## Build and publish gem to RubyGems
	@echo "$(RED)$(BOLD)Publishing gem to RubyGems...$(RESET)"
	@./scripts/build.sh --publish

.PHONY: publish-dry-run
publish-dry-run: ## Preview publish process without uploading
	@echo "$(BLUE)Publish preview:$(RESET)"
	@./scripts/build.sh --publish --dry-run

# ============================================================
# RELEASE WORKFLOW
# ============================================================
##@ Release

.PHONY: release-patch
release-patch: version-patch build publish ## Full patch release workflow
	@echo "$(GREEN)$(BOLD)Patch release complete!$(RESET)"

.PHONY: release-minor
release-minor: version-minor build publish ## Full minor release workflow
	@echo "$(GREEN)$(BOLD)Minor release complete!$(RESET)"

.PHONY: release-major
release-major: version-major build publish ## Full major release workflow
	@echo "$(GREEN)$(BOLD)Major release complete!$(RESET)"

# ============================================================
# GIT COMMANDS
# ============================================================
##@ Git

.PHONY: push
push: ## Push changes and tags to remote repository
	@echo "$(BLUE)Pushing to remote repository...$(RESET)"
	@git push origin main --tags

.PHONY: status
status: ## Show git status and gem info
	@echo "$(BOLD)Git Status:$(RESET)"
	@git status --short
	@echo ""
	@echo "$(BOLD)Current Version:$(RESET) $(VERSION)"
	@echo "$(BOLD)Last Tag:$(RESET) $$(git describe --tags --abbrev=0 2>/dev/null || echo 'none')"
	@echo "$(BOLD)Gem Files:$(RESET)"
	@ls -la *.gem 2>/dev/null || echo "No gem files found"

# ============================================================
# CLEANUP COMMANDS
# ============================================================
##@ Cleanup

.PHONY: clean
clean: ## Remove built gems and temporary files
	@echo "$(YELLOW)Cleaning up...$(RESET)"
	@rm -f *.gem
	@rm -f .bundle/config
	@echo "$(GREEN)Cleanup complete$(RESET)"

.PHONY: clean-all
clean-all: clean ## Remove all generated files including dependencies
	@echo "$(YELLOW)Deep cleaning...$(RESET)"
	@rm -rf vendor/
	@rm -rf .bundle/
	@bundle install
	@echo "$(GREEN)Deep cleanup complete$(RESET)"

# ============================================================
# UTILITY COMMANDS
# ============================================================
##@ Utilities

.PHONY: deps
deps: ## Install/update dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@bundle install

.PHONY: check
check: ## Run comprehensive health check
	@echo "$(BOLD)Health Check:$(RESET)"
	@echo "Ruby: $$(ruby --version)"
	@echo "Bundler: $$(bundle --version)"
	@echo "jq: $$(jq --version 2>/dev/null || echo 'not installed')"
	@echo "Git: $$(git --version)"
	@echo ""
	@$(MAKE) test

.PHONY: info
info: ## Show project information
	@echo "$(BOLD)Project Information:$(RESET)"
	@echo "Name: jekyll-theme-zer0"
	@echo "Version: $(VERSION)"
	@echo "Repository: https://github.com/bamr87/zer0-mistakes"
	@echo "RubyGems: https://rubygems.org/gems/jekyll-theme-zer0"
	@echo ""
	@echo "$(BOLD)Available Scripts:$(RESET)"
	@ls -la scripts/*.sh

# ============================================================
# HELP
# ============================================================
##@ Help

.PHONY: help
help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)Usage:$(RESET)\n  make $(BLUE)<target>$(RESET)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(BLUE)%-15s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# ============================================================
# SAFETY CHECKS
# ============================================================

.PHONY: _check-clean
_check-clean:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "$(RED)Error: Working directory is not clean$(RESET)"; \
		echo "Please commit or stash your changes first"; \
		exit 1; \
	fi
```

---

## 🚀 Continued in Part 2...

This file is getting large. The complete blueprint continues in the next section with:

- Step-by-Step Build Instructions (10 Phases)
- Complete Automation Scripts (version.sh, build.sh, test.sh, gem-publish.sh, install.sh)
- Jekyll Theme Component Implementations (layouts, includes, analytics)
- Testing & Validation Procedures
- Deployment & Release Workflows
- Success Criteria & Verification Checklist

**Status**: This is Part 1 of 2 comprehensive seed files for complete project reconstruction.
**Next**: Update `.seed.md` with complementary evolutionary context and advanced implementation patterns.
