---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Composants d'inclusion
description: Guide des plus de 70 composants d'inclusion réutilisables, organisés
  par catégorie pour une flexibilité maximale.
preview: "/images/previews/include-components.png"
layout: default
categories:
- docs
- customization
tags:
- includes
- components
- templates
- jekyll
difficulty: intermediate
estimated_reading_time: 20 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/customization/includes/"
translation_of: pages/_docs/customization/includes.md
translation_source_url: "/docs/customization/includes/"
machine_translated: true
translated_from_sha: 302b054e92b7
---

# Composants Include

Le thème Zer0-Mistakes inclut plus de 70 composants réutilisables organisés par catégorie.

## Aperçu

```text
_includes/
├── analytics/     # Analytics integrations
├── components/    # UI components
├── content/       # Content rendering
├── core/          # Core layout elements
├── docs/          # Documentation specific
├── landing/       # Landing page components
├── navigation/    # Navigation elements
└── stats/         # Statistics dashboard
```

## Utilisation des includes

### Utilisation de base

```liquid
{% raw %}{% include navigation/navbar.html %}{% endraw %}
```

### Avec des paramètres

```liquid
{% raw %}{% include components/post-card.html post=post %}{% endraw %}
```

### Include conditionnel

```liquid
{% raw %}{% if page.toc %}
  {% include content/toc.html %}
{% endif %}{% endraw %}
```

## Includes d'analytique

| Include | Objet |
|---------|---------|
| `analytics/google-analytics.html` | Google Analytics 4 |
| `analytics/google-tag-manager-head.html` | Script GTM head |
| `analytics/google-tag-manager-body.html` | GTM body noscript |
| `analytics/posthog.html` | Analytique PostHog |

### Utilisation

```liquid
{% raw %}{% include analytics/posthog.html %}{% endraw %}
```

## Includes de composants

| Include | Objet |
|---------|---------|
| `components/author-card.html` | Carte d'informations sur l'auteur |
| `components/cookie-consent.html` | Bannière de cookies RGPD |
| `components/mermaid.html` | Chargeur de diagrammes Mermaid |
| `components/post-card.html` | Carte d'article de blog |
| `components/preview-image.html` | Gestionnaire d'image de prévisualisation |
| `components/search-modal.html` | Fenêtre modale de recherche |
| `components/searchbar.html` | Stub de recherche de style Algolia obsolète (utilisez `search-modal.html`) |
| `components/theme-info.html` | Fenêtre modale de version du thème |

### Exemple de carte d'article

```liquid
{% raw %}{% for post in site.posts limit: 3 %}
  {% include components/post-card.html post=post %}
{% endfor %}{% endraw %}
```

### Carte d'auteur

```liquid
{% raw %}{% include components/author-card.html 
   name=page.author 
   avatar="/assets/images/avatar.png" 
%}{% endraw %}
```

## Includes de contenu

| Include | Objet |
|---------|---------|
| `content/giscus.html` | Commentaires GitHub Discussions |
| `content/intro.html` | Introduction de page |
| `content/seo.html` | Balises meta SEO |
| `content/sitemap.html` | Entrée du sitemap |
| `content/toc.html` | Table des matières |

### Include TOC

```liquid
{% raw %}{% if page.toc != false %}
  {% include content/toc.html %}
{% endif %}{% endraw %}
```

### Include de commentaires

```liquid
{% raw %}{% if page.comments != false and site.giscus.enabled %}
  {% include content/giscus.html %}
{% endif %}{% endraw %}
```

## Includes principaux

| Include | Objet |
|---------|---------|
| `core/branding.html` | Logo et titre du site |
| `core/footer.html` | Pied de page |
| `core/head.html` | Section head HTML |
| `core/header.html` | En-tête/barre de navigation de page |

### Utilisation de la mise en page

```html
{% raw %}<!DOCTYPE html>
<html>
  <head>
    {% include core/head.html %}
  </head>
  <body>
    {% include core/header.html %}
    {{ content }}
    {% include core/footer.html %}
  </body>
</html>{% endraw %}
```

## Includes de navigation

| Include | Objet |
|---------|---------|
| `navigation/breadcrumbs.html` | Fil d'Ariane |
| `navigation/nav_list.html` | Liste de navigation |
| `navigation/nav-tree.html` | Navigation en arborescence |
| `navigation/navbar.html` | Barre de navigation principale |
| `navigation/sidebar-config.html` | Résout le mode/titre/icône effectif de la barre latérale (page → collection → site) |
| `navigation/sidebar-nav.html` | Affiche le mode de barre latérale résolu |
| `navigation/sidebar-categories.html` | Barre latérale des catégories/étiquettes (articles par terme de taxonomie) |
| `navigation/sidebar-folders.html` | Barre latérale de collection (arborescence de dossiers repliable) |
| `navigation/sidebar-left.html` | Panneau de barre latérale gauche |
| `navigation/sidebar-right.html` | Barre latérale droite (TOC) |

### Barre latérale avec navigation

Le mode de barre latérale provient de la clé de front matter `sidebar.nav` (ou d'une valeur par défaut de collection/site), et non d'un paramètre d'include :

```yaml
sidebar:
  nav: docs   # auto | collection | categories | tags | <_data/navigation file>
```

```liquid
{% raw %}{% include navigation/sidebar-left.html %}{% endraw %}
```

Consultez [Navigation par barre latérale](/docs/features/sidebar-navigation/) pour la référence complète des modes et options.

## Includes de page d'accueil

| Include | Objet |
|---------|---------|
| `landing/landing-install-cards.html` | Options d'installation |
| `landing/landing-quick-links.html` | Liens d'action rapide |

### Utilisation

```liquid
{% raw %}{% include landing/landing-install-cards.html %}{% endraw %}
```

## Includes de statistiques

| Include | Objectif |
|---------|---------|
| `stats/stats-categories.html` | Statistiques par catégorie |
| `stats/stats-header.html` | En-tête de la page de statistiques |
| `stats/stats-metrics.html` | Affichage des métriques |
| `stats/stats-no-data.html` | État vide |
| `stats/stats-overview.html` | Cartes de vue d'ensemble |
| `stats/stats-tags.html` | Nuage de tags |

## Créer des includes personnalisés

### Include de base

```html
<!-- _includes/components/custom.html -->
<div class="custom-component">
  <h3>{{ include.title }}</h3>
  <p>{{ include.content }}</p>
</div>
```

### Avec paramètres

```liquid
{% raw %}{% include components/custom.html 
   title="My Title" 
   content="My content" 
%}{% endraw %}
```

### Avec valeurs par défaut

```html
{% raw %}{% assign title = include.title | default: "Default Title" %}
<h3>{{ title }}</h3>{% endraw %}
```

### Contenu conditionnel

```html
{% raw %}{% if include.show_icon %}
  <i class="bi bi-{{ include.icon }}"></i>
{% endif %}{% endraw %}
```

## Bonnes pratiques

### Documentation des paramètres

Ajoutez des commentaires en haut des includes :

```html
{% raw %}<!--
  Include: post-card.html
  Parameters:
    - post (required): Post object
    - show_excerpt (optional): Show excerpt, default true
    - show_date (optional): Show date, default true
-->{% endraw %}
```

### Gestion des erreurs

```liquid
{% raw %}{% if include.post %}
  <!-- render post card -->
{% else %}
  <!-- error: post required -->
{% endif %}{% endraw %}
```

### Performances

- Évitez les boucles imbriquées dans les includes
- Utilisez des captures pour la logique complexe
- Mettez en cache les opérations coûteuses

## Remplacer les includes du thème

### Copier et modifier

1. Copiez l'include du thème vers votre `_includes/`
2. Modifiez selon vos besoins
3. Jekyll utilise votre version

### Vérifier l'emplacement du thème

```bash
bundle show jekyll-theme-zer0
# Copy includes from gem location
```

## Dépannage

### Include introuvable

1. Vérifiez que le chemin du fichier est correct
2. Vérifiez que le fichier existe
3. Recherchez des fautes de frappe dans le nom du fichier

### Paramètre ne fonctionne pas

1. Vérifiez que le nom du paramètre correspond
2. Vérifiez les paramètres obligatoires
3. Déboguez avec `⟦44⟧`

### Boucle infinie

1. Recherchez les includes circulaires
2. Ajoutez des garde-fous pour la récursion
3. Utilisez une limitation de profondeur

## Voir aussi

- [Layouts](/docs/customization/layouts/)
- [Liquid de Jekyll](/docs/liquid/)
- [Intégration Bootstrap](/docs/bootstrap/)

## Référence technique

Pour les détails de niveau contributeur (référence de l'API des composants, paramètres des includes, extension de la bibliothèque de composants) :

- [Composants → docs/ui/components.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/components.md)

## Voir aussi

- [[Customization]]
- [[Layouts]]
- [[Bootstrap Integration]]
