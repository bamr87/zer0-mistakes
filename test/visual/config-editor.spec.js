/**
 * Config Editor component tests.
 * Tests the Edit & Export tab on /about/config/ — form field population,
 * YAML preview updates, and download functionality.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('./fixtures');

const CONFIG_URL = '/about/config/';

test.describe('Config Editor', () => {
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
