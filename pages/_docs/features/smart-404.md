---
lastmod: 2026-06-15T00:00:00.000Z
title: Smart 404 & Site Configuration Detection
description: How the zer0-mistakes 404 page auto-detects whether the site is a fork, remote-theme consumer, or full clone and guides visitors back to a working entry point.
preview: /images/previews/smart-404-site-configuration-detection.png
layout: default
categories:
  - docs
  - features
tags:
  - setup
  - 404
  - configuration
  - ux
permalink: /docs/features/smart-404/
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
mermaid: true
---

# Smart 404 & Site Configuration Detection

The zer0-mistakes `404.html` is not a plain "page not found" placeholder. It detects how the site is deployed and offers context-aware guidance to the visitor.

![The custom 404 page: a large "404", "Page not found", an inline Search button, quick links to Home/About/Contact, and "Return to Homepage" / "Submit an Issue on GitHub" buttons](/assets/images/docs/features/smart-404.png)

## Detection Logic

```mermaid
graph TD
    A[404.html Loads] --> B{site.remote_theme set?}
    B -- Yes --> C[Remote-theme consumer]
    B -- No --> D{site.theme set?}
    D -- Yes --> E[Gem-theme consumer]
    D -- No --> F[Full clone / fork]
    C & E & F --> G[Render matching help block]
```

The Liquid template inspects `site.remote_theme`, `site.theme`, and a small set of
`site.github.*` variables that GitHub Pages injects at build time.

## Implementation

The smart 404 lives in the repository root:

```text
404.html
```

Key Liquid variables used:

| Variable | Purpose |
|---|---|
| `site.remote_theme` | Detect remote-theme mode |
| `site.theme` | Detect gem-theme mode |
| `site.github.owner_name` | Link back to the correct GitHub profile |
| `site.url` / `site.baseurl` | Build absolute links to the home page |

## What Visitors See

### Remote-theme consumer

```text
🔍 Page Not Found
This page doesn't exist on this site.
→ Return to home  → View the theme source on GitHub
```

### Full clone / fork

```text
🔍 Page Not Found
It looks like this page was removed or the URL changed.
→ Return to home  → Browse the docs
```

## Customizing the 404

Override just this file in your site repo:

```text
your-site/
└── 404.html   ← Your custom version takes precedence
```

The theme's `404.html` is only used when no local override exists.

## Related

- [Quick Start Guide](/docs/getting-started/quick-start/)
- [Bare-Minimum Starter](/docs/quickstart/bare-minimum/)

## See also

- [[Features]]
- [[Getting Started]]
