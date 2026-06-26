---
lastmod: 2026-06-23T00:00:00.000Z
title: Remote-Theme Consumer Checklist
description: What remote_theme does not deliver on GitHub Pages, and the files and config every Zer0-Mistakes consumer must add to avoid silent breakage.
preview: /images/previews/deploy-to-github-pages.png
layout: default
categories:
    - docs
    - deployment
tags:
    - github-pages
    - remote-theme
    - deployment
    - troubleshooting
permalink: /docs/deployment/remote-theme-checklist/
difficulty: intermediate
estimated_reading_time: 10 minutes
prerequisites:
    - GitHub account
    - A GitHub Pages site using remote_theme
author: bamr87
sidebar:
    nav: docs
---

# Remote-Theme Consumer Checklist

**What you'll do:** wire up the files and config that GitHub Pages does *not*
inherit when you consume Zer0-Mistakes via `remote_theme`, so search, navigation,
comments, and internal links all work.

## Why this is needed

`remote_theme` only delivers `_layouts/`, `_includes/`, `_sass/`, and `assets/`.
It does **not** deliver `_config.yml`, `_data/`, `_plugins/`, or any root /
`pages/` files. GitHub Pages additionally runs Jekyll in `safe: true` mode, which
**ignores `_plugins/*.rb`** — so every custom generator in this theme (search,
sitemap, author pages, content statistics, preview images) never runs on a Pages
build of a consumer site.

The result is a chain of *silent* degradations. The checklist below is the
shortest path through all of them.

> **Building outside GitHub Pages?** If you run your own CI instead of Pages, see
> the [Safe-Mode Build Overlay](/docs/deployment/build-overlay/) recipe — it
> reproduces Pages' plugin-stripping behaviour so your custom build matches
> production.

## Prerequisites

- A GitHub repository with Pages enabled
- `remote_theme: "bamr87/zer0-mistakes"` in your `_config.yml`

## The checklist

### 1. Add `jekyll-include-cache` to your `plugins:`

`_layouts/root.html` uses `{% raw %}{% include_cached %}{% endraw %}`. Without
the plugin, the first build dies on `Unknown tag 'include_cached'`.

```yaml
# _config.yml
plugins:
  - jekyll-include-cache
```

### 2. Re-declare structure in your `_config.yml`

None of these are inherited from the theme — declare your own:
`collections`, `defaults`, `permalink`, `theme_skin`, `theme_color`,
`theme_background`.

### 3. ⚠️ Do not copy the theme's `_config.yml` wholesale

The theme's config ships a live `google_analytics:` ID and a PostHog `api_key:`.
Copying them sends *your* visitors' analytics to the theme author. Strip or
replace the analytics and identity blocks, and leave `posthog` / `ai_chat`
**off** unless you own the project and deploy the proxy.

### 4. Commit your own `_data/`

At minimum:

- `_data/navigation/main.yml` — without it the navbar is empty.
- `_data/ui-text.yml` — read as `site.data.ui` by the footer, breadcrumbs, and
  search modal; without it labels are blank.
- `_data/authors.yml` — without it bylines and author cards have no data.

### 5. Hand-author `/search.json` and `/sitemap/`

Both endpoints are produced by `_plugins/search_and_sitemap_generator.rb`, which
Pages skips in safe mode — and the committed fallback stubs are not delivered by
`remote_theme`. So the navbar search returns nothing and `/sitemap/` 404s.

The `search` layout and `_includes/search-data.json` *are* delivered, so add a
single file in your repo root:

```yaml
# /search.json
---
layout: search
permalink: /search.json
sitemap: false
---
```

Add a `/sitemap/` page too (or rely on the `jekyll-sitemap` plugin's
`/sitemap.xml` — the footer falls back to it automatically when no `/sitemap/`
page exists).

### 6. Author profile pages 404 unless you commit them

`_plugins/author_pages_generator.rb` is plugin-only on Pages. The theme chrome
**no longer links** to author profiles that don't exist in your build, so empty
bylines degrade gracefully — but if you *want* `/authors/:key/` pages, commit
them yourself.

### 7. Statistics pages render empty

`_plugins/content_statistics_generator.rb` is plugin-only and the data file isn't
delivered. Don't rely on the stats dashboard on a pure remote-theme Pages build.

### 8. Don't add `jekyll-mermaid`

It isn't on the GitHub Pages plugin whitelist. The theme renders Mermaid
client-side from a vendored bundle already — adding the plugin just breaks the
build.

### 9. Turn `ai_chat` and `posthog` off

Both ship enabled in the theme config. Leave them off unless you deploy the chat
proxy / own the analytics project. See item 3.

### 10. Use the correctly-spelled `giscus:` key

Comments read `site.giscus` (and `site.giscus.enabled`). Define your block under
`giscus:` — a misspelling silently disables comments with no error.

```yaml
# _config.yml
giscus:
  enabled: true
  data-repo-id: "..."
  data-category-id: "..."
```

## Configuring theme chrome links

The theme chrome links to a few section pages it assumes exist. When your site
puts them elsewhere (or doesn't have them), point the theme at the right base or
turn the feature off — so nothing 404s:

| Setting | Default | Controls |
|---|---|---|
| `category_base` | `/news` | Base for post category badge links |
| `tags_page` | `/tags/` | Tag badges link here only if the page exists |
| `obsidian_graph_url` | `/docs/obsidian/graph/` | "Full graph" link; hidden if the page is absent |
| `local_graph: false` (in `defaults`) | — | Disables the local-graph FAB/panel entirely |

Tag badges, the local-graph "Full graph" link, the breadcrumb collection-root
crumb, and author byline links are all **existence-gated**: when the target page
isn't in your build they render as plain text instead of broken links.

## Verify

- Open the navbar search and type — results appear (item 5).
- The navbar and footer show your labels and links (items 2, 4).
- View source on a post — no `google_analytics` ID or PostHog key you didn't set
  (item 3).
- Run a link checker over the built `_site` — no theme-injected 404s.

## See also

- [Deploy to GitHub Pages](/docs/deployment/github-pages/)
- [Custom Domain](/docs/deployment/custom-domain/)
