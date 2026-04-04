---
title: "GitHub Pages Documentation"
description: "Official GitHub Pages documentation adapted for the Zer0-Mistakes Jekyll theme. Covers getting started, Jekyll setup, and custom domain configuration."
layout: default
categories:
    - docs
    - github-pages
tags:
    - github-pages
    - documentation
    - reference
    - hosting
permalink: /docs/github-pages/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
source_url: "https://github.com/github/docs/tree/main/content/pages"
source_license: "CC-BY-4.0"
synced_date: "2026-04-04"
---

# GitHub Pages Documentation

This section contains documentation adapted from the [official GitHub Pages documentation](https://docs.github.com/en/pages), covering everything you need to deploy and manage sites with GitHub Pages.

> **Attribution**: This content is adapted from the [github/docs](https://github.com/github/docs) repository, licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). Content has been converted for compatibility with the Zer0-Mistakes Jekyll theme.

## Quick Start

- [GitHub Pages Quickstart](quickstart/) — Create your first GitHub Pages site

## Getting Started

Learn the fundamentals of GitHub Pages:

| Guide | Description |
|-------|-------------|
| [What is GitHub Pages?](getting-started/what-is-github-pages/) | Overview of GitHub Pages hosting service |
| [Creating a Site](getting-started/creating-a-github-pages-site/) | Step-by-step site creation |
| [Publishing Source](getting-started/configuring-a-publishing-source-for-your-github-pages-site/) | Configure branch and folder for deployment |
| [Custom Workflows](getting-started/using-custom-workflows-with-github-pages/) | Deploy with GitHub Actions |
| [HTTPS](getting-started/securing-your-github-pages-site-with-https/) | Secure your site with HTTPS |
| [Custom 404](getting-started/creating-a-custom-404-page-for-your-github-pages-site/) | Create a custom error page |
| [Limits](getting-started/github-pages-limits/) | Usage limits and guidelines |
| [Troubleshooting 404s](getting-started/troubleshooting-404-errors-for-github-pages-sites/) | Fix common 404 errors |

## Jekyll Setup

Set up and configure Jekyll for GitHub Pages:

| Guide | Description |
|-------|-------------|
| [About GitHub Pages & Jekyll](jekyll-setup/about-github-pages-and-jekyll/) | How Jekyll integrates with GitHub Pages |
| [Creating a Jekyll Site](jekyll-setup/creating-a-github-pages-site-with-jekyll/) | Build a Jekyll site for GitHub Pages |
| [Adding Content](jekyll-setup/adding-content-to-your-github-pages-site-using-jekyll/) | Add pages and posts |
| [Adding a Theme](jekyll-setup/adding-a-theme-to-your-github-pages-site-using-jekyll/) | Apply and customize themes |
| [Markdown Processor](jekyll-setup/setting-a-markdown-processor-for-your-github-pages-site-using-jekyll/) | Configure markdown rendering |
| [Local Testing](jekyll-setup/testing-your-github-pages-site-locally-with-jekyll/) | Test your site locally |
| [Build Errors](jekyll-setup/about-jekyll-build-errors-for-github-pages-sites/) | Understanding build errors |
| [Troubleshooting Builds](jekyll-setup/troubleshooting-jekyll-build-errors-for-github-pages-sites/) | Fix Jekyll build issues |

## Custom Domains

Configure custom domains for your GitHub Pages site:

| Guide | Description |
|-------|-------------|
| [About Custom Domains](custom-domains/about-custom-domains-and-github-pages/) | Domain types and DNS setup |
| [Managing Domains](custom-domains/managing-a-custom-domain-for-your-github-pages-site/) | Add, change, or remove custom domains |
| [Verifying Domains](custom-domains/verifying-your-custom-domain-for-github-pages/) | Domain verification process |
| [Troubleshooting](custom-domains/troubleshooting-custom-domains-and-github-pages/) | Fix custom domain issues |

## Using with Zer0-Mistakes Theme

For Zer0-Mistakes specific deployment instructions, see:

- [Deploy to GitHub Pages](/docs/deployment/github-pages/) — Theme-specific deployment guide
- [Custom Domain Setup](/docs/deployment/custom-domain/) — Domain configuration for this theme
- [Installation](/docs/installation/) — Complete installation guide

## Syncing Documentation

This documentation is automatically synced from the official GitHub docs repository. To update:

```bash
# Check for updates
./scripts/sync-github-pages-docs.sh --check

# Sync latest documentation
./scripts/sync-github-pages-docs.sh --sync

# Preview changes first
./scripts/sync-github-pages-docs.sh --sync --dry-run
```

See the [sync manifest](https://github.com/bamr87/zer0-mistakes/blob/main/_data/github-pages-docs-sync.yml) for current sync status.
