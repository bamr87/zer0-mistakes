---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: 404 intelligente et détection de la configuration du site
description: Comment la page 404 de zer0-mistakes détecte automatiquement si le site
  est un fork, un consommateur en remote-theme ou un clone complet, et guide les visiteurs
  vers un point d'entrée fonctionnel.
preview: "/images/previews/smart-404-site-configuration-detection.png"
layout: default
categories:
- docs
- features
tags:
- setup
- 404
- configuration
- ux
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
mermaid: true
lang: fr
permalink: "/fr/docs/features/smart-404/"
translation_of: pages/_docs/features/smart-404.md
translation_source_url: "/docs/features/smart-404/"
machine_translated: true
translated_from_sha: a36e25dd68dc
---

# 404 intelligente et détection de la configuration du site

La `404.html` de zer0-mistakes n'est pas un simple espace réservé « page introuvable ». Elle détecte la manière dont le site est déployé et propose au visiteur des conseils adaptés au contexte.

![La page 404 personnalisée : un grand « 404 », « Page introuvable », un bouton de recherche en ligne, des liens rapides vers Accueil/À propos/Contact et les boutons « Retour à l'accueil » / « Soumettre un problème sur GitHub »](/assets/images/docs/features/smart-404.png)

## Logique de détection

```mermaid
graph TD
    A[404.html Loads] --> B{site.remote_theme set?}
    B -- Yes --> C[Remote-theme consumer]
    B -- No --> D{site.theme set?}
    D -- Yes --> E[Gem-theme consumer]
    D -- No --> F[Full clone / fork]
    C & E & F --> G[Render matching help block]
```

Le modèle Liquid examine `site.remote_theme`, `site.theme` et un petit ensemble de variables `site.github.*` que GitHub Pages injecte au moment de la construction.

## Implémentation

La 404 intelligente se trouve à la racine du dépôt :

```text
404.html
```

Variables Liquid clés utilisées :

| Variable | Rôle |
|---|---|
| `site.remote_theme` | Détecter le mode remote-theme |
| `site.theme` | Détecter le mode gem-theme |
| `site.github.owner_name` | Renvoyer vers le bon profil GitHub |
| `site.url` / `site.baseurl` | Construire des liens absolus vers la page d'accueil |

## Ce que voient les visiteurs

### Consommateur en remote-theme

```text
🔍 Page Not Found
This page doesn't exist on this site.
→ Return to home  → View the theme source on GitHub
```

### Clone / fork complet

```text
🔍 Page Not Found
It looks like this page was removed or the URL changed.
→ Return to home  → Browse the docs
```

## Personnaliser la 404

Remplacez uniquement ce fichier dans le dépôt de votre site :

```text
your-site/
└── 404.html   ← Your custom version takes precedence
```

La `404.html` du thème n'est utilisée que lorsqu'aucune substitution locale n'existe.

## Ressources associées

- [Guide de démarrage rapide](/docs/getting-started/quick-start/)
- [Modèle minimal](/docs/quickstart/bare-minimum/)

## Voir aussi

- [[Features]]
- [[Getting Started]]
