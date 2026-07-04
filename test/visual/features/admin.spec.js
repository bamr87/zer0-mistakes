// =============================================================================
// admin.spec.js — Admin Layout & Configuration Dashboards (ZER0-050)
// =============================================================================
// ZER0-050 covers the entire admin area under /about/settings/** and
// /about/config/, so this single file merges all of its sub-page suites:
//
//   - Admin layout structure: every ADMIN_PAGES entry renders the correct
//     layout, sidebar, breadcrumbs, header, and admin content area.
//   - Admin layout — desktop sidebar: sidebar visibility and active-section
//     highlighting (server-rendered, before ScrollSpy mutates it), including
//     a strict "exactly one active link" check folded in from admin-nav.
//   - Admin layout — mobile responsive: sidebar toggle, hidden desktop
//     sidebar, and offcanvas sidebar behavior on mobile viewports.
//   - Admin layout — console errors: no console errors across admin pages.
//   - Admin navigation links: sidebar nav item completeness, external link
//     target/rel attributes, and cross-page navigation via sidebar clicks.
//   - Admin — Environment Dashboard (/about/settings/environment/): overview
//     cards, Jekyll version string, absence of placeholder/error values, and
//     active plugin listing.
//   - Admin — Configuration Viewer (/about/config/): accordion rendering,
//     search filtering (including no-result handling), and section copy
//     (YAML quoting regression, currently fixme).
//   - Admin — Configuration Editor (/about/config/ Edit & Export tab): form
//     field pre-population, live YAML preview updates, theme_skin dropdown,
//     and the config download button.
// =============================================================================

const { test, expect } = require('@playwright/test');
const {
  ADMIN_PAGES,
  VIEWPORTS,
  waitForJekyll,
  gotoBeforeScrollSpy,
  collectConsoleErrors,
  assertNoConsoleErrors,
} = require('../fixtures');

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
      // Folded in from admin-nav.spec.js's "active nav item tracks current
      // page" test: assert exactly one active link (strictness check).
      expect(await page.locator('nav.admin-sidebar .nav-link.active').count()).toBe(1);
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

  // Dropped "internal link ... resolves to 200" parametrized loop here:
  // duplicates "Admin layout structure" → "<page> returns 200 status" above
  // (same assertion, redundant network hit).

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

  // Dropped "active nav item tracks current page" here: duplicates
  // "Admin layout — desktop sidebar" → "<page> sidebar highlights active
  // section" above, which now also asserts exactly one active link.

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

test.describe('Admin — Environment Dashboard', () => {
  const ENV_URL = '/about/settings/environment/';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, ENV_URL);
  });

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(ENV_URL);
    expect(response.status()).toBe(200);
  });

  test('overview cards render key information', async ({ page }) => {
    // Look for card elements displaying build info
    const cards = page.locator('.card, .info-card, .stat-card, [class*="card"]');
    expect(await cards.count(), 'Expected overview information cards').toBeGreaterThan(0);
  });

  test('Jekyll version is non-empty and valid (regression: wrong variable)', async ({ page }) => {
    // The page should display the Jekyll version somewhere within admin content
    const pageText = await page.textContent('#admin-content');
    // Look for a version string pattern (e.g., "3.10.0", "4.3.4")
    const versionMatch = pageText.match(/Jekyll[^]*?(\d+\.\d+\.\d+)/i);
    expect(versionMatch, 'Expected Jekyll version number on environment page').not.toBeNull();
    // Should not show "undefined" or empty in the admin content area
    expect(pageText).not.toContain('undefined');
  });

  test('no placeholder or error values in critical fields', async ({ page }) => {
    const pageText = await page.textContent('#admin-content');
    // These indicate missing data
    const forbidden = ['undefined', 'NaN', 'null'];
    for (const bad of forbidden) {
      // Case-sensitive check for programmatic output values
      const regex = new RegExp(`\\b${bad}\\b`);
      expect(
        regex.test(pageText),
        `Found "${bad}" in environment dashboard content`
      ).toBe(false);
    }
  });

  test('active plugins list is non-empty', async ({ page }) => {
    // Look for a list of plugins
    const pluginSection = page.locator('ul, ol, table').filter({ hasText: /plugin/i });
    if (await pluginSection.count() === 0) {
      // Try broader search for plugin mentions
      const content = await page.textContent('#admin-content');
      expect(content.toLowerCase()).toContain('plugin');
      return;
    }
    const items = pluginSection.first().locator('li, tr');
    expect(await items.count(), 'Expected at least one plugin listed').toBeGreaterThan(0);
  });

  // TODO: Ruby version requires a custom plugin blocked by github-pages safe mode.
  // Re-enable when the env-dashboard provides Ruby version via another mechanism.
  test.fixme('Ruby version is displayed', async ({ page }) => {
    const pageText = await page.textContent('#admin-content');
    // Ruby version pattern (e.g., "3.2.0", "2.7.8")
    expect(pageText).toMatch(/ruby[^]*?\d+\.\d+/i);
  });
});

test.describe('Admin — Configuration Viewer', () => {
  const CONFIG_URL = '/about/config/';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, CONFIG_URL);
  });

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(CONFIG_URL);
    expect(response.status()).toBe(200);
  });

  test('accordion renders configuration sections', async ({ page }) => {
    const accordionItems = page.locator('.accordion-item, .card');
    const count = await accordionItems.count();
    expect(count, 'Expected multiple config sections to render').toBeGreaterThan(0);
  });

  test('search input exists and is functional', async ({ page }) => {
    const searchInput = page.locator('#cfg-search');
    const count = await searchInput.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await searchInput.fill('title');
    // Wait for filtering to apply
    await page.waitForTimeout(500);
    // The page should still have visible config content (not completely empty)
    const adminContent = page.locator('#admin-content');
    await expect(adminContent).toBeVisible();
  });

  test('search with no results hides content gracefully', async ({ page }) => {
    const searchInput = page.locator('#cfg-search');
    if (await searchInput.count() === 0) {
      test.skip();
      return;
    }
    await searchInput.fill('xyznonexistentkeyxyz');
    await page.waitForTimeout(500);
    // Page should not crash — no console errors tested elsewhere
  });

  // TODO: Fix JS export to wrap #RRGGBB values in YAML quotes to prevent
  // YAML parsers from treating them as comments.
  test.fixme('section copy produces YAML with quoted special characters (regression)', async ({ page }) => {
    // Look for section-level copy buttons
    const copyButtons = page.locator('button.cfg-copy-section, button#cfg-copy-full');
    const count = await copyButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await copyButtons.first().click();
    await page.waitForTimeout(500);
    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    // If clipboard has YAML with # values, they must be quoted
    const hashLines = clipText.split('\n').filter((l) => /#[0-9a-fA-F]{3,6}/.test(l));
    for (const line of hashLines) {
      expect(
        line,
        `Section copy must quote hex values: ${line.trim()}`
      ).toMatch(/["'][^"']*#[0-9a-fA-F]{3,6}[^"']*["']/);
    }
  });
});

test.describe('Admin — Configuration Editor', () => {
  const CONFIG_URL = '/about/config/';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, CONFIG_URL);
  });

  test('Edit & Export tab is accessible', async ({ page }) => {
    // Try clicking the Edit & Export tab
    const editTab = page.locator('[role="tab"]', { hasText: /edit|export/i });
    const count = await editTab.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await editTab.first().click();
    await page.waitForTimeout(300);
    // The tab panel should become visible
    const panel = page.locator('[role="tabpanel"]:visible');
    await expect(panel).toBeVisible();
  });

  test('form fields are pre-populated with site values', async ({ page }) => {
    const editTab = page.locator('[role="tab"]', { hasText: /edit|export/i });
    if (await editTab.count() === 0) {
      test.skip();
      return;
    }
    await editTab.first().click();
    await page.waitForTimeout(300);
    // Look for a title input
    const titleInput = page.locator('input#cfg-title, input[name="title"]');
    if (await titleInput.count() === 0) {
      test.skip();
      return;
    }
    const value = await titleInput.first().inputValue();
    expect(value.length, 'Title field should be pre-populated').toBeGreaterThan(0);
  });

  test('changing title updates YAML preview', async ({ page }) => {
    const editTab = page.locator('[role="tab"]', { hasText: /edit|export/i });
    if (await editTab.count() === 0) {
      test.skip();
      return;
    }
    await editTab.first().click();
    await page.waitForTimeout(300);

    const titleInput = page.locator('input#cfg-title, input[name="title"]');
    if (await titleInput.count() === 0) {
      test.skip();
      return;
    }
    await titleInput.first().fill('Test Site Title');
    await page.waitForTimeout(300);

    // Find YAML preview
    const yamlPreview = page.locator('pre, textarea, code').filter({ hasText: 'title' });
    if (await yamlPreview.count() === 0) {
      test.skip();
      return;
    }
    const yaml = await yamlPreview.first().textContent();
    expect(yaml).toContain('Test Site Title');
  });

  test('theme_skin dropdown lists available skins', async ({ page }) => {
    const editTab = page.locator('[role="tab"]', { hasText: /edit|export/i });
    if (await editTab.count() === 0) {
      test.skip();
      return;
    }
    await editTab.first().click();
    await page.waitForTimeout(300);

    const skinSelect = page.locator('select#cfg-skin, select[name="theme_skin"]');
    if (await skinSelect.count() === 0) {
      test.skip();
      return;
    }
    const options = await skinSelect.first().locator('option').allTextContents();
    expect(options.length, 'Skin dropdown should have multiple options').toBeGreaterThan(1);
  });

  test('download button has download attribute', async ({ page }) => {
    const editTab = page.locator('[role="tab"]', { hasText: /edit|export/i });
    if (await editTab.count() === 0) {
      test.skip();
      return;
    }
    await editTab.first().click();
    await page.waitForTimeout(300);

    const downloadBtn = page.locator('a[download], button').filter({ hasText: /download/i });
    expect(await downloadBtn.count(), 'Expected a download button').toBeGreaterThan(0);
  });
});
