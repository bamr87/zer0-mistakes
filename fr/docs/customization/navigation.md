---
lastmod: 2026-04-18 19:29:53.000000000 Z
title: Navigation
description: Configurez les menus de navigation et les barres latérales dans le thème
  Jekyll Zer0-Mistakes.
preview: "/images/previews/navigation.png"
layout: default
categories:
- docs
- customization
tags:
- navigation
- menus
- sidebar
difficulty: intermediate
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/customization/navigation/"
translation_of: pages/_docs/customization/navigation.md
translation_source_url: "/docs/customization/navigation/"
machine_translated: true
translated_from_sha: 3ff754c43c15
---

# Navigation

Configurez les menus de navigation et les barres latérales de votre site.

## Fichiers de navigation

La navigation est configurée dans `_data/navigation/` :

```text
_data/navigation/
├── main.yml      # Top navigation bar
├── docs.yml      # Documentation sidebar
├── quickstart.yml # Quick start sidebar
└── about.yml     # About section sidebar
```

## Navigation principale

Modifiez `_data/navigation/main.yml` :

```yaml
- title: "Home"
  url: /

- title: "Blog"
  url: /blog/

- title: "Docs"
  url: /docs/

- title: "About"
  url: /about/

# Dropdown menu
- title: "Resources"
  children:
    - title: "Tutorials"
      url: /tutorials/
    - title: "API Reference"
      url: /api/
    - title: "Examples"
      url: /examples/
```

## Navigation de la barre latérale

Modifiez `_data/navigation/docs.yml` :

```yaml
- title: "Getting Started"
  children:
    - title: "Installation"
      url: /docs/installation/
    - title: "Quick Start"
      url: /docs/getting-started/quick-start/
    - title: "Theme Guide"
      url: /docs/getting-started/theme-guide/

- title: "Features"
  children:
    - title: "Mermaid Diagrams"
      url: /docs/features/mermaid-diagrams/
    - title: "MathJax"
      url: /docs/features/mathjax-math/
    - title: "Comments"
      url: /docs/features/giscus-comments/

- title: "Customization"
  children:
    - title: "Layouts"
      url: /docs/customization/layouts/
    - title: "Styles"
      url: /docs/customization/styles/
    - title: "Navigation"
      url: /docs/customization/navigation/
```

## Utilisation de la barre latérale dans les pages

Indiquez la navigation à utiliser dans le front matter :

```yaml
---
title: "My Documentation Page"
sidebar:
  nav: docs
---
```

## Créer une nouvelle navigation

### Étape 1 : Créer le fichier de navigation

Créez `_data/navigation/tutorials.yml` :

```yaml
- title: "Beginner"
  children:
    - title: "Tutorial 1"
      url: /tutorials/beginner/part-1/
    - title: "Tutorial 2"
      url: /tutorials/beginner/part-2/

- title: "Advanced"
  children:
    - title: "Advanced Topic"
      url: /tutorials/advanced/topic/
```

### Étape 2 : Utiliser dans les pages

```yaml
---
title: "Tutorial Page"
sidebar:
  nav: tutorials
---
```

## Liens externes

Ajoutez des liens externes avec `external: true` :

```yaml
- title: "GitHub"
  url: https://github.com/bamr87/zer0-mistakes
  external: true

- title: "Documentation"
  url: https://docs.example.com
  external: true
```

## Mettre en évidence la page actuelle

Le thème met automatiquement en évidence la page actuelle dans la navigation. La page active reçoit la classe `active`.

## Sections repliables

Les sections de la barre latérale sont repliables par défaut. Pour garder une section dépliée :

```yaml
- title: "Always Open Section"
  expanded: true
  children:
    - title: "Page 1"
      url: /page-1/
```

## Icônes de navigation

Ajoutez des icônes avec Font Awesome ou Bootstrap Icons :

```yaml
- title: "Home"
  url: /
  icon: "bi bi-house"

- title: "Settings"
  url: /settings/
  icon: "bi bi-gear"
```

## Navigation conditionnelle

Affichez des éléments de navigation selon des conditions :

```yaml
- title: "Admin"
  url: /admin/
  show_if: "site.admin_enabled"
```

## Bonnes pratiques

1. **Restez simple** — Ne submergez pas les utilisateurs d'options
2. **Regroupement logique** — Regroupez les pages connexes
3. **Titres descriptifs** — Utilisez des titres clairs et concis
4. **Limitez la profondeur** — Évitez plus de 2 niveaux d'imbrication
5. **Testez sur mobile** — Assurez-vous que la navigation fonctionne sur les petits écrans
6. **Mettez à jour régulièrement** — Gardez la navigation synchronisée avec le contenu

## Référence

- [Fichiers de données Jekyll](https://jekyllrb.com/docs/datafiles/)
- [Navigation Bootstrap](https://getbootstrap.com/docs/5.3/components/navs-tabs/)

## Voir aussi

- [[Customization]]
- [[Sidebar Navigation System]]
- [[Breadcrumbs Navigation]]
