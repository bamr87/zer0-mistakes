---
title: Zer0-Mistakes Quick Start Guide
author: Zer0-Mistakes Development Team
layout: default
description: Complete setup guide for the Zer0-Mistakes Jekyll theme featuring Docker-first development, AI-powered installation, and cross-platform compatibility
permalink: /quickstart/
sidebar:
    nav: quickstart
lastmod: 2025-12-20T22:15:45.842Z
preview: /images/previews/zer0-mistakes-quick-start-guide.png
tags:
    - jekyll
    - docker
    - setup
    - development
    - ai-powered
categories:
    - Documentation
    - Quick Start
keywords:
    primary:
        - jekyll theme setup
        - docker development
    secondary:
        - ai installation
        - cross-platform
        - bootstrap 5
draft: draft
---

# 🚀 Quick Start Guide

Get your **zer0-mistakes** Jekyll site running in under 5 minutes with our intelligent installation system.

For the full install + personalization workflow (all methods, config layering, and troubleshooting), use the canonical repo guide:

- `{{ site.resources.github_repo | default: '' | join: '' }}/blob/{{ site.branch }}/docs/QUICKSTART.md`

<h2 id="fastest-start-1-command">⚡ Fastest Start (1 Command)</h2>

**For immediate results:**

```bash
# Create and setup new site
mkdir my-site && cd my-site
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash && docker-compose up
```

**That's it!** Your site will be running at `http://localhost:4000`

## 🎯 What You Get

- **🤖 AI-Powered Setup** - Intelligent error detection and automatic fixes
- **🐳 Docker Environment** - Consistent development across all platforms
- **🎨 Bootstrap 5.3** - Modern responsive design with dark mode
- **📱 Mobile-First** - Optimized for all devices and screen sizes
- **⚡ Live Reload** - Changes appear instantly during development
- **🛡️ Error Recovery** - Self-healing installation with detailed diagnostics

## 🔄 Installation Options

| Path | Method | Best For |
|------|--------|----------|
| **A** | AI Install Wizard | Creating a new site (recommended) |
| **B** | GitHub Template | One-click copy of the entire repo |
| **C** | GitHub Codespaces | Zero-install cloud development |
| **D** | Fork/Clone | Personal site & theme customization |
| **E** | Remote Theme | GitHub Pages without copying files |
| **F** | Ruby Gem | Traditional Jekyll workflow |

### Option A: AI Install Wizard (Recommended)

```bash
mkdir my-site && cd my-site
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
docker-compose up
```

### Option B: GitHub Template Repository

1. Go to [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Click **"Use this template"** → **"Create a new repository"**
3. Clone your new repo and run `docker-compose up`

Or via CLI:

```bash
gh repo create my-site --template bamr87/zer0-mistakes --clone
cd my-site && docker-compose up
```

### Option C: GitHub Codespaces (Zero Install)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bamr87/zer0-mistakes)

Or from the repo page: **Code** → **Codespaces** → **Create codespace on main**

### Option D: Fork/Clone (Personal Site)

Fork into `<your-username>.github.io` to deploy your own site:

1. Go to [bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes) → **Fork**
2. Set repository name to **`<your-username>.github.io`**
3. Enable **Settings → Pages → Deploy from branch: `main`**
4. Clone locally and personalize:

```bash
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
./scripts/fork-cleanup.sh   # interactive config wizard
docker-compose up
```

See [docs/FORKING.md]({{ site.resources.github_repo | default: '' | join: '' }}/blob/{{ site.branch }}/docs/FORKING.md) for the full fork → configure → personalize guide.

### Option E: Remote Theme (GitHub Pages)

```bash
gh repo create my-site --public --clone
cd my-site
echo "remote_theme: bamr87/zer0-mistakes" > _config.yml
# Enable GitHub Pages in repository Settings
```

### Option F: Ruby Gem

```bash
echo 'gem "jekyll-theme-zer0"' >> Gemfile
bundle install
# Set theme: jekyll-theme-zer0 in _config.yml
```

For the complete setup guide with all options and troubleshooting, see [QUICKSTART.md]({{ site.resources.github_repo | default: '' | join: '' }}/blob/{{ site.branch }}/docs/QUICKSTART.md).

## 📚 Comprehensive Setup Guides

<h3 id="essential-setup">🏗️ Essential Setup</h3>

| Guide                                           | Purpose                                     | Time   | Difficulty   |
| ----------------------------------------------- | ------------------------------------------- | ------ | ------------ |
| **[Machine Setup](/quickstart/machine-setup/)** | Install Docker, Git, and platform tools     | 10 min | Beginner     |
| **[Jekyll Setup](/quickstart/jekyll-setup/)**   | Configure theme and development environment | 5 min  | Beginner     |
| **[GitHub Setup](/quickstart/github-setup/)**   | Version control and deployment              | 10 min | Intermediate |

<h3 id="advanced-configuration">🚀 Advanced Configuration</h3>

| Guide                        | Purpose                                      | Time   | Difficulty   |
| ---------------------------- | -------------------------------------------- | ------ | ------------ |
| **Bootstrap Customization**  | Modify themes and responsive design          | 15 min | Intermediate |
| **Performance Optimization** | Speed up loading and Core Web Vitals         | 20 min | Advanced     |
| **Custom Hosting**           | Deploy to Netlify, Vercel, or custom servers | 15 min | Intermediate |

### 🔧 Development Tools

| Tool                   | Purpose                     | Setup Time |
| ---------------------- | --------------------------- | ---------- |
| **VS Code Extensions** | Enhanced Jekyll development | 5 min      |
| **GitHub CLI**         | Repository management       | 5 min      |
| **Docker Desktop**     | Containerized development   | 10 min     |

## 🎯 Development Workflows

### Local Development

```bash
# Start development environment
docker-compose up

# Access your site
open http://localhost:4000
```

### Theme Customization

```bash
# Customize layouts and includes
edit _layouts/default.html
edit _includes/header.html

# Modify styles (SCSS pipeline)
edit _sass/custom.scss
# or add assets/css/user-overrides.css and link it in _includes/core/head.html
```

## 🔧 Quick Troubleshooting

### Installation Issues

**Problem: Installation fails**

```bash
# Check Docker is running
docker --version

# Try minimal installation first
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --minimal
```

**Problem: Port 4000 in use**

```bash
# Check what's using the port
lsof -i :4000

# Use different port
docker-compose run -p 4001:4000 jekyll
```

**Problem: Docker platform warnings**

```bash
# This is normal on Apple Silicon - the site will still work
# The docker-compose.yml already includes platform: linux/amd64
```

<h3 id="validation-commands">Validation Commands</h3>

**Test your installation:**

```bash
# New site install (generated project):
# - Confirm files exist and Docker config parses
ls -la
docker-compose config

# Theme repo (this repository):
./test/test_runner.sh
```

## 🆘 Need Help?

| Resource                                                               | Purpose                            | Response Time    |
| ---------------------------------------------------------------------- | ---------------------------------- | ---------------- |
| **[GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)**    | Bug reports and technical support  | 24-48 hours      |
| **[Discussions](https://github.com/bamr87/zer0-mistakes/discussions)** | Community Q&A and feature requests | Community-driven |
| **[Documentation](https://bamr87.github.io/zer0-mistakes/)**           | Comprehensive guides and tutorials | Immediate        |
| **AI Diagnostics**                                                     | Built-in automated troubleshooting | Immediate        |

## 🚀 Next Steps

**🎯 Immediate Actions:**

1. Run the [one-command installation](#fastest-start-1-command)
2. Verify with the [validation commands](#validation-commands)
3. Start customizing your site content

**📚 Learn More:**

1. Follow the [essential setup guides](#essential-setup)
2. Explore [advanced configuration options](#advanced-configuration)
3. Join our [community discussions](https://github.com/bamr87/zer0-mistakes/discussions)

**🚀 Deploy:**

1. Push to GitHub for automatic Pages deployment
2. Configure custom domain if needed
3. Monitor performance with built-in tools

---

**Ready to build something amazing?** Start with the [fastest installation](#fastest-start-1-command) above!
