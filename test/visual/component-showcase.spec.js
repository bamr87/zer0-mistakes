// =============================================================================
// component-showcase.spec.js — showcase demo links are inert (issue #219)
// =============================================================================
// The reusable component-showcase include (_includes/components/component-showcase.html)
// is rendered on the internal /about/settings/components/ reference page. Two
// regressions this guards:
//   1. It must RENDER at all — the usage examples in its header comment are now
//      wrapped in {% raw %}; un-wrapped, Liquid executed them and the include
//      recursively included itself ("stack level too deep" build crash).
//   2. Its breadcrumb + list-group DEMO links must be inert (href="#"), never
//      site-absolute paths (/docs/, /pages/, /categories/, /tags/) that 404 on
//      remote-theme consumers lacking those routes.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const SHOWCASE = '/about/settings/components/';

test.describe('Component showcase (issue #219)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, SHOWCASE);
  });

  test('renders without recursion — demo sections are present', async ({ page }) => {
    await expect(page.locator('#showcase-breadcrumbs')).toBeAttached();
    await expect(page.locator('#showcase-list-group')).toBeAttached();
    await expect(page.locator('nav[aria-label="breadcrumb example"]')).toBeVisible();
  });

  test('breadcrumb demo links are inert (href="#", no absolute 404 hazard)', async ({ page }) => {
    const links = page.locator('nav[aria-label="breadcrumb example"] a');
    const n = await links.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(links.nth(i)).toHaveAttribute('href', '#');
    }
  });

  test('list-group demo links are inert (href="#", no absolute 404 hazard)', async ({ page }) => {
    const group = page.locator('.list-group', { has: page.getByText('Blog Posts') });
    const links = group.locator('a.list-group-item');
    const n = await links.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(links.nth(i)).toHaveAttribute('href', '#');
    }
  });

  test('clicking a demo link does not navigate away', async ({ page }) => {
    await page
      .locator('nav[aria-label="breadcrumb example"] a', { hasText: 'Documentation' })
      .click();
    await expect(page).toHaveURL(/\/about\/settings\/components\/$/);
  });
});
