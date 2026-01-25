---
title: Styles
description: Customize CSS and SCSS styles in the Zer0-Mistakes Jekyll theme.
layout: default
categories:
    - docs
    - customization
tags:
    - css
    - scss
    - styles
    - bootstrap
permalink: /docs/customization/styles/
difficulty: intermediate
estimated_time: 15 minutes
sidebar:
    nav: docs
---

# Styles

Customize the visual appearance of your site using SCSS and CSS.

## File Structure

```
_sass/
├── core/           # Core theme styles
│   ├── _variables.scss
│   ├── _base.scss
│   └── ...
├── custom.scss     # Your customizations
└── notebooks.scss  # Jupyter notebook styles

assets/css/
└── main.scss       # Main stylesheet entry point
```

## Adding Custom Styles

### Option 1: custom.scss (Recommended)

Edit `_sass/custom.scss`:

```scss
// Override Bootstrap variables
$primary: #007bff;
$secondary: #6c757d;
$font-family-base: 'Inter', sans-serif;

// Custom styles
.my-component {
  background: $primary;
  padding: 1rem;
  border-radius: 0.5rem;
}

.custom-header {
  border-bottom: 3px solid $primary;
  margin-bottom: 2rem;
}
```

### Option 2: Inline in main.scss

Add styles directly to `assets/css/main.scss`:

```scss
---
---

@import "custom";

// Additional styles here
.site-footer {
  background: #f8f9fa;
  padding: 2rem 0;
}
```

## Bootstrap Customization

### Override Bootstrap Variables

Before Bootstrap imports, set your variables:

```scss
// Colors
$primary: #0d6efd;
$secondary: #6c757d;
$success: #198754;
$danger: #dc3545;
$warning: #ffc107;
$info: #0dcaf0;
$light: #f8f9fa;
$dark: #212529;

// Typography
$font-family-sans-serif: 'Inter', system-ui, sans-serif;
$font-family-monospace: 'Fira Code', monospace;
$font-size-base: 1rem;
$line-height-base: 1.6;

// Spacing
$spacer: 1rem;

// Border radius
$border-radius: 0.375rem;
$border-radius-lg: 0.5rem;
$border-radius-sm: 0.25rem;
```

### Use Bootstrap Utilities

Leverage Bootstrap's utility classes:

```html
<div class="p-4 mb-3 bg-primary text-white rounded">
  Custom styled box
</div>

<p class="text-muted fs-5 fw-light">
  Styled paragraph
</p>
```

## CSS Custom Properties

Define and use CSS variables for easy theming:

```scss
:root {
  --brand-color: #007bff;
  --text-color: #333;
  --bg-color: #fff;
  --code-bg: #f5f5f5;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  :root {
    --brand-color: #4dabf7;
    --text-color: #e9ecef;
    --bg-color: #212529;
    --code-bg: #2d2d2d;
  }
}

// Usage
.element {
  color: var(--text-color);
  background: var(--bg-color);
}
```

## Common Customizations

### Typography

```scss
// Headings
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

// Links
a {
  color: $primary;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

// Code blocks
pre, code {
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}
```

### Layout

```scss
// Container width
.container {
  max-width: 1200px;
}

// Sidebar width
.sidebar {
  width: 280px;
}

// Content area
.content {
  max-width: 800px;
  margin: 0 auto;
}
```

### Components

```scss
// Cards
.card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

// Buttons
.btn-custom {
  @extend .btn;
  background: linear-gradient(135deg, $primary, darken($primary, 10%));
  border: none;
  color: white;
}
```

## Responsive Styles

Use Bootstrap's breakpoints:

```scss
// Mobile first approach
.element {
  padding: 1rem;
  
  @include media-breakpoint-up(md) {
    padding: 2rem;
  }
  
  @include media-breakpoint-up(lg) {
    padding: 3rem;
  }
}

// Or use media queries directly
@media (min-width: 768px) {
  .sidebar {
    display: block;
  }
}
```

## Best Practices

1. **Use variables** — Define colors and sizes as variables
2. **Mobile first** — Start with mobile styles, add breakpoints for larger screens
3. **Leverage Bootstrap** — Don't reinvent Bootstrap utilities
4. **Keep specificity low** — Avoid `!important` and deep nesting
5. **Comment sections** — Document your customizations
6. **Test browsers** — Verify styles in Chrome, Firefox, Safari

## Debugging

```scss
// Temporary debug outline
* {
  outline: 1px solid red;
}

// Debug specific element
.debug {
  background: yellow !important;
  border: 2px solid red !important;
}
```

## Reference

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Sass Documentation](https://sass-lang.com/documentation/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
