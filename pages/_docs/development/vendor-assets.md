---
lastmod: 2026-04-18T19:29:54.000Z
title: Vendor assets
description: How third-party CSS and JavaScript are bundled under assets/vendor for GitHub Pages and how to refresh them.
layout: default
categories:
  - docs
  - development
tags:
  - assets
  - bootstrap
  - github-pages
permalink: /docs/development/vendor-assets/
difficulty: intermediate
estimated_reading_time: 10 minutes
prerequisites: []
sidebar:
  nav: docs
---

# Vendor assets (local bundles)

Third-party libraries (Bootstrap, jQuery, Bootstrap Icons, MathJax, Mermaid, Font Awesome, GitHub Calendar, etc.) are **committed** under `assets/vendor/`. **GitHub Pages’ default Jekyll build does not run `npm` or `curl`**, so everything the theme needs at runtime must be present in the repository (or in the published gem).

## Refreshing vendor files (maintainers)

1. **Manifest:** `vendor-manifest.json` lists curl-based assets (Bootstrap, MathJax, etc.) with SHA-256 checksums.
2. **Mermaid (npm only):** The theme does **not** download Mermaid from jsDelivr. Install the package and copy the built `dist` file:

   ```bash
   npm install
   npm run vendor:mermaid
   ```

   `scripts/vendor-install.sh` also runs this copy step **after** manifest downloads when `node_modules/mermaid` is present.

3. **Full vendor refresh:** From the repo root:

   ```bash
   npm install
   ./scripts/vendor-install.sh
   ```

   Options: `--force` (re-download manifest files), `--dry-run`, `--verbose`.

4. **Dependencies:** `curl`, `jq`, and `sha256sum` or `shasum` (macOS). Node/npm for Mermaid. The dev Docker image installs `jq` for this workflow.

5. **npm shortcut for manifest-only downloads:**

   ```bash
   npm run vendor:install
   ```

After upgrading versions, update `package.json` / lockfile for Mermaid or the manifest for curl assets, then commit changes under `assets/vendor/`.

## Optional npm Bootstrap build (advanced)

`npm run css:bootstrap` compiles Bootstrap SCSS into `assets/css/vendor/bootstrap-from-npm.css`. The **default** theme does **not** use this file; it uses `assets/vendor/bootstrap/css/bootstrap.min.css`. Do not link both full Bootstrap stylesheets.

## Related includes

- `_includes/core/head.html` — Bootstrap CSS, Bootstrap Icons, MathJax, `main.css`
- `_includes/components/js-cdn.html` — jQuery, Bootstrap bundle
- `_includes/components/mermaid.html` — Mermaid + Font Awesome (when `mermaid: true`)
- `_config.yml` — `mermaid.src` points at the local `mermaid.min.js` path
