# Extension Points

The contracts a downstream site can build on, and the reasoning behind each. The
consumer-facing version of this page — with live, working examples — ships with
the theme at [`/docs/customization/extension-points/`](../../pages/_docs/customization/extension-points.md).
This file is the maintainer's copy: what the contract is, why it exists, and
what will break if it changes.

Introduced by [#412](https://github.com/bamr87/zer0-mistakes/issues/412), filed
after [it-journey#634](https://github.com/bamr87/it-journey/pull/634) built a
notes workbench on the theme and had to work around four gaps.

## Why these are contracts and not conveniences

The theme is consumed **unpinned**, through `remote_theme`. A consumer who
reverse-engineers theme internals is not taking a small risk — they are taking
one that fires on our schedule, silently, on a site we do not test. So anything
a consumer is likely to need has to be reachable without reading our source:

| Gap | What a consumer did instead | What it cost |
| --- | --- | --- |
| No code-block lifecycle event | `MutationObserver` on `#main-content`, a timeout fallback, and a guess at wrapper depth | The wrapper guess was wrong: **two buttons on every block**, 26 across 13, until a claim marker was added |
| Unscoped `button:not(.copy)` in a component partial | Scoped to `.code-block-header .itj-clip-btn` to out-specify it | A specificity fight against an element selector at (0,1,1), which no single class can win |
| No `lastmod` / `description` in the wiki index | Could not sort by recency or show the authored subtitle | A second Liquid pass over the same corpus, or the feature dropped |
| No per-page asset frontmatter | Literal `<link>` / `<script>` tags in content files | Asset plumbing in prose; nothing the theme promises to keep working |

## 1. `zer0:code-block-ready`

**Source:** [`assets/js/code-copy.js`](../../assets/js/code-copy.js)

A bubbling `CustomEvent`, dispatched from the wrapper once per code block,
**after** the block is fully decorated. `detail` is
`{ wrapper, header, pre, code, lang }`; `header` is `null` for a standalone
`<pre>` with no header row, and `lang` is `null` when the block declares no
language.

Two surfaces, both public:

- `window.zer0OnCodeBlock(fn)` — replays `window.__zer0CodeBlocks` (every block
  already processed) and then subscribes. Returns an unsubscribe function.
- `window.__zer0CodeBlocks` — the array itself, for a consumer that would rather
  poll than subscribe.

**The replay is the load-bearing half.** The sweep runs on `DOMContentLoaded`;
a deferred consumer script is *normally* later than that, so a plain
`addEventListener` would receive nothing at all and the contract would appear
broken to the first person who tried it.

**Invariants the tests pin** (`test/visual/features/extension-points.spec.js`):

- exactly one event per code block — the duplicate-button failure mode is the
  reason this exists, so it is asserted directly;
- a listener registered *after* `DOMContentLoaded` still receives every block;
- `detail.header` is non-null for Rouge-wrapped blocks;
- the event is dispatched only after the copy button is attached.

**If you change the DOM `code-copy.js` builds**, the event and its `detail` keys
still have to mean the same things. `wrapper` is "the element a consumer should
treat as the block", not "the element that happens to be two levels up".

## 2. `styles:` and `scripts:` frontmatter

**Source:** [`_includes/core/head.html`](../../_includes/core/head.html) and
[`_layouts/root.html`](../../_layouts/root.html)

A list (or a single string) of hrefs. Site-relative paths go through
`relative_url`; anything containing `//` is emitted untouched. `styles:` renders
in `<head>` after the theme's CSS; `scripts:` renders at the end of `<body>`
with `defer`, after the theme's own bundle — which is what lets a page script
call `zer0OnCodeBlock` without a readiness check.

**A page that sets neither key must emit nothing.** Both blocks close with
`-%}` on the comment and on the `endif` precisely so the output is
byte-identical to a build without them. That is asserted, and it is the reason
the Liquid is written as one dense line rather than pretty-printed.

## 3. Wiki index entry shape

**Source:** [`assets/data/wiki-index.json`](../../assets/data/wiki-index.json)

Per entry: `title`, `basename`, `url`, `collection`, `lastmod`, `description`,
`tags`, `categories`, `aliases`, `outgoing`, `excerpt`.

`lastmod` is ISO-8601 via `date_to_xmlschema`, resolved `last_modified_at` →
`lastmod` → `date`, matching the order the rest of the theme uses
(`_includes/core/head.html`, `_layouts/article.html`). `description` is the
authored frontmatter value, distinct from the body-derived `excerpt`.

**Both keys are always present**, `null` when the document has neither. A key
that is conditionally omitted is a worse contract than one that is sometimes
null: the consumer has to branch on `in` rather than on truthiness, and the
shape of the object changes per entry.

Neither field costs a new traversal — both are already on `doc` inside the loop
that builds the entry.

## 4. `_includes/custom/*`

The pre-existing stub pattern, listed here so the four extension points are in
one place: `custom/head.html`, `custom/footer.html`, `custom/body-end.html`,
`custom/comments.html`. A consumer shadows the one they need; no theme file is
forked.

## Adding a new extension point

1. Make it reachable without reading theme source — an event, a frontmatter key,
   or a documented include.
2. Pin the shape in `test/visual/features/extension-points.spec.js`, not just
   the happy path. The duplicate-event assertion exists because a duplicate is
   what actually shipped downstream.
3. Document it in both places: here, and the consumer page at
   `pages/_docs/customization/extension-points.md`.
4. Say what is *not* a contract. The consumer page's closing section does this
   deliberately — internal DOM shape is the thing people pin to by accident.
