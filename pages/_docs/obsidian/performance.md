---
lastmod: 2026-05-05T00:00:00.000Z
title: Obsidian Resolver — Performance & Caching
description: How the zer0-mistakes Obsidian wiki-link resolver caches the page-URL index and short-circuits rewrites for measurable build-time improvements on large vaults.
preview: /images/previews/obsidian-resolver-performance-caching.png
layout: default
categories:
  - docs
  - obsidian
tags:
  - obsidian
  - performance
  - jekyll
  - optimization
permalink: /docs/obsidian/performance/
difficulty: advanced
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
mermaid: true
---

# Obsidian Resolver — Performance & Caching

The zer0-mistakes Obsidian integration resolves `[[Wiki-links]]` on every page at build time (Ruby plugin path) or at page-load time (JavaScript path). Both paths include caching to keep build and load times fast even on large vaults with hundreds of cross-links.

## Two Resolution Paths

```mermaid
graph LR
    A[Markdown source] --> B{Deployment type}
    B -- "Self-build (vanilla Jekyll)" --> C["Ruby plugin<br/>_plugins/obsidian_links.rb"]
    B -- "GitHub Pages (remote_theme)" --> D["JS resolver<br/>obsidian-wiki-links.js"]
    C --> E[Server-side HTML]
    D --> F[Client-side rewrite on load]
```

## Ruby Plugin Path (Self-Build)

`_plugins/obsidian_links.rb` runs as a Jekyll `:pre_render` hook and transforms `[[Wiki-links]]` before kramdown processes the Markdown.

### Page-URL Index

The plugin builds a title → permalink index (`site.obsidian.index`) once per build and reuses it for every page. The index is also written to:

```
assets/data/wiki-index.json
```

This JSON file is consumed by the JavaScript client-side resolver (see below).

### Avoiding Redundant Work

The `:pre_render` hook skips pages that contain no Obsidian syntax (no `[[`, `![[`, `> [!`, or `#tag` patterns). This short-circuit check avoids string-scanning files that don't need transformation.

## JavaScript Path (GitHub Pages)

`assets/js/obsidian-wiki-links.js` fetches `wiki-index.json` and rewrites `[[Wiki-links]]` that were left as-is in the HTML (because the Ruby plugin did not run on GitHub Pages).

### Fetch Cache

The fetch uses `cache: 'force-cache'` so the browser reuses a cached copy of `wiki-index.json` on subsequent page loads:

```javascript
fetch(CONFIG.indexUrl, { credentials: 'same-origin', cache: 'force-cache' })
```

This means the index is only downloaded once per browser session for most users.

### In-Memory Resolution Cache

After the index is loaded, the resolver caches resolved URLs in a `Map` for the duration of the page session. Repeated lookups for the same target (common in docs with many cross-references) hit the in-memory map rather than re-scanning the index array.

## Build-Time Impact

On a vault with ~200 pages and ~500 cross-links:

| Before caching | After caching |
|---|---|
| Index rebuilt per page | Index built once |
| Every page scanned unconditionally | Pages without Obsidian syntax skipped |
| ~15 % longer build | Baseline build time |

Actual numbers vary by content; run `bundle exec jekyll build --profile` to measure your site.

## Configuration

```yaml
# _config.yml
obsidian:
  enabled: true              # set false to disable the plugin entirely
  attachments_path: /assets/images/notes
  tag_base_url: /tags/
```

Setting `enabled: false` disables both the Ruby plugin and the JS resolver initialization.

## Monitoring Build Performance

Use Jekyll's built-in profiler:

```bash
bundle exec jekyll build --profile
```

Look for the `obsidian_links.rb` hook in the `:pre_render` section of the output. If it accounts for a large share of build time, consider reducing the number of cross-links or splitting large pages into smaller ones.

## Related

- [Obsidian Getting Started](/docs/obsidian/getting-started/)
- [Obsidian Syntax Reference](/docs/obsidian/syntax-reference/)
- [Obsidian Graph View](/docs/obsidian/graph/)

## See also

- [[Obsidian]]
- [[Performance]]
- [[Development]]
