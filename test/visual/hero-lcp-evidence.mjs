/**
 * Evidence for the article hero's LCP loading + reserved box (issue #485).
 * ============================================================================
 * The article/post hero (`figure.featured-hero`) is the above-the-fold LCP
 * element, but it inherited components/preview-image.html's `loading="lazy"`
 * default and had no reserved box: until the image arrived the figure was 0px
 * tall, then everything below it jumped by the image's height. The fix passes
 * loading="eager" fetchpriority="high" at the hero call site and pins the box in
 * CSS (`.featured-hero img { aspect-ratio: 3 / 2 }`) — not with width/height
 * attributes, because preview assets vary in shape (generated 1024x683, some
 * hand-added portraits, external URLs).
 *
 * For each state × asset × width this holds every preview-image response (a
 * slow network), measures the hero box and the top of the content below it,
 * releases the image, and measures again. The PORTRAIT scenario serves the real
 * 720x960 `site-personalization-configuration.png` under the hero's own URL.
 *
 *   AFTER   AFTER_URL | BASE_URL (default http://localhost:4000) — the PR head
 *   BEFORE  BEFORE_URL when given (e.g. a static build of main); otherwise the
 *           fix is undone on the AFTER site (attributes reset to the include's
 *           defaults + the aspect-ratio rule neutralised), which is exactly the
 *           pre-fix markup and CSS.
 *
 * Reproduce (two real builds, as recorded in metrics.json):
 *   docker compose run --rm -v /tmp/zm:/out jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml --destination /out/after"
 *   # BEFORE: same, with the three source files from main, into /out/before
 *   (cd /tmp/zm/after && python3 -m http.server 4612) &
 *   (cd /tmp/zm/before && python3 -m http.server 4613) &
 *   AFTER_URL=http://127.0.0.1:4612 BEFORE_URL=http://127.0.0.1:4613 \
 *     node test/visual/hero-lcp-evidence.mjs
 *
 * Writes test/visual/evidence/hero-lcp/: montages, metrics.json, and a
 * CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { montage } from './evidence-kit.mjs';

const slug = 'hero-lcp';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const afterBase = (process.env.AFTER_URL || process.env.BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const beforeBase = (process.env.BEFORE_URL || '').replace(/\/+$/, '');
const HERO_POST = '/posts/2026/06/17/bayesian-modeled-my-coffee-and-wept-with-joy/';
const PORTRAIT = fileURLToPath(new URL('../../assets/images/previews/site-personalization-configuration.png', import.meta.url));
const WIDTHS = [390, 1280];

// Undo the fix on the AFTER site when no real BEFORE build is available.
const UNFIX = () => {
  const style = document.createElement('style');
  style.textContent = '.featured-hero img { aspect-ratio: auto !important; }';
  document.documentElement.appendChild(style);
  new MutationObserver(() => {
    const img = document.querySelector('figure.featured-hero img');
    if (img && img.getAttribute('loading') !== 'lazy') {
      img.setAttribute('loading', 'lazy');
      img.removeAttribute('fetchpriority');
      img.removeAttribute('decoding');
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
};

const MEASURE = () => {
  const img = document.querySelector('figure.featured-hero img');
  const r = img.getBoundingClientRect();
  const next = img.closest('figure').nextElementSibling;
  return {
    loading: img.getAttribute('loading'),
    fetchpriority: img.getAttribute('fetchpriority'),
    heroWidth: Math.round(r.width),
    heroHeight: Math.round(r.height),
    heroTop: Math.round(r.top + window.scrollY),
    contentBelowTop: next ? Math.round(next.getBoundingClientRect().top + window.scrollY) : null,
    loaded: img.complete && img.naturalWidth > 0,
    natural: [img.naturalWidth, img.naturalHeight],
  };
};

async function capture(browser, state, asset, width) {
  const base = state === 'before' && beforeBase ? beforeBase : afterBase;
  const page = await browser.newPage();
  await page.setViewportSize({ width, height: 900 });
  if (state === 'before' && !beforeBase) await page.addInitScript(UNFIX);

  // Learn the hero URL, then hold every preview response until released.
  await page.goto(base + HERO_POST, { waitUntil: 'domcontentloaded' });
  const heroUrl = await page.locator('figure.featured-hero img').evaluate((i) => i.currentSrc || i.src);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/images/previews/**', async (route) => {
    await gate;
    if (asset === 'portrait' && route.request().url() === heroUrl) await route.fulfill({ path: PORTRAIT });
    else await route.continue();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  const pending = await page.evaluate(MEASURE);
  const clip = { x: 0, y: Math.max(0, pending.heroTop - 24), width, height: Math.min(760, width * 1.4) };
  const pendingImg = await page.screenshot({ clip });
  release();
  await page.waitForFunction(() => {
    const i = document.querySelector('figure.featured-hero img');
    return i && i.complete && i.naturalWidth > 0;
  });
  await page.waitForTimeout(200);
  const loaded = await page.evaluate(MEASURE);
  const loadedImg = await page.screenshot({ clip });
  await page.close();
  return {
    state, asset, width,
    loading: loaded.loading,
    fetchpriority: loaded.fetchpriority,
    natural: loaded.natural,
    pending: { heroHeight: pending.heroHeight, contentBelowTop: pending.contentBelowTop, loaded: pending.loaded },
    loaded: { heroHeight: loaded.heroHeight, contentBelowTop: loaded.contentBelowTop },
    layoutShiftPx: loaded.contentBelowTop - pending.contentBelowTop,
    pendingImg, loadedImg,
  };
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const runs = [];
for (const asset of ['landscape', 'portrait']) {
  for (const width of WIDTHS) {
    for (const state of ['before', 'after']) {
      const r = await capture(browser, state, asset, width);
      console.log(`[${slug}] ${state.padEnd(6)} ${asset.padEnd(9)} @${width}: loading=${r.loading} ` +
        `fetchpriority=${r.fetchpriority} box ${r.pending.heroHeight}px -> ${r.loaded.heroHeight}px, ` +
        `content below shifts ${r.layoutShiftPx}px`);
      runs.push(r);
    }
  }
}
const find = (state, asset, width) => runs.find((r) => r.state === state && r.asset === asset && r.width === width);
const label = (r, phase) => {
  const box = phase === 'pending' ? r.pending.heroHeight : r.loaded.heroHeight;
  const head = r.state === 'after' ? '✅ AFTER' : 'BEFORE';
  return phase === 'pending'
    ? `${head} · image still in flight · loading="${r.loading}"${r.fetchpriority ? ` fetchpriority="${r.fetchpriority}"` : ''} · hero box ${box}px`
    : `${head} · image arrived (${r.natural.join('x')}) · hero box ${box}px · content below moved ${r.layoutShiftPx}px`;
};

for (const [n, asset] of [[1, 'landscape'], [2, 'portrait']]) {
  const rows = [];
  for (const width of WIDTHS) {
    for (const state of ['before', 'after']) {
      const r = find(state, asset, width);
      rows.push({ label: `@${width}px — ${label(r, 'pending')}`, img: r.pendingImg, w: Math.min(width, 960) });
      rows.push({ label: `@${width}px — ${label(r, 'loaded')}`, img: r.loadedImg, w: Math.min(width, 960) });
    }
  }
  await montage(browser, {
    title: `Article hero (${asset} preview) — before vs after, image held then released`,
    width: 1040,
    note: asset === 'landscape'
      ? 'The coffee post (show_hero: true) with its own 3:2 preview. BEFORE: lazy, and the figure is 0px until the image lands, then the article jumps. AFTER: eager + fetchpriority=high, and the box is reserved at its final height.'
      : 'Same post, the real 720x960 portrait asset served under the hero URL. AFTER: the same reserved 3:2 box; object-fit: cover crops the portrait instead of stretching it, and nothing moves when it lands.',
    rows,
  }, `${outDir}/0${n}-${asset}-before-after.png`);
}

const metrics = {
  slug, issue: 485, route: HERO_POST, widths: WIDTHS,
  afterBase, beforeBase: beforeBase || `${afterBase} with the fix undone in-page`,
  runs: runs.map(({ pendingImg, loadedImg, ...r }) => r),
};
fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
const shifts = (state) => runs.filter((r) => r.state === state).map((r) => Math.abs(r.layoutShiftPx));
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `hero loading lazy → eager + fetchpriority=high; content shift when the hero lands ` +
    `${Math.max(...shifts('before'))}px → ${Math.max(...shifts('after'))}px across ${WIDTHS.length} widths × landscape/portrait)\n`,
);
console.log(`[${slug}] done → ${outDir}/`);
await browser.close();
