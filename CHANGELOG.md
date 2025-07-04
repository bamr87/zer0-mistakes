# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-01-27

### Added

- **🐳 Docker-First Development Evolution**: Complete transformation to containerized development
  - AI-powered `init_setup.sh` with intelligent environment detection and auto-healing
  - Cross-platform Docker Compose configuration with Apple Silicon optimization
  - Self-healing `_config_dev.yml` generation for Docker compatibility
  - Enhanced `install.sh` with Docker-first optimization functions
  - Comprehensive Docker troubleshooting and platform detection

- **🧠 AI-Powered Self-Healing Configuration**: Intelligent automation and error recovery
  - Auto-detection and resolution of Jekyll theme dependency issues
  - Intelligent platform-specific optimizations (Intel/Apple Silicon)
  - Automatic generation of Docker-compatible development configurations
  - Smart error recovery with detailed logging and guidance

- **🚀 Enhanced Installation System**: Robust, error-tolerant setup process
  - `optimize_development_config()` function for Docker-friendly configs
  - `fix_content_issues()` function to resolve Jekyll include problems
  - Comprehensive error handling with actionable troubleshooting steps
  - AI-generated documentation and setup instructions

### Changed

- **🔧 Installation Philosophy**: Shifted from traditional Ruby/Jekyll setup to Docker-first approach
  - Disabled local theme dependencies to avoid gemspec issues
  - Optimized for containerized development environments
  - Enhanced cross-platform compatibility and consistency

### Fixed

- **🐛 Theme Dependency Issues**: Resolved Jekyll theme not found errors
  - Commented out problematic Jekyll includes in README.md
  - Disabled `remote_theme` in development configuration
  - Added essential Jekyll plugins for Docker compatibility

- **🍎 Apple Silicon Compatibility**: Fixed Docker platform issues
  - Added `platform: linux/amd64` for Apple Silicon compatibility
  - Automatic platform detection and optimization
  - Cross-architecture Docker image support

## [Previous] - 2025-07-03

### Added

- **Comprehensive Gem Automation System**: Unified automation ecosystem merging all automation features
  - Complete documentation consolidation following IT-Journey principles (DFF, DRY, KIS, AIPD)
  - Zero-click releases with multi-environment testing
  - Production-ready CI/CD pipeline with GitHub Actions integration
  - Semantic versioning, building, testing, and publishing automation

### Changed

- **Feature Documentation Restructure**: Consolidated redundant automation feature entries
  - Merged `AUTOMATION_SUMMARY.md` and `automated-version-build-system.md`
  - Created unified `comprehensive-gem-automation-system.md` feature page
  - Updated features index to eliminate redundancies

### Removed

- **Redundant Documentation**: Eliminated duplicate automation documentation files
  - Removed `AUTOMATION_SUMMARY.md` (content merged into comprehensive feature)
  - Removed `automated-version-build-system.md` (superseded by comprehensive version)
  - Consolidated 6 separate automation entries into 1 comprehensive feature

### Fixed

- **Markdown Lint Issues**: Fixed all markdown formatting violations
  - Proper heading spacing and structure
  - Fixed bare URLs with angle bracket notation
  - Removed trailing spaces and improved table formatting

## [0.2.0] - 2025-07-03

### Added

- **Remote Installation Support**: Direct installation from GitHub using `curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash`
- **Azure Static Web Apps Integration**: Automatic workflow creation for Azure deployment
- **Build Directory Structure**: Added `build/` directory for logs and temporary files
- **Enhanced Error Handling**: Comprehensive error handling with colored output
- **Cleanup Functions**: Automatic cleanup of temporary files after remote installation

### Changed

- **Simplified Installation Process**: Updated `zer0.md` to use single install command instead of complex manual setup
- **Azure-Ready Configuration**: Pre-configured directory structure for Azure Static Web Apps (app location: `.`, api location: `api/`, output location: `_site/`)
- **Enhanced Documentation**: Updated `INSTALLATION.md` with Azure deployment instructions
- **Improved Help System**: Added remote installation examples to help output

### Fixed

- **Installation Script Compatibility**: Made `install.sh` compatible with both local and remote execution
- **Directory Structure**: Optimized for Azure Static Web Apps deployment requirements

## [0.1.9] - 2025-07-03

### Updated

- Version bump to 0.1.9

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive automation system for gem versioning and packaging
- Scripts for version management (`scripts/version.sh`)
- Build and publish automation (`scripts/build.sh`)
- Development environment setup (`scripts/setup.sh`)
- Comprehensive testing suite (`scripts/test.sh`)
- GitHub Actions workflows for CI/CD
- Makefile for simplified command access
- Pre-commit Git hooks for validation

### Changed
- Enhanced gemspec validation and error handling
- Improved project structure for gem development

### Infrastructure
- CI workflow for multi-Ruby version testing
- Release workflow for automated publishing
- Version bump workflow for manual releases

## [0.1.8] - 2025-01-03

### Added
- Bootstrap Jekyll theme for headless Github Pages CMS
- Basic theme structure with layouts, includes, and assets
- Jekyll compatibility with GitHub Pages

### Changed
- Initial theme implementation

[Unreleased]: https://github.com/bamr87/zer0-mistakes/compare/v0.1.8...HEAD
[0.1.8]: https://github.com/bamr87/zer0-mistakes/releases/tag/v0.1.8
