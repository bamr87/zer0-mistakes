---
title: Liquid
description: Les bases des templates Liquid utilisés par Jekyll et ce thème.
preview: "/images/previews/liquid.png"
layout: default
categories:
- docs
- liquid
tags:
- liquid
- jekyll
difficulty: beginner
estimated_reading_time: 5 minutes
prerequisites: []
lastmod: 2026-06-14 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/liquid/"
translation_of: pages/_docs/liquid/index.md
translation_source_url: "/docs/liquid/"
machine_translated: true
translated_from_sha: ec79a55a9d22
---

# Liquid

Liquid est le langage de templates utilisé par Jekyll pour traiter les templates et créer du contenu dynamique.

## Syntaxe de base

### Sortie (doubles accolades)

{% raw %}

```liquid
{{ page.title }}
{{ site.description }}
{{ content }}
```

{% endraw %}

### Logique (accolades avec pourcentage)

{% raw %}

```liquid
{% if page.title %}
  <h1>{{ page.title }}</h1>
{% endif %}

{% for post in site.posts %}
  <li>{{ post.title }}</li>
{% endfor %}
```

{% endraw %}

## Filtres courants

### Manipulation de texte

{% raw %}

```liquid
{{ "hello" | capitalize }}       <!-- Hello -->
{{ "hello world" | upcase }}     <!-- HELLO WORLD -->
{{ page.content | truncate: 100 }}
{{ page.content | strip_html }}
```

{% endraw %}

### Assistants d'URL

{% raw %}

```liquid
{{ "/about/" | relative_url }}   <!-- Prepends baseurl -->
{{ "/about/" | absolute_url }}   <!-- Full URL with domain -->
```

{% endraw %}

### Formatage des dates

{% raw %}

```liquid
{{ page.date | date: "%B %d, %Y" }}  <!-- January 15, 2025 -->
{{ page.date | date_to_xmlschema }}   <!-- 2025-01-15T00:00:00+00:00 -->
```

{% endraw %}

### Tableaux

{% raw %}

```liquid
{{ page.tags | join: ", " }}
{{ site.posts | size }}
{{ page.categories | first }}
```

{% endraw %}

## Flux de contrôle

### Conditions

{% raw %}

```liquid
{% if page.layout == "post" %}
  <!-- Post content -->
{% elsif page.layout == "page" %}
  <!-- Page content -->
{% else %}
  <!-- Default content -->
{% endif %}
```

{% endraw %}

### Boucles

{% raw %}

```liquid
{% for post in site.posts limit:5 %}
  <a href="{{ post.url }}">{{ post.title }}</a>
{% endfor %}

{% for tag in page.tags %}
  <span>{{ tag }}</span>
{% endfor %}
```

{% endraw %}

## Includes

Inclure des composants réutilisables :

{% raw %}

```liquid
{% include navigation/navbar.html %}
{% include components/post-card.html post=post %}
```

{% endraw %}

Passer des paramètres aux includes :

{% raw %}

```liquid
{% include card.html 
   title="My Card" 
   content="Card content here" 
%}
```

{% endraw %}

## Exemples du thème

Explorez l'utilisation de Liquid dans Zer0-Mistakes :

- `_layouts/` - Templates de page
- `_includes/` - Composants réutilisables
- `_includes/navigation/` - Composants de navigation

## Ressources

- [Documentation Liquid](https://shopify.github.io/liquid/)
- [Référence Liquid de Jekyll](https://jekyllrb.com/docs/liquid/)
- [Aide-mémoire Liquid](https://www.shopify.com/partners/shopify-cheat-sheet)

## Connexe

- [Guide Jekyll](/docs/jekyll/)
- [Front Matter](/docs/front-matter/)
- [Templates Liquid de Jekyll](/docs/liquid/)

## Voir aussi

- [[Jekyll]]
- [[Customization]]
- [[front-matter]]
