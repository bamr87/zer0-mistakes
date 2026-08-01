---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Personnalisation
description: Personnalisez le thème Jekyll Zer0-Mistakes — mises en page, styles,
  navigation et plus encore.
preview: "/images/previews/customization.png"
layout: default
categories:
- docs
- customization
tags:
- customization
- layouts
- styles
- navigation
difficulty: intermediate
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/customization/"
translation_of: pages/_docs/customization/index.md
translation_source_url: "/docs/customization/"
machine_translated: true
translated_from_sha: b64ef8d39a86
---

# Personnalisation

Personnalisez le thème Zer0-Mistakes pour l'adapter à votre marque et à vos besoins.

## Domaines de personnalisation

| Domaine | Emplacement | Description |
|------|----------|-------------|
| **Mises en page** | `_layouts/` | Modèles et structure des pages |
| **Styles** | `_sass/` | Personnalisation CSS/SCSS |
| **Navigation** | `_data/navigation/` | Configuration du menu et de la barre latérale |
| **Composants** | `_includes/` | Composants HTML réutilisables |

## Personnalisations rapides

### Identité du site

Mettez à jour `_config.yml` :

```yaml
title: "Your Site Title"
subtitle: "Your tagline"
description: "Site description for SEO"
preview: /images/previews/customization.png
author:
  name: "Your Name"
  email: "you@example.com"
  bio: "About the author"
logo: /assets/images/logo.png
```

### Couleurs et image de marque

Créez ou modifiez `_sass/custom.scss` :

```scss
// Override Bootstrap variables
$primary: #your-color;
$secondary: #your-color;

// Custom styles
body {
  font-family: 'Your Font', sans-serif;
}
```

### Navigation

Modifiez les fichiers dans `_data/navigation/` :

```yaml
# _data/navigation/main.yml
- title: "Home"
  url: /
- title: "Blog"
  url: /blog/
- title: "Docs"
  url: /docs/
```

## Guides de cette section

- **[Mises en page](layouts/)** — Créer et personnaliser les modèles de pages
- **[Styles](styles/)** — Personnalisation CSS et thématisation
- **[Navigation](navigation/)** — Configurer les menus et les barres latérales

## Hiérarchie des mises en page

```text
root.html          ← Base HTML structure
└── default.html   ← Main wrapper with navigation
    ├── home.html      ← Homepage layout
    ├── journals.html  ← Blog posts
    ├── collection.html ← Collection pages
    └── landing.html   ← Full-width landing pages
```

## Remplacer les fichiers du thème

Pour remplacer n'importe quel fichier du thème :

1. Créez le même chemin de fichier dans votre site
2. Jekyll utilise votre version au lieu de celle du thème

Exemple : remplacez le pied de page en créant `_includes/core/footer.html`.

## Étapes suivantes

- [Guide des mises en page](layouts/) — Modèles de pages
- [Guide des styles](styles/) — Personnalisation CSS
- [Guide de navigation](navigation/) — Configuration du menu

## Référence technique

Pour les détails destinés aux contributeurs (architecture SCSS, catalogue des jetons de design, modèles d'extension compatibles avec les forks) :

- [Étendre le thème → docs/ui/extending.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/extending.md)
- [Personnalisation de l'interface → docs/ui/customization.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/customization.md)

## Voir aussi

- [[Bootstrap Integration]]
- [[Features]]
- [[Liquid]]
- [[Jekyll]]
