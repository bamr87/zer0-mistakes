---
layout: default
title: "Finnegans Wake — Introduction"
permalink: /series/finnegans-wake/00-introduction/
description: Entries on Finnegans Wake, Introduction.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Entries filed under **Introduction**, in reading order.

{% assign entries = site.series | where: "series", "finnegans-wake" | where: "section", "00-introduction" | sort: "order" %}
{% include series-list.html entries=entries empty="No entries here yet." %}

{% include subscribe-band.html %}
