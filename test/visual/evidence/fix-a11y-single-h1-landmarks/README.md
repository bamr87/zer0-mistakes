# fix-a11y-single-h1-landmarks — visual evidence

**[#593](https://github.com/bamr87/zer0-mistakes/issues/593) — two `<h1>`s on the docs index and on nearly every doc page, and a second `banner`/`contentinfo` whenever the feedback dialog was open.**

`_layouts/default.html` renders `page.title` as the intro hero's `<h1>`, and most Markdown pages open with their own `# Title`, which kramdown emits as a second `<h1>`. In the dev build 225 of the 244 pages that render the intro had two. `default.html` now rewrites the body's first `<h1>` once: a leading one whose text is the title is dropped, its `id` kept on an empty `<span>` so `#installation` links and the TOC entry still land (143 pages); any other is demoted to `<h2>` with its attributes and text intact (82 pages). After the change all 244 have exactly one. `/` uses the landing layout, which already hid its body `<h1>` in CSS.

The dialog half is markup only: `<header class="pf-header">` and `<footer class="pf-footer">` are now `<div>`s with the same classes, so nothing renders differently. It is proven by `test/visual/core/landmarks.spec.js`, which opens the dialog and runs axe `landmark-unique`, `landmark-no-duplicate-banner` and `landmark-no-duplicate-contentinfo`. The same scan showed that the `landmark-unique` count the issue measured on a closed page came from code blocks (`code-copy.js` named every block of one language "bash code block"); those names are now numbered when a language repeats, which is also not visible.

## What each image shows

- **`01-before-after-docs.png`** / **`02-viewport-matrix-docs.png`**: `/docs/`, whose body opens with `# Zer0-Mistakes Documentation` under the title "Documentation". The text differs from the title, so it stays, as an `<h2>`: the same words, one level down and at `<h2>` size.
- **`03-before-after-docs-installation.png`** / **`04-viewport-matrix-docs-installation.png`**: `/docs/installation/`, whose body repeated "Installation" right under the hero. After the change the hero is the only title, and the TOC's "Installation" entry still points at `#installation`.
- **`metrics.json`**: page overflow per route and width, before and after (0px throughout).

## Regenerate

BEFORE is the base branch and AFTER is this branch, each built with `_config.yml,_config_dev.yml,_config_snapshots.yml` and served by `jekyll serve --skip-initial-build --no-watch`:

```bash
SLUG=fix-a11y-single-h1-landmarks BEFORE_URL=http://127.0.0.1:4593 BASE_URL=http://127.0.0.1:4594 \
  ROUTES=/docs/,/docs/installation/ node test/visual/pr-evidence.mjs
```
