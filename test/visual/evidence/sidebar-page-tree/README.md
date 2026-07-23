# Evidence — `nav: pages` builds the sidebar tree from page URLs (no data file)

The new `pages` sidebar mode (`_includes/navigation/sidebar-pagetree.html`) derives a collapsible left-sidebar tree purely from page permalinks under a `sidebar.base` prefix. A docs area or vendored content set no longer needs a hand-authored (or generated) `_data/navigation/*.yml` file to get a browsable sidebar — the tree stays in sync with the content automatically.

## How this evidence was produced

The tree is decided server-side, so both states are **real Jekyll builds of the same fixture site**: 219 vendored OverTheWire pages under `/docs/wargames/`, with one config — `sidebar: {nav: pages, base: /docs/wargames/, order_by: nav_order, title: Wargames}` — applied to every page. BEFORE loads the theme from an `origin/main` git worktree (where `pages` mode does not exist); AFTER loads it from this PR's working tree. Both are built with an empty baseurl and served locally; counts are read from `aside.bd-sidebar` in the raw HTML and screenshots captured with Playwright/Chromium at 1280px. The route shown is `/docs/wargames/bandit/bandit5/`.

## What each file shows

- **`01-before-no-sidebar.png`** — the Bandit5 page on `origin/main`. `nav: pages` is unrecognized, so the content gate is false and **no left navigation column renders at all**: there is no way to browse to sibling levels. To get a tree here you had to write/generate a ~219-entry `_data/navigation/wargames.yml`.
- **`02-after-auto-tree.png`** — the same page at this PR's HEAD. The left column now holds the auto-derived tree: **14 game sections** grouping **200 level links**, with only the current page (**Bandit5**) marked `.active` and only its section (**Bandit**) expanded on load — built from URLs alone, **zero data-file lines**.
- **`metrics.json`** — the measured before/after counts.

## Measured before → after

| `aside.bd-sidebar` metric | before (`origin/main`) | after (this PR) |
|---|---|---|
| left navigation column | **absent** | **present** |
| section groups | 0 | **14** |
| nav-tree links (total) | 0 | **219** |
| level (child) links | 0 | **200** |
| active links | 0 | **1** (Bandit5) |
| expanded sections | 0 | **1** (the active one) |
| `_data/navigation` lines required | ~219 | **0** |

Regression guard: `test/visual/features/sidebar-navigation.spec.js` → "nav: pages builds a URL-hierarchy tree with one active link and its section expanded" asserts the `.sidebar-pagetree` renders, has more than one section group, marks exactly one link active, and expands the active section server-side. It fails against the pre-feature theme, which renders no tree for `nav: pages`.
