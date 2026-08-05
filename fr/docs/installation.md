---
title: Installation
description: Prérequis et étapes de configuration pour exécuter Zer0-Mistakes en local.
preview: "/images/previews/installation.png"
layout: default
categories:
- docs
- setup
tags:
- installation
- prerequisites
- docker
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites: []
lastmod: 2026-06-16 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/installation/"
translation_of: pages/_docs/installation.md
translation_source_url: "/docs/installation/"
machine_translated: true
translated_from_sha: d7b38e187a11
---

# Installation

Lancez-vous avec Zer0-Mistakes en quelques minutes grâce à notre approche Docker-first.

## Prérequis

### Recommandé : Docker (zéro configuration)

- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** - Fonctionne sur macOS, Windows et Linux
- Aucune gestion de Ruby, Bundler ou gems requise

### Alternative : Ruby natif

Si vous préférez le développement Ruby local :

- **Ruby 3.0+** avec les en-têtes de développement
- **Bundler 2.0+** pour la gestion des dépendances
- Outils de compilation spécifiques à la plateforme (Xcode CLI sur macOS, build-essential sur Linux)

## Démarrage rapide avec Docker

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start the development server
docker-compose up
```

Ouvrez [http://localhost:4000](http://localhost:4000) dans votre navigateur.

## Guides spécifiques à chaque plateforme

### macOS

```bash
# Install Docker Desktop
brew install --cask docker

# Or install Ruby natively
brew install ruby
gem install bundler jekyll
```

Pour une configuration macOS détaillée : [Installation de Jekyll sur macOS](https://jekyllrb.com/docs/installation/macos/)

### Windows

1. Installez [Docker Desktop pour Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Activez le backend WSL 2 pour de meilleures performances
3. Clonez et exécutez dans PowerShell ou un terminal WSL

Pour Ruby natif : [Installation de Jekyll sur Windows](https://jekyllrb.com/docs/installation/windows/)

### Linux (Ubuntu/Debian)

```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Or install Ruby natively  
sudo apt-get install ruby-full build-essential
gem install bundler jekyll
```

Pour une configuration Linux détaillée : [Installation de Jekyll sur Ubuntu](https://jekyllrb.com/docs/installation/ubuntu/)

## Vérification de l'installation

Après avoir démarré le serveur, vérifiez que tout fonctionne :

```bash
# Check Jekyll version (in Docker)
docker-compose exec jekyll jekyll --version

# Check for configuration issues
docker-compose exec jekyll jekyll doctor
```

## Étapes suivantes

- [Guide de développement Docker](/docs/docker/) - Apprenez les commandes et flux de travail Docker
- [Configuration de Jekyll](/docs/jekyll/) - Personnalisez votre site
- [Dépannage](/docs/troubleshooting/) - Problèmes courants et solutions

## Référence technique

Pour les détails de niveau contributeur (architecture de l'installeur, système de profils, configuration assistée par IA) :

- [Guide d'installation → docs/installation/index.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/index.md)
- [Guide de fork → docs/installation/forking.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/forking.md)

## Voir aussi

- [[Docker]]
- [[Ruby]]
- [[Jekyll]]
- [[front-matter]]
- [[Customization]]
