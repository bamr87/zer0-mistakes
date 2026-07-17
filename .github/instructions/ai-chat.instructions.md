---
applyTo: "_includes/components/ai-chat.html,assets/js/ai-chat.js,templates/deploy/chat-proxy/**"
description: "Architecture and safety contracts for the AI chat assistant (Claude-powered widget) and its chat-proxy — auth modes, server-side caps, the confirmation-card contract, safe rendering, and the dev-only local page-edit sandbox. Read this before touching the widget, its JS, or templates/deploy/chat-proxy/."
date: 2026-06-13T00:00:00.000Z
lastmod: 2026-06-13T00:00:00.000Z
---

# AI Chat Assistant — Architecture & Safety Contracts

The opt-in floating chat assistant (feature `ZER0-060`) is Claude-powered and grounded in the current page. It streams from the Claude Messages API through a proxy, and exposes GitHub + local-edit tools via Claude tool use. These files are security-sensitive — read this before editing them.

> **Precedence note:** `templates/deploy/chat-proxy/**` also matches the
> `templates/deploy/**` glob in `install.instructions.md`. That file governs the
> Bash deploy-plugin contract (the `azure-swa`, `docker-prod`, `github-pages`
> targets). The chat proxy is a **JavaScript Cloudflare Worker**, not a Bash
> deploy plugin — **this file governs it**, not the installer's four-function
> deploy-target contract.

## Files in scope

| File | Role |
| --- | --- |
| `_includes/components/ai-chat.html` | Widget markup, render guard, page-context + config JSON, styles |
| `assets/js/ai-chat.js` | Messages API client (SSE), tool-use loop, confirmation cards, tool executors |
| `templates/deploy/chat-proxy/worker.js` | Cloudflare Worker: `/api/chat` + `/api/github/*` |
| `templates/deploy/chat-proxy/dev-proxy.mjs` | Local dev proxy (same worker on Node) + `/api/page/*` |
| `templates/deploy/chat-proxy/page-store.mjs` | Sandboxed local page read/write (dev only) |
| `templates/deploy/chat-proxy/wrangler.toml` | Live Worker config (workers.dev, CORS, caps) |

## Non-negotiable contracts

1. **The static site never holds a credential.** Auth happens only in the
proxy. The widget's config JSON carries an `apiKey` only in `direct` mode (local dev). Never emit a key into a production build — the render guard (`ai_render`) keeps the widget hidden unless `proxy_ready` (proxy mode) or a non-empty `api_key` (direct mode) is set.
2. **Proxy auth is three auto-detected modes by precedence** (see
`worker.js` → `anthropicAuthMode`): `ANTHROPIC_OAUTH_REFRESH_TOKEN` (rotating, KV-cached) → `CLAUDE_CODE_OAUTH_TOKEN` (long-lived Bearer) → `ANTHROPIC_API_KEY` (`x-api-key`). OAuth modes send `anthropic-beta: oauth-2025-04-20` and are for **personal/private** use behind **Cloudflare Access** (`REQUIRE_CF_ACCESS`). Don't reorder precedence or weaken the Access gate.
3. **Server-side caps are authoritative.** `CHAT_MODEL` and `MAX_TOKENS_CAP`
are enforced in the Worker so a tampered client can't pick a costlier model or unbounded output. Keep them server-side.
4. **Every creation/mutation tool is gated by an inline confirmation card.**
`create_github_issue`, `create_pull_request`, and `update_page_content` must call `requestConfirmation` before acting; a declined action returns a `tool_result` telling the model not to retry. Never add a side-effectful tool that skips the card.
5. **Default to the safest GitHub mode.** `github.mode: 'url'` opens pre-filled
github.com forms (no token anywhere); `'proxy'` uses a server-side token. `create_pull_request` is offered only in proxy mode.
6. **Local page editing is dev-only.** `update_page_content` and the dev proxy's
`/api/page/source` + `/api/page/update` routes exist **only** in `dev-proxy.mjs` (the Worker has no filesystem). They are gated by `ai_chat.local_edit`, which is `false` in `_config.yml` and `true` only in `_config_dev.yml`. `page-store.mjs` is the safety boundary: paths resolve against the repo root and may not escape it, only `.md`/`.markdown`/`.html`/ `.htm` files are editable, and writes target **existing files only** (edit a page, never create arbitrary files). Do not relax these.
7. **Rendering is escape-first.** Assistant text renders through the limited
markdown subset in `renderAssistantMarkdown` (escape, then a safe subset); confirmation/link cards are built with `createElement` + `textContent`, and link cards accept only `https://github.com/...` URLs. Never `innerHTML` raw model output.
8. **History trimming preserves tool pairing.** `trimHistory` trims from the
front until the buffer starts with a plain user text turn, so a `tool_result` is never orphaned from its `tool_use` (which would 400 the API). Preserve this when changing history handling.

## Conventions

- Widget config is injected as a JSON `<script id="aiChatConfig">` block; add
new options there with a `site.ai_chat.*` default and read them in `ai-chat.js`. Compute boolean render flags with Liquid `if`-tags, not `assign` (Liquid stores a truthy string for boolean expressions in `assign`).
- The Worker and `dev-proxy.mjs` share logic — `dev-proxy.mjs` imports and runs
  the real `worker.js`, so worker changes must keep working under Node.
- Model id defaults to `claude-opus-4-8`; do not send `temperature` (current
  Claude models reject sampling params).
- `ANTHROPIC_API_KEY` is shared with the AI content reviewer
  (`ai-content-review.yml`) — see `docs/systems/github-secrets-setup.md`.

## Validation

- `node --check` the three proxy JS files and `assets/js/ai-chat.js`.
- Build with `_config.yml,_config_dev.yml` (dev: widget on, `localEdit` true)
  and confirm the rendered `aiChatConfig` JSON is valid.
- For proxy changes, exercise `worker.js` with mocked `fetch`/KV and the
  `/api/page/*` routes against a temp sandbox (see the chat-proxy README).
