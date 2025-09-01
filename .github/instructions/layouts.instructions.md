---
applyTo: "_layouts/**"
description: "Jekyll layout development guidelines for Zer0-Mistakes theme"
---

# Jekyll Layout Development Guidelines

## 🎨 Layout Architecture Overview

Zer0-Mistakes uses a hierarchical layout system built on Jekyll's powerful templating engine. Layouts follow a modular, inheritance-based pattern that ensures consistency while allowing flexibility.

### Layout Hierarchy
```
root.html (base)
├── default.html (main content)
│   ├── journals.html (blog posts)
│   ├── home.html (homepage)
│   └── page-specific layouts
```

### Key Layout Files

#### `root.html` - Base Layout
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {% include head.html %}
</head>
<body>
  {% include header.html %}
  <main>{{ content }}</main>
  {% include footer.html %}
  {% include js-cdn.html %}
</body>
</html>
```

#### `default.html` - Main Content Layout
```html
---
layout: root
---
<div class="container-xxl bd-gutter mt-3 my-md-4 bd-layout">
  <aside class="bd-sidebar">
    {% include sidebar-left.html %}
  </aside>

  <main class="bd-main order-1">
    {% include intro.html %}
    {% include sidebar-right.html %}
    <div id="main-content" class="bd-content ps-lg-2">
      {{ content }}
    </div>
  </main>
</div>
```

## 🏗️ Layout Development Patterns

### Frontmatter Standards
```yaml
---
layout: default  # Parent layout to inherit from
title: "Page Title"
description: "SEO description"
permalink: /custom-url/
classes: "custom-css-classes"
---
```

### Responsive Design Implementation
```html
<!-- Mobile-first responsive container -->
<div class="container-fluid">
  <div class="row">
    <!-- Sidebar - hidden on mobile, shown on lg+ -->
    <div class="col-lg-3 d-none d-lg-block">
      {% include sidebar-left.html %}
    </div>

    <!-- Main content - full width on mobile, adjusted on lg+ -->
    <div class="col-12 col-lg-9">
      <article class="bd-article">
        {{ content }}
      </article>
    </div>
  </div>
</div>
```

### SEO Optimization Patterns
```html
<!-- Comprehensive meta tags -->
<meta name="description" content="{{ page.description | default: site.description }}">
<meta name="keywords" content="{{ page.tags | join: ', ' }}">
<meta name="author" content="{{ page.author | default: site.author }}">

<!-- Open Graph for social sharing -->
<meta property="og:title" content="{{ page.title }}">
<meta property="og:description" content="{{ page.description }}">
<meta property="og:image" content="{{ page.preview_image | absolute_url }}">
<meta property="og:url" content="{{ page.url | absolute_url }}">
```

## 🔧 Liquid Templating Best Practices

### Conditional Content Rendering
```liquid
{% if page.layout == 'journals' %}
  <!-- Blog post specific elements -->
  <div class="post-meta">
    <time datetime="{{ page.date | date: '%Y-%m-%d' }}">
      {{ page.date | date: '%B %d, %Y' }}
    </time>
    {% if page.author %}
      <span class="author">by {{ page.author }}</span>
    {% endif %}
  </div>
{% endif %}
```

### Loop Patterns for Collections
```liquid
{% for post in site.posts limit: 5 %}
  <article class="post-preview">
    <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
    <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>
    <time>{{ post.date | date: '%B %d, %Y' }}</time>
  </article>
{% endfor %}
```

### Include Parameter Passing
```liquid
<!-- In layout -->
{% include sidebar-left.html nav_class="bd-links" %}

<!-- In _includes/sidebar-left.html -->
<div class="{{ include.nav_class | default: 'default-class' }}">
  <!-- sidebar content -->
</div>
```

## � **Bootstrap 5 Layout Patterns**

### Bootstrap Grid System Integration
```html
<!-- Responsive container with Bootstrap grid -->
<div class="container-fluid">
  <div class="row">
    <!-- Sidebar - hidden on mobile, shown on lg+ -->
    <div class="col-lg-3 d-none d-lg-block">
      {% include sidebar-left.html %}
    </div>

    <!-- Main content - full width on mobile, adjusted on lg+ -->
    <div class="col-12 col-lg-9">
      <article class="bd-article">
        {{ content }}
      </article>
    </div>
  </div>
</div>
```

### Bootstrap Component Usage in Layouts
```html
<!-- Bootstrap navbar integration -->
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">Zer0-Mistakes</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      {% include nav_list.html %}
    </div>
  </div>
</nav>

<!-- Bootstrap cards for content sections -->
<div class="card">
  <div class="card-header">
    <h5 class="card-title">{{ page.title }}</h5>
  </div>
  <div class="card-body">
    {{ content }}
  </div>
</div>
```

### Bootstrap Utility Classes
```html
<!-- Spacing utilities -->
<div class="mt-3 mb-4"> <!-- margin-top: 1rem, margin-bottom: 1.5rem -->
  <p class="mb-0">Content with no bottom margin</p>
</div>

<!-- Display utilities for responsive behavior -->
<div class="d-flex justify-content-between align-items-center d-print-none">
  <!-- Flexbox layout, hidden in print -->
</div>

<!-- Text utilities -->
<p class="text-muted small">Secondary text styling</p>
<h1 class="display-4 fw-bold">Large heading with bold weight</h1>
```

### Bootstrap JavaScript Components
```html
<!-- Bootstrap modal integration -->
<div class="modal fade" id="exampleModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal Title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        Modal content here...
      </div>
    </div>
  </div>
</div>

<!-- Bootstrap tooltip initialization -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });
</script>
```

## 📱 **Bootstrap 5 Responsive Design Standards**

### Bootstrap Breakpoint System
```scss
// Bootstrap 5 breakpoints (mobile-first)
$grid-breakpoints: (
  xs: 0,    // Extra small devices (portrait phones, < 576px)
  sm: 576px, // Small devices (landscape phones, ≥ 576px)
  md: 768px, // Medium devices (tablets, ≥ 768px)
  lg: 992px, // Large devices (desktops, ≥ 992px)
  xl: 1200px, // Extra large devices (large desktops, ≥ 1200px)
  xxl: 1400px // Extra extra large devices (larger desktops, ≥ 1400px)
);
```

### Responsive Layout Patterns
```html
<!-- Responsive sidebar pattern -->
<aside class="bd-sidebar col-lg-3 d-none d-lg-block">
  {% include sidebar-left.html %}
</aside>

<!-- Responsive main content -->
<main class="col-12 col-lg-9">
  <div class="bd-content">
    <!-- Content that stacks on mobile, side-by-side on desktop -->
  </div>
</main>

<!-- Responsive navigation -->
<nav class="navbar navbar-expand-lg">
  <button class="navbar-toggler d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div class="collapse navbar-collapse" id="navbarNav">
    <!-- Navigation items -->
  </div>
</nav>
```

### Bootstrap Responsive Utilities
```html
<!-- Display utilities -->
<div class="d-block d-sm-none">Visible only on xs</div>
<div class="d-none d-sm-block d-md-none">Visible only on sm</div>
<div class="d-none d-md-block d-lg-none">Visible only on md</div>
<div class="d-none d-lg-block">Visible on lg and up</div>

<!-- Flexbox responsive -->
<div class="d-flex flex-column flex-sm-row">
  <!-- Stack vertically on mobile, horizontal on small screens and up -->
</div>
```

### Bootstrap Navigation Patterns
```html
<!-- Bootstrap navbar with responsive collapse -->
<nav class="navbar navbar-expand-lg navbar-light bg-light sticky-top">
  <div class="container-fluid">
    <!-- Brand -->
    <a class="navbar-brand fw-bold" href="/">
      <i class="bi bi-house-door"></i> Zer0-Mistakes
    </a>

    <!-- Mobile toggle button -->
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Collapsible navigation -->
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link active" href="/">Home</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
            Documentation
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/docs/">Getting Started</a></li>
            <li><a class="dropdown-item" href="/docs/components/">Components</a></li>
          </ul>
        </li>
      </ul>

      <!-- Search form -->
      <form class="d-flex">
        <input class="form-control me-2" type="search" placeholder="Search...">
        <button class="btn btn-outline-primary" type="submit">Search</button>
      </form>
    </div>
  </div>
</nav>

<!-- Bootstrap breadcrumb navigation -->
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/">Home</a></li>
    <li class="breadcrumb-item"><a href="/docs/">Docs</a></li>
    <li class="breadcrumb-item active" aria-current="page">Current Page</li>
  </ol>
</nav>
```

## ♿ **Bootstrap 5 Accessibility Guidelines**

### Bootstrap ARIA Integration
```html
<!-- Bootstrap components with built-in ARIA support -->
<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
  Launch Modal
</button>

<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Modal Title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        Modal content with proper ARIA labeling
      </div>
    </div>
  </div>
</div>

<!-- Accessible form controls -->
<div class="mb-3">
  <label for="emailInput" class="form-label">Email address</label>
  <input type="email" class="form-control" id="emailInput" aria-describedby="emailHelp">
  <div id="emailHelp" class="form-text">We'll never share your email with anyone else.</div>
</div>
```

### Bootstrap Focus Management
```html
<!-- Bootstrap focus indicators -->
.btn:focus, .form-control:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Bootstrap provides focus styles by default */
```

### Screen Reader Support
```html
<!-- Bootstrap screen reader utilities -->
<p class="text-muted">
  Regular text
  <span class="visually-hidden">Screen reader only text</span>
</p>

<!-- Skip links for keyboard navigation -->
<a href="#main-content" class="visually-hidden-focusable">Skip to main content</a>

<main id="main-content">
  <!-- Main content -->
</main>
```

## 🔍 SEO Optimization Techniques

### Structured Data Implementation
```html
<!-- JSON-LD for articles -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ page.title }}",
  "description": "{{ page.description }}",
  "author": {
    "@type": "Person",
    "name": "{{ page.author }}"
  },
  "datePublished": "{{ page.date | date: '%Y-%m-%d' }}",
  "dateModified": "{{ page.lastmod | date: '%Y-%m-%d' }}"
}
</script>
```

### Performance Optimization
```html
<!-- Lazy loading for images -->
<img src="{{ page.hero_image }}" alt="{{ page.title }}"
     loading="lazy" decoding="async">

<!-- Preload critical resources -->
<link rel="preload" href="/assets/css/main.css" as="style">
<link rel="dns-prefetch" href="//fonts.googleapis.com">
```

## 🧪 Testing and Validation

### Bootstrap-Specific Testing Checklist
- [ ] **Grid responsiveness**: Test layouts across all Bootstrap breakpoints (xs, sm, md, lg, xl, xxl)
- [ ] **Component functionality**: Verify Bootstrap JS components (modals, tooltips, dropdowns) work correctly
- [ ] **Form validation**: Test Bootstrap form validation states and feedback
- [ ] **Navigation collapse**: Ensure mobile navigation toggles properly
- [ ] **Accessibility**: Use Bootstrap's accessibility features and test with screen readers
- [ ] **Browser compatibility**: Test across supported browsers (Chrome, Firefox, Safari, Edge)
- [ ] **Print styles**: Verify Bootstrap's print utilities work as expected
- [ ] **Dark mode**: Test Bootstrap's color mode features if implemented

### Bootstrap Development Workflow
```bash
# Test responsive design across breakpoints
docker-compose up

# Validate Bootstrap component integration
docker-compose exec jekyll jekyll build

# Check for Bootstrap-specific HTML validation
docker-compose exec jekyll htmlproofer _site --check-html

# Test accessibility with Bootstrap components
docker-compose exec jekyll lighthouse http://localhost:4000 --output html

# Validate Bootstrap CSS/JS loading
curl -I http://localhost:4000 | grep "bootstrap"
```

## 🚀 Advanced Layout Patterns

### Conditional Layout Loading
```liquid
{% case page.layout %}
  {% when 'journals' %}
    {% include layouts/journals.html %}
  {% when 'home' %}
    {% include layouts/home.html %}
  {% else %}
    {% include layouts/default.html %}
{% endcase %}
```

### Dynamic Content Sections
```liquid
{% for section in page.sections %}
  <section class="content-section {{ section.class }}">
    <h2>{{ section.title }}</h2>
    <div class="section-content">
      {{ section.content | markdownify }}
    </div>
  </section>
{% endfor %}
```

### Theme Customization Hooks
```html
<!-- Custom CSS classes for theme overrides -->
<div class="layout-wrapper {{ page.layout_class | default: 'default-theme' }}">
  <!-- layout content -->
</div>

<!-- JavaScript hooks for interactivity -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Layout-specific JavaScript
    if (document.body.classList.contains('journals-layout')) {
      initializeJournalFeatures();
    }
  });
</script>
```

## 📊 Performance Monitoring

### Bootstrap Performance Metrics
- **CSS bundle size**: Bootstrap 5.3.3 minified CSS (~22KB gzipped)
- **JavaScript bundle size**: Bootstrap bundle (~25KB gzipped)
- **Icon font loading**: Bootstrap Icons (~50KB for complete icon set)
- **Component rendering**: Ensure Bootstrap components don't cause layout shifts
- **JavaScript execution**: Monitor Bootstrap JS initialization performance

### Bootstrap Optimization Techniques
```html
<!-- Load Bootstrap CSS with preload for critical rendering -->
<link rel="preload" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></noscript>

<!-- Defer Bootstrap JS to prevent render blocking -->
<script defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- Use Bootstrap utility classes instead of custom CSS when possible -->
<div class="d-flex justify-content-center align-items-center min-vh-100">
  <!-- Centered content using Bootstrap utilities -->
</div>

<!-- Optimize Bootstrap component initialization -->
<script>
  // Initialize only needed Bootstrap components
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips only if they exist
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipTriggerList.length > 0) {
      tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
  });
</script>
```

## 🔄 Evolution and Maintenance

### Layout Version Management
- **Semantic versioning** for layout changes
- **Deprecation warnings** for layout updates
- **Migration guides** for breaking changes
- **Backward compatibility** maintenance

### Continuous Improvement
- **User feedback integration** for layout enhancements
- **A/B testing** for layout variations
- **Performance monitoring** and optimization
- **Accessibility audits** and improvements

---

*These guidelines ensure consistent, accessible, and high-performance layouts across the Zer0-Mistakes theme. Always test layout changes across different devices and browsers before deployment.*