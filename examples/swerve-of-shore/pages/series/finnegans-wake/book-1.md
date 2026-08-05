---
layout: default
title: "Finnegans Wake — Book 1"
permalink: /series/finnegans-wake/book-1/
description: Notes on Finnegans Wake, Book 1.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

*Finnegans Wake*, Book 1 — starting on page 3 and going slowly. Read aloud where you can.

{% assign entries = site.series | where: "series", "finnegans-wake" | where: "section", "book-1" | sort: "order" %}
{% include series-list.html entries=entries empty="Nothing filed here yet." %}

{% include subscribe-band.html %}
