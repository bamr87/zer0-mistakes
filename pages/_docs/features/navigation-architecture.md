---
lastmod: 2026-05-05T00:00:00.000Z
title: ES6 Modular Navigation Architecture
description: The zer0-mistakes navigation system refactored into ES6 modules — hover dropdowns, keyboard accessibility, smooth scroll, sidebar state persistence, and graceful degradation.
preview: /images/previews/es6-modular-navigation-architecture.png
layout: default
categories:
  - docs
  - features
tags:
  - navigation
  - javascript
  - es6
  - ui
  - performance
permalink: /docs/features/navigation-architecture/
difficulty: intermediate
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
---

# ES6 Modular Navigation Architecture

The zer0-mistakes navigation JavaScript is organized as ES6 modules under `assets/js/modules/navigation/`. This modular approach enables tree-shaking, independent unit testing, and easy extension without touching monolithic files.

## Module Overview

```
assets/js/modules/navigation/
├── index.js         — Entry point: imports and initializes all modules
├── config.js        — Shared constants (breakpoints, selectors, timing)
├── focus.js         — Focus trapping for offcanvas / modals
├── gestures.js      — Touch/swipe support for mobile nav
├── keyboard.js      — Arrow-key navigation, Escape handling
├── scroll-spy.js    — Active section highlighting in sidebars
├── sidebar-state.js — Persist collapsed/expanded state (localStorage)
└── smooth-scroll.js — Smooth scroll to anchor links
```

The entry point is imported by `assets/js/navigation.js`:

```javascript
// assets/js/navigation.js
import { initNavigation } from './modules/navigation/index.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
```

## Key Features

### Hover Dropdowns

Desktop navbar dropdowns open on hover with a short delay to prevent accidental triggers. Defined in `config.js`:

```javascript
export const TOOLTIP_DELAY = { show: 400, hide: 100 };
export const MOBILE_BREAKPOINT = 992; // px — Bootstrap lg breakpoint
```

### Keyboard Navigation

`keyboard.js` handles:

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Standard focus movement |
| `Arrow Down` / `Arrow Up` | Move between dropdown items |
| `Escape` | Close dropdown / offcanvas |
| `Enter` / `Space` | Activate focused item |

### Sidebar State Persistence

`sidebar-state.js` saves which sidebar sections are expanded to `localStorage` so the state survives page reloads:

```javascript
// Key format: zer0-sidebar-<section-id>
localStorage.setItem(`zer0-sidebar-${sectionId}`, 'expanded');
```

### Scroll Spy

`scroll-spy.js` highlights the current section in the sidebar table-of-contents as the user scrolls, using `IntersectionObserver` for performance.

### Graceful Degradation

All navigation features are wrapped in feature detection:

```javascript
if ('IntersectionObserver' in window) {
  initScrollSpy();
}
```

The navbar renders and works as a standard Bootstrap component even when JavaScript is disabled or fails.

## Main Navigation Include

```
_includes/navigation/navbar.html
```

The navbar include renders the Bootstrap 5 navbar, populates links from `_data/navigation.yml` (or the dynamic collection fallback), and outputs the data attributes that the JS modules target.

## Adding a Navigation Module

1. Create `assets/js/modules/navigation/my-feature.js`:

```javascript
export function initMyFeature() {
  // implementation
}
```

2. Import and call it from `index.js`:

```javascript
import { initMyFeature } from './my-feature.js';

export function initNavigation() {
  // … existing init calls …
  initMyFeature();
}
```

## Related

- [Dynamic Navigation Fallback](/docs/features/dynamic-navigation/)
- [Sidebar Navigation](/docs/features/sidebar-navigation/)
- [Keyboard Navigation](/docs/features/keyboard-navigation/)

## See also

- [[Navigation]]
- [[JavaScript]]
- [[Features]]
