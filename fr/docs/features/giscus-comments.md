---
lastmod: 2026-06-23 00:00:00.000000000 Z
title: Commentaires Giscus
description: Intégrez des commentaires propulsés par GitHub Discussions à votre site
  Jekyll avec Giscus - une alternative moderne et respectueuse de la vie privée à
  Disqus.
preview: "/images/previews/giscus-comments.png"
layout: default
categories:
- docs
- features
tags:
- giscus
- jekyll
- comments
- github-discussions
difficulty: beginner
estimated_reading_time: 15 minutes
prerequisites:
- GitHub account
- Jekyll site repository on GitHub
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/giscus-comments/"
translation_of: pages/_docs/features/giscus-comments.md
translation_source_url: "/docs/features/giscus-comments/"
machine_translated: true
translated_from_sha: 52efdd3386dc
---

# Commentaires Giscus

> Ajoutez à votre site Jekyll un système de commentaires propulsé par GitHub Discussions, avec détection automatique du thème et un design respectueux de la vie privée.

## Vue d'ensemble

[Giscus](https://giscus.app/) est un système de commentaires propulsé par GitHub Discussions. Contrairement aux services traditionnels comme Disqus, Giscus :

- **Ne nécessite aucune base de données** — les commentaires sont stockés dans GitHub Discussions
- **Respecte la vie privée** — aucun pistage, aucune publicité
- **Prend en charge les réactions** — réactions emoji GitHub sur les commentaires
- **Détection automatique du thème** — s'adapte au mode clair/sombre de votre site
- **Gratuit et open source** — sous licence MIT

## Prérequis

Avant de configurer Giscus, assurez-vous d'avoir :

1. Un **dépôt GitHub public** pour votre site Jekyll
2. **GitHub Discussions activé** sur le dépôt
3. L'**application Giscus** installée sur votre dépôt

## Installation

### Étape 1 : Activer GitHub Discussions

1. Rendez-vous sur votre dépôt sur GitHub
2. Accédez à **Settings** → **General**
3. Faites défiler jusqu'à la section **Features**
4. Cochez **Discussions**

### Étape 2 : Installer l'application Giscus

1. Visitez [https://github.com/apps/giscus](https://github.com/apps/giscus)
2. Cliquez sur **Install**
3. Sélectionnez votre dépôt
4. Autorisez l'installation

### Étape 3 : Obtenir les valeurs de configuration

1. Visitez [https://giscus.app/](https://giscus.app/)
2. Saisissez le nom de votre dépôt (par exemple, `username/repo-name`)
3. Sélectionnez vos paramètres préférés :
   - **Correspondance page ↔ discussions** : `pathname` (recommandé)
   - **Catégorie de discussion** : Choisissez ou créez une catégorie comme « Comments »
   - **Fonctionnalités** : Activez les réactions et le chargement différé selon vos besoins
4. Copiez les valeurs `data-repo-id` et `data-category-id`

### Étape 4 : Configurer Jekyll

Ajoutez la configuration Giscus à votre `_config.yml`. Le thème lit exactement trois clés — `enabled`, `data-repo-id` et `data-category-id` :

```yaml
# Giscus Comment System Configuration
giscus:
  enabled: true
  data-repo-id: "YOUR_REPO_ID"
  data-category-id: "YOUR_CATEGORY_ID"
```

La valeur `data-repo` est renseignée automatiquement à partir de `site.repository` (défini près du haut de `_config.yml`), vous n'avez donc pas à répéter le propriétaire/dépôt ici.

---

## Vérifier que ça fonctionne

La section des commentaires s'affiche en bas des mises en page `article`, `note` et `notebook`, conditionnée de manière cohérente à `page.comments != false` **et** `site.giscus.enabled`. Conserver `enabled: true` dans le bloc de configuration affiche les commentaires sur les trois mises en page.

Les articles de blog (`pages/_posts/`, la mise en page `article`) ainsi que les notes/carnets affichent les commentaires par défaut ; la documentation et les pages générales ne le font pas. Remplacez ce comportement page par page avec `comments: false` (ou `comments: true`) dans le front matter d'une page.

1. Générez le site avec la configuration de développement :

   ```bash
   docker-compose exec -T jekyll bundle exec jekyll build \
     --config '_config.yml,_config_dev.yml'
   ```

2. Confirmez que le script Giscus est émis sur un article généré et que vos identifiants ont été
   interpolés (aucun attribut vide) :

   ```bash
   grep -A1 'giscus.app/client.js' _site/**/index.html | grep -m1 data-repo-id
   ```

   Attendu : un attribut `data-repo-id="..."` portant votre véritable ID. Un `data-repo-id=""` vide signifie que le bloc `giscus` est absent ou que la clé est mal orthographiée.

3. Servez le site (`docker-compose up`) et ouvrez un article. Le widget Giscus se charge
depuis GitHub, il ne s'affiche donc entièrement que sur une URL publique et déployée — sur `localhost:4000` vous pouvez confirmer que la balise `<script src="https://giscus.app/client.js">` est présente même si le fil de discussion intégré ne se charge pas.

---

## Options de configuration

### Attributs de données

L'include du thème se trouve dans `_includes/content/giscus.html`. Seuls les trois premiers attributs ci-dessous sont reliés à votre `_config.yml` ; les autres sont fixés dans l'include. Pour modifier un attribut fixe, vous devez éditer directement `_includes/content/giscus.html`.

| Attribut | Source | Valeur |
|-----------|--------|-------|
| `data-repo` | Config | `⟦34⟧⟦36⟧⟦35⟧` |
| `data-repo-id` | Config | `⟦39⟧⟦41⟧⟦40⟧` (requis) |
| `data-category-id` | Config | `⟦44⟧⟦46⟧⟦45⟧` (requis) |
| `data-mapping` | Fixé dans l'include | `pathname` |
| `data-strict` | Fixé dans l'include | `1` |
| `data-reactions-enabled` | Fixé dans l'include | `1` |
| `data-emit-metadata` | Fixé dans l'include | `0` |
| `data-input-position` | Fixé dans l'include | `top` |
| `data-theme` | Fixé dans l'include | `preferred_color_scheme` |
| `data-lang` | Fixé dans l'include | `en` |

### Options de thème

L'include est livré avec `data-theme="preferred_color_scheme"` (clair/sombre automatique). Pour utiliser un thème différent, modifiez `data-theme` dans `_includes/content/giscus.html` avec l'une de ces valeurs :

| Valeur | Description |
|-------|-------------|
| `preferred_color_scheme` | Détection automatique depuis les paramètres du navigateur (par défaut) |
| `light` | Toujours en mode clair |
| `dark` | Toujours en mode sombre |
| `dark_dimmed` | Mode sombre atténué |
| `transparent_dark` | Fond sombre transparent |
| URL personnalisée | Charger un thème CSS personnalisé |

### Désactiver les commentaires par page

Pour désactiver les commentaires sur des pages spécifiques, ajoutez au front matter :

```yaml
---
title: "Page Without Comments"
comments: false
---
```

---

## Créer des conversations avec Claude Code

Comme les commentaires sont des GitHub Discussions, vous pouvez les lire, les rédiger et y répondre depuis le terminal — et Claude Code peut piloter tout le flux. Deux éléments sont livrés avec le thème :

- **`scripts/bin/giscus-discussions`** — un moteur propulsé par `gh` avec des sous-commandes
  `categories`, `list`, `thread`, `draft`, `seed` et `post`.
- **La compétence `giscus-conversation`** (`.github/skills/giscus-conversation/`) —
indique à Claude Code comment lire le fil d'une page, rédiger une réponse de mainteneur en tenant compte du contexte du lecteur, et la publier.

```bash
# What categories exist (and their node IDs for _config.yml)?
./scripts/bin/giscus-discussions categories

# Which pages have comment threads?
./scripts/bin/giscus-discussions list

# Read the full conversation for a page
./scripts/bin/giscus-discussions thread --page /posts/2025/01/21/remote-work-revolution/

# Draft a reply scaffold (thread context + a REPLY section to fill in)
./scripts/bin/giscus-discussions draft --number 7 --out reply.md

# Preview, then post (writes go to public Discussions — always --dry-run first)
./scripts/bin/giscus-discussions post --number 7 --body-file reply.md --reply-to DC_xxx --dry-run
```

Le script lit le dépôt depuis `gh repo view` et la catégorie depuis `_config.yml` ; remplacez avec `--repo` / `--category-id` (ou les variables d'environnement `GISCUS_REPO` / `GISCUS_CATEGORY_ID`) lorsque vous travaillez sur un fork. Les écritures (`seed`, `post`) n'ont aucun effet sous `--dry-run`. Un workflow en lecture seule [`giscus-digest.yml`](https://github.com/bamr87/zer0-mistakes/blob/main/.github/workflows/giscus-digest.yml) fait remonter les nouvelles activités de commentaires dans le récapitulatif du job Actions.

---

## Migration depuis Disqus

Si vous migrez depuis Disqus :

1. **Exportez les commentaires Disqus** (facultatif — pour archivage)
2. **Supprimez les scripts Disqus** de vos templates
3. **Supprimez la configuration Disqus** de `_config.yml`
4. **Suivez les étapes d'installation** ci-dessus
5. **Remarque** : Les commentaires Disqus existants ne seront pas transférés vers Giscus

---

## Dépannage

### Les commentaires n'apparaissent pas

1. **Vérifiez la visibilité du dépôt** — il doit être public
2. **Vérifiez que les Discussions sont activées** sur le dépôt
3. **Confirmez que l'application Giscus est installée** sur le dépôt
4. **Validez que les identifiants de configuration** correspondent à votre dépôt — `data-repo-id` doit
appartenir à **ce** dépôt (un identifiant repris d'un fork depuis le dépôt amont fera afficher au widget une erreur « repository does not match » même si la balise de script s'affiche). Régénérez sur [giscus.app](https://giscus.app/), ou listez les identifiants de catégorie valides avec `./scripts/bin/giscus-discussions categories`.
5. **Vérifiez l'orthographe de la clé de configuration** — elle doit être `giscus:` (pas `gisgus:`) ;
les layouts lisent `site.giscus.enabled`. Le test central `Giscus Comments Configuration` protège contre cela.

### Le thème ne correspond pas

L'include utilise `data-theme="preferred_color_scheme"`, qui suit la préférence clair/sombre du navigateur. Pour forcer un thème, modifiez `data-theme` dans `_includes/content/giscus.html` :

```html
<!-- Force a specific theme -->
data-theme="light"

<!-- Or load a custom CSS theme -->
data-theme="https://yoursite.com/giscus-custom.css"
```

### Fils de commentaires multiples

Si les pages créent des discussions en double :

1. L'include est déjà livré avec `data-strict="1"` et `data-mapping="pathname"` — vérifiez que vous ne les avez pas modifiés dans `_includes/content/giscus.html`
2. Vérifiez que les URL des pages sont stables (pas de problèmes de barre oblique finale), puisque `pathname` associe les discussions au chemin de l'URL

---

## Bonnes pratiques

1. **Le mappage par chemin et le mode strict sont activés par défaut** — l'include définit déjà `data-mapping="pathname"` et `data-strict="1"`, ce qui est la configuration la plus fiable pour les sites Jekyll
2. **Créez une catégorie dédiée** — cela garde les commentaires organisés
3. **Testez en local** — le fil intégré ne se chargera pas sur localhost, mais vérifiez que la balise de script `https://giscus.app/client.js` est présente
4. **Désactivez par page si nécessaire** — définissez `comments: false` dans le front matter d'une page (fonctionne dans les layouts `article`, `note` et `notebook`)

---

## Pour aller plus loin

- [Documentation Giscus](https://giscus.app/)
- [Guide GitHub Discussions](https://docs.github.com/en/discussions)
- [Dépôt GitHub de Giscus](https://github.com/giscus/giscus)

---

*Ce guide fait partie de la documentation du [thème Jekyll Zer0-Mistakes](https://github.com/bamr87/zer0-mistakes).*

## Voir aussi

- [[Features]]
- [[PostHog Analytics]]
