---
lastmod: 2026-06-15T00:00:00.000Z
title: Features
description: Enable and configure theme features including diagrams, comments, analytics, and more.
preview: /images/previews/features.png
layout: default
categories:
    - docs
    - features
tags:
    - features
    - configuration
permalink: /docs/features/
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
    nav: docs
---

# Features

The Zer0-Mistakes theme includes several optional features that enhance your site. Each feature can be enabled per-page using front matter.

## Available Features

Every feature has its own guide. "Enable" shows how to turn it on — page front matter, a `_config.yml` setting, or "always on" (built into the theme).

### Content & authoring

| Feature | Description | Enable |
|---------|-------------|--------|
| [Mermaid Diagrams](mermaid-diagrams/) | Flowcharts, sequence/class diagrams from text | `mermaid: true` |
| [MathJax Math](mathjax-math/) | LaTeX-style equations, rendered in the browser | `mathjax: true` |
| [Jupyter Notebooks](jupyter-notebooks/) | Publish `.ipynb` notebooks as pages | drop into `pages/_notebooks/` |
| [Code Copy Button](code-copy/) | One-click copy on every code block | always on |
| [AI Preview Images](preview-image-generator/) | Auto-generate social/OG images for posts | `_config.yml` |

### Navigation & accessibility

| Feature | Description | Enable |
|---------|-------------|--------|
| [Sidebar Navigation](sidebar-navigation/) | Collapsible docs sidebar with scroll spy | `sidebar.nav` |
| [Table of Contents](toc/) | Auto "On this page" list with active highlighting | `toc: true` |
| [Mobile TOC Button](mobile-toc/) | Floating TOC button on phones | always on |
| [Breadcrumbs](breadcrumbs/) | Hierarchical trail + Schema.org markup | `breadcrumbs: true` |
| [Back to Top](back-to-top/) | Floating scroll-to-top button | always on |
| [Dynamic Navigation](dynamic-navigation/) | Auto-builds the navbar from collections | automatic fallback |
| [Navigation Architecture](navigation-architecture/) | The ES6 modules behind the nav system | always on |
| [Keyboard Navigation](keyboard-navigation/) | Shortcuts + focus management (press `?`) | always on |
| [Skip to Content](skip-to-content/) | WCAG skip link for keyboard users | always on |

### Appearance & admin

| Feature | Description | Enable |
|---------|-------------|--------|
| [Dark / Light Mode](color-modes/) | Light, dark, and auto color modes + 9 skins | always on |
| [Admin Dashboards](admin-dashboard/) | Config, stats, theme, and build dashboards | `layout: admin` |
| [Vendored Assets](vendored-assets/) | Bootstrap/Icons/Mermaid committed, no CDN | build-time |
| [Theme Version](theme-version/) | Surface the installed theme version | automatic |

### Engagement & analytics

| Feature | Description | Enable |
|---------|-------------|--------|
| [Site Search](site-search/) | Client-side search modal (press `/`) | always on |
| [Giscus Comments](giscus-comments/) | GitHub Discussions-powered comments | `comments: true` + `giscus:` |
| [PostHog Analytics](posthog-analytics/) | Privacy-first analytics, consent-gated | `posthog:` (production) |
| [AI Chat Assistant](ai-chat-assistant/) | Page-aware Claude chat widget | `ai_chat.enabled` |
| [Copilot / AI Integration](copilot-integration/) | Repo-wide AI coding-agent instructions | repo config |

### Privacy & resilience

| Feature | Description | Enable |
|---------|-------------|--------|
| [Cookie Consent](cookie-consent/) | GDPR/CCPA banner gating analytics | site-wide |
| [Smart 404](smart-404/) | Deployment-aware "page not found" with search | automatic |

## Quick Enable

### Per-Page Features

Add to your page's front matter:

```yaml
---
title: "My Page"
mermaid: true      # Enable Mermaid diagrams
mathjax: true      # Enable MathJax formulas
comments: true     # Enable Giscus comments
---
```

### Site-Wide Features

Configure in `_config.yml`:

```yaml
# Analytics (production only)
posthog:
  enabled: true
  api_key: "your-api-key"

# Comments
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"

# Diagrams
mermaid:
  src: '/assets/vendor/mermaid/mermaid.min.js'
```

## Feature Guides

### Content Enhancement

- **[Mermaid Diagrams](mermaid-diagrams/)** — Create flowcharts, sequence diagrams, class diagrams, and more using text-based syntax
- **[MathJax Math](mathjax-math/)** — Display mathematical equations using LaTeX notation

### User Engagement

- **[Giscus Comments](giscus-comments/)** — Add GitHub Discussions-powered comments to your pages
- **[PostHog Analytics](posthog-analytics/)** — Privacy-first analytics with custom event tracking

### Accessibility

- **[Keyboard Navigation](keyboard-navigation/)** — Comprehensive keyboard shortcuts and accessibility features

## Conditional Loading

Features are loaded conditionally to optimize performance:

- **Mermaid** — Only loaded on pages with `mermaid: true`
- **MathJax** — Only loaded on pages with `mathjax: true`
- **Analytics** — Only loaded in production environment
- **Comments** — Only shown when enabled and `comments != false`

## Disabling Features

### Per-Page

```yaml
---
comments: false   # Disable comments on this page
---
```

### Site-Wide (Development)

In `_config_dev.yml`:

```yaml
posthog:
  enabled: false

giscus:
  enabled: false
```

## Next Steps

Choose a feature to learn more:

- [Mermaid Diagrams](mermaid-diagrams/) — Visual documentation
- [MathJax Math](mathjax-math/) — Mathematical notation
- [Giscus Comments](giscus-comments/) — User engagement
- [PostHog Analytics](posthog-analytics/) — Site insights

## See also

- [[Customization]]
- [[Bootstrap Integration]]
- [[Analytics]]
- [[SEO]]
