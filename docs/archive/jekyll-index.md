---
title: Jekyll Documentation
description: "Complete technical documentation for Jekyll development with the Zer0-Mistakes theme — guides, tutorials, and reference material."
date: 2026-01-24T00:00:00.000Z
lastmod: 2026-01-26T00:00:00.000Z
permalink: /docs/jekyll/
tags:
  - jekyll
  - documentation
  - index
categories:
  - Documentation
layout: default
difficulty_level: beginner
estimated_time: "5 minutes"
---

# Jekyll Documentation

> Technical documentation for Jekyll development with the Zer0-Mistakes theme.

## Getting Started

| Guide | Description | Time |
|-------|-------------|------|
| [Theme Guide](theme-guide.md) | Complete setup and customization guide | 30 min |
| [Netlify Deployment](deploy-netlify.md) | Deploy to Netlify with CI/CD | 15 min |
| [Custom Domain](custom-domain.md) | Set up your own domain | 20 min |

## Features & Integrations

### Comments & Analytics

| Guide | Description | Difficulty |
|-------|-------------|------------|
| [Giscus Comments](comments-giscus.md) | GitHub Discussions-powered comments | Beginner |
| [PostHog Analytics](analytics-posthog.md) | Privacy-first analytics | Intermediate |

### Content Enhancement

| Guide | Description | Difficulty |
|-------|-------------|------------|
| [Mermaid Diagrams](diagrams-mermaid.md) | Flowcharts, sequence diagrams, and more | Beginner |
| [MathJax Formulas](math-mathjax.md) | Mathematical notation | Beginner |
| [Code Highlighting](code-highlighting.md) | Syntax highlighting for code | Beginner |

### Development

| Guide | Description | Difficulty |
|-------|-------------|------------|
| [Liquid Templating](liquid-reference.md) | Liquid template language reference | Intermediate |
| [Pagination](pagination.md) | Add navigation between posts | Beginner |
| [Security Headers](security-headers.md) | Harden your site with proper headers | Intermediate |

## Quick Reference

### Development Commands

```bash
# Start development server (Docker)
docker-compose up

# Start development server (Ruby)
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"

# Build for production
bundle exec jekyll build

# Check configuration
bundle exec jekyll doctor
```

### Essential Front Matter

```yaml
---
title: "Page Title"
description: "SEO description (150-160 chars)"
layout: default  # or journals, home
date: 2026-01-24T00:00:00.000Z
categories: [Category]
tags: [tag1, tag2]
permalink: /custom-url/

# Feature flags
mermaid: true    # Enable Mermaid diagrams
mathjax: true    # Enable MathJax formulas
comments: false  # Disable Giscus comments
---
```

### Project Structure

```
zer0-mistakes/
├── _config.yml          # Production config
├── _config_dev.yml      # Development overrides
├── _layouts/            # Page templates
├── _includes/           # Reusable components
├── _sass/               # Stylesheets
├── assets/              # Static files
├── pages/_posts/        # Blog posts
├── pages/_docs/         # Documentation
└── docs/jekyll/         # Technical docs (you are here)
```

## External Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Liquid Template Language](https://shopify.github.io/liquid/)
- [Kramdown Syntax](https://kramdown.gettalong.org/syntax.html)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

*Part of the [Zer0-Mistakes Jekyll Theme](https://github.com/bamr87/zer0-mistakes) documentation.*
