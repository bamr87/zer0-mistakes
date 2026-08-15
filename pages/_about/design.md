---
title: Design system
description: The zer0-mistakes design system, live — tokens, foundation specimens, component twins, and the Claude Design round-trip that keeps them in lockstep with the theme.
layout: default
icon: bi-palette2
permalink: /design/
lastmod: 2026-08-14T00:00:00.000Z
categories: [about]
tags: [design-system, tokens, ui]
---

One visual contract, stated once. The theme's `--zer0-*` tokens compile into every page of this site, mirror to a [Claude Design project](https://claude.ai/design/p/e75121c0-9210-42d1-ade3-2c8af9111cbe) for design work, and publish here as live, linkable CSS — kept in lockstep by a CI parity check.

## Use the tokens anywhere

The design system ships as one plain-CSS entry point. Link it from any prototype, mockup, or page — no Bootstrap, no build step:

```html
<link rel="stylesheet" href="{{ '/_design-system/styles.css' | absolute_url }}">
<div style="color: var(--zer0-color-primary); border-radius: var(--zer0-radius-xl);">…</div>
```

Every token file is also individually addressable — [colors]({{ '/_design-system/tokens/colors.css' | relative_url }}), [typography]({{ '/_design-system/tokens/typography.css' | relative_url }}), [spacing]({{ '/_design-system/tokens/spacing.css' | relative_url }}), [radius]({{ '/_design-system/tokens/radius.css' | relative_url }}), [breakpoints]({{ '/_design-system/tokens/breakpoints.css' | relative_url }}), [shadows]({{ '/_design-system/tokens/shadows.css' | relative_url }}), [motion]({{ '/_design-system/tokens/motion.css' | relative_url }}), [layers]({{ '/_design-system/tokens/layers.css' | relative_url }}), [skins]({{ '/_design-system/tokens/skins.css' | relative_url }}).

## Foundations, live

Each specimen below is the actual design-system card, rendered against the published tokens — not a screenshot.

<div class="row g-4 mt-1">
  {% assign ds_cards = "colors-brand.card.html|Brand & primary|240,colors-semantic.card.html|Semantic state|240,colors-surfaces.card.html|Surfaces & ink|260,colors-skins.card.html|Theme skins|260,type-headings.card.html|Display & headings|320,type-body.card.html|Body & weights|230,type-mono.card.html|Monospace & code|220,spacing-scale.card.html|Spacing scale|220,spacing-radii-elevation.card.html|Radii & elevation|240,motion.card.html|Durations & easing|260,layers.card.html|Z-index stack|300,brand-iconography.card.html|Iconography|260" | split: "," %}
  {% for card in ds_cards %}
    {% assign parts = card | split: "|" %}
    <div class="col-md-6">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-body-tertiary d-flex justify-content-between align-items-center">
          <span class="fw-semibold">{{ parts[1] }}</span>
          <a class="small text-decoration-none" href="{{ '/_design-system/guidelines/' | append: parts[0] | relative_url }}" target="_blank" rel="noopener">open <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>
        </div>
        <iframe src="{{ '/_design-system/guidelines/' | append: parts[0] | relative_url }}" title="{{ parts[1] }} specimen" loading="lazy" class="w-100 border-0 rounded-bottom" style="height: {{ parts[2] }}px;"></iframe>
      </div>
    </div>
  {% endfor %}
</div>

## Components

The theme's signature patterns exist twice on purpose: as the Liquid + Sass that renders this site, and as React twins for design-time work in Claude Design. The twins render interactively in the [Claude Design project](https://claude.ai/design/p/e75121c0-9210-42d1-ade3-2c8af9111cbe) (the component bundle is compiled by the Design app); their sources are published here.

| Component | Theme source | Design spec |
|-----------|--------------|-------------|
| Button | `cta-button.html` + Bootstrap `.btn` | [`core/Button`]({{ '/_design-system/components/core/Button.jsx' | relative_url }}) |
| Badge | `post-type-badge.html` + Bootstrap `.badge` | [`core/Badge`]({{ '/_design-system/components/core/Badge.jsx' | relative_url }}) |
| FAB stack | back-to-top / chat / TOC / graph buttons | [`core/Fab`]({{ '/_design-system/components/core/Fab.jsx' | relative_url }}) |
| Card | `.card border-0 shadow-sm` pattern | [`surfaces/Card`]({{ '/_design-system/components/surfaces/Card.jsx' | relative_url }}) |
| Feature card | landing feature cards | [`surfaces/FeatureCard`]({{ '/_design-system/components/surfaces/FeatureCard.jsx' | relative_url }}) |
| Post card | `post-card.html` | [`surfaces/PostCard`]({{ '/_design-system/components/surfaces/PostCard.jsx' | relative_url }}) |
| Callout | `callout.html` | [`feedback/Callout`]({{ '/_design-system/components/feedback/Callout.jsx' | relative_url }}) |
| Skeleton | `_skeleton.scss` shimmer | [`feedback/Skeleton`]({{ '/_design-system/components/feedback/Skeleton.jsx' | relative_url }}) |
| Input | Bootstrap form controls + focus ring | [`forms/Input`]({{ '/_design-system/components/forms/Input.jsx' | relative_url }}) |

Every spec ships a `.d.ts` type surface and a `.prompt.md` usage prompt alongside the `.jsx` — swap the extension on any link above.

## Page designs

Every screen of this theme — the landing page, all 24 layouts, the navigation framework, news, search, the settings offcanvas — is also recreated as a browsable design canvas built on these tokens:

- **[zer0-mistakes Theme — page canvas](https://claude.ai/design/p/54d4394c-4500-4e52-9cea-05e56fc54706?file=zer0-mistakes+Theme.dc.html&present=1)** (Claude Design presentation)
- The canvas maps every screen back to its repo files, so design review and implementation always point at the same source.

## How it stays honest

- `_sass/tokens/` in the [theme repo](https://github.com/bamr87/zer0-mistakes) is the single source of truth; `/_design-system/` is its published mirror.
- `scripts/design-system-check.rb` runs in CI and fails when the two drift — token names *and* resolved values.
- The full contract lives in [`_design-system/SYNC.md`]({{ '/_design-system/SYNC.md' | relative_url }}); design guide in [`_design-system/readme.md`]({{ '/_design-system/readme.md' | relative_url }}).

> Want the interactive component gallery with every skin applied? See the [theme preview]({{ '/about/settings/theme-preview/' | relative_url }}).
