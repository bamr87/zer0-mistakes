# Zer0-Mistakes Copilot Instructions

**Docker-Optimized Jekyll Theme with AI-Powered Self-Healing Installation**

## 🏗️ Architecture Overview

Zer0-Mistakes is a Jekyll theme built for **Docker-first development** with intelligent automation. The codebase follows IT-Journey principles: **Design for Failure (DFF)**, **Don't Repeat Yourself (DRY)**, **Keep It Simple (KIS)**, and **AI-Powered Development (AIPD)**.

### Core Components
- **`_layouts/`**: Modular layout system (default.html, journals.html, home.html)
- **`_includes/`**: Reusable components (sidebar-left.html, header.html, footer.html)
- **`_config.yml`**: Production configuration with remote_theme
- **`_config_dev.yml`**: Docker-compatible development overrides
- **`docker-compose.yml`**: Containerized development environment
- **`install.sh`**: AI-powered one-line installation with error recovery
- **`init_setup.sh`**: Intelligent environment detection and auto-healing

### Key Patterns

#### 1. Configuration Layering
```yaml
# Production (_config.yml)
remote_theme: "bamr87/zer0-mistakes"

# Development (_config_dev.yml) - Auto-generated
remote_theme: false
theme: "jekyll-theme-zer0"
```

#### 2. Docker-First Commands
```bash
# Start development environment
docker-compose up

# Access container
docker-compose exec jekyll bash

# Clean rebuild
docker-compose down && docker-compose up --build
```

#### 3. Self-Healing Installation
```bash
# One-line installation with AI error recovery
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

### Content Creation
- **Posts**: Create in `pages/_posts/` with Jekyll frontmatter
- **Pages**: Add to root or `pages/` with custom layouts
- **Collections**: Use `pages/_quests/`, `pages/_docs/` for organized content
- **Frontmatter**: Include `layout`, `title`, `date`, `categories`, `tags`

## 🎯 Project-Specific Conventions

### Jekyll Theme Architecture
- **Remote theme**: Use `remote_theme` in production, disable for local dev
- **Layout inheritance**: `root.html` → `default.html` → page-specific layouts
- **Include system**: Modular components in `_includes/` for reusability
- **Asset organization**: `assets/css/`, `assets/js/`, `assets/images/`

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

### Code Generation
- **Jekyll patterns**: Generate Liquid templates and frontmatter
- **Docker optimization**: Create container-friendly configurations
- **Error handling**: Implement comprehensive error recovery
- **Documentation**: Auto-generate README and troubleshooting guides

### Development Assistance
- **Theme customization**: Help modify layouts and includes
- **Content creation**: Assist with Jekyll post/page creation
- **Configuration**: Optimize Jekyll and Docker settings
- **Debugging**: Troubleshoot build and runtime issues

### Quality Assurance
- **Code review**: Check for Jekyll best practices
- **Security**: Validate safe Liquid template usage
- **Performance**: Optimize asset loading and page speed
- **Accessibility**: Ensure WCAG compliance in templates

---

*These instructions focus on Zer0-Mistakes' unique Docker-first approach, AI-powered automation, and Jekyll theme architecture. Follow these patterns to maintain consistency with the project's self-healing, cross-platform philosophy.*

