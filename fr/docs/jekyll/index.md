---
lastmod: 2026-06-14 00:00:00.000000000 Z
title: Jekyll
description: Notions de base de Jekyll et flux de travail de développement Zer0-Mistakes
  (priorité à Docker).
preview: "/images/previews/jekyll.png"
layout: default
categories:
- docs
- jekyll
tags:
- jekyll
- getting-started
- docker
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites:
- Docker Desktop (recommended) or Ruby + Bundler
sidebar:
  nav: docs
draft: false
lang: fr
permalink: "/fr/docs/jekyll/"
translation_of: pages/_docs/jekyll/index.md
translation_source_url: "/docs/jekyll/"
machine_translated: true
translated_from_sha: fa145fad7d08
---

# Jekyll

Jekyll est le générateur de site statique qui propulse Zer0-Mistakes. Cette section couvre tout ce dont vous avez besoin pour travailler efficacement avec Jekyll.

## Démarrage rapide

### Prérequis

- Suivez le [Guide d'installation](/docs/installation/)
- Ayez Docker Desktop en cours d'exécution (ou Ruby + Bundler installés)

### Exécuter en local

```bash
# With Docker (recommended)
docker-compose up

# Without Docker
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

Votre site sera accessible à l'adresse [http://localhost:4000](http://localhost:4000).

## Concepts clés

### Structure des répertoires

| Répertoire | Rôle |
|-----------|---------|
| `_layouts/` | Modèles de pages (HTML avec Liquid) |
| `_includes/` | Composants réutilisables |
| `_data/` | Fichiers de données du site (YAML, JSON) |
| `_sass/` | Fragments de feuilles de style |
| `pages/` | Collections de contenu |
| `assets/` | Fichiers statiques (CSS, JS, images) |

### Fichiers de configuration

| Fichier | Rôle |
|------|---------|
| `_config.yml` | Configuration de production |
| `_config_dev.yml` | Surcharges de développement |
| `Gemfile` | Dépendances Ruby |

### Collections de contenu

Zer0-Mistakes organise le contenu en collections sous `pages/` :

- `_posts/` - Articles de blog
- `_docs/` - Documentation
- `_quests/` - Tutoriels et parcours d'apprentissage
- `_about/` - Pages « À propos »

## Commandes essentielles

```bash
# Build the site
docker-compose exec jekyll jekyll build

# Build with verbose output
docker-compose exec jekyll jekyll build --verbose

# Check for configuration issues
docker-compose exec jekyll jekyll doctor

# Clean build artifacts
docker-compose exec jekyll jekyll clean
```

## Sujets de documentation

### Configuration et installation

- [Configuration de Jekyll](/docs/jekyll/) — Paramètres et options du site
- [Front Matter](/docs/front-matter/) — Métadonnées et options de page
- [Coloration syntaxique](/docs/jekyll/code-highlighting/) — Mise en évidence du code
- [Pagination](/docs/jekyll/pagination/) — Navigation entre les articles

### Fonctionnalités

Consultez la section [Fonctionnalités](/docs/features/) pour :

- [Diagrammes Mermaid](/docs/features/mermaid-diagrams/) — Organigrammes et diagrammes
- [Mathématiques MathJax](/docs/features/mathjax-math/) — Notation mathématique
- [Commentaires Giscus](/docs/features/giscus-comments/) — Commentaires via GitHub Discussions
- [Analytique PostHog](/docs/features/posthog-analytics/) — Analytique respectueuse de la vie privée

### Déploiement

Consultez la section [Déploiement](/docs/deployment/) pour :

- [GitHub Pages](/docs/deployment/github-pages/) — Hébergement gratuit avec GitHub
- [Netlify](/docs/deployment/netlify/) — Fonctionnalités d'hébergement avancées
- [Domaine personnalisé](/docs/deployment/custom-domain/) — Utilisez votre propre domaine

## Ressources

- [Documentation officielle de Jekyll](https://jekyllrb.com/docs/)
- [Dépôt GitHub de Jekyll](https://github.com/jekyll/jekyll)
- [Langage de templates Liquid](https://shopify.github.io/liquid/)

## Voir aussi

- [Ruby et Bundler](/docs/ruby/) — Gestion des dépendances Ruby
- [Templating Liquid](/docs/liquid/) — Référence du langage de templates
- [Développement Docker](/docs/docker/) — Flux de travail basé sur les conteneurs

## Voir aussi

- [[Liquid]]
- [[Ruby]]
- [[Docker]]
- [[Customization]]
- [[front-matter]]
