# Evidence — category badges are existence-gated (issue #204)

`_layouts/article.html` and `_includes/components/post-card.html` render a category badge. It used to be an **unconditional link** to `{category_base}/{category}/` (default `/news/<category>/`). On a remote-theme GitHub Pages consumer the category index is plugin/page-generated and absent, so that link 404s. The fix links the badge only when the category index page exists in the build (`site.html_pages` / `site.posts`), otherwise it renders a plain `<span>`.

The theme's own content exercises both branches: `/news/development/` exists but `/news/security/` does not.

## How this evidence was produced

A **double-render** (the layout is server-rendered, so it can't be swapped at runtime like a JS asset): [`../../category-badge-evidence.mjs`](../../category-badge-evidence.mjs) captures the live post-fix state, then the orchestrator reverts `article.html` / `post-card.html` to the merge-base, captures the pre-fix state, and restores — so BEFORE is the real pre-fix render, not a hand-mock.

```bash
docker compose up                                                  # serves :4000
node test/visual/category-badge-evidence.mjs capture-after
git checkout "$(git merge-base main HEAD)" -- _layouts/article.html _includes/components/post-card.html
# wait for rebuild
node test/visual/category-badge-evidence.mjs capture-before
git checkout HEAD -- _layouts/article.html _includes/components/post-card.html
node test/visual/category-badge-evidence.mjs compose
```

## Measured before → after (from `metrics.json`)

| Category | `/news/<cat>/` | Badge BEFORE | Badge AFTER |
|---|---|---|---|
| **Security** | 404 (absent) | `<a href="/news/security/">` — **404 link** | `<span>` — plain badge, no link |
| **Development** | 200 (present) | `<a href="/news/development/">` | `<a href="/news/development/">` — unchanged |

`01-category-badge-after.png` shows the live post-fix badges; the Security badge no longer links to the 404, while Development keeps its working link.

Regression test: [`../../category-badge-degradation.spec.js`](../../category-badge-degradation.spec.js) (smoke tier) pins both branches and asserts no badge links to the absent index.
