# Zer0-Mistakes Copilot Instructions

**Docker-Optimized Jekyll Theme with AI-Powered Self-Healing Installation**

## 🏗️ Architecture Overview

Zer0-Mistakes is a Jekyll theme built for **Docker-first development** with intelligent automation and comprehensive front matter integration. The codebase follows IT-Journey principles: **Design for Failure (DFF)**, **Don't Repeat Yourself (DRY)**, **Keep It Simple (KIS)**, and **AI-Powered Development (AIPD)**, all enhanced by structured front matter that enables AI agents to understand and optimize the development workflow.

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

---

*These instructions focus on Zer0-Mistakes' unique Docker-first approach, AI-powered automation, and Jekyll theme architecture enhanced by comprehensive front matter integration. Follow these patterns to maintain consistency with the project's self-healing, cross-platform philosophy while leveraging structured metadata for optimal AI collaboration and theme development.*

