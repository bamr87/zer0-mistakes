# AI Chat Proxy (Cloudflare Worker)

Server-side companion for the theme's AI chat assistant ([`_includes/components/ai-chat.html`](../../../_includes/components/ai-chat.html) + [`assets/js/ai-chat.js`](../../../assets/js/ai-chat.js)) and the Site Builder session. GitHub Pages is static-only, so the widget delegates everything that needs a secret to this proxy. The site stays on GitHub Pages; only `/api/*` is handled here.

The proxy answers with **Claude (Anthropic)** or **Grok (xAI)** — see [Providers](#providers--claude-or-grok). Every client speaks the Anthropic Messages dialect; for Grok the proxy translates the request to xAI's OpenAI-compatible API and converts the reply stream back, so switching providers is a server-side decision ([`providers.js`](providers.js)).

## What it serves

| Route | Purpose |
| --- | --- |
| `POST /api/chat` | Forwards the widget's request to the selected provider — the Claude Messages API (`https://api.anthropic.com/v1/messages`, SSE passed through unchanged) or xAI's `https://api.x.ai/v1/chat/completions` (translated to and from the Anthropic dialect) — and streams Anthropic-shaped SSE back. |
| `POST /api/feedback` | Triage a page-feedback capture into a JSON issue draft (either provider). |
| `POST /api/github/issue` | Creates a GitHub issue (`{title, body, labels}` → `{url, number}`). |
| `POST /api/github/pull-request` | Creates a branch from `BASE_BRANCH`, commits one updated file, opens a pull request. |

The GitHub routes are only needed when `ai_chat.github.mode: 'proxy'`. In the default `'url'` mode the widget opens pre-filled github.com forms instead and no token is required.

## Local development (no Cloudflare needed)

A static Jekyll site can't proxy API calls, so for local dev run [`dev-proxy.mjs`](dev-proxy.mjs) — it executes this same `worker.js` on Node and reads your credential from `.env`:

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

`_config_dev.yml` already points the widget at `http://localhost:8787/api/chat`, so the chat works at `http://localhost:4000` with no Cloudflare or Worker deployment. The dev proxy uses the long-lived token directly (no KV/refresh).

**No token yet? Start the proxy anyway.** It comes up in an "awaiting credential" state and the Site Builder's Connect step (`/setup/`) can hand it a Claude token or an xAI key for the run — see [Bring your own key](#bring-your-own-key-dev-proxy-only). Prefer Grok? Put `XAI_API_KEY=xai-…` in `.env` instead (or as well: `CHAT_PROVIDER` picks).

### Bring your own key (dev proxy only)

The Connect step posts a token **once** to `POST /api/wizard/credentials` on the localhost proxy. [`credential-store.mjs`](credential-store.mjs) keeps it in the process's memory, replaces that provider's environment credentials for the rest of the run (so a fresh key is never shadowed by a stale `CLAUDE_CODE_OAUTH_TOKEN`), proves it with one cheap upstream call, and reports it back **masked** (`••••c3f9`). Tick "save it to `.env`" and the proxy upserts the line itself (file mode 600). `DELETE /api/wizard/credentials?provider=` forgets it. The page never stores a token, and the client refuses to send one anywhere but a `localhost` endpoint. The Worker has no such route — its secrets come from wrangler.

### Site Builder routes (dev proxy only)

The same dev proxy powers the guided **Site Builder** at `/setup/` ([`_includes/setup/wizard.html`](../../../_includes/setup/wizard.html) + [`assets/js/site-builder.js`](../../../assets/js/site-builder.js)). These routes touch the local machine, so they live only in `dev-proxy.mjs` and are bounded by [`wizard-store.mjs`](wizard-store.mjs):

| Route | Purpose | Bound by |
| --- | --- | --- |
| `GET /api/wizard/status` | Active provider (masked), provider + image-renderer catalogs, model pins, check ids, scaffold root, compose actions, project commands, existing sites | — |
| `POST /api/wizard/credentials` `{provider, token, persist?, test?}` / `DELETE …?provider=` | Session credential for Claude, Grok or OpenAI (images); optionally written to `.env` | shape-checked, probed upstream, memory only, masked in every response |
| `POST /api/wizard/check` `{id}` | One allow-listed read-only command (`docker`, `compose`, `docker-daemon`, `git`, `git-config`, `gh`, `gh-auth`, `code`, `node`, `ruby`, `bundle`, `claude`) | fixed command table; emails redacted |
| `GET /api/wizard/file?path=` / `GET /api/wizard/ls?path=` | Read theme source / list a theme directory | inside the checkout only; `.env*`, keys, `.git`, `node_modules`, `vendor`, `_site` denied; text extensions only |
| `POST /api/wizard/target` `{target}` | Resolve the project folder and say whether it exists / is empty | strict sub-dir of `WIZARD_TARGET_ROOT`, never inside the theme |
| `POST /api/wizard/scaffold` `{target, files[], overwrite?}` | Write the generated site | same root rule; relative paths; allow-listed names; ≤ 60 files, ≤ 200 KB each; no overwrite unless asked |
| `POST /api/wizard/compose` `{target, action}` | `docker compose up -d --build` / `ps` / `logs` / `down` / `config` / `build` (`jekyll build` inside the running container) in the written project, output streamed as text | folder must hold `docker-compose.yml` |
| `GET /api/wizard/projects` | Sites under the target root (folders with `_config.yml` / `docker-compose.yml`) | never the theme checkout |
| `GET /api/wizard/project/{ls,file,tree}?target=&path=` | Read an existing site | inside that project; same denylist and text-only rules as theme reads |
| `POST /api/wizard/project/{write,edit,delete}` | Change ONE text file (`edit` = exact snippet, unique unless `all`) | allow-listed names, size caps, no overwrite unless asked, files only |
| `POST /api/wizard/project/command` `{target, id}` | `git-status`, `git-diff`, `git-log`, `git-init` | fixed table; emails redacted |
| `POST /api/wizard/image` `{target, path, prompt, provider?, aspect_ratio?, quality?}` | Render with Grok Imagine (`XAI_API_KEY`) or OpenAI Images (`OPENAI_API_KEY`) into the project | `assets/**.{png,jpg,webp}` only, bytes sniffed, ≤ 8 MB |
| `GET /api/wizard/asset?target=&path=` | Serve a project image for the preview card | same path rules |

Environment: `WIZARD_TARGET_ROOT` (default: the theme's parent directory), `WIZARD_DISABLE_COMPOSE=1` to switch the compose actions off, `CHAT_DEV_ENV_FILE` (where "save to `.env`" writes; default `<repo>/.env`), and `MAX_TOKENS_CAP` (dev default 8192 — open sessions write whole files). `_config_dev.yml` points `site_builder.endpoint` at `http://localhost:8787/api/wizard`.

## Providers — Claude or Grok

| Provider | Secret | Model pin (default) | Upstream |
| --- | --- | --- | --- |
| `anthropic` (Claude) | one of the three Anthropic modes below | `CHAT_MODEL` (`claude-opus-4-8`) | `https://api.anthropic.com/v1/messages` (`ANTHROPIC_BASE_URL` overrides) |
| `xai` (Grok) | `XAI_API_KEY` (`wrangler secret put XAI_API_KEY`) | `XAI_CHAT_MODEL` (`grok-4.6`) | `https://api.x.ai/v1/chat/completions` (`XAI_BASE_URL` overrides) |

`CHAT_PROVIDER` pins the provider (`anthropic` | `xai`). `auto` (default) honours the client's `provider` field only when that provider has a secret, else takes the first configured one — Claude, then Grok — so a page can never pick a provider you did not fund. A client model is accepted only from the pinned provider's family (`claude-*` / `grok-*`) and only when no server pin is set. Image rendering (dev proxy) uses `IMAGE_PROVIDER` / `XAI_IMAGE_MODEL` (`grok-imagine-image-2.0`) / `OPENAI_IMAGE_MODEL` (`gpt-image-2`).

The translation lives in [`providers.js`](providers.js) and is pinned by `test/test_providers.mjs` against a local mock of both upstreams: Anthropic `system`/`messages`/`tools` ⇄ OpenAI `messages` (`tool_use` ⇄ `tool_calls`, `tool_result` ⇄ `role: tool`, `input_schema` ⇄ `parameters`), and xAI's `chat.completion.chunk` stream → Anthropic `message_start` / `content_block_*` / `message_delta` events. Grok tool calls arrive whole in one chunk, which becomes one `input_json_delta`.

## Anthropic auth — three modes (auto-detected by precedence)

(Independent of the xAI key: `XAI_API_KEY` configures the `xai` provider; the modes below configure `anthropic`.)

| Precedence | Trigger secret | Header sent | Refresh | Best for |
| --- | --- | --- | --- | --- |
| 1 | `ANTHROPIC_OAUTH_REFRESH_TOKEN` | `Authorization: Bearer` + oauth beta | KV-cached, rotating | Private prod, rotating login |
| 2 | `CLAUDE_CODE_OAUTH_TOKEN` | `Authorization: Bearer` + oauth beta | none (long-lived) | Local dev / simple private |
| 3 | `ANTHROPIC_API_KEY` | `x-api-key` | n/a | Public site (workspace key) |

> **OAuth modes identify as Claude Code.** Anthropic gates subscription OAuth
> tokens (modes 1–2) to Claude Code: the Messages API requires the **first
> `system` block to be the Claude Code identity**, or it rejects the request with
> a *misleading* `429 rate_limit_error` (terse `"message":"Error"` — it is **not**
> an actual rate limit). `handleChat` therefore prepends `"You are Claude Code,
> Anthropic's official CLI for Claude."` as the first system block in OAuth modes,
> keeping the site assistant's own instructions as a second block. API-key mode
> (3) is exempt. If you ever see that 429 with an OAuth token, this is the cause.

### Mode 1 — Rotating OAuth refresh token (private prod)

Authenticates with your **Claude Code / Claude.ai login** and keeps it alive automatically. The worker sends `Authorization: Bearer <token>` plus the `anthropic-beta: oauth-2025-04-20` header.

> ⚠️ **This is a personal, account-scoped credential.** Every request the proxy
> makes runs as *you*, against your Claude subscription. Only deploy it behind
> **Cloudflare Access** so nobody else can reach it (steps below). Do not use
> this mode for a public, unauthenticated site.

OAuth access tokens are short-lived and the refresh token typically **rotates** on each refresh, so the worker caches the current credential in a **KV namespace** and refreshes it with the standard OAuth2 `refresh_token` grant.

**1. Get your OAuth credential.** Log in with the Anthropic CLI (shares the Claude Code credential store):

```bash
ant auth login                       # opens a browser; stores a profile
ant auth status                      # confirm the active profile
```

The credential (refresh token, client id, token endpoint) lives under `~/.config/anthropic/` (`credentials/<profile>.json` / `configs/<profile>.json`). Pull the values you need from there — the worker does **not** hardcode Anthropic's OAuth internals, you supply them.

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

The simplest OAuth option: a non-rotating token from `claude setup-token`, sent as a Bearer token with no KV/refresh machinery. This is what the [local dev proxy](#local-development-no-cloudflare-needed) uses, and it works on the Worker too:

```bash
wrangler secret put CLAUDE_CODE_OAUTH_TOKEN   # value from `claude setup-token`
```

Still a personal credential — keep Cloudflare Access on. Set this and leave the refresh-token secrets unset.

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
rejects any request lacking a Cloudflare Access JWT (defense in depth; the Access policy is the real enforcement).

With this in place the chat only works for you, even though the site is public.

## Deploy

### Via GitHub Actions (this repo's live setup — workers.dev, API key)

[`.github/workflows/deploy-chat-proxy.yml`](../../../.github/workflows/deploy-chat-proxy.yml) deploys [`wrangler.toml`](wrangler.toml) on every push to `main` that touches the proxy (and on manual dispatch), and sets the Worker's `ANTHROPIC_API_KEY` from a GitHub secret. One-time setup:

1. Cloudflare → **My Profile → API Tokens → Create Token → "Edit Cloudflare
   Workers"**. Note your **Account ID** (Workers & Pages overview).
2. Add three **repo → Settings → Secrets and variables → Actions** secrets:
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY`.
3. Merge to `main` (or run the workflow via **Actions → Deploy chat proxy →
Run workflow**). First run creates the Worker and prints its URL: `https://zer0-mistakes-chat-proxy.<your-subdomain>.workers.dev`.
4. Put that URL in `_config.yml` and flip the widget on:

   ```yaml
   ai_chat:
     proxy_ready: true
     endpoint: 'https://zer0-mistakes-chat-proxy.<your-subdomain>.workers.dev/api/chat'
     github:
       endpoint: 'https://zer0-mistakes-chat-proxy.<your-subdomain>.workers.dev/api/github'
   ```

(Cross-origin from GitHub Pages → workers.dev; CORS is handled by the Worker's `ALLOWED_ORIGINS`.)

For proxy-mode issue/PR creation, also add `GITHUB_TOKEN` to the workflow's `secrets:` list with a `CHAT_GITHUB_TOKEN` repo secret mapped in `env:`.

### Manually with wrangler

```bash
cp wrangler.toml.template wrangler.toml   # or edit the committed wrangler.toml
wrangler deploy
```

Either route `your-domain.com/api/*` to the worker (same-origin — requires the domain's DNS on Cloudflare) or use the `*.workers.dev` URL and point `ai_chat.endpoint` / `ai_chat.github.endpoint` at it.

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

A fine-grained personal access token scoped to the site repository with **Issues: RW**, **Contents: RW**, **Pull requests: RW**. Issues/PRs created here are authored by the token's owner — a dedicated machine account keeps chat-created activity clearly attributed.

## Security notes

- OAuth mode = your personal account. Cloudflare Access is mandatory, not optional.
- `ALLOWED_ORIGINS` is a secondary gate (Origin headers are spoofable by
  non-browser clients) — Cloudflare Access is the real one.
- `CHAT_PROVIDER`, `CHAT_MODEL` / `XAI_CHAT_MODEL` and `MAX_TOKENS_CAP` are
enforced server-side, so a tampered client cannot pick another provider, a more expensive model or unbounded output.
- Session credentials exist only in the dev proxy, only in memory, only from a
  browser origin on the local allowlist, and are never echoed back.
- The KV namespace stores live tokens — keep the worker and its KV private to
  your account.

## Porting to other platforms

The worker is a single fetch handler. It ports to Netlify Edge / Vercel Edge / Deno Deploy by adapting the export signature, reading secrets from the platform's environment, and swapping the KV calls for that platform's KV/store.
