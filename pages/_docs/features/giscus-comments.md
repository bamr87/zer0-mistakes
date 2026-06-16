---
lastmod: 2026-06-15T00:00:00.000Z
title: Giscus Comments
description: Integrate GitHub Discussions-powered comments into your Jekyll site using Giscus - a modern, privacy-friendly alternative to Disqus.
preview: /images/previews/giscus-comments.png
layout: default
categories:
    - docs
    - features
tags:
    - giscus
    - jekyll
    - comments
    - github-discussions
permalink: /docs/features/giscus-comments/
difficulty: beginner
estimated_reading_time: 15 minutes
prerequisites:
    - GitHub account
    - Jekyll site repository on GitHub
sidebar:
    nav: docs
---

# Giscus Comments

> Add a GitHub Discussions-powered comment system to your Jekyll site with automatic theme detection and privacy-friendly design.

## Overview

[Giscus](https://giscus.app/) is a comments system powered by GitHub Discussions. Unlike traditional services like Disqus, Giscus:

- **Requires no database** — comments are stored in GitHub Discussions
- **Respects privacy** — no tracking, no ads
- **Supports reactions** — GitHub emoji reactions on comments
- **Auto theme detection** — matches your site's light/dark mode
- **Free and open source** — MIT licensed

## Prerequisites

Before setting up Giscus, ensure you have:

1. A **public GitHub repository** for your Jekyll site
2. **GitHub Discussions enabled** on the repository
3. The **Giscus app** installed on your repository

## Installation

### Step 1: Enable GitHub Discussions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **General**
3. Scroll to **Features** section
4. Check **Discussions**

### Step 2: Install Giscus App

1. Visit [https://github.com/apps/giscus](https://github.com/apps/giscus)
2. Click **Install**
3. Select your repository
4. Authorize the installation

### Step 3: Get Configuration Values

1. Visit [https://giscus.app/](https://giscus.app/)
2. Enter your repository name (e.g., `username/repo-name`)
3. Select your preferred settings:
   - **Page ↔ Discussions Mapping**: `pathname` (recommended)
   - **Discussion Category**: Choose or create a category like "Comments"
   - **Features**: Enable reactions, lazy loading as desired
4. Copy the `data-repo-id` and `data-category-id` values

### Step 4: Configure Jekyll

Add the Giscus configuration to your `_config.yml`. The theme reads exactly
three keys — `enabled`, `data-repo-id`, and `data-category-id`:

```yaml
# Giscus Comment System Configuration
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"
```

The `data-repo` value is filled in automatically from `site.repository`
(set near the top of `_config.yml`), so you don't repeat the owner/repo here.

---

## Verify it works

The comment section renders at the bottom of the `article`, `note`, and
`notebook` layouts. The gating differs slightly by layout:

- `article.html` renders comments when `site.giscus` exists (the block is present).
- `note.html` and `notebook.html` render comments when `site.giscus.enabled` is `true`.

Keeping `enabled: true` in the config block satisfies all three.

1. Build the site with the dev config:

   ```bash
   docker-compose exec -T jekyll bundle exec jekyll build \
     --config '_config.yml,_config_dev.yml'
   ```

2. Confirm the Giscus script is emitted on a built post and your IDs were
   interpolated (no empty attributes):

   ```bash
   grep -A1 'giscus.app/client.js' _site/**/index.html | grep -m1 data-repo-id
   ```

   Expected: a `data-repo-id="..."` attribute carrying your real ID. An empty
   `data-repo-id=""` means the `giscus` block is missing or the key is misspelled.

3. Serve the site (`docker-compose up`) and open a post. The Giscus widget loads
   from GitHub, so it only fully renders on a public, deployed URL — on
   `localhost:4000` you can confirm the `<script src="https://giscus.app/client.js">`
   tag is present even though the embedded thread won't load.

---

## Configuration Options

### Data attributes

The theme's include lives at `_includes/content/giscus.html`. Only the first
three attributes below are wired to your `_config.yml`; the rest are fixed in
the include. To change a fixed attribute you must edit
`_includes/content/giscus.html` directly.

| Attribute | Source | Value |
|-----------|--------|-------|
| `data-repo` | Config | `{% raw %}{{ site.repository }}{% endraw %}` |
| `data-repo-id` | Config | `{% raw %}{{ site.giscus.data-repo-id }}{% endraw %}` (required) |
| `data-category-id` | Config | `{% raw %}{{ site.giscus.data-category-id }}{% endraw %}` (required) |
| `data-mapping` | Fixed in include | `pathname` |
| `data-strict` | Fixed in include | `1` |
| `data-reactions-enabled` | Fixed in include | `1` |
| `data-emit-metadata` | Fixed in include | `0` |
| `data-input-position` | Fixed in include | `top` |
| `data-theme` | Fixed in include | `preferred_color_scheme` |
| `data-lang` | Fixed in include | `en` |

### Theme options

The include ships with `data-theme="preferred_color_scheme"` (auto light/dark).
To use a different theme, edit `data-theme` in `_includes/content/giscus.html`
to one of:

| Value | Description |
|-------|-------------|
| `preferred_color_scheme` | Auto-detect from browser settings (default) |
| `light` | Always light mode |
| `dark` | Always dark mode |
| `dark_dimmed` | Dimmed dark mode |
| `transparent_dark` | Transparent dark background |
| Custom URL | Load custom CSS theme |

### Disabling comments per page

To disable comments on specific pages, add to front matter:

```yaml
---
title: "Page Without Comments"
comments: false
---
```

---

## Migration from Disqus

If migrating from Disqus:

1. **Export Disqus comments** (optional — for archival)
2. **Remove Disqus scripts** from your templates
3. **Delete Disqus configuration** from `_config.yml`
4. **Follow the installation steps** above
5. **Note**: Existing Disqus comments won't transfer to Giscus

---

## Troubleshooting

### Comments Not Appearing

1. **Check repository visibility** — must be public
2. **Verify Discussions are enabled** on the repository
3. **Confirm Giscus app is installed** on the repository
4. **Validate configuration IDs** match your repository

### Theme Not Matching

The include uses `data-theme="preferred_color_scheme"`, which follows the
browser's light/dark preference. To force a theme, edit `data-theme` in
`_includes/content/giscus.html`:

```html
<!-- Force a specific theme -->
data-theme="light"

<!-- Or load a custom CSS theme -->
data-theme="https://yoursite.com/giscus-custom.css"
```

### Multiple Comment Threads

If pages are creating duplicate discussions:

1. The include already ships with `data-strict="1"` and `data-mapping="pathname"` — confirm you haven't changed them in `_includes/content/giscus.html`
2. Verify page URLs are stable (no trailing-slash issues), since `pathname` mapping keys discussions to the URL path

---

## Best Practices

1. **Pathname mapping and strict mode are on by default** — the include already sets `data-mapping="pathname"` and `data-strict="1"`, which is the most reliable setup for Jekyll sites
2. **Create a dedicated category** — keeps comments organized
3. **Test locally** — the embedded thread won't load on localhost, but verify the `https://giscus.app/client.js` script tag is present
4. **Disable per page when needed** — set `comments: false` in a page's front matter (works in the `article`, `note`, and `notebook` layouts)

---

## Further Reading

- [Giscus Documentation](https://giscus.app/)
- [GitHub Discussions Guide](https://docs.github.com/en/discussions)
- [Giscus GitHub Repository](https://github.com/giscus/giscus)

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*

## See also

- [[Features]]
- [[PostHog Analytics]]
