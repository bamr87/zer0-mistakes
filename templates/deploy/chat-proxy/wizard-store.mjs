// Feature: ZER0-086
// Feature: ZER0-087
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
 *   compose(target, action) `docker compose` up/ps/logs/down/restart/config/
 *                           build in a scaffolded project (must contain
 *                           docker-compose.yml). Output is streamed back as
 *                           text. `build` runs `jekyll build` inside the
 *                           running container so an agent can validate edits;
 *                           `restart` re-reads content the watcher misses.
 *
 * Project session (ZER0-087 — an existing or freshly written site under
 * WIZARD_TARGET_ROOT, so the assistant can MODIFY a site, not only create it):
 *   listProjects()          folders under the root that look like sites
 *   readProjectFile()       text source inside the project (same denylist and
 *   listProjectDir()        extension allow-list as the theme reads)
 *   projectTree()           depth-limited tree of the project
 *   writeProjectFile()      write ONE allow-listed text file (no overwrite
 *                           unless asked); editProjectFile() replaces an exact
 *                           snippet (must be unique unless all:true);
 *                           deleteProjectFile() removes one regular file
 *   runProjectCommand()     fixed table of read-only git commands (+ git init)
 *   writeProjectAsset()     PNG/JPEG/WebP bytes under assets/ only, sniffed by
 *                           magic bytes, size-capped (generated images);
 *                           readProjectAsset() serves them back for previews
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
  return readTextInside(REPO_ROOT, rel);
}

async function readTextInside(root, rel) {
  const r = resolveInside(root, rel);
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
  return listInside(REPO_ROOT, rel);
}

async function listInside(root, rel) {
  const r = resolveInside(root, rel || '.');
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

const WRITE_EXTENSIONS = new Set(['.yml', '.yaml', '.md', '.markdown', '.html', '.liquid', '.scss', '.css', '.js', '.json', '.txt', '.csv', '.xml', '.svg', '.example']);
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
  // Jekyll's --watch does not pick up a collection document that did not exist
  // when serve started, so an agent that adds a post to a RUNNING site needs a
  // way to make it visible without tearing the project down.
  restart: ['compose', 'restart'],
  config: ['compose', 'config', '--quiet'],
  // Validates the site the way CI would, inside the already-running container.
  // The config list is appended per target (dev overrides only when present).
  build: ['compose', 'exec', '-T', 'jekyll', 'bundle', 'exec', 'jekyll', 'build', '--trace'],
};

export function composeActions() { return Object.keys(COMPOSE_ACTIONS); }

/**
 * Run a compose action in `target`. `onChunk(text)` receives output as it
 * arrives; the promise resolves with {ok, code} when the process exits.
 */
export async function compose(target, action, onChunk) {
  if (!composeEnabled()) return { ok: false, error: 'compose actions are disabled (WIZARD_DISABLE_COMPOSE=1)' };
  let args = COMPOSE_ACTIONS[action];
  if (!args) return { ok: false, error: `Unknown compose action: ${action}` };
  const t = await resolveTarget(target);
  if (!t.ok) return t;
  try {
    await fs.stat(path.join(t.abs, 'docker-compose.yml'));
  } catch {
    return { ok: false, error: 'docker-compose.yml not found in the target — write the project first' };
  }
  if (action === 'build') {
    let hasDev = false;
    try { await fs.stat(path.join(t.abs, '_config_dev.yml')); hasDev = true; } catch { /* production config only */ }
    args = args.concat(['--config', hasDev ? '_config.yml,_config_dev.yml' : '_config.yml']);
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

// --- Project session: modify an existing (or freshly written) site --------

const MAX_TREE_ENTRIES = 400;
const TREE_DEPTH = 3;
const MAX_PROJECTS = 60;
const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_ASSET_BYTES = 8 * 1024 * 1024;
const COMMAND_TIMEOUT_MS = 30_000;

/** Folders directly under TARGET_ROOT that look like a site (never the theme itself). */
export async function listProjects() {
  let entries;
  try { entries = await fs.readdir(TARGET_ROOT, { withFileTypes: true }); } catch (err) { return { ok: false, error: err.message }; }
  const projects = [];
  for (const e of entries) {
    if (!e.isDirectory() || !slugOk(e.name)) continue;
    const abs = path.join(TARGET_ROOT, e.name);
    if (abs === REPO_ROOT) continue;
    const has = async (name) => { try { await fs.stat(path.join(abs, name)); return true; } catch { return false; } };
    const site = await has('_config.yml');
    const compose = await has('docker-compose.yml');
    if (!site && !compose) continue;
    let mtime = 0;
    try { mtime = (await fs.stat(abs)).mtimeMs; } catch { /* ignore */ }
    projects.push({ name: e.name, abs, site, compose, mtime: Math.round(mtime) });
    if (projects.length >= MAX_PROJECTS) break;
  }
  projects.sort((a, b) => b.mtime - a.mtime);
  return { ok: true, root: TARGET_ROOT, projects };
}

async function projectRoot(target) {
  const t = await resolveTarget(target);
  if (!t.ok) return t;
  return { ok: true, abs: t.abs, exists: t.exists };
}

export async function readProjectFile(target, rel) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  return readTextInside(t.abs, rel);
}

export async function listProjectDir(target, rel) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  return listInside(t.abs, rel || '.');
}

/** Depth-limited tree ("dir/" entries first), skipping the denylist. */
export async function projectTree(target, rel, depth = TREE_DEPTH) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  const start = resolveInside(t.abs, rel || '.');
  if (!start.ok) return start;
  if (start.rel !== '.' && deniedThemePath(start.rel)) return { ok: false, error: 'that directory is not readable' };
  const lines = [];
  let truncated = false;
  async function walk(abs, relPath, level) {
    if (truncated) return;
    let entries;
    try { entries = await fs.readdir(abs, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
    for (const e of entries) {
      if (DENY_SEGMENTS.has(e.name) || DENY_NAME.test(e.name)) continue;
      if (lines.length >= MAX_TREE_ENTRIES) { truncated = true; return; }
      const childRel = relPath === '.' ? e.name : `${relPath}/${e.name}`;
      if (e.isDirectory()) {
        lines.push(`${childRel}/`);
        if (level < Math.max(1, Math.min(Number(depth) || TREE_DEPTH, 6))) await walk(path.join(abs, e.name), childRel, level + 1);
      } else {
        lines.push(childRel);
      }
    }
  }
  await walk(start.abs, start.rel, 1);
  return { ok: true, path: start.rel, entries: lines, truncated };
}

/** Write ONE text file into the project (allow-listed name, size cap, no overwrite unless asked). */
export async function writeProjectFile(target, rel, content, { overwrite = false } = {}) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  const clean = writablePath(rel);
  if (!clean) return { ok: false, error: 'path not allowed (relative, text extension, no secrets or VCS files)' };
  const text = typeof content === 'string' ? content : '';
  if (Buffer.byteLength(text, 'utf8') > MAX_SCAFFOLD_BYTES) return { ok: false, error: `file too large (max ${MAX_SCAFFOLD_BYTES} bytes)` };
  const abs = path.join(t.abs, clean);
  if (!abs.startsWith(t.abs + path.sep)) return { ok: false, error: 'path escapes target' };
  let exists = false;
  try { exists = (await fs.stat(abs)).isFile(); } catch { /* new file */ }
  if (exists && !overwrite) return { ok: false, error: `${clean} exists (overwrite not requested)`, exists: true };
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, text, 'utf8');
  return { ok: true, target: t.abs, path: clean, bytes: Buffer.byteLength(text, 'utf8'), replaced: exists };
}

/**
 * Replace an exact snippet inside a project text file. The snippet must occur
 * exactly once unless `all` is true — the same rule a careful editor follows.
 */
export async function editProjectFile(target, rel, find, replace, { all = false } = {}) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  const clean = writablePath(rel);
  if (!clean) return { ok: false, error: 'path not allowed' };
  const needle = typeof find === 'string' ? find : '';
  if (!needle) return { ok: false, error: 'find is required' };
  const replacement = typeof replace === 'string' ? replace : '';
  const current = await readTextInside(t.abs, clean);
  if (!current.ok) return current;
  if (current.truncated) return { ok: false, error: 'file too large to edit in place' };
  const count = current.content.split(needle).length - 1;
  if (count === 0) return { ok: false, error: 'the text to find does not occur in the file' };
  if (count > 1 && !all) return { ok: false, error: `the text occurs ${count} times — pass all:true or a longer, unique snippet` };
  const next = all ? current.content.split(needle).join(replacement) : current.content.replace(needle, () => replacement);
  if (Buffer.byteLength(next, 'utf8') > MAX_SCAFFOLD_BYTES) return { ok: false, error: 'edited file would exceed the size cap' };
  await fs.writeFile(path.join(t.abs, clean), next, 'utf8');
  return { ok: true, target: t.abs, path: clean, replacements: all ? count : 1, bytes: Buffer.byteLength(next, 'utf8') };
}

/** Delete one regular file (never a directory, never a denied/secret path). */
export async function deleteProjectFile(target, rel) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  const clean = writablePath(rel);
  if (!clean) return { ok: false, error: 'path not allowed' };
  const abs = path.join(t.abs, clean);
  if (!abs.startsWith(t.abs + path.sep)) return { ok: false, error: 'path escapes target' };
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return { ok: false, error: 'not a regular file' };
  } catch (err) {
    return { ok: false, error: err.code === 'ENOENT' ? 'file not found' : err.message };
  }
  await fs.unlink(abs);
  return { ok: true, target: t.abs, path: clean };
}

// The ONLY commands the proxy runs inside a project. No client input reaches
// the command line — only the id.
const PROJECT_COMMANDS = {
  'git-status': { cmd: 'git', args: ['status', '--short', '--branch'] },
  'git-diff': { cmd: 'git', args: ['diff', '--stat'] },
  'git-log': { cmd: 'git', args: ['log', '--oneline', '-n', '20'] },
  'git-init': { cmd: 'git', args: ['init', '-q'] },
};

export function projectCommandIds() { return Object.keys(PROJECT_COMMANDS); }

export async function runProjectCommand(target, id) {
  const spec = PROJECT_COMMANDS[id];
  if (!spec) return { ok: false, error: `Unknown project command: ${id}` };
  const t = await projectRoot(target);
  if (!t.ok) return t;
  if (!t.exists) return { ok: false, error: 'the project folder does not exist yet' };
  return new Promise((resolve) => {
    execFile(spec.cmd, spec.args, { cwd: t.abs, timeout: COMMAND_TIMEOUT_MS, maxBuffer: 256 * 1024 }, (err, stdout, stderr) => {
      const out = redactUser(`${stdout || ''}${stderr || ''}`).trim().slice(0, 12000);
      if (err) {
        resolve({ ok: false, id, output: out, error: err.code === 'ENOENT' ? `${spec.cmd}: command not found` : (out || err.message), code: typeof err.code === 'number' ? err.code : null });
        return;
      }
      resolve({ ok: true, id, output: out, code: 0 });
    });
  });
}

function sniffImage(bytes) {
  if (!bytes || bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: '.png', type: 'image/png' };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: '.jpg', type: 'image/jpeg' };
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', type: 'image/webp' };
  return null;
}

function assetPath(rel) {
  const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!clean || clean.split('/').some((s) => s === '..' || s === '' || s === '.git')) return null;
  if (!/^assets\//.test(clean)) return null;
  if (!ASSET_EXTENSIONS.has(path.extname(clean).toLowerCase())) return null;
  return clean;
}

/** Write image bytes under assets/ — the type must match the extension by magic bytes. */
export async function writeProjectAsset(target, rel, bytes, { overwrite = false } = {}) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  const clean = assetPath(rel);
  if (!clean) return { ok: false, error: 'asset path must be under assets/ and end in .png, .jpg or .webp' };
  if (!Buffer.isBuffer(bytes) || !bytes.length) return { ok: false, error: 'no image data' };
  if (bytes.length > MAX_ASSET_BYTES) return { ok: false, error: `image too large (max ${MAX_ASSET_BYTES} bytes)` };
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: 'not a PNG, JPEG or WebP image' };
  const ext = path.extname(clean).toLowerCase();
  const matches = kind.ext === ext || (kind.ext === '.jpg' && ext === '.jpeg');
  if (!matches) return { ok: false, error: `image is ${kind.type} but the path ends in ${ext}` };
  const abs = path.join(t.abs, clean);
  if (!abs.startsWith(t.abs + path.sep)) return { ok: false, error: 'path escapes target' };
  let exists = false;
  try { exists = (await fs.stat(abs)).isFile(); } catch { /* new */ }
  if (exists && !overwrite) return { ok: false, error: `${clean} exists (overwrite not requested)`, exists: true };
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, bytes);
  return { ok: true, target: t.abs, path: clean, bytes: bytes.length, type: kind.type, replaced: exists };
}

export async function readProjectAsset(target, rel) {
  const t = await projectRoot(target);
  if (!t.ok) return t;
  const clean = assetPath(rel);
  if (!clean) return { ok: false, error: 'asset path must be under assets/ and end in .png, .jpg or .webp' };
  const abs = path.join(t.abs, clean);
  if (!abs.startsWith(t.abs + path.sep)) return { ok: false, error: 'path escapes target' };
  let bytes;
  try { bytes = await fs.readFile(abs); } catch (err) { return { ok: false, error: err.code === 'ENOENT' ? 'asset not found' : err.message }; }
  if (bytes.length > MAX_ASSET_BYTES) return { ok: false, error: 'asset too large' };
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: 'not an image' };
  return { ok: true, path: clean, bytes, contentType: kind.type };
}
