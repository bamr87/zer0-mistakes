# Article TOC scoped to the post body (#552)

**Bug.** `_includes/navigation/sidebar-right.html` is included from `default.html`, where `content` is the whole rendered child layout. On every `article` page the "On this page" TOC therefore parsed the post's `<h1 id="page-title">` (so every section nested under "Title ›") and the author-bio aside's `<h2 id="about-the-author">` (listed last, as if it were a section of the post).

**Fix.** `article.html` wraps its body in `<!-- zer0:toc-start -->` / `<!-- zer0:toc-end -->`. When the markers are present, `sidebar-right.html` parses only that slice, starting at `h2`. As a fallback, the author-bio heading carries `no_toc` and keeps its `id` for `aria-labelledby`. Layouts without the markers, docs included, are unchanged.

**What the images show.**
- `01-before-after-posts-…png`: the demo post at 1280px and 1440px. BEFORE, the TOC starts with the post title and ends with "About the Author". AFTER, it runs from "Start With Observable Signals" to "What Good Looks Like", the five body `h2`s.
- `03-before-after-docs-features-code-copy.png`: a docs page as the control. Its TOC is identical before and after.
- The `viewport-matrix` images show the AFTER header band at every width. `metrics.json` records 0px page overflow before and after at all six widths.

**TOC `href` lists**, read from `#TableOfContents a` on both builds:

| route | base branch | this PR |
| --- | --- | --- |
| `/posts/2026/04/28/customer-onboarding-scorecards/` | `#page-title`, 5 body h2s, `#about-the-author` (7) | the 5 body h2s |
| `/docs/` | 13 links | identical |
| `/docs/features/code-copy/` | 28 links | identical |
| `/quickstart/github-setup/` | 10 links | identical |

Generated with `test/visual/pr-evidence.mjs`, with this branch served on :4000 and `origin/main` on :4001. The nine skin baselines (`appearance-snapshot.spec.js`) passed with 0 pixel failures.
