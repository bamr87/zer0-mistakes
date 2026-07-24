---
lastmod: 2026-07-13 00:00:00.000000000 Z
title: Superposition de build en mode sécurisé (compiler en dehors de GitHub Pages)
description: La recette pour compiler un site à thème distant Zer0-Mistakes dans votre
  propre CI — cloner le thème, superposer votre contenu, supprimer les plugins et
  exécuter un build strict.
preview: "/images/previews/safe-mode-build-overlay-building-outside-github-pa.png"
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
difficulty: intermediate
estimated_reading_time: 8 minutes
prerequisites:
- A site that consumes Zer0-Mistakes via remote_theme
- A CI runner (GitHub Actions, GitLab CI, etc.)
author: bamr87
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/deployment/build-overlay/"
translation_of: pages/_docs/deployment/build-overlay.md
translation_source_url: "/docs/deployment/build-overlay/"
machine_translated: true
translated_from_sha: fb72cf0bff9e
---

# Superposition de build en mode sécurisé

**Ce que vous allez faire :** reproduire un build GitHub Pages de votre site à thème distant dans votre propre CI, afin qu'un pipeline personnalisé (mise en cache, vérification des liens, builds multi-sites) génère exactement ce que Pages produirait — ni plus, ni moins.

## Pourquoi c'est nécessaire

Lorsque vous compilez *en dehors* de GitHub Pages — votre propre GitHub Actions, GitLab CI, ou un `jekyll build` local — rien ne reproduit à votre place les deux contraintes de Pages :

1. `remote_theme` ne fournit que `_layouts/`, `_includes/`, `_sass/` et
   `assets/`. Vos `_config.yml`, `_data/` et votre contenu restent locaux.
2. Pages exécute Jekyll en **mode sécurisé**, ce qui **ignore `_plugins/*.rb`**. Les
générateurs du thème (recherche, sitemap, pages d'auteur, aperçus) ne s'exécutent jamais lors d'un build consommateur Pages.

Si votre build personnalisé *ne supprime pas* `_plugins`, vous obtenez localement des pages qui renvoient une 404 sur le vrai site Pages — le build et la production divergent silencieusement. La recette de superposition fait correspondre exactement votre build CI à Pages. (Pour les fichiers que Pages ne fournit *pas*, consultez la [liste de contrôle du consommateur de thème distant](/docs/deployment/remote-theme-checklist/).)

## La recette

Quatre étapes : **cloner le thème → superposer votre contenu par-dessus → supprimer `_plugins` → build strict.**

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

La sortie dans `$BUILD_DIR/_site` est ce qu'un vrai consommateur Pages servirait.

> **Pourquoi strict ?** `--strict_front_matter` fait échouer le build sur un bloc de front matter
> malformé au lieu d'ignorer silencieusement la page — le même mode d'échec que
> vous voulez détecter en CI plutôt que de découvrir en production.

## En tant qu'étape CI réutilisable

Encapsulez la recette dans une fonction pour que plusieurs jobs puissent la partager :

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

Dans GitHub Actions :

```yaml
- name: Build (safe-mode overlay)
  run: |
    source scripts/ci/build.sh   # defines lh_overlay
    lh_overlay "v1.20.2" "_site"

- name: Link-check the built site
  run: npx --yes linkinator _site --silent --recurse
```

## Vérifier que la superposition correspond à Pages

Après le build, assurez-vous que vous n'avez rien livré que Pages ne servirait pas :

- **Aucune route dépendant uniquement des plugins** — `/search.json`, `/sitemap/`, `/authors/` etc. devraient
être absentes à moins que vous n'ayez commité des stubs statiques pour elles. Leur présence en local mais pas sur Pages est la divergence classique que cette recette évite.
- **Exécutez un vérificateur de liens** sur `_site` et traitez les 404 injectées par le thème comme des
  échecs de build, afin qu'une régression apparaisse en CI plutôt que pour un visiteur.

## Voir aussi

- [Liste de contrôle du consommateur de thème distant](/docs/deployment/remote-theme-checklist/) — les
  fichiers et la configuration à ajouter lors de la consommation du thème via `remote_theme`.
- [Vue d'ensemble du déploiement](/docs/deployment/) — options d'hébergement et compromis.
