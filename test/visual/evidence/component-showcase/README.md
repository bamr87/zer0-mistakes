# Evidence — component-showcase demo links are inert + include renders (issue #219)

`_includes/components/component-showcase.html` is a reusable Bootstrap 5 demo
gallery. Two problems made it unsafe to include:

1. **It could not render at all.** The "Usage:" examples in its header comment
   were live `{% include … %}` tags (Liquid runs them even inside an HTML
   comment), so the include recursively included itself → `stack level too deep`.
   That is why it was previously rendered on no page. The examples are now
   wrapped in `{% raw %}`.
2. **Its breadcrumb + list-group demo links were site-absolute** (`/docs/`,
   `/pages/`, `/docs/customization/`, `/categories/`, `/tags/`). On a remote-theme
   GitHub Pages consumer that lacks those routes, every demo link 404s. They are
   now inert (`href="#"`).

The include is now rendered on the internal reference page
[`/about/settings/components/`](../../../../pages/_about/settings/components.md)
(`layout: admin`), which gives it a real, testable surface.

## How this evidence was produced

[`../../component-showcase-evidence.mjs`](../../component-showcase-evidence.mjs)
renders the **live** showcase and reads the **BEFORE** demo-link hrefs from the
actual pre-fix include (`git show <merge-base>:…component-showcase.html`) — a
faithful diff, not a hand-mock.

```bash
docker compose up                                                    # serves :4000
BASE_URL=http://localhost:4000 node test/visual/component-showcase-evidence.mjs
```

## What each file shows

- **`01-demo-links-after.png`** — the live-rendered breadcrumb and list-group
  demos. Every link is now inert (`href="#"`); the include renders cleanly.
- **`metrics.json`** — measured demo-link hrefs before vs after, and the
  before-state render error.

## Measured before → after (from `metrics.json`)

| | Renders? | Breadcrumb demo hrefs | List-group demo hrefs | Site-absolute (404 hazard) |
|---|---|---|---|---|
| **before** | ❌ recursion crash | `/`, `/docs/`, `/docs/customization/` | `/pages/`, `/docs/`, `/categories/`, `/tags/` | **7** |
| **after** | ✅ | `#`, `#`, `#` | `#`, `#`, `#`, `#` | **0** |

Regression tests: [`../../component-showcase.spec.js`](../../component-showcase.spec.js)
(smoke tier — renders + inert links) and `test_showcase_demo_links` in
`test/test_core.sh` (source-level grep for absolute demo links).
