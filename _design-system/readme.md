# zer0-mistakes Design System

> A modern website theme that **just works** — for blogs, docs, portfolios, and more.
> Free · open source · hosted on GitHub Pages for $0/month.

This design system captures the visual language, tokens, components, and product surfaces of **[zer0-mistakes](https://github.com/bamr87/zer0-mistakes)** — an AI-native Jekyll theme built on **Bootstrap 5.3.3**. It exists so design agents can produce on-brand interfaces, slides, docs, and mockups for the zer0-mistakes product and ecosystem.

## What zer0-mistakes is

zer0-mistakes is a ready-made website you can publish in under five minutes — no design skills, no servers, almost nothing to install. Pick a template, write Markdown, push to GitHub, and your site is live. For power users it grows into a fully programmable, **AI-native** platform: self-healing install scripts, multi-agent guidance (Copilot · Cursor · Claude Code · Codex · Aider), AI-generated preview images, AIEO content optimization, and automated semantic releases to RubyGems.

Out of the box it ships: automatic **light/dark mode**, real-time **site search** (`/` or `⌘/Ctrl-K`), **privacy-first analytics** (PostHog), **Mermaid** diagrams, **LaTeX/MathJax** math, **Jupyter notebook** rendering, **Obsidian vault** integration with `[[wiki-links]]`, breadcrumb + sidebar + TOC navigation, and **seven swappable color skins**.

The brand mascot is a **retro pixel-art wizard** on a "zero to hero" journey — mystic robes, a glowing staff, surrounded by vintage CRTs, servers, floating binary, and arcane glyphs. The vibe: approachable, a little playful, technically deep, GitHub-native.

### Sources used to build this system

Everything here is derived from the upstream repository — explore it to build richer, more accurate designs:

- **GitHub:** https://github.com/bamr87/zer0-mistakes (branch `main`)
  - `_sass/tokens/` — the upstream design-token source of truth (color, typography, spacing, shadow, motion, layers, breakpoints)
  - `_sass/theme/_skins.scss` + `_data/theme_backgrounds.yml` — the 7 skin palettes
  - `_layouts/landing.html`, `_includes/core/header.html`, `_data/landing.yml` — homepage + navbar structure
  - `docs/ui/design-system.md`, `docs/ui/design-tokens.md`, `docs/ui/components.md` — upstream design docs
- **Live demo:** https://zer0-mistakes.com/
- **RubyGems:** https://rubygems.org/gems/jekyll-theme-zer0
- Theme version at last sync: **1.28.0** (first captured at 1.18.1; kept in
  lockstep with the repo's `_design-system/` mirror — see its `SYNC.md`)

> The reader may not have access to all of these — they are recorded so that, if
> you do, you can go deeper than this snapshot.

---

## CONTENT FUNDAMENTALS

How zer0-mistakes writes. Match this voice in any copy you generate.

**Voice.** Friendly, confident, plain-spoken, and reassuring. The product's whole promise is in its name — you will make *zero mistakes* — so copy is encouraging and removes fear. It speaks to absolute beginners *and* power users in the same breath without condescending to either: "Beginners can skip those parts entirely."

**Person.** Direct second person ("**you**"). The reader is always the subject and the doer: "**You just write Markdown. The theme handles the design.**" Benefits are framed as things *you* get, not features the product *has*.

**Casing.** Sentence case everywhere — headings, buttons, nav. The brand name is always lowercase **`zer0-mistakes`** with a zero, not an O. Section headings in docs lead with a single emoji glyph (`## 🚀 Get Started in 5 Minutes`).

**Tone markers.**
- Concrete, quantified promises: "under five minutes", "$0/month", "~95% success rate", "2–5 minutes".
- Comparison tables that pit "Most starter themes" against "zer0-mistakes".
- Progressive disclosure: a beginner path first, then "if you already know Jekyll, Ruby, Docker…".
- Light technical wit, never snark. Wizard/journey metaphors ("from zero to hero").

**Emoji.** Yes — used deliberately and consistently as **section markers** in long-form docs and READMEs (🚀 ✨ 🤖 🔒 📊 🧭 🔍 🎨). One leading emoji per heading. They are *not* sprinkled mid-sentence and *not* used as decorative bullets inside body copy. In the product UI itself, iconography is **Bootstrap Icons**, not emoji.

**Formatting habits.** Inline `code` for commands, file names, and keys (`_config.yml`, `⌘K`). Bold for the key phrase in a sentence. Blockquotes for "Who this is for" asides and tips. Markdown tables for any comparison or reference.

**Examples to emulate:**
- Hero: *"A modern website theme that just works — for blogs, docs, portfolios, and more."*
- Subhead: *"Free • Open source • Hosted on GitHub Pages for $0/month • Works on Mac, Windows, and Linux"*
- Feature card: *"Error-Free Development — Built-in error handling and self-healing installation process ensures a smooth development experience."*
- Aside: *"> Want to see it in action? Visit the live demo site — it's built with this exact theme."*

---

## VISUAL FOUNDATIONS

**Framework.** Everything is **Bootstrap 5.3.3**. The look is "clean, professional Bootstrap, tastefully themed" — not a bespoke design language. Default to Bootstrap components, utilities, grid, and spacing; the zer0 tokens re-skin them.

**Color.** The signature brand color is **blue `#007bff`** (the classic Bootstrap-4 blue, kept as the default primary), paired with a soft butter-yellow accent **`#ffe484`** and a violet link color **`#712cf9`** (the Bootstrap docs violet). The logo palette is red `#a11111`, yellow `#ffe900`, teal `#376986`, blue `#007bff`. Semantic state colors are Bootstrap's: success `#28a745`, info `#17a2b8`, warning `#ffc107`, danger `#dc3545`. **Seven skins** (air, aqua, dirt, neon, mint, plum, sunrise) re-point the primary + accent + link colors; each skin ships WCAG-AA link colors for both light and dark mode. Surfaces are near-white (`#fff` body, `#f8f9fa` tertiary, `#e9ecef` muted) in light mode and Bootstrap's `#212529` family in dark mode.

**Light/Dark.** First-class. Driven by `data-bs-theme="light|dark"` on a container,
with a third "auto" mode following system preference, persisted to localStorage. Every token has a dark-mode value. Always design both.

**Type.** **No webfonts** — zer0-mistakes uses the native **system-ui sans stack** for instant, zero-flash text, and the **SFMono/Menlo mono stack** for code. Headings use a **fluid `clamp()` scale** so they shrink gracefully on mobile without media queries (h1 ranges 2rem→3rem). Weights: 400/500/600/700. Body line-height is generous (1.55). Hero titles use Bootstrap `.display-4`, bold.

**Spacing.** Bootstrap's 0–5 spacer scale (`0, .25, .5, 1, 1.5, 3rem`). Section rhythm is fluid `clamp(2rem, 6vw, 5rem)`. Container gutters `clamp(1rem, 4vw, 2rem)`. Docs content goes wide — up to ~1720px on xxl screens, wider than Bootstrap's default container.

**Backgrounds.** Mostly flat surface colors. The **landing hero is a solid `bg-primary` block with white text** (`.zer0-bg-hero`). Decorative SVG "background skins" (from fffuel) can tint sections per-skin, but the default is clean and flat — **no heavy gradients**, no busy textures behind body content. Full-bleed imagery appears as **hero art** (the pixel-wizard scenes), not as section backgrounds. AI-generated **preview images** (4:3, painterly/pixel, warm-to-cool palettes) head every blog post.

**Corner radii.** Bootstrap defaults: `.375rem` standard, `.5rem` large, and **`.75rem` on landing feature cards** (slightly softer). Pills (`50rem`) for badges and some buttons; `50%` circles for icon chips, avatars, and FABs.

**Cards.** The dominant pattern is `.card border-0 shadow-sm` — borderless with a soft small shadow — on a white surface. Landing feature cards add a `.75rem` radius and a **circular tinted icon chip** (`rgba(primary, .12)` background, primary-colored Bootstrap icon) above the title. On hover they lift `translateY(-2px)` and deepen to `shadow-md`.

**Shadows.** A purpose-named scale: `xs / sm / md / lg`, plus a dedicated `fab` shadow and a primary-tinted **focus ring** (`0 0 0 .2rem rgba(primary, .25)`). Elevation is subtle — this is a flat, content-first aesthetic, not a neumorphic one.

**Borders.** Thin `1px solid` in `--bs-border-color` (`#dee2e6` light / `#495057` dark). A translucent variant (`color-mix(... 42%, transparent)`) for hairlines.

**Animation & motion.** Restrained and quick. Durations `120 / 200 / 320ms`; the standard easing is `cubic-bezier(0.2, 0, 0, 1)`. Signature motions: hover **lift** (`translateY(-1px/-2px)`), image **opacity fade-in** on load (`.is-loaded`), smooth navbar dropdown fades. No bounces, no parallax, no infinite decorative loops. `prefers-reduced-motion` collapses all durations to `0.01ms`.

**Hover / press states.** Buttons follow Bootstrap: hover mixes the primary toward the accent (`color-mix(in srgb, primary 85%, accent)`), active mixes 75%. Links go to `--bs-link-hover-color`. Cards lift on hover. Focus always shows the tinted ring. No custom shrink-on-press; rely on Bootstrap's `:active`.

**Transparency & blur.** Sparingly. Tinted overlays use `rgba`/`color-mix` (e.g. the `.12` icon-chip tint, `.bg-primary-subtle` badges). Offcanvas panels and modals use Bootstrap's standard backdrop. No glassmorphism.

**Layout rules.** Fixed top navbar (`.fixed-top`, `bg-body-tertiary`, bottom shadow). A floating-action-button stack (back-to-top, chat, TOC, local-graph) pinned bottom-right with the `fab` shadow and an explicit z-index scale. Docs use a left sidebar (17rem) + content + right TOC (12rem) three-column layout. Cookie banner pinned bottom. Skip-to-content link for a11y.

**Imagery vibe.** Two registers: (1) **painterly/pixel hero art** of the wizard — warm golds and ambient blues, dreamlike, retro-computing; (2) **AI-generated post previews** — 4:3, varied but cohesive, slightly retro. Avatars are circular gravatars. Keep imagery warm-leaning and a touch nostalgic.

---

## ICONOGRAPHY

**System: [Bootstrap Icons](https://icons.getbootstrap.com/).** This is the single, unified icon set across the entire theme — referenced as `<i class="bi bi-name">`. It is a **font/SVG icon library** loaded via CDN; `site.default_icon` is `bi`.

- **Stroke/style:** Bootstrap Icons' clean, mostly-outline style at a consistent
  weight. Sizes via Bootstrap's `.fs-*` utilities; color via `text-primary`, etc.
- **Where they appear:** navbar (`bi-search`, `bi-gear`, `bi-list`, `bi-three-dots`,
`bi-house`, `bi-github`), feature cards (`bi-shield-check`, `bi-boxes`, `bi-lightning-charge`), CTAs (`bi-rocket-takeoff`, `bi-list-check`), blog cards (`bi-journal-richtext`, `bi-calendar3`, `bi-tags`, `bi-collection`), callouts, and the FAB stack.
- **Icon chips:** feature icons sit inside a circular tinted disc — `rounded-circle`,
  `rgba(primary, .12)` background, primary-colored icon, ~3.5rem.

**To use Bootstrap Icons in your HTML**, link the CDN in `<head>`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
```
Then `<i class="bi bi-rocket-takeoff"></i>`. This is the **authentic** icon set — do not substitute Lucide/Heroicons/Feather, and never hand-roll SVG icons or use emoji as UI icons (emoji are reserved for doc/README section markers only).

**Unicode/other:** none beyond emoji section markers in prose. Mermaid renders diagrams; KaTeX/MathJax renders math — both are content, not iconography.

---

## INDEX — what's in this design system

**Foundations (root)**
- `styles.css` — the single entry point consumers link (an `@import` manifest only).
- `tokens/colors.css` · `typography.css` · `spacing.css` · `radius.css` · `breakpoints.css` · `shadows.css` · `motion.css` · `layers.css` · `skins.css` — all design tokens.
- `assets/` — brand imagery: the pixel-wizard hero art, checkpoints, info banner, gravatar, favicon.

**Design System tab cards** — small specimen HTML files (tagged `@dsCard`) grouped into **Colors**, **Type**, **Spacing**, **Brand**, **Components**, and the UI-kit product group. They render live against `styles.css`.

**Components** (`components/` — `window.Zer0MistakesDesignSystem_e75121`)
- `core/Button`, `core/Badge` — buttons (primary/secondary/outline/ghost, sizes, with-icon, disabled) and badges/pills.
- `surfaces/Card`, `surfaces/FeatureCard` — borderless soft-shadow card and the landing feature card with tinted icon chip.
- `feedback/Callout` — Bootstrap-alert-style callout / Obsidian callout.
- `forms/Input` — labelled text input with focus ring + help/invalid states.

**UI kit** (`ui_kits/website/`)
- Interactive recreation of the zer0-mistakes marketing site: fixed navbar, solid-primary hero with wizard art, feature grid, install cards, footer — plus working light/dark toggle and skin switcher.

**Skill**
- `SKILL.md` — makes this folder usable as a downloadable Claude Agent Skill.

---

> **Note on fonts:** zer0-mistakes intentionally ships **no webfonts** (native
> system-ui + SFMono stacks). There are therefore no font files to upload — this is
> a faithful reproduction of the upstream theme, not a substitution.
