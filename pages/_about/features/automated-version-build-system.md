---
title: Automated Version Bumping & Build System
description: "Comprehensive automation system for Jekyll theme versioning, testing, and gem publishing"
date: 2025-07-03T12:00:00.000Z
preview: null
tags: [Automation, CI/CD, Ruby, Jekyll, DevOps]
categories: [How-To, Development]
sub-title: null
author: null
excerpt: Complete automation system for semantic versioning, testing, building, and publishing Jekyll themes with error handling and validation.
snippet: null
lastmod: 2025-07-03T12:00:00.000Z
draft: false
---

## Overview

A comprehensive automation system that embodies IT-Journey principles for managing Jekyll theme development lifecycle with AI-powered development practices.

## Features Implemented

### 🚀 **Core Automation Scripts**

#### Version Management (`scripts/version.sh`)
```bash
# Semantic versioning with validation
./scripts/version.sh [patch|minor|major] [--dry-run]

# Examples:
./scripts/version.sh patch           # 0.1.8 → 0.1.9
./scripts/version.sh minor           # 0.1.8 → 0.2.0
./scripts/version.sh major           # 0.1.8 → 1.0.0
./scripts/version.sh patch --dry-run # Preview changes
```

**What it does:**
- Validates working directory is clean
- Updates version in `package.json`
- Updates `CHANGELOG.md` automatically
- Creates git commit with version bump
- Creates git tag (`v{version}`)

#### Build System (`scripts/build.sh`)
```bash
# Build and optionally publish gems
./scripts/build.sh [--publish] [--dry-run]

# Examples:
./scripts/build.sh                    # Build gem only
./scripts/build.sh --publish          # Build and publish to RubyGems
./scripts/build.sh --publish --dry-run # Preview publish process
```

**What it does:**
- Validates dependencies and gemspec
- Builds the gem file
- Shows gem contents for verification
- Optionally publishes to RubyGems (with confirmation)

#### Testing Suite (`scripts/test.sh`)
```bash
# Comprehensive validation
./scripts/test.sh [--verbose]
```

**Tests performed:**
- Package.json syntax and version format validation
- Gemspec syntax and validity checks
- Required files existence verification
- YAML front matter validation in layouts
- Jekyll dependencies checking
- Version consistency validation
- Script permissions verification
- Bundle install capability testing

#### Development Setup (`scripts/setup.sh`)
```bash
# One-time development environment setup
./scripts/setup.sh
```

**Setup includes:**
- System requirements validation (Ruby, Bundler, jq, Git)
- Dependencies installation
- Script permissions configuration
- Gemspec validation
- Git hooks setup for validation
- Project structure optimization

### 🎯 **Makefile Integration**

Simple command interface for all operations:

```bash
# Version Management
make version         # Show current version
make version-patch   # Bump patch version
make version-minor   # Bump minor version
make version-major   # Bump major version

# Testing & Validation
make test            # Run all tests
make test-verbose    # Run tests with detailed output
make lint            # Run code quality checks

# Build & Release
make build           # Build gem
make publish         # Build and publish to RubyGems
make release-patch   # Full patch release workflow

# Maintenance
make setup           # Set up development environment
make clean           # Remove built gems
make check           # Run health check
make status          # Git and version status
```

### 🛡️ **Error Handling & Validation**

#### Design for Failure (DFF) Implementation:
- **Clean working directory validation** prevents conflicts
- **Comprehensive dependency checking** before operations
- **Gemspec validation** ensures buildable packages
- **Dry-run mode** for safe testing and previewing
- **Graceful error messages** with actionable guidance

#### Security & Best Practices:
- Git repository validation
- RubyGems authentication checking
- Version format validation
- File permissions verification
- Automated cleanup of build artifacts

### 🔄 **CI/CD Integration**

#### GitHub Actions Workflows:
1. **Continuous Integration** (`ci.yml`)
   - Multi-Ruby version testing (2.7, 3.0, 3.1, 3.2)
   - Automated testing on pull requests
   - Gem build validation

2. **Release Automation** (`gem-release.yml`)
   - Triggers on git tags (`v*`)
   - Automated publishing to RubyGems
   - GitHub release creation with artifacts

3. **Manual Version Bumping** (`version-bump.yml`)
   - UI-driven version management
   - Pre-bump testing validation
   - Automated PR creation for review

### 📊 **Monitoring & Metrics**

#### Health Monitoring:
```bash
make check    # Comprehensive health check
make status   # Git and version status
make info     # Project information
```

#### Available Metrics:
- Build success rate via GitHub Actions
- Test coverage via automation scripts
- Release frequency via git tags
- Download stats via RubyGems.org

## Implementation Guide

### Step 1: Initial Setup

```bash
# Clone repository and setup
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes
./scripts/setup.sh
```

### Step 2: Development Workflow

```bash
# Make your changes to theme files
# ...

# Run tests to validate changes
make test

# If tests pass, bump version
make version-patch

# Build the gem
make build

# Publish when ready
make publish
```

### Step 3: Automated Release

1. **Manual Trigger**: Use GitHub Actions "Auto Version Bump" workflow
2. **Automatic Testing**: CI workflow validates all changes
3. **Tag Creation**: Automated version tag creation
4. **Release Build**: Gem release workflow triggers automatically
5. **Publication**: Automated publishing to RubyGems

## Configuration Requirements

### System Dependencies:
- **Ruby** >= 2.7.0
- **Bundler** for dependency management
- **jq** for JSON processing
- **Git** for version control

### RubyGems Publishing Setup:
1. **RubyGems account** at [rubygems.org](https://rubygems.org)
2. **API key** from account settings
3. **GitHub secret** `RUBYGEMS_API_KEY` in repository

### Local Authentication:
```bash
# Sign in to RubyGems locally
gem signin

# Verify authentication
gem whoami
```

## IT-Journey Principles Implementation

### 🔒 **Design for Failure (DFF)**
- Comprehensive error handling and validation
- Fallback mechanisms and graceful degradation
- Automated backups and cleanup processes

### 🔄 **Don't Repeat Yourself (DRY)**
- Single source of truth for version management
- Reusable automation components
- Modular script architecture

### ⚡ **Keep It Simple (KIS)**
- Intuitive command interface via Makefile
- Clear, descriptive error messages
- Simple workflow patterns

### 🚀 **Release Early and Often (REnO)**
- Automated release workflows
- Continuous integration practices
- Incremental improvement processes

### 🤖 **AI-Powered Development (AIPD)**
- AI-enhanced automation workflows
- Intelligent error detection and reporting
- Automated documentation generation

## Benefits Achieved

✅ **Zero-click releases** - Fully automated publishing  
✅ **Error prevention** - Comprehensive validation  
✅ **Consistent versioning** - Semantic version management  
✅ **Quality assurance** - Multi-environment testing  
✅ **Developer productivity** - Simple command interface  
✅ **Collaboration ready** - Git-based workflows  
✅ **Monitoring enabled** - Health checks and metrics  

## Troubleshooting

### Common Issues & Solutions:

#### "Working directory is not clean"
```bash
git status              # Check status
git add .              # Stage changes
git commit -m "fix"    # Commit changes
```

#### "Not authenticated with RubyGems"
```bash
gem signin             # Sign in to RubyGems
# or
echo ":rubygems_api_key: YOUR_KEY" > ~/.gem/credentials
chmod 600 ~/.gem/credentials
```

#### "jq command not found"
```bash
# macOS
brew install jq
# Ubuntu/Debian
sudo apt-get install jq
```

#### Debug Mode:
```bash
./scripts/test.sh --verbose      # Detailed test output
./scripts/build.sh --dry-run     # Preview build process
```

## Future Enhancements

- **Automated changelog generation** from commit messages
- **Dependency vulnerability scanning**
- **Performance benchmarking** for theme builds
- **Multi-platform testing** (Windows, Linux, macOS)
- **Integration with Jekyll site testing**

---

This automation system represents a production-ready implementation of modern DevOps practices, specifically tailored for Jekyll theme development and AI-enhanced workflows.
