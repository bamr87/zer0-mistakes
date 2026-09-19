---
title: Extension Points
description: The supported hooks a site built on Zer0-Mistakes can use — the code-block lifecycle event, per-page styles and scripts, the wiki index entry shape, and the custom include stubs.
lastmod: 2026-09-18T00:00:00.000Z
layout: default
author: bamr87
categories:
  - docs
  - customization
tags:
  - extension-points
  - javascript
  - front-matter
  - consumers
keywords:
  - jekyll theme extension points
  - code block event
  - per page scripts
  - wiki index
permalink: /docs/customization/extension-points/
difficulty: intermediate
estimated_reading_time: 6 minutes
styles:
  - /assets/css/extension-points-demo.css
scripts:
  - /assets/js/extension-points-demo.js
---

A theme consumed unpinned through `remote_theme` gives you exactly two kinds of surface: the ones it promises to keep, and the ones you reverse-engineer and then re-reverse-engineer after every refactor. This page is the first kind. Everything below is a contract — an event name, a `detail` shape, a frontmatter key, a JSON field — and the theme's own test suite fails if one of them changes shape.

This page is also its own demonstration. The stylesheet and the script that decorate the code blocks below are attached by this page's frontmatter, and the extra button in each code-block header is added by that script through the event. Nothing here is special-cased in the theme.

## 1. Code-block actions — `zer0:code-block-ready`

`.code-block-header` is built at runtime by `assets/js/code-copy.js`, not emitted at build time, so there is nothing in the markup to hook. The theme publishes every decorated block instead.

```javascript
window.zer0OnCodeBlock(function (detail) {
  // detail = { wrapper, header, pre, code, lang }
  if (!detail.header) return;               // standalone <pre>, no header row
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Send to notes';
  detail.header.insertBefore(button, detail.header.querySelector('.copy'));
});
```

`zer0OnCodeBlock` **replays** the blocks that were already decorated before your script ran, then subscribes for any that follow. That matters more than it looks: the theme decorates on `DOMContentLoaded`, so a deferred consumer script is usually late, and a plain listener would receive nothing at all.

If you would rather listen directly, the event bubbles:

```javascript
document.addEventListener('zer0:code-block-ready', function (event) {
  event.detail.wrapper.dataset.claimed = 'yes';
});
```

| `detail` key | What it is |
| --- | --- |
| `wrapper` | The element the event was dispatched from — the Rouge `.highlight` wrapper, or the `<pre>` itself for a standalone block. |
| `header` | The `.code-block-header` row, or **`null`** when the block has no header (a standalone `<pre>`). |
| `pre` | The `<pre>` element. Focusable, with `role="region"` and an `aria-label`. |
| `code` | The `<code>` element, for reading the block's text. |
| `lang` | The language label (`bash`, `javascript`, …), or `null` when the block declares none. |

Three guarantees worth relying on:

- **Exactly one event per code block.** No consumer is ever handed a duplicate.
- **Dispatched last.** Line numbers, the a11y attributes, and the copy button are all in place before you see the block.
- **`window.__zer0CodeBlocks`** holds the same details for every block processed so far, if you would rather read an array than subscribe.

## 2. Per-page styles and scripts

Attach assets to one page from its frontmatter, rather than putting `<link>` and `<script>` tags in prose:

```yaml
---
title: My notes workbench
styles:
  - /assets/css/notes.css
scripts:
  - /assets/js/notes-clipper.js
---
```

Site-relative paths are passed through `relative_url`, so a `baseurl` deployment stays correct. An absolute URL (anything containing `//`) is emitted untouched. A single string works as well as a list.

`styles:` renders in `<head>`, after the theme's own CSS, so your rules win on equal specificity. `scripts:` renders at the end of `<body>` with `defer`, after the theme's bundle — which is why a page script can call `zer0OnCodeBlock` without checking whether the theme has loaded yet.

A page that sets neither key emits nothing at all.

## 3. The wiki index — `/assets/data/wiki-index.json`

One entry per document, already built for you, with the link graph resolved:

```json
{
  "title": "Extension Points",
  "basename": "extension-points",
  "url": "/docs/customization/extension-points/",
  "collection": "docs",
  "lastmod": "2026-09-18T00:00:00+00:00",
  "description": "The supported hooks a site built on Zer0-Mistakes can use…",
  "tags": ["extension-points"],
  "categories": ["docs"],
  "aliases": [],
  "outgoing": ["some other note"],
  "excerpt": "A theme consumed unpinned through remote_theme…"
}
```

`lastmod` is ISO-8601, resolved from `last_modified_at`, then `lastmod`, then the document's `date` — sort the strings directly, no parsing needed. `description` is the **authored** subtitle, which is usually a better card line than `excerpt`, since `excerpt` is derived from the body.

Both keys are always present. When a document carries neither, the value is `null` rather than the key being absent — a key that sometimes disappears is a worse contract than one that is sometimes null.

## 4. Include stubs — `_includes/custom/*`

The theme ships four empty includes it renders at fixed points. Shadow the one you need in your own `_includes/custom/` and it is picked up; no theme file is forked.

| Stub | Rendered |
| --- | --- |
| `custom/head.html` | End of `<head>` — JSON-LD, font preloads, verification tags |
| `custom/footer.html` | After the theme footer, before the consent banner |
| `custom/body-end.html` | Last thing before `</body>` |
| `custom/comments.html` | Where the comment provider mounts |

## What is *not* a contract

Wrapper nesting, class names inside `.code-block-header`, and the shape of the DOM that `code-copy.js` builds are all internal. If you find yourself reaching for a `MutationObserver` over `#main-content`, or scoping a rule to `.code-block-header .my-button` to win a specificity fight, that is a missing extension point — please [open an issue](https://github.com/bamr87/zer0-mistakes/issues) rather than pinning to today's markup.
