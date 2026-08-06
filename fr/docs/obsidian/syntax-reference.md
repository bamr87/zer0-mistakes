---
title: Référence de syntaxe Obsidian
description: Chaque fonctionnalité Markdown propre à Obsidian prise en charge par
  le thème Zer0-Mistakes et son rendu sur GitHub Pages.
preview: "/images/previews/obsidian-syntax-reference.png"
layout: default
categories:
- Documentation
- Obsidian
tags:
- obsidian
- syntax
- reference
backlinks: true
lastmod: '2026-04-24T15:06:30Z'
lang: fr
permalink: "/fr/docs/obsidian/syntax-reference/"
translation_of: pages/_docs/obsidian/syntax-reference.md
translation_source_url: "/docs/obsidian/syntax-reference/"
machine_translated: true
translated_from_sha: ba40d91073b2
---

# Référence de la syntaxe Obsidian

Tout ce qui figure dans cette référence est géré **soit** par `assets/js/obsidian-wiki-links.js` (côté client, build GH Pages par défaut) **soit** par `_plugins/obsidian_links.rb` (côté serveur, en option pour les forks qui construisent avec Jekyll standard). Les deux produisent un HTML équivalent.

## Wiki-links

| Syntaxe | Rendu |
| --- | --- |
| `[[Page Title]]` | `<a class="wiki-link" href="/permalink/">Page Title</a>` |
| `⟦6⟧` | Lien avec `Custom text` comme libellé visible. |
| `⟦9⟧` | Lien avec le fragment d'URL `#section` (ancre de style kramdown). |
| `⟦12⟧` | Les références de bloc se ramènent à un simple lien vers `Page Title`. |
| `⟦15⟧` | `<span class="wiki-link wiki-link-broken">` — un marqueur de lien brisé non navigable avec une infobulle (un clic ne peut pas faire défiler jusqu'en haut). |

La résolution est **insensible à la casse** et tolère les espaces superflus. Les clés de recherche incluent le `title` de chaque document, le `basename` du fichier et toute entrée du tableau frontmatter `aliases:`. La première correspondance l'emporte ; les collisions sont déterministes d'un build à l'autre, car Liquid parcourt les collections dans un ordre stable.

## Intégrations

| Syntaxe | Rendu |
| --- | --- |
| `![[diagram.png]]` | `<img src="/assets/images/notes/diagram.png">` |
| `⟦24⟧` | Idem, avec `width="320"` |
| `⟦27⟧` | Carte Bootstrap contenant l'extrait de la note + un lien de retour vers la note |
| `⟦29⟧` | Respecte les chemins absolus à l'identique |

Le dossier de pièces jointes par défaut est `assets/images/notes/`, correspondant au `attachmentFolderPath` défini dans `.obsidian/app.json`, de sorte que le flux « coller une image » d'Obsidian dépose automatiquement les fichiers au bon endroit.

## Encadrés (callouts)

```markdown
> [!note] Optional title
> Body of the callout — supports **markdown**, lists, code, etc.
```

Correspond à `<div class="alert alert-… obsidian-callout obsidian-callout-…">`. Type → variante d'alerte Bootstrap :

| Type Obsidian | Variante Bootstrap | Icône |
| --- | --- | --- |
| `note`, `info`, `todo`, `question`, `help`, `faq` | `primary` / `info` | document / info |
| `tip`, `hint`, `success`, `check`, `done` | `success` | ampoule / coche |
| `warning`, `caution`, `attention`, `important` | `warning` | triangle d'exclamation |
| `failure`, `danger`, `error`, `bug` | `danger` | bouclier / bug |
| `abstract`, `summary`, `tldr`, `example`, `quote`, `cite` | `secondary` | variable |

Les marqueurs de repli transforment l'encadré en un **panneau d'affichage accessible** : le titre devient un `<button aria-expanded>` actionnable au clavier avec un chevron, et le corps s'affiche/se masque au clic (Entrée/Espace).

- `> [!warning]+` — repliable, **déplié** par défaut.
- `> [!warning]-` — repliable, **replié** par défaut (`data-collapsed="true"`
  et le corps est `hidden` jusqu'à ce qu'on le bascule).

Un encadré **sans** marqueur de repli s'affiche comme un titre statique (pas un bouton). Les types inconnus retombent sur la variante `note`, jamais supprimés silencieusement.

### Exemple en direct

Un encadré repliable **déplié** (le marqueur `+`) démarre ouvert :

> [!tip]+ Repliable, déplié par défaut
> Cet encadré `tip` démarre ouvert. Cliquez sur le titre (ou appuyez sur Entrée/Espace) pour
> le replier — le corps se bascule et le `aria-expanded` du titre pivote.

Un encadré **replié** (le marqueur `-`) démarre fermé — activez le titre pour le révéler :

> [!note]- Repliable, replié par défaut
> Cet encadré `note` démarre replié : `data-collapsed="true"` et le corps est
> `hidden` jusqu'à ce que vous activiez le titre pour révéler ce texte.

## Étiquettes (tags)

Les étiquettes en ligne comme `#obsidian` ou `#fixture/example` sont liées à la page d'index des étiquettes existante. Les étiquettes hiérarchiques utilisent des barres obliques et conservent leur chemin. Les portions de code (`` `#not-a-tag` ``) et les blocs de code délimités sont ignorés — le résolveur exclut explicitement ces nœuds du parcours de réécriture.

Les tableaux `tags:` du frontmatter restent inchangés ; ils continuent d'alimenter l'agrégation d'étiquettes existante de Jekyll.

## Frontmatter ↔ Propriétés

La vue **Propriétés** d'Obsidian affiche le même frontmatter YAML que Jekyll analyse déjà. Correspondances spéciales :

| Clé Obsidian | Clé Jekyll | Comportement |
| --- | --- | --- |
| `aliases` | `redirect_from` (via `jekyll-redirect-from`) | Les anciennes URL redirigent vers le nouveau permalien. |
| `tags` (en ligne `#tag` ou tableau YAML) | collection `tags:` | Alimente l'index `/tags/`. |
| `cssclass` | _ignoré sur le site_ | Indication de style propre à Obsidian. |
| `publish` | _ignoré_ | Utilisez le `published: false` de Jekyll pour le supprimer. |

## Panneau des rétroliens

Chaque page rendue avec `layout: note` obtient automatiquement un panneau **Mentions liées** répertoriant toutes les pages dont le corps pointe vers elle (soit par correspondance d'URL markdown, soit par référence wiki-link `⟦95⟧`). D'autres mises en page peuvent y adhérer avec `backlinks: true` dans leur frontmatter.

Le panneau est un include Liquid côté serveur (`_includes/content/backlinks.html`) — aucun JavaScript requis, entièrement indexable par les moteurs de recherche.

## Ce qui n'est _pas_ (encore) pris en charge

| Fonctionnalité | Statut | Solution de contournement |
| --- | --- | --- |
| Fichiers `.canvas` | Exclus du build | Exportez en PNG et intégrez |
| `.excalidraw.md` Excalidraw | Exclus du build | Intégrez un PNG/SVG exporté |
| Requêtes Dataview | Propre à Obsidian | Utilisez des boucles Liquid sur le site |
| Références de bloc en direct (`^block-id`) | Se ramène à un simple lien | Utilisez plutôt des ancres de titre |
| Vue interactive du graphe global | Disponible sur [/docs/obsidian/graph/](/docs/obsidian/graph/) | Vue cytoscape à disposition dynamique de chaque lien wiki |

Ce sont tous des candidats pour un suivi v2. Aucun d'eux ne casse une compilation lorsqu'il est présent dans la source — ils sont simplement masqués du site publié ou rendus sans la couche interactive.

## Voir aussi

- [[Obsidian Vault Integration]]
- [[Getting Started with the Obsidian Vault]]
- [[Obsidian Authoring Workflow]]
- [[Obsidian Graph View]]
- [[Obsidian Integration Troubleshooting]]
- [[front-matter]]
