---
title: Front Matter
description: Comment utiliser le front matter pour les pages, articles et collections
  Jekyll.
preview: "/images/previews/front-matter.png"
layout: default
categories:
- docs
- jekyll
tags:
- front-matter
- yaml
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites: []
lastmod: 2026-06-14 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/front-matter/"
translation_of: pages/_docs/front-matter.md
translation_source_url: "/docs/front-matter/"
machine_translated: true
translated_from_sha: ce72cd558f51
---

# Front Matter

Le front matter est constitué de métadonnées YAML placées en tête des fichiers Markdown ou HTML, qui contrôlent la façon dont Jekyll traite le contenu.

## Structure de base

```yaml
---
title: "My Page Title"
layout: default
permalink: /my-page/
---

Your content starts here...
```

## Champs obligatoires

### Pour toutes les pages

```yaml
---
title: "Page Title"      # Required: Displayed in browser tab and headings
layout: default          # Required: Template to use from _layouts/
---
```

### Pour les articles de blog

```yaml
---
title: "Post Title"
layout: article
date: 2025-01-15         # Required for posts: Publication date
---
```

## Champs optionnels courants

### SEO et métadonnées

```yaml
---
description: "A brief description for search engines (150-160 chars)"
author: "Your Name"
lastmod: 2026-06-14T00:00:00.000Z
keywords:
  primary: ["keyword1", "keyword2"]
  secondary: ["keyword3"]
---
```

### Organisation

```yaml
---
categories:
    - category1
    - subcategory
tags:
    - tag1
    - tag2
    - tag3
permalink: /custom-url/   # Override default URL
---
```

### Options d'affichage

```yaml
---
preview: /images/previews/front-matter.png
toc: true                       # Show table of contents
comments: true                  # Enable comments (if configured)
sidebar:
    nav: docs                   # Use 'docs' navigation in sidebar
---
```

## Options de mise en page

Mises en page disponibles dans Zer0-Mistakes :

| Mise en page | Objectif |
|--------|---------|
| `default` | Page standard avec barre latérale |
| `journals` | Articles de blog avec affichage des métadonnées |
| `home` | Mise en page de la page d'accueil |
| `collection` | Pages d'index de collection |
| `landing` | Pages d'atterrissage pleine largeur |

## Champs spécifiques aux collections

### Documentation (`_docs`)

```yaml
---
difficulty: beginner          # beginner, intermediate, advanced
estimated_reading_time: "10 minutes"
prerequisites:
    - Docker installed
    - Basic Jekyll knowledge
lastmod: 2026-06-14T00:00:00.000Z
---
```

### Articles de blog (`_posts`)

```yaml
---
excerpt: "Custom excerpt for listings"
preview: /images/previews/front-matter.png
featured: true               # Feature on homepage
---
```

## Barre latérale de navigation

Contrôlez quelle navigation apparaît dans la barre latérale :

```yaml
---
sidebar:
    nav: docs      # Uses _data/navigation/docs.yml
---
```

Fichiers de navigation disponibles :

- `main` - Navigation principale du site
- `docs` - Barre latérale de documentation
- `quickstart` - Guide de démarrage rapide

## Exemples

### Page de documentation complète

```yaml
---
title: "Installation Guide"
description: "Step-by-step installation instructions"
layout: default
categories:
    - docs
    - setup
tags:
    - installation
    - docker
permalink: /docs/installation/
difficulty: beginner
estimated_reading_time: "10 minutes"
prerequisites:
    - Docker Desktop
lastmod: 2026-06-14T00:00:00.000Z
sidebar:
    nav: docs
---
```

### Article de blog complet

```yaml
---
title: "Getting Started with Jekyll"
description: "Learn the basics of Jekyll static site generation"
layout: article
date: 2025-01-15
lastmod: 2026-06-14T00:00:00.000Z
author: "Amr"
categories:
    - tutorials
    - jekyll
tags:
    - jekyll
    - getting-started
preview: /images/previews/front-matter.png
comments: true
---
```

## Ressources connexes

- [Guide Jekyll](/docs/jekyll/)
- [Configuration Jekyll](/docs/jekyll/)
- [Templates Liquid](/docs/liquid/)

## Voir aussi

- [[Jekyll]]
- [[Liquid]]
- [[SEO]]
- [[Customization]]
