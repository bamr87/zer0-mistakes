---
layout: default
title: Joyce in the World
permalink: /series/joyce-in-the-world/
description: Context, influence, and the writers Joyce read and was read against.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Essays outside the numbered sequence — context, influence, and the other writers Joyce is read alongside.

{% assign entries = site.series | where: "series", "joyce-in-the-world" | sort: "date" | reverse %}
{% include series-list.html entries=entries %}

{% include subscribe-band.html %}
