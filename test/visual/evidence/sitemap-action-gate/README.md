# Evidence — search-modal form action existence-gate (issue #202)

## What changed

`_includes/components/search-modal.html` gates the `<form action>` attribute on whether `/sitemap/` is present in the build:

- **Sitemap page present** → `action="/sitemap/"` (the canonical search-results
  page for this theme).
- **Sitemap page absent** → `action="#"` (safe no-op; the form navigates
nowhere, which is correct because `search-modal.js` always intercepts the submit event and keeps results in-modal regardless).

**Before the fix**, the form always rendered `action="/sitemap/"` regardless of whether that page existed. On a remote-theme GitHub Pages consumer that hasn't committed a `/sitemap/` stub the form submission (no-JS path) would navigate to a 404.

**After the fix**, the form action is determined by a Liquid existence gate that inspects `site.html_pages` (and then each collection's `docs` as a fallback) for a page with `url == "/sitemap/"` before emitting the href.

## Why this is a behavioural / unrendered change

The search modal looks identical under both conditions — the Bootstrap modal markup, styles, input field, and submit button are unchanged. The only difference is the value of the `action` attribute on the `<form>` element, and that attribute is invisible to a sighted user in the rendered page. A screenshot before and after would show no difference.

JavaScript intercepts every submit via the `[data-search-form]` selector in `assets/js/search-modal.js`, so the attribute has no runtime effect in a JS-enabled browser. Its only practical consequence is the no-JS fallback URL — a path that produces a 404 on remote-theme deployments without `/sitemap/`.

Evidence for this change is therefore a DOM/template comparison, not a screenshot comparison.

## Before → After diff (Liquid)

```diff
-<form action="{{ '/sitemap/' | relative_url }}" method="get" data-search-form>
+{%- assign _search_sitemap_url  = "/sitemap/" -%}
+{%- assign _search_sitemap_page = site.html_pages | where: "url", _search_sitemap_url | first -%}
+{%- unless _search_sitemap_page -%}
+  {%- for col in site.collections -%}
+    {%- assign _search_sitemap_page = col.docs | where: "url", _search_sitemap_url | first -%}
+    {%- if _search_sitemap_page -%}{%- break -%}{%- endif -%}
+  {%- endfor -%}
+{%- endunless -%}
+{%- if _search_sitemap_page -%}
+  {%- assign _search_form_action = "/sitemap/" | relative_url -%}
+{%- else -%}
+  {%- assign _search_form_action = "#" -%}
+{%- endif -%}
+
+<form action="{{ _search_form_action }}" method="get" data-search-form>
```

## Rendered output under the two conditions

**Condition A — local dev build (`/sitemap/` exists in `site.html_pages`)**

```html
<form action="/sitemap/" method="get" data-search-form>
```

**Condition B — remote-theme Pages consumer (`/sitemap/` absent from build)**

```html
<form action="#" method="get" data-search-form>
```

## Parallel guards in the codebase

This pattern mirrors two pre-existing existence gates:

- **`_includes/core/footer.html`** (lines 149-160) — the Quick Links block
  gates the "Sitemap" footer link on `_sitemap_page` via the same
  `site.html_pages | where: "url", _sitemap_url | first` idiom; falls back to
  linking the XML sitemap if the HTML sitemap is absent.
- **`_includes/navigation/section-sidebar.html`** (lines 67-73, 131-134) —
  the "Browse All Tags" button is gated on `_tags_page` (a
  `site.html_pages | where: "url", _tags_url | first` check), with the
comment "Mirrors the footer Quick-Links guard". The search-modal gate is written to the same contract.

## Regression spec

[`../../search-modal-action-gate.spec.js`](../../search-modal-action-gate.spec.js) (Playwright, smoke tier) asserts:

- The dev build serves `/sitemap/` with HTTP 200 (precondition).
- After opening the modal via the `/` keyboard shortcut, the `[data-search-form]`
  `action` attribute matches `/sitemap/` (positive branch).
- The form action target resolves with HTTP 200 (not 404) and is not `#` in a
  full build.

The negative branch (`action="#"`) cannot be demonstrated via a live server test without rebuilding the site without the sitemap page; it is covered by reading the Liquid source and by the spec comment explaining how a pre-fix template would fail.
