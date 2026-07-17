# Evidence — search degrades gracefully without `/search.json` (issue #202)

The site-wide search modal (`assets/js/search-modal.js`) fetches `/search.json` and offers a "View all results" link plus a no-JS form action pointing at `/sitemap/`. Both `/search.json` and `/sitemap/` are produced by a **plugin-only generator** that never runs on a remote-theme GitHub Pages consumer — so there they return **404**. The pre-fix modal hid that failure: it said "No results found." (as if the site simply had no matching content) and pressing Enter navigated the user to `/sitemap/?q=…`, a dead-end 404.

The fix records whether the index actually loaded (`searchIndexAvailable`) and degrades clearly when it didn't.

## How this evidence was produced

[`../../search-degradation-evidence.mjs`](../../search-degradation-evidence.mjs) drives the **real dev-served** modal and intercepts `/search.json` with a 404 to reproduce a remote-theme consumer. The **BEFORE** panels load the *actual* pre-fix `search-modal.js` (read from the PR's merge-base via `git show` and served back through `page.route`), so each montage is a faithful diff of the real code change — not a hand-mock.

```bash
docker compose up                                                   # serves :4000
BASE_URL=http://localhost:4000 node test/visual/search-degradation-evidence.mjs
```

## What each file shows

- **`01-empty-state-before-after.png`** — `/search.json` forced to 404, query
typed. BEFORE: "No results found." (misleading). AFTER: "Search is unavailable on this site." (honest about the missing index).
- **`02-index-present-after.png`** — fixed JS with the index **present**: results
and the `/sitemap/` "View all results" link render exactly as before — the fix changes nothing on a full site.
- **`metrics.json`** — the measured facts behind the montages (empty-state copy,
  `/sitemap/` link presence, and where form-submit navigated) for each state.

## Measured before → after (from `metrics.json`)

| State | `/search.json` | Empty-state copy | "View all" link | Submit (Enter) |
|---|---|---|---|---|
| **before** (pre-fix) | 404 | `No results found.` | none | navigates to `/sitemap/` (404 on a consumer) |
| **after** (fix) | 404 | `Search is unavailable on this site.` | none | stays in-modal, no navigation |
| **after** (fix) | 200 | _n/a — 2 results_ | `/sitemap/?q=jekyll` | submits to `/sitemap/` (present) |

Regression test: [`../../search-degradation.spec.js`](../../search-degradation.spec.js) (smoke tier) pins all three rows.
