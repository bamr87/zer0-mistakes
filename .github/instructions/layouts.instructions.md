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

## 🎯 Layout-Specific Guidelines

### Journals Layout (`journals.html`)
- Used for blog posts and articles
- Includes post metadata (date, author, categories)
- Supports table of contents generation
- Optimized for long-form content

### Home Layout (`home.html`)
- Designed for landing pages
- Features hero sections and call-to-action elements
- Includes featured content sections
- Optimized for conversion and engagement

### Default Layout (`default.html`)
- General-purpose layout for most pages
- Includes sidebar navigation
- Responsive design with mobile considerations
- SEO-optimized structure

## 📱 Responsive Design Standards

### Breakpoint Strategy
```scss
// Mobile-first approach
.content {
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }

  @media (min-width: 1200px) {
    padding: 3rem;
  }
}
```

### Navigation Patterns
```html
<!-- Collapsible navigation for mobile -->
<nav class="navbar navbar-expand-lg">
  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div class="collapse navbar-collapse" id="navbarNav">
    {% include nav_list.html %}
  </div>
</nav>
```

## ♿ Accessibility Guidelines

### Semantic HTML Structure
```html
<!-- Proper heading hierarchy -->
<header>
  <h1>{{ page.title }}</h1>
  <p class="lead">{{ page.description }}</p>
</header>

<main>
  <article>
    <h2>Section Title</h2>
    <p>Content...</p>
    <h3>Subsection</h3>
    <p>More content...</p>
  </article>
</main>
```

### ARIA Labels and Roles
```html
<!-- Skip links for keyboard navigation -->
<a href="#main-content" class="sr-only sr-only-focusable">Skip to main content</a>

<!-- ARIA landmarks -->
<nav aria-label="Main navigation">
  <!-- navigation content -->
</nav>

<main id="main-content" role="main">
  <!-- main content -->
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

### Layout Testing Checklist
- [ ] Responsive design across breakpoints (320px, 768px, 1200px)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] SEO elements present (meta tags, structured data)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance metrics (Lighthouse scores)
- [ ] Content overflow handling
- [ ] Print styles consideration

### Development Workflow
```bash
# Test layout changes locally
docker-compose up

# Validate HTML structure
docker-compose exec jekyll htmlproofer _site --check-html

# Check for broken links
docker-compose exec jekyll htmlproofer _site

# Performance audit
docker-compose exec jekyll lighthouse http://localhost:4000 --output html
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

### Layout Performance Metrics
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms

### Optimization Techniques
```html
<!-- Critical CSS inlining -->
<style>
  /* Critical styles for above-the-fold content */
  .hero { background: #f8f9fa; padding: 2rem; }
  .navbar { position: fixed; top: 0; width: 100%; }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/assets/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/css/main.css"></noscript>
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