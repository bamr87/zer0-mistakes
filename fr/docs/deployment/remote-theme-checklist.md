---
lastmod: 2026-09-03 00:00:00.000000000 Z
title: Liste de contrôle pour les consommateurs de remote-theme
description: Ce que remote_theme ne fournit pas sur GitHub Pages, ainsi que les fichiers
  et la configuration que chaque consommateur de Zer0-Mistakes doit ajouter pour éviter
  les défaillances silencieuses.
preview: "/images/previews/remote-theme-consumer-checklist.png"
layout: default
categories:
- docs
- deployment
tags:
- github-pages
- remote-theme
- deployment
- troubleshooting
keywords:
- remote theme checklist
- github pages consumer
- jekyll safe mode
- remote_theme setup
- deployment troubleshooting
- jekyll-theme-zer0
difficulty: intermediate
estimated_reading_time: 10 minutes
prerequisites:
- GitHub account
- A GitHub Pages site using remote_theme
author: bamr87
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/deployment/remote-theme-checklist/"
translation_of: pages/_docs/deployment/remote-theme-checklist.md
translation_source_url: "/docs/deployment/remote-theme-checklist/"
machine_translated: true
translated_from_sha: 5d09a61aea20
---

# Liste de vérification pour les consommateurs de Remote-Theme

**Ce que vous allez faire :** mettre en place les fichiers et la configuration que GitHub Pages n'hérite *pas* lorsque vous consommez Zer0-Mistakes via `remote_theme`, afin que la recherche, la navigation, les commentaires et les liens internes fonctionnent tous.

## Pourquoi c'est nécessaire

`remote_theme` ne fournit que `_layouts/`, `_includes/`, `_sass/` et `assets/`. Il ne fournit **pas** `_config.yml`, `_data/`, `_plugins/`, ni aucun fichier racine / `pages/`. De plus, GitHub Pages exécute Jekyll en mode `safe: true`, ce qui **ignore `_plugins/*.rb`** — donc chaque générateur personnalisé de ce thème (recherche, sitemap, pages d'auteurs, statistiques de contenu, images d'aperçu) ne s'exécute jamais lors d'un build Pages d'un site consommateur.

Le résultat est une chaîne de dégradations *silencieuses*. La liste de vérification ci-dessous est le chemin le plus court pour toutes les traiter.

> **Vous construisez en dehors de GitHub Pages ?** Si vous exécutez votre propre CI au lieu de Pages, consultez
> la recette [Safe-Mode Build Overlay](/docs/deployment/build-overlay/) — elle
> reproduit le comportement de suppression de plugins de Pages afin que votre build personnalisé corresponde
> à la production.

## Prérequis

- Un dépôt GitHub avec Pages activé
- `remote_theme: "bamr87/zer0-mistakes"` dans votre `_config.yml`

## La liste de vérification

### 1. Ajoutez `jekyll-include-cache` à votre `plugins:`

`_layouts/root.html` utilise `{% raw %}{% include_cached %}{% endraw %}`. Sans le plugin, le premier build échoue sur `Unknown tag 'include_cached'`.

```yaml
# _config.yml
plugins:
  - jekyll-include-cache
```

### 2. Redéclarez la structure dans votre `_config.yml`

Aucun de ces éléments n'est hérité du thème — déclarez les vôtres : `collections`, `defaults`, `permalink`, `theme_skin`, `theme_color`, `theme_background`.

Le bloc `favicon:`, en revanche, est entièrement facultatif : `favicon.theme_color_light` / `favicon.theme_color_dark` reviennent aux couleurs de surface du thème (`#ffffff` / `#212529`), et les balises `theme-color` sont émises même lorsque vous ne déclarez rien.

### 3. ⚠️ Ne copiez pas intégralement le `_config.yml` du thème

La configuration du thème contient un identifiant `google_analytics:` actif et une `api_key:` PostHog. Les copier envoie les analytiques de *vos* visiteurs à l'auteur du thème. Supprimez ou remplacez les blocs d'analytiques et d'identité, et laissez `posthog` / `ai_chat` **désactivés** sauf si vous êtes propriétaire du projet et déployez le proxy.

### 4. Validez vos propres `_data/`

Au minimum :

- `_data/navigation/main.yml` — sans lui, la barre de navigation est vide.
- `_data/ui-text.yml` — lu comme `site.data.ui` par le pied de page, le fil d'Ariane et
  la fenêtre modale de recherche ; sans lui, les libellés sont vides.
- `_data/authors.yml` — sans lui, les signatures et les cartes d'auteur n'ont aucune donnée.

### 5. Rédigez manuellement `/search.json` et `/sitemap/`

Ces deux points de terminaison sont produits par `_plugins/search_and_sitemap_generator.rb`, que Pages ignore en mode sans échec — et les stubs de repli validés ne sont pas fournis par `remote_theme`. Donc la recherche dans la barre de navigation ne renvoie rien et `/sitemap/` renvoie une erreur 404.

La mise en page `search` et `_includes/search-data.json` *sont* fournies, alors ajoutez un seul fichier à la racine de votre dépôt :

```yaml
# /search.json
---
layout: search
permalink: /search.json
sitemap: false
---
```

Ajoutez aussi une page `/sitemap/` (ou fiez-vous à `/sitemap.xml` du plugin `jekyll-sitemap` — le pied de page y revient automatiquement lorsqu'aucune page `/sitemap/` n'existe).

### 6. Les pages de profil d'auteur renvoient une 404 sauf si vous les validez

`_plugins/author_pages_generator.rb` est réservé aux plugins sur Pages. Le chrome du thème **ne lie plus** aux profils d'auteur qui n'existent pas dans votre build, de sorte que les signatures vides se dégradent proprement — mais si vous *voulez* des pages `/authors/:key/`, validez-les vous-même.

### 7. Les pages de statistiques s'affichent vides

`_plugins/content_statistics_generator.rb` est réservé aux plugins et le fichier de données n'est pas fourni. Ne comptez pas sur le tableau de bord des statistiques sur un build Pages en remote-theme pur.

### 8. N'ajoutez pas `jekyll-mermaid`

Il ne figure pas sur la liste blanche des plugins de GitHub Pages. Le thème rend déjà Mermaid côté client à partir d'un bundle intégré — ajouter le plugin ne fait que casser le build.

### 9. Désactivez `ai_chat` et `posthog`

Les deux sont activés dans la configuration du thème. Laissez-les désactivés sauf si vous déployez le proxy de chat / êtes propriétaire du projet d'analytiques. Voir le point 3.

### 10. Utilisez la clé `giscus:` correctement orthographiée

Les commentaires lisent `site.giscus` (et `site.giscus.enabled`). Définissez votre bloc sous `giscus:` — une faute d'orthographe désactive silencieusement les commentaires sans erreur.

```yaml
# _config.yml
giscus:
  enabled: true
  data-repo-id: "..."
  data-category-id: "..."
```

## Configuration des liens du chrome du thème

Le chrome du thème renvoie vers quelques pages de section dont il suppose l'existence. Lorsque votre site les place ailleurs (ou ne les possède pas), pointez le thème vers la bonne base ou désactivez la fonctionnalité — afin que rien ne renvoie une 404 :

| Réglage | Défaut | Contrôle |
|---|---|---|
| `category_base` | `/news` | Base des liens des badges de catégorie de billet |
| `tags_page` | `/tags/` | Les badges de tag y renvoient uniquement si la page existe |
| `obsidian_graph_url` | `/docs/obsidian/graph/` | Lien « Graphe complet » ; masqué si la page est absente |
| `local_graph: false` (dans `defaults`) | — | Désactive entièrement le FAB/panneau de graphe local |

Les badges d'étiquettes, le lien « Graphe complet » du graphe local, le fil d'Ariane vers la racine de collection et les liens de signature d'auteur sont tous **conditionnés par leur existence** : lorsque la page cible n'est pas dans votre build, ils s'affichent en texte brut plutôt qu'en liens cassés.

## Vérifier

- Ouvrez la recherche de la barre de navigation et saisissez du texte — les résultats apparaissent (élément 5).
- La barre de navigation et le pied de page affichent vos libellés et liens (éléments 2, 4).
- Affichez la source d'un article — aucun ID `google_analytics` ni clé PostHog que vous n'avez pas définis
  (élément 3).
- Exécutez un vérificateur de liens sur le `_site` généré — aucune erreur 404 injectée par le thème.

## Voir aussi

- [Déployer sur GitHub Pages](/docs/deployment/github-pages/)
- [Domaine personnalisé](/docs/deployment/custom-domain/)
