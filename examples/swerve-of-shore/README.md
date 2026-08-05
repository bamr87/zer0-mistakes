# Swerve of Shore — a serialized reading-blog example

A rebuild of [Swerve of Shore](https://www.swerveofshore.com/), a James Joyce reading blog by Brandon Nicklaus, on the `jekyll-theme-zer0` theme. Published **with the site owner's permission** as a worked example of the theme configured for a long-running serialized project.

## What is and isn't reproduced

| | |
|---|---|
| **Reproduced** | Site identity and navigation, category taxonomy, entry titles, dates and sections, every featured image (resized, EXIF stripped), and the **opening 2–3 paragraphs** of each entry, quoted. |
| **Not reproduced** | The essays themselves. |

Each entry opens with the first two or three paragraphs of the original — averaging ~120 words, capped at three paragraphs and 220 words — set as a marked quotation, attributed to Brandon Nicklaus, and followed by a prominent link to read the rest on swerveofshore.com. It is a lead-in, the same shape as a newsletter teaser: enough to read as a real page, not a mirror of the essay.

That is deliberate on two counts. It keeps the demo honest — the pages carry real writing in the author's voice rather than filler, which is the only way to see how the layout actually behaves under real content. And it sends readers to the original rather than substituting for it. If you are here for the criticism, [read it there](https://www.swerveofshore.com/).

## Running it

```bash
cd examples/swerve-of-shore
bundle install
bundle exec jekyll serve --config _config.yml,_config_dev.yml
# → http://localhost:4010
```

`_config_dev.yml` points at the theme sources two directories up, so edits to `_layouts/`, `_includes/`, or `_sass/` are picked up on rebuild. Build only:

```bash
bundle exec jekyll build --config _config.yml,_config_dev.yml
```

If your shell's locale is not UTF-8, Jekyll's SCSS converter errors with `Invalid US-ASCII character` on the theme's stylesheets. Prefix with `LANG=C.UTF-8 LC_ALL=C.UTF-8`.

## What it demonstrates

| Theme capability | Where |
|---|---|
| Custom output collection with nested paths | `series` in `_config.yml`, files under `pages/_series/<series>/<section>/` |
| Per-collection sidebar defaults | `collections.series.sidebar` + `defaults` in `_config.yml` |
| Curated sidebar rail | `_data/navigation/series.yml` (`sidebar: {nav: series}`) |
| Reusable post cards | `components/post-card.html` on `index.html` and `pages/blog.html` |
| Article hero images | `show_hero: true` collection default + per-entry `preview` |
| Site-local includes | `_includes/*.html` — merged over the theme's |
| Data-driven taxonomy | `_data/episodes.yml` → `_includes/episode-schedule.html` + section pages |
| Full restyle without touching the theme | `assets/css/user-overrides.css` + `user_overrides: true` |
| Light-mode lock | `color_mode_default: light` + `color_mode_lock: true` |

52 pages build from 20 entries, 21 section pages, and 8 standalone pages, with zero broken internal links.

## Layout

```
_config.yml              site identity, collections, defaults, feature toggles
_config_dev.yml          local-theme overrides for development
_data/
  authors.yml            author profile for bylines and the author card
  episodes.yml           the taxonomy: 18 Ulysses episodes + FW books
  navigation/main.yml    top bar: Blog · Publications · About · Subscribe · More
  navigation/series.yml  sidebar rail, generated from episodes.yml
_includes/               site-local: subscribe band, page header, schedule, series list
assets/
  css/user-overrides.css the entire skin
  js/user-overrides.js   stub (the theme requests it when overrides are on)
  images/                wordmark, logo, and posts/ (one hero per entry)
index.html               masthead + recent-entries feed + subscribe band
pages/
  blog.html              full feed with the series rail
  about.md  publications.md  subscribe.md  more.md  more/reading-order.md
  series/                landing pages + one section page per episode/book
  _series/               the entries themselves, filed by series/section
```

## Three conventions worth copying

**The taxonomy lives in one file.** `_data/episodes.yml` defines all eighteen Ulysses episodes and the Finnegans Wake books. The sidebar rail, the episode schedule with its entry counts, and the section pages are all generated from it, so adding an episode is a one-line change.

**Every nav target resolves.** A section page exists for the whole taxonomy, not just the parts with entries written. An episode with nothing filed under it yet renders "No entries here yet" rather than 404ing. This matters because the theme's nav renderer always emits an `<a href>` — a curated link to a page that does not exist is a dead link, not a disabled one.

**Entries sort by number, not date.** A serialized reading does not arrive in the order it should be read. Each entry carries `series`, `section`, and `order` in front matter; section pages filter by `section` and sort by `order`, so an entry written later still lands in its correct place. See `/more/reading-order/`.

**Markdown files contain no HTML.** Classes reach the markup two ways, and which one you can use is decided by an interaction worth knowing about.

*Span-level* IALs sit on the same line as their content and work normally:

```markdown
![]({{ '/assets/images/x.jpg' | relative_url }}){: .mn-figure}
[Read the full piece](https://example.com){: .btn .btn-outline-dark}
```

*Block-level* IALs — the usual way to put a class on a whole paragraph — **do not survive this repo.** They live on their own line immediately before or after the block, and `tools/unwrap-prose.py` (which CI enforces via `markdown-oneline.yml`) folds that line into the adjacent paragraph. Kramdown then emits `{: .my-class}` as literal visible text:

```markdown
Some paragraph.
{: .my-class}     <-- unwrap-prose joins this onto the line above; class is lost
```

So anything needing a class on a block element lives in a site-local include instead — `_includes/source-note.html` and `_includes/pub-item.html`. That keeps the Markdown free of HTML tags, which is the point, and puts the markup where a Jekyll site normally keeps it.

## Images

`assets/images/posts/` holds one hero image per entry, named after its slug. They came from the original site with permission and were re-encoded at 1200px wide, quality 82, with **all metadata stripped** — one of the originals was an iPhone photo carrying GPS coordinates. If you re-import images, keep the stripping step; `Image.putdata()` into a fresh canvas is the simplest way to guarantee no EXIF survives.

## Reading times

`estimated_reading_time` in front matter drives the cards and section lists, but `_layouts/article.html` computes the byline's "N min read" from word count (`words / 200`) and ignores the front-matter value.

## Known issue (theme, not this example)

Below roughly 460px viewport width, page content overflows horizontally and gets clipped on the right. This reproduces with `assets/css/user-overrides.css` blanked out, so it is theme-level behaviour rather than something the skin introduces. At 480px and above the layout is correct.
