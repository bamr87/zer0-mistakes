---
lastmod: 2026-10-30T00:00:00.000Z
title: Safe-Mode Build Overlay (Building Outside GitHub Pages)
description: The recipe for building a Zer0-Mistakes remote-theme site in your own CI — start from your site, copy in only what remote_theme delivers, strip plugins, and run a strict build.
preview: /images/previews/safe-mode-build-overlay-building-outside-github-pa.png
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

**What you'll do:** reproduce a GitHub Pages build of your remote-theme site in your own CI, so a custom pipeline (caching, link-checking, multi-site builds) renders exactly what Pages would — no more, no less.

## Why this is needed

When you build *outside* GitHub Pages — your own GitHub Actions, GitLab CI, or a local `jekyll build` — nothing replicates Pages' two constraints for you:

1. `remote_theme` only delivers `_layouts/`, `_includes/`, `_sass/`, and
   `assets/`. Your `_config.yml`, `_data/`, and content stay local.
2. Pages runs Jekyll in **safe mode**, which **ignores `_plugins/*.rb`**. The
theme's generators (search, sitemap, author pages, previews) never run on a Pages consumer build.

If your custom build *doesn't* strip `_plugins`, you get pages locally that 404 on the real Pages site — the build and production diverge silently. The overlay recipe makes your CI build match Pages exactly. (For the files Pages does *not* deliver, see the [Remote-Theme Consumer Checklist](/docs/deployment/remote-theme-checklist/).)

## The recipe

Four steps: **start from your site → copy in only what `remote_theme` delivers → strip `_plugins` → strict build.**

```bash
#!/usr/bin/env bash
set -euo pipefail

THEME_URL="${THEME_URL:-https://github.com/bamr87/zer0-mistakes.git}"
THEME_REF="${THEME_REF:-v1.20.2}"   # pin a tag, not a moving branch
THEME_DIR="$(mktemp -d)"
BUILD_DIR="$(mktemp -d)"

# 1. Clone the theme into its OWN directory at a pinned ref (shallow is fine).
git clone --depth 1 --branch "$THEME_REF" "$THEME_URL" "$THEME_DIR"

# 2. Start from YOUR site — exactly what Pages checks out — then copy in only
#    the four directories remote_theme delivers. --ignore-existing: your
#    files win on every collision, as they do on Pages.
rsync -a --exclude '.git' ./ "$BUILD_DIR/"
for d in _layouts _includes _sass assets; do
  rsync -a --ignore-existing "$THEME_DIR/$d/" "$BUILD_DIR/$d/"
done

# 3. Strip _plugins — Pages safe mode never runs them, so neither should you.
rm -rf "$BUILD_DIR/_plugins"

# 4. Strict build, exactly as Pages would (minus the plugins).
cd "$BUILD_DIR"
bundle exec jekyll build --strict_front_matter --trace
```

The output in `$BUILD_DIR/_site` is what a real Pages consumer would serve: your content and config plus the theme's `_layouts/`, `_includes/`, `_sass/` and `assets/` — nothing else from the theme repo.

### Why an allowlist, not a denylist

An earlier version of this recipe cloned the **whole** theme repo into `$BUILD_DIR` and copied the site on top. Everything else in the theme repo then leaked into the build: its `_data/` merged with yours (the theme's `_data/navigation/docs.yml` gave consumer `/docs/` pages a sidebar full of theme-only links), its root `README.md`/`AGENTS.md`/`CLAUDE.md` became `/AGENTS/` and `/CLAUDE/` routes, `examples/` and `templates/` broke strict builds, `features/README.md` became `/features/`, and the machine-translated `fr/` tree added pages the consumer does not have. A denylist (`rm -rf "$BUILD_DIR/examples"` …) has to grow every time the theme repo adds a top-level directory. Copying in exactly the four directories `remote_theme` delivers ([Remote-Theme Consumer Checklist](/docs/deployment/remote-theme-checklist/)) matches Pages by construction.

> **Why strict?** `--strict_front_matter` fails the build on a malformed front
> matter block instead of silently skipping the page — the same failure mode you
> want to catch in CI rather than discover in production.

## As a reusable CI step

Wrap the recipe in a function so multiple jobs can share it:

```bash
lh_overlay() {                       # build a remote-theme site the Pages way
  local theme_ref="${1:-v1.20.2}" out="${2:-_site}"
  local theme_url="${THEME_URL:-https://github.com/bamr87/zer0-mistakes.git}"
  # Resolve the output dir in the CALLER's directory, before any cd: inside
  # the subshell below, $PWD is already the temp dir.
  local dest
  case "$out" in /*) dest="$out" ;; *) dest="$PWD/$out" ;; esac
  local theme work d
  theme="$(mktemp -d)"; work="$(mktemp -d)"
  git clone --depth 1 --branch "$theme_ref" "$theme_url" "$theme"
  rsync -a --exclude '.git' ./ "$work/"                    # your site, as Pages sees it
  for d in _layouts _includes _sass assets; do             # exactly what remote_theme delivers
    rsync -a --ignore-existing "$theme/$d/" "$work/$d/"
  done
  rm -rf "$work/_plugins"                                  # Pages safe mode
  ( cd "$work" && bundle exec jekyll build --strict_front_matter -d "$dest" )
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
be absent unless you committed static stubs for them. Their presence locally but not on Pages is the classic divergence this recipe prevents.
- **No theme-repo routes** — `_site/AGENTS/`, `_site/features/` and `_site/fr/`
must not exist (unless your own site has those pages). They come from files in the theme *repo* that `remote_theme` never delivers.
- **No theme data** — `$BUILD_DIR/_data/navigation/docs.yml` must not exist unless
your site ships its own; the theme's `_data/` is never merged into a Pages build.
- **Run a link checker** over `_site` and treat theme-injected 404s as build
  failures, so a regression surfaces in CI rather than for a visitor.

```bash
for p in AGENTS features fr; do test ! -e "_site/$p" || { echo "leaked: /$p/"; exit 1; }; done
```

## See also

- [Remote-Theme Consumer Checklist](/docs/deployment/remote-theme-checklist/) — the
  files and config to add when consuming the theme via `remote_theme`.
- [Deployment overview](/docs/deployment/) — hosting options and trade-offs.
