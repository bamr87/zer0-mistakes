---
lastmod: 2026-06-30 00:00:00.000000000 Z
title: Tableau de bord des statistiques
description: Mise en page du tableau de bord des statistiques de contenu avec visualisation
  des métriques pour les articles, catégories et balises de l'ensemble du site.
preview: "/images/previews/statistics-dashboard-feature.png"
layout: default
categories:
- docs
- features
tags:
- dashboard
- statistics
- metrics
- visualization
difficulty: intermediate
estimated_reading_time: 4 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/statistics-dashboard/"
translation_of: pages/_docs/features/statistics-dashboard.md
translation_source_url: "/docs/features/statistics-dashboard/"
machine_translated: true
translated_from_sha: 1c020f7e148c
---

# Tableau de bord des statistiques

Un tableau de bord prêt à l'emploi qui transforme votre contenu en métriques : le nombre d'articles que vous possédez, leur répartition par catégorie et les balises que vous utilisez le plus. Il repose sur une mise en page dédiée ainsi qu'un ensemble de composants d'inclusion modulaires, tous alimentés par des statistiques de contenu générées.

## Aperçu

- **Métriques du nombre d'articles** — l'ensemble du contenu des collections en un coup d'œil.
- **Répartition par catégorie** — visualisez où se concentrent vos écrits.
- **Visualisation en nuage de balises** — faites ressortir vos balises les plus utilisées.
- **Mise en page en cartes responsive** — les panneaux se réorganisent proprement du mobile au bureau.

## Fonctionnement

La mise en page [`stats.html`](https://github.com/bamr87/zer0-mistakes/blob/main/_layouts/stats.html) compose le tableau de bord à partir des partiels situés sous `_includes/stats/` (en-tête, aperçu, catégories, balises et métriques). Les chiffres proviennent des données de statistiques de contenu générées lors de la compilation, de sorte que le tableau de bord reste synchronisé avec votre contenu réel.

## Implémentation

| Fichier | Rôle |
| --- | --- |
| `_layouts/stats.html` | Mise en page de la page du tableau de bord. |
| `_includes/stats/stats-header.html` | Bandeau de titre et de résumé. |
| `_includes/stats/stats-overview.html` | Comptages principaux. |
| `_includes/stats/stats-categories.html` | Répartition par catégorie. |
| `_includes/stats/stats-tags.html` | Nuage de balises. |
| `_includes/stats/stats-metrics.html` | Cartes de métriques détaillées. |

## Fonctionnalités associées

- [Génération SEO et plan du site](/docs/seo/sitemap/)
