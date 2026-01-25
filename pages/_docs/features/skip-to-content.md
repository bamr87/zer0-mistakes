---
title: Skip-to-Content Accessibility Link
description: WCAG 2.1 Level AA compliant skip link for keyboard users to bypass navigation and jump to main content.
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
estimated_time: 5 minutes
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

```html
<!-- In _includes/core/header.html -->
<a href="#main-content" class="skip-link visually-hidden-focusable">
  Skip to main content
</a>

<!-- Main content area -->
<main id="main-content" tabindex="-1">
  <!-- Page content -->
</main>
```

## Styling

### Default Styles

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--bs-primary);
  color: white;
  padding: 8px 16px;
  z-index: 9999;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 0;
}
```

### Bootstrap Utility

Using Bootstrap's `visually-hidden-focusable`:

```html
<a href="#main-content" class="visually-hidden-focusable">
  Skip to main content
</a>
```

This class:
- Hides element visually
- Keeps it accessible to screen readers
- Shows on keyboard focus

## Customization

### Link Text

```html
<!-- Custom text -->
<a href="#main-content" class="skip-link visually-hidden-focusable">
  Jump to content
</a>
```

### Styling

```css
/* Custom styling */
.skip-link:focus {
  background: var(--bs-dark);
  color: var(--bs-light);
  border-radius: var(--bs-border-radius);
  box-shadow: var(--bs-box-shadow);
}
```

### Position

```css
/* Center the link */
.skip-link:focus {
  left: 50%;
  transform: translateX(-50%);
}

/* Right-aligned */
.skip-link:focus {
  left: auto;
  right: 1rem;
}
```

## Multiple Skip Links

For complex pages with multiple sections:

```html
<div class="skip-links">
  <a href="#main-content" class="skip-link visually-hidden-focusable">
    Skip to main content
  </a>
  <a href="#navigation" class="skip-link visually-hidden-focusable">
    Skip to navigation
  </a>
  <a href="#footer" class="skip-link visually-hidden-focusable">
    Skip to footer
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
