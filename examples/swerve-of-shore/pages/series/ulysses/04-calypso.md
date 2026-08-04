---
layout: default
title: "04 · Calypso"
permalink: /series/ulysses/04-calypso/
description: Entries on episode 04 of Ulysses — Calypso.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Calypso**, in reading order.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "04-calypso" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet — this episode is still ahead in the reading." %}

{% include subscribe-band.html %}
