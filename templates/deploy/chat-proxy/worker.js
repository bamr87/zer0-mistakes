/**
 * ===================================================================
 * Zer0-Mistakes AI Chat Proxy — Cloudflare Worker
 * ===================================================================
 *
 * File: worker.js
 * Path: templates/deploy/chat-proxy/worker.js
 * Purpose: Server-side proxy for the AI chat assistant
 *          (_includes/components/ai-chat.html + assets/js/ai-chat.js).
 *          Keeps the Anthropic credential and GitHub token out of the
 *          static site entirely.
 *
 * Auth to Anthropic — three modes, auto-detected by precedence:
 *   1. OAuth refresh (ANTHROPIC_OAUTH_REFRESH_TOKEN) — rotating Claude Code /
 *        Claude.ai login credential. Sent as `Authorization: Bearer` +
 *        `anthropic-beta: oauth-2025-04-20`. Access tokens are short-lived and
 *        the refresh token rotates, so the credential is cached in a KV
 *        namespace and refreshed via the OAuth2 refresh_token grant.
 *   2. OAuth static token (CLAUDE_CODE_OAUTH_TOKEN) — a long-lived Claude Code
 *        OAuth token from `claude setup-token`. Same Bearer + beta header, but
 *        no refresh/KV needed. Simplest for local development.
 *   3. API key (ANTHROPIC_API_KEY) — standard `x-api-key`. Best for a public
 *        deployment (use a workspace-scoped key with a spend cap).
 *
 *   Modes 1 and 2 use a PERSONAL, ACCOUNT-SCOPED credential — gate the proxy
 *   with Cloudflare Access so only you can reach it (see README).
 *
 * Routes:
 *   POST /api/chat                 → Claude Messages API (SSE passthrough)
 *   POST /api/github/issue         → create a GitHub issue
 *   POST /api/github/pull-request  → branch + commit + open a pull request
 *
 * Bindings (wrangler.toml):
 *   [[kv_namespaces]] binding = "CHAT_KV"   — required for OAuth mode
 *
 * Secrets (`wrangler secret put <NAME>`):
 *   OAuth refresh mode:
 *     ANTHROPIC_OAUTH_REFRESH_TOKEN  — refresh token from your Claude Code login
 *     ANTHROPIC_OAUTH_CLIENT_ID      — OAuth client id for that credential
 *     ANTHROPIC_OAUTH_ACCESS_TOKEN   — (optional) initial access token to seed KV
 *   OAuth static-token mode:
 *     CLAUDE_CODE_OAUTH_TOKEN        — long-lived token from `claude setup-token`
 *   API-key mode:
 *     ANTHROPIC_API_KEY              — Anthropic API key
 *   GitHub routes (optional):
 *     GITHUB_TOKEN                   — fine-grained PAT (Issues/Contents/PRs RW)
 *
 * Vars (wrangler.toml [vars]):
 *   ANTHROPIC_OAUTH_TOKEN_ENDPOINT — OAuth token endpoint for refresh (OAuth mode)
 *   ALLOWED_ORIGINS    — comma-separated origin allowlist
 *   REQUIRE_CF_ACCESS  — "true" to reject requests lacking a Cloudflare Access JWT
 *   GITHUB_REPOSITORY  — "owner/repo" the GitHub routes act on
 *   BASE_BRANCH        — base branch for pull requests (default "main")
 *   PR_BRANCH_PREFIX   — branch prefix for generated PRs (default "chat/")
 *   CHAT_MODEL         — optional model override pinned server-side
 *   MAX_TOKENS_CAP     — optional cap on client-requested max_tokens
 * ===================================================================
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const OAUTH_BETA = 'oauth-2025-04-20';
const GITHUB_API = 'https://api.github.com';
const DEFAULT_MAX_TOKENS_CAP = 4096;
const KV_OAUTH_KEY = 'anthropic_oauth';
const TOKEN_SKEW_MS = 60_000; // refresh this long before actual expiry

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (env.REQUIRE_CF_ACCESS === 'true' && !request.headers.get('Cf-Access-Jwt-Assertion')) {
      // Real enforcement is the Cloudflare Access policy on the route; this is
      // belt-and-suspenders so a misrouted request can't slip through.
      return jsonError('Forbidden: Cloudflare Access required', 403, cors);
    }
    if (!originAllowed(origin, env)) {
      return jsonError('Origin not allowed', 403, cors);
    }
    if (request.method !== 'POST') {
      return jsonError('Method not allowed', 405, cors);
    }

    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/chat') return await handleChat(request, env, cors);
      if (pathname === '/api/github/issue') return await handleIssue(request, env, cors);
      if (pathname === '/api/github/pull-request') return await handlePullRequest(request, env, cors);
      return jsonError('Not found', 404, cors);
    } catch (err) {
      return jsonError(err.message || 'Internal error', 500, cors);
    }
  },
};

// --- CORS ------------------------------------------------------------

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function originAllowed(origin, env) {
  const allowed = allowedOrigins(env);
  // No Origin header (non-browser client): only allow when Cloudflare Access
  // gates the proxy. Otherwise require a browser Origin on the allowlist, so a
  // direct API client can't bypass it and spend the Anthropic/GitHub credential.
  if (!origin) return env.REQUIRE_CF_ACCESS === 'true';
  return allowed.includes(origin);
}

function corsHeaders(origin, env) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  };
  if (origin && originAllowed(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function jsonError(message, status, cors) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

// --- Anthropic auth (OAuth connector or API key) ----------------------

// Auth precedence, highest first:
//   'oauth_refresh' — ANTHROPIC_OAUTH_REFRESH_TOKEN (rotating, KV-cached)
//   'oauth_static'  — CLAUDE_CODE_OAUTH_TOKEN (long-lived Bearer, no refresh)
//   'api_key'       — ANTHROPIC_API_KEY (x-api-key)
function anthropicAuthMode(env) {
  if (env.ANTHROPIC_OAUTH_REFRESH_TOKEN) return 'oauth_refresh';
  if (env.CLAUDE_CODE_OAUTH_TOKEN) return 'oauth_static';
  if (env.ANTHROPIC_API_KEY) return 'api_key';
  return null;
}

// Read the cached OAuth record from KV, seeding it from secrets on first run.
async function readOAuthRecord(env) {
  if (!env.CHAT_KV) {
    throw new Error('OAuth mode requires a CHAT_KV namespace binding (see wrangler.toml)');
  }
  const cached = await env.CHAT_KV.get(KV_OAUTH_KEY, 'json');
  if (cached && cached.refresh_token) return cached;
  // Seed from secrets the first time.
  const seed = {
    access_token: env.ANTHROPIC_OAUTH_ACCESS_TOKEN || null,
    refresh_token: env.ANTHROPIC_OAUTH_REFRESH_TOKEN || null,
    expires_at: 0, // force a refresh unless a fresh access token was seeded
  };
  if (env.ANTHROPIC_OAUTH_ACCESS_TOKEN) {
    // Assume a seeded access token is usable for a short window; a 401 will refresh.
    seed.expires_at = Date.now() + 5 * 60_000;
  }
  await env.CHAT_KV.put(KV_OAUTH_KEY, JSON.stringify(seed));
  return seed;
}

// Exchange the rotating refresh token for a fresh access token.
async function refreshOAuth(env, record) {
  const refreshToken = record.refresh_token || env.ANTHROPIC_OAUTH_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('No OAuth refresh token available');
  if (!env.ANTHROPIC_OAUTH_TOKEN_ENDPOINT || !env.ANTHROPIC_OAUTH_CLIENT_ID) {
    throw new Error('OAuth refresh needs ANTHROPIC_OAUTH_TOKEN_ENDPOINT and ANTHROPIC_OAUTH_CLIENT_ID');
  }
  const resp = await fetch(env.ANTHROPIC_OAUTH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.ANTHROPIC_OAUTH_CLIENT_ID,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.access_token) {
    throw new Error(`OAuth token refresh failed (${resp.status}). Re-authenticate and reseed the credential.`);
  }
  const next = {
    access_token: data.access_token,
    // Refresh tokens commonly rotate — persist the new one so the next refresh works.
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in ? data.expires_in * 1000 : 3_600_000),
  };
  await env.CHAT_KV.put(KV_OAUTH_KEY, JSON.stringify(next));
  return next;
}

async function oauthAccessToken(env, { forceRefresh = false } = {}) {
  let record = await readOAuthRecord(env);
  const stale = !record.access_token || record.expires_at <= Date.now() + TOKEN_SKEW_MS;
  if (forceRefresh || stale) record = await refreshOAuth(env, record);
  return record.access_token;
}

async function anthropicAuthHeaders(env, { forceRefresh = false } = {}) {
  const mode = anthropicAuthMode(env);
  if (mode === 'oauth_refresh') {
    const token = await oauthAccessToken(env, { forceRefresh });
    return { authorization: `Bearer ${token}`, 'anthropic-version': ANTHROPIC_VERSION, 'anthropic-beta': OAUTH_BETA };
  }
  if (mode === 'oauth_static') {
    return { authorization: `Bearer ${env.CLAUDE_CODE_OAUTH_TOKEN}`, 'anthropic-version': ANTHROPIC_VERSION, 'anthropic-beta': OAUTH_BETA };
  }
  if (mode === 'api_key') {
    return { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': ANTHROPIC_VERSION };
  }
  throw new Error('No Anthropic credential configured (set CLAUDE_CODE_OAUTH_TOKEN, ANTHROPIC_API_KEY, or the OAuth refresh secrets)');
}

// POST to the Messages API; in rotating-OAuth mode, refresh once on a 401.
async function callAnthropic(env, payloadJson) {
  const send = async (forceRefresh) => {
    const headers = await anthropicAuthHeaders(env, { forceRefresh });
    headers['content-type'] = 'application/json';
    return fetch(ANTHROPIC_URL, { method: 'POST', headers, body: payloadJson });
  };
  let resp = await send(false);
  if (resp.status === 401 && anthropicAuthMode(env) === 'oauth_refresh') {
    resp = await send(true); // token likely expired — refresh and retry once
  }
  return resp;
}

// --- Chat: Claude Messages API passthrough ----------------------------

async function handleChat(request, env, cors) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.messages)) {
    return jsonError('Invalid request body', 400, cors);
  }

  const cap = Number(env.MAX_TOKENS_CAP) || DEFAULT_MAX_TOKENS_CAP;
  const payload = {
    model: env.CHAT_MODEL || body.model,
    max_tokens: Math.min(Number(body.max_tokens) || 1024, cap),
    system: typeof body.system === 'string' ? body.system : undefined,
    messages: body.messages,
    tools: Array.isArray(body.tools) ? body.tools : undefined,
    stream: true,
  };

  const upstream = await callAnthropic(env, JSON.stringify(payload));

  // Stream SSE straight through; error bodies pass through as JSON.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
      'cache-control': 'no-store',
      ...cors,
    },
  });
}

// --- GitHub helpers ----------------------------------------------------

function githubConfigured(env) {
  return Boolean(env.GITHUB_TOKEN && env.GITHUB_REPOSITORY);
}

async function github(env, method, path, body) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'zer0-mistakes-chat-proxy',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.message ? `: ${data.message}` : '';
    throw new Error(`GitHub ${method} ${path} failed (${response.status})${detail}`);
  }
  return data;
}

function sanitizeRepoPath(path) {
  const clean = String(path || '').replace(/^\/+/, '').trim();
  if (!clean || clean.includes('..') || clean.includes('\\')) return null;
  return clean;
}

function sanitizeBranchName(name, fallbackPrefix) {
  const clean = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '')
    .slice(0, 60);
  const suffix = Date.now().toString(36);
  return clean ? `${clean}-${suffix}` : `${fallbackPrefix}improve-${suffix}`;
}

function toBase64Utf8(text) {
  // Node (dev-proxy) has Buffer but no btoa; Workers have btoa but no Buffer.
  if (typeof Buffer !== 'undefined') return Buffer.from(text, 'utf8').toString('base64');
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// --- GitHub: create issue ----------------------------------------------

async function handleIssue(request, env, cors) {
  if (!githubConfigured(env)) return jsonError('GitHub integration is not configured', 500, cors);

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string' || !body.title.trim()) {
    return jsonError('title and body are required', 400, cors);
  }

  const issue = await github(env, 'POST', `/repos/${env.GITHUB_REPOSITORY}/issues`, {
    title: body.title.slice(0, 256),
    body: body.body.slice(0, 60000),
    labels: Array.isArray(body.labels) ? body.labels.slice(0, 10) : [],
  });

  return new Response(JSON.stringify({ url: issue.html_url, number: issue.number }), {
    status: 201,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

// --- GitHub: branch + commit + pull request -----------------------------

async function handlePullRequest(request, env, cors) {
  if (!githubConfigured(env)) return jsonError('GitHub integration is not configured', 500, cors);

  const body = await request.json().catch(() => null);
  const filePath = sanitizeRepoPath(body && body.file_path);
  if (!body || !filePath || typeof body.title !== 'string' || typeof body.updated_content !== 'string') {
    return jsonError('file_path, title, body and updated_content are required', 400, cors);
  }

  const repo = env.GITHUB_REPOSITORY;
  const baseBranch = env.BASE_BRANCH || 'main';
  const branch = sanitizeBranchName(body.branch_name, env.PR_BRANCH_PREFIX || 'chat/');

  // 1. Resolve the base branch head SHA.
  const baseRef = await github(env, 'GET', `/repos/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`);
  const baseSha = baseRef.object.sha;

  // 2. Create the work branch from it.
  await github(env, 'POST', `/repos/${repo}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });

  // 3. Look up the current file blob SHA (required to update an existing file).
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  let existingSha;
  try {
    const existing = await github(env, 'GET', `/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(baseBranch)}`);
    existingSha = existing.sha;
  } catch (err) {
    existingSha = undefined; // new file
  }

  // 4. Commit the updated content to the work branch.
  await github(env, 'PUT', `/repos/${repo}/contents/${encodedPath}`, {
    message: `${body.title.slice(0, 72)}\n\nProposed via the site's AI chat assistant.`,
    content: toBase64Utf8(body.updated_content),
    branch,
    ...(existingSha ? { sha: existingSha } : {}),
  });

  // 5. Open the pull request.
  const pull = await github(env, 'POST', `/repos/${repo}/pulls`, {
    title: body.title.slice(0, 256),
    head: branch,
    base: baseBranch,
    body: `${String(body.body || '').slice(0, 60000)}\n\n---\n_Proposed via the site's AI chat assistant._`,
  });

  return new Response(JSON.stringify({ url: pull.html_url, number: pull.number, branch }), {
    status: 201,
    headers: { 'content-type': 'application/json', ...cors },
  });
}
