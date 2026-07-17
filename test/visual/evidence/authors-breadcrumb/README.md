# Evidence — /authors/ breadcrumb is existence-gated (issue #204)

## What changed

`_layouts/author.html` renders a breadcrumb:

```
Home > Authors > <author name>
```

**Before the fix**, "Authors" was an **unconditional** `<a href="/authors/">` link. On a remote-theme GitHub Pages consumer the `/authors/` index is plugin-generated (`_plugins/author_pages_generator.rb`, not run under Pages safe mode), so the link 404s on every author profile page.

**After the fix**, the link is existence-gated: it renders as `<a>` only when `/authors/` is present in `site.html_pages` (or a collection doc), and falls back to plain text otherwise — exactly like the patterns in `_includes/navigation/breadcrumbs.html` and `_includes/components/author-bio.html`.

## WCAG criterion

**SC 2.4.4 — Link Purpose (In Context)**: a breadcrumb `<a>` whose href 404s makes the link purpose undeterminable. Rendering the item as plain text when the target doesn't exist satisfies the intent of SC 2.4.4 (the text describes the current navigation level, and no broken link is offered).

## Before → After diff (Liquid)

```diff
-    <li class="breadcrumb-item"><a href="{{ '/authors/' | relative_url }}">Authors</a></li>
+    <li class="breadcrumb-item">
+      {%- if _authors_page -%}
+        <a href="{{ _authors_url | relative_url }}">Authors</a>
+      {%- else -%}
+        Authors
+      {%- endif -%}
+    </li>
```

Where `_authors_page` is set by:

```liquid
{%- assign _authors_url = '/authors/' -%}
{%- assign _authors_page = site.html_pages | where: "url", _authors_url | first -%}
{%- unless _authors_page -%}
  {%- for _col in site.collections -%}
    {%- assign _authors_page = _col.docs | where: "url", _authors_url | first -%}
    {%- if _authors_page -%}{%- break -%}{%- endif -%}
  {%- endfor -%}
{%- endunless -%}
```

## Jekyll build evidence

The fix was validated with a Docker-compose Jekyll build (both config layers):

```
bundle exec jekyll build --config '_config.yml,_config_dev.yml'
→ done in ~15 seconds, 0 errors, 0 warnings
```

On the full local site `/authors/` exists, so the breadcrumb renders as an `<a href="/authors/">Authors</a>` link (confirmed via `grep` of `_site/authors/bamr87/index.html`).

## Rendered output confirmation

From `_site/authors/bamr87/index.html` (post-fix build):

```html
<!-- BREADCRUMB -->
<nav aria-label="breadcrumb" class="mb-3">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/">Home</a></li>
    <li class="breadcrumb-item"><a href="/authors/">Authors</a></li>
    <li class="breadcrumb-item active" aria-current="page">Amr Abdel-Motaleb</li>
  </ol>
</nav>
```

When `/authors/` exists in the build, the link is preserved (no regression). When `/authors/` is absent (remote-theme consumer), the Liquid guard renders:

```html
<li class="breadcrumb-item">Authors</li>
```

— plain text, no broken link.

## Regression test

[`../../authors-breadcrumb-degradation.spec.js`](../../authors-breadcrumb-degradation.spec.js) (Playwright, smoke tier) asserts:
- When `/authors/` exists, the breadcrumb contains an `<a href="/authors/">`.
- The link target resolves with HTTP 200.
- The active crumb correctly identifies the current author page.
