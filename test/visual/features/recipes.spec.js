/**
 * ============================================================================
 * Cookbook / recipes spec — recipe + cookbook layouts, scaler (ZER0-084)
 * ----------------------------------------------------------------------------
 * Behavioural/structural regression tests for the recipes collection:
 *
 *   - recipe.html    : one H1, fact bar, ingredient checklist, method,
 *                      build-time baker's-percentage table, nutrition
 *   - recipe-scaler  : progressive enhancement (controls hidden until the
 *                      script arrives), yield scaling, US/metric conversion
 *                      including volume<->weight, temperature switching,
 *                      per-serving nutrition staying put, remembered units
 *   - cookbook.html  : course-grouped index with no skipped heading levels
 *
 * Assertions are behavioural rather than pixel-based so they survive edits to
 * the demo recipes: they check RELATIONSHIPS (converted vs authored, scaled vs
 * base) rather than hard-coded strings, except where a number is the point.
 *
 * Runs against the theme's built-in demo cookbook (pages/_recipes/). Forks
 * without a recipes collection skip cleanly via gotoOrSkip().
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, gotoOrSkip } = require('../fixtures');

const COOKBOOK_URL = '/recipes/';
const FOCACCIA_URL = '/recipes/no-knead-focaccia/';   // authored in grams
const COOKIES_URL = '/recipes/brown-butter-chocolate-chip-cookies/'; // in cups
const PASTA_URL = '/recipes/weeknight-tomato-butter-pasta/'; // no ratio basis

/** Text of every ingredient line, whitespace-collapsed. */
async function ingredientLines(page) {
  return page.$$eval('.recipe-ingredients .form-check-label', (els) =>
    els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
}

/** Wait for the scaler to reveal itself — the signal the engine booted. */
async function waitForScaler(page) {
  await expect(page.locator('[data-recipe-scaler]')).toBeVisible();
}

test.describe('Recipes — recipe page (recipe.html)', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('renders one h1 plus the fact bar, ingredients and method', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Focaccia');

    // The fact bar summarises the recipe; total time is derived, not authored.
    const total = page.locator('.recipe-meta-item--total dd');
    await expect(total).toContainText('12 hr 45 min');

    expect((await ingredientLines(page)).length).toBeGreaterThan(3);
    expect(await page.locator('.recipe-step').count()).toBeGreaterThan(3);
  });

  test('every ingredient line separates its amount from its name', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);
    // Regression: Liquid's whitespace stripping once produced "500 gbread
    // flour" — invisible in the layout's flexbox, but exactly what a screen
    // reader announces and what the recipeIngredient microdata carries.
    const joins = await page.$$eval('.recipe-ingredient', (items) => items.map((item) => {
      const amount = item.querySelector('[data-recipe-qty]');
      const name = item.querySelector('.recipe-ingredient-name');
      if (!amount || !name) return null;
      const label = item.querySelector('.form-check-label').textContent;
      const amountText = amount.textContent.trim();
      const at = label.indexOf(amountText);
      return { label: label.replace(/\s+/g, ' ').trim(), next: label.slice(at + amountText.length, at + amountText.length + 1) };
    }).filter(Boolean));

    expect(joins.length).toBeGreaterThan(0);
    for (const { label, next } of joins) {
      expect(next, `"${label}" runs its amount straight into the name`).toMatch(/\s/);
    }
  });

  test('ratio table computes baker\'s percentages at build time', async ({ page }) => {
    // Percentages must be present with or without JS — they come from Liquid.
    await gotoOrSkip(page, FOCACCIA_URL);

    const rows = page.locator('.recipe-ratio-table tbody tr');
    expect(await rows.count()).toBeGreaterThan(3);

    // The basis ingredient is 100% by definition.
    const percents = await page.$$eval('.recipe-ratio-table tbody tr',
      (trs) => trs.map((tr) => tr.children[2].textContent.trim()));
    expect(percents, 'the ratio basis anchors the table at 100%').toContain('100%');

    // 400 g water against 500 g flour is the recipe's 80% hydration.
    expect(percents).toContain('80%');
  });

  test('a recipe with no ratio_basis renders no ratio table', async ({ page }) => {
    await gotoOrSkip(page, PASTA_URL);
    await expect(page.locator('.recipe-ratio')).toHaveCount(0);
  });
});

test.describe('Recipes — scaler', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('controls stay hidden without JavaScript and the amounts still render', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto(FOCACCIA_URL, { waitUntil: 'domcontentloaded' });
    test.skip(!response || response.status() >= 400, 'recipes collection not available');

    // Progressive enhancement: the recipe is complete, the dead controls are not shown.
    await expect(page.locator('[data-recipe-scaler]')).toBeHidden();
    const lines = await ingredientLines(page);
    expect(lines.join(' ')).toContain('500 g');
    await context.close();
  });

  test('doubling the yield doubles every scalable amount', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);
    await waitForScaler(page);

    const before = await page.$$eval('.recipe-ingredients [data-recipe-qty]',
      (els) => els.map((e) => parseFloat(e.getAttribute('data-qty'))));

    await page.click('[data-recipe-multiplier="2"]');

    const after = await page.$$eval('.recipe-ingredients [data-recipe-qty]',
      (els) => els.map((e) => e.textContent.trim()));
    // 500 g flour → 1000 g, 400 g water → 800 g.
    expect(after.join(' ')).toContain('1000 g');
    expect(after.join(' ')).toContain('800 g');
    expect(before.length).toBe(after.length);

    // The yield tile tracks the scaler rather than going stale.
    await expect(page.locator('.recipe-meta-item').filter({ hasText: 'Makes' })).toContainText('24');
  });

  test('ratio percentages hold while the weights scale', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);
    await waitForScaler(page);

    const read = () => page.$$eval('.recipe-ratio-table tbody tr',
      (trs) => trs.map((tr) => tr.children[2].textContent.trim()));

    const base = await read();
    await page.click('[data-recipe-multiplier="3"]');
    expect(await read(), 'a ratio does not care how much you make').toEqual(base);
  });

  test('metric turns authored volumes into weights', async ({ page }) => {
    await gotoOrSkip(page, COOKIES_URL);
    await waitForScaler(page);

    await page.click('[data-recipe-units="metric"]');
    const lines = (await ingredientLines(page)).join(' ');

    // 1 cup butter at 227 g/cup; 2¼ cups flour at 125 g/cup.
    expect(lines).toContain('227 g');
    expect(lines).toContain('281 g');
    expect(lines, 'no cup measures survive the switch to metric').not.toMatch(/\bcups?\b/);
  });

  test('US turns authored weights into cups and spoons', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);
    await waitForScaler(page);

    await page.click('[data-recipe-units="us"]');
    const lines = (await ingredientLines(page)).join(' ');

    expect(lines, '500 g bread flour is about 4 cups').toContain('4 cups');
    expect(lines).toMatch(/tsp|tbsp/);
    expect(lines, 'gram weights are gone in US units').not.toMatch(/\d\s?g\b/);
  });

  test('oven temperature follows the unit switch', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);
    await waitForScaler(page);

    const oven = page.locator('.recipe-meta-item').filter({ hasText: 'Oven' });
    await expect(oven, 'both scales are shown as written').toContainText('°F');
    await expect(oven).toContainText('°C');

    await page.click('[data-recipe-units="metric"]');
    await expect(oven).toContainText('°C');
    await expect(oven).not.toContainText('°F');

    await page.click('[data-recipe-units="us"]');
    await expect(oven).toContainText('°F');
    await expect(oven).not.toContainText('°C');
  });

  test('per-serving nutrition does not scale', async ({ page }) => {
    await gotoOrSkip(page, COOKIES_URL);
    await waitForScaler(page);

    const read = () => page.locator('.recipe-nutrition-grid').textContent();
    const base = await read();
    await page.click('[data-recipe-multiplier="2"]');
    expect(await read(), 'a serving is a serving however many you make').toBe(base);
  });

  test('countable ingredients take the singular at one or below', async ({ page }) => {
    await gotoOrSkip(page, COOKIES_URL);
    await waitForScaler(page);

    await page.click('[data-recipe-multiplier="0.5"]');
    const lines = (await ingredientLines(page)).join(' ');
    expect(lines, 'half a batch needs one egg, not "1 large eggs"').toMatch(/1 large egg(?!s)/);
    expect(lines, 'and half a yolk is still a yolk').toMatch(/½ egg yolk(?!s)/);
  });

  test('reset returns the page to exactly what was authored', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL);
    await waitForScaler(page);

    const authored = await ingredientLines(page);
    await page.click('[data-recipe-units="us"]');
    await page.click('[data-recipe-multiplier="3"]');
    expect(await ingredientLines(page)).not.toEqual(authored);

    await page.click('[data-recipe-reset]');
    expect(await ingredientLines(page)).toEqual(authored);
  });

  test('a shared link can carry the scale', async ({ page }) => {
    await gotoOrSkip(page, FOCACCIA_URL + '?servings=24');
    await waitForScaler(page);
    await expect(page.locator('[data-recipe-yield-input]')).toHaveValue('24');
    expect((await ingredientLines(page)).join(' ')).toContain('1000 g');
  });
});

test.describe('Recipes — cookbook index (cookbook.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('groups recipes into courses without skipping heading levels', async ({ page }) => {
    await gotoOrSkip(page, COOKBOOK_URL);

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.locator('.recipe-course').count()).toBeGreaterThan(1);

    const levels = await page.$$eval('.cookbook h1, .cookbook h2, .cookbook h3, .cookbook h4',
      (els) => els.map((e) => parseInt(e.tagName.slice(1), 10)));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1],
        `heading level jumps from h${levels[i - 1]} to h${levels[i]}`).toBeLessThanOrEqual(1);
    }
  });

  test('every card links to a recipe that exists', async ({ page }) => {
    await gotoOrSkip(page, COOKBOOK_URL);

    const hrefs = await page.$$eval('.recipe-card-link', (els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.status(), `${href} is reachable`).toBeLessThan(400);
    }
  });
});

test.describe('Recipes — mobile', () => {
  test('the recipe page does not overflow at phone width', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await gotoOrSkip(page, FOCACCIA_URL);
    await waitForScaler(page);

    const overflow = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    expect(overflow, 'no horizontal scroll on a phone').toBeLessThanOrEqual(1);
  });
});
