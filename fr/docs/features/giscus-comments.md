---
lastmod: 2026-06-23 00:00:00.000000000 Z
title: Commentaires Giscus
description: Intégrez des commentaires propulsés par GitHub Discussions dans votre
  site Jekyll grâce à Giscus - une alternative moderne et respectueuse de la vie privée
  à Disqus.
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
translated_from_sha: b2fb5564968e
---

# Commentaires Giscus

> Ajoutez à votre site Jekyll un système de commentaires basé sur GitHub Discussions, avec détection automatique du thème et conception respectueuse de la vie privée.

## Vue d'ensemble

[Giscus](https://giscus.app/) est un système de commentaires basé sur GitHub Discussions. Contrairement aux services traditionnels comme Disqus, Giscus :

- **Ne nécessite aucune base de données** — les commentaires sont stockés dans GitHub Discussions
- **Respecte la vie privée** — pas de pistage, pas de publicité
- **Prend en charge les réactions** — les réactions emoji GitHub sur les commentaires
- **Détection automatique du thème** — s'adapte au mode clair/sombre de votre site
- **Gratuit et open source** — sous licence MIT

## Prérequis

Avant de configurer Giscus, assurez-vous d'avoir :

1. Un **dépôt GitHub public** pour votre site Jekyll
2. **GitHub Discussions activé** sur le dépôt
3. L'**application Giscus** installée sur votre dépôt

## Installation

### Étape 1 : Activer GitHub Discussions

1. Accédez à votre dépôt sur GitHub
2. Allez dans **Settings** → **General**
3. Faites défiler jusqu'à la section **Features**
4. Cochez **Discussions**

### Étape 2 : Installer l'application Giscus

**C'est l'étape la plus susceptible d'être oubliée silencieusement** — rien dans votre dépôt ne peut le signaler, et aucun test ni build ne peut détecter son absence. Sans elle, le widget affiche une erreur au lieu d'une zone de commentaires, quelle que soit la justesse de `_config.yml`.

1. Rendez-vous sur [https://github.com/apps/giscus](https://github.com/apps/giscus)
2. Cliquez sur **Install** (ou **Configure**, si vous l'avez déjà installée sur un autre compte)
3. Sélectionnez le compte propriétaire du dépôt
4. Accordez l'accès — soit **All repositories**, soit **Only select repositories** en incluant celui-ci
5. Vérifiez que la modification a bien été prise en compte :

   ```bash
   ./scripts/bin/giscus-discussions doctor
   ```

> **Vous forkez ce thème ?** Un fork n'hérite **pas** de l'installation de l'application du dépôt d'origine,
> et les `data-repo-id` / `data-category-id` dans `_config.yml` pointent toujours vers `bamr87/zer0-mistakes`. Vous devez installer l'application sur votre propre dépôt *et* régénérer les deux identifiants.

### Étape 3 : Obtenir les valeurs de configuration

1. Rendez-vous sur [https://giscus.app/](https://giscus.app/)
2. Saisissez le nom de votre dépôt (par ex. `username/repo-name`)
3. Sélectionnez vos réglages préférés :
   - **Correspondance Page ↔ Discussions** : `pathname` (recommandé)
   - **Catégorie de discussion** : choisissez ou créez une catégorie comme « Comments »
   - **Fonctionnalités** : activez les réactions et le chargement différé selon vos besoins
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

La valeur `data-repo` est renseignée automatiquement à partir de `site.repository` (défini près du début de `_config.yml`), vous n'avez donc pas à répéter ici le propriétaire/dépôt.

---

## Vérifier que ça fonctionne

La section des commentaires s'affiche en bas des mises en page `article`, `note` et `notebook`, conditionnée de manière cohérente par `page.comments != false` **et** `site.giscus.enabled`. Conserver `enabled: true` dans le bloc de configuration affiche les commentaires sur les trois mises en page.

Les articles de blog (`pages/_posts/`, la mise en page `article`) ainsi que les notes/carnets affichent les commentaires par défaut ; les pages de documentation et générales ne le font pas. Remplacez ce comportement page par page avec `comments: false` (ou `comments: true`) dans le front matter d'une page.

1. Générez le site avec la configuration de développement :

   ```bash
   docker-compose exec -T jekyll bundle exec jekyll build \
     --config '_config.yml,_config_dev.yml'
   ```

2. Vérifiez que le script Giscus est bien émis sur un article généré et que vos identifiants ont été
   interpolés (aucun attribut vide) :

   ```bash
   grep -A1 'giscus.app/client.js' _site/**/index.html | grep -m1 data-repo-id
   ```

   Attendu : un attribut `data-repo-id="..."` portant votre véritable identifiant. Un `data-repo-id=""` vide signifie que le bloc `giscus` est manquant ou que la clé est mal orthographiée.

3. Servez le site (`docker-compose up`) et ouvrez un article. **Le widget se charge bien sur
`localhost`** — Giscus se base sur l'attribut `data-repo`, et non sur l'origine de la page ; l'iframe s'affiche donc et signale les véritables erreurs en local. Cela fait de localhost un véritable test de bout en bout, et pas seulement une vérification « la balise est-elle présente ? ».

   Ce que vous devriez voir, et ce que signifie chaque état :

   Un widget fonctionnel ressemble à ceci — barre de réactions, nombre de commentaires, une zone Write/Preview et un bouton **Sign in with GitHub** :

   ![La section Comments d'un article affichant le widget Giscus fonctionnel : « 0 reactions » avec un bouton de réaction, « 0 comments », une zone de commentaire à onglets Write/Preview indiquant « Sign in to comment », et un bouton vert « Sign in with GitHub »](/assets/images/docs/features/giscus/widget-working.png)

   | Ce qui s'affiche sous le titre « Comments » | Signification |
   |---|---|
   | La zone de commentaire et tout fil existant (ci-dessus) | Entièrement fonctionnel |
   | `An error occurred: giscus is not installed on this repository` | L'[application giscus](https://github.com/apps/giscus) n'est pas installée — voir [Dépannage](#the-giscus-app-is-not-installed) |
   | `An error occurred: Discussion not found` | Normal pour une page que personne n'a encore commentée ; Giscus crée la discussion au premier commentaire |
   | Rien du tout | `enabled: false`, `comments: false` sur la page, ou l'include n'est pas atteint |

   Vous ne pourrez pas *vous connecter et publier* depuis `localhost` (la redirection OAuth de GitHub est liée à l'origine déployée), mais tout le reste jusqu'à ce point est fidèle.

4. Confirmez la chaîne complète — dépôt public, Discussions activées, **application installée**, catégorie valide —
   avec une seule requête, sans navigateur :

   ```bash
   # Replace the repo and category with your own
   curl -s -G https://giscus.app/api/discussions \
     --data-urlencode "repo=bamr87/zer0-mistakes" \
     --data-urlencode "category=Announcements" \
     --data-urlencode "term=/" \
     -d "number=0&strict=true&first=1" | head -c 200
   ```

   Une charge utile JSON avec une clé `discussion` signifie que la chaîne est saine. `{"error":"giscus is not installed on this repository"}` signifie que l'application est absente — la configuration peut être parfaite et les commentaires resteront cassés.

---

## Options de configuration

### Attributs de données

L'include du thème se trouve dans `_includes/content/giscus.html`. Seuls les trois premiers attributs ci-dessous sont reliés à votre `_config.yml` ; les autres sont fixés dans l'include. Pour modifier un attribut fixe, vous devez éditer `_includes/content/giscus.html` directement.

| Attribut | Source | Valeur |
|-----------|--------|-------|
| `data-repo` | Config | `⟦49⟧⟦51⟧⟦50⟧` |
| `data-repo-id` | Config | `⟦54⟧⟦56⟧⟦55⟧` (requis) |
| `data-category-id` | Config | `⟦59⟧⟦61⟧⟦60⟧` (requis) |
| `data-mapping` | Fixé dans l'include | `pathname` |
| `data-strict` | Fixé dans l'include | `1` |
| `data-reactions-enabled` | Fixé dans l'include | `1` |
| `data-emit-metadata` | Fixé dans l'include | `0` |
| `data-input-position` | Fixé dans l'include | `top` |
| `data-theme` | Fixé dans l'include | `preferred_color_scheme` |
| `data-lang` | Fixé dans l'include | `en` |

### Options de thème

L'include est fourni avec `data-theme="preferred_color_scheme"` (clair/sombre automatique). Pour utiliser un thème différent, remplacez `data-theme` dans `_includes/content/giscus.html` par l'une des valeurs suivantes :

| Valeur | Description |
|-------|-------------|
| `preferred_color_scheme` | Détection automatique depuis les paramètres du navigateur (par défaut) |
| `light` | Toujours mode clair |
| `dark` | Toujours mode sombre |
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

## Construire des conversations avec Claude Code

Comme les commentaires sont des Discussions GitHub, vous pouvez les lire, les rédiger et y répondre depuis le terminal — et Claude Code peut piloter l'ensemble du flux. Deux éléments sont fournis avec le thème :

- **`scripts/bin/giscus-discussions`** — un moteur propulsé par `gh` avec les sous-commandes
  `doctor`, `categories`, `list`, `thread`, `draft`, `seed` et `post`.
- **La compétence `giscus-conversation`** (`.github/skills/giscus-conversation/`) —
indique à Claude Code comment lire le fil d'une page, rédiger une réponse de mainteneur en tenant compte du contexte du lecteur, et la publier.

```bash
# Is the whole chain healthy? (app installed, IDs match, category valid)
./scripts/bin/giscus-discussions doctor

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

Le script lit le dépôt depuis `gh repo view` et la catégorie depuis `_config.yml` ; remplacez avec `--repo` / `--category-id` (ou les variables d'environnement `GISCUS_REPO` / `GISCUS_CATEGORY_ID`) lorsque vous travaillez sur un fork. Les écritures (`seed`, `post`) sont sans effet sous `--dry-run`. Un workflow [`giscus-digest.yml`](https://github.com/bamr87/zer0-mistakes/blob/main/.github/workflows/giscus-digest.yml) en lecture seule fait remonter la nouvelle activité des commentaires dans le résumé du job Actions.

---

## Comment une page correspond à une discussion

Avec `data-mapping="pathname"` et `data-strict="1"` (tous deux fixés dans l'include), Giscus trouve le fil d'une page en faisant correspondre le **titre** de la discussion au chemin de la page — avec la **barre oblique de tête supprimée**.

Pour `https://zer0-mistakes.com/posts/2025/01/21/remote-work-revolution/`, le widget demande :

```text
term=posts/2025/01/21/remote-work-revolution/
```

Ainsi, la discussion qui soutient cette page doit être intitulée exactement :

```text
posts/2025/01/21/remote-work-revolution/
```

**et non** `/posts/2025/01/21/remote-work-revolution/`. Cela importe dans exactement deux situations :

- **Vous amorcez un fil à la main.** Une barre oblique de tête produit une discussion que Giscus
  ne trouvera jamais — la page continue d'afficher un widget vide tandis que la discussion reste dans la catégorie en paraissant correcte. `giscus-discussions seed --page /any/form/` normalise cela pour vous ; passer `--title` vous-même ne le fait pas.
- **Vous migrez ou renommez des discussions.** Renommez vers la forme sans barre oblique de tête, sinon
  la correspondance se casse silencieusement.

Dans le cas normal, vous n'y pensez jamais : Giscus crée lui-même la discussion, correctement intitulée, la première fois qu'un visiteur commente.

---

## Migration depuis Disqus

En cas de migration depuis Disqus :

1. **Exportez les commentaires Disqus** (facultatif — pour l'archivage)
2. **Supprimez les scripts Disqus** de vos templates
3. **Supprimez la configuration Disqus** de `_config.yml`
4. **Suivez les étapes d'installation** ci-dessus
5. **Remarque** : Les commentaires Disqus existants ne seront pas transférés vers Giscus

---

## Dépannage

### L'application giscus n'est pas installée

La façon la plus courante pour un site *correctement configuré* de ne toujours afficher aucun commentaire. Chaque valeur dans `_config.yml` peut être correcte — dépôt public, Discussions activées, IDs valides — et le widget n'affichera quand même que ceci :

![La section Commentaires d'un article publié affichant le texte "An error occurred: giscus is not installed on this repository" là où devrait se trouver la zone de commentaire](/assets/images/docs/features/giscus/widget-error-not-installed.png)

Le configurateur [giscus.app](https://giscus.app/) signale la même chose lorsque vous saisissez le dépôt — il vérifie les trois prérequis à la fois :

![L'étape Repository sur giscus.app listant ses trois exigences (dépôt public, application giscus installée, Discussions activées) avec « bamr87/zer0-mistakes » saisi et une erreur en rouge indiquant « Cannot use giscus on this repository. Make sure all of the above criteria has been met. »](/assets/images/docs/features/giscus/configurator-repo-check.png)

**Pourquoi cela se produit :** l'installation de l'application est une action ponctuelle sur le *dépôt*, et non quelque chose qu'un fichier du dépôt peut déclarer. Rien dans `_config.yml`, aucun test, ni aucune construction Jekyll ne peut l'effectuer ou la détecter — il est donc facile d'accomplir chaque étape de « configuration » documentée tout en manquant le prérequis. Les forks sont particulièrement exposés : un fork hérite de la configuration mais **pas** de l'installation de l'application du dépôt en amont.

**Solution :** installez l'application sur [github.com/apps/giscus](https://github.com/apps/giscus) → **Configure** → sélectionnez le compte → accordez l'accès au dépôt (soit « All repositories », soit « Only select repositories » incluant celui-ci).

**Vérifiez** sans ouvrir de navigateur — c'est le contrôle à ajouter à vos notes de configuration :

```bash
curl -s -G https://giscus.app/api/discussions \
  --data-urlencode "repo=OWNER/REPO" \
  --data-urlencode "category=Announcements" \
  --data-urlencode "term=/" \
  -d "number=0&strict=true&first=1" | head -c 200
```

`{"error":"giscus is not installed on this repository"}` → toujours manquant. Tout JSON avec une clé `discussion` → installé et fonctionnel.

### Les commentaires n'apparaissent pas

1. **Vérifiez la visibilité du dépôt** — il doit être public
2. **Vérifiez que les Discussions sont activées** sur le dépôt
3. **Confirmez que l'application Giscus est installée** sur le dépôt
4. **Vérifiez que les identifiants de configuration** correspondent à votre dépôt — `data-repo-id` doit
appartenir à **ce** dépôt (un identifiant hérité par fork du dépôt en amont fera afficher au widget une erreur « repository does not match » même si la balise de script s'affiche). Régénérez sur [giscus.app](https://giscus.app/), ou listez les identifiants de catégorie valides avec `./scripts/bin/giscus-discussions categories`.
5. **Vérifiez l'orthographe de la clé de configuration** — elle doit être `giscus:` (et non `gisgus:`) ;
les mises en page lisent `site.giscus.enabled`. Le test central `Giscus Comments Configuration` protège cela.

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

1. L'include est déjà livré avec `data-strict="1"` et `data-mapping="pathname"` — confirmez que vous ne les avez pas modifiés dans `_includes/content/giscus.html`
2. Vérifiez que les URL des pages sont stables (pas de problèmes de barre oblique finale), car `pathname` associe les discussions au chemin de l'URL

---

## Bonnes pratiques

1. **Le mappage par chemin et le mode strict sont activés par défaut** — l'include définit déjà `data-mapping="pathname"` et `data-strict="1"`, ce qui constitue la configuration la plus fiable pour les sites Jekyll
2. **Créez une catégorie dédiée** — cela garde les commentaires organisés
3. **Testez localement** — le fil intégré ne se chargera pas en localhost, mais vérifiez que la balise de script `https://giscus.app/client.js` est présente
4. **Désactivez par page si nécessaire** — définissez `comments: false` dans le front matter d'une page (fonctionne dans les mises en page `article`, `note` et `notebook`)

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
