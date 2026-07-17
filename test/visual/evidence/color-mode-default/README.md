# Evidence — color_mode_default config knob (issue #241)

A new `color_mode_default` site config key (values: `dark` | `light` | `auto`,
default `auto`) controls Bootstrap's `data-bs-theme` attribute both server-side (in `_layouts/root.html`) and client-side via an early inline FOUC-prevention script added to `_includes/core/tokens-inline.html`.

## What changed

| File | Change |
|---|---|
| `_layouts/root.html` | Server-renders `data-bs-theme` from `site.color_mode_default`; `auto` resolves to `dark` server-side (the inline script corrects it before paint). Adds `data-color-mode-default` attribute so the inline script can read the config value without Liquid. |
| `_includes/core/tokens-inline.html` | New early inline `<script>` (before CSS) applies `data-bs-theme` by reading `localStorage["theme"]` (user override) first, then `data-color-mode-default` (config default), resolving `auto` via `prefers-color-scheme`. Prevents FOUC. |
| `_config.yml` | Documents `color_mode_default: auto` with full docs comment. |

## Priority order (highest → lowest)

1. `localStorage["theme"]` — explicit user choice via the Appearance panel
2. `site.color_mode_default` config value (`dark` | `light` | `auto`)
3. `auto` — follow `prefers-color-scheme` (backward-compatible default)

## Backward compatibility

- Sites that did not set `color_mode_default` get `auto`, which follows
  `prefers-color-scheme` — the same behaviour the theme had implicitly.
- The `data-bs-theme="dark"` that was previously hardcoded in `root.html` is
  now the server-side fallback for the `auto` case (corrected before paint).

## How to regenerate evidence

```bash
docker compose up                   # serves :4000
BASE_URL=http://localhost:4000 node test/visual/color-mode-default-evidence.mjs
```

## What each screenshot shows

- `01-*-auto-dark-*.png` — `color_mode_default: auto`, browser prefers-dark, no
  localStorage; resolved to `data-bs-theme="dark"`.
- `02-*-auto-light-*.png` — `color_mode_default: auto`, browser prefers-light;
  resolved to `data-bs-theme="light"`.
- `03-*-override-light-*.png` — `localStorage["theme"]="light"` overrides the
  dark OS preference; result is `data-bs-theme="light"`.
- `04-*-override-dark-*.png` — `localStorage["theme"]="dark"` overrides a light
  OS preference; result is `data-bs-theme="dark"`.

Regression test: [`../../color-mode-default.spec.js`](../../color-mode-default.spec.js) (smoke tier — 5 assertions covering server-render, FOUC prevention, localStorage override, and cross-page persistence).
