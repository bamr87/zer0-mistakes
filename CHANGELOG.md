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
