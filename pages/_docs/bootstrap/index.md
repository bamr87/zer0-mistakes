---
lastmod: 2026-04-18T19:29:52.000Z
title: Bootstrap Integration
description: Bootstrap 5.3.3 usage patterns, components, and customization in the Zer0-Mistakes theme.
layout: default
categories:
    - docs
    - bootstrap
tags:
    - bootstrap
    - css
    - responsive
    - components
permalink: /docs/bootstrap/
difficulty: beginner
estimated_reading_time: 15 minutes
prerequisites: []
sidebar:
    nav: docs
---

# Bootstrap 5.3.3 Integration

The Zer0-Mistakes theme is built on **Bootstrap 5.3.3**, providing responsive layouts, modern components, and powerful utilities.

## How Bootstrap is Loaded

The theme ships **Bootstrap 5.3.3**, **jQuery**, and **Bootstrap Icons** under [`assets/vendor/`]({{ '/assets/vendor/' | relative_url }}) so **GitHub Pages** builds need no `npm` or network at publish time. Refresh files with `./scripts/vendor-install.sh` (see [Vendor assets]({{ '/docs/development/vendor-assets/' | relative_url }})).

### CSS (bundled — default)

```liquid
{% raw %}
<!-- In _includes/core/head.html -->
<link href="{{ '/assets/vendor/bootstrap/css/bootstrap.min.css' | relative_url }}" rel="stylesheet">
{% endraw %}
```

### JavaScript

```liquid
{% raw %}
<!-- In _includes/components/js-cdn.html -->
<script src="{{ '/assets/vendor/jquery/jquery-3.7.1.min.js' | relative_url }}"></script>
<script src="{{ '/assets/vendor/bootstrap/js/bootstrap.bundle.min.js' | relative_url }}"></script>
{% endraw %}
```

### Bootstrap Icons

```liquid
{% raw %}
<link rel="stylesheet" href="{{ '/assets/vendor/bootstrap-icons/font/bootstrap-icons.css' | relative_url }}">
{% endraw %}
```

### Optional: CDN example (forks only)

If you prefer a public CDN instead of committed vendor files, you can swap the links above for jsDelivr URLs (not the default for this theme).

## Grid System

### Basic Grid

```html
<div class="container">
  <div class="row">
    <div class="col-md-8">Main content</div>
    <div class="col-md-4">Sidebar</div>
  </div>
</div>
```

### Responsive Columns

```html
<!-- Stack on mobile, side-by-side on tablet+ -->
<div class="row">
  <div class="col-12 col-md-6">Left</div>
  <div class="col-12 col-md-6">Right</div>
</div>
```

### Auto-Width Columns

```html
<div class="row">
  <div class="col">Equal</div>
  <div class="col">Equal</div>
  <div class="col">Equal</div>
</div>
```

## Responsive Breakpoints

| Breakpoint | Class | Dimensions |
|------------|-------|------------|
| Extra small | (default) | < 576px |
| Small | `sm` | ≥ 576px |
| Medium | `md` | ≥ 768px |
| Large | `lg` | ≥ 992px |
| Extra large | `xl` | ≥ 1200px |
| XXL | `xxl` | ≥ 1400px |

### Responsive Utilities

```html
<!-- Hide on mobile -->
<div class="d-none d-md-block">Desktop only</div>

<!-- Show only on mobile -->
<div class="d-block d-md-none">Mobile only</div>
```

## Theme Components

### Navigation (Navbar)

```html
<nav class="navbar navbar-expand-lg bg-body-tertiary">
  <div class="container">
    <a class="navbar-brand" href="/">Brand</a>
    <button class="navbar-toggler" type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link active" href="#">Home</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
```

### Cards

```html
<div class="card">
  <img src="image.jpg" class="card-img-top" alt="...">
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <p class="card-text">Some quick example text.</p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div>
```

### Modals

```html
<!-- Button trigger -->
<button type="button" class="btn btn-primary" 
        data-bs-toggle="modal" 
        data-bs-target="#exampleModal">
  Launch demo modal
</button>

<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        Modal content here.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
```

### Offcanvas (Mobile Sidebar)

```html
<!-- Button -->
<button class="btn btn-primary" 
        data-bs-toggle="offcanvas" 
        data-bs-target="#sidebar">
  Open Sidebar
</button>

<!-- Offcanvas -->
<div class="offcanvas offcanvas-start" id="sidebar">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">Menu</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    Sidebar content...
  </div>
</div>
```

## Color Modes (Dark/Light)

Bootstrap 5.3 supports color modes via `data-bs-theme`:

```html
<html data-bs-theme="dark">
```

### Theme Toggle

```javascript
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-bs-theme', theme);
};

// Toggle
setTheme('dark');  // or 'light'
```

See [Color Modes](/docs/features/color-modes/) for full implementation.

## Bootstrap Icons

### Common Icons

```html
<!-- Navigation -->
<i class="bi bi-house"></i>
<i class="bi bi-search"></i>
<i class="bi bi-gear"></i>

<!-- Actions -->
<i class="bi bi-plus-circle"></i>
<i class="bi bi-pencil"></i>
<i class="bi bi-trash"></i>

<!-- Social -->
<i class="bi bi-github"></i>
<i class="bi bi-twitter"></i>
<i class="bi bi-linkedin"></i>

<!-- States -->
<i class="bi bi-check-circle text-success"></i>
<i class="bi bi-x-circle text-danger"></i>
<i class="bi bi-exclamation-circle text-warning"></i>
```

### Icon Sizing

```html
<i class="bi bi-house fs-1"></i>  <!-- Large -->
<i class="bi bi-house fs-3"></i>  <!-- Medium -->
<i class="bi bi-house fs-5"></i>  <!-- Small -->
```

## Utility Classes

### Spacing

```html
<!-- Margin -->
<div class="mt-3">margin-top: 1rem</div>
<div class="mb-4">margin-bottom: 1.5rem</div>
<div class="mx-auto">center horizontally</div>

<!-- Padding -->
<div class="p-3">padding: 1rem</div>
<div class="py-4">padding-y: 1.5rem</div>
```

### Flexbox

```html
<div class="d-flex justify-content-between align-items-center">
  <span>Left</span>
  <span>Right</span>
</div>
```

### Text

```html
<p class="text-primary">Primary text</p>
<p class="text-muted">Muted text</p>
<p class="text-center">Centered text</p>
<p class="fw-bold">Bold text</p>
```

## Customization

### CSS Variables

Override Bootstrap's CSS variables:

```css
:root {
  --bs-primary: #0d6efd;
  --bs-secondary: #6c757d;
  --bs-body-bg: #fff;
  --bs-body-color: #212529;
}

[data-bs-theme="dark"] {
  --bs-body-bg: #212529;
  --bs-body-color: #f8f9fa;
}
```

### Custom Sass

```scss
// _sass/custom.scss
$primary: #3b82f6;
$secondary: #64748b;

// Then import Bootstrap
@import "bootstrap/scss/bootstrap";
```

## Forms

### Basic Form

```html
<form>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email">
  </div>
  <div class="mb-3">
    <label for="message" class="form-label">Message</label>
    <textarea class="form-control" id="message" rows="3"></textarea>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

### Form Validation

```html
<form class="needs-validation" novalidate>
  <div class="mb-3">
    <input type="email" class="form-control" required>
    <div class="invalid-feedback">Please provide a valid email.</div>
  </div>
</form>

<script>
document.querySelectorAll('.needs-validation').forEach(form => {
  form.addEventListener('submit', event => {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});
</script>
```

## Resources

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Bootstrap Examples](https://getbootstrap.com/docs/5.3/examples/)
- [Bootstrap Cheatsheet](https://getbootstrap.com/docs/5.3/examples/cheatsheet/)

## Related

- [Color Modes](/docs/features/color-modes/)
- [Layouts](/docs/customization/layouts/)
- [Include Components](/docs/customization/includes/)

## See also

- [[Customization]]
- [[Features]]
- [[Jekyll]]
- [[Liquid]]
