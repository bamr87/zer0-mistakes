---
layout: default
title: "03 · Proteus"
permalink: /series/ulysses/03-proteus/
description: Entries on episode 03 of Ulysses — Proteus.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Proteus**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "03-proteus" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
