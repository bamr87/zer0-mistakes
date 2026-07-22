---
title: Favicon and Browser Identity Setup
description: Config-driven favicon, Apple touch icon, web manifest, and theme-color tags emitted on every page, with a zero-config /favicon.ico fallback.
keywords: [favicon, browser identity, apple touch icon, web manifest, theme color, svg favicon, jekyll theme]
lastmod: 2026-07-22T00:00:00.000Z
layout: default
categories:
    - docs
    - features
tags:
    - seo
    - branding
    - configuration
permalink: /docs/features/favicon/
difficulty: beginner
estimated_reading_time: 4 minutes
sidebar:
    nav: docs
---

# Favicon & Browser Identity

The theme emits the browser-identity tags — favicon, scalable SVG icon, Apple touch icon, web manifest, and `theme-color` — from `_includes/core/favicon.html`, included in the document head on every page.

## Why explicit tags matter

Before this include existed, sites relied on the browser's *implicit* `/favicon.ico` probe. That fails silently in three ways:

- A site without a root `favicon.ico` shows the browser's generic globe and logs a 404 on every visit.
- Project-page deployments with a `baseurl` never resolve `/favicon.ico` at the domain root.
- There is no way to supply an SVG icon, an iOS home-screen icon, or a PWA manifest implicitly.

## Zero-config behavior

With no configuration at all, every page links `/favicon.ico` explicitly (resolved through `relative_url`, so `baseurl` sites work), and `theme-color` falls back to your `theme_color.main` design token so the mobile address bar matches the site's palette.

Keep a `favicon.ico` at your site root — a 32×32 icon is enough.

## Full configuration

All keys are optional. Add a `favicon:` block to `_config.yml`:

```yaml
favicon:
  ico         : /favicon.ico                    # legacy .ico (default)
  svg         : /assets/images/favicon.svg      # scalable icon, preferred by modern browsers
  png         : /assets/images/favicon-32.png   # PNG icon
  png_size    : 32x32                           # sizes attribute for the png entry
  apple_touch : /assets/images/apple-touch.png  # iOS home-screen icon (180×180 or larger)
  manifest    : /site.webmanifest               # PWA manifest
  theme_color : "#0d1117"                       # browser chrome color (falls back to theme_color.main)
```

Which renders:

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
<link rel="icon" type="image/png" href="/assets/images/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/images/apple-touch.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0d1117">
```

## Recommendations

- **SVG first.** A square SVG icon stays crisp at every size and can honor `prefers-color-scheme`. Keep the `.ico` as the legacy fallback.
- **Reuse your brand mark.** If your `logo` is already a square SVG, point `favicon.svg` at the same file.
- **Apple touch icons don't scale down well from tiny sources.** Use at least a 180×180 PNG.
- **Remote-theme consumers**: this include ships with the theme — you only carry the icon *assets* and the optional `favicon:` block in your own repository.
