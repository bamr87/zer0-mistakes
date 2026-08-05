---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Gestion des versions
description: Aperçu du processus de publication pour le thème Zer0-Mistakes. Consultez
  docs/ pour la référence complète de l'automatisation des versions.
preview: "/images/previews/release-management.png"
layout: default
categories:
- docs
- development
tags:
- release
- versioning
- changelog
- rubygems
difficulty: advanced
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/release-management/"
translation_of: pages/_docs/development/release-management.md
translation_source_url: "/docs/development/release-management/"
machine_translated: true
translated_from_sha: 7d4039713c7b
---

# Gestion des versions

Les versions suivent [Conventional Commits](https://www.conventionalcommits.org/) et [Semantic Versioning](https://semver.org/). Le processus de publication est entièrement automatisé via `scripts/bin/release` :

```bash
./scripts/bin/release patch           # e.g. 1.9.8 → 1.9.9
./scripts/bin/release minor           # e.g. 1.9.8 → 1.10.0
./scripts/bin/release patch --dry-run # preview without changes
```

La commande gère l'incrémentation de version, la génération du CHANGELOG, la construction de la gem, la publication sur RubyGems et la création de la release GitHub en une seule étape.

## Référence complète

Le guide complet d'automatisation des versions — workflow en 10 étapes, options, dépannage, architecture des bibliothèques — se trouve dans la documentation des contributeurs :

**[Automatisation des versions → docs/systems/release-automation.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/systems/release-automation.md)**

Voir aussi : [Système de version automatisé → docs/systems/automated-version-system.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/systems/automated-version-system.md)
