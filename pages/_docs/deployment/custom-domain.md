---
title: Custom Domain Setup
description: Configure a custom domain for your Jekyll site hosted on GitHub Pages or Netlify.
layout: default
categories:
    - docs
    - deployment
tags:
    - custom-domain
    - dns
    - jekyll
    - deployment
permalink: /docs/deployment/custom-domain/
difficulty: intermediate
estimated_time: 20 minutes
prerequisites:
    - Domain registrar account
    - GitHub Pages or Netlify hosting
sidebar:
    nav: docs
---

# Custom Domain Setup

> Configure a custom domain for your Jekyll site.

## Overview

Using a custom domain gives your site a professional appearance and makes it easier for visitors to remember your URL.

## Prerequisites

- A domain name from a registrar (GoDaddy, Namecheap, Google Domains, etc.)
- Your site deployed to GitHub Pages or Netlify

---

## GitHub Pages Setup

### Step 1: Configure Repository Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Custom domain**, enter your domain (e.g., `example.com`)
4. Check **Enforce HTTPS**
5. Click **Save**

This creates a `CNAME` file in your repository.

### Step 2: Configure DNS

Add these DNS records at your domain registrar:

#### For Apex Domain (example.com)

Add A records pointing to GitHub's IP addresses:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

#### For www Subdomain

Add a CNAME record:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | username.github.io |

Replace `username` with your GitHub username.

### Step 3: Verify Configuration

1. Wait for DNS propagation (can take up to 48 hours, usually faster)
2. Visit your custom domain
3. Check that HTTPS is working (padlock icon in browser)

### Step 4: Update Jekyll Configuration

Update `_config.yml`:

```yaml
url: "https://example.com"
baseurl: ""  # Empty for apex domain
```

---

## Netlify Setup

### Step 1: Add Custom Domain in Netlify

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `example.com`)
4. Click **Verify** and **Add domain**

### Step 2: Configure DNS

Netlify provides two options:

#### Option A: Netlify DNS (Recommended)

1. In Domain management, click **"Set up Netlify DNS"**
2. Update nameservers at your registrar to:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`
3. Netlify automatically configures all records

#### Option B: External DNS

Add these records at your registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | 75.2.60.5 |
| CNAME | www | your-site.netlify.app |

### Step 3: Enable HTTPS

1. In Domain management, scroll to **HTTPS**
2. Click **"Verify DNS configuration"**
3. Click **"Provision certificate"**

Netlify uses Let's Encrypt for free SSL certificates.

---

## Common DNS Configurations

### Apex Domain Only (example.com)

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

### www Only (www.example.com)

```
CNAME   www   username.github.io
```

### Both Apex and www

```
A       @     185.199.108.153
A       @     185.199.109.153
A       @     185.199.110.153
A       @     185.199.111.153
CNAME   www   username.github.io
```

### Redirect www to Apex (or vice versa)

Configure a redirect in your hosting platform:

**Netlify (`netlify.toml`):**
```toml
[[redirects]]
  from = "https://www.example.com/*"
  to = "https://example.com/:splat"
  status = 301
  force = true
```

---

## Domain Registrar Guides

### GoDaddy

1. Log in to GoDaddy
2. Go to **My Products** → **DNS**
3. Click **Manage** next to your domain
4. Add/edit DNS records as shown above

### Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → **Manage**
3. Click **Advanced DNS**
4. Add records under **Host Records**

### Google Domains

1. Log in to Google Domains
2. Select your domain
3. Click **DNS** in the left menu
4. Add custom records

### Cloudflare

1. Log in to Cloudflare
2. Select your domain
3. Go to **DNS** tab
4. Add records (set **Proxy status** to DNS only for initial setup)

---

## Troubleshooting

### DNS Not Propagating

1. Wait up to 48 hours (usually much faster)
2. Check propagation status: [dnschecker.org](https://dnschecker.org)
3. Clear DNS cache:
   - macOS: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`

### HTTPS Not Working

1. Verify DNS records are correct
2. Wait for SSL certificate provisioning
3. Check for mixed content warnings in browser console
4. Ensure all resources use HTTPS URLs

### Site Shows Wrong Content

1. Clear browser cache
2. Check `url` and `baseurl` in `_config.yml`
3. Verify CNAME file exists (GitHub Pages)
4. Rebuild and redeploy

### Certificate Errors

1. Ensure domain points to correct hosting
2. Wait for certificate provisioning (can take hours)
3. Check for CAA records that might block certificate issuance

---

## Best Practices

1. **Always use HTTPS** — Protects visitors and improves SEO
2. **Choose a canonical URL** — Redirect www to non-www (or vice versa)
3. **Update all references** — Ensure `_config.yml` and any hardcoded URLs match
4. **Test thoroughly** — Check all pages after domain change
5. **Set up monitoring** — Use uptime monitoring for production sites

---

## Next Steps

- [GitHub Pages Guide](/docs/deployment/github-pages/)
- [Netlify Guide](/docs/deployment/netlify/)
