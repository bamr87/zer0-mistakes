---
lastmod: 2026-06-15T00:00:00.000Z
title: Vendored Bootstrap & Icon Assets
description: Bootstrap 5.3.3 CSS/JS and Bootstrap Icons are committed under assets/vendor/ for GitHub Pages safety and offline development. How to use and refresh them.
preview: /images/previews/vendored-bootstrap-icon-assets.png
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

```text
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

Additional vendor libraries (MathJax, Font Awesome, jQuery, GitHub Calendar) are also stored here and listed in `vendor-manifest.json`. Mermaid is the one exception: it lives under `assets/vendor/mermaid/` but is **not** in the manifest — it is copied from the npm `mermaid` package via `npm run vendor:mermaid` instead of downloaded from a CDN.

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
# Full vendor refresh (requires curl, jq, and shasum/sha256sum)
./scripts/vendor-install.sh

# Same thing via the npm script
npm run vendor:install

# Preview what would change without downloading
./scripts/vendor-install.sh --dry-run

# Refresh Mermaid (copied from the npm package, not the manifest)
npm install && npm run vendor:mermaid
```

`vendor-manifest.json` in the repo root lists every curl-downloaded asset with its expected SHA-256 checksum. The script is idempotent: it skips any file that already exists with a matching checksum, and re-downloads on mismatch (`--force` re-downloads everything).

### How to verify

```bash
# Confirm the committed vendor tree is present
ls assets/vendor/bootstrap/css/bootstrap.min.css \
   assets/vendor/bootstrap/js/bootstrap.bundle.min.js \
   assets/vendor/bootstrap-icons/font/bootstrap-icons.css

# Dry-run reports "already up to date" when checksums match
./scripts/vendor-install.sh --dry-run
```

A clean checkout already ships these files, so a dry run should report nothing to download.

## Custom CSS Override

Place site-specific CSS overrides in `assets/css/user-overrides.css` (you create this file; it is not shipped with the theme). It is linked from `_includes/core/head.html` only when you opt in by setting `user_overrides: true` in `_config.yml` — the link is wrapped in `{% raw %}{% if site.user_overrides %}{% endraw %}`. Do **not** load a second full Bootstrap stylesheet.

## Related

- [Vendor Assets (Maintainer Guide)](/docs/development/vendor-assets/)
- [Bootstrap Integration](/docs/bootstrap/)
- [Dependency Updates](/docs/development/dependency-updates/)

## See also

- [[Bootstrap Integration]]
- [[Development]]
