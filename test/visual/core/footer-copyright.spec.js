/**
 * Footer copyright — the © notice renders exactly once (backlog T-054).
 *
 * _includes/core/footer.html used to print "© <year> <name>" above the
 * Powered-by row AND "© <year> <title>. All Rights Reserved." in the bottom
 * bar, so every page showed the notice twice.
 */
const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

for (const route of ['/', '/about/']) {
  test(`footer prints a single copyright notice on ${route}`, async ({ page }) => {
    await waitForJekyll(page, route);
    const text = await page.locator('footer.bd-footer').innerText();
    const count = (text.match(/©/g) || []).length;
    expect(count, `© occurrences in footer on ${route}`).toBe(1);
    await expect(page.locator('footer.bd-footer')).toContainText('All Rights Reserved');
  });
}
