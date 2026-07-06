/**
 * Features page category badges linking to in-page anchors.
 *
 * Moved out of the dissolved ui-refresh.spec.js ("Features page — linked
 * category badges").
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, gotoOrSkip } = require('../fixtures');

test.describe('Features page — linked category badges', () => {
  test('feature category badges link to in-page anchors', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.features);

    const badge = page.locator('.feature-categories a.badge[href^="#"]').first();
    if ((await badge.count()) === 0) {
      test.skip(true, 'Feature categories not on this page');
      return;
    }
    const href = await badge.getAttribute('href');
    expect(href).toMatch(/^#/);
    const targetId = href.slice(1);
    const target = page.locator(`[id="${targetId}"]`);
    expect(await target.count()).toBeGreaterThan(0);
  });
});
