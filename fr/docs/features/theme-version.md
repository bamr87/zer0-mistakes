---
lastmod: 2026-06-16 00:00:00.000000000 Z
title: Plugin d'affichage de la version du thème
description: Extraction automatique de la version du thème à partir de la spécification
  de la gem installée, affichée via le panneau Paramètres ouvert depuis l'engrenage
  de l'en-tête ou le bouton Info du pied de page.
preview: "/images/previews/theme-version-display-plugin.png"
layout: default
categories:
- docs
- features
tags:
- version
- plugin
- footer
- gem
difficulty: beginner
estimated_reading_time: 5 minutes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/theme-version/"
translation_of: pages/_docs/features/theme-version.md
translation_source_url: "/docs/features/theme-version/"
machine_translated: true
translated_from_sha: 6cc8fea48964
---

# Plugin d'affichage de la version du thème

Le thème Zer0-Mistakes inclut un plugin Jekyll (`_plugins/theme_version.rb`) qui extrait automatiquement la version du thème à partir de la spécification de gem installée pendant la construction, puis l'expose à Liquid afin que l'interface puisse l'afficher.

## Vue d'ensemble

Le plugin fournit :

- **Extraction automatique** : lit la version depuis le `Gem::Specification` de la gem installée (aucun codage en dur)
- **Variable globale** : `site.theme_specs` — un tableau de specs de thème — disponible dans Liquid
- **Panneau de réglages** : informations sur le thème et la construction affichées dans le volet Réglages (`info-section.html`)
- **Accès en-tête et pied de page** : ouvrez le panneau depuis l'icône d'engrenage de l'en-tête ou le bouton Info du pied de page

> [!NOTE]
> La source unique de vérité pour le numéro de version est
> `lib/jekyll-theme-zer0.gemspec` → `s.version`, qui lit
> `JekyllThemeZer0::VERSION` depuis `lib/jekyll-theme-zer0/version.rb`. Incrémentez-le uniquement
> via `./scripts/bin/release`, jamais à la main.

## Fonctionnement

### Emplacement du plugin

```text
_plugins/
└── theme_version.rb
```

### Extraction de la version

Le plugin est un `Generator` Jekyll (`ThemeVersionGenerator`, `priority :high`) qui s'exécute pendant la construction. Pour un thème de gem local, il charge le `Gem::Specification` de la gem ; pour un `remote_theme`, il enregistre `"latest"` (GitHub Pages sert le dernier commit, il n'y a donc pas de version épinglée) :

```ruby
# _plugins/theme_version.rb (abridged)
module Jekyll
  class ThemeVersionGenerator < Generator
    safe true
    priority :high

    def generate(site)
      theme_specs = []

      if site.config['remote_theme']
        remote_theme = site.config['remote_theme']
        theme_specs << {
          'name'       => remote_theme.split('/').last,
          'type'       => 'remote',
          'repository' => remote_theme,
          'version'    => 'latest'
        }
      elsif site.config['theme']
        spec = Gem::Specification.find_by_name(site.config['theme'])
        theme_specs << {
          'name'    => spec.name,
          'version' => spec.version.to_s,
          'type'    => 'gem',
          'homepage' => spec.homepage,
          'summary'  => spec.summary,
          'authors'  => spec.authors
        }
      end

      # Make theme specs available to templates
      site.config['theme_specs'] = theme_specs
    end
  end
end
```

## Utilisation

### Dans les modèles

Le plugin expose `site.theme_specs` (un tableau), et non une seule chaîne `site.theme_version`. Récupérez la version d'un thème nommé de la manière suivante :

```liquid
{% raw %}<!-- Display the version for this theme -->
<span>v{{ site.theme_specs | where: "name", "jekyll-theme-zer0" | map: "version" | first }}</span>

<!-- Conditional display -->
{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
{% if zer0 %}
  Version: {{ zer0.version }} ({{ zer0.type }})
{% endif %}{% endraw %}
```

Lorsque le site s'exécute en mode développement (`theme: "jekyll-theme-zer0"`), `version` correspond à la version de la gem installée. Pour un site `remote_theme`, il s'agit de `"latest"`.

### Où cela apparaît dans l'interface

La version et les détails de construction sont exposés via le volet **Réglages** (`_includes/components/info-section.html`), qui intègre `_includes/components/theme-info.html`. Ouvrez-le depuis :

- L'**icône d'engrenage** dans l'en-tête (`_includes/core/header.html`,
  `data-bs-target="#info-section"`).
- Le bouton **Info** dans le pied de page (`_includes/core/footer.html`).

Dans le panneau, la section *Thème et construction* de l'onglet **Site** affiche le thème, la version de Jekyll, l'heure de la dernière construction et le dépôt. L'include `theme-info.html` affiche le nom du thème depuis `site.remote_theme` / `site.theme` et les métadonnées de construction depuis `jekyll.version`, `jekyll.environment` et `site.time`.

## Configuration

### Source de la version

Le plugin résout la version à partir de la configuration du thème actif — aucune clé de configuration dédiée n'est requise :

1. `remote_theme: "bamr87/zer0-mistakes"` → le `version` de la spec est `"latest"`.
2. `theme: "jekyll-theme-zer0"` (développement) → la version provient du
`Gem::Specification` de la gem installée, qui à son tour lit `JekyllThemeZer0::VERSION` dans `lib/jekyll-theme-zer0/version.rb`.

### Afficher votre propre version

Il n'existe aucune clé de configuration `theme_version` ou `show_theme_version` — affichez la valeur vous-même depuis `site.theme_specs` :

```liquid
{% raw %}{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
{% if zer0 %}v{{ zer0.version }}{% endif %}{% endraw %}
```

## Personnalisation

### Badge de version

```html
{% raw %}{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
<span class="badge bg-primary">v{{ zer0.version }}</span>{% endraw %}
```

### Avec un lien vers le changelog

`CHANGELOG.md` n'est pas servi en tant que page Jekyll ; créez donc un lien vers la copie GitHub plutôt que vers une URL `/CHANGELOG/` locale :

```html
{% raw %}{% assign zer0 = site.theme_specs | where: "name", "jekyll-theme-zer0" | first %}
<a href="https://github.com/bamr87/zer0-mistakes/blob/main/CHANGELOG.md" class="version-link">
  v{{ zer0.version }}
</a>{% endraw %}
```

## Développement vs production

### Mode développement

`_config_dev.yml` définit `remote_theme: false` et `theme: "jekyll-theme-zer0"`, de sorte que le plugin extrait la version depuis la gem installée localement.

### Mode production

`_config.yml` définit `remote_theme: "bamr87/zer0-mistakes"`, de sorte que la spec renvoie `version: "latest"` (GitHub Pages sert le dernier commit).

## Dépannage

### La version ne s'affiche pas

1. Vérifiez que le fichier du plugin existe dans `_plugins/`
2. Vérifiez que le fichier gemspec existe
3. Recherchez les erreurs Ruby dans le journal de construction

### Mauvaise version

1. Videz le cache Jekyll : `rm -rf .jekyll-cache`
2. Reconstruisez : `bundle exec jekyll build`
3. Vérifiez que la version du gemspec est correcte

### Le plugin ne se charge pas

1. Vérifiez que le mode sécurisé n'est pas activé
2. Vérifiez la syntaxe Ruby dans le plugin
3. Vérifiez les permissions des fichiers

## Voir aussi

- [Gestion des versions](/docs/development/release-management/)
- [Incrémentation de version](/docs/development/version-bump/)
- [Publication de la gem](/docs/development/release-management/#rubygems-publishing)

## Référence technique

Pour les détails d'implémentation (architecture du plugin Jekyll, extraction de version, intégration de la fenêtre modale) :

- [Fonctionnalité de version du thème → docs/features/theme-version.md](https://github.com/bamr87/zer0-mistakes/blob/main/docs/features/theme-version.md)

## Voir aussi

- [[Features]]
- [[Development]]
