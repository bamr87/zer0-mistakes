---
title: Page-tree sidebar
description: Build the left sidebar automatically from your page URLs — a collapsible tree grouped by section — with no curated _data/navigation file.
layout: default
categories:
  - docs
  - features
tags:
  - navigation
  - sidebar
  - liquid
permalink: /docs/features/sidebar-page-tree/
date: 2026-07-23T00:00:00.000Z
lastmod: 2026-07-23T00:00:00.000Z
sidebar:
  nav: pages
  base: /docs/
  title: All docs
---

# Page-tree sidebar (`nav: pages`)

The `pages` sidebar mode derives the left-sidebar tree **from your content's URLs** — no curated `_data/navigation/*.yml` file to write or keep in sync. Point it at a base path and it lists every page under that prefix, grouped by its first path segment into collapsible sections.

This page itself uses it: the sidebar on the left is the whole `/docs/` area, grouped by section, built purely from page permalinks.

## When to use it

- A docs area, knowledge base, or vendored content set where pages share a common URL prefix (`/docs/`, `/guide/`, `/kb/…`).
- You don't want to hand-maintain (or generate) a navigation data file.

For a Jekyll **collection**, the [`collection`](/docs/features/sidebar-navigation/) mode already builds a folder tree; `pages` additionally covers plain (non-collection) pages, and works across both.

## Enable it

Set it site-wide, per collection, or per page via the `sidebar` hash:

```yaml
sidebar:
  nav: pages
  base: /docs/            # required — the URL prefix to root the tree at
  order_by: nav_order     # optional — front-matter key to sort each section by
  title: All docs         # optional — sidebar heading
  expand: false           # optional — true expands every section
```

Most sites set it once in `_config.yml` `defaults` for the relevant path scope, so every page under it gets the tree automatically.

## How the tree is built

- Every page (and collection document) whose URL starts with `base` is collected.
- The page at `base` itself becomes the top "overview" link.
- The remaining pages are grouped by the **first path segment after `base`** (the section), each rendered as a collapsible group. A section's index page (`…/<section>/`) becomes the group's own link.
- Section labels come from the URL segment (humanized), so a generic index-page title never leaks into the sidebar.

## Ordering

Jekyll's `sort` is numeric-aware, so a numeric `order_by` field gives natural order:

```yaml
# in each child page's front matter
nav_order: 10   # sorts 0,1,2,…,10,11 (not 0,1,10,11,2)
```

Without `order_by`, sections' pages sort by URL. Sections themselves are alphabetical.

## Per-page controls

- `sidebar_label: "Level 3"` — override a single link's text (else the page title).
- `sidebar_exclude: true` — hide a page from the tree.

## Notes

- Pure Liquid — GitHub Pages / remote-theme safe, no plugin required.
- Only the current page is marked active, and the section containing it is expanded on load (no JavaScript).
