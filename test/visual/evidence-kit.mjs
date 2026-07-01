// Feature: ZER0-074
/**
 * Evidence kit — reusable before/after + viewport/config evidence generator.
 * ============================================================================
 * The shared harness behind the "visual evidence" standard (see
 * `.github/skills/visual-evidence/SKILL.md`). Any UI/behavioural change
 * describes its scenarios as a small spec; this kit drives the live site,
 * measures page overflow, screenshots a viewport matrix + config variations in
 * before/after states, composes labelled montages with Playwright (no
 * ImageMagick), and writes `metrics.json` + a CHANGELOG-ready snippet.
 *
 * The navbar fix (PR #215, `test/visual/navbar-evidence.mjs`) is the worked
 * example; new evidence specs should import `generateEvidence` from here rather
 * than re-implementing measurement/montage logic.
 *
 * Usage (as a library):
 *   import { generateEvidence } from './evidence-kit.mjs';
 *   await generateEvidence({ slug: 'footer', base, route: '/', widths: [...] });
 *
 * Usage (as a CLI over a JSON/JS spec file):
 *   BASE_URL=http://localhost:4000 node test/visual/evidence-kit.mjs path/to/spec.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// In-page: worst non-contained element overflow past the viewport right edge.
// `0` = no sideways scroll = fixed chrome (navbar) cannot be visually cut off.
// Element-level (getBoundingClientRect), so it still fires under overflow-x:clip.
export const MEASURE_OVERFLOW = (scope) => {
  const cw = document.documentElement.clientWidth;
  let worst = 0, sel = null;
  // Append ` *` to EACH comma-separated selector so descendants of every scope
  // root are walked (not just the first), e.g. "#main-content *, header#navbar *".
  const q = scope.split(',').map((s) => s.trim() + ' *').join(', ');
  document.querySelectorAll(q).forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
    if (el.closest('.offcanvas, .offcanvas-lg, .modal')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.right <= cw + 1) return;
    // Contained by an ancestor clip/scroll box → never reaches the page.
    // The root <html> clip (the safety net) is excluded so genuinely
    // overflowing content it merely hides is still reported.
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

const b64 = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

/** Compose labelled panels into one montage PNG via an HTML render. */
export async function montage(browser, { title, note, rows, width = 1000 }, outPath) {
  const page = await browser.newPage();
  const rowsHtml = rows.map((r) => `
    <div class="panel"><div class="label">${r.label}</div>
      <img src="${b64(r.img)}" style="width:${r.w ? r.w + 'px' : 'auto'}"/>
      ${r.caption ? `<div class="caption">${r.caption}</div>` : ''}</div>`).join('');
  const html = `<!doctype html><meta charset="utf8"><style>
    *{box-sizing:border-box;margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
    body{background:#0d1117;color:#e6edf3;padding:20px;width:${width}px}
    h1{font-size:18px;margin-bottom:4px}.sub{font-size:13px;color:#8b949e;margin-bottom:16px}
    .panel{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:14px}
    .label{font-size:13px;font-weight:600;margin-bottom:8px}.caption{font-size:12px;color:#8b949e;margin-top:6px}
    img{display:block;border:1px solid #30363d;border-radius:4px;max-width:100%}
  </style><h1>${title}</h1>${note ? `<div class="sub">${note}</div>` : ''}${rowsHtml}`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await (await page.$('body')).screenshot({ path: outPath });
  await page.close();
  console.log(`  wrote ${outPath}`);
}

/** Full-width band of the page top — reveals how far fixed chrome spans. */
async function bandShot(page, height = 132) {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  return page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: sw, height } });
}

/**
 * Generate the standard evidence set for a UI change.
 * @param {object} spec
 * @param {string} spec.slug          short id; output dir is test/visual/evidence/<slug>/
 * @param {string} [spec.base]        server URL (default $BASE_URL or :4000)
 * @param {string} [spec.route]       primary route to exercise (default '/')
 * @param {string} [spec.scope]       overflow-measurement scope (default '#main-content, header#navbar')
 * @param {string} [spec.chromeCrop]  selector whose top band is the matrix crop (default header#navbar)
 * @param {number[]} [spec.widths]    viewport sweep
 * @param {number[]} [spec.bandWidths] widths that get a before/after band (needs unfixCss)
 * @param {string} [spec.unfixCss]    CSS that reverts the fix → enables before/after
 * @param {Array<{key,label,apply}>} [spec.configs] DOM variations rendered (after) at configWidth
 * @param {number} [spec.configWidth] width for the config montage (default 1100)
 * @param {string} [spec.title]       human title for the montages
 * @returns {Promise<object>} metrics
 */
export async function generateEvidence(spec) {
  const base = spec.base || process.env.BASE_URL || 'http://localhost:4000';
  const route = spec.route || '/';
  const scope = spec.scope || '#main-content, header#navbar';
  const chromeCrop = spec.chromeCrop || 'header#navbar';
  const widths = spec.widths || [320, 360, 390, 414, 768, 992, 1280, 1440];
  const bandWidths = spec.bandWidths || (spec.unfixCss ? [320, 390, 768] : []);
  const outDir = `test/visual/evidence/${spec.slug}`;
  fs.mkdirSync(outDir, { recursive: true });
  const title = spec.title || spec.slug;

  const browser = await chromium.launch();
  const metrics = { slug: spec.slug, base, route, sweep: [], configs: [] };
  let n = 0;
  const next = () => String(++n).padStart(2, '0');

  // 1. Overflow sweep (+ before/after bands where requested).
  console.log(`[${spec.slug}] overflow sweep`);
  const bandRows = [];
  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 760 });
    await page.goto(base + route, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const after = await page.evaluate(MEASURE_OVERFLOW, scope);
    let before = after;
    if (spec.unfixCss) {
      await page.addStyleTag({ content: spec.unfixCss });
      await page.waitForTimeout(200);
      before = await page.evaluate(MEASURE_OVERFLOW, scope);
    }
    metrics.sweep.push({ width: w, beforeOverflowPx: before.overflowPx, afterOverflowPx: after.overflowPx });
    console.log(`   ${w}px  before=${before.overflowPx}  after=${after.overflowPx}`);
    if (bandWidths.includes(w) && spec.unfixCss) {
      const beforeBand = await bandShot(page); // still in BEFORE
      const fresh = await browser.newPage();
      await fresh.setViewportSize({ width: w, height: 760 });
      await fresh.goto(base + route, { waitUntil: 'load' });
      await fresh.waitForTimeout(150);
      bandRows.push(
        { label: `❌ BEFORE — ${w}px · page overflows to ${before.scrollWidth}px (+${before.overflowPx}px). Fixed chrome stops where the page keeps going →`, img: beforeBand },
        { label: `✅ AFTER — ${w}px · page = ${w}px. Chrome spans the full width; no sideways scroll.`, img: await bandShot(fresh) });
      await fresh.close();
    }
    await page.close();
  }
  if (bandRows.length) {
    await montage(browser, { title: `${title} — before vs after`, width: 1040,
      note: 'Full-width band of the page top. Fixed chrome only spans the viewport; when page content overflows, the bar stops short and the rest sits uncovered. The fix removes the overflow.',
      rows: bandRows }, `${outDir}/${next()}-before-after.png`);
  }

  // 2. Viewport matrix (after) — chrome band at every width.
  console.log(`[${spec.slug}] viewport matrix`);
  const matrixRows = [];
  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 700 });
    await page.goto(base + route, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const el = await page.$(chromeCrop);
    const img = el ? await el.screenshot() : await page.screenshot({ clip: { x: 0, y: 0, width: w, height: 60 } });
    matrixRows.push({ label: `${w}px`, img, w });
    await page.close();
  }
  await montage(browser, { title: `${title} — viewport matrix (after)`, width: Math.max(...widths) + 60,
    note: `${widths[0]} → ${widths[widths.length - 1]}px. No clipping or page overflow at any width.`,
    rows: matrixRows }, `${outDir}/${next()}-viewport-matrix.png`);

  // 3. Config variations (after), if any.
  if (spec.configs && spec.configs.length) {
    console.log(`[${spec.slug}] config variations`);
    const cw = spec.configWidth || 1100;
    const rows = [];
    for (const cfg of spec.configs) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: cw, height: 600 });
      await page.goto(base + route, { waitUntil: 'load' });
      await page.waitForTimeout(150);
      await page.evaluate(cfg.apply);
      await page.waitForTimeout(150);
      const m = await page.evaluate(MEASURE_OVERFLOW, scope);
      metrics.configs.push({ config: cfg.key, width: cw, overflowPx: m.overflowPx });
      const el = await page.$(chromeCrop);
      const img = el ? await el.screenshot() : await page.screenshot({ clip: { x: 0, y: 0, width: cw, height: 58 } });
      rows.push({ label: `${cfg.label} · overflow: ${m.overflowPx}px`, img, w: Math.min(cw, 1000) });
      await page.close();
    }
    await montage(browser, { title: `${title} — configurations (after) — ${cw}px`, width: Math.min(cw, 1000) + 80,
      note: 'Each configuration measured for page overflow (all should be 0).', rows }, `${outDir}/${next()}-configs.png`);
  }

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

  // CHANGELOG-ready snippet (link the evidence so it flows into release notes).
  const worst = metrics.sweep.reduce((a, b) => Math.max(a, b.beforeOverflowPx), 0);
  const snippet = `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${spec.slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${spec.slug}/\`](test/visual/evidence/${spec.slug}/README.md)` +
    (worst ? ` — page overflow ${worst}px → 0 across ${widths.length} widths)` : `)`);
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);
  console.log(`  wrote ${outDir}/metrics.json + CHANGELOG-snippet.txt`);

  await browser.close();
  console.log(`[${spec.slug}] done → ${outDir}/`);
  return metrics;
}

// CLI: `node evidence-kit.mjs <spec.mjs>` where the spec default-exports a spec object.
if (import.meta.url === `file://${process.argv[1]}`) {
  const specPath = process.argv[2];
  if (!specPath) { console.error('usage: node test/visual/evidence-kit.mjs <spec.mjs>'); process.exit(2); }
  const mod = await import(path.resolve(specPath));
  await generateEvidence(mod.default || mod.spec);
}
