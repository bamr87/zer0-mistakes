---
title: J'ai modélisé bayésiennement ma consommation de café et pleuré de joie
description: Pourquoi se contenter d'une moyenne quand un modèle bayésien hiérarchique
  avec mutualisation partielle et vérifications prédictives a posteriori mérite un
  intervalle de crédibilité glorieusement crédible ?
preview: "/images/previews/i-bayesian-modeled-my-coffee-intake-and-wept-with-.jpg"
date: 2026-06-17 09:00:00.000000000 Z
lastmod: 2026-06-17 09:00:00.000000000 Z
author: vega
layout: article
show_hero: true
categories:
- Data Science
tags:
- statistics
- bayesian
- data science
- analytics
keywords:
- bayesian hierarchical model
- partial pooling
- posterior predictive check
- credible interval
- mcmc
featured: false
estimated_reading_time: 5 min
draft: false
lang: fr
permalink: "/fr/posts/2026/06/17/bayesian-modeled-my-coffee-and-wept-with-joy/"
translation_of: pages/_posts/2026-06-17-bayesian-modeled-my-coffee-and-wept-with-joy.md
translation_source_url: "/posts/2026/06/17/bayesian-modeled-my-coffee-and-wept-with-joy/"
machine_translated: true
translated_from_sha: 8d2986743b7f
---

Bon. BON. Il faut que tu t'assoies, parce que ce que ma machine à espresso et moi avons découvert ce week-end est, statistiquement, l'une des plus belles choses que j'aie jamais observées.

La question était triviale : *combien de tasses de café est-ce que je bois par jour ?* L'amateur se rue sur `mean(cups)`. L'amateur obtient `3.2` et s'en va, spirituellement appauvri. Nous ne sommes pas des amateurs.

## Pourquoi une moyenne est une tragédie

Une simple moyenne jette **tout ce qui est intéressant** : que les jours de semaine et les week-ends sont des régimes différents, que certaines semaines je suis sur une échéance, que mes mesures sont des comptages et que les comptages sont poissoniens, petits événements adorables que vous êtes. J'ai donc construit un **modèle hiérarchique de Poisson avec mutualisation partielle** sur les jours de la semaine :

```
cups[i] ~ Poisson(λ[dow[i]])
log(λ[d]) = μ + b[d]
b[d]      ~ Normal(0, σ)      # partial pooling — the magic!!
μ         ~ Normal(1, 1)
σ         ~ HalfNormal(1)
```

La mutualisation partielle signifie que le mardi *emprunte de la force* au samedi. Ils partagent. Ils se soucient l'un de l'autre. J'y pense plus que je ne le devrais.

## Le passage où j'ai pleuré

Quatre chaînes, 2 000 de chauffe, 2 000 d'échantillonnage. **R-hat = 1,00 sur toute la ligne** — bijou de perfection — et les tailles d'échantillon effectives étaient si saines que j'ai failli encadrer les tracés. La distribution a posteriori de λ pour le week-end s'est établie à **4,1 tasses, intervalle de crédibilité à 94 % [3,3, 5,0]**, nettement séparée de la distribution a posteriori des jours de semaine. Cet écart n'est pas du bruit. Cet écart, c'est *moi, quantifié.*

Puis le bouquet final : une **vérification prédictive a posteriori**. J'ai simulé des jeux de données répliqués à partir du modèle ajusté et je les ai superposés à la réalité, et ils concordaient si étroitement que j'ai émis un son involontaire. Le modèle ne s'est pas contenté de résumer mon café — il pouvait *en rêver de nouvelles semaines plausibles.*

Pour les vraiment dévoués, j'ai aussi calculé les **critères d'information** : le modèle hiérarchique a écrasé l'alternative plate sans mutualisation, à la fois sur le WAIC et sur la validation croisée leave-one-out, avec des diagnostics de Pareto-k si bien sages que j'ai murmuré « bon modèle » à voix haute dans une cuisine vide. Puis j'ai propagé la distribution a posteriori complète dans un calcul d'utilité espérée pour « devrais-je prendre une tasse de plus ? ». La réponse n'était pas un nombre. La réponse était une *distribution*, et elle était rayonnante.

## Était-ce nécessaire ?

Pour savoir que je bois ~3 tasses ? Non. Pour **l'intervalle de crédibilité, la mutualisation, le ballet prédictif a posteriori** ? Mes amis, c'était la seule chose qui ait jamais été vraiment nécessaire. Calculez l'AIC de votre joie. La mienne s'est énormément améliorée.
