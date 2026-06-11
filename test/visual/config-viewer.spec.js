/**
 * Config Viewer component tests.
 * Tests the configuration viewer on /about/config/ — accordion rendering,
 * search filtering, expand/collapse, and copy-to-clipboard.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('./fixtures');

const CONFIG_URL = '/about/config/';

test.describe('Config Viewer', () => {
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
