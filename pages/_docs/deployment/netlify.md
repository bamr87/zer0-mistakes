---
title: Deploy to Netlify
description: Deploy your Jekyll site to Netlify with continuous deployment from GitHub and custom headers.
layout: default
categories:
    - docs
    - deployment
tags:
    - deployment
    - netlify
    - jekyll
    - ci-cd
permalink: /docs/deployment/netlify/
difficulty: beginner
estimated_time: 15 minutes
prerequisites:
    - GitHub account
    - Netlify account
    - Jekyll site in Git repository
sidebar:
    nav: docs
---

# Deploy to Netlify

> Deploy your Jekyll site to Netlify with continuous deployment from GitHub.

## Overview

Netlify offers several advantages over GitHub Pages:

- **Custom headers** — Control caching and security headers
- **Redirects** — URL rewriting and redirects
- **Forms** — Built-in form handling
- **Functions** — Serverless functions
- **Deploy previews** — Preview branches before merging

## Prerequisites

- GitHub account with your Jekyll site repository
- Netlify account (free tier available)

## Setup

### Step 1: Prepare Your Repository

Ensure your `Gemfile.lock` is up to date:

```bash
bundle install
bundle update
```

Commit the updated lock file:

```bash
git add Gemfile.lock
git commit -m "Update Gemfile.lock for Netlify"
git push
```

### Step 2: Create Netlify Account

1. Go to [netlify.com](https://www.netlify.com/)
2. Click **Sign up** and authenticate with GitHub
3. Authorize Netlify to access your repositories

### Step 3: Connect Repository

1. From the Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Choose **GitHub** as your Git provider
3. Authorize Netlify if prompted
4. Select your Jekyll repository

### Step 4: Configure Build Settings

| Setting | Value |
|---------|-------|
| Branch to deploy | `main` (or your default branch) |
| Build command | `jekyll build` |
| Publish directory | `_site` |

Click **"Deploy site"** to start the first build.

### Step 5: Monitor Deployment

1. Watch the build logs for any errors
2. Once complete, Netlify provides a random URL (e.g., `random-name-12345.netlify.app`)
3. Click the URL to view your deployed site

## Configuration Files

### netlify.toml

Create `netlify.toml` in your repository root for advanced configuration:

```toml
[build]
  command = "jekyll build"
  publish = "_site"

[build.environment]
  JEKYLL_ENV = "production"
  RUBY_VERSION = "3.0.0"

# Redirects
[[redirects]]
  from = "/old-page"
  to = "/new-page"
  status = 301

# Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### _redirects File

Alternatively, create a `_redirects` file in your site root:

```
# Redirect old URLs
/old-page    /new-page    301

# SPA fallback (if using client-side routing)
/*    /index.html   200
```

### _headers File

Create a `_headers` file for custom headers:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block

/assets/*
  Cache-Control: public, max-age=31536000
```

## Custom Domain

### Option 1: Netlify UI

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow DNS configuration instructions

### Option 2: DNS Configuration

Add these records at your domain registrar:

**For apex domain (example.com):**
```
Type: A
Name: @
Value: 75.2.60.5
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: your-site.netlify.app
```

Netlify automatically provisions SSL certificates via Let's Encrypt.

## Environment Variables

Set environment variables in Netlify UI or `netlify.toml`:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add variables:
   - `JEKYLL_ENV=production`
   - Any API keys your site needs

## Deploy Previews

Netlify automatically creates preview deployments for pull requests:

1. Open a pull request on GitHub
2. Netlify builds and deploys a preview
3. Preview URL appears in the PR comments
4. Test changes before merging

## Troubleshooting

### Build Failures

Check the deploy log for errors:

1. Go to **Deploys** tab
2. Click the failed deploy
3. Review build logs

Common issues:
- Missing `Gemfile.lock` — Run `bundle lock`
- Ruby version mismatch — Specify in `netlify.toml`
- Plugin errors — Ensure all gems are in `Gemfile`

### Slow Builds

Optimize build time:
- Use `bundle install --jobs 4` for parallel installs
- Cache dependencies (Netlify does this automatically)
- Reduce build scope with incremental builds

### SSL Certificate Issues

If HTTPS isn't working:
1. Verify DNS propagation with `dig yourdomain.com`
2. Check **Domain management** → **HTTPS**
3. Click **Verify DNS configuration**
4. Provision certificate manually if needed

## Comparison with GitHub Pages

| Feature | Netlify | GitHub Pages |
|---------|---------|--------------|
| Custom plugins | Yes | No (whitelist only) |
| Custom headers | Yes | No |
| Redirects | Yes | Limited |
| Deploy previews | Yes | No |
| Forms | Yes | No |
| Functions | Yes | No |
| Build time | Faster | Slower |
| Free tier | Generous | Unlimited |

## Next Steps

- [Custom Domain Setup](/docs/deployment/custom-domain/)
- [Security Headers](/docs/jekyll/security/) — Harden your site
