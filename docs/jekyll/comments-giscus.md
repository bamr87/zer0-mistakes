---
title: Jekyll Comments with Giscus
description: "Integrate GitHub Discussions-powered comments into your Jekyll site using Giscus - a modern, privacy-friendly alternative to Disqus."
date: 2026-01-24T00:00:00.000Z
lastmod: 2026-01-24T00:00:00.000Z
tags:
  - giscus
  - jekyll
  - comments
  - github-discussions
categories:
  - Jekyll
  - Integration
layout: default
permalink: /docs/jekyll/comments-giscus/
difficulty_level: beginner
estimated_time: "15 minutes"
prerequisites:
  - GitHub account
  - Jekyll site repository on GitHub
  - Basic understanding of Jekyll includes
keywords:
  primary: ["giscus", "jekyll comments", "github discussions"]
  secondary: ["comment system", "static site comments", "privacy-friendly"]
---

# Jekyll Comments with Giscus

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

Add the Giscus configuration to your `_config.yml`:

```yaml
# Giscus Comment System Configuration
# https://giscus.app/
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"        # From giscus.app configuration
  data-category-id: "YOUR_CATEGORY_ID" # From giscus.app configuration
```

> **Note**: The Zer0-Mistakes theme uses `gisgus` (with typo) for backward compatibility. Check your theme's actual key name.

### Step 5: Create the Include File

Create `_includes/content/giscus.html`:

```html
<!--
  Giscus Comment System - GitHub Discussions Integration
  Documentation: https://giscus.app/
-->

<script src="https://giscus.app/client.js"
        data-repo="{{ site.repository }}"
        data-repo-id="{{ site.giscus.data-repo-id }}"
        data-category-id="{{ site.giscus.data-category-id }}"
        data-mapping="pathname"
        data-strict="1"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>
```

### Step 6: Include in Your Layout

Add the Giscus include to your post/page layout (e.g., `_layouts/journals.html`):

```liquid
{% raw %}{% if site.giscus.enabled and page.comments != false %}
  <div class="comments-section mt-5">
    <h3>Comments</h3>
    {% include content/giscus.html %}
  </div>
{% endif %}{% endraw %}
```

## Configuration Options

### Data Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-repo` | GitHub repository (owner/repo) | `site.repository` |
| `data-repo-id` | Repository ID from giscus.app | Required |
| `data-category-id` | Discussion category ID | Required |
| `data-mapping` | How to map pages to discussions | `pathname` |
| `data-strict` | Strict title matching | `1` |
| `data-reactions-enabled` | Show reaction buttons | `1` |
| `data-emit-metadata` | Emit discussion metadata | `0` |
| `data-input-position` | Comment input position | `top` |
| `data-theme` | Color theme | `preferred_color_scheme` |
| `data-lang` | Language | `en` |

### Theme Options

| Value | Description |
|-------|-------------|
| `preferred_color_scheme` | Auto-detect from browser settings |
| `light` | Always light mode |
| `dark` | Always dark mode |
| `dark_dimmed` | Dimmed dark mode |
| `transparent_dark` | Transparent dark background |
| Custom URL | Load custom CSS theme |

### Disabling Comments Per Page

To disable comments on specific pages, add to front matter:

```yaml
---
title: "Page Without Comments"
comments: false
---
```

## Migration from Disqus

If migrating from Disqus:

1. **Export Disqus comments** (optional — for archival)
2. **Remove Disqus scripts** from your templates
3. **Delete Disqus configuration** from `_config.yml`
4. **Follow the installation steps** above
5. **Note**: Existing Disqus comments won't transfer to Giscus

## Troubleshooting

### Comments Not Appearing

1. **Check repository visibility** — must be public
2. **Verify Discussions are enabled** on the repository
3. **Confirm Giscus app is installed** on the repository
4. **Validate configuration IDs** match your repository

### Theme Not Matching

If the comment theme doesn't match your site:

```html
<!-- Force specific theme -->
data-theme="light"

<!-- Or use custom CSS -->
data-theme="https://yoursite.com/giscus-custom.css"
```

### Multiple Comment Threads

If pages are creating duplicate discussions:

1. Ensure `data-strict="1"` is set
2. Check `data-mapping` is consistent
3. Verify page URLs are stable (no trailing slashes issues)

## Best Practices

1. **Use pathname mapping** — most reliable for Jekyll sites
2. **Enable strict mode** — prevents accidental discussion merging
3. **Create a dedicated category** — keeps comments organized
4. **Test locally** — comments won't work on localhost but verify the script loads
5. **Consider lazy loading** — add `loading="lazy"` for performance

## Further Reading

- [Giscus Documentation](https://giscus.app/)
- [GitHub Discussions Guide](https://docs.github.com/en/discussions)
- [Giscus GitHub Repository](https://github.com/giscus/giscus)

---

*This guide is part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*
