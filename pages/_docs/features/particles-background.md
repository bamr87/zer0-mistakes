---
lastmod: 2026-07-13T00:00:00.000Z
title: Particles Background
description: Interactive particle animation background using particles.js for visual enhancement on landing and hero sections.
preview: /images/previews/particles-background.png
layout: default
categories:
    - docs
    - features
tags:
    - ui
    - animation
    - visual
    - landing
permalink: /docs/features/particles-background/
difficulty: intermediate
estimated_reading_time: 4 minutes
sidebar:
    nav: docs
---

# Particles Background

An optional animated particle field that sits behind hero and landing content,
adding subtle motion and depth. Particles drift, connect, and react to the
cursor, and the whole effect is configured from a single JSON file.

## Overview

- **Configurable particle field** — count, size, speed, colour, and link
  distance are all data-driven.
- **Interactive** — particles respond to mouse hover and clicks.
- **JSON configuration** — behaviour is read from
  [`assets/particles.json`](https://github.com/bamr87/zer0-mistakes/blob/main/assets/particles.json),
  so you can retune the look without touching JavaScript.
- **Performance-conscious** — intended for landing/hero sections rather than
  every page, so the animation cost is scoped to where it adds value.

## How it works

The vendored [`assets/js/particles.js`](https://github.com/bamr87/zer0-mistakes/blob/main/assets/js/particles.js)
runtime renders onto a canvas mounted in the hero area; the initialiser
(`assets/js/particles-source.js`) loads `assets/particles.json` and applies it.
Because the configuration is external, a site can ship a calmer or denser field
by editing the JSON alone.

## Implementation

| File | Role |
| --- | --- |
| `assets/js/particles.js` | Vendored particles.js renderer. |
| `assets/js/particles-source.js` | Initialiser that loads the JSON config and mounts the canvas. |
| `assets/particles.json` | Particle count, motion, colours, and interactivity. |

## Related features

- [Theme Color Modes](/docs/features/color-modes/)
