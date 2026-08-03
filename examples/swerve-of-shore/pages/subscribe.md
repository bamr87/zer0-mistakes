---
layout: default
title: Subscribe
permalink: /subscribe/
description: Get each new entry by email, or follow the feed.
hide_intro: true
local_graph: false
sidebar:
  nav: series
  title: "Browse the series"
---

{% include page-header.html %}

New entries land roughly every other week — one episode at a time, however long
that episode takes.

{% include subscribe-band.html %}

## Other ways to follow

- **RSS** — [{{ '/feed.xml' | relative_url }}]({{ '/feed.xml' | relative_url }})
  works with any reader and never asks for your address.
- **Site map** — every entry, in order, on the [blog index]({{ '/blog/' | relative_url }}).

## What you get

Each email is the entry itself: summary, the formal trick the episode is
playing, the threads still running, and whatever I could not resolve. No
digests, no round-ups, no "here's what I've been up to."

## What happens to your address

On this demo site, nothing — there is no list and no endpoint configured. On a
real deployment you would point `news.newsletter.endpoint` in `_config.yml` at
your provider's form URL and the band above would post to it directly.
