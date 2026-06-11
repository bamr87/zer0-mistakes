---
title: "Obsidian Sample Note (Fixture)"
description: "Test fixture covering wiki-links, embeds, callouts, and inline tags."
layout: note
date: 2026-04-19T00:00:00.000Z
categories: [Notes, Fixtures]
tags: [obsidian, fixture, testing]
permalink: /notes/obsidian-fixture/
sitemap: false
---

This fixture exercises every feature handled by `_plugins/obsidian_links.rb`
and `assets/js/obsidian-wiki-links.js`. It is excluded from sitemaps and
intentionally lives under `pages/_notes/` so the wiki-index picks it up.

## Wiki-links

- Resolved by title: [[Markdown Formatting Tips]]
- Resolved with alias: [[Markdown Formatting Tips|the formatting cheatsheet]]
- Resolved with header anchor: [[Markdown Formatting Tips#Basic Formatting]]
- Unresolved (should render as `wiki-link-broken`): [[Definitely Not A Real Page]]

## Inline tags

The following should be linked to the tag index: #obsidian #fixture/example #integration-test

Code spans should NOT be rewritten: `[[not-a-link]]` and `#not-a-tag` stay as-is.

```text
[[also-not-a-link]] and #also-not-a-tag inside fenced code stay literal
```

## Callouts

> [!note] About callouts
> Callouts render as Bootstrap alert components. Inner **markdown** still works.

> [!warning]+ Foldable warning
> Plus sign keeps the body open by default; minus collapses it.

> [!tip]
> No title means the type name is used as the heading.

## Image embed

![[diagram.png|320]]
