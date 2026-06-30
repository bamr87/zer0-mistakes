---
lastmod: 2026-06-30T00:00:00.000Z
title: Statistics Dashboard
description: Content statistics dashboard layout with metrics visualization for posts, categories, and tags across the site.
preview: /images/previews/statistics-dashboard-feature.png
layout: default
categories:
    - docs
    - features
tags:
    - dashboard
    - statistics
    - metrics
    - visualization
permalink: /docs/features/statistics-dashboard/
difficulty: intermediate
estimated_reading_time: 4 minutes
sidebar:
    nav: docs
---

# Statistics Dashboard

A ready-made dashboard that turns your content into metrics: how many posts you
have, how they break down by category, and which tags you use most. It is built
from a dedicated layout plus a set of modular include components, all fed by
generated content statistics.

## Overview

- **Post count metrics** — total content across collections at a glance.
- **Category distribution** — see where your writing concentrates.
- **Tag cloud visualisation** — surface your most-used tags.
- **Responsive card layout** — the panels reflow cleanly from mobile to desktop.

## How it works

The [`stats.html`](https://github.com/bamr87/zer0-mistakes/blob/main/_layouts/stats.html)
layout composes the dashboard from the partials under `_includes/stats/`
(header, overview, categories, tags, and metrics). The numbers come from the
content-statistics data generated during the build, so the dashboard stays in
sync with your actual content.

## Implementation

| File | Role |
| --- | --- |
| `_layouts/stats.html` | Dashboard page layout. |
| `_includes/stats/stats-header.html` | Title and summary band. |
| `_includes/stats/stats-overview.html` | Headline counts. |
| `_includes/stats/stats-categories.html` | Category distribution. |
| `_includes/stats/stats-tags.html` | Tag cloud. |
| `_includes/stats/stats-metrics.html` | Detailed metric cards. |

## Related features

- [SEO & Sitemap Generation](/docs/seo/sitemap/)
