/**
 * Theme skin homepage visual snapshots.
 *
 * Extracted from test/visual/skins.spec.js's per-skin loop: this file
 * contains ONLY the parametrized `homepage visual snapshot` test (the one
 * `await expect(page).toHaveScreenshot(...)` assertion) for all 9 skins.
 * It exists purely so the Playwright config's `snapshots` project can
 * target it via a simple one-file glob, without pulling in the rest of
 * skins.spec.js's attribute/localStorage/navigation/event tests.
 */
const { test, expect } = require('@playwright/test');
const { SKINS, VIEWPORTS, waitForJekyll, setSkin, clearSkinStorage } = require('../fixtures');

test.describe('Theme skins', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
  });

  for (const skin of SKINS) {
    test.describe(`skin: ${skin}`, () => {
      test(`homepage visual snapshot`, async ({ page }) => {
        await setSkin(page, skin);
        // setSkin already waits for the html[data-theme-skin] attr to flip
        // and for the zer0:skin-change event. Animations are short; one
        // requestAnimationFrame is enough to let CSS variable changes paint.
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        await expect(page).toHaveScreenshot(`homepage-${skin}.png`, {
          fullPage: false,
          maxDiffPixels: 150,
        });
      });
    });
  }
});
