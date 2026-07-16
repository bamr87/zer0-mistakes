# Evidence — `show_hero` front-matter flag opts standard posts into the article hero (issue #303)

`_layouts/article.html` renders a post's `preview:` image as the
top-of-article hero (`figure.featured-hero`) automatically for
`featured`/`breaking` posts. `show_hero: true` lets a post of **any**
`post_type` opt into that hero without being promoted — layout width, sidebar,
typography, and the post-type badge keep their `post_type` defaults. The flag
is a third disjunct inside the existing `page.preview` guard and is `nil`
(falsy) on every existing post, so default output is unchanged by
construction.

This is a **new visual capability**, so the evidence covers both halves of
the contract: the new state (hero on the opted-in post) and the no-change
guarantee for everything else.

## How this evidence was produced

Two **real Jekyll builds of the same content** — which includes one standard
post opted in via `show_hero: true`
(`pages/_posts/2026-06-17-bayesian-modeled-my-coffee-and-wept-with-joy.md`,
the flag's demo usage):

- **BEFORE** — the merge-base `_layouts/article.html` (pre-feature): the flag
  is inert; the opted-in post renders no hero.
- **AFTER** — the PR head: the flag renders the hero; nothing else changes.

Driven by [`../../show-hero-evidence.mjs`](../../show-hero-evidence.mjs)
(exact commands in its header), which also computes a **whole-build
rendered-output diff** (normalizing non-rendered noise: HTML comments — the
layout's doc comment is emitted into every article page — the
`?v=<site.time>` cache-buster, and build timestamps).

## What each file shows

- **`01-opted-in-before-after.png`** — the opted-in standard post. BEFORE:
  no hero (pre-feature layout ignores the flag). AFTER: the preview renders
  as the hero; byline, category badge, tags, TOC, and typography are
  identical.
- **`02-scope-guard.png`** — the AFTER build's controls: a standard post
  without the flag still renders no hero, and a featured post keeps its
  automatic hero (identical to BEFORE).
- **`metrics.json`** — hero presence/loaded state per scenario, plus the
  whole-build diff result.

## Measured (from `metrics.json`)

| Post | Front matter | Hero (before) | Hero (after) |
|---|---|---|---|
| coffee post | standard + `show_hero: true` | no | **yes** (image loads) |
| favicon post | standard, no flag | no | no |
| git-workflow post | featured (auto-hero) | yes | yes |

**Whole-build diff: exactly 1 page differs between the BEFORE and AFTER
builds — the opted-in post.** Every other page's rendered output is
identical, which pins the PR's "backwards compatible by construction" claim
(the PR body's 9-case Liquid matrix, verified against real builds).

Regression test: [`../../features/layouts.spec.js`](../../features/layouts.spec.js)
("Article hero — show_hero opt-in (issue #303)", smoke tier) — hero renders
(and loads) on the opted-in demo post without a post-type badge; no hero on
an unflagged standard post; featured posts keep their automatic hero. Fails
against the pre-feature layout, where the committed fixture's flag is inert.
