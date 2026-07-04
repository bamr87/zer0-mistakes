/**
 * Footer chrome — universal site footer smoke tests.
 *
 * Covers the powered-by credit links and the footer nav column layout.
 * These checks apply to the footer as global site chrome and aren't tied to
 * any specific numbered feature, so they live under test/visual/core rather
 * than a feature-specific spec.
 *
 * Run: npm run test:smoke  (included in the smoke project via grepInvert)
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, waitForJekyll } = require('../fixtures');

test.describe('Footer — powered-by and layout', () => {
  test('powered-by credits are real links', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const links = page.locator('.footer-powered-by-links a[href]');
    expect(await links.count()).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(await links.count(), 5); i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });

  test('footer nav columns use equal width at tablet', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await waitForJekyll(page, UI_ROUTES.home);

    const cols = page.locator('.footer-nav-columns > [class*="col-"]');
    if ((await cols.count()) < 2) {
      test.skip(true, 'Footer columns not rendered');
      return;
    }
    const firstBox = await cols.first().boundingBox();
    const secondBox = await cols.nth(1).boundingBox();
    if (!firstBox || !secondBox) return;
    const widthDelta = Math.abs(firstBox.width - secondBox.width);
    expect(widthDelta).toBeLessThanOrEqual(24);
  });
});
