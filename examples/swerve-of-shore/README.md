# Martello Notes — a serialized reading-blog example

A complete demo site built on `jekyll-theme-zer0`, showing the theme configured
as a **serialized literary reading blog**: a long-running numbered series with a
published-so-far schedule, a card feed, a curated sidebar rail, and an editorial
light-mode skin.

The information architecture is modelled on
[Swerve of Shore](https://www.swerveofshore.com/), a real James Joyce reading
blog, because it is a good example of the shape: numbered episode entries, a
category rail covering the whole book, and Blog / Publications / About /
Subscribe across the top.

**Everything in this example is original.** The site name, the author
("R. Vaughan"), the essays, the publication list, and the artwork are all demo
content written for this repository. No text, images, or branding were copied
from that site or from any edition of Joyce, and this example is not affiliated
with or endorsed by anyone. Swap the content out — the structure is the point.

## Running it

```bash
cd examples/swerve-of-shore
bundle install
bundle exec jekyll serve --config _config.yml,_config_dev.yml
# → http://localhost:4010
```

`_config_dev.yml` points at the theme sources two directories up, so edits to
`_layouts/`, `_includes/`, or `_sass/` are picked up on rebuild. Build only:

```bash
bundle exec jekyll build --config _config.yml,_config_dev.yml
```

If your shell's locale is not UTF-8, Jekyll's SCSS converter errors with
`Invalid US-ASCII character` on the theme's stylesheets. Prefix with
`LANG=C.UTF-8 LC_ALL=C.UTF-8`.

## What it demonstrates

| Theme capability | Where |
|---|---|
| Custom output collection with nested paths | `series` in `_config.yml`, files under `pages/_series/<series>/` |
| Per-collection sidebar defaults | `collections.series.sidebar` + `defaults` in `_config.yml` |
| Curated sidebar rail | `_data/navigation/series.yml` (`sidebar: {nav: series}`) |
| Reusable post cards | `components/post-card.html` on `index.html` and `pages/blog.html` |
| Site-local includes overriding nothing | `_includes/*.html` — merged over the theme's |
| Data-driven content | `_data/episodes.yml` → `_includes/episode-schedule.html` |
| Full restyle without touching the theme | `assets/css/user-overrides.css` + `user_overrides: true` |
| Light-mode lock | `color_mode_default: light` + `color_mode_lock: true` |

## Layout

```
_config.yml              site identity, collections, defaults, feature toggles
_config_dev.yml          local-theme overrides for development
_data/
  authors.yml            author profile for bylines and the author card
  episodes.yml           full reading schedule (published + upcoming)
  navigation/main.yml    top bar: Blog · Publications · About · Subscribe
  navigation/series.yml  sidebar rail — only entries that exist
_includes/               site-local: subscribe band, page header, schedule, series list
assets/
  css/user-overrides.css the entire skin
  js/user-overrides.js   stub (the theme requests it when overrides are on)
  images/*.svg           generated placeholder artwork
index.html               masthead + recent-entries feed + subscribe band
pages/
  blog.html              full feed with the series rail
  about.md  publications.md  subscribe.md
  series/*.md            section index pages (schedule or list)
  _series/               the entries themselves
```

## Two conventions worth copying

**The sidebar only links to pages that exist.** The theme's nav renderer always
emits an `<a href>`, so a curated entry for an unwritten page becomes a dead
link. The complete 18-episode schedule therefore lives in `_data/episodes.yml`
and renders through `_includes/episode-schedule.html`, which links episodes that
have a matching document and shows the rest as plain "upcoming" rows. The
sidebar (`_data/navigation/series.yml`) lists only what is published. Result:
the full structure is visible, and the site has no broken internal links.

**Index pages set `hide_intro: true`.** The theme's intro panel carries reading
time, share buttons, and an "Edit on GitHub" link — useful on docs, wrong on a
reading site's section pages. Those pages suppress it and render
`_includes/page-header.html` instead.

## Reading times

`estimated_reading_time` in front matter drives the cards and series lists, but
`_layouts/article.html` computes the byline's "N min read" from word count
(`words / 200`) and ignores the front-matter value. The values here are set to
match what the layout computes so the two agree; if you lengthen an entry,
update its front matter too.

## Known issue (theme, not this example)

Below roughly 460px viewport width, page content overflows horizontally and gets
clipped on the right. This reproduces on this example with
`assets/css/user-overrides.css` blanked out, so it is theme-level behaviour
rather than something the skin introduces. At 480px and above the layout is
correct.
