// =============================================================================
// cookie-consent-defaults.spec.js — no pre-ticked consent for a first visit
// =============================================================================
// Regression guard for issue #553 (filed by the lifehacker.dev theme-scout).
//
// `#analyticsCookies` carried a hard-coded `checked` attribute, and the
// DOMContentLoaded handler called `updateModalUI(consent)` only when a stored
// consent existed. A first-time visitor who opened Cookie Preferences from the
// banner's Customize button therefore saw **Analytics on**, and "Save
// Preferences" stored `analytics: true` and called `posthog.opt_in_capturing()`
// without the visitor ever touching the switch. Pre-ticked boxes are not valid
// consent (GDPR/ePrivacy Recital 32; CJEU Planet49, C-673/17), and the
// component's own `defaultConsent` says analytics/marketing are OFF.
//
// Two parts, matching analytics-consent.spec.js:
//   1. Source contract (always runs, no server): no non-essential consent
//      switch renders `checked`, and the modal is synced from the default on
//      every first paint.
//   2. Runtime (needs the dev/CI server): with localStorage cleared, the modal
//      shows Analytics off and Save Preferences stores `analytics: false`;
//      a returning visitor's saved choices still round-trip.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const ROOT = path.resolve(__dirname, '../../..');
const INCLUDE = '_includes/components/cookie-consent.html';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const STORAGE_KEY = 'zer0-cookie-consent';

test.describe('Cookie preferences default to off — source contract', () => {
  test('no non-essential consent switch is server-rendered checked', () => {
    const src = read(INCLUDE);
    // Every consent switch in the modal, with its attributes.
    const inputs = src.match(/<input[^>]*id="(?:analytics|marketing)Cookies"[^>]*>/g) || [];
    expect(inputs.length, 'analytics + marketing switches found').toBe(2);
    for (const tag of inputs) {
      expect(tag, 'non-essential switch must not be pre-ticked').not.toMatch(/\bchecked\b/);
    }
  });

  test('the modal is synced from the default state on a first visit too', () => {
    const src = read(INCLUDE);
    // The sync happens unconditionally, before the `if (existingConsent)` split,
    // so the markup's own default can never win (issue #553).
    const sync = src.indexOf('updateModalUI(existingConsent || defaultConsent);');
    expect(sync, 'unconditional sync is present').toBeGreaterThan(-1);
    const branch = src.indexOf('if (existingConsent) {', sync);
    expect(branch, 'returning-visitor branch follows the sync').toBeGreaterThan(sync);
    // defaultConsent is the off state the switches must mirror.
    expect(src).toMatch(/defaultConsent\s*=\s*\{[^}]*analytics:\s*false[^}]*marketing:\s*false/s);
  });
});

test.describe('Cookie preferences default to off — runtime', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
    const present = await page.locator('#cookieSettingsModal').count();
    test.skip(present === 0, 'Cookie consent disabled on this build');
  });

  test('a first-time visitor sees Analytics off and saving records false', async ({ page }) => {
    await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
    await page.reload({ waitUntil: 'load' });

    await expect(page.locator('#analyticsCookies')).not.toBeChecked();
    await expect(page.locator('#marketingCookies')).not.toBeChecked();

    // Save without touching anything, the way the issue was reported.
    await page.evaluate(() => document.getElementById('saveCookiePreferences').click());
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), STORAGE_KEY);
    expect(stored, 'consent was recorded').not.toBeNull();
    expect(stored.analytics, 'analytics consent the visitor never gave').toBe(false);
    expect(stored.marketing).toBe(false);
    expect(stored.essential).toBe(true);
  });

  test('a returning visitor still sees their saved choices', async ({ page }) => {
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({
      essential: true, analytics: true, marketing: false, timestamp: Date.now(), version: '1.0',
    })), STORAGE_KEY);
    await page.reload({ waitUntil: 'load' });

    await expect(page.locator('#analyticsCookies')).toBeChecked();
    await expect(page.locator('#marketingCookies')).not.toBeChecked();
  });
});
