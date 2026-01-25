---
title: Features
description: Enable and configure theme features including diagrams, comments, analytics, and more.
layout: default
categories:
    - docs
    - features
tags:
    - features
    - configuration
permalink: /docs/features/
difficulty: beginner
estimated_time: 5 minutes
sidebar:
    nav: docs
---

# Features

The Zer0-Mistakes theme includes several optional features that enhance your site. Each feature can be enabled per-page using front matter.

## Available Features

| Feature | Description | Front Matter |
|---------|-------------|--------------|
| [Mermaid Diagrams](mermaid-diagrams/) | Flowcharts, sequence diagrams, and more | `mermaid: true` |
| [MathJax Math](mathjax-math/) | Mathematical equations and formulas | `mathjax: true` |
| [Giscus Comments](giscus-comments/) | GitHub Discussions-powered comments | `comments: true` |
| [PostHog Analytics](posthog-analytics/) | Privacy-first web analytics | (site-wide) |
| [Keyboard Navigation](keyboard-navigation/) | Accessibility shortcuts | (always on) |

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
  src: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
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
