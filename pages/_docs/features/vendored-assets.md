---
lastmod: 2026-05-05T00:00:00.000Z
title: Vendored Bootstrap & Icon Assets
description: Bootstrap 5.3.3 CSS/JS and Bootstrap Icons are committed under assets/vendor/ for GitHub Pages safety and offline development. How to use and refresh them.
layout: default
categories:
  - docs
  - features
tags:
  - bootstrap
  - assets
  - vendor
  - github-pages
  - performance
permalink: /docs/features/vendored-assets/
difficulty: intermediate
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
---

# Vendored Bootstrap & Icon Assets

Bootstrap 5.3.3 CSS/JS and Bootstrap Icons are **committed** under `assets/vendor/` rather than loaded from a CDN. This ensures:

- **GitHub Pages safety** — Pages' default Jekyll build does not run `npm` or `curl`
- **Offline development** — works without an internet connection
- **Version pinning** — no surprise CDN updates breaking the theme

For full details on refreshing vendor files, see the [Vendor Assets guide](/docs/development/vendor-assets/).

## Directory Layout

```
assets/vendor/
├── bootstrap/
│   ├── css/
│   │   └── bootstrap.min.css
│   └── js/
│       └── bootstrap.bundle.min.js
└── bootstrap-icons/
    └── font/
        ├── bootstrap-icons.css
        └── fonts/
```

Additional vendor libraries (MathJax, Mermaid, Font Awesome, …) are also stored here and listed in `vendor-manifest.json`.

## How Assets Are Loaded

### CSS (via `_includes/core/head.html`)

```liquid
{% raw %}<link href="{{ '/assets/vendor/bootstrap/css/bootstrap.min.css' | relative_url }}" rel="stylesheet">
<link rel="stylesheet" href="{{ '/assets/vendor/bootstrap-icons/font/bootstrap-icons.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">{% endraw %}
```

### JavaScript (via `_includes/components/js-cdn.html`)

```liquid
{% raw %}<script src="{{ '/assets/vendor/bootstrap/js/bootstrap.bundle.min.js' | relative_url }}"></script>{% endraw %}
```

## Refreshing Vendor Files

```bash
# Full vendor refresh (requires Node and curl)
npm install
./scripts/vendor-install.sh

# npm shortcut (manifest-only)
npm run vendor:install
```

`vendor-manifest.json` in the repo root lists every curl-downloaded asset with its expected SHA-256 checksum.

## Custom CSS Override

Place site-specific CSS overrides in `assets/css/user-overrides.css` (linked from `_includes/core/head.html`). Do **not** load a second full Bootstrap stylesheet.

## Related

- [Vendor Assets (Maintainer Guide)](/docs/development/vendor-assets/)
- [Bootstrap Integration](/docs/bootstrap/)
- [Dependency Updates](/docs/development/dependency-updates/)

## See also

- [[Bootstrap Integration]]
- [[Development]]
