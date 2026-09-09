#!/usr/bin/env node
// Feature: ZER0-060
// Feature: ZER0-086
// Feature: ZER0-087
/**
 * ===================================================================
 * Local development chat proxy
 * ===================================================================
 *
 * File: dev-proxy.mjs
 * Path: templates/deploy/chat-proxy/dev-proxy.mjs
 * Purpose: Runs the production Worker logic (worker.js) on Node so the AI
 *          chat assistant and the Site Builder work on http://localhost
 *          during local development. A static Jekyll site can't hold a
 *          secret or proxy API calls, so this tiny server reads credentials
 *          from your environment (or takes one from the Site Builder's
 *          Connect step at runtime) and forwards /api/chat to the provider.
 *
 * Providers — Claude (Anthropic) or Grok (xAI). Credentials, read from the
 * environment (use Node's --env-file) or handed over at runtime:
 *   CLAUDE_CODE_OAUTH_TOKEN   Claude — long-lived token from `claude setup-token`
 *   ANTHROPIC_API_KEY         Claude — API key alternative
 *   XAI_API_KEY               Grok  — key from console.x.ai (chat + Grok Imagine)
 *   OPENAI_API_KEY            optional second image renderer (gpt-image)
 *   CHAT_PROVIDER             auto (default) | anthropic | xai — pin the provider
 *   CHAT_MODEL / XAI_CHAT_MODEL   pin a model; unset = the page may pick from
 *                             the catalog in _data/site_builder.yml
 *   XAI_IMAGE_MODEL / OPENAI_IMAGE_MODEL / IMAGE_PROVIDER   image renderer pins
 *   GITHUB_TOKEN + GITHUB_REPOSITORY   optional — to test proxy-mode issue/PR
 *
 * Run (from the repo root):
 *   node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs
 * With NO credential in the environment the proxy still starts: the Site
 * Builder's Connect step can hand it a token for this run (kept in memory,
 * never in the page) and optionally save it to .env for next time.
 *
 * Then point the widget at it (already wired in _config_dev.yml):
 *   ai_chat:
 *     auth_mode: proxy
 *     proxy_ready: true
 *     endpoint: 'http://localhost:8787/api/chat'
 *
 * Dev-only routes (never on the Worker — they touch the local machine):
 *   GET  /api/page/source, POST /api/page/update   edit the current page (page-store.mjs)
 *   GET  /api/wizard/status                        providers, auth, what the Site Builder may do
 *   POST /api/wizard/credentials  {provider, token, persist?, test?}   bring your own key (session)
 *   DELETE /api/wizard/credentials?provider=       forget a session credential
 *   POST /api/wizard/check      {id}               allow-listed prerequisite check
 *   GET  /api/wizard/file?path= / /api/wizard/ls   read theme source (wizard-store.mjs)
 *   POST /api/wizard/target     {target}           resolve + inspect a project folder
 *   POST /api/wizard/scaffold   {target, files[]}  write the generated site
 *   POST /api/wizard/compose    {target, action}   docker compose up|ps|logs|down|config|build (streamed)
 *   GET  /api/wizard/projects                      existing sites under WIZARD_TARGET_ROOT
 *   GET  /api/wizard/project/{ls,file,tree}?target=&path=   read a project
 *   POST /api/wizard/project/{write,edit,delete}   change ONE project file (allow-listed)
 *   POST /api/wizard/project/command {target, id}  fixed git commands
 *   POST /api/wizard/image      {target, path, prompt, provider?}  render an image into assets/
 *   GET  /api/wizard/asset?target=&path=           serve a project image for previews
 *
 * Notes:
 *   - Rotating-refresh OAuth mode is NOT supported here (it needs Cloudflare
 *     KV). Use CLAUDE_CODE_OAUTH_TOKEN for local dev — it's long-lived.
 *   - This file is dev-only reference tooling; it is not shipped in the gem.
 * ===================================================================
 */

import http from 'node:http';
import { Readable } from 'node:stream';
import worker, { probeProvider } from './worker.js';
import * as pageStore from './page-store.mjs';
import * as wizardStore from './wizard-store.mjs';
import * as credentials from './credential-store.mjs';
import {
  PROVIDERS,
  IMAGE_PROVIDERS,
  configuredProviders,
  configuredImageProviders,
  selectProvider,
  resolveModel,
  selectImageProvider,
  resolveImageModel,
  imageRequest,
  imageEndpoint,
  bearerHeaders,
  extractImage,
  normalizeUpstreamError,
} from './providers.js';

const PORT = Number(process.env.CHAT_DEV_PROXY_PORT) || 8787;
const IMAGE_TIMEOUT_MS = 180_000;
const MAX_IMAGE_DOWNLOAD = 8 * 1024 * 1024;

// The environment the Worker logic sees. Session credentials handed over by the
// Site Builder are layered on top per request (effectiveEnv), so a token
// entered in the browser works without a restart and never touches this object.
const baseEnv = {
  CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  XAI_API_KEY: process.env.XAI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CHAT_PROVIDER: process.env.CHAT_PROVIDER || 'auto',
  // Unset by default in dev so the Site Builder can offer the model catalog;
  // set CHAT_MODEL / XAI_CHAT_MODEL to pin one exactly like the Worker does.
  CHAT_MODEL: process.env.CHAT_MODEL,
  XAI_CHAT_MODEL: process.env.XAI_CHAT_MODEL,
  XAI_IMAGE_MODEL: process.env.XAI_IMAGE_MODEL,
  OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL,
  IMAGE_PROVIDER: process.env.IMAGE_PROVIDER || 'auto',
  XAI_BASE_URL: process.env.XAI_BASE_URL,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || process.env.PAGES_REPO_NWO,
  BASE_BRANCH: process.env.BASE_BRANCH || 'main',
  PR_BRANCH_PREFIX: process.env.PR_BRANCH_PREFIX || 'chat/',
  // Open sessions write whole files through tool calls, so the local cap is
  // higher than the public Worker's 4096. Your key, your machine, your call.
  MAX_TOKENS_CAP: process.env.MAX_TOKENS_CAP || '8192',
  // Allow the local Jekyll dev server origins by default.
  ALLOWED_ORIGINS:
    process.env.CHAT_DEV_ALLOWED_ORIGINS ||
    'http://localhost:4000,http://127.0.0.1:4000',
  REQUIRE_CF_ACCESS: 'false', // local only — no Cloudflare Access in front
};

function effectiveEnv() { return credentials.applyTo(baseEnv); }

if (process.env.ANTHROPIC_OAUTH_REFRESH_TOKEN) {
  console.warn(
    '[chat-dev-proxy] ANTHROPIC_OAUTH_REFRESH_TOKEN is set but rotating OAuth needs Cloudflare KV.\n' +
      '                 For local dev use CLAUDE_CODE_OAUTH_TOKEN (`claude setup-token`) instead.'
  );
}

/** The chat provider a request would use right now, described without secrets. */
function authSummary(env) {
  const provider = selectProvider(env);
  if (!provider) return null;
  const creds = credentials.summary(baseEnv)[provider] || {};
  return {
    provider,
    label: PROVIDERS[provider].label,
    vendor: PROVIDERS[provider].vendor,
    kind: configuredProviders(env)[provider],
    source: creds.source,
    masked: creds.masked,
    model: resolveModel(env, provider),
    pinned: Boolean(env[PROVIDERS[provider].modelVar]),
  };
}

function providerCatalog(env) {
  const creds = credentials.summary(baseEnv);
  const conf = configuredProviders(env);
  const out = {};
  for (const id of Object.keys(PROVIDERS)) {
    const p = PROVIDERS[id];
    out[id] = {
      id,
      label: p.label,
      vendor: p.vendor,
      configured: Boolean(conf[id]),
      kind: conf[id],
      source: creds[id] ? creds[id].source : null,
      masked: creds[id] ? creds[id].masked : '',
      models: p.models,
      defaultModel: p.defaultModel,
      model: resolveModel(env, id),
      pinned: Boolean(env[p.modelVar]),
      tokenHint: p.tokenHint,
      console: p.console,
    };
  }
  return out;
}

function imageCatalog(env) {
  const creds = credentials.summary(baseEnv);
  const conf = configuredImageProviders(env);
  const providers = {};
  for (const id of Object.keys(IMAGE_PROVIDERS)) {
    const p = IMAGE_PROVIDERS[id];
    providers[id] = {
      id,
      label: p.label,
      vendor: p.vendor,
      configured: Boolean(conf[id]),
      source: creds[id] ? creds[id].source : null,
      masked: creds[id] ? creds[id].masked : '',
      models: p.models,
      model: resolveImageModel(env, id),
      aspectRatios: p.aspectRatios || [],
      sizes: p.sizes || [],
    };
  }
  return { providers, default: selectImageProvider(env) };
}

function describeAuth(env) {
  const a = authSummary(env);
  return a ? `${a.label} (${a.vendor}) via ${a.source === 'session' ? 'session token' : a.kind}` : 'no credential yet (enter one in the Site Builder, or set it in .env)';
}

// Local page read/write routes (DEV ONLY — not present on the Worker).
// These let the assistant edit the current page's source file on disk.
// These routes touch the local filesystem (and, for the Site Builder, docker),
// so a browser Origin must be on the same allowlist the Worker routes use.
// A request with NO Origin header is a local non-browser client (curl, a
// script) and is allowed — the threat model here is a hostile web page, which
// always sends one. Returns false (after answering 403) when the origin is
// not allowed.
const LOCAL_ALLOWED_ORIGINS = baseEnv.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
      const body = await readJsonBody(req);
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
// writes only into a project folder under WIZARD_TARGET_ROOT, and a fixed set
// of `docker compose` / git actions in that folder. Credentials are bounded by
// credential-store.mjs (memory only; .env on explicit request).
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) || {}; } catch { return {}; }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendResult(res, r) {
  return sendJson(res, r.ok ? 200 : 400, r.ok ? r : { error: { message: r.error }, exists: r.exists });
}

async function statusPayload() {
  const env = effectiveEnv();
  const projects = await wizardStore.listProjects();
  return {
    ok: true,
    auth: authSummary(env),
    providerPin: String(env.CHAT_PROVIDER || 'auto').toLowerCase(),
    providers: providerCatalog(env),
    image: imageCatalog(env),
    credentials: { accepted: true, persistAllowed: true, envFile: credentials.envFile() },
    checks: wizardStore.checkIds(),
    scaffold: { root: wizardStore.targetRoot(), theme: wizardStore.repoRoot() },
    compose: wizardStore.composeEnabled() ? wizardStore.composeActions() : [],
    projectCommands: wizardStore.projectCommandIds(),
    projects: projects.ok ? projects.projects : [],
    maxTokensCap: Number(env.MAX_TOKENS_CAP) || 0,
    localEdit: true,
    // Kept for older clients that read a flat model string.
    model: (authSummary(env) || {}).model || null,
  };
}

async function handleCredentials(req, res, url) {
  if (req.method === 'DELETE') {
    const provider = String(url.searchParams.get('provider') || '');
    const r = credentials.clear(provider);
    console.log(`[chat-dev-proxy] session credential forgotten: ${provider}`);
    return sendJson(res, 200, Object.assign(r, { auth: authSummary(effectiveEnv()) }));
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: { message: 'method not allowed' } });
  const body = await readJsonBody(req);
  const provider = String(body.provider || '').toLowerCase();
  if (!credentials.knownProvider(provider)) return sendJson(res, 400, { error: { message: `unknown provider: ${provider}` } });
  const set = credentials.set(provider, body.token);
  if (!set.ok) return sendJson(res, 400, { error: { message: set.error } });

  // Prove the token works before we keep it — one cheap request.
  const test = body.test !== false && PROVIDERS[provider];
  if (test) {
    const probe = await probeProvider(effectiveEnv(), provider);
    if (!probe.ok) {
      credentials.clear(provider);
      console.log(`[chat-dev-proxy] ${provider} credential rejected (${probe.status || 'network'})`);
      return sendJson(res, probe.status === 401 || probe.status === 403 ? 401 : 502, {
        error: { message: `${PROVIDERS[provider].vendor} rejected the token: ${probe.message || 'unknown error'}` },
      });
    }
  }
  let persisted = null;
  if (body.persist === true) {
    const saved = await credentials.persist(provider);
    if (!saved.ok) return sendJson(res, 500, { error: { message: saved.error } });
    persisted = { file: saved.file, key: saved.key };
    console.log(`[chat-dev-proxy] ${saved.key} saved to ${saved.file} (mode 600)`);
  }
  console.log(`[chat-dev-proxy] session credential set for ${provider} (${set.kind}, ${set.masked})`);
  return sendJson(res, 200, Object.assign({}, set, { persisted, auth: authSummary(effectiveEnv()) }));
}

async function fetchImageBytes(image) {
  if (image.b64) return Buffer.from(image.b64, 'base64');
  if (image.url && /^https:\/\//i.test(image.url)) {
    const resp = await fetch(image.url, { signal: AbortSignal.timeout(60_000) });
    if (!resp.ok) throw new Error(`image download failed (${resp.status})`);
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length > MAX_IMAGE_DOWNLOAD) throw new Error('image too large');
    return buf;
  }
  throw new Error('no image data in the response');
}

async function handleImage(req, res) {
  const body = await readJsonBody(req);
  const env = effectiveEnv();
  const provider = selectImageProvider(env, body.provider);
  if (!provider) return sendJson(res, 501, { error: { message: 'No image provider credential configured (XAI_API_KEY for Grok Imagine, OPENAI_API_KEY for OpenAI Images)' } });
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return sendJson(res, 400, { error: { message: 'prompt is required' } });
  const model = resolveImageModel(env, provider, body.model);
  const payload = imageRequest(provider, { prompt, model, n: 1, aspectRatio: body.aspect_ratio, quality: body.quality, size: body.size });
  let upstream;
  try {
    upstream = await fetch(imageEndpoint(provider, env), {
      method: 'POST',
      headers: bearerHeaders(provider, env),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
  } catch (err) {
    return sendJson(res, 502, { error: { message: `image request failed: ${err.message}` } });
  }
  const json = await upstream.json().catch(() => null);
  if (!upstream.ok) return sendJson(res, upstream.status || 502, normalizeUpstreamError(upstream.status, json));
  const image = extractImage(json);
  if (!image) return sendJson(res, 502, { error: { message: 'no image in the provider response' } });
  let bytes;
  try { bytes = await fetchImageBytes(image); } catch (err) { return sendJson(res, 502, { error: { message: err.message } }); }
  const r = await wizardStore.writeProjectAsset(body.target, body.path, bytes, { overwrite: body.overwrite === true });
  if (!r.ok) return sendResult(res, r);
  console.log(`[chat-dev-proxy] image rendered by ${provider}/${model} → ${r.path} (${r.bytes} bytes)`);
  return sendJson(res, 200, { ok: true, target: r.target, path: r.path, bytes: r.bytes, type: r.type, replaced: r.replaced, provider, model, revised_prompt: image.revisedPrompt || '' });
}

async function handleWizardRoute(req, res, url) {
  if (!pageCors(req, res)) return undefined;
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  try {
    const route = url.pathname.replace(/^\/api\/wizard\/?/, '');
    const q = (name) => url.searchParams.get(name);

    if (route === 'status' && req.method === 'GET') return sendJson(res, 200, await statusPayload());
    if (route === 'credentials') return handleCredentials(req, res, url);
    if (route === 'check' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return sendJson(res, 200, await wizardStore.runCheck(String(body.id || '')));
    }
    if (route === 'file' && req.method === 'GET') return sendResult(res, await wizardStore.readThemeFile(q('path')));
    if (route === 'ls' && req.method === 'GET') return sendResult(res, await wizardStore.listThemeDir(q('path')));
    if (route === 'target' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return sendResult(res, await wizardStore.resolveTarget(body.target));
    }
    if (route === 'scaffold' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.scaffold(body.target, body.files, { overwrite: body.overwrite === true });
      if (r.ok) console.log(`[chat-dev-proxy] scaffolded ${r.written.length} file(s) into ${r.target}`);
      return sendResult(res, r);
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

    // --- project session -------------------------------------------------
    if (route === 'projects' && req.method === 'GET') return sendResult(res, await wizardStore.listProjects());
    if (route === 'project/ls' && req.method === 'GET') return sendResult(res, await wizardStore.listProjectDir(q('target'), q('path') || '.'));
    if (route === 'project/tree' && req.method === 'GET') return sendResult(res, await wizardStore.projectTree(q('target'), q('path') || '.', Number(q('depth')) || undefined));
    if (route === 'project/file' && req.method === 'GET') return sendResult(res, await wizardStore.readProjectFile(q('target'), q('path')));
    if (route === 'project/write' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.writeProjectFile(body.target, body.path, body.content, { overwrite: body.overwrite === true });
      if (r.ok) console.log(`[chat-dev-proxy] wrote ${r.path} (${r.bytes} bytes) in ${r.target}`);
      return sendResult(res, r);
    }
    if (route === 'project/edit' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.editProjectFile(body.target, body.path, body.find, body.replace, { all: body.all === true });
      if (r.ok) console.log(`[chat-dev-proxy] edited ${r.path} (${r.replacements} replacement(s)) in ${r.target}`);
      return sendResult(res, r);
    }
    if (route === 'project/delete' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.deleteProjectFile(body.target, body.path);
      if (r.ok) console.log(`[chat-dev-proxy] deleted ${r.path} in ${r.target}`);
      return sendResult(res, r);
    }
    if (route === 'project/command' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const r = await wizardStore.runProjectCommand(body.target, String(body.id || ''));
      return sendJson(res, r.ok || r.output !== undefined ? 200 : 400, r.ok || r.output !== undefined ? r : { error: { message: r.error } });
    }
    if (route === 'image' && req.method === 'POST') return handleImage(req, res);
    if (route === 'asset' && req.method === 'GET') {
      const r = await wizardStore.readProjectAsset(q('target'), q('path'));
      if (!r.ok) return sendJson(res, 404, { error: { message: r.error } });
      res.statusCode = 200;
      res.setHeader('content-type', r.contentType);
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-content-type-options', 'nosniff');
      return res.end(r.bytes);
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

    const response = await worker.fetch(request, effectiveEnv());
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
  const env = effectiveEnv();
  console.log(`[chat-dev-proxy] listening on http://localhost:${PORT}  (chat: ${describeAuth(env)})`);
  const img = selectImageProvider(env);
  console.log(`[chat-dev-proxy] image generation: ${img ? `${IMAGE_PROVIDERS[img].label} (${resolveImageModel(env, img)})` : 'off — set XAI_API_KEY or OPENAI_API_KEY, or add one in the Site Builder'}`);
  console.log(`[chat-dev-proxy] point ai_chat.endpoint at http://localhost:${PORT}/api/chat`);
  console.log(`[chat-dev-proxy] local page editing enabled — writes under ${pageStore.repoRoot()}`);
  console.log(`[chat-dev-proxy] site builder enabled — sites live under ${wizardStore.targetRoot()}` +
    (wizardStore.composeEnabled() ? ' (docker compose actions on)' : ' (compose actions OFF)'));
  if (!authSummary(env)) {
    console.log('[chat-dev-proxy] no chat credential yet — open /setup/ and connect Claude or Grok from the Connect step, or set it in .env.');
  }
  if (!env.GITHUB_TOKEN) {
    console.log('[chat-dev-proxy] GITHUB_TOKEN unset — proxy-mode issue/PR routes disabled (url mode still works).');
  }
});
