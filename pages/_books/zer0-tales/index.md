---
title: "The Tales of Zer0"
subtitle: "A tiny demo picture book for the books collection"
layout: book
book: zer0-tales
author: "The zer0-mistakes theme"
illustrator: "An AI image model (prompts in each story's colophon)"
audience: "Ages 0 and up"
status: complete
synopsis: >-
  Zer0 the wizard keeps a very tidy website. But when a pixel goes missing
  the night before launch, Zer0 must journey through the Mountains of
  Markdown to bring it home.
cover_image: /assets/images/zer0-mistakes-wizard.png
back_cover_image: /assets/images/info-banner-mountain-wizard.png
preview: /assets/images/zer0-mistakes-wizard.png
description: >-
  Demo book for the zer0-mistakes books collection — two short illustrated
  stories that exercise the book and book-story layouts.
generator: >-
  This demo book ships with the theme to exercise the book layouts. Stories
  were written by hand; the illustrations reuse the theme's existing art.
  Real books built on this collection (see the drsai platform) generate
  stories with an LLM and render illustrations with OpenAI image models.
illustration_style: >-
  Retro pixel-art wizardry — vibrant colors, cozy night skies, friendly
  glowing UI runes. Kid-friendly, never dark.
permalink: /books/zer0-tales/
sitemap: true
---

**The Tales of Zer0** is the theme's built-in demonstration book. It exists so theme developers can see the `books` collection end to end: a landing page with a cover hero and table of contents, story pages with plates and prev/next navigation, and the collapsed illustration-prompt colophon.

To build your own book, copy this folder's structure: an `index.md` with `layout: book` and a shared `book:` slug, plus one file per story with `layout: book-story` (set by the collection defaults) and a numeric `chapter:`. The full guide lives at [Books collection](/docs/features/book-collection/).
