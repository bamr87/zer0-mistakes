---
title: Ruby
description: Conseils sur le versionnage de Ruby et Bundler pour Zer0-Mistakes.
preview: "/images/previews/ruby.png"
layout: default
categories:
- docs
- ruby
tags:
- ruby
- bundler
difficulty: beginner
estimated_reading_time: 5 minutes
prerequisites: []
lastmod: 2025-12-20 22:15:46.090000000 Z
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/ruby/"
translation_of: pages/_docs/ruby/index.md
translation_source_url: "/docs/ruby/"
machine_translated: true
translated_from_sha: 06536d065d91
---

# Ruby & Bundler

Jekyll est conçu avec Ruby. Comprendre les bases facilite le dépannage et la personnalisation.

## Référence rapide

### Vérifier les versions

```bash
# Ruby version
ruby --version

# Bundler version
bundle --version

# Jekyll version
bundle exec jekyll --version
```

### Commandes courantes

```bash
# Install dependencies from Gemfile
bundle install

# Update all gems
bundle update

# Update specific gem
bundle update jekyll

# Run Jekyll through Bundler
bundle exec jekyll serve
```

## Fichiers clés

| Fichier | Rôle |
|------|---------|  
| `Gemfile` | Liste les dépendances des gems Ruby |
| `Gemfile.lock` | Verrouille les versions exactes |
| `jekyll-theme-zer0.gemspec` | Spécification du gem du thème |

## Avec Docker

Lorsque vous utilisez Docker, les commandes Ruby s'exécutent à l'intérieur du conteneur :

```bash
# Check Ruby version in container
docker-compose exec jekyll ruby --version

# Update gems in container
docker-compose exec jekyll bundle update
```

## Dépannage

### Erreurs d'installation des gems

```bash
# Clear bundle cache
bundle clean --force

# Reinstall everything
rm -rf vendor/bundle
bundle install
```

### Conflits de versions

```bash
# Check for outdated gems
bundle outdated

# Update Gemfile.lock
bundle update
```

## En savoir plus

- [Ruby 101](/docs/ruby-101/) - Bases détaillées de Ruby
- [Documentation officielle de Ruby](https://www.ruby-lang.org/en/documentation/)
- [Documentation de Bundler](https://bundler.io/docs.html)

## Connexe

- [Guide d'installation](/docs/installation/)
- [Guide Jekyll](/docs/jekyll/)
- [Développement avec Docker](/docs/docker/)

## Voir aussi

- [[Jekyll]]
- [[Docker]]
- [[Installation]]
