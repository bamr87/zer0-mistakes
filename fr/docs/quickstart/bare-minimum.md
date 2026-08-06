---
lastmod: 2026-05-05 00:00:00.000000000 Z
title: Modèle minimal pour thème distant
description: Démarrez un site GitHub Pages fonctionnel utilisant zer0-mistakes comme
  thème distant avec seulement trois fichiers — _config.yml, Gemfile et index.md.
preview: "/images/previews/bare-minimum-remote-theme-starter.png"
layout: default
categories:
- docs
- quickstart
tags:
- setup
- quickstart
- remote-theme
- github-pages
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/quickstart/bare-minimum/"
translation_of: pages/_docs/quickstart/bare-minimum.md
translation_source_url: "/docs/quickstart/bare-minimum/"
machine_translated: true
translated_from_sha: abd24f43d4b0
---

# Modèle minimal pour thème distant

Vous pouvez faire fonctionner un site zer0-mistakes complet sur GitHub Pages avec seulement **trois fichiers**. Tout le reste — mises en page, includes, ressources Bootstrap — est chargé automatiquement depuis la gem publiée.

## Les trois fichiers

### 1. `_config.yml`

```yaml
title: My Site
description: A site powered by zer0-mistakes
preview: /images/previews/bare-minimum-remote-theme-starter.png
remote_theme: bamr87/zer0-mistakes

plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-seo-tag
```

### 2. `Gemfile`

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "jekyll-remote-theme"
```

### 3. `index.md`

```markdown
---
layout: home
title: Welcome
---

Hello, world! This site uses the zer0-mistakes theme.
```

## Déployer sur GitHub Pages

1. Créez un nouveau dépôt sur GitHub (par ex. `my-site`)
2. Ajoutez les trois fichiers ci-dessus
3. Allez dans **Settings → Pages → Source** et choisissez **Deploy from a branch → main**
4. GitHub Pages compile et publie automatiquement

Votre site sera en ligne à l'adresse `https://<username>.github.io/<repo>/` en une ou deux minutes.

## Dégradation élégante

Lorsque les collections (`_posts`, `_docs`, `_notes`, etc.) sont absentes, le pied de page, le partial de bienvenue et le partial d'informations du thème se dégradent élégamment — aucune erreur Liquid ni mise en page cassée.

## Aperçu local (Docker)

Ajoutez un `docker-compose.yml` pour tester en local :

```yaml
version: "3.8"
services:
  jekyll:
    image: jekyll/jekyll:latest
    platform: linux/amd64
    command: jekyll serve --config "_config.yml" --watch --force_polling --drafts
    ports:
      - "4000:4000"
    volumes:
      - .:/srv/jekyll
    environment:
      JEKYLL_ENV: development
```

Puis lancez :

```bash
docker-compose up
```

Rendez-vous sur `http://localhost:4000`.

## Faire évoluer le modèle

| Étape suivante | À ajouter |
|-----------|-------------|
| Articles de blog | `_posts/YYYY-MM-DD-title.md` |
| Documentation | Collection `_docs/` + entrée `_config.yml` |
| Navigation personnalisée | `_data/navigation.yml` |
| Analytics | Clés `posthog:` ou `google_analytics:` dans `_config.yml` |
| Thème complet | Utilisez l'[assistant d'installation IA](/docs/getting-started/quick-start/) |

## Voir aussi

- [[Quick Start]]
- [[Installation]]
- [[Docker]]
