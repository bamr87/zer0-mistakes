---
lastmod: 2026-04-18 19:29:56.000000000 Z
title: Analyse de sécurité
description: Guide de l'analyse de sécurité CodeQL et des bonnes pratiques de sécurité
  pour le thème Zer0-Mistakes.
preview: "/images/previews/security-scanning.png"
layout: default
categories:
- docs
- development
tags:
- security
- codeql
- vulnerability
- scanning
difficulty: intermediate
estimated_reading_time: 10 minutes
prerequisites:
- GitHub repository access
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/development/security/"
translation_of: pages/_docs/development/security.md
translation_source_url: "/docs/development/security/"
machine_translated: true
translated_from_sha: 2fcdc1279970
---

# Analyse de sécurité

Le thème Zer0-Mistakes utilise GitHub CodeQL pour l'analyse automatisée des vulnérabilités de sécurité dans plusieurs langages.

## Vue d'ensemble de CodeQL

[CodeQL](https://codeql.github.com/) est le moteur d'analyse sémantique de code de GitHub qui détecte les vulnérabilités de sécurité dans votre base de code.

### Langages analysés

| Langage | Mode de compilation | Couverture |
|----------|------------|----------|
| Ruby | Aucun (interprété) | Code du gem, plugins |
| JavaScript/TypeScript | Aucun | Ressources frontend |
| Python | Aucun | Scripts, utilitaires |
| GitHub Actions | Aucun | Fichiers de workflow |

## Configuration du workflow

### Déclencheurs

L'analyse CodeQL s'exécute :

- À chaque **push** vers `main`
- À chaque **pull request** vers `main`
- **Hebdomadairement** (dimanche à 1h37 UTC)

### Fichier de workflow

```yaml
name: "CodeQL Advanced"

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  schedule:
    - cron: '37 1 * * 0'

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      packages: read
      actions: read
      contents: read
    
    strategy:
      matrix:
        include:
        - language: javascript-typescript
        - language: ruby
        - language: python
        - language: actions
```

## Consulter les résultats

### Onglet Security de GitHub

1. Accédez à l'onglet **Security** du dépôt
2. Cliquez sur **Code scanning alerts**
3. Examinez les vulnérabilités par gravité

### Niveaux de gravité des alertes

| Niveau | Action requise |
|-------|-----------------|
| **Critique** | Corriger immédiatement |
| **Élevé** | Corriger avant la prochaine version |
| **Moyen** | Corriger lors du prochain sprint |
| **Faible** | Suivre et corriger quand c'est possible |

## Types de vulnérabilités courants

### Ruby

- Injection SQL
- Injection de commande
- Traversée de répertoire
- Désérialisation non sécurisée

### JavaScript

- Cross-site scripting (XSS)
- Pollution de prototype
- Génération aléatoire non sécurisée
- Problèmes de manipulation du DOM

### GitHub Actions

- Injection de script
- Exposition d'identifiants
- Checkout non sécurisé

## Corriger les vulnérabilités

### Exemple : injection SQL

**Code vulnérable :**

```ruby
# BAD: User input directly in query
User.where("name = '#{params[:name]}'")
```

**Code corrigé :**

```ruby
# GOOD: Parameterized query
User.where(name: params[:name])
```

### Exemple : prévention du XSS

**Code vulnérable :**

```javascript
// BAD: Direct HTML insertion
element.innerHTML = userInput;
```

**Code corrigé :**

```javascript
// GOOD: Text content only
element.textContent = userInput;
```

## Bonnes pratiques de sécurité

### Gestion des dépendances

```bash
# Audit Ruby dependencies
bundle audit check --update

# Update dependencies
bundle update
```

### Gestion des secrets

- Ne jamais valider de secrets dans le dépôt
- Utilisez GitHub Secrets pour les valeurs sensibles
- Faites tourner les identifiants régulièrement

### Validation des entrées

- Validez toutes les entrées utilisateur
- Assainissez les données avant leur affichage
- Privilégiez les listes d'autorisation aux listes de blocage

## Requêtes personnalisées

Vous pouvez ajouter des requêtes CodeQL personnalisées pour des vérifications spécifiques au projet :

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v4
  with:
    languages: ${{ matrix.language }}
    queries: security-extended,security-and-quality
```

## Rejet des alertes

Pour rejeter un faux positif :

1. Accédez à l'alerte dans l'onglet Security
2. Cliquez sur **Dismiss alert**
3. Sélectionnez la raison :
   - Ne sera pas corrigé
   - Faux positif
   - Utilisé dans les tests

## Dépannage

### Délai d'analyse dépassé

Pour les grandes bases de code :

1. Utilisez des runners plus puissants
2. Excluez les répertoires non essentiels
3. Répartissez l'analyse par langage

### Échecs de build

Si un build manuel est requis :

```yaml
- name: Run manual build steps
  if: matrix.build-mode == 'manual'
  run: |
    bundle install
    bundle exec jekyll build
```

## Réponse de sécurité

### Signalement des vulnérabilités

Si vous découvrez une vulnérabilité de sécurité :

1. **N'ouvrez pas** de ticket public
2. Signalez les problèmes de sécurité en privé par e-mail
3. Suivez le principe de divulgation responsable

### Avis de sécurité

Pour les problèmes critiques :

1. Créez un [Security Advisory](https://docs.github.com/en/code-security/security-advisories)
2. Demandez un CVE si nécessaire
3. Publiez le correctif et l'avis simultanément

## Ressources associées

- [Guide de test](/docs/development/testing/)
- [Pipeline CI/CD](/docs/development/ci-cd/)
- [Mises à jour des dépendances](/docs/development/dependency-updates/)

## Voir aussi

- [[Development]]
- [[Dependency Updates]]
- [[CI/CD Pipeline]]
