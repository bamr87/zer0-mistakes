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

- **Jekyll 3.9.5** — Static site generator
- **Bootstrap 5.3.3** — CSS framework (vendored in `assets/vendor/`)
- **Docker** — Development environment (Ruby 3.3-slim)
- **Ruby Gems** — Theme distribution (v0.22.13)

## Key Directories

```
zer0-mistakes/
├── _layouts/          # 16 page templates
│   ├── root.html      # Base HTML structure
│   ├── default.html   # Main wrapper with navigation
│   ├── article.html   # Blog posts (replaces journals)
│   ├── admin.html     # Admin dashboards
│   ├── landing.html   # Marketing/landing pages
│   ├── news.html      # News index
│   ├── search.html    # Search results
│   ├── stats.html     # Statistics dashboard
│   └── ...            # collection, home, note, notebook, section, tag, etc.
├── _includes/         # Reusable components
│   ├── core/          # head, header, footer, branding
│   ├── content/       # giscus, toc, seo, intro
│   ├── analytics/     # posthog, google analytics/tag manager
│   ├── navigation/    # sidebar, breadcrumbs, navbar, nav-tree
│   ├── components/    # mermaid, alerts, cookie-consent, theme-info, searchbar
│   ├── landing/       # Landing page sections
│   ├── setup/         # Browser-based setup wizard
│   ├── search/        # Search-related includes
│   ├── stats/         # Statistics components
│   └── docs/          # Documentation-specific includes
├── _sass/             # Stylesheets (core, theme, custom)
├── _plugins/          # Jekyll plugins (theme_version.rb, etc.)
├── assets/            # Static files
│   ├── css/           # Compiled CSS
│   ├── js/            # JavaScript modules (navigation, skin-editor, etc.)
│   ├── images/        # Images and previews
│   └── vendor/        # Vendored Bootstrap, Icons, Mermaid, MathJax
├── pages/             # Content collections
│   ├── _posts/        # Blog posts (news sections)
│   ├── _docs/         # User documentation
│   ├── _notes/        # Developer reference notes
│   ├── _notebooks/    # Jupyter notebooks
│   └── _quests/       # Tutorial content
├── docs/              # Developer documentation (you are here)
├── scripts/           # Build and automation scripts
│   ├── bin/           # Executable scripts (build, release)
│   ├── lib/           # Shared script libraries
│   ├── platform/      # Platform-specific setup (macOS, Linux, WSL)
│   ├── release/       # Release automation
│   └── utils/         # Utility functions
├── templates/         # Scaffolding templates for new sites
├── test/              # Test suite (core, deployment, quality, installation)
└── docker/            # Docker configurations and publishing
```

## Component Architecture

### Layout Hierarchy

```
root.html              ← Base HTML structure
└── default.html       ← Main wrapper with navigation
    ├── home.html      ← Homepage
    ├── article.html   ← Blog posts
    ├── collection.html ← Collection pages
    ├── section.html   ← Section index pages
    ├── search.html    ← Search results
    ├── stats.html     ← Statistics dashboard
    ├── note.html      ← Developer notes
    ├── notebook.html  ← Jupyter notebooks
    ├── tag.html       ← Tag pages
    └── sitemap-collection.html ← Sitemap
landing.html           ← Landing/marketing pages
admin.html             ← Admin dashboards
news.html              ← News index (14 includes — near Liquid nesting limit)
```

### Include Organization

- **core/** — Essential page components (head, header, footer, branding)
- **content/** — Content enhancement (TOC, comments, SEO, intro)
- **analytics/** — Tracking and analytics (PostHog, Google Analytics, GTM)
- **navigation/** — Navigation components (sidebar, breadcrumbs, navbar, nav-tree)
- **components/** — Feature-specific components (mermaid, cookie-consent, theme-info, searchbar, skin-editor)
- **landing/** — Landing page section components
- **setup/** — Browser-based setup wizard includes
- **stats/** — Statistics dashboard components
- **docs/** — Documentation-specific includes

## Configuration

The theme uses a dual-configuration system:

| File | Environment | Purpose |
|------|-------------|---------|
| `_config.yml` | Production | Full configuration for deployment (`remote_theme: bamr87/zer0-mistakes`) |
| `_config_dev.yml` | Development | Overrides for local development (`remote_theme: false`) |

## For Contributors

Before contributing, understand:

1. [Project Structure](project-structure.md) — Where files belong
2. [Layouts and Includes](layouts-includes.md) — Template conventions
3. [Build System](build-system.md) — How to test changes

## Related Documentation

- [Release Automation](../systems/release-automation.md) — CI/CD and releases
- [Development Setup](../development/local-setup.md) — Getting started
- [Dependency Management](../DEPENDENCY_MANAGEMENT.md) — Zero-pin strategy
- [Ruby Version Management](../RUBY_VERSION_MANAGEMENT.md) — Ruby 3.3 strategy
