---
layout: default
title: About
permalink: /about/
description: What Swerve of Shore is, and what this rebuild is.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

<figure class="mn-figure">
  <img src="{{ '/assets/images/posts/008-3-omphalos-the-center-of-it-all.jpg' | relative_url }}" alt="">
</figure>

## The original

[Swerve of Shore]({{ site.source_site.url }}) is a close reading of James Joyce by {{ site.source_site.author }}. The spine is *Ulysses*, worked through in order from the 1922 first printing by Shakespeare & Co., with each entry taking a stretch of text and staying with it. Running alongside: *Finnegans Wake* from the 1999 Penguin Classics edition, notes on *A Portrait of the Artist as a Young Man*, and essays placing Joyce against other writers.

The numbering is the clever part. Entries carry numbers rather than relying on dates, so a note written in November can sit exactly where it belongs in the reading — which is the only way a serialized project like this stays navigable past about thirty posts.

<figure class="mn-figure">
  <img src="{{ '/assets/images/posts/001-1-joyce-s-skyquake.jpg' | relative_url }}" alt="">
</figure>

## This rebuild

What you are reading is that site rebuilt on the [zer0-mistakes](https://github.com/bamr87/zer0-mistakes) Jekyll theme, with the owner's permission, as a worked example of the theme handling a long-running serialized project.

The identity, navigation, taxonomy, entry titles and dates, and the images are all the real ones. **The essays are not reproduced** — each entry shows a short quoted excerpt from the original, with a link to read the whole thing where it lives. If you came for the criticism rather than the CSS, [go there]({{ site.source_site.url }}).

## Why it makes a good example

Most theme demos are a handful of lorem-ipsum posts, which prove nothing. A real serialized project stresses the parts that actually break: a taxonomy deep enough to need its own sidebar, sections that exist before anything is filed under them, entries that sort by something other than date, and a hundred internal links that all have to resolve.

The [reading order]({{ '/more/reading-order/' | relative_url }}) page explains the numbering; the [project README](https://github.com/bamr87/zer0-mistakes/tree/main/examples/swerve-of-shore) has the technical breakdown.

{% include subscribe-band.html %}
