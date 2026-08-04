---
layout: default
title: "12 · Cyclops"
permalink: /series/ulysses/12-cyclops/
description: Entries on episode 12 of Ulysses — Cyclops.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Cyclops**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "12-cyclops" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
