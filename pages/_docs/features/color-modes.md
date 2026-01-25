---
title: Dark/Light Mode Toggle
description: Theme color mode switcher supporting light, dark, and auto modes with system preference detection.
layout: default
categories:
    - docs
    - features
tags:
    - dark-mode
    - theme
    - accessibility
    - ui
permalink: /docs/features/color-modes/
difficulty: beginner
estimated_time: 10 minutes
sidebar:
    nav: docs
---

# Dark/Light Mode Toggle

The Zer0-Mistakes theme includes a color mode switcher supporting light, dark, and automatic system preference detection.

## Overview

- **Three Modes**: Light, dark, and auto
- **System Detection**: Respects `prefers-color-scheme`
- **Persistent**: Saves preference in localStorage
- **Bootstrap 5.3**: Uses native `data-bs-theme` attribute

## How It Works

### Theme Application

The theme is applied via the `data-bs-theme` attribute on `<html>`:

```html
<html data-bs-theme="dark">
```

Bootstrap 5.3+ automatically adjusts all component colors based on this attribute.

### Mode Detection

```javascript
const getPreferredTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};
```

## Implementation

### JavaScript

```javascript
(() => {
  'use strict';

  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = theme => localStorage.setItem('theme', theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  };

  const setTheme = theme => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme);
    }
  };

  // Apply theme immediately (before DOM ready)
  setTheme(getPreferredTheme());

  // Handle theme toggle clicks
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-bs-theme-value');
        setStoredTheme(theme);
        setTheme(theme);
      });
    });
  });

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'auto' || !getStoredTheme()) {
      setTheme('auto');
    }
  });
})();
```

### Toggle UI

```html
<div class="dropdown">
  <button class="btn btn-link dropdown-toggle" data-bs-toggle="dropdown">
    <i class="bi bi-circle-half"></i>
    <span class="visually-hidden">Toggle theme</span>
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    <li>
      <button class="dropdown-item" data-bs-theme-value="light">
        <i class="bi bi-sun me-2"></i> Light
      </button>
    </li>
    <li>
      <button class="dropdown-item" data-bs-theme-value="dark">
        <i class="bi bi-moon me-2"></i> Dark
      </button>
    </li>
    <li>
      <button class="dropdown-item" data-bs-theme-value="auto">
        <i class="bi bi-circle-half me-2"></i> Auto
      </button>
    </li>
  </ul>
</div>
```

## Customization

### Custom Colors

Override Bootstrap CSS variables:

```css
[data-bs-theme="dark"] {
  --bs-body-bg: #1a1a2e;
  --bs-body-color: #eaeaea;
  --bs-primary: #4f46e5;
}

[data-bs-theme="light"] {
  --bs-body-bg: #ffffff;
  --bs-body-color: #212529;
  --bs-primary: #3b82f6;
}
```

### Code Block Themes

```css
[data-bs-theme="dark"] pre {
  background-color: #1e1e1e;
}

[data-bs-theme="light"] pre {
  background-color: #f8f9fa;
}
```

### Images

Swap images based on theme:

```html
<picture>
  <source srcset="logo-dark.png" media="(prefers-color-scheme: dark)">
  <img src="logo-light.png" alt="Logo">
</picture>
```

Or with CSS:

```css
[data-bs-theme="dark"] .logo {
  content: url('logo-dark.png');
}
```

## Storage

### localStorage Key

Theme preference stored as:

```javascript
localStorage.setItem('theme', 'dark'); // 'light', 'dark', or 'auto'
```

### Clear Preference

```javascript
localStorage.removeItem('theme');
```

## Transitions

### Smooth Theme Change

```css
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Disable during page load */
html.no-transition,
html.no-transition * {
  transition: none !important;
}
```

```javascript
// Disable transitions during initial load
document.documentElement.classList.add('no-transition');
setTheme(getPreferredTheme());
requestAnimationFrame(() => {
  document.documentElement.classList.remove('no-transition');
});
```

## Accessibility

### ARIA Labels

```html
<button aria-label="Switch to dark mode">
  <i class="bi bi-moon"></i>
</button>
```

### Current State

```html
<button aria-pressed="true" data-bs-theme-value="dark">
  Dark
</button>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  html {
    transition: none;
  }
}
```

## Troubleshooting

### Flash of Wrong Theme

Ensure theme script runs before body:

```html
<head>
  <script src="/assets/js/color-modes.js"></script>
</head>
```

### Theme Not Persisting

1. Check localStorage access
2. Verify script is setting storage
3. Test in private browsing

### Bootstrap Components Not Theming

Ensure using Bootstrap 5.3+:

```html
<!-- Required for data-bs-theme support -->
<link href="bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
```

## Related

- [Bootstrap Integration](/docs/bootstrap/)
- [Custom Styles](/docs/customization/styles/)
