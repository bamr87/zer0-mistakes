---
title: Intégration de coffre Obsidian
description: Modifiez le contenu de Zer0-Mistakes comme un coffre Obsidian et obtenez
  un rendu identique sur GitHub Pages.
preview: "/images/previews/obsidian-vault-integration.png"
layout: default
categories:
- Documentation
- Obsidian
tags:
- obsidian
- authoring
- workflow
backlinks: true
lastmod: '2026-04-24T15:06:30Z'
lang: fr
permalink: "/fr/docs/obsidian/"
translation_of: pages/_docs/obsidian/index.md
translation_source_url: "/docs/obsidian/"
machine_translated: true
translated_from_sha: 1c166b90ed27
---

# Intégration de coffre Obsidian

Le dépôt Zer0-Mistakes est un coffre [Obsidian](https://obsidian.md) entièrement fonctionnel. Ouvrez la racine du dépôt (ou tout sous-dossier contenant des notes) comme coffre et chaque fichier Markdown devient modifiable avec les wiki-links, intégrations, encarts, vue graphe et rétroliens d'Obsidian. Les mêmes fichiers s'affichent sur GitHub Pages avec une présentation équivalente — pas de duplication, pas d'étape de synchronisation distincte.

## Dans cette section

| Page | Contenu abordé |
| --- | --- |
| [Prise en main](/docs/obsidian/getting-started/) | Ouvrir le dépôt comme coffre, plugins recommandés, règles de frontmatter. |
| [Référence de syntaxe](/docs/obsidian/syntax-reference/) | Chaque fonctionnalité Obsidian et son rendu sur le site. |
| [Vue graphe](/docs/obsidian/graph/) | Carte interactive à disposition dynamique de chaque page et wiki-link. |
| [Flux de rédaction](/docs/obsidian/authoring-workflow/) | Boucle note quotidienne → commit → publication. |
| [Dépannage](/docs/obsidian/troubleshooting/) | Liens brisés, intégrations manquantes, conflits. |

## Fonctionnement

L'intégration comporte deux volets :

1. **Émission de données côté serveur.** Un modèle Liquid émet
`assets/data/wiki-index.json` à chaque build Jekyll, listant chaque document de collection et chaque page autonome (titre, nom de base, permalien, tags, alias, extrait). Cela fonctionne sur le build GitHub Pages `remote_theme` par défaut, sans plugin personnalisé requis.
2. **Résolveur côté client.** `assets/js/obsidian-wiki-links.js` charge
l'index dans le navigateur et réécrit `⟦10⟧`, `⟦11⟧`, les `#tags` en ligne et les encarts Obsidian sous forme de citations en HTML stylisé avec Bootstrap. Le résultat est indiscernable d'un rendu côté serveur pour les lecteurs, et permet à l'intégration de fonctionner sur GH Pages standard sans workflow CI personnalisé.

Pour les utilisateurs qui construisent eux-mêmes avec Jekyll standard (sans gem `github-pages`), un plugin Ruby optionnel (`_plugins/obsidian_links.rb`) réalise les mêmes transformations côté serveur pour un SEO légèrement meilleur. Consultez la [référence de syntaxe](/docs/obsidian/syntax-reference/) pour la matrice complète des fonctionnalités.

## Voir aussi

- [[Getting Started with the Obsidian Vault]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Graph View]]
- [[Obsidian Authoring Workflow]]
- [[Obsidian Integration Troubleshooting]]
- [[front-matter]]
- [[Installation]]
