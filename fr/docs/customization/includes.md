---
lastmod: 2026-09-03 00:00:00.000000000 Z
title: Composants d'include
description: Guide des plus de 70 composants d'include réutilisables organisés par
  catégorie pour une flexibilité maximale.
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
translated_from_sha: 85851dc85b90
---

# Composants d'inclusion

Le thème Zer0-Mistakes comprend plus de 70 composants réutilisables organisés par catégorie.

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

## Utilisation des inclusions

### Utilisation de base

```liquid
{% raw %}{% include navigation/navbar.html %}{% endraw %}
```

### Avec des paramètres

```liquid
{% raw %}{% include components/post-card.html post=post %}{% endraw %}
```

### Inclusion conditionnelle

```liquid
{% raw %}{% if page.toc %}
  {% include content/toc.html %}
{% endif %}{% endraw %}
```

## Inclusions d'analyse

| Inclusion | Objectif |
|---------|---------|
| `analytics/google-analytics.html` | Google Analytics 4 |
| `analytics/google-tag-manager-head.html` | Script GTM pour l'en-tête |
| `analytics/google-tag-manager-body.html` | Noscript GTM pour le corps |
| `analytics/posthog.html` | Analyse PostHog |

### Utilisation

```liquid
{% raw %}{% include analytics/posthog.html %}{% endraw %}
```

## Inclusions de composants

| Inclusion | Objectif |
|---------|---------|
| `components/author-card.html` | Carte d'information sur l'auteur |
| `components/cookie-consent.html` | Bannière de cookies RGPD |
| `components/mermaid.html` | Chargeur de diagrammes Mermaid |
| `components/post-card.html` | Carte d'article de blog |
| `components/preview-image.html` | Gestionnaire d'image de prévisualisation |
| `components/background-image.html` | Illustration de couverture en arrière-plan CSS, avec `role="img"` + `aria-label` ou `aria-hidden` |
| `components/search-modal.html` | Fenêtre modale de recherche |
| `components/searchbar.html` | Ébauche de recherche de style Algolia obsolète (utilisez `search-modal.html`) |
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

## Inclusions de contenu

| Inclusion | Objectif |
|---------|---------|
| `content/giscus.html` | Commentaires GitHub Discussions |
| `content/intro.html` | Introduction de la page |
| `content/seo.html` | Balises meta SEO |
| `content/sitemap.html` | Entrée du plan du site |
| `content/toc.html` | Table des matières |

### Inclusion de la table des matières

```liquid
{% raw %}{% if page.toc != false %}
  {% include content/toc.html %}
{% endif %}{% endraw %}
```

### Inclusion des commentaires

```liquid
{% raw %}{% if page.comments != false and site.giscus.enabled %}
  {% include content/giscus.html %}
{% endif %}{% endraw %}
```

## Inclusions principales

| Inclusion | Objectif |
|---------|---------|
| `core/branding.html` | Logo et titre du site |
| `core/footer.html` | Pied de page |
| `core/head.html` | Section head HTML |
| `core/header.html` | En-tête de page / barre de navigation |

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

## Inclusions de navigation

| Inclusion | Objectif |
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
| `navigation/sidebar-right.html` | Barre latérale droite (table des matières) |

### Barre latérale avec navigation

Le mode de la barre latérale provient de la clé de front matter `sidebar.nav` (ou d'une valeur par défaut de collection/site), et non d'un paramètre d'inclusion :

```yaml
sidebar:
  nav: docs   # auto | collection | categories | tags | <_data/navigation file>
```

```liquid
{% raw %}{% include navigation/sidebar-left.html %}{% endraw %}
```

Consultez [Navigation par barre latérale](/docs/features/sidebar-navigation/) pour la référence complète des modes et des options.

## Inclusions de page d'accueil

| Inclusion | Objectif |
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
| `stats/stats-categories.html` | Statistiques de catégories |
| `stats/stats-header.html` | En-tête de la page de statistiques |
| `stats/stats-metrics.html` | Affichage des métriques |
| `stats/stats-no-data.html` | État vide |
| `stats/stats-overview.html` | Cartes de synthèse |
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

### Avec des paramètres

```liquid
{% raw %}{% include components/custom.html 
   title="My Title" 
   content="My content" 
%}{% endraw %}
```

### Avec des valeurs par défaut

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

### Performance

- Évitez les boucles imbriquées dans les includes
- Utilisez des captures pour la logique complexe
- Mettez en cache les opérations coûteuses

## Remplacer les includes du thème

### Copier et modifier

1. Copiez l'include du thème dans votre `_includes/`
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
3. Recherchez les fautes de frappe dans le nom du fichier

### Paramètre ne fonctionnant pas

1. Vérifiez que le nom du paramètre correspond
2. Vérifiez les paramètres requis
3. Déboguez avec `{{ include | inspect }}`

### Boucle infinie

1. Recherchez les includes circulaires
2. Ajoutez des garde-fous pour la récursion
3. Utilisez une limitation de profondeur

## Voir aussi

- [Layouts](/docs/customization/layouts/)
- [Liquid de Jekyll](/docs/liquid/)
- [Intégration de Bootstrap](/docs/bootstrap/)

## Référence technique

Pour des détails de niveau contributeur (référence de l'API des composants, paramètres d'include, extension de la bibliothèque de composants) :

- [Composants → docs/ui/components.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/ui/components.md)

## Voir aussi

- [[Customization]]
- [[Layouts]]
- [[Bootstrap 5 Integration in Zer0-Mistakes|Bootstrap 5 Integration]]
