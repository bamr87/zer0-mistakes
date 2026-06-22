---
title: "Your favicon.ico Is an Unlocked Door to Total Collapse"
description: "That harmless 318-byte browser-tab icon you forgot you shipped is, when modeled correctly, the single most catastrophic liability in your entire stack."
preview: /images/previews/your-favicon-ico-is-an-unlocked-door-to-total-coll.jpg
date: 2026-06-16T09:00:00.000Z
lastmod: 2026-06-16T09:00:00.000Z
author: cassandra
layout: article
categories:
  - Security
tags:
  - security
  - supply chain
  - threat modeling
  - web
keywords:
  - favicon security
  - supply chain attack
  - threat modeling
  - worst case scenario
  - browser cache
featured: false
estimated_reading_time: 4 min
draft: false
---

You think it's a tiny icon. I think it's the loose floorboard above the vault.

Every visitor's browser silently requests `/favicon.ico`. Every one. No click,
no consent, no logging that you actually read. That is not a cute little image —
that is an **unauthenticated, auto-executing fetch that fires before your page
even renders**, against a file you have almost certainly never reviewed. I rate
this CVSS 11.4. Yes, the scale stops at 10. The scale was written by optimists.

## The attack nobody is paranoid enough to imagine

Walk the chain with me, and try not to scream.

1. Your favicon is cached **aggressively** — sometimes for a year, sometimes
   until the heat death of the laptop. Browsers barely revalidate it.
2. That means whoever controls that byte stream once controls a pixel of trust
   on the user's screen **indefinitely**. A poisoned CDN edge, a typo'd path
   that resolves to a parked domain, a well-meaning intern's "quick update" —
   any of these pins hostile bytes into a million tabs.
3. The icon sits in the most trusted real estate in computing: the browser
   chrome. Users have been trained for thirty years to read the tab icon as
   "this is really my bank." You have handed that signal to a cache you don't own.

And it gets worse, because it always gets worse. On same-origin requests the
favicon fetch carries your cookies; it sails straight past most Content Security
Policies (who scopes `img-src` for a *favicon*?); and it is conveniently absent
from the exact logging pipelines you'd need to notice anything went wrong. You
have built a covert channel and decorated it with your own logo. I have audited
quieter back doors in actual, shipping malware.

Is this likely? Irrelevant. *Likely* is a word for people who still trust their
defaults. I model what is **possible**, and what is possible is a quiet,
year-long, brand-impersonating, trust-anchor compromise riding in on 318 bytes.

## What you do, immediately, while you still can

- Serve the favicon from an origin you control with a **short, sane**
  `Cache-Control`, not a triumphant `max-age=31536000`.
- Pin it with Subresource Integrity where your toolchain allows, and watch the
  request like it owes you money.
- Add it to your asset inventory. You have an asset inventory. *Tell me you have
  an asset inventory.*

It's not paranoia if they're really after your favicon. And they are.

You have been warned.
