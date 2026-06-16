---
title: AI Chat Assistant (Claude + GitHub)
lastmod: 2026-06-15T00:00:00.000Z
description: Configure the Claude-powered AI chat assistant — proxy setup, streaming, and GitHub issue/PR actions — safely for GitHub Pages.
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
permalink: /docs/features/ai-chat-assistant/
difficulty: intermediate
estimated_reading_time: 20 minutes
prerequisites:
    - An Anthropic API key stored outside the static site
    - A deployed proxy endpoint (recommended; see templates/deploy/chat-proxy/)
    - GitHub Pages site using zer0-mistakes
sidebar:
    nav: docs
---

# AI Chat Assistant

A floating chat assistant powered by the **Claude Messages API**, grounded in
the current page's content. Responses stream token-by-token, and the
assistant can take GitHub actions on your repository: file an issue when a
visitor reports a problem, or open a pull request that improves the page's
content or UI/UX.

## Why Proxy Mode

GitHub Pages cannot run server-side code. If you call the Anthropic API
directly from browser JavaScript, your key is exposed in the page source.

The recommended approach is:

1. Keep the site static on GitHub Pages.
2. Send chat requests to your own proxy endpoint.
3. Let the proxy hold the Anthropic key (and GitHub token) server-side.

A ready-to-deploy Cloudflare Worker that does all of this — streaming chat
passthrough plus GitHub issue/PR routes — ships with the theme in
[`templates/deploy/chat-proxy/`](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy).

### Which Anthropic credential does the proxy use?

The proxy can authenticate to Claude two ways (auto-detected from which
secrets you set):

- **Claude Code connector (OAuth)** — use your Claude Code / Claude.ai login
  token (`sk-ant-oat…`) instead of an API key. Best for a **private/personal**
  chat: the proxy sends a Bearer token, refreshes it automatically (KV-cached),
  and must sit behind **Cloudflare Access** so only you can use it — the token
  spends your personal account. See the
  [chat-proxy README](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy)
  for the OAuth setup.
- **API key** — set `ANTHROPIC_API_KEY` on the proxy instead. Best for a
  **public** site (use a workspace-scoped key with a spend cap).

## Configuration

Add this to your production config:

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

### Important Defaults

- `auth_mode: 'proxy'` is the recommended mode.
- `proxy_ready: false` keeps the widget hidden unless your proxy is deployed.
- `strict_context: true` grounds answers to the current page; the GitHub
  tools still work because grounding only restricts how questions are
  answered.
- `model: 'claude-opus-4-8'` — any current Claude model ID works; the proxy
  template can pin the model server-side so clients cannot change it.

## GitHub Actions from the Chat

When `ai_chat.github.enabled` is true, the assistant gains Claude tools:

| Tool | What it does | Needs |
| --- | --- | --- |
| `get_page_source` | Reads the page's raw source from `raw.githubusercontent.com` so proposed edits are based on the real file | Public repo, no token |
| `create_github_issue` | Files an issue when a visitor reports a bug/typo or requests an enhancement | `url` mode: nothing; `proxy` mode: server-side token |
| `create_pull_request` | Opens a PR that updates one source file with improved content or UI/UX | `proxy` mode only |

Two modes:

- **`mode: 'url'` (default, zero-config)** — the assistant drafts the issue,
  the visitor confirms in-chat, and a pre-filled `github.com/…/issues/new`
  form opens in a new tab. The visitor submits it under their own GitHub
  account. No token exists anywhere.
- **`mode: 'proxy'`** — the widget calls your proxy's `/api/github` routes,
  which use a fine-grained server-side token to create the issue or the
  branch + commit + pull request directly. The chat shows a link card to the
  created issue/PR.

Every creation is gated by an explicit confirmation card in the chat — the
model can never file anything silently.

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

## GitHub Pages Compatible Deployment Flow

1. Deploy the proxy first (see the [chat-proxy README](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy)).
2. Set `proxy_ready: true` and `endpoint` to that proxy URL.
3. Build and publish your Jekyll site as usual.

```bash
jekyll build --config _config.yml
```

No client-side Anthropic key is required in proxy mode.

## Local Development

A static Jekyll site can't hold a secret, so local dev runs a small **dev
proxy** that executes the same Worker logic on Node and reads your credential
from `.env`:

1. Get a long-lived Claude Code token (Claude Pro/Max): `claude setup-token`.
2. Add it to `.env` (git-ignored): `CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-…`
   (or set `ANTHROPIC_API_KEY` instead).
3. Run it alongside `docker-compose up`:

   ```bash
   node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs
   ```

`_config_dev.yml` already points the widget at `http://localhost:8787/api/chat`,
so the chat works at `http://localhost:4000` with no Cloudflare or API key in
the page. See the
[chat-proxy README](https://github.com/bamr87/zer0-mistakes/tree/main/templates/deploy/chat-proxy).

### How to verify the chat works locally

With `docker-compose up` and the dev proxy both running:

1. Open `http://localhost:4000` — a floating button with the `bi-robot` icon
   appears bottom-right. (The widget renders only when `ai_chat.enabled` and a
   usable auth path exist; in dev that is `proxy_ready: true` from
   `_config_dev.yml`.)
2. Confirm the proxy is listening:

   ```bash
   curl -i http://localhost:8787/api/chat
   ```

   You should get an HTTP response (a 4xx for the empty/`GET` body is fine — it
   proves the route is reachable; only a connection error means the proxy is
   down).
3. Send a message and watch it stream in token-by-token (SSE). If
   `ai_chat.github.enabled` is true, the issue/PR confirmation chips appear in
   the panel.

### Edit the current page from the chat (dev only)

In local development (`ai_chat.local_edit: true`, set in `_config_dev.yml`) the
assistant can **edit the current page's source file directly**: ask it to fix a
typo or reword a section, review the change in the confirmation card, and the
dev server rebuilds the page live. The dev proxy writes the file through a
sandboxed local route — only content files (`.md`/`.html`) inside the repo can
be edited, and only existing pages (it never creates files). This is off in
production: the published site can't and doesn't write files. For changes to a
deployed site, use the GitHub issue/PR actions above instead.

### Optional Direct Mode (browser → Anthropic)

For a quick test without the dev proxy, direct mode sends requests from the
browser straight to `https://api.anthropic.com/v1/messages` using the
`anthropic-dangerous-direct-browser-access` header. The key is visible in the
page source — never publish a build with one embedded, and note OAuth tokens
are not usable this way (use an API key).

```yaml
ai_chat:
  auth_mode: 'direct'
  api_key: 'sk-ant-...'
```

Put this in `_config_secrets_local.yml` (git-ignored). It is **not** loaded by
default — the Docker dev loop builds with `--config '_config.yml,_config_dev.yml'`
only. Add the overlay explicitly when you want direct mode locally:

```bash
bundle exec jekyll serve \
  --config '_config.yml,_config_dev.yml,_config_secrets_local.yml'
```

## Response Quality Features

- **Streaming**: responses render token-by-token over SSE.
- **Strict grounding**: answers are constrained to page metadata and content.
- **Out-of-scope fallback**: a configured fallback message is used when
  context is missing.
- **Safe markdown rendering**: assistant output supports a small markdown
  subset without unsafe HTML execution.

## Troubleshooting

### Widget does not appear

1. `ai_chat.enabled` is `true`.
2. If using proxy mode, `proxy_ready` is `true`.
3. Your `endpoint` is reachable from the browser.

### Requests fail in browser

1. Proxy endpoint URL is correct and returns CORS headers for your origin
   (`ALLOWED_ORIGINS` in the worker).
2. Proxy holds a valid `ANTHROPIC_API_KEY`.
3. Direct mode: the key is valid and the model ID exists (e.g.
   `claude-opus-4-8`).

### Issue/PR actions don't work

1. `ai_chat.github.enabled` is `true` (and the chips appear in the panel).
2. `proxy` mode: the worker has `GITHUB_TOKEN` + `GITHUB_REPOSITORY` set and
   the token has Issues/Contents/Pull requests read-write on the repo.
3. `url` mode: pop-ups are allowed for your site (the pre-filled form opens
   in a new tab).

### Replies are too generic

1. `strict_context` is `true`.
2. `context_max_length` is high enough for your page content.
3. `system_prompt` still emphasizes page-only grounding.

## Next Steps

- [PostHog Analytics](posthog-analytics/)
- [Site Search](site-search/)
- [Features Index](/docs/features/)
