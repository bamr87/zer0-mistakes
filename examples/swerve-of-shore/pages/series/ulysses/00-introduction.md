---
layout: default
title: "Ulysses — Introduction"
permalink: /series/ulysses/00-introduction/
description: Where the reading starts, and which edition it works from.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

Opening notes, before the first episode. The reading works from the 1922 first printing by Shakespeare & Co.

{% assign entries = site.series | where: "series", "ulysses" | where: "section", "00-introduction" | sort: "order" %}
{% include series-list.html entries=entries empty="Nothing filed here yet." %}

{% include subscribe-band.html %}
