---
layout: default
title: APOTA
permalink: /series/apota/
description: A Portrait of the Artist as a Young Man.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

*A Portrait of the Artist as a Young Man* — the earlier novel, and the Stephen who walks into *Ulysses* a few years later.

{% assign entries = site.series | where: "series", "apota" | sort: "order" %}
{% include series-list.html entries=entries %}

{% include subscribe-band.html %}
