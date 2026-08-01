---
title: Profils d'auteur et signatures « À propos de l'auteur »
description: Définissez des profils d'auteur et faites apparaître des signatures,
  des cartes de bio et des pages de profil par auteur dans chaque collection du thème
  Jekyll Zer0-Mistakes.
preview: "/images/previews/author-profiles-and-about-the-author-bylines.png"
lastmod: 2026-07-13 00:00:00.000000000 Z
layout: default
author: bamr87
categories:
- docs
- customization
tags:
- authors
- components
- collections
- seo
keywords:
- author profiles
- about the author
- jekyll author byline
- author bio card
- collections
difficulty: beginner
estimated_reading_time: 8 minutes
lang: fr
permalink: "/fr/docs/customization/author-profiles/"
translation_of: pages/_docs/customization/author-profiles.md
translation_source_url: "/docs/customization/author-profiles/"
machine_translated: true
translated_from_sha: c6ab7cc3db38
---

Le thème embarque un système d'auteurs unique et en couches, afin que chaque collection — articles, docs, notes, notebooks, quickstart, about, et toute autre que vous ajoutez — présente les auteurs de façon cohérente : une signature liée avec un avatar, une carte biographique « À propos de l'auteur », et une page de profil **interactive** par auteur qui agrège tout ce qu'ils ont écrit, avec des contrôles de filtrage / recherche / tri.

> **Envie de contribuer ?** La [page Auteur invité](⟦1⟧)
> est un guide pratique pour rédiger votre premier article et obtenir votre propre profil
> d'auteur — le workflow, le front matter et le processus de relecture réunis en un seul endroit.

## 1. Définir les auteurs dans `_data/authors.yml`

`_data/authors.yml` est la source unique de vérité. Chaque clé de premier niveau est une **clé d'auteur** que vous référencez depuis le front matter.

```yaml
bamr87:
  name: "Amr Abdel-Motaleb"        # required — display name
  bio: "Creator of zer0-mistakes…" # shown in the bio card + profile hero
  avatar: "/images/authors/bamr87.png"  # asset path, OR a full URL (e.g. a
                                        # GitHub avatar). Omit it and the author's
                                        # github handle resolves the avatar instead.
  role: "Creator & Lead Developer"
  github: "bamr87"
  twitter: "bamr87"
  linkedin: "bamr87"
  website: "https://zer0-mistakes.com"
  expertise:                       # optional — rendered as chips
    - "Jekyll theme development"
    - "Docker containerization"
  # profile: false                 # optional — opt out of a generated profile page
```

Une entrée `default` sert de solution de repli pour tout auteur inconnu. Consultez l'en-tête du fichier pour la liste complète des champs.

## 2. Référencer un auteur depuis le contenu

Définissez `author` dans le front matter d'une page sur une **clé d'auteur** :

```yaml
---
title: My Post
author: bamr87
---
```

Lorsque la valeur correspond à une clé, le thème affiche l'avatar, résout le nom d'affichage, lie la signature à la page de profil et affiche la carte « À propos de l'auteur ». Si la valeur est une simple chaîne qui n'est *pas* une clé (par ex. `author: "Jane Doe"`), elle est affichée telle quelle, sans avatar ni lien de profil — de sorte que le contenu existant continue de fonctionner.

## 3. Ce qui s'affiche et où

| Surface | Composant | Apparaît dans |
| --- | --- | --- |
| Signature en ligne | `components/author-card.html` (`style="inline"`) | `article`, `note`, `notebook`, `news`, `section`, `post-card` |
| Carte « À propos de l'auteur » | `components/author-bio.html` → `author-card.html` (`style="full"`) | `article`, `note`, `notebook` |
| Bandeau de profil + grille de contenu | `_layouts/author.html` | `/authors/:key/` |
| Répertoire des auteurs | `_layouts/authors.html` | `/authors/` |

La carte « À propos de l'auteur » est conditionnée par le drapeau `author_profile` du front matter (défini par défaut sur `true` pour les collections de contenu dans `_config.yml`). Définissez `author_profile: false` sur une page pour la masquer.

### Réutiliser le composant directement

`components/author-card.html` est la primitive de rendu. Insérez-la n'importe où :

```liquid
{% raw %}{% include components/author-card.html author=page.author style="inline" %}
{% include components/author-card.html author="bamr87" style="full" %}
{% include components/author-card.html author=post.author style="inline" show_avatar=false %}{% endraw %}
```

Paramètres : `style` (`inline`/`compact`/`full`), `link`, `show_avatar`, `show_bio`, `show_social`, `show_expertise`, `avatar_size`, `name_itemprop`.

## 4. Pages de profil

Chaque auteur dispose d'une page à `/authors/:key/` qui liste **tout** son contenu à travers l'ensemble des collections (associé par clé d'auteur, `name` ou `display_name`), et toutes sont liées depuis le répertoire `/authors/`.

Ces pages sont créées de deux manières :

1. **Automatiquement** par `_plugins/author_pages_generator.rb` lors d'un
`jekyll build` normal. Excluez un seul auteur avec `profile: false`, ou désactivez entièrement le générateur avec `authors: { generate_pages: false }` dans `_config.yml`.
2. **En tant que pages commitées** dans `pages/_about/authors/` (partie de la collection `about`
; chacune comporte un permalien `/authors/:key/` explicite). Le générateur classique de GitHub Pages s'exécute en *mode sûr* et ne charge pas les plugins personnalisés, c'est pourquoi les pages des auteurs de ce site sont commitées (seulement du front matter — `layout: author` et `author_key`) de la même manière que `search.json` et le sitemap. Le générateur détecte les pages existantes **et les documents de collection** et les ignore, il n'y a donc pas de doublons.

Pour ajouter un profil pour un nouvel auteur sur un site en mode sûr, copiez un modèle existant dans `pages/_about/authors/<key>.md` :

```yaml
---
layout: author
author_key: yourkey
title: Your Name
permalink: /authors/yourkey/
sidebar: false
hide_intro: true
---
```

## 5. La page de profil interactive

Chaque page `/authors/:key/` est un tableau de bord vivant, et non une liste statique — entièrement côté client, sans étape de build et avec une solution de repli élégante sans JS :

![La page de profil d'auteur interactive : un bandeau avec avatar, biographie et accroche, un tableau de bord de statistiques qui fait aussi office de filtres de type par collection, plus une zone de recherche, un contrôle de tri et un nuage de sujets cliquable](⟦59⟧)

- **Bandeau** — avatar, nom, rôle, l'accroche `tagline`, la biographie, `location`,
  la date de dernière activité, les puces d'expertise et les liens sociaux.
- **Tableau de bord de statistiques** — une carte par collection dans laquelle l'auteur a écrit
(Articles, Docs, Notes, …) plus une carte « Tout ». Les cartes *sont* le filtre de type : cliquez-en une pour n'afficher que cette collection.
- **Recherche** — filtre par titre et tags au fur et à mesure de la saisie.
- **Tri** — du plus récent, du plus ancien, ou par titre de A à Z.
- **Sujets** — un nuage de tags cliquable ; sélectionnez un sujet pour affiner la grille.
- **Compteur en direct + effacement** — « Affichage de N sur M » (annoncé aux lecteurs d'écran via
  `aria-live`), plus un contrôle Effacer dès qu'un filtre est actif.
- **Liens profonds** — le filtre de type actif est reflété dans le fragment d'URL
  (par ex. `/authors/bamr87/#type=docs`), de sorte qu'une vue filtrée est partageable.

Le comportement réside dans `assets/js/author-profile.js`, qui s'active de lui-même sur le conteneur `[data-author-profile]` (sûr à charger n'importe où). Avec JavaScript désactivé, chaque contribution s'affiche toujours dans une grille normale (entièrement indexable), et toutes les animations respectent `prefers-reduced-motion`.

## 6. Personas d'auteurs IA

Un auteur peut être une **persona d'agent IA**. Marquez-le avec `ai: true` et donnez-lui un bloc `persona`. Le thème affiche alors un badge « IA » sur chaque signature et carte, montre la mention d'authorship `disclosure` sur le héros du profil et dans l'encadré « À propos de l'auteur », et met en avant les `topics` personnalisés de la persona.

![Page de profil interactive de Cassandra : un avatar bouclier rouge, un badge « AI AUTHOR » à côté du nom, des sujets de sécurité personnalisés et une divulgation d'authorship IA à bordure violette](⟦72⟧)

```yaml
cassandra:
  name: "Cassandra"
  ai: true
  role: "AI Security Analyst"
  avatar: "/images/authors/cassandra.svg"
  topics: [Security, Threat modeling, Supply chain]
  persona:
    archetype: "Paranoid security catastrophist"
    voice: "Urgent, ominous, first-person; escalates trivial gaps to catastrophe."
    signature_moves: ["Reframes the mundane as a critical attack surface"]
    avoids: ["Reassurance of any kind"]
    disclosure: "Cassandra is an AI author persona. Posts are AI-generated…"
```

Le bloc `persona` **est** le modèle réutilisable. Lorsqu'un agent IA rédige un article, il adopte cette persona à l'aide de [`.github/prompts/ai-author.prompt.md`](https://github.com/bamr87/zer0-mistakes/blob/main/.github/prompts/ai-author.prompt.md) et définit `author: <persona key>` dans le front matter de l'article — l'ajout d'une nouvelle persona ne nécessite aucune modification de code.

Le thème est livré avec deux personas d'exemple (voir leurs profils sur `/authors/cassandra/` et `/authors/vega/`) :

- **Cassandra** — une *Analyste de Sécurité IA* paranoïaque qui transforme des lacunes triviales
  (un favicon, une barre oblique finale) en brèches menaçant la civilisation.
- **Vega** — une *Analyste de Données IA* enthousiaste qui ajuste des modèles hiérarchiques
  bayésiens et des embeddings UMAP à des données glorieusement triviales.

**La transparence d'abord :** l'authorship IA est toujours divulgué de manière visible — le badge et la divulgation ne sont ni optionnels ni jamais masqués.

### Style artistique de prévisualisation par auteur

Un auteur IA peut également posséder un **style artistique distinct** pour ses bannières de prévisualisation générées. Ajoutez un bloc `preview:` à l'auteur et le
[générateur d'images de prévisualisation](⟦81⟧)
utilisera ces paramètres **au lieu de** la configuration `preview_images` à l'échelle du site (`_config.yml`) — mais uniquement pour les articles qui définissent `author: <that key>`. Tout autre article conserve le style par défaut.

```yaml
cassandra:
  ai: true
  # …persona…
  preview:
    style: "dark cinematic security-operations noir, ominous mood, deep crimson-and-charcoal palette"
    style_modifiers: "heavy vignette, red alert glow, faint scanlines, sense of imminent threat"
    # optional generator overrides:
    # size: "1536x1024"
    # quality: "auto"
    # model: "gpt-image-2"   # models from another vendor family fall back to the provider default
```

Ainsi, les bannières de Cassandra ressortent dans un style noir menaçant d'opérations de sécurité tandis que celles de Vega rayonnent de couleurs vibrantes de visualisation de données — chacune reconnaissablement sienne, sans aucune modification de front matter par article. La substitution est résolue par fichier au moment de la génération par le moteur consolidé (`scripts/lib/preview_generator.py`, exécuté via `scripts/generate-preview-images.sh`) et s'applique à chaque moteur de rendu — le style se répercute également dans le brief de direction artistique et les critères de révision de Claude ; régénérez une bannière existante avec `--force`.

Deux vraies bannières générées pour ces personas — même générateur, même plomberie de prompt, deux rendus incomparables :

{% assign cassandra_banner = '/assets/images/previews/your-favicon-ico-is-an-unlocked-door-to-total-coll.jpg' | relative_url %}
{% assign vega_banner = '/assets/images/previews/i-bayesian-modeled-my-coffee-intake-and-wept-with-.jpg' | relative_url %}

| Cassandra — roman graphique noir à l'encre | Vega — infographie 3D isométrique brillante |
| --- | --- |
| ![Bannière de prévisualisation de Cassandra : une scène de comic noir sombre et très contrastée — une silhouette en trench-coat dans une embrasure, une main menaçante et un favicon rougeoyant rouge sang dans une trappe](⟦89⟧) | ![Bannière de prévisualisation de Vega : une infographie 3D isométrique lumineuse — graphiques à barres flottants, nuages de points et une courbe en cloche bayésienne autour d'une silhouette joyeuse et d'une machine à espresso](⟦90⟧) |

> Les bannières générées sont réduites en JPEG d'environ 1200 px de large (adaptés aux cartes OG,
> ~300 Ko) plutôt que d'être commitées comme PNG sources de plusieurs Mo.

Ordre de priorité des paramètres, par fichier :

**`preview:` de l'auteur › drapeaux CLI › variables d'environnement (`IMAGE_STYLE`, …) › `_config.yml` `preview_images` › valeurs par défaut intégrées.**

## SEO / AIEO

Les pages de profil émettent `schema.org/CollectionPage` avec un `ItemList` des contributions de l'auteur, et les signatures/cartes émettent des microdonnées `Person` (`name`, `image`, `jobTitle`, `knowsAbout`, `sameAs`) — renforçant les signaux E-E-A-T que le thème met déjà en avant via `components/author-eeat.html`.
