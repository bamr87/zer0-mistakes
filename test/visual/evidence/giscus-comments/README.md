# Evidence — Giscus comments gate fix (PR #214, issue #201)

The article layout renders a `#comments` section (the Giscus widget, backed by
GitHub Discussions) for blog posts. The gate that decides whether to show it was
`{% if page.comments != false and site.giscus %}` — keyed on the mere
**presence** of the `site.giscus` config block. So a site that kept the block
but set `enabled: false` **still rendered comments**. The fix keys the gate on
the flag itself: `site.giscus.enabled`.

## How this evidence was produced

[`../../giscus-comments-evidence.mjs`](../../giscus-comments-evidence.mjs) drives
the live dev server and captures three real states of the same post, reverting
every transient edit at the end:

1. `enabled: true` + fix gate → comments render (normal operation).
2. `enabled: false` + fix gate (`site.giscus.enabled`) → comments **hidden** ✅.
3. `enabled: false` + the **actual pre-fix** gate (`site.giscus`) → comments
   **shown** ❌ — the bug.

The dev config sets `incremental: true`, which serves stale pages after a config
change, so the script forces `incremental: false` and clears Jekyll's caches
between states to get a faithful rebuild.

```bash
docker compose up                                                  # serves :4000
BASE_URL=http://localhost:4000 node test/visual/giscus-comments-evidence.mjs
```

## What each file shows

- **`01-gate-before-after.png`** — same post, same `enabled: false` config. The
  pre-fix gate leaves the "Comments" section on the page (bug); the fix removes
  it.
- **`02-enabled-render.png`** — `enabled: true`: the post renders the `#comments`
  section and the Giscus `<script>` wired from `_config.yml`
  (`data-repo`, `data-repo-id`, `data-category-id`). The widget's "giscus is not
  installed on this repository" text is a **localhost-origin artifact** of the
  giscus.app embed check, not the theme — the served site loads it normally.
- **`metrics.json`** — the measured `commentsPresent` / `giscusScript` flags for
  each state.

## Measured states (from `metrics.json`)

| State | `giscus.enabled` | Gate | Comments rendered |
|---|---|---|---|
| pre-fix | `false` | `site.giscus` | **yes** ❌ (the bug) |
| fix | `false` | `site.giscus.enabled` | **no** ✅ |
| fix | `true` | `site.giscus.enabled` | yes (normal) |

Regression test: [`../../giscus-comments.spec.js`](../../giscus-comments.spec.js)
(smoke tier) pins the enabled-render wiring and the non-article scoping; the
`enabled: false` branch is additionally guarded by the `Giscus Comments
Configuration` core test (`test/test_core.sh`).
