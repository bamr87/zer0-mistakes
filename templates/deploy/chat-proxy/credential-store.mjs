// Feature: ZER0-087
/**
 * ===================================================================
 * Session credentials — dev-proxy-only, in-memory, bring-your-own-key
 * ===================================================================
 *
 * File: credential-store.mjs
 * Path: templates/deploy/chat-proxy/credential-store.mjs
 * Purpose: Lets the Site Builder's Connect step hand the LOCAL dev proxy a
 *          provider token at runtime (Claude Code OAuth token, Anthropic API
 *          key, xAI or OpenAI key) instead of editing .env and restarting.
 *          The token lives in this process's memory only; the page never
 *          stores it, status reports only a masked tail, and writing it to
 *          .env is an explicit, separate opt-in (chmod 600).
 *
 * Boundaries (mirror .github/instructions/ai-chat.instructions.md §10):
 *   - Only the Node dev proxy imports this. The Cloudflare Worker has no
 *     route that accepts a credential — its secrets come from wrangler.
 *   - A session credential REPLACES that provider's env credentials for
 *     the rest of the run (so a fresh key is not shadowed by a stale
 *     CLAUDE_CODE_OAUTH_TOKEN with higher precedence).
 *   - Nothing here logs, echoes or returns a token: summary() masks.
 *
 * Env:
 *   CHAT_DEV_ENV_FILE   where persist() writes (default: <repo>/.env)
 * ===================================================================
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDERS, IMAGE_PROVIDERS, detectCredential, maskToken, upsertEnvLine } from './providers.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/** provider id -> { token, kind, envKey, setAt } */
const session = new Map();

export function envFile() {
  return path.resolve(process.env.CHAT_DEV_ENV_FILE || path.join(REPO_ROOT, '.env'));
}

function allEnvKeys(provider) {
  const keys = new Set();
  const chat = PROVIDERS[provider];
  const img = IMAGE_PROVIDERS[provider];
  (chat ? chat.envKeys : []).forEach((k) => keys.add(k));
  (img ? img.envKeys : []).forEach((k) => keys.add(k));
  return Array.from(keys);
}

export function knownProvider(provider) {
  return Boolean(PROVIDERS[provider] || IMAGE_PROVIDERS[provider]);
}

/** Store a token for the rest of this proxy run. Returns a masked receipt, never the token. */
export function set(provider, token) {
  if (!knownProvider(provider)) return { ok: false, error: `unknown provider: ${provider}` };
  const d = detectCredential(provider, token);
  if (!d.ok) return d;
  session.set(provider, { token: String(token).trim(), kind: d.kind, envKey: d.envKey, setAt: Date.now() });
  return { ok: true, provider, kind: d.kind, envKey: d.envKey, masked: maskToken(token), source: 'session' };
}

export function clear(provider) {
  const had = session.delete(provider);
  return { ok: true, provider, cleared: had };
}

export function has(provider) {
  return session.has(provider);
}

/** A copy of `baseEnv` with every session credential applied (its provider's env keys replaced). */
export function applyTo(baseEnv) {
  const env = Object.assign({}, baseEnv || {});
  for (const [provider, cred] of session) {
    for (const key of allEnvKeys(provider)) delete env[key];
    env[cred.envKey] = cred.token;
  }
  return env;
}

function envSourceFor(provider, baseEnv) {
  for (const key of allEnvKeys(provider)) {
    if (baseEnv && baseEnv[key]) return { key, value: baseEnv[key] };
  }
  return null;
}

/**
 * Masked, per-provider description of what is configured and where it came
 * from — safe to send to the browser.
 */
export function summary(baseEnv) {
  const out = {};
  const ids = new Set([...Object.keys(PROVIDERS), ...Object.keys(IMAGE_PROVIDERS)]);
  for (const id of ids) {
    const s = session.get(id);
    if (s) {
      out[id] = { configured: true, source: 'session', kind: s.kind, envKey: s.envKey, masked: maskToken(s.token) };
      continue;
    }
    const fromEnv = envSourceFor(id, baseEnv);
    out[id] = fromEnv
      ? { configured: true, source: 'env', kind: fromEnv.key === 'CLAUDE_CODE_OAUTH_TOKEN' ? 'oauth_static' : fromEnv.key === 'ANTHROPIC_OAUTH_REFRESH_TOKEN' ? 'oauth_refresh' : 'api_key', envKey: fromEnv.key, masked: maskToken(fromEnv.value) }
      : { configured: false, source: null, kind: null, envKey: null, masked: '' };
  }
  return out;
}

/**
 * Write the session credential for `provider` into the .env file (creating
 * it 0600 when missing). Returns the file and key written; never the value.
 */
export async function persist(provider) {
  const cred = session.get(provider);
  if (!cred) return { ok: false, error: `no session credential for ${provider} to save` };
  const file = envFile();
  let text = '';
  try { text = await fs.readFile(file, 'utf8'); } catch (err) { if (err.code !== 'ENOENT') return { ok: false, error: err.message }; }
  const next = upsertEnvLine(text, cred.envKey, cred.token);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, next, { encoding: 'utf8', mode: 0o600 });
  try { await fs.chmod(file, 0o600); } catch (err) { /* best effort on non-POSIX */ }
  return { ok: true, provider, file, key: cred.envKey, masked: maskToken(cred.token) };
}

/** Test hook. */
export function _reset() { session.clear(); }
