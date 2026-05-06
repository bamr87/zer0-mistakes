---
lastmod: 2026-05-05T00:00:00.000Z
title: Local Docker Publishing Pipeline
description: Publish the jekyll-theme-zer0 gem from a clean Docker container locally, mirroring the CI release path for reproducible builds without polluting the host Ruby environment.
layout: default
categories:
  - docs
  - development
tags:
  - docker
  - release
  - ci-cd
  - gem
  - automation
permalink: /docs/development/docker-publishing/
difficulty: advanced
estimated_reading_time: 10 minutes
prerequisites:
  - Docker Desktop
  - RubyGems API key
sidebar:
  nav: docs
---

# Local Docker Publishing Pipeline

You can build and publish the `jekyll-theme-zer0` gem entirely inside a Docker container. This mirrors the CI release path exactly, avoiding version-skew issues caused by different host Ruby environments.

## Why Run Releases in Docker?

| Problem | Docker solution |
|---|---|
| Host Ruby version mismatch | Container uses the same Ruby as CI |
| Polluted gem environment | Clean container discarded after run |
| "Works on my machine" | Exact CI environment reproduced locally |
| Key material leaks | Credentials injected via env vars, never stored |

## Compose Files

| File | Purpose |
|---|---|
| `docker-compose.publish.yml` | Builds and pushes the Docker image to a registry |
| `docker-compose.prod.yml` | Production deployment with pinned image tags |

## Releasing the Gem Locally

The recommended approach is the unified release script, which handles everything:

```bash
./scripts/bin/release patch    # or minor / major
```

This script:

1. Analyzes commits since the last tag to confirm the bump type
2. Updates `lib/jekyll-theme-zer0/version.rb`
3. Runs validation (`./scripts/bin/validate`)
4. Builds the gem (`gem build jekyll-theme-zer0.gemspec`)
5. Creates a git tag and pushes
6. Publishes to RubyGems (`gem push`)

Pass `--dry-run` to preview without publishing:

```bash
./scripts/bin/release patch --dry-run
```

## Running in a Docker Container

To run the release inside a Docker container manually:

```bash
# Start a clean Jekyll container
docker compose -f docker-compose.yml run --rm jekyll bash

# Inside the container:
./scripts/bin/release patch
```

Or with the publish compose file:

```bash
docker compose -f docker-compose.yml \
               -f docker-compose.publish.yml \
               build publish
```

## Environment Variables

Set credentials in `.env` (never commit this file):

```bash
RUBYGEMS_API_KEY=rubygems_...
GITHUB_TOKEN=ghp_...
DOCKER_IMAGE=amrabdel/zer0-mistakes
IMAGE_TAG=latest
```

The `.env` file is already in `.gitignore`.

## CI Pipeline Equivalent

GitHub Actions runs the same release pipeline automatically on version tags:

```yaml
# .github/workflows/release.yml (simplified)
- name: Build gem
  run: gem build jekyll-theme-zer0.gemspec

- name: Publish to RubyGems
  run: gem push jekyll-theme-zer0-${{ env.VERSION }}.gem
  env:
    GEM_HOST_API_KEY: ${{ secrets.RUBYGEMS_API_KEY }}
```

## Troubleshooting

### "Invalid API key"

Set `RUBYGEMS_API_KEY` in your shell or `.env` file:

```bash
export RUBYGEMS_API_KEY=$(cat ~/.gem/credentials | grep rubygems_api_key | cut -d' ' -f2)
```

### Gem already published at that version

Bump the version and re-run. RubyGems does not allow overwriting a published version.

### Docker build fails

```bash
docker compose down -v
docker compose build --no-cache
```

## Related

- [Release Management](/docs/development/release-management/)
- [CI/CD Pipeline](/docs/development/ci-cd/)
- [DevContainer Configuration](/docs/development/devcontainer/)

## See also

- [[Development]]
- [[Docker]]
- [[Release Management]]
