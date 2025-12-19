---
title: "Jekyll Setup"
author: "Zer0-Mistakes Development Team"
layout: default
description: "Configure your Docker-first Jekyll development environment. Start the development server, create content, and customize your theme."
permalink: /quickstart/jekyll-setup/
preview: /assets/images/previews/jekyll-setup.png
categories: [Documentation, Quick Start]
tags: [jekyll, docker, development, configuration, theme]
keywords:
  primary: ["jekyll development", "docker compose"]
  secondary: ["live reload", "content creation", "theme customization"]
lastmod: 2025-12-19T00:00:00.000Z
draft: false
sidebar:
  nav: quickstart
quickstart:
  step: 2
  next: /quickstart/github-setup/
  prev: /quickstart/machine-setup/
---

# 🚀 Jekyll Setup - Docker-First Development

Welcome to the modern Jekyll development experience with Zer0-Mistakes! This guide covers everything you need to know about developing Jekyll sites using our Docker-first approach - no Ruby installation required.

## 🎯 Overview

The Zer0-Mistakes theme embraces a **Docker-first development philosophy** that eliminates environment inconsistencies and provides a seamless development experience across all platforms. Everything runs in containers, making setup predictable and maintenance-free.

### Why Docker-First?

- ✅ **Zero Local Dependencies**: No Ruby, gems, or version conflicts
- ✅ **Consistent Environments**: Same setup on macOS, Windows, and Linux
- ✅ **Instant Setup**: One command starts your development environment
- ✅ **Production Parity**: Development matches deployment exactly
- ✅ **Team Collaboration**: Everyone has identical setups

## 🛠️ Prerequisites

Before starting Jekyll development, ensure you have completed:

1. **[Machine Setup](/quickstart/machine-setup/)** - Docker Desktop, Git, and VS Code installed
2. **Repository cloned** - Either forked or using the install script

<div class="alert alert-info" role="alert">
  <i class="bi bi-info-circle"></i> <strong>Haven't set up your machine yet?</strong>
  Complete the <a href="/quickstart/machine-setup/">Machine Setup</a> guide first to install Docker and essential tools.
</div>

## 🏗️ Jekyll Development Workflow

### 1. Start Development Environment

Navigate to your theme directory and start the containerized Jekyll server:

```bash
# Navigate to your project
cd ~/github/zer0-mistakes

# Start Jekyll development server
docker-compose up
```

This command:

- 🐳 Pulls the latest Jekyll Docker image
- 📦 Installs all Ruby dependencies automatically
- 🔄 Starts Jekyll server with live reload
- 🌐 Makes your site available at `http://localhost:4000`

### 2. Verify Setup

Open your browser and visit:

- **Local Site**: [http://localhost:4000](http://localhost:4000)
- **Live Reload**: Changes automatically refresh the browser

You should see:

```
✅ Jekyll server running on http://localhost:4000
✅ Live reload enabled
✅ Auto-regeneration: enabled for development
```

### 3. Development Commands

#### Essential Docker Commands

```bash
# Start development server (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop server
docker-compose down

# Restart with fresh build
docker-compose down && docker-compose up --build

# Access container shell for debugging
docker-compose exec jekyll bash

# Clean and rebuild
docker-compose exec jekyll jekyll clean
docker-compose exec jekyll jekyll build
```

#### Jekyll-Specific Commands

```bash
# Build site for production
docker-compose exec jekyll jekyll build --config _config.yml

# Run in development mode with drafts
docker-compose exec jekyll jekyll serve --drafts --future

# Check site health
docker-compose exec jekyll jekyll doctor

# Generate new post
docker-compose exec jekyll jekyll post "My New Post Title"
```

## 📝 Content Creation

### Blog Posts

Create new posts in the `pages/_posts/` directory:

```bash
# Create new post file
touch pages/_posts/$(date +%Y-%m-%d)-my-awesome-post.md
```

Use this frontmatter template:

```yaml
---
title: "My Awesome Post"
description: "Brief description for SEO and social media"
date: 2025-01-27T10:00:00.000Z
preview: /assets/images/previews/jekyll-setup.png
tags: [jekyll, tutorial, web-development]
categories: [Development, Tutorial]
sub-title: "Subtitle for additional context"
excerpt: "One-sentence summary of the post"
author: "Your Name"
layout: journals
keywords:
  primary: ["main keyword", "secondary keyword"]
  secondary: ["supporting terms", "related topics"]
lastmod: 2025-01-27T10:00:00.000Z
permalink: /my-awesome-post/
comments: true
---
# Your Post Content

Write your amazing content here using Markdown!
```

### Static Pages

Create pages in the `pages/` directory or root:

```yaml
---
title: "About"
layout: default
permalink: /about/
description: "Learn more about this site"
---
# About This Site

Your page content here...
```

### Collections (Advanced)

For structured content like tutorials or documentation:

```yaml
# In _config.yml
collections:
  tutorials:
    output: true
    permalink: /:collection/:name/
```

## 🎨 Theme Customization

### Configuration Files

The Zer0-Mistakes theme uses layered configuration:

#### Production Config (`_config.yml`)

```yaml
# Core Jekyll settings
title: "Your Site Title"
description: "Your site description"
url: "https://yourdomain.com"
baseurl: ""

# Theme settings
remote_theme: "bamr87/zer0-mistakes"
plugins:
  - jekyll-remote-theme
  - jekyll-sitemap
  - jekyll-seo-tag

# Bootstrap 5 integration
bootstrap:
  version: "5.3.3"
  css_cdn: true
  js_cdn: true
```

#### Development Config (`_config_dev.yml`)

```yaml
# Development overrides
url: "http://localhost:4000"
baseurl: ""

# Local theme development
theme: zer0-mistakes
remote_theme: false

# Development settings
livereload: true
incremental: true
show_drafts: true
future: true
```

### Custom Styling

Add custom CSS in `assets/css/custom.css`:

```css
/* Custom Bootstrap 5 overrides */
:root {
  --bs-primary: #your-color;
  --bs-secondary: #your-secondary-color;
}

/* Custom component styles */
.custom-header {
  background: linear-gradient(135deg, var(--bs-primary), var(--bs-secondary));
}
```

### Layout Customization

Override theme layouts by creating files in `_layouts/`:

```html
<!-- _layouts/custom.html -->
--- layout: default ---

<div class="container-fluid">
  <div class="row">
    <main class="col-12">{{ content }}</main>
  </div>
</div>
```

## 🔧 Advanced Configuration

### Environment Variables

Use Docker Compose environment variables:

```yaml
# docker-compose.yml
services:
  jekyll:
    environment:
      - JEKYLL_ENV=development
      - PAGES_REPO_NWO=username/repository
```

### Custom Plugins

Add plugins in `_plugins/` directory:

```ruby
# _plugins/custom_tag.rb
module Jekyll
  class CustomTag < Liquid::Tag
    def render(context)
      "Custom content here"
    end
  end
end

Liquid::Template.register_tag('custom', Jekyll::CustomTag)
```

### Performance Optimization

```yaml
# _config.yml performance settings
sass:
  style: compressed

# Exclude unnecessary files
exclude:
  - node_modules/
  - vendor/
  - .bundle/
  - .sass-cache/

# Enable incremental builds
incremental: true
```

## 🚀 Deployment

### GitHub Pages (Automatic)

1. Push changes to `main` branch
2. GitHub Actions builds automatically
3. Site deploys to `https://username.github.io`

### Manual Build

```bash
# Build for production
docker-compose exec jekyll jekyll build --config _config.yml

# Output in _site/ directory
ls -la _site/
```

## 🐛 Troubleshooting

### Common Issues

#### Site Not Loading

```bash
# Check if container is running
docker-compose ps

# View detailed logs
docker-compose logs jekyll

# Restart with fresh build
docker-compose down && docker-compose up --build
```

#### Permission Issues (macOS/Linux)

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

#### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 $(lsof -t -i:4000)
```

#### Container Build Failures

```bash
# Clean Docker system
docker system prune -f

# Rebuild without cache
docker-compose build --no-cache
```

### Getting Help

1. **Check Logs**: Always start with `docker-compose logs`
2. **Jekyll Doctor**: Run `docker-compose exec jekyll jekyll doctor`
3. **GitHub Issues**: Report problems at [zer0-mistakes/issues](https://github.com/bamr87/zer0-mistakes/issues)
4. **Discord Community**: Join our development community

## 📚 Next Steps

After setting up Jekyll development:

1. **Explore the Theme**: Review existing layouts and includes
2. **Create Content**: Write your first blog post
3. **Customize Design**: Modify Bootstrap components
4. **Deploy**: Push to GitHub for automatic deployment
5. **Advanced Features**: Explore collections and custom plugins

## 🎯 Quick Reference

### Essential Commands

```bash
# Start development
docker-compose up

# Stop development
docker-compose down

# View logs
docker-compose logs -f

# Shell access
docker-compose exec jekyll bash

# Build for production
docker-compose exec jekyll jekyll build
```

### File Structure

```
zer0-mistakes/
├── _config.yml          # Production config
├── _config_dev.yml       # Development config
├── docker-compose.yml    # Container setup
├── pages/
│   ├── _posts/          # Blog posts
│   └── _quickstart/     # Documentation
├── _layouts/            # Page templates
├── _includes/           # Reusable components
├── assets/
│   ├── css/            # Custom styles
│   └── js/             # Custom scripts
└── _site/              # Generated site (ignored)
```

---

## 🚀 Next Steps

Now that your Jekyll development environment is running:

1. **[Set up GitHub](/quickstart/github-setup/)** for version control and deployment
2. **[Personalize your site](/quickstart/personalization/)** with custom branding and configuration
3. **Create your first post** using the frontmatter template above

---

<div class="d-flex justify-content-between mt-5">
  <a href="/quickstart/machine-setup/" class="btn btn-outline-primary">
    <i class="bi bi-arrow-left"></i> Previous: Machine Setup
  </a>
  <a href="/quickstart/github-setup/" class="btn btn-primary">
    Next: GitHub Setup <i class="bi bi-arrow-right"></i>
  </a>
</div>

{: .note .info}
Pass the `--livereload` option to `serve` to automatically refresh the page with each change you make to the source files: `bundle exec jekyll serve --livereload`

If you encounter any errors during this process, check that you have installed all the prerequisites in [Requirements]({{ '/docs/installation/#requirements' | relative_url }}).
If you still have issues, see [Troubleshooting]({{ '/docs/troubleshooting/#configuration-problems' | relative_url }}).

{: .note .info}
Installation varies based on your operating system. See our [guides]({{ '/docs/installation/#guides' | relative_url }}) for OS-specific instructions.
