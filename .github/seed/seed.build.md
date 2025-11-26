---
title: "Zer0-Mistakes: Complete Build Instructions"
version: "0.6.0"
date: "2025-11-25"
purpose: "Step-by-step instructions to rebuild zer0-mistakes Jekyll theme from scratch"
companion_to: "seed.prompt.md, seed.implementation.md"
---

# 🏗️ Zer0-Mistakes: Complete Build Instructions

> **Purpose**: This file provides complete step-by-step instructions to rebuild the zer0-mistakes Jekyll theme from an empty directory to a fully functional, deployable theme.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Initialize Repository](#phase-1-initialize-repository)
3. [Phase 2: Ruby Gem Structure](#phase-2-ruby-gem-structure)
4. [Phase 3: Gem Configuration](#phase-3-gem-configuration)
5. [Phase 4: Jekyll Configuration](#phase-4-jekyll-configuration)
6. [Phase 5: Docker Environment](#phase-5-docker-environment)
7. [Phase 6: Theme Structure](#phase-6-theme-structure)
8. [Phase 7: Automation Scripts](#phase-7-automation-scripts)
9. [Phase 8: Makefile Commands](#phase-8-makefile-commands)
10. [Phase 9: Documentation](#phase-9-documentation)
11. [Phase 10: Testing & Finalization](#phase-10-testing-finalization)
12. [Validation Checklist](#validation-checklist)

---

## ✅ Prerequisites {#prerequisites}

### Required Software

```bash
# Verify installations
ruby --version      # Ruby 2.7.0 or higher
gem --version       # RubyGems
bundle --version    # Bundler 2.3 or higher
git --version       # Git
docker --version    # Docker (optional but recommended)
node --version      # Node.js 16+ (for package.json)
jq --version        # jq for JSON manipulation
```

### System Setup

```bash
# Install Bundler if needed
gem install bundler

# Install jq (macOS)
brew install jq

# Install jq (Linux)
sudo apt-get install jq  # Debian/Ubuntu
sudo yum install jq      # RHEL/CentOS
```

---

## 🎯 Phase 1: Initialize Repository {#phase-1-initialize-repository}

### Step 1.1: Create Project Directory

```bash
# Create and navigate to project directory
mkdir zer0-mistakes
cd zer0-mistakes

# Initialize Git repository
git init
git branch -M main

# Create initial .gitignore
cat > .gitignore << 'EOF'
# Jekyll Build Files
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata

# Ruby Gems
vendor/
.bundle/
*.gem
Gemfile.lock

# Node Modules
node_modules/

# macOS
.DS_Store

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build Artifacts
pkg/
build/

# Logs
*.log
logs/

# Temporary Files
tmp/
temp/

# Environment Files
.env
.env.local

# Backup Files
*.bak
*~
EOF

git add .gitignore
git commit -m "chore: initialize repository with .gitignore"
```

### Step 1.2: Create License

```bash
# Create MIT License
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Amr Abdel-Motaleb

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "docs: add MIT license"
```

---

## 💎 Phase 2: Ruby Gem Structure {#phase-2-ruby-gem-structure}

### Step 2.1: Create Version File (Single Source of Truth)

```bash
# Create lib directory structure
mkdir -p lib/jekyll-theme-zer0

# Create version.rb file
cat > lib/jekyll-theme-zer0/version.rb << 'EOF'
# frozen_string_literal: true

module JekyllThemeZer0
  VERSION = "0.6.0"
end
EOF

git add lib/
git commit -m "feat: add version file as single source of truth"
```

### Step 2.2: Create Main Theme File

```bash
# Create main theme loader
cat > lib/jekyll-theme-zer0.rb << 'EOF'
# frozen_string_literal: true

require "jekyll-theme-zer0/version"

module JekyllThemeZer0
  # Theme functionality
end
EOF

git add lib/jekyll-theme-zer0.rb
git commit -m "feat: add main theme loader"
```

---

## 📦 Phase 3: Gem Configuration {#phase-3-gem-configuration}

### Step 3.1: Create Gemspec

```bash
# Create gemspec file
cat > jekyll-theme-zer0.gemspec << 'EOF'
# frozen_string_literal: true

require_relative "lib/jekyll-theme-zer0/version"

Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-zer0"
  spec.version       = JekyllThemeZer0::VERSION
  spec.authors       = ["Amr Abdel-Motaleb"]
  spec.email         = ["amr.abdel.motaleb@gmail.com"]

  spec.summary       = "A Docker-first Jekyll theme with AI-powered installation"
  spec.description   = "Professional Jekyll theme featuring Docker-first development, Bootstrap 5 integration, automated release management, and self-healing installation system"
  spec.homepage      = "https://github.com/bamr87/zer0-mistakes"
  spec.license       = "MIT"

  spec.metadata["homepage_uri"]          = spec.homepage
  spec.metadata["source_code_uri"]       = "https://github.com/bamr87/zer0-mistakes"
  spec.metadata["changelog_uri"]         = "https://github.com/bamr87/zer0-mistakes/blob/main/CHANGELOG.md"
  spec.metadata["documentation_uri"]     = "https://bamr87.github.io/zer0-mistakes/"
  spec.metadata["bug_tracker_uri"]       = "https://github.com/bamr87/zer0-mistakes/issues"
  spec.metadata["github_repo"]           = "ssh://github.com/bamr87/zer0-mistakes"
  spec.metadata["allowed_push_host"]     = "https://rubygems.org"

  spec.files = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r!^(assets|_data|_layouts|_includes|_sass|lib|LICENSE|README|CHANGELOG)!i)
  end

  spec.required_ruby_version = ">= 2.7.0"

  spec.add_runtime_dependency "jekyll", "~> 3.9"
  spec.add_runtime_dependency "jekyll-feed", "~> 0.12"
  spec.add_runtime_dependency "jekyll-seo-tag", "~> 2.8"
  spec.add_runtime_dependency "jekyll-sitemap", "~> 1.4"
  spec.add_runtime_dependency "jekyll-paginate", "~> 1.1"

  spec.add_development_dependency "bundler", "~> 2.3"
  spec.add_development_dependency "rake", "~> 13.0"
  spec.add_development_dependency "rspec", "~> 3.0"
end
EOF

git add jekyll-theme-zer0.gemspec
git commit -m "feat: add gemspec configuration"
```

### Step 3.2: Create Gemfile

```bash
# Create Gemfile
cat > Gemfile << 'EOF'
# frozen_string_literal: true

source "https://rubygems.org"

# Specify your gem's dependencies in jekyll-theme-zer0.gemspec
gemspec

# GitHub Pages compatibility
gem "github-pages", "~> 228", group: :jekyll_plugins

# Additional plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-paginate", "~> 1.1"
end

# Development dependencies
group :development, :test do
  gem "rake", "~> 13.0"
  gem "rspec", "~> 3.0"
  gem "rubocop", "~> 1.50"
end

# Windows and JRuby compatibility
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance booster for watching directories
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock `http_parser.rb` to `v0.6.x` on JRuby
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
EOF

git add Gemfile
git commit -m "feat: add Gemfile with dependencies"
```

### Step 3.3: Create Package.json

```bash
# Create package.json for version synchronization
cat > package.json << 'EOF'
{
  "name": "jekyll-theme-zer0",
  "version": "0.6.0",
  "description": "A Docker-first Jekyll theme with AI-powered installation and automated release management",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/bamr87/zer0-mistakes.git"
  },
  "keywords": [
    "jekyll",
    "jekyll-theme",
    "docker",
    "bootstrap",
    "github-pages",
    "ai",
    "automation"
  ],
  "author": "Amr Abdel-Motaleb <amr.abdel.motaleb@gmail.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/bamr87/zer0-mistakes/issues"
  },
  "homepage": "https://github.com/bamr87/zer0-mistakes#readme"
}
EOF

git add package.json
git commit -m "feat: add package.json for npm compatibility"
```

### Step 3.4: Install Dependencies

```bash
# Install Ruby dependencies
bundle install

# Verify installation
bundle list
```

---

## ⚙️ Phase 4: Jekyll Configuration {#phase-4-jekyll-configuration}

### Step 4.1: Create Production Configuration

```bash
# Create _config.yml (production)
cat > _config.yml << 'EOF'
# Production Configuration for zer0-mistakes Jekyll Theme
title: "Zer0-Mistakes"
email: "support@zer0-mistakes.com"
description: "A Docker-first Jekyll theme with AI-powered installation"
baseurl: ""
url: "https://bamr87.github.io/zer0-mistakes"

# Theme Settings
remote_theme: "bamr87/zer0-mistakes"
theme: jekyll-theme-zer0

# Build Settings
markdown: kramdown
highlighter: rouge
permalink: /:categories/:title/
timezone: America/New_York

# Plugins
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-paginate

# Pagination
paginate: 10
paginate_path: "/blog/page:num/"

# Collections
collections:
  posts:
    output: true
    permalink: /posts/:title/
  docs:
    output: true
    permalink: /docs/:title/
  quickstart:
    output: true
    permalink: /quickstart/:title/
  about:
    output: true
    permalink: /about/:title/
  notes:
    output: true
    permalink: /notes/:title/

# Default Front Matter
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "journals"
      author: "Zer0-Mistakes Team"
  - scope:
      path: ""
      type: "docs"
    values:
      layout: "default"
  - scope:
      path: ""
    values:
      layout: "default"

# Analytics (PostHog)
posthog:
  enabled: true
  api_key: "phc_your_key_here"
  api_host: "https://app.posthog.com"
  custom_events:
    track_downloads: true
    track_external_links: true
    track_scroll_depth: true
    scroll_depth_threshold: 75

# SEO Settings
author:
  name: "Zer0-Mistakes Development Team"
  email: "support@zer0-mistakes.com"
  twitter: "@zer0mistakes"

social:
  name: "Zer0-Mistakes"
  links:
    - "https://twitter.com/zer0mistakes"
    - "https://github.com/bamr87/zer0-mistakes"

twitter:
  username: "zer0mistakes"
  card: "summary_large_image"

# Exclude from build
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor/
  - .bundle/
  - .sass-cache/
  - .jekyll-cache/
  - gemfiles/
  - README.md
  - LICENSE
  - CHANGELOG.md
  - docker-compose.yml
  - Makefile
  - scripts/
  - test/
  - pkg/
  - build/
EOF

git add _config.yml
git commit -m "feat: add production Jekyll configuration"
```

### Step 4.2: Create Development Configuration

```bash
# Create _config_dev.yml (development overrides)
cat > _config_dev.yml << 'EOF'
# Development Configuration Overrides
url: "http://localhost:4000"
baseurl: ""

# Local Theme Development
remote_theme: false
theme: "jekyll-theme-zer0"

# Development Settings
incremental: true
livereload: true
livereload_port: 35729

# Disable Analytics in Development
posthog:
  enabled: false

# Show Drafts and Future Posts
show_drafts: true
future: true
unpublished: true

# Verbose Output
verbose: true
strict_front_matter: true

# No Exclusions (include everything for development)
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor/
EOF

git add _config_dev.yml
git commit -m "feat: add development configuration overrides"
```

---

## 🐳 Phase 5: Docker Environment {#phase-5-docker-environment}

### Step 5.1: Create Docker Compose Configuration

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64  # Apple Silicon compatibility
    command: jekyll serve --watch --force_polling --config "_config.yml,_config_dev.yml" --host 0.0.0.0 --port 4000
    volumes:
      - ./:/app
    ports:
      - "4000:4000"
      - "35729:35729"  # LiveReload
    working_dir: /app
    environment:
      JEKYLL_ENV: development
    restart: unless-stopped
EOF

git add docker-compose.yml
git commit -m "feat: add Docker Compose configuration"
```

### Step 5.2: Test Docker Environment

```bash
# Start Docker containers
docker-compose up -d

# View logs
docker-compose logs -f

# Test site
curl http://localhost:4000

# Stop containers
docker-compose down
```

---

## 🎨 Phase 6: Theme Structure {#phase-6-theme-structure}

### Step 6.1: Create Directory Structure

```bash
# Create all required directories
mkdir -p _layouts
mkdir -p _includes/core
mkdir -p _includes/components
mkdir -p _includes/analytics
mkdir -p _includes/navigation
mkdir -p _includes/docs
mkdir -p _includes/landing
mkdir -p _includes/stats
mkdir -p _includes/content
mkdir -p _sass/core
mkdir -p _data/navigation
mkdir -p assets/css
mkdir -p assets/js
mkdir -p assets/images
mkdir -p pages/_posts
mkdir -p pages/_docs
mkdir -p pages/_quickstart
mkdir -p pages/_about
mkdir -p pages/_notes

git add _layouts/ _includes/ _sass/ _data/ assets/ pages/
git commit -m "feat: create theme directory structure"
```

### Step 6.2: Create Root Layout

```bash
# Create _layouts/root.html
cat > _layouts/root.html << 'EOF'
<!DOCTYPE html>
<html lang="{{ page.lang | default: site.lang | default: 'en' }}">
  {% include core/head.html %}
  <body>
    {{ content }}
    {% include js-cdn.html %}
  </body>
</html>
EOF

git add _layouts/root.html
git commit -m "feat: add root layout template"
```

### Step 6.3: Create Default Layout

```bash
# Create _layouts/default.html
cat > _layouts/default.html << 'EOF'
---
layout: root
---
{% include core/header.html %}

<div class="container-fluid">
  <div class="row">
    {% if page.sidebar != false %}
    <aside class="col-lg-3 d-none d-lg-block">
      {% include sidebar-left.html %}
    </aside>
    {% endif %}
    
    <main class="col-12 {% if page.sidebar != false %}col-lg-9{% endif %}">
      <article class="content">
        {{ content }}
      </article>
    </main>
  </div>
</div>

{% include core/footer.html %}
EOF

git add _layouts/default.html
git commit -m "feat: add default layout with sidebar"
```

### Step 6.4: Create Journals Layout

```bash
# Create _layouts/journals.html
cat > _layouts/journals.html << 'EOF'
---
layout: default
---
<article class="post">
  <header class="post-header">
    <h1 class="post-title">{{ page.title }}</h1>
    
    <div class="post-meta">
      {% if page.author %}
      <span class="author">
        <i class="bi bi-person"></i> {{ page.author }}
      </span>
      {% endif %}
      
      {% if page.date %}
      <span class="date">
        <i class="bi bi-calendar"></i>
        <time datetime="{{ page.date | date: '%Y-%m-%d' }}">
          {{ page.date | date: "%B %d, %Y" }}
        </time>
      </span>
      {% endif %}
      
      {% if page.categories %}
      <span class="categories">
        <i class="bi bi-folder"></i>
        {% for category in page.categories %}
          <a href="/categories/{{ category | slugify }}">{{ category }}</a>{% unless forloop.last %}, {% endunless %}
        {% endfor %}
      </span>
      {% endif %}
    </div>
  </header>

  <div class="post-content">
    {{ content }}
  </div>

  {% if page.tags %}
  <footer class="post-footer">
    <div class="tags">
      <i class="bi bi-tags"></i>
      {% for tag in page.tags %}
        <a href="/tags/{{ tag | slugify }}" class="badge bg-secondary">{{ tag }}</a>
      {% endfor %}
    </div>
  </footer>
  {% endif %}
</article>
EOF

git add _layouts/journals.html
git commit -m "feat: add journals layout for blog posts"
```

### Step 6.5: Create Head Include

```bash
# Create _includes/core/head.html
cat > _includes/core/head.html << 'EOF'
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <title>{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}</title>
  
  {% if page.description %}
  <meta name="description" content="{{ page.description }}">
  {% elsif site.description %}
  <meta name="description" content="{{ site.description }}">
  {% endif %}

  <!-- Bootstrap 5.3.3 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">

  <!-- Custom CSS -->
  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
  
  <!-- SEO -->
  {% seo %}
  
  <!-- Feed -->
  {% feed_meta %}
  
  <!-- Analytics -->
  {% if jekyll.environment == "production" %}
    {% include analytics/posthog.html %}
  {% endif %}
</head>
EOF

git add _includes/core/head.html
git commit -m "feat: add head include with Bootstrap 5 and analytics"
```

### Step 6.6: Create Header Include

```bash
# Create _includes/core/header.html
cat > _includes/core/header.html << 'EOF'
<header>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="{{ '/' | relative_url }}">
        {{ site.title }}
      </a>
      
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link" href="{{ '/' | relative_url }}">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ '/blog/' | relative_url }}">Blog</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ '/docs/' | relative_url }}">Docs</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="{{ '/about/' | relative_url }}">About</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</header>
EOF

git add _includes/core/header.html
git commit -m "feat: add responsive header with Bootstrap navbar"
```

### Step 6.7: Create Footer Include

```bash
# Create _includes/core/footer.html
cat > _includes/core/footer.html << 'EOF'
<footer class="bg-dark text-white mt-5 py-4">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h5>{{ site.title }}</h5>
        <p>{{ site.description }}</p>
      </div>
      <div class="col-md-3">
        <h5>Links</h5>
        <ul class="list-unstyled">
          <li><a href="{{ '/' | relative_url }}" class="text-white">Home</a></li>
          <li><a href="{{ '/docs/' | relative_url }}" class="text-white">Documentation</a></li>
          <li><a href="{{ '/blog/' | relative_url }}" class="text-white">Blog</a></li>
        </ul>
      </div>
      <div class="col-md-3">
        <h5>Connect</h5>
        <ul class="list-unstyled">
          <li><a href="https://github.com/bamr87/zer0-mistakes" class="text-white" target="_blank">GitHub</a></li>
          <li><a href="https://twitter.com/zer0mistakes" class="text-white" target="_blank">Twitter</a></li>
        </ul>
      </div>
    </div>
    <hr class="border-secondary">
    <div class="text-center">
      <small>&copy; {{ 'now' | date: "%Y" }} {{ site.title }}. Licensed under MIT.</small>
    </div>
  </div>
</footer>
EOF

git add _includes/core/footer.html
git commit -m "feat: add footer with copyright and links"
```

### Step 6.8: Create JS CDN Include

```bash
# Create _includes/js-cdn.html
cat > _includes/js-cdn.html << 'EOF'
<!-- Bootstrap 5.3.3 Bundle (includes Popper) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

<!-- Custom JS -->
<script src="{{ '/assets/js/main.js' | relative_url }}"></script>
EOF

git add _includes/js-cdn.html
git commit -m "feat: add JavaScript CDN includes"
```

### Step 6.9: Create Main Stylesheet

```bash
# Create assets/css/main.css
cat > assets/css/main.css << 'EOF'
/* zer0-mistakes Custom Styles */

/* Import Bootstrap customizations */
@import url('custom.scss');

/* Body */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
}

/* Navigation */
.navbar-brand {
  font-weight: bold;
  font-size: 1.5rem;
}

/* Content */
.content {
  padding: 2rem 0;
}

/* Post Styles */
.post-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.post-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.post-meta {
  color: #6c757d;
  font-size: 0.9rem;
}

.post-meta span {
  margin-right: 1rem;
}

.post-content {
  font-size: 1.1rem;
  line-height: 1.8;
}

.post-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

/* Tags */
.tags {
  margin-top: 1rem;
}

.tags .badge {
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .post-title {
    font-size: 2rem;
  }
}
EOF

git add assets/css/main.css
git commit -m "feat: add main stylesheet"
```

### Step 6.10: Create Custom SCSS

```bash
# Create _sass/custom.scss
cat > _sass/custom.scss << 'EOF'
// Bootstrap Variable Overrides
$primary: #007bff;
$secondary: #6c757d;
$success: #28a745;
$danger: #dc3545;
$warning: #ffc107;
$info: #17a2b8;

// Typography
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
$font-size-base: 1rem;
$line-height-base: 1.6;

// Spacing
$spacer: 1rem;

// Custom Styles
.theme-navigation {
  &__item {
    padding: 0.5rem 1rem;
    
    &--active {
      background-color: $primary;
      color: white;
    }
  }
}
EOF

git add _sass/custom.scss
git commit -m "feat: add custom SCSS variables"
```

---

## 🤖 Phase 7: Automation Scripts {#phase-7-automation-scripts}

### Step 7.1: Create Scripts Directory

```bash
# Create scripts directory
mkdir -p scripts

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true
```

### Step 7.2: Copy Scripts from seed.implementation.md

**Note**: Use the complete script implementations from `seed.implementation.md`:

```bash
# Create version.sh
# Copy content from seed.implementation.md section "Version Management Script"
# (155 lines)

# Create build.sh
# Copy content from seed.implementation.md section "Build Automation Script"
# (175 lines)

# Create test.sh
# Copy content from seed.implementation.md section "Test Runner Script"
# (135 lines)

# Create gem-publish.sh
# Copy content from seed.implementation.md section "Gem Publishing Script"
# (700+ lines)

# Create install.sh
# Copy content from seed.implementation.md section "AI-Powered Installer"
# (1090 lines)

# Make all scripts executable
chmod +x scripts/*.sh

git add scripts/
git commit -m "feat: add automation scripts"
```

---

## 📋 Phase 8: Makefile Commands {#phase-8-makefile-commands}

### Step 8.1: Create Makefile

```bash
# Create Makefile
cat > Makefile << 'EOF'
.PHONY: help setup test build clean install start stop restart logs version-patch version-minor version-major release-patch release-minor release-major

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initialize development environment
	@echo "Setting up development environment..."
	bundle install
	chmod +x scripts/*.sh

test: ## Run test suite
	@./scripts/test.sh

test-verbose: ## Run tests with verbose output
	@./scripts/test.sh --verbose

build: ## Build gem
	@./scripts/build.sh

build-publish: ## Build and publish gem
	@./scripts/build.sh --publish

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf _site .sass-cache .jekyll-cache .jekyll-metadata
	rm -f *.gem pkg/*.gem build/*.gem

install: ## Install theme locally
	@echo "Installing theme..."
	gem install pkg/jekyll-theme-zer0-*.gem

start: ## Start Docker development server
	docker-compose up

start-detached: ## Start Docker in background
	docker-compose up -d

stop: ## Stop Docker containers
	docker-compose stop

restart: ## Restart Docker containers
	docker-compose restart

down: ## Stop and remove containers
	docker-compose down

logs: ## View Docker logs
	docker-compose logs -f jekyll

version-patch: ## Bump patch version (0.1.8 → 0.1.9)
	@./scripts/version.sh patch

version-minor: ## Bump minor version (0.1.8 → 0.2.0)
	@./scripts/version.sh minor

version-major: ## Bump major version (0.1.8 → 1.0.0)
	@./scripts/version.sh major

version-dry-run: ## Preview version bump
	@./scripts/version.sh patch --dry-run

release-patch: ## Full patch release workflow
	@./scripts/gem-publish.sh patch

release-minor: ## Full minor release workflow
	@./scripts/gem-publish.sh minor

release-major: ## Full major release workflow
	@./scripts/gem-publish.sh major

release-dry-run: ## Preview release workflow
	@./scripts/gem-publish.sh patch --dry-run

git-status: ## Show git status
	@git status

git-log: ## Show recent commits
	@git log --oneline -10

git-push: ## Push to origin
	@git push origin main --tags
EOF

git add Makefile
git commit -m "feat: add Makefile with comprehensive commands"
```

---

## 📚 Phase 9: Documentation {#phase-9-documentation}

### Step 9.1: Create README.md

```bash
# Create comprehensive README
cat > README.md << 'EOF'
# 🚀 Zer0-Mistakes Jekyll Theme

> A Docker-first Jekyll theme with AI-powered installation and automated release management

## Features

- **Docker-First Development**: Universal cross-platform compatibility
- **AI-Powered Installation**: Self-healing setup with 95% success rate
- **Remote Theme Support**: Compatible with GitHub Pages
- **Bootstrap 5 Integration**: Modern, responsive UI framework
- **Automated Release Management**: Semantic versioning with automated publishing
- **Comprehensive Testing**: Full test suite with CI/CD integration

## Quick Start

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start development server
docker-compose up
```

Visit http://localhost:4000

## Documentation

- [Installation Guide](docs/)
- [Configuration](docs/configuration/)
- [Theme Customization](docs/features/)
- [Development Guide](CONTRIBUTING.md)

## Requirements

- Docker Desktop (recommended)
- Git
- Ruby 2.7.0+ (if not using Docker)

## Commands

```bash
make setup           # Initialize environment
make start           # Start development server
make test            # Run tests
make build           # Build gem
make release-patch   # Publish patch release
```

## License

MIT License - see [LICENSE](LICENSE)

## Support

- [Documentation](https://bamr87.github.io/zer0-mistakes/)
- [Issues](https://github.com/bamr87/zer0-mistakes/issues)
- [Discussions](https://github.com/bamr87/zer0-mistakes/discussions)
EOF

git add README.md
git commit -m "docs: add comprehensive README"
```

### Step 9.2: Create CHANGELOG.md

```bash
# Create CHANGELOG
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2024-01-15

### Added
- Complete seed documentation system
- Comprehensive build instructions
- AI-powered installation script
- Automated release workflows

### Changed
- Improved Docker compatibility
- Enhanced Bootstrap 5 integration

## [0.5.0] - 2024-01-01

### Added
- Initial theme structure
- Docker-first development environment
- Bootstrap 5 integration
- Basic automation scripts

[Unreleased]: https://github.com/bamr87/zer0-mistakes/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/bamr87/zer0-mistakes/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/bamr87/zer0-mistakes/releases/tag/v0.5.0
EOF

git add CHANGELOG.md
git commit -m "docs: add changelog"
```

### Step 9.3: Create CONTRIBUTING.md

**Note**: Copy the comprehensive CONTRIBUTING.md from the existing repository or create a simplified version.

### Step 9.4: Create CODE_OF_CONDUCT.md

**Note**: Copy the AI Code of Conduct from the existing repository.

---

## ✅ Phase 10: Testing & Finalization {#phase-10-testing-finalization}

### Step 10.1: Run Initial Tests

```bash
# Run test suite
make test

# Expected output:
# [TEST] Running tests...
# ✓ Validate package.json syntax
# ✓ Validate gemspec syntax
# ✓ Test gem build
# ...
# All tests passed!
```

### Step 10.2: Build Gem

```bash
# Build gem
make build

# Verify gem contents
tar -tzf build/jekyll-theme-zer0-0.6.0.gem
```

### Step 10.3: Test Docker Environment

```bash
# Start Docker containers
make start-detached

# Wait for server to start
sleep 5

# Test site accessibility
curl http://localhost:4000

# View logs
make logs

# Stop containers
make down
```

### Step 10.4: Create Index Page

```bash
# Create index.md
cat > index.md << 'EOF'
---
layout: home
title: "Welcome to Zer0-Mistakes"
description: "A Docker-first Jekyll theme with AI-powered installation"
---

# Welcome to Zer0-Mistakes

A professional Jekyll theme featuring Docker-first development, Bootstrap 5 integration, and automated release management.

## Features

- 🐳 Docker-first development
- 🎨 Bootstrap 5 integration
- 🤖 AI-powered installation
- 📦 Automated releases
- 🧪 Comprehensive testing

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

[Get Started](/docs/) | [View on GitHub](https://github.com/bamr87/zer0-mistakes)
EOF

git add index.md
git commit -m "docs: add homepage"
```

### Step 10.5: Final Git Push

```bash
# Review all changes
git log --oneline

# Push to GitHub
git remote add origin https://github.com/bamr87/zer0-mistakes.git
git push -u origin main
```

---

## 📋 Validation Checklist {#validation-checklist}

### Essential Files Checklist

```bash
# Core structure
✅ lib/jekyll-theme-zer0/version.rb
✅ lib/jekyll-theme-zer0.rb
✅ jekyll-theme-zer0.gemspec
✅ Gemfile
✅ package.json
✅ LICENSE
✅ README.md
✅ CHANGELOG.md

# Configuration
✅ _config.yml
✅ _config_dev.yml
✅ docker-compose.yml
✅ Makefile
✅ .gitignore

# Theme structure
✅ _layouts/root.html
✅ _layouts/default.html
✅ _layouts/journals.html
✅ _includes/core/head.html
✅ _includes/core/header.html
✅ _includes/core/footer.html
✅ _includes/js-cdn.html
✅ assets/css/main.css
✅ _sass/custom.scss

# Scripts
✅ scripts/version.sh
✅ scripts/build.sh
✅ scripts/test.sh
✅ scripts/gem-publish.sh
✅ install.sh

# Content
✅ index.md
```

### Functional Tests

```bash
# Test 1: Run test suite
make test
# Expected: All tests pass

# Test 2: Build gem
make build
# Expected: Gem builds successfully

# Test 3: Docker environment
make start-detached && sleep 5 && curl http://localhost:4000
# Expected: HTML response

# Test 4: Version management
./scripts/version.sh patch --dry-run
# Expected: Shows version bump preview

# Test 5: Validate gemspec
ruby -c jekyll-theme-zer0.gemspec
# Expected: Syntax OK
```

### Deployment Readiness

```bash
# Verify GitHub repository connection
git remote -v

# Check branch status
git status

# Verify tags
git tag -l

# Test GitHub Pages compatibility
bundle exec jekyll build
# Expected: Site builds without errors
```

---

## 🎉 Completion

**Congratulations!** You've successfully rebuilt the zer0-mistakes Jekyll theme from scratch.

### Next Steps

1. **Publish to RubyGems**: `make release-patch`
2. **Set up GitHub Pages**: Enable in repository settings
3. **Configure PostHog**: Add API key to `_config.yml`
4. **Customize theme**: Modify layouts, styles, and content
5. **Create content**: Add posts, pages, and documentation

### Resources

- **Theme Documentation**: [GitHub Repository](https://github.com/bamr87/zer0-mistakes)
- **Jekyll Documentation**: [jekyllrb.com](https://jekyllrb.com/)
- **Bootstrap Documentation**: [getbootstrap.com](https://getbootstrap.com/)
- **Docker Documentation**: [docs.docker.com](https://docs.docker.com/)

---

**Build Status**: Complete ✅
**Version**: 0.6.0
**Last Updated**: 2025-11-25
