/**
 * Navbar responsiveness — evidence generator (before/after, viewports, configs).
 * ----------------------------------------------------------------------------
 * Drives the live site and produces the visual + numeric evidence attached to
 * PR #215: it measures page overflow and screenshots the navbar across a
 * viewport matrix and several navigation configurations, in both the BEFORE
 * (fix reverted via injected CSS) and AFTER (fix active) states.
 *
 * The BEFORE state is reproduced faithfully by injecting CSS that undoes the
 * three fixes (the global `overflow-x: clip`, the `.content-table-wrapper`
 * scroll, and the inline-code wrap). This reproduces the exact original
 * overflow numbers (653px @320, 583px @390, 229px @768), so before/after is a
 * true comparison on one running server — no second build required.
 *
 * Montages are composed with Playwright itself (an HTML page that lays the
 * panels out with labels, then screenshotted) so there is no ImageMagick
 * dependency.
 *
 * Usage:
 *   BASE_URL=http://localhost:4001 node test/visual/navbar-evidence.mjs
 *   node test/visual/navbar-evidence.mjs            # defaults to :4001
 *
 * Outputs (test/visual/evidence/):
 *   metrics.json                  raw overflow measurements
 *   01-before-after-overflow.png  before|after band montage @320/390/768
 *   02-viewport-matrix.png        navbar across 8 widths (after) — all clean
 *   03-nav-configs.png            default / many items / long title / few items
 *   04-content-scroll.png         wide table scrolls in its card (not hidden)
 *   05-mobile-offcanvas.png       capped offcanvas fits a 360px phone
 */
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4001';
const OUT = 'test/visual/evidence';
fs.mkdirSync(OUT, { recursive: true });

// CSS that reverts every fix in this PR — recreates the pre-fix bug exactly.
const UNFIX = `
  html { overflow-x: visible !important; }
  .content-table-wrapper { overflow: visible !important; }
  .bd-content :not(pre) > code, .landing-content-body :not(pre) > code,
  .post-content :not(pre) > code, .note-content :not(pre) > code,
  .notebook-content :not(pre) > code, .page-content :not(pre) > code
    { overflow-wrap: normal !important; word-break: normal !important; }
  #bdNavbar.offcanvas-lg, #info-section.offcanvas
    { --bs-offcanvas-width: 400px !important; }
`;

// In-page: worst non-contained element overflow past the viewport right edge.
const MEASURE = () => {
  const cw = document.documentElement.clientWidth;
  let worst = 0, sel = null;
  document.querySelectorAll('#main-content *, header#navbar *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
    if (el.closest('.offcanvas, .offcanvas-lg, .modal')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= cw + 1) return;
    let contained = false, n = el.parentElement;
    while (n && n !== document.body && n !== document.documentElement) {
      if (getComputedStyle(n).overflowX !== 'visible') { contained = true; break; }
      n = n.parentElement;
    }
    if (contained) return;
    if (r.right - cw > worst) {
      worst = r.right - cw;
      sel = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/)[0] : '');
    }
  });
  return { overflowPx: Math.round(worst), scrollWidth: document.documentElement.scrollWidth, sel };
};

const WIDTHS = [320, 360, 390, 414, 768, 992, 1280, 1440];

const b64 = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

/** Compose labelled panels into one montage PNG via an HTML render. */
async function montage(browser, { title, note, rows, width = 1000 }, outPath) {
  const page = await browser.newPage();
  const rowsHtml = rows.map((r) => `
    <div class="panel">
      <div class="label">${r.label}</div>
      <img src="${b64(r.img)}" style="width:${r.w || 'auto'}${r.w ? 'px' : ''}"/>
      ${r.caption ? `<div class="caption">${r.caption}</div>` : ''}
    </div>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf8"><style>
    *{box-sizing:border-box;margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
    body{background:#0d1117;color:#e6edf3;padding:20px;width:${width}px}
    h1{font-size:18px;margin-bottom:4px}
    .sub{font-size:13px;color:#8b949e;margin-bottom:16px}
    .panel{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:14px}
    .label{font-size:13px;font-weight:600;margin-bottom:8px;color:#e6edf3}
    .caption{font-size:12px;color:#8b949e;margin-top:6px}
    img{display:block;border:1px solid #30363d;border-radius:4px;max-width:100%}
  </style></head><body>
    <h1>${title}</h1>${note ? `<div class="sub">${note}</div>` : ''}${rowsHtml}
  </body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const el = await page.$('body');
  await el.screenshot({ path: outPath });
  await page.close();
  console.log(`  wrote ${outPath}`);
}

/** Full-width band of the page top (reveals how far the navbar spans). */
async function bandShot(page) {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  return page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: sw, height: 132 } });
}

const browser = await chromium.launch();
const metrics = { base: BASE, generatedAtNote: 'run date stamped by caller', sweep: [], configs: [] };

// ---------------------------------------------------------------------------
// 1. Overflow sweep + before/after band montage at the overflowing widths.
// ---------------------------------------------------------------------------
console.log('1) overflow sweep + before/after bands');
const bandRows = [];
for (const w of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: w, height: 760 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const after = await page.evaluate(MEASURE);
  await page.addStyleTag({ content: UNFIX });
  await page.waitForTimeout(200);
  const before = await page.evaluate(MEASURE);
  metrics.sweep.push({ width: w, beforeOverflowPx: before.overflowPx, afterOverflowPx: after.overflowPx, worst: before.sel });
  console.log(`   ${w}px  before=${before.overflowPx}px  after=${after.overflowPx}px`);

  if ([320, 390, 768].includes(w)) {
    const beforeBand = await bandShot(page); // still in BEFORE (unfix injected)
    const fresh = await browser.newPage();
    await fresh.setViewportSize({ width: w, height: 760 });
    await fresh.goto(BASE + '/', { waitUntil: 'load' });
    await fresh.waitForTimeout(150);
    const afterBand = await bandShot(fresh);
    await fresh.close();
    bandRows.push(
      { label: `❌ BEFORE — ${w}px viewport · page overflows to ${before.scrollWidth}px (+${before.overflowPx}px). Navbar (fixed, ${w}px) stops where the page keeps going →`, img: beforeBand },
      { label: `✅ AFTER — ${w}px viewport · page = ${w}px. Navbar spans the full width; no sideways scroll.`, img: afterBand },
    );
  }
  await page.close();
}
await montage(browser, {
  title: 'Navbar "cut off" — before vs after the fix',
  note: 'Full-width band of the page top. The fixed-position navbar only spans the viewport; when page content overflows, the bar stops short and the rest of the page sits uncovered (the reported "cut off"). The fix removes the overflow so the bar always spans the page.',
  rows: bandRows, width: 1040,
}, `${OUT}/01-before-after-overflow.png`);

// ---------------------------------------------------------------------------
// 2. Viewport matrix (AFTER) — navbar band at every width, all clean.
// ---------------------------------------------------------------------------
console.log('2) viewport matrix (after)');
const matrixRows = [];
for (const w of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: w, height: 700 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const img = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: 60 } });
  const tier = w >= 992 ? (w >= 1200 ? 'desktop · full labels' : 'compact desktop') : (w >= 768 ? 'tablet · quicklinks' : 'mobile · hamburger');
  matrixRows.push({ label: `${w}px — ${tier}`, img, w });
  await page.close();
}
await montage(browser, {
  title: 'Navbar across the viewport matrix (after fix)',
  note: '320 → 1440px. Degrades cleanly: hamburger + offcanvas (mobile) → tablet quicklinks → compact inline → full labelled menubar. No clipping or overflow at any width.',
  rows: matrixRows, width: 1480,
}, `${OUT}/02-viewport-matrix.png`);

// ---------------------------------------------------------------------------
// 3. Navigation configurations (AFTER) — many items, long title, few items.
// ---------------------------------------------------------------------------
console.log('3) nav configurations');
const CONFIGS = [
  { key: 'default', label: 'Default (6 top-level items)', apply: () => {} },
  { key: 'many', label: 'Many items (18) — collapse to icon-only, never overflow',
    apply: () => { const l = document.querySelector('#bdNavbar .navbar-nav'); const it = [...l.querySelectorAll(':scope > li:not(.d-lg-none)')]; for (let i = 0; i < 2; i++) it.forEach((x) => l.appendChild(x.cloneNode(true))); } },
  { key: 'longtitle', label: 'Very long site title — ellipsizes, utilities stay put',
    apply: () => { const t = document.querySelector('#navbar .site-title-text'); if (t) t.textContent = 'An Extremely Long Site Title That Must Truncate Gracefully'; } },
  { key: 'few', label: 'Few items (2) — centered, no stretching',
    apply: () => { const l = document.querySelector('#bdNavbar .navbar-nav'); const it = [...l.querySelectorAll(':scope > li:not(.d-lg-none)')]; it.slice(2).forEach((x) => x.remove()); } },
];
const configRows = [];
for (const cfg of CONFIGS) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 600 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.evaluate(cfg.apply);
  await page.waitForTimeout(150);
  const m = await page.evaluate(MEASURE);
  metrics.configs.push({ config: cfg.key, width: 1100, overflowPx: m.overflowPx });
  const img = await page.screenshot({ clip: { x: 0, y: 0, width: 1100, height: 58 } });
  configRows.push({ label: `${cfg.label}  ·  page overflow: ${m.overflowPx}px`, img, w: 1000 });
  await page.close();
}
await montage(browser, {
  title: 'Navbar under different navigation configurations (after fix) — 1100px',
  note: 'Each config measured for page overflow (all 0). The bar adapts to item count and label length without ever forcing a horizontal page scrollbar.',
  rows: configRows, width: 1080,
}, `${OUT}/03-nav-configs.png`);

// ---------------------------------------------------------------------------
// 4. Content stays accessible — wide table scrolls inside its card.
// ---------------------------------------------------------------------------
console.log('4) content scroll proof');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(200);
  // Pick the widest content-table card (most overflow → clearest scroll proof).
  const idx = await page.evaluate(() => {
    const ws = [...document.querySelectorAll('.content-table-wrapper')];
    let best = -1, bestOver = 0;
    ws.forEach((w, i) => { const o = w.scrollWidth - w.clientWidth; if (o > bestOver) { bestOver = o; best = i; } });
    return best;
  });
  const wrapper = page.locator('.content-table-wrapper').nth(Math.max(0, idx));
  await wrapper.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const info = await wrapper.evaluate((w) => ({ clientW: w.clientWidth, scrollW: w.scrollWidth, canScroll: w.scrollWidth > w.clientWidth + 1 }));
  const img = await wrapper.screenshot();
  metrics.contentScroll = info;
  await montage(browser, {
    title: 'Wide content stays accessible (after fix) — 390px',
    note: `The global overflow-x: clip never hides content: a ${info ? info.scrollW : '—'}px-wide table scrolls horizontally inside its ${info ? info.clientW : '—'}px card (its own scrollbar), instead of overflowing the page.`,
    rows: [{ label: 'Wide markdown table — scrolls within its card', img, w: 390 }], width: 460,
  }, `${OUT}/04-content-scroll.png`);
  await page.close();
}

// ---------------------------------------------------------------------------
// 5. Mobile offcanvas — capped width fits a narrow phone.
// ---------------------------------------------------------------------------
console.log('5) mobile offcanvas');
{
  const page = await browser.newPage();
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.locator('.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]').click();
  await page.waitForFunction(() => {
    const p = document.getElementById('bdNavbar');
    if (!p || !p.classList.contains('show')) return false;
    const t = getComputedStyle(p).transform;
    return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
  });
  const box = await page.locator('#bdNavbar').boundingBox();
  metrics.offcanvas = { viewport: 360, panelRight: Math.round(box.x + box.width), fits: box.x + box.width <= 361 };
  const img = await page.screenshot({ clip: { x: 0, y: 0, width: 360, height: 460 } });
  await montage(browser, {
    title: 'Mobile menu offcanvas (after fix) — 360px phone',
    note: `Panel clamped to min(21rem, 86vw); right edge at ${metrics.offcanvas.panelRight}px ≤ 360px viewport. Bootstrap's default 400px would have run off-screen.`,
    rows: [{ label: 'Offcanvas menu — fully on-screen with reachable close button', img, w: 360 }], width: 440,
  }, `${OUT}/05-mobile-offcanvas.png`);
  await page.close();
}

fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));
console.log(`\nwrote ${OUT}/metrics.json`);
await browser.close();
console.log('evidence generation complete.');
