---
layout: default
title: "13 · Nausicaa"
permalink: /series/ulysses/13-nausicaa/
description: Entries on episode 13 of Ulysses — Nausicaa.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Nausicaa**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "13-nausicaa" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
