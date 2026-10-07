---
title: Assistant de chat IA (Claude + GitHub)
lastmod: 2026-07-13 00:00:00.000000000 Z
description: Configurez l'assistant de chat IA propulsé par Claude — configuration
  du proxy, streaming et actions d'issue/PR GitHub — en toute sécurité pour GitHub
  Pages.
preview: "/images/previews/ai-chat-assistant-claude-github.png"
keywords:
- claude api
- ai chatbot
- github pages
- cloudflare worker
- streaming chat
- jekyll theme
layout: default
categories:
- docs
- features
tags:
- ai
- chatbot
- claude
- anthropic
- github
- github-pages
- proxy
difficulty: intermediate
estimated_reading_time: 20 minutes
prerequisites:
- An Anthropic API key stored outside the static site
- A deployed proxy endpoint (recommended; see templates/deploy/chat-proxy/)
- GitHub Pages site using zer0-mistakes
sidebar:
  nav: docs
lang: fr
permalink: "/fr/docs/features/ai-chat-assistant/"
translation_of: pages/_docs/features/ai-chat-assistant.md
translation_source_url: "/docs/features/ai-chat-assistant/"
machine_translated: true
translated_from_sha: '0957be79c588'
---

# Assistant de chat IA

Un assistant de chat flottant propulsé par l'**API Claude Messages**, ancré dans le contenu de la page courante. Les réponses sont diffusées jeton par jeton, et l'assistant peut effectuer des actions GitHub sur votre dépôt : ouvrir un ticket lorsqu'un visiteur signale un problème, ou soumettre une pull request qui améliore le contenu ou l'UI/UX de la page.

## Pourquoi le mode proxy

GitHub Pages ne peut pas exécuter de code côté serveur. Si vous appelez l'API Anthropic directement depuis le JavaScript du navigateur, votre clé est exposée dans le code source de la page.

L'approche recommandée est la suivante :

1. Gardez le site statique sur GitHub Pages.
2. Envoyez les requêtes de chat à votre propre point de terminaison proxy.
3. Laissez le proxy conserver la clé Anthropic (et le jeton GitHub) côté serveur.

Un Cloudflare Worker prêt à déployer qui fait tout cela — passage du chat en streaming ainsi que les routes de ticket/PR GitHub — est fourni avec le thème dans [`templates/deploy/chat-proxy/`](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy).

### Quel identifiant Anthropic le proxy utilise-t-il ?

Le proxy répond avec Claude (Anthropic) par défaut, ou avec Grok (xAI) lorsque vous lui fournissez un `XAI_API_KEY` et définissez `ai_chat.provider: xai` (ou fixez `CHAT_PROVIDER=xai` sur le proxy). Le widget reste inchangé dans les deux cas : le proxy traduit l'API compatible OpenAI de Grok en flux Anthropic Messages que le widget analyse, outils compris. En local, l'étape Connect du Site Builder peut fournir au proxy de développement l'un ou l'autre jeton pour la session — voir [Site Builder](/docs/features/site-builder/).

Le proxy peut s'authentifier auprès de Claude de deux manières (détectées automatiquement selon les secrets que vous définissez) :

- **Connecteur Claude Code (OAuth)** — utilisez votre jeton de connexion Claude Code / Claude.ai
(`sk-ant-oat…`) au lieu d'une clé API. Idéal pour un chat **privé/personnel** : le proxy envoie un jeton Bearer, le rafraîchit automatiquement (mis en cache dans KV) et doit se trouver derrière **Cloudflare Access** afin que vous seul puissiez l'utiliser — le jeton puise dans votre compte personnel. Voir le [README de chat-proxy](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy) pour la configuration OAuth.
- **Clé API** — définissez plutôt `ANTHROPIC_API_KEY` sur le proxy. Idéal pour un
  site **public** (utilisez une clé limitée à un espace de travail avec un plafond de dépenses).

## Configuration

Ajoutez ceci à votre configuration de production :

```yaml
ai_chat:
  enabled: true
  auth_mode: 'proxy'
  proxy_ready: true                  # widget renders only when this is true
  endpoint: '/api/chat'              # your proxy's chat route
  model: 'claude-opus-4-8'
  max_tokens: 1024
  strict_context: true
  out_of_scope_message: "I can only answer from the content on this page."
  github:
    enabled: true
    mode: 'url'                      # or 'proxy' — see GitHub Actions below
```

### Valeurs par défaut importantes

- `auth_mode: 'proxy'` est le mode recommandé.
- `proxy_ready: false` garde le widget masqué tant que votre proxy n'est pas déployé.
- `strict_context: true` ancre les réponses à la page courante ; les outils
GitHub fonctionnent toujours car l'ancrage ne restreint que la façon dont les questions reçoivent une réponse.
- `model: 'claude-opus-4-8'` — tout identifiant de modèle Claude actuel fonctionne ; le
  modèle du proxy peut fixer le modèle côté serveur afin que les clients ne puissent pas le changer.

## Actions GitHub depuis le chat

Lorsque `ai_chat.github.enabled` est vrai, l'assistant obtient des outils Claude :

| Outil | Ce qu'il fait | Nécessite |
| --- | --- | --- |
| `get_page_source` | Lit la source brute de la page depuis `raw.githubusercontent.com` afin que les modifications proposées soient basées sur le fichier réel | Dépôt public, aucun jeton |
| `create_github_issue` | Ouvre un ticket lorsqu'un visiteur signale un bug/une faute de frappe ou demande une amélioration | Mode `url` : rien ; mode `proxy` : jeton côté serveur |
| `create_pull_request` | Ouvre une PR qui met à jour un fichier source avec un contenu ou une UI/UX améliorés | Mode `proxy` uniquement |

Deux modes :

- **`mode: 'url'` (par défaut, sans configuration)** — l'assistant rédige le ticket,
le visiteur confirme dans le chat, et un formulaire `github.com/…/issues/new` pré-rempli s'ouvre dans un nouvel onglet. Le visiteur le soumet sous son propre compte GitHub. Aucun jeton n'existe nulle part.
- **`mode: 'proxy'`** — le widget appelle les routes `/api/github` de votre proxy,
qui utilisent un jeton côté serveur à granularité fine pour créer le ticket ou la branche + le commit + la pull request directement. Le chat affiche une carte de lien vers le ticket/la PR créés.

Chaque création est encadrée par une carte de confirmation explicite dans le chat — le modèle ne peut jamais rien soumettre en silence.

```yaml
ai_chat:
  github:
    enabled: true
    mode: 'proxy'
    endpoint: '/api/github'
    base_branch: 'main'
    default_labels: ['from-chat']
    pr_branch_prefix: 'chat/'
```

## Flux de déploiement compatible GitHub Pages

1. Déployez d'abord le proxy (voir le [README de chat-proxy](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy)).
2. Définissez `proxy_ready: true` et `endpoint` sur l'URL de ce proxy.
3. Construisez et publiez votre site Jekyll comme d'habitude.

```bash
jekyll build --config _config.yml
```

Aucune clé Anthropic côté client n'est requise en mode proxy.

## Développement local

Un site Jekyll statique ne peut pas contenir de secret, donc le développement local exécute un petit **proxy de développement** qui exécute la même logique de Worker sur Node et lit votre identifiant depuis `.env` :

1. Obtenez un jeton Claude Code à longue durée de vie (Claude Pro/Max) : `claude setup-token`.
2. Ajoutez-le à `.env` (ignoré par git) : `CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-…`
   (ou définissez plutôt `ANTHROPIC_API_KEY`).
3. Exécutez-le en parallèle de `docker-compose up` :

   ```bash
   node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs
   ```

`_config_dev.yml` pointe déjà le widget vers `http://localhost:8787/api/chat`, de sorte que le chat fonctionne à `http://localhost:4000` sans Cloudflare ni clé API dans la page. Consultez le [README de chat-proxy](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy).

### Comment vérifier que le chat fonctionne localement

Avec `docker-compose up` et le proxy de développement en cours d'exécution :

1. Ouvrez `http://localhost:4000` — un bouton flottant avec l'icône `bi-robot`
apparaît en bas à droite. (Le widget ne s'affiche que lorsque `ai_chat.enabled` et un chemin d'authentification utilisable existent ; en développement, il s'agit de `proxy_ready: true` depuis `_config_dev.yml`.)
2. Confirmez que le proxy est à l'écoute :

   ```bash
   curl -i http://localhost:8787/api/chat
   ```

Vous devriez obtenir une réponse HTTP (un 4xx pour un corps vide/`GET` est acceptable — cela prouve que la route est accessible ; seule une erreur de connexion signifie que le proxy est hors service).
3. Envoyez un message et regardez-le arriver en streaming jeton par jeton (SSE). Si
`ai_chat.github.enabled` est vrai, les puces de confirmation d'issue/PR apparaissent dans le panneau.

### Modifier la page actuelle depuis le chat (développement uniquement)

En développement local (`ai_chat.local_edit: true`, défini dans `_config_dev.yml`), l'assistant peut **modifier directement le fichier source de la page actuelle** : demandez-lui de corriger une faute de frappe ou de reformuler une section, examinez la modification dans la carte de confirmation, et le serveur de développement reconstruit la page en direct. Le proxy de développement écrit le fichier via une route locale isolée — seuls les fichiers de contenu (`.md`/`.html`) à l'intérieur du dépôt peuvent être modifiés, et uniquement les pages existantes (il ne crée jamais de fichiers). Ceci est désactivé en production : le site publié ne peut pas et n'écrit pas de fichiers. Pour modifier un site déployé, utilisez plutôt les actions d'issue/PR GitHub ci-dessus.

### Mode direct optionnel (navigateur → Anthropic)

Pour un test rapide sans le proxy de développement, le mode direct envoie les requêtes du navigateur directement vers `https://api.anthropic.com/v1/messages` en utilisant l'en-tête `anthropic-dangerous-direct-browser-access`. La clé est visible dans le code source de la page — ne publiez jamais un build avec une clé intégrée, et notez que les jetons OAuth ne sont pas utilisables de cette manière (utilisez une clé API).

```yaml
ai_chat:
  auth_mode: 'direct'
  api_key: 'sk-ant-...'
```

Placez ceci dans `_config_secrets_local.yml` (ignoré par git). Il n'est **pas** chargé par défaut — la boucle de développement Docker construit uniquement avec `--config '_config.yml,_config_dev.yml'`. Ajoutez explicitement l'overlay lorsque vous souhaitez le mode direct en local :

```bash
bundle exec jekyll serve \
  --config '_config.yml,_config_dev.yml,_config_secrets_local.yml'
```

## Fonctionnalités de qualité des réponses

- **Streaming** : les réponses s'affichent jeton par jeton via SSE.
- **Ancrage strict** : les réponses sont limitées aux métadonnées et au contenu de la page.
- **Repli hors périmètre** : un message de repli configuré est utilisé lorsque
  le contexte est manquant.
- **Rendu markdown sécurisé** : la sortie de l'assistant prend en charge un petit
  sous-ensemble markdown sans exécution de HTML non sécurisé.

## Dépannage

### Le widget n'apparaît pas

1. `ai_chat.enabled` est `true`.
2. Si vous utilisez le mode proxy, `proxy_ready` est `true`.
3. Votre `endpoint` est accessible depuis le navigateur.

### Les requêtes échouent dans le navigateur

1. L'URL du point de terminaison du proxy est correcte et renvoie les en-têtes CORS pour votre origine
   (`ALLOWED_ORIGINS` dans le worker).
2. Le proxy détient un `ANTHROPIC_API_KEY` valide.
3. Mode direct : la clé est valide et l'ID du modèle existe (par ex.
   `claude-opus-4-8`).

### Les actions d'issue/PR ne fonctionnent pas

1. `ai_chat.github.enabled` est `true` (et les puces apparaissent dans le panneau).
2. Mode `proxy` : le worker a `GITHUB_TOKEN` + `GITHUB_REPOSITORY` définis et
   le jeton dispose des permissions de lecture-écriture sur Issues/Contents/Pull requests du dépôt.
3. Mode `url` : les pop-ups sont autorisées pour votre site (le formulaire pré-rempli s'ouvre
   dans un nouvel onglet).

### Les réponses sont trop génériques

1. `strict_context` est `true`.
2. `context_max_length` est suffisamment élevé pour le contenu de votre page.
3. `system_prompt` met toujours l'accent sur l'ancrage exclusif à la page.

## Étapes suivantes

- [Analytique PostHog](posthog-analytics/)
- [Recherche du site](site-search/)
- [Index des fonctionnalités](/docs/features/)
