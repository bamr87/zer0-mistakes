---
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
estimated_time: 15 minutes
prerequisites: []
sidebar:
    nav: docs
---

# Bootstrap 5.3.3 Integration

The Zer0-Mistakes theme is built on **Bootstrap 5.3.3**, providing responsive layouts, modern components, and powerful utilities.

## How Bootstrap is Loaded

### CSS (via CDN)

```html
<!-- In _includes/core/head.html -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
      rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
      crossorigin="anonymous">
```

### JavaScript

```html
<!-- In _includes/components/js-cdn.html -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossorigin="anonymous"></script>
```

### Bootstrap Icons

```html
<link rel="stylesheet" 
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
```

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
