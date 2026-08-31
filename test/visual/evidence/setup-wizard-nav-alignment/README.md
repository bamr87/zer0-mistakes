# Evidence — setup wizard Back/Next stay put (#408, PR #432)

The wizard's `Back and Next never move vertically between steps` spec failed in
CI with a 16px spread.
This bundle shows what moved, why, and that it no longer moves.

## What CI actually saw

[Run 33304606784](https://github.com/bamr87/zer0-mistakes/actions/runs/33304606784),
`test/visual/features/setup-wizard.spec.js:104`:

```text
Error: Next button document-y offsets across steps: 1365, 1367, 1367, 1351
Expected: <= 1
Received:    16
```

`00-ci-failure-real-site.png` is CI's own failure screenshot — the real built
site, not a harness.

Two independent causes hide in those four numbers:

| Step | Offset | Cause |
| --- | --- | --- |
| Identity | 1365 | Its nav is `text-end` with **no** `d-flex`, so the button is an inline-block sitting on a baseline. The descender space below it lifts the button ~2px. |
| URLs, Collections | 1367 | The reference — flex nav, single-line label. |
| Analytics | 1351 | `Review & Download` **wraps to a second line** in the real ~270px middle column. The row is pinned to the *bottom*, so the extra line-height pushes the button's **top** up by 16px. |

The container height was never the problem: the grid change already holds every
pane in one cell, and the spec's own `paneStacking` assertions passed. Only the
nav row's own height varied.

## Before / after

`01-before-nav-row-analytics.png` and `02-after-nav-row-analytics.png` crop the
Analytics nav row at a 300px column. Before, both labels wrap to two lines;
after, both sit on one.

`metrics.json` carries the full sweep. Summary — spread of the Next button's
document-y offset across the four steps:

| Middle column | Before | After |
| --- | --- | --- |
| 1400px | 2px | **0px** |
| 1280px | 2px | **0px** |
| 1024px | 2px | **0px** |
| 300px | 17px | **0px** |
| 271px | 15px | **0px** |

The 300px row reproduces CI's signature exactly: offsets `875, 877, 877, 860`,
with the Analytics button measuring 35px tall against everyone else's 19px.

## How this was measured — and the caveat

**No Jekyll site was served.** The agent sandbox has no bundler and could not
install one, so `bundle exec jekyll serve` and the usual
`evidence-kit.mjs` run against `localhost:4000` were both impossible.

Instead the numbers come from a static harness rendering **the real
`_includes/setup/wizard.html`**, **the real `assets/css/main.scss` compiled with
Dart Sass**, and the repo's **vendored Bootstrap CSS + JS**, driven by real
Chromium via Playwright. "Before" is the tree with this PR's
`_sass/components/_setup-wizard.scss` change stashed; "after" is with it applied
— same harness, same browser, same widths.

That is genuine evidence for a geometry change, and its "before" agrees with
CI's real-site numbers (a ~2px step-1 offset plus a one-line-height jump on the
wrapped step). It is **not** a full-page screenshot of the built site, and the
absolute offsets differ from CI's because the harness has no site chrome above
the wizard. The authoritative check remains the spec itself in
`Test Suite (Ruby 3.3)`.
