---
title: Bootstrap
description: Bootstrap 5 usage patterns in Zer0-Mistakes.
layout: default
categories:
    - docs
    - bootstrap
tags:
    - bootstrap
    - css
permalink: /docs/bootstrap/
difficulty: beginner
estimated_time: 5 minutes
prerequisites: []
updated: 2025-12-20
lastmod: 2025-12-20T22:15:46.159Z
sidebar:
    nav: docs
---

# Bootstrap

Zer0-Mistakes uses **Bootstrap 5.3.3** for responsive layouts, components, and utilities.

## How Bootstrap is Loaded

Bootstrap CSS and JavaScript are loaded via CDN in the theme's core includes:

```html
<!-- CSS in _includes/core/head.html -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
      rel="stylesheet">

<!-- JS in _includes/components/js-cdn.html -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js">
</script>
```

## Key Components Used

### Navigation

- **Navbar** - Responsive navigation with collapse
- **Offcanvas** - Mobile sidebar navigation
- **Breadcrumbs** - Hierarchical navigation trail

### Layout

- **Grid System** - 12-column responsive grid
- **Containers** - Content width constraints
- **Flex Utilities** - Flexible layouts

### UI Components

- **Cards** - Content containers
- **Modals** - Dialog boxes
- **Accordion** - Collapsible content
- **Alerts** - Status messages

## Responsive Breakpoints

| Breakpoint | Class prefix | Dimensions |
|------------|-------------|------------|
| Extra small | (none) | < 576px |
| Small | `sm` | ≥ 576px |
| Medium | `md` | ≥ 768px |
| Large | `lg` | ≥ 992px |
| Extra large | `xl` | ≥ 1200px |
| XXL | `xxl` | ≥ 1400px |

## Custom Styles

Custom CSS is layered on top of Bootstrap in:

- `assets/css/main.css` - Main stylesheet
- `_sass/custom.scss` - Custom Sass partials

## Bootstrap Icons

[Bootstrap Icons](https://icons.getbootstrap.com/) are included:

```html
<i class="bi bi-house"></i>
<i class="bi bi-search"></i>
<i class="bi bi-gear"></i>
```

## Resources

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Bootstrap Examples](https://getbootstrap.com/docs/5.3/examples/)

## Related

- [Jekyll Guide](/docs/jekyll/)
- [Front Matter](/docs/front-matter/)
