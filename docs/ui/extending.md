---
title: "Extending the theme"
description: "TODO: Add a 120-160 character description of this document."
date: 2026-05-31T20:54:58.000Z
lastmod: 2026-05-31T20:54:58.000Z
categories: [docs]
tags: [ui, styling, theme]
author: bamr87
---

# Extending the theme

Recipes for adding new building blocks to zer0-mistakes. Each recipe is intentionally minimal — copy, paste, and adjust.

**Related docs:** [Design system](design-system.md) · [Components](components.md) · [Theming](theming.md) · [Design tokens](design-tokens.md)

## 1. Add a new layout

Layouts compose includes. Most new layouts should extend `default.html` (sidebar + content) or `root.html` (full-bleed shell).

```html
---
layout: default
---
<!-- _layouts/case-study.html -->
<article class="case-study">
  <header class="mb-4">
    <h1>{{ page.title }}</h1>
    {% if page.client %}<p class="lead">{{ page.client }}</p>{% endif %}
  </header>

  {{ content }}

  {% if page.callout %}
    {%- capture body -%}{{ page.callout }}{%- endcapture -%}
    {% include components/callout.html type="info" content=body %}
  {% endif %}
</article>
```

Then in a page:

```yaml
---
layout: case-study
title: Migration to Bootstrap 5
client: Acme Corp
callout: "This case study covers a 9-month engagement."
---
```

To suppress the auto-injected intro hero on this layout, add an `_skip_intro` branch in `_layouts/default.html` (currently skips `article` and `note` automatically; add your layout name there if you want the same behavior).

## 2. Register a new component

Components live in `_includes/components/`. Follow the conventions in `_includes/components/README.md`:

```liquid
{%- comment -%}
  ===================================================================
  STAT-CARD — Single metric with optional trend arrow
  ===================================================================

  Parameters
    include.label     (string)  — metric label (required)
    include.value     (string)  — primary value text (required)
    include.trend     (string)  — `up` | `down` | `flat` (optional)
    include.variant   (string)  — `primary` | `success` | `danger` (default: primary)
  ===================================================================
{%- endcomment -%}
{%- assign variant = include.variant | default: "primary" -%}
<div class="card border-{{ variant }} h-100" role="group" aria-label="{{ include.label }}">
  <div class="card-body">
    <p class="text-body-secondary small mb-1">{{ include.label }}</p>
    <p class="display-6 mb-0 text-{{ variant }}">{{ include.value }}</p>
    {% if include.trend %}
      {%- case include.trend -%}
        {%- when 'up'   -%}{%- assign icon = 'bi-arrow-up-right'   -%}
        {%- when 'down' -%}{%- assign icon = 'bi-arrow-down-right' -%}
        {%- else        -%}{%- assign icon = 'bi-dash'             -%}
      {%- endcase -%}
      <i class="bi {{ icon }} small text-body-secondary mt-2" aria-hidden="true"></i>
      <span class="visually-hidden">Trend: {{ include.trend }}</span>
    {% endif %}
  </div>
</div>
```

Use it:

```liquid
{% include components/stat-card.html label="Active users" value="12,840" trend="up" variant="success" %}
```

Add the component to the catalog in `_includes/components/README.md`.

## 3. Add a navigation data file

Navigation data lives in `_data/navigation/*.yml`. The flat tree schema (used by `nav-tree.html`):

```yaml
# _data/navigation/sdk.yml
- title: Overview
  url: /sdk/
  icon: bi-book
- title: Guides
  icon: bi-folder
  expanded: true
  children:
    - title: Getting Started
      url: /sdk/start/
    - title: Authentication
      url: /sdk/auth/
- title: Reference
  icon: bi-code-slash
  children:
    - title: API
      url: /sdk/api/
```

Render it from any page (typical: front matter pointing at `sidebar.nav`):

```yaml
---
layout: default
title: SDK
sidebar:
  nav: sdk
---
```

Or render directly inside a layout:

```liquid
{% include navigation/nav-tree.html nav="sdk" %}
```

## 4. Add a new skin

Skins are decorative SVG background layers, orthogonal to the color mode. Built-in skins are listed in [theming.md](theming.md#built-in-skins). To add `sunset`:

1. **Drop the SVG asset(s)** under `assets/backgrounds/sunset/`.
2. **Register the skin** in `_data/theme_backgrounds.yml`:

   ```yaml
   sunset:
     gradient: /assets/backgrounds/sunset/gradient.svg
     pattern:  /assets/backgrounds/sunset/pattern.svg
     texture:  /assets/backgrounds/sunset/texture.svg
     zones:
       body: true
       hero: true
   ```

3. **Add CSS variable overrides** in `_sass/theme/_backgrounds.scss`:

   ```scss
   [data-theme-skin="sunset"] {
     --zer0-bg-gradient: url('/assets/backgrounds/sunset/gradient.svg');
     --zer0-bg-pattern:  url('/assets/backgrounds/sunset/pattern.svg');
     --zer0-bg-blend:    overlay;
   }
   ```

4. **Activate it**: set `theme_skin: sunset` in `_config.yml` (compile-time) or call `window.zer0Bg.setSkin('sunset')` (runtime).

## 5. Add a token

Define new semantic tokens in a relevant partial under `_sass/tokens/`. Example: adding a `--zer0-color-brand-muted` for de-emphasised brand surfaces:

```scss
// _sass/tokens/_color.scss
:root {
  // … existing tokens …
  --zer0-color-brand-muted: rgba(var(--zer0-color-primary-rgb), 0.08);
}
```

If the token should be config-driven, also surface it in `_includes/core/tokens-inline.html`:

```liquid
{%- if tc.brand_muted %} --zer0-color-brand-muted: {{ tc.brand_muted }};{%- endif %}
```

Document the new token in [design-tokens.md](design-tokens.md) and [design-system.md](design-system.md).

## 6. Add a keyboard shortcut

Open `assets/js/modules/navigation/config.js` and add a key under `keyboard.keys`, then handle it in `_handleKeydown` in `assets/js/modules/navigation/keyboard.js`. Also update `_includes/components/shortcuts-modal.html` and the `shortcuts_*` strings in `_data/ui-text.yml`.

## 7. Add an Appearance panel control

The Appearance panel (`assets/js/modules/theme/appearance.js`) mounts into the first match of `[data-appearance-panel-host]` or `#info-section .offcanvas-body`. To add a new control, extend the `buildPanel(host)` function with another `<div>` and wire its event handlers to read/write `localStorage["zer0-appearance"]`.

Sketch — adding a "rounded corners" toggle that flips a token:

```js
// Inside buildPanel(), after the color picker block
const roundedRow = document.createElement('div');
roundedRow.className = 'form-check form-switch mb-3';
roundedRow.innerHTML =
    '<input class="form-check-input" type="checkbox" id="zer0-appearance-rounded">' +
    '<label class="form-check-label" for="zer0-appearance-rounded">Rounded corners</label>';
wrapper.appendChild(roundedRow);

const toggle = roundedRow.querySelector('input');
toggle.checked = (prefs.rounded !== false);
toggle.addEventListener('change', () => {
    const next = Object.assign(readPrefs(), { rounded: toggle.checked });
    writePrefs(next);
    document.documentElement.style.setProperty(
        '--bs-border-radius',
        toggle.checked ? '0.375rem' : '0'
    );
});
```

## 8. Add a new test

Drop a `*.spec.js` under `test/visual/` and it will be picked up by `npm run test:smoke`. See `test/visual/layouts.spec.js` for examples that gracefully skip when a route is not available.

---

> **User guide**: For usage and configuration examples (how to extend the theme as a user), see [Customization](/docs/customization/) in the user documentation.
