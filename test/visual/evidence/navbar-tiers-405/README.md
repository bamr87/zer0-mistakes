# Navbar label tiers, merged chevron, labelled menu toggle — evidence (#405)

Evidence for the navbar rework in [#405](https://github.com/bamr87/zer0-mistakes/issues/405) and for the sub-`lg` regression it introduced and this branch fixes.

Regenerate everything here with [`../../navbar-tiers-evidence.mjs`](../../navbar-tiers-evidence.mjs), which reproduces the BEFORE state on the same server that renders the AFTER by re-applying the offending clamp (`unfixCss`) — so the numbers are measured, not remembered:

```bash
docker compose up                                   # serves :4000
BASE_URL=http://localhost:4000 node test/visual/navbar-tiers-evidence.mjs
```

> **Montages are not committed yet.** The generator above needs a live Jekyll server (Docker), which the agent that wrote this branch had no access to. The numeric evidence below is real — it is read straight out of the CI run that caught the bug — but the PNG bands still need one local run to land. See "Status" at the bottom.

## The bug: the labelled toggle did not fit its own box

`#405` labelled the below-`lg` menu toggle "Menu" so it could not be confused with the sidebar hamburger beside it. The toggle is styled by two competing rules:

| Rule | Specificity | Declares |
| --- | ---: | --- |
| `#navbar .navbar-toggler` (sub-`lg` block) | 1,1,0 | `width: 2.5rem; height: 2.5rem` |
| `.navbar-toggler.navbar-toggler-labeled` | 0,2,0 | `width: auto` |

The ID selector wins. The button was therefore pinned to a 40px square that cannot hold glyph + gap + "Menu", so `span.navbar-toggler-text` **escaped the button box and pushed the document past the viewport**. Because the header is `position: fixed`, any horizontal page scroll makes the bar stop where the page keeps going — the classic "navbar cut off" report.

### Page overflow across the width matrix

Worst horizontal overflow of any non-scrollable in-flow element, in px past the viewport. `0` = no sideways scroll. Measured by the `@critical` spec `test/visual/features/navbar.spec.js` → `Navbar — no cutoff / overflow across the width matrix`.

The **Before** column is measured — read straight out of the run that caught the bug. The **After** column is the state the gate requires (the spec asserts `docOverflowPx <= 1`) and that CI verifies on this branch; it is the pass condition, not a second hand-recorded measurement.

| Viewport | Before (measured) | After (gate requires) | Widest element (before) |
| ---: | ---: | ---: | --- |
| 320px | **14** | 0 | `span.navbar-toggler-text` |
| 360px | **14** | 0 | `span.navbar-toggler-text` |
| 390px | **14** | 0 | `span.navbar-toggler-text` |
| 414px | **14** | 0 | `span.navbar-toggler-text` |
| 600px | **14** | 0 | `span.navbar-toggler-text` |
| 768px | **14** | 0 | `span.navbar-toggler-text` |
| 820px | **14** | 0 | `span.navbar-toggler-text` |
| 991px | **14** | 0 | `span.navbar-toggler-text` |
| 992px | 0 | 0 | — (label not rendered at `lg`+) |
| 1280px | 0 | 0 | — |
| 1440px | 0 | 0 | — |

**The tell is that the overflow is a constant 14px from 320px to 991px.** A layout that is merely too narrow overflows *more* as the viewport shrinks; a constant excess means a fixed-width box is being overrun by its own contents by the same amount at every width. The value drops to 0 at exactly 992px because the label lives inside `.bd-navbar-toggle.d-lg-none` and is not rendered at `lg`+ at all.

Source for the "before" column: run [33737502831](https://github.com/bamr87/zer0-mistakes/actions/runs/33737502831) — 8 failed cases, every one reporting `Page overflows the viewport by 14px (widest: span.navbar-toggler-text)`, and the 8 widths at 992px and above passing untouched.

## The fix

`_sass/core/_navbar.scss`, inside the `@media (max-width: 991.98px)` block, re-asserts content sizing at a specificity that outranks the ID rule, while keeping 2.5rem as a floor so the touch target is unchanged:

```scss
#navbar .navbar-toggler.navbar-toggler-labeled {
    width: auto;
    min-width: 2.5rem;
    flex-shrink: 0;
}
```

The square remains the default for bare-glyph togglers — only the labelled one opts out.

## Regression tests

Two layers now pin this, so a future respelling of that square fails with the reason rather than as a mystery page-overflow:

- `test/visual/features/navbar.spec.js` — the `@critical` width matrix that
  caught it, asserting the page never scrolls sideways.
- `test/visual/features/navbar-tiers.spec.js` — `the labelled menu toggle fits
its own box at {320,390,768,991}px`, which asserts the button's `scrollWidth <= clientWidth` and that the label's right edge clears neither the button nor the viewport. This one names the cause.

The second fails without the fix — with the clamp in place the button's `clientWidth` is 40px while its contents need more, which is the 14px the first spec sees escaping — and passes with it.

## Status

- [x] Numeric before/after (above) — from the CI run that caught the bug.
- [x] Reproducible generator committed (`../../navbar-tiers-evidence.mjs`).
- [x] Regression tests committed.
- [ ] PNG montages — need one `node test/visual/navbar-tiers-evidence.mjs` run
      against a local `docker compose up`.
- [ ] Playwright snapshot baselines — the homepage bands legitimately changed
(subtitle moved to the hero, chevron merged, toggle labelled), so `test/visual/snapshots/**` must be regenerated with `./test/update-snapshots.sh` on a Docker host. CI only ever verifies baselines; it cannot refresh them.
