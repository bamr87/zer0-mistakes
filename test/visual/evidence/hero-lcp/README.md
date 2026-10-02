# Evidence — article hero: eager LCP load + reserved box (#485)

**Bug.** The article/post hero (`figure.featured-hero` in `_layouts/article.html`) is the above-the-fold Largest Contentful Paint element. It still inherited `components/preview-image.html`'s `loading="lazy"` default. Lighthouse flags that as "Largest Contentful Paint image was lazily loaded". The hero also had no reserved box. Until the image arrived the figure was 0px tall, and then the whole article jumped down by the image's height.

**Fix.**
- The hero call site now passes `loading="eager" fetchpriority="high" decoding="async"`.
- The include learned optional `fetchpriority` and `decoding` parameters. They are emitted only when a caller passes them.
- The box is pinned in CSS with `.featured-hero img { aspect-ratio: 3 / 2 }`, not with `width`/`height` attributes. Preview assets vary in shape: generated ones are 1024×683, some hand-added ones are portrait, and some are external URLs. A declared intrinsic size that disagreed with the file would itself cause a shift.

**How it was measured** (`test/visual/hero-lcp-evidence.mjs`):
- Both states are real Jekyll builds, served statically. BEFORE uses the three source files from `main`; AFTER uses this PR.
- The generator holds every preview-image response, measures the hero box and the top of the content below it, releases the image, and measures again.
- The route is the `show_hero: true` coffee post, measured at 390px and 1280px.

| image | shows |
| --- | --- |
| `01-landscape-before-after.png` | The post's own 3:2 preview. BEFORE: `lazy`, the box is 0px while the image is in flight, and the content moves 204px (390) or 476px (1280) when it lands. AFTER: `eager` + `fetchpriority="high"`, the box is reserved at 228px/500px, and the content moves 0px. |
| `02-portrait-before-after.png` | The real 720×960 `site-personalization-configuration.png` served under the hero URL. BEFORE: 0px, then 456px tall at 390px (a 432px jump). AFTER: the same reserved 3:2 box, and `object-fit: cover` crops the portrait rather than stretching it. 0px shift. |
| `metrics.json` | Every run: the `loading`/`fetchpriority` attributes, box height while pending and after load, content shift in px, and the natural size of the image that loaded. |

A whole-build diff of the two builds was also run. After normalising build timestamps and `?v=` cache-busters, exactly the 21 hero-bearing pages differ, each only in the hero `<img>` line. The other 384 pages are byte-identical, including every other `preview-image.html` consumer (book covers, recipe heroes, post cards).
