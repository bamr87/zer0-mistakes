---
title: Back to Top Button
description: Floating button that appears on scroll, allowing users to quickly return to the top of the page.
layout: default
categories:
    - docs
    - features
tags:
    - ui
    - navigation
    - scroll
    - accessibility
permalink: /docs/features/back-to-top/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Back to Top Button

A floating button that appears when users scroll down, providing quick navigation back to the top of the page.

## Overview

- **Appears on Scroll**: Shows after scrolling 200px
- **Smooth Animation**: Animated scroll to top
- **Accessible**: Proper button semantics
- **Performance**: Passive scroll listener

## Implementation

### HTML Markup

```html
<button id="backToTopBtn" 
        class="btn btn-primary rounded-circle position-fixed"
        aria-label="Back to top"
        style="bottom: 20px; right: 20px; display: none; z-index: 1000;">
  <i class="bi bi-arrow-up"></i>
</button>
```

### JavaScript

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  // Scroll to top
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Show/hide based on scroll position
  const toggle = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.style.display = y > 200 ? 'block' : 'none';
  };

  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
});
```

## Configuration

### Scroll Threshold

Adjust when button appears:

```javascript
// Show after scrolling 500px
btn.style.display = y > 500 ? 'block' : 'none';
```

### Position

```css
#backToTopBtn {
  bottom: 20px;  /* Distance from bottom */
  right: 20px;   /* Distance from right */
}

/* Or use Bootstrap utilities */
.back-to-top {
  bottom: 1rem;
  right: 1rem;
}
```

### Styling

```css
#backToTopBtn {
  width: 48px;
  height: 48px;
  background-color: var(--bs-primary);
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
}

#backToTopBtn:hover {
  background-color: var(--bs-primary-dark);
  transform: translateY(-2px);
}
```

## Customization

### Different Icons

```html
<!-- Arrow up -->
<i class="bi bi-arrow-up"></i>

<!-- Chevron up -->
<i class="bi bi-chevron-up"></i>

<!-- Caret up -->
<i class="bi bi-caret-up-fill"></i>
```

### With Text

```html
<button id="backToTopBtn" class="btn btn-primary">
  <i class="bi bi-arrow-up me-1"></i>
  Top
</button>
```

### Fade Animation

```css
#backToTopBtn {
  opacity: 0;
  transition: opacity 0.3s ease;
}

#backToTopBtn.visible {
  opacity: 1;
}
```

```javascript
btn.classList.toggle('visible', y > 200);
```

## Accessibility

### ARIA Attributes

```html
<button aria-label="Scroll to top of page"
        role="button"
        tabindex="0">
```

### Focus Visible

```css
#backToTopBtn:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}
```

### Keyboard Support

The button is focusable and activates with Enter/Space.

## Performance

### Passive Listener

```javascript
window.addEventListener('scroll', toggle, { passive: true });
```

The `passive: true` option improves scroll performance by indicating the listener won't call `preventDefault()`.

### Debouncing (Optional)

For heavy pages, debounce the scroll handler:

```javascript
function debounce(fn, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(fn, wait);
  };
}

window.addEventListener('scroll', debounce(toggle, 100), { passive: true });
```

## Mobile Considerations

### Touch-Friendly Size

Ensure button meets minimum tap target (44x44px):

```css
#backToTopBtn {
  width: 48px;
  height: 48px;
  min-width: 44px;
  min-height: 44px;
}
```

### Avoid Overlap

Position to not interfere with mobile TOC button:

```css
/* When mobile TOC FAB is present */
@media (max-width: 991px) {
  #backToTopBtn {
    bottom: 80px; /* Above TOC button */
  }
}
```

## Troubleshooting

### Button Not Appearing

1. Check scroll threshold
2. Verify element exists in DOM
3. Check z-index conflicts
4. Inspect display style

### Not Scrolling

1. Verify `behavior: 'smooth'` support
2. Check for scroll lock on body
3. Test without other scroll scripts

### Performance Issues

1. Add passive listener option
2. Use debouncing
3. Reduce scroll threshold checks

## Related

- [Sidebar Navigation](/docs/features/sidebar-navigation/)
- [Keyboard Navigation](/docs/features/keyboard-navigation/)
