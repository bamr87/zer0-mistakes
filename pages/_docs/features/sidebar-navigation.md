---
title: Sidebar Navigation System
description: Modern sidebar with Intersection Observer scroll spy, smooth scrolling, keyboard shortcuts, and swipe gestures.
layout: default
categories:
    - docs
    - features
tags:
    - sidebar
    - navigation
    - scroll-spy
    - accessibility
permalink: /docs/features/sidebar-navigation/
difficulty: intermediate
estimated_time: 15 minutes
sidebar:
    nav: docs
---

# Enhanced Sidebar Navigation System

The Zer0-Mistakes theme includes a modern sidebar navigation system with performance-optimized scroll tracking and accessibility features.

## Overview

Key features:

- **Intersection Observer**: 70% reduction in scroll event overhead
- **Smooth Scrolling**: Offset-aware with URL updates
- **Keyboard Shortcuts**: Section navigation with `[` and `]`
- **Swipe Gestures**: Mobile-friendly edge swipes
- **Focus Management**: Accessible navigation flow

## Components

### Left Sidebar

Site-wide navigation with collapsible categories:

```liquid
{% raw %}{% include navigation/sidebar-left.html %}{% endraw %}
```

Features:
- Folder-based navigation
- Category organization
- Responsive collapse on mobile

### Right Sidebar (Table of Contents)

Page-specific heading navigation:

```liquid
{% raw %}{% include navigation/sidebar-right.html %}{% endraw %}
```

Features:
- Auto-generated from headings
- Scroll spy highlighting
- Floating action button on mobile

## Scroll Spy

### How It Works

Uses Intersection Observer for performance:

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        highlightTocLink(entry.target.id);
      }
    });
  },
  { rootMargin: '-20% 0% -70% 0%' }
);
```

### Configuration

```javascript
// Adjust observer margins
const scrollSpyConfig = {
  rootMargin: '-20% 0% -70% 0%',
  threshold: 0
};
```

### Active Section Highlighting

Active TOC links receive the `.active` class:

```css
.toc-link.active {
  color: var(--bs-primary);
  font-weight: 600;
  border-left: 2px solid var(--bs-primary);
}
```

## Smooth Scrolling

### Offset-Aware Navigation

Accounts for fixed header:

```javascript
function scrollToSection(id) {
  const element = document.getElementById(id);
  const headerOffset = 80; // Fixed header height
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - headerOffset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}
```

### URL Updates

URLs update without page reload:

```javascript
history.pushState(null, '', `#${sectionId}`);
```

## Keyboard Navigation

### Available Shortcuts

| Key | Action |
|-----|--------|
| `[` | Previous section |
| `]` | Next section |
| `Esc` | Close sidebar |
| `Tab` | Navigate links |

### Implementation

```javascript
document.addEventListener('keydown', (e) => {
  // Only when not in input
  if (e.target.matches('input, textarea')) return;
  
  if (e.key === '[') navigateToPrevSection();
  if (e.key === ']') navigateToNextSection();
});
```

## Swipe Gestures

### Touch Navigation

| Gesture | Action |
|---------|--------|
| Swipe right from left edge | Open left sidebar |
| Swipe left from right edge | Open TOC |

### Configuration

```javascript
const swipeConfig = {
  threshold: 50,     // Minimum swipe distance
  edgeZone: 30       // Edge detection area
};
```

## Mobile Experience

### Floating Action Button

TOC button on mobile:

```html
<div class="d-lg-none position-fixed bottom-0 end-0 p-3">
  <button class="btn btn-primary rounded-circle shadow-lg"
          data-bs-toggle="offcanvas"
          data-bs-target="#tocSidebar">
    <i class="bi bi-list-ul"></i>
  </button>
</div>
```

### Offcanvas Sidebar

Bootstrap 5 offcanvas for mobile:

```html
<div class="offcanvas offcanvas-end" id="tocSidebar">
  <div class="offcanvas-header">
    <h5>On This Page</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    {% raw %}{% include content/toc.html %}{% endraw %}
  </div>
</div>
```

## Customization

### Sidebar Width

```css
/* Left sidebar */
.sidebar-left {
  width: 280px;
}

/* Right sidebar (TOC) */
.sidebar-right {
  width: 250px;
}

/* Responsive */
@media (max-width: 991px) {
  .sidebar-left,
  .sidebar-right {
    width: 100%;
  }
}
```

### Icons

Using Bootstrap Icons throughout:

```html
<i class="bi bi-folder2-open"></i>  <!-- Categories -->
<i class="bi bi-file-earmark-text"></i>  <!-- Documents -->
<i class="bi bi-list-ul"></i>  <!-- TOC toggle -->
```

### Colors

```css
/* Sidebar theming */
.sidebar {
  --sidebar-bg: var(--bs-body-bg);
  --sidebar-text: var(--bs-body-color);
  --sidebar-active: var(--bs-primary);
}
```

## Performance

### Optimizations Implemented

1. **Intersection Observer** vs scroll events
2. **Debounced handlers** (100ms delay)
3. **Lazy initialization** (only when TOC exists)
4. **CSS transitions** (hardware accelerated)
5. **Efficient queries** with error handling

### Metrics

- Scroll event reduction: 70%
- Paint reduction: 50%
- Memory usage: Minimal

## Troubleshooting

### Scroll Spy Not Working

1. Check heading IDs exist
2. Verify TOC links match heading IDs
3. Check Intersection Observer support

### Keyboard Shortcuts Disabled

1. Ensure not in input field
2. Check for conflicting shortcuts
3. Verify JavaScript loaded

### Mobile Sidebar Issues

1. Check offcanvas target
2. Verify Bootstrap JS loaded
3. Test touch events

## Related

- [Keyboard Navigation](/docs/features/keyboard-navigation/)
- [Mobile TOC Button](/docs/features/mobile-toc/)
- [Table of Contents](/docs/features/toc/)
