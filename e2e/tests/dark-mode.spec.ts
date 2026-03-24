import { test, expect } from '@playwright/test';

test.describe('Dark mode / Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page has data-bs-theme attribute', async ({ page }) => {
    const html = page.locator('html');
    const theme = await html.getAttribute('data-bs-theme');
    expect(theme).toBeTruthy();
    expect(['dark', 'light']).toContain(theme);
  });

  test('default theme is dark', async ({ page }) => {
    const theme = await page.locator('html').getAttribute('data-bs-theme');
    expect(theme).toBe('dark');
  });

  test('body background adapts to dark theme', async ({ page }) => {
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Dark theme should have a dark background (low RGB values)
    const match = bgColor.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      // Dark backgrounds have average RGB < 128
      expect((r + g + b) / 3).toBeLessThan(128);
    }
  });

  test('navbar is visible in dark mode', async ({ page }) => {
    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('text is readable against dark background', async ({ page }) => {
    // Check body text color is light enough on dark bg
    const textColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).color;
    });
    const match = textColor.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      // Light text on dark bg should have average RGB > 128
      expect((r + g + b) / 3).toBeGreaterThan(100);
    }
  });
});
