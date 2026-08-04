---
layout: default
title: "11 · Sirens"
permalink: /series/ulysses/11-sirens/
description: Entries on episode 11 of Ulysses — Sirens.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Sirens**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "11-sirens" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
