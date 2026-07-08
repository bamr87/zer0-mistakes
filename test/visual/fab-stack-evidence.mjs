// =============================================================================
// fab-stack-evidence.mjs — before/after evidence for the left-side FAB stack
// =============================================================================
// Proves PR #289 / #288: the page-feedback FAB (#pageFeedbackFab, slot 1) and
// the Obsidian local-graph FAB (#obsidianLocalGraphFab, moved to slot 2) no
// longer overlap. Also covers the docs-sidebar restore FAB (.bd-sidebar-fab
// --restore) which shared the same collision on mobile.
//
// WHY THIS KIT DIFFERS FROM THE OTHER *-evidence.mjs SCRIPTS
// ---------------------------------------------------------------------------
// The sibling kits (page-feedback, navbar, …) drive a live Jekyll dev server
// (Docker, BASE_URL). This one is self-contained: it compiles the REAL theme
// stylesheet with dart-sass (assets/css/main.scss → the same CSS Jekyll emits,
// including this fix) and renders the REAL FAB markup inside the real
// `<body class="zer0-bg-body">` elevation context, then measures geometry with
// host Chromium. Because these FABs are `position: fixed` (viewport-relative,
// independent of page content), the measured geometry is identical to the live
// site — but it needs no multi-GB Docker image, so it runs anywhere.
//
// BEFORE is reproduced with `UNFIX_CSS` (reverts the two slot-2 rules back to
// `bottom: 1rem`), exactly like evidence-kit.mjs's `unfixCss` pattern.
//
// Usage:
//   node test/visual/fab-stack-evidence.mjs
// Output: test/visual/evidence/fab-stack/  (montage + metrics.json + snippet)
// =============================================================================
import { chromium } from '@playwright/test';
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const outDir = 'test/visual/evidence/fab-stack';
fs.mkdirSync(outDir, { recursive: true });

// --- 1. Compile the real theme CSS (strip the Jekyll front matter) -----------
const mainScss = fs.readFileSync('assets/css/main.scss', 'utf8')
  .replace(/^---[\s\S]*?---\s*/, ''); // drop the leading `---\n---` front matter
const themeCss = sass.compileString(mainScss, {
  loadPaths: ['_sass'],
  style: 'expanded',
  silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls', 'legacy-js-api'],
}).css;
const bootstrapCss = fs.readFileSync('assets/vendor/bootstrap/css/bootstrap.min.css', 'utf8');

// --- 2. Real FAB markup (copied verbatim from the includes) ------------------
// #pageFeedbackFab: _includes/components/page-feedback.html
// #obsidianLocalGraphFab: _includes/navigation/local-graph-fab.html (un-hidden,
//   as obsidian-local-graph.js does once the page is confirmed in the index)
// #sidebarFab: _layouts/default.html + .bd-sidebar-fab--restore (added by
//   assets/js/modules/navigation/sidebar-visibility.js when the sidebar is hidden)
const FAB_HTML = `
  <button type="button" id="pageFeedbackFab" class="pf-fab btn shadow-lg position-fixed"
          aria-label="Improve this page" title="Improve this page">
    <i class="bi bi-megaphone" aria-hidden="true"></i>
  </button>
  <div id="obsidianLocalGraphFab" class="obsidian-local-graph-fab d-print-none" data-obsidian-local-graph-toggle>
    <button class="btn btn-primary rounded-circle shadow-lg p-0 obsidian-local-graph-toggle" type="button"
            aria-label="Open local graph" title="Open local graph">
      <i class="bi bi-diagram-3 fs-5" aria-hidden="true"></i>
    </button>
  </div>
  <div class="position-fixed bd-sidebar-fab bd-sidebar-fab--restore d-lg-none" id="sidebarFab">
    <button class="btn btn-outline-secondary bd-sidebar-toggle" type="button"
            aria-label="Show sidebar" title="Show sidebar">
      <i class="bi bi-layout-sidebar" aria-hidden="true"></i>
    </button>
  </div>`;

// Reverts the fix → both slot-2 FABs collapse back onto slot 1 (the #288 bug).
const UNFIX_CSS = `
  #obsidianLocalGraphFab.obsidian-local-graph-fab { bottom: var(--zer0-space-fab-offset, 1rem) !important; }
  .bd-sidebar-fab.bd-sidebar-fab--restore { bottom: var(--zer0-space-fab-offset, 1rem) !important; }`;

// Outline the two left-edge FABs so the montage reads at a glance
// (green = feedback / slot 1, red = obsidian / slot 2). Visualization only.
const OUTLINE_CSS = `
  #pageFeedbackFab { outline: 3px solid #16a34a; outline-offset: 2px; }
  #obsidianLocalGraphFab .btn, #obsidianLocalGraphFab { outline: 3px solid #dc2626; outline-offset: 2px; }`;

const pageHtml = (extraCss) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${bootstrapCss}</style>
<style>${themeCss}</style>
<style>
  html, body { height: 100%; }
  body { margin: 0; }
  .corner-label { position: fixed; left: 1rem; bottom: 10rem; font: 600 13px/1.4 system-ui, sans-serif;
    color: #334155; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; }
</style>
<style>${OUTLINE_CSS}</style>
${extraCss ? `<style>${extraCss}</style>` : ''}
</head>
<body class="zer0-bg-body">
  <div class="corner-label">viewport bottom-left</div>
  ${FAB_HTML}
</body></html>`;

const boxesOverlapArea = (a, b) => {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return Math.round(x * y);
};

const measure = (page) => page.evaluate(() => {
  const read = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x), y: Math.round(r.y),
      width: Math.round(r.width), height: Math.round(r.height),
      bottomPx: Math.round(parseFloat(getComputedStyle(el).bottom)),
    };
  };
  return { feedback: read('#pageFeedbackFab'), obsidian: read('#obsidianLocalGraphFab'), sidebar: read('#sidebarFab') };
});

const WIDTHS = [390, 768, 1280]; // mobile / tablet / desktop
const CROP = { width: 230, height: 230 }; // bottom-left region that holds the stack

const browser = await chromium.launch();
const metrics = { slug: 'fab-stack', method: 'dart-sass compiled theme CSS + host Chromium (position:fixed → live-site-equivalent geometry)', widths: [] };
const cropFiles = [];
try {
  for (const w of WIDTHS) {
    const h = 780;
    for (const state of ['before', 'after']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.setContent(pageHtml(state === 'before' ? UNFIX_CSS : ''), { waitUntil: 'load' });
      const m = await measure(page);
      const overlap = m.feedback && m.obsidian ? boxesOverlapArea(m.feedback, m.obsidian) : null;
      const file = `${outDir}/crop-${w}-${state}.png`;
      await page.screenshot({ path: file, clip: { x: 0, y: h - CROP.height, width: CROP.width, height: CROP.height } });
      cropFiles.push({ w, state, file, m, overlap });
      await ctx.close();
    }
    const before = cropFiles.find((c) => c.w === w && c.state === 'before');
    const after = cropFiles.find((c) => c.w === w && c.state === 'after');
    metrics.widths.push({
      width: w,
      before: { obsidianBottomPx: before.m.obsidian?.bottomPx, feedbackObsidianOverlapPx2: before.overlap },
      after: { obsidianBottomPx: after.m.obsidian?.bottomPx, feedbackObsidianOverlapPx2: after.overlap },
      sidebarRestoreBottomPx: { before: before.m.sidebar?.bottomPx, after: after.m.sidebar?.bottomPx },
    });
  }

  // --- Montage: rows = widths, cols = before | after --------------------------
  const asData = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
  const rows = WIDTHS.map((w) => {
    const b = cropFiles.find((c) => c.w === w && c.state === 'before');
    const a = cropFiles.find((c) => c.w === w && c.state === 'after');
    const cap = (c, label) => `<figure><figcaption>${label} — ${w}px<br><span class="${c.overlap ? 'bad' : 'ok'}">`
      + `feedback↔obsidian overlap: ${c.overlap}px²</span></figcaption>`
      + `<img src="${asData(c.file)}" width="${CROP.width}" height="${CROP.height}"></figure>`;
    return `<div class="row">${cap(b, 'BEFORE (pre-fix)')}${cap(a, 'AFTER (this PR)')}</div>`;
  }).join('');
  const montageHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 20px; font: 14px system-ui, sans-serif; background: #fff; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 4px; } .sub { color: #475569; margin: 0 0 16px; font-size: 13px; }
    .row { display: flex; gap: 24px; margin-bottom: 20px; }
    figure { margin: 0; } figcaption { font-size: 12px; margin-bottom: 6px; }
    img { border: 1px solid #e2e8f0; border-radius: 8px; display: block; background: #fff; }
    .ok { color: #16a34a; font-weight: 600; } .bad { color: #dc2626; font-weight: 600; }
    .legend { font-size: 12px; color: #475569; margin-top: 8px; }
  </style></head><body>
    <h1>Left-side FAB stack — before vs after (#289)</h1>
    <p class="sub">Real compiled theme CSS + real FAB markup. <span style="color:#16a34a">■</span> feedback FAB (slot 1) ·
      <span style="color:#dc2626">■</span> Obsidian local-graph FAB (slot 2).</p>
    ${rows}
    <p class="legend">BEFORE: both anchored at <code>bottom: 1rem</code> → the obsidian FAB (higher z-index) sits
      directly on top of the feedback FAB. AFTER: the obsidian FAB moves to slot 2
      (<code>bottom: calc(offset + size + gap)</code>), stacking above with a clear gap.</p>
  </body></html>`;
  const mctx = await browser.newContext({ viewport: { width: 720, height: 900 }, deviceScaleFactor: 2 });
  const mpage = await mctx.newPage();
  await mpage.setContent(montageHtml, { waitUntil: 'load' });
  await mpage.screenshot({ path: `${outDir}/01-before-after.png`, fullPage: true });
  await mctx.close();

  // Clean up the per-width crops now that they're embedded in the montage.
  for (const c of cropFiles) { try { fs.unlinkSync(c.file); } catch { /* ignore */ } }

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');

  const worst = Math.max(...metrics.widths.map((x) => x.before.feedbackObsidianOverlapPx2 || 0));
  const snippet = `<!-- CHANGELOG snippet — evidence: test/visual/evidence/fab-stack/ -->\n`
    + `  (evidence: [\`test/visual/evidence/fab-stack/\`](test/visual/evidence/fab-stack/README.md)`
    + ` — feedback↔obsidian FAB overlap ${worst}px² → 0).`;
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet + '\n');

  console.log('fab-stack evidence written to', outDir);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
