---
title: Flux de rédaction Obsidian
description: D'une note Obsidian vide à une page publiée sur GitHub Pages — la boucle
  quotidienne.
preview: "/images/previews/obsidian-authoring-workflow.png"
layout: default
categories:
- Documentation
- Obsidian
tags:
- obsidian
- workflow
- authoring
backlinks: true
lastmod: '2026-04-24T15:06:30Z'
lang: fr
permalink: "/fr/docs/obsidian/authoring-workflow/"
translation_of: pages/_docs/obsidian/authoring-workflow.md
translation_source_url: "/docs/obsidian/authoring-workflow/"
machine_translated: true
translated_from_sha: e7a5d0818180
---

# Flux de rédaction Obsidian

## L'aller-retour

```text
Obsidian (edit)  →  git commit  →  GitHub push  →  Pages build  →  live URL
       ↑                                                                │
       └──────────── git pull (Obsidian Git plugin) ────────────────────┘
```

## Boucle quotidienne

1. **Ouvrez le coffre** dans Obsidian (racine du dépôt).
2. **Créez une note** avec `Cmd/Ctrl + N`. Le plugin natif Templates
proposera `note-template.md` depuis `pages/_notes/_templates/`. Le sélectionner appose le frontmatter canonique (title, layout, permalink, …).
3. **Rédigez librement** avec `⟦4⟧`, `⟦5⟧`, des encadrés (callouts) et
`#tags`. Chacun de ces éléments s'affiche à l'identique sur le site (voir [la référence de syntaxe](⟦9⟧)).
4. **Déposez des images** dans l'éditeur — Obsidian les enregistre sous
`assets/images/notes/` (configuré dans `.obsidian/app.json`), soit exactement là où `⟦11⟧` est résolu sur le site.
5. **Validez et poussez.**
   - Avec le **plugin Obsidian Git** : `Ctrl/Cmd + P` → *Source control: Commit
     all changes* → *Push*.
   - Depuis le terminal : `git add / git commit / git push` standard.
6. **GitHub Pages** reconstruit automatiquement. En ~1 minute, la nouvelle note
   est en ligne au permalink déclaré dans son frontmatter.

## Modifier du contenu existant

- **Les renommages sont sûrs.** Le paramètre *Always update internal links* d'Obsidian
(`alwaysUpdateLinks: true` dans la configuration partagée) réécrit chaque `⟦17⟧` pointant vers le fichier renommé. Pour des redirections au niveau de l'URL, ajoutez l'ancien slug au tableau `aliases:` de la note — `jekyll-redirect-from` émettra une redirection HTTP depuis l'ancienne URL.
- **Les déplacements entre collections** (`pages/_notes/` ↔ `pages/_posts/`) fonctionnent,
mais vous voudrez généralement mettre à jour `layout:` pour correspondre aux valeurs par défaut de la collection de destination.

## Aperçu local

Le site rend localement les mêmes fonctionnalités Obsidian :

```bash
docker-compose up
# → http://localhost:4000
```

Les notes que vous modifiez dans Obsidian sont prises en compte par la construction incrémentale de Jekyll en ~1 seconde. Rafraîchissez le navigateur pour voir vos changements.

## Validation avant de pousser

Lancez le test de fumée de l'intégration pour détecter les wiki-links cassés, un frontmatter mal formé ou un schéma wiki-index en régression :

```bash
./test/test_obsidian.sh
```

La suite de tests complète du thème (lint, build, déploiement, styling, Obsidian) s'exécute via :

```bash
./test/test_runner.sh --verbose
```

## Synchronisation du coffre entre machines

Utilisez **Obsidian Git** comme synchronisation canonique — il effectue un pull à l'ouverture et invite à valider à la fermeture. Ainsi, chaque machine utilise le même historique git que celui publié par GitHub Pages, de sorte que ce que vous voyez dans Obsidian correspond exactement à ce que verront les lecteurs sur le site.

> [!tip] Évitez Obsidian Sync pour ce coffre
> Le service payant Sync d'Obsidian fonctionne en dehors de git, il peut donc s'écarter
> de ce qui est déployé. Tenez-vous-en à `git push`/`git pull` (manuellement ou via
> le plugin Obsidian Git) afin que le coffre et le site en ligne ne divergent jamais.

## Voir aussi

- [[Obsidian Vault Integration]]
- [[Getting Started with the Obsidian Vault]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Graph View]]
- [[Obsidian Integration Troubleshooting]]
- [[Docker]]
