---
lastmod: 2026-06-14 00:00:00.000000000 Z
title: Pipeline de publication Docker en local
description: Publiez la gem jekyll-theme-zer0 depuis un conteneur Docker propre, en
  reproduisant le chemin de release CI pour des builds reproductibles sans toucher
  au Ruby de l'hôte.
preview: "/images/previews/local-docker-publishing-pipeline.png"
layout: default
categories:
- docs
- development
tags:
- docker
- release
- ci-cd
- gem
- automation
difficulty: advanced
estimated_reading_time: 10 minutes
prerequisites:
- Docker Desktop
- RubyGems API key
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/docker-publishing/"
translation_of: pages/_docs/development/docker-publishing.md
translation_source_url: "/docs/development/docker-publishing/"
machine_translated: true
translated_from_sha: 2c3546d339fc
---

# Pipeline de publication Docker en local

Vous pouvez compiler et publier la gem `jekyll-theme-zer0` entièrement à l'intérieur d'un conteneur Docker. Cela reproduit exactement le chemin de release CI, évitant les problèmes de décalage de version causés par des environnements Ruby différents sur l'hôte.

## Pourquoi exécuter les releases dans Docker ?

| Problème | Solution Docker |
|---|---|
| Incompatibilité de version Ruby sur l'hôte | Le conteneur utilise le même Ruby que la CI |
| Environnement de gems pollué | Conteneur propre supprimé après exécution |
| « Ça marche sur ma machine » | Environnement CI exact reproduit en local |
| Fuites de données sensibles | Identifiants injectés via des variables d'environnement, jamais stockés |

## Fichiers Compose

| Fichier | Objet |
|---|---|
| `docker-compose.publish.yml` | Compile et pousse l'image Docker vers un registre |
| `docker-compose.prod.yml` | Déploiement en production avec des tags d'image figés |

## Publier la gem en local

L'approche recommandée est le script de release unifié, qui gère tout :

```bash
./scripts/bin/release patch    # or minor / major
```

Ce script :

1. Analyse les commits depuis le dernier tag pour confirmer le type d'incrément
2. Met à jour `lib/jekyll-theme-zer0/version.rb`
3. Exécute la validation (`./scripts/bin/validate`)
4. Compile la gem (`gem build jekyll-theme-zer0.gemspec`)
5. Crée un tag git et le pousse
6. Publie sur RubyGems (`gem push`)

Passez `--dry-run` pour prévisualiser sans publier :

```bash
./scripts/bin/release patch --dry-run
```

## Exécution dans un conteneur Docker

Pour exécuter manuellement la release dans un conteneur Docker :

```bash
# Start a clean Jekyll container
docker compose -f docker-compose.yml run --rm jekyll bash

# Inside the container:
./scripts/bin/release patch
```

Ou avec le fichier compose de publication :

```bash
docker compose -f docker-compose.yml \
               -f docker-compose.publish.yml \
               build publish
```

## Variables d'environnement

Définissez les identifiants dans `.env` (ne committez jamais ce fichier) :

```bash
RUBYGEMS_API_KEY=rubygems_...
GITHUB_TOKEN=ghp_...
DOCKER_IMAGE=amrabdel/zer0-mistakes
IMAGE_TAG=latest
```

Le fichier `.env` est déjà présent dans `.gitignore`.

## Équivalent du pipeline CI

GitHub Actions exécute automatiquement le même pipeline de release sur les tags de version :

```yaml
# .github/workflows/release.yml (simplified)
- name: Build gem
  run: gem build jekyll-theme-zer0.gemspec

- name: Publish to RubyGems
  run: gem push jekyll-theme-zer0-${{ env.VERSION }}.gem
  env:
    GEM_HOST_API_KEY: ${{ secrets.RUBYGEMS_API_KEY }}
```

## Dépannage

### « Clé API invalide »

Définissez `RUBYGEMS_API_KEY` dans votre shell ou votre fichier `.env` :

```bash
export RUBYGEMS_API_KEY=$(cat ~/.gem/credentials | grep rubygems_api_key | cut -d' ' -f2)
```

### Gem déjà publiée pour cette version

Incrémentez la version et relancez. RubyGems n'autorise pas l'écrasement d'une version déjà publiée.

### Échec de la compilation Docker

```bash
docker compose down -v
docker compose build --no-cache
```

## Ressources associées

- [Gestion des releases](/docs/development/release-management/)
- [Pipeline CI/CD](/docs/development/ci-cd/)
- [Configuration DevContainer](/docs/development/devcontainer/)

## Voir aussi

- [[Development]]
- [[Docker]]
- [[Release Management]]
