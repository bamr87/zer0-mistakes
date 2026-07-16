# Evidence — intro hero banner applies `relative_url` exactly once (issue #293)

`_includes/content/intro.html` resolves the banner image into `preview_path`
(lines 27–41), applying `relative_url` during assignment in every relative
branch. The pre-fix point of use then piped it through `relative_url`
**again**:

```liquid
background: …, url('{{ preview_path | relative_url }}') no-repeat center center / cover;
```

`relative_url` unconditionally prepends `site.baseurl`, so any **project
site** (non-empty baseurl, e.g. GitHub Pages at `/reponame/`) rendered the
baseurl segment twice — `url('/reponame/reponame/assets/…')` → 404 — and every
intro hero lost its background image, leaving only the dark gradient.
Absolute preview URLs were mangled too (`/reponame/https:/cdn…`). The fix
drops the redundant filter at the point of use.

## How this evidence was produced

The include renders server-side, so both states are **real Jekyll builds** at
`--baseurl /zer0-mistakes`, served statically: BEFORE with `intro.html`
reverted to the PR's merge-base, AFTER at the PR head — a faithful diff of the
real code change, driven by
[`../../intro-banner-baseurl-evidence.mjs`](../../intro-banner-baseurl-evidence.mjs)
(exact commands in its header).

## What each file shows

Both preview-resolution branches a project site exercises:

- **`01-faq.png`** — `/faq/` (the `site.info_banner` fallback branch).
  BEFORE: background URL `/zer0-mistakes/zer0-mistakes/assets/images/info-banner-mountain-wizard.png`
  → **404**, hero is a flat gradient. AFTER: single prefix → **200**, the
  banner image renders.
- **`02-graph.png`** — `/docs/obsidian/graph/` (a `page.preview` without the
  `/assets` prefix — the auto-prefix branch). Same 404 → 200 flip.
- **`metrics.json`** — the measured background-image URL and its HTTP status
  per page and state.

## Measured before → after (from `metrics.json`)

| Page | Background URL (before) | Status | Background URL (after) | Status |
|---|---|---|---|---|
| `/faq/` | `/zer0-mistakes/zer0-mistakes/assets/images/info-banner-mountain-wizard.png` | 404 | `/zer0-mistakes/assets/images/info-banner-mountain-wizard.png` | 200 |
| `/docs/obsidian/graph/` | `/zer0-mistakes/zer0-mistakes/assets/images/previews/obsidian-graph-view.png` | 404 | `/zer0-mistakes/assets/images/previews/obsidian-graph-view.png` | 200 |

At baseurl `""` (local dev, user/org Pages sites) the double application is a
no-op — which is why the bug never showed on the theme's own site.

Regression test: [`../../core/styling.spec.js`](../../core/styling.spec.js)
("Intro hero banner (issue #293)", smoke tier) — on both branches' routes, the
rendered `.bd-intro` background-image URL must resolve 200.
