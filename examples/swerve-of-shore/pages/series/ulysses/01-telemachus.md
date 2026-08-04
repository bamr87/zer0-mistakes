---
layout: default
title: "01 · Telemachus"
permalink: /series/ulysses/01-telemachus/
description: Entries on episode 01 of Ulysses — Telemachus.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Telemachus**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "01-telemachus" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
