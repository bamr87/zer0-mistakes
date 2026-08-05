---
title: Configuration du favicon et de l'identité de navigateur
description: Favicon, icône Apple touch, manifeste web et balises theme-color pilotés
  par la configuration et générés sur chaque page, avec une solution de repli /favicon.ico
  sans configuration.
keywords:
- favicon
- browser identity
- apple touch icon
- web manifest
- theme color
- svg favicon
- jekyll theme
lastmod: 2026-07-22 00:00:00.000000000 Z
layout: default
categories:
- docs
- features
tags:
- seo
- branding
- configuration
difficulty: beginner
estimated_reading_time: 4 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/favicon/"
translation_of: pages/_docs/features/favicon.md
translation_source_url: "/docs/features/favicon/"
machine_translated: true
translated_from_sha: 264da6b68023
---

# Favicon et identité de navigateur

Le thème génère les balises d'identité de navigateur — favicon, icône SVG évolutive, icône Apple touch, manifeste web et `theme-color` — depuis `_includes/core/favicon.html`, incluses dans l'en-tête du document sur chaque page.

## Pourquoi les balises explicites sont importantes

Avant l'existence de cette inclusion, les sites s'appuyaient sur la sonde `/favicon.ico` *implicite* du navigateur. Celle-ci échoue silencieusement de trois façons :

- Un site sans `favicon.ico` à la racine affiche le globe générique du navigateur et enregistre une erreur 404 à chaque visite.
- Les déploiements de pages de projet avec un `baseurl` ne résolvent jamais `/favicon.ico` à la racine du domaine.
- Il n'existe aucun moyen de fournir implicitement une icône SVG, une icône d'écran d'accueil iOS ou un manifeste PWA.

## Comportement sans configuration

Sans aucune configuration, chaque page référence `/favicon.ico` explicitement (résolue via `relative_url`, afin que les sites `baseurl` fonctionnent), et `theme-color` se replie sur votre jeton de design `theme_color.main` afin que la barre d'adresse mobile corresponde à la palette du site.

Conservez un `favicon.ico` à la racine de votre site — une icône 32×32 suffit.

## Configuration complète

Toutes les clés sont facultatives. Ajoutez un bloc `favicon:` à `_config.yml` :

```yaml
favicon:
  ico         : /favicon.ico                    # legacy .ico (default)
  svg         : /assets/images/favicon.svg      # scalable icon, preferred by modern browsers
  png         : /assets/images/favicon-32.png   # PNG icon
  png_size    : 32x32                           # sizes attribute for the png entry
  apple_touch : /assets/images/apple-touch.png  # iOS home-screen icon (180×180 or larger)
  manifest    : /site.webmanifest               # PWA manifest
  theme_color : "#0d1117"                       # browser chrome color (falls back to theme_color.main)
```

Ce qui produit :

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
<link rel="icon" type="image/png" href="/assets/images/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/images/apple-touch.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0d1117">
```

## Recommandations

- **Le SVG d'abord.** Une icône SVG carrée reste nette à toutes les tailles et peut respecter `prefers-color-scheme`. Conservez le `.ico` comme solution de repli héritée.
- **Réutilisez votre marque.** Si votre `logo` est déjà un SVG carré, pointez `favicon.svg` vers le même fichier.
- **Les icônes Apple touch ne se réduisent pas bien à partir de sources minuscules.** Utilisez au moins un PNG 180×180.
- **Utilisateurs de remote-theme** : cette inclusion est fournie avec le thème — vous ne portez que les *ressources* d'icônes et le bloc `favicon:` facultatif dans votre propre dépôt.
