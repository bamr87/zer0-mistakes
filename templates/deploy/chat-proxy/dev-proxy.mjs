#!/usr/bin/env node
/**
 * ===================================================================
 * Local development chat proxy
 * ===================================================================
 *
 * File: dev-proxy.mjs
 * Path: templates/deploy/chat-proxy/dev-proxy.mjs
 * Purpose: Runs the production Worker logic (worker.js) on Node so the AI
 *          chat assistant works on http://localhost during local development.
 *          A static Jekyll site can't hold a secret or proxy API calls, so
 *          this tiny server reads the credential from your environment and
 *          forwards /api/chat (and the GitHub routes) to Anthropic.
 *
 * Credentials (read from the environment — use Node's --env-file):
 *   CLAUDE_CODE_OAUTH_TOKEN   preferred for local dev — long-lived token from
 *                             `claude setup-token`
 *   ANTHROPIC_API_KEY         alternative
 *   GITHUB_TOKEN + GITHUB_REPOSITORY   optional — to test proxy-mode issue/PR
 *
 * Run (from the repo root):
 *   node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs
 *
 * Then point the widget at it (already wired in _config_dev.yml):
 *   ai_chat:
 *     auth_mode: proxy
 *     proxy_ready: true
 *     endpoint: 'http://localhost:8787/api/chat'
 *
 * Notes:
 *   - Rotating-refresh OAuth mode is NOT supported here (it needs Cloudflare
 *     KV). Use CLAUDE_CODE_OAUTH_TOKEN for local dev — it's long-lived.
 *   - This file is dev-only reference tooling; it is not shipped in the gem.
 * ===================================================================
 */

import http from 'node:http';
import { Readable } from 'node:stream';
import worker from './worker.js';

const PORT = Number(process.env.CHAT_DEV_PROXY_PORT) || 8787;

const env = {
  CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || process.env.PAGES_REPO_NWO,
  BASE_BRANCH: process.env.BASE_BRANCH || 'main',
  PR_BRANCH_PREFIX: process.env.PR_BRANCH_PREFIX || 'chat/',
  CHAT_MODEL: process.env.CHAT_MODEL || 'claude-opus-4-8',
  MAX_TOKENS_CAP: process.env.MAX_TOKENS_CAP || '4096',
  // Allow the local Jekyll dev server origins by default.
  ALLOWED_ORIGINS:
    process.env.CHAT_DEV_ALLOWED_ORIGINS ||
    'http://localhost:4000,http://127.0.0.1:4000',
  REQUIRE_CF_ACCESS: 'false', // local only — no Cloudflare Access in front
};

if (process.env.ANTHROPIC_OAUTH_REFRESH_TOKEN) {
  console.warn(
    '[chat-dev-proxy] ANTHROPIC_OAUTH_REFRESH_TOKEN is set but rotating OAuth needs Cloudflare KV.\n' +
      '                 For local dev use CLAUDE_CODE_OAUTH_TOKEN (`claude setup-token`) instead.'
  );
}

const mode = env.CLAUDE_CODE_OAUTH_TOKEN
  ? 'CLAUDE_CODE_OAUTH_TOKEN'
  : env.ANTHROPIC_API_KEY
    ? 'ANTHROPIC_API_KEY'
    : null;

if (!mode) {
  console.error(
    '[chat-dev-proxy] No Anthropic credential found.\n' +
      '  Set CLAUDE_CODE_OAUTH_TOKEN (recommended) or ANTHROPIC_API_KEY, e.g.:\n' +
      '    node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs'
  );
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value != null) headers.set(key, Array.isArray(value) ? value.join(',') : value);
    }

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const request = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers,
      body,
    });

    const response = await worker.fetch(request, env);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { message: err.message || 'Internal error' } }));
  }
});

server.listen(PORT, () => {
  console.log(`[chat-dev-proxy] listening on http://localhost:${PORT}  (auth: ${mode})`);
  console.log(`[chat-dev-proxy] point ai_chat.endpoint at http://localhost:${PORT}/api/chat`);
  if (!env.GITHUB_TOKEN) {
    console.log('[chat-dev-proxy] GITHUB_TOKEN unset — proxy-mode issue/PR routes disabled (url mode still works).');
  }
});
