---
applyTo: "_sass/**,assets/css/**"
description: "Use when editing Sass partials, the main stylesheet, or layering custom CSS on top of bundled Bootstrap 5.3.3. Covers the partial hierarchy, the `!default` override pattern, and the rule against loading two Bootstraps."
---

# Sass / CSS

End-user theming docs (link, don't duplicate): see `README.md` "🎨 Theming" section and [`_sass/custom.scss`](../../_sass/custom.scss) for the canonical override entry point.

## Architecture

The compiled stylesheet is [`assets/css/main.scss`](../../assets/css/main.scss) (the only file with Jekyll front matter, which triggers SCSS compilation). It imports partials in this order — **do not reorder without testing**:

```
core/variables   →  Design tokens + Bootstrap variable overrides (must use !default)
core/theme       →  Site-wide CSS custom properties (light/dark/wizard mode)
core/docs-layout →  Trimmed Bootstrap-docs layout shell
custom.scss      →  Project-specific styles + feature partial imports
core/code-copy   →  Code-block copy-button styles
core/syntax      →  Rouge syntax highlighting theme
```

Feature partials live under `_sass/core/` (`_navbar.scss`, `_nav-tree.scss`, `_offcanvas-panels.scss`, `_obsidian.scss`, `_docs-layout.scss`, `_syntax.scss`, `code-copy.scss`) and `_sass/theme/` (`_backgrounds.scss`, `_color-modes.scss`, `_css-variables.scss`, `_wizard-mode.scss`, `_background-mixins.scss`). Notebook-specific styles are in `_sass/notebooks.scss`.

## Hard rules

1. **Never load two full Bootstraps.** Bootstrap 5.3.3 ships pre-compiled at `assets/vendor/bootstrap/css/bootstrap.min.css` and is linked from `_includes/core/head.html`. The `@import "bootstrap.scss"` line in `main.scss` is intentionally commented out. If you need a custom Bootstrap build, run `npm run css:bootstrap` and swap the `<link>` in `head.html` — do not enable both.
2. **Override Bootstrap variables with `!default`.** All variable overrides go in [`_sass/core/_variables.scss`](../../_sass/core/_variables.scss) before the (commented-out) Bootstrap import, using `$primary: $blue !default;` style so forks can override again.
3. **Prefer CSS custom properties for runtime-switchable values** (themes, color modes, wizard mode). Static design tokens stay in Sass; anything the user can toggle lives in `_sass/theme/_css-variables.scss` / `_color-modes.scss`.
4. **No inline `<style>` blocks in includes/layouts.** Add a partial under `_sass/core/` and `@import` it from `custom.scss`. This keeps the cascade predictable and the bundle cacheable.
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

Then in `_sass/custom.scss`:

```scss
@import "core/<feature>";
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
