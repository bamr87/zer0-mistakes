---
title: Jekyll
description: Jekyll basics and Zer0-Mistakes development workflow (Docker-first).
layout: default
categories:
    - docs
    - jekyll
tags:
    - jekyll
    - getting-started
    - docker
permalink: /docs/jekyll/
difficulty: beginner
estimated_time: 10 minutes
prerequisites:
    - Docker Desktop (recommended) or Ruby + Bundler
updated: 2025-12-20
lastmod: 2025-12-20T22:15:45.976Z
---

# Jekyll

This section covers the minimum you need to run Zer0-Mistakes locally.

## Prerequisites

- Follow [Installation]({{ '/docs/installation/' | relative_url }})
- Verify your environment with [Troubleshooting]({{ '/docs/troubleshooting/' | relative_url }})

## Run locally (Docker-first)

```bash
docker-compose up
```

Then open `http://localhost:4000`.

## Next steps

- [Ruby & Bundler]({{ '/docs/ruby/' | relative_url }})
- [Liquid]({{ '/docs/liquid/' | relative_url }})
