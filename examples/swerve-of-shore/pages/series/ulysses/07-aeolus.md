---
layout: default
title: "07 · Aeolus"
permalink: /series/ulysses/07-aeolus/
description: Entries on episode 07 of Ulysses — Aeolus.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Aeolus**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "07-aeolus" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
