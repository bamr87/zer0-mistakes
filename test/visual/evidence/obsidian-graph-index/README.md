# Evidence — Obsidian graph reads the wiki-index URL js-cdn.html actually emits (issue #294)

The full-graph page (`/docs/obsidian/graph/`) is rendered by
`assets/js/obsidian-graph.js` from `assets/data/wiki-index.json`. The pre-fix
renderer resolved that index URL only from `window.OBSIDIAN_WIKI_INDEX_URL` — a
global nothing in the theme ever sets — and then fell back to a
`<base>`-relative `/assets/data/wiki-index.json`. On a **project site**
(non-empty `baseurl`, e.g. GitHub Pages at `/reponame/`) that fallback drops
the baseurl prefix, the fetch 404s, and the page renders a red
"Failed to load graph data: HTTP 404" alert instead of the graph.
`_includes/components/js-cdn.html` emits the baseurl-aware URL under
`window.OBSIDIAN_CONFIG.wikiIndexUrl`; the fix makes the graph read it, using
the same fallback chain `obsidian-wiki-links.js` already established
(config → legacy global → `<base>`-relative).

## How this evidence was produced

[`../../obsidian-graph-index-evidence.mjs`](../../obsidian-graph-index-evidence.mjs)
drives a **real project-site build** of the theme (`jekyll build --baseurl
/zer0-mistakes`, served statically so the baseurl-less fallback genuinely
404s). The **BEFORE** panel loads the *actual* pre-fix `obsidian-graph.js`
(read from the PR's merge-base via `git show` and served back through
`page.route`), so the montage is a faithful diff of the real code change — not
a hand-mock.

```bash
docker compose run --rm jekyll sh -c "bundle exec jekyll build \
  --config _config.yml,_config_dev.yml --baseurl /zer0-mistakes \
  --destination /site/_evidence/graph-baseurl/zer0-mistakes"
(cd _evidence/graph-baseurl && python3 -m http.server 4605) &
BASE_URL=http://localhost:4605 BASE_PATH=/zer0-mistakes \
  node test/visual/obsidian-graph-index-evidence.mjs
```

## What each file shows

- **`01-before-after-baseurl.png`** — the graph page on the baseurl'd build.
  BEFORE: the renderer fetches `/assets/data/wiki-index.json` (no baseurl) →
  **404** → "Failed to load graph data: HTTP 404" alert, empty container.
  AFTER: it fetches `/zer0-mistakes/assets/data/wiki-index.json` → **200** and
  renders the force-directed graph (164 pages · 272 links).
- **`metrics.json`** — the measured facts behind the montage: every
  wiki-index request (path + status) and the rendered state per scenario.

## Measured before → after (from `metrics.json`)

| State | Graph's index fetch | Status | Result |
|---|---|---|---|
| **before** (pre-fix) | `/assets/data/wiki-index.json` | 404 | alert: "Failed to load graph data: HTTP 404" |
| **after** (fix) | `/zer0-mistakes/assets/data/wiki-index.json` | 200 | graph rendered — "164 pages 272 links 23 broken" |

On a baseurl-less build (local dev, user/org Pages sites) the fallback and the
emitted config URL coincide — which is why the bug never showed locally.

Regression test: [`../../features/obsidian-graph.spec.js`](../../features/obsidian-graph.spec.js)
(smoke tier) pins both that the graph renders from the emitted
`OBSIDIAN_CONFIG.wikiIndexUrl` and that the config URL wins over the
`<base>`-relative fallback (via a sentinel-URL rewrite that reproduces the
project-site split on the dev server).
