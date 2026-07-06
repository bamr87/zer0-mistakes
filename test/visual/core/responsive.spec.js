/**
 * Cross-viewport smoke: homepage axe advisory scan and key-landmark visibility.
 *
 * Moved out of the dissolved ui-refresh.spec.js: the per-viewport axe scan
 * that lived in the catch-all "Accessibility — visibility and focus smoke"
 * describe, and the "Responsive visibility — key landmarks" describe block.
 * Both loop over the same VIEWPORTS set against the homepage.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { VIEWPORTS, UI_ROUTES, waitForJekyll } = require('../fixtures');

/** Format axe violations for readable error output. */
function formatViolations(violations) {
  if (!violations.length) return 'None';
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.html.substring(0, 100)}`).join('\n');
      return `[${v.impact}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}

test.describe('Responsive accessibility — axe advisory scan', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`axe advisory scan on homepage at ${name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await waitForJekyll(page, UI_ROUTES.home);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();

      expect(
        results.violations.length,
        `High axe violation count at ${name}:\n${formatViolations(results.violations)}`
      ).toBeLessThan(20);
    });
  }
});

test.describe('Responsive visibility — key landmarks', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`main landmarks visible at ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await waitForJekyll(page, UI_ROUTES.home);

      await expect(page.locator('header#navbar')).toBeVisible();
      await expect(page.locator('#main-content, main').first()).toBeVisible();
      await expect(page.locator('footer.bd-footer')).toBeVisible();
    });
  }
});
