---
lastmod: 2026-04-18 19:29:54.000000000 Z
title: Ressources tierces
description: Comment le CSS et le JavaScript tiers sont regroupés sous assets/vendor
  pour GitHub Pages et comment les rafraîchir.
preview: "/images/previews/vendor-assets.png"
layout: default
categories:
- docs
- development
tags:
- assets
- bootstrap
- github-pages
difficulty: intermediate
estimated_reading_time: 10 minutes
prerequisites: []
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/vendor-assets/"
translation_of: pages/_docs/development/vendor-assets.md
translation_source_url: "/docs/development/vendor-assets/"
machine_translated: true
translated_from_sha: 7676f7374d66
---

# Ressources tierces (bundles locaux)

Les bibliothèques tierces (Bootstrap, jQuery, Bootstrap Icons, MathJax, Mermaid, Font Awesome, GitHub Calendar, etc.) sont **committées** sous `assets/vendor/`. **La build Jekyll par défaut de GitHub Pages n'exécute ni `npm` ni `curl`**, donc tout ce dont le thème a besoin à l'exécution doit être présent dans le dépôt (ou dans la gem publiée).

## Rafraîchir les fichiers tiers (mainteneurs)

1. **Manifeste :** `vendor-manifest.json` liste les ressources basées sur curl (Bootstrap, MathJax, etc.) avec des sommes de contrôle SHA-256.
2. **Mermaid (npm uniquement) :** Le thème ne télécharge **pas** Mermaid depuis jsDelivr. Installez le paquet et copiez le fichier `dist` compilé :

   ```bash
   npm install
   npm run vendor:mermaid
   ```

   `scripts/vendor-install.sh` exécute aussi cette étape de copie **après** les téléchargements du manifeste lorsque `node_modules/mermaid` est présent.

3. **Rafraîchissement complet des ressources tierces :** Depuis la racine du dépôt :

   ```bash
   npm install
   ./scripts/vendor-install.sh
   ```

   Options : `--force` (retélécharger les fichiers du manifeste), `--dry-run`, `--verbose`.

4. **Dépendances :** `curl`, `jq`, et `sha256sum` ou `shasum` (macOS). Node/npm pour Mermaid. L'image Docker de développement installe `jq` pour ce workflow.

5. **Raccourci npm pour les téléchargements du manifeste uniquement :**

   ```bash
   npm run vendor:install
   ```

Après la mise à niveau des versions, mettez à jour `package.json` / le lockfile pour Mermaid ou le manifeste pour les ressources curl, puis committez les changements sous `assets/vendor/`.

## Build npm optionnelle de Bootstrap (avancé)

`npm run css:bootstrap` compile le SCSS de Bootstrap en `assets/css/vendor/bootstrap-from-npm.css`. Le thème **par défaut** n'utilise **pas** ce fichier ; il utilise `assets/vendor/bootstrap/css/bootstrap.min.css`. Ne liez pas les deux feuilles de style Bootstrap complètes.

## Includes associés

- `_includes/core/head.html` — Bootstrap CSS, Bootstrap Icons, MathJax, `main.css`
- `_includes/components/js-cdn.html` — jQuery, bundle Bootstrap
- `_includes/components/mermaid.html` — Mermaid + Font Awesome (lorsque `mermaid: true`)
- `_config.yml` — `mermaid.src` pointe vers le chemin local `mermaid.min.js`

## Voir aussi

- [[Development]]
- [[Bootstrap Integration]]
- [[Dependency Updates]]
