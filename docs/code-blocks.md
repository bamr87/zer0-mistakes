# Code blocks

Syntax highlighting, language headers, line numbers, and copy-to-clipboard for zer0-mistakes.

**Related docs:** [Design system](design-system.md) · [JavaScript API](js-api.md)

---

## Overview

| Layer | File | Role |
|-------|------|------|
| Highlighter | Rouge (Kramdown default on GitHub Pages) | Generates `.highlight` markup |
| Syntax colors | `_sass/core/_syntax.scss` | base16 Material-inspired palette |
| Block chrome | `_sass/core/code-copy.scss` | Cards, headers, gutters, copy button |
| Enhancement JS | `assets/js/code-copy.js` | Line numbers, language label, copy button |
| UI helper | `assets/js/ui-helpers.js` | `data-copy` declarative copy + toasts |

Scripts load from `_includes/core/head.html`:

```html
<script defer src="/assets/js/code-copy.js"></script>
```

---

## Authoring fenced code blocks

Standard Markdown with language tag:

````markdown
```yaml
theme_skin: dark
theme_color:
  main: "#0d6efd"
```
````

```javascript
document.addEventListener('navigation:ready', (e) => {
  console.log(e.detail.modules);
});
```

Rouge wraps output in:

```html
<div class="highlighter-rouge language-yaml">
  <div class="highlight">
    <pre class="highlight"><code>…</code></pre>
  </div>
</div>
```

After `code-copy.js` runs, blocks gain a header, line-number gutter, and copy button.

---

## Visual structure

```
┌─ .highlighter-rouge.language-ruby ─────────────────────┐
│ ┌─ .code-block-header ────────────────────────────────┐ │
│ │ ruby                              [ Copy ]          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─ .code-block-body ──────────────────────────────────┐ │
│ │  1 │ def hello                                      │ │
│ │  2 │   puts "world"                                  │ │
│ │  3 │ end                                             │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

Design tokens used (`_sass/core/code-copy.scss`):

```scss
:root {
  --zer0-code-copy-width: 4.75rem;
  --zer0-code-header-height: 2rem;
  --zer0-code-accent-width: 3px;
  --zer0-code-gutter-width: 2.75rem;
}
```

- Left accent border: `var(--zer0-color-primary)`
- Background: `var(--zer0-color-code-bg)`
- Gutter: non-selectable, excluded from copy

---

## Copy button behavior

`assets/js/code-copy.js` on `DOMContentLoaded`:

1. Finds `pre.highlight` and `pre code` blocks
2. Injects line-number gutter (`.code-line-numbers`)
3. Adds language header for Rouge blocks (from `language-*` class)
4. Appends copy button to header (Rouge) or overlays on standalone `pre`

Copy logic strips comment-only lines starting with `#`:

```js
// Lines starting with # are omitted from clipboard text
getCopyableCode(codeElement);
```

Success state: button shows "Copied!" with green background for 2 seconds.

### Declarative copy (non-code elements)

From `ui-helpers.js`:

```html
<button type="button" data-copy="https://example.com/path">Copy link</button>
```

Or programmatically:

```js
window.zer0UI.copyToClipboard('text to copy');
window.zer0UI.showToast('Copied', { variant: 'success', duration: 3000 });
```

---

## Language labels

Rouge emits `language-<lang>` on `.highlighter-rouge`. `code-copy.js` maps aliases:

| Rouge class | Header label |
|-------------|--------------|
| `language-shell` | `bash` |
| `language-plaintext` | `text` |
| `language-console` | `console` |

Override mapping in `code-copy.js` → `LANG_LABELS`.

---

## Standalone `pre` blocks

Blocks without a Rouge wrapper (e.g. in theme preview) get `.code-block-body--standalone` styling with overlay copy button.

---

## Syntax theme (Rouge / base16)

`_sass/core/_syntax.scss` defines a base16 Material-style palette:

```scss
$base08: #f07178;  // Error
$base0d: #82aaff;  // Keyword / function
$base0b: #c3e88d;  // String
// …
.highlight .k { color: $base0e; }  // Keyword
.highlight .s { color: $base0b; }  // String
```

### Override syntax colors

Fork in your site:

```scss
// _sass/core/_syntax.scss
$base0d: #7aa2f7;
@import "syntax";  // not needed if replacing whole file
```

Or use `user-overrides.css`:

```css
.highlight .k { color: #bb86fc; }
.highlight .s { color: #a5d6a7; }
```

---

## Jekyll / Kramdown config

From `_config.yml`:

```yaml
markdown: kramdown
kramdown:
  input: GFM
  toc_levels: 1..6
```

Rouge is the default highlighter on GitHub Pages. For local builds, ensure `rouge` gem is available via `github-pages`.

### Line numbers in Markdown

Kramdown does not emit line numbers server-side. The theme adds them client-side via `code-copy.js` for consistent styling and copy behavior.

---

## Obsidian callouts → code

Obsidian callouts (`> [!note]`) map to Bootstrap alerts; fenced code inside callouts receives the same copy/line-number treatment.

---

## Notebook code cells

Jupyter notebook layout (`layout: notebook`) preserves Rouge highlighting on converted code cells. See [JUPYTER_NOTEBOOKS.md](JUPYTER_NOTEBOOKS.md).

---

## Customization examples

### Hide line numbers

Override in `user-overrides.css`:

```css
.code-line-numbers { display: none; }
.highlighter-rouge pre.highlight > code { padding-left: var(--zer0-space-3); }
```

### Wider code blocks on mobile

```css
@media (max-width: 768px) {
  .highlighter-rouge pre.highlight {
    font-size: 0.75rem;
  }
}
```

### Custom copy button label

Patch `code-copy.js` in your fork, or listen for clicks:

```js
document.querySelectorAll('.copy').forEach(btn => {
  btn.addEventListener('click', () => {
    window.zer0UI?.showToast('Snippet copied', { variant: 'success' });
  });
});
```

---

## Live preview

Code block samples render on the theme style guide:

**[/about/settings/theme-preview/#preview-code](/about/settings/theme-preview/)**

Switch skins with the controls bar to verify contrast in all palettes.

---

## Further reading

- [design-system.md](design-system.md) — `--zer0-color-code-bg`, import order
- [js-api.md](js-api.md) — `window.zer0UI`
- [pages/_docs/features/code-copy.md](../pages/_docs/features/code-copy.md) — user-facing feature doc
