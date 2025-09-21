---
title: "Zer0-Mistakes Quick Start Guide"
author: "Zer0-Mistakes Development Team"
layout: default
description: "Complete setup guide for the Zer0-Mistakes Jekyll theme featuring Docker-first development, AI-powered installation, and cross-platform compatibility"
permalink: /quickstart/
sidebar:
   nav: quickstart
lastmod: 2025-02-06T18:18:33.556Z
preview: "Get started with Zer0-Mistakes Jekyll theme in minutes"
tags: [jekyll, docker, setup, development, ai-powered]
categories: [Documentation, Quick Start]
keywords:
  primary: ["jekyll theme setup", "docker development"]
  secondary: ["ai installation", "cross-platform", "bootstrap 5"]
---

# 🚀 Quick Start Guide

Get your **zer0-mistakes** Jekyll site running in under 5 minutes with our intelligent installation system.

## ⚡ Fastest Start (1 Command)

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

## 🔄 Step-by-Step Installation

### Option 1: Automated Setup (Recommended)

**For new sites:**

```bash
# 1. Create project directory
mkdir my-awesome-site && cd my-awesome-site

# 2. Run intelligent installer
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

# 3. Start development server
docker-compose up

# 4. Open in browser
open http://localhost:4000
```

### Option 2: GitHub Pages Setup

**For GitHub Pages hosting:**

```bash
# 1. Create repository on GitHub
gh repo create my-site --public

# 2. Clone and setup
git clone https://github.com/USERNAME/my-site.git
cd my-site

# 3. Add remote theme to _config.yml
echo "remote_theme: bamr87/zer0-mistakes" > _config.yml

# 4. Enable GitHub Pages in repository settings
```

### Option 3: Local Development

**For theme development:**

```bash
# 1. Fork and clone
gh repo fork bamr87/zer0-mistakes --clone
cd zer0-mistakes

# 2. Start development
docker-compose up
```

## 📚 Comprehensive Setup Guides

### 🏗️ Essential Setup

| Guide | Purpose | Time | Difficulty |
|-------|---------|------|------------|
| **[Machine Setup](/quickstart/machine-setup/)** | Install Docker, Git, and platform tools | 10 min | Beginner |
| **[Jekyll Setup](/quickstart/jekyll-setup/)** | Configure theme and development environment | 5 min | Beginner |
| **[GitHub Setup](/quickstart/github-setup/)** | Version control and deployment | 10 min | Intermediate |

### 🚀 Advanced Configuration

| Guide | Purpose | Time | Difficulty |
|-------|---------|------|------------|
| **Bootstrap Customization** | Modify themes and responsive design | 15 min | Intermediate |
| **Performance Optimization** | Speed up loading and Core Web Vitals | 20 min | Advanced |
| **Custom Hosting** | Deploy to Netlify, Vercel, or custom servers | 15 min | Intermediate |

### 🔧 Development Tools

| Tool | Purpose | Setup Time |
|------|---------|------------|
| **VS Code Extensions** | Enhanced Jekyll development | 5 min |
| **GitHub CLI** | Repository management | 5 min |
| **Docker Desktop** | Containerized development | 10 min |

## 🎯 Development Workflows

### Local Development
```bash
# Start development environment
docker-compose up

# Access your site
open http://localhost:4000
```

### Content Creation
```bash
# Create new post
bundle exec jekyll post "My New Post"

# Create new page
bundle exec jekyll page "About"
```

### Theme Customization
```bash
# Customize layouts and includes
edit _layouts/default.html
edit _includes/header.html

# Modify styles
edit assets/css/custom.css
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

### Validation Commands

**Test your installation:**
```bash
# Verify files were installed
ls -la _config.yml docker-compose.yml INSTALLATION.md

# Test Docker configuration
docker-compose config

# Run automated tests
./test/test_installation_complete.sh --verbose
```

## 🆘 Need Help?

| Resource | Purpose | Response Time |
|----------|---------|---------------|
| **[GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues)** | Bug reports and technical support | 24-48 hours |
| **[Discussions](https://github.com/bamr87/zer0-mistakes/discussions)** | Community Q&A and feature requests | Community-driven |
| **[Documentation](https://bamr87.github.io/zer0-mistakes/)** | Comprehensive guides and tutorials | Immediate |
| **AI Diagnostics** | Built-in automated troubleshooting | Immediate |

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
