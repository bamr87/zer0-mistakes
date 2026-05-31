---
title: "Design tokens — quick reference"
description: "TODO: Add a 120-160 character description of this document."
date: 2026-05-31T20:54:57.000Z
lastmod: 2026-05-31T20:54:57.000Z
categories: [docs]
tags: [ui, styling, theme]
author: bamr87
---

# Design tokens — quick reference

Semantic CSS custom properties (`--zer0-*`) used across zer0-mistakes. For architecture, SCSS import order, and override strategies, see **[design-system.md](design-system.md)**.

---

## Source files

| File | Purpose |
|------|---------|
| `_sass/tokens/_index.scss` | Barrel — imported first from `assets/css/main.scss` |
| `_sass/tokens/_color.scss` | Brand, state, surface, ink, link colors |
| `_sass/tokens/_spacing.scss` | Spacing scale + FAB offsets + sidebar widths |
| `_sass/tokens/_typography.scss` | Fluid heading scale, line heights, weights |
| `_sass/tokens/_shadow.scss` | Elevation scale (`xs` → `lg`, FAB, focus) |
| `_sass/tokens/_motion.scss` | Durations + easings; auto-flattens under `prefers-reduced-motion` |
| `_sass/tokens/_breakpoints.scss` | `--zer0-bp-*` (Bootstrap 5 default values) |
| `_sass/tokens/_layers.scss` | z-index scale for header, FABs, offcanvas, toasts |
| `_includes/core/tokens-inline.html` | Runtime overrides from `_config.yml` + `localStorage` |

---

## Color tokens

| Token | Default | `_config.yml` key |
|-------|---------|-------------------|
| `--zer0-color-primary` | `var(--bs-primary)` | `theme_color.main` |
| `--zer0-color-secondary` | `var(--bs-secondary)` | `theme_color.secondary` |
| `--zer0-color-accent` | `var(--bd-accent)` | `theme_color.purple` |
| `--zer0-color-success` | `var(--bs-success)` | `theme_color.green` |
| `--zer0-color-info` | `var(--bs-info)` | `theme_color.teal` |
| `--zer0-color-warning` | `var(--bs-warning)` | `theme_color.yellow` |
| `--zer0-color-danger` | `var(--bs-danger)` | `theme_color.red` |
| `--zer0-color-link` | `var(--bs-link-color)` | `theme_color.blue` |
| `--zer0-color-bg` | `var(--bs-body-bg)` | Bootstrap color mode |
| `--zer0-color-bg-elevated` | `var(--bs-tertiary-bg)` | Bootstrap color mode |
| `--zer0-color-ink` | `var(--bs-body-color)` | Bootstrap color mode |
| `--zer0-color-code-bg` | `var(--bd-pre-bg)` | — |
| `--zer0-color-code-ink` | `var(--bd-callout-code-color)` | — |

`--zer0-color-primary-rgb` powers translucent surfaces: `rgba(var(--zer0-color-primary-rgb), 0.12)`.

**Example — `_config.yml`:**

```yaml
theme_color:
  main: '#0d6efd'
  green: '#22c55e'
  red: '#ef4444'
```

---

## Spacing tokens

| Token | Value | Notes |
|-------|-------|-------|
| `--zer0-space-0` … `--zer0-space-5` | 0, .25rem, .5rem, 1rem, 1.5rem, 3rem | Mirrors Bootstrap |
| `--zer0-space-section` | `clamp(2rem, 6vw, 5rem)` | Landing section rhythm |
| `--zer0-space-fab-offset` | 1rem | FAB distance from edge |
| `--zer0-space-fab-size` | 3.5rem | FAB diameter |
| `--zer0-space-fab-gap` | 0.75rem | Gap between stacked FABs |
| `--zer0-sidebar-width` | 17rem | Left sidebar |
| `--zer0-sidebar-toc-width` | 12rem | Right TOC |

**Example — SCSS override:**

```scss
:root {
  --zer0-space-section: clamp(3rem, 8vw, 6rem);
}
```

---

## Typography tokens

| Token | Value |
|-------|-------|
| `--zer0-font-sans` | `var(--bs-body-font-family, system-ui, …)` |
| `--zer0-font-mono` | `var(--bs-font-monospace, …)` |
| `--zer0-text-h1` | `clamp(2rem, 4vw + 1rem, 3rem)` |
| `--zer0-text-h2` | `clamp(1.5rem, 2.5vw + 1rem, 2.25rem)` |
| `--zer0-leading-normal` | 1.55 |

---

## Shadow, motion, breakpoints, layers

See full tables in [design-system.md](design-system.md#layer-z-index-scale).

**Motion** — under `prefers-reduced-motion: reduce`, durations collapse to `0.01ms`.

**Breakpoints** — cannot be used in `@media`; JS reads via `syncBreakpointsFromCss()`.

**Layers** — always use `--zer0-layer-*` for new overlays (see [layouts-and-navigation.md](layouts-and-navigation.md#fab-stack-floating-action-buttons)).

---

## Override methods

| Method | When to use | Example |
|--------|-------------|---------|
| `_config.yml` `theme_color` | Site-wide brand colors | `main: "#6366f1"` |
| Appearance panel | Per-user primary color | Settings → Appearance |
| `user-overrides.css` | Custom rules without SCSS | `user_overrides: true` |
| Fork `_sass/tokens/*.scss` | Build-time token changes | Copy partial to your repo |

**Example — `user-overrides.css`:**

```css
:root {
  --zer0-color-primary: #0ea5e9;
  --zer0-shadow-fab: 0 0.5rem 1.5rem rgba(14, 165, 233, 0.4);
}
```

---

## Related documentation

- [design-system.md](design-system.md) — full design system guide
- [theming.md](theming.md) — skins and color modes
- [configuration.md](configuration.md) — `_config.yml` keys
- [extending.md](extending.md) — add new tokens
