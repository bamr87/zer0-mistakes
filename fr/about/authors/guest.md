---
layout: author
author_key: guest
title: Devenir auteur — Contribuer à zer0-mistakes
description: Comment contribuer des articles et devenir un auteur crédité sur zer0-mistakes
  — le workflow, le front matter, le processus de revue et l'ajout de votre propre
  profil d'auteur.
lastmod: 2026-06-22 00:00:00.000000000 Z
sidebar: false
hide_intro: true
author_profile: false
lang: fr
permalink: "/fr/authors/guest/"
translation_of: pages/_about/authors/guest.md
translation_source_url: "/authors/guest/"
machine_translated: true
translated_from_sha: cd27b030744f
---

L'**Auteur invité** crédite les contributions ponctuelles et les premières participations. Tout le monde peut écrire pour zer0-mistakes — cette page est votre point de départ, d'un simple article invité jusqu'à votre propre profil d'auteur.

## Contribuer à un article

1. **Forkez** le dépôt et créez une branche.
2. **Ajoutez votre contenu** en Markdown dans la collection correspondante sous `pages/` :
   - `pages/_posts/` — articles & actualités (`layout: article`, nom de fichier `YYYY-MM-DD-slug.md`)
   - `pages/_docs/` — documentation (`layout: default`)
   - `pages/_notes/`, `pages/_quickstart/`, `pages/_notebooks/` — notes, guides, carnets
3. **Ajoutez le front matter** (modèle ci-dessous) et rédigez votre texte. Visez **≥ 300
mots**, un `title` de **30 à 60 caractères**, une `description` de **120 à 160 caractères**, 3 à 10 `keywords`, et une image `preview` (voir le [générateur d'image d'aperçu](⟦14⟧)).
4. **Prévisualisez en local** avec `docker-compose up` → <http://localhost:4000>.
5. **Ouvrez une pull request.** Une revue de contenu automatisée ainsi qu'une revue par un mainteneur
   vérifient le SEO, l'accessibilité, les liens et l'exactitude avant la fusion.

Créditez une contribution ponctuelle à l'auteur invité avec `author: guest`.

### Modèle de front matter

```yaml
---
title: "Your concise, descriptive title"
description: "A 120–160 character summary used for SEO and content cards."
author: guest            # or your own key once you have a profile (see below)
layout: article          # article | default — match the collection
date: 2026-01-01T09:00:00.000Z
lastmod: 2026-01-01T09:00:00.000Z
categories: [Tutorial]
tags: [jekyll, how-to]
keywords: [jekyll, contributing, how-to]
preview: /images/previews/your-slug.png
draft: false
---
```

## Devenir un auteur reconnu

Vous contribuez une fois, ou vous prévoyez d'écrire régulièrement ? Obtenez votre propre signature, avatar et une page de profil agrégée :

1. **Ajoutez-vous à [`_data/authors.yml`](https://github.com/bamr87/zer0-mistakes/blob/main/_data/authors.yml)**
   avec une clé unique :

   ```yaml
   yourkey:
     name: "Your Name"
     bio: "One or two sentences about you."
     avatar: "/images/authors/yourname.png"
     role: "Contributor"
     github: "yourhandle"
     tagline: "A one-line blurb for your profile hero."
     expertise:
       - "Topic one"
       - "Topic two"
   ```

2. **Utilisez votre clé** dans le front matter — `author: yourkey`. Votre signature liée, la
carte « À propos de l'auteur » et un profil agrégé sur `/authors/yourkey/` (chaque article, doc et note que vous écrivez, à travers toutes les collections) s'activent automatiquement — aucune autre modification de code nécessaire.
3. **Sur GitHub Pages (mode sécurisé) uniquement**, committez également un petit stub de profil afin que la
page se génère sans le plugin. La liste complète des champs, le format du stub et la manière dont les pages de profil sont générées se trouvent dans [Profils d'auteur et signatures À-propos-de-l'auteur](⟦23⟧).

C'est tout — votre nom renvoie désormais à votre profil partout où vous êtes crédité.

## Écrire avec l'aide de l'IA

Si un texte est généré ou assisté par IA, **déclarez-le**. Marquez l'auteur `ai: true` avec un bloc `persona` et suivez le [modèle d'auteur IA](https://github.com/bamr87/zer0-mistakes/blob/main/.github/prompts/ai-author.prompt.md) ; le thème affiche alors un badge « IA » et une mention d'attribution automatiquement. Voir [Personas d'auteur IA](⟦28⟧#6-ai-author-personas) pour les deux personas d'exemple, Cassandra et Vega.

## Ce que vérifie la revue

- **SEO / AIEO** — longueurs de `title` et `description`, `keywords`, slug, et une
  image d'aperçu.
- **Accessibilité** — texte alternatif des images, ordre des titres et texte de lien descriptif.
- **Exactitude & finition** — liens fonctionnels, code qui s'exécute et une voix cohérente.
- Une entrée **`CHANGELOG.md`** pour le contenu visible par l'utilisateur, le cas échéant.

Des questions, ou envie de proposer un sujet ? Ouvrez une issue ou lancez une discussion sur [GitHub](https://github.com/bamr87/zer0-mistakes). Nous sommes ravis de vous accueillir.
