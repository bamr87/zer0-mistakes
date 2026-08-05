---
lastmod: 2026-04-18 19:30:01.000000000 Z
title: Déploiement
description: Déployez votre site Jekyll Zer0-Mistakes sur diverses plateformes d'hébergement.
preview: "/images/previews/deployment.png"
layout: default
categories:
- docs
- deployment
tags:
- deployment
- hosting
- github-pages
- netlify
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/deployment/"
translation_of: pages/_docs/deployment/index.md
translation_source_url: "/docs/deployment/"
machine_translated: true
translated_from_sha: e2264346b00d
---

# Déploiement

Déployez votre site Jekyll Zer0-Mistakes sur diverses plateformes d'hébergement.

## Options d'hébergement

| Plateforme | Avantages | Inconvénients |
|----------|------|------|
| **GitHub Pages** | Gratuit, déploiements automatiques, CI intégré | Plugins limités, liste blanche uniquement |
| **Netlify** | Offre gratuite, en-têtes personnalisés, formulaires | Nécessite un compte distinct |
| **Vercel** | CDN rapide, fonctions serverless | Jekyll n'est pas la priorité |
| **Auto-hébergé** | Contrôle total | Nécessite la gestion d'un serveur |

## Guides de cette section

- **[GitHub Pages](github-pages/)** — Déployez sur l'hébergement gratuit de GitHub
- **[Liste de contrôle du consommateur Remote-Theme](remote-theme-checklist/)** — Ce que `remote_theme` ne fournit pas, et comment combler les lacunes
- **[Superposition de build en mode sécurisé](build-overlay/)** — Reproduisez un build GitHub Pages dans votre propre CI (clonage → superposition → suppression `_plugins` → build strict)
- **[Netlify](netlify/)** — Déployez avec des en-têtes et redirections personnalisés
- **[Domaine personnalisé](custom-domain/)** — Configurez votre propre nom de domaine

## Déploiement rapide

### GitHub Pages (le plus rapide)

1. Poussez votre site vers un dépôt GitHub
2. Allez dans **Settings** → **Pages**
3. Sélectionnez votre branche (généralement `main`)
4. Le site se déploie automatiquement

### Netlify (le plus complet)

1. Connectez votre dépôt GitHub à Netlify
2. Définissez la commande de build : `jekyll build`
3. Définissez le répertoire de publication : `_site`
4. Le déploiement se déclenche à chaque push

## Configuration de l'environnement

Le thème utilise une double configuration pour différents environnements :

| Fichier | Objectif |
|------|---------|
| `_config.yml` | Paramètres de production |
| `_config_dev.yml` | Surcharges de développement |

En production, assurez-vous que :

- `posthog.enabled: true` (si vous utilisez l'analytique)
- `url` correspond à votre domaine
- `baseurl` est correctement défini pour les sous-chemins

## Étapes suivantes

- [Guide GitHub Pages](github-pages/) — Hébergement gratuit avec déploiements automatiques
- [Guide Netlify](netlify/) — Fonctionnalités d'hébergement avancées
- [Configuration d'un domaine personnalisé](custom-domain/) — Utilisez votre propre domaine

## Voir aussi

- [[Docker]]
- [[Jekyll]]
- [[SEO]]
- [[Analytics]]
