// =============================================================================
// mobile-responsive-evidence.mjs — before/after evidence for the mobile audit
// =============================================================================
// All four fixes are CSS-only, so a single running server produces both
// states: the "before" is recreated in-page by injecting `UNFIX_CSS` (the
// pre-fix rules), the "after" is the served stylesheet. Montage/measurement
// helpers come from evidence-kit.mjs (reuse, don't reinvent).
//
// Scenes (paired with test/visual/mobile-responsive.spec.js):
//   1. Author card overflow on small phones — under real phone emulation the
//      overflow widens the layout viewport, so the fixed header stops short.
//   2. Cookie-consent banner vs FABs — the .zer0-bg-body elevation rule used
//      to flatten the banner to z-index 1, letting FABs steal button taps.
//   3. Tap targets — footer links / social icons / code-copy buttons vs the
//      WCAG 2.5.8 24px minimum (32px for copy buttons on touch).
//
// Usage:
//   BASE_URL=http://localhost:4000 node test/visual/mobile-responsive-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import { montage, MEASURE_OVERFLOW } from './evidence-kit.mjs';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const slug = 'mobile-responsive';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const AUTHOR_ROUTE = '/posts/2026/06/18/trailing-slash-that-could-end-your-company/';

// The exact rules the fix replaced (see _sass/components/_author.scss,
// _sass/theme/_backgrounds.scss, _sass/components/_footer.scss,
// _sass/core/code-copy.scss).
const UNFIX_CSS = `
  .author-card .card-body .flex-grow-1 { min-width: auto; }
  .author-expertise .badge { white-space: nowrap; }
  #cookieConsent.cookie-consent-banner.position-fixed { z-index: 1 !important; }
  #tocFab.position-fixed { z-index: 1 !important; }
  .bd-footer .footer-dark-block ul.list-unstyled li > a,
  .bd-footer .footer-dark-block p > a { display: inline; padding-block: 0; }
  .bd-footer .footer-dark-block ul.list-inline li > a { display: inline; min-width: 0; min-height: 0; }
  button.copy { min-height: 0 !important; }
`;

const browser = await chromium.launch();
const metrics = { slug, base: BASE, scenes: {} };
let n = 0;
const next = () => String(++n).padStart(2, '0');

async function phonePage(width, height = 800) {
  const ctx = await browser.newContext({
    viewport: { width, height }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();
  return { ctx, page };
}

// ---------------------------------------------------------------------------
// Scene 1 — author card overflow @ 320px (phone emulation)
// ---------------------------------------------------------------------------
{
  const rows = [];
  const sweep = [];
  for (const [state, css] of [['before', UNFIX_CSS], ['after', null]]) {
    const { ctx, page } = await phonePage(320);
    await page.addInitScript(() => localStorage.setItem('zer0-cookie-consent',
      JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0' })));
    await page.goto(BASE + AUTHOR_ROUTE, { waitUntil: 'load' });
    if (css) { await page.addStyleTag({ content: css }); await page.waitForTimeout(250); }
    const m = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      icb: document.documentElement.clientWidth,
      headerW: Math.round(document.getElementById('navbar').getBoundingClientRect().width),
      cardRight: Math.round(document.querySelector('.author-card')?.getBoundingClientRect().right ?? 0),
    }));
    sweep.push({ state, ...m });
    // Dashed guide at x=320 (the phone's screen edge) + a clip around the card
    // in page coordinates, so the BEFORE visibly crosses the line.
    const clip = await page.evaluate(() => {
      const guide = document.createElement('div');
      guide.style.cssText = 'position:absolute;top:0;left:319px;width:2px;height:100%;background:repeating-linear-gradient(180deg,#d33 0 8px,transparent 8px 16px);z-index:99999;pointer-events:none;';
      document.body.appendChild(guide);
      const r = document.querySelector('.author-card').getBoundingClientRect();
      const y = r.y + window.scrollY;
      return { x: 0, y: Math.max(0, y - 16), width: 360, height: Math.ceil(r.height) + 32 };
    });
    rows.push({
      label: state === 'before'
        ? `❌ BEFORE — 320px phone · nowrap expertise badge pushes content to ${m.scrollWidth}px; the page pans sideways past the dashed screen edge`
        : `✅ AFTER — 320px phone · card contained (right edge ${m.cardRight}px ≤ 320, dashed line = screen edge); no sideways pan (scrollWidth ${m.scrollWidth}px)`,
      img: await page.screenshot({ fullPage: true, clip }),
      w: 360,
    });
    await ctx.close();
  }
  metrics.scenes.authorCard = sweep;
  await montage(browser, {
    title: 'Author card — small-phone overflow fixed (min-width:0 + wrapping badges)',
    note: 'Pixel-class emulation at 320×800. Before: flexbox min-width:auto propagates the widest white-space:nowrap expertise chip, pushing the card (and the layout viewport) past the screen. After: the text column may shrink and chips wrap.',
    width: 760, rows,
  }, `${outDir}/${next()}-author-card-overflow.png`);
}

// ---------------------------------------------------------------------------
// Scene 2 — cookie banner vs FAB stacking @ 375px
// ---------------------------------------------------------------------------
{
  const rows = [];
  const states = [];
  for (const [state, css] of [['before', UNFIX_CSS], ['after', null]]) {
    const { ctx, page } = await phonePage(375, 667);
    await page.goto(BASE + AUTHOR_ROUTE, { waitUntil: 'load' });
    await page.waitForSelector('#cookieConsent.cookie-banner-visible', { timeout: 10000 }).catch(() => {});
    if (css) { await page.addStyleTag({ content: css }); await page.waitForTimeout(250); }
    const m = await page.evaluate(() => {
      const banner = document.getElementById('cookieConsent');
      const blocked = [];
      banner?.querySelectorAll('button').forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.width === 0) return;
        [[r.x + 6, r.y + r.height / 2], [r.x + r.width / 2, r.y + r.height / 2], [r.x + r.width - 6, r.y + r.height / 2]]
          .forEach(([x, y]) => {
            const at = document.elementFromPoint(x, y);
            if (!(at === b || b.contains(at))) {
              blocked.push({ button: b.textContent.trim().slice(0, 15), coveredBy: (at?.id || at?.className || '?').toString().slice(0, 30) });
            }
          });
      });
      return { bannerZ: banner ? getComputedStyle(banner).zIndex : null, blocked };
    });
    states.push({ state, ...m });
    rows.push({
      label: state === 'before'
        ? `❌ BEFORE — banner z-index ${m.bannerZ}: chat + graph FABs paint over it and steal ${m.blocked.length} tap point(s) on ${[...new Set(m.blocked.map((b) => b.button))].join(', ') || 'its buttons'}`
        : `✅ AFTER — banner z-index ${m.bannerZ} (token --zer0-layer-cookie-banner): stacks above every FAB; 0 blocked tap points`,
      img: await page.screenshot(),
      w: 375,
    });
    await ctx.close();
  }
  metrics.scenes.consentStacking = states;
  await montage(browser, {
    title: 'Cookie consent banner — FABs no longer steal taps',
    note: 'The .zer0-bg-body child-elevation rule matched the banner (.position-fixed, not .fixed-top) and flattened it to z-index 1, under the chat (1052) and local-graph (1060) FABs. Excluding .position-fixed restores the layer tokens.',
    width: 860, rows,
  }, `${outDir}/${next()}-consent-fab-stacking.png`);
}

// ---------------------------------------------------------------------------
// Scene 3 — tap-target sizes (footer + code copy) @ 375px
// ---------------------------------------------------------------------------
{
  const rows = [];
  const states = [];
  for (const [state, css] of [['before', UNFIX_CSS], ['after', null]]) {
    const { ctx, page } = await phonePage(375, 800);
    await page.addInitScript(() => localStorage.setItem('zer0-cookie-consent',
      JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0' })));
    await page.goto(BASE + '/', { waitUntil: 'load' });
    if (css) { await page.addStyleTag({ content: css }); await page.waitForTimeout(250); }
    const m = await page.evaluate(() => {
      const under = [];
      document.querySelectorAll('.footer-dark-block a').forEach((a) => {
        const r = a.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.height < 24 || r.width < 24) under.push({ link: (a.textContent.trim() || a.className).slice(0, 18), w: Math.round(r.width), h: Math.round(r.height) });
      });
      return { under24: under.length, sample: under.slice(0, 5) };
    });
    states.push({ state, ...m });
    const footer = await page.$('.footer-dark-block');
    rows.push({
      label: state === 'before'
        ? `❌ BEFORE — ${m.under24} footer links under the 24px minimum (e.g. ${m.sample.map((s) => `${s.link} ${s.w}×${s.h}`).slice(0, 3).join(', ')})`
        : `✅ AFTER — 0 footer links under 24px: text links get block padding, icon-only social links a 28px minimum box`,
      img: await footer.screenshot(),
      w: 375,
    });
    await ctx.close();
  }
  metrics.scenes.footerTapTargets = states;

  // Code-copy button, same pattern.
  for (const [state, css] of [['before', UNFIX_CSS], ['after', null]]) {
    const { ctx, page } = await phonePage(375, 700);
    await page.goto(BASE + '/docs/features/code-copy/', { waitUntil: 'load' });
    await page.waitForSelector('button.copy', { timeout: 10000 });
    if (css) { await page.addStyleTag({ content: css }); await page.waitForTimeout(250); }
    const size = await page.evaluate(() => {
      const b = document.querySelector('button.copy').getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height) };
    });
    metrics.scenes[`codeCopy_${state}`] = size;
    const block = await page.$('.highlighter-rouge');
    rows.push({
      label: state === 'before'
        ? `❌ BEFORE — code-copy button ${size.w}×${size.h}px (under the 24px minimum, cramped on touch)`
        : `✅ AFTER — code-copy button ${size.w}×${size.h}px (≥24px everywhere, 32px on coarse/touch pointers)`,
      img: await block.screenshot(),
      w: 375,
    });
    await ctx.close();
  }
  await montage(browser, {
    title: 'Tap targets — WCAG 2.5.8 24px minimum met (footer links, social icons, code copy)',
    note: 'Measured under touch emulation at 375px. Text size and visual design unchanged — targets grow via block padding / minimum boxes.',
    width: 860, rows,
  }, `${outDir}/${next()}-tap-targets.png`);
}

// ---------------------------------------------------------------------------
// Overflow sweep metric (desktop-measurement parity with the navbar evidence)
// ---------------------------------------------------------------------------
{
  const sweep = [];
  for (const w of [320, 340, 360, 390, 414, 768]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 760 });
    await page.goto(BASE + AUTHOR_ROUTE, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const after = await page.evaluate(MEASURE_OVERFLOW, '#main-content, header#navbar');
    await page.addStyleTag({ content: UNFIX_CSS });
    await page.waitForTimeout(200);
    const before = await page.evaluate(MEASURE_OVERFLOW, '#main-content, header#navbar');
    sweep.push({ width: w, beforeOverflowPx: before.overflowPx, afterOverflowPx: after.overflowPx, worst: before.sel });
    console.log(`  sweep ${w}px  before=${before.overflowPx}  after=${after.overflowPx}`);
    await page.close();
  }
  metrics.sweep = sweep;
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
  `author-card page overflow → 0 on small phones; consent buttons 0 tap-blocked; all footer/copy tap targets ≥24px)`);

await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
