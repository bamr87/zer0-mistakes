# Changelog

## [0.8.2] - 2025-11-27

### Changed

- **Refactored: GitHub Actions Workflows** - Consolidated 5 workflows into 3 streamlined workflows
  - Merged `auto-version-bump.yml` into `version-bump.yml` with both automatic and manual triggers
  - Merged `gem-release.yml` and `github-release.yml` into unified `release.yml`
  - Removed duplicate `quality` job from `ci.yml` (functionality retained in `quality-checks` job)
  - Updated `ci.yml` build job to use `scripts/build` instead of deprecated `build.sh`

- **Updated: Composite Action `prepare-release`** - Now uses `scripts/build` instead of deprecated `build.sh`

### Added

- **New Documentation: `.github/workflows/README.md`** - Comprehensive workflow documentation
  - Workflow trigger flow diagram
  - Job descriptions and timeout configurations
  - Manual dispatch options and troubleshooting guide

- **New Documentation: `.github/actions/README.md`** - Composite actions documentation
  - Input/output specifications for all 5 actions
  - Usage examples and best practices
  - Action creation guide and troubleshooting

### Removed

- **Deleted: `auto-version-bump.yml`** - Functionality merged into `version-bump.yml`
- **Deleted: `gem-release.yml`** - Functionality merged into `release.yml`
- **Deleted: `github-release.yml`** - Functionality merged into `release.yml`
- **Deleted: Deprecated wrapper scripts** - `build.sh`, `gem-publish.sh`, `release.sh` and their `.legacy` versions
  - These were deprecated redirects to the new modular commands (`scripts/build`, `scripts/release`)

## [0.8.1] - 2025-11-27

### Added

- **New Page: `pages/categories.md`** - Browse all categories with post counts and links
  - Alphabetical category overview with badge sizing based on post count
  - Post listing under each category with descriptions and dates
  - Smooth anchor navigation between categories
- **New Page: `posts.html`** - Paginated posts index with jekyll-paginate support
  - Responsive 3-column card grid layout
  - Smart pagination with ellipsis for many pages
  - Page jump feature for quick navigation when >10 pages
- **New Page: `index.html`** - Alternative posts index with client-side pagination
  - Responsive 5-column compact card grid for high-density display
  - URL hash-based page state (#page=2) for bookmarkable pages
  - Empty state handling when no posts exist

### Changed

- **Enhanced: `README.md`** - Consolidated landing page content
  - Changed layout from `default` to `landing` for proper homepage rendering
  - Updated permalink from `/zer0/` to `/` for clean root URL
  - Added hero_image and updated preview image
  - Added "Welcome to Error-Free Jekyll Development" section with proven results metrics
  - Added "Perfect For" section highlighting target audiences
- **Enhanced: `pages/index.html`** - Improved posts archive page
  - Responsive card grid (1→2→3→4→5 columns as screen grows)
  - Client-side pagination (10 posts per page)
  - Compact card design with constrained image height
  - Category badges and post metadata display
  - Filter buttons for Categories and Tags pages
- **Improved: `pages/_posts/development/2025-01-22-git-workflow-best-practices.md`** - Front matter formatting standardization

### Removed

- **Deleted: `index.md`** - Content merged into README.md to avoid duplicate landing pages

## [0.8.0] - 2025-11-27

### Added

- **New Feature: AI Preview Image Generator (ZER0-003)** - Automatic AI-powered preview image generation for Jekyll posts
  - Supports OpenAI DALL-E 3, Stability AI, and local placeholder generation
  - Configurable via `_config.yml` under `preview_images` section
  - Default retro pixel art style with 1792x1024 landscape banners
  - One-command remote installation for other Jekyll sites
- **New Plugin: `_plugins/preview_image_generator.rb`** - Jekyll integration with:
  - Liquid filters: `has_preview_image`, `preview_image_path`, `preview_filename`
  - Liquid tags: {% raw %}`{% preview_image_status %}`, `{% preview_images_missing %}`{% endraw %}
  - Build hook that reports missing preview images during Jekyll build
- **New Script: `scripts/generate-preview-images.sh`** - Main CLI for image generation
  - `--list-missing` to find posts without preview images
  - `--dry-run` to preview without making changes
  - `--collection` to target specific collections
  - `--provider` to choose AI provider (openai, stability, local)
- **New Script: `scripts/install-preview-generator.sh`** - Remote installer for other repos
  - One-line installation: `curl -fsSL .../install-preview-generator.sh | bash`
  - Automatic configuration, VS Code tasks, and environment setup
- **New Script: `scripts/lib/preview_generator.py`** - Python alternative implementation
- **New Documentation: `docs/features/preview-image-generator.md`** - Comprehensive feature documentation
- **New Rake Tasks**: `preview:missing`, `preview:generate`, `preview:dry_run`, `preview:posts`, `preview:docs`, `preview:force`, `preview:file`
- **New VS Code Tasks**: Four preview image tasks for IDE integration
- **New Config Section**: `preview_images` in `_config.yml` with full customization options
- **New Feature Entry**: ZER0-003 in `features/features.yml`

### Changed

- **Updated: `jekyll-theme-zer0.gemspec`** - Now includes `_plugins/` and `scripts/` directories in gem distribution
- **Updated: `Rakefile`** - Added preview image tasks and development/test task namespaces
- **Updated: `scripts/README.md`** - Documented new preview generator scripts
- **Updated: `.gitignore`** - Added `.env` for API key security

## [0.7.2] - 2025-11-26

### Fixed

- **Critical: Category pages 404 error** - Renamed category index files from `index.md` to `2000-01-01-index.md` to comply with Jekyll's `_posts` collection naming convention (date-prefixed filenames required)
- Category pages now correctly render at `/posts/technology/`, `/posts/business/`, `/posts/development/`, `/posts/science/`, `/posts/tutorial/`, `/posts/world/`

### Added

- New sample blog posts for each category:
  - `2025-01-25-ai-tools-productivity.md` (Technology)
  - `2025-01-20-startup-funding-guide.md` (Business)
  - `2025-01-22-git-workflow-best-practices.md` (Development)
  - `2025-01-18-quantum-computing-explained.md` (Science)
  - `2025-01-23-css-grid-mastery.md` (Tutorial)
  - `2025-01-21-remote-work-revolution.md` (World)
- `.github/prompts/commit-publish.prompt.md` - Comprehensive release workflow documentation

## [0.7.1] - 2025-01-30

### Fixed

- **Directory structure**: Moved category index pages from `posts/` to `_posts/` directory for proper Jekyll collection handling

## [0.7.0] - 2025-01-30

### Added

- **New Layout: `category.html`** - Category archive pages with card grid, featured posts section, and related categories navigation
- **New Layout: `tag.html`** - Tag archive pages with breadcrumbs, tag cloud, and related tags discovery widget
- **New Component: `post-card.html`** - Reusable post card component with configurable display (badges, images, metadata, reading time)
- **New Component: `author-card.html`** - Author profile card with social links and multiple display styles (compact, full, inline)
- **New Data File: `authors.yml`** - Author profiles configuration with avatar, bio, role, and social links
- **New Page: `tags.md`** - Tags index page with tag cloud and posts grouped by tag
- **New Category Pages** - Six category archive pages (Development, Technology, Tutorial, World, Business, Science)
- **Sample Blog Posts** - Four new demo posts showcasing the blog features:
  - Docker Jekyll development guide (featured)
  - Bootstrap 5 components tutorial (featured)
  - Web accessibility guide (featured)
  - Getting started with Jekyll

### Changed

- **Complete Redesign: `blog.html`** - Transformed into full-width news homepage with:
  - Dark header with category navigation
  - Hero section for breaking/featured news
  - Category quick navigation with article counts
  - Featured stories grid layout
  - Posts organized by category sections
  - Latest posts horizontal cards
  - Tags & Archives sidebar widgets
  - Newsletter signup CTA
- **Enhanced: `journals.html`** - Major improvements including:
  - Rich metadata display with author, date, reading time
  - Inlined author bio section (replaced include to fix nesting)
  - Inlined related posts section (replaced include to fix nesting)
  - Card-based post navigation (previous/next)
  - Giscus comment integration support
- **Updated: `_data/navigation/posts.yml`** - Reorganized categories with Bootstrap icons and proper hierarchy
- **Refactored: `sidebar-folders.html`** - Simplified structure with icon support
- **Refactored: `branding.html`** - Fixed URL references, added comprehensive documentation
- **Refactored: `js-cdn.html`** - Cleaned up, removed redundant Popper.js (included in Bootstrap bundle)

### Fixed

- **Critical: Liquid "Nesting too deep" error** - Resolved recursive include issues by inlining card content in layouts
- **Post filtering** - Added `where_exp` filters to exclude index pages from post listings
- **Script loading performance** - Added `defer` attribute to non-critical scripts in `head.html`
- **Reading time calculation** - Changed from calculated to front matter `estimated_reading_time` to avoid recursion

## [0.6.0] - 2025-11-22

### Added

- Implement PostHog analytics and cookie consent
- Add code copy functionality and enhance documentation structure
- Revise copilot instructions and add comprehensive Jekyll include development guidelines
- Implement automatic theme version display with comprehensive system information
- Add automatic theme version display and system information integration
- Enhance Copilot instructions with comprehensive guidelines
- Enhance CI/CD testing framework with comprehensive documentation and automated workflows

### Changed

- Ignore .frontmatter directory
- Update VS Code settings
- Documentation: Update README with new features and architecture
- Documentation: Add documentation architecture guidelines
- Refactor: Clean up redundancies in includes.instructions.md
- Update version control instructions and add feature documentation

### Other

- Revert "Merge pull request #10 from bamr87/copilot/plan-mdx-file-handling"
- Add Mermaid documentation and test suite, enhance site structure
- Merge pull request #9 from bamr87/copilot/setup-copilot-instructions
- Merge branch 'main' into copilot/setup-copilot-instructions
- Merge pull request #10 from bamr87/copilot/plan-mdx-file-handling
- Address code review feedback and add summary documentation
- Improve MDX processing and add comprehensive tests
- Add MDX and Tailwind CSS support to zer0-mistakes theme
- Initial plan
- Initial plan

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive documentation organization system in `/docs/` directory
- Standardized templates for feature documentation, release notes, and change tracking
- Organized directory structure for releases, features, systems, and configuration documentation

### Changed

- Migrated scattered documentation files to organized structure
- Improved documentation discoverability and maintenance

## [0.5.0] - 2025-10-25

### Added

- **📊 Comprehensive Sitemap Integration**: Unified layout combining collections, statistics, and navigation
  - Real-time site statistics dashboard with 6 key performance indicators
  - Interactive search and filtering across all content types
  - Collections overview with detailed analysis and recent item previews
  - Advanced content discovery tools with visual organization
  - Mobile-optimized responsive design with touch-friendly interface
  - Dark mode support with theme-aware styling
- **🔧 Enhanced User Experience Components**: Modern interface with professional design
  - Bootstrap 5-based responsive layout with hover animations
  - WCAG 2.1 AA compliant accessibility features
  - Performance-optimized loading with lazy content rendering
  - Comprehensive documentation and implementation guides

### Changed

- **🏗️ Navigation System**: Consolidated duplicate sitemap entries into unified comprehensive view
- **🎨 Visual Design**: Updated to modern card-based layout with smooth transitions
- **📱 Mobile Experience**: Enhanced mobile responsiveness and touch interactions

### Fixed

- **🐛 Dark Mode Compatibility**: Resolved background color issues in dark theme
- **🔧 Collection Filtering**: Fixed functionality for dynamic content filtering
- **🔗 Link Navigation**: Corrected internal link behavior and navigation flow

### Technical Details

- **Files Added**: `_layouts/sitemap-collection.html`, enhanced navigation data files
- **Files Modified**: Main navigation configuration, sitemap pages
- **Performance**: Optimized DOM manipulation and content rendering
- **Accessibility**: Full screen reader support and keyboard navigation

**Full Documentation**: [v0.5.0 Release Summary](docs/releases/v0.5.0-release-summary.md)

## [0.4.0] - 2025-10-10

### Added

- **📊 Comprehensive Site Statistics Dashboard**: Complete analytics system for content insights
  - Dynamic statistics generation from site content using Ruby script
  - Real-time analytics showing content pieces, categories, tags, and word counts
  - Interactive Bootstrap 5-based dashboard with responsive design
  - Modular component architecture with 6 specialized statistics components
  - Intelligent activity level calculations based on actual data distribution
  - Professional tag cloud visualization with dynamic sizing
  - Mobile-optimized layout with smooth animations and transitions
- **🔧 Advanced Data Processing Engine**: Automated content analysis and metric generation
  - Ruby-based statistics generator script analyzing posts, pages, and collections
  - YAML data file generation with comprehensive site metrics
  - Smart categorization and tagging analysis with usage frequency tracking
  - Monthly content distribution analysis and trend identification
- **🎨 Enhanced User Experience Components**: Professional dashboard interface
  - Bootstrap 5-first design approach with minimal custom CSS
  - Card-based layout for metric organization and visual hierarchy
  - Interactive tooltips and progress indicators for enhanced usability
  - Print-friendly styling and accessibility compliance (ARIA support)
  - Smooth scroll navigation and fade-in animations for modern UX

### Changed

- **📈 Activity Level Intelligence**: Dynamic threshold calculation replacing static values
  - Categories: High activity (≥70% of max), Medium (≥40% of max), Low (remainder)
  - Tags: Frequently used (≥60% of max), Moderately used (≥20% of max), Occasionally used (remainder)
  - Real-time adaptation to content distribution patterns
- **🏗️ Template Architecture**: Modular include system for maintainable code
  - Separated concerns across 6 specialized components
  - Clean Liquid template syntax with proper error handling
  - Optimized data processing without complex sorting operations

### Fixed

- **🐛 Data Display Issues**: Resolved template rendering and data access problems
  - Fixed Liquid template syntax errors causing empty displays
  - Corrected data structure references across all components
  - Eliminated type conversion errors in sorting operations
  - Proper handling of nested array data structures

**Full Documentation**: [v0.4.0 Release Summary](docs/releases/v0.4.0-release-summary.md)

## [0.3.0] - 2025-01-27

### Added

- **🎨 Mermaid Diagram Integration v2.0**: Comprehensive diagramming system
  - Complete diagram support: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, pie charts, git graphs, journey diagrams, and mindmaps
  - GitHub Pages compatibility with both local development and deployment
  - Conditional loading for performance optimization
  - Responsive design with automatic scaling across devices
  - Dark mode support with forest theme optimization
- **📚 Comprehensive Documentation**: Complete user and developer guides
  - Step-by-step user guide with live examples
  - Developer-focused integration tutorial
  - Live test suite with validation examples
  - Comprehensive troubleshooting guide
- **🧪 Automated Testing Framework**: Complete validation system
  - 16 automated tests covering all aspects
  - Multiple test modes: quick, local, Docker, headless
  - Cross-browser compatibility testing
  - Performance validation and benchmarking

### Changed

- **📁 File Organization**: 53% reduction from 15 to 7 Mermaid-related files
- **🏗️ Architecture**: Modular include system with clear responsibilities
- **📖 Documentation**: Consolidated and improved documentation structure

### Fixed

- **🔧 Configuration**: Enhanced Jekyll and GitHub Pages compatibility
- **⚡ Performance**: Optimized loading and rendering speed
- **🎯 Usability**: Improved setup process and error handling

**Full Documentation**: [v0.3.0 Release Notes](docs/releases/v0.3.0-release-notes.md)

## [0.2.1] - 2025-09-30

### Added

- Enhanced markdown linting configuration
- Improved Jekyll template support for link checking
- Better configuration for markdown validation

### Changed

- Updated markdown-link-check configuration with Jekyll-specific patterns
- Relaxed line length requirements in markdownlint configuration
- Added support for more HTML elements in markdown

### Fixed

- Improved markdown validation for Jekyll projects
- Better handling of Liquid templates in link validation

## [0.2.0] - 2025-09-01

### Changed

- Version bump to 0.2.0 with improvements

## [0.1.9] - 2025-01-27

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

## [0.1.8] - 2025-01-03

### Added

- **Comprehensive Gem Automation System**: Unified automation ecosystem
  - Zero-click releases with multi-environment testing
  - Production-ready CI/CD pipeline with GitHub Actions integration
  - Semantic versioning, building, testing, and publishing automation
  - Complete documentation consolidation following IT-Journey principles
- **Remote Installation Support**: Direct installation from GitHub
- **Azure Static Web Apps Integration**: Automatic workflow creation for Azure deployment
- **Build Directory Structure**: Added `build/` directory for logs and temporary files
- **Enhanced Error Handling**: Comprehensive error handling with colored output
- **Cleanup Functions**: Automatic cleanup of temporary files after remote installation

### Changed

- **Feature Documentation Restructure**: Consolidated redundant automation feature entries
- **Simplified Installation Process**: Updated to use single install command
- **Azure-Ready Configuration**: Pre-configured directory structure for Azure Static Web Apps
- **Enhanced Documentation**: Updated with Azure deployment instructions
- **Improved Help System**: Added remote installation examples

### Removed

- **Redundant Documentation**: Eliminated duplicate automation documentation files

### Fixed

- **Installation Script Compatibility**: Made compatible with both local and remote execution
- **Directory Structure**: Optimized for Azure Static Web Apps deployment
- **Markdown Lint Issues**: Fixed all markdown formatting violations

## [0.1.7] - 2024-12-01

### Added

- Bootstrap Jekyll theme for headless GitHub Pages CMS
- Basic theme structure with layouts, includes, and assets
- Jekyll compatibility with GitHub Pages
- Scripts for version management, build, and test automation
- GitHub Actions workflows for CI/CD
- Makefile for simplified command access

### Changed

- Initial theme implementation and project structure

---

## Documentation

For detailed documentation on features, systems, and configuration:

- **[Documentation Center](docs/README.md)** - Complete documentation overview
- **[Release Documentation](docs/releases/README.md)** - Historical release information
- **[Feature Documentation](docs/features/README.md)** - Detailed feature guides
- **[System Documentation](docs/systems/README.md)** - Core systems and automation
- **[Configuration Guides](docs/configuration/README.md)** - Setup and configuration

## Links

[Unreleased]: https://github.com/bamr87/zer0-mistakes/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/bamr87/zer0-mistakes/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/bamr87/zer0-mistakes/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/bamr87/zer0-mistakes/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/bamr87/zer0-mistakes/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/bamr87/zer0-mistakes/compare/v0.1.9...v0.2.0
[0.1.9]: https://github.com/bamr87/zer0-mistakes/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/bamr87/zer0-mistakes/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/bamr87/zer0-mistakes/releases/tag/v0.1.7
