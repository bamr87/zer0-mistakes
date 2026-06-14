---
lastmod: 2026-06-14T00:00:00.000Z
title: DevContainer Configuration
description: VS Code Dev Container config for one-click cloud and local dev — GitHub Codespaces, JetBrains Gateway, and VS Code, with the Jekyll toolchain pre-installed.
preview: /images/previews/devcontainer-configuration.png
layout: default
categories:
  - docs
  - development
tags:
  - devcontainer
  - codespaces
  - development
  - docker
permalink: /docs/development/devcontainer/
difficulty: beginner
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
---

# DevContainer Configuration

zer0-mistakes ships a `.devcontainer/devcontainer.json` that lets you open a fully configured Jekyll development environment with a single click — no local Ruby, Bundler, or Node installation required.

## Supported Environments

| Environment | How to open |
|---|---|
| **GitHub Codespaces** | Click **Code → Codespaces → Create codespace on main** |
| **VS Code Dev Containers** | Open the repo folder → *Reopen in Container* |
| **JetBrains Gateway** | Connect to Codespace or remote Docker host |

## Configuration File

```text
.devcontainer/devcontainer.json
```

### What's Pre-Installed

The container is based on `mcr.microsoft.com/devcontainers/jekyll:2-bullseye` and adds:

| Tool | Source |
|---|---|
| Jekyll + Bundler | Base image |
| Docker-in-Docker | `devcontainers/features/docker-in-docker:2` |
| GitHub CLI (`gh`) | `devcontainers/features/github-cli:1` |
| Node.js LTS | `devcontainers/features/node:1` |

### Post-Create Hook

```bash
bundle install --jobs 4 --retry 3
```

Runs automatically after the container is created to install all gem dependencies.

### Post-Start Hook

```bash
bundle exec jekyll serve \
  --config '_config.yml,_config_dev.yml' \
  --host 0.0.0.0 --port 4000 --livereload
```

The Jekyll dev server starts automatically every time the container starts. The site is available at `http://localhost:4000` and forwarded automatically in VS Code and Codespaces.

## Forwarded Ports

| Port | Service |
|---|---|
| `4000` | Jekyll site (auto-opens in browser) |
| `35729` | LiveReload (silent) |

## VS Code Extensions

The configuration recommends these extensions:

- `sissel.shopify-liquid` — Liquid template syntax highlighting
- `yzhang.markdown-all-in-one` — Markdown editing
- `DavidAnson.vscode-markdownlint` — Markdown linting
- `streetsidesoftware.code-spell-checker` — Spell check
- `esbenp.prettier-vscode` — Code formatting
- `ms-azuretools.vscode-docker` — Docker management

## Using the DevContainer Locally

If you have Docker Desktop installed, you can use the devcontainer without Codespaces:

1. Install the [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the repo folder in VS Code
3. Click the notification to *Reopen in Container* (or use the Command Palette → *Dev Containers: Reopen in Container*)
4. Wait for the container to build (~2–3 minutes on first run)
5. The site starts automatically at port 4000

## Relationship to Docker Compose

The devcontainer and `docker-compose.yml` serve different purposes:

| `devcontainer.json` | `docker-compose.yml` |
|---|---|
| VS Code / Codespaces IDE integration | Team-wide dev server + multi-service stack |
| Extension recommendations, settings sync | Production-parity environment |
| Auto-start Jekyll on container start | Explicit `docker-compose up` required |

You can use either (or both) depending on your workflow.

## Related

- [Docker Development](/docs/docker/)
- [Quick Start Guide](/docs/getting-started/quick-start/)
- [Local Docker Publishing](/docs/development/docker-publishing/)

## See also

- [[Development]]
- [[Docker]]
- [[Getting Started]]
