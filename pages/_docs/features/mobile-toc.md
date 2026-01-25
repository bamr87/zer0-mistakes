---
title: Mobile TOC Floating Action Button
description: Redesigned mobile table of contents access with FAB pattern for better usability on touch devices.
layout: default
categories:
    - docs
    - features
tags:
    - mobile
    - toc
    - fab
    - responsive
permalink: /docs/features/mobile-toc/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Mobile TOC Floating Action Button

The Zer0-Mistakes theme features a redesigned mobile table of contents with a Floating Action Button (FAB) pattern.

## Overview

On mobile devices (< 992px), the table of contents is accessible via a floating button positioned at the bottom-right corner of the screen.

## Features

- **FAB Pattern**: Material design-inspired floating button
- **Fixed Position**: Always accessible while scrolling
- **Proper Z-Index**: Doesn't conflict with other elements
- **Accessibility**: Full ARIA support

## Implementation

### Button Markup

```html
<div class="d-lg-none position-fixed bottom-0 end-0 p-3" style="z-index: 1030;">
  <button class="btn btn-primary rounded-circle shadow-lg"
          style="width: 56px; height: 56px;"
          data-bs-toggle="offcanvas"
          data-bs-target="#tocSidebar"
          aria-label="Table of contents">
    <i class="bi bi-list-ul fs-4"></i>
  </button>
</div>
```

### Key Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `d-lg-none` | Bootstrap | Hide on large screens |
| `position-fixed` | CSS | Keep button in view |
| `bottom-0 end-0` | Bootstrap | Position bottom-right |
| `z-index: 1030` | CSS | Above content, below modals |
| `rounded-circle` | Bootstrap | Circular button |
| `shadow-lg` | Bootstrap | Elevation effect |

## Sizing

Following Material Design guidelines:

- **Width**: 56px (standard FAB)
- **Height**: 56px (standard FAB)
- **Icon**: 24px (fs-4)
- **Padding**: 16px around button (p-3)

## Offcanvas Integration

The button opens a Bootstrap offcanvas from the right:

```html
<div class="offcanvas offcanvas-end" id="tocSidebar" tabindex="-1">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">On This Page</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    <!-- TOC content -->
  </div>
</div>
```

## Customization

### Button Color

```css
/* Use secondary color */
.toc-fab {
  background-color: var(--bs-secondary);
}

/* Use custom color */
.toc-fab {
  background-color: #6366f1;
  border-color: #6366f1;
}
```

### Position

```css
/* Move to bottom-left */
.toc-fab-container {
  left: 0;
  right: auto;
}

/* Adjust spacing */
.toc-fab-container {
  padding: 1.5rem;
}
```

### Icon

```html
<!-- Alternative icons -->
<i class="bi bi-journal-text"></i>
<i class="bi bi-card-list"></i>
<i class="bi bi-menu-button-wide"></i>
```

## Accessibility

### ARIA Attributes

```html
<button aria-label="Open table of contents"
        aria-expanded="false"
        aria-controls="tocSidebar">
```

### Focus Management

- Button is focusable via Tab
- Opens offcanvas on Enter/Space
- Focus returns to button on close

### Screen Readers

The button announces:
1. "Open table of contents, button"
2. On open: "Table of contents, dialog"

## Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| < 992px | FAB visible, offcanvas TOC |
| ≥ 992px | FAB hidden, sidebar TOC |

### CSS Classes

```css
/* Bootstrap responsive utility */
.d-lg-none {
  /* Display: none on lg and up */
}

/* Show only on mobile */
@media (max-width: 991.98px) {
  .toc-fab { display: block; }
}
```

## Best Practices

### Do

- ✅ Keep button accessible while scrolling
- ✅ Use recognizable icon
- ✅ Provide visual feedback on tap
- ✅ Ensure adequate tap target (44x44px minimum)

### Don't

- ❌ Cover important content
- ❌ Use too many FABs
- ❌ Make button too small
- ❌ Forget accessibility labels

## Troubleshooting

### Button Not Visible

1. Check viewport width (must be < 992px)
2. Verify Bootstrap CSS loaded
3. Check z-index conflicts

### Offcanvas Not Opening

1. Verify Bootstrap JS loaded
2. Check `data-bs-target` matches ID
3. Look for JavaScript errors

### Position Issues

1. Check for conflicting `position: fixed` elements
2. Verify z-index stacking
3. Test on actual mobile device

## Related

- [Sidebar Navigation](/docs/features/sidebar-navigation/)
- [Table of Contents](/docs/features/toc/)
- [Keyboard Navigation](/docs/features/keyboard-navigation/)
