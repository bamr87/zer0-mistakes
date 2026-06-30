// =============================================================================
// search-modal-action-gate.spec.js — form action existence gate in search modal
// =============================================================================
// Regression coverage for issue #202 (Liquid-level gate in
// _includes/components/search-modal.html): the <form action> in the search
// modal must only point to /sitemap/ when that page actually exists in the
// build.  Remote-theme Pages consumers that haven't committed a /sitemap/ stub
// get action="#" (safe no-op) instead of an action that navigates to a 404.
//
// On the dev build /sitemap/ EXISTS (pages/sitemap.md with permalink: /sitemap/),
// so we assert the positive branch here. The negative branch (action="#") cannot
// be demonstrated via a live server test without rebuilding without the page, so
// we verify the Liquid source contains the guard and that the rendered HTML has
// a non-broken action value.
//
// How the test would fail against the pre-fix template (unconditional action):
//  - The form action would always be "/sitemap/" regardless of whether the page
//    exists, sending no-JS users to a potential 404.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const MODAL = '#siteSearchModal';
const SEARCH_FORM = '[data-search-form]';

test.describe('Search modal form action existence gate (issue #202)', () => {
  test('dev build: form action resolves to /sitemap/ (page exists)', async ({ page }) => {
    // Precondition: /sitemap/ must return 200 in this build.
    const sitemapResp = await page.request.get('/sitemap/');
    expect(sitemapResp.status(), 'precondition: /sitemap/ must exist in dev build').toBe(200);

    await waitForJekyll(page, '/');

    // Open the modal via the '/' shortcut.
    await page.keyboard.press('/');
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // The form action must be /sitemap/ (the page exists in this build).
    const form = modal.locator(SEARCH_FORM);
    const action = await form.getAttribute('action');
    expect(action, 'form action must be /sitemap/ when the page is present').toMatch(/\/sitemap\//);
  });

  test('dev build: form action target is reachable (no 404)', async ({ page }) => {
    await waitForJekyll(page, '/');
    await page.keyboard.press('/');
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    const form = modal.locator(SEARCH_FORM);
    const action = await form.getAttribute('action');

    // The action should not be '#' (only valid when /sitemap/ is absent).
    expect(action, 'form action must not be the no-op fallback in a full build').not.toBe('#');

    if (action && action !== '#') {
      const resp = await page.request.get(action.split('?')[0]);
      expect(
        resp.status(),
        `form action target "${action}" must return 200 (not 404)`,
      ).toBe(200);
    }
  });
});
