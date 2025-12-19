---
title: "Quick Start Guide"
author: "Zer0-Mistakes Development Team"
layout: default
description: "Get your Jekyll site running in under 5 minutes with Docker-first development, AI-powered installation, and cross-platform compatibility."
permalink: /quickstart/
preview: /assets/images/previews/zer0-mistakes-quick-start-guide.png
categories: [Documentation, Quick Start]
tags: [jekyll, docker, setup, development, ai-powered]
keywords:
  primary: ["jekyll theme setup", "docker development"]
  secondary: ["ai installation", "cross-platform", "bootstrap 5"]
lastmod: 2025-12-19T00:00:00.000Z
sidebar:
  nav: quickstart
quickstart:
  step: 0
  next: /quickstart/machine-setup/
  prev: null
---

# 🚀 Quick Start Guide

Get your **zer0-mistakes** Jekyll site running in under 5 minutes with our intelligent installation system.

For the full install + personalization workflow (all methods, config layering, and troubleshooting), use the canonical repo guide:

- `{{ site.resources.github_repo }}/blob/{{ site.branch }}/QUICKSTART.md`

## 🎛️ Customize Your Environment

<div class="card mb-4 border-primary">
  <div class="card-header bg-primary text-white">
    <i class="bi bi-sliders"></i> <strong>Set Your Environment Variables</strong>
  </div>
  <div class="card-body">
    <p class="text-muted mb-3">Configure your project settings. These will generate environment variables for use in all commands below:</p>
    <form id="env-config-form">
      <div class="row g-3">
        <div class="col-md-6">
          <label for="site-name" class="form-label"><i class="bi bi-folder"></i> Site/Project Name</label>
          <input type="text" class="form-control" id="site-name" placeholder="my-site" value="my-site">
          <div class="form-text">Directory and repository name</div>
        </div>
        <div class="col-md-6">
          <label for="github-username" class="form-label"><i class="bi bi-github"></i> GitHub Username</label>
          <input type="text" class="form-control" id="github-username" placeholder="your-username" value="">
          <div class="form-text">Your GitHub account</div>
        </div>
        <div class="col-md-6">
          <label for="port-number" class="form-label"><i class="bi bi-hdd-network"></i> Development Port</label>
          <input type="number" class="form-control" id="port-number" placeholder="4000" value="4000" min="1024" max="65535">
          <div class="form-text">Local server port</div>
        </div>
        <div class="col-md-6">
          <label for="alt-port-number" class="form-label"><i class="bi bi-arrow-repeat"></i> Alternate Port</label>
          <input type="number" class="form-control" id="alt-port-number" placeholder="4001" value="4001" min="1024" max="65535">
          <div class="form-text">Fallback if port in use</div>
        </div>
      </div>
      <div class="mt-3">
        <button type="button" class="btn btn-outline-secondary btn-sm" id="reset-defaults">
          <i class="bi bi-arrow-counterclockwise"></i> Reset to Defaults
        </button>
      </div>
    </form>
  </div>
</div>

<div class="alert alert-info" role="alert">
  <i class="bi bi-info-circle"></i> <strong>Step 1: Set your environment variables</strong>
  <p class="mb-2 mt-2">Copy and run this in your terminal to set up your environment:</p>
  <div class="position-relative">
    <pre class="bg-dark text-light p-3 rounded" style="position: relative;"><code id="env-vars-code" class="language-bash">export MY_SITE="my-site"
export GITHUB_USER="your-username"
export DEV_PORT="4000"
export ALT_PORT="4001"</code></pre>
    <button class="btn btn-sm btn-outline-light position-absolute top-0 end-0 m-2" id="copy-env-btn" onclick="copyEnvVars()">
      <i class="bi bi-clipboard"></i> Copy
    </button>
  </div>
</div>

## ⚡ Fastest Start (1 Command)

**For immediate results:**

```bash
# Create and setup new site
mkdir ${MY_SITE} && cd ${MY_SITE}
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash && docker-compose up
```

**That's it!** Your site will be running at `http://localhost:${DEV_PORT}`

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
mkdir ${MY_SITE} && cd ${MY_SITE}

# 2. Run intelligent installer
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

# 3. Start development server
docker-compose up

# 4. Open in browser
open http://localhost:${DEV_PORT}
```

### Option 2: GitHub Pages Setup

**For GitHub Pages hosting:**

```bash
# 1. Create repository on GitHub
gh repo create ${MY_SITE} --public

# 2. Clone and setup
git clone https://github.com/${GITHUB_USER}/${MY_SITE}.git
cd ${MY_SITE}

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

If you’re developing the theme repo itself, follow `QUICKSTART.md` for the complete set of dev commands, testing, and configuration details.

## 📚 Comprehensive Setup Guides

Follow these guides in order for the best experience:

### 🏗️ Essential Setup (Recommended Order)

| Step | Guide                                               | Purpose                                      | Time   | Difficulty   |
| ---- | --------------------------------------------------- | -------------------------------------------- | ------ | ------------ |
| 1    | **[Machine Setup](/quickstart/machine-setup/)**     | Install Docker, Git, and development tools   | 10 min | Beginner     |
| 2    | **[Jekyll Setup](/quickstart/jekyll-setup/)**       | Start development server and create content  | 5 min  | Beginner     |
| 3    | **[GitHub Setup](/quickstart/github-setup/)**       | Version control and deployment to GitHub Pages | 10 min | Intermediate |
| 4    | **[Personalization](/quickstart/personalization/)** | Customize site identity, branding, analytics | 15 min | Beginner     |

### 🚀 Advanced Configuration

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
open http://localhost:${DEV_PORT}
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

**Problem: Port in use**

```bash
# Check what's using the port
lsof -i :${DEV_PORT}

# Use different port
docker-compose run -p ${ALT_PORT}:4000 jekyll
```

**Problem: Docker platform warnings**

```bash
# This is normal on Apple Silicon - the site will still work
# The docker-compose.yml already includes platform: linux/amd64
```

### Validation Commands

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

**Ready to build something amazing?** Start with the [fastest installation](#fastest-start-1-command) above, or follow the step-by-step guides starting with **[Machine Setup](/quickstart/machine-setup/)**!

---

<div class="d-flex justify-content-center mt-5">
  <a href="/quickstart/machine-setup/" class="btn btn-primary btn-lg">
    Start Setup Guide <i class="bi bi-arrow-right"></i>
  </a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const siteNameInput = document.getElementById('site-name');
  const usernameInput = document.getElementById('github-username');
  const portInput = document.getElementById('port-number');
  const altPortInput = document.getElementById('alt-port-number');
  const resetBtn = document.getElementById('reset-defaults');
  const envVarsCode = document.getElementById('env-vars-code');

  const defaults = {
    siteName: 'my-site',
    username: 'your-username',
    port: '4000',
    altPort: '4001'
  };

  function updateEnvVars() {
    const siteName = siteNameInput.value || defaults.siteName;
    const username = usernameInput.value || defaults.username;
    const port = portInput.value || defaults.port;
    const altPort = altPortInput.value || defaults.altPort;

    const envVarsText = `export MY_SITE="${siteName}"
export GITHUB_USER="${username}"
export DEV_PORT="${port}"
export ALT_PORT="${altPort}"`;

    envVarsCode.textContent = envVarsText;

    // Save to localStorage
    localStorage.setItem('qs-env-config', JSON.stringify({
      siteName, username, port, altPort
    }));
  }

  function resetToDefaults() {
    siteNameInput.value = defaults.siteName;
    usernameInput.value = defaults.username;
    portInput.value = defaults.port;
    altPortInput.value = defaults.altPort;
    updateEnvVars();
    localStorage.removeItem('qs-env-config');
  }

  function loadSavedConfig() {
    const saved = localStorage.getItem('qs-env-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        siteNameInput.value = config.siteName || defaults.siteName;
        usernameInput.value = config.username || defaults.username;
        portInput.value = config.port || defaults.port;
        altPortInput.value = config.altPort || defaults.altPort;
      } catch (e) {
        console.warn('Could not load saved config:', e);
      }
    }
    updateEnvVars();
  }

  // Event listeners
  if (siteNameInput) siteNameInput.addEventListener('input', updateEnvVars);
  if (usernameInput) usernameInput.addEventListener('input', updateEnvVars);
  if (portInput) portInput.addEventListener('input', updateEnvVars);
  if (altPortInput) altPortInput.addEventListener('input', updateEnvVars);
  if (resetBtn) resetBtn.addEventListener('click', resetToDefaults);

  loadSavedConfig();
});

function copyEnvVars() {
  const code = document.getElementById('env-vars-code').textContent;
  const btn = document.getElementById('copy-env-btn');
  
  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
    btn.classList.remove('btn-outline-light');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('btn-success');
      btn.classList.add('btn-outline-light');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard. Please copy manually.');
  });
}
</script>

<style>
#env-vars-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

#env-config-form .form-control:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}

#env-config-form .form-label {
  font-weight: 500;
}

#env-config-form .form-label i {
  margin-right: 0.25rem;
}

.alert pre {
  margin-bottom: 0;
}
</style>
