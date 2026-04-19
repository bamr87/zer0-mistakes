---
title: "Obsidian Syntax Reference"
description: "Every Obsidian-flavoured Markdown feature supported by the Zer0-Mistakes theme and how it renders on GitHub Pages."
layout: default
permalink: /docs/obsidian/syntax-reference/
categories: [Documentation, Obsidian]
tags: [obsidian, syntax, reference]
backlinks: true
---

# Obsidian Syntax Reference

Everything in this reference is handled by **either**
`assets/js/obsidian-wiki-links.js` (client-side, default GH Pages build)
**or** `_plugins/obsidian_links.rb` (server-side, opt-in for forks that
build with vanilla Jekyll). Both produce equivalent HTML.

## Wiki-links

| Syntax | Renders as |
| --- | --- |
| `[[Page Title]]` | `<a class="wiki-link" href="/permalink/">Page Title</a>` |
| `[[Page Title\|Custom text]]` | Link with `Custom text` as the visible label. |
| `[[Page Title#Section]]` | Link with `#section` URL fragment (kramdown-style anchor). |
| `[[Page Title^block-id]]` | Block references degrade to a plain link to `Page Title`. |
| `[[Missing Page]]` | `<a class="wiki-link wiki-link-broken">` styled as a broken link with a tooltip. |

Resolution is **case-insensitive** and tolerant of extra whitespace. Lookup
keys include each document's `title`, file `basename`, and any entries in
the `aliases:` frontmatter array. The first match wins; collisions are
deterministic across builds because Liquid iterates collections in a
stable order.

## Embeds

| Syntax | Renders as |
| --- | --- |
| `![[diagram.png]]` | `<img src="/assets/images/notes/diagram.png">` |
| `![[diagram.png\|320]]` | Same, with `width="320"` |
| `![[Note Title]]` | Card containing a 800-char excerpt + link back to the note |
| `![[/absolute/path/img.svg]]` | Honors absolute paths verbatim |

The default attachment folder is `assets/images/notes/`, matching the
`attachmentFolderPath` set in `.obsidian/app.json` so Obsidian's
"paste image" workflow drops files in the right place automatically.

## Callouts

```markdown
> [!note] Optional title
> Body of the callout — supports **markdown**, lists, code, etc.
```

Maps to `<div class="alert alert-… obsidian-callout obsidian-callout-…">`.
Type → Bootstrap alert variant:

| Obsidian type | Bootstrap variant | Icon |
| --- | --- | --- |
| `note`, `info`, `todo`, `question`, `help`, `faq` | `primary` / `info` | document / info |
| `tip`, `hint`, `success`, `check`, `done` | `success` | lightbulb / check |
| `warning`, `caution`, `attention`, `important` | `warning` | exclamation triangle |
| `failure`, `danger`, `error`, `bug` | `danger` | shield / bug |
| `abstract`, `summary`, `tldr`, `example`, `quote`, `cite` | `secondary` | varies |

Fold marker support:

- `> [!warning]+` — keeps the body open by default (no-op visually here).
- `> [!warning]-` — adds `data-collapsed="true"` so the body can be hidden
  (CSS toggle defined in `_sass/core/_obsidian.scss`).

Unknown types fall back to the `note` variant, never silently dropped.

## Tags

Inline tags like `#obsidian` or `#fixture/example` are linked to the
existing tags index page. Hierarchical tags use forward slashes and
preserve their path. Code spans (`` `#not-a-tag` ``) and fenced code
blocks are skipped — the resolver explicitly excludes those nodes from
the rewrite walk.

Frontmatter `tags:` arrays are unchanged; they continue to drive Jekyll's
existing tag aggregation.

## Frontmatter ↔ Properties

Obsidian's **Properties** view shows the same YAML frontmatter Jekyll
already parses. Special mappings:

| Obsidian key | Jekyll key | Behavior |
| --- | --- | --- |
| `aliases` | `redirect_from` (via `jekyll-redirect-from`) | Old URLs redirect to the new permalink. |
| `tags` (inline `#tag` or YAML array) | `tags:` collection | Drives `/tags/` index. |
| `cssclass` | _ignored on site_ | Obsidian-only styling hint. |
| `publish` | _ignored_ | Use Jekyll's `published: false` to suppress. |

## Backlinks panel

Every page rendered with `layout: note` automatically gets an
**Linked mentions** panel listing every page whose body links to it
(either by markdown URL match or `[[…]]` wiki-link reference). Other
layouts can opt in with `backlinks: true` in their frontmatter.

The panel is a server-side Liquid include
(`_includes/content/backlinks.html`) — no JavaScript required, fully
indexable by search engines.

## What is *not* (yet) supported

| Feature | Status | Workaround |
| --- | --- | --- |
| `.canvas` files | Excluded from the build | Export as PNG and embed |
| Excalidraw `.excalidraw.md` | Excluded from the build | Embed exported PNG/SVG |
| Dataview queries | Obsidian-only | Use Liquid loops on the site |
| Live block references (`^block-id`) | Degrades to plain link | Use heading anchors instead |
| Interactive global graph view | Not yet implemented | Use Obsidian's graph view locally |

These are all candidates for a v2 follow-up. None of them break a build
when present in source — they are simply hidden from the published site
or rendered without the interactive layer.
