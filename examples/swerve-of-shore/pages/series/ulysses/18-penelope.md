---
layout: default
title: "18 · Penelope"
permalink: /series/ulysses/18-penelope/
description: Entries on episode 18 of Ulysses — Penelope.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Penelope**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "18-penelope" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
