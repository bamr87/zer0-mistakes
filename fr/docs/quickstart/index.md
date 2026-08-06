---
lastmod: 2026-06-23 00:00:00.000000000 Z
title: Guides de démarrage rapide Zer0-Mistakes
description: Choisissez le chemin le plus rapide vers un site Zer0-Mistakes en ligne
  — un démarrage avec thème distant en trois fichiers, le workflow fork-et-déploiement
  sur GitHub Pages, ou une série étape par étape.
preview: "/images/docs/quickstart/theme-home.png"
layout: default
categories:
- docs
- quickstart
tags:
- quickstart
- getting-started
- github-pages
- remote-theme
keywords:
- quickstart
- jekyll
- github-pages
- remote-theme
- theme
author: bamr87
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/quickstart/"
translation_of: pages/_docs/quickstart/index.md
translation_source_url: "/docs/quickstart/"
machine_translated: true
translated_from_sha: 2b6514fcc314
---

# Guides de démarrage rapide

Ce hub vous oriente vers l'itinéraire le plus rapide pour passer de zéro à un site Zer0-Mistakes publié. Chaque guide ci-dessous est autonome — commencez par celui qui correspond au niveau de contrôle que vous souhaitez.

![La page d'accueil du thème Zer0-Mistakes rendue en local, montrant la barre de navigation et la section héros](/assets/images/docs/quickstart/theme-home.png)

## Choisissez votre parcours

| Guide | Idéal pour | Durée |
| --- | --- | --- |
| [Démarrage minimal avec thème distant](/docs/quickstart/bare-minimum/) | Essayer le thème avec le moins de fichiers possible (`_config.yml`, `Gemfile`, `index.md`) | ~5 min |
| [Forker et déployer sur GitHub Pages](/docs/quickstart/fork-and-deploy/) | Un vrai site que vous possédez et personnalisez, déployé sur GitHub Pages | ~15 min |
| [Série de démarrage rapide étape par étape](/quickstart/) | Suivre le parcours de la configuration de la machine jusqu'à la personnalisation | ~30 min |

## Ce qu'il vous faut d'abord

Tous les parcours supposent que vous disposez :

- D'un compte [GitHub](https://github.com/).
- De [Git](https://git-scm.com/) installé en local (ou vous pouvez travailler entièrement dans l'interface web de GitHub pour le parcours avec thème distant).
- En option, de [Docker](https://www.docker.com/) pour la boucle de développement local recommandée.

Si vous n'avez jamais créé de site Jekyll auparavant, la [série de démarrage rapide étape par étape](/quickstart/) vous guide d'abord dans l'installation de ces outils.

## Deux façons d'utiliser le thème

Il existe deux modèles pris en charge, et les guides ci-dessus couvrent les deux :

1. **Thème distant** — votre dépôt ne conserve que votre contenu et
votre configuration, et récupère les mises en page/includes/styles depuis `bamr87/zer0-mistakes` au moment de la génération. Maintenance minimale ; commencez par le [Démarrage minimal](/docs/quickstart/bare-minimum/).
2. **Fork** — vous copiez l'intégralité du thème dans votre dépôt afin de pouvoir modifier
directement les mises en page et les styles. Contrôle maximal ; suivez [Forker et déployer](/docs/quickstart/fork-and-deploy/).

## Étapes suivantes

- Nouveau dans la structure du thème ? Lisez
  [l'aperçu de prise en main](/docs/getting-started/).
- Prêt à publier ? Chaque parcours se termine par la
  référence [Déployer sur GitHub Pages](/docs/deployment/github-pages/).
- Vous voulez personnaliser l'apparence ? Consultez le
  [Guide du thème](/docs/getting-started/theme-guide/).
