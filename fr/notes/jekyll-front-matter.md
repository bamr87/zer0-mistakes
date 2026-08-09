---
title: Référence du Front Matter Jekyll
description: Référence complète des variables de front matter Jekyll utilisées dans
  le thème Zer0-Mistakes, avec exemples et bonnes pratiques
layout: note
date: 2026-01-29 10:00:00.000000000 Z
lastmod: 2026-01-31 10:00:00.000000000 Z
categories:
- Notes
- Documentation
tags:
- jekyll
- yaml
- front-matter
- documentation
author: Zer0-Mistakes Team
difficulty: beginner
comments: true
lang: fr
permalink: "/fr/notes/jekyll-front-matter/"
translation_of: pages/_notes/jekyll-front-matter.md
translation_source_url: "/notes/jekyll-front-matter/"
machine_translated: true
translated_from_sha: ff5f5fc70714
---

## Qu'est-ce que le Front Matter ?

Le front matter est constitué de métadonnées YAML placées au début de tout fichier Jekyll (Markdown ou HTML). Il doit être la première chose dans le fichier et être encadré par des lignes composées de trois tirets.

```yaml
---
title: "My Page Title"
layout: default
---

Page content starts here...
```

---

## Variables principales

### Requises pour toutes les pages

```yaml
---
title: "Page Title"           # Required - Display title
layout: default               # Required - Template to use
---
```

### Variables optionnelles courantes

```yaml
---
title: "My Page"
description: "SEO description (150-160 characters)"
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
author: "Author Name"
permalink: /custom-url/
published: true                # Set to false to hide
draft: false                   # Draft status
---
```

---

## Variables spécifiques à la mise en page

### Articles de blog (`layout: article`)

```yaml
---
title: "Blog Post Title"
description: "Post description for SEO"
layout: article
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Category, Subcategory]
tags: [tag1, tag2, tag3]
author: "Author Name"

# Article-specific
post_type: standard           # standard, featured, breaking, tutorial
featured: false               # Feature on homepage
preview: /assets/images/preview.png  # Preview image
show_hero: false              # true → render preview as the article hero banner
                              # for any post_type (featured/breaking always show it)

# Engagement
comments: true                # Enable comments
share: true                   # Show share buttons
related: true                 # Show related posts

# Sidebar
sidebar: true
author_profile: true
read_time: true
---
```

### Documentation (`layout: default`)

```yaml
---
title: "Documentation Page"
description: "Doc page description"
layout: default
categories: [docs, category]
tags: [documentation]
permalink: /docs/page-name/

# Documentation-specific
difficulty: beginner          # beginner, intermediate, advanced
estimated_time: 10 minutes
prerequisites: []
updated: 2026-01-31

# Sidebar navigation
sidebar:
  nav: docs                   # Navigation group name
  # OR
  nav: auto                   # Auto-generate
  # OR
  nav: tree                   # Tree view

toc_sticky: true              # Sticky table of contents
---
```

### Notes (`layout: note`)

```yaml
---
title: "Note Title"
description: "Brief note description"
layout: note
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notes, Category]
tags: [reference, cheatsheet]
author: "Author Name"
difficulty: beginner
comments: true
permalink: /notes/note-name/
---
```

### Carnets (`layout: notebook`)

```yaml
---
title: "Jupyter Notebook Title"
description: "Notebook description"
layout: notebook
collection: notebooks
date: 2026-01-31T10:00:00.000Z
lastmod: 2026-01-31T10:00:00.000Z
categories: [Notebooks, Data Science]
tags: [python, pandas, jupyter]
author: "Author Name"

# Notebook-specific
jupyter_metadata: true        # Show kernel info
difficulty: intermediate

# Engagement
comments: true
share: true
related: true

permalink: /notebooks/notebook-name/
---
```

### Pages d'accueil (`layout: landing`)

```yaml
---
title: "Landing Page"
description: "Landing page description"
layout: landing
permalink: /landing/

# Hero section
hero:
  title: "Hero Title"
  subtitle: "Hero subtitle text"
  cta_text: "Get Started"
  cta_url: /quickstart/
  background: /assets/images/hero-bg.jpg

# Features section
features:
  - title: "Feature 1"
    description: "Feature description"
    icon: "bi-lightning"
---
```

---

## Variables d'organisation

### Catégories

Les catégories créent une organisation hiérarchique. Utilisez des tableaux pour plusieurs niveaux :

```yaml
# Single category
categories: Documentation

# Multiple categories (hierarchy)
categories: [Development, Jekyll, Themes]

# Will create URL: /categories/development/jekyll/themes/
```

### Étiquettes

Les étiquettes sont des libellés plats pour la découverte du contenu :

```yaml
# Single tag
tags: jekyll

# Multiple tags (array)
tags: [jekyll, ruby, static-site, tutorial]

# Alternative syntax
tags:
  - jekyll
  - ruby
  - static-site
```

---

## Variables SEO

```yaml
---
title: "Page Title"           # Used in <title> tag
description: "Meta description for search engines (150-160 chars)"

# Open Graph (Social sharing)
og_image: /assets/images/og-image.png
og_type: article              # website, article, etc.

# Twitter Cards
twitter_card: summary_large_image
twitter_image: /assets/images/twitter-card.png

# Canonical URL (prevent duplicates)
canonical_url: https://example.com/original-page/

# Robots
noindex: false                # Exclude from search engines
nofollow: false               # Don't follow links
---
```

---

## Variables de navigation

### Configuration de la barre latérale

```yaml
---
sidebar:
  nav: docs                   # Use named navigation from _data/navigation/
  
# OR auto-generate based on content
sidebar:
  nav: auto

# OR tree view
sidebar:
  nav: tree

# Disable sidebar
sidebar: false
---
```

### Table des matières

```yaml
---
toc: true                     # Enable ToC
toc_label: "Contents"         # Custom label
toc_icon: "list"              # Bootstrap icon
toc_sticky: true              # Stick to viewport
toc_levels: "1..3"            # Heading levels to include
---
```

---

## Formats de date

Jekyll accepte divers formats de date :

```yaml
# ISO 8601 (Recommended)
date: 2026-01-31T10:00:00.000Z

# Date only
date: 2026-01-31

# With timezone
date: 2026-01-31 10:00:00 -0500

# In filename
# 2026-01-31-post-title.md automatically sets date
```

---

## Variables personnalisées

Vous pouvez définir n'importe quelle variable personnalisée :

```yaml
---
title: "My Page"
layout: default

# Custom variables
project_version: "2.0.0"
github_repo: "user/repo"
demo_url: "https://demo.example.com"
sponsors:
  - name: "Sponsor 1"
    url: "https://sponsor1.com"
  - name: "Sponsor 2"
    url: "https://sponsor2.com"
---

<!-- Access in templates -->
Version: {{ page.project_version }}
Repo: {{ page.github_repo }}
```

---

## Valeurs par défaut spécifiques aux collections

Définissez des valeurs par défaut dans `_config.yml` pour éviter les répétitions :

```yaml
# _config.yml
defaults:
  # All pages
  - scope:
      path: ""
    values:
      layout: default
      author_profile: false

  # Posts collection
  - scope:
      path: pages/_posts
    values:
      layout: article
      comments: true
      share: true

  # Notes collection  
  - scope:
      path: pages/_notes
      type: notes
    values:
      layout: note
      comments: true
```

---

## Tableau de référence des variables

| Variable | Type | Description |
|----------|------|-------------|
| `title` | string | Titre de la page |
| `description` | string | Méta-description |
| `layout` | string | Nom du modèle |
| `date` | datetime | Date de publication |
| `lastmod` | datetime | Dernière modification |
| `author` | string | Nom de l'auteur |
| `categories` | array | Catégories de contenu |
| `tags` | array | Étiquettes de contenu |
| `permalink` | string | URL personnalisée |
| `published` | boolean | Statut de publication |
| `draft` | boolean | Statut de brouillon |
| `comments` | boolean | Activer les commentaires |
| `share` | boolean | Afficher les boutons de partage |
| `sidebar` | object/boolean | Config de la barre latérale |
| `toc` | boolean | Table des matières |
| `difficulty` | string | Difficulté du contenu |

---

## Bonnes pratiques

1. **Incluez toujours `title` et `layout`** - Ce sont des éléments essentiels pour un rendu correct

2. **Rédigez de bonnes descriptions** - Restez entre 150 et 160 caractères pour le SEO

3. **Utilisez des dates ISO 8601** - `2026-01-31T10:00:00.000Z` pour la cohérence

4. **Limitez les étiquettes à 5-7** - Trop d'étiquettes diluent leur utilité

5. **Utilisez des catégories pertinentes** - 2 à 3 niveaux maximum

6. **Définissez `lastmod` lors des mises à jour** - Aide au SEO et à la confiance des utilisateurs

7. **Utilisez les permaliens** - Des URL stables évitent les liens brisés

8. **N'oubliez pas `description`** - Essentiel pour le SEO et le partage sur les réseaux sociaux

---

## Ressources

- [Documentation du Front Matter Jekyll](https://jekyllrb.com/docs/front-matter/)
- [Guide de la syntaxe YAML](https://yaml.org/spec/1.2.2/)
- [Documentation du thème Zer0-Mistakes](/docs/)
