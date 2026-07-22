---
title: Books Collection
description: Publish children's picture books — or any cover-to-cover reading experience — with the books collection, book layouts, and illustration-plate components.
preview: /images/zer0-mistakes-wizard.png
layout: default
categories:
    - docs
    - features
tags:
    - books
    - collections
    - layouts
    - storybook
    - ai-images
permalink: /docs/features/book-collection/
difficulty: beginner
estimated_reading_time: 10 minutes
lastmod: 2026-07-22T00:00:00.000Z
sidebar:
    nav: docs
---

# Books Collection

The `books` collection turns the theme into a picture-book publishing platform: each book is a folder of story "chapters" plus a landing page, rendered with immersive, sidebar-free layouts designed for read-aloud content and full-width illustration plates.

The theme ships a tiny demo — [The Tales of Zer0](/books/zer0-tales/) — that exercises everything on this page. The reference production site is the [drsai children's book platform](https://github.com/bamr87/drsai), which generates stories with an LLM and illustrations with OpenAI image models, then publishes them through this collection.

## Enable the collection

Add the collection and its front-matter defaults to your site's `_config.yml` (the theme's own config carries the same block):

```yaml
collections:
  books:
    output: true
    title: Books
    icon: bi-book-half
    permalink: /:collection/:path/

defaults:
  - scope:
      path: pages/_books   # match your collections_dir
      type: books
    values:
      layout: book-story
      sidebar: false
      comments: false
```

## Author a book

One folder per book under `pages/_books/`:

```text
pages/_books/my-book/
  index.md                 # layout: book — cover, synopsis, TOC
  01-first-story.md        # chapter: 1
  02-second-story.md       # chapter: 2
```

### Book landing page (`layout: book`)

| Key | Required | Purpose |
|---|---|---|
| `book` | yes | Slug shared by the book and all of its chapters |
| `title` | yes | Book title (page `<h1>`) |
| `subtitle`, `author`, `illustrator`, `audience` | no | Byline metadata |
| `synopsis` | no | Short blurb shown in the cover hero |
| `cover_image`, `back_cover_image` | no | Cover art (portrait works best) |
| `generator` | no | Provenance sentence for the "How this book was made" colophon |
| `illustration_style` | no | The shared style tag used to generate the art |

The page body renders as an "About this book" section above the table of contents.

### Story pages (`layout: book-story`)

| Key | Required | Purpose |
|---|---|---|
| `book` | yes | Must match the book's slug |
| `chapter` | yes | Numeric reading order (drives TOC and prev/next) |
| `title` | yes | Story title |
| `chapter_label` | no | Display label above the title (e.g. "January") |
| `description` | no | Lead paragraph under the title |
| `preview` | no | Thumbnail/OG image for cards and the TOC |
| `illustrations` | no | List of `{beat, title, prompt, image}` — rendered as a collapsed prompt colophon |
| `the_end` | no | `false` hides the closing "The End" flourish |

Drop illustration plates anywhere in the story body:

```liquid
{% raw %}{% include components/book-plate.html
   src="/assets/images/books/my-book/scene.jpg"
   alt="What is happening in the scene" %}{% endraw %}
```

Bare markdown images (`![alt](src)`) inside a story get the same plate styling automatically.

## Components

| Include | Purpose |
|---|---|
| `components/bookshelf.html` | Grid of every book — drop on a home page (`heading` optional) |
| `components/book-card.html` | One book's cover card (`book` = the landing doc) |
| `components/book-toc.html` | Ordered chapter list for a book (`book` = slug) |
| `components/book-nav.html` | Prev/next/contents navigation (`book`, `chapter`) |
| `components/book-plate.html` | Illustration figure (`src`, `alt`, optional `caption`) |

A home page bookshelf is one line:

```liquid
{% raw %}{% include components/bookshelf.html heading="Our Library" %}{% endraw %}
```

## AI generation pipeline

The collection is designed so front matter doubles as a generation manifest: each story carries the prompts that produced (or will produce) its art. The [drsai platform](https://github.com/bamr87/drsai) reads those `illustrations:` lists and renders any missing images with the OpenAI Images API; the [zer0-image-generator](https://github.com/bamr87/zer0-image-generator) gem generates each story's `preview` banner the same way. Stories whose `image` is missing show a "not yet generated" badge in the colophon, so a book can ship before its art is finished.

## Styling

Styles live in `_sass/components/_book.scss` and read Bootstrap's runtime custom properties, so light/dark color modes and theme skins work automatically. Consumer knobs:

```css
:root {
  --zer0-book-serif: /* storybook font stack */;
  --zer0-book-font-size: /* clamp() for the reading size */;
  --zer0-book-measure: 42rem; /* line length */
  --zer0-book-plate-radius: 1rem;
}
```
