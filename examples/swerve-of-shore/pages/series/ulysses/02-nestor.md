---
layout: default
title: "02 · Nestor"
permalink: /series/ulysses/02-nestor/
description: Entries on episode 02 of Ulysses — Nestor.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Nestor**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "02-nestor" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
