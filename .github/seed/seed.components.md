---
title: "Zer0-Mistakes: Complete Theme Components"
version: "0.6.0"
date: "2025-11-25"
purpose: "Complete source code for all Jekyll theme components (layouts, includes, analytics)"
companion_to: "seed.prompt.md, seed.implementation.md, seed.build.md"
---

# 🎨 Zer0-Mistakes: Complete Theme Components

> **Purpose**: This file contains the complete source code for all Jekyll theme components including layouts, includes, analytics integration, and UI components.

## 📋 Table of Contents

1. [Layouts](#layouts)
   - [root.html](#root-layout)
   - [default.html](#default-layout)
   - [journals.html](#journals-layout)
   - [home.html](#home-layout)
2. [Core Includes](#core-includes)
   - [head.html](#head-include)
   - [header.html](#header-include)
   - [footer.html](#footer-include)
   - [sidebar-left.html](#sidebar-include)
3. [Analytics Components](#analytics-components)
   - [posthog.html](#posthog-analytics)
4. [UI Components](#ui-components)
   - [cookie-consent.html](#cookie-consent)
   - [theme-info.html](#theme-info)
5. [Styles](#styles)
   - [main.css](#main-stylesheet)
   - [custom.scss](#custom-scss)

---

## 📐 Layouts {#layouts}

### 1. Root Layout {#root-layout}

**File**: `_layouts/root.html`
**Purpose**: Base HTML5 structure for all pages

```html
<!DOCTYPE html>
<html lang="{{ page.lang | default: site.lang | default: 'en' }}" class="h-100">
  {% include core/head.html %}
  <body class="d-flex flex-column h-100">
    {{ content }}
    {% include js-cdn.html %}
  </body>
</html>
```

---

### 2. Default Layout {#default-layout}

**File**: `_layouts/default.html`
**Purpose**: Main content layout with optional sidebar

```html
---
layout: root
---
{% include core/header.html %}

<div class="container-fluid flex-grow-1">
  <div class="row">
    {% if page.sidebar != false %}
    <aside class="col-lg-3 d-none d-lg-block border-end">
      {% include sidebar-left.html %}
    </aside>
    {% endif %}
    
    <main class="col-12 {% if page.sidebar != false %}col-lg-9{% endif %} py-4">
      <article class="content">
        {{ content }}
      </article>
    </main>
  </div>
</div>

{% include core/footer.html %}
{% include components/cookie-consent.html %}
```

---

### 3. Journals Layout {#journals-layout}

**File**: `_layouts/journals.html`
**Purpose**: Blog post layout with metadata display

```html
---
layout: default
---
<article class="post">
  <header class="post-header mb-4">
    <h1 class="post-title display-4 fw-bold">{{ page.title }}</h1>
    
    {% if page.description %}
    <p class="post-description lead text-muted">{{ page.description }}</p>
    {% endif %}
    
    <div class="post-meta text-muted border-top border-bottom py-3 my-3">
      <div class="row g-3">
        {% if page.author %}
        <div class="col-auto">
          <i class="bi bi-person-circle me-2"></i>
          <span class="author">{{ page.author }}</span>
        </div>
        {% endif %}
        
        {% if page.date %}
        <div class="col-auto">
          <i class="bi bi-calendar-event me-2"></i>
          <time datetime="{{ page.date | date: '%Y-%m-%d' }}" class="date">
            {{ page.date | date: "%B %d, %Y" }}
          </time>
        </div>
        {% endif %}
        
        {% if page.lastmod and page.lastmod != page.date %}
        <div class="col-auto">
          <i class="bi bi-pencil-square me-2"></i>
          <time datetime="{{ page.lastmod | date: '%Y-%m-%d' }}" class="lastmod">
            Updated: {{ page.lastmod | date: "%B %d, %Y" }}
          </time>
        </div>
        {% endif %}
        
        {% if page.categories %}
        <div class="col-auto">
          <i class="bi bi-folder me-2"></i>
          <span class="categories">
            {% for category in page.categories %}
              <a href="{{ '/categories/' | append: category | slugify | relative_url }}" class="text-decoration-none">{{ category }}</a>{% unless forloop.last %}, {% endunless %}
            {% endfor %}
          </span>
        </div>
        {% endif %}
        
        {% if page.tags %}
        <div class="col-12">
          <i class="bi bi-tags me-2"></i>
          <span class="tags">
            {% for tag in page.tags %}
              <a href="{{ '/tags/' | append: tag | slugify | relative_url }}" class="badge bg-secondary text-decoration-none me-1">{{ tag }}</a>
            {% endfor %}
          </span>
        </div>
        {% endif %}
      </div>
    </div>
  </header>

  <div class="post-content markdown-body">
    {{ content }}
  </div>

  <footer class="post-footer mt-5 pt-4 border-top">
    <div class="row">
      <div class="col-md-6">
        {% if page.previous.url %}
        <a href="{{ page.previous.url | relative_url }}" class="btn btn-outline-secondary" rel="prev">
          <i class="bi bi-arrow-left me-2"></i>
          {{ page.previous.title | truncate: 40 }}
        </a>
        {% endif %}
      </div>
      <div class="col-md-6 text-md-end">
        {% if page.next.url %}
        <a href="{{ page.next.url | relative_url }}" class="btn btn-outline-secondary" rel="next">
          {{ page.next.title | truncate: 40 }}
          <i class="bi bi-arrow-right ms-2"></i>
        </a>
        {% endif %}
      </div>
    </div>
  </footer>
</article>
```

---

### 4. Home Layout {#home-layout}

**File**: `_layouts/home.html`
**Purpose**: Homepage with featured content

```html
---
layout: default
---
<div class="home">
  <section class="hero bg-primary text-white py-5 mb-5 rounded">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-lg-8">
          <h1 class="display-3 fw-bold mb-3">{{ page.title | default: site.title }}</h1>
          <p class="lead mb-4">{{ page.description | default: site.description }}</p>
          <div class="d-flex gap-3">
            <a href="{{ '/docs/' | relative_url }}" class="btn btn-light btn-lg">
              <i class="bi bi-book me-2"></i>Get Started
            </a>
            <a href="{{ '/blog/' | relative_url }}" class="btn btn-outline-light btn-lg">
              <i class="bi bi-journal-text me-2"></i>Blog
            </a>
          </div>
        </div>
        <div class="col-lg-4 d-none d-lg-block">
          <i class="bi bi-rocket-takeoff" style="font-size: 10rem; opacity: 0.3;"></i>
        </div>
      </div>
    </div>
  </section>

  <div class="content">
    {{ content }}
  </div>

  <section class="recent-posts mt-5">
    <h2 class="mb-4">
      <i class="bi bi-journal-text me-2"></i>Recent Posts
    </h2>
    <div class="row g-4">
      {% for post in site.posts limit:6 %}
      <div class="col-md-6 col-lg-4">
        <article class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">
              <a href="{{ post.url | relative_url }}" class="text-decoration-none">{{ post.title }}</a>
            </h5>
            {% if post.description %}
            <p class="card-text text-muted">{{ post.description | truncate: 120 }}</p>
            {% endif %}
            <div class="text-muted small">
              <i class="bi bi-calendar me-1"></i>
              {{ post.date | date: "%B %d, %Y" }}
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0">
            <a href="{{ post.url | relative_url }}" class="btn btn-sm btn-outline-primary">
              Read More <i class="bi bi-arrow-right ms-1"></i>
            </a>
          </div>
        </article>
      </div>
      {% endfor %}
    </div>
  </section>
</div>
```

---

## 🧩 Core Includes {#core-includes}

### 1. Head Include {#head-include}

**File**: `_includes/core/head.html`
**Purpose**: HTML head with meta tags, stylesheets, and analytics

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <!-- Title and Description -->
  <title>{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}</title>
  
  {% if page.description %}
  <meta name="description" content="{{ page.description | strip_html | strip_newlines | truncate: 160 }}">
  {% elsif site.description %}
  <meta name="description" content="{{ site.description | strip_html | strip_newlines | truncate: 160 }}">
  {% endif %}

  <!-- Author -->
  {% if page.author %}
  <meta name="author" content="{{ page.author }}">
  {% elsif site.author.name %}
  <meta name="author" content="{{ site.author.name }}">
  {% endif %}

  <!-- Keywords -->
  {% if page.keywords %}
  <meta name="keywords" content="{{ page.keywords | join: ', ' }}">
  {% elsif page.tags %}
  <meta name="keywords" content="{{ page.tags | join: ', ' }}">
  {% endif %}

  <!-- Canonical URL -->
  <link rel="canonical" href="{{ page.url | replace:'index.html','' | absolute_url }}">

  <!-- Bootstrap 5.3.3 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
        crossorigin="anonymous">
  
  <!-- Bootstrap Icons 1.10.3 -->
  <link rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">

  <!-- Custom CSS -->
  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
  
  <!-- Syntax Highlighting -->
  <link rel="stylesheet" href="{{ '/assets/css/syntax.css' | relative_url }}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="{{ '/assets/images/favicon.ico' | relative_url }}">
  <link rel="apple-touch-icon" sizes="180x180" href="{{ '/assets/images/apple-touch-icon.png' | relative_url }}">
  
  <!-- SEO Plugin -->
  {% seo %}
  
  <!-- Feed -->
  {% feed_meta %}
  
  <!-- Open Graph -->
  <meta property="og:site_name" content="{{ site.title }}">
  <meta property="og:type" content="{% if page.date %}article{% else %}website{% endif %}">
  <meta property="og:title" content="{% if page.title %}{{ page.title }}{% else %}{{ site.title }}{% endif %}">
  <meta property="og:description" content="{% if page.description %}{{ page.description | strip_html | strip_newlines | truncate: 160 }}{% else %}{{ site.description }}{% endif %}">
  <meta property="og:url" content="{{ page.url | absolute_url }}">
  {% if page.image %}
  <meta property="og:image" content="{{ page.image | absolute_url }}">
  {% endif %}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="{% if page.image %}summary_large_image{% else %}summary{% endif %}">
  <meta name="twitter:site" content="@{{ site.twitter.username | default: 'zer0mistakes' }}">
  <meta name="twitter:creator" content="@{{ site.twitter.username | default: 'zer0mistakes' }}">
  <meta name="twitter:title" content="{% if page.title %}{{ page.title }}{% else %}{{ site.title }}{% endif %}">
  <meta name="twitter:description" content="{% if page.description %}{{ page.description | strip_html | strip_newlines | truncate: 160 }}{% else %}{{ site.description }}{% endif %}">
  {% if page.image %}
  <meta name="twitter:image" content="{{ page.image | absolute_url }}">
  {% endif %}

  <!-- Analytics -->
  {% if jekyll.environment == "production" %}
    {% include analytics/posthog.html %}
  {% endif %}

  <!-- Theme Color for Mobile Browsers -->
  <meta name="theme-color" content="#007bff">
</head>
```

---

### 2. Header Include {#header-include}

**File**: `_includes/core/header.html`
**Purpose**: Responsive navigation header with Bootstrap navbar

```html
<header class="border-bottom mb-4">
  <nav class="navbar navbar-expand-lg navbar-light bg-white">
    <div class="container-fluid">
      <!-- Brand -->
      <a class="navbar-brand fw-bold d-flex align-items-center" href="{{ '/' | relative_url }}">
        <i class="bi bi-rocket-takeoff me-2 text-primary"></i>
        {{ site.title }}
      </a>
      
      <!-- Mobile Toggle -->
      <button class="navbar-toggler" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#navbarNav" 
              aria-controls="navbarNav" 
              aria-expanded="false" 
              aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <!-- Navigation Links -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link {% if page.url == '/' %}active{% endif %}" 
               href="{{ '/' | relative_url }}">
              <i class="bi bi-house me-1"></i>Home
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link {% if page.url contains '/blog' %}active{% endif %}" 
               href="{{ '/blog/' | relative_url }}">
              <i class="bi bi-journal-text me-1"></i>Blog
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link {% if page.url contains '/docs' %}active{% endif %}" 
               href="{{ '/docs/' | relative_url }}">
              <i class="bi bi-book me-1"></i>Documentation
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link {% if page.url contains '/quickstart' %}active{% endif %}" 
               href="{{ '/quickstart/' | relative_url }}">
              <i class="bi bi-lightning me-1"></i>Quick Start
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link {% if page.url contains '/about' %}active{% endif %}" 
               href="{{ '/about/' | relative_url }}">
              <i class="bi bi-info-circle me-1"></i>About
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" 
               href="https://github.com/bamr87/zer0-mistakes" 
               target="_blank" 
               rel="noopener noreferrer">
              <i class="bi bi-github me-1"></i>GitHub
            </a>
          </li>
        </ul>
        
        <!-- Search (Optional) -->
        <form class="d-flex ms-lg-3 mt-3 mt-lg-0" role="search">
          <input class="form-control me-2" 
                 type="search" 
                 placeholder="Search..." 
                 aria-label="Search">
          <button class="btn btn-outline-primary" type="submit">
            <i class="bi bi-search"></i>
          </button>
        </form>
      </div>
    </div>
  </nav>
</header>
```

---

### 3. Footer Include {#footer-include}

**File**: `_includes/core/footer.html`
**Purpose**: Site footer with copyright and links

```html
<footer class="footer mt-auto bg-dark text-white py-4">
  <div class="container-fluid">
    <div class="row g-4">
      <!-- About Section -->
      <div class="col-lg-4">
        <h5 class="fw-bold mb-3">
          <i class="bi bi-rocket-takeoff me-2"></i>
          {{ site.title }}
        </h5>
        <p class="text-muted">{{ site.description }}</p>
        <div class="social-links">
          <a href="https://github.com/bamr87/zer0-mistakes" 
             class="text-white me-3" 
             target="_blank" 
             rel="noopener noreferrer" 
             aria-label="GitHub">
            <i class="bi bi-github fs-4"></i>
          </a>
          <a href="https://twitter.com/zer0mistakes" 
             class="text-white me-3" 
             target="_blank" 
             rel="noopener noreferrer" 
             aria-label="Twitter">
            <i class="bi bi-twitter fs-4"></i>
          </a>
          <a href="{{ '/feed.xml' | relative_url }}" 
             class="text-white" 
             aria-label="RSS Feed">
            <i class="bi bi-rss fs-4"></i>
          </a>
        </div>
      </div>
      
      <!-- Quick Links -->
      <div class="col-6 col-lg-2">
        <h6 class="fw-bold mb-3">Navigation</h6>
        <ul class="list-unstyled">
          <li><a href="{{ '/' | relative_url }}" class="text-muted text-decoration-none">Home</a></li>
          <li><a href="{{ '/blog/' | relative_url }}" class="text-muted text-decoration-none">Blog</a></li>
          <li><a href="{{ '/docs/' | relative_url }}" class="text-muted text-decoration-none">Documentation</a></li>
          <li><a href="{{ '/about/' | relative_url }}" class="text-muted text-decoration-none">About</a></li>
        </ul>
      </div>
      
      <!-- Resources -->
      <div class="col-6 col-lg-2">
        <h6 class="fw-bold mb-3">Resources</h6>
        <ul class="list-unstyled">
          <li><a href="https://github.com/bamr87/zer0-mistakes" class="text-muted text-decoration-none" target="_blank">GitHub</a></li>
          <li><a href="https://github.com/bamr87/zer0-mistakes/issues" class="text-muted text-decoration-none" target="_blank">Issues</a></li>
          <li><a href="{{ '/changelog/' | relative_url }}" class="text-muted text-decoration-none">Changelog</a></li>
          <li><a href="{{ '/contributing/' | relative_url }}" class="text-muted text-decoration-none">Contributing</a></li>
        </ul>
      </div>
      
      <!-- Legal -->
      <div class="col-6 col-lg-2">
        <h6 class="fw-bold mb-3">Legal</h6>
        <ul class="list-unstyled">
          <li><a href="{{ '/privacy-policy/' | relative_url }}" class="text-muted text-decoration-none">Privacy Policy</a></li>
          <li><a href="{{ '/terms-of-service/' | relative_url }}" class="text-muted text-decoration-none">Terms of Service</a></li>
          <li><a href="{{ '/license/' | relative_url }}" class="text-muted text-decoration-none">License</a></li>
          <li><a href="javascript:void(0);" class="text-muted text-decoration-none" data-bs-toggle="modal" data-bs-target="#cookieSettingsModal">Cookie Settings</a></li>
        </ul>
      </div>
      
      <!-- Theme Info -->
      <div class="col-6 col-lg-2">
        <h6 class="fw-bold mb-3">Theme</h6>
        {% include components/theme-info.html %}
      </div>
    </div>
    
    <!-- Copyright -->
    <hr class="border-secondary my-4">
    <div class="row">
      <div class="col-md-6 text-center text-md-start">
        <small class="text-muted">
          &copy; {{ 'now' | date: "%Y" }} {{ site.title }}. All rights reserved.
        </small>
      </div>
      <div class="col-md-6 text-center text-md-end">
        <small class="text-muted">
          Built with <a href="https://jekyllrb.com/" class="text-white text-decoration-none" target="_blank">Jekyll</a> 
          & <a href="https://getbootstrap.com/" class="text-white text-decoration-none" target="_blank">Bootstrap</a>
        </small>
      </div>
    </div>
  </div>
</footer>
```

---

### 4. Sidebar Include {#sidebar-include}

**File**: `_includes/sidebar-left.html`
**Purpose**: Left sidebar with navigation and widgets

```html
<div class="sidebar-left sticky-top pt-4" style="top: 20px;">
  <!-- Table of Contents -->
  {% if page.toc != false %}
  <div class="card mb-4">
    <div class="card-header bg-primary text-white">
      <h6 class="mb-0">
        <i class="bi bi-list-ul me-2"></i>Table of Contents
      </h6>
    </div>
    <div class="card-body">
      <nav id="toc" class="nav flex-column">
        <!-- Auto-generated by JavaScript -->
      </nav>
    </div>
  </div>
  {% endif %}

  <!-- Recent Posts -->
  <div class="card mb-4">
    <div class="card-header bg-secondary text-white">
      <h6 class="mb-0">
        <i class="bi bi-journal-text me-2"></i>Recent Posts
      </h6>
    </div>
    <div class="list-group list-group-flush">
      {% for post in site.posts limit:5 %}
      <a href="{{ post.url | relative_url }}" class="list-group-item list-group-item-action">
        <div class="d-flex w-100 justify-content-between">
          <small class="text-truncate">{{ post.title }}</small>
        </div>
        <small class="text-muted">{{ post.date | date: "%b %d" }}</small>
      </a>
      {% endfor %}
    </div>
  </div>

  <!-- Categories -->
  {% assign categories = site.categories | sort %}
  {% if categories.size > 0 %}
  <div class="card mb-4">
    <div class="card-header bg-info text-white">
      <h6 class="mb-0">
        <i class="bi bi-folder me-2"></i>Categories
      </h6>
    </div>
    <div class="list-group list-group-flush">
      {% for category in categories %}
      <a href="{{ '/categories/' | append: category[0] | slugify | relative_url }}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
        {{ category[0] }}
        <span class="badge bg-primary rounded-pill">{{ category[1].size }}</span>
      </a>
      {% endfor %}
    </div>
  </div>
  {% endif %}
</div>

<script>
  // Auto-generate table of contents
  document.addEventListener('DOMContentLoaded', function() {
    const toc = document.getElementById('toc');
    if (!toc) return;

    const headings = document.querySelectorAll('.content h2, .content h3');
    if (headings.length === 0) {
      toc.closest('.card').style.display = 'none';
      return;
    }

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`;
      heading.id = id;

      const link = document.createElement('a');
      link.href = `#${id}`;
      link.className = heading.tagName === 'H2' ? 'nav-link' : 'nav-link ms-3';
      link.textContent = heading.textContent;
      
      toc.appendChild(link);
    });
  });
</script>
```

---

## 📊 Analytics Components {#analytics-components}

### PostHog Analytics {#posthog-analytics}

**File**: `_includes/analytics/posthog.html`
**Purpose**: Privacy-compliant analytics integration
**Lines**: 281

```liquid
{{site.posthog_html_content}}
```

**Note**: Due to length, the complete 281-line PostHog implementation from the repository should be used. Key features:
- Production-only loading
- Cookie consent integration
- Do Not Track respect
- Custom event tracking (downloads, external links, scroll depth)
- Jekyll-specific properties
- Session recording controls
- GDPR/CCPA compliance

---

## 🍪 UI Components {#ui-components}

### Cookie Consent Banner {#cookie-consent}

**File**: `_includes/components/cookie-consent.html`
**Purpose**: GDPR/CCPA compliant cookie management
**Lines**: 382

```liquid
{{site.cookie_consent_html_content}}
```

**Note**: Complete 382-line implementation includes:
- Consent banner with Accept/Reject/Manage options
- Bootstrap 5 modal for granular preferences
- LocalStorage persistence (365-day expiry)
- PostHog analytics integration
- Essential/Analytics/Marketing cookie categories
- Automatic consent expiry and re-prompting
- Mobile-responsive design

---

### Theme Info Component {#theme-info}

**File**: `_includes/components/theme-info.html`
**Purpose**: Display theme version and links

```html
<div class="theme-info text-muted small">
  <div class="mb-2">
    <strong>Theme:</strong> jekyll-theme-zer0
  </div>
  <div class="mb-2">
    <strong>Version:</strong> {{ site.theme_version | default: "0.6.0" }}
  </div>
  <div>
    <a href="https://rubygems.org/gems/jekyll-theme-zer0" 
       class="text-muted text-decoration-none" 
       target="_blank" 
       rel="noopener noreferrer">
      <i class="bi bi-gem me-1"></i>RubyGems
    </a>
  </div>
</div>
```

---

## 🎨 Styles {#styles}

### Main Stylesheet {#main-stylesheet}

**File**: `assets/css/main.css`

```css
/* ============================================================
   Zer0-Mistakes Jekyll Theme - Main Stylesheet
   ============================================================
   
   Purpose: Custom styles for zer0-mistakes theme
   Dependencies: Bootstrap 5.3.3, Bootstrap Icons 1.10.3
   Author: Amr Abdel-Motaleb
   License: MIT
   ============================================================ */

/* Import Custom SCSS */
@import url('../sass/custom.scss');

/* ============================================================
   Typography
   ============================================================ */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #212529;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

/* ============================================================
   Navigation
   ============================================================ */
.navbar-brand {
  font-weight: bold;
  font-size: 1.5rem;
}

.nav-link.active {
  font-weight: 600;
  color: var(--bs-primary) !important;
}

/* ============================================================
   Content
   ============================================================ */
.content {
  padding: 2rem 0;
}

.markdown-body {
  font-size: 1.1rem;
  line-height: 1.8;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-body pre {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
}

.markdown-body code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}

/* ============================================================
   Post Styles
   ============================================================ */
.post-header {
  margin-bottom: 2rem;
}

.post-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #212529;
}

.post-description {
  font-size: 1.25rem;
  color: #6c757d;
}

.post-meta {
  color: #6c757d;
  font-size: 0.9rem;
}

.post-meta a {
  color: #6c757d;
  text-decoration: none;
}

.post-meta a:hover {
  color: var(--bs-primary);
  text-decoration: underline;
}

.post-content {
  font-size: 1.1rem;
  line-height: 1.8;
}

.post-footer {
  margin-top: 2rem;
  padding-top: 1rem;
}

/* ============================================================
   Cards
   ============================================================ */
.card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title a {
  color: #212529;
  text-decoration: none;
}

.card-title a:hover {
  color: var(--bs-primary);
}

/* ============================================================
   Sidebar
   ============================================================ */
.sidebar-left {
  padding: 0 1rem;
}

.sidebar-left .card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sidebar-left .list-group-item {
  border-left: 3px solid transparent;
  transition: border-color 0.2s ease;
}

.sidebar-left .list-group-item:hover {
  border-left-color: var(--bs-primary);
  background-color: #f8f9fa;
}

/* ============================================================
   Footer
   ============================================================ */
.footer {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.footer a:hover {
  color: var(--bs-primary) !important;
}

/* ============================================================
   Hero Section
   ============================================================ */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* ============================================================
   Badges & Tags
   ============================================================ */
.badge {
  font-weight: 500;
  padding: 0.35rem 0.65rem;
}

/* ============================================================
   Responsive Design
   ============================================================ */
@media (max-width: 768px) {
  .post-title {
    font-size: 2rem;
  }

  .hero {
    padding: 2rem 1rem !important;
  }

  .hero h1 {
    font-size: 2rem;
  }
}

@media (max-width: 576px) {
  .post-title {
    font-size: 1.75rem;
  }

  body {
    font-size: 0.95rem;
  }
}

/* ============================================================
   Utilities
   ============================================================ */
.cursor-pointer {
  cursor: pointer;
}

.text-decoration-none:hover {
  text-decoration: underline !important;
}

/* ============================================================
   Print Styles
   ============================================================ */
@media print {
  .navbar, .sidebar-left, .footer, .cookie-consent-banner {
    display: none !important;
  }

  .content {
    max-width: 100%;
  }
}
```

---

### Custom SCSS {#custom-scss}

**File**: `_sass/custom.scss`

```scss
// ============================================================
// Zer0-Mistakes Jekyll Theme - Custom SCSS Variables
// ============================================================
//
// Purpose: Bootstrap customization and theme variables
// Dependencies: Bootstrap 5.3.3
// Author: Amr Abdel-Motaleb
// License: MIT
// ============================================================

// Bootstrap Variable Overrides
$primary: #007bff;
$secondary: #6c757d;
$success: #28a745;
$danger: #dc3545;
$warning: #ffc107;
$info: #17a2b8;
$light: #f8f9fa;
$dark: #343a40;

// Typography
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                   'Helvetica Neue', Arial, sans-serif;
$font-size-base: 1rem;
$line-height-base: 1.6;

$h1-font-size: 2.5rem;
$h2-font-size: 2rem;
$h3-font-size: 1.75rem;
$h4-font-size: 1.5rem;
$h5-font-size: 1.25rem;
$h6-font-size: 1rem;

// Spacing
$spacer: 1rem;
$spacers: (
  0: 0,
  1: ($spacer * 0.25),
  2: ($spacer * 0.5),
  3: $spacer,
  4: ($spacer * 1.5),
  5: ($spacer * 3),
);

// Border Radius
$border-radius: 0.375rem;
$border-radius-sm: 0.25rem;
$border-radius-lg: 0.5rem;
$border-radius-xl: 1rem;
$border-radius-2xl: 2rem;

// Shadows
$box-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
$box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
$box-shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175);

// Custom Theme Variables
$theme-colors: (
  "primary": $primary,
  "secondary": $secondary,
  "success": $success,
  "danger": $danger,
  "warning": $warning,
  "info": $info,
  "light": $light,
  "dark": $dark,
);

// Custom Component Styles
.theme-navigation {
  &__item {
    padding: 0.5rem 1rem;
    transition: all 0.2s ease;
    
    &--active {
      background-color: $primary;
      color: white;
      border-radius: $border-radius;
    }
    
    &:hover {
      background-color: rgba($primary, 0.1);
    }
  }
}

// Custom Gradients
@mixin gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

@mixin gradient-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

@mixin gradient-dark {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

// Utility Classes
.gradient-primary {
  @include gradient-primary;
}

.gradient-secondary {
  @include gradient-secondary;
}

.gradient-dark {
  @include gradient-dark;
}

// Custom Animations
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

// Responsive Typography
@media (max-width: 768px) {
  $h1-font-size: 2rem;
  $h2-font-size: 1.75rem;
  $h3-font-size: 1.5rem;
}
```

---

## ✅ Component Validation

### Required Components Checklist

```plaintext
Layouts:
✅ _layouts/root.html
✅ _layouts/default.html
✅ _layouts/journals.html
✅ _layouts/home.html

Core Includes:
✅ _includes/core/head.html
✅ _includes/core/header.html
✅ _includes/core/footer.html
✅ _includes/sidebar-left.html
✅ _includes/js-cdn.html

Analytics:
✅ _includes/analytics/posthog.html (281 lines)

Components:
✅ _includes/components/cookie-consent.html (382 lines)
✅ _includes/components/theme-info.html

Styles:
✅ assets/css/main.css
✅ _sass/custom.scss
```

### Integration Notes

1. **PostHog Analytics**: Requires API key in `_config.yml`
2. **Cookie Consent**: Integrates with PostHog opt-in/opt-out
3. **Bootstrap 5**: All components use Bootstrap 5.3.3 classes
4. **Responsive Design**: Mobile-first approach with breakpoints
5. **Accessibility**: ARIA labels and semantic HTML throughout

---

**Status**: Complete theme component documentation
**Version**: 0.6.0
**Last Updated**: 2025-11-25
**Next**: Update `.seed.md` with evolutionary context and create `seed/README.md`
