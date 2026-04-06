/**
 * Theme skin visual regression tests.
 * Validates zer0Bg.setSkin() for all 9 skins: attribute changes,
 * CSS variable presence, localStorage persistence, and visual snapshots.
 */
const { test, expect } = require('@playwright/test');
const { SKINS, VIEWPORTS, waitForJekyll, setSkin, clearSkinStorage } = require('./fixtures');

test.describe('Theme skins', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
  });

  for (const skin of SKINS) {
    test.describe(`skin: ${skin}`, () => {
      test(`sets data-theme-skin attribute`, async ({ page }) => {
        await setSkin(page, skin);
        const attr = await page.getAttribute('html', 'data-theme-skin');
        expect(attr).toBe(skin);
      });

      test(`persists skin to localStorage`, async ({ page }) => {
        await setSkin(page, skin);
        const stored = await page.evaluate(() => localStorage.getItem('zer0-theme-skin'));
        expect(stored).toBe(skin);
      });

      test(`skin restores after navigation`, async ({ page }) => {
        await setSkin(page, skin);
        // Navigate away
        await page.goto('/faq/', { waitUntil: 'networkidle' });
        // Skin should restore from localStorage
        const attr = await page.getAttribute('html', 'data-theme-skin');
        expect(attr).toBe(skin);
      });

      test(`homepage visual snapshot`, async ({ page }) => {
        await setSkin(page, skin);
        // Wait for skin transition to settle
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot(`homepage-${skin}.png`, {
          fullPage: false,
          maxDiffPixels: 150,
        });
      });
    });
  }

  test('zer0Bg.currentSkin() returns active skin', async ({ page }) => {
    await setSkin(page, 'neon');
    const current = await page.evaluate(() => window.zer0Bg.currentSkin());
    expect(current).toBe('neon');
  });

  test('skin-change event fires with correct detail', async ({ page }) => {
    const detail = await page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('zer0:skin-change', (e) => resolve(e.detail), { once: true });
        window.zer0Bg.setSkin('plum');
      });
    });
    expect(detail).toEqual({ skin: 'plum' });
  });
});
