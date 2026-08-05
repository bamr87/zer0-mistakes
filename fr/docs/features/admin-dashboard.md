---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Mises en page d'administration et tableaux de bord de configuration
description: Mise en page de style administration et partials de tableau de bord pour
  faire remonter la configuration du site, les informations de build et les indicateurs
  de fonctionnalités en un seul endroit.
preview: "/images/previews/admin-layout-configuration-dashboards.png"
layout: default
categories:
- docs
- features
tags:
- admin
- dashboard
- ui
- configuration
difficulty: intermediate
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/admin-dashboard/"
translation_of: pages/_docs/features/admin-dashboard.md
translation_source_url: "/docs/features/admin-dashboard/"
machine_translated: true
translated_from_sha: 06e9923ed1a1
---

# Mises en page d'administration et tableaux de bord de configuration

Le thème zer0-mistakes fournit une mise en page `admin` et un ensemble de partials de tableau de bord pour faire remonter la configuration du site, les métadonnées de build et les indicateurs de fonctionnalités — le tout au même endroit, sans nécessiter de CMS ni de backend.

![Le tableau de bord de l'utilitaire de configuration : cartes de synthèse pour l'URL du site, le dépôt, le skin du thème et les collections, au-dessus d'un tableau de configuration recherchable et copiable, avec la barre latérale d'administration à gauche](/assets/images/docs/features/admin-dashboard.png)

Les pages d'administration intégrées se trouvent sous `/about/` — **Configuration** (`/about/config/`), **Statistiques**, **Personnaliseur de thème**, **Aperçu du thème**, **Éditeur de navigation**, **Gestionnaire de collections**, **Tableau de bord d'analytique** et **Environnement et build**. Elles lisent directement depuis `_config.yml` et les données de site de Jekyll, il n'y a donc rien à câbler.

## Mise en page d'administration

N'importe quelle page peut utiliser la mise en page d'administration en définissant `layout: admin` dans son frontmatter :

```yaml
---
layout: admin
title: Site Configuration
icon: bi-gear
---
```

### Frontmatter pris en charge

| Champ | Type | Description |
|---|---|---|
| `icon` | chaîne | Classe Bootstrap Icons affichée dans l'en-tête de page (ex. `bi-gear`) |
| `admin_nav` | booléen | Afficher la barre latérale d'administration (par défaut : `true`) |
| `admin_section` | chaîne | Clé de section active pour la mise en évidence dans la barre latérale |
| `admin_actions` | tableau | Boutons d'action de l'en-tête (`label`, `url`, `icon`, `style`) |

### Structure de la mise en page

```text
Admin page
├── Admin header  (breadcrumbs + icon + title + action buttons)
├── Admin sidebar (collapsible; collapses to offcanvas on mobile)
└── Main content  (page body, tab panels, data tables, …)
```

## Navigation d'administration

Un partial de navigation dédié à la barre latérale est inclus automatiquement avec la mise en page d'administration :

```text
_includes/navigation/admin-nav.html
```

Il génère une navigation verticale avec des liens vers toutes les pages d'administration et de paramètres.

## Pages d'administration à onglets

Utilisez le composant `admin-tabs` pour diviser une seule page d'administration en onglets :

```liquid
{% raw %}{% include components/admin-tabs.html
   id="config"
   tabs="view:View Config:bi-eye:true|edit:Edit & Export:bi-pencil-square:false|raw:Raw YAML:bi-file-earmark-code:false"
%}
<div class="tab-content pt-4" id="configTabContent">
  <div class="tab-pane fade show active" id="pane-view" role="tabpanel">
    <!-- your content -->
  </div>
</div>{% endraw %}
```

Chaque définition d'onglet est `id:label:icon:active`, séparée par des barres verticales.

## Pages d'administration intégrées

Le thème fournit plusieurs pages d'administration sous `pages/_about/settings/` :

| Page | Permalien | Objectif |
|---|---|---|
| `config.md` | `/about/settings/config/` | Visualiser et exporter `_config.yml` |
| `theme.md` | `/about/settings/theme/` | Couleurs du thème et surcharges Bootstrap |
| `navigation.md` | `/about/settings/navigation/` | Modifier les données de navigation |
| `analytics.md` | `/about/settings/analytics/` | Paramètres du fournisseur d'analytique |
| `collections.md` | `/about/settings/collections/` | Configuration des collections |
| `environment.md` | `/about/settings/environment/` | Informations sur l'environnement de build |

## Créer une page d'administration personnalisée

```markdown
---
layout: admin
title: My Dashboard
description: Custom dashboard for my site
preview: /images/previews/admin-layout-configuration-dashboards.png
icon: bi-speedometer2
permalink: /admin/my-dashboard/
sidebar:
  nav: docs
---

# My Dashboard

Add your content here. Use Bootstrap 5 components freely.
```

## Associé

- [Navigation dynamique](/docs/features/dynamic-navigation/)
- [Configuration du thème](/docs/customization/)

## Voir aussi

- [[Features]]
- [[Customization]]
