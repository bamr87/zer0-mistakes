---
lastmod: 2026-04-18 19:30:02.000000000 Z
title: Balises méta SEO
description: Génération complète des balises méta SEO incluant Open Graph, Twitter
  Cards et les données structurées JSON-LD.
preview: "/images/previews/seo-meta-tags.png"
layout: default
categories:
- docs
- seo
tags:
- seo
- meta
- opengraph
- twitter-cards
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/seo/meta-tags/"
translation_of: pages/_docs/seo/meta-tags.md
translation_source_url: "/docs/seo/meta-tags/"
machine_translated: true
translated_from_sha: 697066a7bd7f
---

# Balises méta SEO

Génération automatique de balises méta SEO pour une meilleure visibilité sur les moteurs de recherche et les réseaux sociaux.

## Vue d'ensemble

Le thème génère :

- Balises méta de base (titre, description)
- Balises Open Graph (Facebook, LinkedIn)
- Balises Twitter Card
- URL canoniques
- Informations sur l'auteur
- Données structurées JSON-LD

## Balises générées

### Balises méta de base

```html
<title>Page Title - Site Title</title>
<meta name="description" content="Page description here">
<meta name="author" content="Author Name">
<link rel="canonical" href="https://yoursite.com/page/">
```

### Balises Open Graph

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:type" content="article">
<meta property="og:url" content="https://yoursite.com/page/">
<meta property="og:image" content="https://yoursite.com/image.png">
<meta property="og:site_name" content="Site Title">
```

### Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://yoursite.com/image.png">
<meta name="twitter:site" content="@username">
<meta name="twitter:creator" content="@author">
```

## Configuration

### Valeurs par défaut du site

```yaml
# _config.yml
title: "Site Title"
description: "Default site description"
preview: /images/previews/seo-meta-tags.png
url: "https://yoursite.com"

author:
  name: "Your Name"
  twitter: "@yourusername"

# Default social image
og_image: "/assets/images/og-default.png"

# Twitter username
twitter:
  username: "yourusername"
```

### Remplacement par page

```yaml
---
title: "Custom Page Title"
description: "Custom page description for SEO"
preview: /images/previews/seo-meta-tags.png
image: "/assets/images/custom-og.png"
author: "Different Author"
---
```

## Implémentation

### Include SEO

```liquid
{% raw %}<!-- _includes/content/seo.html -->
{% assign seo_url = site.url | append: site.baseurl %}
{% assign seo_title = page.title | default: site.title %}
{% assign seo_description = page.description | default: site.description %}

<!-- Basic Meta -->
<title>{{ seo_title }} - {{ site.title }}</title>
<meta name="description" content="{{ seo_description }}">
<link rel="canonical" href="{{ seo_url }}{{ page.url }}">

<!-- Open Graph -->
<meta property="og:title" content="{{ seo_title }}">
<meta property="og:description" content="{{ seo_description }}">
<meta property="og:url" content="{{ seo_url }}{{ page.url }}">
<meta property="og:image" content="{{ page.image | default: site.og_image | absolute_url }}">
<meta property="og:type" content="{% if page.layout == 'journals' %}article{% else %}website{% endif %}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ seo_title }}">
<meta name="twitter:description" content="{{ seo_description }}">{% endraw %}
```

### Chargement dans l'en-tête

```html
{% raw %}<head>
  {% include content/seo.html %}
</head>{% endraw %}
```

## Images d'aperçu

### Génération automatique

Le thème peut générer des images d'aperçu automatiquement. Consultez [Preview Image Generator](/docs/features/preview-image-generator/).

### Configuration manuelle

```yaml
---
image: "/assets/images/my-post-preview.png"
---
```

### Exigences relatives aux images

| Plateforme | Taille | Ratio |
|----------|------|-------|
| Open Graph | 1200×630 | 1.91:1 |
| Twitter | 1200×600 | 2:1 |
| LinkedIn | 1200×627 | 1.91:1 |

## Données structurées JSON-LD

### Schéma Article

```html
{% raw %}<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ page.title }}",
  "description": "{{ page.description }}",
  "image": "{{ page.image | absolute_url }}",
  "datePublished": "{{ page.date | date_to_xmlschema }}",
  "dateModified": "{{ page.last_modified_at | default: page.date | date_to_xmlschema }}",
  "author": {
    "@type": "Person",
    "name": "{{ page.author | default: site.author.name }}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{{ site.title }}"
  }
}
</script>{% endraw %}
```

### Schéma Website

```html
{% raw %}<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{{ site.title }}",
  "url": "{{ site.url }}",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "{{ site.url }}/search/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>{% endraw %}
```

## Bonnes pratiques

### Balises de titre

- Rester sous 60 caractères
- Inclure le mot-clé principal
- Rendre unique pour chaque page
- Placer les mots importants en premier

### Descriptions

- Rester entre 150 et 160 caractères
- Inclure un appel à l'action
- Rendre attractif et unique
- Inclure les mots-clés naturellement

### Images

- Utiliser des images de haute qualité
- Inclure un texte alternatif
- Optimiser la taille des fichiers
- Utiliser des noms de fichiers descriptifs

## Tests

### Test des résultats enrichis de Google

Testez les données structurées sur [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)

### Débogueur Facebook

Testez Open Graph sur [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)

### Validateur Twitter

Testez les Twitter Cards sur [https://cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)

## Dépannage

### Les images ne s'affichent pas

1. Vérifiez l'URL absolue
2. Vérifiez que l'image existe
3. Videz le cache de la plateforme
4. Utiliser les outils de débogage

### Description incorrecte

1. Vérifier le front matter de la page
2. Vérifier la logique de repli
3. Vider le cache des moteurs de recherche

### Erreurs de données structurées

1. Valider avec l'outil Google
2. Vérifier les champs obligatoires
3. Vérifier les formats de date

## Ressources associées

- [Sitemap](/docs/seo/sitemap/)
- [Générateur d'image d'aperçu](/docs/features/preview-image-generator/)
- [Fil d'Ariane](/docs/features/breadcrumbs/)

## Voir aussi

- [[SEO]]
- [[front-matter]]
- [[Analytics]]
