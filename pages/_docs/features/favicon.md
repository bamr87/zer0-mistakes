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

With no configuration at all, every page links `/favicon.ico` explicitly (resolved through `relative_url`, so `baseurl` sites work) **and emits both `theme-color` tags**:

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#212529">
```

Those defaults are Bootstrap 5.3.3's own `--bs-body-bg` for each scheme, so the mobile address bar matches the page **surface** out of the box. This matters most for `remote_theme` consumers, which do not inherit the theme's `_config.yml` — before v1.29.1 the tag was config-gated and such a site got none at all.

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
  theme_color       : "#0d1117"                 # pin ONE chrome color for both schemes
  theme_color_light : "#ffffff"                 # light-scheme chrome (default: #ffffff)
  theme_color_dark  : "#212529"                 # dark-scheme chrome  (default: #212529)
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

`theme_color` pins a single colour for both schemes, so it wins over the pair. Omit it to get the scheme-aware defaults shown above (or your own `theme_color_light` / `theme_color_dark`).

### Which shape is emitted

`media="(prefers-color-scheme: …)"` keys off the **OS** setting, so the pair is only correct when the site follows the OS:

| your config | emitted |
| --- | --- |
| `color_mode_default: auto` (the default) | both tags, one per scheme |
| `color_mode_default: dark` or `light` | one unconditional tag for that surface |
| `color_mode_lock: true` | one unconditional tag (a locked `auto` resolves to dark) |
| `favicon.theme_color` set | one unconditional tag with your value |

A pinned site gets a single tag on purpose: a media pair would hand light browser chrome to an OS-light visitor looking at a page the site renders dark.

> **Note.** On an unlocked site a visitor can override the mode from the Appearance panel, and no static meta can follow that. Keeping chrome in sync with the panel needs a runtime hook in the toggle path.

## Recommendations

- **SVG first.** A square SVG icon stays crisp at every size and can honor `prefers-color-scheme`. Keep the `.ico` as the legacy fallback.
- **Reuse your brand mark.** If your `logo` is already a square SVG, point `favicon.svg` at the same file.
- **Apple touch icons don't scale down well from tiny sources.** Use at least a 180×180 PNG.
- **Remote-theme consumers**: this include ships with the theme — you only carry the icon *assets* and the optional `favicon:` block in your own repository.
