---
title: Navigation
description: Configure navigation menus and sidebars in the Zer0-Mistakes Jekyll theme.
layout: default
categories:
    - docs
    - customization
tags:
    - navigation
    - menus
    - sidebar
permalink: /docs/customization/navigation/
difficulty: intermediate
estimated_time: 10 minutes
sidebar:
    nav: docs
---

# Navigation

Configure the navigation menus and sidebars for your site.

## Navigation Files

Navigation is configured in `_data/navigation/`:

```
_data/navigation/
├── main.yml      # Top navigation bar
├── docs.yml      # Documentation sidebar
├── quickstart.yml # Quick start sidebar
└── about.yml     # About section sidebar
```

## Main Navigation

Edit `_data/navigation/main.yml`:

```yaml
- title: "Home"
  url: /

- title: "Blog"
  url: /blog/

- title: "Docs"
  url: /docs/

- title: "About"
  url: /about/

# Dropdown menu
- title: "Resources"
  children:
    - title: "Tutorials"
      url: /tutorials/
    - title: "API Reference"
      url: /api/
    - title: "Examples"
      url: /examples/
```

## Sidebar Navigation

Edit `_data/navigation/docs.yml`:

```yaml
- title: "Getting Started"
  children:
    - title: "Installation"
      url: /docs/installation/
    - title: "Quick Start"
      url: /docs/getting-started/quick-start/
    - title: "Theme Guide"
      url: /docs/getting-started/theme-guide/

- title: "Features"
  children:
    - title: "Mermaid Diagrams"
      url: /docs/features/mermaid-diagrams/
    - title: "MathJax"
      url: /docs/features/mathjax-math/
    - title: "Comments"
      url: /docs/features/giscus-comments/

- title: "Customization"
  children:
    - title: "Layouts"
      url: /docs/customization/layouts/
    - title: "Styles"
      url: /docs/customization/styles/
    - title: "Navigation"
      url: /docs/customization/navigation/
```

## Using Sidebar in Pages

Specify which navigation to use in front matter:

```yaml
---
title: "My Documentation Page"
sidebar:
  nav: docs
---
```

## Creating New Navigation

### Step 1: Create Navigation File

Create `_data/navigation/tutorials.yml`:

```yaml
- title: "Beginner"
  children:
    - title: "Tutorial 1"
      url: /tutorials/beginner/part-1/
    - title: "Tutorial 2"
      url: /tutorials/beginner/part-2/

- title: "Advanced"
  children:
    - title: "Advanced Topic"
      url: /tutorials/advanced/topic/
```

### Step 2: Use in Pages

```yaml
---
title: "Tutorial Page"
sidebar:
  nav: tutorials
---
```

## External Links

Add external links with `external: true`:

```yaml
- title: "GitHub"
  url: https://github.com/bamr87/zer0-mistakes
  external: true

- title: "Documentation"
  url: https://docs.example.com
  external: true
```

## Highlighting Current Page

The theme automatically highlights the current page in navigation. The active page receives the `active` class.

## Collapsible Sections

Sidebar sections are collapsible by default. To keep a section expanded:

```yaml
- title: "Always Open Section"
  expanded: true
  children:
    - title: "Page 1"
      url: /page-1/
```

## Navigation Icons

Add icons using Font Awesome or Bootstrap Icons:

```yaml
- title: "Home"
  url: /
  icon: "bi bi-house"

- title: "Settings"
  url: /settings/
  icon: "bi bi-gear"
```

## Conditional Navigation

Show navigation items based on conditions:

```yaml
- title: "Admin"
  url: /admin/
  show_if: "site.admin_enabled"
```

## Best Practices

1. **Keep it simple** — Don't overwhelm users with options
2. **Logical grouping** — Group related pages together
3. **Descriptive titles** — Use clear, concise titles
4. **Limit depth** — Avoid more than 2 levels of nesting
5. **Test mobile** — Ensure navigation works on small screens
6. **Update regularly** — Keep navigation in sync with content

## Reference

- [Jekyll Data Files](https://jekyllrb.com/docs/datafiles/)
- [Bootstrap Navigation](https://getbootstrap.com/docs/5.3/components/navs-tabs/)
