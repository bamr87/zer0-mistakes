/**
 * Global page chrome: rich footer content and the header's skip-to-content link.
 *
 * Moved out of the dissolved ui-refresh.spec.js: the "Footer — powered-by and
 * layout" describe block, plus the skip-link check that lived in that file's
 * catch-all "Accessibility — visibility and focus smoke" describe.
 *
 * Run: npm run test:smoke
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

test.describe('Global chrome — accessibility smoke', () => {
  test('skip link is focusable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(skip).toBeFocused();
  });
});
