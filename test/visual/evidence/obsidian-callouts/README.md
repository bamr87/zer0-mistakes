# Evidence — foldable Obsidian callouts are accessible disclosures (PR #200)

Obsidian callouts with a fold marker — `> [!type]+` (expanded) or `> [!type]-` (collapsed) — render as an **accessible disclosure**: the title becomes a keyboard-operable `<button aria-expanded>` with a chevron, and the body shows/hides on activation (click or Enter/Space). Before this change, a `-` callout's body was permanently `hidden` with no way to reveal it.

The callout is upgraded from a plain `<blockquote>` by the client-side resolver (`assets/js/obsidian-wiki-links.js`), so this evidence is captured in a real browser against the **Live example** block added to the syntax-reference doc.

## How this evidence was produced

[`../../obsidian-callouts-evidence.mjs`](../../obsidian-callouts-evidence.mjs) loads `/docs/obsidian/syntax-reference/`, reads the collapsed `[!note]-` callout's state, activates its title button, and re-reads it.

```bash
docker compose up                                                  # serves :4000
BASE_URL=http://localhost:4000 node test/visual/obsidian-callouts-evidence.mjs
```

## What each file shows

- **`01-disclosure-before-after.png`** — the collapsed `[!note]-` callout before
vs after activating its title: the chevron rotates, the body is revealed, and `aria-expanded` flips `false → true`.
- **`02-expanded-default.png`** — a `[!tip]+` callout renders open by default
  (`aria-expanded="true"`, body visible).
- **`metrics.json`** — the measured `aria-expanded` / `body hidden` /
  `data-collapsed` values for each state.

## Measured transitions (from `metrics.json`)

| Callout | `aria-expanded` | body `hidden` | `data-collapsed` |
|---|---|---|---|
| `[!note]-` collapsed (initial) | `false` | `true` | `true` |
| `[!note]-` after activation | `true` | `false` | removed |
| `[!tip]+` (default) | `true` | `false` | — |

The title is a real `<button>` in every foldable callout (keyboard operable).

Regression test: [`../../obsidian-callouts.spec.js`](../../obsidian-callouts.spec.js) (smoke tier) pins these transitions; the resolver DOM shape is unit-tested in [`../../test_resolver.js`](../../test_resolver.js) and the Ruby-plugin parity in [`../../test_ruby_converter.rb`](../../test_ruby_converter.rb).
