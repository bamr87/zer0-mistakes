---
title: "Historical Releases (v0.3.0 – v0.7.0)"
description: "Condensed release notes for early zer0-mistakes versions. For v0.7.0 and later, see CHANGELOG.md."
date: 2025-10-04T20:39:25.000Z
lastmod: 2026-05-31T20:54:52.000Z
categories: [docs]
tags: [releases, history]
author: bamr87
---

# Historical Releases

> **Note**: This file covers early releases (v0.3.0–v0.7.0). For v0.8.0 and later, the canonical record is [CHANGELOG.md](../../CHANGELOG.md). For detailed historical notes on each release below, see the git tag annotations.

---

## v0.7.0 — Blog & News Architecture Redesign

**Released**: January 2026 | **Type**: Minor (new features)

- New `category.html` and `tag.html` layouts with card-grid display and breadcrumbs
- `blog.html` completely rewritten as a professional news homepage with dark header, hero section, category navigation, and sidebar widgets
- `journals.html` enhanced with author bio, related posts, and previous/next navigation cards
- New `post-card.html` and `author-card.html` reusable components
- `_data/authors.yml` for author profiles with social links
- Bug fix: resolved Liquid "nesting too deep" errors by inlining card content

**Files added**: `_layouts/category.html`, `tag.html`, `_includes/components/post-card.html`, `author-card.html`, `_data/authors.yml`, 6 category index pages, 4 sample posts.

---

## v0.5.0 — Comprehensive Sitemap Integration + First RubyGems Publish

**Released**: October 25, 2025 | **Type**: Minor (new features) | **Gem**: 3.9MB

- New `sitemap-collection.html` layout: unified site overview with statistics, interactive search/filtering, collections overview, and recent activity feed
- Site statistics dashboard with 6 real-time KPIs
- Navigation updates: sitemap added to main nav with map icon
- First public RubyGems publication: `gem install jekyll-theme-zer0`
- WCAG 2.1 AA compliant; mobile-first responsive design
- 14 files changed, +2,479 lines

---

## v0.4.0 — Statistics Dashboard

**Released**: October 10, 2025 | **Type**: Minor (new features)

- New `_layouts/stats.html` dashboard container with 6 modular components (header, overview, categories, tags, metrics, error handling)
- Ruby generator (`_data/generate_statistics.rb`) analyzes 62 content pieces, 19 categories, 47 tags and caches results as YAML
- Bootstrap 5 responsive design with tooltips, animations, and mobile-first layout
- 21 files changed, +87,693 lines (documentation and components)

---

## v0.3.0 — Mermaid Diagram Integration

**Released**: January 27, 2025 | **Type**: Minor (new feature) | **Issue**: #6

- Full Mermaid diagram support: flowcharts, sequence, class, state, ER, Gantt, pie, git graphs, journey, mindmaps
- Conditional loading via `mermaid: true` front matter — only loads when needed
- GitHub Pages compatible; dark mode (forest theme); responsive
- 16-test automated test script (`scripts/test-mermaid.sh`)
- 53% reduction in scattered Mermaid files (15 → 7); single include `_includes/components/mermaid.html`
- Documentation: comprehensive user guide + integration tutorial in `pages/_docs/jekyll/`
