---
layout: default
title: Subscribe
permalink: /subscribe/
description: Follow new entries by email or feed.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

New entries are posted as the reading goes.

{% include subscribe-band.html %}

## Other ways to follow

- **RSS** — [{{ '/feed.xml' | relative_url }}]({{ '/feed.xml' | relative_url }}) works with any reader and never asks for your address.
- **Everything so far** — the [blog index]({{ '/blog/' | relative_url }}) lists every entry, newest first.
- **By section** — the [Ulysses schedule]({{ '/series/ulysses/' | relative_url }}) shows all eighteen episodes and which ones have entries.

## On this demo

This is a layout replica, so there is no mailing list behind the form above — with no `news.newsletter.endpoint` configured, the theme falls back to a `mailto:` link rather than shipping a form that posts nowhere. To subscribe to the real thing, use [{{ site.source_site.name }}]({{ site.source_site.url }}).

On a real deployment you would point `news.newsletter.endpoint` in `_config.yml` at your provider's form URL and the band above would post to it directly.
