---
layout: default
title: "05 · Lotus Eaters"
permalink: /series/ulysses/05-lotus-eaters/
description: Entries on episode 05 of Ulysses — Lotus Eaters.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Lotus Eaters**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "05-lotus-eaters" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
