/**
 * Security-sensitive rendering tests.
 * Validates that production builds do not expose secrets in DOM,
 * and raw config display is properly guarded.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('../fixtures');

const CONFIG_URL = '/about/config/';

test.describe('Security — secret exposure prevention', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, CONFIG_URL);
  });

  test('no hidden <pre> elements containing full config YAML (regression)', async ({ page }) => {
    // T-009: <pre id="cfg-full-yaml"> is sanitized before DOM injection —
    // a pure-Liquid line filter in pages/_about/settings/config.md (protects
    // GitHub Pages builds, where plugins don't run) plus the
    // sanitize_config_yaml filter (_plugins/sanitize_config_filter.rb) on
    // plugin-enabled builds.
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
    // T-018: the Raw-YAML tab renders the same sanitized capture as the
    // hidden copy element. The element is `code#cfg-raw-yaml` (the old
    // `pre#cfg-raw-yaml` locator silently skipped this test for months —
    // assert presence instead of skipping).
    const rawContent = page.locator('code#cfg-raw-yaml');
    await expect(rawContent, 'Raw-YAML tab element must exist').toHaveCount(1);

    // textContent is readable without activating the tab
    const text = await rawContent.textContent();
    const sensitivePatterns = [
      /api_key\s*:/i,
      /secret\s*:/i,
      /password\s*:/i,
      /token\s*:/i,
      /phc_[a-zA-Z0-9]{20,}/,
      /sk_[a-zA-Z0-9]{20,}/,
      /ghp_[a-zA-Z0-9]{20,}/,
    ];
    for (const pattern of sensitivePatterns) {
      expect(
        pattern.test(text),
        `Raw-YAML tab should not contain sensitive data matching ${pattern}`
      ).toBe(false);
    }
    // Sanity: the sanitized config actually rendered (not an empty element)
    expect(text).toMatch(/remote_theme|theme_skin/);
  });

  test('page source does not contain common secret patterns', async ({ page }) => {
    const html = await page.content();
    // GitHub personal access tokens
    expect(html).not.toMatch(/ghp_[a-zA-Z0-9]{36}/);
    // Common API key patterns (long random strings after key/secret/token)
    expect(html).not.toMatch(/["']sk_live_[a-zA-Z0-9]{24,}["']/);
  });
});
