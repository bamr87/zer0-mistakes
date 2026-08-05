---
layout: default
title: Reading Order
permalink: /more/reading-order/
description: How the entry numbering works and where to start.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries are numbered rather than dated, because a serialized reading does not arrive in the order it is meant to be read.

## How the numbers work

The leading three digits place an entry in the overall sequence; the digit after the point orders entries that sit under the same episode. So `008.2` and `008.3` are both part of the same run and read in that order, while `010.0` starts a new one.

Sorting by number rather than by date means an entry written later can still slot into its correct place in the reading — which is the whole reason the scheme exists.

## Where to start

Start with [Ulysses]({{ '/series/ulysses/' | relative_url }}) and work down the
episode list. Each episode page collects its entries in order. The
[Finnegans Wake]({{ '/series/finnegans-wake/' | relative_url }}) thread runs
alongside and can be picked up independently.

## How this is implemented

Each entry carries `series`, `section`, and `order` in its front matter. Section pages filter the collection by `section` and sort by `order`; the sidebar rail and the episode schedule are generated from `_data/episodes.yml`, so the taxonomy is defined in exactly one place.

{% include subscribe-band.html %}
