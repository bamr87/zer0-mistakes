---
lastmod: 2026-06-26T00:00:00.000Z
title: DevContainer Configuration for Codespaces
description: VS Code Dev Container config for one-click cloud and local dev — GitHub Codespaces, JetBrains Gateway, and VS Code, with the Jekyll toolchain pre-installed.
keywords: [jekyll devcontainer, github codespaces, codespaces prebuilds, vs code dev containers, jekyll dev environment, docker jekyll]
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

Instead of pulling a generic base image and installing gems on every launch, the devcontainer **builds from the repo's own [`docker/Dockerfile`](https://github.com/bamr87/zer0-mistakes/blob/main/docker/Dockerfile)** (the `dev-test` stage). That stage runs `bundle install` at **image-build time**, so the whole Jekyll toolchain is **preloaded into the image** — the gems always match the checked-out branch's `Gemfile.lock`, and there's no slow `bundle install` on first boot.

| Tool | Source |
|---|---|
| Ruby 3.3 + Bundler + Jekyll toolchain | `docker/Dockerfile` `dev-test` stage (gems baked in) |
| GitHub CLI (`gh`) | `devcontainers/features/github-cli:1` |

> Docker-in-Docker and a standalone Node install are intentionally **not**
> included — they aren't needed to render the site (Playwright/Sass run on the
> host), and dropping them keeps Codespace creation and prebuilds fast.

### Near-instant launch with prebuilds

Because the image is self-contained, [GitHub Codespaces prebuilds](https://docs.github.com/en/codespaces/prebuilding-your-codespaces) can build it ahead of time so new Codespaces restore from a ready image in seconds. Enable it under **Settings → Codespaces → Set up prebuild** (target `main`, trigger *On configuration change*). See [`.devcontainer/README.md`](https://github.com/bamr87/zer0-mistakes/blob/main/.devcontainer/README.md).

### Post-Create Hook

```bash
git config --global --add safe.directory ${containerWorkspaceFolder} && (bundle check || bundle install --jobs 4 --retry 3)
```

`bundle check` is a fast no-op when the gems are already baked into the image; it only falls back to a full install if the lockfile drifted.

### Post-Start Hook

```bash
bundle exec jekyll serve \
  --config '_config.yml,_config_dev.yml' \
  --host 0.0.0.0 --port 4000 --livereload --force_polling
```

The Jekyll dev server starts automatically every time the container starts (`nohup` keeps it alive after the hook returns; `--force_polling` makes file watching reliable over the Codespaces bind mount; logs land in `/tmp/jekyll-serve.log`). The site is available at `http://localhost:4000` and forwarded automatically in VS Code and Codespaces.

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
