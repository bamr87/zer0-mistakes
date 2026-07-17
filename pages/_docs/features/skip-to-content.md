---
lastmod: 2026-06-15T00:00:00.000Z
title: Skip-to-Content Accessibility Link
description: A WCAG 2.1 Level AA skip link lets keyboard users bypass the navigation and jump straight to the main content area on every page of the theme.
preview: /images/previews/skip-to-content-accessibility-link.png
layout: default
categories:
    - docs
    - features
tags:
    - accessibility
    - wcag
    - keyboard
    - skip-link
permalink: /docs/features/skip-to-content/
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
    nav: docs
---

# Skip-to-Content Accessibility Link

The Zer0-Mistakes theme includes a WCAG 2.1 Level AA compliant skip link that allows keyboard users to bypass navigation.

## Overview

The skip-to-content link:

- **Visually Hidden**: Only visible on keyboard focus
- **First Focusable**: Appears immediately on Tab
- **Direct Navigation**: Jumps to main content area
- **WCAG Compliant**: Meets accessibility standards

## How It Works

### User Flow

1. User arrives on page
2. Presses `Tab` key
3. "Skip to main content" link becomes visible
4. User presses `Enter`
5. Focus moves to main content

### Implementation

The link is the first focusable element in `_includes/core/header.html`, and its target is a single, site-wide `#main-content` wrapper in `_layouts/root.html`. The theme builds the link entirely from Bootstrap 5 utility classes — `visually-hidden-focusable` keeps it hidden until it receives keyboard focus:

```html
<!-- _includes/core/header.html -->
<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
  Skip to main content
</a>
```

```html
<!-- _layouts/root.html -->
<div id="main-content">
  {% raw %}{{ content }}{% endraw %}
</div>
```

## Styling

### Bootstrap utility (shipped default)

The theme's link relies on Bootstrap's `visually-hidden-focusable` class plus a few positioning and button utilities — there is no custom CSS to maintain:

```html
<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
  Skip to main content
</a>
```

The `visually-hidden-focusable` class:

- Hides the element visually until it receives focus
- Keeps it accessible to screen readers at all times
- Reveals it on keyboard focus (the `position-absolute top-0 start-0 m-3`
  utilities pin it to the top-left corner when shown)

### Token-based SCSS alternative

The theme also ships a `.zer0-skip-link` helper in `_sass/utilities/_focus.scss` that slides the link in from off-screen on focus. It reads from the theme's design tokens (`--zer0-color-primary`, `--zer0-layer-skip-link`, the motion tokens) so it stays in sync with the rest of the theme. Apply it instead of the Bootstrap utilities if you prefer a transform-based reveal:

```scss
.zer0-skip-link {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: var(--zer0-layer-skip-link); // 1100
  padding: 0.5rem 1rem;
  background: var(--zer0-color-primary);
  color: #fff;
  border-radius: 0.25rem;
  transform: translateY(-200%);
  transition: transform var(--zer0-motion-duration-base) var(--zer0-motion-ease-standard);

  &:focus,
  &:focus-visible {
    transform: translateY(0);
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
}
```

## Customization

> [!NOTE]
> To customize the shipped link, edit `_includes/core/header.html`. The CSS
> examples below target the `.zer0-skip-link` SCSS helper; add the
> `zer0-skip-link` class to the link (and drop the Bootstrap utilities) if you
> want to override its appearance with the snippets that follow.

### Link text

```html
<!-- Custom text -->
<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
  Jump to content
</a>
```

### Styling

```css
/* Custom styling for the .zer0-skip-link helper */
.zer0-skip-link:focus {
  background: var(--bs-dark);
  color: var(--bs-light);
  border-radius: var(--bs-border-radius);
  box-shadow: var(--bs-box-shadow);
}
```

### Position

```css
/* Center the link */
.zer0-skip-link:focus {
  left: 50%;
  transform: translateX(-50%);
}

/* Right-aligned */
.zer0-skip-link:focus {
  left: auto;
  right: 1rem;
}
```

## Multiple skip links

The theme ships a single skip link that targets `#main-content`. For pages with several major landmarks you can add more links, pointing each `href` at an ID that exists in your markup. The header is rendered with `id="navbar"`, so a "skip to navigation" link would target `#navbar`:

```html
<div class="skip-links">
  <a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
    Skip to main content
  </a>
  <a href="#navbar" class="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-3 btn btn-primary">
    Skip to navigation
  </a>
</div>
```

## WCAG Compliance

### Requirements Met

| Criterion | Status |
|-----------|--------|
| 2.4.1 Bypass Blocks (A) | ✅ |
| 2.1.1 Keyboard (A) | ✅ |
| 2.4.3 Focus Order (A) | ✅ |
| 2.4.7 Focus Visible (AA) | ✅ |

### Best Practices

1. **First Link**: Skip link should be first focusable element
2. **Clear Text**: Use descriptive link text
3. **Visible on Focus**: Must become visible when focused
4. **Valid Target**: Target element must exist and be focusable

## Testing

### Manual Testing

1. Load page
2. Press `Tab` immediately
3. Verify skip link appears
4. Press `Enter`
5. Confirm focus moves to main content

### Automated Testing

```javascript
// Accessibility test
describe('Skip Link', () => {
  it('should be first focusable element', () => {
    cy.get('body').tab();
    cy.focused().should('have.class', 'skip-link');
  });
  
  it('should skip to main content', () => {
    cy.get('.skip-link').focus().click();
    cy.focused().should('have.id', 'main-content');
  });
});
```

### Screen Reader Testing

Test with:

- NVDA (Windows)
- VoiceOver (macOS)
- JAWS (Windows)

The link should announce:
> "Skip to main content, link"

## Troubleshooting

### Link Not Appearing

1. Check element exists in DOM
2. Verify CSS isn't hiding it
3. Ensure JavaScript isn't interfering

### Link Not Working

1. Verify target ID exists (`#main-content`)
2. Check target has `tabindex="-1"`
3. Test without JavaScript

### Focus Not Moving

1. Add `tabindex="-1"` to target
2. Check for focus traps
3. Verify no `e.preventDefault()` on links

## Related

- [Keyboard Navigation](/docs/features/keyboard-navigation/)
- [Sidebar Navigation](/docs/features/sidebar-navigation/)
- [Accessibility Standards](https://www.w3.org/WAI/WCAG21/quickref/)

## See also

- [[Features]]
- [[Keyboard Navigation]]
