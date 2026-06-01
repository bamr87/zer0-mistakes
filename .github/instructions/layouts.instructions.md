---
applyTo: "_layouts/**"
description: "Jekyll layout development guidelines for Zer0-Mistakes theme"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Jekyll Layout Guidelines

## Hierarchy

```
root.html              # base <html>, <head>, <body> shell
└── default.html       # navbar + footer + container
    ├── home.html
    ├── article.html   # blog post
    ├── collection.html
    ├── landing.html
    └── stats.html
```

Every new layout extends an existing one — never duplicate the shell.

## Required Header Comment

```liquid
{%- comment -%}
  Layout: <name>.html
  Extends: <parent layout or root>
  Purpose: <one sentence>
  Front matter required: layout, title
  Front matter optional: description, image, sidebar
{%- endcomment -%}
---
layout: <parent>
---
```

## Front Matter (page-level)

| Field | Required | Notes |
|---|---|---|
| `layout` | yes | Must match a file in `_layouts/` |
| `title` | yes | Page <h1> + `<title>` |
| `description` | recommended | 120–160 chars; feeds SEO |
| `image` | optional | Open Graph + Twitter card |
| `permalink` | optional | Override default URL |
| `sitemap` | optional | `false` to exclude |

## Bootstrap 5 Patterns

Use Bootstrap utilities first. Drop to custom CSS only when no utility fits.

```html
<div class="container py-4">
  <div class="row g-3">
    <main class="col-lg-8">{{ content }}</main>
    <aside class="col-lg-4">{% include components/sidebar.html %}</aside>
  </div>
</div>
```

Components: `card`, `navbar`, `modal`, `accordion`, `offcanvas`. Wire JS via `data-bs-*` attributes — never inline `onclick`.

## Responsive Rules

- Mobile-first: design at `xs`, layer breakpoints up (`sm md lg xl xxl`).
- Hide/show by breakpoint with `d-none d-lg-block`, not custom media queries.
- Test at 360px, 768px, 1024px, 1440px before merging.

## Accessibility (non-negotiable)

- One `<h1>` per page; heading levels never skip.
- All `<img>` have `alt` (empty `alt=""` only for purely decorative).
- All interactive elements have a visible focus ring (do not strip `:focus-visible`).
- Modals: `aria-labelledby`, focus trap, restore focus on close.
- Color contrast ≥ WCAG AA (4.5:1 body, 3:1 large text).

## SEO

```liquid
{% seo %}                                                {%- comment -%} jekyll-seo-tag {%- endcomment -%}
{% include core/head.html %}                             {%- comment -%} canonical, OG, Twitter {%- endcomment -%}
```

Add JSON-LD only when the page benefits (article, breadcrumb, product). Validate with Google's Rich Results Test before shipping.

## Liquid Conventions

- Use `{%- -%}` to strip whitespace in structural tags.
- Loop with `assign`; never compute heavy work inline.
- Guard optional front matter: `{% if page.image %} … {% endif %}`.
- Pass include params explicitly: `{% include components/card.html title=post.title %}`.

## Performance

- No CDN dependencies — link `assets/vendor/bootstrap/**` only.
- Preload critical fonts in `_includes/core/head.html`.
- Lazy-load below-fold images: `<img loading="lazy" decoding="async">`.
- Run Lighthouse on each new layout — target ≥ 95 perf, ≥ 95 a11y.

## Pre-commit Checklist

- [ ] Extends an existing layout (no duplicated `<html>`)
- [ ] Required front matter documented in header comment
- [ ] Renders correctly on mobile (≤ 360 px)
- [ ] Lighthouse ≥ 95 / 95 / 95 / 90
- [ ] No console errors in browser
- [ ] `docker-compose exec -T jekyll bundle exec jekyll build` passes

---

**Related:** [`includes.instructions.md`](includes.instructions.md) · [`sass.instructions.md`](sass.instructions.md) · [`testing.instructions.md`](testing.instructions.md)
