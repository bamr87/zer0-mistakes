import { test, expect } from '@playwright/test';
import { isBootstrapCSSLoaded } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header is present and has fixed-top class', async ({ page }) => {
    const header = page.locator('#navbar');
    await expect(header).toBeVisible();
    // The auto-hide-nav.js may translate the navbar off-screen during
    // initial page load. We verify the element exists with fixed-top styling
    // rather than asserting an exact pixel position.
    const hasFixedTop = await header.evaluate((el) =>
      el.classList.contains('fixed-top')
    );
    expect(hasFixedTop).toBe(true);
  });

  test('brand/home link is present', async ({ page }) => {
    // The site has multiple home links; the navbar-brand with the logo image
    // is always present. On desktop with Bootstrap CSS, the icon buttons are
    // also visible.  We assert the link exists in the DOM.
    const brand = page.locator('#navbar .navbar-brand[href="/"], #navbar a[aria-label="Home"]').first();
    await expect(brand).toHaveCount(1);
    // When Bootstrap CSS is loaded, the brand should also be visible
    if (await isBootstrapCSSLoaded(page)) {
      await expect(brand).toBeVisible();
    }
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
