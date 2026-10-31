# section-heading-outline — visual evidence (issue #555)

**The bug.** `_layouts/section.html` and `_includes/navigation/section-sidebar.html` picked heading tags by their default font size. On every news section landing, a sidebar `<h5>`/`<h6>` came before the page `<h1>`, and card titles jumped `h1 → h5`. Screen-reader users navigating by heading hit missing levels (WCAG 1.3.1). **The fix** retags each heading by its depth and keeps the old size with a `.h4`/`.h5`/`.h6` class (the #436 pattern). Source order is unchanged.

**What `01-section-styles-before-after.png` shows.** One pair per `section_style`: `/news/business/` (list), `/news/development/` (grid), `/news/tutorial/` (magazine), each at 1280px. The BEFORE image is reproduced on the same page load by reverting exactly the diff in the live DOM. Each label gives the heading-level skips inside `#main-content`: 2, 2 and 7 before, 0 after.

**Why the fix is visually inert.** `metrics.json` compares the computed font size, weight, line height, margins, colour and page-coordinate box of every heading in the layout, before vs after. 0 of 47 differ. A byte-for-byte screenshot comparison isn't usable on these pages: a control shot of the *same* state already differs (`controlIdentical: false`), so the style/box comparison is the proof. The 9-skin homepage pixel baselines pass unchanged (9/9).

## Files

- `01-section-styles-before-after.png`: before/after montage, one pair per section style
- `metrics.json`: per route: heading sequence and skips before/after, number of reverted headings, style/box diffs, pixel and control equality
- `CHANGELOG-snippet.txt`: the one-line summary for release notes

## Regenerate

```bash
docker compose up -d                                   # serves :4000
node test/visual/section-heading-outline-evidence.mjs  # BASE_URL defaults to http://localhost:4000
```
