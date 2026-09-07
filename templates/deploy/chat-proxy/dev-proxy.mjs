#!/usr/bin/env node
// Feature: ZER0-060
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
 * Dev-only routes (never on the Worker — they touch the local machine):
 *   GET  /api/page/source, POST /api/page/update   edit the current page (page-store.mjs)
 *   GET  /api/wizard/status                        auth mode + what the Site Builder may do
 *   POST /api/wizard/check      {id}               allow-listed prerequisite check
 *   GET  /api/wizard/file?path= / /api/wizard/ls   read theme source (wizard-store.mjs)
 *   POST /api/wizard/target     {target}           resolve + inspect a scaffold folder
 *   POST /api/wizard/scaffold   {target, files[]}  write the generated site
 *   POST /api/wizard/compose    {target, action}   docker compose up|ps|logs|down (streamed)
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
import * as wizardStore from './wizard-store.mjs';

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
// These routes touch the local filesystem (and, for the Site Builder, docker),
// so a browser Origin must be on the same allowlist the Worker routes use.
// A request with NO Origin header is a local non-browser client (curl, a
// script) and is allowed — the threat model here is a hostile web page, which
// always sends one. Returns false (after answering 403) when the origin is
// not allowed.
const LOCAL_ALLOWED_ORIGINS = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

function pageCors(req, res) {
  const origin = req.headers.origin;
  if (origin && !LOCAL_ALLOWED_ORIGINS.includes(origin)) {
    res.statusCode = 403;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { message: 'Origin not allowed' } }));
    return false;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  return true;
}

async function handlePageRoute(req, res, url) {
  if (!pageCors(req, res)) return undefined;
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

// Site Builder routes (DEV ONLY — not present on the Worker). Everything here
// is bounded by wizard-store.mjs: fixed check commands, read-only theme source,
// writes only into a fresh project folder under WIZARD_TARGET_ROOT, and a
// fixed set of `docker compose` actions in that folder.
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) || {}; } catch { return {}; }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function handleWizardRoute(req, res, url) {
  if (!pageCors(req, res)) return undefined;
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  try {
    const route = url.pathname.replace(/^\/api\/wizard\/?/, '');

    if (route === 'status' && req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        auth: mode,
        model: env.CHAT_MODEL,
        checks: wizardStore.checkIds(),
        scaffold: { root: wizardStore.targetRoot(), theme: wizardStore.repoRoot() },
        compose: wizardStore.composeEnabled() ? wizardStore.composeActions() : [],
        localEdit: true,
      });
    }
    if (route === 'check' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await wizardStore.runCheck(String(body.id || ''));
      return sendJson(res, 200, result);
    }
    if (route === 'file' && req.method === 'GET') {
      const r = await wizardStore.readThemeFile(url.searchParams.get('path'));
      return sendJson(res, r.ok ? 200 : 400, r.ok ? r : { error: { message: r.error } });
    }
    if (route === 'ls' && req.method === 'GET') {
      const r = await wizardStore.listThemeDir(url.searchParams.get('path'));
      return sendJson(res, r.ok ? 200 : 400, r.ok ? r : { error: { message: r.error } });
    }
    if (route === 'target' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.resolveTarget(body.target);
      return sendJson(res, r.ok ? 200 : 400, r.ok ? r : { error: { message: r.error } });
    }
    if (route === 'scaffold' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.scaffold(body.target, body.files, { overwrite: body.overwrite === true });
      if (r.ok) console.log(`[chat-dev-proxy] scaffolded ${r.written.length} file(s) into ${r.target}`);
      return sendJson(res, r.ok ? 200 : 400, r.ok ? r : { error: { message: r.error } });
    }
    if (route === 'compose' && req.method === 'POST') {
      const body = await readJsonBody(req);
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-content-type-options', 'nosniff');
      res.flushHeaders();
      const r = await wizardStore.compose(String(body.target || ''), String(body.action || ''), (chunk) => res.write(chunk));
      if (!r.ok && r.error) res.write(`\n[error] ${r.error}\n`);
      res.write(`\n[exit] ${r.ok ? 'ok' : 'failed'}${typeof r.code === 'number' ? ` (code ${r.code})` : ''}\n`);
      console.log(`[chat-dev-proxy] compose ${body.action} in ${body.target}: ${r.ok ? 'ok' : r.error || `exit ${r.code}`}`);
      return res.end();
    }
    return sendJson(res, 404, { error: { message: 'not found' } });
  } catch (err) {
    return sendJson(res, 500, { error: { message: err.message || 'Internal error' } });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname.startsWith('/api/page/')) {
      return await handlePageRoute(req, res, reqUrl);
    }
    if (reqUrl.pathname.startsWith('/api/wizard/')) {
      return await handleWizardRoute(req, res, reqUrl);
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
  console.log(`[chat-dev-proxy] site builder enabled — new sites scaffold under ${wizardStore.targetRoot()}` +
    (wizardStore.composeEnabled() ? ' (docker compose actions on)' : ' (compose actions OFF)'));
  if (!env.GITHUB_TOKEN) {
    console.log('[chat-dev-proxy] GITHUB_TOKEN unset — proxy-mode issue/PR routes disabled (url mode still works).');
  }
});
