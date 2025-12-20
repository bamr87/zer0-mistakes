---
title: Docker
description: Docker-first workflow for developing and testing Zer0-Mistakes.
layout: default
categories:
    - docs
    - docker
tags:
    - docker
    - docker-compose
permalink: /docs/docker/
difficulty: beginner
estimated_time: 5 minutes
prerequisites:
    - Docker Desktop
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.186Z
sidebar:
    nav: docs
---

# Docker Development

Zer0-Mistakes uses a **Docker-first** approach for consistent development across all platforms.

## Essential Commands

### Starting Development

```bash
# Start development server (foreground, see logs)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# View logs when running in background
docker-compose logs -f jekyll
```

Your site will be available at [http://localhost:4000](http://localhost:4000).

### Stopping Development

```bash
# Stop containers (preserves data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

### Rebuilding

```bash
# Rebuild after Gemfile changes
docker-compose up --build

# Force complete rebuild
docker-compose down && docker-compose up --build
```

## Working Inside the Container

```bash
# Open a shell in the container
docker-compose exec jekyll bash

# Run Jekyll commands directly
docker-compose exec jekyll jekyll build
docker-compose exec jekyll jekyll doctor
docker-compose exec jekyll bundle update
```

## Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main development configuration |
| `docker-compose.prod.yml` | Production build settings |
| `docker-compose.test.yml` | Testing configuration |

## Apple Silicon (M1/M2/M3) Support

The Docker configuration includes platform compatibility:

```yaml
services:
  jekyll:
    platform: linux/amd64  # Ensures compatibility
```

## Common Tasks

### Clean Rebuild

```bash
docker-compose down -v
docker-compose up --build
```

### Check Configuration

```bash
docker-compose exec jekyll jekyll doctor
```

### Update Dependencies

```bash
docker-compose exec jekyll bundle update
```

## Troubleshooting

**Port already in use:**
```bash
# Find process using port 4000
lsof -i :4000
# Kill it or use a different port
docker-compose up -p 4001:4000
```

**Container won't start:**
```bash
# Check logs for errors
docker-compose logs jekyll

# Try clean rebuild
docker-compose down -v && docker-compose up --build
```

## Related

- [Installation Guide](/docs/installation/)
- [Troubleshooting](/docs/troubleshooting/)
- [Jekyll Configuration](/docs/jekyll/jekyll-config/)
