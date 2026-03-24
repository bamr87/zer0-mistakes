import { test, expect } from '@playwright/test';

test.describe('Analytics & Cookie Consent', () => {
  test.beforeEach(async ({ page }) => {
    // Clear consent state before each test
    await page.addInitScript(() => {
      localStorage.removeItem('zer0-cookie-consent');
    });
  });

  test('cookie consent banner appears for new visitors', async ({ page }) => {
    await page.goto('/');
    // Banner should appear after a delay
    const banner = page.locator('#cookieConsent');
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test('consent banner has Accept, Reject, and Manage buttons', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('#cookieConsent');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await expect(page.locator('#acceptAllCookies')).toBeVisible();
    await expect(page.locator('#rejectAllCookies')).toBeVisible();
    await expect(banner.locator('[data-bs-target="#cookieSettingsModal"]')).toBeVisible();
  });

  test('accept all hides banner and stores consent', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cookieConsent').waitFor({ state: 'visible', timeout: 5000 });

    await page.locator('#acceptAllCookies').click();
    await expect(page.locator('#cookieConsent.cookie-banner-showing')).toBeHidden({ timeout: 3000 });

    const consent = await page.evaluate(() => {
      const data = localStorage.getItem('zer0-cookie-consent');
      return data ? JSON.parse(data) : null;
    });
    expect(consent).toBeTruthy();
    expect(consent.analytics).toBe(true);
  });

  test('reject all hides banner and stores minimal consent', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cookieConsent').waitFor({ state: 'visible', timeout: 5000 });

    await page.locator('#rejectAllCookies').click();
    await expect(page.locator('#cookieConsent.cookie-banner-showing')).toBeHidden({ timeout: 3000 });

    const consent = await page.evaluate(() => {
      const data = localStorage.getItem('zer0-cookie-consent');
      return data ? JSON.parse(data) : null;
    });
    expect(consent).toBeTruthy();
    expect(consent.analytics).toBe(false);
  });

  test('manage cookies opens settings modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cookieConsent').waitFor({ state: 'visible', timeout: 5000 });

    await page.locator('#cookieConsent [data-bs-target="#cookieSettingsModal"]').click();
    const modal = page.locator('#cookieSettingsModal');
    await expect(modal).toBeVisible({ timeout: 2000 });
  });

  test('banner does not reappear after consent is given', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cookieConsent').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('#acceptAllCookies').click();
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // Banner should not be visible
    await expect(page.locator('#cookieConsent.cookie-banner-visible')).toBeHidden();
  });

  test('PostHog script is not loaded without consent', async ({ page }) => {
    await page.goto('/');
    const hasPosthog = await page.evaluate(() => {
      return typeof (window as any).posthog !== 'undefined';
    });
    // In development environment, PostHog should not load at all
    expect(hasPosthog).toBe(false);
  });

  test('cookieManager global API is available', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const hasApi = await page.evaluate(() => {
      return typeof (window as any).cookieManager !== 'undefined';
    });
    expect(hasApi).toBe(true);
  });
});
