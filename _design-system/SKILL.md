---
name: zer0-mistakes-design
description: Use this skill to generate well-branded interfaces and assets for zer0-mistakes, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## What's here

- `readme.md` — the full design guide: product context, **Content Fundamentals** (voice/tone), **Visual Foundations**, **Iconography**, and an index of every file. Read this first.
- `styles.css` — the single global stylesheet to link. It `@import`s all tokens.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `shadows.css`, `motion.css`, `layers.css`, `skins.css`. All `--zer0-*` / `--bs-*` / `--bd-*` custom properties.
- `components/` — React primitives: `core/` (Button, Badge), `surfaces/` (Card, FeatureCard), `feedback/` (Callout), `forms/` (Input).
- `ui_kits/website/` — interactive recreation of the marketing site.
- `assets/images/` — the pixel-wizard hero art, checkpoints, banner, gravatar; plus `favicon.ico`.
- `guidelines/` — foundation specimen cards (colors, type, spacing, brand).

## Fast rules

- **Framework:** clean, tastefully themed **Bootstrap 5.3**. Default to Bootstrap patterns; the tokens re-skin them.
- **Color:** primary blue `#007bff`, butter accent `#ffe484`, violet links `#712cf9`. Seven swappable skins via `[data-theme-skin]`. Always support light **and** dark (`[data-bs-theme]`).
- **Type:** native **system-ui** sans + **SFMono** mono — **no webfonts**. Fluid `clamp()` headings.
- **Icons:** **Bootstrap Icons** only (`<i class="bi bi-name">`), loaded from CDN. Never hand-roll SVG icons; emoji are for doc/README section markers only.
- **Cards:** borderless, soft `shadow-sm`, `.75rem` radius; hover lifts `translateY(-2px)`.
- **Motion:** quick (120–320ms), `cubic-bezier(0.2,0,0,1)`. Honor `prefers-reduced-motion`.
- **Voice:** friendly, confident, second-person "you"; lowercase brand `zer0-mistakes`; sentence case; quantified promises ("$0/month", "under five minutes"). Mascot: a retro pixel-art wizard on a "zero to hero" journey.

## In Claude Code (Agent Skill)

To render the React components, load the compiled bundle and read primitives off
`window.Zer0MistakesDesignSystem_e75121` (see any `*.card.html` in `components/`
for the exact script tags). For static mocks, copy the assets you need out of
`assets/` and link `styles.css` for the tokens.

Source of truth upstream: https://github.com/bamr87/zer0-mistakes
