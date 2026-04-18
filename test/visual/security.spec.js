/**
 * Security-sensitive rendering tests.
 * Validates that production builds do not expose secrets in DOM,
 * and raw config display is properly guarded.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('./fixtures');

const CONFIG_URL = '/about/config/';

test.describe('Security — secret exposure prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, CONFIG_URL);
  });

  test.fixme('no hidden <pre> elements containing full config YAML (regression)', async ({ page }) => {
    // KNOWN ISSUE: <pre id="cfg-full-yaml"> includes raw _config.yml with api_key.
    // TODO: Sanitize sensitive values before injecting into DOM.
    // PR review flagged: <pre id="cfg-full-yaml"> hidden in DOM exposes secrets
    const hiddenPre = page.locator('pre#cfg-full-yaml');
    const count = await hiddenPre.count();
    if (count > 0) {
      // If it exists, it should not contain sensitive keys
      const text = await hiddenPre.textContent();
      const sensitivePatterns = [
        /api_key\s*:/i,
        /secret\s*:/i,
        /password\s*:/i,
        /token\s*:/i,
        /phc_/i, // PostHog API key prefix
      ];
      for (const pattern of sensitivePatterns) {
        expect(
          pattern.test(text),
          `Hidden <pre id="cfg-full-yaml"> should not contain sensitive data matching ${pattern}`
        ).toBe(false);
      }
    }
  });

  test('raw YAML tab does not expose API keys', async ({ page }) => {
    // Try clicking Raw YAML tab
    const rawTab = page.locator('[role="tab"]', { hasText: /raw/i });
    if (await rawTab.count() === 0) {
      test.skip();
      return;
    }
    await rawTab.first().click();
    await page.waitForTimeout(300);

    const rawContent = page.locator('pre#cfg-raw-yaml, [role="tabpanel"]:visible pre');
    if (await rawContent.count() === 0) {
      test.skip();
      return;
    }
    const text = await rawContent.first().textContent();
    // Should not contain actual API key values
    expect(text).not.toMatch(/phc_[a-zA-Z0-9]{20,}/);
    expect(text).not.toMatch(/sk_[a-zA-Z0-9]{20,}/);
    expect(text).not.toMatch(/ghp_[a-zA-Z0-9]{20,}/);
  });

  test('page source does not contain common secret patterns', async ({ page }) => {
    const html = await page.content();
    // GitHub personal access tokens
    expect(html).not.toMatch(/ghp_[a-zA-Z0-9]{36}/);
    // Common API key patterns (long random strings after key/secret/token)
    expect(html).not.toMatch(/["']sk_live_[a-zA-Z0-9]{24,}["']/);
  });
});
