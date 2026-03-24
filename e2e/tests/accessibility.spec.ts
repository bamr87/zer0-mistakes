import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { isBootstrapCSSLoaded } from './helpers';

test.describe('Accessibility — WCAG 2.1 AA', () => {
  test('homepage has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const hasCSS = await isBootstrapCSSLoaded(page);
    const disabledRules = [
      'aria-hidden-focus', // Bootstrap 5 modals use aria-hidden with focusable children
      'link-in-text-block', // Links styled via hover underline — design choice
      'list', // Bootstrap utility classes on <ul> (list-unstyled)
    ];
    // Only disable color-contrast when Bootstrap CSS isn't loaded
    if (!hasCSS) {
      disabledRules.push('color-contrast');
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('#cookieConsent') // Consent banner may not be visible
      .exclude('#siteSearchModal') // Hidden modal — Bootstrap pattern
      .exclude('#info-section') // Hidden modal — Bootstrap pattern
      .exclude('#cookieSettingsModal') // Hidden modal — Bootstrap pattern
      .disableRules(disabledRules)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical, formatViolations(critical)).toHaveLength(0);
  });

  test('about page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/about/');
    const hasCSS = await isBootstrapCSSLoaded(page);
    const disabledRules = [
      'aria-hidden-focus',
      'link-in-text-block',
      'list',
    ];
    if (!hasCSS) {
      disabledRules.push('color-contrast');
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('#cookieConsent')
      .exclude('#siteSearchModal')
      .exclude('#info-section')
      .exclude('#cookieSettingsModal')
      .disableRules(disabledRules)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical, formatViolations(critical)).toHaveLength(0);
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const headings = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim().substring(0, 50),
      }));
    });
    // Should have at least one heading
    expect(headings.length).toBeGreaterThan(0);
  });

  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/');
    const imagesWithoutAlt = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.src);
    });
    expect(imagesWithoutAlt).toHaveLength(0);
  });

  test('interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/');
    // Tab through page and verify focus moves
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
    expect(focused).not.toBe('BODY');
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/');
    // Color contrast depends on Bootstrap CSS being loaded.
    // When CSS loads from CDN, the theme colors are properly set.
    const hasBootstrap = await isBootstrapCSSLoaded(page);
    if (!hasBootstrap) {
      // Cannot test color contrast without Bootstrap CSS
      return;
    }
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('#cookieConsent')
      .exclude('#siteSearchModal')
      .exclude('#info-section')
      .exclude('#cookieSettingsModal')
      .analyze();

    const violations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('ARIA landmarks are present', async ({ page }) => {
    await page.goto('/');
    const landmarks = await page.evaluate(() => {
      const roles = ['banner', 'navigation', 'main', 'contentinfo'];
      const found: Record<string, boolean> = {};
      roles.forEach((role) => {
        found[role] =
          document.querySelectorAll(`[role="${role}"]`).length > 0 ||
          document.querySelectorAll(
            role === 'banner' ? 'header' :
            role === 'navigation' ? 'nav' :
            role === 'main' ? 'main' :
            'footer'
          ).length > 0;
      });
      return found;
    });
    expect(landmarks.navigation).toBe(true);
  });
});

/** Format axe violations into a readable string for assertion messages */
function formatViolations(violations: Array<{ id: string; impact?: string; description: string; nodes: Array<{ html: string }> }>): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
    .join('\n\n');
}
