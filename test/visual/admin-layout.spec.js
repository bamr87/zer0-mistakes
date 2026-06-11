/**
 * Admin layout structural tests.
 * Validates that all admin pages render the correct layout, sidebar,
 * breadcrumbs, header, and responsive behavior.
 */
const { test, expect } = require('@playwright/test');
const { ADMIN_PAGES, VIEWPORTS, waitForJekyll, gotoBeforeScrollSpy, collectConsoleErrors, assertNoConsoleErrors } = require('./fixtures');

test.describe('Admin layout structure', () => {
  for (const adminPage of ADMIN_PAGES) {
    test.describe(adminPage.title, () => {
      test(`returns 200 status`, async ({ page }) => {
        const response = await page.goto(adminPage.url);
        expect(response.status()).toBe(200);
      });

      test(`renders admin header with title`, async ({ page }) => {
        await waitForJekyll(page, adminPage.url);
        // Admin header area
        const header = page.locator('.bg-body-tertiary.border-bottom');
        await expect(header).toBeVisible();
        // Page title is rendered in h1.h3 — may differ from nav sidebar label
        const expectedTitle = adminPage.pageTitle || adminPage.title;
        const title = header.locator('h1.h3');
        await expect(title).toBeVisible();
        const titleText = await title.textContent();
        expect(titleText.trim()).toBe(expectedTitle);
      });

      test(`renders breadcrumb navigation`, async ({ page }) => {
        await waitForJekyll(page, adminPage.url);
        const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
        await expect(breadcrumb).toBeVisible();
        // Should have Home > About > Current Page
        const items = breadcrumb.locator('.breadcrumb-item');
        expect(await items.count()).toBeGreaterThanOrEqual(3);
        // Last item is active and matches page title (may differ from nav label)
        const expectedTitle = adminPage.pageTitle || adminPage.title;
        const active = breadcrumb.locator('.breadcrumb-item.active');
        await expect(active).toContainText(expectedTitle);
      });

      test(`renders icon in header`, async ({ page }) => {
        await waitForJekyll(page, adminPage.url);
        const iconArea = page.locator('.bg-body-tertiary .d-flex.align-items-center i.fs-2');
        await expect(iconArea).toBeVisible();
      });

      test(`renders admin content area`, async ({ page }) => {
        await waitForJekyll(page, adminPage.url);
        const content = page.locator('#admin-content');
        await expect(content).toBeVisible();
      });
    });
  }
});

test.describe('Admin layout — desktop sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  for (const adminPage of ADMIN_PAGES) {
    test(`${adminPage.title}: sidebar visible on desktop`, async ({ page }) => {
      await waitForJekyll(page, adminPage.url);
      const sidebar = page.locator('nav.admin-sidebar');
      await expect(sidebar).toBeVisible();
    });

    test(`${adminPage.title}: sidebar highlights active section`, async ({ page }) => {
      // Use domcontentloaded to capture server-rendered active class
      // before Bootstrap ScrollSpy strips it at networkidle.
      await gotoBeforeScrollSpy(page, adminPage.url);
      const activeLink = page.locator('nav.admin-sidebar .nav-link.active');
      await expect(activeLink).toBeVisible();
      // Active link href should match current page URL
      const href = await activeLink.getAttribute('href');
      expect(href).toContain(adminPage.url.replace(/\/$/, ''));
    });
  }
});

test.describe('Admin layout — mobile responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
  });

  for (const adminPage of ADMIN_PAGES) {
    test(`${adminPage.title}: sidebar toggle visible on mobile`, async ({ page }) => {
      await waitForJekyll(page, adminPage.url);
      const toggle = page.locator('button[data-bs-target="#adminSidebar"]');
      await expect(toggle).toBeVisible();
    });

    test(`${adminPage.title}: desktop sidebar hidden on mobile`, async ({ page }) => {
      await waitForJekyll(page, adminPage.url);
      const desktopSidebar = page.locator('.col-lg-3.d-none.d-lg-block');
      await expect(desktopSidebar).not.toBeVisible();
    });

    test(`${adminPage.title}: offcanvas sidebar opens on toggle`, async ({ page }) => {
      await waitForJekyll(page, adminPage.url);
      const toggle = page.locator('button[data-bs-target="#adminSidebar"]');
      await toggle.click();
      const offcanvas = page.locator('#adminSidebar');
      await expect(offcanvas).toBeVisible();
      // Offcanvas has the admin nav
      await expect(offcanvas.locator('.nav.nav-pills')).toBeVisible();
    });
  }
});

test.describe('Admin layout — console errors', () => {
  for (const adminPage of ADMIN_PAGES) {
    test(`${adminPage.title}: no console errors`, async ({ page }) => {
      const bag = collectConsoleErrors(page);
      await waitForJekyll(page, adminPage.url);
      assertNoConsoleErrors(expect, bag);
    });
  }
});
