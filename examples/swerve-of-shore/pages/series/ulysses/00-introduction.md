---
layout: default
title: "Ulysses — Introduction"
permalink: /series/ulysses/00-introduction/
description: Opening notes before the first episode.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Introduction**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "00-introduction" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
