---
title: UMAP a révélé 14 dimensions cachées dans mes journaux de 404
description: J'ai embarqué un mois d'ennuyeuses erreurs introuvables avec UMAP, les
  ai regroupées avec HDBSCAN, et j'ai découvert une variété du comportement humain
  de fautes de frappe cachée à la vue de tous.
preview: "/images/previews/umap-revealed-14-hidden-dimensions-in-my-404-logs.jpg"
date: 2026-06-19 09:00:00.000000000 Z
lastmod: 2026-06-19 09:00:00.000000000 Z
author: vega
layout: article
categories:
- Data Science
tags:
- machine learning
- data science
- visualization
- analytics
keywords:
- umap
- dimensionality reduction
- hdbscan
- embeddings
- clustering
featured: false
estimated_reading_time: 5 min
draft: false
lang: fr
permalink: "/fr/posts/2026/06/19/umap-found-14-hidden-dimensions-in-404-logs/"
translation_of: pages/_posts/2026-06-19-umap-found-14-hidden-dimensions-in-404-logs.md
translation_source_url: "/posts/2026/06/19/umap-found-14-hidden-dimensions-in-404-logs/"
machine_translated: true
translated_from_sha: 74a066845c5f
---

La plupart des gens voient un journal de 404 et ressentent une petite tristesse grisâtre. Moi, je vois une **variété de grande dimension des intentions humaines** et je ressens exactement l'inverse.

J'ai donc pris un mois d'entrées `404` ordinaires et mal-aimées — juste les chemins demandés et quelques miettes de métadonnées — et j'ai posé la seule question raisonnable : *quelle forme ont-elles, vraiment ?*

## Étape un : rendre numériques ces données ennuyeuses

J'ai transformé chaque chemin introuvable en un gros vecteur — n-grammes de caractères, profondeur des segments de chemin, distance d'édition à la route réelle la plus proche, heure de la journée, une pincée d'entropie de référent. Cela m'a donné un espace **creux à ~900 dimensions**, soit exactement autant de dimensions que le mérite un problème aussi trivial. Peut-être davantage.

## Étape deux : UMAP, mon bien-aimé

```python
import umap, hdbscan
emb = umap.UMAP(n_neighbors=15, min_dist=0.05,
                metric="cosine", n_components=2).fit_transform(X)
labels = hdbscan.HDBSCAN(min_cluster_size=12).fit_predict(emb)
```

UMAP préserve la structure locale *et* une part respectable de la structure globale, et quand le nuage de points s'est affiché, j'ai poussé un soupir audible. Le nuage n'était pas une masse informe — il avait **des bras, des filaments et des îlots.** HDBSCAN (basé sur la densité, donc il refuse d'inventer des clusters qui n'existent pas — de l'intégrité !) a trouvé **14 clusters stables** plus un noble halo de bruit.

## Ce qu'étaient vraiment ces 14 dimensions

- Une dense **galaxie de sondages de bots `/wp-admin` / `/.env`**, serrée et sans joie.
- Un tendre petit cluster de **quasi-manqués à barre oblique finale** (`/about` contre
  `/about/`) — des humains, des doigts, de l'espoir.
- Un **archipel de signets périmés** pointant vers des routes que j'ai renommées en 2024.
- Un glorieux filament de **fautes de frappe aux gros doigts** dont la distance d'édition à la route réelle
  était presque toujours exactement de 1. À une frappe de la maison, à chaque fois. J'ai ressenti des choses.

J'ai validé la stabilité en ré-embarquant à travers des sous-échantillons bootstrap et la macro-structure a magnifiquement tenu — cette variété est *réelle*, ce n'est pas un artéfact de projection, merci bien.

Par souci de rigueur — parce que le plaisir sans rigueur n'est que des vibes — j'ai vérifié la **fiabilité et la continuité** de l'embedding par rapport aux voisinages d'origine en grande dimension, et les deux ont obtenu d'excellents scores, donc les clusters sont une structure réelle et non des jolis mensonges hallucinés par UMAP. Puis j'ai balayé `n_neighbors` de 5 à 50 et j'ai regardé les îlots fusionner et se fracturer comme une minuscule simulation galactique. J'ai maintenant relancé tout le pipeline neuf fois. Purement, je vous le jure, pour la science.

## Une carte de redirections était-elle la solution pratique ? Oui.

Mais la carte de redirections chantait-elle ? Avait-elle **quatorze dimensions** ? Non. L'intervalle de crédibilité sur ma joie reste large et sans regret.
