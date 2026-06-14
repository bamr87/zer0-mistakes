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
import * as pageStore from './page-store.mjs';

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

// Local page read/write routes (DEV ONLY — not present on the Worker).
// These let the assistant edit the current page's source file on disk.
function pageCors(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}

async function handlePageRoute(req, res, url) {
  pageCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  res.setHeader('content-type', 'application/json');
  try {
    if (url.pathname === '/api/page/source' && req.method === 'GET') {
      const r = await pageStore.readPage(url.searchParams.get('path'));
      res.statusCode = r.ok ? 200 : 400;
      return res.end(JSON.stringify(r.ok ? { path: r.path, content: r.content } : { error: { message: r.error } }));
    }
    if (url.pathname === '/api/page/update' && req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let body = {};
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* invalid json */ }
      const r = await pageStore.writePage(body.file_path, body.updated_content);
      if (r.ok) console.log(`[chat-dev-proxy] page updated: ${r.path} (${r.bytes} bytes)`);
      res.statusCode = r.ok ? 200 : 400;
      return res.end(JSON.stringify(r.ok ? { path: r.path, bytes: r.bytes } : { error: { message: r.error } }));
    }
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: { message: 'not found' } }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: { message: err.message || 'Internal error' } }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname.startsWith('/api/page/')) {
      return await handlePageRoute(req, res, reqUrl);
    }

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
  console.log(`[chat-dev-proxy] local page editing enabled — writes under ${pageStore.repoRoot()}`);
  if (!env.GITHUB_TOKEN) {
    console.log('[chat-dev-proxy] GITHUB_TOKEN unset — proxy-mode issue/PR routes disabled (url mode still works).');
  }
});
