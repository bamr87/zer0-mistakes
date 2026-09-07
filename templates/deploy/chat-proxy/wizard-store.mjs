// Feature: ZER0-086
/**
 * ===================================================================
 * Site Builder sandbox — dev-proxy-only helpers behind /api/wizard/*
 * ===================================================================
 *
 * File: wizard-store.mjs
 * Path: templates/deploy/chat-proxy/wizard-store.mjs
 * Purpose: The safety boundary for everything the guided Site Builder
 *          (_includes/setup/wizard.html + assets/js/site-builder.js) may
 *          do on the developer's machine. Mirrors page-store.mjs in spirit:
 *          every capability is narrow, allow-listed, and resolved against
 *          a fixed root.
 *
 * Capabilities (all DEV ONLY — never in worker.js, which has no host):
 *   runCheck(id)            fixed table of read-only version/status commands
 *                           (docker, git, gh, code, node, claude, …). No shell,
 *                           no arguments from the client — only the id.
 *   readThemeFile(path)     read a text file INSIDE the theme checkout so the
 *                           assistant answers from real source. Secrets, VCS,
 *                           vendored and build dirs are denied; extensions are
 *                           allow-listed; output is capped.
 *   listThemeDir(path)      names inside a theme directory (same denylist).
 *   scaffold(target, files) write the generated site into a NEW project dir
 *                           under WIZARD_TARGET_ROOT (default: the theme's
 *                           parent directory). Never inside the theme itself,
 *                           never above the root, relative paths only, an
 *                           allow-list of file names/extensions, size caps,
 *                           and no overwrite unless explicitly asked.
 *   compose(target, action) `docker compose` up/ps/logs/down in a scaffolded
 *                           project (must contain docker-compose.yml). Output
 *                           is streamed back as text.
 *
 * Environment:
 *   WIZARD_TARGET_ROOT   directory new sites may be written under
 *                        (default: dirname(repoRoot))
 *   WIZARD_DISABLE_COMPOSE=1  turn the compose actions off
 * ===================================================================
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// templates/deploy/chat-proxy → repo root
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const TARGET_ROOT = path.resolve(process.env.WIZARD_TARGET_ROOT || path.dirname(REPO_ROOT));

const MAX_FILE_CHARS = 48_000;
const MAX_SCAFFOLD_FILES = 60;
const MAX_SCAFFOLD_BYTES = 200_000;
const MAX_LIST_ENTRIES = 300;
const CHECK_TIMEOUT_MS = 15_000;
const COMPOSE_TIMEOUT_MS = 15 * 60_000;

export function repoRoot() { return REPO_ROOT; }
export function targetRoot() { return TARGET_ROOT; }
export function composeEnabled() { return process.env.WIZARD_DISABLE_COMPOSE !== '1'; }

// --- Prerequisite checks -------------------------------------------------

// The ONLY commands the proxy will run for a check. Ids are what the client
// sends; nothing else from the request reaches the command line.
const CHECKS = {
  docker: { cmd: 'docker', args: ['--version'] },
  compose: { cmd: 'docker', args: ['compose', 'version'] },
  'docker-daemon': { cmd: 'docker', args: ['info', '--format', '{{.ServerVersion}}'] },
  git: { cmd: 'git', args: ['--version'] },
  'git-config': { cmd: 'git', args: ['config', '--global', '--get-regexp', '^user\\.'] },
  gh: { cmd: 'gh', args: ['--version'] },
  'gh-auth': { cmd: 'gh', args: ['auth', 'status'] },
  code: { cmd: 'code', args: ['--version'] },
  node: { cmd: 'node', args: ['--version'] },
  ruby: { cmd: 'ruby', args: ['--version'] },
  bundle: { cmd: 'bundle', args: ['--version'] },
  claude: { cmd: 'claude', args: ['--version'] },
};

export function checkIds() { return Object.keys(CHECKS); }

function firstVersion(text) {
  const m = String(text || '').match(/v?(\d+\.\d+(?:\.\d+)?)/);
  return m ? m[1] : '';
}

function redactUser(text) {
  // `git config user.email` and `gh auth status` print the account. Keep the
  // shape (so the UI can say "configured") without echoing the email back
  // through a JSON API — the browser only needs ok/not-ok plus a hint.
  return String(text || '').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>');
}

export function runCheck(id) {
  const spec = CHECKS[id];
  if (!spec) return Promise.resolve({ id, ok: false, error: `Unknown check: ${id}` });
  return new Promise((resolve) => {
    execFile(spec.cmd, spec.args, { timeout: CHECK_TIMEOUT_MS, maxBuffer: 64 * 1024 }, (err, stdout, stderr) => {
      const out = redactUser(`${stdout || ''}${stderr || ''}`).trim().slice(0, 1200);
      if (err) {
        const missing = err.code === 'ENOENT';
        resolve({
          id,
          ok: false,
          installed: !missing,
          output: missing ? `${spec.cmd}: command not found` : out,
          error: missing ? 'not installed' : (out || err.message),
        });
        return;
      }
      resolve({ id, ok: true, installed: true, version: firstVersion(out), output: out });
    });
  });
}

// --- Theme source (read-only) -------------------------------------------

const READ_EXTENSIONS = new Set([
  '.md', '.markdown', '.html', '.htm', '.liquid', '.yml', '.yaml', '.json', '.txt',
  '.scss', '.css', '.js', '.mjs', '.cjs', '.rb', '.sh', '.template', '.toml', '.xml', '.svg',
]);
const READ_BASENAMES = new Set(['Gemfile', 'Rakefile', 'Makefile', 'Dockerfile', 'CODEOWNERS', '.gitignore', '.ruby-version']);
const DENY_SEGMENTS = new Set(['.git', 'node_modules', 'vendor', '_site', '.jekyll-cache', '.sass-cache', '.bundle', 'pkg', 'logs', '.claude', '.obsidian']);
const DENY_NAME = /(^\.env(\..*)?$)|(\.pem$)|(\.key$)|(\.p12$)|(secret)|(credential)|(_config_secrets)/i;

function resolveInside(root, rel) {
  const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!clean) return { ok: false, error: 'path is required' };
  if (clean.split('/').some((s) => s === '..')) return { ok: false, error: 'path may not contain ".."' };
  const abs = path.resolve(root, clean);
  if (abs !== root && !abs.startsWith(root + path.sep)) return { ok: false, error: 'path escapes the allowed root' };
  return { ok: true, abs, rel: clean };
}

function deniedThemePath(rel) {
  const segments = rel.split('/');
  if (segments.some((s) => DENY_SEGMENTS.has(s))) return 'that directory is not readable';
  const base = segments[segments.length - 1];
  if (DENY_NAME.test(base)) return 'that file may hold a secret and is not readable';
  return null;
}

export async function readThemeFile(rel) {
  const r = resolveInside(REPO_ROOT, rel);
  if (!r.ok) return r;
  const denied = deniedThemePath(r.rel);
  if (denied) return { ok: false, error: denied };
  const base = path.basename(r.abs);
  if (!READ_EXTENSIONS.has(path.extname(base).toLowerCase()) && !READ_BASENAMES.has(base)) {
    return { ok: false, error: 'only text source files can be read' };
  }
  try {
    const stat = await fs.stat(r.abs);
    if (!stat.isFile()) return { ok: false, error: 'not a file' };
    let content = await fs.readFile(r.abs, 'utf8');
    let truncated = false;
    if (content.length > MAX_FILE_CHARS) {
      content = content.slice(0, MAX_FILE_CHARS);
      truncated = true;
    }
    return { ok: true, path: r.rel, content, truncated, bytes: stat.size };
  } catch (err) {
    return { ok: false, error: err.code === 'ENOENT' ? 'file not found' : err.message };
  }
}

export async function listThemeDir(rel) {
  const r = resolveInside(REPO_ROOT, rel || '.');
  if (!r.ok) return r;
  if (r.rel !== '.' && deniedThemePath(r.rel)) return { ok: false, error: 'that directory is not readable' };
  try {
    const entries = await fs.readdir(r.abs, { withFileTypes: true });
    const items = entries
      .filter((e) => !DENY_SEGMENTS.has(e.name) && !DENY_NAME.test(e.name))
      .slice(0, MAX_LIST_ENTRIES)
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort();
    return { ok: true, path: r.rel, entries: items, truncated: entries.length > MAX_LIST_ENTRIES };
  } catch (err) {
    return { ok: false, error: err.code === 'ENOENT' ? 'directory not found' : err.message };
  }
}

// --- Scaffold a new site ------------------------------------------------

const WRITE_EXTENSIONS = new Set(['.yml', '.yaml', '.md', '.markdown', '.html', '.scss', '.css', '.js', '.json', '.txt', '.xml', '.svg', '.example']);
const WRITE_BASENAMES = new Set(['Gemfile', 'Dockerfile', 'Makefile', 'Rakefile', '.gitignore', '.ruby-version', '.env.example', 'CNAME', '.nojekyll']);

function slugOk(name) {
  return /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name) && name !== '.' && name !== '..';
}

/**
 * Resolve a target project directory the wizard may write into.
 *   - relative names resolve under TARGET_ROOT; absolute paths must already be
 *     inside TARGET_ROOT (so the UI can show the resolved location).
 *   - must be a strict sub-directory of TARGET_ROOT (never the root itself)
 *   - must not be the theme checkout or anything inside it
 */
export async function resolveTarget(target) {
  const raw = String(target || '').trim();
  if (!raw) return { ok: false, error: 'target folder is required' };
  let abs = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(TARGET_ROOT, raw);
  if (!abs.startsWith(TARGET_ROOT + path.sep)) {
    return { ok: false, error: `target must be a folder under ${TARGET_ROOT}` };
  }
  if (abs === REPO_ROOT || abs.startsWith(REPO_ROOT + path.sep)) {
    return { ok: false, error: 'target may not be inside the theme repository' };
  }
  const relToRoot = path.relative(TARGET_ROOT, abs);
  if (!relToRoot.split(path.sep).every(slugOk)) {
    return { ok: false, error: 'folder names may only use letters, digits, dot, dash and underscore' };
  }
  // Real-path guard: a symlink under the root pointing elsewhere is refused.
  try {
    const real = await fs.realpath(abs);
    const realRoot = await fs.realpath(TARGET_ROOT);
    if (!real.startsWith(realRoot + path.sep)) return { ok: false, error: 'target resolves outside the allowed root' };
    abs = real;
  } catch (err) {
    if (err.code !== 'ENOENT') return { ok: false, error: err.message };
  }
  let exists = false;
  let empty = true;
  try {
    const entries = await fs.readdir(abs);
    exists = true;
    empty = entries.length === 0;
  } catch (err) {
    if (err.code !== 'ENOENT') return { ok: false, error: err.message };
  }
  return { ok: true, abs, exists, empty, root: TARGET_ROOT };
}

function writablePath(rel) {
  const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!clean || clean.split('/').some((s) => s === '..' || s === '' || s === '.git')) return null;
  const base = path.basename(clean);
  if (DENY_NAME.test(base) && base !== '.env.example') return null;
  if (!WRITE_EXTENSIONS.has(path.extname(base).toLowerCase()) && !WRITE_BASENAMES.has(base)) return null;
  return clean;
}

/**
 * Write generated files into the target. `files` is [{path, content}].
 * Returns {ok, target, written:[], skipped:[{path, reason}]}.
 */
export async function scaffold(target, files, { overwrite = false } = {}) {
  const t = await resolveTarget(target);
  if (!t.ok) return t;
  if (!Array.isArray(files) || !files.length) return { ok: false, error: 'files[] is required' };
  if (files.length > MAX_SCAFFOLD_FILES) return { ok: false, error: `too many files (max ${MAX_SCAFFOLD_FILES})` };

  const written = [];
  const skipped = [];
  await fs.mkdir(t.abs, { recursive: true });
  for (const file of files) {
    const rel = writablePath(file && file.path);
    if (!rel) { skipped.push({ path: String(file && file.path), reason: 'path not allowed' }); continue; }
    const content = typeof file.content === 'string' ? file.content : '';
    if (Buffer.byteLength(content, 'utf8') > MAX_SCAFFOLD_BYTES) { skipped.push({ path: rel, reason: 'file too large' }); continue; }
    const abs = path.join(t.abs, rel);
    if (!abs.startsWith(t.abs + path.sep)) { skipped.push({ path: rel, reason: 'path escapes target' }); continue; }
    let exists = false;
    try { await fs.stat(abs); exists = true; } catch { /* new file */ }
    if (exists && !overwrite) { skipped.push({ path: rel, reason: 'exists (overwrite not requested)' }); continue; }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, 'utf8');
    written.push({ path: rel, bytes: Buffer.byteLength(content, 'utf8'), replaced: exists });
  }
  return { ok: true, target: t.abs, written, skipped };
}

// --- docker compose in the scaffolded project ---------------------------

const COMPOSE_ACTIONS = {
  up: ['compose', 'up', '-d', '--build'],
  ps: ['compose', 'ps'],
  logs: ['compose', 'logs', '--no-color', '--tail', '120'],
  down: ['compose', 'down'],
  config: ['compose', 'config', '--quiet'],
};

export function composeActions() { return Object.keys(COMPOSE_ACTIONS); }

/**
 * Run a compose action in `target`. `onChunk(text)` receives output as it
 * arrives; the promise resolves with {ok, code} when the process exits.
 */
export async function compose(target, action, onChunk) {
  if (!composeEnabled()) return { ok: false, error: 'compose actions are disabled (WIZARD_DISABLE_COMPOSE=1)' };
  const args = COMPOSE_ACTIONS[action];
  if (!args) return { ok: false, error: `Unknown compose action: ${action}` };
  const t = await resolveTarget(target);
  if (!t.ok) return t;
  try {
    await fs.stat(path.join(t.abs, 'docker-compose.yml'));
  } catch {
    return { ok: false, error: 'docker-compose.yml not found in the target — write the project first' };
  }
  return new Promise((resolve) => {
    const child = spawn('docker', args, { cwd: t.abs, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { try { child.kill('SIGTERM'); } catch { /* gone */ } }, COMPOSE_TIMEOUT_MS);
    const push = (buf) => { if (onChunk) onChunk(buf.toString('utf8')); };
    child.stdout.on('data', push);
    child.stderr.on('data', push);
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.code === 'ENOENT' ? 'docker: command not found' : err.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, target: t.abs, action });
    });
  });
}
