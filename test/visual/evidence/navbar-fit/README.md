# Evidence — navbar fit, full-bleed bar, and Settings stacking

Before/after evidence for three changes that all come back to the same thing: the navigation bar did not have the width it needed, and Settings could not be reached from the mobile menu.

Everything here was produced against one running dev server by [`test/visual/navbar-fit-evidence.mjs`](../../navbar-fit-evidence.mjs), which reproduces the BEFORE state in-page (injected CSS that re-caps the bar at `.container-xl`, restores the old two-tier label density and the old 80rem home-links threshold; a re-inserted navbar language control, which CSS alone cannot undo; and — for the stacking shot — the navigation ES module blocked at the network layer plus the header `z-index` lift the fix releases). No second build is involved, so the two states are a true comparison.

## `01-before-after-labels.png`

The page-top band at 992 / 1200 / 1440px.

**Before**, the bar lives inside a centred `.container-xl`, so the menubar track never exceeds ~740px against the ~815px the theme's seven items need:

- **1200–1920px** — **7 of 7 labels ellipsized**: `Quick S…`, `N…`, `N…`, `Noteb…`, `Reci…`, `D…`, `Ab…`. Unreadable, and the icons alone do not disambiguate `News` from `Notes` or `Notebooks`.
- **992px** — the track falls under the old single 38rem boundary and the menu drops to **bare icons, 0 labels**.
- Meanwhile the bar is inset from the viewport edge by up to **300px at 1920px** (60px at 1440, 113px at 1366) — dead margin on both sides of a truncated menu.

**After**, at every one of the 8 measured widths: **0 truncated labels**, and the bar is inset a uniform **12px** (the fluid gutter) — it spans the screen.

## `02-viewport-matrix.png`

The bar at 992 → 1920px with the fix active, each panel annotated with the density tier that engaged and the truncation count. It shows the three-tier degradation working as designed: `icon + label` down to 51rem of track, `label-only` from 41–50.99rem (992–1100px viewports — the icons are dropped so the *labels* survive, which is the more informative half), and `icon-only` reserved for tracks too narrow for either. Every panel reads `0 truncated`.

## `03-settings-stacking.png`

The same interaction on a 390px phone — open the nav menu, tap its **Settings** item — in both states.

**Before**: the nav menu is still open (`navStillShown: true`), the element on top at the Settings panel's centre is `a.nav-link` (a nav menu link), and the header sits at `z-index: 1046`. Settings *did* open — it is simply painted underneath, invisible. To the visitor, tapping Settings did nothing.

**After**: the menu has closed (`navStillShown: false`), the top element is the panel's own content (`h6.text-body-secondary`), and the header has dropped back to `z-index: 1030`.

## `04-language-in-settings.png`

After-only (the panel variant is new): the **Language** section as the first block of Settings → Appearance, at desktop and mobile widths. The active language is checked and untranslated targets are disabled with a reason — the same never-a-dead-link contract the navbar dropdown had.

## Regeneration

```bash
docker compose up                                          # serves :4000
BASE_URL=http://localhost:4000 node test/visual/navbar-fit-evidence.mjs
```

Raw numbers are in [`metrics.json`](metrics.json). The regression tests that would fail if any of this regressed are "no nav label is CSS-truncated at any desktop width", "the bar spans the full viewport width at every desktop width" and "the brand title stays legible next to the menubar" in `test/visual/features/navbar.spec.js`, and "Settings opened from the nav menu paints ABOVE it" in `test/visual/features/mobile-overlay-stacking.spec.js`.
