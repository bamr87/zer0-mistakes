---
lastmod: 2026-06-14 00:00:00.000000000 Z
title: AGENTS.md — Point d'entrée pour agents IA multi-outils
description: Comment le fichier AGENTS.md à la racine du dépôt offre aux agents de
  codage IA — Copilot, Codex, Cursor, Aider, Jules, Continue et Claude Code — une
  source de vérité unique.
preview: "/images/previews/agents-md-cross-tool-ai-agent-entry-point.png"
layout: default
categories:
- docs
- development
tags:
- ai
- agents
- documentation
- copilot
- cursor
difficulty: intermediate
estimated_reading_time: 8 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/agents/"
translation_of: pages/_docs/development/agents.md
translation_source_url: "/docs/development/agents/"
machine_translated: true
translated_from_sha: 4edda52c2a18
---

# AGENTS.md — Point d'entrée pour agents IA multi-outils

`AGENTS.md` à la racine du dépôt est un fichier d'entrée unique et concis destiné aux agents de codage IA. Il suit la convention émergente [agents.md](https://agents.md/) et est lu par GitHub Copilot, OpenAI Codex, Cursor, Aider, Jules, Continue, Claude Code et tout autre agent qui respecte cette convention.

## Pourquoi AGENTS.md ?

Chaque outil IA possède son propre format de fichier de configuration :

| Outil | Son propre fichier |
|---|---|
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | règles `.cursor/` |
| Aider | `.aider.conf.yml` |
| Continue | `.continuerc.json` |

Plutôt que de maintenir des fichiers d'instructions distincts au contenu dupliqué, `AGENTS.md` fait office de **point d'entrée multi-outils** qui renvoie vers les recommandations détaillées de référence déjà présentes dans `.github/`. Cela évite les divergences et préserve une source de vérité unique.

## Emplacement du fichier

```text
AGENTS.md   ← repository root
```

GitHub Copilot le lit également comme contexte complémentaire. Les autres outils qui prennent en charge la convention `AGENTS.md` le découvriront automatiquement.

## Ce qu'il contient

`AGENTS.md` est volontairement concis. Il couvre :

1. **Aperçu du projet** — ce qu'est le dépôt, les langages principaux, la source de vérité pour la version
2. **Carte des recommandations** — un tableau indiquant quel fichier consulter pour quelle tâche
3. **Commandes essentielles** — le petit ensemble de commandes dont chaque agent a besoin
4. **Règles de fonctionnement** — sept règles concises (modifications minimales, validation avant la fin, etc.)
5. **Guide d'extension** — comment ajouter de nouvelles capacités d'agent

## Modèle de recommandations en couches

```text
AGENTS.md          ← Cross-tool entry point (always read first)
    │
    ├── .github/copilot-instructions.md  ← Full architecture & conventions
    │
    └── .github/instructions/*.instructions.md  ← File-scoped rules
            layouts.instructions.md       → _layouts/**
            includes.instructions.md      → _includes/**
            scripts.instructions.md       → scripts/**
            sass.instructions.md          → _sass/**, assets/css/**
            obsidian.instructions.md      → _plugins/obsidian_links.rb, …
            testing.instructions.md       → test/**
            documentation.instructions.md → docs/**, pages/_docs/**
            version-control.instructions.md → CHANGELOG.md, version.*, …
            features.instructions.md      → features/features.yml, _data/features.yml
            install.instructions.md       → install.sh, scripts/lib/install/**, …
```

## Règles de fonctionnement pour les agents

Tous les agents intervenant dans ce dépôt doivent suivre ces règles (extraites de `AGENTS.md`) :

1. **Effectuez des modifications minimales et ciblées.** Respectez le style existant. Ne refactorisez pas de code sans rapport.
2. **Respectez les recommandations en couches.** Les instructions propres à un fichier priment sur les bonnes pratiques génériques.
3. **Validez avant de déclarer terminé.** Exécutez les tests pertinents ; pour les modifications du thème, lancez la build Docker Jekyll.
4. **Mettez à jour `CHANGELOG.md`** pour tout changement visible par l'utilisateur.
5. **Incrémentez la version uniquement via `./scripts/bin/release`** — jamais dans des PR sans rapport.
6. **Ne validez aucun secret.** Utilisez des variables d'environnement.
7. **Privilégiez les bibliothèques et les modèles existants.**

## Ajouter un nouvel outil

Pour intégrer un nouvel outil IA sans dupliquer de contenu :

1. Créez le fichier de configuration propre à l'outil (par ex. `CLAUDE.md`)
2. Dans ce fichier, écrivez : *« Voir `AGENTS.md`. »*
3. C'est tout — les recommandations en couches couvrent déjà tout le reste

## Ressources associées

- [Aperçu des scripts](/docs/development/scripts/)
- [Pipeline CI/CD](/docs/development/ci-cd/)

## Voir aussi

- [[Development]]
- [[Documentation]]
