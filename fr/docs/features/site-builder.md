---
title: Site Builder (assistant de configuration guidé par IA — Claude ou Grok)
description: La référence du Site Builder couvre ses neuf étapes, le sélecteur de
  fournisseur et l'utilisation de votre propre jeton, les sessions guidées et ouvertes,
  les fichiers qu'il génère, les outils IA, les routes du dev-proxy sous-jacentes
  et les limites de sécurité.
date: 2026-09-05 00:00:00.000000000 Z
lastmod: 2026-09-07 00:00:00.000000000 Z
layout: default
categories:
- docs
- features
tags:
- ai
- claude
- grok
- xai
- setup
- onboarding
- docker
- proxy
author: bamr87
keywords:
- jekyll site builder wizard
- jekyll setup wizard ai
- site builder
- setup wizard
- claude code oauth
- xai grok api key
- bring your own ai key
- jekyll scaffold
- docker compose
difficulty: intermediate
estimated_reading_time: 15 minutes
prerequisites:
- A local checkout of the theme
- Node.js 20.6+ for the dev proxy, plus a Claude token (Claude Code CLI or an Anthropic
  API key) or an xAI key
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/site-builder/"
translation_of: pages/_docs/features/site-builder.md
translation_source_url: "/docs/features/site-builder/"
machine_translated: true
translated_from_sha: 198273b3a509
---

# Générateur de site

Le Générateur de site est l'assistant d'intégration du thème. La moitié « formulaire » fonctionne partout où le thème s'affiche, y compris sur GitHub Pages. La moitié « IA » se connecte via le proxy de développement local avec **votre propre jeton de fournisseur — Claude (Anthropic) ou Grok (xAI)** — et transforme l'assistant en une construction assistée : l'assistant voit chaque réponse, propose et applique des valeurs, vérifie la machine, lit le code source du thème, écrit le projet, exécute Docker et, dans une session ouverte, modifie un site existant fichier par fichier et génère des images pour celui-ci.

## Ce que vous allez faire

Utilisez cette référence pour comprendre la structure de l'assistant, connecter un fournisseur, choisir entre les étapes guidées et une session ouverte, configurer ou étendre une étape, et voir exactement quelles actions la session IA est autorisée à effectuer.

## Prérequis

- Le thème servi en local (`docker compose up`) pour que `/setup/` s'affiche. En production, la page affiche un avis sauf si `show_setup_wizard: true` est défini.
- Pour la couche IA : Node.js 20.6+ et le proxy de développement en cours d'exécution. Un jeton peut être collé à l'étape Connexion ou conservé dans `.env` : un jeton OAuth Claude Code (`claude setup-token`, Pro/Max), une clé API Anthropic, ou une clé xAI depuis console.x.ai. Une clé xAI débloque également la génération d'images (Grok Imagine) ; une clé OpenAI constitue un moteur de rendu d'images alternatif.

## Où il s'affiche

| Surface | Condition |
| --- | --- |
| `/setup/` (`pages/setup.html`) | `jekyll.environment == "development"` ou `site.show_setup_wizard` |
| Mise en page `welcome` | Tout site qui nécessite encore une configuration (`site_needs_setup` depuis `components/setup-check.html`) |

## Les neuf étapes

| Étape | Ce qu'elle recueille | Le rôle de l'assistant |
| --- | --- | --- |
| Connexion | Fournisseur (Claude ou Grok), un jeton pour la session, modèle, moteur de rendu d'images, mode de session | Salue dès que son fournisseur dispose d'un identifiant |
| Prérequis | Docker, Git, gh, VS Code, Node, Claude CLI | Exécute les vérifications en direct, explique les échecs selon l'OS |
| Identité | Résumé, titre, sous-titre, slogan, description, propriétaire, e-mail | Rédige l'identité à partir du résumé |
| URLs | Utilisateur et dépôt GitHub, source du thème, url, baseurl, permalink, port | Déduit url et baseurl |
| Structure | Type de site, collections, navigation principale | Recommande des collections et un menu |
| Apparence | Habillage, mode couleur, verrouillage, calques d'arrière-plan, icône de barre de navigation | Choisit un habillage adapté au ton |
| Voix | Ton, audience, article de bienvenue, page à propos | Rédige les deux brouillons dans cette voix |
| Intégrations | Retour de page, Obsidian, Giscus, PostHog, chat IA, GA4, réseaux sociaux | Conseille ce qui convient |
| Construction | Dossier cible, option d'écrasement, ou un site existant à ouvrir | Passe les fichiers en revue, écrit le projet, exécute compose, vérifie le site ; ouvre et modifie un site existant |

Les étapes, les prérequis, les catalogues, les fournisseurs, les modes de session et le résumé du framework proviennent tous d'un seul fichier de données, `_data/site_builder.yml`, de sorte que le formulaire, les générateurs et l'invite IA ne peuvent pas diverger.

## Choisissez votre fournisseur d'IA

L'étape Connexion affiche une carte par fournisseur depuis `_data/site_builder.yml` et demande au proxy de développement lesquels disposent déjà d'une clé. Le badge sur chaque carte indique la fin masquée de cette clé et son origine (`.env` ou un jeton collé lors de cette session).

| Contrôle | Ce qu'il fait |
| --- | --- |
| Cartes de fournisseur | Claude (Anthropic) ou Grok (xAI). Lorsque le proxy fixe `CHAT_PROVIDER`, l'autre carte est verrouillée. |
| Champ de jeton | Envoie le jeton **une seule fois** au proxy localhost, qui le conserve en mémoire pour la durée de l'exécution, le valide avec une requête peu coûteuse et le renvoie masqué. La page ne le stocke jamais et refuse de l'envoyer ailleurs que vers `localhost`. **L'oublier** le supprime à nouveau. |
| Enregistrer dans `.env` | Facultatif : le proxy écrit la ligne dans `.env` (mode 600) afin qu'elle survive à un redémarrage. |
| Modèle | Le catalogue du fournisseur (`claude-opus-4-8`, `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5` ; `grok-4.6`, `grok-4.5`, `grok-4.3`). En lecture seule lorsque le proxy fixe `CHAT_MODEL` / `XAI_CHAT_MODEL`. |
| Génération d'images | Désactivée, Grok Imagine (nécessite la clé xAI) ou OpenAI Images (nécessite `OPENAI_API_KEY`). |
| Mode de session | Étapes guidées ou une session ouverte (ci-dessous). |

Changer de fournisseur définit également le `ai_chat.provider` du site généré à l'étape Intégrations, et le choix d'image préconfigure `preview_images`, de sorte que le site que vous construisez est prêt pour le fournisseur que vous avez utilisé ; `.env.example` liste les clés correspondantes.

Le proxy fait autorité : il décide quels fournisseurs sont configurés, fixe le fournisseur et le modèle lorsqu'on le lui demande, et effectue la traduction pour xAI afin que le navigateur parle toujours le dialecte Anthropic Messages. Le widget de discussion présent sur chaque page bénéficie du même choix (`ai_chat.provider`) — voir [Assistant de discussion IA](/docs/features/ai-chat-assistant/).

## Étapes guidées ou session ouverte

Le mode **Guidé** conserve le flux d'origine : l'assistant suit les neuf étapes, propose des invites par étape et remplit chaque formulaire avec une carte de confirmation.

La **session ouverte** fonctionne comme une session de codage dans un terminal. Les étapes restent disponibles mais optionnelles : décrivez ce que vous voulez, et l'assistant enchaîne les outils — jusqu'à 24 tours par échange — pour construire un nouveau site à partir d'un brief, ouvrir un site existant sous la racine cible, lire et modifier ses fichiers, ajouter des pages, générer des images, exécuter `jekyll build` et rendre compte des changements. Un bouton **Stop** interrompt une exécution longue ; tout outil que l'exécution n'a pas terminé reçoit une réponse pour le modèle afin que la conversation reste bien formée. Le mode ainsi que les choix de fournisseur, de modèle et d'image sont mémorisés dans `localStorage` ; jamais un jeton.

## Modifier un site existant

L'étape Build répertorie chaque site sous la racine cible (dossiers contenant un `_config.yml` ou un `docker-compose.yml`) — les sites que ce constructeur a écrits auparavant, ou tout site Jekyll que vous y copiez. **Open** (ou l'outil `open_project`) en fait le projet de travail : l'assistant reçoit son arborescence de fichiers dans l'invite système et les outils de projet agissent à l'intérieur.

| Outil | Effet | Confirmation |
| --- | --- | --- |
| `list_projects`, `open_project` | Trouver et ouvrir un site | Non |
| `list_project_files`, `read_project_file` | Arborescence à profondeur limitée ; lire un fichier texte | Non |
| `write_project_file` | Créer ou remplacer un fichier texte autorisé (`overwrite: true` pour un fichier existant) | Oui — affiche le début du contenu |
| `edit_project_file` | Remplacer un extrait exact qui doit être unique sauf si `all: true` | Oui — affiche la recherche et le remplacement |
| `delete_project_file` | Supprimer un fichier ordinaire | Oui |
| `run_project_command` | `git-status`, `git-diff`, `git-log`, `git-init` | Non |
| `run_compose("build")` | `jekyll build` à l'intérieur du conteneur en cours d'exécution, sortie dans le terminal Build | Non |
| `run_compose("restart")` | Redémarrer le conteneur pour qu'une page ou un article nouvellement ajouté apparaisse | Non |

Chaque écriture est délimitée par le même bac à sable que le scaffold : chemins relatifs uniquement, extensions autorisées, plafonds de taille, secrets et chemins VCS refusés, jamais à l'intérieur de la copie de travail du thème.

Une particularité de Jekyll que les outils prennent en compte : `--watch` ne suit que les documents de collection qui existaient au démarrage du serveur, si bien qu'un article ou une page **nouvellement ajouté** n'apparaît pas sur le site en cours d'exécution. `write_project_file` le signale dans son résultat et propose un bouton de redémarrage, et `run_compose("restart")` le rend visible.

## Génération d'images

`generate_image` génère avec le fournisseur d'images sélectionné — Grok Imagine (`grok-imagine-image-2.0`) ou OpenAI Images (`gpt-image-2`) — et enregistre le PNG/JPEG/WebP sous le dossier `assets/` du projet (les octets sont détectés, plafond de 8 Mo). La carte de confirmation affiche l'invite, le chemin cible et le modèle car cela coûte de l'argent ; la carte de résultat affiche une vignette servie par le proxy. L'outil renvoie le chemin pour que l'assistant puisse l'intégrer : front matter `preview:`, `landing.hero.image` dans le plan du site, ou un `<img>`. L'étape Apparence propose un raccourci **Image d'en-tête avec …**.

## Fichiers générés

Le panneau d'aperçu affiche chaque fichier en direct et se régénère à chaque frappe. Tout fichier peut être remplacé à la main ou par Claude ; les fichiers remplacés portent un point sur leur onglet.

| Fichier | Notes |
| --- | --- |
| `_config.yml` | Identité, URLs, collections avec valeurs par défaut correspondantes, apparence, intégrations avec clés laissées vides (`ai_chat.provider` et, si choisi, `preview_images` défini pour votre fournisseur), liste d'exclusion |
| `_config_dev.yml` | URL localhost, livereload, analytics désactivées, liste d'exclusion complète (Jekyll la remplace au lieu de la fusionner) |
| `Gemfile` | Jekyll 4 plus `jekyll-remote-theme`, ou la gem `jekyll-theme-zer0` |
| `docker-compose.yml` | Image `ruby:3.3`, volume de cache du bundle, port choisi |
| `index.md` | Page d'accueil sur la mise en page `home` avec une liste des derniers articles |
| `_data/navigation/main.yml` | Les lignes de navigation issues de l'étape Structure |
| `pages/_about/index.md`, `pages/_posts/<date>-welcome.md` | Brouillons de l'étape Ton avec front matter ajouté |
| `pages/<collection>.md` | Une page d'index par collection activée sur la mise en page `collection` (mise en page `cookbook` pour `recipes`) |
| `pages/_docs/getting-started.md`, `pages/_quickstart/first-steps.md`, `pages/_notes/welcome-note.md`, `pages/_recipes/starter-recipe.md` | Un document de démarrage valide par collection activée, montrant le front matter dont cette collection a besoin |
| `assets/images/logo.svg` | Un monogramme aux couleurs du thème, pour que la barre de navigation n'affiche jamais un logo cassé (la gem publiée ne fournit aucune image de thème) |
| `.gitignore`, `.env.example`, `README.md` | Hygiène et guide d'exécution/publication ; `.env.example` liste la clé pour les fournisseurs de chat et d'images choisis |
| `zer0.install.yml` | Vos réponses, rejouables par `scripts/bin/install` |

**Download file** enregistre le fichier actif. **Download bundle** enregistre `zer0-site-bundle.sh`, un script bash auto-extractible qui recrée toute l'arborescence dans un dossier que vous nommez.

## Le plan de site (sortie pilotée par schéma)

Au-delà des champs du formulaire, l'agent produit un **plan de site** : une description structurée de la page d'accueil, de la forme de navigation, des surcharges de thème et des pages d'exemple. Le plan est validé par rapport à `plan_schema` dans `_data/site_builder.yml` (un sous-ensemble de JSON-Schema : `type`, `properties`, `required`, `additionalProperties`, `enum`, `enumFrom` un catalogue, `items`, `maxItems`, `maxLength`, `pattern`) avant tout changement, et les générateurs le transforment en fichiers. Chaque option que l'agent peut choisir provient d'un catalogue dans le même fichier de données, si bien qu'ajouter une palette, un appariement de polices, un modèle de page d'accueil ou un type de section est un changement de données.

| Clé du plan | Options | Devient |
| --- | --- | --- |
| `landing.template` | `minimal`, `hero`, `showcase`, `docs-hub`, `editorial` | `index.md` sur la mise en page `home` exécutant un petit moteur de landing Liquid, plus `_data/landing.yml` contenant le texte |
| `landing.hero` | eyebrow, titre, sous-titre, alignement, variante, jusqu'à trois CTA | Le bloc hero de `_data/landing.yml` |
| `landing.sections[]` | `features`, `cards`, `steps`, `stats`, `faq`, `cta`, `latest_posts`, `quote`, `text` | Sections rendues via l'include `section` du thème avec des cartes Bootstrap, des accordéons et des boutons CTA |
| `navigation.style` | `flat`, `grouped` | `_data/navigation/main.yml` ; groupé transforme les collections en menus déroulants de leurs pages planifiées |
| `navigation.sidebar` | `none`, `auto`, `docs` | `sidebar: {nav: auto}` dans `_config.yml`, ou un `_data/navigation/docs.yml` soigné relié à la collection docs |
| `theme.palette` | neuf préréglages ou `custom` avec trois couleurs hex | `assets/css/user-overrides.css`, superposé au thème (primaire, liens, accent, boutons) |
| `theme.fonts` | sept appariements (système + six paires de Google Fonts) | Variables de police `user-overrides.css` plus `_includes/custom/head.html`, le hook de fin de head du thème |
| `theme.radius` | `sharp`, `soft`, `round` | Jetons de rayon `user-overrides.css` |
| `pages[]` | collection, slug, titre, description, date, catégories, tags, corps Markdown | Un fichier par page sous `pages/_<collection>/` |

Les valeurs par défaut du modèle comblent ce que le plan laisse de côté, si bien qu'un plan comportant uniquement `landing.template: showcase` produit tout de même une page d'accueil complète dont le texte est dérivé du brief et des collections. L'étape Structure expose les mêmes choix sous forme de contrôles (style de navigation, barre latérale, modèle de landing, un planificateur de pages) et l'étape Apparence expose des cartes de palette, un appariement de polices avec aperçu en direct, et le rayon des angles ; **Preview on this page** applique les surcharges générées à l'assistant lui-même. Claude soumet des plans avec `set_site_plan` ; le navigateur affiche une carte de confirmation listant ce qui change et rejette tout ce que le schéma n'autorise pas, en renvoyant les erreurs au modèle.

## Configuration

```yaml
site_builder:
  enabled: true
  endpoint: '/api/wizard'      # dev proxy base; _config_dev.yml sets http://localhost:8787/api/wizard
  chat_endpoint: ''            # '' reuses ai_chat.endpoint
  provider: 'auto'             # auto | anthropic | xai — card preselected on Connect (the proxy decides what is configured)
  model: 'claude-opus-4-8'     # fallback when the proxy reports none; CHAT_MODEL / XAI_CHAT_MODEL win
  mode: 'guided'               # guided | open
  image_provider: ''           # '' | xai | openai — image renderer offered when its key exists
  max_tokens: 8192             # open sessions write whole files; the proxy's MAX_TOKENS_CAP still caps it
  default_port: 4000
```

Variables côté proxy : `CHAT_PROVIDER`, `CHAT_MODEL`, `XAI_CHAT_MODEL`, `XAI_API_KEY`, `OPENAI_API_KEY`, `IMAGE_PROVIDER`, `XAI_IMAGE_MODEL`, `OPENAI_IMAGE_MODEL`, `MAX_TOKENS_CAP`, `CHAT_DEV_ENV_FILE`.

## La session IA

Chaque tour envoie une invite système construite à partir de cinq éléments : le brief de framework issu du fichier de données, le schéma de champs exposé par l'assistant, les indications de l'étape en cours (ou le brief de session ouverte), un résumé de chaque réponse, résultat de vérification et fichier généré, et l'arborescence du projet en cours lorsqu'un projet est ouvert. Comme le formulaire est l'unique source de vérité et que le script ne dialogue avec lui qu'à travers `window.Zer0SetupWizard`, tout ce que vous saisissez et tout ce que l'assistant applique est immédiatement visible des deux côtés.

Outils disponibles pour le modèle :

| Outil | Effet | Confirmation |
| --- | --- | --- |
| `get_wizard_state`, `get_generated_file` | Lire l'état ou un fichier | Non |
| `set_wizard_fields` | Modifier des champs, collections, navigation | Oui |
| `get_site_plan`, `set_site_plan` | Lire ou appliquer le plan de site validé par schéma (landing, navigation, surcharges de thème, pages) | `set_site_plan` : oui |
| `set_file_override` | Remplacer un fichier généré | Oui |
| `go_to_step` | Naviguer | Non |
| `run_prerequisite_check` | Vérification autorisée via le proxy | Non |
| `read_theme_file`, `list_theme_dir` | Lire la source du thème via le proxy | Non |
| `search_theme_docs` | Interroger le `search.json` du site | Non |
| `resolve_target` | Inspecter le dossier du projet | Non |
| `write_site_files` | Générer l'ossature du projet (et l'ouvrir comme projet en cours) | Oui |
| `list_projects`, `open_project`, `list_project_files`, `read_project_file` | Rechercher, ouvrir et lire un site existant | Non |
| `write_project_file`, `edit_project_file`, `delete_project_file` | Modifier un fichier du projet en cours | Oui |
| `run_project_command` | `git-status`, `git-diff`, `git-log`, `git-init` | Non |
| `generate_image` | Générer avec Grok Imagine ou OpenAI Images dans `assets/` | Oui |
| `run_compose` | `up`, `ps`, `logs`, `down`, `restart`, `config`, `build` | `up` et `down` |
| `check_site_live` | Sonder le port de développement | Non |

La transcription visible est conservée dans `sessionStorage` uniquement sous forme de tours en texte brut, de sorte qu'une conversation restaurée ne puisse jamais laisser un résultat d'outil orphelin.

## Routes du proxy de développement

Les routes n'existent que dans `templates/deploy/chat-proxy/dev-proxy.mjs` et sont délimitées par `wizard-store.mjs`. Le Worker Cloudflare ne les possède jamais.

| Route | Limite |
| --- | --- |
| `GET /api/wizard/status` | Fournisseur actif (masqué), catalogues de fournisseurs et d'images, épingles de modèles, ids de vérification, racine du scaffold, sites existants |
| `POST /api/wizard/credentials`, `DELETE …?provider=` | Jeton de session : forme vérifiée, sondé une fois en amont, en mémoire uniquement, masqué dans chaque réponse ; `.env` seulement sur `persist: true` (mode 600) |
| `POST /api/wizard/check` | Table de commandes fixe indexée par id ; e-mails masqués dans la sortie |
| `GET /api/wizard/file`, `GET /api/wizard/ls` | À l'intérieur du checkout du thème ; secrets, VCS, répertoires vendorisés et de build refusés ; extensions texte uniquement |
| `POST /api/wizard/target`, `POST /api/wizard/scaffold` | Sous-répertoire strict de `WIZARD_TARGET_ROOT` (par défaut : le dossier parent du thème), jamais à l'intérieur du thème, noms sur liste blanche, limites de taille, pas d'écrasement sauf demande |
| `POST /api/wizard/compose` | Uniquement `up -d --build`, `ps`, `logs`, `down`, `restart`, `config`, `build`, dans un dossier contenant déjà `docker-compose.yml` |
| `GET /api/wizard/projects`, `GET /api/wizard/project/{ls,file,tree}` | Sites sous la racine cible ; lectures à l'intérieur de l'un d'eux avec la liste noire du thème et les règles texte uniquement |
| `POST /api/wizard/project/{write,edit,delete,command}` | Un fichier texte sur liste blanche par appel, modifications par extraits uniques, fichiers uniquement, une table git fixe |
| `POST /api/wizard/image`, `GET /api/wizard/asset` | PNG/JPEG/WebP sous `assets/` uniquement, octets analysés, limite de 8 Mo |

Environnement : `WIZARD_TARGET_ROOT`, `WIZARD_DISABLE_COMPOSE=1`, `CHAT_DEV_ENV_FILE`.

## Valider un build de bout en bout

Comme les réponses de l'agent ne sont pas déterministes, l'assistant fournit un lanceur de scénarios plutôt qu'une transcription fixe. Il échantillonne un brief réaliste, un auteur, un ton, un skin, un mode de couleur et des intégrations pour un type de site, pilote tout l'assistant dans un vrai navigateur avec l'enregistrement vidéo activé, accepte les cartes de confirmation de Claude, écrit le projet, le démarre avec Docker, et vérifie des faits structurels sur le résultat : les fichiers attendus existent, le site répond sur chaque route de ce type, et il porte le titre et le skin choisis.

```bash
# theme on :4000, dev proxy on :8787
node test/visual/site-builder-walkthrough.mjs                       # one random scenario
SCENARIO=cookbook SEED=42 node test/visual/site-builder-walkthrough.mjs
SCENARIO=all COUNT=6 SITE_PORT=4100 node test/visual/site-builder-walkthrough.mjs
```

Les scénarios résident dans `test/visual/site-builder-scenarios.mjs` (`blog`, `docs`, `cookbook`, `portfolio`, `garden`, `mixed`). Chaque exécution imprime sa graine et écrit `report.md`, `report.json`, des captures d'écran et `video-desktop.webm` sous `test/visual-results/site-builder-walkthrough/<timestamp>/`. Lorsque l'assistant est indisponible, le lanceur enregistre ces vérifications comme échouées, remplit des substituts déterministes, et exécute quand même le build. Les sites générés utilisent `SITE_PORT + 10·i` avec LiveReload sur le port suivant, de sorte qu'ils s'exécutent à côté du serveur de développement du thème.

## Vérifier

1. Démarrez le thème et le proxy, ouvrez `/setup/`, choisissez un fournisseur, collez un jeton (ou fiez-vous à `.env`) et confirmez que le badge indique **Claude connecté** ou **Grok connecté**.
2. Appuyez sur **Run checks** à l'étape des prérequis et confirmez que chaque ligne change d'état.
3. Saisissez un brief, appuyez sur **Draft with Claude**, et confirmez qu'une carte demande avant que les champs changent.
4. Sur Build, appuyez sur **Check**, **Write project**, puis **docker compose up** ; le terminal diffuse le build et **Open site** charge le nouveau site.

## Dépannage

| Problème | Solution |
| --- | --- |
| Le panneau reste **offline** | Le proxy n'est pas en cours d'exécution ou n'est pas sur le port 8787 ; consultez sa console pour `listening on`. Il n'a plus besoin d'identifiant pour démarrer. |
| Le badge indique **needs a token** | Le proxy fonctionne mais le fournisseur sélectionné n'a pas de clé : collez-en une à l'étape Connect, ou basculez vers le fournisseur qui en a une. |
| Le jeton est rejeté | Le proxy le sonde une fois avant de le conserver. Pour Claude, relancez `claude setup-token` ; pour Grok, créez une nouvelle clé sur console.x.ai. |
| `generate_image` indique qu'aucun fournisseur n'est prêt | Choisissez un moteur de rendu d'images sur Connect et collez la clé correspondante (une clé xAI couvre le chat Grok et Grok Imagine). |
| Cible rejetée | Les noms de dossiers utilisent uniquement des lettres, chiffres, point, tiret et trait de soulignement et doivent se trouver sous la racine cible. |
| Fichiers ignorés à l'écriture | Ils existent déjà ; activez **Allow replacing files** ou choisissez un nouveau dossier. |
| Compose désactivé | `WIZARD_DISABLE_COMPOSE=1` était défini au démarrage du proxy. |
| `all predefined address pools have been fully subnetted` sur `docker compose up` | Chaque site généré crée un réseau Docker ; après de nombreuses générations, exécutez `docker network prune` (supprime uniquement les réseaux inutilisés) ou `docker compose down` dans les anciens dossiers de projet. |
| `Bind for 0.0.0.0:<port> failed` | Un autre site généré occupe encore ce port ; arrêtez-le (`docker compose down` dans son dossier) ou choisissez un autre **port de dev** à l'étape des URL. |

## Ressources associées

- [Démarrage rapide du Site Builder](/quickstart/site-builder/) est le guide pas à pas destiné aux nouveaux utilisateurs.
- [Assistant de chat IA](/docs/features/ai-chat-assistant/) documente le proxy partagé et ses modes d'authentification.
- [Configuration de la machine](/quickstart/machine-setup/) est la référence manuelle pour l'étape Prérequis.
