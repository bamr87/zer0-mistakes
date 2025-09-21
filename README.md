---
title: zer0-mistakes
sub-title: Jekyll Theme
description: Docker-optimized Jekyll theme with AI-powered installation automation and comprehensive error handling.
version: 2.0.0
layout: default
tags:
  - jekyll
  - docker
  - remote-theme
  - github-pages
categories:
  - jekyll-theme
  - docker
  - bootstrap
created: 2024-02-10T23:51:11.480Z
lastmod: 2025-09-21T12:00:00.000Z
draft: false
permalink: /zer0/
slug: zer0
keywords:
  - jekyll
  - docker
  - remote-theme
  - github-pages
date: 2025-09-21T12:00:00.000Z
snippet: Docker-first Jekyll theme with remote theme support
comments: true
preview: /images/zer0-mistakes-docker.png
---

[![pages-build-deployment](https://github.com/bamr87/zer0-mistakes/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/bamr87/zer0-mistakes/actions/workflows/pages/pages-build-deployment)

[![Gem Version](https://badge.fury.io/rb/jekyll-theme-zer0.svg)](https://badge.fury.io/rb/jekyll-theme-zer0)

**Docker-optimized Jekyll theme** with AI-powered self-healing installation and
comprehensive error handling. Built for GitHub Pages compatibility and remote theme usage.

## 🚀 Quick Start

### Method 1: Remote Theme (Recommended)

Perfect for GitHub Pages and new Jekyll sites:

```bash
# Create a new repository or navigate to existing one
mkdir my-new-site && cd my-new-site

# Initialize with remote theme setup
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

### Method 2: Fork & Customize

For extensive customization and theme development:

```bash
# Fork the repository on GitHub, then clone
git clone https://github.com/YOUR-USERNAME/zer0-mistakes.git
cd zer0-mistakes

# Start development environment
docker-compose up
```

## ✨ What Makes This Special

### 🐳 **Docker-First Development**

- **Cross-Platform Compatibility** - Works on Apple Silicon, Intel, and Linux
- **Zero Local Dependencies** - No Ruby/Jekyll installation required
- **Consistent Environment** - Same setup across all development machines
- **Docker Compose Integration** - Simple `docker-compose up` to start

### 🌐 **GitHub Pages Ready**

- **Remote Theme Support** - Use `remote_theme: "bamr87/zer0-mistakes"` in your `_config.yml`
- **GitHub Actions Compatible** - Seamless integration with GitHub Pages deployment
- **Plugin Management** - Includes all GitHub Pages supported plugins
- **Bootstrap 5 Integration** - Modern responsive design framework

### �️ **Self-Healing Installation**

- **Smart Error Detection** - Automatically identifies and fixes common issues
- **Content Protection** - Handles missing dependencies gracefully
- **Configuration Optimization** - Creates Docker-compatible settings automatically
- **Comprehensive Troubleshooting** - Built-in error recovery and documentation

## 🎯 Remote Theme Setup

### Step 1: Create Your Site Repository

```bash
# Create new repository
mkdir my-awesome-site
cd my-awesome-site
git init
```

### Step 2: Add Remote Theme Configuration

Create `_config.yml`:

```yaml
# Remote theme configuration
remote_theme: "bamr87/zer0-mistakes"

# Site settings
title: Your Site Title
email: your-email@example.com
description: >-
  Your site description here. This will appear in search engines
  and social media previews.

# GitHub Pages configuration
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate

# Build settings
markdown: kramdown
highlighter: rouge
permalink: /:categories/:year/:month/:day/:title/
paginate: 10
paginate_path: "/blog/page:num/"
```

### Step 3: Add Development Configuration

Create `_config_dev.yml` for local development:

```yaml
# Development overrides
url: "http://localhost:4000"
baseurl: ""

# Development plugins
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-paginate
  - jekyll-livereload

# Development settings
incremental: true
livereload: true
open_url: true
```

### Step 4: Create Docker Environment

Create `docker-compose.yml`:

```yaml
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64
    command: jekyll serve --watch --force_polling --config "_config.yml,_config_dev.yml" --host 0.0.0.0 --port 4000
    volumes:
      - ./:/app
    ports:
      - "4000:4000"
    working_dir: /app
    environment:
      JEKYLL_ENV: development
```

### Step 5: Add Essential Files

Create `Gemfile`:

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "jekyll-remote-theme"

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "jekyll-paginate"
end
```

Create `index.md`:

```markdown
---
layout: home
title: Home
---

# Welcome to Your Site

Your content goes here. This theme provides a solid foundation
for your Jekyll site with Bootstrap 5 styling and Docker development.
```

### Step 6: Start Development

```bash
# Start the development server
docker-compose up

# Your site will be available at http://localhost:4000
```

## 🚢 Deployment Options

### GitHub Pages (Automatic)

1. Push your repository to GitHub
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Your site will be automatically built and deployed

### Manual Deployment

```bash
# Build production site
docker-compose run --rm jekyll jekyll build --config "_config.yml"

# Deploy the _site directory to your hosting provider
```

## 📦 Installation Script Features

The automated installation script provides:

- **Smart Detection** - Identifies existing Jekyll sites vs. new setups
- **Dependency Resolution** - Installs required gems and configurations
- **Error Recovery** - Fixes common issues automatically
- **Docker Setup** - Creates optimized Docker Compose environment
- **GitHub Pages Prep** - Configures for seamless GitHub Pages deployment

## 🔧 Prerequisites

### Required Software

- **Docker** - For containerized development
- **Git** - For version control
- **Text Editor** - VS Code recommended

### Installation Commands

```bash
# Install Docker (macOS with Homebrew)
brew install --cask docker

# Install Git (if not already installed)
brew install git

# Verify installations
docker --version
git --version
```

## 🎨 Customization

### Theme Structure

```text
your-site/
├── _config.yml          # Main configuration
├── _config_dev.yml      # Development overrides
├── docker-compose.yml   # Docker environment
├── Gemfile             # Ruby dependencies
├── index.md            # Homepage
├── _data/              # Site data files
├── _posts/             # Blog posts
├── _pages/             # Additional pages
└── assets/             # Images, CSS, JS
```

### Custom Styling

Create `assets/css/custom.css`:

```css
/* Your custom styles here */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-secondary;
}

/* Override theme styles */
.navbar-brand {
  color: var(--primary-color) !important;
}
```

### Navigation Setup

Edit `_data/navigation.yml`:

```yaml
main:
  - title: "Home"
    url: /
  - title: "About"
    url: /about/
  - title: "Blog"
    url: /blog/
  - title: "Contact"
    url: /contact/
```

## 🛠️ Troubleshooting

### Common Issues

#### Docker Container Won't Start

```bash
# Check Docker is running
docker ps

# Rebuild container
docker-compose down
docker-compose up --build
```

#### Theme Not Loading

```bash
# Verify remote_theme setting in _config.yml
remote_theme: "bamr87/zer0-mistakes"

# Check Gemfile includes jekyll-remote-theme
gem "jekyll-remote-theme"
```

#### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Or use different port
docker-compose run -p 4001:4000 jekyll
```

#### GitHub Pages Build Fails

- Ensure `jekyll-remote-theme` plugin is in `_config.yml`
- Check that all plugins are GitHub Pages compatible
- Verify `_config.yml` syntax is valid YAML

### Development Tips

```bash
# View container logs
docker-compose logs -f jekyll

# Clean Jekyll cache
docker-compose run --rm jekyll jekyll clean

# Bundle install in container
docker-compose run --rm jekyll bundle install

# Access container shell
docker-compose exec jekyll bash
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/zer0-mistakes.git
cd zer0-mistakes

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
docker-compose up

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Jekyll](https://jekyllrb.com/) static site generator
- Styled with [Bootstrap 5](https://getbootstrap.com/) framework
- Containerized with [Docker](https://docker.com/) for consistent development
- Inspired by IT-Journey principles of reliable, self-healing software

## 📞 Support

- **Documentation**: [Theme Documentation](https://bamr87.github.io/zer0-mistakes/)
- **Issues**: [GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bamr87/zer0-mistakes/discussions)
- **Email**: [support@zer0-mistakes.com](mailto:support@zer0-mistakes.com)

---

Built with ❤️ for the Jekyll community
