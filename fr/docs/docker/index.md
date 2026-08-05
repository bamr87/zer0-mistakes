---
title: Docker
description: Workflow Docker-first pour développer et tester Zer0-Mistakes.
preview: "/images/previews/docker.png"
layout: default
categories:
- docs
- docker
tags:
- docker
- docker-compose
difficulty: beginner
estimated_reading_time: 5 minutes
prerequisites:
- Docker Desktop
lastmod: 2026-06-14 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/docker/"
translation_of: pages/_docs/docker/index.md
translation_source_url: "/docs/docker/"
machine_translated: true
translated_from_sha: cc9ee3edfdce
---

# Développement avec Docker

Zer0-Mistakes utilise une approche **Docker-first** pour un développement cohérent sur toutes les plateformes.

## Commandes essentielles

### Démarrer le développement

```bash
# Start development server (foreground, see logs)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# View logs when running in background
docker-compose logs -f jekyll
```

Votre site sera accessible à l'adresse [http://localhost:4000](http://localhost:4000).

### Arrêter le développement

```bash
# Stop containers (preserves data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

### Reconstruction

```bash
# Rebuild after Gemfile changes
docker-compose up --build

# Force complete rebuild
docker-compose down && docker-compose up --build
```

## Travailler à l'intérieur du conteneur

```bash
# Open a shell in the container
docker-compose exec jekyll bash

# Run Jekyll commands directly
docker-compose exec jekyll jekyll build
docker-compose exec jekyll jekyll doctor
docker-compose exec jekyll bundle update
```

## Fichiers de configuration

| Fichier | Rôle |
|------|---------|
| `docker-compose.yml` | Configuration principale de développement |
| `docker-compose.prod.yml` | Paramètres de build de production |
| `docker-compose.test.yml` | Configuration de test |

## Prise en charge d'Apple Silicon (M1/M2/M3)

La configuration Docker inclut la compatibilité des plateformes :

```yaml
services:
  jekyll:
    platform: linux/amd64  # Ensures compatibility
```

## Tâches courantes

### Reconstruction propre

```bash
docker-compose down -v
docker-compose up --build
```

### Vérifier la configuration

```bash
docker-compose exec jekyll jekyll doctor
```

### Mettre à jour les dépendances

```bash
docker-compose exec jekyll bundle update
```

## Dépannage

**Port déjà utilisé :**

```bash
# Find process using port 4000
lsof -i :4000
# Kill it or use a different port
docker-compose up -p 4001:4000
```

**Le conteneur ne démarre pas :**

```bash
# Check logs for errors
docker-compose logs jekyll

# Try clean rebuild
docker-compose down -v && docker-compose up --build
```

## Ressources associées

- [Guide d'installation](/docs/installation/)
- [Dépannage](/docs/troubleshooting/)
- [Configuration Jekyll](/docs/jekyll/)

## Voir aussi

- [[Jekyll]]
- [[Ruby]]
- [[Deployment]]
- [[Installation]]
