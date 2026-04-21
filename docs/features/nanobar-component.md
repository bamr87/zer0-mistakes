---
title: "Nanobar Component Architecture"
description: "Technical implementation of the config-driven page loading progress bar"
type: "feature-implementation"
audience: "developers"
components:
  - "_includes/components/nanobar.html"
  - "_includes/core/head.html"
  - "_includes/core/header.html"
  - "assets/js/nanobar.min.js"
  - "assets/js/nanobar-init.js"
  - "_config.yml (nanobar block)"
dependencies: ["Bootstrap 5", "Jekyll", "Liquid"]
date: 2026-04-19
lastmod: 2026-04-19
---

# Nanobar Component Architecture

## Overview

The Nanobar component provides a visual page-loading progress bar that runs on every page load. It is **fully config-driven** via `_config.yml` and renders as a thin animated strip at one of three positions: fixed to the viewport top, fixed to the bottom, or mounted directly under the site header (navbar).

### Design Goals

| Goal | Approach |
|------|----------|
| **Zero hardcoded values** | All styling and behavior read from `site.nanobar.*` |
| **Single source of truth** | One include (`nanobar.html`) owns CSS, JS loading, and config bridge |
| **Positional flexibility** | `top`, `bottom`, or `navbar` placement via one config key |
| **No side-effects** | All CSS is scoped to `.nanobar` / `.nanobar-mount`; no leaks to other components |
| **Graceful degradation** | Disabled entirely with `nanobar.enabled: false` |

---

## Component Diagram

```
_config.yml                    ┌──────────────────────────┐
  nanobar:                     │  _includes/components/   │
    enabled: true       ──────▶│     nanobar.html         │
    color: var(--bs-primary)   │  ┌────────────────────┐  │
    position: navbar           │  │ <style> CSS vars    │  │
    steps: [20,55,85,100]      │  │ <script> bridge     │  │
    step_delay_ms: 180         │  │ <script> lib+init   │  │
    ...                        │  └────────────────────┘  │
                               └──────────┬───────────────┘
                                          │ included by
                                          ▼
                               _includes/core/head.html
                                    (replaces ~60-line
                                     inline block)


_includes/core/header.html
  └─ #top-progress-target      ◀── mount point rendered
       .nanobar-mount               only when position == "navbar"


assets/js/
  ├─ nanobar.min.js             ◀── third-party Nanobar library
  └─ nanobar-init.js            ◀── theme initializer (reads window.zer0Nanobar)
```

---

## Configuration Reference

All keys live under `nanobar:` in `_config.yml`:

```yaml
nanobar:
  enabled       : true                # Master switch
  color         : "var(--bs-primary)" # Bar color (any CSS value)
  background    : "transparent"       # Track background
  height        : "3px"              # Bar thickness
  position      : "navbar"           # top | bottom | navbar
  z_index       : 9999               # Stacking order
  steps         : [20, 55, 85, 100]  # Loading simulation percentages
  step_delay_ms : 180                # Delay between steps (ms)
  classname     : "nanobar"          # CSS class on injected element
  id            : "top-progress-bar" # DOM id of injected element
  target        : ""                 # CSS selector to mount inside
```

### Position Modes

| Value | Behavior | Mount Point |
|-------|----------|-------------|
| `top` | Fixed to viewport top edge | None (viewport-fixed) |
| `bottom` | Fixed to viewport bottom edge | None (viewport-fixed) |
| `navbar` | Thin strip directly under `<header>` | `#top-progress-target` in `header.html` |

### Step Animation

The `steps` array defines percentage waypoints the bar animates through on `DOMContentLoaded`. With `step_delay_ms: 0` the bar fills instantly (invisible on fast pages). Increase the delay to make the animation perceptible.

---

## File Inventory

### `_includes/components/nanobar.html`

**Purpose**: Single include that owns the entire nanobar subsystem.

**Contents**:
1. **CSS custom properties** — `:root` block mapping `site.nanobar.*` → CSS variables (`--nanobar-color`, `--nanobar-bg`, `--nanobar-height`, `--nanobar-z`)
2. **Scoped styles** — `.nanobar`, `.nanobar-mount`, `.nanobar--bottom`, `.nanobar--navbar` selectors
3. **JS library load** — `<script defer src="nanobar.min.js">`
4. **JS initializer load** — `<script defer src="nanobar-init.js">`
5. **Config bridge** — inline `<script>` setting `window.zer0Nanobar` with all config values

**Guard**: Entire block wrapped in `{% if site.nanobar.enabled != false %}`.

### `_includes/core/head.html`

**Change**: Replaced ~60-line inline nanobar block with:
```liquid
{% include components/nanobar.html %}
```

### `_includes/core/header.html`

**Change**: Removed the old hardcoded `<div class="nanobar" id="top-progress-bar">` from inside the navbar div. Added a conditional mount point after the closing `</div>` of the navbar:

```liquid
{%- assign _nb_pos = site.nanobar.position | default: "top" -%}
{%- if site.nanobar.enabled != false and _nb_pos == "navbar" -%}
<div id="top-progress-target" class="nanobar-mount" aria-hidden="true"></div>
{%- endif -%}
```

### `assets/js/nanobar.min.js`

Third-party [Nanobar](https://github.com/jacoborus/nanobar) library. Fixed a stray `P` character that was prepended to the file, which caused a JS parse error.

### `assets/js/nanobar-init.js`

Theme initializer that:
1. Reads `window.zer0Nanobar` config object
2. Determines mount target based on `position` (viewport-fixed or `#top-progress-target`)
3. Instantiates `new Nanobar(opts)` with correct target
4. Runs step animation on `DOMContentLoaded`

---

## CSS Scoping Guarantees

All nanobar styles are scoped to prevent side-effects:

| Selector | Scope |
|----------|-------|
| `:root` custom properties | `--nanobar-*` namespace only |
| `.nanobar` | Overrides library defaults (position, z-index, background) |
| `.nanobar .bar` | Bar element color and height |
| `.nanobar-mount` | Mount point container (relative positioning, overflow hidden) |
| `.nanobar--navbar` | Navbar-specific absolute positioning inside mount |
| `.nanobar--bottom` | Bottom-fixed variant |

No styles target `footer`, `main`, or any other component.

---

## Footer Full-Width Fix (Related)

The same commit (`f5d5e97`) also restructured `_includes/core/footer.html` to make the dark section extend edge-to-edge:

**Before** (triple-nested containers):
```html
<footer class="bd-footer container-xl border-top">
  <div class="container row my-3">...</div>
  <div class="container row">
    <div class="container bg-dark text-light py-5 rounded-3">
      <div class="container">
        <!-- content -->
      </div>
    </div>
  </div>
</footer>
```

**After** (flat structure):
```html
<footer class="bd-footer border-top">
  <div class="container-xl my-3">...</div>
  <div class="bg-dark text-light py-5">
    <div class="container-xl">
      <!-- content -->
    </div>
  </div>
</footer>
```

**Key changes**:
- Removed `container-xl` from `<footer>` element
- Replaced `rounded-3` with edge-to-edge dark background
- Flattened from 4 nesting levels to 2
- Content still centered via inner `container-xl`

---

## Testing

After making changes to the nanobar or footer, validate with:

```bash
# Build the site
docker-compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'

# Verify nanobar renders
docker-compose exec -T jekyll grep -c 'nanobar-init.js' \
  /site/_site/index.html
# Expected: 1

# Verify mount point (only when position: navbar)
docker-compose exec -T jekyll grep 'top-progress-target' \
  /site/_site/index.html
# Expected: div with class="nanobar-mount"

# Verify footer structure
docker-compose exec -T jekyll grep '<footer' \
  /site/_site/index.html
# Expected: class="bd-footer border-top" (no container-xl)
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No progress bar visible | `enabled: false` or `step_delay_ms: 0` | Set `enabled: true` and increase delay |
| Bar renders at wrong position | `position` value mismatch | Check `_config.yml` nanobar.position |
| Bar overlaps content | z-index conflict | Adjust `nanobar.z_index` |
| JS error in console | Stray characters in `nanobar.min.js` | Re-download clean library file |
| Footer dark section has gaps | `container-xl` on `<footer>` | Remove width-constraining class from `<footer>` |

---

*Last updated: 2026-04-19 — Covers commit `f5d5e97` (v0.22.20)*
