---
lastmod: 2026-06-26 00:00:00.000000000 Z
title: Configuration DevContainer pour Codespaces
description: Configuration VS Code Dev Container pour le développement cloud et local
  en un clic — GitHub Codespaces, JetBrains Gateway et VS Code, avec la chaîne d'outils
  Jekyll préinstallée.
keywords:
- jekyll devcontainer
- github codespaces
- codespaces prebuilds
- vs code dev containers
- jekyll dev environment
- docker jekyll
preview: "/images/previews/devcontainer-configuration.png"
layout: default
categories:
- docs
- development
tags:
- devcontainer
- codespaces
- development
- docker
difficulty: beginner
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/devcontainer/"
translation_of: pages/_docs/development/devcontainer.md
translation_source_url: "/docs/development/devcontainer/"
machine_translated: true
translated_from_sha: 4af1a1fd3c52
---

# Configuration DevContainer

zer0-mistakes fournit un `.devcontainer/devcontainer.json` qui vous permet d'ouvrir un environnement de développement Jekyll entièrement configuré en un seul clic — sans installation locale de Ruby, Bundler ou Node.

## Environnements pris en charge

| Environnement | Comment l'ouvrir |
|---|---|
| **GitHub Codespaces** | Cliquez sur **Code → Codespaces → Create codespace on main** |
| **VS Code Dev Containers** | Ouvrez le dossier du dépôt → *Reopen in Container* |
| **JetBrains Gateway** | Connectez-vous à un Codespace ou à un hôte Docker distant |

## Fichier de configuration

```text
.devcontainer/devcontainer.json
```

### Ce qui est préinstallé

Au lieu de récupérer une image de base générique et d'installer les gems à chaque lancement, le devcontainer **se construit à partir du propre [`docker/Dockerfile`](https://github.com/bamr87/zer0-mistakes/blob/main/docker/Dockerfile) du dépôt** (l'étape `dev-test`). Cette étape exécute `bundle install` **au moment de la construction de l'image**, si bien que toute la chaîne d'outils Jekyll est **préchargée dans l'image** — les gems correspondent toujours au `Gemfile.lock` de la branche extraite, et il n'y a aucun `bundle install` lent au premier démarrage.

| Outil | Source |
|---|---|
| Ruby 3.3 + Bundler + chaîne d'outils Jekyll | Étape `docker/Dockerfile` `dev-test` (gems intégrés) |
| GitHub CLI (`gh`) | `devcontainers/features/github-cli:1` |

> Docker-in-Docker et une installation Node autonome sont intentionnellement **non**
> inclus — ils ne sont pas nécessaires au rendu du site (Playwright/Sass s'exécutent sur
> l'hôte), et leur suppression accélère la création de Codespace et les prebuilds.

### Lancement quasi instantané avec les prebuilds

Parce que l'image est autonome, les [prebuilds GitHub Codespaces](https://docs.github.com/en/codespaces/prebuilding-your-codespaces) peuvent la construire à l'avance afin que les nouveaux Codespaces se restaurent depuis une image prête en quelques secondes. Activez-les dans **Settings → Codespaces → Set up prebuild** (cible `main`, déclencheur *On configuration change*). Consultez [`.devcontainer/README.md`](https://github.com/bamr87/zer0-mistakes/blob/main/.devcontainer/README.md).

### Hook post-création

```bash
git config --global --add safe.directory ${containerWorkspaceFolder} && (bundle check || bundle install --jobs 4 --retry 3)
```

`bundle check` est une opération quasi instantanée lorsque les gems sont déjà intégrés à l'image ; il ne se rabat sur une installation complète que si le lockfile a divergé.

### Hook post-démarrage

```bash
bundle exec jekyll serve \
  --config '_config.yml,_config_dev.yml' \
  --host 0.0.0.0 --port 4000 --livereload --force_polling
```

Le serveur de développement Jekyll démarre automatiquement à chaque démarrage du conteneur (`nohup` le maintient actif après le retour du hook ; `--force_polling` rend la surveillance des fichiers fiable sur le bind mount de Codespaces ; les logs arrivent dans `/tmp/jekyll-serve.log`). Le site est disponible à `http://localhost:4000` et redirigé automatiquement dans VS Code et Codespaces.

## Ports redirigés

| Port | Service |
|---|---|
| `4000` | Site Jekyll (s'ouvre automatiquement dans le navigateur) |
| `35729` | LiveReload (silencieux) |

## Extensions VS Code

La configuration recommande ces extensions :

- `sissel.shopify-liquid` — Coloration syntaxique des templates Liquid
- `yzhang.markdown-all-in-one` — Édition Markdown
- `DavidAnson.vscode-markdownlint` — Linting Markdown
- `streetsidesoftware.code-spell-checker` — Vérification orthographique
- `esbenp.prettier-vscode` — Formatage du code
- `ms-azuretools.vscode-docker` — Gestion de Docker

## Utiliser le DevContainer en local

Si Docker Desktop est installé, vous pouvez utiliser le devcontainer sans Codespaces :

1. Installez l'[extension VS Code Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Ouvrez le dossier du dépôt dans VS Code
3. Cliquez sur la notification *Reopen in Container* (ou utilisez la palette de commandes → *Dev Containers: Reopen in Container*)
4. Attendez que le conteneur se construise (~2 à 3 minutes lors de la première exécution)
5. Le site démarre automatiquement sur le port 4000

## Relation avec Docker Compose

Le devcontainer et `docker-compose.yml` servent des objectifs différents :

| `devcontainer.json` | `docker-compose.yml` |
|---|---|
| Intégration IDE VS Code / Codespaces | Serveur de développement d'équipe + stack multi-services |
| Recommandations d'extensions, synchronisation des paramètres | Environnement identique à la production |
| Démarrage automatique de Jekyll au lancement du conteneur | `docker-compose up` explicite requis |

Vous pouvez utiliser l'un ou l'autre (ou les deux) selon votre flux de travail.

## Voir aussi

- [Développement Docker](/docs/docker/)
- [Guide de démarrage rapide](/docs/getting-started/quick-start/)
- [Publication Docker locale](/docs/development/docker-publishing/)

## Voir aussi

- [[Development]]
- [[Docker]]
- [[Getting Started]]
