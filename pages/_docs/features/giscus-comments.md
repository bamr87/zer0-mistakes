---
lastmod: 2026-06-23T00:00:00.000Z
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

**This is the step most likely to be silently skipped** — nothing in your repository can declare it, and no test or build can detect that it's missing. Without it the widget renders an error instead of a comment box, no matter how correct `_config.yml` is.

1. Visit [https://github.com/apps/giscus](https://github.com/apps/giscus)
2. Click **Install** (or **Configure**, if you've installed it on another account before)
3. Select the account that owns the repository
4. Grant access — either **All repositories** or **Only select repositories** including this one
5. Verify it took effect:

   ```bash
   ./scripts/bin/giscus-discussions doctor
   ```

> **Forking this theme?** A fork does **not** inherit the upstream repo's app
> installation, and the `data-repo-id` / `data-category-id` in `_config.yml` still point at `bamr87/zer0-mistakes`. You must install the app on your own repo *and* regenerate both IDs.

### Step 3: Get Configuration Values

1. Visit [https://giscus.app/](https://giscus.app/)
2. Enter your repository name (e.g., `username/repo-name`)
3. Select your preferred settings:
   - **Page ↔ Discussions Mapping**: `pathname` (recommended)
   - **Discussion Category**: Choose or create a category like "Comments"
   - **Features**: Enable reactions, lazy loading as desired
4. Copy the `data-repo-id` and `data-category-id` values

### Step 4: Configure Jekyll

Add the Giscus configuration to your `_config.yml`. The theme reads exactly three keys — `enabled`, `data-repo-id`, and `data-category-id`:

```yaml
# Giscus Comment System Configuration
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"
```

The `data-repo` value is filled in automatically from `site.repository` (set near the top of `_config.yml`), so you don't repeat the owner/repo here.

---

## Verify it works

The comment section renders at the bottom of the `article`, `note`, and `notebook` layouts, gated consistently on `page.comments != false` **and** `site.giscus.enabled`. Keeping `enabled: true` in the config block renders comments on all three layouts.

Blog posts (`pages/_posts/`, the `article` layout) and notes/notebooks show comments by default; docs and general pages do not. Override per page with `comments: false` (or `comments: true`) in a page's front matter.

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

   Expected: a `data-repo-id="..."` attribute carrying your real ID. An empty `data-repo-id=""` means the `giscus` block is missing or the key is misspelled.

3. Serve the site (`docker-compose up`) and open a post. **The widget does load on
`localhost`** — Giscus keys off the `data-repo` attribute, not the page's origin, so the iframe renders and reports real errors locally. This makes localhost a genuine end-to-end check, not just a "is the tag there?" check.

   What you should see, and what each state means:

   | What renders under the "Comments" heading | Meaning |
   |---|---|
   | The comment box and any existing thread | Fully working |
   | `An error occurred: giscus is not installed on this repository` | The [giscus app](https://github.com/apps/giscus) is not installed — see [Troubleshooting](#the-giscus-app-is-not-installed) |
   | `An error occurred: Discussion not found` | Normal for a page nobody has commented on yet; Giscus creates the discussion on the first comment |
   | Nothing at all | `enabled: false`, `comments: false` on the page, or the include isn't reached |

   You will not be able to *sign in and post* from `localhost` (GitHub's OAuth redirect is bound to the deployed origin), but everything up to that point is faithful.

4. Confirm the full chain — repo public, Discussions on, **app installed**, category valid —
   with one request, no browser needed:

   ```bash
   # Replace the repo and category with your own
   curl -s -G https://giscus.app/api/discussions \
     --data-urlencode "repo=bamr87/zer0-mistakes" \
     --data-urlencode "category=Announcements" \
     --data-urlencode "term=/" \
     -d "number=0&strict=true&first=1" | head -c 200
   ```

   A JSON payload with a `discussion` key means the chain is healthy. `{"error":"giscus is not installed on this repository"}` means the app is missing — the config can be perfect and comments will still be broken.

---

## Configuration Options

### Data attributes

The theme's include lives at `_includes/content/giscus.html`. Only the first three attributes below are wired to your `_config.yml`; the rest are fixed in the include. To change a fixed attribute you must edit `_includes/content/giscus.html` directly.

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

The include ships with `data-theme="preferred_color_scheme"` (auto light/dark). To use a different theme, edit `data-theme` in `_includes/content/giscus.html` to one of:

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

## Building conversations with Claude Code

Because comments are GitHub Discussions, you can read, draft, and reply to them from the terminal — and Claude Code can drive the whole flow. Two pieces ship with the theme:

- **`scripts/bin/giscus-discussions`** — a `gh`-powered engine with subcommands
  `doctor`, `categories`, `list`, `thread`, `draft`, `seed`, and `post`.
- **The `giscus-conversation` skill** (`.github/skills/giscus-conversation/`) —
tells Claude Code how to read a page's thread, draft a maintainer reply with the reader's context in mind, and publish it.

```bash
# Is the whole chain healthy? (app installed, IDs match, category valid)
./scripts/bin/giscus-discussions doctor

# What categories exist (and their node IDs for _config.yml)?
./scripts/bin/giscus-discussions categories

# Which pages have comment threads?
./scripts/bin/giscus-discussions list

# Read the full conversation for a page
./scripts/bin/giscus-discussions thread --page /posts/2025/01/21/remote-work-revolution/

# Draft a reply scaffold (thread context + a REPLY section to fill in)
./scripts/bin/giscus-discussions draft --number 7 --out reply.md

# Preview, then post (writes go to public Discussions — always --dry-run first)
./scripts/bin/giscus-discussions post --number 7 --body-file reply.md --reply-to DC_xxx --dry-run
```

The script reads the repository from `gh repo view` and the category from `_config.yml`; override with `--repo` / `--category-id` (or the `GISCUS_REPO` / `GISCUS_CATEGORY_ID` env vars) when working against a fork. Writes (`seed`, `post`) are no-ops under `--dry-run`. A read-only [`giscus-digest.yml`](https://github.com/bamr87/zer0-mistakes/blob/main/.github/workflows/giscus-digest.yml) workflow surfaces new comment activity in the Actions job summary.

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

### The giscus app is not installed

The single most common way a *correctly configured* site still shows no comments. Every value in `_config.yml` can be right — repo public, Discussions on, valid IDs — and the widget will still render only this:

![The Comments section of a published post showing the text "An error occurred: giscus is not installed on this repository" where the comment box should be](/assets/images/docs/features/giscus/widget-error-not-installed.png)

The [giscus.app](https://giscus.app/) configurator reports the same thing when you type the repository in — it checks all three prerequisites at once:

![The Repository step on giscus.app listing its three requirements (public repo, giscus app installed, Discussions enabled) with "bamr87/zer0-mistakes" entered and a red error reading "Cannot use giscus on this repository. Make sure all of the above criteria has been met."](/assets/images/docs/features/giscus/configurator-repo-check.png)

**Why it happens:** installing the app is a one-time action on the *repository*, not something any file in the repo can declare. Nothing in `_config.yml`, no test, and no Jekyll build can perform or detect it — so it is easy to complete every documented "configuration" step and still be missing the prerequisite. Forks are especially exposed: a fork inherits the config but **not** the upstream repo's app installation.

**Fix:** install the app at [github.com/apps/giscus](https://github.com/apps/giscus) → **Configure** → select the account → grant access to the repository (either "All repositories" or "Only select repositories" including this one).

**Verify** without opening a browser — this is the check worth putting in your setup notes:

```bash
curl -s -G https://giscus.app/api/discussions \
  --data-urlencode "repo=OWNER/REPO" \
  --data-urlencode "category=Announcements" \
  --data-urlencode "term=/" \
  -d "number=0&strict=true&first=1" | head -c 200
```

`{"error":"giscus is not installed on this repository"}` → still missing. Any JSON with a `discussion` key → installed and working.

### Comments Not Appearing

1. **Check repository visibility** — must be public
2. **Verify Discussions are enabled** on the repository
3. **Confirm Giscus app is installed** on the repository
4. **Validate configuration IDs** match your repository — `data-repo-id` must
belong to **this** repo (a forked-in ID from the upstream repo will make the widget show a "repository does not match" error even though the script tag renders). Regenerate at [giscus.app](https://giscus.app/), or list valid category IDs with `./scripts/bin/giscus-discussions categories`.
5. **Check the config key spelling** — it must be `giscus:` (not `gisgus:`);
the layouts read `site.giscus.enabled`. The `Giscus Comments Configuration` core test guards this.

### Theme Not Matching

The include uses `data-theme="preferred_color_scheme"`, which follows the browser's light/dark preference. To force a theme, edit `data-theme` in `_includes/content/giscus.html`:

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
