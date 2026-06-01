---
title: "JavaScript API"
description: "The public JavaScript API of Zer0-Mistakes: the navigation, background, and UI surfaces intended for consumers, plus their stability expectations."
date: 2026-05-31T20:54:58.000Z
lastmod: 2026-05-31T20:54:58.000Z
categories: [docs]
tags: [ui, styling, theme]
author: bamr87
---

# JavaScript API

Public JS surface area for zer0-mistakes. Everything below is intended for consumers; anything not listed here may change without notice.

**Related docs:** [Theming](theming.md) · [Layouts and navigation](layouts-and-navigation.md) · [Code blocks](code-blocks.md) · [Customization](customization.md)

---

## Module structure

```
assets/js/
├── modules/
│   ├── navigation/
│   │   ├── index.js          ← entry point (loaded as <script type="module">)
│   │   ├── config.js          ← selectors, breakpoints, shortcuts
│   │   ├── navbar.js          ← dropdowns, mobile menu, tooltips
│   │   ├── scroll-spy.js      ← active TOC link tracking
│   │   ├── smooth-scroll.js   ← anchor scrolling with header offset
│   │   ├── keyboard.js        ← /, [, ], b, t, ? shortcuts
│   │   ├── gestures.js        ← edge-swipe sidebar toggle
│   │   ├── focus.js           ← offcanvas focus management
│   │   └── sidebar-state.js   ← localStorage for expanded nodes
│   └── theme/
│       └── appearance.js      ← runtime Appearance panel (opt-in)
├── ui-helpers.js              ← showToast, copyToClipboard, [data-copy]
├── background-customizer.js   ← window.zer0Bg
├── theme-customizer.js        ← admin theme page (skin grid, YAML export)
├── theme-preview.js           ← admin preview page (live skin/mode labels)
├── code-copy.js               ← line numbers, language header, copy button
├── search-modal.js            ← search dialog
├── halfmoon.js                ← navbar color-mode toggle
└── navigation.js              ← DEPRECATED shim (logs warning)
```

---

## Global namespaces

### `window.zer0Navigation` — navigation orchestrator

Exposed by `assets/js/modules/navigation/index.js`. Instantiated on `DOMContentLoaded`.

```js
window.zer0Navigation.getModule(name);
// 'scrollSpy' | 'smoothScroll' | 'keyboard' | 'gestures' | 'focus' | 'state' | 'navbar'

window.zer0Navigation.getConfig();
window.zer0Navigation.scrollTo('#section-id');
```

**Events:**

| Event | Detail | When |
|-------|--------|------|
| `navigation:ready` | `{ modules: string[] }` | All navigation modules initialized |

**Example:**

```js
document.addEventListener('navigation:ready', (e) => {
  const kb = window.zer0Navigation.getModule('keyboard');
  console.log('Shortcuts active:', e.detail.modules.includes('keyboard'));
});
```

See [layouts-and-navigation.md](layouts-and-navigation.md) for sidebar, TOC, and FAB behavior.

---

### `window.zer0UI` — UI helpers

Exposed by `assets/js/ui-helpers.js`.

```js
window.zer0UI.showToast('Saved', { variant: 'success', duration: 3000 });
window.zer0UI.copyToClipboard('text to copy');  // Promise
```

Variants: `'info' | 'success' | 'warning' | 'danger'`.

**Declarative copy:**

```html
<button type="button" data-copy="https://example.com/path">Copy link</button>
```

Used by [code blocks](code-blocks.md) for non-`pre` copy targets.

---

### `window.zer0Bg` — background customizer

Exposed by `assets/js/background-customizer.js`. See [theming.md](theming.md).

```js
window.zer0Bg.setSkin('aqua');
window.zer0Bg.toggle();
window.zer0Bg.toggle(false);              // force off
window.zer0Bg.setOpacity('texture', 0.1);
window.zer0Bg.currentSkin();
```

**Events:**

| Event | Detail | When |
|-------|--------|------|
| `zer0:skin-change` | `{ skin: string }` | After `setSkin()` |
| `zer0:bg-toggle` | `{ enabled: boolean }` | After `toggle()` |

**Storage keys:**

| Key | Value |
|-----|-------|
| `zer0-theme-skin` | Active skin name |
| `zer0-bg-enabled` | `"true"` / `"false"` |

---

### Appearance panel — `localStorage`

When `appearance_panel: true`:

| Key | Value |
|-----|-------|
| `theme` | `"light"` \| `"dark"` \| `"auto"` |
| `zer0-appearance` | JSON, e.g. `{ "primary": "#0ea5e9" }` |

Initial paint: script in `_includes/core/tokens-inline.html`.

**Extend the panel** — see [extending.md § Add an Appearance panel control](extending.md#7-add-an-appearance-panel-control).

---

### Admin theme scripts

`theme-customizer.js` (page: `/about/settings/theme/`):

- Listens for skin card clicks → `zer0Bg.setSkin()`
- Rebuilds YAML export on color picker input
- Dispatches/listens to `zer0:skin-change`

`theme-preview.js` (page: `/about/settings/theme-preview/`):

- Updates live labels for active skin and color mode

These are page-scoped; they do not expose a global namespace.

---

## Navigation configuration

`assets/js/modules/navigation/config.js`:

```js
import { config, isBelowBreakpoint, syncBreakpointsFromCss } from './config.js';

config.selectors.toc;                    // '#TableOfContents'
config.scrollSpy.rootMargin;             // '-80px 0px -80px 0px'
config.keyboard.keys.search;             // '/'
config.breakpoints.lg;                   // 992

isBelowBreakpoint('lg');                 // boolean
syncBreakpointsFromCss();                // read --zer0-bp-* from :root
```

**Disable shortcuts:**

```js
// Fork config.js
keyboard: { enabled: false, keys: { … } }
```

---

## Writing a navigation module

```js
// assets/js/modules/navigation/my-module.js
import { config } from './config.js';

export class MyModule {
  constructor() { this._handlers = []; }
  init() {
    const el = document.querySelector(config.selectors.mainContent);
    if (!el) return;
    const handler = () => { /* … */ };
    el.addEventListener('scroll', handler);
    this._handlers.push({ target: el, type: 'scroll', handler });
  }
  destroy() {
    this._handlers.forEach(({ target, type, handler }) =>
      target.removeEventListener(type, handler));
    this._handlers = [];
  }
}
```

Register in `assets/js/modules/navigation/index.js`.

---

## Head scripts (non-module)

Loaded with `defer` from `_includes/core/head.html`:

| Script | Purpose |
|--------|---------|
| `auto-hide-nav.js` | Hide navbar on scroll down |
| `back-to-top.js` | `#backToTopBtn` visibility |
| `halfmoon.js` | Color mode dropdown |
| `code-copy.js` | Code block enhancements |
| `side-bar-folders.js` | Folder disclosure in sidebar |

---

## Migration from legacy globals

| Was | Now |
|-----|-----|
| `assets/js/navigation.js` IIFE | ES module orchestrator |
| `alert("Link copied…")` | `window.zer0UI.showToast(…)` |
| Inline `onclick` clipboard | `data-copy` attribute |
| `assets/js/color-modes.js` | Removed; use `halfmoon.js` + Appearance panel |

`assets/js/navigation.js` remains a no-op shim with a deprecation warning.

---

## Backward compatibility

- `halfmoon.js` and Appearance panel share `localStorage["theme"]`.
- Legacy `_data/navigation/*.yml` schema unchanged; `nav_list.html` delegates to `nav-tree.html`.

---

## Further reading

- [theming.md](theming.md) — skins, color modes, storage keys
- [code-blocks.md](code-blocks.md) — `code-copy.js` behavior
- [layouts-and-navigation.md](layouts-and-navigation.md) — keyboard shortcuts, FABs
