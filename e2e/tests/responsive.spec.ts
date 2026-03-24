import { test, expect } from '@playwright/test';

test.describe('Responsive layout — Desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('main navigation is visible inline', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('.navbar-nav .nav-link');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });

  test('offcanvas toggle is hidden on desktop', async ({ page }) => {
    await page.goto('/');
    // The navbar toggler for offcanvas should be hidden at lg breakpoint
    const toggler = page.locator('.navbar-toggler').first();
    if (await toggler.count() > 0) {
      await expect(toggler).toBeHidden();
    }
  });

  test('content area fills available width', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('#main-content').first();
    const box = await main.boundingBox();
    expect(box?.width).toBeGreaterThan(600);
  });
});

test.describe('Responsive layout — Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('page loads without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // small tolerance
  });

  test('header remains visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#navbar')).toBeVisible();
  });
});

test.describe('Responsive layout — Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('page loads without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('mobile navigation toggler is visible', async ({ page }) => {
    await page.goto('/');
    const toggler = page.locator('[data-bs-target="#bdNavbar"]').first();
    if (await toggler.count() > 0) {
      await expect(toggler).toBeVisible();
    }
  });

  test('content is not clipped', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('#main-content').first();
    const box = await main.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
    expect(box?.width).toBeLessThanOrEqual(380);
  });

  test('footer is visible when scrolled to bottom', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const footer = page.locator('footer').first();
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });
});
