// =============================================================================
// fab-stack-sidebar-evidence.mjs — before/after evidence for #571
// =============================================================================
// Below lg, the docs-sidebar FAB (#sidebarFab, slot 2) and the Obsidian
// local-graph FAB (#obsidianLocalGraphFab) resolved to the SAME box, and the
// graph FAB (z-index 1060 > 1055) swallowed every tap meant for the sidebar FAB.
// The fix moves the graph FAB to slot 3 below lg whenever #sidebarFab is on the
// page (`body:has(#sidebarFab)` in _sass/core/_obsidian.scss).
//
// Same self-contained method as fab-stack-evidence.mjs: compile the REAL theme
// stylesheet with dart-sass, render the REAL FAB markup in the real
// `<body class="zer0-bg-body">` context, measure with host Chromium. The FABs
// are `position: fixed`, so the geometry equals the live site's; no Docker.
//
// BEFORE is reproduced with UNFIX_CSS (puts the graph FAB back on slot 2).
//
// Usage:
//   node test/visual/fab-stack-sidebar-evidence.mjs
// Output: test/visual/evidence/fab-stack-sidebar/  (montage + metrics.json + snippet)
// =============================================================================
import { chromium } from '@playwright/test';
import * as sass from 'sass';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Every path below is repo-relative; resolve them from this file, not the cwd.
process.chdir(fileURLToPath(new URL('../..', import.meta.url)));

const outDir = 'test/visual/evidence/fab-stack-sidebar';
fs.mkdirSync(outDir, { recursive: true });

const mainScss = fs.readFileSync('assets/css/main.scss', 'utf8')
  .replace(/^---[\s\S]*?---\s*/, '');
const themeCss = sass.compileString(mainScss, {
  loadPaths: ['_sass'],
  style: 'expanded',
  silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls', 'legacy-js-api'],
}).css;
const bootstrapCss = fs.readFileSync('assets/vendor/bootstrap/css/bootstrap.min.css', 'utf8');

// Real markup: _includes/components/page-feedback.html,
// _includes/navigation/local-graph-fab.html (un-hidden, as the JS does once the
// page is in the wiki-index) and _layouts/default.html #sidebarFab.
const FAB_HTML = `
  <button type="button" id="pageFeedbackFab" class="pf-fab btn shadow-lg position-fixed"
          aria-label="Improve this page" title="Improve this page">
    <i class="bi bi-megaphone" aria-hidden="true"></i>
  </button>
  <div class="position-fixed bd-sidebar-fab d-lg-none" id="sidebarFab">
    <button class="btn btn-outline-secondary bd-sidebar-toggle" type="button"
            aria-label="Show sidebar" title="Show sidebar">
      <i class="bi bi-layout-sidebar" aria-hidden="true"></i>
    </button>
  </div>
  <div id="obsidianLocalGraphFab" class="obsidian-local-graph-fab d-print-none" data-obsidian-local-graph-toggle>
    <button class="btn btn-primary rounded-circle shadow-lg p-0 obsidian-local-graph-toggle" type="button"
            aria-label="Open local graph" title="Open local graph">
      <i class="bi bi-diagram-3 fs-5" aria-hidden="true"></i>
    </button>
  </div>`;

// Reverts the fix → the graph FAB sits on slot 2 at every width (the #571 bug).
const UNFIX_CSS = `
  body #obsidianLocalGraphFab.obsidian-local-graph-fab {
    bottom: calc(var(--zer0-space-fab-offset, 1rem) + var(--zer0-space-fab-size, 3.5rem) + var(--zer0-space-fab-gap, 0.75rem)) !important;
  }`;

// Visualization only: green = feedback (1), blue = sidebar (2), red = graph.
const OUTLINE_CSS = `
  #pageFeedbackFab { outline: 3px solid #16a34a; outline-offset: 2px; }
  #sidebarFab { outline: 3px solid #2563eb; outline-offset: 2px; }
  #obsidianLocalGraphFab { outline: 3px dashed #dc2626; outline-offset: 5px; }`;

const pageHtml = (extraCss) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${bootstrapCss}</style>
<style>${themeCss}</style>
<style>html, body { height: 100%; } body { margin: 0; }</style>
<style>${OUTLINE_CSS}</style>
${extraCss ? `<style>${extraCss}</style>` : ''}
</head>
<body class="zer0-bg-body">
  ${FAB_HTML}
</body></html>`;

const overlapArea = (a, b) => {
  if (!a || !b || !a.width || !b.width) return 0;
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return Math.round(x * y);
};

const measure = (page) => page.evaluate(() => {
  const read = (sel) => {
    const el = document.querySelector(sel);
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return { visible: false };
    const r = el.getBoundingClientRect();
    return {
      visible: true,
      x: Math.round(r.x), y: Math.round(r.y),
      width: Math.round(r.width), height: Math.round(r.height),
      bottomPx: Math.round(parseFloat(cs.bottom)),
    };
  };
  const sidebar = read('#sidebarFab');
  let tapReaches = null;
  if (sidebar.visible) {
    const hit = document.elementFromPoint(sidebar.x + sidebar.width / 2, sidebar.y + sidebar.height / 2);
    tapReaches = hit?.closest('#sidebarFab') ? 'sidebar'
      : hit?.closest('#obsidianLocalGraphFab') ? 'graph' : (hit?.id || hit?.tagName || 'nothing');
  }
  return { feedback: read('#pageFeedbackFab'), sidebar, graph: read('#obsidianLocalGraphFab'), tapReaches };
});

const WIDTHS = [390, 768, 1280];
const CROP = { width: 230, height: 300 };

const browser = await chromium.launch();
const metrics = {
  slug: 'fab-stack-sidebar',
  issue: 571,
  method: 'dart-sass compiled theme CSS + host Chromium (position:fixed → live-site-equivalent geometry)',
  widths: [],
};
const crops = [];
try {
  for (const w of WIDTHS) {
    const h = 780;
    for (const state of ['before', 'after']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.setContent(pageHtml(state === 'before' ? UNFIX_CSS : ''), { waitUntil: 'load' });
      const m = await measure(page);
      const file = `${outDir}/crop-${w}-${state}.png`;
      await page.screenshot({ path: file, clip: { x: 0, y: h - CROP.height, width: CROP.width, height: CROP.height } });
      crops.push({ w, state, file, m, overlap: overlapArea(m.sidebar, m.graph) });
      await ctx.close();
    }
    const b = crops.find((c) => c.w === w && c.state === 'before');
    const a = crops.find((c) => c.w === w && c.state === 'after');
    metrics.widths.push({
      width: w,
      sidebarVisible: a.m.sidebar.visible,
      before: { graphBottomPx: b.m.graph.bottomPx, sidebarGraphOverlapPx2: b.overlap, sidebarTapReaches: b.m.tapReaches },
      after: { graphBottomPx: a.m.graph.bottomPx, sidebarGraphOverlapPx2: a.overlap, sidebarTapReaches: a.m.tapReaches },
      sidebarBottomPx: a.m.sidebar.bottomPx ?? null,
    });
  }

  const asData = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
  const rows = WIDTHS.map((w) => {
    const cell = (state, label) => {
      const c = crops.find((x) => x.w === w && x.state === state);
      const tap = c.m.tapReaches ? `tap on sidebar FAB → ${c.m.tapReaches}` : 'sidebar FAB hidden (lg+)';
      const bad = c.overlap > 0;
      return `<figure><figcaption>${label} — ${w}px<br><span class="${bad ? 'bad' : 'ok'}">`
        + `sidebar↔graph overlap: ${c.overlap}px² · ${tap}</span></figcaption>`
        + `<img src="${asData(c.file)}" width="${CROP.width}" height="${CROP.height}"></figure>`;
    };
    return `<div class="row">${cell('before', 'BEFORE (main)')}${cell('after', 'AFTER (this PR)')}</div>`;
  }).join('');
  const montageHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 20px; font: 14px system-ui, sans-serif; background: #fff; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 4px; } .sub { color: #475569; margin: 0 0 16px; font-size: 13px; }
    .row { display: flex; gap: 24px; margin-bottom: 20px; }
    figure { margin: 0; } figcaption { font-size: 12px; margin-bottom: 6px; max-width: 300px; }
    img { border: 1px solid #e2e8f0; border-radius: 8px; display: block; background: #fff; }
    .ok { color: #16a34a; font-weight: 600; } .bad { color: #dc2626; font-weight: 600; }
  </style></head><body>
    <h1>Left-side FAB stack with the docs sidebar — before vs after (#571)</h1>
    <p class="sub">Real compiled theme CSS + real FAB markup. <span style="color:#16a34a">■</span> feedback (slot 1) ·
      <span style="color:#2563eb">■</span> docs sidebar (slot 2, &lt;lg) · <span style="color:#dc2626">▪▪</span> local graph.</p>
    ${rows}
    <p class="sub">BEFORE: below lg the graph FAB sits exactly on the sidebar FAB and takes its taps.
      AFTER: below lg the graph FAB moves to slot 3; at lg+ (no sidebar FAB) it stays at slot 2.</p>
  </body></html>`;
  const mctx = await browser.newContext({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
  const mpage = await mctx.newPage();
  await mpage.setContent(montageHtml, { waitUntil: 'load' });
  await mpage.screenshot({ path: `${outDir}/01-before-after.png`, fullPage: true });
  await mctx.close();

  for (const c of crops) { try { fs.unlinkSync(c.file); } catch { /* already gone */ } }

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
  const worst = Math.max(...metrics.widths.map((x) => x.before.sidebarGraphOverlapPx2 || 0));
  const snippet = `<!-- CHANGELOG snippet — evidence: ${outDir}/ -->\n`
    + `  (evidence: [\`${outDir}/\`](${outDir}/README.md)`
    + ` — sidebar↔local-graph FAB overlap ${worst}px² → 0 below lg).`;
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet + '\n');

  console.log('fab-stack-sidebar evidence written to', outDir);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
