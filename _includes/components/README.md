# Components

Reusable Liquid partials that render UI primitives. Components compose into pages via the `layout:` chain and the `{% include %}` tag.

## Conventions

Every component in this folder follows the same shape so consumers can predict its API at a glance.

### 1. Top of file: documentation header

```liquid
{%- comment -%}
  ===================================================================
  COMPONENT-NAME — One-line purpose
  ===================================================================

  Path: _includes/components/component-name.html

  Parameters
    include.id        (string)  — unique DOM id (optional, default: auto-generated)
    include.variant   (string)  — visual style (`primary` | `subtle` | `inverse`)
    include.size      (string)  — `sm` | `md` (default) | `lg`
    include.content   (string)  — body markup or text (required)

  Returns: rendered HTML fragment.

  Example:
    {% include components/component-name.html variant="primary" content="Hello" %}
  ===================================================================
{%- endcomment -%}
```

### 2. Parameter defaults

Always assign defaults at the top of the file so the body can read variables, not `include.*` chains.

```liquid
{%- assign variant = include.variant | default: "primary" -%}
{%- assign size    = include.size    | default: "md" -%}
{%- assign id      = include.id      | default: "" -%}
```

### 3. Naming

| Concern         | Convention                                          |
|-----------------|------------------------------------------------------|
| Filename        | `kebab-case.html`                                    |
| Liquid params   | `snake_case` (`include.icon_color`, `include.show_refs`) |
| HTML classes    | `zer0-<component>` for theme-owned classes; Bootstrap utilities for layout |
| Data file deps  | Documented in the header (`Requires: site.data.<name>`) |

### 4. Accessibility

Every component must satisfy at least one of:

- Render a semantic landmark (`<nav>`, `<aside>`, `<section>`, `<article>`).
- Expose an `aria-label`, `aria-labelledby`, or `aria-describedby`.
- Inherit from a parent landmark whose role is documented in the header.

Icon-only buttons must have a visible label OR an `aria-label`. Decorative icons must have `aria-hidden="true"`.

### 5. Theming

Components consume design tokens, not raw values:

- Use `var(--zer0-color-*)` for colors.
- Use `var(--zer0-space-*)` for spacing offsets in inline styles.
- Use `var(--zer0-layer-*)` for z-index.

If a component needs a token that doesn't exist yet, propose it in `_sass/tokens/` rather than hardcoding.

## Component catalog

### Primitives

| Component                | Purpose                                              |
|--------------------------|------------------------------------------------------|
| `section.html`           | Wraps a landing-style content section with consistent padding, optional id, and background variant. |
| `callout.html`           | Highlighted info/note/warning/tip block, à la Bootstrap docs. |
| `cta-button.html`        | Themed call-to-action button with icon support.      |
| `feature-card.html`      | Renders a single entry from `_data/features.yml`.    |
| `preview-image.html`     | Responsive image with assets-prefix handling; lazy by default, optional `loading`/`fetchpriority`/`decoding` (pass `loading="eager" fetchpriority="high"` for an above-the-fold hero). |
| `post-type-badge.html`   | Visual badge for post types (featured, opinion, …).  |

### Site chrome (rendered by layouts, not authors)

| Component                | Purpose                                              |
|--------------------------|------------------------------------------------------|
| `author-eeat.html`       | E-E-A-T author bio with Schema.org markup.           |
| `admin-links.html`       | Cached admin quick links (settings offcanvas Site tab). |
| `info-section.html`      | Settings offcanvas — Appearance / Site / Developer.   |
| `js-cdn.html`            | Body-end script bundle.                               |
| `search-modal.html`      | Global search modal.                                  |
| `page-feedback.html`     | "Improve this page" capture widget — request type + live page context + captured console logs → GitHub issue (base prefill + optional AI enrichment). Pairs with `assets/js/page-feedback.js` and `core/console-capture.html`; types from `_data/feedback_types.yml`. |
| `fleet-assist.html`      | Fleet page bridge, a developer tool: renders `<fleet-assist>` so a Claude Code session paired through the Harness Console on the same machine can see the page you have open and, as far as you allow, use it. Off by default; `fleet_assist.enabled: true` writes the tag in development only, `fleet_assist.deployed: true` also on a production build (launcher hidden until the address ends `#fleet-assist`), `fleet_assist.broker` names another loopback console. Mounted once by `_layouts/root.html`, so a consumer site needs the one key and no file. Pairs with `assets/js/fleet-assist.js`; both are vendored from the `bamr87/bamr87` assistant kit (`templates/assistant/`), which holds the payload byte-identical: change them there. Kit 0.1.1 draws its launcher bottom-left, over the page-feedback FAB, which is why this repo's own dev config leaves the key off. |

## Adding a new component

1. Copy the boilerplate above into `_includes/components/<name>.html`.
2. Fill in defaults, parameters, and ARIA hooks.
3. If the component is data-driven, add the sample data to `_data/` and reference it in the header.
4. Add a row to the catalog above in this README.
5. Update `docs/extending.md` if the component introduces a new convention.

## Migration notes

The legacy inline blocks in `_layouts/landing.html` (lines ~114–161) are being replaced by `feature-card.html` driven by `_data/landing.yml`. See `docs/extending.md` for the migration recipe.
