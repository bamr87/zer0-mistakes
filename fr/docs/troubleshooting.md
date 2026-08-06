---
title: Dépannage
description: Problèmes courants de configuration et de compilation lors de l'exécution
  de Zer0-Mistakes.
preview: "/images/previews/troubleshooting.png"
layout: default
categories:
- docs
- troubleshooting
tags:
- troubleshooting
- jekyll
- docker
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites: []
lastmod: 2026-06-14 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/troubleshooting/"
translation_of: pages/_docs/troubleshooting.md
translation_source_url: "/docs/troubleshooting/"
machine_translated: true
translated_from_sha: a8990514b26f
---

# Dépannage

Solutions aux problèmes courants lors du développement avec Zer0-Mistakes.

## Problèmes Docker

### Le conteneur ne démarre pas

**Symptômes :** `docker-compose up` échoue ou le conteneur s'arrête immédiatement.

**Solutions :**

```bash
# 1. Clean rebuild
docker-compose down -v
docker-compose up --build

# 2. Check Docker is running
docker info

# 3. View detailed logs
docker-compose logs -f jekyll
```

### Le port 4000 est déjà utilisé

**Symptômes :** Erreur concernant la liaison de port ou l'adresse déjà utilisée.

**Solutions :**

```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use a different port
docker-compose run -p 4001:4000 jekyll
```

### Performances lentes sur macOS

**Symptômes :** Les modifications de fichiers mettent longtemps à être prises en compte.

**Solutions :**

- Activez « Use Rosetta for x86/amd64 emulation » dans les paramètres de Docker Desktop
- Utilisez `docker-compose.yml` qui inclut des optimisations de performances

## Problèmes de compilation Jekyll

### Erreurs de syntaxe Liquid

**Symptômes :** La compilation échoue avec des erreurs de template Liquid.

**Solutions :**

```bash
# Get detailed error output
docker-compose exec jekyll jekyll build --trace

# Check specific file syntax
docker-compose exec jekyll jekyll doctor
```

### Dépendances manquantes

**Symptômes :** `Bundler::GemNotFound` ou erreurs similaires.

**Solutions :**

```bash
# Update bundle
docker-compose exec jekyll bundle install
docker-compose exec jekyll bundle update

# Clean rebuild
docker-compose down -v && docker-compose up --build
```

### Problèmes de configuration

**Symptômes :** Le site ne se charge pas ou des pages sont manquantes.

**Solutions :**

```bash
# Validate configuration
docker-compose exec jekyll jekyll doctor

# Check for YAML syntax errors
# Install yamllint locally or check online validators
```

## Problèmes courants de front matter

### La page n'apparaît pas

Vérifiez ces exigences du front matter :

```yaml
---
layout: default          # Required
title: "Page Title"      # Required
permalink: /your-url/    # Recommended
---
```

### Mauvaise mise en page

Assurez-vous que la mise en page existe dans `_layouts/` :

```yaml
---
layout: article    # Must match a file in _layouts/
---
```

## Problèmes de performances

### Temps de compilation lents

```bash
# Use incremental builds
docker-compose exec jekyll jekyll serve --incremental

# Exclude unnecessary files in _config.yml
exclude:
  - node_modules/
  - vendor/
  - .git/
```

### Le rechargement en direct ne fonctionne pas

Assurez-vous d'utiliser la configuration de développement :

```bash
docker-compose exec jekyll jekyll serve --config "_config.yml,_config_dev.yml"
```

## Obtenir plus d'aide

1. **Consulter les logs :** `docker-compose logs -f jekyll`
2. **Jekyll doctor :** `docker-compose exec jekyll jekyll doctor`
3. **Compilation verbeuse :** `docker-compose exec jekyll jekyll build --verbose --trace`
4. **[Issues GitHub](https://github.com/bamr87/zer0-mistakes/issues) :** Recherchez ou créez une issue

## Associé

- [Guide d'installation](/docs/installation/)
- [Guide Docker](/docs/docker/)
- [Configuration Jekyll](/docs/jekyll/)

## Voir aussi

- [[Installation]]
- [[Docker]]
- [[Ruby]]
- [[Jekyll]]
- [[Obsidian Integration Troubleshooting]]
