---
lastmod: 2026-06-14 00:00:00.000000000 Z
title: Collections Jekyll
description: Collections de contenu organisées pour les articles, la documentation,
  les carnets et d'autres types de contenu avec des permaliens personnalisés.
preview: "/images/previews/jekyll-collections.png"
layout: default
categories:
- docs
- jekyll
tags:
- collections
- jekyll
- content
- organization
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/jekyll/collections/"
translation_of: pages/_docs/jekyll/collections.md
translation_source_url: "/docs/jekyll/collections/"
machine_translated: true
translated_from_sha: 031612b6df21
---

# Collections Jekyll

Le thème Zer0-Mistakes utilise les collections Jekyll pour organiser différents types de contenu avec des permaliens et des mises en page personnalisés.

## Collections disponibles

| Collection | Emplacement | Permalien | Mise en page |
|------------|----------|-----------|--------|
| `posts` | `pages/_posts/` | `/posts/:year/:month/:day/:title/` | `journals` |
| `docs` | `pages/_docs/` | `/docs/:path/` | `default` |
| `notebooks` | `pages/_notebooks/` | `/notebooks/:basename/` | `notebook` |
| `about` | `pages/_about/` | `/about/:title/` | `default` |
| `quickstart` | `pages/_quickstart/` | `/quickstart/:title/` | `default` |

## Configuration

### Définition de la collection

```yaml
# _config.yml
collections:
  posts:
    output: true
    permalink: /posts/:year/:month/:day/:title/
  docs:
    output: true
    permalink: /docs/:path/
  notebooks:
    output: true
    permalink: /notebooks/:basename/
  about:
    output: true
    permalink: /about/:title/
  quickstart:
    output: true
    permalink: /quickstart/:title/
```

### Valeurs par défaut de la collection

```yaml
# _config.yml
defaults:
  # Posts
  - scope:
      path: "pages/_posts"
      type: posts
    values:
      layout: article
      author: default
      
  # Documentation
  - scope:
      path: "pages/_docs"
      type: docs
    values:
      layout: default
      sidebar:
        nav: docs
        
  # Notebooks
  - scope:
      path: "pages/_notebooks"
      type: notebooks
    values:
      layout: notebook
      mathjax: true
      toc: true
```

## Création de contenu

### Articles

Créer dans `pages/_posts/` :

```yaml
---
title: "My Blog Post"
date: 2025-01-25
categories: [technology, jekyll]
tags: [tutorial, beginner]
preview: /images/previews/jekyll-collections.png
---

Post content here...
```

Format du nom de fichier : `YYYY-MM-DD-title-slug.md`

### Documentation

Créer dans `pages/_docs/` :

```yaml
---
title: "Getting Started"
description: "Quick start guide for new users"
permalink: /docs/getting-started/
difficulty: beginner
estimated_reading_time: 10 minutes
---

Documentation content...
```

### Carnets

Créer dans `pages/_notebooks/` :

```yaml
---
title: "Data Analysis Example"
description: "Jupyter notebook demonstrating data analysis"
kernel: python3
---
```

Ou utilisez des fichiers `.ipynb` avec un script de conversion.

## Accès aux collections

### Dans les modèles

```liquid
{% raw %}<!-- Loop through all docs -->
{% for doc in site.docs %}
  <a href="{{ doc.url }}">{{ doc.title }}</a>
{% endfor %}

<!-- Filter by category -->
{% assign tutorials = site.docs | where: "category", "tutorials" %}

<!-- Sort by date -->
{% assign recent = site.posts | sort: "date" | reverse %}{% endraw %}
```

### Propriétés des collections

```liquid
{% raw %}{{ site.docs.size }}         <!-- Number of docs -->
{{ site.docs.first.title }}  <!-- First doc title -->
{{ site.posts.last.date }}   <!-- Last post date -->{% endraw %}
```

## Collections personnalisées

### Créer une nouvelle collection

1. **Ajouter à la configuration** :

```yaml
collections:
  tutorials:
    output: true
    permalink: /tutorials/:title/
```

1. **Définir les valeurs par défaut** :

```yaml
defaults:
  - scope:
      path: "pages/_tutorials"
      type: tutorials
    values:
      layout: tutorial
```

1. **Créer le répertoire** :

```bash
mkdir pages/_tutorials
```

1. **Ajouter du contenu** :

```yaml
---
title: "My Tutorial"
difficulty: beginner
---
```

## Stratégies d'organisation

### Par catégorie

```text
pages/_docs/
├── getting-started/
│   ├── index.md
│   └── quick-start.md
├── features/
│   ├── index.md
│   └── feature-name.md
└── customization/
    ├── index.md
    └── styles.md
```

### Par date

```text
pages/_posts/
├── 2025-01-25-first-post.md
├── 2025-01-24-second-post.md
└── 2025-01-23-third-post.md
```

### Par sujet

```text
pages/_notebooks/
├── data-science/
│   ├── pandas-basics.ipynb
│   └── visualization.ipynb
└── machine-learning/
    └── classification.ipynb
```

## Permaliens

### Variables de permalien

| Variable | Description |
|----------|-------------|
| `:collection` | Nom de la collection |
| `:path` | Chemin depuis la racine de la collection |
| `:name` | Nom de fichier sans extension |
| `:title` | Titre slugifié |
| `:basename` | Nom de fichier sans la date |
| `:year` | Année à 4 chiffres |
| `:month` | Mois à 2 chiffres |
| `:day` | Jour à 2 chiffres |

### Permaliens personnalisés

```yaml
# In front matter
---
permalink: /my-custom-url/
---
```

### URL lisibles

```yaml
# _config.yml
permalink: pretty  # Adds trailing slash
```

## Pages de collection

### Pages d'index

Créez des pages d'index de collection :

```yaml
# pages/_docs/index.md
---
title: Documentation
layout: collection
collection: docs
---

Welcome to the documentation...
```

### Mise en page de la collection

```html
{% raw %}<!-- _layouts/collection.html -->
---
layout: default
---

<h1>{{ page.title }}</h1>

{% assign items = site[page.collection] | sort: "title" %}
{% for item in items %}
  <article>
    <h2><a href="{{ item.url }}">{{ item.title }}</a></h2>
    <p>{{ item.description }}</p>
  </article>
{% endfor %}{% endraw %}
```

## Bonnes pratiques

### Conventions de nommage

- Utilisez des minuscules pour les répertoires
- Utilisez des traits d'union dans les noms de fichiers
- Gardez des URL courtes et descriptives

### Front matter

- Incluez toujours `title`
- Ajoutez `description` pour le référencement
- Utilisez un format de date cohérent

### Organisation

- Regroupez le contenu connexe
- Utilisez des pages d'index pour les sections
- Maintenez une hiérarchie peu profonde

## Dépannage

### La collection n'apparaît pas

1. Vérifiez `output: true` dans la configuration
2. Vérifiez que le chemin du répertoire correspond à la configuration
3. Assurez-vous que les fichiers comportent un front matter

### Mauvais permalien

1. Vérifiez le modèle de permalien dans la configuration
2. Vérifiez le permalien du front matter
3. Videz le cache de Jekyll

### Valeurs par défaut manquantes

1. Vérifiez que le chemin de portée est correct
2. Vérifiez que le type correspond au nom de la collection
3. Redémarrez le serveur Jekyll

## Voir aussi

- [Configuration de Jekyll](/docs/jekyll/)
- [Mises en page](/docs/customization/layouts/)
- [Front Matter](/docs/front-matter/)

## Voir aussi

- [[Jekyll]]
- [[front-matter]]
- [[Liquid]]
