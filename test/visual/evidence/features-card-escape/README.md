# Evidence — feature card HTML-escape fix (ZER0-061 card swallowing)

## The defect

The ZER0-061 "Author Profiles System" description contained a raw `<key>`
(`/authors/<key>/`). `/features/` renders `{{ feature.description }}`
**unescaped**, so the browser parsed `<key>` as a stray element — its implicit
open tag swallowed every card that followed, nesting the rest of the registry
inside the Author Profiles card.

## Before → after

| Shot | Shows |
|---|---|
| `before-author-profiles-card.png` | Description reads `/authors//` (the `<key>` tag was consumed), leaked `</p>` / `</div>` text is visible, and the **News Homepage Layout card is nested inside** the Author Profiles card. |
| `after-author-profiles-card.png` | Description reads `/authors/:key/`; News Homepage, Section, and Article cards render as proper **sibling** cards in the grid. |

Live stray-element count on `/features/`: **1 → 0** (`document.querySelectorAll('key')`).

## The fix (three layers)

1. **Data** — ZER0-061 description uses `/authors/:key/` (Jekyll permalink form) instead of `/authors/<key>/`.
2. **Renderer hardening** — every `{{ description }}` output on `/features/` and in `_includes/components/feature-card.html` now runs through `| escape`, so no future description can break the page.
3. **Gate** — `scripts/validate-features.rb` now hard-fails if any `title`/`description` contains a raw `<`/`>`, catching this class of bug before merge.

## Regression test

[`test/visual/features-provenance.spec.js`](../../features-provenance.spec.js) —
"no feature card renders a stray HTML tag from its text" asserts there are zero
stray `<key>`-type elements under `main` and that all 76 registry rows are
present (nothing swallowed). Regenerate the shots:

```bash
BASE_URL=http://localhost:4000 node test/visual/features-card-escape-evidence.mjs after
```
