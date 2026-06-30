# Evidence — feature registry provenance on /features/ (PR B)

Every entry in `_data/features.yml` gained a `provenance:` block
(`introduced_in` / `pr` / `commit` / `issue`) tracing the feature back to the
change that shipped it. The data is surfaced on `/features/`. This is a **new
capability** (no prior state), so the evidence is **after-only**.

## What changed

| File | Change |
|---|---|
| `_data/features.yml` / `features/features.yml` | `provenance:` block added to all 60 entries (resolved from git history + CHANGELOG). |
| `_includes/components/feature-card.html` | Renders a `PR #N · <commit>` line (links built from `site.github_user` + `site.repository_name`). |
| `pages/features.md` | New **Provenance** column in the All Features Reference table; inline cards show the same PR/commit line. |
| `scripts/validate-features.rb` | Provenance is now a hard requirement (shape-validated). |

## After (this PR)

| Shot | Shows |
|---|---|
| `01-reference-table-provenance.png` | The All Features Reference table — every one of the 60 rows now has a Provenance cell with PR/commit links. |
| `02-feature-card-provenance.png` | A feature card with the provenance line (`a8426a5` commit link) beneath the id/version/tag badges. |

`metrics.json` records the live link counts captured during the run
(**35 PR links, 112 commit links** across the page).

## Regression test

[`test/visual/features-provenance.spec.js`](../../features-provenance.spec.js) —
asserts the Provenance column header renders, that a known feature (ZER0-060 →
PR #33) exposes the correct GitHub href, that commit links point at
`/commit/<7–40 hex>`, and that cards render a provenance line. Run:

```bash
BASE_URL=http://localhost:4000 npx playwright test --config=test/playwright.config.js \
  --project=smoke features-provenance
```

Regenerate these shots with:

```bash
BASE_URL=http://localhost:4000 node test/visual/features-provenance-evidence.mjs
```
