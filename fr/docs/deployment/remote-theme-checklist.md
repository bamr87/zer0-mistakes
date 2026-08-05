---
lastmod: 2026-07-13 00:00:00.000000000 Z
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
translated_from_sha: 9b96d540317e
---

# Liste de vérification pour le consommateur de Remote-Theme

**Ce que vous allez faire :** configurer les fichiers et la configuration que GitHub Pages n'hérite *pas* lorsque vous consommez Zer0-Mistakes via `remote_theme`, afin que la recherche, la navigation, les commentaires et les liens internes fonctionnent tous.

## Pourquoi c'est nécessaire

`remote_theme` ne fournit que `_layouts/`, `_includes/`, `_sass/` et `assets/`. Il ne fournit **pas** `_config.yml`, `_data/`, `_plugins/`, ni aucun fichier racine / `pages/`. GitHub Pages exécute en outre Jekyll en mode `safe: true`, qui **ignore `_plugins/*.rb`** — de sorte que chaque générateur personnalisé de ce thème (recherche, sitemap, pages d'auteur, statistiques de contenu, images de prévisualisation) ne s'exécute jamais lors d'un build Pages d'un site consommateur.

Le résultat est une chaîne de dégradations *silencieuses*. La liste de vérification ci-dessous est le chemin le plus court à travers toutes ces dégradations.

> **Vous construisez en dehors de GitHub Pages ?** Si vous exécutez votre propre CI au lieu de Pages, consultez
> la recette [Safe-Mode Build Overlay](/docs/deployment/build-overlay/) — elle
> reproduit le comportement de suppression de plugins de Pages afin que votre build personnalisé corresponde
> à la production.

## Prérequis

- Un dépôt GitHub avec Pages activé
- `remote_theme: "bamr87/zer0-mistakes"` dans votre `_config.yml`

## La liste de vérification

### 1. Ajoutez `jekyll-include-cache` à votre `plugins:`

`_layouts/root.html` utilise `⟦18⟧⟦19⟧⟦20⟧`. Sans le plugin, le premier build échoue sur `Unknown tag 'include_cached'`.

```yaml
# _config.yml
plugins:
  - jekyll-include-cache
```

### 2. Redéclarez la structure dans votre `_config.yml`

Aucun de ces éléments n'est hérité du thème — déclarez les vôtres : `collections`, `defaults`, `permalink`, `theme_skin`, `theme_color`, `theme_background`.

### 3. ⚠️ Ne copiez pas le `_config.yml` du thème dans son intégralité

La configuration du thème inclut un ID `google_analytics:` actif et une `api_key:` PostHog. Les copier envoie les analytics de *vos* visiteurs à l'auteur du thème. Supprimez ou remplacez les blocs d'analytics et d'identité, et laissez `posthog` / `ai_chat` **désactivés** sauf si vous possédez le projet et déployez le proxy.

### 4. Créez vos propres `_data/`

Au minimum :

- `_data/navigation/main.yml` — sans lui, la barre de navigation est vide.
- `_data/ui-text.yml` — lu comme `site.data.ui` par le pied de page, le fil d'Ariane et
  la fenêtre de recherche ; sans lui, les libellés sont vides.
- `_data/authors.yml` — sans lui, les signatures et fiches d'auteur n'ont aucune donnée.

### 5. Créez manuellement `/search.json` et `/sitemap/`

Les deux endpoints sont produits par `_plugins/search_and_sitemap_generator.rb`, que Pages ignore en mode sécurisé — et les stubs de secours commités ne sont pas fournis par `remote_theme`. La recherche de la barre de navigation ne renvoie donc rien et `/sitemap/` renvoie une erreur 404.

La mise en page `search` et `_includes/search-data.json` *sont* fournies, alors ajoutez un seul fichier à la racine de votre dépôt :

```yaml
# /search.json
---
layout: search
permalink: /search.json
sitemap: false
---
```

Ajoutez aussi une page `/sitemap/` (ou appuyez-vous sur le `/sitemap.xml` du plugin `jekyll-sitemap` — le pied de page y revient automatiquement lorsqu'aucune page `/sitemap/` n'existe).

### 6. Les pages de profil d'auteur renvoient une erreur 404 sauf si vous les committez

`_plugins/author_pages_generator.rb` est réservé aux plugins sur Pages. L'habillage du thème **ne renvoie plus de lien** vers les profils d'auteur qui n'existent pas dans votre build, de sorte que les signatures vides se dégradent proprement — mais si vous *voulez* des pages `/authors/:key/`, committez-les vous-même.

### 7. Les pages de statistiques s'affichent vides

`_plugins/content_statistics_generator.rb` est réservé aux plugins et le fichier de données n'est pas fourni. Ne comptez pas sur le tableau de bord des statistiques dans un build Pages en remote-theme pur.

### 8. N'ajoutez pas `jekyll-mermaid`

Il ne figure pas sur la liste blanche des plugins de GitHub Pages. Le thème rend déjà Mermaid côté client à partir d'un bundle intégré — ajouter le plugin ne fait que casser le build.

### 9. Désactivez `ai_chat` et `posthog`

Les deux sont activés dans la configuration du thème. Laissez-les désactivés sauf si vous déployez le proxy de chat / possédez le projet d'analytics. Voir le point 3.

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

L'habillage du thème renvoie vers quelques pages de section qu'il suppose existantes. Lorsque votre site les place ailleurs (ou ne les possède pas), pointez le thème vers la bonne base ou désactivez la fonctionnalité — afin que rien ne renvoie une erreur 404 :

| Paramètre | Défaut | Contrôle |
|---|---|---|
| `category_base` | `/news` | Base pour les liens des badges de catégorie d'article |
| `tags_page` | `/tags/` | Les badges de tag pointent ici uniquement si la page existe |
| `obsidian_graph_url` | `/docs/obsidian/graph/` | Lien « Graphe complet » ; masqué si la page est absente |
| `local_graph: false` (dans `defaults`) | — | Désactive entièrement le FAB/panneau du graphe local |

Les badges de tag, le lien « Graphe complet » du graphe local, le fil d'Ariane vers la racine de collection et les liens de signature d'auteur sont tous **conditionnés à l'existence** : lorsque la page cible n'est pas dans votre build, ils s'affichent en texte simple plutôt qu'en liens cassés.

## Vérifier

- Ouvrez la recherche de la barre de navigation et tapez — les résultats apparaissent (point 5).
- La barre de navigation et le pied de page affichent vos libellés et liens (points 2, 4).
- Affichez le code source d'un article — aucun ID `google_analytics` ou clé PostHog que vous n'avez pas défini
  (point 3).
- Exécutez un vérificateur de liens sur le `_site` généré — aucune erreur 404 injectée par le thème.

## Voir aussi

- [Déployer sur GitHub Pages](/docs/deployment/github-pages/)
- [Domaine personnalisé](/docs/deployment/custom-domain/)
