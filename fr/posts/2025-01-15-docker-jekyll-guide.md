---
title: 'Docker pour le développement Jekyll : un guide complet'
description: Configurez un environnement Jekyll basé sur Docker avec live reload,
  mise en cache des gems et le motif à double configuration pour des builds cohérents
  sur macOS, Windows et Linux.
categories:
- Development
- Tutorial
tags:
- docker
- jekyll
- devops
- containerization
keywords:
- docker jekyll development
- jekyll docker compose
- containerized jekyll
- bundle cache volume
- jekyll dual-config pattern
- jekyll live reload docker
date: 2025-01-15 10:00:00.000000000 Z
layout: article
preview: "/images/favicon_gpt_computer_retro.png"
author: default
featured: true
estimated_reading_time: 8 minutes
draft: true
lastmod: 2026-09-05 00:00:00.000000000 Z
lang: fr
permalink: "/fr/posts/2025/01/15/docker-jekyll-guide/"
translation_of: pages/_posts/2025-01-15-docker-jekyll-guide.md
translation_source_url: "/posts/2025/01/15/docker-jekyll-guide/"
machine_translated: true
translated_from_sha: 5206782e4767
---

Docker vous offre le même environnement Jekyll sur chaque machine — même Ruby, mêmes gems, même résultat de build que vous soyez sur macOS, Windows ou Linux. Ce guide détaille la configuration compose que ce thème utilise réellement, ainsi que les trois décisions que la plupart des guides Docker/Jekyll gèrent mal.

> **Gagnez du temps :** le [Site Builder](/quickstart/site-builder/) du thème génère un `docker-compose.yml` comme celui ci-dessous pour votre propre site, l'écrit sur le disque et peut exécuter `docker compose up` pour vous pendant que Claude explique le résultat. Tout ce qui figure sur cette page reste valable lorsque vous souhaitez comprendre ou ajuster ce qu'il a produit.

## Pourquoi utiliser Docker pour Jekyll ?

Docker fournit un environnement de développement cohérent sur toutes les plateformes :

- **Compatibilité multiplateforme** : fonctionne de la même façon sur Windows, macOS et Linux
- **Aucune installation de Ruby requise** : toutes les dépendances sont conteneurisées
- **Builds cohérents** : éliminez les problèmes du type « ça marche sur ma machine »
- **Intégration d'équipe facilitée** : les nouveaux développeurs peuvent démarrer immédiatement

## Configurer votre environnement Docker

Voici une configuration `docker-compose.yml` de base :

```yaml
services:
  jekyll:
    # This theme builds its own image rather than using jekyll/jekyll: the
    # dev-test stage carries the full Jekyll + tooling toolchain.
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: dev-test
    ports:
      - "4000:4000"
      - "35729:35729"        # LiveReload
    volumes:
      - .:/site
      - bundle_cache:/usr/local/bundle
    environment:
      - JEKYLL_ENV=development
    command: >
      sh -c "(bundle check || bundle install) &&
             bundle exec jekyll serve --watch --livereload
             --config '_config.yml,_config_dev.yml' --host 0.0.0.0 --port 4000"

volumes:
  bundle_cache:
```

Vous démarrez un site à partir de zéro plutôt que de travailler dans ce dépôt ? Remplacez le bloc `build:` par `image: jekyll/jekyll:4` et montez votre site sur `/srv/jekyll` — le reste du fichier reste inchangé.

Trois éléments de ce fichier sont délibérés, et tous trois correspondent à des points que les anciens guides Docker/Jekyll disponibles sur le web gèrent mal :

**Pas de clé `version:`.** La Compose Specification l'a abandonnée en 2022. Les versions modernes de `docker compose` l'ignorent et affichent un avertissement lorsqu'elle est présente.

**Aucun figeage de `platform:`.** Forcer `linux/amd64` exécute toute l'image sous émulation QEMU sur Apple Silicon, ce qui coûte 3 à 10× sur `apt`, `bundle install` et les compilations natives de gems. Docker construit votre architecture native par défaut et Jekyll fonctionne de manière identique. N'exportez `DOCKER_DEFAULT_PLATFORM=linux/amd64` que lorsque vous avez spécifiquement besoin d'une parité x86 avec la production.

**Un volume nommé pour les gems.** `bundle_cache` conserve les gems installés en dehors du bind mount, de sorte qu'un rebuild ne les réinstalle pas et que votre hôte reste propre.

## Commandes Docker essentielles

Démarrez votre serveur de développement :

```bash
docker compose up
```

Construisez votre site :

```bash
docker compose exec -T jekyll bundle exec jekyll build \
  --config '_config.yml,_config_dev.yml'
```

Passez par Bundler plutôt que d'appeler `jekyll` directement : un simple `jekyll` peut silencieusement se résoudre vers une version de gem différente de celle que fige votre `Gemfile.lock`.

## Le motif à double configuration

Remarquez le `--config '_config.yml,_config_dev.yml'` dans la commande. Jekyll superpose les fichiers de configuration de gauche à droite, de sorte que le second fichier remplace le premier. Les paramètres de production résident dans `_config.yml` ; le fichier de développement modifie la poignée de clés qui doivent différer en local — une URL `localhost`, le live reload, les analytics désactivés et le thème local au lieu du thème distant.

Une mise en garde : Jekyll **remplace** au lieu de fusionner les clés de type liste comme `exclude:` et `plugins:`. Une liste courte dans le fichier de développement écarte silencieusement celle de production, alors gardez les deux synchronisées.

## Bonnes pratiques

1. **Utilisez des montages de volumes** pour le live reloading, et un volume nommé pour les gems
2. **Laissez Docker choisir l'architecture** plutôt que de figer `platform:`
3. **Définissez des variables d'environnement** pour le développement et la production
4. **Gardez les conteneurs légers** avec un minimum de dépendances
5. **Superposez vos configurations** au lieu de maintenir deux copies complètes

Exécutez `docker compose up` et ouvrez `http://localhost:4000` — votre site s'exécute avec le live reload depuis un conteneur propre et portable, et votre hôte reste exempt de Ruby.
