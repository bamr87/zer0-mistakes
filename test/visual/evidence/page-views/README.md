# Evidence — page-view counter (ZER0-083)

Proof for the new per-page view counter: `_includes/components/page-views.html`
(badge) + `_includes/components/page-views-init.html` (config, injected from
`core/head.html`) + `assets/js/page-views.js` (behaviour), displayed in the
article meta row by `_layouts/article.html`.

Route exercised: `/posts/2026/08/15/jekyll-preview-server-from-an-old-pc/`
(resolved from the homepage at run time, not hardcoded). Provider: `local` —
the default, which keeps counts in the visitor's `localStorage` and needs no
server.

## Before → after

**BEFORE** the meta row ended at the reading time. There is no old rendering to
revert to, so `01-before-no-count.png` captures that state through a real code
path rather than a mock: Do Not Track is on, so nothing is recorded and the
badge stays hidden — which is also what every reader sees on a page they have
not opened before.

**AFTER** the row carries `👁 N view(s)` between the reading time and the
"Updated" stamp.

| Image | What it shows |
| --- | --- |
| `01-before-no-count.png` | No count (Do Not Track). The badge is hidden **and takes its leading `•` with it** — the row reads "4 min read • Updated: …", with no dangling separator. |
| `02-after-first-view.png` | First view recorded: `👁 1 view` — singular label. |
| `03-after-second-session.png` | A second browser session on the same page: `👁 2 views` — the count advanced and the label switched to the plural. |
| `04-after-large-count.png` | A large count: `👁 12,438 views`, thousands-separated by `Intl.NumberFormat`. Produced by seeding the counter's own `localStorage` payload and reloading, so the render path is the real one. |
| `05-after-mobile-390.png` | 390 px phone: the meta row wraps and the badge stays intact (`white-space: nowrap` keeps `👁 1 view` from breaking across lines). No horizontal overflow. |

## Metrics (`metrics.json`)

Measured on each state, not asserted by eye:

| State | badge hidden | count | label | page overflow | meta-row height |
| --- | --- | --- | --- | --- | --- |
| before (DNT) | **true** | — | — | 0 px | 31 px |
| first view | false | `1` | `view` | 0 px | 31 px |
| reload, same session | false | `1` | `view` | 0 px | 31 px |
| second session | false | `2` | `views` | 0 px | 31 px |
| large count | false | `12,438` | `views` | 0 px | 31 px |
| mobile 390 px | false | `1` | `view` | 0 px | 79 px (wrapped) |

Two things worth reading off that table:

- **Session dedupe works.** "reload, same session" holds at `1`; only a new
  session advances it. A reload cannot inflate the number.
- **The meta row does not reflow.** Desktop height is 31 px from `1` to
  `12,438` — `font-variant-numeric: tabular-nums` on the count keeps the row
  stable as digits are added.

## Regression test

[`test/visual/features/page-views.spec.js`](../../features/page-views.spec.js)
— 7 tests, green on Chromium: config injection, first view, session dedupe,
plural switch, the Do Not Track gate, `reset()`, and a console-error check
scoped to this feature.

## Regenerate

```bash
docker compose up                                     # serves :4000
BASE_URL=http://localhost:4000 node test/visual/page-views-evidence.mjs
```
