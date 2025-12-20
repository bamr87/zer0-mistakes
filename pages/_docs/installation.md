---
title: Installation
description: Prerequisites and setup steps for running Zer0-Mistakes locally.
layout: default
categories:
    - docs
    - setup
tags:
    - installation
    - prerequisites
    - docker
permalink: /docs/installation/
difficulty: beginner
estimated_time: 10 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.005Z
sidebar:
    nav: docs
---

# Installation

Get up and running with Zer0-Mistakes in minutes using our Docker-first approach.

## Requirements

### Recommended: Docker (Zero Configuration)

- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** - Works on macOS, Windows, and Linux
- No Ruby, Bundler, or gem management required

### Alternative: Native Ruby

If you prefer local Ruby development:

- **Ruby 3.0+** with development headers
- **Bundler 2.0+** for dependency management
- Platform-specific build tools (Xcode CLI on macOS, build-essential on Linux)

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start the development server
docker-compose up
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Platform-Specific Guides

### macOS

```bash
# Install Docker Desktop
brew install --cask docker

# Or install Ruby natively
brew install ruby
gem install bundler jekyll
```

For detailed macOS setup: [Jekyll macOS Installation](https://jekyllrb.com/docs/installation/macos/)

### Windows

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Enable WSL 2 backend for better performance
3. Clone and run in PowerShell or WSL terminal

For native Ruby: [Jekyll Windows Installation](https://jekyllrb.com/docs/installation/windows/)

### Linux (Ubuntu/Debian)

```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Or install Ruby natively  
sudo apt-get install ruby-full build-essential
gem install bundler jekyll
```

For detailed Linux setup: [Jekyll Ubuntu Installation](https://jekyllrb.com/docs/installation/ubuntu/)

## Verifying Installation

After starting the server, verify everything works:

```bash
# Check Jekyll version (in Docker)
docker-compose exec jekyll jekyll --version

# Check for configuration issues
docker-compose exec jekyll jekyll doctor
```

## Next Steps

- [Docker Development Guide](/docs/docker/) - Learn Docker commands and workflows
- [Jekyll Configuration](/docs/jekyll/jekyll-config/) - Customize your site
- [Troubleshooting](/docs/troubleshooting/) - Common issues and solutions
