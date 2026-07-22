# Layout Files Documentation

This directory contains the Jekyll layout templates for the Zer0-Pages theme.  
Each layout has been organized with comprehensive comments explaining the template logic,  
structure, and usage patterns.

## Layout Hierarchy

```text
root.html (base template)
├── default.html (sidebar layout)
│   ├── article.html (single articles/posts)
│   ├── section.html (section index pages)
│   ├── collection.html (collection pages)
│   └── javascript.html (JavaScript demos)
├── home.html (homepage)
├── news.html (news homepage - magazine/grid/list styles)
├── landing.html (landing pages)
├── book.html (book landing page - cover hero + table of contents)
├── book-story.html (immersive picture-book story pages)
├── stats.html (statistics dashboard)
└── index.html (search pages)
```

## Layout Files Overview

### 🏗️ Core Layouts

#### `root.html`

- **Purpose**: Base HTML structure for all pages
- **Features**: Bootstrap 5 dark theme, SEO optimization, scroll spy
- **Dependencies**: head.html, header.html, footer.html, js-cdn.html
- **Usage**: Inherited by all other layouts

#### `default.html`

- **Purpose**: Standard content layout with sidebars
- **Features**: Three-column responsive layout, navigation, table of contents
- **Features (Updated)**: Sidebar toggle via `page.sidebar: false` front matter
- **Dependencies**: sidebar-left.html, intro.html, sidebar-right.html
- **Usage**: Documentation pages, standard content

### 📰 News & Article Layouts

#### `news.html`

- **Purpose**: News homepage with multiple display styles
- **Features**: Magazine, grid, and list layouts via `section_style` front matter
- **Front Matter**: `section_style: magazine|grid|list` (required)
- **Dependencies**: post-card.html, post-type-badge.html
- **Usage**: Main news index at /news/

#### `article.html`

- **Purpose**: Single article display with post_type variations
- **Features**: Conditional rendering based on `post_type` front matter
- **Post Types**: standard, featured, breaking, opinion, review, tutorial, listicle, interview
- **Dependencies**: post-type-badge.html, giscus.html for comments
- **Usage**: Individual news articles and blog posts

#### `section.html`

- **Purpose**: Section index pages for content categories
- **Features**: Path-based article discovery, multiple display styles
- **Front Matter**: `section_style: magazine|grid|list` (required)
- **Dependencies**: post-card.html, post-type-badge.html
- **Usage**: Section landing pages (e.g., /news/technology/, /news/business/)

### 📝 Collection Layouts

#### `collection.html`

- **Purpose**: Collection listing with card grid
- **Features**: Responsive cards, sorting, preview images
- **Dependencies**: Bootstrap card components
- **Usage**: Portfolio, projects, grouped content

### 🎯 Specialized Layouts

#### `home.html`

- **Purpose**: Clean homepage template
- **Features**: Minimal structure, RSS feed link
- **Dependencies**: None
- **Usage**: Site homepage, landing content

#### `landing.html`

- **Purpose**: Marketing pages with visual effects
- **Features**: Particles.js background, offcanvas navigation
- **Dependencies**: particles.js, sidebar-left.html
- **Usage**: Product pages, campaigns, portfolios

#### `index.html`

- **Purpose**: Search and indexing pages
- **Features**: Full-width container, search optimization
- **Dependencies**: Search engine integration
- **Usage**: Search results, site indexes

#### `stats.html`

- **Purpose**: Statistics and analytics dashboard
- **Features**: Full-width responsive layout, modular statistics components
- **Dependencies**: Bootstrap 5, Bootstrap Icons, Jekyll data files
- **Usage**: Site analytics, content metrics, performance dashboards

#### `javascript.html`

- **Purpose**: JavaScript demonstration pages
- **Features**: Interactive elements, code examples
- **Dependencies**: Custom JavaScript functions
- **Usage**: Tutorials, interactive demos

## Front Matter Reference

### Article Layout (`article.html`)

```yaml
layout: article
post_type: standard|featured|breaking|opinion|review|tutorial|listicle|interview
sidebar: true|false  # Optional, defaults to true (false for featured/breaking)
```

### Section/News Layouts (`section.html`, `news.html`)

```yaml
layout: section|news
section_style: magazine|grid|list  # Required - no default
index: true  # Marks page as index (excluded from listings)
```

### Display Styles

| Style | Description |
|-------|-------------|
| `magazine` | Hero article + grid of remaining posts |
| `grid` | 3-column card grid layout |
| `list` | Horizontal row layout with thumbnails |

### Post Types with Badge Colors

| Type | Badge Color | Description |
|------|-------------|-------------|
| `featured` | Yellow (warning) | Featured/highlighted content |
| `breaking` | Red (danger) | Breaking news |
| `opinion` | Purple | Opinion/editorial pieces |
| `review` | Cyan (info) | Product/service reviews |
| `tutorial` | Green (success) | How-to guides |
| `listicle` | Secondary | List-style articles |
| `interview` | Dark | Interview content |
| `standard` | Light | Default article type |

## Comment Organization Standards

Each layout file now includes:

### 1. Header Documentation Block

```html
<!--
  ===================================================================
  LAYOUT NAME - Brief description
  ===================================================================
  
  File: filename.html
  Path: _layouts/filename.html
  Inherits: parent-layout.html
  Purpose: Detailed purpose explanation
  
  Template Logic:
  - Key functionality points
  - Responsive behavior
  - Content organization
  
  Dependencies:
  - Include files used
  - External libraries
  - Required data/configuration
  ===================================================================
-->
```

### 2. Section Comments

```html
<!-- ================================ -->
<!-- SECTION NAME                     -->
<!-- ================================ -->
<!-- Description of what this section does -->
```

### 3. Subsection Comments

```html
<!-- ========================== -->
<!-- SUBSECTION NAME            -->
<!-- ========================== -->
<!-- Specific functionality notes -->
```

### 4. Inline Comments

```html
<!-- Explain complex logic or conditional statements -->
{% if condition %}
<!-- Why this condition exists and what it affects -->
{% endif %}
```

## Template Logic Patterns

### Conditional Content Display

- Use descriptive comments for complex conditionals
- Explain the business logic behind template decisions
- Document fallback behaviors

### Loop Processing

- Explain data source and filtering logic
- Document sorting and limiting operations
- Note performance considerations

### Include Integration

- Document which includes are used and why
- Explain parameter passing to includes
- Note dependencies between includes

### Bootstrap Integration

- Document responsive behavior
- Explain grid system usage
- Note accessibility considerations

## Best Practices

1. **Documentation First**: Every layout should be self-documenting
2. **Consistent Structure**: Follow the established comment hierarchy
3. **Explain Intent**: Don't just describe what code does, explain why
4. **Update Comments**: Keep documentation current with code changes
5. **Template Logic**: Explain complex Liquid template operations
6. **Dependencies**: Document all external dependencies and includes
7. **Responsive Design**: Note mobile/desktop behavior differences
8. **Performance**: Comment on loading order and optimization

## Maintenance Guidelines

- Update comments when modifying layouts
- Test responsive behavior across devices
- Validate HTML5 semantic structure
- Check accessibility compliance
- Monitor Bootstrap version compatibility
- Update documentation for new features

---

_These layouts follow the Zer0-Mistakes theme standards for maintainable,  
documented, and responsive Jekyll templates._
