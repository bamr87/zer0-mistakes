---
title: Dépannage de l'intégration Obsidian
description: Problèmes courants avec l'intégration Obsidian + Jekyll et comment les
  résoudre.
preview: "/images/previews/obsidian-integration-troubleshooting.png"
layout: default
categories:
- Documentation
- Obsidian
tags:
- obsidian
- troubleshooting
- debugging
backlinks: true
lastmod: 2026-04-24 15:06:30.000000000 Z
draft: false
lang: fr
permalink: "/fr/docs/obsidian/troubleshooting/"
translation_of: pages/_docs/obsidian/troubleshooting.md
translation_source_url: "/docs/obsidian/troubleshooting/"
machine_translated: true
translated_from_sha: 2515b91e8b1a
---

# Dépannage de l'intégration Obsidian

## Un lien wiki s'affiche comme cassé (`wiki-link-broken`) sur le site, mais fonctionne dans Obsidian

**Cause :** la page cible n'a pas de `title:` dans son frontmatter et le nom de base ne correspond pas non plus, ou l'index wiki n'a pas été régénéré depuis l'ajout de la cible.

**Correction :**

1. Vérifiez que le fichier cible a `title:` défini dans le frontmatter YAML.
2. Déclenchez une reconstruction — `assets/data/wiki-index.json` est généré à chaque exécution de Jekyll
run. Sur GitHub Pages, cela se produit automatiquement lors d'un push ; en local, arrêtez et redémarrez `docker-compose up` (ou enregistrez n'importe quel fichier pour relancer les builds incrémentaux).
3. Ajoutez une entrée `aliases:` sur la cible si le lien utilise une orthographe
   alternative.

## L'image intégrée affiche une icône d'image cassée

**Cause :** l'image n'est pas là où le résolveur la cherche.

**Correction :**

- Le chemin de pièce jointe par défaut est `assets/images/notes/` (défini dans
`.obsidian/app.json` → `attachmentFolderPath`). Si vous l'avez personnalisé, définissez le chemin correspondant sur le site via :

  ```html
  <script>window.OBSIDIAN_ATTACHMENTS_PATH = '/your/path';</script>
  ```

  avant le chargement du script du résolveur.
- Pour un chemin absolu, préfixez la cible de l'intégration avec `/` :
  `![[/assets/images/special/diagram.png]]`.

## Le callout s'affiche comme un simple `<blockquote>`

**Cause :** la première ligne non vide de la citation n'est pas `[!type]`. Obsidian est permissif quant aux espaces ; le résolveur exige le marqueur sur la *première* ligne de la citation (ce que contient le premier `<p>` de kramdown après analyse).

**Correction :** assurez-vous qu'il n'y a pas de ligne vide entre l'en-tête `[!type]` et le corps :

```markdown
> [!warning] Title       ← good
> body line

>                         ← bad: blank first line
> [!warning] Title
> body line
```

## La syntaxe `⟦17⟧` apparaît littéralement dans un bloc de code

**Comportement attendu.** Le convertisseur Ruby et le résolveur JS ignorent explicitement les spans de code (`` `…` ``) et les blocs de code délimités (``` ``` ```). Pour forcer un lien wiki, sortez-le du contexte de code.

## Les tags ne pointent vers rien

**Cause :** le `#tag` en ligne correspond à la regex mais la page d'agrégation des tags (`pages/tags.md`) ne l'a pas pris en compte car les tags sont lus depuis le frontmatter, pas depuis le corps.

**Correction :** ajoutez aussi le tag au tableau `tags:` dans le frontmatter pour qu'il apparaisse sur `/tags/` :

```yaml
tags: [obsidian, your-inline-tag]
```

## Le panneau de rétroliens est absent d'une note

**Causes et corrections :**

- Un layout autre que `note` ? Ajoutez `backlinks: true` au frontmatter.
- Explicitement désactivé ? Supprimez `backlinks: false`.
- Aucun lien entrant n'existe encore — le panneau est masqué lorsqu'il est vide plutôt
  que d'afficher une section vide.

## Le plugin personnalisé (`_plugins/obsidian_links.rb`) ne s'exécute pas dans le build GitHub Pages de mon fork

**C'est le comportement attendu** pour les sites construits avec la gem `github-pages`. Cette gem force `safe: true` et remplace `plugins_dir`, de sorte qu'aucun plugin Ruby personnalisé ne s'exécute. Le résolveur côté client couvre la même surface fonctionnelle.

Si vous voulez des réécritures côté serveur (SEO légèrement meilleur, pas de scintillement avant l'hydratation), retirez `github-pages` de `Gemfile`, passez à Jekyll standard, et ajoutez un workflow GitHub Actions personnalisé qui exécute `bundle exec jekyll build` et déploie avec `actions/deploy-pages` ou `peaceiris/actions-gh-pages`. Le plugin prendra en compte `_plugins/` automatiquement dans cette configuration.

## Obsidian affiche des fichiers que je ne veux pas voir (`_layouts/`, `assets/vendor/`, …)

Le `.obsidian/app.json` partagé exclut déjà les répertoires de build/config les plus courants via `userIgnoreFilters`. Ajoutez-y d'autres entrées si vous voulez les partager avec vos collaborateurs, ou utilisez Paramètres Obsidian → Fichiers et liens → Fichiers exclus pour des filtres personnels uniquement.

## La configuration du vault Obsidian entre en conflit avec celle d'un autre contributeur

Le dépôt versionne un sous-ensemble sélectionné de `.obsidian/`. L'état propre à chaque utilisateur (`workspace*.json`, `cache`, `plugins/*/data.json`, `graph.json`) est ignoré par git. Si vous voyez des conflits de fusion dans `.obsidian/` pour l'un de ces fichiers, c'est qu'il est passé à travers — retirez-le de git avec :

```bash
git rm --cached .obsidian/workspace.json
echo ".obsidian/workspace.json" >> .gitignore
```

Puis committez. Le motif est déjà dans `.gitignore` ; ceci ne concerne que les fichiers qui ont été committés avant que le gitignore ne prenne effet.

## Toujours bloqué ?

Ouvrez une issue sur [github.com/bamr87/zer0-mistakes/issues](https://github.com/bamr87/zer0-mistakes/issues) avec :

- La source Markdown exacte qui pose problème.
- Le HTML rendu (Afficher la source sur la page en ligne).
- La sortie de `./test/test_obsidian.sh`.

## Voir aussi

- [[Obsidian Vault Integration]]
- [[Obsidian Syntax Reference]]
- [[Obsidian Authoring Workflow]]
- [[Obsidian Graph View]]
- [[Getting Started with the Obsidian Vault]]
