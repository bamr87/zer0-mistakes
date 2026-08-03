---
layout: default
title: Joyce in the World
permalink: /series/joyce-in-the-world/
description: Context essays — the city, the money, the politics, the publishing history.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Standalone essays that sit outside the numbered sequence: the streets and the tram network, what things cost, the politics running underneath the small talk, and how the books actually got printed.

{% assign entries = site.series | where: "series", "joyce-in-the-world" | sort: "date" | reverse %}
{% include series-list.html entries=entries %}

{% include subscribe-band.html %}
