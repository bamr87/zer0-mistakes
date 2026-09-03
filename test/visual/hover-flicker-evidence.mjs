/**
 * Navbar hover flicker — evidence generator (before/after).
 * ----------------------------------------------------------------------------
 * Evidence for #404 / T-036: `transform: translateY(-1px)` on `.nav-link:hover`
 * and on the Search/Settings utility buttons moved the hovered element out from
 * under a pointer parked on the edge it vacated — hover exited, the element
 * dropped back under the pointer, hover re-entered. An infinite flicker with no
 * pointer movement at all.
 *
 * Deleting those declarations was not enough on its own. The utility buttons and
 * the FABs are `.btn`s, and `_sass/components/_ui-enhancements.scss` lifts every
 * button in the theme by 2px on hover — so with the navbar's own 1px lift gone
 * they simply flickered on the inherited 2px one instead. The shipped fix
 * cancels it explicitly with `transform: none`.
 *
 * A flicker is motion, so a still screenshot cannot show it. What this captures
 * instead is the two things that ARE measurable and that a reader can check:
 *
 *   1. GEOMETRY — the hovered element's border box at rest vs. hovered. Before
 *      the fix the box moves 1px; after, the delta is exactly 0. The montage
 *      renders each control at 6x with a red rule pinned to its RESTING bottom
 *      edge, so the 1px gap that opens under the hovered element is visible.
 *   2. EVENTS — with the pointer parked half a pixel inside the bottom edge and
 *      held still for 600ms, count `mouseleave` on the element. A stable control
 *      fires none; a lifting one fires on every cycle. (`mouseleave`, not
 *      `mouseout`: the latter also fires when the pointer crosses onto a
 *      descendant, which is not the element losing hover.)
 *
 * The BEFORE state is reproduced on the same running server by re-injecting the
 * removed declarations (REGRESS_CSS), following navbar-fit-evidence.mjs — no
 * second build, and the two states differ by exactly the shipped diff.
 *
 * Direction matters: translateY(-1px) moves the element UP, so it is the BOTTOM
 * row of pixels that stops being covered. Probing the top edge finds nothing.
 *
 * Usage:
 *   BASE_URL=http://localhost:4000 node test/visual/hover-flicker-evidence.mjs
 *
 * Outputs (test/visual/evidence/hover-flicker/):
 *   01-box-shift.png     each control at rest / hovered, 6x, before vs. after
 *   metrics.json         per-control box delta + mouseout counts, both states
 *   CHANGELOG-snippet.txt
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const OUT = 'test/visual/evidence/hover-flicker';
fs.mkdirSync(OUT, { recursive: true });

// Exactly the declarations this change removed, at the specificity they had on
// `main`. Each of these beat the theme-wide `.btn:hover { translateY(-2px) }` in
// _ui-enhancements.scss, so restoring them reproduces `main`'s effective
// behaviour — and, because they win, they also override the `transform: none`
// this change added. (That global `.btn` lift is why deleting the navbar's own
// translateY was not sufficient: the controls are buttons, and kept lifting 2px.)
const REGRESS_CSS = `
  #bdNavbar .nav-link:hover { transform: translateY(-1px) !important; }
  .navbar-utility-controls .nav-search-button:hover,
  .navbar-utility-controls .nav-settings-button:hover { transform: translateY(-1px) !important; }
  .bd-toc-fab .btn.bd-toc-toggle:hover,
  .bd-sidebar-fab .btn.bd-sidebar-toggle:hover { transform: translateY(-1px) !important; }
`;

// The nav link is not measured. Its lift sat inside a container query that,
// measured across 1040/1140/1200/1280px on the built site, never applies — its
// computed hover transform is `none` at every desktop width on `main` too. It
// was dead code; there is no before/after to show.
const CONTROLS = [
  { key: 'search', label: 'Search button', selector: '.navbar-utility-controls .nav-search-button' },
  { key: 'settings', label: 'Settings button', selector: '.navbar-utility-controls .nav-settings-button' },
];

/** First on-screen match with a real box (0x0 duplicates exist in #bdNavbar). */
async function visible(page, selector) {
  const all = page.locator(selector);
  const n = await all.count();
  for (let i = 0; i < n; i++) {
    const el = all.nth(i);
    const box = await el.boundingBox();
    if (box && box.width > 4 && box.height > 4) return el;
  }
  return null;
}

const r3 = (n) => Math.round(n * 1000) / 1000;

async function openPage(browser, { regress }) {
  // 4x device pixels: the whole defect is a 1-2px shift, which is invisible at
  // 1x. At 4x the gap under the hovered element is 4-8px in the montage.
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 4 });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  // Consent banner is fixed at the bottom; it never overlaps the navbar, but
  // dismissing it keeps the page in the state a returning reader sees.
  await page.evaluate(() => {
    try { localStorage.setItem('zer0-cookie-consent', JSON.stringify({ analytics: false, necessary: true })); } catch { /* private mode */ }
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  if (regress) await page.addStyleTag({ content: REGRESS_CSS });
  await page.waitForTimeout(400);
  return page;
}

/** Border box at rest and while hovered, plus mouseout count with a still pointer. */
async function probe(page, selector) {
  const el = await visible(page, selector);
  if (!el) return null;

  await page.mouse.move(5, 400);
  await page.waitForTimeout(250);
  const rest = await el.evaluate((n) => { const b = n.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });

  // enter/leave, not over/out: the latter also fire when the pointer crosses
  // onto a DESCENDANT, which is not the element losing hover.
  await el.evaluate((n) => {
    window.__ev = { enter: 0, leave: 0 };
    n.addEventListener('mouseenter', () => { window.__ev.enter += 1; });
    n.addEventListener('mouseleave', () => { window.__ev.leave += 1; });
  });

  // Half a pixel inside the bottom edge — the row a 1px lift vacates.
  await page.mouse.move(rest.x + rest.w / 2, rest.y + rest.h - 0.5);
  await page.waitForTimeout(600);

  const hovered = await el.evaluate((n) => { const b = n.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const ev = await page.evaluate(() => window.__ev);

  await page.mouse.move(5, 400);
  await page.waitForTimeout(200);
  return {
    rest: { x: r3(rest.x), y: r3(rest.y), w: r3(rest.w), h: r3(rest.h) },
    hovered: { x: r3(hovered.x), y: r3(hovered.y), w: r3(hovered.w), h: r3(hovered.h) },
    dy: r3(hovered.y - rest.y),
    dx: r3(hovered.x - rest.x),
    mouseenter: ev.enter,
    mouseleave: ev.leave,
  };
}

/**
 * Crop the control at 6x with a red rule pinned to its resting bottom edge, so
 * a 1px lift reads as a visible gap rather than a sub-pixel nobody can see.
 */
async function shot(page, selector, { hover }) {
  const el = await visible(page, selector);
  await page.mouse.move(5, 400);
  await page.waitForTimeout(200);
  const rest = await el.evaluate((n) => { const b = n.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });

  await page.evaluate((box) => {
    const old = document.getElementById('__evidence-rule');
    if (old) old.remove();
    const rule = document.createElement('div');
    rule.id = '__evidence-rule';
    rule.style.cssText = [
      'position:fixed', `left:${box.x - 8}px`, `top:${box.y + box.h}px`,
      `width:${box.w + 16}px`, 'height:1px', 'background:#f85149',
      'z-index:2147483647', 'pointer-events:none',
    ].join(';');
    document.body.appendChild(rule);
  }, rest);

  if (hover) {
    await page.mouse.move(rest.x + rest.w / 2, rest.y + rest.h - 0.5);
    await page.waitForTimeout(400);
  }

  const pad = 6;
  const clip = {
    x: Math.max(0, rest.x - pad), y: Math.max(0, rest.y - pad),
    width: rest.w + pad * 2, height: rest.h + pad * 2 + 2,
  };
  const img = await page.screenshot({ clip, scale: 'device' });
  // Display width in the montage: the crop's CSS width at 4x, so the panel
  // keeps the element's real aspect ratio instead of stretching a narrow
  // icon button across the page.
  return { img, w: Math.min(900, Math.round(clip.width * 4)) };
}

const main = async () => {
  const browser = await chromium.launch();
  const metrics = { base: BASE, captured: new Date().toISOString(), controls: {} };
  const rows = [];

  // Collected per state, then emitted per control so BEFORE and AFTER for the
  // same button sit next to each other in the montage.
  const panels = { before: {}, after: {} };
  for (const state of ['before', 'after']) {
    const page = await openPage(browser, { regress: state === 'before' });
    for (const c of CONTROLS) {
      const m = await probe(page, c.selector);
      if (!m) { console.log(`  skip ${c.key} (${c.selector} not present)`); continue; }
      metrics.controls[c.key] = { ...(metrics.controls[c.key] || {}), [state]: m };
      panels[state][c.key] = { ...(await shot(page, c.selector, { hover: true })), m };
    }
    await page.close();
  }

  for (const c of CONTROLS) {
    for (const state of ['before', 'after']) {
      const panel = panels[state][c.key];
      if (!panel) continue;
      const { m } = panel;
      rows.push({
        label: `${state.toUpperCase()} — ${c.label}, hovered, 4x`,
        img: panel.img,
        w: panel.w,
        caption: `box moved dy=${m.dy}px dx=${m.dx}px · hover lost ${m.mouseleave}x while the pointer was held still`
          + (state === 'before' && m.dy !== 0 ? ' — the red rule marks the resting bottom edge; the gap that opens under the element is the row the pointer loses.' : ''),
      });
    }
  }

  await montage(browser, {
    title: 'Navbar hover flicker — #404 / T-036',
    note: 'Pointer parked half a pixel inside the bottom edge and held still for 600ms. '
      + 'Red rule = the element\'s RESTING bottom edge. A non-zero dy is the bug; a non-zero mouseleave count is the flicker.',
    rows,
    width: 1000,
  }, `${OUT}/01-box-shift.png`);

  fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
  console.log(`  wrote ${OUT}/metrics.json`);

  const lines = Object.entries(metrics.controls).map(([k, v]) =>
    `  ${k}: before dy=${v.before?.dy}px hover-lost=${v.before?.mouseleave} -> after dy=${v.after?.dy}px hover-lost=${v.after?.mouseleave}`);
  fs.writeFileSync(`${OUT}/CHANGELOG-snippet.txt`,
    ['Navbar hover flicker (#404 / T-036) — before/after:', ...lines,
      '', `Evidence: ${OUT}/01-box-shift.png, ${OUT}/metrics.json`, ''].join('\n'));
  console.log(`  wrote ${OUT}/CHANGELOG-snippet.txt`);
  console.log(lines.join('\n'));

  await browser.close();
};

main().catch((err) => { console.error(err); process.exit(1); });
