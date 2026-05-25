# Customization

Supported ways to change zer0-mistakes' look and behavior **without forking the entire theme**. Pick the smallest layer that meets your need.

**Full guides:** [Design system](design-system.md) · [Theming](theming.md) · [Configuration](configuration.md) · [Components](components.md) · [Layouts and navigation](layouts-and-navigation.md) · [Code blocks](code-blocks.md)

---

## Decision tree

```
Need a change?
├─ Primary color only?        → theme_color.main in _config.yml
├─ Different skin?            → theme_skin in _config.yml
├─ Visitor preference?        → appearance_panel: true (Settings offcanvas)
├─ Custom CSS rules?          → user_overrides: true + user-overrides.css
├─ Custom JS hooks?           → user_overrides: true + user-overrides.js
├─ Replace one layout/include?→ Same-path file in your site repo
└─ New building block?        → See extending.md
```

---

## Layer 1 — `_config.yml`

Minimal styling block:

```yaml
theme_skin: dark

theme_color:
  main: '#0d6efd'
  secondary: '#6c757d'
  red: '#dc3545'
  green: '#198754'

theme_background:
  enabled: true
  gradient_opacity: 0.6

appearance_panel: true
user_overrides: false

navigation:
  unified_mobile_drawer: false
```

See [configuration.md](configuration.md) for every styling key with examples.

Token mapping: [design-tokens.md](design-tokens.md).

---

## Layer 2 — Appearance panel (runtime)

When `appearance_panel: true`, the Settings offcanvas (`#info-section`) includes:

- **Color mode** — Light / Dark / Auto → `data-bs-theme` + `localStorage["theme"]`
- **Primary color picker** → `--zer0-color-primary` + `localStorage["zer0-appearance"]`
- **Reset** — clears runtime overrides

Mount elsewhere:

```html
<div data-appearance-panel-host></div>
```

Details: [theming.md](theming.md#appearance-panel-appearance_panel).

---

## Layer 3 — `user-overrides.css` / `user-overrides.js`

```yaml
user_overrides: true
```

**CSS example** (`assets/css/user-overrides.css`):

```css
:root {
  --zer0-color-primary: #0ea5e9;
  --zer0-color-accent: #f97316;
}
.zer0-callout--tip {
  border-left-width: 0.4rem;
}
```

**JS example** (`assets/js/user-overrides.js`):

```js
document.addEventListener('navigation:ready', (e) => {
  console.log('Navigation modules:', e.detail.modules);
});

document.addEventListener('zer0:skin-change', (e) => {
  console.log('Skin changed to', e.detail.skin);
});
```

### Load order

**CSS:**

1. Bootstrap + Icons
2. `assets/css/main.css`
3. `_includes/core/tokens-inline.html`
4. **`assets/css/user-overrides.css`** ← wins

**JS** (from `_includes/components/js-cdn.html`):

1. Bootstrap bundle
2. Navigation ES module orchestrator
3. `ui-helpers.js`, `posts-pagination.js`, `search-modal.js`
4. `background-customizer.js`
5. `appearance.js` (if enabled)
6. `obsidian-wiki-links.js`
7. **`user-overrides.js`** ← runs last

Head scripts (`code-copy.js`, `halfmoon.js`, etc.) load separately with `defer`.

---

## Layer 4 — Replace a theme file

Jekyll prefers local files over the remote theme when paths match:

| File | Effect |
|------|--------|
| `_data/landing.yml` | Homepage hero, features, get-started copy |
| `_data/navigation/main.yml` | Main nav |
| `_data/ui-text.yml` | UI strings / i18n |
| `_includes/components/*.html` | Swap a component |
| `_layouts/landing.html` | Replace landing layout |
| `_sass/tokens/_color.scss` | Override tokens at build time |

> Copy only what you need. Unmodified files inherit theme updates automatically.

---

## Layer 5 — Admin theme tools

After `./scripts/migrate.sh`:

| URL | Purpose |
|-----|---------|
| `/about/settings/theme/` | Skin preview, color editor, YAML export |
| `/about/settings/theme-preview/` | Live style guide for all skins |

Preview is session-only until you paste exported YAML into `_config.yml`.

---

## Keyboard shortcuts

Press `?` for the help modal.

| Key | Action |
|-----|--------|
| `/` | Open search |
| `Cmd/Ctrl+K` | Open search |
| `[` | Previous TOC section |
| `]` | Next TOC section |
| `b` | Toggle left sidebar |
| `t` | Toggle right TOC |

Disable: set `keyboard.enabled = false` in `assets/js/modules/navigation/config.js`.

Full navigation docs: [layouts-and-navigation.md](layouts-and-navigation.md).

---

## Related documentation

- [design-system.md](design-system.md) — tokens, SCSS architecture
- [theming.md](theming.md) — skins, backgrounds, APIs
- [extending.md](extending.md) — add layouts, components, skins
- [js-api.md](js-api.md) — JavaScript hooks
