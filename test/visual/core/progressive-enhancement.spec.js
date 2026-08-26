/**
 * Progressive-enhancement hooks — the `html.no-js` → `html.js` contract.
 *
 * Regression: #319. `_layouts/root.html` shipped `<html class="no-js">` but
 * nothing ever upgraded it, so the string `no-js` appeared in exactly one file
 * in the repository and in no CSS, JS, test or doc. Every page on every
 * downstream site permanently carried `no-js` with JavaScript fully enabled,
 * and any consumer rule written as `html.js .foo {…}` took the no-JS branch
 * for everyone.
 *
 * The contract these tests pin, in both directions:
 *   JS on  → <html class="js">    (and never "no-js")
 *   JS off → <html class="no-js"> (the served markup is unchanged)
 *
 * The second half is what makes the first half worth having — a fix that
 * simply deleted `class="no-js"` from the layout would satisfy a naive
 * "className is not no-js" assertion while removing the hook entirely.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, waitForJekyll } = require('../fixtures');

test.describe('Progressive enhancement — html.js / html.no-js', () => {
  test('with JavaScript enabled the root element is upgraded to "js"', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const classes = await page.evaluate(() => [...document.documentElement.classList]);
    expect(classes, 'root element should advertise that JS is running').toContain('js');
    expect(
      classes,
      'the no-js token must be gone once the swap script has run — a consumer ' +
        'writing `html.no-js .foo {…}` would otherwise style every visitor'
    ).not.toContain('no-js');
  });

  // Guards the delivery mechanism, not just the outcome. The swap has to be
  // inline and render-blocking at the very top of <head>: moved into
  // core/head.html it would sit below Google Tag Manager, and given `defer` or
  // `async` it would run after the stylesheets, flashing the no-JS branch.
  test('the swap script is inline, un-deferred, and ahead of the first stylesheet', async ({ page }) => {
    const response = await page.goto(UI_ROUTES.home, { waitUntil: 'domcontentloaded' });
    const html = await response.text();

    const head = html.slice(html.indexOf('<head'), html.indexOf('</head>'));
    const swapAt = head.search(/classList\.replace\(\s*["']no-js["']\s*,\s*["']js["']\s*\)/);
    expect(swapAt, 'the no-js → js swap must be inline in <head>').toBeGreaterThan(-1);

    const openAt = head.lastIndexOf('<script', swapAt);
    const openTag = head.slice(openAt, head.indexOf('>', openAt) + 1);
    expect(openTag, 'the swap must not be deferred or async').not.toMatch(/\b(defer|async)\b/);
    expect(openTag, 'the swap must be inline, not an external file').not.toMatch(/\bsrc=/);

    const firstStylesheet = head.search(/<link[^>]+rel=["']stylesheet["']/i);
    if (firstStylesheet !== -1) {
      expect(
        swapAt,
        'the swap must precede the first stylesheet or html.js rules flash'
      ).toBeLessThan(firstStylesheet);
    }
  });
});

// A separate context: javaScriptEnabled is a context-level option, so it needs
// its own describe block rather than a per-test toggle.
test.describe('Progressive enhancement — JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('the served markup still carries class="no-js"', async ({ page }) => {
    const response = await page.goto(UI_ROUTES.home, { waitUntil: 'domcontentloaded' });
    const html = await response.text();

    expect(
      html,
      'root.html must keep class="no-js" in the served HTML — it is the ' +
        'no-JS branch of the contract, not a leftover'
    ).toContain('class="no-js"');

    // Asserted with a locator rather than page.evaluate: evaluate runs in the
    // main world, which this context has script execution disabled in.
    await expect(
      page.locator('html'),
      'with JS off, nothing should have upgraded the token'
    ).toHaveClass(/(^|\s)no-js(\s|$)/);
  });
});
