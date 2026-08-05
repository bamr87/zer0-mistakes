---
lastmod: 2026-04-18 19:30:02.000000000 Z
title: Génération de sitemap
description: Génération automatique du sitemap XML et de l'index de recherche JSON
  pour la découverte par les moteurs de recherche et la recherche sur le site.
preview: "/images/previews/sitemap-generation.png"
layout: default
categories:
- docs
- seo
tags:
- sitemap
- seo
- search
- indexing
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/seo/sitemap/"
translation_of: pages/_docs/seo/sitemap.md
translation_source_url: "/docs/seo/sitemap/"
machine_translated: true
translated_from_sha: c0a70d349c49
---

# Génération de sitemap

Génération automatique de sitemaps XML pour les moteurs de recherche et d'index JSON pour la recherche sur le site.

## Aperçu

Le thème génère :

- **Sitemap XML** : pour les robots d'exploration des moteurs de recherche
- **Index de recherche JSON** : pour la recherche côté client
- **robots.txt** : instructions pour les robots d'exploration

## Sitemap XML

### Génération automatique

En utilisant le plugin `jekyll-sitemap` :

```yaml
# _config.yml
plugins:
  - jekyll-sitemap
```

### Sortie

Généré à l'emplacement `/sitemap.xml` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>2025-01-25T00:00:00+00:00</lastmod>
  </url>
  <url>
    <loc>https://yoursite.com/docs/</loc>
    <lastmod>2025-01-20T00:00:00+00:00</lastmod>
  </url>
</urlset>
```

### Sitemap personnalisé

Créez `sitemap.xml` manuellement :

```liquid
{% raw %}---
layout: null
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  {% for page in site.pages %}
    {% unless page.sitemap == false %}
    <url>
      <loc>{{ page.url | absolute_url }}</loc>
      <lastmod>{{ page.last_modified_at | default: site.time | date_to_xmlschema }}</lastmod>
      <changefreq>{{ page.sitemap.changefreq | default: 'monthly' }}</changefreq>
      <priority>{{ page.sitemap.priority | default: '0.5' }}</priority>
    </url>
    {% endunless %}
  {% endfor %}
</urlset>{% endraw %}
```

## Index de recherche JSON

### Fichier généré

`search.json` pour la recherche côté client :

```json
[
  {
    "title": "Getting Started",
    "url": "/docs/getting-started/",
    "content": "Welcome to the documentation...",
    "categories": ["docs"],
    "tags": ["setup"]
  }
]
```

### Modèle de recherche

```liquid
{% raw %}---
layout: null
---
[
  {% assign pages = site.pages | where_exp: "page", "page.title" %}
  {% for page in pages %}
  {
    "title": {{ page.title | jsonify }},
    "url": {{ page.url | jsonify }},
    "content": {{ page.content | strip_html | truncatewords: 100 | jsonify }},
    "categories": {{ page.categories | jsonify }},
    "tags": {{ page.tags | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
]{% endraw %}
```

## robots.txt

### Configuration de base

```text
# robots.txt
User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml
```

### Modèle Jekyll

```liquid
{% raw %}---
layout: null
permalink: /robots.txt
---
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: {{ site.url }}/sitemap.xml{% endraw %}
```

## Exclusion de pages

### Du sitemap XML

```yaml
---
sitemap: false
---
```

Ou avec la configuration du plugin :

```yaml
# _config.yml
defaults:
  - scope:
      path: "admin/*"
    values:
      sitemap: false
```

### De l'index de recherche

```yaml
---
search: false
---
```

```liquid
{% raw %}{% unless page.search == false %}
  // Include in search index
{% endunless %}{% endraw %}
```

## Priorité et fréquence

### Paramètres par page

```yaml
---
sitemap:
  priority: 0.8
  changefreq: weekly
---
```

### Paramètres par défaut

```yaml
# _config.yml
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      sitemap:
        changefreq: monthly
        priority: 0.7
  - scope:
      path: ""
      type: "pages"
    values:
      sitemap:
        changefreq: weekly
        priority: 0.5
```

## Soumission aux moteurs de recherche

### Google Search Console

1. Accédez à [Search Console](https://search.google.com/search-console)
2. Ajoutez votre site
3. Soumettez l'URL du sitemap : `https://yoursite.com/sitemap.xml`

### Bing Webmaster Tools

1. Accédez à [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Ajoutez votre site
3. Soumettez le sitemap

## Validation

### Validation XML

Testez avec [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

### Google Search Console

Vérifiez l'état du sitemap dans Search Console → Sitemaps

## Dépannage

### Sitemap introuvable

1. Vérifiez que le plugin est installé
2. Vérifiez que `_site/sitemap.xml` existe
3. Vérifiez les permissions du fichier

### Pages manquantes

1. Vérifiez que la page n'est pas exclue
2. Vérifiez le front matter pour `sitemap: false`
3. Assurez-vous que la page a un titre

### JSON invalide

1. Recherchez les caractères non échappés
2. Validez la syntaxe JSON
3. Vérifiez les erreurs de modèle Liquid

## Bonnes pratiques

### Maintenez le sitemap à jour

- Régénérez lors du déploiement
- Incluez les dates lastmod
- Supprimez les pages effacées

### Optimiser pour la recherche

- Inclure toutes les pages importantes
- Utiliser des titres descriptifs
- Garder des URL propres

### Surveiller les performances

- Vérifier le statut d'indexation
- Surveiller les erreurs d'exploration
- Examiner les statistiques de recherche

## Ressources associées

- [Balises Meta](/docs/seo/meta-tags/)
- [Recherche sur le site](/docs/features/site-search/)
- [Fils d'Ariane](/docs/features/breadcrumbs/)

## Voir aussi

- [[SEO]]
- [[Deployment]]
- [[Analytics]]
