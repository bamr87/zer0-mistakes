---
applyTo: "_includes/**"
description: "Jekyll includes development guidelines for reusable components"
---

# Jekyll Includes Development Guidelines

## 🧩 Overview

This document provides guidelines for developing and maintaining Jekyll include files in the `_includes/` directory. These reusable components are the building blocks of the Zer0-Mistakes theme's modular architecture.

## 📋 Include File Structure

### Core Includes

| Include | Purpose | Used In |
|---------|---------|---------|
| `head.html` | HTML head with meta tags, CSS | All layouts |
| `header.html` | Site navigation and header | All layouts |
| `footer.html` | Site footer with links | All layouts |
| `sidebar-left.html` | Left navigation sidebar | Main layouts |
| `sidebar-right.html` | Right content sidebar | Content pages |
| `js-cdn.html` | JavaScript CDN resources | All layouts |
| `nav_list.html` | Navigation list generator | Header |
| `intro.html` | Page introduction section | Content pages |

## 🎨 Include Development Standards

### Naming Conventions

```
Format: descriptive-name.html
Examples:
  - card-post.html (post card component)
  - breadcrumb-nav.html (breadcrumb navigation)
  - social-share.html (social sharing buttons)
```

### File Structure Template

```html
<!--
Include: component-name.html
Description: Brief description of what this component does
Parameters:
  - param_name (required): Description of parameter
  - param_name (optional): Description with default value
Usage:
  {% include component-name.html param_name="value" %}
Dependencies:
  - List any required CSS classes
  - List any required JavaScript
Bootstrap Components: List Bootstrap components used
AI Notes: Special considerations for AI development
-->

{% comment %}
  Component logic and documentation
  Explain any complex Liquid logic here
{% endcomment %}

<div class="component-wrapper">
  <!-- Component HTML -->
</div>
```

### Parameter Handling

```liquid
{% comment %}
  Handle optional parameters with defaults
{% endcomment %}
{% assign title = include.title | default: page.title %}
{% assign show_date = include.show_date | default: true %}
{% assign css_class = include.class | default: "default-class" %}

{% comment %}
  Validate required parameters
{% endcomment %}
{% unless include.required_param %}
  {% assign error = "Error: required_param is missing" %}
  <!-- Log error or handle gracefully -->
{% endunless %}
```

## 🏗️ Component Patterns

### Navigation Components

```liquid
{% comment %}
  Navigation list with active state detection
{% endcomment %}
<nav class="navigation" aria-label="Main navigation">
  <ul class="nav-list">
    {% for item in site.data.navigation %}
      {% assign active = "" %}
      {% if page.url contains item.url %}
        {% assign active = "active" %}
      {% endif %}
      
      <li class="nav-item {{ active }}">
        <a href="{{ item.url | relative_url }}" class="nav-link">
          {% if item.icon %}
            <i class="bi bi-{{ item.icon }}"></i>
          {% endif %}
          {{ item.title }}
        </a>
      </li>
    {% endfor %}
  </ul>
</nav>
```

### Content Card Components

```liquid
{% comment %}
  Reusable card component with Bootstrap styling
  Parameters: title, description, image, url, date
{% endcomment %}
<div class="card h-100 {{ include.class }}">
  {% if include.image %}
    <img src="{{ include.image | relative_url }}" 
         class="card-img-top" 
         alt="{{ include.title }}"
         loading="lazy">
  {% endif %}
  
  <div class="card-body">
    <h5 class="card-title">{{ include.title }}</h5>
    <p class="card-text">{{ include.description | truncate: 150 }}</p>
    
    {% if include.date %}
      <p class="card-text">
        <small class="text-muted">
          <time datetime="{{ include.date | date: '%Y-%m-%d' }}">
            {{ include.date | date: "%B %d, %Y" }}
          </time>
        </small>
      </p>
    {% endif %}
  </div>
  
  {% if include.url %}
    <div class="card-footer">
      <a href="{{ include.url | relative_url }}" class="btn btn-primary">
        Read More
      </a>
    </div>
  {% endif %}
</div>
```

### SEO Components

```liquid
{% comment %}
  Open Graph meta tags for social sharing
{% endcomment %}
<meta property="og:title" content="{{ include.title | default: page.title | default: site.title }}">
<meta property="og:description" content="{{ include.description | default: page.description | default: site.description | strip_html | truncate: 160 }}">
<meta property="og:image" content="{{ include.image | default: page.preview | default: site.social.preview_image | absolute_url }}">
<meta property="og:url" content="{{ page.url | absolute_url }}">
<meta property="og:type" content="{{ include.type | default: 'website' }}">

{% comment %}
  Twitter Card meta tags
{% endcomment %}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="{{ site.social.twitter }}">
<meta name="twitter:title" content="{{ include.title | default: page.title }}">
<meta name="twitter:description" content="{{ include.description | default: page.description | strip_html | truncate: 200 }}">
<meta name="twitter:image" content="{{ include.image | default: page.preview | absolute_url }}">
```

## � **Bootstrap 5 Integration Patterns**

### Bootstrap Navigation Components

```liquid
{% comment %}
  Bootstrap navbar with responsive collapse
{% endcomment %}
<nav class="navbar navbar-expand-lg navbar-light bg-light sticky-top">
  <div class="container-fluid">
    <a class="navbar-brand" href="{{ '/' | relative_url }}">
      {% if site.logo %}
        <img src="{{ site.logo | relative_url }}" alt="{{ site.title }}" height="30">
      {% endif %}
      {{ site.title }}
    </a>
    
    <button class="navbar-toggler" type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav" 
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    
    <div class="collapse navbar-collapse" id="navbarNav">
      {% include nav_list.html %}
    </div>
  </div>
</nav>
```

### Bootstrap Modal Components

```liquid
{% comment %}
  Bootstrap modal for content display
  Parameters: id, title, content
{% endcomment %}
<div class="modal fade" id="{{ include.id }}" tabindex="-1" 
     aria-labelledby="{{ include.id }}Label" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="{{ include.id }}Label">
          {{ include.title }}
        </h5>
        <button type="button" class="btn-close" 
                data-bs-dismiss="modal" 
                aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {{ include.content }}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" 
                data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
```

### Bootstrap Alert Components

```liquid
{% comment %}
  Bootstrap alert with icon
  Parameters: type (success|info|warning|danger), message, dismissible
{% endcomment %}
{% assign alert_type = include.type | default: "info" %}
{% assign dismissible = include.dismissible | default: false %}

<div class="alert alert-{{ alert_type }} {% if dismissible %}alert-dismissible fade show{% endif %}" 
     role="alert">
  {% case alert_type %}
    {% when "success" %}
      <i class="bi bi-check-circle-fill"></i>
    {% when "info" %}
      <i class="bi bi-info-circle-fill"></i>
    {% when "warning" %}
      <i class="bi bi-exclamation-triangle-fill"></i>
    {% when "danger" %}
      <i class="bi bi-x-circle-fill"></i>
  {% endcase %}
  
  {{ include.message }}
  
  {% if dismissible %}
    <button type="button" class="btn-close" 
            data-bs-dismiss="alert" 
            aria-label="Close"></button>
  {% endif %}
</div>
```

## ♿ Accessibility Guidelines

### Semantic HTML
```liquid
{% comment %}
  Use proper semantic elements
{% endcomment %}
<nav aria-label="Breadcrumb navigation">
  <ol class="breadcrumb">
    <!-- breadcrumb items -->
  </ol>
</nav>

<article class="blog-post" role="article">
  <header>
    <h1>{{ page.title }}</h1>
  </header>
  <main>
    {{ content }}
  </main>
</article>
```

### ARIA Labels
```liquid
{% comment %}
  Add ARIA labels for screen readers
{% endcomment %}
<button type="button" 
        class="btn btn-primary"
        aria-label="Open {{ include.title }} dialog">
  <i class="bi bi-plus" aria-hidden="true"></i>
</button>

<nav aria-label="Pagination">
  <!-- pagination controls -->
</nav>
```

### Focus Management
```liquid
{% comment %}
  Ensure keyboard navigation works
{% endcomment %}
<div class="dropdown">
  <button class="btn dropdown-toggle" 
          type="button" 
          id="dropdownMenu" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
          aria-haspopup="true">
    Menu
  </button>
  <ul class="dropdown-menu" aria-labelledby="dropdownMenu">
    <li><a class="dropdown-item" href="#" tabindex="0">Item 1</a></li>
    <li><a class="dropdown-item" href="#" tabindex="0">Item 2</a></li>
  </ul>
</div>
```

## 🎨 CSS and Styling

### CSS Classes
```liquid
{% comment %}
  Use BEM methodology for custom classes
{% endcomment %}
<div class="component-name">
  <div class="component-name__header">
    <h2 class="component-name__title">{{ include.title }}</h2>
  </div>
  <div class="component-name__body component-name__body--{{ include.variant }}">
    {{ include.content }}
  </div>
</div>
```

### Responsive Design
```liquid
{% comment %}
  Use Bootstrap responsive utilities
{% endcomment %}
<div class="row">
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Responsive column -->
  </div>
</div>

<div class="d-none d-md-block">
  <!-- Hidden on mobile, visible on medium+ -->
</div>
```

## 🧪 Testing Includes

### Testing Checklist
- [ ] Test with all parameter combinations
- [ ] Test with missing optional parameters
- [ ] Test responsive behavior across breakpoints
- [ ] Verify accessibility with screen readers
- [ ] Check Bootstrap component functionality
- [ ] Validate HTML output
- [ ] Test in multiple browsers
- [ ] Verify performance impact

### Manual Testing
```bash
# Build site and check specific include
docker-compose up

# Check HTML output
curl http://localhost:4000 | grep "include-component"

# Validate HTML
docker-compose exec jekyll htmlproofer _site --check-html
```

## 🔒 Security Considerations

### Output Escaping
```liquid
{% comment %}
  Always escape user-provided content
{% endcomment %}
<p>{{ include.user_content | escape }}</p>

{% comment %}
  Be careful with absolute_url to prevent injection
{% endcomment %}
<a href="{{ include.url | relative_url }}">Link</a>
```

### Safe Filters
```liquid
{% comment %}
  Use safe filters for content manipulation
{% endcomment %}
{{ content | strip_html | truncate: 150 }}
{{ page.description | escape | strip_newlines }}
```

## 📖 Documentation Requirements

### Component Documentation
Every include file must have:
- Clear description of purpose
- List of all parameters (required and optional)
- Usage examples
- Dependencies (CSS, JS, data files)
- Bootstrap components used
- AI development notes

### Usage Examples
```liquid
{% comment %}
  Include usage examples in file header
  
  Basic usage:
    {% include card-post.html 
       title=post.title 
       description=post.excerpt 
       url=post.url %}
  
  With optional parameters:
    {% include card-post.html 
       title=post.title 
       description=post.excerpt 
       url=post.url 
       image=post.preview 
       date=post.date 
       class="shadow-sm" %}
{% endcomment %}
```

## 🚀 Performance Optimization

### Minimize Liquid Complexity
```liquid
{% comment %}
  Assign values once, reuse variables
{% endcomment %}
{% assign formatted_date = page.date | date: "%B %d, %Y" %}
{% assign truncated_desc = page.description | truncate: 150 %}

{% comment %}
  Avoid nested loops when possible
{% endcomment %}
{% assign filtered_posts = site.posts | where: "category", "tech" %}
{% for post in filtered_posts limit: 5 %}
  <!-- Loop content -->
{% endfor %}
```

### Lazy Loading
```liquid
{% comment %}
  Use lazy loading for images
{% endcomment %}
<img src="{{ include.image | relative_url }}" 
     alt="{{ include.alt }}"
     loading="lazy"
     decoding="async">
```

## 🔄 Maintenance Guidelines

### Version Compatibility
- Ensure Bootstrap 5 compatibility
- Test with latest Jekyll version
- Document any breaking changes
- Maintain backward compatibility when possible

### Code Review Checklist
- [ ] Follows naming conventions
- [ ] Has proper documentation
- [ ] Uses Bootstrap components correctly
- [ ] Accessible to screen readers
- [ ] Responsive design implemented
- [ ] Parameters validated
- [ ] Performance optimized
- [ ] Security considerations addressed

---

*These guidelines ensure consistent, accessible, and maintainable include components across the Zer0-Mistakes Jekyll theme. Always test includes thoroughly with various parameter combinations.*
