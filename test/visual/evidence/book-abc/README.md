# book-abc layout — visual evidence (ZER0-081)

After-only evidence for the `book-abc` board-book layout (a new feature — there
is no "before" state). Regenerate with:

```bash
# against a running site that serves a book-abc page:
BASE_URL=http://localhost:4000 node test/visual/book-abc-evidence.mjs           # theme demo /books/abc-demo/
BASE_URL=<url> ROUTE=/books/it-alphabet/ node test/visual/book-abc-evidence.mjs  # any book-abc page
```

## What's here

- `board-{320,390,768,992,1280}.jpg` — the layout across a viewport matrix.
- `metrics.json` — structural readout + horizontal overflow per width.

## Reference capture

These montages were captured against the **drsai `it-alphabet` book** (the seed
"The IT Alphabet: A is for Automation", 26 planned letters, `isometric-tech-toy`
skin) built with the local theme — the same `book-abc` layout the theme's own
demo book (`pages/_books/abc-demo/`) uses. Structural metrics from that capture:

| metric | value |
|---|---|
| letter cards | 26 |
| placeholders (planned plates) | 26 |
| rendered `<img>` plates | 0 |
| A–Z jump links | 26 |
| board skin | `abc-style--isometric-tech-toy` |
| horizontal overflow (every width) | 0px |

Every letter is `status: planned`, so each card shows the tinted "illustration
coming soon" placeholder with its big HTML letter glyph — the book reads
end-to-end before any art renders. The regression test
`test/visual/features/book-abc.spec.js` pins these same structural facts.
