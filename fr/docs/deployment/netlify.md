---
lastmod: 2026-06-14 00:00:00.000000000 Z
title: Déployer sur Netlify
description: Déployez votre site Jekyll sur Netlify avec un déploiement continu depuis
  GitHub et des en-têtes personnalisés.
preview: "/images/previews/deploy-to-netlify.png"
layout: default
categories:
- docs
- deployment
tags:
- deployment
- netlify
- jekyll
- ci-cd
difficulty: beginner
estimated_reading_time: 15 minutes
prerequisites:
- GitHub account
- Netlify account
- Jekyll site in Git repository
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/deployment/netlify/"
translation_of: pages/_docs/deployment/netlify.md
translation_source_url: "/docs/deployment/netlify/"
machine_translated: true
translated_from_sha: c5996bf99001
---

# Déployer sur Netlify

> Déployez votre site Jekyll sur Netlify avec un déploiement continu depuis GitHub.

## Vue d'ensemble

Netlify offre plusieurs avantages par rapport à GitHub Pages :

- **En-têtes personnalisés** — Contrôlez la mise en cache et les en-têtes de sécurité
- **Redirections** — Réécriture d'URL et redirections
- **Formulaires** — Gestion intégrée des formulaires
- **Fonctions** — Fonctions serverless
- **Aperçus de déploiement** — Prévisualisez les branches avant de les fusionner

## Prérequis

- Un compte GitHub avec le dépôt de votre site Jekyll
- Un compte Netlify (offre gratuite disponible)

## Configuration

### Étape 1 : Préparer votre dépôt

Assurez-vous que votre `Gemfile.lock` est à jour :

```bash
bundle install
bundle update
```

Validez le fichier de verrouillage mis à jour :

```bash
git add Gemfile.lock
git commit -m "Update Gemfile.lock for Netlify"
git push
```

### Étape 2 : Créer un compte Netlify

1. Rendez-vous sur [netlify.com](https://www.netlify.com/)
2. Cliquez sur **S'inscrire** et authentifiez-vous avec GitHub
3. Autorisez Netlify à accéder à vos dépôts

### Étape 3 : Connecter le dépôt

1. Depuis le tableau de bord Netlify, cliquez sur **« Add new site »** → **« Import an existing project »**
2. Choisissez **GitHub** comme fournisseur Git
3. Autorisez Netlify si vous y êtes invité
4. Sélectionnez votre dépôt Jekyll

### Étape 4 : Configurer les paramètres de build

| Paramètre | Valeur |
|---------|-------|
| Branche à déployer | `main` (ou votre branche par défaut) |
| Commande de build | `jekyll build` |
| Répertoire de publication | `_site` |

Cliquez sur **« Deploy site »** pour lancer le premier build.

### Étape 5 : Surveiller le déploiement

1. Surveillez les journaux de build pour détecter d'éventuelles erreurs
2. Une fois terminé, Netlify fournit une URL aléatoire (par ex. `random-name-12345.netlify.app`)
3. Cliquez sur l'URL pour afficher votre site déployé

## Fichiers de configuration

### netlify.toml

Créez `netlify.toml` à la racine de votre dépôt pour une configuration avancée :

```toml
[build]
  command = "jekyll build"
  publish = "_site"

[build.environment]
  JEKYLL_ENV = "production"
  RUBY_VERSION = "3.0.0"

# Redirects
[[redirects]]
  from = "/old-page"
  to = "/new-page"
  status = 301

# Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### Fichier _redirects

Vous pouvez aussi créer un fichier `_redirects` à la racine de votre site :

```text
# Redirect old URLs
/old-page    /new-page    301

# SPA fallback (if using client-side routing)
/*    /index.html   200
```

### Fichier _headers

Créez un fichier `_headers` pour des en-têtes personnalisés :

```text
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block

/assets/*
  Cache-Control: public, max-age=31536000
```

## Domaine personnalisé

### Option 1 : Interface Netlify

1. Rendez-vous dans **Site settings** → **Domain management**
2. Cliquez sur **« Add custom domain »**
3. Saisissez votre nom de domaine
4. Suivez les instructions de configuration DNS

### Option 2 : Configuration DNS

Ajoutez ces enregistrements chez votre registrar de domaine :

**Pour le domaine apex (example.com) :**

```text
Type: A
Name: @
Value: 75.2.60.5
```

**Pour le sous-domaine www :**

```text
Type: CNAME
Name: www
Value: your-site.netlify.app
```

Netlify provisionne automatiquement des certificats SSL via Let's Encrypt.

## Variables d'environnement

Définissez les variables d'environnement dans l'interface Netlify ou dans `netlify.toml` :

1. Rendez-vous dans **Site settings** → **Build & deploy** → **Environment**
2. Ajoutez les variables :
   - `JEKYLL_ENV=production`
   - Toutes les clés API dont votre site a besoin

## Aperçus de déploiement

Netlify crée automatiquement des déploiements d'aperçu pour les pull requests :

1. Ouvrez une pull request sur GitHub
2. Netlify construit et déploie un aperçu
3. L'URL de l'aperçu apparaît dans les commentaires de la PR
4. Testez les modifications avant de fusionner

## Dépannage

### Échecs de build

Consultez le journal de déploiement pour identifier les erreurs :

1. Accédez à l'onglet **Deploys**
2. Cliquez sur le déploiement en échec
3. Examinez les journaux de build

Problèmes courants :

- `Gemfile.lock` manquant — Exécutez `bundle lock`
- Incompatibilité de version Ruby — Spécifiez-la dans `netlify.toml`
- Erreurs de plugin — Assurez-vous que toutes les gems figurent dans `Gemfile`

### Builds lents

Optimisez le temps de build :

- Utilisez `bundle install --jobs 4` pour des installations parallèles
- Mettez en cache les dépendances (Netlify le fait automatiquement)
- Réduisez la portée du build avec des builds incrémentaux

### Problèmes de certificat SSL

Si HTTPS ne fonctionne pas :

1. Vérifiez la propagation DNS avec `dig yourdomain.com`
2. Consultez **Domain management** → **HTTPS**
3. Cliquez sur **Verify DNS configuration**
4. Provisionnez le certificat manuellement si nécessaire

## Comparaison avec GitHub Pages

| Fonctionnalité | Netlify | GitHub Pages |
|---------|---------|--------------|
| Plugins personnalisés | Oui | Non (liste blanche uniquement) |
| En-têtes personnalisés | Oui | Non |
| Redirections | Oui | Limitées |
| Aperçus de déploiement | Oui | Non |
| Formulaires | Oui | Non |
| Fonctions | Oui | Non |
| Temps de build | Plus rapide | Plus lent |
| Offre gratuite | Généreuse | Illimitée |

## Étapes suivantes

- [Configuration d'un domaine personnalisé](/docs/deployment/custom-domain/)
- [En-têtes de sécurité](/docs/development/security/) — Renforcez votre site

## Voir aussi

- [[Deployment]]
- [[Deploy to GitHub Pages]]
- [[Custom Domain Setup]]
