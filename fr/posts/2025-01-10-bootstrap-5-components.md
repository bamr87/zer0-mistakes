---
lastmod: 2026-04-18 19:30:07.000000000 Z
title: Composants Bootstrap 5 pour des thèmes Jekyll modernes
description: Découvrez les composants et modèles Bootstrap 5 essentiels pour créer
  des thèmes Jekyll responsives avec un design d'interface professionnel.
categories:
- Technology
- Tutorial
tags:
- bootstrap
- css
- web-design
- responsive
date: 2025-01-10 14:30:00.000000000 Z
layout: article
preview: "/images/info-banner-mountain-wizard.png"
author: Zer0-Mistakes Team
featured: true
estimated_reading_time: 10 minutes
lang: fr
permalink: "/fr/posts/2025/01/10/bootstrap-5-components/"
translation_of: pages/_posts/2025-01-10-bootstrap-5-components.md
translation_source_url: "/posts/2025/01/10/bootstrap-5-components/"
machine_translated: true
translated_from_sha: 24af55442ab5
---

Bootstrap 5 est le compagnon idéal des thèmes Jekyll. Dans cet article, nous explorerons les composants Bootstrap les plus utiles pour créer des sites Jekyll modernes et responsives.

## L'avantage de Bootstrap 5

Bootstrap 5 apporte plusieurs améliorations :

- **Aucune dépendance à jQuery** : JavaScript vanilla pur
- **Système de grille amélioré** : de meilleurs utilitaires responsives
- **Formulaires enrichis** : des contrôles de formulaire plus accessibles
- **Nouvelle API d'utilitaires** : personnalisez facilement les utilitaires
- **Prise en charge RTL** : support des langues de droite à gauche

## Composants essentiels pour Jekyll

### Navigation

La barre de navigation Bootstrap est parfaite pour les sites Jekyll :

```html
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container">
    <a class="navbar-brand" href="/">{{ site.title }}</a>
    <button
      class="navbar-toggler"
      data-bs-toggle="collapse"
      data-bs-target="#nav"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <!-- Navigation items -->
    </div>
  </div>
</nav>
```

### Cartes pour le contenu

Les cartes sont des conteneurs polyvalents pour les articles de blog :

```html
<div class="card h-100">
  <img src="{{ post.preview }}" class="card-img-top" />
  <div class="card-body">
    <h5 class="card-title">{{ post.title }}</h5>
    <p class="card-text">{{ post.excerpt }}</p>
  </div>
</div>
```

## Utilitaires responsives

Les utilitaires responsives de Bootstrap facilitent la conception mobile-first :

- `d-none d-lg-block` - Masquer sur mobile, afficher sur les grands écrans
- `col-12 col-md-6 col-lg-4` - Largeurs de colonnes responsives
- `text-center text-md-start` - Alignement de texte responsive

Commencez dès aujourd'hui à créer de superbes sites Jekyll avec Bootstrap 5 !
