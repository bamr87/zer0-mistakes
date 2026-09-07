// Feature: ZER0-085
/**
 * Compose a Playwright run's pixel-snapshot failures into ONE image a reviewer
 * can read: one row per skin — expected (the committed baseline) | actual (this
 * PR's render) | diff — with the pixel count the assertion reported.
 *
 * This is what makes re-blessing baselines reviewable instead of blind (#417):
 * the visual-evidence-reviewer agent looks at this montage to decide whether
 * the diff is the change the PR describes, and once blessed the same image is
 * kept under test/visual/evidence/<slug>/ so a human sees it in the PR.
 *
 * Usage (inside the jammy image, after `npx playwright test --project=snapshots`):
 *   node test/visual/snapshot-diff-montage.mjs \
 *     --results test/visual-results/results.json \
 *     --out     test/visual-results/autogen/snapshot-diff.png \
 *     --summary test/visual-results/autogen/snapshot-diff.json
 *
 * Exits 0 always: with no pixel failures it writes an empty summary and no PNG.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const args = {};
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
}
const resultsPath = args.results || 'test/visual-results/results.json';
const outPath = args.out || 'test/visual-results/autogen/snapshot-diff.png';
const summaryPath = args.summary || 'test/visual-results/autogen/snapshot-diff.json';
const panelWidth = Number(args['panel-width'] || 420);

const stripAnsi = (s) => String(s || '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
// Playwright records attachment paths as absolute container paths (/work/…);
// keep them repo-relative so they read the same on the host.
const rel = (p) => (p ? String(p).replace(/^\/work\//, '').replace(`${process.cwd()}/`, '') : null);

export function collectFailures(results) {
  const failures = [];
  const walk = (suite, titles) => {
    const here = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs || []) {
      const specTitles = [...here, spec.title || ''];
      for (const t of spec.tests || []) {
        const final = (t.results || []).at(-1) || {};
        if (final.status === 'passed' || final.status === 'skipped') continue;
        const att = Object.fromEntries((final.attachments || []).map((a) => [a.name || '', a.path]));
        const pick = (suffix) => Object.entries(att).find(([k]) => k.endsWith(suffix))?.[1] || null;
        const diff = pick('-diff');
        if (!diff) continue; // a failure without a diff image is not a pixel diff
        const skin =
          specTitles.find((s) => s.startsWith('skin:'))?.split(':')[1].trim() ||
          Object.keys(att).find((k) => k.endsWith('-diff'))?.replace(/-diff$/, '').replace(/^homepage-/, '') ||
          '?';
        const message = stripAnsi(final.error && final.error.message);
        const px = message.match(/(\d+) pixels/);
        failures.push({
          skin, status: final.status, diffPx: px ? Number(px[1]) : null,
          expected: rel(pick('-expected')), actual: rel(pick('-actual')), diff: rel(diff),
        });
      }
    }
    for (const child of suite.suites || []) walk(child, here);
  };
  for (const s of results.suites || []) walk(s, []);
  return failures;
}

const b64 = (p) => {
  try {
    return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
  } catch {
    return null;
  }
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function html(failures) {
  const rows = failures.map((f) => {
    const cells = ['expected', 'actual', 'diff'].map((k) => {
      const src = f[k] ? b64(f[k]) : null;
      return `<figure><figcaption>${k}</figcaption>${
        src ? `<img src="${src}" alt="${esc(f.skin)} ${k}">` : '<div class="missing">missing</div>'
      }</figure>`;
    }).join('');
    return `<div class="row"><div class="skin">${esc(f.skin)}<small>${
      f.diffPx == null ? f.status : `${f.diffPx.toLocaleString()} px differ`
    }</small></div>${cells}</div>`;
  }).join('');
  const width = 150 + panelWidth * 3 + 4 * 14;
  return `<!doctype html><meta charset="utf8"><style>
    *{box-sizing:border-box;margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
    body{background:#0d1117;color:#e6edf3;padding:20px;width:${width}px}
    h1{font-size:18px;margin-bottom:4px}.sub{font-size:13px;color:#8b949e;margin-bottom:16px}
    .row{display:grid;grid-template-columns:120px repeat(3,${panelWidth}px);gap:14px;align-items:start;
         background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:12px}
    .skin{font-weight:600;font-size:14px}.skin small{display:block;color:#8b949e;font-weight:400;margin-top:6px}
    figure{width:${panelWidth}px}figcaption{font-size:12px;color:#8b949e;margin-bottom:6px}
    img{display:block;width:100%;border:1px solid #30363d;border-radius:4px}
    .missing{height:120px;display:grid;place-items:center;color:#8b949e;border:1px dashed #30363d;border-radius:4px}
  </style><h1>Pixel baselines — expected vs this PR (${failures.length} skin${failures.length === 1 ? '' : 's'} differ)</h1>
  <div class="sub">Left: the committed baseline. Middle: this branch rendered in the same jammy image. Right: Playwright's diff (changed pixels highlighted).</div>${rows}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let results;
  try {
    results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  } catch (err) {
    console.log(`[snapshot-diff] no readable results at ${resultsPath} (${err.message}) — nothing to compose`);
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.writeFileSync(summaryPath, JSON.stringify({ failures: [], note: 'no results.json' }, null, 2));
    process.exit(0);
  }
  const failures = collectFailures(results);
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify({ failures }, null, 2));
  console.log(`[snapshot-diff] ${failures.length} pixel failure(s)`);
  if (!failures.length) process.exit(0);
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.setContent(html(failures), { waitUntil: 'load' });
  await page.waitForTimeout(150);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await (await page.$('body')).screenshot({ path: outPath });
  await browser.close();
  console.log(`[snapshot-diff] wrote ${outPath}`);
}
