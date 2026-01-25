---
title: Customization
description: Customize the Zer0-Mistakes Jekyll theme - layouts, styles, navigation, and more.
layout: default
categories:
    - docs
    - customization
tags:
    - customization
    - layouts
    - styles
    - navigation
permalink: /docs/customization/
difficulty: intermediate
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Customization

Customize the Zer0-Mistakes theme to match your brand and requirements.

## Customization Areas

| Area | Location | Description |
|------|----------|-------------|
| **Layouts** | `_layouts/` | Page templates and structure |
| **Styles** | `_sass/` | CSS/SCSS customization |
| **Navigation** | `_data/navigation/` | Menu and sidebar configuration |
| **Components** | `_includes/` | Reusable HTML components |

## Quick Customizations

### Site Identity

Update `_config.yml`:

```yaml
title: "Your Site Title"
subtitle: "Your tagline"
description: "Site description for SEO"
author:
  name: "Your Name"
  email: "you@example.com"
  bio: "About the author"
logo: /assets/images/logo.png
```

### Colors and Branding

Create or edit `_sass/custom.scss`:

```scss
// Override Bootstrap variables
$primary: #your-color;
$secondary: #your-color;

// Custom styles
body {
  font-family: 'Your Font', sans-serif;
}
```

### Navigation

Edit files in `_data/navigation/`:

```yaml
# _data/navigation/main.yml
- title: "Home"
  url: /
- title: "Blog"
  url: /blog/
- title: "Docs"
  url: /docs/
```

## Guides in This Section

- **[Layouts](layouts/)** — Create and customize page templates
- **[Styles](styles/)** — CSS customization and theming
- **[Navigation](navigation/)** — Configure menus and sidebars

## Layout Hierarchy

```
root.html          ← Base HTML structure
└── default.html   ← Main wrapper with navigation
    ├── home.html      ← Homepage layout
    ├── journals.html  ← Blog posts
    ├── collection.html ← Collection pages
    └── landing.html   ← Full-width landing pages
```

## Override Theme Files

To override any theme file:

1. Create the same file path in your site
2. Jekyll uses your version instead of the theme's

Example: Override the footer by creating `_includes/core/footer.html`.

## Next Steps

- [Layouts Guide](layouts/) — Page templates
- [Styles Guide](styles/) — CSS customization
- [Navigation Guide](navigation/) — Menu configuration
