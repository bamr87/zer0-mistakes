---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Mises à jour des dépendances
description: Guide de la gestion automatisée des dépendances et des mises à jour de
  gems Ruby pour le thème Zer0-Mistakes.
preview: "/images/previews/dependency-updates.png"
layout: default
categories:
- docs
- development
tags:
- dependencies
- gems
- automation
- security
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites:
- GitHub repository access
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/dependency-updates/"
translation_of: pages/_docs/development/dependency-updates.md
translation_source_url: "/docs/development/dependency-updates/"
machine_translated: true
translated_from_sha: 42c6899a9066
---

# Mises à jour des dépendances

Le thème utilise une stratégie Zero-Pin : `Gemfile` ne spécifie aucune version épinglée ; `Gemfile.lock` est validé pour garantir des builds reproductibles. Les dépendances sont mises à jour chaque semaine via `bundle update` et un petit workflow de PR automatisé.

## Référence rapide

```bash
# Update all gems
bundle update

# Check for security advisories
bundle exec bundle-audit check --update

# Verify site still builds
bundle exec jekyll build
```

## Référence complète

Le guide complet de gestion des dépendances — justification de la stratégie Zero-Pin, configuration de Dependabot, politique de mise à jour, gestion du lockfile :

**[Gestion des dépendances → docs/systems/dependency-management.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/systems/dependency-management.md)**
