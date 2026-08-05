---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Navigation par fil d'Ariane
description: Navigation hiérarchique par fil d'Ariane avec données structurées Schema.org
  pour le référencement et l'orientation des utilisateurs.
preview: "/images/previews/breadcrumbs-navigation.png"
layout: default
categories:
- docs
- features
tags:
- navigation
- breadcrumbs
- seo
- accessibility
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/breadcrumbs/"
translation_of: pages/_docs/features/breadcrumbs.md
translation_source_url: "/docs/features/breadcrumbs/"
machine_translated: true
translated_from_sha: 02ed2d34de6a
---

# Navigation par fil d'Ariane

Navigation hiérarchique par fil d'Ariane indiquant l'emplacement de la page actuelle dans la structure du site.

![Un en-tête de page d'administration avec un fil d'Ariane affichant « Home / About / Configuration Utility » au-dessus du titre de la page](/assets/images/docs/features/admin-dashboard.png)

Le fil d'Ariane (par ex. **Home / About / Configuration Utility**) se place juste au-dessus du titre de la page, dérivé de l'URL et de la collection de la page afin que les visiteurs sachent toujours où ils se trouvent.

## Aperçu

- **Affichage du chemin** : affiche le chemin de navigation
- **Balisage Schema.org** : données structurées optimisées pour le référencement
- **Compatible avec les collections** : gère les collections Jekyll
- **Configurable** : activation/désactivation via la configuration

## Démarrage rapide

### Activer le fil d'Ariane

Dans `_config.yml` :

```yaml
breadcrumbs: true
```

### Inclure le modèle

```liquid
{% raw %}{% include navigation/breadcrumbs.html %}{% endraw %}
```

## Mise en œuvre

### Structure HTML

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/">
        <span itemprop="name">Home</span>
      </a>
      <meta itemprop="position" content="1">
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/docs/">
        <span itemprop="name">Docs</span>
      </a>
      <meta itemprop="position" content="2">
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name">Current Page</span>
      <meta itemprop="position" content="3">
    </li>
  </ol>
</nav>
```

### Modèle Liquid

```liquid
{% raw %}{% if page.url != "/" and site.breadcrumbs %}
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="{{ '/' | relative_url }}">
        <i class="bi bi-house"></i>
        <span itemprop="name">Home</span>
      </a>
      <meta itemprop="position" content="1">
    </li>
    
    {% assign crumbs = page.url | remove: '/index.html' | split: '/' %}
    {% assign position = 2 %}
    
    {% for crumb in crumbs offset: 1 %}
      {% if forloop.last %}
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name">{{ page.title }}</span>
          <meta itemprop="position" content="{{ position }}">
        </li>
      {% else %}
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a itemprop="item" href="{{ '/' | append: crumb | append: '/' | relative_url }}">
            <span itemprop="name">{{ crumb | capitalize }}</span>
          </a>
          <meta itemprop="position" content="{{ position }}">
        </li>
        {% assign position = position | plus: 1 %}
      {% endif %}
    {% endfor %}
  </ol>
</nav>
{% endif %}{% endraw %}
```

## Mise en forme

### Styles de base

```css
.breadcrumbs {
  padding: 0.75rem 0;
  font-size: 0.875rem;
}

.breadcrumbs ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumbs li {
  display: flex;
  align-items: center;
}

.breadcrumbs li:not(:last-child)::after {
  content: '/';
  margin-left: 0.5rem;
  color: var(--bs-secondary);
}

.breadcrumbs a {
  color: var(--bs-primary);
  text-decoration: none;
}

.breadcrumbs a:hover {
  text-decoration: underline;
}

.breadcrumbs li:last-child {
  color: var(--bs-secondary);
}
```

### Avec des icônes

```css
.breadcrumbs i {
  margin-right: 0.25rem;
}
```

## SEO Schema.org

### Données structurées

Le fil d'Ariane inclut un balisage Schema.org `BreadcrumbList` pour les moteurs de recherche :

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Docs",
      "item": "https://example.com/docs/"
    }
  ]
}
```

### Google Search Console

Ce balisage permet l'affichage du fil d'Ariane dans les résultats de recherche Google.

## Gestion des collections

### Collection Posts

```liquid
{% raw %}{% if section == 'posts' %}
  / <a href="{{ '/posts/' | relative_url }}">Posts</a>
  / {{ page.title }}
{% endif %}{% endraw %}
```

### Collection Docs

```liquid
{% raw %}{% elsif section == 'docs' %}
  / <a href="{{ '/docs/' | relative_url }}">Docs</a>
  / {{ page.title }}
{% endif %}{% endraw %}
```

## Configuration

### Désactiver sur des pages spécifiques

```yaml
---
breadcrumbs: false
---
```

### Séparateur personnalisé

```css
.breadcrumbs li:not(:last-child)::after {
  content: '›';  /* or '>' or '»' */
}
```

### Icône d'accueil

```html
<a href="/">
  <i class="bi bi-house-fill"></i>
  <span class="visually-hidden">Home</span>
</a>
```

## Accessibilité

### Attributs ARIA

```html
<nav aria-label="Breadcrumb">
  <ol role="list">
    <li><a aria-current="page">Current</a></li>
  </ol>
</nav>
```

### Texte pour lecteur d'écran

```html
<span class="visually-hidden">You are here:</span>
```

## Dépannage

### Chemin incorrect

1. Vérifiez que la structure de l'URL correspond à la logique du fil d'Ariane
2. Vérifiez les chemins des collections
3. Testez avec différents types de pages

### Validation du schéma

Testez les données structurées sur :

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Validateur Schema.org](https://validator.schema.org/)

### Problèmes de mise en forme

1. Vérifiez la prise en charge de flexbox
2. Vérifiez le positionnement du séparateur
3. Testez le retour à la ligne responsive

## Voir aussi

- [Optimisation SEO](/docs/seo/meta-tags/)
- [Navigation](/docs/customization/navigation/)
- [Navigation par barre latérale](/docs/features/sidebar-navigation/)

## Voir aussi

- [[Features]]
- [[Sidebar Navigation System]]
- [[Keyboard Navigation]]
