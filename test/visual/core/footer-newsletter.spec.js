/**
 * Footer newsletter signup — rendered only when it can work (#554).
 *
 * _includes/core/footer.html used to render a newsletter form on every page of
 * every site: a disabled email input, a disabled "Subscribe" button whose
 * tooltip was a setup instruction ("Configure a newsletter endpoint in your
 * site config"), and a "placeholder until you connect a provider" caption. No
 * config key enabled it or hid it.
 *
 * The form now renders only when a provider endpoint is configured — the
 * top-level `newsletter:` block, falling back to `news.newsletter:` — and then
 * as a working form that submits the address to the provider. The theme's own
 * site configures no provider, so this spec pins the default state on the
 * served site. The configured, fallback, opt-out and blank-endpoint builds are
 * covered by test/test_newsletter_gate.rb, which builds a throwaway site for
 * each (run by test_core.sh).
 *
 * This replaces the #522 hint checks that lived in accessibility.spec.js. The
 * hint explained why the input was disabled; no disabled input ships any more.
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const FOOTER_SRC = fs.readFileSync(
  path.resolve(__dirname, '../../../_includes/core/footer.html'),
  'utf8',
);

test.describe('Footer newsletter — source contract', () => {
  test('no placeholder form, setup tooltip or caption remains in the include', () => {
    expect(FOOTER_SRC).not.toContain('onsubmit="return false');
    expect(FOOTER_SRC).not.toContain('Configure a newsletter endpoint');
    expect(FOOTER_SRC).not.toContain('placeholder until you connect');
  });

  test('the form renders only behind the endpoint gate', () => {
    const resolve = FOOTER_SRC.indexOf('site.newsletter | default: site.news.newsletter');
    const gate = FOOTER_SRC.indexOf('{% if _footer_nl_on %}');
    const form = FOOTER_SRC.indexOf('footer-subscribe-form');
    expect(resolve, 'reads newsletter, falling back to news.newsletter').toBeGreaterThan(-1);
    expect(gate, 'tests the gate after resolving it').toBeGreaterThan(resolve);
    expect(form, 'renders the form inside the gate').toBeGreaterThan(gate);
  });
});

test.describe('Footer newsletter — no provider configured', { tag: '@critical' }, () => {
  for (const route of ['/', '/about/']) {
    test(`no newsletter form or placeholder text on ${route}`, async ({ page }) => {
      await waitForJekyll(page, route);
      const footer = page.locator('footer.bd-footer');
      await expect(footer).toHaveCount(1);
      await expect(footer.locator('.footer-subscribe-form')).toHaveCount(0);
      await expect(footer.locator('#footer-email')).toHaveCount(0);
      // Nothing in the footer is shipped disabled with a setup note.
      await expect(footer.locator('input:disabled, button:disabled')).toHaveCount(0);
      await expect(footer.locator('[title*="newsletter" i]')).toHaveCount(0);
      await expect(footer).not.toContainText('placeholder until you connect');
    });
  }

  test('the policy links take the whole row, centred', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForJekyll(page, '/');
    const policy = page.locator('footer.bd-footer .footer-policy-links');
    await expect(policy).toHaveCount(1);
    await expect(policy).toHaveClass(/(^|\s)col-12(\s|$)/);
    await expect(policy).not.toHaveClass(/col-md-4/);
    await expect(policy).toHaveCSS('text-align', 'center');
  });
});
