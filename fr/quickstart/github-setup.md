---
title: Configuration GitHub et déploiement
author: Zer0-Mistakes Development Team
layout: default
description: Configurez l'intégration GitHub pour le contrôle de version et le déploiement
  automatisé. Forkez le thème, configurez les clés SSH et déployez sur GitHub Pages.
preview: "/images/previews/github-setup-deployment.png"
categories:
- Documentation
- Quick Start
tags:
- github
- git
- deployment
- github-pages
- version-control
keywords:
  primary:
  - github pages deployment
  - git workflow
  secondary:
  - ssh keys
  - github cli
  - fork repository
  - pull requests
lastmod: 2026-06-15 00:00:00.000000000 Z
draft: false
sidebar:
  nav: quickstart
quickstart:
  step: 3
  next: "/quickstart/personalization/"
  prev: "/quickstart/jekyll-setup/"
mermaid: true
lang: fr
permalink: "/fr/quickstart/github-setup/"
translation_of: pages/_quickstart/github-setup.md
translation_source_url: "/quickstart/github-setup/"
machine_translated: true
translated_from_sha: b3a9ae56e1bf
---

# Configuration GitHub et déploiement

Authentifiez-vous auprès de GitHub, forkez le thème et déployez votre site sur GitHub Pages.

```mermaid
flowchart LR
    A([Machine Setup done]) --> B[gh auth login]
    B --> C[Fork bamr87/zer0-mistakes]
    C --> D[./scripts/fork-cleanup.sh]
    D --> E[docker-compose up]
    E --> F[git push origin main]
    F --> G[GitHub Actions builds site]
    G --> H([username.github.io live 🚀])
```

## Prérequis

- [Configuration de la machine](/quickstart/machine-setup/) terminée (Docker, Git, GitHub CLI)
- Un [compte GitHub](https://github.com/signup)

## Étape 1 — S'authentifier avec GitHub CLI

```bash
gh auth login
# → GitHub.com
# → HTTPS
# → Login with a web browser
# Copy the one-time code, press Enter, paste in the browser
```

Vérifiez :

```bash
gh auth status
```

![Sortie de gh auth login](/assets/images/quickstart/github-setup-auth.png)

## Étape 2 — Forker le dépôt

![Dépôt bamr87/zer0-mistakes sur GitHub](/assets/images/quickstart/github-repo-main.png)

Forkez `bamr87/zer0-mistakes` dans votre compte. Le plus simple est de le nommer `<your-username>.github.io` afin que GitHub Pages déploie à la racine de votre domaine — aucun `baseurl` nécessaire.

**Via GitHub CLI :**

```bash
gh repo fork bamr87/zer0-mistakes --clone
cd zer0-mistakes
```

![Boîte de dialogue gh repo fork](/assets/images/quickstart/github-setup-fork.png)

**Ou via l'interface web de GitHub :**

1. Rendez-vous sur [github.com/bamr87/zer0-mistakes](https://github.com/bamr87/zer0-mistakes)
2. Cliquez sur **Fork** → définissez le nom sur `<your-username>.github.io`
3. Cliquez sur **Create fork**, puis clonez :

```bash
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
```

![Boîte de dialogue GitHub Code → Clone](/assets/images/quickstart/github-repo-clone.png)

![Boîte de dialogue de fork GitHub](/assets/images/quickstart/github-fork-dialog.png)

> Consultez [docs/FORKING.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/forking.md) pour le workflow complet fork → configuration → personnalisation.

## Étape 3 — Exécuter le script de nettoyage du fork

L'assistant interactif supprime le contenu spécifique au thème et configure le dépôt pour votre site :

```bash
./scripts/fork-cleanup.sh
```

Il vous demandera le titre de votre site, l'URL, le nom de l'auteur et d'autres paramètres de base, puis les écrira dans `_config.yml`.

![fork-cleanup.sh s'exécutant de manière interactive](/assets/images/quickstart/github-setup-fork-cleanup.png)

## Étape 4 — Démarrer le serveur de développement

```bash
docker-compose up
```

Rendez-vous sur [http://localhost:4000](http://localhost:4000) pour confirmer que votre site personnalisé fonctionne.

## Étape 5 — Activer GitHub Pages

Dans votre dépôt forké sur GitHub.com :

1. **Settings** → **Pages**
2. **Source** : Deploy from branch
3. **Branch** : `main` → `/` (racine)
4. Cliquez sur **Save**

![Paramètres GitHub Pages](/assets/images/quickstart/github-pages-settings.png)

Après le premier push, GitHub Actions construit le site et il apparaît à :

```
https://<your-username>.github.io
```

## Étape 6 — Pousser vos modifications

```bash
git add -A
git commit -m "feat: initial site personalization"
git push origin main
```

![Sortie de git push](/assets/images/quickstart/github-setup-push.png)

Suivez le déploiement : onglet **Actions** → workflow **pages build and deployment**.

## Workflow Git pour le développement continu

```bash
# New feature branch
git checkout -b feat/my-feature

# Make changes, then commit
git add -A
git commit -m "feat(posts): add first blog post"

# Push and open PR
git push origin feat/my-feature
gh pr create --fill
```

Fusionnez dans `main` pour déclencher un déploiement Pages.

## Dépannage

**Forker vers un nom de dépôt différent (pas `username.github.io`)**

Ajoutez `baseurl` à `_config.yml` :

```yaml
baseurl: "/repo-name"
url: "https://username.github.io"
```

**Échec de la construction Pages**

```bash
# Check the Actions tab in GitHub for build logs
# Common fix: ensure _config.yml has no YAML syntax errors
bundle exec jekyll build --config '_config.yml,_config_dev.yml' --trace
```

**`gh auth login` échoue**

Assurez-vous que le port 443 (HTTPS) est ouvert. Essayez le drapeau `--web` ou créez un [jeton d'accès personnel](https://github.com/settings/tokens) et utilisez `gh auth login --with-token`.

**Incohérence du remote origin**

```bash
git remote -v                                       # verify remotes
git remote set-url origin https://github.com/<you>/<repo>.git
```

---

<div class="d-flex justify-content-between mt-5">
  <a href="/quickstart/jekyll-setup/" class="btn btn-outline-secondary">
    <i class="bi bi-arrow-left"></i> Précédent : Configuration Jekyll
  </a>
  <a href="/quickstart/personalization/" class="btn btn-primary">
    Suivant : Personnalisation <i class="bi bi-arrow-right"></i>
  </a>
</div>
