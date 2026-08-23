---
title: "Page View Counter"
description: "How the theme tracks a page view and renders the count, with a local-first provider and an optional counter endpoint"
type: "feature-implementation"
audience: "developers"
components:
  - "_includes/components/page-views.html"
  - "_includes/components/page-views-init.html"
  - "_includes/core/head.html"
  - "_layouts/article.html"
  - "assets/js/page-views.js"
  - "_sass/components/_page-views.scss"
  - "_config.yml (page_views block)"
dependencies: ["Bootstrap 5", "Bootstrap Icons", "Jekyll", "Liquid"]
date: 2026-08-23
lastmod: 2026-08-23
categories: [docs]
tags: [features, analytics, privacy, page-views]
author: bamr87
---

# Page View Counter

## Overview

A page-view counter that **records a view for the page being read** and
**displays the count** in the article meta row, next to the reading time:

```text
Amr Abdel  •  August 23, 2026  •  4 min read  •  👁 12 views
```

The theme is a static site, so there is no server to count on by default. The
feature is therefore built around two providers, and the honest one is the
default:

| Provider | Where the count lives | What the number means | Needs |
|----------|----------------------|-----------------------|-------|
| `local` (default) | This visitor's `localStorage` | "How often **you** opened this page" | Nothing. Works on GitHub Pages, offline, in a fork. |
| `remote` | An HTTP endpoint you control | "How often **anyone** opened this page" | A counter URL that returns JSON. |

There is deliberately no third "guess a global number client-side" mode — a
static site cannot know a site-wide total without asking something, and a
counter that quietly invents one is worse than no counter.

---

## Component Diagram

```text
_config.yml                     ┌────────────────────────────────┐
  page_views:                   │ _includes/components/          │
    enabled: true      ────────▶│   page-views-init.html         │
    provider: local             │   (once, from core/head.html)  │
    dedupe: session             │  ┌──────────────────────────┐  │
    respect_dnt: true           │  │ <script id=…Config> JSON │  │
    ...                         │  │ <script defer src=…js>   │  │
                                │  └──────────────────────────┘  │
                                └───────────────┬────────────────┘
                                                │ reads config
                                                ▼
   _layouts/article.html         ┌────────────────────────────────┐
     {% include components/      │ assets/js/page-views.js        │
        page-views.html          │  1. privacy gates (DNT/GPC/    │
        separator=true %}        │     consent)                   │
              │                  │  2. record current page view   │
              │  renders         │  3. render every badge         │
              ▼                  └───────────────┬────────────────┘
   <span class="page-views"                      │ fills + unhides
         data-page-views="/url/" hidden> ◀───────┘
```

---

## Configuration

```yaml
page_views:
  enabled         : true      # Master switch for tracking + display
  provider        : 'local'   # 'local' | 'remote'
  track           : true      # false = display known counts, never record new ones
  dedupe          : 'session' # 'session' (one view per page per session) | 'never'
  max_entries     : 500       # Cap on locally stored paths (oldest evicted first)
  label_one       : 'view'
  label_other     : 'views'
  respect_dnt     : true
  respect_gpc     : true
  require_consent : false
  endpoint        : ''        # remote only
  method          : 'POST'    # remote only
  count_key       : 'views'   # remote only — dotted paths allowed ('data.views')
  fallback_local  : false     # remote only — use the local counter if the endpoint fails
```

Turn the whole feature off with `enabled: false`: the init include emits
nothing, the badge include renders nothing, and `page-views.js` is never
requested.

The same is true of an **absent** `page_views:` block, which is what a
consumer site inherits: `remote_theme` and the gem ship layouts, includes, and
assets but not `_config.yml`, so a downstream site opts in by copying the block
above into its own config. Nothing is emitted until it does.

### Wiring the remote provider

Point `endpoint` at any service that answers with JSON containing a number:

```yaml
page_views:
  provider  : 'remote'
  endpoint  : 'https://counter.example.com/views?site=zer0'   # or '…/views/{path}'
  method    : 'POST'
  count_key : 'views'
```

- `{path}` in the URL is replaced with the URL-encoded page path. Without it,
  the path is appended as `?path=…`.
- `GET`/`HEAD` methods send no body; anything else sends `{"path": "/some/page/"}`
  as JSON.
- The response is read at `count_key` (`views` by default, dotted paths
  supported). Anything that isn't a finite number is treated as "no count", and
  the badge stays hidden.
- Requests are `credentials: "omit"`, so the endpoint needs permissive CORS.

---

## Privacy

The privacy gates mirror the `posthog:` block, and they gate **recording**, not
display — showing a number that is already known collects nothing:

| Signal | Effect |
|--------|--------|
| `Do Not Track` (`respect_dnt`) | No view is recorded. |
| Global Privacy Control (`respect_gpc`) | No view is recorded. |
| `require_consent: true` | Nothing is recorded until the visitor accepts the **analytics** category in the cookie-consent banner. The pending view is recorded on the `cookieConsentChanged` event, so consenting mid-visit still counts the page being read. |

With the `remote` provider, a blocked recording still performs a read-only
`GET` so the public count renders. With `local`, there is nothing to read from
anyone else, so the badge simply stays hidden.

`dedupe: session` (the default) counts one view per path per browser session,
so a reload or a back-navigation does not inflate the number.

---

## Placing the badge

The badge include is safe to use anywhere, any number of times — each instance
resolves its own path:

```liquid
{% include components/page-views.html %}                        <!-- current page -->
{% include components/page-views.html separator=true %}          <!-- meta-row form -->
{% include components/page-views.html url=post.url class="small" %}
{% include components/page-views.html icon="bi-eye-fill" %}
```

| Param | Default | Purpose |
|-------|---------|---------|
| `url` | `page.url` | Which page's count to show |
| `class` | `""` | Extra classes on the wrapper |
| `icon` | `bi-eye` | Bootstrap icon |
| `separator` | `false` | Render a leading `•` **inside** the badge, so it hides with it |

The badge is server-rendered with the `hidden` attribute and is revealed only
once a count exists. That is what keeps a page with no data from flashing
"0 views", and why the separator lives inside the badge rather than beside it —
a hidden badge leaves no dangling bullet in the meta row.

Paths are site-relative and baseurl-free (`page.url`); `page-views.js`
normalizes `location.pathname` the same way, so a project-Pages site under a
`baseurl` does not count `/repo/foo/` separately from `/foo/`.

---

## Runtime API

`page-views.js` exposes a small surface for other scripts (and for the
Playwright spec):

```js
window.zer0PageViews.get('/posts/some-post/'); // number | null
window.zer0PageViews.all();                    // { '/path/': count, … }
window.zer0PageViews.refresh();                // re-render every badge
window.zer0PageViews.reset();                  // clear the local store + session dedupe
```

Every resolved count also fires an event, so a site can react to it without
polling:

```js
document.addEventListener('zer0:page-views', (e) => {
  console.log(e.detail); // { path, count, provider }
});
```

---

## Failure modes (all non-fatal by design)

| Situation | Behaviour |
|-----------|-----------|
| `localStorage` unavailable (private mode, blocked cookies) | Storage access is probed and wrapped; the counter degrades to "no count" and the badge stays hidden. |
| Corrupt stored payload | Discarded, store restarts empty. |
| Quota exceeded on write | Write is dropped silently — the count is a nicety, never a hard failure. |
| Remote endpoint down / CORS-blocked / wrong shape | Badge stays hidden (or falls back to the local counter with `fallback_local: true`); the reason goes to `console.debug`, not `console.error`, so it does not trip the console-error assertions in the test suite. |
| Store grows past `max_entries` | Least-recently-viewed paths are evicted first. |

---

## Related

- [`_includes/components/page-views.html`](../../_includes/components/page-views.html) — badge markup
- [`_includes/components/page-views-init.html`](../../_includes/components/page-views-init.html) — config + script bootstrap
- [`assets/js/page-views.js`](../../assets/js/page-views.js) — behaviour
- [`test/visual/features/page-views.spec.js`](../../test/visual/features/page-views.spec.js) — regression spec
- Feature registry entry: `ZER0-083`
