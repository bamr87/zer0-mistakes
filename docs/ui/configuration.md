---
title: "Configuration — styling and UI"
description: "TODO: Add a 120-160 character description of this document."
date: 2026-05-31T20:54:57.000Z
lastmod: 2026-05-31T20:54:57.000Z
categories: [docs]
tags: [ui, styling, theme]
author: bamr87
---

# Configuration — styling and UI

Styling-related keys in `_config.yml` for zer0-mistakes. Restart Jekyll after editing this file (`bundle exec jekyll serve` does not hot-reload config).

**Related docs:** [Theming](theming.md) · [Design system](design-system.md) · [Customization](customization.md)

---

## Quick reference

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `theme_skin` | string | `dark` | Decorative skin (see [skins](theming.md#built-in-skins)) |
| `theme_color` | hash | see below | Brand palette → `--zer0-color-*` |
| `theme_background` | hash | `enabled: true` | SVG background layers |
| `appearance_panel` | bool | `true` | Runtime Appearance controls in Settings |
| `user_overrides` | bool | `false` | Load `assets/css|js/user-overrides.*` |
| `navigation.unified_mobile_drawer` | bool | `false` | Single tabbed mobile drawer |
| `nanobar` | hash | `enabled: true` | Page load progress bar |
| `locale` | string | `en-US` | `<html lang>` |
| `logo` | string | — | Navbar logo path |
| `breadcrumbs` | bool | `true` | Breadcrumb trail |
| `default_icon` | string | `bi` | Icon library prefix for links |

---

## Theme skin and backgrounds

### Minimal example

```yaml
theme_skin: mint

theme_background:
  enabled: true
  gradient_opacity: 0.6
  texture_opacity: 0.04
  pattern_opacity: 0.08
  blend_mode: overlay
```

Valid `theme_skin` values: `air`, `aqua`, `contrast`, `dark`, `dirt`, `neon`, `mint`, `plum`, `sunrise`.

These map to `<html>` attributes in `_layouts/root.html`:

```html
data-theme-skin="{{ site.theme_skin | default: 'dark' }}"
data-zer0-bg="{{ site.theme_background.enabled | default: true }}"
```

### Disable backgrounds entirely

```yaml
theme_background:
  enabled: false
```

---

## Brand palette (`theme_color`)

Maps to `_includes/core/tokens-inline.html`:

```yaml
theme_color:
  main: "#0d6efd"        # --zer0-color-primary
  secondary: "#6c757d"   # --zer0-color-secondary
  red: "#dc3545"         # --zer0-color-danger
  yellow: "#ffc107"      # --zer0-color-warning
  green: "#198754"       # --zer0-color-success
  teal: "#0dcaf0"        # --zer0-color-info
  blue: "#0d6efd"        # --zer0-color-link
  purple: "#6f42c1"      # --zer0-color-accent
  pink: "#e83e8c"
  orange: "#fd7e14"
  # … additional keys supported in _config.yml for admin color editor
```

> **Always quote hex values.** Unquoted `#007bff` is treated as a YAML comment.

Full palette example (matches theme defaults):

```yaml
theme_color:
  main: "#007bff"
  secondary: "#6c757d"
  red: "#a11111"
  yellow: "#ffe900"
  teal: "#376986"
  blue: "#007bff"
  green: "#28a745"
  purple: "#6f42c1"
  pink: "#e83e8c"
  orange: "#fd7e14"
  brown: "#795548"
  cyan: "#17a2b8"
  indigo: "#6610f2"
```

---

## Runtime UI toggles

### Appearance panel

```yaml
appearance_panel: true   # false to hide runtime color mode + primary picker
```

Loads `assets/js/modules/theme/appearance.js` when true (see `_includes/components/js-cdn.html`).

### User overrides

```yaml
user_overrides: true
```

Ship these files in your fork (not bundled with the theme):

```
assets/css/user-overrides.css
assets/js/user-overrides.js
```

Example CSS:

```css
:root {
  --zer0-color-primary: #0ea5e9;
}
```

Example JS:

```js
document.addEventListener('navigation:ready', () => {
  console.log('Theme navigation ready');
});
```

Load order: see [customization.md](customization.md#layer-3--user-overridescss--user-overridesjs).

---

## Navigation

```yaml
navigation:
  unified_mobile_drawer: false  # true → single tabbed drawer (Browse / Menu / Settings)
```

When `false` (default), mobile uses separate offcanvas panels for sidebar and main menu. See `_includes/navigation/unified-drawer.html`.

Sidebar navigation is driven by `_data/navigation/*.yml` and page front matter — see [layouts-and-navigation.md](layouts-and-navigation.md).

---

## Nanobar (loading progress bar)

```yaml
nanobar:
  enabled: true
  color: "var(--bs-primary)"   # Bar fill; CSS variables supported
  background: "transparent"
  height: "3px"
  position: "navbar"           # top | bottom | navbar
  z_index: 9999
  steps: [20, 55, 85, 100]
  step_delay_ms: 180           # 0 = instant (often invisible on fast pages)
  classname: "nanobar"
  id: "top-progress-bar"
  target: ""                   # CSS selector; "" = viewport-fixed
```

Disable entirely:

```yaml
nanobar:
  enabled: false
```

Implementation: `_includes/components/nanobar.html`. Full architecture: [features/nanobar-component.md](features/nanobar-component.md).

---

## Site identity (affects chrome)

```yaml
title: "My Site"
title_icon: "robot"              # Bootstrap Icon name (without bi-)
subtitle: "Docs and blog"
subtitle_icon: "code"
title_separator: "|"
logo: /assets/images/logo.png
logo_link: "/"                   # or YAML array joined to URL
locale: "en-US"
breadcrumbs: true
default_icon: "bi"
```

Navbar renders title, subtitle, and logo from these keys via `_includes/core/header.html`.

---

## Sass build settings

```yaml
sass:
  sass_dir: _sass
  style: expanded    # expanded | compressed
```

Entry point: `assets/css/main.scss` → `assets/css/main.css`.

---

## Defaults (Jekyll front matter)

Sidebar and layout behavior for collections:

```yaml
defaults:
  - scope:
      path: pages/_docs
    values:
      layout: default
      sidebar:
        nav: tree
      toc_sticky: true

  - scope:
      path: pages/_posts
    values:
      layout: article
      sidebar: true

  - scope:
      path: pages/_notes
      type: notes
    values:
      layout: note
      sidebar:
        nav: auto
```

Per-page overrides in front matter:

```yaml
---
layout: default
title: Standalone page
sidebar: false        # hide left nav + right TOC column logic
toc_sticky: false
---
```

---

## Remote theme minimal config

Bare-minimum consumer site:

```yaml
title: "My Site"
remote_theme: bamr87/zer0-mistakes
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag

theme_skin: dark
appearance_panel: true
user_overrides: false

theme_color:
  main: "#6366f1"
```

---

## Admin / stats pages

Theme version ≥ 0.22.10 provides the `admin` layout and settings UI. Install with:

```bash
./scripts/migrate.sh /path/to/your-site
```

Admin pages read live `_config.yml` values (theme skin, colors, nanobar, etc.) via `_includes/components/config-viewer.html` and `config-editor.html`.

Stats layout (`layout: stats`) loads an additional stylesheet: `assets/css/stats.css`.

---

## Environment-specific config

Layer dev overrides:

```bash
jekyll serve --config _config.yml,_config_dev.yml
```

> Jekyll **replaces** (does not merge) the `exclude:` key — repeat the full exclude list in `_config_dev.yml` if you override it.

---

## Further reading

- [theming.md](theming.md) — skins, color modes, preview pages
- [design-system.md](design-system.md) — tokens and SCSS pipeline
- [jekyll/config-reference.md](jekyll/config-reference.md) — general Jekyll config
- [configuration/url-configuration-guide.md](configuration/url-configuration-guide.md) — URLs and `baseurl`
