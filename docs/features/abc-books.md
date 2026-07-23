# ABC board books (`book-abc` layout)

The `books` collection publishes two kinds of picture book: **story books**
(`layout: book` + chapters) and **ABC / alphabet board books**
(`layout: book-abc`). This page documents the ABC layout — a single-scroll
toddler board book where every page is one big letter, one word, and one
picture.

ABC books are the "ABC & Language" series of the [drsai](https://github.com/bamr87/drsai)
library. Their words and per-letter illustration prompts are drafted by the
[zer0-CMS](https://github.com/bamr87/zer0-CMS) ABC wizard; this theme renders
them.

## Front matter

`book-abc` is driven entirely by an `alphabet:` list — no per-letter pages.

```yaml
---
layout: book-abc
title: "The IT Alphabet"
subtitle: "A is for Automation"
book: it-alphabet          # slug (shared with assets)
series: abc-language       # key into _data/series.yml (optional)
audience: "Ages 1–4 (toddler board book)"
art_style: isometric-tech-toy   # adds the .abc-style--isometric-tech-toy skin
art_style_prompt: "…"      # shown in the colophon
palette: cool-tech
cover_image: "/assets/images/books/it-alphabet/cover.png"
alphabet:
  - letter: "A"
    word: "Automation"
    tagline: "A is for Automation — little helpers that do the work!"
    image: "/assets/images/books/it-alphabet/a-automation.png"
    alt: "A cheerful robot arm stacking blocks."
    prompt: "…"            # text-free raster prompt (colophon / re-render)
    status: planned        # or "rendered" once the plate exists
  # … B through Z …
---
Optional intro markdown (shown in the cover hero).
```

## What it renders

- **Cover hero** — cover image, title, subtitle, a series badge (from
  `_data/series.yml`), letter count, audience, and a "Start at A" button.
- **A–Z quick-jump** strip — each card is anchored `#letter-a` … `#letter-z`.
- **The alphabet board** — a responsive grid of `abc-letter` cards. The big
  letter is HTML typography (a badge), never baked into the art, so raster
  models never garble it. A card whose `status` is `planned` (no plate yet)
  shows a tinted **"illustration coming soon"** placeholder instead of a broken
  image, so the book reads end-to-end before any art runs.
- **Colophon** — the art-style prompt and generator provenance.

## Art-style skins

Each `art_style` id adds a `.abc-style--<id>` class to the board that tints the
placeholder tiles and letter badges. The ids are a cross-repo contract with
zer0-CMS and the zer0-image-generator plugin
(`data/abc_art_styles.yml`): `isometric-tech-toy`, `chalkboard-doodle`,
`soft-plush`, `crayon-primary`, `paper-cutout`, `watercolor-storybook`. Add a
new skin in `_sass/components/_book.scss` when the shared catalog gains a style.

## Series & the bookshelf

`components/bookshelf.html` lists both `book` and `book-abc` books, grouped into
shelves by each book's `series:`. Display metadata (title, tagline, icon, order)
comes from the site's `_data/series.yml`; a book with no `series` falls under the
default `stories` shelf. Series render in the order they appear in
`_data/series.yml`, then any undeclared series.

## Files

| File | Role |
|---|---|
| `_layouts/book-abc.html` | The board-book layout |
| `_includes/components/abc-letter.html` | One letter card (image or placeholder) |
| `_includes/components/bookshelf.html` | Series-grouped library grid |
| `_sass/components/_book.scss` | `.abc-board`, `.abc-letter-*`, `.abc-style--*` |
