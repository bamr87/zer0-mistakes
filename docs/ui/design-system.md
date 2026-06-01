---
title: "Design system"
description: "TODO: Add a 120-160 character description of this document."
date: 2026-05-31T20:54:57.000Z
lastmod: 2026-05-31T20:54:57.000Z
categories: [docs]
tags: [ui, styling, theme]
author: bamr87
---

# Design system

zer0-mistakes is a **Bootstrap 5.3.3** Jekyll theme with a semantic token layer (`--zer0-*` CSS custom properties), decomposed SCSS partials, and runtime overrides from `_config.yml`, the Appearance panel, and optional user override files.

**Related docs:** [Design tokens (quick reference)](design-tokens.md) · [Theming](theming.md) · [Configuration](configuration.md) · [Customization](customization.md)

---

## Technology stack

| Layer | Technology | Role |
|-------|------------|------|
| UI framework | Bootstrap 5.3.3 | Grid, components, color modes (`data-bs-theme`) |
| Icons | Bootstrap Icons | Unified icon set (`bi-*`) |
| Styles | SCSS → `assets/css/main.css` | Theme tokens, layouts, components |
| Templates | Liquid | Layouts, includes, data-driven UI |
| JS | ES modules + deferred scripts | Navigation, appearance, backgrounds |

Vendor CSS/JS lives under `assets/vendor/` (committed for GitHub Pages). Refresh with `npm run vendor:install`.

---

## SCSS architecture

### Directory layout

```
_sass/
├── tokens/           # --zer0-* design tokens (color, spacing, typography, …)
├── theme/            # Skins, backgrounds, color modes, wizard palette
├── components/       # Reusable UI partials (callout, footer, notes, …)
├── layouts/          # Page-type styles (landing, section, navbar-extras)
├── utilities/        # Cross-cutting helpers (focus rings, motion)
├── core/             # Legacy + docs layout (navbar, syntax, code-copy, obsidian)
└── custom.scss       # Legacy barrel (being decomposed; still imported last)
```

### Import order (`assets/css/main.scss`)

Order matters — later imports can override earlier rules, and tokens must load before consumers.

```scss
// 1. Semantic design tokens (--zer0-*)
@import "tokens/index";

// 2. Legacy Sass variables + theme modes + backgrounds + skins
@import "core/variables";
@import "core/theme";          // → theme/color-modes → backgrounds, skins

// 3. Docs-style layout (bd-sidebar, bd-toc, bd-content)
@import "core/docs-layout";

// 4. Utilities
@import "utilities/motion";
@import "utilities/focus";

// 5. Component partials
@import "components/cookie-banner";
@import "components/back-to-top";
@import "components/notes";
@import "components/skeleton";
@import "components/callout";
@import "components/post-navigation";
@import "components/footer";
@import "components/theme-preview";

// 6. Layout partials
@import "layouts/landing";
@import "layouts/section";
@import "layouts/navbar-extras";

// 7. Legacy barrel (nav, obsidian, TOC tweaks, …)
@import "custom.scss";

// 8. Code blocks
@import "core/code-copy";
@import "core/syntax";
```

### CSS load order in the browser

From `_includes/core/head.html`:

1. `assets/vendor/bootstrap/css/bootstrap.min.css`
2. `assets/vendor/bootstrap-icons/font/bootstrap-icons.css`
3. `assets/css/main.css` (compiled from the SCSS above)
4. `_includes/core/tokens-inline.html` — inline `<style>` + localStorage restore script
5. `assets/css/user-overrides.css` (when `user_overrides: true`)

---

## Design tokens

Tokens are CSS custom properties prefixed with `--zer0-`. They default to Bootstrap (`--bs-*`) or Bootstrap-docs aliases (`--bd-*`) so existing styling keeps working.

### Token files

| File | Purpose |
|------|---------|
| `_sass/tokens/_index.scss` | Barrel import |
| `_sass/tokens/_color.scss` | Brand, state, surface, ink, link, code colors |
| `_sass/tokens/_spacing.scss` | Spacing scale, FAB offsets, sidebar widths |
| `_sass/tokens/_typography.scss` | Fluid headings, font stacks, weights |
| `_sass/tokens/_shadow.scss` | Elevation scale (`xs` → `lg`, FAB, focus) |
| `_sass/tokens/_motion.scss` | Durations, easings; flattens under `prefers-reduced-motion` |
| `_sass/tokens/_breakpoints.scss` | `--zer0-bp-sm` … `--zer0-bp-xxl` (Bootstrap defaults) |
| `_sass/tokens/_layers.scss` | z-index scale (header, FABs, offcanvas, toasts) |

### Example: using tokens in SCSS

```scss
// _sass/components/_my-widget.scss
.my-widget {
  padding: var(--zer0-space-3);
  color: var(--zer0-color-ink);
  background: var(--zer0-color-bg-elevated);
  box-shadow: var(--zer0-shadow-sm);
  z-index: var(--zer0-layer-sticky);
  transition: box-shadow var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard);
}
```

### Example: using tokens in Liquid/HTML

```html
<div class="p-3" style="border-left: 4px solid var(--zer0-color-primary);">
  Uses the active primary color (config, skin, or Appearance panel).
</div>
```

### Runtime overrides

`_includes/core/tokens-inline.html` maps `_config.yml` → CSS variables:

```yaml
# _config.yml
theme_color:
  main: "#0d6efd"    # → --zer0-color-primary
  green: "#22c55e"   # → --zer0-color-success
  red: "#ef4444"     # → --zer0-color-danger
  purple: "#6f42c1"  # → --zer0-color-accent
  blue: "#0d6efd"    # → --zer0-color-link
```

> **YAML tip:** Hex values must be quoted (`"#007bff"`). Unquoted `#007bff` is parsed as a YAML comment.

The Appearance panel writes `localStorage["zer0-appearance"]`; an inline script in `tokens-inline.html` applies those values before paint.

See [design-tokens.md](design-tokens.md) for the full token tables.

---

## Theme layer (skins + backgrounds)

Skins are **orthogonal to color mode** (light/dark):

- **Color mode** — Bootstrap `data-bs-theme` on `<html>` (light / dark / auto)
- **Skin** — Decorative SVG backgrounds + palette overrides via `data-theme-skin` on `<html>`

| File | Purpose |
|------|---------|
| `_sass/theme/_backgrounds.scss` | Per-skin SVG URLs, opacity vars, zone utility classes |
| `_sass/theme/_skins.scss` | Per-skin `--zer0-color-*` and Bootstrap component wiring |
| `_data/theme_skins.yml` | Skin registry (order, default) |
| `_data/theme_backgrounds.yml` | Per-skin assets, colors, zone metadata |

Example HTML attributes (set in `_layouts/root.html`):

```html
<html data-bs-theme="dark"
      data-theme-skin="mint"
      data-zer0-bg="on">
```

See [theming.md](theming.md) for skins, customizer, and preview pages.

---

## Components and layouts (SCSS)

| Directory | Examples |
|-----------|----------|
| `_sass/components/` | `_callout.scss`, `_footer.scss`, `_notes.scss`, `_theme-preview.scss` |
| `_sass/layouts/` | `_landing.scss`, `_section.scss`, `_navbar-extras.scss` (FAB stack) |
| `_sass/utilities/` | `_focus.scss`, `_motion.scss` |

Liquid counterparts live in `_includes/components/`. See [components.md](components.md).

---

## Overriding at build time

### Fork a token partial

Drop a same-path file in your site repo — Jekyll prefers local files over the remote theme:

```
your-site/
└── _sass/tokens/_color.scss   # overrides theme defaults
```

Example override:

```scss
// your-site/_sass/tokens/_color.scss
:root {
  --zer0-color-primary: #0ea5e9;
  --zer0-color-accent: #f97316;
  --zer0-space-section: clamp(3rem, 8vw, 6rem);
}
```

### Fork `user-overrides.css` (no SCSS rebuild)

```yaml
# _config.yml
user_overrides: true
```

```css
/* assets/css/user-overrides.css */
:root {
  --zer0-color-primary: #0ea5e9;
  --zer0-shadow-fab: 0 0.5rem 1.5rem rgba(14, 165, 233, 0.4);
}
.zer0-callout--tip {
  border-left-width: 0.4rem;
}
```

---

## Breakpoints and JS sync

CSS custom properties cannot be used inside `@media (min-width: …)`. SCSS uses Bootstrap mixins; JavaScript reads `--zer0-bp-*` via `syncBreakpointsFromCss()` in `assets/js/modules/navigation/config.js`.

Example: override breakpoints in one place:

```scss
// _sass/tokens/_breakpoints.scss (fork)
:root {
  --zer0-bp-lg: 1024px;
}
```

Navigation modules pick up the new value on init without editing JS.

---

## Layer (z-index) scale

Use `--zer0-layer-*` for any new fixed/sticky/overlay element:

| Token | Value | Used by |
|-------|-------|---------|
| `--zer0-layer-sticky` | 1020 | `.sticky-top` |
| `--zer0-layer-header` | 1030 | `.fixed-top`, `#navbar` |
| `--zer0-layer-offcanvas` | 1045 | Bootstrap offcanvas |
| `--zer0-layer-fab-back-to-top` | 1050 | `#backToTopBtn` |
| `--zer0-layer-fab-toc` | 1055 | `.bd-toc-fab` |
| `--zer0-layer-fab-local-graph` | 1060 | Obsidian local graph FAB |
| `--zer0-layer-toast` | 1090 | `window.zer0UI.showToast` |
| `--zer0-layer-skip-link` | 1100 | `.zer0-skip-link` |

FAB stacking rules live in `_sass/layouts/_navbar-extras.scss`.

---

## Live preview

Open the theme style guide on a built site:

- **Theme customizer:** `/about/settings/theme/`
- **Component preview:** `/about/settings/theme-preview/`

These pages exercise typography, buttons, alerts, cards, forms, tabs, badges, code blocks, and navbar snippets across all skins.

---

## Further reading

- [design-tokens.md](design-tokens.md) — token quick reference tables
- [theming.md](theming.md) — skins, color modes, Appearance panel
- [configuration.md](configuration.md) — `_config.yml` styling keys
- [extending.md](extending.md) — add layouts, components, skins, tokens
- [code-blocks.md](code-blocks.md) — Rouge highlighting and copy button

---

> **User guide**: For usage and configuration examples (how to customize as a theme user), see [Styles & Customization](/docs/customization/styles/) in the user documentation.
