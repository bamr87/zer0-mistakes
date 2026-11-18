# fix-a11y-ui-audit-486 — visual evidence

Evidence for [#486](https://github.com/bamr87/zer0-mistakes/issues/486), the weekly UI/UX audit's standing findings. Rendered locally in the repo's `zer0-mistakes-jekyll` image (Jekyll 3.10, `_config.yml,_config_dev.yml`, LiveReload off), BEFORE from `origin/main` @ `93e7062` and AFTER from this branch, with Chromium headless shell.

## What changed on screen

Nothing visible. The ARIA fixes (`aria-label` on the `/features/` reference-table icon links, the showcase's view-toggle buttons and progress bars) change only the accessibility tree. The intro's docs-section badge on `/docs/` still renders as the same link, but its `href` is now `/docs/` instead of `/docs/docs/`. On a page whose section has no index (for example category `setup`), the badge renders as plain text instead of a link to a 404. `01-before-after-docs.png` shows `/docs/` at 390px and 1280px before and after.

## The audit, before and after

`ui-audit-sweep.json` is generated from two runs of `test/ui-audit/sweep.mjs` (this PR's version), one per build:

| | BEFORE (main) | AFTER (this branch) |
| --- | --- | --- |
| Flagged findings | 14 | 0 |
| axe `link-name` (`/features/`, 3 viewports) | 336 nodes | 0 |
| axe `button-name` (`/news/`, 3 viewports) | 9 nodes | 0 |
| axe `aria-progressbar-name` (`/news/`, 3 viewports) | 12 nodes | 0 |
| Broken internal links | 7 | 0 |
| Exempt links (deploy-only or dev-only, with reasons) | 2 | 2 |
| Exempt console errors (giscus "no discussion yet" 404) | 6 | 6 |

The BEFORE run's one console error on `/` @ mobile is `net::ERR_CONNECTION_RESET` for `assets/js/auto-hide-nav.js`, a reset from the static server used to serve the main build, not a site defect. The new `failed_requests` field is what named it.

## Files

- `01-before-after-docs.png`: `/docs/` before and after at 390px and 1280px.
- `02-viewport-matrix-docs.png`: `/docs/` header band at six widths (after).
- `metrics.json`: page overflow before and after per width (0px throughout).
- `ui-audit-sweep.json`: the audit sweep's counts before and after.
- `CHANGELOG-snippet.txt`: the evidence link.

## Regenerate

```bash
# AFTER: this branch, served on :4031 with LiveReload off
bundle exec jekyll serve --config _config.yml,_config_dev.yml,<file with "livereload: false"> --port 4031 --no-watch
# BEFORE: origin/main's _site served on :4032
SLUG=fix-a11y-ui-audit-486 BASE_URL=http://127.0.0.1:4031 BEFORE_URL=http://127.0.0.1:4032 ROUTES=/docs/ node test/visual/pr-evidence.mjs
BASE_URL=http://127.0.0.1:4031 node test/ui-audit/sweep.mjs
```
