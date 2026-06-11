/**
 * Environment dashboard tests.
 * Validates /about/settings/environment/ — overview cards,
 * version strings, plugin list, and data completeness.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('./fixtures');

const ENV_URL = '/about/settings/environment/';

test.describe('Environment dashboard', () => {
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
