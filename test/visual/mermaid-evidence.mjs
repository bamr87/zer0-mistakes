// Feature: ZER0-013
// =============================================================================
// mermaid-evidence.mjs — evidence for the Mermaid diagram figures (ZER0-013)
// =============================================================================
// Captures the same scenes in the BEFORE state (the old inline include on
// `main`) and the AFTER state (assets/js/mermaid-diagrams.js), so the montage
// compares like with like. The scene list is generic — it finds "the first
// diagram" whether it is the old `.mermaid` div or the new `figure.zer0-diagram`
// — and every number in metrics.json is read off the live page.
//
// Scenes (route /quickstart/ unless noted):
//   01 light, desktop                 the default rendering
//   02 dark, after a live toggle      the regression: before, the SVG is gone
//                                     and the div shows its leaked stylesheet
//   03 phone (390px, touch)           fit-to-width + where the toolbar sits
//   04 skin "neon"                    palette follows the skin (after) / not (before)
//   05 syntax error                   a broken diagram injected through the
//                                     page's own code path
//   06 zoomed to 195%      (after)    real-layout zoom, scrollable frame
//   07 fullscreen dialog   (after)
//   08 pie + gantt         (after)    series colours, docs page
//
// Usage (server already up — see the run-zer0-mistakes skill):
//   BASE_URL=http://localhost:4000 node test/visual/mermaid-evidence.mjs           # after
//   git stash && <rebuild> && EVIDENCE_STATE=before node test/visual/mermaid-evidence.mjs
//   PW_CHROMIUM_PATH=/path/to/chrome … to use a specific Chromium build.
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const STATE = process.env.EVIDENCE_STATE === 'before' ? 'before' : 'after';
const outDir = 'test/visual/evidence/mermaid';
fs.mkdirSync(outDir, { recursive: true });

const QUICKSTART = '/quickstart/';
const DOCS = '/docs/features/mermaid-diagrams/';
const DIAGRAM = 'figure.zer0-diagram, .mermaid';

// Keep the cookie banner out of the frame — presentation only.
const SEED_CONSENT = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  } catch (e) { /* ignore */ }
};

// A broken definition, inserted after the first diagram by the page's own
// conversion path: BEFORE, the inline include's DOMContentLoaded handler
// (registered after this one, so it runs after it) picks the div up with
// mermaid.run(); AFTER, the deferred script has already run, so the public API
// renders it.
const INJECT_BROKEN = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.setAttribute('data-evidence', 'broken');
    div.textContent = 'graph TD\n  A[Start] -> B[Broken arrow]';
    const first = document.querySelector('pre > code.language-mermaid, .mermaid, figure.zer0-diagram');
    const anchor = first && (first.closest('figure.zer0-diagram') || first.closest('pre') || first);
    (anchor || document.querySelector('#main-content, main')).after(div);
    if (window.zer0Mermaid) window.zer0Mermaid.render(div);
  });
};

const settle = async (page) => {
  await page.waitForFunction(() => {
    const figs = Array.from(document.querySelectorAll('figure.zer0-diagram'));
    if (figs.length) return figs.every((f) => !f.classList.contains('is-loading'));
    return document.querySelectorAll('.mermaid[data-processed]').length > 0;
  }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
};

const read = (page, index = 0) => page.evaluate(({ sel, index }) => {
  const el = document.querySelectorAll(sel)[index];
  const svg = el && el.querySelector('svg');
  const toolbar = el && el.querySelector('.zer0-diagram__toolbar');
  // A flowchart node shape only — a bare `path` would match the arrow marker in <defs> first.
  const shape = svg && svg.querySelector('.node rect, .node polygon, .node path');
  return {
    kind: el ? (el.tagName === 'FIGURE' ? 'figure' : 'div.mermaid') : null,
    hasSvg: !!svg,
    svgWidth: svg ? Math.round(svg.getBoundingClientRect().width) : null,
    // What the reader actually sees — the regression put the SVG's own CSS on screen.
    leakedStylesheetOnScreen: !!el && el.innerText.includes('font-family'),
    nodeFill: shape ? getComputedStyle(shape).fill : null,
    nodeStroke: shape ? getComputedStyle(shape).stroke : null,
    toolbar: toolbar ? getComputedStyle(toolbar).position : 'none',
    toolbarAboveDiagram: toolbar && svg
      ? toolbar.getBoundingClientRect().bottom <= svg.getBoundingClientRect().top + 1 : null,
    errorCard: !!(el && el.querySelector('.zer0-diagram__error')),
    sourceKept: !!(el && el.querySelector('.zer0-diagram__source-text')),
    zoom: el && el.querySelector('.zer0-diagram__zoom') && !el.querySelector('.zer0-diagram__zoom').hidden
      ? el.querySelector('.zer0-diagram__zoom').textContent : '100%',
    frameScrolls: (() => { const v = el && el.querySelector('.zer0-diagram__viewport'); return v ? v.scrollWidth > v.clientWidth + 1 : null; })(),
    pageOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    theme: document.documentElement.getAttribute('data-bs-theme'),
    skin: document.documentElement.getAttribute('data-theme-skin'),
  };
}, { sel: DIAGRAM, index });

const shot = async (page, name, index = 0) => {
  const el = page.locator(DIAGRAM).nth(index);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await el.screenshot({ path: `${outDir}/${name}` });
};

const launchOpts = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
const browser = await chromium.launch(launchOpts);
const metrics = { state: STATE, base: BASE, scenes: {} };
const prefix = (n) => `${String(n).padStart(2, '0')}-${STATE}`;

try {
  // --- 01 light / 02 dark toggle / 04 skin — one desktop session -----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.goto(BASE + QUICKSTART, { waitUntil: 'load' });
  await settle(page);
  metrics.scenes.light_1280 = await read(page);
  await shot(page, `${prefix(1)}-light-1280.png`);

  await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
  await page.waitForTimeout(600);
  await settle(page);
  metrics.scenes.dark_after_toggle_1280 = await read(page);
  await shot(page, `${prefix(2)}-dark-after-toggle-1280.png`);
  await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'light'));
  await page.waitForTimeout(600);
  await settle(page);
  metrics.scenes.light_again_1280 = await read(page);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme-skin', 'neon'));
  await page.waitForTimeout(600);
  await settle(page);
  metrics.scenes.skin_neon_1280 = await read(page);
  await shot(page, `${prefix(4)}-skin-neon-1280.png`);
  await ctx.close();

  // --- 03 phone -------------------------------------------------------------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await mctx.newPage();
  await mp.addInitScript(SEED_CONSENT);
  await mp.goto(BASE + QUICKSTART, { waitUntil: 'load' });
  await settle(mp);
  metrics.scenes.mobile_390 = await read(mp);
  await shot(mp, `${prefix(3)}-mobile-390.png`);
  await mctx.close();

  // --- 05 syntax error --------------------------------------------------------
  const ectx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ep = await ectx.newPage();
  await ep.addInitScript(SEED_CONSENT);
  await ep.addInitScript(INJECT_BROKEN);
  await ep.goto(BASE + QUICKSTART, { waitUntil: 'load' });
  await settle(ep);
  // The injected diagram is the second one on the page (either shape).
  await ep.waitForFunction(() => document.querySelectorAll('figure.zer0-diagram, .mermaid').length >= 2, null, { timeout: 15000 }).catch(() => {});
  await ep.waitForTimeout(600);
  metrics.scenes.syntax_error = await read(ep, 1);
  await shot(ep, `${prefix(5)}-syntax-error.png`, 1);
  await ectx.close();

  if (STATE === 'after') {
    // --- 06 zoom / 07 fullscreen ---------------------------------------------
    const zctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const zp = await zctx.newPage();
    await zp.addInitScript(SEED_CONSENT);
    await zp.goto(BASE + QUICKSTART, { waitUntil: 'load' });
    await settle(zp);
    const fig = zp.locator('figure.zer0-diagram').first();
    await fig.scrollIntoViewIfNeeded();
    await fig.hover();
    for (let i = 0; i < 3; i++) await fig.locator('button[aria-label="Zoom in"]').click();
    await zp.waitForTimeout(200);
    metrics.scenes.zoomed_195 = await read(zp);
    await shot(zp, `${prefix(6)}-zoomed-195.png`);
    await fig.locator('button[aria-label="Reset zoom"]').click();

    await fig.hover();
    await fig.locator('button[aria-label="View fullscreen"]').click();
    await zp.waitForTimeout(400);
    metrics.scenes.fullscreen = await zp.evaluate(() => {
      const d = document.querySelector('dialog.zer0-diagram-lightbox');
      return {
        open: !!(d && d.open),
        svgInDialog: !!(d && d.querySelector('svg')),
        focusInsideDialog: !!(document.activeElement && document.activeElement.closest('dialog.zer0-diagram-lightbox')),
        scrollLocked: document.documentElement.classList.contains('zer0-diagram-lightbox-open'),
      };
    });
    await zp.screenshot({ path: `${outDir}/${prefix(7)}-fullscreen-1280.png` });
    await zp.keyboard.press('Escape');
    await zp.waitForTimeout(300);
    metrics.scenes.fullscreen.closedOnEscape = await zp.evaluate(() => !document.querySelector('dialog.zer0-diagram-lightbox').open && !!document.querySelector('figure.zer0-diagram svg'));
    await zctx.close();

    // --- 08 series colours: pie + gantt on the docs page ----------------------
    const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const dp = await dctx.newPage();
    await dp.addInitScript(SEED_CONSENT);
    await dp.goto(BASE + DOCS, { waitUntil: 'load' });
    await settle(dp);
    const pie = dp.locator('figure[data-zer0-diagram="pie"]').first();
    const gantt = dp.locator('figure[data-zer0-diagram="gantt"]').first();
    await pie.scrollIntoViewIfNeeded(); await dp.waitForTimeout(150);
    await pie.screenshot({ path: `${outDir}/${prefix(8)}-pie-light.png` });
    await dp.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
    await dp.waitForTimeout(800);
    await settle(dp);
    await gantt.scrollIntoViewIfNeeded(); await dp.waitForTimeout(150);
    await gantt.screenshot({ path: `${outDir}/${prefix(8)}-gantt-dark.png` });
    metrics.scenes.docs_page = await dp.evaluate(() => {
      const figs = Array.from(document.querySelectorAll('figure.zer0-diagram'));
      return {
        figures: figs.length,
        rendered: figs.filter((f) => f.classList.contains('is-rendered')).length,
        errorCards: figs.filter((f) => f.classList.contains('has-error')).length,
        types: Array.from(new Set(figs.map((f) => f.getAttribute('data-zer0-diagram')))),
        pageOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      };
    });
    await dctx.close();
  }

  const metricsFile = `${outDir}/metrics${STATE === 'before' ? '-before' : ''}.json`;
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2) + '\n');
  if (STATE === 'after') {
    const s = metrics.scenes;
    fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
      `(evidence: [\`test/visual/evidence/mermaid/\`](test/visual/evidence/mermaid/README.md) — ` +
      `dark-mode toggle keeps the SVG (before: SVG lost, stylesheet text on screen); ` +
      `page overflow ${s.mobile_390.pageOverflowPx}px at 390px; ` +
      `${s.docs_page.rendered}/${s.docs_page.figures} docs diagrams rendered, ${s.docs_page.errorCards} shown as an error card with source kept)\n`);
  }
  console.log(`mermaid evidence (${STATE}) written to`, outDir);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
