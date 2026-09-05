# Evidence — TOC scroll spy tracks the section being read

**Bug:** the bolded entry in the right-hand Table of Contents jumped around and
pointed at the wrong section. On `/docs/features/toc/` at 1280×820 the
pre-fix theme highlighted the wrong entry at **19–23 of 25 scroll positions**,
depending on the run — usually one to three sections *ahead* of what was
actually on screen. `metrics.json` records the run that produced the committed
montage (19/25); the fix measures 0/25 in every run.

**Cause:** three separate implementations were toggling `.active` on the same
`#TableOfContents a` links, and the one that was supposed to own it was picking
its winner from an unreliable signal.

1. Bootstrap's native ScrollSpy was wired up **twice** — `data-bs-spy="scroll"
   data-bs-target="#TableOfContents"` on `<body>` (`_layouts/root.html`) *and*
   on `.bd-main` (`_layouts/default.html`). Its `data-bs-offset="100"` was also
   dead: Bootstrap 5.2 replaced that option with `data-bs-root-margin`.
2. `assets/js/ui-enhancements.js` ran a third observer over *every*
   `a[href^="#"]` on the page — TOC links included — clearing `.active` from
   all of them each time a `section[id]` intersected.
3. The theme's own `assets/js/modules/navigation/scroll-spy.js` asked
   IntersectionObserver for the "most visible" heading. Headings are a few
   pixels tall, so every heading inside the observer band reports the same
   `intersectionRatio`; the winner was whichever entry happened to be in that
   callback's batch, and a heading scrolling *out* of the band triggered no
   re-evaluation at all.

**Fix:** Bootstrap's ScrollSpy hooks removed from both layouts, the
`ui-enhancements.js` observer scoped away from TOC links, and the theme's spy
rewritten around a positional rule — the active heading is the last one whose
top has crossed the reading line (the document's `scroll-padding-top`, the same
offset anchor navigation uses), with the last heading winning once the page is
scrolled to the bottom. It is recomputed from scratch on every scroll frame.

## What the images show

| File | Shows |
|------|-------|
| `01-before-after.png` | Three scroll positions, before and after. The dashed red line is the reading line; the section whose heading last crossed it is the one being read. In each BEFORE panel the bolded TOC entry names a section further down the page than the one on screen; in each AFTER panel they match. |

## Numbers

`metrics.json`, from `test/visual/scroll-spy-evidence.mjs` on
`/docs/features/toc/` at 1280×820, 25 evenly spaced scroll positions:

| Metric | Before | After |
|--------|--------|-------|
| Scroll positions bolding the wrong entry | 19 / 25 (19–23 across runs) | 0 / 25 |
| TOC entries active on page load | 0 | 1 |

The pre-fix highlight is non-deterministic — which of the three
implementations wins depends on callback timing, so both the count and the
exact set of wrong positions move between runs (19, 22 and 23 of 25 were all
observed). It can also jump *backwards* while scrolling down: the `highlight
never jumps backwards while scrolling down` test caught 3 such moves in one
run against the pre-fix build, while the runs recorded in `metrics.json`
caught none. That instability is the bug as users experience it — and it is
why the regression test asserts properties (one active entry, monotonic,
matches the reading line) rather than a fixed list of positions.

## Reproduce

```bash
docker compose up                                        # serves :4000
BASE_URL=http://localhost:4000 node test/visual/scroll-spy-evidence.mjs
```

The BEFORE state is reproduced on the same server: the script serves the
pre-fix JavaScript straight out of git (`REF`, default `HEAD`) and restores the
`data-bs-spy` attributes the fix removed, so no second build is needed. Point
`REF` at the commit before the fix once it has landed.

## Regression test

`test/visual/features/scroll-spy.spec.js` (smoke tier) pins the behaviour: the
active entry matches the section under the reading line at every sampled scroll
position, exactly one entry is active, the highlight never moves backwards
while scrolling down, the last entry wins at the bottom of the page, a clicked
entry stays active, and nothing else claims `#TableOfContents` as a scroll-spy
target. Five of its six tests fail against the pre-fix theme.
