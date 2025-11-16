---
applyTo: "_includes/**"
description: "Jekyll include development guidelines for Zer0-Mistakes theme"
---

# Jekyll Include Development Guidelines

## 🧩 Include Architecture Overview

Zer0-Mistakes uses a modular include system built on Jekyll's powerful templating engine. Includes follow a hierarchical, component-based pattern that ensures reusability, maintainability, and consistency across layouts.

### Include Directory Structure
```
_includes/
├── analytics/          # Analytics and tracking components
├── components/         # Reusable UI components and widgets
├── content/           # Content-specific includes (SEO, TOC, etc.)
├── core/             # Essential site structure includes
├── docs/             # Documentation-specific components
├── landing/          # Landing page specific components
├── navigation/       # Navigation and menu components
└── stats/           # Statistics and metrics components
```

### Core Include Categories

#### Core Includes (`core/`)
Essential structural components that form the foundation of every page:
- `head.html` - Document head with meta tags, styles, scripts
- `header.html` - Main navigation and site branding
- `footer.html` - Site footer with links and copyright
- `branding.html` - Logo and site title display

#### Component Includes (`components/`)
Reusable UI components and interactive elements:
- `cookie-consent.html` - GDPR/CCPA compliant privacy management
- `theme-info.html` - Dynamic theme and system information
- `searchbar.html` - Site search functionality
- `mermaid.html` - Diagram rendering support

#### Navigation Includes (`navigation/`)
Navigation-related components for site structure:
- `navbar.html` - Main navigation menu
- `breadcrumbs.html` - Hierarchical navigation trail
- `sidebar-left.html` - Left sidebar with navigation
- `nav_list.html` - Dynamic navigation list generation

#### Analytics Includes (`analytics/`)
Privacy-compliant tracking and measurement:
- `posthog.html` - PostHog analytics integration
- `google-analytics.html` - Google Analytics tracking
- `google-tag-manager-*.html` - GTM implementation

## 📝 Include Development Standards

### Standard Include Header Format
```html
<!--
  ===================================================================
  INCLUDE TITLE - Brief Description of Purpose
  ===================================================================
  
  File: filename.html
  Path: _includes/category/filename.html
  Purpose: Detailed description of what this include does and why
           it's needed in the theme architecture
  
  Template Logic:
  - Key functionality and conditional rendering
  - Integration points with other components
  - Expected data inputs and processing
  
  Dependencies:
  - Required site configurations from _config.yml
  - Other includes that this component relies on
  - External libraries or frameworks needed
  
  Usage:
  - How to include this component in layouts
  - Available parameters and customization options
  - Common use cases and implementation patterns
  
  Performance Notes:
  - Loading considerations and optimization notes
  - Caching behavior and best practices
  - Mobile and accessibility considerations
  ===================================================================
-->
```

### Include Parameter Patterns
```liquid
{% comment %}
  Include: component-name.html
  Parameters:
  - title: Component title (required)
  - class: Additional CSS classes (optional)
  - content: Component content (optional)
  - config: Configuration object (optional)
{% endcomment %}

<div class="component-wrapper {{ include.class | default: 'default-class' }}">
  {% if include.title %}
    <h3 class="component-title">{{ include.title }}</h3>
  {% endif %}
  
  <div class="component-content">
    {{ include.content | default: content | markdownify }}
  </div>
</div>
```

### Conditional Loading Patterns
```liquid
{% comment %} Environment-specific loading {% endcomment %}
{% if jekyll.environment == "production" %}
  {% include analytics/posthog.html %}
{% else %}
  {% comment %} Analytics disabled in development {% endcomment %}
{% endif %}

{% comment %} Configuration-based loading {% endcomment %}
{% if site.enable_search %}
  {% include components/searchbar.html %}
{% endif %}

{% comment %} Page-specific loading {% endcomment %}
{% if page.show_toc and page.content contains "##" %}
  {% include content/toc.html %}
{% endif %}
```

## 🎨 Bootstrap 5 Component Integration

### Bootstrap Component Patterns
```html
<!-- Bootstrap modal component -->
<div class="modal fade" id="{{ include.modal_id | default: 'defaultModal' }}" tabindex="-1">
  <div class="modal-dialog {{ include.modal_size | default: '' }}">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{{ include.title }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {{ include.content }}
      </div>
      {% if include.footer %}
        <div class="modal-footer">
          {{ include.footer }}
        </div>
      {% endif %}
    </div>
  </div>
</div>

<!-- Bootstrap card component -->
<div class="card {{ include.card_class }}">
  {% if include.header %}
    <div class="card-header {{ include.header_class }}">
      {{ include.header }}
    </div>
  {% endif %}
  <div class="card-body">
    {% if include.title %}
      <h5 class="card-title">{{ include.title }}</h5>
    {% endif %}
    {% if include.subtitle %}
      <h6 class="card-subtitle mb-2 text-muted">{{ include.subtitle }}</h6>
    {% endif %}
    <div class="card-text">
      {{ include.content | markdownify }}
    </div>
  </div>
  {% if include.footer %}
    <div class="card-footer {{ include.footer_class }}">
      {{ include.footer }}
    </div>
  {% endif %}
</div>
```

### Bootstrap Utility Class Usage
```html
<!-- Responsive display utilities -->
<div class="d-none d-md-block">
  {% include navigation/sidebar-left.html %}
</div>

<!-- Flexbox utilities for layout -->
<div class="d-flex justify-content-between align-items-center">
  <h2>{{ include.title }}</h2>
  <button class="btn btn-primary btn-sm">{{ include.button_text }}</button>
</div>

<!-- Spacing utilities -->
<section class="my-4 py-3">
  <div class="container-fluid">
    {{ include.content }}
  </div>
</section>
```

### Bootstrap Icon Integration
```html
<!-- Bootstrap Icons with fallback -->
<i class="{{ site.default_icon | default: 'bi' }} {{ include.icon | default: 'bi-info-circle' }}" 
   aria-hidden="true"></i>
<span class="{{ include.text_class | default: '' }}">{{ include.text }}</span>

<!-- Icon button pattern -->
<button type="button" class="btn {{ include.btn_class | default: 'btn-outline-primary' }}"
        {% if include.modal_target %}data-bs-toggle="modal" data-bs-target="#{{ include.modal_target }}"{% endif %}>
  <i class="bi {{ include.icon }}" aria-hidden="true"></i>
  {% if include.text %}<span class="d-none d-sm-inline ms-1">{{ include.text }}</span>{% endif %}
</button>
```

## 🔧 Advanced Include Patterns

### Dynamic Content Generation
```liquid
{% comment %} Dynamic navigation generation {% endcomment %}
<nav class="navbar {{ include.nav_class }}">
  <ul class="navbar-nav">
    {% for nav_item in site.data.navigation[include.nav_section] %}
      <li class="nav-item {% if nav_item.children %}dropdown{% endif %}">
        <a class="nav-link {% if nav_item.children %}dropdown-toggle{% endif %}" 
           href="{% unless nav_item.children %}{{ nav_item.url }}{% else %}#{% endunless %}"
           {% if nav_item.children %}data-bs-toggle="dropdown"{% endif %}>
          {% if nav_item.icon %}<i class="bi {{ nav_item.icon }} me-2"></i>{% endif %}
          {{ nav_item.title }}
        </a>
        {% if nav_item.children %}
          <ul class="dropdown-menu">
            {% for child in nav_item.children %}
              <li><a class="dropdown-item" href="{{ child.url }}">{{ child.title }}</a></li>
            {% endfor %}
          </ul>
        {% endif %}
      </li>
    {% endfor %}
  </ul>
</nav>
```

### Collection Processing
```liquid
{% comment %} Dynamic stats generation {% endcomment %}
{% assign total_posts = site.posts | size %}
{% assign total_pages = site.pages | size %}
{% assign categories = site.categories | size %}
{% assign tags = site.tags | size %}

<div class="row text-center">
  <div class="col-6 col-md-3">
    <div class="stat-card">
      <h3 class="stat-number">{{ total_posts }}</h3>
      <p class="stat-label">Posts</p>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="stat-card">
      <h3 class="stat-number">{{ total_pages }}</h3>
      <p class="stat-label">Pages</p>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="stat-card">
      <h3 class="stat-number">{{ categories }}</h3>
      <p class="stat-label">Categories</p>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="stat-card">
      <h3 class="stat-number">{{ tags }}</h3>
      <p class="stat-label">Tags</p>
    </div>
  </div>
</div>
```

### Error Handling and Fallbacks
```liquid
{% comment %} Safe data access with fallbacks {% endcomment %}
{% assign nav_items = site.data.navigation[include.nav_section] | default: site.data.navigation.main | default: empty %}
{% if nav_items.size > 0 %}
  {% for item in nav_items %}
    <!-- navigation rendering -->
  {% endfor %}
{% else %}
  <!-- fallback navigation -->
  <p class="text-muted">Navigation not configured</p>
{% endif %}

{% comment %} Image handling with fallbacks {% endcomment %}
{% assign image_url = include.image | default: page.image | default: site.default_image %}
{% if image_url %}
  <img src="{{ image_url | relative_url }}" 
       alt="{{ include.alt | default: page.title | default: site.title }}"
       class="{{ include.img_class | default: 'img-fluid' }}"
       loading="lazy">
{% endif %}
```

## 🔐 Privacy and Analytics Includes

### Privacy-Compliant Analytics
```html
<!-- PostHog analytics with consent management -->
{% if site.posthog.enabled and jekyll.environment == "production" %}
  {% comment %} Check for user consent before loading {% endcomment %}
  <script>
    if (window.cookieManager && window.cookieManager.hasConsent('analytics')) {
      // Load PostHog analytics
      {% include analytics/posthog-script.html %}
    } else {
      console.log('Analytics disabled: No user consent');
    }
  </script>
{% endif %}
```

### Cookie Consent Integration
```html
<!-- Cookie consent banner -->
<div id="cookieConsent" class="cookie-consent-banner" style="display: none;">
  <div class="container-fluid">
    <div class="row align-items-center">
      <div class="col-lg-8">
        <p class="mb-0">{{ include.message | default: site.cookie_consent.message }}</p>
      </div>
      <div class="col-lg-4 text-lg-end">
        <button type="button" class="btn btn-sm btn-outline-light me-2" 
                onclick="showCookieSettings()">Manage</button>
        <button type="button" class="btn btn-sm btn-primary" 
                onclick="acceptAllCookies()">Accept All</button>
      </div>
    </div>
  </div>
</div>
```

## 📱 Responsive Design in Includes

### Mobile-First Component Design
```html
<!-- Responsive navigation component -->
<nav class="navbar navbar-expand-lg">
  <!-- Mobile brand and toggle -->
  <div class="d-flex d-lg-none w-100 justify-content-between">
    <a class="navbar-brand" href="/">{{ site.title }}</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
            data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
  </div>

  <!-- Desktop brand -->
  <a class="navbar-brand d-none d-lg-block" href="/">{{ site.title }}</a>

  <!-- Collapsible navigation -->
  <div class="collapse navbar-collapse" id="navbarNav">
    <ul class="navbar-nav ms-auto">
      {% for nav_item in include.nav_items %}
        <li class="nav-item">
          <a class="nav-link" href="{{ nav_item.url }}">{{ nav_item.title }}</a>
        </li>
      {% endfor %}
    </ul>
  </div>
</nav>
```

### Responsive Content Adaptation
```html
<!-- Responsive sidebar -->
{% if include.show_mobile == true %}
  <!-- Mobile: Show as offcanvas -->
  <div class="d-lg-none">
    <button class="btn btn-outline-secondary" type="button" data-bs-toggle="offcanvas" 
            data-bs-target="#mobileSidebar">
      <i class="bi bi-list"></i> Menu
    </button>
    
    <div class="offcanvas offcanvas-start" tabindex="-1" id="mobileSidebar">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">Navigation</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        {{ include.content }}
      </div>
    </div>
  </div>
{% endif %}

<!-- Desktop: Show as regular sidebar -->
<div class="d-none d-lg-block">
  <aside class="sidebar {{ include.sidebar_class }}">
    {{ include.content }}
  </aside>
</div>
```

## ♿ Accessibility in Includes

### Semantic HTML Structure
```html
<!-- Accessible navigation -->
<nav role="navigation" aria-label="{{ include.nav_label | default: 'Main navigation' }}">
  <ul class="nav-list" role="menubar">
    {% for item in include.nav_items %}
      <li role="none">
        <a href="{{ item.url }}" role="menuitem" 
           {% if item.current %}aria-current="page"{% endif %}>
          {{ item.title }}
        </a>
      </li>
    {% endfor %}
  </ul>
</nav>

<!-- Accessible modal -->
<div class="modal fade" id="{{ include.modal_id }}" tabindex="-1" 
     aria-labelledby="{{ include.modal_id }}Label" aria-hidden="true"
     role="dialog" aria-modal="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="{{ include.modal_id }}Label">{{ include.title }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" 
                aria-label="Close modal"></button>
      </div>
      <div class="modal-body">
        {{ include.content }}
      </div>
    </div>
  </div>
</div>
```

### Screen Reader Support
```html
<!-- Skip links -->
<a href="#main-content" class="visually-hidden-focusable">Skip to main content</a>
<a href="#navigation" class="visually-hidden-focusable">Skip to navigation</a>

<!-- Descriptive text for complex interactions -->
<button type="button" class="btn btn-primary" onclick="toggleSearch()"
        aria-expanded="false" aria-controls="searchContainer"
        aria-label="Toggle search form">
  <i class="bi bi-search" aria-hidden="true"></i>
  <span class="visually-hidden">Search</span>
</button>

<div id="searchContainer" class="collapse">
  <form role="search" aria-label="Site search">
    <label for="searchInput" class="visually-hidden">Search terms</label>
    <input type="search" id="searchInput" class="form-control" 
           placeholder="Search..." aria-describedby="searchHelp">
    <div id="searchHelp" class="form-text visually-hidden">
      Enter keywords to search the site content
    </div>
  </form>
</div>
```

## 🚀 Performance Optimization

### Lazy Loading Components
```html
<!-- Lazy-loaded analytics -->
<script>
  // Load analytics only after user interaction
  let analyticsLoaded = false;
  function loadAnalytics() {
    if (!analyticsLoaded) {
      {% include analytics/posthog.html %}
      analyticsLoaded = true;
    }
  }
  
  // Load on first user interaction
  ['click', 'scroll', 'keydown'].forEach(event => {
    document.addEventListener(event, loadAnalytics, { once: true });
  });
  
  // Fallback: load after 3 seconds
  setTimeout(loadAnalytics, 3000);
</script>

<!-- Intersection Observer for lazy components -->
<div class="lazy-component" data-src="{% include components/heavy-component.html %}">
  <div class="placeholder">Loading...</div>
</div>

<script>
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load component when it enters viewport
        loadComponent(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });
  
  document.querySelectorAll('.lazy-component').forEach(el => observer.observe(el));
</script>
```

### Critical CSS Inlining
```html
<!-- Critical styles for above-the-fold content -->
<style>
  .hero-section { 
    min-height: 50vh; 
    display: flex; 
    align-items: center; 
  }
  .navbar { 
    background-color: #fff; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
  }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/assets/css/non-critical.css" as="style" 
      onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/css/non-critical.css"></noscript>
```

## 🧪 Testing and Validation

### Include Testing Checklist
- [ ] **Parameter validation**: Test with various parameter combinations
- [ ] **Error handling**: Test behavior with missing or invalid data
- [ ] **Responsive design**: Test across all Bootstrap breakpoints
- [ ] **Accessibility**: Validate ARIA labels and keyboard navigation
- [ ] **Performance**: Check loading times and resource usage
- [ ] **Browser compatibility**: Test across supported browsers
- [ ] **Integration**: Test with different layouts and parent components
- [ ] **Conditional rendering**: Test environment and configuration-based loading

### Development Testing Patterns
```liquid
{% comment %} Development-only debug information {% endcomment %}
{% if jekyll.environment == "development" %}
  <div class="debug-info bg-warning p-2 small">
    <strong>Debug Info:</strong> {{ include.debug_info | default: "No debug info" }}<br>
    <strong>Include Path:</strong> _includes/{{ include.file_path | default: "unknown" }}<br>
    <strong>Parameters:</strong> {{ include | jsonify }}
  </div>
{% endif %}

{% comment %} Validation warnings {% endcomment %}
{% unless include.required_param %}
  {% if jekyll.environment == "development" %}
    <div class="alert alert-warning">
      Warning: required_param not provided to {{ include.component_name }}
    </div>
  {% endif %}
{% endunless %}
```

## 📊 Analytics and Monitoring

### Include Performance Tracking
```html
<!-- Track include usage -->
<script>
  if (window.zer0Analytics) {
    zer0Analytics.track('include_loaded', {
      'include_name': '{{ include.component_name | default: "unknown" }}',
      'include_path': '_includes/{{ include.file_path | default: "unknown" }}',
      'page_url': window.location.pathname,
      'load_time': performance.now()
    });
  }
</script>
```

### Error Reporting
```liquid
{% comment %} Error boundary for includes {% endcomment %}
{% capture include_error %}
  {% include {{ include.component_path }} %}
{% endcapture %}

{% if include_error contains "Liquid Exception" %}
  {% if jekyll.environment == "development" %}
    <div class="alert alert-danger">
      <strong>Include Error:</strong> {{ include.component_path }}<br>
      {{ include_error }}
    </div>
  {% else %}
    <div class="alert alert-warning">
      Content temporarily unavailable.
    </div>
  {% endif %}
{% else %}
  {{ include_error }}
{% endif %}
```

## 🔄 Include Evolution and Maintenance

### Version Management
```html
<!-- Component versioning -->
{% assign component_version = include.version | default: "1.0.0" %}
<div class="component {{ include.class }}" data-component-version="{{ component_version }}">
  {% case component_version %}
    {% when "2.0.0" %}
      {% include components/new-version.html %}
    {% when "1.0.0" %}
      {% include components/legacy-version.html %}
    {% else %}
      {% include components/default-version.html %}
  {% endcase %}
</div>
```

### Deprecation Handling
```liquid
{% comment %} Deprecation warnings for old parameter names {% endcomment %}
{% if include.old_param_name %}
  {% if jekyll.environment == "development" %}
    <div class="alert alert-warning">
      <strong>Deprecation Warning:</strong> Parameter 'old_param_name' is deprecated. 
      Use 'new_param_name' instead.
    </div>
  {% endif %}
  {% assign new_param_value = include.old_param_name %}
{% endif %}

{% assign final_param = include.new_param_name | default: new_param_value | default: "default_value" %}
```

### Documentation Standards
```liquid
{% comment %}
  Component Documentation Template
  
  Name: Component Name
  Version: X.Y.Z
  Description: Brief description of what this component does
  
  Parameters:
  - param1 (required): Description of parameter
  - param2 (optional): Description of optional parameter
  
  Example Usage:
  {% include components/component-name.html param1="value" param2="optional" %}
  
  Dependencies:
  - Bootstrap 5.3+
  - site.config_value
  - Other includes or libraries
  
  Browser Support:
  - Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
  - Mobile responsive design
  
  Accessibility:
  - ARIA labels and roles
  - Keyboard navigation support
  - Screen reader compatibility
  
  Performance:
  - Lazy loading support
  - Critical CSS inlining
  - Optimized for Core Web Vitals
{% endcomment %}
```

---

*These guidelines ensure consistent, accessible, and high-performance includes across the Zer0-Mistakes theme. Always test include changes across different layouts, devices, and browsers before deployment.*