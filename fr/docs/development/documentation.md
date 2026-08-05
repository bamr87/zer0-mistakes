---
lastmod: 2026-04-18 19:29:55.000000000 Z
title: Documentation
description: Guide de l'architecture de documentation double avec documentation technique,
  documentation publique et instructions IA.
preview: "/images/previews/documentation.png"
layout: default
categories:
- docs
- development
tags:
- documentation
- mdx
- markdown
- architecture
difficulty: intermediate
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/documentation/"
translation_of: pages/_docs/development/documentation.md
translation_source_url: "/docs/development/documentation/"
machine_translated: true
translated_from_sha: 7443f2de6a96
---

# Architecture de la documentation

Le thème Zer0-Mistakes met en œuvre un système de documentation double conçu pour servir différents publics avec des formats de contenu appropriés.

## Vue d'ensemble

```text
Documentation Architecture
├── /docs/                    # Technical Documentation (MDX)
│   ├── Developer/contributor focused
│   └── Repository implementation details
├── /pages/_docs/             # Public Documentation (Markdown)
│   ├── End-user focused
│   └── General technology guides
└── /.github/instructions/    # AI Guidance
    ├── GitHub Copilot optimization
    └── File-specific instructions
```

## Documentation technique (`/docs/`)

### Objectif

- **Public** : développeurs, contributeurs, mainteneurs
- **Contenu** : architecture, processus de build, détails d'implémentation
- **Format** : MDX (Markdown + JSX) avec composants interactifs

### Structure des répertoires

| Répertoire | Contenu |
|-----------|---------|
| `/docs/systems/` | Infrastructure et automatisation |
| `/docs/features/` | Implémentation des composants |
| `/docs/releases/` | Notes de version et journaux des modifications |
| `/docs/architecture/` | Documents de conception du système |

### Modèle de front matter

```yaml
---
title: "Descriptive Technical Title"
description: "Technical implementation summary"
preview: /images/previews/documentation.png
type: "system|feature|configuration|release"
audience: "developers|contributors|maintainers"
components: ["file1.rb", "file2.html"]
dependencies: ["Jekyll", "Bootstrap"]
last_updated: "2025-01-25"
complexity: "beginner|intermediate|advanced"
---
```

### Composants MDX

- **CodeBlock** : code avec coloration syntaxique et références de fichiers
- **ArchitectureDiagram** : diagrammes Mermaid pour la conception du système
- **ComponentDiagram** : visualisation des relations entre composants
- **ConfigurationExample** : exemples de fichiers de configuration

## Documentation publique (`/pages/_docs/`)

### Objectif

- **Public** : utilisateurs du thème, débutants avec Jekyll
- **Contenu** : guides, tutoriels, configuration
- **Format** : Markdown standard pour le rendu Jekyll

### Structure des répertoires

| Répertoire | Contenu |
|-----------|---------|
| `/pages/_docs/getting-started/` | Guides de démarrage rapide |
| `/pages/_docs/features/` | Documentation des fonctionnalités |
| `/pages/_docs/customization/` | Personnalisation du thème |
| `/pages/_docs/deployment/` | Guides de déploiement |
| `/pages/_docs/development/` | Guides pour développeurs |

### Modèle de front matter

```yaml
---
title: Feature Name
description: One-line description for SEO
preview: /images/previews/documentation.png
layout: default
categories: [docs, features]
tags: [relevant, tags]
permalink: /docs/category/feature-name/
difficulty: beginner|intermediate|advanced
estimated_reading_time: X minutes
prerequisites: []
sidebar:
    nav: docs
---
```

### Sections requises

1. **Vue d'ensemble** - Quoi et pourquoi
2. **Démarrage rapide** - Étapes minimales
3. **Configuration** - Options disponibles
4. **Exemples d'utilisation** - Extraits de code
5. **Dépannage** - Problèmes courants
6. **Ressources liées** - Liens vers la documentation associée

## Instructions pour l'IA (`/.github/instructions/`)

### Objectif

- **Public** : GitHub Copilot, assistants IA
- **Contenu** : conseils de développement spécifiques aux fichiers
- **Format** : Markdown avec front matter `applyTo`

### Structure

```yaml
---
applyTo: "path/to/files/**"
description: "Guidance for these files"
preview: /images/previews/documentation.png
---

# Development Guidelines

## Best Practices
...
```

### Instructions disponibles

| Fichier | S'applique à |
|------|------------|
| `documentation.instructions.md` | docs/**, pages/_docs/** |
| `layouts.instructions.md` | _layouts/** |
| `includes.instructions.md` | _includes/** |
| `scripts.instructions.md` | scripts/** |
| `testing.instructions.md` | test/** |
| `version-control.instructions.md` | CHANGELOG.md, *.gemspec |

## Flux de travail du contenu

### Créer une nouvelle documentation

1. **Identifier le public** : technique ou utilisateur final ?
2. **Choisir l'emplacement** : `/docs/` ou `/pages/_docs/`
3. **Utiliser un modèle** : copier le front matter approprié
4. **Rédiger le contenu** : respecter les exigences des sections
5. **Ajouter des liens** : Références croisées vers la documentation associée
6. **Tester en local** : Vérifier le rendu

### Conversion entre formats

**Technique → Public** :

1. Copier le fichier MDX dans `/pages/_docs/`
2. Supprimer les composants JSX
3. Simplifier les détails techniques
4. Ajouter des exemples orientés utilisateur
5. Mettre à jour le front matter

**Public → Technique** :

1. Copier le Markdown dans `/docs/`
2. Ajouter les composants MDX
3. Inclure les détails d'implémentation
4. Référencer les fichiers sources
5. Mettre à jour le front matter

## Guide de style

### Style de rédaction

- Utiliser la voix active
- Garder des phrases concises
- Définir les termes techniques
- Inclure des exemples de code
- Ajouter des supports visuels

### Exemples de code

```markdown
# Good: Complete, runnable example
\```yaml
---
title: "My Page"
layout: default
mermaid: true
---
\```

# Bad: Incomplete fragment
\```yaml
mermaid: true
\```
```

### Références croisées

```markdown
## Related

- [Feature Name](/docs/features/name/)
- [Configuration Guide](/docs/customization/)
- [Source Code](https://github.com/bamr87/zer0-mistakes/blob/main/path/to/file)
```

## Maintenance

### Mises à jour régulières

- Réviser la documentation à chaque version
- Mettre à jour les numéros de version
- Vérifier les liens rompus
- Actualiser les captures d'écran

### Test de la documentation

```bash
# Build and check for errors
bundle exec jekyll build

# Check for broken links
bundle exec htmlproofer _site --check-links
```

## Associé

- [PRD](/docs/development/prd/)
- [Guide de contribution](https://github.com/bamr87/zer0-mistakes/blob/main/CONTRIBUTING.md)

## Voir aussi

- [[Development]]
- [[front-matter]]
- [[Obsidian Vault Integration]]
