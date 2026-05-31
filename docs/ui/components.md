---
title: "Components"
description: "TODO: Add a 120-160 character description of this document."
date: 2026-05-31T20:54:57.000Z
lastmod: 2026-05-31T20:54:57.000Z
categories: [docs]
tags: [ui, styling, theme]
author: bamr87
---

# Components

Reusable Liquid partials in `_includes/components/`. Components consume design tokens (`var(--zer0-*)`) and Bootstrap 5 utilities.

**Related docs:** [Design system](design-system.md) · [Extending](extending.md) · [Layouts and navigation](layouts-and-navigation.md)

Conventions: [_includes/components/README.md](../_includes/components/README.md)

---

## Usage pattern

Components are invoked with `{% include %}`:

```liquid
{% include components/callout.html type="tip" title="Tip" content="Your message here." %}
```

For multi-line body content, capture first:

```liquid
{%- capture body -%}
Run `docker-compose up` after cloning the repository.
{%- endcapture -%}
{% include components/callout.html type="info" title="Getting started" content=body %}
```

---

## Primitives (author-facing)

### `section.html`

Landing-style section wrapper with optional heading and background variant.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | string | — | DOM id for anchor links |
| `variant` | string | `default` | `default` \| `muted` \| `inverse` |
| `container` | string | `container-xl` | Bootstrap container class |
| `spacing` | string | `normal` | `tight` \| `normal` \| `loose` |
| `heading` | string | — | Section title |
| `heading_level` | int | `2` | Heading level 2–6 |
| `lead` | string | — | Subtitle paragraph |
| `content` | string | required | Inner HTML |

**Example — features band from data:**

```liquid
{%- capture features_body -%}
<div class="row g-4">
  {% for item in site.data.landing.features.items %}
  <div class="col-md-4">
    <div class="card h-100 border-0 shadow-sm">
      <div class="card-body text-center p-4">
        <div class="rounded-circle {{ item.icon_bg }} bg-opacity-10 d-inline-flex p-3 mb-3">
          <i class="bi {{ item.icon }} fs-2 {{ item.icon_bg | replace: 'bg-', 'text-' }}"></i>
        </div>
        <h3 class="h5">{{ item.title }}</h3>
        <p class="text-body-secondary mb-0">{{ item.description }}</p>
      </div>
    </div>
  </div>
  {% endfor %}
</div>
{%- endcapture -%}

{% include components/section.html
   id="features"
   variant="muted"
   heading=site.data.landing.features.heading
   lead=site.data.landing.features.lead
   content=features_body %}
```

---

### `callout.html`

Bootstrap-docs-style aside blocks.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `note` | `note` \| `tip` \| `info` \| `warning` \| `danger` |
| `title` | string | — | Optional heading |
| `icon` | string | — | Bootstrap Icon override |
| `content` | string | required | Body HTML |

**Examples:**

```liquid
{% include components/callout.html type="warning" title="Breaking change" content="API v2 removes the legacy endpoint." %}

{%- capture tip -%}
Set <code>appearance_panel: true</code> to enable runtime theme controls.
{%- endcapture -%}
{% include components/callout.html type="tip" title="Pro tip" content=tip %}
```

---

### `cta-button.html`

Themed call-to-action link styled as a button.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | required | Button text |
| `url` | string | required | Destination URL |
| `variant` | string | `primary` | `primary` \| `secondary` \| `outline` \| `light` |
| `size` | string | `md` | `sm` \| `md` \| `lg` |
| `icon` | string | — | Bootstrap Icon class |
| `external` | bool | `false` | Opens in new tab |

**Example (landing hero):**

```liquid
{% include components/cta-button.html
   label="Get Started"
   url="#get-started"
   variant="light"
   size="lg"
   icon="bi-rocket-takeoff" %}

{% include components/cta-button.html
   label="GitHub"
   url="https://github.com/bamr87/zer0-mistakes"
   variant="outline"
   external=true
   icon="bi-github" %}
```

Data-driven from `_data/landing.yml`:

```yaml
hero:
  cta_primary:
    label: "Get Started"
    url: "#get-started"
    icon: "bi-rocket-takeoff"
    variant: "light"
```

---

### `feature-card.html`

Renders one entry from `_data/features.yml`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `feature` | hash | required | Feature object |
| `style` | string | — | Bootstrap border color (`primary`, `success`, …) |
| `icon` | string | `bi-check-circle-fill` | Icon class |
| `icon_color` | string | `text-success` | Icon color utility |
| `show_refs` | bool | `false` | Show file reference list |
| `compact` | bool | `false` | Hide sub-features list |
| `features_limit` | int | `5` | Max sub-features shown |

**Example:**

```liquid
{% assign f = site.data.features.features | where: "id", "ZER0-001" | first %}
{% include components/feature-card.html
   feature=f
   style="primary"
   icon="bi-bootstrap"
   icon_color="text-primary"
   show_refs=true %}
```

---

### `preview-image.html`

Lazy-loaded image with optional assets-prefix normalization.

**Example:**

```liquid
{% include components/preview-image.html
   src="/images/previews/my-post.png"
   alt="Post preview"
   class="img-fluid rounded" %}
```

Uses `site.preview_images.assets_prefix` when `auto_prefix: true`.

---

### `post-type-badge.html`

Visual badge for post types (`featured`, `breaking`, etc.).

```liquid
{% include components/post-type-badge.html type=page.post_type %}
```

---

## Site chrome (layout-rendered)

These are included by layouts — authors typically do not invoke them directly.

| Component | Purpose |
|-----------|---------|
| `info-section.html` | Settings offcanvas (tabs: Settings, Environment, Developer) |
| `halfmoon.html` | Color mode dropdown (light/dark/auto) |
| `search-modal.html` | Global search (`/` or `Cmd/Ctrl+K`) |
| `nanobar.html` | Config-driven page load progress bar |
| `cookie-consent.html` | GDPR/CCPA consent banner |
| `js-cdn.html` | Body-end script bundle |
| `svg.html` | Inline SVG symbol defs |
| `svg-background.html` | Per-site background opacity overrides |
| `author-eeat.html` | E-E-A-T author block with JSON-LD |
| `shortcuts-modal.html` | Keyboard shortcuts help (`?`) |

### Settings offcanvas

Opened from the navbar gear icon. When `appearance_panel: true`, the Appearance section mounts here automatically.

Custom host for Appearance panel:

```html
<div data-appearance-panel-host class="my-4"></div>
```

---

## Admin components

Used on `/about/settings/*` pages (`layout: admin`):

| Component | Admin page |
|-----------|------------|
| `theme-customizer.html` | `/about/settings/theme/` |
| `theme-preview-gallery.html` | `/about/settings/theme-preview/` |
| `theme-controls-bar.html` | Quick skin switcher bar |
| `background-customizer.html` | Background opacity controls |
| `background-settings.html` | Background settings panel |
| `config-viewer.html` | `/about/config/` |
| `config-editor.html` | Inline `_config.yml` editor |
| `nav-editor.html` | `/about/settings/navigation/` |
| `collection-manager.html` | `/about/settings/collections/` |
| `analytics-dashboard.html` | `/about/settings/analytics/` |
| `env-dashboard.html` | `/about/settings/environment/` |
| `admin-tabs.html` | Shared admin tab bar |

**Theme customizer example** (included on theme settings page):

```liquid
{% include components/theme-customizer.html %}
```

Requires `assets/js/theme-customizer.js` and `site.data.theme_skins` + `site.data.theme_backgrounds`.

---

## Specialized components

| Component | Purpose |
|-----------|---------|
| `mermaid.html` | Client-side Mermaid (when `mermaid: true` in front matter) |
| `setup-banner.html` | Welcome wizard banner (`site_configured: false`) |
| `component-showcase.html` | Demo of theme UI patterns |
| `powered-by.html` | Footer tech stack from `site.powered_by` |
| `env-switcher.html` | Dev/prod URL switcher in Settings |
| `post-card.html` | Archive card for posts index |

---

## Data-driven landing

`_data/landing.yml` drives `_layouts/landing.html` without editing layout HTML:

```yaml
features:
  heading: "Why Choose zer0-mistakes?"
  lead: "Built for developers who value reliability"
  items:
    - title: "Error-Free Development"
      description: "Self-healing installation."
      icon: "bi-shield-check"
      icon_bg: "bg-primary"
```

Copy `_data/landing.yml` into your fork and edit values; omit keys to fall back to theme defaults.

---

## Adding a component

1. Create `_includes/components/my-widget.html` with a documentation header (see README conventions).
2. Use `var(--zer0-*)` tokens, not hardcoded colors.
3. Add a row to `_includes/components/README.md`.
4. Document in [extending.md](extending.md).

**Minimal template:**

```liquid
{%- comment -%}
  MY-WIDGET — One-line purpose
  Parameters: include.label (required), include.variant (optional)
{%- endcomment -%}
{%- assign variant = include.variant | default: "primary" -%}
<div class="zer0-my-widget alert alert-{{ variant }}" role="status">
  {{ include.label }}
</div>
```

**Usage:**

```liquid
{% include components/my-widget.html label="Build passed" variant="success" %}
```

---

## Live preview

See all patterns rendered with every skin:

**[/about/settings/theme-preview/](/about/settings/theme-preview/)**

---

## Further reading

- [_includes/components/README.md](../_includes/components/README.md) — conventions
- [extending.md](extending.md) — register components, navigation data, skins
- [design-system.md](design-system.md) — SCSS counterparts in `_sass/components/`
