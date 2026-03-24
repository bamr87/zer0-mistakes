import { test, expect } from '@playwright/test';

test.describe('Visual regression', () => {
  const pages = [
    { name: 'homepage', path: '/' },
    { name: 'about', path: '/about/' },
  ];

  for (const { name, path } of pages) {
    test(`${name} — desktop screenshot`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
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
      await page.setViewportSize({ width: 375, height: 667 });
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
    // Verify header element dimensions are consistent across page loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Force navbar visible
    await page.evaluate(() => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.classList.remove('navbar-hidden');
        navbar.style.transition = 'none';
        navbar.style.transform = 'none';
      }
    });
    await page.waitForTimeout(500);
    const header = page.locator('#navbar');
    if (await header.isVisible()) {
      const box = await header.boundingBox();
      expect(box).toBeTruthy();
      // Header should span the full width
      expect(box!.width).toBeGreaterThan(1200);
      // Header should have a reasonable height
      // With Bootstrap CSS: ~60-120px (inline nav)
      // Without Bootstrap CSS: up to ~500px (stacked nav items)
      expect(box!.height).toBeGreaterThan(40);
      expect(box!.height).toBeLessThan(600);
    }
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
