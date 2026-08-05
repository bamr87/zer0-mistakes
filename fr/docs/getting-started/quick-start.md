---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Guide de démarrage rapide
description: Plusieurs méthodes d'installation pour le thème Jekyll Zer0-Mistakes
  — de l'assistant IA à la configuration manuelle.
preview: "/images/previews/quick-start-guide.png"
layout: default
categories:
- docs
- getting-started
tags:
- quickstart
- installation
- docker
difficulty: beginner
estimated_reading_time: 15 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/getting-started/quick-start/"
translation_of: pages/_docs/getting-started/quick-start.md
translation_source_url: "/docs/getting-started/quick-start/"
machine_translated: true
translated_from_sha: f48dddacb177
---

# Guide de démarrage rapide

Ce guide couvre toutes les méthodes d'installation du thème Jekyll Zer0-Mistakes.

---

## Choisissez votre approche

| Approche | Méthode | Idéal pour |
|------|--------|----------|
| **A** | Assistant d'installation IA | Créer un nouveau site (recommandé) |
| **B** | Dépôt modèle GitHub | Copie en un clic de tout le dépôt |
| **C** | GitHub Codespaces | Développement dans le cloud sans installation |
| **D** | Fork/Clone | Site personnel et personnalisation du thème |
| **E** | Thème distant | GitHub Pages sans copier les fichiers |
| **F** | Gem Ruby | Flux de travail Jekyll traditionnel |

---

## Approche A — Assistant d'installation IA (recommandé)

### Prérequis

- Docker Desktop
- Git (facultatif, mais recommandé)

### 1) Installation complète (par défaut)

Créez un nouveau dossier et exécutez le programme d'installation :

```bash
mkdir my-site
cd my-site
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full
```

Une exécution réussie se termine par un récapitulatif et vos prochaines étapes :

```text
[SUCCESS] Installation completed successfully!
[INFO] Installation mode: full
[INFO] Next steps:
  1. cd my-site
  2. Review and customize _config.yml
  3. Run 'docker-compose up' or 'bundle install && bundle exec jekyll serve'
  4. Visit http://localhost:4000 to see your site
```

L'installation complète met en place l'intégralité du thème (~500 fichiers : layouts, includes, Sass, assets, configuration Docker). La variante `--minimal` n'écrit que les quelques fichiers de configuration ci-dessous.

Remarques :

- `--full` est la valeur par défaut ; elle installe la structure complète du thème, la configuration Docker et les surcharges de développement.
- Le programme d'installation s'exécute en « mode distant » lorsqu'il est lancé via `curl` et télécharge automatiquement les fichiers du thème.
- Le programme d'installation crée un `INSTALLATION.md` local au projet dans le dossier du site généré.

### 2) Démarrer le serveur de développement (Docker)

Depuis votre dossier de site généré :

```bash
docker compose up        # or: docker-compose up (v1 syntax)
```

La première exécution construit l'image et installe les gems, ce qui prend quelques minutes. Une fois prêt, vous verrez la ligne du serveur Jekyll :

```text
       Jekyll Feed: Generating feed for posts
                    done in 4.2 seconds.
 Auto-regeneration: enabled for '/site'
    Server address: http://0.0.0.0:4000
  Server running... press ctrl-c to stop.
```

Ouvrez ensuite **`http://localhost:4000`** — votre site est en ligne :

![Site Zer0-Mistakes exécuté sur localhost:4000](/assets/images/quickstart/site-running.png)

#### Vérifier que tout fonctionne

- La page d'accueil s'affiche avec la barre de navigation supérieure et une bannière « Get Started ».
- La modification puis l'enregistrement d'un fichier sous `pages/` déclenche un **rechargement en direct** du navigateur.
- Une vérification rapide de la compilation (à lancer dans un second terminal) doit se terminer proprement :

  ```bash
  docker compose exec -T jekyll bundle exec jekyll build \
    --config '_config.yml,_config_dev.yml'
  ```

> **Astuce :** `docker compose` (v2, avec un espace) et `docker-compose` (v1, avec un trait d'union)
> sont interchangeables ici. Utilisez celle que fournit votre installation Docker.

### 3) Installation minimale (facultatif)

Si vous souhaitez un point de départ minimal :

```bash
mkdir my-site-min
cd my-site-min
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --minimal
```

Vous pouvez faire évoluer une installation minimale vers une installation complète plus tard :

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash -s -- --full
```

---

## Approche B — Dépôt modèle GitHub

En un clic, créez votre propre copie de tout le dépôt.

### Option 1 : interface GitHub

1. Rendez-vous sur [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Cliquez sur **« Use this template »** → **« Create a new repository »**
3. Clonez votre nouveau dépôt et commencez à développer

### Option 2 : GitHub CLI

```bash
gh repo create my-site --template bamr87/zer0-mistakes --clone
cd my-site
docker-compose up
```

> **Remarque :** vous devez activer « Template repository » dans Settings → General du dépôt pour que cela fonctionne.

---

## Approche C — GitHub Codespaces (sans installation)

Développez entièrement dans le cloud — sans Docker ni Ruby en local.

### Option 1 : en un clic

[![Ouvrir dans GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bamr87/zer0-mistakes)

### Option 2 : depuis le dépôt

1. Rendez-vous sur [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Cliquez sur **Code** → **Codespaces** → **Create codespace on main**
3. Attendez la construction de l'environnement (~2 min)
4. Le site démarre automatiquement sur le port 4000

### Option 3 : VS Code

1. Installez l'[extension GitHub Codespaces](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces)
2. Ouvrez la palette de commandes → **Codespaces: Create New Codespace**
3. Sélectionnez `bamr87/zer0-mistakes`

---

## Approche D — Fork/Clone (site personnel)

Forkez dans `<your-username>.github.io` pour obtenir un site utilisateur GitHub Pages fonctionnel dès le départ.

### Prérequis

- Docker Desktop
- Aucun dépôt `<your-username>.github.io` existant (un seul site utilisateur gratuit par compte GitHub)

### 1) Forkez le dépôt

1. Rendez-vous sur [bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes) → **Fork**
2. Définissez le **Repository name** sur `<your-username>.github.io`
3. Activez **Settings → Pages → Deploy from branch : `main`**
4. Votre site est mis en ligne sur `https://<your-username>.github.io`

### 2) Clonez et configurez en local

```bash
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
./scripts/fork-cleanup.sh   # interactive config wizard
```

### 3) Démarrez le développement (Docker)

```bash
docker-compose up
```

Cela utilise les deux configurations : `_config.yml,_config_dev.yml`

### 4) Commandes Docker utiles

```bash
# Rebuild when dependencies change
docker-compose up --build

# Open a shell in the container
docker-compose exec jekyll bash

# Stop containers
docker-compose stop

# Remove containers + network
docker-compose down
```

Consultez [docs/FORKING.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/forking.md) pour le workflow complet fork → configuration → personnalisation.

---

## Parcours E — Thème distant GitHub Pages

Utilisez cette option si vous souhaitez que votre propre dépôt référence le thème sans copier de fichiers.

Dans le `_config.yml` du dépôt de votre site :

```yaml
remote_theme: "bamr87/zer0-mistakes"
plugins:
  - jekyll-remote-theme
```

Remarques :

- GitHub Pages dispose d'une liste blanche de plugins ; limitez au minimum les plugins personnalisés.
- Le développement local via Docker est généralement plus simple que de tenter d'aligner manuellement les versions de Ruby/Jekyll de GitHub Pages.

---

## Parcours F — Thème sous forme de gem Ruby

Utilisez cette option si vous préférez installer le thème sous forme de gem.

Dans votre `Gemfile` :

```ruby
gem "jekyll-theme-zer0"
```

Dans votre `_config.yml` :

```yaml
theme: "jekyll-theme-zer0"
```

Ensuite :

```bash
bundle install
bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

---

## Liste de contrôle pour la première personnalisation

La plupart des personnalisations commencent dans `_config.yml` (production) et `_config_dev.yml` (surcharges de développement).

### 1) Mettez à jour l'identité de votre site (`_config.yml`)

Champs courants à modifier :

- `title`, `subtitle`, `description`
- `url` et `baseurl`
- `author.*` / `name` / `email`
- `logo` / `teaser` / `og_image`

Important :

- Les modifications de `_config.yml` ne sont **pas rechargées à chaud** par Jekyll ; redémarrez votre serveur de développement après les avoir modifiées.

### 2) Désactivez ou remplacez les outils d'analyse (`_config.yml`)

Ce dépôt est fourni avec des paramètres d'analyse (Google Analytics + PostHog). Pour votre propre site :

- définissez `google_analytics: null` (ou votre propre identifiant)
- pour PostHog, définissez `posthog.enabled: false` ou remplacez `posthog.api_key` + `posthog.api_host`

En développement, les outils d'analyse sont déjà désactivés dans `_config_dev.yml`.

### 3) Personnalisez la navigation

Les données de navigation se trouvent dans :

- `_data/navigation/`

Si vous souhaitez modifier les menus/barres latérales, commencez ici, puis vérifiez :

- `_includes/navigation/`

### 4) Ajoutez/remplacez du contenu

Emplacements de contenu typiques :

- `index.html` / `index.md` (page d'accueil)
- `pages/` (pages du site)
- `pages/_posts/` (articles de blog, si vous utilisez des articles)
- `pages/_docs/` (documentation publiée pour l'utilisateur final)

---

## Dépannage

### Port déjà utilisé

Si `4000` est occupé, modifiez le mappage du port hôte dans `docker-compose.yml` :

```yaml
ports:
  - "4001:4000"
```

### Apple Silicon (Mac série M)

La configuration Docker de ce dépôt utilise `platform: linux/amd64` pour des raisons de compatibilité. Si Docker émet un avertissement, il est généralement sûr de poursuivre.

### Thème introuvable / problèmes de thème distant

Pour le développement Docker local, `_config_dev.yml` désactive `remote_theme` afin d'éviter d'avoir à récupérer des thèmes depuis GitHub.

### Les modifications de configuration n'apparaissent pas

- Les modifications de `_config.yml` nécessitent de redémarrer le serveur Jekyll.
- Essayez :

```bash
docker-compose down
docker-compose up
```

---

## Étapes suivantes

- [Guide du thème](../theme-guide/) — Guide de personnalisation complet
- [Front Matter](/docs/front-matter/) — Configurez les métadonnées des pages
- [Fonctionnalités](/docs/features/) — Activez les diagrammes Mermaid, les commentaires, les outils d'analyse
- [Déploiement](/docs/deployment/) — Publiez votre site

## Référence technique

Pour les détails destinés aux contributeurs (architecture de l'installateur, système de profils, modules de cible de déploiement) :

- [Guide d'installation → docs/installation/index.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/index.md)

## Voir aussi

- [[Getting Started]]
- [[Installation]]
- [[Docker]]
- [[Customization]]
