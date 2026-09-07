// Feature: ZER0-085
/**
 * Generic before/after evidence for a pull request — no bespoke spec needed.
 * ============================================================================
 * The bespoke generators in this folder (`<slug>-evidence.mjs`) reproduce a
 * BEFORE state by injecting CSS that undoes one specific fix. That needs an
 * author who understands the fix. This one needs nothing but two live sites:
 *
 *   AFTER   the PR head, served by `docker compose up`        (BASE_URL, :4000)
 *   BEFORE  the base branch, rendered once and served statically
 *           (BEFORE_URL, :4001 — scripts/ci/visual_evidence_autogen.py does this)
 *
 * so ANY UI change gets a real, measured before/after — same routes, same
 * widths, same browser — without anyone writing `unfixCss`. Omit BEFORE_URL for
 * after-only evidence (a brand-new feature has no before).
 *
 * Output (test/visual/evidence/<SLUG>/):
 *   01-before-after-<route>.png      full-viewport BEFORE/AFTER pairs at BAND_WIDTHS
 *   02-viewport-matrix-<route>.png   the header band at every width (after)
 *   metrics.json                     page overflow before/after per route × width
 *   CHANGELOG-snippet.txt            the evidence link for the changelog entry
 *
 * Env:
 *   SLUG           required — letters, digits, `.`, `_`, `-`
 *   BASE_URL       default http://localhost:4000
 *   BEFORE_URL     optional
 *   ROUTES         comma-separated routes, default "/"
 *   WIDTHS         default 320,390,768,992,1280,1440
 *   BAND_WIDTHS    widths that get a BEFORE/AFTER pair, default 390,1280
 *   SCOPE          overflow-measurement scope, default '#main-content, header#navbar'
 *   TITLE / BEFORE_LABEL / AFTER_LABEL   captions
 *   OUT_DIR        default test/visual/evidence/<SLUG>
 *   CHROMIUM_PATH  executable override for runs outside the jammy image
 *
 * Usage:
 *   SLUG=my-change BEFORE_URL=http://localhost:4001 node test/visual/pr-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage, MEASURE_OVERFLOW } from './evidence-kit.mjs';

const env = process.env;
const slug = env.SLUG;
if (!slug || !/^[A-Za-z0-9._-]+$/.test(slug)) {
  console.error('pr-evidence: SLUG is required (letters, digits, . _ -)');
  process.exit(2);
}
const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null);
const nums = (v) => list(v)?.map(Number).filter(Number.isFinite);
const base = (env.BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const before = (env.BEFORE_URL || '').replace(/\/+$/, '');
const routes = list(env.ROUTES) || ['/'];
const widths = nums(env.WIDTHS) || [320, 390, 768, 992, 1280, 1440];
const bandWidths = (nums(env.BAND_WIDTHS) || [390, 1280]).filter((w) => widths.includes(w));
const scope = env.SCOPE || '#main-content, header#navbar';
const outDir = env.OUT_DIR || `test/visual/evidence/${slug}`;
const title = env.TITLE || `${slug} — before vs after`;
const beforeLabel = env.BEFORE_LABEL || 'BEFORE — base branch';
const afterLabel = env.AFTER_LABEL || 'AFTER — this PR';

// Third-party badges load at network speed and get rate-limited on runners;
// abort them so BEFORE and AFTER render the same no-badge state (mirrors
// test/visual/features/appearance-snapshot.spec.js).
const BADGE_URL_RE = /(img\.shields\.io|badge\.fury\.io|github\.com\/.+\/badge\.svg)/;

// Seed consent the way a returning visitor arrives, so the fixed-bottom cookie
// banner is not baked into every shot (same key as test/visual/fixtures.js).
const SEED_CONSENT = () => {
  localStorage.setItem('zer0-cookie-consent', JSON.stringify({
    essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0',
  }));
};

const routeSlug = (r) =>
  (r === '/' ? 'home' : r.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()) || 'home';

async function shoot(browser, url, width) {
  const page = await browser.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.route(BADGE_URL_RE, (r) => r.abort());
  await page.setViewportSize({ width, height: 720 });
  let status = 0;
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    status = resp ? resp.status() : 0;
  } catch {
    status = -1;
  }
  const ok = status >= 200 && status < 400;
  if (ok) {
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
    await page.waitForTimeout(300);
  }
  const overflow = ok
    ? await page.evaluate(MEASURE_OVERFLOW, scope)
    : { overflowPx: null, scrollWidth: null, sel: null };
  const img = await page.screenshot();
  const header = ok ? await page.$('header#navbar') : null;
  const band = header ? await header.screenshot().catch(() => null) : null;
  await page.close();
  return { status, ok, overflow, img, band };
}

const browser = await chromium.launch(env.CHROMIUM_PATH ? { executablePath: env.CHROMIUM_PATH } : {});
fs.mkdirSync(outDir, { recursive: true });
const metrics = {
  slug, generator: 'test/visual/pr-evidence.mjs', base, before: before || null,
  beforeLabel, afterLabel, routes: [], sweep: [],
};
let n = 0;
const next = () => String(++n).padStart(2, '0');
let anyAfter = false;

for (const route of routes) {
  const rs = routeSlug(route);
  console.log(`[${slug}] route ${route}`);
  const pairRows = [];
  const matrixRows = [];
  let beforeOk = false;
  for (const w of widths) {
    const after = await shoot(browser, base + route, w);
    const bef = before ? await shoot(browser, before + route, w) : null;
    anyAfter = anyAfter || after.ok;
    beforeOk = beforeOk || Boolean(bef && bef.ok);
    metrics.sweep.push({
      route, width: w,
      afterStatus: after.status, beforeStatus: bef ? bef.status : null,
      beforeOverflowPx: bef ? bef.overflow.overflowPx : null,
      afterOverflowPx: after.overflow.overflowPx,
      afterOverflowEl: after.overflow.sel,
    });
    console.log(
      `   ${w}px  before=${bef ? bef.overflow.overflowPx : 'n/a'}  after=${after.overflow.overflowPx}` +
      `  (http ${bef ? `${bef.status}/` : ''}${after.status})`,
    );
    if (bandWidths.includes(w)) {
      const shown = Math.min(w, 700);
      if (bef && bef.ok) {
        pairRows.push({ label: `${beforeLabel} · ${w}px · page overflow ${bef.overflow.overflowPx}px`, img: bef.img, w: shown });
      }
      pairRows.push({ label: `${afterLabel} · ${w}px · page overflow ${after.overflow.overflowPx}px`, img: after.img, w: shown });
    }
    if (after.band) {
      matrixRows.push({ label: `${w}px · overflow ${after.overflow.overflowPx}px`, img: after.band, w: Math.min(w, 1400) });
    }
  }
  metrics.routes.push({ route, beforeRendered: beforeOk });
  if (pairRows.length) {
    await montage(browser, {
      title: `${title} — ${route}`,
      width: 760,
      note: beforeOk
        ? 'Full-viewport render of the same route on the base branch (BEFORE) and on this PR (AFTER) — same widths, same browser.'
        : 'After-only: no BEFORE site was available for this run.',
      rows: pairRows,
    }, `${outDir}/${next()}-${beforeOk ? 'before-after' : 'after'}-${rs}.png`);
  }
  if (matrixRows.length) {
    await montage(browser, {
      title: `${title} — ${route} — viewport matrix (after)`,
      width: Math.min(Math.max(...widths), 1400) + 60,
      note: `${widths[0]} → ${widths[widths.length - 1]}px. The header band at every width; page overflow should be 0 throughout.`,
      rows: matrixRows,
    }, `${outDir}/${next()}-viewport-matrix-${rs}.png`);
  }
}

if (!anyAfter) {
  await browser.close();
  console.error(`[${slug}] no route rendered from ${base} — is the site up?`);
  process.exit(1);
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
const worstBefore = metrics.sweep.reduce((a, b) => Math.max(a, b.beforeOverflowPx || 0), 0);
const worstAfter = metrics.sweep.reduce((a, b) => Math.max(a, b.afterOverflowPx || 0), 0);
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: ${outDir}/ -->\n` +
    `  (evidence: [\`${outDir}/\`](${outDir}/README.md)` +
    (worstBefore || worstAfter
      ? ` — page overflow ${worstBefore}px → ${worstAfter}px across ${widths.length} widths)`
      : ')'),
);
console.log(`  wrote ${outDir}/metrics.json + CHANGELOG-snippet.txt`);
await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
