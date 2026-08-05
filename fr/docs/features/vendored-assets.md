---
lastmod: 2026-06-15 00:00:00.000000000 Z
title: Ressources Bootstrap et icônes intégrées (vendored)
description: Le CSS/JS de Bootstrap 5.3.3 et les Bootstrap Icons sont committés sous
  assets/vendor/ pour la sécurité GitHub Pages et le développement hors ligne. Comment
  les utiliser et les actualiser.
preview: "/images/previews/vendored-bootstrap-icon-assets.png"
layout: default
categories:
- docs
- features
tags:
- bootstrap
- assets
- vendor
- github-pages
- performance
difficulty: intermediate
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/vendored-assets/"
translation_of: pages/_docs/features/vendored-assets.md
translation_source_url: "/docs/features/vendored-assets/"
machine_translated: true
translated_from_sha: e2786f28998b
---

# Ressources Bootstrap et icônes intégrées (vendored)

Le CSS/JS de Bootstrap 5.3.3 et les Bootstrap Icons sont **committés** sous `assets/vendor/` plutôt que chargés depuis un CDN. Cela garantit :

- **Sécurité GitHub Pages** — le build Jekyll par défaut de Pages n'exécute pas `npm` ni `curl`
- **Développement hors ligne** — fonctionne sans connexion internet
- **Verrouillage des versions** — pas de mises à jour CDN inattendues cassant le thème

Pour tous les détails sur l'actualisation des fichiers vendor, consultez le [guide des ressources Vendor](/docs/development/vendor-assets/).

## Organisation des répertoires

```text
assets/vendor/
├── bootstrap/
│   ├── css/
│   │   └── bootstrap.min.css
│   └── js/
│       └── bootstrap.bundle.min.js
└── bootstrap-icons/
    └── font/
        ├── bootstrap-icons.css
        └── fonts/
```

D'autres bibliothèques vendor (MathJax, Font Awesome, jQuery, GitHub Calendar) sont également stockées ici et listées dans `vendor-manifest.json`. Mermaid est la seule exception : il se trouve sous `assets/vendor/mermaid/` mais n'est **pas** dans le manifeste — il est copié depuis le paquet npm `mermaid` via `npm run vendor:mermaid` au lieu d'être téléchargé depuis un CDN.

## Comment les ressources sont chargées

### CSS (via `_includes/core/head.html`)

```liquid
{% raw %}<link href="{{ '/assets/vendor/bootstrap/css/bootstrap.min.css' | relative_url }}" rel="stylesheet">
<link rel="stylesheet" href="{{ '/assets/vendor/bootstrap-icons/font/bootstrap-icons.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">{% endraw %}
```

### JavaScript (via `_includes/components/js-cdn.html`)

```liquid
{% raw %}<script src="{{ '/assets/vendor/bootstrap/js/bootstrap.bundle.min.js' | relative_url }}"></script>{% endraw %}
```

## Actualisation des fichiers vendor

```bash
# Full vendor refresh (requires curl, jq, and shasum/sha256sum)
./scripts/vendor-install.sh

# Same thing via the npm script
npm run vendor:install

# Preview what would change without downloading
./scripts/vendor-install.sh --dry-run

# Refresh Mermaid (copied from the npm package, not the manifest)
npm install && npm run vendor:mermaid
```

`vendor-manifest.json` à la racine du dépôt liste chaque ressource téléchargée via curl avec sa somme de contrôle SHA-256 attendue. Le script est idempotent : il ignore tout fichier déjà présent avec une somme de contrôle correspondante, et le retélécharge en cas de non-correspondance (`--force` retélécharge tout).

### Comment vérifier

```bash
# Confirm the committed vendor tree is present
ls assets/vendor/bootstrap/css/bootstrap.min.css \
   assets/vendor/bootstrap/js/bootstrap.bundle.min.js \
   assets/vendor/bootstrap-icons/font/bootstrap-icons.css

# Dry-run reports "already up to date" when checksums match
./scripts/vendor-install.sh --dry-run
```

Un checkout propre livre déjà ces fichiers, donc un dry run ne devrait rien signaler à télécharger.

## Surcharge CSS personnalisée

Placez les surcharges CSS spécifiques au site dans `assets/css/user-overrides.css` (vous créez ce fichier ; il n'est pas livré avec le thème). Il est lié depuis `_includes/core/head.html` uniquement lorsque vous l'activez en définissant `user_overrides: true` dans `_config.yml` — le lien est encapsulé dans `⟦13⟧⟦14⟧⟦15⟧`. Ne chargez **pas** une seconde feuille de style Bootstrap complète.

## Voir aussi

- [Ressources Vendor (guide du mainteneur)](/docs/development/vendor-assets/)
- [Intégration de Bootstrap](/docs/bootstrap/)
- [Mises à jour des dépendances](/docs/development/dependency-updates/)

## Voir aussi

- [[Bootstrap Integration]]
- [[Development]]
