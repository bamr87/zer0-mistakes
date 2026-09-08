---
lastmod: 2026-09-03 00:00:00.000000000 Z
title: Liste de contrôle du consommateur de thème distant
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

# Liste de contrôle pour les consommateurs de Remote-Theme

**Ce que vous allez faire :** configurer les fichiers et paramètres que GitHub Pages n'hérite *pas* lorsque vous consommez Zer0-Mistakes via `remote_theme`, afin que la recherche, la navigation, les commentaires et les liens internes fonctionnent tous.

## Pourquoi c'est nécessaire

`remote_theme` ne fournit que `_layouts/`, `_includes/`, `_sass/` et `assets/`. Il ne fournit **pas** `_config.yml`, `_data/`, `_plugins/`, ni aucun fichier racine / `pages/`. De plus, GitHub Pages exécute Jekyll en mode `safe: true`, ce qui **ignore `_plugins/*.rb`** — de sorte que chaque générateur personnalisé de ce thème (recherche, sitemap, pages d'auteur, statistiques de contenu, images d'aperçu) ne s'exécute jamais lors d'une build Pages d'un site consommateur.

Le résultat est une chaîne de dégradations *silencieuses*. La liste de contrôle ci-dessous est le chemin le plus court pour les traiter toutes.

> **Vous compilez en dehors de GitHub Pages ?** Si vous exécutez votre propre CI au lieu de Pages, consultez
> la recette [Safe-Mode Build Overlay](/docs/deployment/build-overlay/) — elle
> reproduit le comportement de suppression des plugins de Pages afin que votre build personnalisée corresponde
> à la production.

## Prérequis

- Un dépôt GitHub avec Pages activé
- `remote_theme: "bamr87/zer0-mistakes"` dans votre `_config.yml`

## La liste de contrôle

### 1. Ajoutez `jekyll-include-cache` à votre `plugins:`

`_layouts/root.html` utilise `{% raw %}{% include_cached %}{% endraw %}`. Sans le plugin, la première build échoue sur `Unknown tag 'include_cached'`.

```yaml
# _config.yml
plugins:
  - jekyll-include-cache
```

### 2. Redéclarez la structure dans votre `_config.yml`

Aucun de ces éléments n'est hérité du thème — déclarez les vôtres : `collections`, `defaults`, `permalink`, `theme_skin`, `theme_color`, `theme_background`.

Le bloc `favicon:`, en revanche, est entièrement facultatif : `favicon.theme_color_light` / `favicon.theme_color_dark` reviennent aux couleurs de surface du thème (`#ffffff` / `#212529`), et les balises `theme-color` sont émises même lorsque vous ne déclarez rien.

### 3. ⚠️ Ne copiez pas le `_config.yml` du thème en bloc

La config du thème embarque un ID `google_analytics:` actif et un `api_key:` PostHog. Les copier envoie les analytics de *vos* visiteurs à l'auteur du thème. Supprimez ou remplacez les blocs analytics et d'identité, et laissez `posthog` / `ai_chat` **désactivés** sauf si vous êtes propriétaire du projet et déployez le proxy.

### 4. Committez vos propres `_data/`

Au minimum :

- `_data/navigation/main.yml` — sans lui, la barre de navigation est vide.
- `_data/ui-text.yml` — lu en tant que `site.data.ui` par le pied de page, le fil d'Ariane et
  la modale de recherche ; sans lui, les libellés sont vides.
- `_data/authors.yml` — sans lui, les signatures et les cartes d'auteur n'ont pas de données.

### 5. Rédigez à la main `/search.json` et `/sitemap/`

Les deux endpoints sont produits par `_plugins/search_and_sitemap_generator.rb`, que Pages ignore en mode safe — et les stubs de repli committés ne sont pas fournis par `remote_theme`. Ainsi la recherche de la barre de navigation ne renvoie rien et `/sitemap/` renvoie une erreur 404.

La mise en page `search` et `_includes/search-data.json` *sont* fournies, alors ajoutez un seul fichier à la racine de votre dépôt :

```yaml
# /search.json
---
layout: search
permalink: /search.json
sitemap: false
---
```

Ajoutez aussi une page `/sitemap/` (ou fiez-vous à `/sitemap.xml` du plugin `jekyll-sitemap` — le pied de page y revient automatiquement quand aucune page `/sitemap/` n'existe).

### 6. Les pages de profil d'auteur renvoient une erreur 404 sauf si vous les committez

`_plugins/author_pages_generator.rb` n'est disponible que via plugin sur Pages. L'habillage du thème **ne renvoie plus** vers des profils d'auteur qui n'existent pas dans votre build, donc les signatures vides se dégradent proprement — mais si vous *voulez* des pages `/authors/:key/`, committez-les vous-même.

### 7. Les pages de statistiques s'affichent vides

`_plugins/content_statistics_generator.rb` n'est disponible que via plugin et le fichier de données n'est pas fourni. Ne comptez pas sur le tableau de bord des statistiques dans une build Pages purement remote-theme.

### 8. N'ajoutez pas `jekyll-mermaid`

Il ne figure pas dans la liste blanche des plugins GitHub Pages. Le thème rend déjà Mermaid côté client à partir d'un bundle intégré — ajouter le plugin ne fait que casser la build.

### 9. Désactivez `ai_chat` et `posthog`

Les deux sont livrés activés dans la config du thème. Laissez-les désactivés sauf si vous déployez le proxy de chat / êtes propriétaire du projet analytics. Voir le point 3.

### 10. Utilisez la clé `giscus:` correctement orthographiée

Les commentaires lisent `site.giscus` (et `site.giscus.enabled`). Définissez votre bloc sous `giscus:` — une faute d'orthographe désactive silencieusement les commentaires sans erreur.

```yaml
# _config.yml
giscus:
  enabled: true
  data-repo-id: "..."
  data-category-id: "..."
```

## Configuration des liens de l'habillage du thème

L'habillage du thème renvoie vers quelques pages de section dont il présume l'existence. Lorsque votre site les place ailleurs (ou ne les possède pas), pointez le thème vers la bonne base ou désactivez la fonctionnalité — pour qu'aucun lien ne renvoie une erreur 404 :

| Paramètre | Par défaut | Contrôle |
|---|---|---|
| `category_base` | `/news` | Base des liens de badges de catégorie d'article |
| `tags_page` | `/tags/` | Les badges de tag renvoient ici seulement si la page existe |
| `obsidian_graph_url` | `/docs/obsidian/graph/` | Lien « Graphe complet » ; masqué si la page est absente |
| `local_graph: false` (dans `defaults`) | — | Désactive entièrement le FAB/panneau de graphe local |

Les badges de tags, le lien « Graphe complet » du graphe local, le fil d'Ariane vers la racine de collection et les liens de signature d'auteur sont tous **conditionnés à l'existence** : lorsque la page cible n'est pas dans votre build, ils s'affichent en texte brut plutôt qu'en liens cassés.

## Vérifier

- Ouvrez la recherche de la barre de navigation et saisissez du texte — les résultats apparaissent (élément 5).
- La barre de navigation et le pied de page affichent vos libellés et liens (éléments 2, 4).
- Affichez le code source d'un article — aucun identifiant `google_analytics` ni clé PostHog que vous n'avez pas défini
  (élément 3).
- Exécutez un vérificateur de liens sur le `_site` généré — aucune erreur 404 injectée par le thème.

## Voir aussi

- [Déployer sur GitHub Pages](/docs/deployment/github-pages/)
- [Domaine personnalisé](/docs/deployment/custom-domain/)
