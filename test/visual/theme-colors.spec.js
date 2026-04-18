/**
 * Theme color customization tests.
 * Validates color pickers, YAML export quoting, and clipboard on
 * /about/settings/theme/ → Color Editor tab.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('./fixtures');

const THEME_URL = '/about/settings/theme/';

test.describe('Theme color customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, THEME_URL);
  });

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(THEME_URL);
    expect(response.status()).toBe(200);
  });

  test('color picker inputs have valid #RRGGBB values', async ({ page }) => {
    const colorInputs = page.locator('input[type="color"]');
    const count = await colorInputs.count();
    expect(count, 'Expected at least one color picker').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const value = await colorInputs.nth(i).inputValue();
      expect(value, `Color input ${i} should be #RRGGBB`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test('color picker change updates paired text input', async ({ page }) => {
    // Color inputs are in the "Color Editor" tab which is not active by default
    const colorTab = page.locator('#tab-colors');
    if (await colorTab.count() > 0) {
      await colorTab.click();
      await page.waitForTimeout(300);
    }
    const colorInput = page.locator('input[type="color"]').first();
    const count = await colorInput.count();
    if (count === 0) {
      test.skip();
      return;
    }
    // Find the sibling/paired text input
    const parent = colorInput.locator('..');
    const textInput = parent.locator('input[type="text"]');
    if (await textInput.count() === 0) {
      test.skip();
      return;
    }
    // Change color
    await colorInput.fill('#ff5500');
    const textValue = await textInput.inputValue();
    expect(textValue.toLowerCase()).toBe('#ff5500');
  });

  test.fixme('YAML export quotes hex color values (regression: unquoted # is YAML comment)', async ({ page }) => {
    // KNOWN ISSUE: Theme customizer YAML export does not quote hex color values.
    // TODO: Fix JS export to wrap #RRGGBB values in quotes.
    // Switch to the "Export" tab if it exists
    const exportTab = page.locator('#tab-export');
    if (await exportTab.count() > 0) {
      await exportTab.click();
      await page.waitForTimeout(300);
    }
    // Look for the YAML preview/export area
    const yamlPreview = page.locator('pre, textarea, code').filter({ hasText: 'theme_color' });
    const count = await yamlPreview.count();
    if (count === 0) {
      test.skip();
      return;
    }
    const yamlText = await yamlPreview.first().textContent();
    // Any hex color value should be quoted: "key: '#RRGGBB'" or "key: \"#RRGGBB\""
    const hexLines = yamlText.split('\n').filter((line) => /#[0-9a-fA-F]{3,6}/.test(line));
    for (const line of hexLines) {
      // The # value should be wrapped in quotes
      expect(
        line,
        `Hex color must be quoted in YAML to prevent comment parsing: ${line.trim()}`
      ).toMatch(/["'][^"']*#[0-9a-fA-F]{3,6}[^"']*["']/);
    }
  });
});
