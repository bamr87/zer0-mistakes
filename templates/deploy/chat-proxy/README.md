# AI Chat Proxy (Cloudflare Worker)

Server-side companion for the theme's AI chat assistant
([`_includes/components/ai-chat.html`](../../../_includes/components/ai-chat.html) +
[`assets/js/ai-chat.js`](../../../assets/js/ai-chat.js)). GitHub Pages is
static-only, so the widget delegates everything that needs a secret to this
proxy. The site stays on GitHub Pages; only `/api/*` is handled here.

## What it serves

| Route | Purpose |
| --- | --- |
| `POST /api/chat` | Forwards the widget's request to the Claude Messages API (`https://api.anthropic.com/v1/messages`) and streams the SSE response back unchanged. |
| `POST /api/github/issue` | Creates a GitHub issue (`{title, body, labels}` → `{url, number}`). |
| `POST /api/github/pull-request` | Creates a branch from `BASE_BRANCH`, commits one updated file, opens a pull request. |

The GitHub routes are only needed when `ai_chat.github.mode: 'proxy'`. In the
default `'url'` mode the widget opens pre-filled github.com forms instead and
no token is required.

## Local development (no Cloudflare needed)

A static Jekyll site can't proxy API calls, so for local dev run
[`dev-proxy.mjs`](dev-proxy.mjs) — it executes this same `worker.js` on Node and
reads your credential from `.env`:

1. Get a long-lived Claude Code OAuth token (Claude Pro/Max):

   ```bash
   claude setup-token            # prints sk-ant-oat01-...
   ```

2. Put it in `.env` at the repo root (git-ignored):

   ```
   CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
   ```

   (Or set `ANTHROPIC_API_KEY` instead — the OAuth token wins if both are set.)

3. Start the dev proxy alongside `docker-compose up`:

   ```bash
   node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs
   ```

`_config_dev.yml` already points the widget at `http://localhost:8787/api/chat`,
so the chat works at `http://localhost:4000` with no Cloudflare or Worker
deployment. The dev proxy uses the long-lived token directly (no KV/refresh).

## Anthropic auth — three modes (auto-detected by precedence)

| Precedence | Trigger secret | Header sent | Refresh | Best for |
| --- | --- | --- | --- | --- |
| 1 | `ANTHROPIC_OAUTH_REFRESH_TOKEN` | `Authorization: Bearer` + oauth beta | KV-cached, rotating | Private prod, rotating login |
| 2 | `CLAUDE_CODE_OAUTH_TOKEN` | `Authorization: Bearer` + oauth beta | none (long-lived) | Local dev / simple private |
| 3 | `ANTHROPIC_API_KEY` | `x-api-key` | n/a | Public site (workspace key) |

### Mode 1 — Rotating OAuth refresh token (private prod)

Authenticates with your **Claude Code / Claude.ai login** and keeps it alive
automatically. The worker sends `Authorization: Bearer <token>` plus the
`anthropic-beta: oauth-2025-04-20` header.

> ⚠️ **This is a personal, account-scoped credential.** Every request the proxy
> makes runs as *you*, against your Claude subscription. Only deploy it behind
> **Cloudflare Access** so nobody else can reach it (steps below). Do not use
> this mode for a public, unauthenticated site.

OAuth access tokens are short-lived and the refresh token typically **rotates**
on each refresh, so the worker caches the current credential in a **KV
namespace** and refreshes it with the standard OAuth2 `refresh_token` grant.

**1. Get your OAuth credential.** Log in with the Anthropic CLI (shares the
Claude Code credential store):

```bash
ant auth login                       # opens a browser; stores a profile
ant auth status                      # confirm the active profile
```

The credential (refresh token, client id, token endpoint) lives under
`~/.config/anthropic/` (`credentials/<profile>.json` / `configs/<profile>.json`).
Pull the values you need from there — the worker does **not** hardcode
Anthropic's OAuth internals, you supply them.

**2. Create the KV namespace** (required for OAuth mode):

```bash
wrangler kv namespace create CHAT_KV   # paste the printed id into wrangler.toml
```

**3. Set the OAuth secrets/vars:**

```bash
wrangler secret put ANTHROPIC_OAUTH_REFRESH_TOKEN   # rotating refresh token
wrangler secret put ANTHROPIC_OAUTH_CLIENT_ID       # OAuth client id
wrangler secret put ANTHROPIC_OAUTH_ACCESS_TOKEN    # optional: seed the first token
# ANTHROPIC_OAUTH_TOKEN_ENDPOINT goes in wrangler.toml [vars]
```

> **Fallback if you can't extract `client_id` / `token_endpoint`:** skip in-worker
> refresh and reseed the access token out-of-band. Set only
> `ANTHROPIC_OAUTH_ACCESS_TOKEN` and refresh it on a schedule from a machine that
> has the CLI logged in:
> ```bash
> wrangler secret put ANTHROPIC_OAUTH_ACCESS_TOKEN <<<"$(ant auth print-credentials --access-token)"
> ```
> Run that from cron more often than the token's lifetime. (In-worker refresh is
> better — it's hands-off — but this works when you only have an access token.)

### Mode 2 — Long-lived Claude Code OAuth token

The simplest OAuth option: a non-rotating token from `claude setup-token`, sent
as a Bearer token with no KV/refresh machinery. This is what the
[local dev proxy](#local-development-no-cloudflare-needed) uses, and it works on
the Worker too:

```bash
wrangler secret put CLAUDE_CODE_OAUTH_TOKEN   # value from `claude setup-token`
```

Still a personal credential — keep Cloudflare Access on. Set this and leave the
refresh-token secrets unset.

### Mode 3 — API key

Leave the OAuth secrets unset and the worker uses `x-api-key`:

```bash
wrangler secret put ANTHROPIC_API_KEY    # console.anthropic.com → API keys
```

## Privacy gate — Cloudflare Access

Because OAuth mode spends your personal account, lock the proxy to just you:

1. Cloudflare dashboard → **Zero Trust → Access → Applications → Add**.
2. Scope it to your domain and the `/api/*` path.
3. Policy: allow only your email (or your IdP group).
4. Keep `REQUIRE_CF_ACCESS = "true"` in `wrangler.toml` — the worker then also
   rejects any request lacking a Cloudflare Access JWT (defense in depth; the
   Access policy is the real enforcement).

With this in place the chat only works for you, even though the site is public.

## Deploy

### Via GitHub Actions (this repo's live setup — workers.dev, API key)

[`.github/workflows/deploy-chat-proxy.yml`](../../../.github/workflows/deploy-chat-proxy.yml)
deploys [`wrangler.toml`](wrangler.toml) on every push to `main` that touches the
proxy (and on manual dispatch), and sets the Worker's `ANTHROPIC_API_KEY` from a
GitHub secret. One-time setup:

1. Cloudflare → **My Profile → API Tokens → Create Token → "Edit Cloudflare
   Workers"**. Note your **Account ID** (Workers & Pages overview).
2. Add three **repo → Settings → Secrets and variables → Actions** secrets:
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY`.
3. Merge to `main` (or run the workflow via **Actions → Deploy chat proxy →
   Run workflow**). First run creates the Worker and prints its URL:
   `https://zer0-mistakes-chat-proxy.<your-subdomain>.workers.dev`.
4. Put that URL in `_config.yml` and flip the widget on:

   ```yaml
   ai_chat:
     proxy_ready: true
     endpoint: 'https://zer0-mistakes-chat-proxy.<your-subdomain>.workers.dev/api/chat'
     github:
       endpoint: 'https://zer0-mistakes-chat-proxy.<your-subdomain>.workers.dev/api/github'
   ```

   (Cross-origin from GitHub Pages → workers.dev; CORS is handled by the
   Worker's `ALLOWED_ORIGINS`.)

For proxy-mode issue/PR creation, also add `GITHUB_TOKEN` to the workflow's
`secrets:` list with a `CHAT_GITHUB_TOKEN` repo secret mapped in `env:`.

### Manually with wrangler

```bash
cp wrangler.toml.template wrangler.toml   # or edit the committed wrangler.toml
wrangler deploy
```

Either route `your-domain.com/api/*` to the worker (same-origin — requires the
domain's DNS on Cloudflare) or use the `*.workers.dev` URL and point
`ai_chat.endpoint` / `ai_chat.github.endpoint` at it.

Then flip the site config in `_config.yml`:

```yaml
ai_chat:
  enabled: true
  auth_mode: 'proxy'
  proxy_ready: true                       # widget renders only when this is true
  endpoint: '/api/chat'                   # or https://<name>.workers.dev/api/chat
  github:
    enabled: true
    mode: 'url'                           # or 'proxy' to use /api/github routes
```

## GitHub routes

For proxy-mode issue/PR creation, set a GitHub token:

```bash
wrangler secret put GITHUB_TOKEN
```

A fine-grained personal access token scoped to the site repository with
**Issues: RW**, **Contents: RW**, **Pull requests: RW**. Issues/PRs created
here are authored by the token's owner — a dedicated machine account keeps
chat-created activity clearly attributed.

## Security notes

- OAuth mode = your personal account. Cloudflare Access is mandatory, not optional.
- `ALLOWED_ORIGINS` is a secondary gate (Origin headers are spoofable by
  non-browser clients) — Cloudflare Access is the real one.
- `CHAT_MODEL` and `MAX_TOKENS_CAP` are enforced server-side, so a tampered
  client cannot pick a more expensive model or unbounded output.
- The KV namespace stores live tokens — keep the worker and its KV private to
  your account.

## Porting to other platforms

The worker is a single fetch handler. It ports to Netlify Edge / Vercel Edge /
Deno Deploy by adapting the export signature, reading secrets from the
platform's environment, and swapping the KV calls for that platform's KV/store.
