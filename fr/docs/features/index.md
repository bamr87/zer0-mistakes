---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Fonctionnalités
description: Activez et configurez les fonctionnalités du thème, notamment les diagrammes,
  les commentaires, l'analytique, et plus encore.
preview: "/images/previews/features.png"
layout: default
categories:
- docs
- features
tags:
- features
- configuration
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/"
translation_of: pages/_docs/features/index.md
translation_source_url: "/docs/features/"
machine_translated: true
translated_from_sha: 5ad1befc459d
---

# Fonctionnalités

Le thème Zer0-Mistakes inclut plusieurs fonctionnalités optionnelles qui enrichissent votre site. Chaque fonctionnalité peut être activée par page à l'aide du front matter.

## Fonctionnalités disponibles

Chaque fonctionnalité dispose de son propre guide. « Activer » indique comment l'activer — front matter de page, un paramètre `_config.yml`, ou « toujours actif » (intégré au thème).

### Contenu et rédaction

| Fonctionnalité | Description | Activer |
|---------|-------------|--------|
| [Diagrammes Mermaid](mermaid-diagrams/) | Organigrammes, diagrammes de séquence/de classes à partir de texte | `mermaid: true` |
| [Formules MathJax](mathjax-math/) | Équations façon LaTeX, rendues dans le navigateur | `mathjax: true` |
| [Notebooks Jupyter](jupyter-notebooks/) | Publiez des notebooks `.ipynb` comme pages | déposez dans `pages/_notebooks/` |
| [Bouton de copie de code](code-copy/) | Copie en un clic sur chaque bloc de code | toujours actif |
| [Images de prévisualisation IA](preview-image-generator/) | Génération automatique d'images sociales/OG pour les articles | `_config.yml` |

### Navigation et accessibilité

| Fonctionnalité | Description | Activer |
|---------|-------------|--------|
| [Navigation par barre latérale](sidebar-navigation/) | Barre latérale de docs repliable avec scroll spy | `sidebar.nav` |
| [Table des matières](toc/) | Liste automatique « Sur cette page » avec surlignage actif | `toc: true` |
| [Bouton TOC mobile](mobile-toc/) | Bouton TOC flottant sur téléphone | toujours actif |
| [Fil d'Ariane](breadcrumbs/) | Piste hiérarchique + balisage Schema.org | `breadcrumbs: true` |
| [Retour en haut](back-to-top/) | Bouton flottant de retour en haut | toujours actif |
| [Navigation dynamique](dynamic-navigation/) | Construit automatiquement la barre de navigation à partir des collections | repli automatique |
| [Architecture de navigation](navigation-architecture/) | Les modules ES6 derrière le système de navigation | toujours actif |
| [Navigation au clavier](keyboard-navigation/) | Raccourcis + gestion du focus (appuyez sur `?`) | toujours actif |
| [Aller au contenu](skip-to-content/) | Lien d'évitement WCAG pour les utilisateurs au clavier | toujours actif |

### Apparence et administration

| Fonctionnalité | Description | Activer |
|---------|-------------|--------|
| [Mode sombre / clair](color-modes/) | Modes couleur clair, sombre et auto + 9 habillages | toujours actif |
| [Tableaux de bord d'administration](admin-dashboard/) | Tableaux de bord config, stats, thème et build | `layout: admin` |
| [Ressources vendorées](vendored-assets/) | Bootstrap/Icons/Mermaid intégrés, sans CDN | au build |
| [Version du thème](theme-version/) | Afficher la version du thème installée | automatique |

### Engagement et analytique

| Fonctionnalité | Description | Activer |
|---------|-------------|--------|
| [Recherche du site](site-search/) | Fenêtre de recherche côté client (appuyez sur `/`) | toujours actif |
| [Commentaires Giscus](giscus-comments/) | Commentaires propulsés par GitHub Discussions | `comments: true` + `giscus:` |
| [Analytique PostHog](posthog-analytics/) | Analytique respectueuse de la vie privée, soumise au consentement | `posthog:` (production) |
| [Assistant de chat IA](ai-chat-assistant/) | Widget de chat Claude conscient de la page | `ai_chat.enabled` |
| [Intégration Copilot / IA](copilot-integration/) | Instructions pour agent de codage IA à l'échelle du dépôt | config du dépôt |

### Confidentialité et résilience

| Fonctionnalité | Description | Activer |
|---------|-------------|--------|
| [Consentement aux cookies](cookie-consent/) | Bannière RGPD/CCPA conditionnant l'analytique | à l'échelle du site |
| [404 intelligente](smart-404/) | Page « introuvable » adaptée au déploiement avec recherche | automatique |

## Activation rapide

### Fonctionnalités par page

Ajoutez au front matter de votre page :

```yaml
---
title: "My Page"
mermaid: true      # Enable Mermaid diagrams
mathjax: true      # Enable MathJax formulas
comments: true     # Enable Giscus comments
---
```

### Fonctionnalités à l'échelle du site

Configurez dans `_config.yml` :

```yaml
# Analytics (production only)
posthog:
  enabled: true
  api_key: "your-api-key"

# Comments
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"

# Diagrams
mermaid:
  src: '/assets/vendor/mermaid/mermaid.min.js'
```

## Guides des fonctionnalités

### Enrichissement du contenu

- **[Diagrammes Mermaid](mermaid-diagrams/)** — Créez des organigrammes, diagrammes de séquence, diagrammes de classes et bien plus à l'aide d'une syntaxe textuelle
- **[Formules MathJax](mathjax-math/)** — Affichez des équations mathématiques en notation LaTeX

### Engagement des utilisateurs

- **[Commentaires Giscus](giscus-comments/)** — Ajoutez des commentaires propulsés par GitHub Discussions à vos pages
- **[Analytique PostHog](posthog-analytics/)** — Analytique respectueuse de la vie privée avec suivi d'événements personnalisés

### Accessibilité

- **[Navigation au clavier](keyboard-navigation/)** — Raccourcis clavier complets et fonctionnalités d'accessibilité

## Chargement conditionnel

Les fonctionnalités sont chargées de manière conditionnelle pour optimiser les performances :

- **Mermaid** — Chargé uniquement sur les pages avec `mermaid: true`
- **MathJax** — Chargé uniquement sur les pages avec `mathjax: true`
- **Analytique** — Chargée uniquement en environnement de production
- **Commentaires** — Affichés uniquement lorsqu'activés et `comments != false`

## Désactivation des fonctionnalités

### Par page

```yaml
---
comments: false   # Disable comments on this page
---
```

### Sur tout le site (développement)

Dans `_config_dev.yml` :

```yaml
posthog:
  enabled: false

giscus:
  enabled: false
```

## Étapes suivantes

Choisissez une fonctionnalité pour en savoir plus :

- [Diagrammes Mermaid](mermaid-diagrams/) — Documentation visuelle
- [Mathématiques MathJax](mathjax-math/) — Notation mathématique
- [Commentaires Giscus](giscus-comments/) — Engagement des utilisateurs
- [Analytique PostHog](posthog-analytics/) — Aperçus du site

## Voir aussi

- [[Customization]]
- [[Bootstrap Integration]]
- [[Analytics]]
- [[SEO]]
