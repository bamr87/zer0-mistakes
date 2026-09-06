---
title: "Docker for Jekyll Development: A Complete Guide"
description: Set up a Docker-based Jekyll environment with live reload, gem caching, and the dual-config pattern for consistent builds on macOS, Windows, and Linux.
categories:
  - Development
  - Tutorial
tags:
  - docker
  - jekyll
  - devops
  - containerization
keywords:
  - docker jekyll development
  - jekyll docker compose
  - containerized jekyll
  - bundle cache volume
  - jekyll dual-config pattern
  - jekyll live reload docker
date: 2025-01-15T10:00:00.000Z
layout: article
preview: /images/favicon_gpt_computer_retro.png
author: Zer0-Mistakes Development Team
featured: true
estimated_reading_time: 8 minutes
draft: true
lastmod: 2026-09-05T00:00:00.000Z
---

Docker gives you the same Jekyll environment on every machine — same Ruby, same gems, same build output whether you are on macOS, Windows, or Linux. This guide walks through the compose setup this theme actually uses, and the three decisions most Docker/Jekyll guides get wrong.

> **Skip the typing:** the theme's [Site Builder](/quickstart/site-builder/) generates a `docker-compose.yml` like the one below for your own site, writes it to disk, and can run `docker compose up` for you while Claude explains the output. Everything on this page still applies when you want to understand or tune what it produced.

## Why Use Docker for Jekyll?

Docker provides a consistent development environment across all platforms:

- **Cross-platform compatibility**: Works the same on Windows, macOS, and Linux
- **No Ruby installation required**: All dependencies are containerized
- **Consistent builds**: Eliminate "it works on my machine" issues
- **Easy team onboarding**: New developers can start immediately

## Setting Up Your Docker Environment

Here's a basic `docker-compose.yml` configuration:

```yaml
services:
  jekyll:
    # This theme builds its own image rather than using jekyll/jekyll: the
    # dev-test stage carries the full Jekyll + tooling toolchain.
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: dev-test
    ports:
      - "4000:4000"
      - "35729:35729"        # LiveReload
    volumes:
      - .:/site
      - bundle_cache:/usr/local/bundle
    environment:
      - JEKYLL_ENV=development
    command: >
      sh -c "(bundle check || bundle install) &&
             bundle exec jekyll serve --watch --livereload
             --config '_config.yml,_config_dev.yml' --host 0.0.0.0 --port 4000"

volumes:
  bundle_cache:
```

Starting a site from scratch rather than working in this repo? Replace the `build:` block with `image: jekyll/jekyll:4` and mount your site at `/srv/jekyll` — the rest of the file carries over unchanged.

Three things in that file are deliberate, and all three are places the older Docker/Jekyll guides on the web get wrong:

**No `version:` key.** The Compose Specification dropped it in 2022. Modern `docker compose` ignores it and warns when it is present.

**No `platform:` pin.** Forcing `linux/amd64` runs the whole image under QEMU emulation on Apple Silicon, which costs 3–10× on `apt`, `bundle install` and native gem builds. Docker builds your native architecture by default and Jekyll serves identically. Export `DOCKER_DEFAULT_PLATFORM=linux/amd64` only when you specifically need x86 parity with production.

**A named volume for gems.** `bundle_cache` keeps installed gems outside the bind mount, so a rebuild does not reinstall them and your host stays clean.

## Essential Docker Commands

Start your development server:

```bash
docker compose up
```

Build your site:

```bash
docker compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
```

Go through Bundler rather than calling `jekyll` directly: a bare `jekyll` can silently resolve to a different gem version than the one your `Gemfile.lock` pins.

## The Dual-Config Pattern

Notice the `--config '_config.yml,_config_dev.yml'` in the command. Jekyll layers configuration files left to right, so the second file overrides the first. Production settings live in `_config.yml`; the development file flips the handful of keys that should differ locally — a `localhost` URL, live reload, analytics off, and the local theme instead of the remote one.

One caution: Jekyll **replaces** rather than merges list keys such as `exclude:` and `plugins:`. A short list in the dev file silently discards the production one, so keep both in sync.

## Best Practices

1. **Use volume mounts** for live reloading, and a named volume for gems
2. **Let Docker pick the architecture** rather than pinning `platform:`
3. **Set environment variables** for development vs production
4. **Keep containers lightweight** with minimal dependencies
5. **Layer your configs** instead of maintaining two full copies

Run `docker compose up` and open `http://localhost:4000` — your site serves with live reload from a clean, portable container, and your host stays free of Ruby.
