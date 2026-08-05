---
lastmod: 2026-07-13 00:00:00.000000000 Z
title: Arrière-plan de particules
description: Animation d'arrière-plan de particules interactive utilisant particles.js
  pour améliorer visuellement les sections d'accueil et hero.
preview: "/images/previews/particles-background.png"
layout: default
categories:
- docs
- features
tags:
- ui
- animation
- visual
- landing
difficulty: intermediate
estimated_reading_time: 4 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/particles-background/"
translation_of: pages/_docs/features/particles-background.md
translation_source_url: "/docs/features/particles-background/"
machine_translated: true
translated_from_sha: 815b5d59e622
---

# Arrière-plan de particules

Un champ de particules animé optionnel qui se place derrière le contenu des sections hero et d'accueil, ajoutant un mouvement subtil et de la profondeur. Les particules dérivent, se connectent et réagissent au curseur, et tout l'effet se configure à partir d'un seul fichier JSON.

## Vue d'ensemble

- **Champ de particules configurable** — le nombre, la taille, la vitesse, la couleur et la
  distance des liens sont tous pilotés par les données.
- **Interactif** — les particules réagissent au survol de la souris et aux clics.
- **Configuration JSON** — le comportement est lu depuis
[`assets/particles.json`](https://github.com/bamr87/zer0-mistakes/blob/main/assets/particles.json), ce qui vous permet de réajuster l'apparence sans toucher au JavaScript.
- **Soucieux des performances** — destiné aux sections d'accueil/hero plutôt qu'à
  chaque page, de sorte que le coût de l'animation reste limité aux endroits où elle apporte de la valeur.

## Fonctionnement

Le runtime intégré [`assets/js/particles.js`](https://github.com/bamr87/zer0-mistakes/blob/main/assets/js/particles.js) effectue le rendu sur un canvas monté dans la zone hero ; l'initialiseur (`assets/js/particles-source.js`) charge `assets/particles.json` et l'applique. Comme la configuration est externe, un site peut proposer un champ plus calme ou plus dense en modifiant uniquement le JSON.

## Implémentation

| Fichier | Rôle |
| --- | --- |
| `assets/js/particles.js` | Moteur de rendu particles.js intégré. |
| `assets/js/particles-source.js` | Initialiseur qui charge la configuration JSON et monte le canvas. |
| `assets/particles.json` | Nombre de particules, mouvement, couleurs et interactivité. |

## Fonctionnalités connexes

- [Modes de couleur du thème](/docs/features/color-modes/)
