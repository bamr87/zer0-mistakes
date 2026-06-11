/**
 * Admin navigation tests.
 * Validates sidebar nav links, external link attributes,
 * active state tracking, and cross-page navigation.
 */
const { test, expect } = require('@playwright/test');
const { ADMIN_PAGES, VIEWPORTS, waitForJekyll, gotoBeforeScrollSpy } = require('./fixtures');

test.describe('Admin navigation links', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('sidebar renders all expected nav items', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    const navLinks = page.locator('nav.admin-sidebar .nav-link');
    const count = await navLinks.count();
    // At least as many internal links as ADMIN_PAGES
    expect(count).toBeGreaterThanOrEqual(ADMIN_PAGES.length);
  });

  for (const adminPage of ADMIN_PAGES) {
    test(`internal link "${adminPage.title}" resolves to 200`, async ({ page, request }) => {
      const response = await request.get(adminPage.url);
      expect(response.status()).toBe(200);
    });
  }

  test('external links have target="_blank" and rel="noopener"', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    const externalLinks = page.locator('nav.admin-sidebar a[href^="http"]');
    const count = await externalLinks.count();
    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      await expect(link).toHaveAttribute('target', '_blank');
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('active nav item tracks current page', async ({ page }) => {
    for (const adminPage of ADMIN_PAGES) {
      // Use domcontentloaded to capture server-rendered active class
      // before Bootstrap ScrollSpy strips it at networkidle.
      await gotoBeforeScrollSpy(page, adminPage.url);
      const activeLinks = page.locator('nav.admin-sidebar .nav-link.active');
      const count = await activeLinks.count();
      expect(count, `Expected exactly 1 active link on ${adminPage.url}`).toBe(1);
      const href = await activeLinks.first().getAttribute('href');
      expect(href).toContain(adminPage.url.replace(/\/$/, ''));
    }
  });

  test('clicking sidebar link navigates to target page', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    // Click the "Theme Customizer" link
    const themeLink = page.locator('nav.admin-sidebar .nav-link', { hasText: 'Theme Customizer' });
    await themeLink.click();
    await page.waitForURL('**/about/settings/theme/**');
    // Verify we arrived at theme page
    const title = page.locator('h1.h3');
    await expect(title).toContainText('Theme Customizer');
  });
});
