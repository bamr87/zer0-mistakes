---
title: AI Chat Assistant Implementation
layout: default
description: Technical implementation details for the Claude-powered, proxy-first AI chat with GitHub tool use in Zer0-Mistakes.
permalink: /docs/implementation/ai-chat-assistant/
feature_id: ZER0-060
date: 2026-03-21T00:00:00.000Z
lastmod: 2026-06-12T00:00:00.000Z
categories:
    - docs
    - implementation
tags:
    - ai
    - chatbot
    - claude
    - anthropic
    - github
    - proxy
    - security
author: bamr87
---

# AI Chat Assistant Implementation

## Summary

A page-aware AI chat assistant built on the **Claude Messages API**
(`POST /v1/messages`, streaming) with a proxy-first architecture that stays
compatible with static GitHub Pages deployments, plus **Claude tool use** for
GitHub actions: issue creation and content/UI-improvement pull requests.

## Architecture

| Piece | File | Role |
| --- | --- | --- |
| Include | `_includes/components/ai-chat.html` | Markup, render guard, Jekyll-generated page context + config JSON, styles |
| Widget JS | `assets/js/ai-chat.js` | Messages API client (SSE streaming), tool-use loop, confirmation cards, GitHub executors |
| Proxy template | `templates/deploy/chat-proxy/` | Cloudflare Worker: `/api/chat` SSE passthrough, `/api/github/issue`, `/api/github/pull-request` |

## Key Implementation Details

### 1. Claude Messages API (streaming)

The widget sends `{model, max_tokens, system, messages, tools?, stream: true}`:

- `system` is the top-level system prompt (page context + grounding rules +
  GitHub guidance) — not a `system`-role message.
- `messages` alternate `user`/`assistant`; assistant turns store the full
  content-block array so `tool_use` blocks survive in history.
- The SSE stream is parsed from `content_block_start` /
  `content_block_delta` (`text_delta`, `input_json_delta`) /
  `content_block_stop` / `message_delta` events; text deltas render
  incrementally, and `tool_use` inputs are accumulated from partial JSON.
- No `temperature` is sent — current Claude models (Opus 4.7+) reject
  sampling parameters.
- Direct mode adds `x-api-key`, `anthropic-version`, and
  `anthropic-dangerous-direct-browser-access: true` (browser CORS) headers;
  proxy mode sends no credentials from the browser at all.

### 2. Proxy-First Auth Model

Configuration (unchanged shape from the original implementation):

- `auth_mode`: `proxy` or `direct`
- `proxy_ready`: deployment guard for proxy mode
- `endpoint`: proxy URL (default `/api/chat`)

Rendering is gated so chat only appears when proxy mode has a deployed proxy
or direct mode has a key. The bundled worker pins the model and caps
`max_tokens` server-side so a tampered client cannot escalate spend.

#### Anthropic credential (proxy-side, auto-detected)

The static site never holds an Anthropic credential — the proxy does. The
bundled worker auto-detects three credential modes by precedence:

1. **Rotating OAuth refresh** (`ANTHROPIC_OAUTH_REFRESH_TOKEN`) — your Claude
   Code / Claude.ai login, kept alive automatically. The worker sends
   `Authorization: Bearer <sk-ant-oat…>` + `anthropic-beta: oauth-2025-04-20`,
   caches the live credential in a Cloudflare **KV** namespace, and refreshes
   via the OAuth2 `refresh_token` grant (`client_id` / `token_endpoint` supplied
   as config — never hardcoded). The chat handler retries once on a `401` after
   forcing a refresh.
2. **Long-lived OAuth token** (`CLAUDE_CODE_OAUTH_TOKEN`) — a non-rotating token
   from `claude setup-token`, sent as the same Bearer + beta header with no
   KV/refresh. This is the **local development** path and works on the Worker
   too.
3. **API key** (`ANTHROPIC_API_KEY`) — `x-api-key`. Appropriate for a
   workspace-scoped key with a spend cap on a public deployment.

Modes 1 and 2 use a personal, account-scoped credential, so the worker must sit
behind **Cloudflare Access** (`REQUIRE_CF_ACCESS`) — only you can reach it even
though the site is public.

#### Local development

A static Jekyll site can't proxy API calls, so local dev runs
[`templates/deploy/chat-proxy/dev-proxy.mjs`](../../templates/deploy/chat-proxy/dev-proxy.mjs)
— a thin Node adapter that executes the *same* `worker.js` and reads the
credential from `.env`. Set `CLAUDE_CODE_OAUTH_TOKEN` (or `ANTHROPIC_API_KEY`)
in `.env`, run `node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs`,
and `_config_dev.yml` points the widget at `http://localhost:8787/api/chat`. No
Cloudflare or Worker deployment needed for development.

#### Local page editing (dev only)

When `ai_chat.local_edit` is true (set in `_config_dev.yml`, off in
production), the dev proxy exposes two local-filesystem routes —
`GET /api/page/source` and `POST /api/page/update` — backed by
[`page-store.mjs`](../../templates/deploy/chat-proxy/page-store.mjs), and the
widget gains an `update_page_content` tool. The assistant can then read and
**rewrite the current page's source file in the working tree**; the dev
server's `--watch` rebuilds it and the change appears live. This is a
development-only capability: the Cloudflare Worker has no filesystem, never
imports `page-store`, and `local_edit` is off in `_config.yml`. `page-store`
enforces the safety boundary — paths resolve against the repo root and may not
escape it, only `.md`/`.markdown`/`.html`/`.htm` files are editable, and writes
target existing files only (the assistant edits a page, it cannot create
arbitrary files). In `local_edit` mode `get_page_source` also reads from the
local working tree rather than `raw.githubusercontent.com`, so edits are based
on uncommitted local content.

### 3. GitHub Tool Use

Tools are declared in the request and executed client-side in a manual
agentic loop (`stop_reason === "tool_use"` → execute → `tool_result` →
continue, capped at 5 rounds):

- `get_page_source` — fetches the raw file from
  `raw.githubusercontent.com/{repo}/{branch}/{path}` (no token for public
  repos). The page's repository source path is emitted into the page-context
  JSON (`page.path`), so the model edits the real source, not rendered HTML.
- `create_github_issue` — `url` mode opens a pre-filled
  `github.com/…/issues/new` form (user submits under their own account);
  `proxy` mode POSTs to `/api/github/issue`.
- `create_pull_request` (proxy mode only) — POSTs
  `{title, body, file_path, updated_content, branch_name}` to
  `/api/github/pull-request`; the worker resolves the base ref, creates a
  branch, commits the file via the contents API, and opens the PR.
- `update_page_content` (local dev only) — writes the edited file to the local
  working tree via the dev proxy's `/api/page/update`; see *Local page editing*
  above.

**Every creation tool is gated by an inline confirmation card** rendered in
the chat (Confirm / Cancel). A declined action returns a tool_result telling
the model not to retry.

History trimming respects tool pairing: the buffer is trimmed from the front
until it starts with a plain user text turn, so a `tool_result` is never
orphaned from its `tool_use` (which would 400 the API).

### 4. Grounded Answer Strategy

The system prompt includes grounding rules when `strict_context: true` —
answer questions only from page context, deterministic
`out_of_scope_message` fallback — with an explicit carve-out so grounding
restricts *answers*, not the GitHub tools.

### 5. Safe Rendering

Assistant messages render through an escape-first markdown subset (bold,
inline code, safe http(s) links, bullets). While streaming, deltas render as
plain `textContent`; the markdown pass runs once on the final text.
Confirmation/link cards are built with `createElement` + `textContent`, and
link cards only accept `https://github.com/...` URLs.

## Security Considerations

- Proxy mode keeps both secrets (Anthropic key, GitHub token) server-side.
- `ALLOWED_ORIGINS` on the worker gates who can spend the API budget.
- The GitHub token should be a fine-grained PAT scoped to the one site
  repository (Issues/Contents/Pull requests RW).
- Direct mode remains for local experimentation only; the key is visible in
  the page source.
- Tool execution is human-in-the-loop by construction (confirmation cards).

## GitHub Pages Compatibility

GitHub Pages is static-only. The assistant remains compatible by delegating
AI requests and GitHub writes to the external proxy. The default GitHub mode
(`url`) works with zero infrastructure: pre-filled forms are submitted by the
visitor on github.com.

Recommended production state:

```yaml
ai_chat:
  enabled: true
  auth_mode: 'proxy'
  proxy_ready: true
  endpoint: '/api/chat'
  github:
    enabled: true
    mode: 'proxy'
    endpoint: '/api/github'
```

## Validation Performed

- Jekyll builds with default local config.
- Jekyll builds with proxy-enabled overlay config.
- Browser interaction checks:
  - toggle open and close
  - streaming render path
  - strict out-of-scope fallback
  - markdown rendering
  - tool confirmation card flow (confirm and cancel)
  - pre-filled issue URL handoff

## Future Enhancements

- Optional citation snippets from page context.
- Multi-file pull requests (the worker currently commits one file per PR).
- Conversation reset control and retry affordances.
