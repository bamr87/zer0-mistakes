# Mobile navigation panel collapsed to a 60px sliver

## The bug

`examples/swerve-of-shore` styled its sticky header with a frosted-glass wash:

```css
.navbar {
  background-color: rgba(251, 248, 242, 0.94) !important;
  backdrop-filter: saturate(140%) blur(8px);   /* <- this line */
}
```

Per the CSS spec, an element with `backdrop-filter` (or `transform`, `filter`, `perspective`, `contain`, `will-change`) becomes the **containing block for its `position: fixed` descendants**. The theme's main-navigation panel — `#bdNavbar`, an `.offcanvas-lg` that Bootstrap fixes to `top: 0; bottom: 0` below the `lg` breakpoint — lives inside `.navbar`.

So the panel stopped sizing itself against the viewport and started sizing itself against the ~60px navbar. Tapping the hamburger opened a title-bar sliver: the "Main Navigation" heading and its close button rendered, a backdrop dimmed the page, and **every navigation link was cut off**. Nothing errored — no console message, no failed build, no page overflow — so it shipped unnoticed.

## The fix

Move the effect to a pseudo-element, which is not an ancestor of `#bdNavbar`:

```css
.navbar { background-color: transparent !important; position: relative; }
.navbar::before {
  content: ""; position: absolute; inset: 0;
  background-color: rgba(251, 248, 242, 0.94);
  backdrop-filter: saturate(140%) blur(8px);
  pointer-events: none;
}
.navbar > * { position: relative; }   /* keep content above the pseudo-element */
```

Visually identical; the containing block is the viewport again.

## What each image shows

| File | Shows |
|---|---|
| `01-before-after.png` | Page-overflow band at 390/768. **Flat 0 → 0** — included for completeness, and as the reason this bug went undetected: it produces no overflow at all. |
| `02-viewport-matrix.png` | The fixed page across 320/390/414/768. |
| `03-configs.png` | The `menu-open` state after the fix. |
| `04-menu-open-before-after.png` | **The one that matters.** Menu open, before vs after, at 390 and 768. |

## Measurements

From `metrics-menu-open.json`, main navigation open:

| Width | State | Panel height | Viewport | Nav links inside the panel |
|------:|-------|-------------:|---------:|---------------------------:|
| 390 | before | **60px** | 780px | **0 / 14** |
| 390 | after  | **780px** | 780px | **14 / 14** |
| 768 | before | **60px** | 780px | **0 / 14** |
| 768 | after  | **780px** | 780px | **14 / 14** |

## Regression test

`test/visual/features/mobile-nav-containing-block.spec.js` (smoke tier) guards both the cause and the consequence:

1. no ancestor of `#bdNavbar` creates a fixed-position containing block — the
   failure message names the offending ancestor and property;
2. with the menu open the panel fills the viewport, is not clipped, and every
   link is a ≥24px tap target.

Verified bidirectionally: injecting `backdrop-filter` on `.navbar` fails both tests (`panel is 60px tall in a 844px viewport`); removing it passes both.

**Coverage gap, stated plainly:** the spec runs against the theme site, because that is what the Playwright tier serves. The example site — where this bug actually occurred — is built separately into a stitched tree by `.github/workflows/pages.yml` and is not part of any automated tier. The spec therefore protects the theme and any consumer copying it, and would have caught this had the same CSS been applied to the theme, but it does not watch the example. Regenerate this evidence against a stitched tree to re-check that:

```bash
BASE_URL=http://127.0.0.1:4021 node test/visual/mobile-nav-containing-block-evidence.mjs
```
