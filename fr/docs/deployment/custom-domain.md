---
lastmod: 2026-04-18 19:30:01.000000000 Z
title: Configuration d'un domaine personnalisé
description: Configurez un domaine personnalisé pour votre site Jekyll hébergé sur
  GitHub Pages ou Netlify.
preview: "/images/previews/custom-domain-setup.png"
layout: default
categories:
- docs
- deployment
tags:
- custom-domain
- dns
- jekyll
- deployment
difficulty: intermediate
estimated_reading_time: 20 minutes
prerequisites:
- Domain registrar account
- GitHub Pages or Netlify hosting
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/deployment/custom-domain/"
translation_of: pages/_docs/deployment/custom-domain.md
translation_source_url: "/docs/deployment/custom-domain/"
machine_translated: true
translated_from_sha: d2bcbbbf0f5a
---

# Configuration d'un domaine personnalisé

> Configurez un domaine personnalisé pour votre site Jekyll.

## Vue d'ensemble

L'utilisation d'un domaine personnalisé donne à votre site une apparence professionnelle et permet aux visiteurs de retenir plus facilement votre URL.

## Prérequis

- Un nom de domaine auprès d'un registrar (GoDaddy, Namecheap, Google Domains, etc.)
- Votre site déployé sur GitHub Pages ou Netlify

---

## Configuration GitHub Pages

### Étape 1 : Configurer les paramètres du dépôt

1. Accédez à votre dépôt sur GitHub
2. Rendez-vous dans **Settings** → **Pages**
3. Sous **Custom domain**, saisissez votre domaine (par ex. `example.com`)
4. Cochez **Enforce HTTPS**
5. Cliquez sur **Save**

Cela crée un fichier `CNAME` dans votre dépôt.

### Étape 2 : Configurer le DNS

Ajoutez ces enregistrements DNS chez votre registrar de domaine :

#### Pour le domaine apex (example.com)

Ajoutez des enregistrements A pointant vers les adresses IP de GitHub :

| Type | Nom | Valeur |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

#### Pour le sous-domaine www

Ajoutez un enregistrement CNAME :

| Type | Nom | Valeur |
|------|------|-------|
| CNAME | www | username.github.io |

Remplacez `username` par votre nom d'utilisateur GitHub.

### Étape 3 : Vérifier la configuration

1. Attendez la propagation DNS (jusqu'à 48 heures, généralement plus rapide)
2. Visitez votre domaine personnalisé
3. Vérifiez que le HTTPS fonctionne (icône de cadenas dans le navigateur)

### Étape 4 : Mettre à jour la configuration Jekyll

Mettez à jour `_config.yml` :

```yaml
url: "https://example.com"
baseurl: ""  # Empty for apex domain
```

---

## Configuration Netlify

### Étape 1 : Ajouter un domaine personnalisé dans Netlify

1. Rendez-vous dans **Site settings** → **Domain management**
2. Cliquez sur **"Add custom domain"**
3. Saisissez votre domaine (par ex. `example.com`)
4. Cliquez sur **Verify** puis **Add domain**

### Étape 2 : Configurer le DNS

Netlify propose deux options :

#### Option A : Netlify DNS (recommandé)

1. Dans Domain management, cliquez sur **"Set up Netlify DNS"**
2. Mettez à jour les serveurs de noms chez votre registrar avec :
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`
3. Netlify configure automatiquement tous les enregistrements

#### Option B : DNS externe

Ajoutez ces enregistrements chez votre registrar :

| Type | Nom | Valeur |
|------|------|-------|
| A | @ | 75.2.60.5 |
| CNAME | www | your-site.netlify.app |

### Étape 3 : Activer le HTTPS

1. Dans Domain management, faites défiler jusqu'à **HTTPS**
2. Cliquez sur **"Verify DNS configuration"**
3. Cliquez sur **"Provision certificate"**

Netlify utilise Let's Encrypt pour les certificats SSL gratuits.

---

## Configurations DNS courantes

### Domaine apex uniquement (example.com)

```text
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

### www uniquement (www.example.com)

```text
CNAME   www   username.github.io
```

### Apex et www

```text
A       @     185.199.108.153
A       @     185.199.109.153
A       @     185.199.110.153
A       @     185.199.111.153
CNAME   www   username.github.io
```

### Rediriger www vers l'apex (ou inversement)

Configurez une redirection dans votre plateforme d'hébergement :

**Netlify (`netlify.toml`) :**

```toml
[[redirects]]
  from = "https://www.example.com/*"
  to = "https://example.com/:splat"
  status = 301
  force = true
```

---

## Guides des bureaux d'enregistrement de domaines

### GoDaddy

1. Connectez-vous à GoDaddy
2. Accédez à **My Products** → **DNS**
3. Cliquez sur **Manage** à côté de votre domaine
4. Ajoutez/modifiez les enregistrements DNS comme indiqué ci-dessus

### Namecheap

1. Connectez-vous à Namecheap
2. Accédez à **Domain List** → **Manage**
3. Cliquez sur **Advanced DNS**
4. Ajoutez les enregistrements sous **Host Records**

### Google Domains

1. Connectez-vous à Google Domains
2. Sélectionnez votre domaine
3. Cliquez sur **DNS** dans le menu de gauche
4. Ajoutez des enregistrements personnalisés

### Cloudflare

1. Connectez-vous à Cloudflare
2. Sélectionnez votre domaine
3. Accédez à l'onglet **DNS**
4. Ajoutez les enregistrements (définissez **Proxy status** sur DNS only pour la configuration initiale)

---

## Dépannage

### Le DNS ne se propage pas

1. Patientez jusqu'à 48 heures (généralement bien plus rapide)
2. Vérifiez l'état de propagation : [dnschecker.org](https://dnschecker.org)
3. Videz le cache DNS :
   - macOS : `sudo dscacheutil -flushcache`
   - Windows : `ipconfig /flushdns`

### HTTPS ne fonctionne pas

1. Vérifiez que les enregistrements DNS sont corrects
2. Attendez le provisionnement du certificat SSL
3. Recherchez les avertissements de contenu mixte dans la console du navigateur
4. Assurez-vous que toutes les ressources utilisent des URL HTTPS

### Le site affiche un contenu incorrect

1. Videz le cache du navigateur
2. Vérifiez `url` et `baseurl` dans `_config.yml`
3. Vérifiez que le fichier CNAME existe (GitHub Pages)
4. Reconstruisez et redéployez

### Erreurs de certificat

1. Assurez-vous que le domaine pointe vers le bon hébergement
2. Attendez le provisionnement du certificat (peut prendre des heures)
3. Recherchez les enregistrements CAA susceptibles de bloquer l'émission du certificat

---

## Bonnes pratiques

1. **Utilisez toujours HTTPS** — Protège les visiteurs et améliore le SEO
2. **Choisissez une URL canonique** — Redirigez www vers non-www (ou inversement)
3. **Mettez à jour toutes les références** — Assurez-vous que `_config.yml` et toutes les URL codées en dur correspondent
4. **Testez minutieusement** — Vérifiez toutes les pages après le changement de domaine
5. **Mettez en place une surveillance** — Utilisez un service de surveillance de disponibilité pour les sites en production

---

## Étapes suivantes

- [Guide GitHub Pages](/docs/deployment/github-pages/)
- [Guide Netlify](/docs/deployment/netlify/)

## Voir aussi

- [[Deployment]]
- [[Deploy to GitHub Pages]]
- [[Deploy to Netlify]]
