---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Intégration de GitHub Copilot
description: Assistance complète au développement par IA avec des instructions structurées
  pour une productivité maximale avec le thème Zer0-Mistakes.
preview: "/images/previews/github-copilot-integration.png"
layout: default
categories:
- docs
- features
tags:
- copilot
- ai
- development
- github
difficulty: beginner
estimated_reading_time: 10 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/copilot-integration/"
translation_of: pages/_docs/features/copilot-integration.md
translation_source_url: "/docs/features/copilot-integration/"
machine_translated: true
translated_from_sha: c60a7f9c46b5
---

# Intégration de GitHub Copilot

Le thème Zer0-Mistakes inclut des instructions complètes pour GitHub Copilot afin d'améliorer le développement assisté par l'IA.

## Aperçu

Le thème fournit des fichiers d'instructions structurés qui aident GitHub Copilot à comprendre :

- La structure et les conventions du projet
- Les modèles de développement propres à chaque fichier
- Les exigences de test et de qualité
- Les flux de travail de gestion des versions

## Fichiers d'instructions

### Instructions principales

Emplacement : `.github/copilot-instructions.md`

Ce fichier fournit :

- Un aperçu et la structure du projet
- Les commandes et outils essentiels
- Les flux de travail de développement
- Les standards de qualité du code

### Instructions propres à chaque fichier

Situées dans `.github/instructions/`. Chaque fichier déclare un motif glob `applyTo:` dans son front matter ; il s'agit ici d'un sous-ensemble représentatif (exécutez `ls .github/instructions/` pour la liste complète) :

| Fichier | S'applique à (`applyTo:`) | Objectif |
|------|------------|---------|
| `layouts.instructions.md` | `_layouts/**` | Développement de mises en page |
| `includes.instructions.md` | `_includes/**` | Modèles de composants |
| `scripts.instructions.md` | `scripts/**` | Scripts shell |
| `testing.instructions.md` | `test/**` | Développement de tests |
| `version-control.instructions.md` | `CHANGELOG.md`, `**/version.*`, `**/*.gemspec`, … | Gestion des versions |
| `documentation.instructions.md` | `docs/**`, `pages/_docs/**` | Style de documentation |
| `sass.instructions.md` | `_sass/**` | Conventions SCSS |
| `obsidian.instructions.md` | Contenu du coffre Obsidian | Liens wiki et encadrés |

> [!NOTE]
> Le répertoire `.github/instructions/` fournit plusieurs autres ensembles de règles à portée de fichier
> (par exemple `ai-chat`, `backlog`, `content-review`, `features`, `install`).
> Le dépôt propose également un point d'entrée multi-outils à `AGENTS.md` et des
> flux de travail réutilisables en plusieurs étapes sous `.github/prompts/` (répliqués comme commandes Cursor dans
> `.cursor/commands/`).

## Comment ça fonctionne

### Chargement des instructions

Lorsque vous ouvrez un fichier, Copilot charge automatiquement les instructions pertinentes en fonction du front matter `applyTo` :

```yaml
---
applyTo: "_layouts/**"
description: "Jekyll layout development guidelines for Zer0-Mistakes theme"
date: 2026-05-18T12:00:00.000Z
lastmod: 2026-05-18T12:00:00.000Z
---
```

### Suggestions contextuelles

Copilot utilise les instructions pour fournir :

- Des modèles de code propres au projet
- Des conventions de nommage cohérentes
- Une gestion des erreurs appropriée
- Les exigences de couverture de tests

## Utiliser Copilot efficacement

### Ouverture des fichiers

Lorsque vous travaillez sur des mises en page :

```text
1. Open _layouts/default.html
2. Copilot loads layouts.instructions.md
3. Suggestions follow theme patterns
```

### Écrire du code

Copilot comprend les conventions du thème :

```liquid
{% raw %}{% comment %}
Copilot suggests proper include patterns:
{% include navigation/sidebar-left.html %}

With correct parameters:
{% include components/post-card.html post=post %}
{% endcomment %}{% endraw %}
```

### Exécuter des commandes

Copilot suggère les bonnes commandes :

```bash
# Development
docker-compose up

# Testing
./test/test_runner.sh

# Release (canonical entry point; --dry-run previews)
./scripts/bin/release patch
```

## Bonnes pratiques

### Maintenir les instructions à jour

Lors de l'ajout de nouveaux modèles :

1. Mettez à jour le fichier d'instructions concerné
2. Ajoutez des exemples de code
3. Documentez les conventions

### Utiliser des commentaires

Aidez Copilot à comprendre l'intention :

```ruby
# Generate preview image for post
# Uses DALL-E API if configured
def generate_preview(post)
  # Copilot knows the pattern from instructions
end
```

### Examiner les suggestions

Vérifiez toujours les suggestions de Copilot :

- Vérifiez la cohérence avec le thème
- Vérifiez l'utilisation des classes Bootstrap
- Assurer la conformité en matière d'accessibilité

## Comment vérifier

Vérifiez que les fichiers d'instructions sont présents et que chacun déclare un glob `applyTo`. Depuis la racine du dépôt :

```bash
# Main instructions exist
ls .github/copilot-instructions.md AGENTS.md

# List every file-scoped rule set
ls .github/instructions/

# Confirm each instruction file declares an applyTo glob
grep -m1 "applyTo:" .github/instructions/layouts.instructions.md
```

Sortie attendue pour la dernière commande :

```text
applyTo: "_layouts/**"
```

Ouvrez `_layouts/default.html` dans un éditeur avec GitHub Copilot activé — le glob `layouts.instructions.md` correspondant (`_layouts/**`) se charge automatiquement, et les suggestions respectent les modèles d'include et de layout du thème.

## Configuration

### Activer Copilot

1. Installez l'extension GitHub Copilot
2. Connectez-vous avec un compte GitHub
3. Ouvrez le projet dans VS Code/Cursor

### Paramètres de Copilot

Paramètres recommandés :

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "markdown": true,
    "liquid": true
  }
}
```

## Dépannage

### Les instructions ne se chargent pas

1. Vérifiez que le chemin du fichier correspond au motif `applyTo`
2. Assurez-vous que le fichier d'instructions existe
3. Redémarrez l'éditeur

### Suggestions médiocres

1. Ajoutez plus de contexte dans les commentaires
2. Mettez à jour les fichiers d'instructions
3. Fournissez un exemple de code

### Copilot indisponible

1. Vérifiez l'état de votre abonnement
2. Vérifiez la connexion réseau
3. Ré-authentifiez-vous avec GitHub

## Ressources associées

- [Documentation de développement](/docs/development/documentation/)
- [Guide de contribution](https://github.com/bamr87/zer0-mistakes/blob/main/CONTRIBUTING.md)
- [Guide des scripts](/docs/development/scripts/)

## Voir aussi

- [[Features]]
- [[Development]]
