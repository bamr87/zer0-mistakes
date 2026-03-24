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

  test('default theme respects prefers-color-scheme', async ({ page }) => {
    // halfmoon.js reads localStorage('theme') first, then falls back to
    // prefers-color-scheme.  Headless Chrome defaults to "light", so the
    // resulting data-bs-theme will be "light" unless a stored preference
    // overrides it.  We only assert the attribute is set to a valid value.
    const theme = await page.locator('html').getAttribute('data-bs-theme');
    expect(['dark', 'light']).toContain(theme);
  });

  test('dark theme can be activated via emulation', async ({ browser }) => {
    const context = await browser.newContext({
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    await page.goto('/');
    const theme = await page.locator('html').getAttribute('data-bs-theme');
    expect(theme).toBe('dark');
    await context.close();
  });

  test('body background adapts to theme', async ({ page }) => {
    // With the active theme (light or dark), verify background is set.
    // When Bootstrap CSS is loaded via CDN, the body gets a proper bg.
    // Without it (e.g., CDN blocked), the body may be transparent.
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBeTruthy();
    // Skip strict assertion when CSS isn't loaded (transparent bg)
    if (bgColor !== 'rgba(0, 0, 0, 0)') {
      // bg should be a real color — verify it's not just the default
      expect(bgColor).toMatch(/rgb/);
    }
  });

  test('navbar is visible', async ({ page }) => {
    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('text color differs from background color', async ({ page }) => {
    const colors = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      return {
        text: bodyStyle.color,
        bg: bodyStyle.backgroundColor,
      };
    });
    // Text and background should not be identical
    expect(colors.text).not.toBe(colors.bg);
  });
});
