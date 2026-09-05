// Feature: ZER0-008
/**
 * Evidence: TOC scroll-spy highlights the section actually being read.
 * ============================================================================
 * The scroll-spy bug is behavioural, not a layout overflow, so this spec drives
 * the evidence run itself instead of using `generateEvidence()`'s CSS
 * before/after path — but it composes the montages with the same
 * `montage()` helper so the output matches the visual-evidence standard.
 *
 * BEFORE is reproduced on the SAME running server by serving the pre-fix
 * JavaScript (read straight out of git) and restoring the `data-bs-spy`
 * attributes the fix removed from `<body>` / `.bd-main`. No second build.
 *
 * At each scroll stop it records:
 *   expected — the section the reader is in, computed independently from the
 *              raw DOM (last heading whose top crossed the reading line;
 *              the last heading once the page is at the bottom)
 *   actual   — the TOC entries the theme marked `.active`
 *
 * Usage:
 *   docker compose up                                  # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/scroll-spy-evidence.mjs
 *
 * Optional: PW_EXECUTABLE_PATH=/path/to/chrome for sandboxes that ship their
 * own Chromium build.
 */
import { chromium } from '@playwright/test';
import { montage } from './evidence-kit.mjs';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const ROUTE = process.env.ROUTE || '/docs/features/toc/';
const REF = process.env.REF || 'HEAD'; // git ref holding the pre-fix JS
const SLUG = 'scroll-spy';
const OUT = `test/visual/evidence/${SLUG}`;
const VIEWPORT = { width: 1280, height: 820 };
const STOPS = 24;

// ---------------------------------------------------------------------------
// BEFORE: pre-fix modules + the Bootstrap ScrollSpy hooks the fix removed
// ---------------------------------------------------------------------------
const preFix = (p) => execSync(`git show ${REF}:${p}`, { encoding: 'utf8' });
const PRE_FIX_JS = {
  '/assets/js/modules/navigation/scroll-spy.js': 'assets/js/modules/navigation/scroll-spy.js',
  '/assets/js/modules/navigation/config.js': 'assets/js/modules/navigation/config.js',
  '/assets/js/ui-enhancements.js': 'assets/js/ui-enhancements.js',
};

/** Pre-seed cookie consent so the fixed bottom banner stays out of the crops. */
const SEED_CONSENT = () => {
  localStorage.setItem(
    'zer0-cookie-consent',
    JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0' }),
  );
};

const RESTORE_BOOTSTRAP_SPY = () => {
  const apply = () => {
    if (document.body) {
      document.body.setAttribute('data-bs-spy', 'scroll');
      document.body.setAttribute('data-bs-target', '#TableOfContents');
    }
    const main = document.querySelector('.bd-main');
    if (!main) return false;
    main.setAttribute('data-bs-spy', 'scroll');
    main.setAttribute('data-bs-target', '#TableOfContents');
    main.setAttribute('data-bs-offset', '100');
    main.setAttribute('data-bs-smooth-scroll', 'true');
    return true;
  };
  if (apply()) return;
  const obs = new MutationObserver(() => { if (apply()) obs.disconnect(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => { apply(); obs.disconnect(); });
};

// ---------------------------------------------------------------------------
// In-page probe (same rule the regression spec asserts)
// ---------------------------------------------------------------------------
const READ_SPY = () => {
  const heads = [];
  const seen = new Set();
  document.querySelectorAll('#TableOfContents a[href^="#"]').forEach((link) => {
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    if (!id || seen.has(id)) return;
    const el = document.getElementById(id);
    if (!el) return;
    seen.add(id);
    heads.push({ id, top: el.getBoundingClientRect().top + window.scrollY });
  });
  heads.sort((a, b) => a.top - b.top);

  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
  const line = window.scrollY + pad + 4;
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

  let expected = heads.length ? heads[0].id : null;
  if (atBottom) expected = heads.length ? heads[heads.length - 1].id : null;
  else for (const h of heads) { if (h.top > line) break; expected = h.id; }

  const active = Array.from(document.querySelectorAll('#TableOfContents a.active')).map((a) =>
    decodeURIComponent(a.getAttribute('href').slice(1)),
  );
  return { y: Math.round(window.scrollY), order: heads.map((h) => h.id), expected, active };
};

/** Draw the reading line so a reader of the montage can see the rule. */
const MARK_READING_LINE = () => {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
  const el = document.createElement('div');
  el.id = '__evidence-reading-line';
  el.style.cssText = `position:fixed;left:0;right:0;top:${pad}px;height:0;border-top:2px dashed #f85149;z-index:99999;pointer-events:none`;
  const tag = document.createElement('span');
  tag.textContent = 'reading line';
  tag.style.cssText =
    'position:absolute;left:8px;top:2px;font:11px/1.4 sans-serif;color:#fff;background:#f85149;padding:1px 6px;border-radius:0 0 4px 4px';
  el.appendChild(tag);
  document.body.appendChild(el);
};

async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, left: 0, behavior: 'instant' }), y);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(120);
}

/** Walk the page, sampling the spy at evenly spaced scroll stops. */
async function sample(page) {
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const stops = [];
  for (let i = 0; i <= STOPS; i++) {
    const y = Math.round((max * i) / STOPS);
    await scrollTo(page, y);
    const spy = await page.evaluate(READ_SPY);
    stops.push({
      ...spy,
      ok: spy.active.length === 1 && spy.active[0] === spy.expected,
    });
  }
  return stops;
}

async function shotAt(page, y) {
  await scrollTo(page, y);
  await page.evaluate(MARK_READING_LINE);
  const img = await page.screenshot();
  await page.evaluate(() => document.getElementById('__evidence-reading-line')?.remove());
  return img;
}

// ---------------------------------------------------------------------------
const browser = await chromium.launch(
  process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {},
);
fs.mkdirSync(OUT, { recursive: true });

// AFTER — the site as served.
const after = await browser.newPage({ viewport: VIEWPORT });
await after.addInitScript(SEED_CONSENT);
await after.goto(BASE + ROUTE, { waitUntil: 'load' });
await after.waitForTimeout(600);
const afterStops = await sample(after);

// BEFORE — pre-fix JS + Bootstrap ScrollSpy back on <body> and .bd-main.
const before = await browser.newPage({ viewport: VIEWPORT });
await before.route('**/assets/js/**', async (route) => {
  const path = new URL(route.request().url()).pathname;
  const source = PRE_FIX_JS[path];
  if (!source) return route.continue();
  return route.fulfill({ contentType: 'application/javascript', body: preFix(source) });
});
await before.addInitScript(SEED_CONSENT);
await before.addInitScript(RESTORE_BOOTSTRAP_SPY);
await before.goto(BASE + ROUTE, { waitUntil: 'load' });
await before.waitForTimeout(800);
const beforeStops = await sample(before);

const wrongBefore = beforeStops.filter((s) => !s.ok).length;
const wrongAfter = afterStops.filter((s) => !s.ok).length;
console.log(`[${SLUG}] wrong highlight — before ${wrongBefore}/${beforeStops.length}, after ${wrongAfter}/${afterStops.length}`);

// Montage: the first few stops the pre-fix build got wrong and the fix gets right.
const picks = beforeStops
  .map((s, i) => ({ s, i }))
  .filter(({ s, i }) => !s.ok && afterStops[i].ok)
  .slice(0, 3);

const rows = [];
for (const { s, i } of picks) {
  const y = s.y;
  const label = (state, stop, mark) =>
    `${mark} ${state} — scrolled to ${y}px · reader is in "#${stop.expected}" · TOC bolds ` +
    `[${stop.active.join(', ') || 'nothing'}]`;
  rows.push({
    label: label('BEFORE', s, '❌'),
    img: await shotAt(before, y),
    w: 980,
    caption: 'The bolded TOC entry is not the section under the reading line.',
  });
  rows.push({
    label: label('AFTER', afterStops[i], '✅'),
    img: await shotAt(after, y),
    w: 980,
    caption: 'The bolded TOC entry is the section under the reading line.',
  });
}

if (rows.length) {
  await montage(
    browser,
    {
      title: 'TOC scroll spy — before vs after',
      width: 1060,
      note:
        `${ROUTE} at ${VIEWPORT.width}×${VIEWPORT.height}. The dashed line is the reading line ` +
        '(the document\'s scroll-padding-top): the section whose heading last crossed it is the ' +
        `one being read. Before the fix ${wrongBefore} of ${beforeStops.length} scroll positions ` +
        `bolded the wrong entry; after, ${wrongAfter}.`,
      rows,
    },
    `${OUT}/01-before-after.png`,
  );
}

const metrics = {
  slug: SLUG,
  base: BASE,
  route: ROUTE,
  viewport: VIEWPORT,
  stops: beforeStops.length,
  wrongBefore,
  wrongAfter,
  backwardsJumpsBefore: countBackwards(beforeStops),
  backwardsJumpsAfter: countBackwards(afterStops),
  detail: beforeStops.map((s, i) => ({
    y: s.y,
    expected: s.expected,
    before: s.active.join('|') || null,
    after: afterStops[i].active.join('|') || null,
  })),
};
fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));

fs.writeFileSync(
  `${OUT}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${SLUG}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md) — ` +
    `wrong TOC highlight at ${wrongBefore}/${metrics.stops} scroll positions → ${wrongAfter})`,
);

/** How often the highlight moved backwards while scrolling down. */
function countBackwards(stops) {
  let high = -1;
  let jumps = 0;
  for (const s of stops) {
    const index = s.order.indexOf(s.active[0]);
    if (index < high) jumps++;
    high = Math.max(high, index);
  }
  return jumps;
}

await browser.close();
console.log(`[${SLUG}] done → ${OUT}/`);
