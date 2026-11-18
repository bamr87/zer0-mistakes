// =============================================================================
// cookie-consent-gate.spec.js — no consent banner on a site with no tracker
// =============================================================================
// Regression guard for #566: every page of a site that configures no
// analytics still rendered the "We use cookies…" banner, its Manage modal and
// the footer "Cookie Preferences" button — asking consent for cookies the
// site never sets.
//
// The banner (_layouts/root.html) and the footer button
// (_includes/core/footer.html) now render only when
// _includes/components/cookie-consent-needed.html outputs "true": a
// non-blank google_analytics / google_tag_manager, posthog.enabled, or the
// cookie_consent.enabled override (true forces on, false forces off).
//
// Two parts:
//   1. Source contract (always runs): the gate exists, checks every tracker
//      key and the override, and both render sites go through it. Fails on a
//      tree without the gate.
//   2. Runtime (dev server): banner, modal and footer button share one gate,
//      so a page has all three or none. The theme's dev site inherits
//      google_tag_manager, so it renders all three; the no-tracker build is
//      covered end-to-end by test/test_cookie_consent_gate.rb, which builds
//      throwaway sites for every configuration.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const ROOT = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const GATE = '_includes/components/cookie-consent-needed.html';

test.describe('Cookie consent gate — source contract', () => {
  test('the gate checks every tracker key and the override', () => {
    expect(fs.existsSync(path.join(ROOT, GATE)), GATE).toBe(true);
    const src = read(GATE);
    expect(src).toContain('site.google_analytics != ""');
    expect(src).toContain('site.google_tag_manager != ""');
    expect(src).toContain('site.posthog.enabled == true');
    expect(src).toMatch(/site\.cookie_consent\.enabled == true -%\}\{%- assign _consent = true/);
    expect(src).toMatch(/site\.cookie_consent\.enabled == false -%\}\{%- assign _consent = false/);
  });

  test('the banner and the footer button both render through the gate', () => {
    for (const [file, guarded] of [
      ['_layouts/root.html', 'include_cached components/cookie-consent.html'],
      ['_includes/core/footer.html', 'data-bs-target="#cookieSettingsModal"'],
    ]) {
      const src = read(file);
      const capture = src.indexOf('include components/cookie-consent-needed.html');
      const gate = src.indexOf('_needs_consent == "true"', capture);
      const target = src.indexOf(guarded);
      expect(capture, `${file} captures the gate`).toBeGreaterThan(-1);
      expect(gate, `${file} tests the gate`).toBeGreaterThan(capture);
      expect(target, `${file} renders ${guarded} after the gate`).toBeGreaterThan(gate);
    }
  });
});

test.describe('Cookie consent gate — runtime', () => {
  test('banner, modal and footer button render together or not at all', async ({ page }) => {
    await page.goto('/');
    await waitForJekyll(page);
    const counts = await page.evaluate(() => ({
      banner: document.querySelectorAll('#cookieConsent').length,
      modal: document.querySelectorAll('#cookieSettingsModal').length,
      button: document.querySelectorAll('footer [data-bs-target="#cookieSettingsModal"]').length,
    }));
    const present = [counts.banner > 0, counts.modal > 0, counts.button > 0];
    expect(new Set(present).size, JSON.stringify(counts)).toBe(1);
  });
});
