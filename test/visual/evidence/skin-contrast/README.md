# Evidence — every palette skin meets WCAG AA contrast, light and dark

The site-quality scans of the sites that float on this theme (ai-world-view.github.io #35/#37/#38, year-of-ai.github.io #141–#154) kept reporting the same theme defects with the default `air` skin: `span.nav-link-text @ 2.4:1` (the current-page navbar link), `span.badge.bg-secondary.text-body @ 3.29:1` (the gray month and tag badges), white text on the light brand at 2.53:1 (`.btn-primary`, `.badge.bg-primary`), and a 22px-wide `.nav-tree-toggle` (axe `target-size`). Backlog task T-042 (#410) asked for the same sweep across every skin.

The cause is in `_sass/theme/_skins.scss`: the palette mixin painted text with the raw brand colour and left Bootstrap's white text on brand fills, while the light brands sit at 2.3–2.7:1 on white and the dark ones at 2.4–2.6:1 on `#212529`. The fix gives every skin an on-brand ink, routes brand text through the AA link colours, and applies the same rule to the navbar, quicklinks, nav-tree and category-sidebar current states.

## How this evidence was produced

BEFORE is a real render, not a CSS mock. [`../../skin-contrast-evidence.mjs`](../../skin-contrast-evidence.mjs) captured the AFTER state from this branch's build, then `_sass`, `_includes` and `_layouts` were checked out from `origin/main` (93e7062) on the same dev server, the BEFORE state was captured, and the branch's files were restored before composing. Ratios use WCAG 2.x relative luminance against the composited backdrop, the same measurement as `test/visual/core/skin-contrast.spec.js`; button hover and active states are read from their `--bs-btn-hover-*` / `--bs-btn-active-*` tokens.

## What each file shows

- **`01-navbar-current-link.png`** — the navbar on `/quickstart/` with "Quick Start" as the current page, for air (light and dark), dirt (dark) and mint (light). The scans' 2.40:1 is the first BEFORE row.
- **`02-components-light.png`**, **`03-components-dark.png`** — a strip of every component the fix touched (`.btn-primary` at rest, hover and active, `.btn-outline-primary`, `.badge.bg-primary`, `.text-bg-primary`, `.text-primary`, pagination, `.alert-primary`, the current dropdown item, the current sidebar link), BEFORE above AFTER for all 7 palette skins. Each label gives the lowest ratio in the strip.
- **`04-badges-and-toggles.png`** — the Archives card on `/news/` (`badge bg-secondary text-body` → `badge text-bg-secondary`) and the sidebar page tree on `/docs/features/sidebar-page-tree/` with the chevron toggles outlined (22×29 → 24×29 px).
- **`metrics.json`** — every measurement, BEFORE and AFTER, per skin and mode.

## Measured before → after

| Skin | Current nav link, light | Current nav link, dark | Current dropdown item | Lowest in the component strip (light / dark) |
|---|---|---|---|---|
| air | 2.40 → 8.44 | 5.27 → 10.74 | 2.53 → 8.31 | 2.23 → 6.45 / 1.63 → 8.31 |
| aqua | 2.34 → 7.76 | 5.40 → 9.66 | 2.46 → 8.52 | 2.19 → 5.76 / 1.47 → 8.52 |
| dirt | 4.83 → 8.80 | 2.62 → 8.90 | 5.09 → 5.09 | 1.25 → 5.09 / 2.71 → 5.09 |
| neon | 5.32 → 10.12 | 2.37 → 8.20 | 5.61 → 5.61 | 1.45 → 5.27 / 2.53 → 5.27 |
| mint | 2.35 → 7.71 | 5.38 → 9.37 | 2.47 → 8.49 | 1.95 → 5.52 / 1.34 → 8.35 |
| plum | 2.55 → 12.42 | 4.95 → 8.96 | 2.69 → 7.81 | 2.41 → 6.10 / 1.30 → 6.10 |
| sunrise | 2.69 → 7.42 | 4.70 → 9.45 | 2.84 → 7.41 | 1.95 → 5.52 / 1.50 → 7.41 |

Across the 7 skins × 2 modes the strip had **103** measurements under 4.5:1 before and **0** after. The gray badge went from 3.29:1 to 4.69:1, and all 10 chevron toggles on the page tree from 22×29 to 24×29 px. `01-navbar-current-link.png` shows four representative skin and mode pairs; `metrics.json` has all fourteen.

Regression test: [`../../core/skin-contrast.spec.js`](../../core/skin-contrast.spec.js) (smoke tier). On `origin/main` it fails 26 of its 27 cases; on this branch all 27 pass.
