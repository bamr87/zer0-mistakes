# Section topic filter — whole-tag matching

Evidence for the fix in `_layouts/section.html`: filtering a section by a topic revealed posts that did not carry that topic.

## The bug

`data-tags` was built as `{{ tags | join: ' ' | slugify }}`. Slugifying **after**
joining turns the separating spaces into hyphens, so a tag boundary becomes indistinguishable from a hyphen *inside* a slug:

```
ai-knowledge-management-documentation-search      ← 4 tags, or 1, or 7?
edge-ai-machine-learning-embedded-systems-privacy
```

The click handler then matched with `String.includes`, so filtering by `ai` also matched a post tagged `edge-ai`.

This mattered because the sidebar's own badge is computed in Liquid with `post.tags contains subcat` — exact list membership. The two mechanisms disagreed with nothing to surface it: the badge promised 5 posts and the page revealed 6.

After the fix each tag is slugified separately into a space-separated list and matched as a whole token:

```
ai knowledge-management documentation search
edge-ai machine-learning embedded-systems privacy
```

## What each image shows

| File | Shows |
|---|---|
| `01-filter-before-after.png` | The `ai` topic clicked on `/news/technology/`, pre-fix vs fixed. In BEFORE the second card is *Edge AI in the Real World* — tagged `edge-ai machine-learning`, with no `ai` tag — sitting in a list filtered to `ai`. In AFTER it is gone and every visible card carries the tag. |
| `02-badge-vs-shown.png` | Every topic on the page clicked in turn, with the count its badge promises against the number of cards actually shown. **2 topics disagree before, 0 after.** |
| `03-viewport-matrix.png` | The filtered grid at 390 / 768 / 1280px. Layout is unaffected by the fix — 0px page overflow across the full 320→1440px sweep. |

## Numbers

`metrics.json` carries the full readout. The headline:

| | before | after |
|---|---|---|
| `ai` — badge says 5, cards shown | **6** | **5** |
| `operations` — badge says 1, cards shown | **2** | **1** |
| topics whose badge disagrees with what is shown (of 15) | **2** | **0** |
| max page overflow, 320→1440px | 0px | 0px |

`operations` is a second, independent instance — a post tagged `content-operations` matched the substring — which is what shows this was systematic rather than one quirk of `edge-ai`.

## Regenerating

The fix is in Liquid and an inline handler rather than CSS, so the kit's `unfixCss` cannot revert it. The generator drives **two servers** instead, which makes the before/after genuine rather than simulated:

```bash
# before: build the pre-fix revision;  after: build this branch
BASE_URL=http://127.0.0.1:4011 BEFORE_URL=http://127.0.0.1:4012 \
  node test/visual/section-filter-evidence.mjs
```

## Regression test

`test/visual/features/section-topic-controls.spec.js` (smoke tier) asserts whole-tag membership for every visible card and pins the filtered count to the topic's badge, so the Liquid-side count and the JS-side filtering cannot drift apart silently again. Negative-tested: restoring `card.dataset.tags.includes(filter)` fails that assertion.
