/**
 * Theme preview gallery and the theme-customizer skin-apply interaction.
 *
 * Moved out of the dissolved ui-refresh.spec.js ("Theme preview page") and
 * interactions.spec.js ("Theme customizer — apply skin").
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, gotoOrSkip } = require('../fixtures');

test.describe('Theme preview page', () => {
  test('theme preview gallery and controls render', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.themePreview);

    await expect(page.locator('.theme-preview-gallery, .theme-controls-bar').first()).toBeVisible();
    await expect(page.locator('[data-theme-skin], .theme-skin-card').first()).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// Theme customizer — clicking a skin swatch applies the skin live
// assets/js/theme-customizer.js (#skin-grid .skin-card[data-skin])
// ---------------------------------------------------------------------------
test.describe('Theme customizer — apply skin', () => {
  const THEME_URL = '/about/settings/theme/';

  test('clicking a skin card applies it live and updates the YAML export', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, THEME_URL);

    const grid = page.locator('#skin-grid');
    if ((await grid.count()) === 0) test.skip(true, 'Skin grid not present');

    // Pick a non-active skin (the default active card is air → border-primary).
    const targetSkin = 'sunrise';
    const card = page.locator(`#skin-grid .skin-card[data-skin="${targetSkin}"]`).first();
    await expect(card).toBeVisible();

    const readPrimary = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim());
    const before = await readPrimary();

    await card.click();

    // Live application: <html data-theme-skin> flips and --bs-primary changes.
    await page.waitForFunction(
      (s) => document.documentElement.getAttribute('data-theme-skin') === s,
      targetSkin,
    );
    const after = await readPrimary();
    expect(after, 'skin swatch should change the live --bs-primary token').not.toBe(before);

    // Selected card is highlighted, and the export reflects the choice.
    await expect(card).toHaveClass(/border-primary/);
    await expect(page.locator('#theme-yaml-output')).toContainText(`theme_skin: "${targetSkin}"`);
  });
});
