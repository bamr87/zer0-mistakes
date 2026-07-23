---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Déployer sur GitHub Pages
description: Déployez votre site Jekyll Zer0-Mistakes sur GitHub Pages avec des générations
  automatiques.
preview: "/images/previews/deploy-to-github-pages.png"
layout: default
categories:
- docs
- deployment
tags:
- github-pages
- deployment
- hosting
difficulty: beginner
estimated_reading_time: 10 minutes
prerequisites:
- GitHub account
- Jekyll site in a GitHub repository
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/deployment/github-pages/"
translation_of: pages/_docs/deployment/github-pages.md
translation_source_url: "/docs/deployment/github-pages/"
machine_translated: true
translated_from_sha: be0523b0bf14
---

# Déployer sur GitHub Pages

GitHub Pages offre un hébergement gratuit pour les sites Jekyll avec des builds automatiques à chaque push.

## Prérequis

- Un compte GitHub
- Votre site Jekyll dans un dépôt GitHub

## Configuration

### Étape 1 : Configurer votre dépôt

1. Accédez à votre dépôt sur GitHub
2. Rendez-vous dans **Settings** → **Pages**
3. Sous **Source**, sélectionnez votre branche (généralement `main`)
4. Cliquez sur **Save**

### Étape 2 : Configurer Jekyll

Mettez à jour votre `_config.yml` pour GitHub Pages :

```yaml
# For user sites (username.github.io) — recommended for forks:
url: "https://username.github.io"
baseurl: ""  # Empty — user site deploys at root

# For project sites (username.github.io/repo-name):
# url: "https://username.github.io"
# baseurl: "/repository-name"

# Use remote theme for GitHub Pages compatibility
remote_theme: "bamr87/zer0-mistakes"

# Required plugins (GitHub Pages whitelist)
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
```

> **Astuce :** Forkez dans `<your-username>.github.io` pour ne pas avoir à modifier `baseurl` du tout. Consultez [docs/FORKING.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/forking.md) pour le workflow recommandé.

### Étape 3 : Pousser et déployer

```bash
git add .
git commit -m "Configure for GitHub Pages"
git push origin main
```

GitHub va automatiquement builder et déployer votre site.

## Types de dépôts

### Site utilisateur/organisation (recommandé pour les forks)

- Nom du dépôt : `username.github.io`
- URL : `https://username.github.io`
- `baseurl: ""`
- Aucune configuration supplémentaire nécessaire — fonctionne d'emblée avec les valeurs par défaut du thème
- Consultez le [Guide de fork](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/forking.md)

### Site de projet

- Nom du dépôt : n'importe quel autre nom
- URL : `https://username.github.io/repository-name`
- `baseurl: "/repository-name"` (doit être défini dans `_config.yml`)

## Domaine personnalisé

Pour utiliser un domaine personnalisé :

1. Rendez-vous dans **Settings** → **Pages**
2. Saisissez votre domaine dans **Custom domain**
3. Cochez **Enforce HTTPS**
4. Configurez le DNS chez votre bureau d'enregistrement de domaine

Consultez [Configuration d'un domaine personnalisé](/docs/deployment/custom-domain/) pour la configuration DNS détaillée.

## Dépannage

### Échecs de build

Consultez l'onglet **Actions** pour les journaux de build :

1. Accédez au dépôt → **Actions**
2. Cliquez sur le workflow ayant échoué
3. Examinez les messages d'erreur

Problèmes courants :

- Front matter invalide (syntaxe YAML)
- Dépendances manquantes
- Plugin absent de la liste blanche de GitHub Pages

### Le site ne se met pas à jour

1. Vérifiez que le push a réussi
2. Vérifiez le statut du build dans **Actions**
3. Patientez quelques minutes pour la propagation du CDN
4. Essayez un rechargement forcé (Ctrl+Shift+R)

### Erreurs 404

- Vérifiez que `baseurl` correspond au nom de votre dépôt
- Vérifiez que le fichier existe au chemin attendu
- Assurez-vous que le `permalink` du front matter est correct

## Limitations de GitHub Pages

| Fonctionnalité | Statut |
|---------|--------|
| Plugins personnalisés | Non pris en charge (liste blanche uniquement) |
| Temps de build | ~10 minutes max |
| Taille du dépôt | Limite de 1 Go |
| Bande passante | 100 Go/mois |
| Minutes de build | 10/heure, 2000/mois |

## Alternative : GitHub Actions

Pour plus de contrôle, utilisez GitHub Actions pour la génération :

```yaml
# .github/workflows/jekyll.yml
name: Deploy Jekyll

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          
      - name: Build site
        run: bundle exec jekyll build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

Cela permet d'utiliser des plugins personnalisés et d'avoir un meilleur contrôle sur la génération.

## Étapes suivantes

- [Configuration d'un domaine personnalisé](/docs/deployment/custom-domain/)
- [Déploiement Netlify](/docs/deployment/netlify/) — Pour plus de fonctionnalités d'hébergement

## Référence technique

Pour les détails destinés aux contributeurs (architecture du module de cible de déploiement, système de profils, intégration CI/CD) :

- [Cibles de déploiement → docs/installation/deploy-targets.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/installation/deploy-targets.md)

## Voir aussi

- [[Deployment]]
- [[Custom Domain Setup]]
- [[Deploy to Netlify]]
- [[Docker]]
