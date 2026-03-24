import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header is visible and fixed at top', async ({ page }) => {
    const header = page.locator('#navbar');
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box?.y).toBeLessThanOrEqual(5);
  });

  test('brand/home link is present', async ({ page }) => {
    const brand = page.locator('.navbar a[href="/"], .navbar a[href="./"]').first();
    await expect(brand).toBeVisible();
  });

  test('main navigation links render', async ({ page }) => {
    const navLinks = page.locator('.navbar-nav .nav-link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('navigation links are clickable and navigate', async ({ page }) => {
    const firstLink = page.locator('.navbar-nav .nav-link[href]').first();
    const href = await firstLink.getAttribute('href');
    if (href && !href.startsWith('#')) {
      await firstLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain(href.replace(/^\./, ''));
    }
  });

  test('dropdown menus open on interaction', async ({ page }) => {
    const dropdownToggle = page.locator('.navbar-nav .dropdown-toggle').first();
    if (await dropdownToggle.isVisible()) {
      await dropdownToggle.click();
      const dropdownMenu = page.locator('.navbar-nav .dropdown-menu.show').first();
      await expect(dropdownMenu).toBeVisible();
    }
  });

  test('skip-to-content link exists and targets #main-content', async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
  });
});

test.describe('Navigation — mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('offcanvas menu toggle is visible', async ({ page }) => {
    await page.goto('/');
    const toggler = page.locator('[data-bs-toggle="offcanvas"], .navbar-toggler').first();
    await expect(toggler).toBeVisible();
  });

  test('offcanvas opens and shows nav links', async ({ page }) => {
    await page.goto('/');
    const toggler = page.locator('[data-bs-target="#bdNavbar"]').first();
    if (await toggler.isVisible()) {
      await toggler.click();
      const offcanvas = page.locator('#bdNavbar');
      await expect(offcanvas).toBeVisible();
      const links = offcanvas.locator('.nav-link');
      expect(await links.count()).toBeGreaterThan(0);
    }
  });

  test('offcanvas can be dismissed', async ({ page }) => {
    await page.goto('/');
    const toggler = page.locator('[data-bs-target="#bdNavbar"]').first();
    if (await toggler.isVisible()) {
      await toggler.click();
      const closeBtn = page.locator('#bdNavbar .btn-close');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      // After close animation, offcanvas should not have the "show" class
      await expect(page.locator('#bdNavbar.show')).toBeHidden({ timeout: 2000 });
    }
  });
});
