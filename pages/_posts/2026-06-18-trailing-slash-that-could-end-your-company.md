---
title: "The Trailing Slash That Could End Your Entire Company"
description: "One redirect from /about to /about/ looks innocent. Modeled properly it is an open redirect, a cache-poisoning vector, and the first domino of collapse."
preview: /images/previews/the-trailing-slash-that-could-end-your-entire-comp.jpg
date: 2026-06-18T09:00:00.000Z
lastmod: 2026-06-18T09:00:00.000Z
author: cassandra
layout: article
categories:
  - Security
tags:
  - security
  - threat modeling
  - web
  - http
keywords:
  - open redirect
  - cache poisoning
  - url normalization
  - threat modeling
  - http headers
featured: false
estimated_reading_time: 4 min
draft: false
---

Someone on your team shipped a redirect from `/about` to `/about/` and called it "tidying up the URLs." I call it the opening move of an extinction-level event.

Stay with me. A 301 is not a convenience. A 301 is your server **telling the browser where to go and being obeyed without question**. You have built a machine whose entire purpose is to reroute trusting clients on command, and then you went to lunch.

## How a slash becomes a smoking crater

- **Redirect chains** are reconnaissance gifts. `/about` → `/about/` →
`https://about.example.com/` teaches an attacker exactly how your edge, origin, and canonicalization disagree. Disagreement is the soil every serious exploit grows in. Severity: catastrophic. Officially? Unrated, because the committee was too frightened.
- **Cache poisoning.** If the redirect varies on a header you forgot to include
in the cache key — and you forgot, you always forget — a single crafted request can pin a redirect to an attacker's host for **every** subsequent visitor. Your CDN will serve it cheerfully. CDNs have no conscience.
- **Open redirect.** The day someone parameterizes that "harmless" normalizer
(`?next=`, `?return=`), your domain becomes a laundering service for phishing links that wear your TLS certificate like a stolen uniform.

And here is the detail that keeps me awake at night, every night, forever: none of this shows up in a screenshot. Your homepage looks perfect. Your Lighthouse score is radiant. The rot is entirely in the **headers** — the part no stakeholder has ever once looked at — which is precisely where I would hide if I were the adversary. And I am always, professionally, the adversary.

Trivial? The Titanic was sunk by a trivial gap between a ship and some ice.

## Contain it before the slash contains you

- **Normalize once, at the edge, deterministically.** One canonical host, one
trailing-slash policy, zero chains. Every hop is a window an attacker climbs through.
- **Put the full path in your cache key**, and never let a redirect vary on an
  unkeyed header.
- **Allowlist redirect targets.** If a redirect can point off-origin, assume it
  eventually will, at 3 a.m., on a holiday.

A trailing slash is not punctuation. It is a confession that your URL handling has opinions you have never audited.

You have been warned.
