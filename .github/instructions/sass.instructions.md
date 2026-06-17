---
applyTo: "_sass/**,assets/css/**"
description: "Use when editing Sass partials, the main stylesheet, or layering custom CSS on top of bundled Bootstrap 5.3.3. Covers the partial hierarchy, the `!default` override pattern, and the rule against loading two Bootstraps."
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---

# Sass / CSS

End-user theming docs (link, don't duplicate): see `README.md` "🎨 Theming" section and [`_sass/custom.scss`](../../_sass/custom.scss) for the canonical override entry point.

## Architecture

The compiled stylesheet is [`assets/css/main.scss`](../../assets/css/main.scss) (the only file with Jekyll front matter, which triggers SCSS compilation). **It is the single assembly manifest** — every partial is `@import`ed here, in this order. **Do not reorder without testing** (the cascade depends on it):

```
tokens/index            →  Semantic design tokens (--zer0-*) — load first
core/variables          →  Bootstrap !default override surface (see Hard rule 2)
core/theme              →  CSS custom properties (light/dark/wizard, --bd-*, skins, backgrounds)
core/docs-layout        →  Trimmed Bootstrap-docs layout shell
core/docs-code-examples →  .bd-example / .bd-code-snippet chrome (split from docs-layout)
utilities/motion,focus  →  Shared reduced-motion guard + :focus-visible ring (canonical)
components/*            →  Self-contained components (cookie-banner, notes, callout,
                            search-modal, …)
layouts/*              →  Page-frame partials (landing, section, navbar-extras)
notebooks, core/nav-tree, core/sidebar-categories, core/navbar,
core/offcanvas-panels, core/obsidian   →  Core nav/content partials
custom.scss            →  Thin barrel for the "custom layer" partials (see below)
core/code-copy, core/syntax            →  Code copy button + Rouge syntax theme
```

`custom.scss` is **a thin barrel, not a monolith** (it was decomposed in the design-framework refactor). It imports, in order: `layouts/_global-chrome.scss` (base resets, sticky/shadow helpers), `core/_toc.scss` (table-of-contents), `core/_sidebar-extras.scss` (sidebar/TOC active states + banner shims), `components/_ui-enhancements.scss` (Bootstrap component polish — buttons, cards, hero, motion, mobile, print), and `components/_notes-index.scss` (notes/notebooks index grids). It stays as a barrel so forks that `@import "custom"` keep working.

The design-token layer lives in `_sass/tokens/` (`_color`, `_spacing`, `_typography`, `_shadow`, `_motion`, `_breakpoints`, `_layers`, all surfaced via `tokens/_index.scss`). The theme/skin layer is in `_sass/theme/` (`_skins.scss` is a single parameterised `zer0-skin-palette` mixin — add a skin by `@include`-ing it with brand/accent/WCAG-AA link colors, not by copying blocks; `_css-variables.scss`/`_color-modes.scss` hold the `--bd-*` docs-heritage colors; `_backgrounds`/`_background-mixins`/`_wizard-mode`). Feature partials live under `_sass/core/`; notebook-specific styles in `_sass/notebooks.scss`.

## Hard rules

1. **Never load two full Bootstraps.** Bootstrap 5.3.3 ships pre-compiled at `assets/vendor/bootstrap/css/bootstrap.min.css` and is linked from `_includes/core/head.html`. The `@import "bootstrap.scss"` line in `main.scss` is intentionally commented out. If you need a custom Bootstrap build, run `npm run css:bootstrap` and swap the `<link>` in `head.html` — do not enable both.
2. **Override Bootstrap variables with `!default`.** All variable overrides go in [`_sass/core/_variables.scss`](../../_sass/core/_variables.scss) before the (commented-out) Bootstrap import, using `$primary: $blue !default;` style so forks can override again.
3. **Prefer CSS custom properties for runtime-switchable values** (themes, color modes, wizard mode). Static design tokens stay in Sass; anything the user can toggle lives in `_sass/theme/_css-variables.scss` / `_color-modes.scss`.
4. **No inline `<style>` blocks in includes/layouts.** Add a partial under the matching folder (`_sass/components/` for a component, `_sass/core/` for nav/layout scaffolding, `_sass/layouts/` for page frames) and `@import` it from `assets/css/main.scss` at the correct slot — that file is the single assembly manifest. This keeps the cascade predictable and the bundle cacheable.
5. **Fork override hook.** Forks can drop a `assets/css/user-overrides.css` file (linked from `_includes/core/head.html`) — preserve this load order when editing the head include.
6. **Bootstrap utility classes first.** Reach for `mb-3`, `d-flex`, `text-muted`, `bi-*` icons, etc. before writing custom CSS. Custom CSS is a last resort and should target a specific component class, not bare elements.

## Patterns

```scss
// _sass/core/_<feature>.scss — new feature partial
.feature-name {
  // Compose Bootstrap utilities via @extend sparingly; prefer markup classes.
  // Use CSS custom properties so theme/color-mode switches work for free:
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
  border: 1px solid var(--bs-border-color);
}
```

Then `@import` it from `assets/css/main.scss` at the appropriate slot (components with the other `components/*`, core scaffolding with `core/*`):

```scss
@import "components/<feature>";
```

## Validate

```bash
# Sass compiles as part of the standard Jekyll build:
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'

# Then check the compiled output exists and is non-empty:
test -s _site/assets/css/main.css && echo "✓ main.css compiled"
```

## Common pitfalls

- **Importing a partial that doesn't end in `_<name>.scss`** silently fails on case-sensitive filesystems (CI). Match the existing naming exactly.
- **Re-defining a Bootstrap variable without `!default`** breaks downstream forks that try to override it.
- **Adding styles to `notebooks.scss`** that aren't notebook-specific — that file is auto-imported but namespaced by intent. Put general styles in a new `core/` partial.
