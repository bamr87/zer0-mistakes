/**
 * Background customizer tests.
 * Validates zer0Bg.toggle(), opacity sliders, and localStorage persistence.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll, clearSkinStorage } = require('./fixtures');

test.describe('Background customizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
  });

  test('toggle backgrounds off sets data-zer0-bg="off"', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.toggle(false));
    const attr = await page.getAttribute('html', 'data-zer0-bg');
    expect(attr).toBe('off');
  });

  test('toggle backgrounds on sets data-zer0-bg="on"', async ({ page }) => {
    await page.evaluate(() => {
      window.zer0Bg.toggle(false);
      window.zer0Bg.toggle(true);
    });
    const attr = await page.getAttribute('html', 'data-zer0-bg');
    expect(attr).toBe('on');
  });

  test('toggle persists to localStorage', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.toggle(false));
    const stored = await page.evaluate(() => localStorage.getItem('zer0-bg-enabled'));
    expect(stored).toBe('false');
  });

  test('bg-toggle event fires with correct detail', async ({ page }) => {
    const detail = await page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('zer0:bg-toggle', (e) => resolve(e.detail), { once: true });
        window.zer0Bg.toggle(false);
      });
    });
    expect(detail).toEqual({ enabled: false });
  });

  test('setOpacity("gradient", value) updates CSS variable', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.setOpacity('gradient', 0.5));
    const value = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--zer0-bg-gradient-opacity')
    );
    expect(parseFloat(value)).toBeCloseTo(0.5);
  });

  test('setOpacity("texture", value) updates CSS variable', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.setOpacity('texture', 0.1));
    const value = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--zer0-bg-texture-opacity')
    );
    expect(parseFloat(value)).toBeCloseTo(0.1);
  });

  test('setOpacity("pattern", value) updates CSS variable', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.setOpacity('pattern', 0.2));
    const value = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--zer0-bg-pattern-opacity')
    );
    expect(parseFloat(value)).toBeCloseTo(0.2);
  });

  test('background state persists across navigation', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.toggle(false));
    await page.goto('/faq/', { waitUntil: 'networkidle' });
    const attr = await page.getAttribute('html', 'data-zer0-bg');
    // Should restore "off" from localStorage
    expect(attr).toBe('off');
  });
});
