---
title: "Project Structure"
description: "A tour of the Zer0-Mistakes theme repository: directory layout, key files, content collections, and where layouts, includes, and scripts live."
date: 2026-01-25T03:38:33.000Z
lastmod: 2026-06-01T03:38:46.000Z
categories: [docs]
tags: [architecture, design]
author: bamr87
---

# Project Structure

Overview of the Zer0-Mistakes theme directory layout and file organization.

## Root Directory

```text
zer0-mistakes/
├── _config.yml           # Production Jekyll configuration
├── _config_dev.yml       # Development overrides
├── Gemfile               # Ruby dependencies
├── Gemfile.lock          # Locked dependency versions
├── docker-compose.yml    # Docker development environment
├── Makefile              # Build automation shortcuts
├── README.md             # Project overview
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT license
└── index.html            # Site homepage
```

## Core Directories

### `_layouts/`

Page templates that define the structure of different page types:

```text
_layouts/
├── root.html         # Base HTML structure (doctype, html, head, body)
├── default.html      # Main wrapper with header, footer, sidebar
├── home.html         # Homepage layout
├── journals.html     # Blog post layout
├── collection.html   # Collection index pages
├── landing.html      # Full-width landing pages
├── category.html     # Category archive pages
├── tag.html          # Tag archive pages
└── stats.html        # Statistics dashboard
```

### `_includes/`

Reusable HTML components organized by function:

```text
_includes/
├── core/             # Essential page structure
│   ├── head.html     # <head> section with meta, CSS, scripts
│   ├── header.html   # Site header and main navigation
│   ├── footer.html   # Site footer
│   └── scripts.html  # JavaScript includes
├── content/          # Content enhancement
│   ├── giscus.html   # Comments integration
│   ├── toc.html      # Table of contents
│   ├── seo.html      # SEO meta tags
│   └── ...
├── analytics/        # Tracking scripts
│   ├── posthog.html
│   └── google.html
├── navigation/       # Navigation components
│   ├── sidebar.html
│   ├── breadcrumbs.html
│   └── pagination.html
└── components/       # Feature-specific
    ├── mermaid.html
    ├── mathjax.html
    └── ...
```

### `_sass/`

SCSS stylesheets:

```text
_sass/
├── core/             # Core theme styles
│   ├── _variables.scss
│   ├── _base.scss
│   └── ...
├── custom.scss       # User customizations
└── notebooks.scss    # Jupyter notebook styles
```

### `assets/`

Static files served directly:

```text
assets/
├── css/
│   └── main.scss     # Main stylesheet (imports _sass/)
├── js/
│   ├── main.js
│   └── ...
└── images/
    └── ...
```

### `pages/`

Content collections:

```text
pages/
├── _posts/           # Blog posts (date-prefixed)
├── _docs/            # User documentation
├── _quickstart/      # Quick start guides
├── _about/           # About pages
├── _notebooks/       # Jupyter notebooks
├── index.html        # Pages index
├── blog.md           # Blog listing
├── categories.md     # Category listing
├── tags.md           # Tag listing
└── ...
```

### `docs/`

Developer documentation (this directory):

```text
docs/
├── README.md         # Documentation hub
├── architecture/     # Codebase architecture
├── systems/          # Automation systems
├── implementation/   # Feature implementation details
├── development/      # Development guides
├── releases/         # Release notes
├── configuration/    # Configuration guides
├── templates/        # Documentation templates
└── archive/          # Historical documentation
```

### `scripts/`

Build and automation scripts:

```text
scripts/
├── release           # Release automation
├── build             # Gem building
├── lib/              # Shared script libraries
│   ├── common.sh
│   ├── version.sh
│   └── ...
└── test/             # Test scripts
```

### `_data/`

Jekyll data files:

```text
_data/
├── navigation/       # Navigation configurations
│   ├── main.yml
│   ├── docs.yml
│   └── ...
├── authors.yml       # Author information
├── ui-text.yml       # UI strings
└── ...
```

### `_plugins/`

Custom Jekyll plugins:

```text
_plugins/
└── theme_version.rb
```

## Build Output

```text
_site/                # Generated static site (gitignored)
```

## Docker Configuration

```text
docker/
├── Dockerfile        # Container definition
├── config/           # Docker-specific configs
└── README.md
```

## Distribution

```text
lib/                  # Gem library code
pkg/                  # Built gem packages
*.gemspec             # Gem specification
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Posts | `YYYY-MM-DD-title-slug.md` | `2026-01-24-getting-started.md` |
| Docs | `kebab-case.md` | `quick-start.md` |
| Layouts | `lowercase.html` | `journals.html` |
| Includes | `kebab-case.html` | `table-of-contents.html` |
| Sass | `_partial.scss` | `_variables.scss` |
| Scripts | `kebab-case` or `snake_case.sh` | `release`, `test_suite.sh` |

## Related

- [Layouts and Includes](layouts-includes.md)
- [Build System](build-system.md)
