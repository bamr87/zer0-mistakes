/**
 * ===================================================================
 * page-store.mjs — local working-tree page reads/writes (DEV ONLY)
 * ===================================================================
 *
 * Path: templates/deploy/chat-proxy/page-store.mjs
 * Purpose: Read and write the current page's source file on the local
 *          filesystem so the AI chat assistant can apply content/UI edits
 *          during local development (the dev server live-reloads them).
 *
 * Used ONLY by dev-proxy.mjs. The Cloudflare Worker (worker.js) has no
 * filesystem and never imports this — page editing is a local-dev power,
 * not a production one.
 *
 * Safety:
 *   - Paths resolve against the repo root (cwd, or CHAT_DEV_REPO_ROOT) and
 *     may not escape it (no `..`, no absolute breakout).
 *   - Only content extensions (.md/.markdown/.html/.htm) are editable.
 *   - Writes target EXISTING files only — the assistant edits a page, it
 *     cannot create arbitrary files.
 * ===================================================================
 */

import path from 'node:path';
import fs from 'node:fs/promises';

const REPO_ROOT = path.resolve(process.env.CHAT_DEV_REPO_ROOT || process.cwd());
const ALLOWED_EXT = new Set(['.md', '.markdown', '.html', '.htm']);

export function repoRoot() {
  return REPO_ROOT;
}

export function resolveRepoPath(rel) {
  const cleaned = String(rel || '').replace(/^\/+/, '').trim();
  if (!cleaned) return { error: 'no path provided' };
  if (cleaned.includes('\0')) return { error: 'invalid path' };
  const abs = path.resolve(REPO_ROOT, cleaned);
  if (abs !== REPO_ROOT && !abs.startsWith(REPO_ROOT + path.sep)) {
    return { error: 'path escapes the repository root' };
  }
  if (!ALLOWED_EXT.has(path.extname(abs).toLowerCase())) {
    return { error: `only ${[...ALLOWED_EXT].join(', ')} files can be edited` };
  }
  return { abs, rel: path.relative(REPO_ROOT, abs) };
}

export async function readPage(rel) {
  const r = resolveRepoPath(rel);
  if (r.error) return { ok: false, error: r.error };
  try {
    const content = await fs.readFile(r.abs, 'utf8');
    return { ok: true, path: r.rel, content };
  } catch (e) {
    return { ok: false, error: `cannot read ${r.rel}: ${e.code || e.message}` };
  }
}

export async function writePage(rel, content) {
  const r = resolveRepoPath(rel);
  if (r.error) return { ok: false, error: r.error };
  if (typeof content !== 'string') return { ok: false, error: 'updated_content must be a string' };
  try {
    const stat = await fs.stat(r.abs);
    if (!stat.isFile()) return { ok: false, error: `${r.rel} is not a file` };
  } catch {
    return { ok: false, error: `file does not exist: ${r.rel} (the assistant edits existing pages, it does not create files)` };
  }
  try {
    await fs.writeFile(r.abs, content, 'utf8');
    return { ok: true, path: r.rel, bytes: Buffer.byteLength(content, 'utf8') };
  } catch (e) {
    return { ok: false, error: `cannot write ${r.rel}: ${e.code || e.message}` };
  }
}
