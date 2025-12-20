---
title: Jekyll
description: Jekyll basics and Zer0-Mistakes development workflow (Docker-first).
layout: default
categories:
    - docs
    - jekyll
tags:
    - jekyll
    - getting-started
    - docker
permalink: /docs/jekyll/
difficulty: beginner
estimated_time: 10 minutes
prerequisites:
    - Docker Desktop (recommended) or Ruby + Bundler
updated: 2025-12-20
lastmod: 2025-12-20T22:15:45.976Z
sidebar:
    nav: docs
---

# Jekyll

Jekyll is the static site generator that powers Zer0-Mistakes. This section covers everything you need to work with Jekyll effectively.

## Quick Start

### Prerequisites

- Complete the [Installation Guide](/docs/installation/)
- Have Docker Desktop running (or Ruby + Bundler installed)

### Run Locally

```bash
# With Docker (recommended)
docker-compose up

# Without Docker
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

Your site will be available at [http://localhost:4000](http://localhost:4000).

## Key Concepts

### Directory Structure

| Directory | Purpose |
|-----------|---------|
| `_layouts/` | Page templates (HTML with Liquid) |
| `_includes/` | Reusable components |
| `_data/` | Site data files (YAML, JSON) |
| `_sass/` | Stylesheet partials |
| `pages/` | Content collections |
| `assets/` | Static files (CSS, JS, images) |

### Configuration Files

| File | Purpose |
|------|---------|
| `_config.yml` | Production configuration |
| `_config_dev.yml` | Development overrides |
| `Gemfile` | Ruby dependencies |

### Content Collections

Zer0-Mistakes organizes content in collections under `pages/`:

- `_posts/` - Blog posts
- `_docs/` - Documentation
- `_quests/` - Tutorials and learning paths
- `_about/` - About pages

## Essential Commands

```bash
# Build the site
docker-compose exec jekyll jekyll build

# Build with verbose output
docker-compose exec jekyll jekyll build --verbose

# Check for configuration issues
docker-compose exec jekyll jekyll doctor

# Clean build artifacts
docker-compose exec jekyll jekyll clean
```

## Documentation Topics

### Configuration & Setup

- [Jekyll Configuration](/docs/jekyll/jekyll-config/) - Site settings and options
- [Front Matter](/docs/front-matter/) - Page metadata and options
- [Performance Optimization](/docs/jekyll/jekyll-performance-optimization/)
- [Security Best Practices](/docs/jekyll/jekyll-security/)

### Templating & Content

- [Liquid Templating](/docs/jekyll/jekyll-liquid/) - Template language basics
- [Syntax Highlighting](/docs/jekyll/jekyll-highlighting/) - Code blocks and syntax colors
- [Mermaid Diagrams](/docs/jekyll/mermaid-native-markdown/) - Diagrams in Markdown
- [Math with MathJax](/docs/jekyll/jekyll-math-symbols-with-mathjax/)

### Deployment

- [GitHub Pages](/quickstart/github-setup/) - Deploy to GitHub
- [Netlify](/docs/jekyll/deploying-jekyll-website-to-netlify/) - Deploy to Netlify
- [Custom Domain](/docs/jekyll/deploying-personal-website-with-custom-domain/)

## Resources

- [Official Jekyll Documentation](https://jekyllrb.com/docs/)
- [Jekyll GitHub Repository](https://github.com/jekyll/jekyll)
- [Liquid Template Language](https://shopify.github.io/liquid/)

## Related

- [Ruby & Bundler](/docs/ruby/) - Ruby dependency management
- [Liquid Templating](/docs/liquid/) - Template language reference
- [Docker Development](/docs/docker/) - Container-based workflow
