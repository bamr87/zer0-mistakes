# Evidence — sidebar nav-tree marks only the current page active (not every item)

`_includes/navigation/nav-tree.html` computed the active state with:

```liquid
{% assign is_active = page.url == item.url %}
```

Liquid's `assign` does **not** evaluate `==` — it stored the value of `page.url` (a non-empty, truthy string) and ignored `== item.url`. So `{% if is_active %}` was always true and **every** link in a curated `_data/navigation` sidebar rendered with the `.active` highlight, making it impossible to tell which page you were on. The fix replaces the three broken assigns (`is_active`, `child_active`, `gc_active`) with proper conditional assigns.

## How this evidence was produced

The active state is decided server-side, so both states are **real Jekyll builds** of the same site (a consumer with a large curated nav tree — 19 groups + 200 children), with `user_overrides` disabled to isolate theme rendering: BEFORE with `nav-tree.html` reverted to `origin/main`, AFTER at this PR's HEAD. The count is `aside.bd-sidebar .nav-tree .nav-tree-link.active` in the raw HTML.

## What each file shows

- **`01-before-all-active.png`** — the left sidebar on `/docs/wargames/natas/`.
Every game group link is highlighted (`.active`): **219 of 219** nav-tree links active.
- **`02-after-single-active.png`** — the same page after the fix. Only the
  current page's link (**Natas**) is highlighted: **1 of 219** active.
- **`metrics.json`** — the measured active/total counts per state.

## Measured before → after

| Route | `.nav-tree-link.active` (before) | (after) |
|---|---|---|
| `/docs/wargames/natas/` | **219** (every item) | **1** (current page) |

Regression guard: `test/visual/features/sidebar-navigation.spec.js` → "curated nav-tree marks only the current page active, not every item" asserts `active <= 1` on a curated docs tree (fails against the pre-fix template, which marked `active === total`).
