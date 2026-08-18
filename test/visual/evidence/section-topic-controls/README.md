# Evidence — section sidebar topic controls

Change: the section sidebar no longer emits sub-topic anchors that point at nothing. Where a scroll target provably exists it still emits a link; everywhere else it emits a filter button wired to the layout's existing `[data-filter]` handler.

## The defect

`_includes/navigation/section-sidebar.html` emitted
`<a href="#{{ subcat | slugify }}">` for **every** tag with at least one post.
The matching target — `<section id="{{ subcat | slugify }}">` in
`_layouts/section.html` — is emitted **only** inside `{% if section_style == "magazine" %}`, and there only for `sub_categories limit: 5`, and only when that tag still has a post after the featured hero is excluded.

Two consequences, both live on this repo's own demo site:

- **`grid` and `list` sections emitted one dead anchor per tag.** Neither branch
emits any sub-topic `id`. `section_style` also *defaults* to `grid` (`_layouts/section.html:102`), so this was the common case, not the edge case.
- **`magazine` sections emitted dead anchors for tags 6–15**, because the sidebar
  iterated `limit: 15` while the layout rendered `limit: 5`.

Dead anchors are invalid markup, a dead click for keyboard and screen-reader users, and they left the sidebar's `IntersectionObserver` scrollspy unable to activate — while the include's own header advertises "Smooth scroll to sections" as a feature.

This is what took `lifehacker.dev`'s `main` red: its `/news/wire/` page is `section_style: grid`, and a dispatch that coined the tags `slop` and `writing` pushed its HTML-Proofer link check over the gate.

## Before → after

Clean build (`rm -rf _site .jekyll-cache`) of this repo's demo site, every `href="#…"` resolved against every `id` in the emitted HTML.

| Page | Style | Dangling before | Dangling after | Sidebar controls after |
|---|---|---:|---:|---|
| `/news/science/` | grid | 7 | **0** | 8 buttons |
| `/news/development/` | grid | 13 | **0** | 14 buttons |
| `/news/technology/` | grid | 21 | **0** | 16 buttons |
| `/news/business/` | list | 7 | **0** | 8 buttons |
| `/news/world/` | magazine | 5 | **0** | 4 links |
| `/news/tutorial/` | magazine | 11 | **0** | 6 links |
| **Total** | | **64** | **0** | |

On the magazine pages the surviving link count equals the number of `<section id>` targets the layout actually rendered (world 4↔4, tutorial 6↔6) — the sidebar and the layout now agree by construction rather than by coincidence.

## What changed

- `_includes/navigation/section-sidebar.html` — takes `section_style`; builds
`_linkable_subcats` by reproducing the layout's own set (limit 5, featured hero excluded) and emits anchors only from it; every other style emits `<button data-filter>`. The scrollspy and smooth-scroll handlers are scoped to `a.nav-link` so they no longer strip `active` from the buttons.
- `_layouts/section.html` — passes `section_style` to the include; adds
`data-tags` to the `list` branch's article (without it, filter buttons in a list section would have been inert); the `[data-filter]` handler now toggles `active` for all controls but applies the `btn-*` pill colours only to elements that are actually pills, so sidebar nav items keep their own styling.

A side effect worth naming: because both the pills and the sidebar carry `[data-filter]` and share one handler, they now stay in sync — filtering from either updates both.

## Not verified here

No browser screenshots were captured in this sandbox; the table above is measured from the emitted HTML. Interactive behaviour — filtering, the "All Articles" reset, and the link/button split per style — is covered by `test/visual/features/section-topic-controls.spec.js`, which runs in CI.
