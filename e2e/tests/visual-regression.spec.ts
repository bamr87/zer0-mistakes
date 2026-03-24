import { test, expect } from '@playwright/test';

test.describe('Visual regression', () => {
  const pages = [
    { name: 'homepage', path: '/' },
    { name: 'about', path: '/about/' },
  ];

  for (const { name, path } of pages) {
    test(`${name} — desktop screenshot`, async ({ page }) => {
      test.use({ viewport: { width: 1280, height: 720 } });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Dismiss cookie banner if present
      const acceptBtn = page.locator('#acceptAllCookies');
      if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
      }
      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        fullPage: true,
        maxDiffPixels: 200,
      });
    });

    test(`${name} — mobile screenshot`, async ({ page }) => {
      test.use({ viewport: { width: 375, height: 667 } });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const acceptBtn = page.locator('#acceptAllCookies');
      if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
      }
      await expect(page).toHaveScreenshot(`${name}-mobile.png`, {
        fullPage: true,
        maxDiffPixels: 200,
      });
    });
  }

  test('header visual consistency across pages', async ({ page }) => {
    // Capture header on homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const header = page.locator('#navbar');
    await expect(header).toHaveScreenshot('header-baseline.png', {
      maxDiffPixels: 100,
    });
  });

  test('footer visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footer = page.locator('footer').first();
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer-baseline.png', {
        maxDiffPixels: 100,
      });
    }
  });
});
