---
title: Deploy to GitHub Pages
description: Deploy your Zer0-Mistakes Jekyll site to GitHub Pages with automatic builds.
layout: default
categories:
    - docs
    - deployment
tags:
    - github-pages
    - deployment
    - hosting
permalink: /docs/deployment/github-pages/
difficulty: beginner
estimated_time: 10 minutes
prerequisites:
    - GitHub account
    - Jekyll site in a GitHub repository
sidebar:
    nav: docs
---

# Deploy to GitHub Pages

GitHub Pages provides free hosting for Jekyll sites with automatic builds on every push.

## Prerequisites

- GitHub account
- Your Jekyll site in a GitHub repository

## Setup

### Step 1: Configure Your Repository

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select your branch (usually `main`)
4. Click **Save**

### Step 2: Configure Jekyll

Update your `_config.yml` for GitHub Pages:

```yaml
# Site URL (replace with your actual URL)
url: "https://username.github.io"
baseurl: "/repository-name"  # Empty if using user/org site

# Use remote theme for GitHub Pages compatibility
remote_theme: "bamr87/zer0-mistakes"

# Required plugins (GitHub Pages whitelist)
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
```

### Step 3: Push and Deploy

```bash
git add .
git commit -m "Configure for GitHub Pages"
git push origin main
```

GitHub will automatically build and deploy your site.

## Repository Types

### User/Organization Site

- Repository name: `username.github.io`
- URL: `https://username.github.io`
- `baseurl: ""`

### Project Site

- Repository name: Any name
- URL: `https://username.github.io/repository-name`
- `baseurl: "/repository-name"`

## Custom Domain

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Enter your domain in **Custom domain**
3. Check **Enforce HTTPS**
4. Configure DNS at your domain registrar

See [Custom Domain Setup](/docs/deployment/custom-domain/) for detailed DNS configuration.

## Troubleshooting

### Build Failures

Check the **Actions** tab for build logs:

1. Go to repository → **Actions**
2. Click the failed workflow
3. Review error messages

Common issues:
- Invalid front matter (YAML syntax)
- Missing dependencies
- Plugin not in GitHub Pages whitelist

### Site Not Updating

1. Verify the push was successful
2. Check **Actions** for build status
3. Wait a few minutes for CDN propagation
4. Try hard refresh (Ctrl+Shift+R)

### 404 Errors

- Check `baseurl` matches your repository name
- Verify file exists at the expected path
- Ensure front matter `permalink` is correct

## GitHub Pages Limitations

| Feature | Status |
|---------|--------|
| Custom plugins | Not supported (whitelist only) |
| Build time | ~10 minutes max |
| Repository size | 1 GB limit |
| Bandwidth | 100 GB/month |
| Build minutes | 10/hour, 2000/month |

## Alternative: GitHub Actions

For more control, use GitHub Actions to build:

```yaml
# .github/workflows/jekyll.yml
name: Deploy Jekyll

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          
      - name: Build site
        run: bundle exec jekyll build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

This allows custom plugins and more build control.

## Next Steps

- [Custom Domain Setup](/docs/deployment/custom-domain/)
- [Netlify Deployment](/docs/deployment/netlify/) — For more hosting features
