/**
 * Evidence for #375 — developer doc banners shipping as HTML comments.
 *
 * There is nothing to screenshot: the change removes bytes that were never
 * painted. So this bundle measures the DELIVERED HTML of two full builds
 * instead, and — the part that actually matters — proves the two builds are
 * content-identical once comments and build-volatile values are masked.
 *
 * Usage:
 *   git worktree add /tmp/before <pre-fix-ref>
 *   (cd /tmp/before && bundle exec jekyll build -d /tmp/site-before)
 *   bundle exec jekyll build -d /tmp/site-after
 *   BEFORE_DIR=/tmp/site-before AFTER_DIR=/tmp/site-after \
 *     node test/visual/doc-banner-evidence.mjs
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const BEFORE = process.env.BEFORE_DIR || '/tmp/site-before';
const AFTER = process.env.AFTER_DIR || '/tmp/site-after';
const OUT = path.join(process.cwd(), 'test/visual/evidence/developer-doc-banners');

/** Values that differ between ANY two builds minutes apart. Masking them is
 *  what lets "content identical" be a real claim rather than a hopeful one. */
const VOLATILE = [
  [/\?v=\d+/g, '?v=BUILD'],
  [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2}|Z)/g, 'TIMESTAMP'],
  [/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}( UTC)?/g, 'TIMESTAMP'],
  [/data-date="\d+"/g, 'data-date="EPOCH"'],
  [/(data-testid="theme-build-stamp">)[^<]*/g, '$1BUILDSTAMP'],
  [/[A-Z][a-z]{2} \d{2}, \d{2}:\d{2}/g, 'BUILDSTAMP'],
];

const stripComments = (s) => {
  // indexOf/slice rather than a regex: this runs over whole built pages, and
  // an unbounded pattern across megabytes is how you write an accidental
  // catastrophic backtrack (see the CodeQL finding on head-contract.spec.js).
  let out = '', i = 0;
  for (;;) {
    const a = s.indexOf('<!--', i);
    if (a === -1) return out + s.slice(i);
    const b = s.indexOf('-->', a + 4);
    if (b === -1) return out + s.slice(i, a);
    out += s.slice(i, a);
    i = b + 3;
  }
};

const commentStats = (s) => {
  let bytes = 0, blocks = 0, i = 0;
  for (;;) {
    const a = s.indexOf('<!--', i);
    if (a === -1) return { bytes, blocks };
    const b = s.indexOf('-->', a + 4);
    if (b === -1) return { bytes, blocks };
    bytes += b + 3 - a; blocks += 1; i = b + 3;
  }
};

const normalise = (s) => {
  let t = stripComments(s);
  for (const [rx, rep] of VOLATILE) t = t.replace(rx, rep);
  return t.replace(/\s+/g, ' ').trim();
};

async function htmlFiles(root, rel = '') {
  const out = [];
  for (const e of await readdir(path.join(root, rel), { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(root, r));
    else if (e.name.endsWith('.html')) out.push(r);
  }
  return out;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const rels = (await htmlFiles(BEFORE)).sort();
  const m = {
    before_dir: BEFORE, after_dir: AFTER, pages: rels.length,
    html_bytes_before: 0, html_bytes_after: 0,
    comment_bytes_before: 0, comment_bytes_after: 0,
    comment_blocks_before: 0, comment_blocks_after: 0,
    pages_differing: [],
  };

  for (const rel of rels) {
    let sb, sa;
    try {
      sb = await readFile(path.join(BEFORE, rel), 'utf8');
      sa = await readFile(path.join(AFTER, rel), 'utf8');
    } catch { m.pages_differing.push({ page: rel, why: 'missing in one build' }); continue; }

    m.html_bytes_before += sb.length; m.html_bytes_after += sa.length;
    const cb = commentStats(sb), ca = commentStats(sa);
    m.comment_bytes_before += cb.bytes; m.comment_bytes_after += ca.bytes;
    m.comment_blocks_before += cb.blocks; m.comment_blocks_after += ca.blocks;

    if (normalise(sb) !== normalise(sa)) m.pages_differing.push({ page: rel, why: 'content' });
  }

  const removed = m.html_bytes_before - m.html_bytes_after;
  m.html_bytes_removed = removed;
  m.html_percent_removed = +(100 * removed / m.html_bytes_before).toFixed(1);
  m.comment_bytes_per_page_before = Math.round(m.comment_bytes_before / m.pages);
  m.comment_bytes_per_page_after = Math.round(m.comment_bytes_after / m.pages);

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(m, null, 2) + '\n');
  console.log(`pages ${m.pages}`);
  console.log(`delivered HTML  ${m.html_bytes_before.toLocaleString()} -> ${m.html_bytes_after.toLocaleString()} (${m.html_percent_removed}% removed)`);
  console.log(`comment payload ${m.comment_bytes_before.toLocaleString()} -> ${m.comment_bytes_after.toLocaleString()} in ${m.comment_blocks_before.toLocaleString()} -> ${m.comment_blocks_after.toLocaleString()} blocks`);
  console.log(`pages differing in content: ${m.pages_differing.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
