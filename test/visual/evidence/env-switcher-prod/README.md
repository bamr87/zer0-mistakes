# Evidence — Quick Links Dev row is gated out of production builds (issue #298)

`_includes/components/env-switcher.html` builds `dev_url` from a hardcoded
`http://localhost:{{ site.port | default: 4000 }}` and — before the fix —
rendered the Quick Links **Dev** row (link + open + copy buttons)
unconditionally. The env-switcher lives in the site-wide Settings offcanvas
(`#info-section`, Site tab) that `root.html` renders on **every page**, so
every `JEKYLL_ENV=production` build shipped a dead `localhost:4000` row to
real visitors, site-wide. The fix wraps the row in
`{% unless is_production %}` — `is_production` being the same
`env-detect.html` flag the card already uses for its badge, which keeps the
row available when serving locally with `JEKYLL_ENV=production` (the
component's documented Docker behaviour).

## How this evidence was produced

The include renders server-side, so the production states are **real
`JEKYLL_ENV=production` builds** of the theme's canonical `_config.yml`
(`site.url: https://zer0-mistakes.com`): BEFORE with the include reverted to
the PR's merge-base, AFTER at the PR head. The third panel is the live dev
server. Driven by
[`../../env-switcher-prod-evidence.mjs`](../../env-switcher-prod-evidence.mjs)
(exact commands in its header), which opens Settings → Site with the same
deterministic offcanvas waits the settings-panel suite uses.

## What each file shows

- **`01-quick-links-prod.png`** — the Quick Links card, three states:
  1. **BEFORE (production)**: rows Prod · **Dev** · Source — the dead
     `localhost:4000/` row, with working open/copy buttons, shipped to
     production visitors.
  2. **AFTER (production)**: rows Prod · Source — no Dev row, zero
     `localhost:4000` occurrences in the Settings chrome.
  3. **AFTER (development)**: rows Prod · Dev · Source — the Dev row is
     preserved for local work.
- **`metrics.json`** — the row list (badge + href) and the count of
  `localhost:4000` occurrences inside `#info-section` per state. (Page
  *content* legitimately mentions `localhost:4000` in setup code samples;
  the counted leak is chrome only.)

## Measured before → after (from `metrics.json`)

| State | Build | Quick Links rows | `localhost:4000` in Settings chrome |
|---|---|---|---|
| **before** | `JEKYLL_ENV=production` | Prod · Dev · Source | 5 |
| **after** | `JEKYLL_ENV=production` | Prod · Source | 0 |
| **after** | development | Prod · Dev · Source | 6 (expected — that's the feature) |

Regression test: [`../../features/settings-panel.spec.js`](../../features/settings-panel.spec.js)
("Quick Links environment gating (issue #298)", smoke tier) — pins the
preserved development behaviour (Dev row present with a `localhost` href;
Prod/Source rows unconditional). The production-absence half is build-time
Liquid and is covered by the builds above.
