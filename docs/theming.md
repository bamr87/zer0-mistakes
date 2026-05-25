# Theming

zer0-mistakes separates **color mode** (light/dark/auto) from **skin** (decorative palette + SVG backgrounds). Both can be configured at build time in `_config.yml`, adjusted at runtime via JavaScript APIs, and previewed in the admin theme pages.

**Related docs:** [Design system](design-system.md) · [Configuration](configuration.md) · [JavaScript API](js-api.md) · [Customization](customization.md)

---

## Concepts

| Concept | Attribute | Config key | What it controls |
|---------|-----------|------------|------------------|
| **Color mode** | `data-bs-theme` on `<html>` | — (runtime) | Bootstrap light/dark palette, body text, form controls |
| **Skin** | `data-theme-skin` on `<html>` | `theme_skin` | SVG backgrounds, skin-specific `--zer0-color-*`, buttons/links |
| **Backgrounds** | `data-zer0-bg` on `<html>` | `theme_background.enabled` | Master toggle for SVG gradient/pattern/noise layers |

Color mode and skin are independent — you can run **Mint** skin in **dark** color mode, for example.

---

## Built-in skins

Registered in `_data/theme_skins.yml` (order) and `_data/theme_backgrounds.yml` (assets + colors):

| Skin | Label | Accent feel |
|------|-------|-------------|
| `air` | Air | Soft blue, airy gradients |
| `aqua` | Aqua | Ocean blues and teals |
| `contrast` | Contrast | High-contrast black/white/yellow |
| `dark` | Dark | Deep navy (default) |
| `dirt` | Dirt | Earth tones |
| `neon` | Neon | Magenta/purple/blue |
| `mint` | Mint | Forest greens |
| `plum` | Plum | Purple/violet |
| `sunrise` | Sunrise | Orange/peach |

### Compile-time skin selection

```yaml
# _config.yml
theme_skin: mint   # air | aqua | contrast | dark | dirt | neon | mint | plum | sunrise
```

Restart Jekyll after changing `_config.yml`.

### Background layer tuning

```yaml
theme_background:
  enabled: true           # Master toggle (sets data-zer0-bg on <html>)
  gradient_opacity: 0.6     # Hero/header gradient layer
  texture_opacity: 0.04     # Body noise overlay
  pattern_opacity: 0.08     # Surface/card pattern overlay
  blend_mode: overlay       # CSS mix-blend-mode for all layers
```

Per-skin SVG paths and zone metadata live in `_data/theme_backgrounds.yml`:

```yaml
# excerpt — _data/theme_backgrounds.yml
skins:
  mint:
    label: "Mint"
    colors:
      primary: "#2d6a4f"
      secondary: "#52b788"
      accent: "#95d5b2"
    gradient: "assets/backgrounds/gradients/mint.svg"
    pattern: "assets/backgrounds/patterns/mint.svg"
    noise: "assets/backgrounds/noise/mint.svg"
```

SCSS wiring:

- `_sass/theme/_backgrounds.scss` — `--zer0-bg-gradient`, zone classes (`.zer0-bg-hero`, `.zer0-bg-body`, `.zer0-bg-surface`)
- `_sass/theme/_skins.scss` — `[data-theme-skin="mint"]` palette overrides for buttons, links, cards, forms

---

## Brand colors (`theme_color`)

Orthogonal to skins — sets semantic tokens via `_includes/core/tokens-inline.html`:

```yaml
theme_color:
  main: "#007bff"       # --zer0-color-primary
  secondary: "#6c757d"
  red: "#a11111"        # --zer0-color-danger
  yellow: "#ffe900"     # --zer0-color-warning
  green: "#28a745"      # --zer0-color-success
  teal: "#376986"       # --zer0-color-info
  blue: "#007bff"       # --zer0-color-link
  purple: "#6f42c1"     # --zer0-color-accent
```

When a skin is active, `_sass/theme/_skins.scss` may override primary/link tokens for that skin. `theme_color.main` still applies when no skin-specific rule wins, and always applies to keys the skin does not remap.

---

## Color mode (light / dark / auto)

### Navbar dropdown (`halfmoon.js`)

The Settings offcanvas and navbar include a color-mode dropdown (`_includes/components/halfmoon.html`) with **Light**, **Dark**, and **Auto**. Selection:

- Sets `data-bs-theme` on `<html>`
- Persists to `localStorage["theme"]`

### Appearance panel (`appearance_panel`)

When enabled in `_config.yml`, a runtime panel mounts in the Settings offcanvas:

```yaml
appearance_panel: true
```

Features (from `assets/js/modules/theme/appearance.js`):

- **Color mode buttons** — same `localStorage["theme"]` key as `halfmoon.js` (they stay in sync)
- **Primary color picker** — writes `--zer0-color-primary` live; persists to `localStorage["zer0-appearance"]`
- **Reset** — clears runtime overrides

Mount elsewhere by adding a host element:

```html
<div data-appearance-panel-host></div>
```

The script mounts into the first `[data-appearance-panel-host]`, or falls back to `#info-section .offcanvas-body`.

Initial paint is handled by the script block in `_includes/core/tokens-inline.html` so there is no flash of the default primary color.

---

## Runtime JavaScript APIs

### `window.zer0Bg` — skins and backgrounds

From `assets/js/background-customizer.js`:

```js
// Switch skin (persists to localStorage["zer0-theme-skin"])
window.zer0Bg.setSkin('aqua');

// Toggle SVG backgrounds on/off
window.zer0Bg.toggle();           // flip
window.zer0Bg.toggle(true);       // force on

// Adjust layer opacity at runtime
window.zer0Bg.setOpacity('gradient', 0.5);
window.zer0Bg.setOpacity('texture', 0.08);
window.zer0Bg.setOpacity('pattern', 0.12);

// Query current skin
window.zer0Bg.currentSkin();      // e.g. "dark"
```

Events:

```js
document.addEventListener('zer0:skin-change', (e) => {
  console.log('Skin is now:', e.detail.skin);
});

document.addEventListener('zer0:bg-toggle', (e) => {
  console.log('Backgrounds enabled:', e.detail.enabled);
});
```

### `localStorage["zer0-appearance"]`

JSON written by the Appearance panel:

```json
{ "primary": "#0ea5e9", "secondary": "#64748b", "accent": "#f97316" }
```

Read from custom scripts:

```js
const prefs = JSON.parse(localStorage.getItem('zer0-appearance') || '{}');
if (prefs.primary) {
  document.documentElement.style.setProperty('--zer0-color-primary', prefs.primary);
}
```

---

## Admin theme pages

Available after running `./scripts/migrate.sh` (or on the theme demo site):

| Page | URL | Purpose |
|------|-----|---------|
| Theme Customizer | `/about/settings/theme/` | Skin grid, color editor, YAML export |
| Theme Preview | `/about/settings/theme-preview/` | Live style guide across all skins |

### Theme customizer

Powered by `_includes/components/theme-customizer.html` and `assets/js/theme-customizer.js`:

- Click a skin card → calls `zer0Bg.setSkin()` for live preview
- Color pickers sync with YAML export
- **Export YAML** tab builds a paste-ready `_config.yml` snippet:

```yaml
theme_skin: "aqua"

theme_color:
  main: #007bff
  secondary: #6c757d
  # …
```

Preview changes are **session-only** until you copy YAML into `_config.yml` and rebuild.

### Theme preview gallery

`_includes/components/theme-preview-gallery.html` renders sections for typography, buttons, alerts, cards, forms, tabs, badges, code, links, and a sample navbar. Pair with `theme-controls-bar.html` for quick skin switching.

Open on your site: **`/about/settings/theme-preview/`**

---

## Background zone classes

Apply SVG layers to layout regions:

| Class | Layer | Typical use |
|-------|-------|-------------|
| `.zer0-bg-hero` | Gradient + pattern | Landing hero, page headers |
| `.zer0-bg-body` | Noise texture | `<body>` (set in `root.html`) |
| `.zer0-bg-surface` | Pattern | Cards, sidebars, panels |

Example in a layout:

```html
<header class="bg-primary zer0-bg-hero py-5">
  <div class="container-xl"><!-- content --></div>
</header>
```

`_includes/components/svg-background.html` emits per-site opacity overrides from `theme_background` config.

---

## Adding a custom skin

See [extending.md § Add a new skin](extending.md#4-add-a-new-skin). Summary:

1. Add SVG assets under `assets/backgrounds/gradients|patterns|noise/<name>.svg`
2. Register in `_data/theme_backgrounds.yml`
3. Add `[data-theme-skin="<name>"]` rules in `_sass/theme/_backgrounds.scss` and `_sass/theme/_skins.scss`
4. Append the id to `_data/theme_skins.yml` → `order`
5. Set `theme_skin: <name>` or call `zer0Bg.setSkin('<name>')`

---

## Decision guide

| Goal | Approach |
|------|----------|
| Change default skin site-wide | `theme_skin` in `_config.yml` |
| Let visitors pick a skin | `zer0Bg.setSkin()` or Theme Customizer admin page |
| Toggle light/dark | Navbar dropdown, Appearance panel, or `halfmoon.js` |
| Tweak primary brand color | `theme_color.main` or Appearance panel |
| Disable SVG backgrounds | `theme_background.enabled: false` or `zer0Bg.toggle(false)` |
| Preview all components | `/about/settings/theme-preview/` |

---

## Further reading

- [configuration.md](configuration.md) — all `_config.yml` styling keys
- [design-system.md](design-system.md) — SCSS architecture and tokens
- [js-api.md](js-api.md) — full JavaScript surface area
- [customization.md](customization.md) — layered customization workflow
