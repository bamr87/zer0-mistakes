/**
 * Cookbook / recipes collection — evidence generator (ZER0-083, new-feature/after-only).
 * ----------------------------------------------------------------------------
 * Drives the live site and captures the visual evidence for the recipes
 * collection: the recipe page as authored, the same page rescaled and
 * converted (the whole point of the feature), the cookbook index, and the
 * no-JavaScript fallback that proves the page is complete without the scaler.
 *
 * A brand-new feature has no "before" state, so there is no unfixCss — with
 * one exception that IS a genuine before/after: the scaler's own effect. The
 * "as written → 2x → metric" montage is the before/after that matters here,
 * captured on one server by driving the controls.
 *
 * metrics.json records the overflow sweep (expect zeros) plus the actual
 * conversion results, so a regression in the unit tables is visible as a
 * number in the diff rather than only in a screenshot.
 *
 * Reuses the shared kit primitives (montage, MEASURE_OVERFLOW) per the
 * visual-evidence standard — no re-implemented measurement logic.
 *
 * Usage:
 *   BASE_URL=http://localhost:4000 node test/visual/recipes-evidence.mjs
 *
 * Outputs (test/visual/evidence/recipes-collection/):
 *   01-recipe-page.png       recipe as authored, 1280px and 390px
 *   02-scaling-conversion.png ingredients as written vs 2x vs metric
 *   03-ratio-table.png       baker's percentages holding while weights scale
 *   04-cookbook-index.png    course-grouped index, 1280px and 390px
 *   05-no-javascript.png     the same recipe with scripting disabled
 *   metrics.json             overflow sweep + the conversions themselves
 *   CHANGELOG-snippet.txt    release-notes-ready evidence link
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage, MEASURE_OVERFLOW } from './evidence-kit.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const OUT = 'test/visual/evidence/recipes-collection';
const SLUG = 'recipes-collection';
fs.mkdirSync(OUT, { recursive: true });

const FOCACCIA = '/recipes/no-knead-focaccia/';
const COOKIES = '/recipes/brown-butter-chocolate-chip-cookies/';
const INDEX = '/recipes/';
const WIDTHS = [320, 360, 390, 414, 768, 992, 1280, 1440];
const SCOPE = '#main-content, header#navbar';

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

/**
 * Fixed page chrome (the sidebar/print FABs, the cookie banner, back-to-top)
 * floats over whatever an element screenshot crops to. Hide it for capture —
 * it belongs to the theme, not to what this evidence is about.
 */
const HIDE_FIXED_CHROME = `
  #sidebarFab, .bd-sidebar-fab, .zer0-fab, .back-to-top, #backToTop,
  .cookie-consent-banner, #cookieConsent, .nanobar,
  [class*="fab"], [id*="Fab"] { display: none !important; }
`;

/** Open a recipe and wait for the scaler to reveal itself. */
async function openRecipe(route, width, height) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(BASE + route, { waitUntil: 'load' });
  await page.waitForSelector('[data-recipe-scaler]:not([hidden])', { timeout: 5000 }).catch(() => {});
  await page.addStyleTag({ content: HIDE_FIXED_CHROME });
  await page.waitForTimeout(200);
  return page;
}

async function shot(page, selector = null, fullPage = false) {
  if (selector) {
    const el = await page.$(selector);
    if (el) return el.screenshot();
  }
  return page.screenshot({ fullPage });
}

const readIngredients = (page) => page.$$eval('.recipe-ingredients .form-check-label',
  (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));

// 1. The recipe page as authored.
console.log(`[${SLUG}] recipe page montage`);
{
  const wide = await openRecipe(FOCACCIA, 1280, 1600);
  const phone = await openRecipe(FOCACCIA, 390, 1400);
  await montage(browser, {
    title: 'Recipes collection — recipe page (recipe.html), as written',
    note: 'Fact bar, scaler, ingredient checklist, method, ratio table and nutrition, all rendered from front matter. New feature: after-only.',
    width: 1040,
    rows: [
      { label: '1280px — full recipe', img: await shot(wide, null, true), w: 980 },
      { label: '390px — phone', img: await shot(phone, null, true), w: 380 },
    ],
  }, `${OUT}/01-recipe-page.png`);
  await wide.close();
  await phone.close();
}

// 2. The feature itself: the same ingredients scaled and converted.
console.log(`[${SLUG}] scaling + conversion montage`);
const conversions = {};
{
  const page = await openRecipe(COOKIES, 760, 1000);
  const asWritten = await shot(page, '.recipe-ingredients');
  conversions.cookies_as_written = await readIngredients(page);

  await page.click('[data-recipe-multiplier="2"]');
  await page.waitForTimeout(150);
  const doubled = await shot(page, '.recipe-ingredients');
  conversions.cookies_2x = await readIngredients(page);

  await page.click('[data-recipe-multiplier="1"]');
  await page.click('[data-recipe-units="metric"]');
  await page.waitForTimeout(150);
  const metric = await shot(page, '.recipe-ingredients');
  conversions.cookies_metric = await readIngredients(page);

  await montage(browser, {
    title: 'Recipes collection — serving scaling and unit conversion',
    note: 'The same recipe, authored in cups. Scaling and conversion happen in the browser; the served HTML is always the left-hand column.',
    width: 800,
    rows: [
      { label: 'As written (1x, cups and spoons)', img: asWritten, w: 740 },
      { label: '2x — every amount doubled, units untouched', img: doubled, w: 740 },
      { label: 'Metric (1x) — volumes resolved to weights via _data/ingredient_densities.yml', img: metric, w: 740 },
    ],
  }, `${OUT}/02-scaling-conversion.png`);
  await page.close();
}

// 3. The ratio table: weights move, percentages do not.
console.log(`[${SLUG}] ratio table montage`);
const ratio = {};
const readPercents = (page) => page.$$eval('.recipe-ratio-table tbody tr',
  (trs) => trs.map((tr) => `${tr.children[0].textContent.trim()} | ${tr.children[1].textContent.trim()} | ${tr.children[2].textContent.trim()}`));
{
  const page = await openRecipe(FOCACCIA, 900, 1000);
  const base = await shot(page, '.recipe-ratio-table');
  ratio.at_1x = await readPercents(page);

  await page.click('[data-recipe-multiplier="3"]');
  await page.waitForTimeout(150);
  const tripled = await shot(page, '.recipe-ratio-table');
  ratio.at_3x = await readPercents(page);

  await montage(browser, {
    title: "Recipes collection — baker's percentages hold while weights scale",
    note: 'Percentages are computed by Jekyll at build time, so they are correct without JavaScript and can never drift from the ingredient list. Only the weight column responds to the scaler.',
    width: 1040,
    rows: [
      { label: '1x — 500 g flour is 100%, 400 g water is 80%', img: base, w: 880 },
      { label: '3x — weights tripled, every percentage identical', img: tripled, w: 880 },
    ],
  }, `${OUT}/03-ratio-table.png`);
  await page.close();
}

// 4. The cookbook index.
console.log(`[${SLUG}] cookbook index montage`);
{
  const wide = await openRecipe(INDEX, 1280, 1400);
  const phone = await openRecipe(INDEX, 390, 1400);
  await montage(browser, {
    title: 'Recipes collection — cookbook landing page (cookbook.html)',
    note: 'Cover, course jump-nav, and the recipe index grouped into course sections from _data/recipe_courses.yml.',
    width: 1040,
    rows: [
      { label: '1280px — course-grouped index', img: await shot(wide, null, true), w: 980 },
      { label: '390px — phone', img: await shot(phone, null, true), w: 380 },
    ],
  }, `${OUT}/04-cookbook-index.png`);
  await wide.close();
  await phone.close();
}

// 5. No JavaScript — the page a scraper, a reader-mode, or a failed script gets.
console.log(`[${SLUG}] no-JavaScript montage`);
{
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 900, height: 1100 } });
  // addStyleTag evaluates script, which is exactly what this context disables —
  // inject the capture CSS at the network layer instead.
  await context.route('**/*', async (route) => {
    const response = await route.fetch();
    const type = response.headers()['content-type'] || '';
    if (!type.includes('text/html')) return route.fulfill({ response });
    const body = (await response.text()).replace('</head>', `<style>${HIDE_FIXED_CHROME}</style></head>`);
    return route.fulfill({ response, body });
  });
  const page = await context.newPage();
  await page.goto(BASE + FOCACCIA, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const img = await shot(page, '.recipe-ingredients');
  const scalerVisible = await page.locator('[data-recipe-scaler]').isVisible();

  await montage(browser, {
    title: 'Recipes collection — progressive enhancement (JavaScript disabled)',
    note: `Every amount is rendered by Jekyll exactly as authored, and the control bar stays hidden rather than offering dead buttons. Scaler visible with JS off: ${scalerVisible}.`,
    width: 1040,
    rows: [
      { label: 'JavaScript disabled — the recipe is complete and correct', img, w: 860 },
    ],
  }, `${OUT}/05-no-javascript.png`);
  conversions.no_js_scaler_visible = scalerVisible;
  await context.close();
}

// 6. Overflow sweep + the conversions themselves (metrics.json).
console.log(`[${SLUG}] overflow sweep`);
const metrics = { slug: SLUG, base: BASE, routes: {}, conversions, ratio };
for (const route of [FOCACCIA, INDEX]) {
  metrics.routes[route] = [];
  for (const w of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 760 });
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const m = await page.evaluate(MEASURE_OVERFLOW, SCOPE);
    metrics.routes[route].push({ width: w, overflowPx: m.overflowPx });
    console.log(`   ${route} @${w}px overflow=${m.overflowPx}px`);
    await page.close();
  }
}
fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));

fs.writeFileSync(`${OUT}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${SLUG}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md))`);

await browser.close();
console.log(`[${SLUG}] done → ${OUT}/`);
