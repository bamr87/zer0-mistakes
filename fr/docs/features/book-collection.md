---
title: Collection Livres — Publiez des livres illustrés par IA
description: Publiez des livres illustrés pour enfants — ou toute expérience de lecture
  d'un bout à l'autre — avec la collection livres, les mises en page de livre et les
  composants de planches d'illustration.
preview: "/images/zer0-mistakes-wizard.png"
layout: default
categories:
- docs
- features
tags:
- books
- collections
- layouts
- storybook
- ai-images
keywords:
- jekyll books collection
- children's picture book theme
- jekyll storybook layout
- AI generated illustrations
- openai image prompts
- bootstrap book layout
difficulty: beginner
estimated_reading_time: 10 minutes
lastmod: 2026-07-22 00:00:00.000000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/book-collection/"
translation_of: pages/_docs/features/book-collection.md
translation_source_url: "/docs/features/book-collection/"
machine_translated: true
translated_from_sha: a058d4ca2e21
---

# Collection Livres

La collection `books` transforme le thème en une plateforme de publication de livres illustrés : chaque livre est un dossier de « chapitres » narratifs accompagné d'une page d'accueil, rendu avec des mises en page immersives et sans barre latérale, conçues pour du contenu à lire à voix haute et des planches d'illustration pleine largeur.

Le thème est livré avec une petite démo — [Les Contes de Zer0](/books/zer0-tales/) — qui met en œuvre tout ce qui figure sur cette page. Le site de production de référence est la [plateforme de livres pour enfants drsai](https://github.com/bamr87/drsai), qui génère les histoires avec un LLM et les illustrations avec les modèles d'images d'OpenAI, puis les publie via cette collection.

## Activer la collection

Ajoutez la collection et ses valeurs par défaut de front matter au `_config.yml` de votre site (la configuration du thème lui-même contient le même bloc) :

```yaml
collections:
  books:
    output: true
    title: Books
    icon: bi-book-half
    permalink: /:collection/:path/

defaults:
  - scope:
      path: pages/_books   # match your collections_dir
      type: books
    values:
      layout: book-story
      sidebar: false
      comments: false
```

## Créer un livre

Un dossier par livre sous `pages/_books/` :

```text
pages/_books/my-book/
  index.md                 # layout: book — cover, synopsis, TOC
  01-first-story.md        # chapter: 1
  02-second-story.md       # chapter: 2
```

### Page d'accueil du livre (`layout: book`)

| Clé | Requis | Rôle |
|---|---|---|
| `book` | oui | Slug partagé par le livre et tous ses chapitres |
| `title` | oui | Titre du livre (`<h1>` de la page) |
| `subtitle`, `author`, `illustrator`, `audience` | non | Métadonnées de la signature |
| `synopsis` | non | Court résumé affiché dans le hero de couverture |
| `cover_image`, `back_cover_image` | non | Illustration de couverture (le format portrait convient le mieux) |
| `generator` | non | Phrase de provenance pour le colophon « Comment ce livre a été réalisé » |
| `illustration_style` | non | Le style partagé utilisé pour générer l'illustration |

Le corps de la page s'affiche sous forme d'une section « À propos de ce livre » au-dessus de la table des matières.

### Pages d'histoire (`layout: book-story`)

| Clé | Requis | Rôle |
|---|---|---|
| `book` | oui | Doit correspondre au slug du livre |
| `chapter` | oui | Ordre de lecture numérique (pilote la table des matières et précédent/suivant) |
| `title` | oui | Titre de l'histoire |
| `chapter_label` | non | Libellé d'affichage au-dessus du titre (par ex. « Janvier ») |
| `description` | non | Paragraphe d'introduction sous le titre |
| `preview` | non | Image miniature/OG pour les cartes et la table des matières |
| `illustrations` | non | Liste de `{beat, title, prompt, image}` — rendue sous forme de colophon de prompt replié |
| `the_end` | non | `false` masque la fioriture finale « Fin » |

Placez des planches d'illustration n'importe où dans le corps de l'histoire :

```liquid
{% raw %}{% include components/book-plate.html
   src="/assets/images/books/my-book/scene.jpg"
   alt="What is happening in the scene" %}{% endraw %}
```

Les images markdown nues (`![alt](src)`) au sein d'une histoire reçoivent automatiquement le même style de planche.

## Composants

| Include | Rôle |
|---|---|
| `components/bookshelf.html` | Grille de tous les livres — à placer sur une page d'accueil (`heading` optionnel) |
| `components/book-card.html` | Carte de couverture d'un livre (`book` = le document d'accueil) |
| `components/book-toc.html` | Liste ordonnée des chapitres d'un livre (`book` = slug) |
| `components/book-nav.html` | Navigation précédent/suivant/sommaire (`book`, `chapter`) |
| `components/book-plate.html` | Figure d'illustration (`src`, `alt`, `caption` optionnel) |

Une étagère à livres sur une page d'accueil tient en une ligne :

```liquid
{% raw %}{% include components/bookshelf.html heading="Our Library" %}{% endraw %}
```

## Pipeline de génération par IA

La collection est conçue de sorte que le front matter fasse aussi office de manifeste de génération : chaque histoire porte les prompts qui ont produit (ou produiront) ses illustrations. La [plateforme drsai](https://github.com/bamr87/drsai) lit ces listes `illustrations:` et génère toutes les images manquantes avec l'API OpenAI Images ; la gem [zer0-image-generator](https://github.com/bamr87/zer0-image-generator) génère la bannière `preview` de chaque histoire de la même manière. Les histoires dont le `image` est manquant affichent un badge « pas encore généré » dans le colophon, ce qui permet de publier un livre avant que ses illustrations ne soient terminées.

## Style

Les styles se trouvent dans `_sass/components/_book.scss` et lisent les propriétés personnalisées d'exécution de Bootstrap, de sorte que les modes de couleur clair/sombre et les habillages de thème fonctionnent automatiquement. Réglages accessibles au consommateur :

```css
:root {
  --zer0-book-serif: /* storybook font stack */;
  --zer0-book-font-size: /* clamp() for the reading size */;
  --zer0-book-measure: 42rem; /* line length */
  --zer0-book-plate-radius: 1rem;
}
```
