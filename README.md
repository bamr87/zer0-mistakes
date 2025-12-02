---
title: zer0-mistakes
sub-title: Jekyll Theme
description: Docker-optimized Jekyll theme with AI-powered installation automation and comprehensive error handling.
version: 0.11.0
layout: landing
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
lastmod: 2025-11-29T00:00:00.000Z
draft: false
permalink: /
slug: zer0
keywords:
  - jekyll
  - docker
  - remote-theme
  - github-pages
date: 2025-11-29T12:00:00.000Z
snippet: Docker-first Jekyll theme with remote theme support
comments: true
mermaid: true
preview: /assets/images/wizard-on-journey.png
hero_image: /assets/images/wizard-on-journey.png
excerpt: "Professional Jekyll theme with automated installation, comprehensive error handling, and zero-configuration Docker development"
---

[![pages-build-deployment](https://github.com/bamr87/zer0-mistakes/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/bamr87/zer0-mistakes/actions/workflows/pages/pages-build-deployment)
[![Gem Version](https://badge.fury.io/rb/jekyll-theme-zer0.svg)](https://badge.fury.io/rb/jekyll-theme-zer0)
[![CI](https://github.com/bamr87/zer0-mistakes/actions/workflows/ci.yml/badge.svg)](https://github.com/bamr87/zer0-mistakes/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://github.com/bamr87/zer0-mistakes/blob/main/docker-compose.yml)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-purple.svg)](https://getbootstrap.com/)

# 🚀 zer0-mistakes

### The Self-Healing Jekyll Theme

**Docker-first • AI-powered • Privacy-compliant • Zero-configuration**

[Quick Start](#-quick-start) • [Features](#-key-features) • [Documentation](#-documentation) • [Contributing](CONTRIBUTING.md)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Installation Methods](#-installation-methods)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Release System](#-release-system)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Support](#-support)

---

## Overview

**zer0-mistakes** is a professional Jekyll theme engineered to eliminate setup friction and provide a seamless development experience. With AI-powered error recovery, Docker containerization, and comprehensive automation, you can go from zero to deployed in under 5 minutes.

```mermaid
graph LR
    subgraph "🎯 Your Goal"
        A[Beautiful Website]
    end
    
    subgraph "⚡ zer0-mistakes"
        B[One Command] --> C[Auto-Configure]
        C --> D[Docker Ready]
        D --> E[Live Preview]
    end
    
    subgraph "🚀 Result"
        F[Production Site]
    end
    
    A --> B
    E --> F
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
```

### Why zer0-mistakes?

| Challenge | Traditional Jekyll | zer0-mistakes |
|-----------|-------------------|---------------|
| **Setup Time** | 15-30 minutes | **2-5 minutes** |
| **Success Rate** | ~60% | **~95%** |
| **Platform Support** | Limited | **Universal** |
| **Error Handling** | Manual debugging | **Self-healing** |
| **Dependencies** | Ruby + Bundler + Jekyll | **Docker only** |

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop))
- **Git** ([download](https://git-scm.com/))

### One-Line Installation

```bash
mkdir my-site && cd my-site && curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

### Start Development

```bash
docker-compose up
# 🌐 Open http://localhost:4000
```

```mermaid
sequenceDiagram
    participant You
    participant Install Script
    participant Docker
    participant Browser
    
    You->>Install Script: curl ... | bash
    Install Script->>Install Script: Detect platform
    Install Script->>Install Script: Download theme files
    Install Script->>Install Script: Configure Docker
    Install Script-->>You: ✅ Ready!
    
    You->>Docker: docker-compose up
    Docker->>Docker: Build Jekyll container
    Docker->>Docker: Install dependencies
    Docker-->>Browser: Serve on :4000
    
    Browser-->>You: 🎉 Live site!
```

---

## 🏗 Architecture

### System Overview

```mermaid
flowchart TB
    subgraph Input["📝 Content Layer"]
        MD[Markdown Files]
        DATA[YAML Data]
        ASSETS[Static Assets]
    end
    
    subgraph Theme["🎨 Theme Layer"]
        LAYOUTS[_layouts/]
        INCLUDES[_includes/]
        SASS[_sass/]
    end
    
    subgraph Build["⚙️ Build Layer"]
        JEKYLL[Jekyll Engine]
        PLUGINS[Plugins]
        LIQUID[Liquid Templates]
    end
    
    subgraph Output["🌐 Output Layer"]
        HTML[Static HTML]
        CSS[Compiled CSS]
        JS[JavaScript]
    end
    
    subgraph Deploy["🚀 Deploy Layer"]
        GHPAGES[GitHub Pages]
        DOCKER[Docker Container]
        CDN[CDN/Custom Host]
    end
    
    MD --> JEKYLL
    DATA --> JEKYLL
    ASSETS --> JEKYLL
    
    LAYOUTS --> JEKYLL
    INCLUDES --> JEKYLL
    SASS --> JEKYLL
    
    JEKYLL --> HTML
    JEKYLL --> CSS
    JEKYLL --> JS
    
    HTML --> GHPAGES
    HTML --> DOCKER
    HTML --> CDN
```

### Technology Stack

```mermaid
pie title Technology Distribution
    "Jekyll (Static Gen)" : 30
    "Bootstrap 5.3 (UI)" : 25
    "Docker (Dev Env)" : 20
    "Liquid (Templates)" : 15
    "PostHog (Analytics)" : 10
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Jekyll 3.9.5 | Static site generation |
| **Styling** | Bootstrap 5.3.3 | Responsive UI components |
| **Development** | Docker | Cross-platform consistency |
| **Templates** | Liquid | Dynamic content rendering |
| **Analytics** | PostHog | Privacy-first tracking |
| **Diagrams** | Mermaid 10+ | Documentation visuals |

---

## ✨ Key Features

### 🤖 AI-Powered Installation

The 1,090-line `install.sh` script provides intelligent error recovery with 27+ automated fix scenarios:

```mermaid
flowchart TD
    START([Start Installation]) --> DETECT[Detect Platform]
    DETECT --> CHECK{Prerequisites OK?}
    
    CHECK -->|Yes| DOWNLOAD[Download Theme]
    CHECK -->|No| FIX[Auto-Fix Issues]
    FIX --> CHECK
    
    DOWNLOAD --> CONFIG[Configure Docker]
    CONFIG --> VALIDATE{Build Success?}
    
    VALIDATE -->|Yes| DONE([✅ Ready!])
    VALIDATE -->|No| DIAGNOSE[Diagnose Error]
    DIAGNOSE --> RECOVER[Apply Fix]
    RECOVER --> VALIDATE
    
    style START fill:#e3f2fd
    style DONE fill:#c8e6c9
    style FIX fill:#fff3e0
    style RECOVER fill:#fff3e0
```

### 🐳 Docker-First Development

Zero local dependencies required. Works identically across all platforms:

```yaml
# docker-compose.yml - That's all you need!
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64
    command: jekyll serve --config "_config.yml,_config_dev.yml"
    ports: ["4000:4000"]
    volumes: ["./:/app"]
```

### 🔒 Privacy-First Analytics

GDPR/CCPA compliant PostHog integration with granular consent:

```mermaid
stateDiagram-v2
    [*] --> PageLoad
    PageLoad --> ConsentCheck
    
    ConsentCheck --> Disabled: DNT Enabled
    ConsentCheck --> ShowBanner: No Consent
    ConsentCheck --> Tracking: Has Consent
    
    ShowBanner --> Tracking: Accept
    ShowBanner --> Disabled: Decline
    
    Tracking --> DataCollection
    DataCollection --> Anonymize
    Anonymize --> PostHog
    
    Disabled --> [*]
    PostHog --> [*]
```

### 📊 Mermaid Diagram Support

10+ diagram types with GitHub Pages compatibility:

| Type | Syntax | Use Case |
|------|--------|----------|
| Flowchart | `graph TD` | Process flows |
| Sequence | `sequenceDiagram` | Interactions |
| Class | `classDiagram` | OOP structures |
| State | `stateDiagram-v2` | State machines |
| ER | `erDiagram` | Database schemas |
| Gantt | `gantt` | Timelines |
| Pie | `pie` | Distributions |
| Git | `gitGraph` | Branch history |

### 📓 Jupyter Notebook Support

Seamless integration for data science and computational content:

- **Automatic Conversion**: `.ipynb` → Markdown with front matter
- **Output Rendering**: Code execution results, plots, tables preserved
- **Image Extraction**: Matplotlib/PNG outputs → `/assets/images/notebooks/`
- **GitHub Actions**: Automated conversion on push to `pages/_notebooks/`
- **MathJax Support**: LaTeX equations rendered with `$$` syntax
- **Syntax Highlighting**: Code cells with Rouge highlighting
- **Responsive Layout**: Mobile-friendly notebook viewer

```bash
# Convert notebooks
./scripts/convert-notebooks.sh

# Add to _config.yml
collections:
  notebooks:
    output: true
    permalink: /notebooks/:name/
```

---

## 📦 Installation Methods

### Method 1: AI-Powered Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

### Method 2: Remote Theme (GitHub Pages)

```yaml
# _config.yml
remote_theme: "bamr87/zer0-mistakes"
plugins:
  - jekyll-remote-theme
```

### Method 3: Fork & Customize

```bash
gh repo fork bamr87/zer0-mistakes --clone
cd zer0-mistakes
docker-compose up
```

### Method 4: Ruby Gem

```ruby
# Gemfile
gem "jekyll-theme-zer0", "~> 0.10"
```

---

## 📁 Project Structure

```mermaid
graph TD
    ROOT[zer0-mistakes/] --> CONFIG[Configuration]
    ROOT --> THEME[Theme Components]
    ROOT --> CONTENT[Content]
    ROOT --> AUTOMATION[Automation]
    
    CONFIG --> CFG1[_config.yml]
    CONFIG --> CFG2[_config_dev.yml]
    CONFIG --> CFG3[docker-compose.yml]
    
    THEME --> LAYOUTS[_layouts/]
    THEME --> INCLUDES[_includes/]
    THEME --> SASS[_sass/]
    THEME --> ASSETS[assets/]
    
    CONTENT --> PAGES[pages/]
    CONTENT --> DATA[_data/]
    CONTENT --> DOCS[docs/]
    
    AUTOMATION --> SCRIPTS[scripts/]
    AUTOMATION --> TESTS[test/]
    AUTOMATION --> WORKFLOWS[.github/workflows/]
    
    style ROOT fill:#e8f5e9
    style CONFIG fill:#e3f2fd
    style THEME fill:#fff3e0
    style CONTENT fill:#fce4ec
    style AUTOMATION fill:#f3e5f5
```

### Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `_layouts/` | Page templates | `default.html`, `journals.html`, `landing.html` |
| `_includes/` | Reusable components | `core/`, `components/`, `analytics/` |
| `_sass/` | Stylesheets | `custom.scss`, `core/` |
| `assets/` | Static files | `css/`, `js/`, `images/` |
| `scripts/` | Automation | `release`, `build`, `version.sh` |
| `docs/` | Technical docs | `features/`, `systems/`, `releases/` |

---

## 🔄 Development Workflow

```mermaid
gitGraph
    commit id: "Clone/Install"
    branch feature
    checkout feature
    commit id: "Make Changes"
    commit id: "Test Locally"
    checkout main
    merge feature id: "PR Merged"
    commit id: "Auto Version" type: HIGHLIGHT
    commit id: "Gem Published"
    commit id: "GitHub Release"
```

### Daily Development

```bash
# Start development server
docker-compose up

# Make changes (auto-reload enabled)
# Edit files in _layouts/, _includes/, pages/

# Run tests
./test/test_runner.sh

# Commit changes
git commit -m "feat: add new component"
```

### Testing Commands

```bash
# Quick validation
./test/validate_installation.sh

# Full test suite
./test/test_runner.sh --verbose

# Docker-specific tests
./test/test_docker_deployment.sh
```

---

## 🚀 Deployment

### GitHub Pages (Automatic)

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Actions as GitHub Actions
    participant Pages as GitHub Pages
    
    Dev->>GH: git push main
    GH->>Actions: Trigger workflow
    Actions->>Actions: jekyll build
    Actions->>Pages: Deploy _site/
    Pages-->>Dev: 🌐 Site live!
```

1. Push to `main` branch
2. GitHub Actions builds automatically
3. Site deploys to GitHub Pages

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Custom Hosting

```bash
# Build static site
docker-compose run --rm jekyll jekyll build

# Deploy _site/ to any static host
```

---

## 📚 Documentation

### Documentation Architecture

```mermaid
graph LR
    subgraph Technical["📋 /docs/"]
        SYS[systems/]
        FEAT[features/]
        REL[releases/]
    end
    
    subgraph Public["📖 /pages/_docs/"]
        GUIDES[User Guides]
        TUTORIALS[Tutorials]
        REF[Reference]
    end
    
    subgraph AI["🤖 .github/"]
        COPILOT[copilot-instructions.md]
        SEED[seed/]
        INSTR[instructions/]
    end
    
    Technical -->|Process| Public
    AI -->|Guides| Technical
    
    style Technical fill:#e3f2fd
    style Public fill:#e8f5e9
    style AI fill:#fff3e0
```

### Quick Links

| Resource | Description |
|----------|-------------|
| [📋 Technical Docs](docs/) | Architecture, systems, implementation |
| [📖 User Guides](pages/_docs/) | Published tutorials and references |
| [🤖 Copilot Instructions](.github/copilot-instructions.md) | AI development guidelines |
| [🌱 Seed Documentation](.github/seed/) | Full reconstruction blueprints |
| [📝 PRD](PRD.md) | Product requirements & roadmap |

---

## 🔧 Release System

### Automated Release Pipeline

```mermaid
flowchart LR
    subgraph Trigger["🎯 Trigger"]
        COMMIT[Commit to main]
    end
    
    subgraph Analyze["🔍 Analyze"]
        PARSE[Parse Commits]
        BUMP[Determine Version]
    end
    
    subgraph Build["⚙️ Build"]
        CHANGE[Update CHANGELOG]
        VERSION[Bump Version]
        TEST[Run Tests]
        GEM[Build Gem]
    end
    
    subgraph Publish["🚀 Publish"]
        RUBYGEMS[Push to RubyGems]
        GHREL[GitHub Release]
        TAG[Git Tag]
    end
    
    COMMIT --> PARSE --> BUMP
    BUMP --> CHANGE --> VERSION --> TEST --> GEM
    GEM --> RUBYGEMS --> GHREL --> TAG
```

### Release Commands

```bash
# Preview release
/opt/homebrew/bin/bash scripts/release patch --dry-run

# Full release
/opt/homebrew/bin/bash scripts/release patch  # 0.10.3 → 0.10.4
/opt/homebrew/bin/bash scripts/release minor  # 0.10.3 → 0.11.0
/opt/homebrew/bin/bash scripts/release major  # 0.10.3 → 1.0.0
```

---

## 🗺 Roadmap

```mermaid
gantt
    title zer0-mistakes Roadmap
    dateFormat YYYY-MM
    section Current
    v0.10.x Maintenance       :done, 2025-11, 2025-12
    section Future
    v0.11 - CMS Integration   :2026-01, 2026-03
    v0.12 - Advanced Analytics:2026-04, 2026-06
    v0.13 - i18n Support      :2026-07, 2026-09
    v1.0 - Production Ready   :milestone, 2027-01, 1d
```

| Version | Target | Features |
|---------|--------|----------|
| **v0.11** | Q1 2026 | Headless CMS integration, content API |
| **v0.12** | Q2 2026 | A/B testing, conversion funnels |
| **v0.13** | Q3 2026 | Multi-language support (i18n) |
| **v1.0** | Q1 2027 | Stable API, 90%+ test coverage |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```mermaid
flowchart LR
    FORK[Fork Repo] --> BRANCH[Create Branch]
    BRANCH --> CODE[Make Changes]
    CODE --> TEST[Run Tests]
    TEST --> PR[Open PR]
    PR --> REVIEW[Code Review]
    REVIEW --> MERGE[Merge! 🎉]
    
    style MERGE fill:#c8e6c9
```

### Quick Contribution

```bash
# Fork and clone
gh repo fork bamr87/zer0-mistakes --clone
cd zer0-mistakes

# Create feature branch
git checkout -b feature/awesome-feature

# Make changes and test
docker-compose up
./test/test_runner.sh

# Submit PR
git push origin feature/awesome-feature
```

---

## 📞 Support

| Channel | Link |
|---------|------|
| 📖 Documentation | [zer0-mistakes.org](https://bamr87.github.io/zer0-mistakes/) |
| 🐛 Issues | [GitHub Issues](https://github.com/bamr87/zer0-mistakes/issues) |
| 💬 Discussions | [GitHub Discussions](https://github.com/bamr87/zer0-mistakes/discussions) |
| 📧 Email | [support@zer0-mistakes.com](mailto:support@zer0-mistakes.com) |

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Current Version** | 0.10.3 |
| **Installation Success** | ~95% |
| **Setup Time** | 2-5 minutes |
| **RubyGems Downloads** | 2,500+ |
| **Documentation** | 17,500+ lines |
| **Lighthouse Score** | 95+ |

---

## 🙏 Acknowledgments

Built with these amazing technologies:

- [Jekyll](https://jekyllrb.com/) - Static site generation
- [Bootstrap](https://getbootstrap.com/) - UI framework
- [Docker](https://docker.com/) - Containerization
- [PostHog](https://posthog.com/) - Privacy-first analytics
- [Mermaid](https://mermaid.js.org/) - Diagram rendering
- [GitHub Copilot](https://github.com/features/copilot) - AI assistance

---

**Built with ❤️ for the Jekyll community**

**v0.10.3** • [Changelog](CHANGELOG.md) • [License](LICENSE) • [Contributing](CONTRIBUTING.md)


