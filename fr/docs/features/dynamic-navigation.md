---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Navigation dynamique basée sur les collections
description: Navigation sans configuration qui alimente automatiquement la barre de
  navigation à partir des collections Jekyll lorsqu'aucune entrée _data/navigation
  n'existe, afin que les sites tout neufs disposent d'un menu utilisable.
preview: "/images/previews/dynamic-collection-based-navigation.png"
layout: default
categories:
- docs
- features
tags:
- navigation
- ui
- zero-config
- jekyll
difficulty: beginner
estimated_reading_time: 6 minutes
sidebar:
  nav: docs
mermaid: true
lang: fr
permalink: "/fr/docs/features/dynamic-navigation/"
translation_of: pages/_docs/features/dynamic-navigation.md
translation_source_url: "/docs/features/dynamic-navigation/"
machine_translated: true
translated_from_sha: 1224dc4dea33
---

# Navigation dynamique basée sur les collections

zer0-mistakes fournit un **repli de navigation sans configuration** : lorsqu'aucune entrée `_data/navigation.yml` personnalisée n'existe pour la barre de navigation, le thème découvre automatiquement vos collections Jekyll et génère un menu de navigation fonctionnel au premier lancement.

![La barre de navigation supérieure avec le menu déroulant « Quick Start » ouvert, révélant les liens enfants générés automatiquement (Machine Setup, Jekyll Setup, GitHub Setup)](/assets/images/docs/features/dynamic-navigation.png)

## Pourquoi cela existe

Les nouveaux sites n'ont pas encore de données de navigation. Sans ce repli, les visiteurs verraient une barre de navigation vide. Le repli dynamique génère automatiquement des liens utiles afin que chaque nouveau site démarre avec une structure navigable.

## Fonctionnement

```mermaid
graph TD
    A[Page render] --> B{navigation.yml entry?}
    B -- Yes --> C[Render static nav from data file]
    B -- No --> D[menu-collections.html fallback]
    D --> E[Iterate site.collections]
    E --> F[Skip hidden/system collections]
    F --> G[Render collection links]
```

### Includes clés

| Fichier | Rôle |
|---|---|
| `_includes/navigation/navbar.html` | Barre de navigation principale — vérifie les données, se rabat sur les collections |
| `_includes/navigation/menu-collections.html` | Génère un lien par collection |

### Logique de la barre de navigation (simplifiée)

```liquid
{% raw %}{% if site.data.navigation.main %}
  {% include navigation/nav_list.html nav=site.data.navigation.main %}
{% else %}
  {% include navigation/menu-collections.html %}
{% endif %}{% endraw %}
```

## Configurer une navigation statique

Une fois prêt à figer le menu, créez `_data/navigation.yml` :

```yaml
main:
  - title: "Home"
    url: "/"
  - title: "Docs"
    url: "/docs/"
  - title: "Posts"
    url: "/posts/"
```

Le repli est silencieusement désactivé dès que ce fichier est présent.

## Exclure des collections du repli

Les collections préfixées par `_` dans la configuration du site peuvent être masquées en définissant `output: false` ou en les ajoutant à la liste d'exclusion à l'intérieur de `menu-collections.html` :

```liquid
{% raw %}{% unless collection.label == "notes" or collection.label == "quickstart" %}
  ...
{% endunless %}{% endraw %}
```

## Navigation latérale

La barre latérale utilise une clé `_data/navigation.yml` distincte (`docs`, `sidebar`, etc.) et n'est pas affectée par le repli dynamique. Consultez le guide [Navigation latérale](/docs/features/sidebar-navigation/) pour plus de détails.

## Voir aussi

- [Navigation latérale](/docs/features/sidebar-navigation/)
- [Navigation modulaire ES6](/docs/features/navigation-architecture/)

## Voir aussi

- [[Features]]
- [[Navigation]]
