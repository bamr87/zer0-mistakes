---
title: Deployment
description: Deploy your Zer0-Mistakes Jekyll site to various hosting platforms.
layout: default
categories:
    - docs
    - deployment
tags:
    - deployment
    - hosting
    - github-pages
    - netlify
permalink: /docs/deployment/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Deployment

Deploy your Zer0-Mistakes Jekyll site to various hosting platforms.

## Hosting Options

| Platform | Pros | Cons |
|----------|------|------|
| **GitHub Pages** | Free, automatic deploys, built-in CI | Limited plugins, whitelist only |
| **Netlify** | Free tier, custom headers, forms | Requires separate account |
| **Vercel** | Fast CDN, serverless functions | Jekyll not primary focus |
| **Self-hosted** | Full control | Requires server management |

## Guides in This Section

- **[GitHub Pages](github-pages/)** — Deploy to GitHub's free hosting
- **[Netlify](netlify/)** — Deploy with custom headers and redirects
- **[Custom Domain](custom-domain/)** — Set up your own domain name

## Quick Deploy

### GitHub Pages (Fastest)

1. Push your site to a GitHub repository
2. Go to **Settings** → **Pages**
3. Select your branch (usually `main`)
4. Site deploys automatically

### Netlify (Most Features)

1. Connect your GitHub repository to Netlify
2. Set build command: `jekyll build`
3. Set publish directory: `_site`
4. Deploy triggers on every push

## Environment Configuration

The theme uses dual configuration for different environments:

| File | Purpose |
|------|---------|
| `_config.yml` | Production settings |
| `_config_dev.yml` | Development overrides |

In production, ensure:
- `posthog.enabled: true` (if using analytics)
- `url` matches your domain
- `baseurl` is set correctly for subpaths

## Next Steps

- [GitHub Pages Guide](github-pages/) — Free hosting with automatic deploys
- [Netlify Guide](netlify/) — Advanced hosting features
- [Custom Domain Setup](custom-domain/) — Use your own domain
