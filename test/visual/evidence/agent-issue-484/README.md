# agent-issue-484 — visual evidence

**Issue #484 — the `article`, `notebook` and `note` layouts emitted
`<article id="main" role="main">` inside root.html's `<main id="main-content">`,
so every post/notebook/note page carried two `main` landmarks (WCAG 2.1
SC 1.3.1) and lost the `article` landmark the role overrode.**

This change removes two attributes and nothing else, so **the point of this
evidence is that nothing moved.** No selector in `_sass/` or `assets/js/`
matches `#main` or `[role="main"]`, and the montages confirm it empirically
rather than by assertion: the base branch and this PR render the same two
routes, at the same six widths, in the same browser, identically — and the nine
committed pixel baselines passed unverified-unchanged (`0 pixel failure(s)`,
so nothing was re-blessed).

The defect it fixes is invisible to a sighted user by construction. It is
proved instead by `test/visual/core/landmarks.spec.js`, which fails on the base
branch (7 of its 11 cases, including axe's `landmark-no-duplicate-main`) and
passes here.

Generated in the same jammy Playwright image the snapshot gate uses, by
`test/visual/pr-evidence.mjs` (the generic base-vs-head generator — this change
needs no bespoke `unfixCss`, because there is no visual state to undo),
rendered from `049ded1` against `origin/main`.

## Files

- `01-before-after-posts-2025-01-22-git-workflow-best-practices.png` —
  BEFORE/AFTER pairs of an `article`-layout post at 390px and 1280px.
- `02-viewport-matrix-posts-2025-01-22-git-workflow-best-practices.png` —
  the same post's header band at all six widths (after).
- `03-before-after-notes-git-cheatsheet.png` — BEFORE/AFTER pairs of a
  `note`-layout page at 390px and 1280px.
- `04-viewport-matrix-notes-git-cheatsheet.png` — that note's header band at
  all six widths (after).
- `metrics.json` — page overflow per route × width: **0px before and 0px after
  on every one of the 12 measurements**, HTTP 200/200 throughout.
- `CHANGELOG-snippet.txt` — the evidence link for the changelog entry.

The **`notebook`** layout is fixed by the same commit but is not rendered here:
its collection is `output: false` in `_config_dev.yml`, so no notebook page
exists on the dev server this tooling serves. It is covered instead by the
source-level case in `landmarks.spec.js`, and was verified by hand with a
one-off build that enables the collection —
`<main id="main-content" tabindex="-1">` once, zero `role="main"`, and
`<article class="notebook-article h-entry" itemscope itemtype="…/TechArticle">`.

## Regenerate

```bash
docker compose up -d                              # serves :4000
python3 scripts/ci/visual_evidence_autogen.py all --base origin/main

# then re-point the generic generator at the routes this change touches
# (it defaults to "/", which this change does not affect):
SLUG=agent-issue-484 \
BASE_URL=http://localhost:4000 BEFORE_URL=http://localhost:4001 \
ROUTES=/posts/2025/01/22/git-workflow-best-practices/,/notes/git-cheatsheet/ \
  node test/visual/pr-evidence.mjs
```
