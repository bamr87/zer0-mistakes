# Evidence — component-showcase demo links existence-guarded (issue #219)

`_includes/components/component-showcase.html` is a reusable Bootstrap 5 demo gallery. This directory covers **two phases** of the issue #219 fix:

## Phase 1 (prior PR): render + inert links

1. **Include could not render** — usage examples in the HTML comment were live
Liquid tags that recursively re-included the file (`stack level too deep`). Fixed by wrapping them in `{% raw %}`.
2. **Demo links were site-absolute** (`/docs/`, `/pages/`, etc.) — 404 on
   remote-theme consumers. Fixed by making them inert (`href="#"`).

## Phase 2 (this PR): existence-guarded real links

The inert `href="#"` approach (phase 1) was a safe but sub-optimal stop-gap. The accepted fix (issue #219 comment) is **existence-guarding**: each demo link is rendered as a real `<a href="...">` if the target page exists in the build, or as plain text (no `<a>`) if it does not. This makes the showcase meaningful on a full build while remaining safe on any remote-theme consumer site.

Targets guarded:

| Demo | Target URL | Guard source |
|---|---|---|
| Breadcrumb: Home | `/` | always present — not guarded |
| Breadcrumb: Documentation | `/docs/` | `site.html_pages` + collection docs |
| Breadcrumb: Customization | `/docs/customization/` | `site.html_pages` + collection docs |
| List-group: Blog Posts | `/posts/` | `site.html_pages` + collection docs |
| List-group: Documentation | `/docs/` | reuses breadcrumb guard |
| List-group: Categories | `/categories/` | `site.html_pages` + collection docs |
| List-group: Tags | `/tags/` | `site.html_pages` + collection docs |

The pattern mirrors `_includes/navigation/breadcrumbs.html` (section-root guard), `_includes/components/author-bio.html` (profile-URL guard), and `_includes/navigation/section-sidebar.html` (tags-page guard).

## How this evidence was produced

[`../../component-showcase-evidence.mjs`](../../component-showcase-evidence.mjs) renders the **live** showcase and reads the **BEFORE** demo-link hrefs from the include on main (`git show <merge-base>:…component-showcase.html`) — a faithful diff, not a hand-mock.

```bash
docker compose up                                                    # serves :4000
BASE_URL=http://localhost:4000 node test/visual/component-showcase-evidence.mjs
```

## What each file shows

- **`01-demo-links-after.png`** — phase 1 evidence: breadcrumb + list-group with
  inert `href="#"` links (rendered on `/about/settings/components/`).
- **`02-existence-guard-after.png`** — phase 2 evidence: the same sections with
  existence-guarded real links (or plain text where the page is absent).
- **`metrics.json`** — measured hrefs and onclick counts before vs after.

## Measured before → after (from `metrics.json`)

| | Inert href="#" | onclick handlers | Real guarded links | Plain-text fallbacks |
|---|---|---|---|---|
| **before (main)** | 7 | 4 | 0 | 0 |
| **after (this PR)** | 0 | 0 | varies by build | varies by build |

On a full zer0-mistakes build all six targets exist, so all six render as real links. On a minimal remote-theme consumer none may exist, so all render as plain text — no 404 injected either way.

Regression tests: [`../../component-showcase.spec.js`](../../component-showcase.spec.js) (smoke tier — renders, no inert href="#", no onclick handlers).
