# Layouts and Includes Architecture

Documentation of the template system and component architecture.

## Layout Hierarchy

Layouts inherit from each other using Jekyll's `layout` front matter:

```
root.html              ← Base HTML document structure
└── default.html       ← Main site wrapper
    ├── home.html      ← Homepage
    ├── journals.html  ← Blog posts
    ├── collection.html ← Collection index
    ├── landing.html   ← Full-width pages
    ├── blog.html      ← Blog listing
    ├── category.html  ← Category archive
    └── tag.html       ← Tag archive
```

## Layout Responsibilities

### `root.html`

Base HTML structure. Rarely modified.

```html
<!DOCTYPE html>
<html lang="{{ page.lang | default: site.lang | default: 'en' }}">
{% include core/head.html %}
<body>
  {{ content }}
  {% include core/scripts.html %}
</body>
</html>
```

### `default.html`

Main site wrapper with header, footer, and optional sidebars.

**Key sections:**
- Site header with navigation
- Left sidebar (optional, configurable)
- Main content area
- Right sidebar / TOC (optional)
- Footer

### `journals.html`

Blog post layout extending `default.html`.

**Additional features:**
- Post metadata (date, author, categories, tags)
- Reading time estimate
- Comments section (Giscus)
- Previous/next navigation

### `collection.html`

Collection index layout for listing collection items.

**Features:**
- Item listing with excerpts
- Filtering by category/tag
- Pagination

### `landing.html`

Full-width layout without sidebars.

**Use cases:**
- Marketing pages
- Product pages
- Custom landing pages

## Include Organization

Includes are organized by function:

### `_includes/core/`

Essential page structure components:

| File | Purpose |
|------|---------|
| `head.html` | `<head>` section: meta tags, CSS, critical scripts |
| `header.html` | Site header with main navigation |
| `footer.html` | Site footer with links and copyright |
| `scripts.html` | JavaScript includes (end of body) |

### `_includes/content/`

Content enhancement components:

| File | Purpose |
|------|---------|
| `toc.html` | Table of contents (auto-generated) |
| `giscus.html` | GitHub Discussions comments |
| `seo.html` | SEO meta tags and Open Graph |
| `breadcrumbs.html` | Breadcrumb navigation |
| `reading-time.html` | Estimated reading time |

### `_includes/analytics/`

Analytics and tracking:

| File | Purpose |
|------|---------|
| `posthog.html` | PostHog analytics script |
| `google.html` | Google Analytics script |

### `_includes/navigation/`

Navigation components:

| File | Purpose |
|------|---------|
| `sidebar.html` | Left sidebar with navigation |
| `sidebar-right.html` | Right sidebar (TOC) |
| `main-nav.html` | Main navigation menu |
| `pagination.html` | Post pagination |

### `_includes/components/`

Feature-specific components:

| File | Purpose |
|------|---------|
| `mermaid.html` | Mermaid diagram initialization |
| `mathjax.html` | MathJax math rendering |
| `alert.html` | Alert/callout boxes |

## Conditional Loading

Components are loaded conditionally based on:

### Page Front Matter

```html
{% if page.mermaid %}
  {% include components/mermaid.html %}
{% endif %}

{% if page.mathjax %}
  {% include components/mathjax.html %}
{% endif %}

{% if page.comments != false and site.giscus.enabled %}
  {% include content/giscus.html %}
{% endif %}
```

### Site Configuration

```html
{% if site.posthog.enabled and jekyll.environment == 'production' %}
  {% include analytics/posthog.html %}
{% endif %}
```

### Layout Type

```html
{% if page.layout == 'journals' %}
  {% include content/reading-time.html %}
  {% include content/post-meta.html %}
{% endif %}
```

## Include Parameters

Includes can accept parameters:

```html
{% include components/alert.html 
   type="warning" 
   title="Important" 
   message="This is a warning message." 
%}
```

Inside the include:

```html
<div class="alert alert-{{ include.type | default: 'info' }}">
  {% if include.title %}
    <h4>{{ include.title }}</h4>
  {% endif %}
  {{ include.message }}
</div>
```

## Best Practices

### Layout Guidelines

1. **Single responsibility** — Each layout serves one purpose
2. **Inherit appropriately** — Extend from `default` for consistency
3. **Use includes** — Extract reusable parts into includes
4. **Document variables** — Comment required front matter

### Include Guidelines

1. **Self-contained** — Includes should work independently
2. **Accept parameters** — Use `include.*` for configuration
3. **Provide defaults** — Use `| default:` for optional params
4. **Conditional loading** — Only load when needed

### Naming Conventions

- Layouts: `lowercase.html`
- Includes: `kebab-case.html`
- Directories: `lowercase/`

## Testing Layouts

Test layout changes:

```bash
# Start development server
docker-compose up

# View different layouts
# - Homepage: http://localhost:4000/
# - Blog post: http://localhost:4000/blog/any-post/
# - Documentation: http://localhost:4000/docs/
```

## Related

- [Project Structure](project-structure.md)
- [Build System](build-system.md)
