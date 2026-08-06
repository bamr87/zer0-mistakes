---
title: Premiers pas avec le coffre Obsidian
description: Ouvrez le dépôt Zer0-Mistakes comme coffre Obsidian, installez les extensions
  recommandées et découvrez les conventions de frontmatter.
preview: "/images/previews/getting-started-with-the-obsidian-vault.png"
layout: default
categories:
- Documentation
- Obsidian
tags:
- obsidian
- setup
- vault
backlinks: true
lastmod: '2026-04-24T15:06:30Z'
lang: fr
permalink: "/fr/docs/obsidian/getting-started/"
translation_of: pages/_docs/obsidian/getting-started.md
translation_source_url: "/docs/obsidian/getting-started/"
machine_translated: true
translated_from_sha: 90cee16fcdf6
---

# Premiers pas avec le coffre Obsidian

## 1. Ouvrir le dépôt comme coffre

1. Installez [Obsidian](https://obsidian.md/download).
2. Lancez Obsidian → **Ouvrir le dossier comme coffre**.
3. Choisissez la racine de votre clone `zer0-mistakes`.
4. Faites confiance à l'auteur lorsque cela est demandé (le coffre est fourni avec des paramètres partagés
   sous `.obsidian/` ; rien ne s'exécute automatiquement).

Le `.gitignore` du dépôt exclut l'état par utilisateur d'Obsidian (`workspace*`, `cache`, `plugins/*/data.json`) afin que plusieurs contributeurs puissent partager le même coffre sans conflits de fusion.

> [!tip] Vous préférez une surface plus réduite ?
> Si `_layouts/`, `_includes/`, etc. encombrent l'explorateur de fichiers, le
> `.obsidian/app.json` partagé les répertorie déjà sous `userIgnoreFilters`.
> Ajustez à votre convenance — votre surcharge locale reste hors de git.

## 2. Extensions recommandées

Le dépôt fournit une liste d'extensions principales *activées* dans `.obsidian/core-plugins.json` (explorateur de fichiers, recherche, rétroliens, liens sortants, panneau d'étiquettes, graphe, plan, aperçu de page, modèles, notes quotidiennes, propriétés).

Extensions communautaires recommandées (à installer manuellement, aucune n'est incluse) :

| Extension | Pourquoi |
| --- | --- |
| **Dataview** | Interrogez le frontmatter pour construire des index dynamiques dans Obsidian. |
| **Templater** | Boostez `pages/_notes/_templates/note-template.md`. |
| **Obsidian Git** | Indexez/committez/poussez sans quitter Obsidian. |
| **Excalidraw** | Dessinez des diagrammes qui subsistent sur le site rendu sous forme d'images. |
| **Admonition** | Encarts plus riches en option, au-delà des `> [!type]` intégrés d'Obsidian. |

## 3. Conventions de frontmatter

Chaque note doit porter le frontmatter Jekyll canonique afin de récupérer la bonne mise en page et le bon permalien. Le modèle partagé dans `pages/_notes/_templates/note-template.md` correspond déjà :

```yaml
---
title: "Your note title"
description: "Used for SEO and social previews (≤160 chars)."
preview: /images/previews/getting-started-with-the-obsidian-vault.png
layout: note
date: 2026-04-19T10:00:00.000Z
lastmod: 2026-04-19T10:00:00.000Z
categories: [Notes]
tags: [tag1, tag2]
permalink: /notes/your-slug/
aliases: ["Old Title"]   # → jekyll-redirect-from
backlinks: true
---
```

Obsidian affiche ces champs dans sa barre latérale **Propriétés** ; les valeurs correspondent 1:1 aux valeurs par défaut de Jekyll déclarées dans `_config.yml`. Le tableau `aliases:` est pris en compte par [`jekyll-redirect-from`](https://github.com/jekyll/jekyll-redirect-from) afin que les renommages ne cassent pas les liens entrants.

## 4. Où se trouvent les choses

| Chemin | Objet |
| --- | --- |
| `pages/_notes/` | Notes personnelles (rendues avec `layout: note`, rétroliens activés). |
| `pages/_docs/` | Pages de documentation longues. |
| `pages/_posts/` | Articles de blog (rendus avec `layout: article`). |
| `assets/images/notes/` | Dossier de pièces jointes par défaut pour les intégrations `⟦25⟧`. |
| `pages/_notes/_templates/` | Source de l'extension Templates d'Obsidian. |

## 5. Étapes suivantes

- Parcourez la [référence de syntaxe](⟦29⟧)
  pour voir exactement quelles fonctionnalités d'Obsidian sont rendues sur le site.
- Apprenez le [flux de travail de rédaction](⟦31⟧)
  pour l'aller-retour entre Obsidian et la page publiée.
- Si quelque chose semble anormal, passez au
  [dépannage](⟦33⟧).

## Voir aussi

- [[Obsidian Vault Integration]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Authoring Workflow]]
- [[Obsidian Integration Troubleshooting]]
- [[Obsidian Graph View]]
- [[front-matter]]
- [[Installation]]
