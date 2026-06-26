---
lastmod: 2026-06-26T00:00:00.000Z
title: Safe-Mode Build Overlay (Building Outside GitHub Pages)
description: The recipe for building a Zer0-Mistakes remote-theme site in your own CI — clone the theme, overlay your content, strip plugins, and run a strict build.
preview: /images/previews/deployment.png
layout: default
categories:
    - docs
    - deployment
tags:
    - github-pages
    - remote-theme
    - deployment
    - ci
keywords:
    - remote theme build
    - github pages safe mode
    - jekyll build overlay
    - strip _plugins
    - custom CI jekyll
    - strict front matter
permalink: /docs/deployment/build-overlay/
difficulty: intermediate
estimated_reading_time: 8 minutes
prerequisites:
    - A site that consumes Zer0-Mistakes via remote_theme
    - A CI runner (GitHub Actions, GitLab CI, etc.)
author: bamr87
sidebar:
    nav: docs
---

# Safe-Mode Build Overlay

**What you'll do:** reproduce a GitHub Pages build of your remote-theme site in
your own CI, so a custom pipeline (caching, link-checking, multi-site builds)
renders exactly what Pages would — no more, no less.

## Why this is needed

When you build *outside* GitHub Pages — your own GitHub Actions, GitLab CI, or a
local `jekyll build` — nothing replicates Pages' two constraints for you:

1. `remote_theme` only delivers `_layouts/`, `_includes/`, `_sass/`, and
   `assets/`. Your `_config.yml`, `_data/`, and content stay local.
2. Pages runs Jekyll in **safe mode**, which **ignores `_plugins/*.rb`**. The
   theme's generators (search, sitemap, author pages, previews) never run on a
   Pages consumer build.

If your custom build *doesn't* strip `_plugins`, you get pages locally that 404
on the real Pages site — the build and production diverge silently. The overlay
recipe makes your CI build match Pages exactly. (For the files Pages does *not*
deliver, see the
[Remote-Theme Consumer Checklist](/docs/deployment/remote-theme-checklist/).)

## The recipe

Four steps: **clone the theme → overlay your content on top → strip `_plugins`
→ strict build.**

```bash
#!/usr/bin/env bash
set -euo pipefail

THEME_REPO="bamr87/zer0-mistakes"
THEME_REF="v1.20.2"          # pin a tag, not a moving branch
BUILD_DIR="$(mktemp -d)"

# 1. Clone the theme at a pinned ref (shallow is fine).
git clone --depth 1 --branch "$THEME_REF" \
  "https://github.com/${THEME_REPO}.git" "$BUILD_DIR"

# 2. Overlay YOUR site on top of the theme (your files win on conflict).
#    Copy your content/config/data over the theme checkout.
rsync -a --exclude '.git' ./ "$BUILD_DIR/"

# 3. Strip _plugins — Pages safe mode never runs them, so neither should you.
rm -rf "$BUILD_DIR/_plugins"

# 4. Strict build, exactly as Pages would (minus the plugins).
cd "$BUILD_DIR"
bundle exec jekyll build --strict_front_matter --trace
```

The output in `$BUILD_DIR/_site` is what a real Pages consumer would serve.

> **Why strict?** `--strict_front_matter` fails the build on a malformed front
> matter block instead of silently skipping the page — the same failure mode you
> want to catch in CI rather than discover in production.

## As a reusable CI step

Wrap the recipe in a function so multiple jobs can share it:

```bash
lh_overlay() {                       # build a remote-theme site the Pages way
  local theme_ref="${1:-v1.20.2}" out="${2:-_site}"
  local work; work="$(mktemp -d)"
  git clone --depth 1 --branch "$theme_ref" \
    https://github.com/bamr87/zer0-mistakes.git "$work"
  rsync -a --exclude '.git' ./ "$work/"
  rm -rf "$work/_plugins"
  ( cd "$work" && bundle exec jekyll build --strict_front_matter -d "$PWD/$out" )
}
```

In GitHub Actions:

```yaml
- name: Build (safe-mode overlay)
  run: |
    source scripts/ci/build.sh   # defines lh_overlay
    lh_overlay "v1.20.2" "_site"

- name: Link-check the built site
  run: npx --yes linkinator _site --silent --recurse
```

## Verifying the overlay matches Pages

After the build, sanity-check that you didn't ship anything Pages wouldn't:

- **No plugin-only routes** — `/search.json`, `/sitemap/`, `/authors/` etc. should
  be absent unless you committed static stubs for them. Their presence locally but
  not on Pages is the classic divergence this recipe prevents.
- **Run a link checker** over `_site` and treat theme-injected 404s as build
  failures, so a regression surfaces in CI rather than for a visitor.

## See also

- [Remote-Theme Consumer Checklist](/docs/deployment/remote-theme-checklist/) — the
  files and config to add when consuming the theme via `remote_theme`.
- [Deployment overview](/docs/deployment/) — hosting options and trade-offs.
