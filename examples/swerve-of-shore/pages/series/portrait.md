---
layout: default
title: Portrait
permalink: /series/portrait/
description: Readings of the earlier novel, and what the later one does to it.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

*A Portrait of the Artist as a Young Man* read on its own terms, and then read
again in light of the book that picks its protagonist up a few years later and
declines to mention that the ending did not take.

{% assign entries = site.series | where: "series", "portrait" | sort: "episode" %}
{% include series-list.html entries=entries %}

{% include subscribe-band.html %}
