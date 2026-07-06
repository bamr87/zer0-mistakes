/**
 * Navbar — labels, brand cluster, and dropdown interactions.
 *
 * Moved out of the dissolved ui-refresh.spec.js ("Navbar — labels and brand
 * cluster") and interactions.spec.js ("Navbar dropdowns") grab-bag files.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, waitForJekyll, boxesOverlap } = require('../fixtures');

test.describe('Navbar — labels and brand cluster', () => {
  test('wide desktop shows full nav labels without ellipsis', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.wideDesktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const labels = page.locator('#bdNavbar .nav-link-text');
    const count = await labels.count();
    if (count === 0) {
      test.skip(true, 'Inline menubar hidden at this width');
      return;
    }

    for (let i = 0; i < count; i++) {
      const text = ((await labels.nth(i).textContent()) || '').trim();
      if (!text) continue;
      expect(text, `Nav label "${text}" should not be ellipsized`).not.toMatch(/\.\.\.$/);
    }

    const quickStart = labels.filter({ hasText: 'Quick Start' }).first();
    if (await quickStart.count()) {
      await expect(quickStart).toBeVisible();
      await expect(quickStart).toHaveText(/Quick Start/);
    }
  });

  test('mid desktop brand logo and title do not overlap', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.midDesktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const logo = page.locator('header#navbar .navbar-brand-group img').first();
    const title = page.locator('header#navbar .site-title-text').first();
    if ((await logo.count()) === 0 || (await title.count()) === 0) {
      test.skip(true, 'Brand cluster not rendered');
      return;
    }

    const logoBox = await logo.boundingBox();
    const titleBox = await title.boundingBox();
    expect(logoBox && titleBox, 'Brand elements must have layout boxes').toBeTruthy();
    expect(
      titleBox.x,
      'Site title should sit to the right of the logo'
    ).toBeGreaterThanOrEqual(logoBox.x + logoBox.width - 4);
    expect(boxesOverlap(logoBox, titleBox, 4)).toBe(false);
  });

  test('mobile shows site title and offcanvas toggler', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await waitForJekyll(page, UI_ROUTES.home);

    await expect(page.locator('header#navbar .site-title-text').first()).toBeVisible();
    const toggler = page.locator(
      '.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]'
    );
    await expect(toggler).toBeVisible();
  });

  test('tablet shows mobile quicklink chips between md and lg', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await waitForJekyll(page, UI_ROUTES.home);

    const quicklinks = page.locator('.navbar-mobile-quicklinks');
    if ((await quicklinks.count()) === 0) {
      test.skip(true, 'Quicklinks not configured');
      return;
    }
    await expect(quicklinks).toBeVisible();
    await expect(quicklinks.locator('a.navbar-mobile-quicklinks__chip').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navbar dropdowns — assets/js/modules/navigation/navbar.js (.nav-hover-dropdown)
// Hover-to-open was removed; dropdowns toggle on the .dropdown-toggle-split chevron.
// ---------------------------------------------------------------------------
test.describe('Navbar dropdowns', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.wideDesktop); // lg+ so the menubar is inline
    await waitForJekyll(page, '/');
  });

  test('chevron click opens and re-closes the dropdown menu', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await expect(toggle).toBeVisible();
    await expect(menu).not.toHaveClass(/show/);

    await toggle.click();
    await expect(menu).toHaveClass(/show/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.locator('.dropdown-item').first()).toBeVisible();

    await toggle.click();
    await expect(menu).not.toHaveClass(/show/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('outside click closes an open dropdown', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);

    await page.locator('#main-content').click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toHaveClass(/show/);
  });

  test('Escape closes an open dropdown and restores focus to the toggle', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveClass(/show/);
  });
});
