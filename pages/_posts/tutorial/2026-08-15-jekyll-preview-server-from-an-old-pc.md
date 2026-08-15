---
title: "Turn a Retired PC into an Always-Ready Jekyll Preview Server"
description: "Serve your Jekyll site from a 14-year-old desktop with Docker, LiveReload over the LAN, and a one-command sync loop — a free staging box for theme work."
date: 2026-08-15T12:00:00.000Z
lastmod: 2026-08-15T12:00:00.000Z
author: default
layout: article
categories: [Tutorial]
tags: [jekyll, docker, homelab, livereload, workflow]
featured: false
estimated_reading_time: "8 min"
draft: false
---

Theme work has a preview problem. `jekyll serve` on your laptop dies when the lid closes, hogs a port you wanted for something else, and shows the site to exactly one screen — yours. Meanwhile there is probably a perfectly good desktop in a closet somewhere that could hold a build of your site all day, on every device in the house.

This tutorial turns that machine into a standing preview server: your theme served over the LAN with LiveReload, updated by one command from your laptop. The reference hardware is a 2012 Core i7 tower — 14 years old — and it handles this without noticing. Jekyll builds are CPU-light and RAM-tolerant; this is exactly the workload old hardware is still good at.

## What you end up with

- `http://<server>.local:4000` — your site, reachable from your laptop, tablet, and phone
- LiveReload firing on every rebuild, on every device at once
- A sync loop where "deploy to preview" is one command
- Zero cloud cost, zero laptop battery burned on `--watch`

## Prerequisites

- An old PC running any Linux with Docker and SSH (a minimal Debian install is plenty)
- Your Jekyll project with a `docker-compose.yml` — the one this theme ships works as-is
- The machines on the same LAN

## Step 1: Get the project onto the server

Skip git on the server entirely — you want your *working tree* previewed, uncommitted changes included. `rsync` is the right tool:

```bash
rsync -a \
  --exclude _site --exclude .jekyll-cache --exclude node_modules \
  ./ server:dev/my-theme/
```

The excludes matter: `_site` and `.jekyll-cache` will be rebuilt server-side (and volume-mounted caches must not be clobbered mid-build), and `node_modules` is platform-specific — let the container own its dependencies.

## Step 2: Serve on the LAN, not localhost

The stock compose file already binds Jekyll to `0.0.0.0:4000`, which is what makes LAN preview work. Two things to verify:

```yaml
command: >
  bundle exec jekyll serve --watch --livereload
  --host 0.0.0.0 --port 4000
ports:
  - "4000:4000"
  - "35729:35729"   # LiveReload's own port — forget this and reloads silently fail
```

That second port mapping is the one everybody misses. LiveReload runs its own websocket server on 35729; if it isn't published, the page loads fine but never refreshes, and you'll blame Jekyll.

If the server runs a firewall (it should), allow both ports from your subnet only:

```bash
sudo ufw allow from 192.168.4.0/24 to any port 4000 proto tcp
sudo ufw allow from 192.168.4.0/24 to any port 35729 proto tcp
```

Then on the server: `docker compose up -d`. First build takes a few minutes while gems install into the bundle-cache volume; every start after that is seconds.

## Step 3: Close the loop with one command

The workflow is only as good as its friction. Put this in your shell profile:

```bash
preview() {
  rsync -a --exclude _site --exclude .jekyll-cache --exclude node_modules \
    ./ server:dev/${PWD##*/}/
}
```

Now the loop is: edit → `preview` → every open device reloads itself. Jekyll's `--watch` sees the rsync'd changes land and rebuilds; LiveReload pushes the refresh. You never touch the server.

This is where the multi-device part quietly becomes the killer feature for theme development: keep the phone propped next to your editor showing the same page as your desktop browser. Responsive regressions show up the moment you cause them, not when you remember to check dev tools' device mode.

## Step 4: Make the server disappear

A preview server you have to *manage* is a preview server you'll abandon. Two finishing touches:

**It survives reboots.** Compose's `restart: unless-stopped` (or just rerunning `up -d`) means a power cut doesn't cost you anything.

**It costs nothing while idle.** Enable Wake-on-LAN in the BIOS and arm it on the NIC, then power the box down when you're not working:

```bash
# on the server, once:
sudo ethtool -s eno1 wol g
# from your laptop, when starting a session:
wakeonlan aa:bb:cc:dd:ee:ff   # ~30 seconds later, the preview is back
```

## Why not just use the laptop?

For a quick check, do. The standing server earns its keep on theme work specifically: long sessions where you want the site visible on three screen sizes at once, builds that don't fight your laptop's battery and fans, and a URL you can hand to anyone in the house — "look at `forge.local:4000` and tell me if the nav feels right" is a usability test that costs nothing to run.

The 14-year-old tower this was written against also runs the household's Postgres, a log stack, and a monitoring console off the same Docker install. Old hardware is slow at exactly two things — modern single-thread bursts and anything needing a current GPU. Serving a static site over a LAN is neither. Put the closet machine on the second shift.
