---
layout: default
title: "17 · Ithaca"
permalink: /series/ulysses/17-ithaca/
description: Entries on episode 17 of Ulysses — Ithaca.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Ithaca**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "17-ithaca" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
