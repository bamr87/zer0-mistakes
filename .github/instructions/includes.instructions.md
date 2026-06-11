---
applyTo: "_includes/**"
description: "Jekyll include development guidelines for Zer0-Mistakes theme"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Jekyll Includes — `_includes/**`

Reusable, self-contained Liquid components. Each include does one thing, accepts named parameters, fails gracefully, and degrades on mobile.

## 1. Directory Layout

```
_includes/
├── core/         # Page chrome: head, header, footer, scripts
├── components/   # Reusable UI: cards, modals, consent, theme-info
├── navigation/   # Navbar, breadcrumbs, sidebar, pagination
├── analytics/    # Tracking pixels, posthog, GA (consent-gated)
└── content/      # Markdown helpers: backlinks, wiki-graph, embeds
```

New includes go in the most specific subdirectory. Create a new top-level only if no existing one fits — and update `_includes/README.md` in the same commit.

## 2. Required Header

```liquid
{%- comment -%}
  Component:   <name>
  Path:        _includes/<subdir>/<file>.html
  Purpose:     <one-line>
  Params:      title (string, required) | class (string, optional, default: "")
  Depends on:  <other includes, configs, vendor assets>
  Notes:       <perf, a11y, mobile considerations>
{%- endcomment -%}
```

## 3. Parameter Handling

- Always provide defaults for optional params:
  ```liquid
  {%- assign css_class = include.class | default: "" -%}
  ```
- Required params: fail loud with a comment if missing:
  ```liquid
  {%- if include.title == nil -%}
    {%- comment -%} ERROR: <name> requires `title` {%- endcomment -%}
  {%- endif -%}
  ```
- Pass-through content via `include.content` or block content with `capture`.
- Whitespace: use `{%-` and `-%}` to strip whitespace; keep rendered HTML clean.

## 4. Conditional Loading

Gate environment-sensitive includes:

```liquid
{%- if jekyll.environment == "production" and site.posthog.enabled -%}
  {%- include analytics/posthog.html -%}
{%- endif -%}
```

Gate consent-required code on a `cookieConsent` cookie/localStorage flag — never load trackers before consent.

## 5. Bootstrap 5 Patterns

- Use Bootstrap 5.3.3 utility classes; avoid hand-rolled CSS when a utility exists.
- Components: `card`, `alert`, `modal`, `navbar`, `accordion`, `offcanvas` — wire them with `data-bs-*` attributes.
- Icons: Bootstrap Icons via `<i class="bi bi-…"></i>` from the local vendor bundle.
- Always include ARIA: `role`, `aria-label`, `aria-expanded`, `aria-controls`.

Example card:

```liquid
<div class="card {{ include.class | default: '' }}">
  {%- if include.image -%}
    <img src="{{ include.image | relative_url }}" class="card-img-top" alt="{{ include.alt | default: include.title }}" loading="lazy">
  {%- endif -%}
  <div class="card-body">
    <h5 class="card-title">{{ include.title }}</h5>
    <p class="card-text">{{ include.description }}</p>
  </div>
</div>
```

## 6. Accessibility (non-negotiable)

- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`.
- Heading hierarchy: only one `<h1>` per page; never skip levels.
- Every `<img>` has `alt` (empty `alt=""` for decorative).
- Every interactive element is keyboard-reachable; visible focus styles.
- Color contrast ≥ WCAG AA.
- Use `aria-live` for dynamic regions; `aria-hidden` on decorative icons.

## 7. Responsive / Mobile-First

- Start mobile, add breakpoints upward (`d-none d-md-block`, `col-12 col-md-6`).
- Lazy-load images: `loading="lazy"` and `decoding="async"`.
- Use `picture` + `srcset` for responsive images when source sizes vary.

## 8. Security

- Escape user/page content: `{{ value | escape }}` for attributes, `| strip_html` for previews.
- Use `relative_url` / `absolute_url` for all internal links.
- Sanitize HTML in user-supplied frontmatter with `| strip_html | truncate: 200`.
- Never inline `eval`-style JS; never inject `include.content` into `<script>`.

## 9. SEO Helpers

For SEO/meta includes:

```liquid
<title>{{ page.title }} | {{ site.title }}</title>
<meta name="description" content="{{ page.description | default: site.description | strip_html | truncate: 160 }}">
<link rel="canonical" href="{{ page.url | absolute_url }}">
```

## 10. Error Handling

Wrap risky lookups in defensive checks:

```liquid
{%- if site.data.navigation and site.data.navigation.main -%}
  {%- for item in site.data.navigation.main -%}
    …
  {%- endfor -%}
{%- else -%}
  {%- comment -%} navigation data missing — skipping render {%- endcomment -%}
{%- endif -%}
```

## 11. Testing Checklist

Before committing an include:

- [ ] `bundle exec jekyll build` is clean (no Liquid warnings)
- [ ] Renders on a page with **and without** every optional param
- [ ] Mobile (≤ 576px), tablet (768px), desktop (≥ 992px) all look right
- [ ] Keyboard navigation works
- [ ] Screen-reader landmarks announce correctly (test with VoiceOver / NVDA)
- [ ] No console errors in browser devtools
- [ ] Updated `_includes/README.md` if added a new include

## 12. Naming

- Lowercase, hyphen-separated: `cookie-consent.html`, `feature-card.html`.
- Match Liquid include path: `{% include components/feature-card.html %}`.
- One component per file. Split when over ~150 lines.

---

**Related:** [`layouts.instructions.md`](layouts.instructions.md) for layouts · [`sass.instructions.md`](sass.instructions.md) for styling · [`obsidian.instructions.md`](obsidian.instructions.md) for wiki/embed includes.
