# Architecture Documentation

Technical architecture documentation for the Zer0-Mistakes Jekyll theme. This documentation is intended for contributors and maintainers who need to understand the codebase structure.

## Contents

| Document | Description |
|----------|-------------|
| [Project Structure](project-structure.md) | Overview of directory layout and file organization |
| [Layouts and Includes](layouts-includes.md) | Template architecture and component system |
| [Build System](build-system.md) | Jekyll build process and Docker configuration |

## Overview

The Zer0-Mistakes theme is built on:

- **Jekyll** — Static site generator
- **Bootstrap 5** — CSS framework
- **Docker** — Development environment
- **Ruby Gems** — Theme distribution

## Key Directories

```
zer0-mistakes/
├── _layouts/          # Page templates
├── _includes/         # Reusable components
│   ├── core/          # head, header, footer
│   ├── content/       # giscus, toc, seo
│   ├── analytics/     # posthog, google
│   ├── navigation/    # sidebar, breadcrumbs
│   └── components/    # mermaid, alerts
├── _sass/             # Stylesheets
├── assets/            # Static files (CSS, JS, images)
├── pages/             # Content collections
│   ├── _posts/        # Blog posts
│   ├── _docs/         # User documentation
│   └── ...
├── docs/              # Developer documentation (you are here)
└── scripts/           # Build and automation scripts
```

## Component Architecture

### Layout Hierarchy

```
root.html              ← Base HTML structure
└── default.html       ← Main wrapper with navigation
    ├── home.html      ← Homepage
    ├── journals.html  ← Blog posts
    ├── collection.html ← Collection pages
    └── landing.html   ← Landing pages
```

### Include Organization

- **core/** — Essential page components (head, header, footer)
- **content/** — Content enhancement (TOC, comments, SEO)
- **analytics/** — Tracking and analytics
- **navigation/** — Navigation components
- **components/** — Feature-specific components

## Configuration

The theme uses a dual-configuration system:

| File | Environment | Purpose |
|------|-------------|---------|
| `_config.yml` | Production | Full configuration for deployment |
| `_config_dev.yml` | Development | Overrides for local development |

## For Contributors

Before contributing, understand:

1. [Project Structure](project-structure.md) — Where files belong
2. [Layouts and Includes](layouts-includes.md) — Template conventions
3. [Build System](build-system.md) — How to test changes

## Related Documentation

- [Release Automation](../systems/release-automation.md) — CI/CD and releases
- [Development Setup](../development/local-setup.md) — Getting started
