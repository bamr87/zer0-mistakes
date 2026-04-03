# Universal Installer Plan for Zer0-Mistakes Jekyll Theme

**Status**: Planning Phase
**Created**: 2026-04-03
**Goal**: Transform the existing installation system into a comprehensive universal installer supporting multiple platforms and installation methods with automated base template initialization.

---

## Executive Summary

The Zer0-Mistakes theme currently has a robust installation system (`install.sh`, 1902 lines) with platform detection, template rendering, and multiple modes (full/minimal/fork). This plan enhances it to become a **true universal installer** that:

1. **Supports all major platforms** with native installers (macOS, Linux, Windows)
2. **Provides multiple installation methods** (GitHub web, CLI, curl, platform-specific scripts)
3. **Automatically initializes a sample site** that educates users on configuration and customization
4. **Integrates seamlessly with GitHub workflows** (fork, clone, deploy)

---

## Current State Analysis

### ✅ Existing Strengths

**Platform Support:**
- ✅ Automatic OS detection (Darwin/Linux/Windows via `uname`)
- ✅ Architecture detection (x86_64/arm64/aarch64)
- ✅ Apple Silicon optimization (Docker platform: linux/amd64)
- ✅ Docker/Docker Compose version detection
- ✅ Git safe.directory configuration

**Installation Features:**
- ✅ Three installation modes:
  - `--full`: Complete theme with Docker, all assets, GitHub workflows
  - `--minimal`: Bare essentials for remote theme usage
  - `--fork`: Clean template with example content removed
- ✅ Remote installation: `curl -fsSL https://...install.sh | bash`
- ✅ Template rendering engine with `{{VAR}}` substitution
- ✅ Backup system for existing files
- ✅ Dependency validation (Docker, Git)

**Template System:**
- ✅ 13 template files in `/templates/`
- ✅ Configuration via `install.conf`
- ✅ Variable substitution for: theme name, GitHub URLs, versions, user info, dates
- ✅ Starter pages: index, about, blog, quickstart, docs, configuration, troubleshooting
- ✅ Data templates: authors.yml, navigation.yml
- ✅ Config templates: Gemfile.full, Gemfile.minimal, _config.fork.yml

**Docker Integration:**
- ✅ Multi-stage Dockerfile (base → dev-test → build → production)
- ✅ docker-compose.yml with bundle caching
- ✅ Platform-specific optimizations
- ✅ Jekyll 4.3 + Ruby 3.3 environment

### ❌ Current Gaps

**User Experience:**
- ❌ No interactive installation wizard (requires manual flags)
- ❌ Non-interactive mode requires prior knowledge of options
- ❌ Error messages lack actionable guidance
- ❌ No post-install success page or next-steps guide

**Platform Coverage:**
- ❌ No Windows native installer (.bat or .ps1)
- ❌ Limited Windows-specific guidance (Git Bash vs WSL vs PowerShell)
- ❌ No Linux distribution-specific installers (apt, yum, pacman)
- ❌ Missing platform-specific troubleshooting

**GitHub Integration:**
- ❌ No GitHub CLI (`gh`) integration
- ❌ Manual fork process (not automated)
- ❌ No template repository setup
- ❌ Missing GitHub Pages configuration automation

**Base Template:**
- ❌ Sample site content doesn't explain configuration options
- ❌ No interactive configuration guide
- ❌ Missing style customization examples
- ❌ Limited explanation of theme features

---

## Implementation Plan

### Phase 1: Interactive Installation Wizard 🎯

**Goal**: Create a user-friendly interactive installer that guides users through platform-specific installation.

#### Files to Create/Modify:
1. **`install-wizard.sh`** - New interactive installer script
2. **`install.sh`** - Enhance with `--interactive` flag
3. **`templates/config/install.conf`** - Add wizard configuration

#### Features:

**1.1 Platform Detection & Presentation**
```bash
#!/bin/bash
# install-wizard.sh

detect_and_present_platform() {
    echo "╔════════════════════════════════════════╗"
    echo "║  Zer0-Mistakes Universal Installer     ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "🔍 Detecting your system..."

    OS=$(uname -s)
    ARCH=$(uname -m)

    case "$OS" in
        Darwin*)
            PLATFORM="macOS"
            [[ "$ARCH" == "arm64" ]] && PLATFORM="macOS (Apple Silicon)"
            ;;
        Linux*)
            PLATFORM="Linux"
            # Detect distribution
            if [[ -f /etc/os-release ]]; then
                . /etc/os-release
                PLATFORM="Linux ($NAME)"
            fi
            ;;
        CYGWIN*|MINGW*|MSYS*)
            PLATFORM="Windows"
            # Detect environment
            if [[ -n "$WSL_DISTRO_NAME" ]]; then
                PLATFORM="Windows (WSL2: $WSL_DISTRO_NAME)"
            elif [[ -n "$MSYSTEM" ]]; then
                PLATFORM="Windows (Git Bash)"
            fi
            ;;
    esac

    echo "✅ Platform: $PLATFORM"
    echo "✅ Architecture: $ARCH"
    echo ""
}
```

**1.2 Installation Method Selection**
```bash
select_installation_method() {
    echo "📦 How would you like to install Zer0-Mistakes?"
    echo ""
    echo "1) Docker-based (Recommended - No Ruby required)"
    echo "2) Native Ruby (Local Jekyll development)"
    echo "3) GitHub Fork (For contributors)"
    echo "4) Remote Theme (Minimal - Use hosted theme)"
    echo ""
    read -p "Enter your choice [1-4]: " method_choice

    case "$method_choice" in
        1) INSTALL_METHOD="docker" ;;
        2) INSTALL_METHOD="native" ;;
        3) INSTALL_METHOD="fork" ;;
        4) INSTALL_METHOD="remote" ;;
        *)
            echo "❌ Invalid choice. Using Docker (recommended)."
            INSTALL_METHOD="docker"
            ;;
    esac
}
```

**1.3 Installation Mode Selection**
```bash
select_installation_mode() {
    echo ""
    echo "🎨 What type of site would you like to create?"
    echo ""
    echo "1) Full Theme (All features, assets, and examples)"
    echo "2) Sample Site (Educational base template)"
    echo "3) Minimal Setup (Config only - use remote theme)"
    echo "4) Clean Fork (Empty template - remove examples)"
    echo ""
    read -p "Enter your choice [1-4]: " mode_choice

    case "$mode_choice" in
        1) INSTALL_MODE="full" ;;
        2) INSTALL_MODE="sample" ;;  # NEW MODE
        3) INSTALL_MODE="minimal" ;;
        4) INSTALL_MODE="fork" ;;
        *)
            echo "❌ Invalid choice. Using Sample Site (recommended for learning)."
            INSTALL_MODE="sample"
            ;;
    esac
}
```

**1.4 Directory & Configuration**
```bash
configure_installation() {
    echo ""
    echo "⚙️  Let's configure your installation..."
    echo ""

    # Installation directory
    read -p "📁 Installation directory [./my-jekyll-site]: " TARGET_DIR
    TARGET_DIR="${TARGET_DIR:-./my-jekyll-site}"

    # Site configuration
    read -p "📝 Site title [My Jekyll Site]: " SITE_TITLE
    SITE_TITLE="${SITE_TITLE:-My Jekyll Site}"

    read -p "✍️  Your name [Site Author]: " SITE_AUTHOR
    SITE_AUTHOR="${SITE_AUTHOR:-Site Author}"

    read -p "📧 Your email [your@email.com]: " SITE_EMAIL
    SITE_EMAIL="${SITE_EMAIL:-your@email.com}"

    # GitHub integration (if fork/remote)
    if [[ "$INSTALL_METHOD" == "fork" || "$INSTALL_METHOD" == "remote" ]]; then
        read -p "🐙 Your GitHub username: " GITHUB_USER_INPUT

        # Check if gh CLI is available
        if command -v gh &>/dev/null; then
            read -p "🔧 Create GitHub repository automatically? [y/N]: " create_repo
            CREATE_GITHUB_REPO="${create_repo:-n}"
        fi
    fi
}
```

**1.5 Pre-Installation Validation**
```bash
validate_prerequisites() {
    echo ""
    echo "🔍 Validating prerequisites..."

    local all_ok=true

    # Docker check (if Docker method selected)
    if [[ "$INSTALL_METHOD" == "docker" ]]; then
        if command -v docker &>/dev/null; then
            if docker info &>/dev/null 2>&1; then
                echo "✅ Docker: Available and running"
            else
                echo "❌ Docker: Installed but not running"
                echo "   → Please start Docker Desktop"
                all_ok=false
            fi
        else
            echo "❌ Docker: Not installed"
            echo "   → Install from https://docker.com"
            all_ok=false
        fi

        # Docker Compose check
        if command -v docker-compose &>/dev/null || docker compose version &>/dev/null 2>&1; then
            echo "✅ Docker Compose: Available"
        else
            echo "❌ Docker Compose: Not found"
            all_ok=false
        fi
    fi

    # Ruby check (if native method)
    if [[ "$INSTALL_METHOD" == "native" ]]; then
        if command -v ruby &>/dev/null; then
            ruby_version=$(ruby -v | grep -oE '[0-9]+\.[0-9]+' | head -1)
            echo "✅ Ruby: v$ruby_version"

            if command -v bundle &>/dev/null; then
                echo "✅ Bundler: Available"
            else
                echo "⚠️  Bundler: Not found (will be installed)"
            fi
        else
            echo "❌ Ruby: Not installed"
            echo "   → Install from https://www.ruby-lang.org"
            all_ok=false
        fi
    fi

    # Git check (always required)
    if command -v git &>/dev/null; then
        git_version=$(git --version | grep -oE '[0-9]+\.[0-9]+')
        echo "✅ Git: v$git_version"
    else
        echo "❌ Git: Not installed"
        echo "   → Install from https://git-scm.com"
        all_ok=false
    fi

    if [[ "$all_ok" == "false" ]]; then
        echo ""
        echo "❌ Some prerequisites are missing. Please install them and try again."
        exit 1
    fi

    echo ""
    echo "✅ All prerequisites satisfied"
}
```

**1.6 Installation Summary & Confirmation**
```bash
show_installation_summary() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║      Installation Summary              ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Platform:        $PLATFORM"
    echo "Method:          $INSTALL_METHOD"
    echo "Mode:            $INSTALL_MODE"
    echo "Directory:       $TARGET_DIR"
    echo "Site Title:      $SITE_TITLE"
    echo "Author:          $SITE_AUTHOR"
    echo "Email:           $SITE_EMAIL"
    [[ -n "$GITHUB_USER_INPUT" ]] && echo "GitHub User:     $GITHUB_USER_INPUT"
    echo ""

    read -p "🚀 Proceed with installation? [Y/n]: " confirm
    confirm="${confirm:-y}"

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "❌ Installation cancelled."
        exit 0
    fi
}
```

---

### Phase 2: Platform-Specific Installers 🖥️

**Goal**: Create native installers for each major platform.

#### 2.1 Windows Batch Script (`install.bat`)

```batch
@echo off
REM Zer0-Mistakes Windows Installer (Git Bash/WSL/PowerShell)
REM Usage: install.bat

echo ========================================
echo  Zer0-Mistakes Universal Installer
echo ========================================
echo.

REM Detect Windows environment
where bash >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Detected Git Bash
    echo [*] Launching bash installer...
    bash "%~dp0install-wizard.sh"
    exit /b %ERRORLEVEL%
)

where wsl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Detected WSL
    echo [*] Launching WSL installer...
    wsl bash "%~dp0install-wizard.sh"
    exit /b %ERRORLEVEL%
)

REM Fall back to PowerShell
echo [*] Launching PowerShell installer...
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"
exit /b %ERRORLEVEL%
```

#### 2.2 Windows PowerShell Script (`install.ps1`)

```powershell
# Zer0-Mistakes PowerShell Installer
# Requires PowerShell 5.1+

param(
    [string]$TargetDir = "my-jekyll-site",
    [string]$Mode = "full",
    [switch]$Interactive = $false
)

$ErrorActionPreference = "Stop"

# Color functions
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Platform detection
function Get-WindowsEnvironment {
    if ($env:WSL_DISTRO_NAME) {
        return "WSL2: $env:WSL_DISTRO_NAME"
    } elseif ($env:MSYSTEM) {
        return "Git Bash"
    } else {
        return "PowerShell"
    }
}

Write-Info "Windows Environment: $(Get-WindowsEnvironment)"

# Check prerequisites
Write-Info "Checking prerequisites..."

# Docker check
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Success "Docker found"

    # Check if Docker is running
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
    } catch {
        Write-Error "Docker is installed but not running. Please start Docker Desktop."
        exit 1
    }
} else {
    Write-Warning "Docker not found. Install from https://docker.com"
}

# Git check
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Success "Git found"
} else {
    Write-Error "Git not found. Install from https://git-scm.com"
    exit 1
}

# Clone or download theme
Write-Info "Setting up Zer0-Mistakes theme..."

$repoUrl = "https://github.com/bamr87/zer0-mistakes.git"
$tempDir = Join-Path $env:TEMP "zer0-mistakes-install"

if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

Write-Info "Cloning repository..."
git clone --depth 1 $repoUrl $tempDir

# Run bash installer from downloaded repo
Write-Info "Launching installer..."
$bashScript = Join-Path $tempDir "install-wizard.sh"

if ($env:WSL_DISTRO_NAME) {
    # WSL environment
    wsl bash "$bashScript" --target "$TargetDir" --mode "$Mode"
} elseif (Get-Command bash -ErrorAction SilentlyContinue) {
    # Git Bash
    bash "$bashScript" --target "$TargetDir" --mode "$Mode"
} else {
    Write-Error "No bash environment found. Please install Git Bash or WSL."
    exit 1
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force

Write-Success "Installation complete!"
```

#### 2.3 macOS/Linux One-Liner Enhancement

Enhance the existing curl installer with interactive mode:

```bash
# Current (non-interactive)
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

# New (interactive wizard)
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash

# New (with options)
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash -s -- --mode sample --dir ~/my-site
```

---

### Phase 3: Sample Site Mode 📚

**Goal**: Create a new "sample" installation mode that generates an educational base template explaining configuration, styles, and features.

#### 3.1 New Template Files to Create

**`templates/pages/sample-site-home.md.template`**
```markdown
---
layout: home
title: Welcome to Your Zer0-Mistakes Site
permalink: /
---

# 🎉 Welcome to Your New Jekyll Site!

Congratulations! You've successfully installed the **{{THEME_DISPLAY_NAME}}**.

This sample site is designed to help you understand how to configure and customize your Jekyll site. Each page demonstrates different features and provides configuration examples.

## 🗺️ Site Navigation

<div class="row g-4 mt-3">
<div class="col-md-6 col-lg-4">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title">
<i class="bi bi-gear-fill text-primary"></i> Configuration Guide
</h5>
<p class="card-text">
Learn how to customize your <code>_config.yml</code> file to personalize your site settings, URLs, and metadata.
</p>
<a href="/config-guide/" class="btn btn-primary btn-sm">
Learn Configuration →
</a>
</div>
</div>
</div>

<div class="col-md-6 col-lg-4">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title">
<i class="bi bi-palette-fill text-success"></i> Style Customization
</h5>
<p class="card-text">
Discover how to customize colors, fonts, and layout using CSS variables and Sass customization.
</p>
<a href="/style-guide/" class="btn btn-success btn-sm">
Customize Styles →
</a>
</div>
</div>
</div>

<div class="col-md-6 col-lg-4">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title">
<i class="bi bi-file-earmark-text-fill text-info"></i> Content Creation
</h5>
<p class="card-text">
Learn how to write blog posts, create documentation pages, and organize your content effectively.
</p>
<a href="/content-guide/" class="btn btn-info btn-sm">
Create Content →
</a>
</div>
</div>
</div>

<div class="col-md-6 col-lg-4">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title">
<i class="bi bi-layout-text-window-reverse text-warning"></i> Layout System
</h5>
<p class="card-text">
Understand Jekyll layouts, includes, and how to create custom page templates for your site.
</p>
<a href="/layout-guide/" class="btn btn-warning btn-sm">
Explore Layouts →
</a>
</div>
</div>
</div>

<div class="col-md-6 col-lg-4">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title">
<i class="bi bi-plugin text-danger"></i> Features & Plugins
</h5>
<p class="card-text">
Explore theme features like dark mode, search, analytics, and Jekyll plugins available to enhance your site.
</p>
<a href="/features-guide/" class="btn btn-danger btn-sm">
View Features →
</a>
</div>
</div>
</div>

<div class="col-md-6 col-lg-4">
<div class="card h-100">
<div class="card-body">
<h5 class="card-title">
<i class="bi bi-rocket-takeoff-fill text-secondary"></i> Deployment
</h5>
<p class="card-text">
Learn how to deploy your site to GitHub Pages, Netlify, Vercel, or other hosting platforms.
</p>
<a href="/deployment-guide/" class="btn btn-secondary btn-sm">
Deploy Site →
</a>
</div>
</div>
</div>
</div>

## 🚀 Quick Start Steps

1. **Explore This Site** - Click through the guides above to learn about each aspect
2. **Edit Configuration** - Modify `_config.yml` with your site details
3. **Customize Styles** - Update `_sass/custom.scss` with your brand colors
4. **Create Content** - Add posts to `pages/_posts/` and docs to `pages/_docs/`
5. **Test Locally** - Run `docker-compose up` to preview your changes
6. **Deploy** - Push to GitHub for automatic GitHub Pages deployment

## 📖 Learn More

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Zer0-Mistakes GitHub Repository]({{GITHUB_URL}})

---

<div class="alert alert-info" role="alert">
<i class="bi bi-info-circle-fill"></i> <strong>Tip:</strong> This sample site is fully functional. You can keep these guides for reference or delete them when you're ready to build your own content!
</div>
```

**`templates/pages/config-guide.md.template`**
```markdown
---
layout: default
title: Configuration Guide
permalink: /config-guide/
---

# ⚙️ Configuration Guide

Learn how to configure your Jekyll site using the `_config.yml` file.

## Essential Settings

Your `_config.yml` file is located in the root of your site. Here are the key settings you should customize:

### Site Identity

```yaml
title: "{{SITE_TITLE}}"
description: "A brief description of your site"
author: "{{SITE_AUTHOR}}"
email: "{{SITE_EMAIL}}"
```

**What these do:**
- `title`: Appears in browser tabs, RSS feeds, and meta tags
- `description`: Used for SEO and social media previews
- `author`: Your name or organization
- `email`: Contact email (used in feeds and some plugins)

### URLs and Hosting

```yaml
# For GitHub Pages
url: "https://{{GITHUB_USER}}.github.io"
baseurl: "/{{THEME_NAME}}"

# For custom domain
url: "https://yourdomain.com"
baseurl: ""
```

**Important:**
- `url`: Your site's full URL (without trailing slash)
- `baseurl`: Subpath if hosted in a subdirectory (e.g., `/blog`)
- Leave `baseurl` empty (`""`) for root domain hosting

### Theme Configuration

```yaml
# Remote theme (hosted on GitHub)
remote_theme: "{{GITHUB_REPO}}"

# Or local theme (for development)
theme: "{{THEME_GEM_NAME}}"
```

**Choose one:**
- Use `remote_theme` for GitHub Pages with no local files
- Use `theme` for local development or gem-based deployment
- Never set both at the same time!

### Social Media

```yaml
social:
  twitter: your_username
  github: {{GITHUB_USER}}
  linkedin: your-profile
```

### Analytics (Optional)

```yaml
google_analytics: UA-XXXXXXXXX-X
posthog:
  enabled: false
  api_key: ""
```

### Navigation

Edit `_data/navigation.yml` to customize your site menu:

```yaml
main:
  - title: "Home"
    url: /
  - title: "Blog"
    url: /blog/
  - title: "About"
    url: /about/
```

## Advanced Settings

### Build Settings

```yaml
markdown: kramdown
highlighter: rouge
permalink: /:categories/:title/
paginate: 10
```

### Plugins

```yaml
plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-remote-theme
```

### Exclusions

```yaml
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor
  - .bundle
  - .git
```

## Testing Your Configuration

After making changes:

```bash
# Validate your config
docker-compose exec jekyll bundle exec jekyll doctor

# Restart Jekyll to apply changes
docker-compose restart
```

## Common Issues

### Issue: Site not loading styles

**Solution:** Check your `url` and `baseurl` settings. For local development with Docker, these should be empty:

```yaml
url: ""
baseurl: ""
```

### Issue: Remote theme not loading

**Solution:** Ensure you have `jekyll-remote-theme` in your `Gemfile` and `_config.yml`:

```yaml
plugins:
  - jekyll-remote-theme
```

## Next Steps

- [Style Customization →](/style-guide/)
- [Content Creation →](/content-guide/)
- [Full Jekyll Config Reference](https://jekyllrb.com/docs/configuration/)
```

**`templates/pages/style-guide.md.template`**
```markdown
---
layout: default
title: Style Customization Guide
permalink: /style-guide/
---

# 🎨 Style Customization Guide

Learn how to customize the look and feel of your Jekyll site.

## Overview

The Zer0-Mistakes theme is built on **Bootstrap 5.3** and uses **Sass** for styling. You have multiple ways to customize the appearance:

1. **CSS Variables** (easiest)
2. **Custom Sass** (more control)
3. **Override Layouts** (advanced)

## Method 1: CSS Variables (Quick & Easy)

Create `assets/css/custom.css` and override CSS variables:

```css
/* assets/css/custom.css */

:root {
  /* Brand colors */
  --bs-primary: #3498db;
  --bs-secondary: #2ecc71;
  --bs-success: #27ae60;
  --bs-danger: #e74c3c;
  --bs-warning: #f39c12;
  --bs-info: #16a085;

  /* Typography */
  --bs-font-sans-serif: 'Helvetica Neue', Arial, sans-serif;
  --bs-body-font-size: 1rem;
  --bs-body-line-height: 1.6;

  /* Spacing */
  --bs-gutter-x: 1.5rem;

  /* Links */
  --bs-link-color: #3498db;
  --bs-link-hover-color: #2980b9;
}

/* Dark mode overrides */
[data-bs-theme="dark"] {
  --bs-primary: #5dade2;
  --bs-secondary: #58d68d;
}
```

Then reference it in `_config.yml`:

```yaml
# Add to _config.yml
custom_css:
  - /assets/css/custom.css
```

## Method 2: Custom Sass (More Control)

Create `_sass/custom.scss` to override Sass variables:

```scss
// _sass/custom.scss

// Override Bootstrap variables BEFORE import
$primary: #3498db;
$secondary: #2ecc71;
$font-family-base: 'Helvetica Neue', Arial, sans-serif;
$body-bg: #f8f9fa;
$border-radius: 0.5rem;

// Import theme styles
@import "main";

// Your custom styles AFTER import
.site-header {
  background: linear-gradient(135deg, $primary, $secondary);
  padding: 2rem 0;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }
}
```

## Method 3: Custom Typography

Override font settings:

```scss
// _sass/custom.scss

// Google Fonts (add to _includes/core/head.html)
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

$font-family-base: 'Inter', system-ui, sans-serif;
$headings-font-family: 'Inter', system-ui, sans-serif;
$headings-font-weight: 700;

@import "main";
```

## Dark Mode Customization

The theme supports automatic dark mode. Customize dark mode colors:

```css
/* Light mode (default) */
:root {
  --body-bg: #ffffff;
  --body-color: #212529;
  --card-bg: #ffffff;
}

/* Dark mode */
[data-bs-theme="dark"] {
  --body-bg: #1a1a1a;
  --body-color: #e0e0e0;
  --card-bg: #2d2d2d;
}
```

## Component Examples

### Custom Navigation Bar

```scss
// _sass/custom.scss

.navbar {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .navbar-brand {
    font-weight: 700;
    font-size: 1.5rem;
    color: $primary;
  }

  .nav-link {
    font-weight: 500;

    &:hover {
      color: $primary;
    }
  }
}
```

### Custom Footer

```scss
// _sass/custom.scss

.site-footer {
  background: linear-gradient(180deg, transparent, rgba($primary, 0.05));
  border-top: 1px solid rgba($primary, 0.1);
  padding: 3rem 0 2rem;
  margin-top: 4rem;
}
```

### Custom Cards

```scss
// _sass/custom.scss

.card {
  border: none;
  border-radius: 1rem;
  overflow: hidden;

  .card-header {
    background: linear-gradient(135deg, $primary, $secondary);
    color: white;
    font-weight: 600;
  }

  .card-body {
    padding: 2rem;
  }
}
```

## Bootstrap Utility Classes

Use Bootstrap's built-in utility classes in your content:

```html
<!-- Spacing -->
<div class="mt-5 mb-3 px-4">Content</div>

<!-- Colors -->
<p class="text-primary">Primary text</p>
<div class="bg-light">Light background</div>

<!-- Typography -->
<h1 class="display-4 fw-bold">Large heading</h1>
<p class="lead">Lead paragraph</p>

<!-- Flexbox -->
<div class="d-flex justify-content-between align-items-center">
  <span>Left</span>
  <span>Right</span>
</div>
```

## Testing Your Changes

After making style changes:

```bash
# Rebuild assets
docker-compose restart

# Clear browser cache
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
```

## Example: Complete Brand Override

Here's a complete example for a custom brand:

```scss
// _sass/custom.scss

// Brand colors
$primary: #6366f1;    // Indigo
$secondary: #ec4899;  // Pink
$success: #10b981;    // Green
$warning: #f59e0b;    // Amber
$danger: #ef4444;     // Red

// Typography
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
$font-family-base: 'Poppins', sans-serif;

// Spacing & Layout
$border-radius: 0.75rem;
$box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

@import "main";

// Custom components
.site-header {
  background: linear-gradient(135deg, $primary, $secondary);
  color: white;
  padding: 2rem 0;
}

.btn-primary {
  background: linear-gradient(135deg, $primary, lighten($primary, 10%));
  border: none;
  font-weight: 600;
  padding: 0.75rem 2rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba($primary, 0.3);
  }
}
```

## Resources

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Sass Documentation](https://sass-lang.com/documentation/)
- [Bootstrap Color Utilities](https://getbootstrap.com/docs/5.3/utilities/colors/)
- [Google Fonts](https://fonts.google.com/)

## Next Steps

- [Layout Customization →](/layout-guide/)
- [Content Creation →](/content-guide/)
```

#### 3.2 Sample Site Installation Logic

Add to `install.sh`:

```bash
install_sample_site() {
    log_info "Installing sample site mode..."

    # Install full theme first
    install_full_theme

    # Override with sample site pages
    create_from_template "pages/sample-site-home.md.template" "$TARGET_DIR/index.md"
    create_from_template "pages/config-guide.md.template" "$TARGET_DIR/pages/config-guide.md"
    create_from_template "pages/style-guide.md.template" "$TARGET_DIR/pages/style-guide.md"
    create_from_template "pages/content-guide.md.template" "$TARGET_DIR/pages/content-guide.md"
    create_from_template "pages/layout-guide.md.template" "$TARGET_DIR/pages/layout-guide.md"
    create_from_template "pages/features-guide.md.template" "$TARGET_DIR/pages/features-guide.md"
    create_from_template "pages/deployment-guide.md.template" "$TARGET_DIR/pages/deployment-guide.md"

    # Create sample posts demonstrating features
    create_sample_posts

    # Create custom navigation for sample site
    create_sample_navigation

    log_success "Sample site installed successfully"
}
```

---

### Phase 4: GitHub Integration 🐙

**Goal**: Seamlessly integrate with GitHub workflows for forking, cloning, and deploying.

#### 4.1 GitHub CLI Integration

Add to `install-wizard.sh`:

```bash
github_integration() {
    if ! command -v gh &>/dev/null; then
        log_warning "GitHub CLI (gh) not found. Skipping GitHub integration."
        log_info "Install from: https://cli.github.com"
        return 0
    fi

    # Check if authenticated
    if ! gh auth status &>/dev/null; then
        echo ""
        echo "🔐 GitHub Authentication Required"
        read -p "Authenticate with GitHub? [y/N]: " auth_choice
        if [[ "$auth_choice" =~ ^[Yy]$ ]]; then
            gh auth login
        else
            return 0
        fi
    fi

    echo ""
    echo "🐙 GitHub Integration Options:"
    echo "1) Fork zer0-mistakes to your account"
    echo "2) Create new repository from template"
    echo "3) Clone existing repository"
    echo "4) Skip GitHub integration"
    echo ""
    read -p "Choose option [1-4]: " gh_choice

    case "$gh_choice" in
        1)
            gh_fork_repository
            ;;
        2)
            gh_create_from_template
            ;;
        3)
            gh_clone_repository
            ;;
        *)
            log_info "Skipping GitHub integration"
            ;;
    esac
}

gh_fork_repository() {
    log_info "Forking bamr87/zer0-mistakes..."

    # Fork the repository
    gh repo fork bamr87/zer0-mistakes --clone=false

    # Get fork URL
    FORK_URL=$(gh api user -q '.login' | xargs -I {} echo "https://github.com/{}/zer0-mistakes")

    log_success "Repository forked to: $FORK_URL"

    # Clone the fork
    read -p "Clone your fork now? [Y/n]: " clone_choice
    if [[ ! "$clone_choice" =~ ^[Nn]$ ]]; then
        gh repo clone "${GITHUB_USER_INPUT}/zer0-mistakes" "$TARGET_DIR"
        cd "$TARGET_DIR" || exit 1

        # Run fork cleanup
        ./scripts/fork-cleanup.sh --interactive
    fi
}

gh_create_from_template() {
    read -p "Repository name: " repo_name
    read -p "Repository description: " repo_desc
    read -p "Make repository private? [y/N]: " private_choice

    local visibility="public"
    [[ "$private_choice" =~ ^[Yy]$ ]] && visibility="private"

    log_info "Creating repository from template..."

    gh repo create "$repo_name" \
        --template bamr87/zer0-mistakes \
        --"$visibility" \
        --description "$repo_desc" \
        --clone

    log_success "Repository created and cloned to: ./$repo_name"
}
```

#### 4.2 GitHub Pages Auto-Configuration

```bash
configure_github_pages() {
    if [[ -d .git ]] && command -v gh &>/dev/null; then
        echo ""
        echo "📄 GitHub Pages Configuration"
        read -p "Enable GitHub Pages for this repository? [y/N]: " enable_pages

        if [[ "$enable_pages" =~ ^[Yy]$ ]]; then
            log_info "Configuring GitHub Pages..."

            # Get repository info
            local repo_full=$(gh repo view --json nameWithOwner -q .nameWithOwner)

            # Enable Pages (requires gh >=2.30)
            gh api repos/"$repo_full"/pages \
                -X POST \
                -f source[branch]=main \
                -f source[path]=/

            # Get Pages URL
            local pages_url=$(gh api repos/"$repo_full"/pages -q .html_url)

            log_success "GitHub Pages enabled at: $pages_url"

            # Update _config.yml with URL
            if [[ -f _config.yml ]]; then
                sed -i.bak "s|url:.*|url: \"$pages_url\"|" _config.yml
                sed -i.bak "s|baseurl:.*|baseurl: \"\"|" _config.yml
                rm -f _config.yml.bak

                log_success "Updated _config.yml with Pages URL"
            fi
        fi
    fi
}
```

---

### Phase 5: Enhanced Documentation 📖

**Goal**: Comprehensive platform-specific documentation and guides.

#### 5.1 Update `pages/_docs/installation.md`

Add sections for each installation method:

```markdown
# Installation

Multiple installation methods for every platform and workflow.

## Installation Methods

### 🚀 Quick Install (Recommended)

**Interactive Installer (All Platforms):**
```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash
```

This launches an interactive wizard that detects your platform and guides you through the installation.

### 🪟 Windows Installation

**Option 1: One-Click Installer (Recommended)**
1. Download [install.bat](https://github.com/bamr87/zer0-mistakes/raw/main/install.bat)
2. Double-click to run
3. Follow the wizard prompts

**Option 2: PowerShell**
```powershell
irm https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.ps1 | iex
```

**Option 3: Git Bash**
```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash
```

**Option 4: WSL2 (Windows Subsystem for Linux)**
```bash
# In WSL terminal
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash
```

### 🍎 macOS Installation

**Option 1: Interactive Installer (Recommended)**
```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash
```

**Option 2: Clone and Install**
```bash
git clone https://github.com/bamr87/zer0-mistakes.git my-site
cd my-site
./install.sh --mode sample
```

**Option 3: Homebrew (Coming Soon)**
```bash
brew install zer0-mistakes
zer0-mistakes init my-site
```

### 🐧 Linux Installation

**Option 1: Interactive Installer**
```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install-wizard.sh | bash
```

**Option 2: Distribution Packages**

*Ubuntu/Debian:*
```bash
# Coming soon
sudo apt install zer0-mistakes
```

*Arch:*
```bash
# Coming soon
yay -S zer0-mistakes
```

### 🐙 GitHub Fork/Clone

**Option 1: Fork on GitHub**
1. Go to [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Click "Fork" button
3. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/zer0-mistakes.git
cd zer0-mistakes
./scripts/fork-cleanup.sh --interactive
```

**Option 2: Use as Template**
1. Go to [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Click "Use this template" → "Create a new repository"
3. Clone your new repository
4. Run: `./scripts/fork-cleanup.sh`

**Option 3: GitHub CLI**
```bash
# Fork
gh repo fork bamr87/zer0-mistakes --clone

# Or create from template
gh repo create my-site --template bamr87/zer0-mistakes --clone
```

## Installation Modes

### Full Mode (Default)
Complete theme with all features:
- All layouts, includes, and assets
- Docker configuration
- GitHub Actions workflows
- Example content

```bash
./install.sh --mode full
```

### Sample Site Mode (Recommended for Learning)
Educational base template with guides:
- Configuration guide
- Style customization guide
- Content creation guide
- Layout customization guide
- Feature demonstrations

```bash
./install.sh --mode sample
```

### Minimal Mode
Lightweight setup for remote theme:
- `_config.yml` and `Gemfile` only
- Uses hosted theme (no local files)
- Perfect for simple blogs

```bash
./install.sh --mode minimal
```

### Fork Mode
Clean starting template:
- Removes all example content
- Resets configuration to defaults
- Keeps essential structure
- Perfect for starting fresh

```bash
./install.sh --mode fork
```

## Platform-Specific Guides

### macOS Setup

**Prerequisites:**
1. Install Docker Desktop:
   ```bash
   brew install --cask docker
   ```

2. Or install Ruby (native development):
   ```bash
   brew install ruby
   gem install bundler jekyll
   ```

**Apple Silicon Users:**
- Docker automatically configured for M1/M2/M3
- Native Ruby works great (no Rosetta needed)

### Windows Setup

**Prerequisites:**
1. **Docker Desktop** (Recommended): [Download](https://docker.com)
   - Enable WSL 2 backend for best performance

2. **Or WSL2** (for native Ruby):
   ```powershell
   wsl --install Ubuntu
   ```

3. **Or Git Bash**: [Download](https://git-scm.com)

**Recommended Path:** Use Docker with WSL 2 backend for best experience.

### Linux Setup

**Ubuntu/Debian:**
```bash
# Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Or native Ruby
sudo apt-get install ruby-full build-essential
gem install bundler jekyll
```

**Arch:**
```bash
# Docker
sudo pacman -S docker docker-compose

# Or native Ruby
sudo pacman -S ruby base-devel
gem install bundler jekyll
```

## Post-Installation

After installation completes:

1. **Start Development Server:**
   ```bash
   docker-compose up
   ```

2. **Open in Browser:**
   ```
   http://localhost:4000
   ```

3. **Explore Sample Site:**
   - Configuration Guide: `/config-guide/`
   - Style Customization: `/style-guide/`
   - Content Creation: `/content-guide/`

4. **Customize Your Site:**
   - Edit `_config.yml`
   - Modify `_sass/custom.scss`
   - Add content to `pages/_posts/`

## Troubleshooting

### Docker Issues

**Docker not starting:**
```bash
# Check status
docker --version
docker info

# Start Docker Desktop (macOS/Windows)
# Or start daemon (Linux)
sudo systemctl start docker
```

**Port 4000 already in use:**
```bash
# Find process using port
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Or change port in docker-compose.yml
ports:
  - "4001:4000"
```

### Ruby Issues

**Bundle install fails:**
```bash
# Update bundler
gem update bundler

# Clear cache
bundle clean --force
rm -rf .bundle vendor
bundle install
```

### Platform-Specific Issues

See [Troubleshooting Guide](/docs/troubleshooting/) for detailed platform-specific solutions.

## Next Steps

- [Configuration Guide](/docs/jekyll/jekyll-config/)
- [Content Creation](/docs/content-creation/)
- [Deployment](/docs/deployment/)
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Create `install-wizard.sh` with interactive prompts
- [ ] Implement platform detection enhancement
- [ ] Add installation method selection
- [ ] Create installation summary and confirmation

### Week 2: Platform Installers
- [ ] Create `install.bat` for Windows
- [ ] Create `install.ps1` PowerShell script
- [ ] Test on Windows (Git Bash, WSL, PowerShell)
- [ ] Test on macOS (Intel + Apple Silicon)
- [ ] Test on Linux (Ubuntu, Debian, Arch)

### Week 3: Sample Site Mode
- [ ] Create sample site template files
- [ ] Build configuration guide page
- [ ] Build style customization guide
- [ ] Build content creation guide
- [ ] Build layout guide
- [ ] Build features guide
- [ ] Build deployment guide

### Week 4: GitHub Integration
- [ ] Implement GitHub CLI detection
- [ ] Add fork workflow
- [ ] Add template repository workflow
- [ ] Add GitHub Pages auto-configuration
- [ ] Test end-to-end GitHub workflows

### Week 5: Documentation & Testing
- [ ] Update Installation.md with all methods
- [ ] Create platform-specific guides
- [ ] Create video/GIF walkthroughs
- [ ] Comprehensive cross-platform testing
- [ ] User acceptance testing

---

## Success Criteria

### Functional Requirements
✅ Users can install on macOS, Linux, Windows with one command
✅ Interactive wizard guides users through installation
✅ Platform-specific installers work natively (.bat, .ps1, .sh)
✅ Sample site mode educates users on configuration
✅ GitHub fork/clone workflows are seamless
✅ All installation modes work correctly (full, sample, minimal, fork)

### User Experience Requirements
✅ Installation takes < 5 minutes
✅ Error messages are clear and actionable
✅ Post-install success message shows next steps
✅ Sample site demonstrates all key features
✅ Configuration guides are easy to follow

### Technical Requirements
✅ Zero-config Docker installation works
✅ Native Ruby installation works
✅ Cross-platform scripts use portable commands
✅ Template rendering works in all modes
✅ GitHub integration respects user auth

---

## Testing Plan

### Unit Tests
- Template rendering with all variables
- Platform detection on all OSes
- Installation mode logic
- File backup/restore functionality

### Integration Tests
- Full installation flow on each platform
- Sample site generation completeness
- GitHub CLI integration
- Docker Compose startup

### User Acceptance Tests
- New user installs on fresh machine
- Experienced Jekyll user installs
- Fork/clone workflow from GitHub
- Windows user with no Unix experience

### Platforms to Test
- [ ] macOS 13+ (Intel)
- [ ] macOS 13+ (Apple Silicon)
- [ ] Windows 10/11 (Git Bash)
- [ ] Windows 10/11 (WSL2 Ubuntu)
- [ ] Windows 10/11 (PowerShell)
- [ ] Ubuntu 22.04 LTS
- [ ] Debian 12
- [ ] Arch Linux
- [ ] Fedora 38

---

## Maintenance Plan

### Version Compatibility
- Test with new Jekyll versions
- Test with new Ruby versions
- Test with new Docker versions
- Update templates with new features

### Documentation Updates
- Keep installation docs current
- Update screenshots/GIFs
- Add new troubleshooting tips
- Maintain changelog

### Community Feedback
- Monitor GitHub issues
- Collect user feedback
- Iterate on UX pain points
- Add frequently requested features

---

## Future Enhancements

### Phase 6: Package Managers (Future)
- Homebrew formula for macOS
- APT repository for Debian/Ubuntu
- AUR package for Arch Linux
- Chocolatey package for Windows
- Snap package (universal Linux)

### Phase 7: Web-Based Installer (Future)
- Web UI for configuration
- Download customized install script
- Visual theme preview
- Online documentation

### Phase 8: IDE Integration (Future)
- VS Code extension
- RubyMine plugin
- Vim plugin
- Emacs package

---

## Appendix

### Files to Create
1. `install-wizard.sh` - Interactive installer (new)
2. `install.bat` - Windows batch wrapper (new)
3. `install.ps1` - PowerShell installer (new)
4. `templates/pages/sample-site-home.md.template` (new)
5. `templates/pages/config-guide.md.template` (new)
6. `templates/pages/style-guide.md.template` (new)
7. `templates/pages/content-guide.md.template` (new)
8. `templates/pages/layout-guide.md.template` (new)
9. `templates/pages/features-guide.md.template` (new)
10. `templates/pages/deployment-guide.md.template` (new)

### Files to Modify
1. `install.sh` - Add `--interactive` flag, sample mode
2. `templates/config/install.conf` - Add sample mode config
3. `pages/_docs/installation.md` - Comprehensive rewrite
4. `README.md` - Update installation section

### Testing Files to Create
1. `test/test_install_wizard.sh`
2. `test/test_platform_detection.sh`
3. `test/test_sample_site.sh`
4. `test/test_github_integration.sh`

---

**End of Universal Installer Plan**

This document will be updated as implementation progresses.
