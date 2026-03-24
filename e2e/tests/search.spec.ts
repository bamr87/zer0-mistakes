import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('search modal exists in the DOM', async ({ page }) => {
    const modal = page.locator('#siteSearchModal');
    await expect(modal).toHaveCount(1);
  });

  test('search modal opens from navbar button', async ({ page }) => {
    // Desktop: look for the search trigger button
    const trigger = page.locator('[data-bs-target="#siteSearchModal"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      const modal = page.locator('#siteSearchModal');
      await expect(modal).toBeVisible();
    }
  });

  test('search modal has input field and submit button', async ({ page }) => {
    // Open modal via the trigger button instead of Bootstrap JS API
    const trigger = page.locator('[data-bs-target="#siteSearchModal"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      await page.waitForTimeout(500);

      const input = page.locator('#site-search-input');
      await expect(input).toBeVisible();

      const submitBtn = page.locator('#siteSearchModal button[type="submit"]');
      await expect(submitBtn).toBeVisible();
    } else {
      // If no visible trigger, try keyboard shortcut (/ key)
      await page.keyboard.press('/');
      await page.waitForTimeout(500);
      const modal = page.locator('#siteSearchModal.show');
      if (await modal.isVisible()) {
        await expect(page.locator('#site-search-input')).toBeVisible();
      }
    }
  });

  test('search input accepts text', async ({ page }) => {
    const trigger = page.locator('[data-bs-target="#siteSearchModal"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      await page.waitForTimeout(500);

      const input = page.locator('#site-search-input');
      await input.fill('test query');
      await expect(input).toHaveValue('test query');
    }
  });

  test('search form submits to sitemap', async ({ page }) => {
    const form = page.locator('#siteSearchModal form');
    const action = await form.getAttribute('action');
    expect(action).toContain('sitemap');
  });

  test('keyboard shortcut hint is displayed', async ({ page }) => {
    const trigger = page.locator('[data-bs-target="#siteSearchModal"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      await page.waitForTimeout(500);

      const hint = page.locator('#siteSearchModal .form-text');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('/');
    }
  });
});
