---
title: "Evidence — heading-level skips (WCAG 1.3.1)"
description: "Before/after for #436: components picked heading tags by font-size, producing outline skips on 391 of 415 pages. Now 66."
lastmod: 2026-09-03T00:00:00.000Z
draft: false
---

# Heading-level skips (#436)

## Why there is no screenshot

Nothing moves. The fix keeps every heading's visual size by moving it to a `.h5` / `.h6` class and changes only the tag — so a pixel diff is the *proof of correctness*, not the finding. What changed is the document outline, which is what a screen-reader user navigates by and what a camera cannot see.

## Measured across a 415-page build

| | before | after |
| --- | ---: | ---: |
| pages with at least one level skip | **391** | **66** |
| total skips | **1,060** | **173** |

`metrics.json` carries the per-source breakdown for both builds.

## The two that mattered most were not the ones the issue named first

The issue's evidence led with the cookie modal. That was right, but the aggregate says the damage was concentrated in **two** pieces of site-wide chrome, each hitting all 391 affected pages:

| source | skips | pages |
| --- | ---: | ---: |
| cookie modal — `h2` title, `h6` categories | 391 | 391 |
| settings offcanvas + language panel — `h2` title, `h6` section labels | 391 | 391 |
| author card under "About the Author" | 72 | 72 |
| related-posts card titles | 55 | 55 |

The language panel was not in the report. It ships on every page for the same reason the cookie modal does, and it was doing exactly the same thing.

## A real article outline

```
before:  h6 'Language'            <- SKIP from h2
         h2 'About the Author'
         h5 'Zer0-Mistakes Team'  <- SKIP
         h3 'Related Posts'
         h6 'Docker for Jekyll…'  <- SKIP
         h2 'Cookie Preferences'
         h6 'Essential Cookies'   <- SKIP

after:   h3 'Language'
         h2 'About the Author'
         h3 'Zer0-Mistakes Team'
         h2 'Related Posts'
         h2 'Cookie Preferences'
         h3 'Essential Cookies'
```

## A second mistake, caught by the first being fixed

`heading-outline.spec.js` originally scoped its offcanvas cases to `#infoSection`. The offcanvas is `#info-section`; `#infoSection` is its `<h2>`'s id, used by `aria-labelledby`. The region locator matched nothing, so `test.skip(count === 0)` **skipped all three cases silently** — CI printed them as `-`, not as failures, and I read the suite as passing.

Correcting the selector made them run, and they failed on a real skip I had missed:

```
h3 -> h6 at "Primary Color"
```

That heading is injected at **runtime** by `assets/js/modules/theme/appearance.js`. No grep over `_includes/` or `_layouts/` can find it — only a rendered assertion can. The same file already emitted `<h3 class="h6">` in its other branch, so the fix makes the two consistent.

**Skips are not passes.** A locator typo is indistinguishable from "this region isn't on this page" unless you look at the counts.

## The mistake worth recording

The first pass changed the six `h6` section labels in `info-section.html` and rebuilt. **Total skips went UP, 1,060 → 1,072.** Two sibling components — `background-settings.html` and `admin-links.html` — render into the same offcanvas with the same class pattern but live in separate files, so a per-file replace missed them. Moving their neighbours to `h3` turned those two into *new* `h3 → h6` skips.

A source-level review would have called the first pass done. The build is what caught it.

## Why one component takes a parameter

`author-card.html` renders under an `h2` in `author-bio.html` and under different ancestors in eleven other call sites. No single hardcoded level is correct for all of them, and picking `h5` for its font-size is what produced the original skip. Its level is now `include.heading_level`, defaulting to the historic `5` so every caller that does not say keeps its current behaviour; `author-bio.html` passes `3`.

## What is deliberately still broken

66 pages still carry 173 skips, concentrated in `news/index.html` and the section index layouts (inline card markup, not a shared component) and in page content that jumps `h1 → h3`. That is a second pass over different code, not a finishing touch on this one.

This is also why `heading-outline.spec.js` asserts on the **chrome regions** rather than whole pages. A site-wide assertion is the right eventual test; adding it now would ship a test that fails on its own branch.

## Tests, both directions

`test/visual/core/heading-outline.spec.js`, run against two served builds:

```
fixed build    5 passed
pre-fix build  5 failed
```
