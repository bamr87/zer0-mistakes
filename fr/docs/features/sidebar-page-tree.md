---
title: Barre latérale en arborescence de pages — navigation automatique depuis les
  URL de vos pages
description: Construisez automatiquement la barre latérale gauche à partir des URL
  de vos pages — une arborescence repliable groupée par section — sans fichier _data/navigation
  à maintenir.
layout: default
categories:
- docs
- features
tags:
- navigation
- sidebar
- liquid
keywords:
- sidebar navigation
- auto navigation
- page tree
- jekyll liquid
- remote theme
- url hierarchy
date: 2026-07-23 00:00:00.000000000 Z
lastmod: 2026-07-23 00:00:00.000000000 Z
sidebar:
  nav: pages
  base: "/docs/"
  title: All docs
lang: fr
permalink: "/fr/docs/features/sidebar-page-tree/"
translation_of: pages/_docs/features/sidebar-page-tree.md
translation_source_url: "/docs/features/sidebar-page-tree/"
machine_translated: true
translated_from_sha: 78aaa54a3a5c
---

# Barre latérale en arborescence de pages (`nav: pages`)

Le mode de barre latérale `pages` construit l'arborescence de la barre latérale gauche **à partir des URL de votre contenu** — sans fichier `_data/navigation/*.yml` à rédiger ou à maintenir à jour. Indiquez-lui un chemin de base et il liste chaque page sous ce préfixe, groupée par son premier segment de chemin en sections repliables.

Cette page elle-même l'utilise : la barre latérale à gauche correspond à toute la zone `/docs/`, groupée par section, construite uniquement à partir des permaliens de page.

## Quand l'utiliser

- Une zone de documentation, une base de connaissances ou un ensemble de contenu importé où les pages partagent un préfixe d'URL commun (`/docs/`, `/guide/`, `/kb/…`).
- Vous ne voulez pas maintenir (ou générer) manuellement un fichier de données de navigation.

Pour une **collection** Jekyll, le mode [`collection`](/docs/features/sidebar-navigation/) construit déjà une arborescence de dossiers ; `pages` couvre en plus les pages simples (hors collection), et fonctionne pour les deux.

## L'activer

Définissez-le à l'échelle du site, par collection ou par page via le hash `sidebar` :

```yaml
sidebar:
  nav: pages
  base: /docs/            # required — the URL prefix to root the tree at
  order_by: nav_order     # optional — front-matter key to sort each section by
  title: All docs         # optional — sidebar heading
  expand: false           # optional — true expands every section
```

La plupart des sites le définissent une seule fois dans `_config.yml` `defaults` pour la portée de chemin concernée, de sorte que chaque page sous ce chemin obtient l'arborescence automatiquement.

## Comment l'arborescence est construite

- Chaque page (et document de collection) dont l'URL commence par `base` est collectée.
- La page située à `base` elle-même devient le lien « aperçu » en tête.
- Les pages restantes sont groupées par **premier segment de chemin après `base`** (la section), chacune rendue sous forme de groupe repliable. La page d'index d'une section (`…/<section>/`) devient le lien propre du groupe.
- Les libellés de section proviennent du segment d'URL (rendu lisible), de sorte qu'un titre de page d'index générique ne se retrouve jamais dans la barre latérale.

## Ordre de tri

Le tri de Jekyll `sort` prend en compte les valeurs numériques, donc un champ numérique `order_by` donne un ordre naturel :

```yaml
# in each child page's front matter
nav_order: 10   # sorts 0,1,2,…,10,11 (not 0,1,10,11,2)
```

Sans `order_by`, les pages des sections sont triées par URL. Les sections elles-mêmes sont classées par ordre alphabétique.

## Contrôles par page

- `sidebar_label: "Level 3"` — remplace le texte d'un lien unique (sinon le titre de la page).
- `sidebar_exclude: true` — masque une page de l'arborescence.

## Remarques

- Liquid pur — compatible GitHub Pages / remote-theme, aucun plugin requis.
- Seule la page courante est marquée comme active, et la section qui la contient est dépliée au chargement (sans JavaScript).
