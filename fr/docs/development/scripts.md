---
lastmod: 2026-04-18 19:29:54.000000000 Z
title: Scripts
description: Guide de la bibliothèque d'automatisation par scripts shell pour la construction,
  les tests et la publication du thème Zer0-Mistakes.
preview: "/images/previews/scripts.png"
layout: default
categories:
- docs
- development
tags:
- scripts
- automation
- bash
- utilities
difficulty: intermediate
estimated_reading_time: 15 minutes
prerequisites:
- Bash shell
- Docker (optional)
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/scripts/"
translation_of: pages/_docs/development/scripts.md
translation_source_url: "/docs/development/scripts/"
machine_translated: true
translated_from_sha: 36431e67c424
---

# Bibliothèque d'automatisation de scripts shell

Le thème Zer0-Mistakes inclut une bibliothèque complète de scripts shell pour automatiser les tâches de développement courantes.

## Inventaire des scripts

### Scripts principaux

| Script | Objectif | Utilisation |
|--------|---------|-------|
| `version.sh` | Gestion sémantique des versions | `./scripts/version.sh [patch\|minor\|major]` |
| `build.sh` | Construire le site Jekyll et la gem | `./scripts/build.sh` |
| `release.sh` | Flux de travail complet de publication | `./scripts/release.sh` |
| `setup.sh` | Configuration initiale du projet | `./scripts/setup.sh` |

### Scripts utilitaires

| Script | Objectif | Utilisation |
|--------|---------|-------|
| `convert-notebooks.sh` | Convertir des notebooks Jupyter | `./scripts/convert-notebooks.sh` |
| `generate-preview-images.sh` | Générer des aperçus d'articles | `./scripts/generate-preview-images.sh` |
| `analyze-commits.sh` | Analyser l'historique des commits | `./scripts/analyze-commits.sh` |
| `fix-markdown-format.sh` | Corriger le formatage Markdown | `./scripts/fix-markdown-format.sh` |

## Gestion des versions

### `version.sh`

Gère le versionnement sémantique du thème :

```bash
# Bump patch version (0.0.x) - bug fixes
./scripts/version.sh patch

# Bump minor version (0.x.0) - new features
./scripts/version.sh minor

# Bump major version (x.0.0) - breaking changes
./scripts/version.sh major

# Preview changes (dry run)
./scripts/version.sh patch --dry-run
```

**Ce qu'il fait :**

- Met à jour `lib/jekyll-theme-zer0/version.rb`
- Met à jour `package.json`
- Crée un commit et un tag git
- Pousse éventuellement vers le dépôt distant

## Construction

### `build.sh`

Construit le site Jekyll et le paquet gem :

```bash
# Standard build
./scripts/build.sh

# Clean build (removes _site first)
./scripts/build.sh --clean

# Build gem only
./scripts/build.sh --gem-only

# Build site only
./scripts/build.sh --site-only
```

**Sortie :**

- `_site/` - Site Jekyll construit
- `jekyll-theme-zer0-X.Y.Z.gem` - Paquet gem

## Publication

### `release.sh`

Automatisation complète du flux de travail de publication :

```bash
# Full release (tests, build, publish)
./scripts/release.sh

# Skip tests
./scripts/release.sh --skip-tests

# Dry run (preview only)
./scripts/release.sh --dry-run

# Create draft release
./scripts/release.sh --draft

# Mark as prerelease
./scripts/release.sh --prerelease
```

**Étapes de publication :**

1. Exécuter la suite de tests
2. Construire le paquet gem
3. Publier sur RubyGems.org
4. Créer une release GitHub
5. Téléverser les ressources

## Configuration

### `setup.sh`

Configuration initiale du projet pour les nouveaux contributeurs :

```bash
# Full setup
./scripts/setup.sh

# Skip dependency installation
./scripts/setup.sh --skip-deps

# Docker-only setup
./scripts/setup.sh --docker
```

**Ce qu'il configure :**

- Environnement Ruby
- Dépendances Bundler
- Conteneurs Docker
- Hooks Git

## Standards de développement des scripts

### Structure du modèle

```bash
#!/bin/bash
#
# Script Name: example.sh
# Description: Brief description
# Usage: ./scripts/example.sh [options]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logging functions
log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1" >&2; }

# Error handling
trap 'log_error "Error on line $LINENO"' ERR

# Main function
main() {
    log_info "Starting script..."
    # Script logic here
    log_success "Done!"
}

main "$@"
```

### Gestion des erreurs

Utilisez toujours le mode strict :

```bash
set -euo pipefail

# -e: Exit on error
# -u: Error on undefined variables
# -o pipefail: Fail on pipe errors
```

### Fonctions de journalisation

Sortie colorée cohérente :

```bash
log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}
```

### Validation des paramètres

```bash
# Validate required arguments
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <argument>"
    exit 1
fi

# Validate specific values
case "$1" in
    patch|minor|major)
        VERSION_TYPE="$1"
        ;;
    *)
        log_error "Invalid version type"
        exit 1
        ;;
esac
```

### Détection de l'environnement

```bash
# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        MINGW*)     echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64)     echo "amd64" ;;
        arm64)      echo "arm64" ;;
        aarch64)    echo "arm64" ;;
        *)          echo "unknown" ;;
    esac
}
```

## Exécution des scripts

### Exécution directe

```bash
# Make executable (if needed)
chmod +x ./scripts/script-name.sh

# Run script
./scripts/script-name.sh
```

### Dans Docker

```bash
# Run in Jekyll container
docker-compose exec jekyll ./scripts/script-name.sh
```

### Via Make

```bash
# If Makefile targets exist
make build
make release
make test
```

## Dépannage

### Permission refusée

```bash
chmod +x ./scripts/script-name.sh
```

### Commande introuvable

Assurez-vous que les dépendances sont installées :

```bash
# Check Ruby
ruby --version

# Check Bundler
bundle --version

# Check Git
git --version
```

### Le script échoue dans Docker

Vérifiez que le conteneur est en cours d'exécution :

```bash
docker-compose ps
docker-compose up -d
```

## Connexes

- [Guide de tests](/docs/development/testing/)
- [Gestion des versions](/docs/development/release-management/)
- [Pipeline CI/CD](/docs/development/ci-cd/)

## Voir aussi

- [[Development]]
- [[Release Management]]
- [[CI/CD Pipeline]]
