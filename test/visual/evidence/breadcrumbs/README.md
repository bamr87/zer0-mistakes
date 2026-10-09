# Evidence — breadcrumb `BreadcrumbList` validity (#512)

**Bug.** Since #204, a breadcrumb crumb with no index page to link to ("Posts"
on a site without `/posts/`, or "Settings" under `/about/settings/…`) was
still emitted as a schema.org `ListItem`, but without an `item`. Google
requires `item` on every non-final `ListItem`, so the whole `BreadcrumbList`
was invalid and the rich result was dropped.

**Fix.** Such crumbs render as plain `<li class="breadcrumb-item">` text,
outside the structured list, and `position` is renumbered `1..n`. Before and
after, the served `<ol>` for a post looks like this:

```text
BEFORE  Home(1, item=/)  ·  Posts(2, NO item)  ·  Title(3)        ← invalid
AFTER   Home(1, item=/)  ·  Posts (plain text) ·  Title(2)        ← valid
```

**What the images show.** Rendered by `test/visual/breadcrumbs-evidence.mjs`
(the generic `pr-evidence.mjs`, aimed at the two affected routes), with the
base branch as BEFORE and this PR as AFTER:

- `01`/`02`: `/about/settings/theme/` (generic branch, unlinked middle crumb)
- `03`/`04`: a `/posts/…` article (known-section branch, no `/posts/` index)

The two sides are **identical** at every width, and page overflow is 0 → 0 in
`metrics.json`. That is the intended result: the visible trail does not change.
Only the structured data does, and
`test/visual/features/breadcrumbs.spec.js` asserts that part.
