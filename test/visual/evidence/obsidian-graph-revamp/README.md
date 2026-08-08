# Evidence — Obsidian graph frontend revamp (settings panel, filters, forces, local-graph controls)

The Obsidian graph frontend was revamped to mirror the Obsidian desktop graph experience. This is **new feature surface** (after-only evidence per the visual-evidence skill — there is no "before" state to unfix: the controls did not exist).

What shipped:

- **Full graph page** (`/docs/obsidian/graph/`, renderer `assets/js/obsidian-graph.js`):
a floating **Graph settings** card with three sections — **Filters** (search with `tag:`/`path:` operators, per-collection toggles generated from the wiki-index with count badges + color swatches that double as the legend, show-orphans, show-unresolved), **Display** (link arrows, node size, link thickness, label fade threshold) and **Forces** (repel force, link distance, animate toggle) — plus a zoom / fit / fullscreen button stack, a hover preview card, live `data-bs-theme` reactivity, and localStorage persistence (`zer0.obsidianGraph.v1`).
- **Local graph panel** (`_includes/navigation/local-graph.html`, renderer
`assets/js/obsidian-local-graph.js`): a depth selector (1–3) and outgoing/incoming direction switches that re-render the subgraph in place and persist per-browser (`zer0.obsidianLocalGraph.v1`).

## How this evidence was produced

[`../../obsidian-graph-revamp-evidence.mjs`](../../obsidian-graph-revamp-evidence.mjs) drives the live dev server:

```bash
docker compose up                    # serves :4000
BASE_URL=http://localhost:4000 node test/visual/obsidian-graph-revamp-evidence.mjs
```

## What each file shows

- **`01-graph-controls.png`** — the full graph page: default view (orphans hidden
by default, hub labels visible, stats badges), the settings card open on the Filters section (collection toggles with counts), the largest collection toggled off (stats drop from "82 of 164 pages" to the filtered count with the connected edges gone), and dark color mode (canvas restyled from the live `data-bs-theme`, no reload).
- **`02-local-graph-depth.png`** — the local graph offcanvas panel at depth 1
  vs depth 2, with the new depth selector and direction switches visible.
- **`metrics.json`** — measured node counts / stats strings per scenario.

## Regression tests

`test/visual/features/obsidian-graph.spec.js` — the "controls revamp" describe block pins: the settings panel + zoom bar render, collection filters are generated with counts, toggling a collection reduces visible nodes and persists to localStorage, Reset restores the stock view, orphans are hidden by default, and the node-size slider rescales nodes live. Runs in the `smoke` CI tier.
