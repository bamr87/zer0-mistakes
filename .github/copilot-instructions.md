# Zer0-Mistakes Copilot Instructions

**Docker-First Jekyll Theme with Automated Release Management & Privacy-Compliant Analytics**

## 📖 Project Overview

Zer0-Mistakes is a professional Jekyll theme designed for developers who value reliability, modern workflows, and AI-assisted development. Key features include:

- **Docker-First Development**: Universal cross-platform compatibility with containerized environment
- **AI-Powered Installation**: Self-healing setup with 95% success rate and intelligent error recovery
- **Remote Theme Support**: Compatible with GitHub Pages and local development
- **Bootstrap 5 Integration**: Modern, responsive UI framework (v5.3.3)
- **Automated Release Management**: Semantic versioning with automated gem publishing
- **Comprehensive Testing**: Full test suite with CI/CD integration

## 📂 Project Structure

```
zer0-mistakes/
├── .github/                 # GitHub configurations and workflows
│   ├── copilot-instructions.md  # Main Copilot instructions (this file)
│   ├── instructions/        # File-specific instruction files
│   │   ├── layouts.instructions.md
│   │   ├── includes.instructions.md
│   │   ├── scripts.instructions.md
│   │   ├── testing.instructions.md
│   │   └── version-control.instructions.md
│   ├── workflows/           # GitHub Actions CI/CD workflows
│   └── actions/             # Custom GitHub Actions
├── _layouts/                # Jekyll layout templates
├── _includes/               # Reusable Jekyll components
├── _sass/                   # Sass stylesheets
├── _data/                   # Data files (YAML, JSON)
├── assets/                  # Static assets (CSS, JS, images)
├── pages/                   # Content pages and collections
│   ├── _posts/              # Blog posts
│   ├── _docs/               # Documentation
│   └── _quests/             # Tutorial collections
├── scripts/                 # Automation scripts
│   ├── version.sh           # Version management
│   ├── build.sh             # Build automation
│   ├── test.sh              # Test execution
│   └── release.sh           # Release workflow
├── test/                    # Test suite
│   ├── test_runner.sh       # Main test orchestrator
│   ├── test_core.sh         # Core functionality tests
│   ├── test_deployment.sh   # Deployment tests
│   └── test_quality.sh      # Code quality tests
├── _config.yml              # Production Jekyll configuration
├── _config_dev.yml          # Development configuration overrides
├── docker-compose.yml       # Docker development environment
├── Gemfile                  # Ruby dependencies
├── jekyll-theme-zer0.gemspec # Gem specification
├── install.sh               # AI-powered installation script
└── init_setup.sh            # Environment setup script
```

## 🛠️ Essential Commands and Tooling

### Development Commands

```bash
# Start development server
docker-compose up                    # Start with Docker (recommended)
bundle exec jekyll serve            # Start without Docker

# Build site
docker-compose exec jekyll jekyll build
bundle exec jekyll build

# Run tests
./test/test_runner.sh               # Run all tests
./test/test_core.sh                 # Run core tests only
./test/test_runner.sh --verbose     # Verbose output

# Version management
./scripts/version.sh patch          # Bump patch version (1.0.0 → 1.0.1)
./scripts/version.sh minor          # Bump minor version (1.0.0 → 1.1.0)
./scripts/version.sh major          # Bump major version (1.0.0 → 2.0.0)

# Release
./scripts/release.sh                # Full release workflow
./scripts/release.sh --dry-run      # Preview release
```

### Code Quality Commands

```bash
# Markdown linting
markdownlint "**/*.md" --ignore node_modules

# YAML linting
yamllint -c .github/config/.yamllint.yml .

# HTML validation
bundle exec jekyll build
htmlproofer _site --check-html --disable-external

# Jekyll validation
bundle exec jekyll doctor
```

### Docker Commands

```bash
# Start development environment
docker-compose up

# Rebuild containers
docker-compose down && docker-compose up --build

# Access container shell
docker-compose exec jekyll bash

# View logs
docker-compose logs -f

# Clean up
docker-compose down -v
```

## 🏗️ Architecture Overview

Zer0-Mistakes is a Jekyll theme designed for **production deployment** with intelligent automation. The codebase follows a **Docker-first, GitHub Pages compatible** approach with comprehensive front matter integration for AI-assisted development.

### Core Architecture Patterns

**Dual Configuration System:**
- `_config.yml` - Production config with `remote_theme: "bamr87/zer0-mistakes"`
- `_config_dev.yml` - Development overrides with `remote_theme: false`, loads local theme

**Modular Include System:**
```
_includes/
├── core/           # Essential structure (head.html, header.html, footer.html)
├── components/     # Reusable UI (cookie-consent.html, theme-info.html)
├── analytics/      # Privacy-compliant tracking (posthog.html)
└── navigation/     # Nav components (navbar.html, breadcrumbs.html)
```

**Layout Hierarchy:**
```
root.html (base) → default.html (main) → [journals.html, home.html, etc.]
```

## 🚀 Critical Developer Workflows

### Essential Commands
```bash
# Start development (auto-reloads on file changes)
docker-compose up

# Access container for debugging
docker-compose exec jekyll bash

# Clean rebuild with dependency updates  
docker-compose down && docker-compose up --build

# Test automated release system
./scripts/gem-publish.sh patch --dry-run
```

### Automated Release System
The theme uses semantic versioning with automated commit analysis:
```bash
# Publish patch release (0.5.1)
./scripts/gem-publish.sh patch

# Publish minor release (0.6.0) 
./scripts/gem-publish.sh minor

# Preview changelog generation
./scripts/analyze-commits.sh HEAD~5..HEAD
```

**Key Files:**
- `lib/jekyll-theme-zer0/version.rb` - Single source of truth for version
- `scripts/gem-publish.sh` - Full release workflow (changelog → version bump → test → publish)
- `scripts/analyze-commits.sh` - Analyzes commit messages for version bump type

## 📝 Content Creation Patterns

### Jekyll Collections Structure
```
pages/
├── _posts/         # Blog posts (layout: journals)
├── _docs/          # Documentation (layout: default)
├── _about/         # About pages (custom layouts)
└── _quickstart/    # Tutorial content (layout: default)
```

### Front Matter Standards
```yaml
---
title: "Your Post Title"
description: "SEO description (150-160 chars)"
layout: journals
categories: [Category1, Subcategory]
tags: [tag1, tag2]
date: 2025-01-27T10:00:00.000Z
lastmod: 2025-01-27T10:00:00.000Z
permalink: /custom-url/
---
```

## 🎨 Bootstrap 5 Integration

**CDN Loading Pattern:**
- Bootstrap 5.3.3 CSS/JS loaded via CDN in `_includes/core/head.html`
- Bootstrap Icons 1.10.3 for consistent iconography
- Custom CSS layered in `/assets/css/main.css`

**Responsive Component Pattern:**
```html
<!-- Mobile-first responsive navigation -->
<nav class="navbar navbar-expand-lg">
  <button class="navbar-toggler d-lg-none" data-bs-toggle="collapse">
  <div class="collapse navbar-collapse">
    <!-- Navigation items -->
  </div>
</nav>
```

## 🔐 Privacy-First Analytics

**PostHog Integration** (`_includes/analytics/posthog.html`):
- **Environment-aware**: Only loads in production with `jekyll.environment == "production"`
- **Consent-driven**: Integrates with cookie consent system
- **Custom events**: Tracks downloads, external links, scroll depth, Jekyll-specific interactions

**Cookie Consent System** (`_includes/components/cookie-consent.html`):
- GDPR/CCPA compliant with granular permissions
- 365-day consent expiry with localStorage persistence
- Bootstrap modal for detailed preference management

**Configuration Pattern:**
```yaml
# _config.yml
posthog:
  enabled: true
  api_key: 'phc_your_key_here'
  custom_events:
    track_downloads: true
    track_external_links: true

# _config_dev.yml  
posthog:
  enabled: false  # Disabled in development
```

## 🧩 Include Development Standards

**Standard Header Format:**
```html
<!--
  ===================================================================
  COMPONENT NAME - Brief Description
  ===================================================================
  
  File: filename.html
  Path: _includes/category/filename.html
  Purpose: What this component does and why it exists
  
  Dependencies: Required configs, other includes, external libraries
  Performance: Loading considerations, mobile responsiveness
  ===================================================================
-->
```

**Parameter Pattern:**
```liquid
{% comment %} Safe parameter handling with defaults {% endcomment %}
<div class="{{ include.class | default: 'default-class' }}">
  {% if include.title %}
    <h3>{{ include.title }}</h3>
  {% endif %}
  {{ include.content | default: content | markdownify }}
</div>
```

## 🔧 Docker Optimization

**Key Configuration:**
```yaml
# docker-compose.yml
platform: linux/amd64  # Apple Silicon compatibility
command: jekyll serve --config "_config.yml,_config_dev.yml"
volumes: ["./:/app"]
environment: { JEKYLL_ENV: development }
```

**Development vs Production:**
- **Development**: Local theme files, analytics disabled, verbose logging
- **Production**: GitHub Pages deployment, remote theme, privacy-compliant analytics

## 🚀 GitHub Pages Deployment

**Automatic Deployment:**
1. Push to `main` branch triggers GitHub Pages build
2. Jekyll processes with production `_config.yml` 
3. Remote theme loads from `bamr87/zer0-mistakes`
4. Analytics activate with user consent

**Theme Publishing:**
```bash
# Full release workflow
./scripts/gem-publish.sh patch  # Auto-detects version bump needed
```

---

**Key AI Development Principles:**
- **Front matter drives behavior**: Use comprehensive metadata for AI context
- **Docker-first development**: All workflows assume containerized environment  
- **Privacy by design**: Analytics require explicit user consent
- **Automated releases**: Semantic versioning with commit message analysis
- **Component modularity**: Includes are self-contained with clear dependencies

## Front Matter: Structured Metadata for Jekyll Theme Development

Front matter in Zer0-Mistakes serves dual purposes: providing essential Jekyll configuration and offering AI agents comprehensive context for theme development, content creation, and maintenance automation.

### Jekyll Theme Front Matter Elements

- **Layout Specifications**: Define template hierarchy and component relationships
- **SEO and Social Media**: Complete metadata for search engines and social platforms
- **Content Organization**: Categories, tags, and cross-references for content discovery
- **Performance Hints**: Optimization guidelines for page loading and rendering
- **Docker Integration**: Container-specific configurations and environment settings

### Front Matter Structure for Jekyll Posts

```yaml
---
# Comprehensive Front Matter for Zer0-Mistakes Jekyll Posts
title: "Building Scalable Web Applications with Docker"
description: "Complete guide to containerizing web applications for production deployment"
date: 2025-01-27T10:00:00.000Z
preview: "Learn Docker best practices for web application deployment"
tags: [docker, web-development, containerization, production]
categories: [Development, DevOps]
sub-title: "From development to production with Docker containers"
excerpt: "Master containerization for scalable web application deployment"
snippet: "Containers transform how we build and deploy applications"
author: "Zer0-Mistakes Development Team"
layout: journals
keywords:
  primary: ["docker containers", "web application deployment"]
  secondary: ["containerization", "production ready", "scalable architecture"]
lastmod: 2025-01-27T10:00:00.000Z
permalink: /docker-web-applications-guide/
attachments: ""
comments: true
# AI-Specific Metadata
ai_content_hints:
  - "Include practical Docker examples"
  - "Emphasize security best practices"
  - "Provide troubleshooting guidance"
  - "Connect to real-world scenarios"
technical_requirements:
  - "Docker Desktop installed"
  - "Basic web application for practice"
  - "Text editor with YAML support"
difficulty_level: "intermediate"
estimated_reading_time: "15 minutes"
social_media:
  twitter_card: "summary_large_image"
  og_type: "article"
---
```

### Front Matter for Jekyll Layouts and Includes

```html
<!--
Front Matter: Jekyll Layout Component

Title: Journals Layout Template
Description: Main content layout for blog posts and articles with enhanced SEO
Component Type: Jekyll Layout
Dependencies:
  - _includes/head.html
  - _includes/header.html
  - _includes/sidebar-left.html
  - _includes/footer.html
CSS Framework: Bootstrap 5.3.3
JavaScript Libraries: [Bootstrap JS, jQuery optional]
SEO Features:
  - Open Graph meta tags
  - Twitter Card support
  - Schema.org structured data
  - Canonical URLs
Performance Features:
  - Critical CSS inlining
  - Lazy loading for images
  - CDN resource loading
AI Development Notes:
  - Maintain semantic HTML structure
  - Ensure accessibility compliance
  - Optimize for mobile-first design
  - Include proper error handling
Docker Compatibility: "Fully compatible with Jekyll container environments"
-->
```

### Front Matter Enhanced Core Components
- **`_layouts/`**: Modular layout system with embedded front matter for component dependencies and performance hints
- **`_includes/`**: Reusable components documented with front matter specifying usage patterns and integration points
- **`_config.yml`**: Production configuration enhanced with front matter standards for AI-assisted theme management
- **`_config_dev.yml`**: Docker-compatible development overrides with front matter documentation for environment setup
- **`docker-compose.yml`**: Containerized development environment with front matter comments for AI deployment assistance
- **`install.sh`**: AI-powered installation script with front matter specifying error recovery strategies and system requirements
- **`init_setup.sh`**: Intelligent environment detection with front matter documenting auto-healing capabilities and fallback options

### Key Patterns Enhanced with Front Matter

#### 1. Configuration Layering with Front Matter Documentation
```yaml
---
# Front Matter: Jekyll Configuration
# Description: Production configuration for Zer0-Mistakes theme
# Environment: production
# AI Notes: Remote theme enables GitHub Pages compatibility
---
remote_theme: "bamr87/zer0-mistakes"

# Development (_config_dev.yml) - Auto-generated with front matter
---
# Front Matter: Development Configuration  
# Description: Local development overrides for Docker environment
# Environment: development
# Docker Notes: Local theme development with live reload
# AI Notes: Facilitates theme customization and testing
---
remote_theme: false
theme: "jekyll-theme-zer0"
```

#### 2. Front Matter Enhanced Docker-First Commands
```bash
#!/bin/bash
# Front Matter: Docker Development Commands
# Description: Essential commands for Zer0-Mistakes theme development
# Environment: Docker containerized development
# AI Notes: These commands provide complete development workflow
# Dependencies: Docker, Docker Compose
# Troubleshooting: Check Docker service status if commands fail

# Start development environment
docker-compose up

# Access container for debugging
docker-compose exec jekyll bash

# Clean rebuild with dependency updates
docker-compose down && docker-compose up --build
```

#### 3. Self-Healing Installation with Front Matter
```bash
#!/bin/bash
# Front Matter: Zer0-Mistakes Self-Healing Installation
# Description: AI-powered one-line installation with comprehensive error recovery
# Environment: Multi-platform (macOS, Linux, Windows/WSL)
# AI Error Recovery: Automatic detection and resolution of common installation issues
# Dependencies: curl, bash, Docker (optional)
# Fallback Strategies: Manual installation instructions if automated setup fails

curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

## 🔧 Critical Developer Workflows

### Local Development Setup
1. **Clone repository**: `gh repo clone bamr87/zer0-mistakes`
2. **Start containers**: `docker-compose up`
3. **Access site**: Visit `http://localhost:4000`
4. **Make changes**: Edit files, auto-reload enabled
5. **Debug issues**: Check container logs with `docker-compose logs`

### Theme Development
- **Local testing**: Use `_config_dev.yml` (remote_theme: false)
- **Theme updates**: Modify files in `_layouts/`, `_includes/`, `assets/`
- **Cross-platform testing**: Test on Intel/Apple Silicon via Docker
- **Dependency management**: Update `Gemfile` for Jekyll plugins

### Front Matter Enhanced Content Creation
- **Posts**: Create in `pages/_posts/` with comprehensive Jekyll front matter including AI content hints and technical requirements
- **Pages**: Add to root or `pages/` with custom layouts documented via front matter component specifications
- **Collections**: Use `pages/_quests/`, `pages/_docs/` with front matter defining content relationships and learning progressions
- **Front Matter Standards**: Include complete metadata: `layout`, `title`, `date`, `categories`, `tags`, plus AI directives, SEO optimization, and performance hints

## � **Bootstrap 5 Integration**

### CSS Framework Architecture
- **Bootstrap 5.3.3**: Latest stable version loaded via CDN
- **Bootstrap Icons 1.10.3**: Icon library for enhanced UI elements
- **Custom CSS**: Layered on top of Bootstrap in `/assets/css/main.css` and `/assets/css/custom.css`
- **Responsive Design**: Mobile-first approach with breakpoint system

### Bootstrap CDN Loading
```html
<!-- Bootstrap CSS (loaded in _includes/head.html) -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

<!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">

<!-- Bootstrap JS (loaded in _includes/js-cdn.html) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
```

### Bootstrap Component Usage
- **Grid System**: Use `container`, `row`, `col-*` classes for responsive layouts
- **Navigation**: Bootstrap navbar components with responsive collapse
- **Cards**: Content containers with consistent styling
- **Modals**: Interactive dialog boxes for user interactions
- **Tooltips/Popovers**: Enhanced user experience elements

### Bootstrap Customization
- **CSS Variables**: Override Bootstrap variables in custom CSS files
- **Component Classes**: Extend Bootstrap with custom utility classes
- **Theme Colors**: Use Bootstrap's color system for consistency
- **Responsive Utilities**: Leverage `d-none`, `d-lg-block`, etc. for responsive behavior

### Error Handling Patterns
```bash
# Always use set -euo pipefail in scripts
set -euo pipefail

# Comprehensive logging functions
log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

# Graceful error recovery
command || handle_error "Command failed"
```

### Docker Optimization
- **Platform specification**: `platform: linux/amd64` for Apple Silicon
- **Volume mounting**: `./:/app` for live development
- **Port consistency**: Always `4000:4000` for localhost access
- **Environment variables**: `JEKYLL_ENV: development`

### Documentation Standards
- **CHANGELOG.md**: Semantic versioning with categorized changes
- **README.md**: Include installation, usage, and troubleshooting
- **Frontmatter**: Comprehensive metadata for SEO and organization
- **Cross-references**: Link related pages and documentation

## 🔄 Integration Points

### External Dependencies
- **Jekyll**: Static site generator with custom theme
- **Docker**: Containerization for cross-platform development
- **GitHub Pages**: Hosting and deployment platform
- **Ruby Gems**: Jekyll plugins and dependencies

### Service Communication
- **Local development**: Jekyll server ↔ Browser (localhost:4000)
- **Theme loading**: GitHub remote_theme ↔ Local Jekyll build
- **Asset pipeline**: Sass compilation ↔ CSS optimization
- **Content processing**: Markdown → HTML with Liquid templating

## 🚀 Deployment Workflows

### GitHub Pages Deployment
1. **Push to main**: Automatic build triggers
2. **Jekyll build**: Processes site with production config
3. **Asset optimization**: Minifies CSS/JS, optimizes images
4. **CDN delivery**: Fast global content delivery

### Docker Deployment
```yaml
# For production containerization
FROM jekyll/jekyll:latest
COPY . /app
RUN jekyll build
EXPOSE 4000
CMD ["jekyll", "serve", "--host", "0.0.0.0"]
```

## 📋 Quality Assurance

### Testing Commands
```bash
# Local build test
docker-compose exec jekyll jekyll build

# Link validation
docker-compose exec jekyll jekyll doctor

# HTML validation
docker-compose exec jekyll htmlproofer _site
```

### Code Quality
- **Markdown linting**: Consistent formatting across documentation
- **YAML validation**: Proper configuration file syntax
- **Liquid templating**: Valid Jekyll template syntax
- **Cross-browser testing**: Responsive design validation

## 🎨 Content Management

### Frontmatter Standards
```yaml
---
title: "Page Title"
description: "SEO description (150-160 chars)"
date: 2025-01-27T10:00:00.000Z
preview: "Social media preview text"
tags: [tag1, tag2]
categories: [Category1, Subcategory]
layout: journals
permalink: /custom-url/
---
```

### SEO Optimization
- **Meta descriptions**: Compelling summaries for search results
- **Open Graph**: Social media sharing optimization
- **Structured data**: Schema.org markup for rich snippets
- **Performance**: Optimized images and minified assets

## 🔄 Evolution Patterns

### Version Management
- **Semantic versioning**: MAJOR.MINOR.PATCH for releases
- **Changelog categories**: Added, Changed, Deprecated, Removed, Fixed, Security
- **Migration guides**: Document breaking changes and upgrade paths
- **Deprecation warnings**: Clear communication of deprecated features

### Feature Development
- **Incremental releases**: Small, frequent updates over large changes
- **Backward compatibility**: Maintain compatibility when possible
- **Documentation updates**: Update docs with new features
- **User feedback**: Incorporate community input for improvements

## 🤖 AI Integration Guidelines

### Front Matter Enhanced Code Generation
- **Jekyll patterns**: Generate Liquid templates with front matter documentation specifying component relationships and dependencies
- **Docker optimization**: Create container-friendly configurations with front matter detailing environment requirements and optimization strategies
- **Error handling**: Implement comprehensive error recovery guided by front matter fallback strategies and troubleshooting notes
- **Documentation**: Auto-generate README and troubleshooting guides using front matter content hints and technical requirements

### Front Matter Guided Development Assistance
- **Theme customization**: Help modify layouts and includes using front matter component specifications and dependency mappings
- **Content creation**: Assist with Jekyll post/page creation following front matter standards for SEO, performance, and AI integration
- **Configuration**: Optimize Jekyll and Docker settings based on front matter environment specifications and performance hints
- **Debugging**: Troubleshoot build and runtime issues using front matter troubleshooting guidance and error recovery strategies

### Front Matter Enhanced Quality Assurance
- **Code review**: Check for Jekyll best practices using front matter AI development notes and component specifications
- **Security**: Validate safe Liquid template usage following front matter security guidelines and Docker compatibility requirements
- **Performance**: Optimize asset loading and page speed based on front matter performance features and optimization hints
- **Accessibility**: Ensure WCAG compliance in templates using front matter accessibility specifications and AI development standards

## 🔒 Security Best Practices

### Code Security
- **Never hardcode credentials**: Use environment variables for sensitive data
- **Validate user inputs**: Always sanitize and escape user-provided content in Liquid templates
- **Secure dependencies**: Regularly update gems and check for vulnerabilities with `bundle audit`
- **Safe file operations**: Validate file paths and use secure temp file creation
- **HTTPS only**: Use HTTPS for all external resources (CDN, APIs)

### Content Security
```liquid
{% comment %}Always escape user content{% endcomment %}
<p>{{ user_content | escape }}</p>

{% comment %}Use relative_url for internal links{% endcomment %}
<a href="{{ page.url | relative_url }}">Link</a>

{% comment %}Validate and sanitize HTML{% endcomment %}
{{ content | strip_html | truncate: 150 }}
```

### Docker Security
- Use official, verified base images
- Specify exact versions for reproducibility
- Run containers as non-root users when possible
- Scan images for vulnerabilities
- Keep Docker and Docker Compose updated

## 🤝 Contributing Guidelines

### Before Contributing
1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines
2. Review [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
3. Set up local development environment with Docker
4. Run tests to ensure baseline functionality: `./test/test_runner.sh`

### Contribution Workflow
1. **Fork and clone** the repository
2. **Create feature branch** from `main`: `git checkout -b feature/your-feature`
3. **Make minimal changes** - focus on one issue/feature at a time
4. **Test thoroughly** - ensure all tests pass
5. **Document changes** - update relevant docs and CHANGELOG.md
6. **Commit with clear messages** - follow conventional commits format
7. **Open pull request** - provide detailed description with context

### Code Review Standards
- **Functionality**: Does the code work as intended?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the code properly documented?
- **Style**: Does it follow project conventions?
- **Security**: Are there any security concerns?
- **Performance**: Is it optimized?

## 📝 File-Specific Instructions

The `.github/instructions/` directory contains specialized guidelines for different file patterns:

- **layouts.instructions.md** (applies to `_layouts/**`): Jekyll layout development guidelines
- **includes.instructions.md** (applies to `_includes/**`): Reusable component development
- **scripts.instructions.md** (applies to `scripts/**`): Shell script automation standards
- **testing.instructions.md** (applies to `test/**`): Testing guidelines and best practices
- **version-control.instructions.md** (applies to `**`): Git workflow and release management

These instructions are automatically applied by GitHub Copilot based on the files you're working with.

## 🎯 Task Guidance for AI Agents

### When Making Changes
1. **Understand the context**: Review related files and documentation first
2. **Make minimal changes**: Change only what's necessary to fix the issue
3. **Follow existing patterns**: Match the style and structure of existing code
4. **Test your changes**: Run relevant tests before committing
5. **Document updates**: Update comments, docs, and CHANGELOG.md as needed

### Common Tasks

#### Adding a New Layout
1. Create file in `_layouts/` following naming conventions
2. Add proper front matter documentation
3. Use Bootstrap 5 components for consistency
4. Ensure responsive design (mobile-first)
5. Test across different content types
6. Update layout documentation

#### Adding a New Include
1. Create file in `_includes/` with descriptive name
2. Add parameter documentation in file header
3. Handle optional parameters with defaults
4. Use semantic HTML and ARIA labels
5. Test with various parameter combinations
6. Document usage examples

#### Fixing a Bug
1. Write a test that reproduces the bug
2. Fix the bug with minimal changes
3. Ensure the test passes
4. Check for similar issues in related code
5. Update CHANGELOG.md with fix details

#### Adding a Feature
1. Review existing features for similar patterns
2. Design for backward compatibility
3. Add comprehensive tests
4. Document the feature thoroughly
5. Update user-facing documentation
6. Consider performance impact

## 🚀 Quick Reference

### Jekyll Commands
```bash
jekyll build              # Build site
jekyll serve              # Start dev server
jekyll doctor             # Check for issues
jekyll clean              # Clean build artifacts
```

### Git Commands
```bash
git status                # Check working directory
git diff                  # View changes
git add -p                # Stage changes interactively
git commit -m "msg"       # Commit with message
git push origin branch    # Push changes
```

### Debugging
```bash
# Debug Jekyll build
bundle exec jekyll build --verbose --trace

# Check Docker logs
docker-compose logs -f jekyll

# Test specific component
docker-compose exec jekyll bash
cd _includes && cat component.html

# Validate configuration
ruby -ryaml -e "puts YAML.load_file('_config.yml').inspect"
```

---

*These instructions focus on Zer0-Mistakes' unique Docker-first approach, AI-powered automation, and Jekyll theme architecture enhanced by comprehensive front matter integration. Follow these patterns to maintain consistency with the project's self-healing, cross-platform philosophy while leveraging structured metadata for optimal AI collaboration and theme development.*

