---
lastmod: 2026-06-23 00:00:00.000000000 Z
title: Forker et déployer sur GitHub Pages
description: Le workflow standard fork ou remote-theme — mettez en ligne un site Zer0-Mistakes
  personnalisé sur GitHub Pages en une quinzaine de minutes, avec les étapes de vérification.
preview: "/images/docs/quickstart/docs-deployment.png"
layout: default
categories:
- docs
- quickstart
tags:
- quickstart
- github-pages
- remote-theme
- deployment
keywords:
- github-pages
- fork
- remote-theme
- deployment
- jekyll
author: bamr87
difficulty: beginner
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/quickstart/fork-and-deploy/"
translation_of: pages/_docs/quickstart/fork-and-deploy.md
translation_source_url: "/docs/quickstart/fork-and-deploy/"
machine_translated: true
translated_from_sha: d5c4897cbad9
---

# Forker et déployer sur GitHub Pages

**Ce que vous allez faire :** mettre en place un site Zer0-Mistakes qui vous appartient et le publier sur GitHub Pages, en choisissant entre le modèle *remote theme* à faible maintenance et le modèle *fork* à contrôle total.

## Prérequis

- Un compte GitHub et Git installé localement.
- Une connaissance de base de l'édition de YAML et de Markdown.
- Optionnel mais recommandé : Docker, pour la boucle de prévisualisation locale.

## Étape 1 — Choisir entre remote theme et fork

| Modèle | Ce que vous commitez | Ce que vous pouvez modifier | Mises à jour |
| --- | --- | --- | --- |
| **Remote theme** | Contenu + configuration uniquement | Vos pages et votre configuration | Automatiques (thème récupéré au moment du build) |
| **Fork** | L'ensemble du thème | Layouts, includes, SCSS, contenu | Manuelles (fusion des changements amont) |

Choisissez **remote theme** si vous voulez surtout rédiger du contenu. Choisissez **fork** si vous comptez modifier l'apparence ou le comportement du thème.

## Étape 2a — Configuration du remote theme

Créez un nouveau dépôt et ajoutez trois fichiers. Votre `_config.yml` déclare le thème et l'unique plugin requis :

```yaml
# _config.yml
remote_theme: "bamr87/zer0-mistakes"
plugins:
  - jekyll-include-cache
```

Ajoutez un `Gemfile` pour que GitHub Pages résolve les dépendances :

```ruby
# Gemfile
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
gem "jekyll-include-cache"
```

Ajoutez un `index.md` avec un front matter afin d'avoir une page d'accueil, puis committez. Le [Démarrage minimal](/docs/quickstart/bare-minimum/) couvre plus en détail cet ensemble minimal de fichiers.

## Étape 2b — Configuration du fork

Sur le [dépôt du thème](https://github.com/bamr87/zer0-mistakes), utilisez **Fork** pour le copier dans votre compte, puis clonez votre fork :

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

Exécutez l'installateur pour réinitialiser la configuration avec votre propre identité et générer les répertoires de contenu :

```bash
./install.sh
```

## Étape 3 — Prévisualiser localement

La boucle recommandée utilise Docker afin que votre environnement corresponde à celui de la CI :

```bash
docker-compose up
```

Ouvrez `http://localhost:4000` pour voir votre site. Sans Docker, utilisez `bundle install` puis `bundle exec jekyll serve`. La documentation s'affiche avec une arborescence de navigation à gauche et un sommaire « On this page » :

![Une page de documentation Zer0-Mistakes affichant la navigation de la barre latérale et le sommaire de la page](/assets/images/docs/quickstart/docs-deployment.png)

## Étape 4 — Activer GitHub Pages

1. Poussez votre dépôt sur GitHub.
2. Ouvrez **Settings → Pages**.
3. Sous **Build and deployment → Source**, choisissez **Deploy from a branch**.
4. Sélectionnez votre branche `main` et le dossier `/ (root)`, puis **Save**.

GitHub construit et publie le site automatiquement à chaque push. La référence [Déployer sur GitHub Pages](/docs/deployment/github-pages/) couvre les domaines personnalisés et l'alternative GitHub Actions.

## Étape 5 — Vérifier

- Votre site se charge à l'adresse `https://<your-username>.github.io/<your-repo>/`.
- La barre de navigation, le pied de page et la page d'accueil s'affichent avec votre contenu.
- Modifier une page et la pousser déclenche un nouveau déploiement en une minute ou deux.

## Dépannage

- **Le build échoue sur `Unknown tag 'include_cached'`** — ajoutez `jekyll-include-cache`
  à votre `plugins:` (Étape 2a).
- **Les styles ou les layouts semblent non définis** — pour le modèle remote theme, redéclarez vos
`collections`, `defaults` et `permalink` dans votre propre `_config.yml` ; ils ne sont pas hérités du thème.
- **Erreurs 404 sur des pages que vous n'avez pas créées** — les pages générées par les plugins (profils
d'auteur, recherche, sitemap) sont ignorées par le mode sécurisé de GitHub Pages ; voir le guide [Déployer sur GitHub Pages](/docs/deployment/github-pages/).

## Étapes suivantes

- Personnalisez les couleurs et la mise en page avec le
  [Guide du thème](/docs/getting-started/theme-guide/).
- Suivez la [série de démarrage rapide pas à pas](/quickstart/) pour les détails de configuration de la machine et
  de Jekyll.
