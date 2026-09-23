# Navbar label tiers, merged chevron, centred grid — evidence (#405)

Evidence for the navbar rework in [#405](https://github.com/bamr87/zer0-mistakes/issues/405)
(backlog `T-037`): three coupled changes that all resolve through the same
`bd-nav` container — the label density tiers, the dropdown chevron, and the
desktop grid.

Regenerate with [`../../navbar-tiers-evidence.mjs`](../../navbar-tiers-evidence.mjs):

```bash
docker compose up                                          # serves :4000
BASE_URL=http://localhost:4000 node test/visual/navbar-tiers-evidence.mjs
```

## What has a live before/after, and what doesn't — and why

Two of the three changes reproduce a genuine BEFORE state on this same
running server (the generator re-applies the old CSS live, so the two states
are a true comparison). The third does not, and rather than fabricate one,
this evidence says so:

- **Chevron dead zone — reproducible, shown in `01-chevron-dead-zone.png`.**
- **Bare-label middle tier + `text-overflow: ellipsis` — NOT independently
  reproducible as a live pixel diff.** The theme's own seven demo items
  already render with **zero truncation** on `main` — [PR #423](https://github.com/bamr87/zer0-mistakes/pull/423)
  fixed the `.container-xl` bar cap that caused the original "Quicksta…"
  bug, before #405 even existed (see `test/visual/evidence/navbar-fit/`).
  What #405 removes is the *structural possibility* of truncation — the
  `text-overflow: ellipsis` rule and the bare-label tier that fell back to
  it — which matters for a consumer with more or longer nav items than this
  demo, not for a live pixel diff of this content. Patching just the label
  CSS back in produces no visible difference (verified — see
  [`test/visual/navbar-tiers-evidence.mjs`](../../navbar-tiers-evidence.mjs)'s
  header comment for the two dead-end repro attempts this ruled out); patching
  the grid and bar-width cap too just re-derives the `.container-xl` bug #423
  already fixed and evidenced separately. The regression guard for THIS
  removal is static instead: no `text-overflow: ellipsis` remains inside any
  `@container bd-nav` block in `_sass/core/_navbar.scss`, and
  `navbar-tiers.spec.js`'s `scrollWidth <= clientWidth` assertion pins it on
  `main` at 1024px and 1280px.
- **Grid centring — not usefully reproducible as a live pixel diff either.**
  `.navbar-main-start` and `.navbar-utility-controls` are both content-sized
  (`max-width: 30cqi` / `max-content`) with `justify-self: end` on the
  utility side. Reverting the grid tracks' minimum changes where the *unused*
  space in each column sits, not the measured width of either element, so a
  `getBoundingClientRect()` diff reads as "no change" whether or not the
  floor is present — confirmed by trying it. What the floor actually changes
  — the grid's own column-track sizing — is exercised by
  `navbar-tiers.spec.js`'s "tiers still engage" test, which is also the
  regression guard for the `1fr auto 1fr` trap that makes this grid change
  risky in the first place (see that spec's header comment).

## `01-chevron-dead-zone.png`

The dropdown row at 1024px and 1280px, before vs after.

| Width | Gap before (dead zone) | Gap after |
| ---: | ---: | ---: |
| 992px  | 4px | 0px (icon-only tier — no merged overlay at this width) |
| 1024px | 4px | 0px (icon-only tier) |
| 1150px | 4px | 0px (icon-only tier) |
| 1280px | 4px | **-20px (overlapping — the merge)** |
| 1440px | 4px | **-20px** |
| 1920px | 4px | **-20px** |

A positive gap is a dead zone: hovering the seam between the label and the
chevron lights neither control. A negative gap means the chevron overlaps the
link's own reserved padding — one hover target, no seam. The overlay only
applies in the label tier (≥51rem of centre track, i.e. 1280px+ on this
build); below that the row is icon-only and uses the shared base chevron
style instead, which is why the "after" gap reads 0px rather than negative at
992–1150px.

## `02-viewport-matrix.png`

The bar at 992 → 1920px (lg and up — below that the header shows the tablet
quicklinks or the offcanvas toggler instead of `#bdNavbar`'s inline menubar).
Every panel: **0 truncated**. The tier boundary (51rem of centre track) is
visibly doing its job — 992–1150px drops to icons only, 1280px+ shows full
icon+label — rather than any label being cut partway.

Raw numbers are in [`metrics.json`](metrics.json). The regression tests that
would fail if any of this regressed: "no nav label is CSS-truncated at any
desktop width" (`test/visual/features/navbar.spec.js`) and "tiers still
engage", "no dead zone between the label and the chevron", "icons survive in
BOTH tiers" (`test/visual/features/navbar-tiers.spec.js`).
