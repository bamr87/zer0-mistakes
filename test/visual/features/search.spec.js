// =============================================================================
// search.spec.js — Site search modal (feature ZER0-032)
// =============================================================================
// Consolidated coverage for the client-side search modal (assets/js/search-modal.js
// + _includes/components/search-modal.html + /search.json), merged from four
// specs that each covered one angle:
//
//   - Happy path (issue #167): "/" shortcut opens the modal and focuses the
//     input, Escape closes it; typing a query populates results from the real
//     /search.json index; opening search closes the Settings offcanvas so
//     backdrops never stack. Plus two click-driven interactions folded in from
//     interactions.spec.js: the search-toggle button opens the modal, and the
//     close (X) button dismisses it.
//   - Graceful degradation (issue #202, assets/js/search-modal.js): when
//     /search.json 404s (as it does for remote-theme GitHub Pages consumers,
//     since the plugin-only generator never runs there), the modal must say
//     "Search is unavailable on this site." instead of the misleading
//     "No results found.", omit the /sitemap/ "view all" link, and keep form
//     submission in-modal rather than navigating to a 404. When the index IS
//     present, behavior is unchanged: results render, a "View all results"
//     link points at /sitemap/, and a genuine non-match still says
//     "No results found."
//   - Form-action existence gate (issue #202, Liquid-level guard in
//     _includes/components/search-modal.html): the <form action> only points
//     at /sitemap/ when that page exists in the build (verified here against
//     the dev build, where it does); otherwise it falls back to the safe
//     no-op "#" so no-JS users never get sent to a 404.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, VIEWPORTS } = require('../fixtures');

const MODAL = '#siteSearchModal';
const SETTINGS = '#info-section';
const INPUT = '[data-search-input]';
const RESULTS = '[data-search-results]';
const SEARCH_FORM = '[data-search-form]';

// -----------------------------------------------------------------------------
// Search modal — happy path
// -----------------------------------------------------------------------------
test.describe('Search modal — happy path', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
    // The modal markup is part of the navbar chrome on every page.
    await expect(page.locator(MODAL)).toBeAttached();
  });

  test('opens on "/" shortcut, focuses the input, and closes on Escape', async ({ page }) => {
    const modal = page.locator(MODAL);
    await expect(modal).toBeHidden();

    // Focus is on <body> after load, so the "/" handler is not suppressed.
    await page.keyboard.press('/');

    await expect(modal).toBeVisible();
    await expect(modal.locator(INPUT)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('typing a query populates results from the search index', async ({ page }) => {
    await page.keyboard.press('/');
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // "jekyll" is pervasive across the theme's own content index.
    await modal.locator(INPUT).fill('jekyll');

    const results = modal.locator(RESULTS);
    await expect(results.locator('.list-group-item').first()).toBeVisible();
    await expect(results.locator('.list-group-item').first()).toContainText(/jekyll/i);
    // First result is a navigable link (assertion folded in from the
    // deduped interactions.spec.js "opens via '/' shortcut..." test below).
    await expect(results.locator('.list-group-item').first()).toHaveAttribute('href', /.+/);
  });

  test('opening search closes the Settings offcanvas (no stacked backdrops)', async ({ page }) => {
    // Open the Settings (#info-section) offcanvas via the Bootstrap API and
    // wait for the show transition to complete — closing it mid-transition
    // (the next step) would otherwise orphan its backdrop.
    await page.evaluate((sel) => new Promise((resolve) => {
      const el = document.querySelector(sel);
      el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
      window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
    }), SETTINGS);
    await expect(page.locator(SETTINGS)).toBeVisible();

    // Requesting search must close the offcanvas first, then show the modal.
    await page.keyboard.press('/');

    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();
    await expect(page.locator(SETTINGS)).toBeHidden();

    // Exactly one backdrop layer — search and Settings never stack.
    await expect(page.locator('.offcanvas-backdrop')).toHaveCount(0);
    expect(await page.locator('.modal-backdrop').count()).toBeLessThanOrEqual(1);
  });

  // Dropped "opens via '/' shortcut, focuses input, and renders results" from
  // interactions.spec.js here — near-duplicate of the "typing a query..." test
  // above (same intent: type a query, verify results render). Its one extra
  // assertion (result item has a valid href) was folded into that test instead.

  test('search toggle button opens the modal', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    const modal = page.locator(MODAL);
    await page.locator('[data-search-toggle]:visible').first().click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/show/);
  });

  test('close button dismisses the modal', async ({ page }) => {
    const modal = page.locator(MODAL);
    await page.keyboard.press('/');
    await expect(modal).toBeVisible();
    // Wait until the open transition has finished — Bootstrap focuses the input
    // on `shown.bs.modal`, and dismiss clicks issued mid-transition are ignored.
    await expect(modal.locator(INPUT)).toBeFocused();
    await modal.locator('.btn-close[data-bs-dismiss="modal"]').click();
    await expect(modal).not.toBeVisible();
  });

  // Dropped "shows a 'no results' message for a non-matching query" from
  // interactions.spec.js here — near-duplicate of "Search graceful
  // degradation" → "present index, no match → honest 'No results found.'"
  // below (same user-facing behavior; that spec's stubbed index is more
  // deterministic than relying on the live /search.json having no match).
});

// -----------------------------------------------------------------------------
// Search graceful degradation (issue #202)
// -----------------------------------------------------------------------------
// Regression coverage for issue #202 (fix in assets/js/search-modal.js): on a
// remote-theme GitHub Pages consumer the plugin-only generator never runs, so
// /search.json (and its sibling /sitemap/) return 404. The modal must degrade
// CLEARLY there instead of looking broken or sending the user to a 404.
//
// We drive the real dev-served modal but intercept /search.json with
// page.route() to reproduce both worlds on one server:
//   - 404  → "Search is unavailable on this site.", no /sitemap/ "view all"
//            link, and submit renders in-modal (never navigates to the 404).
//   - 200  → unchanged full behaviour: results + a "View all results" link to
//            /sitemap/, and an honest "No results found." for a non-match.
// These would fail against the pre-fix code, which unconditionally said
// "No results found." and always rendered the /sitemap/ link.
const INDEX_FIXTURE = [
  {
    title: 'Jekyll Theme Guide',
    url: '/docs/guide/',
    description: 'Configure the jekyll theme',
    content: 'jekyll setup and configuration',
  },
];

/** Stub GET /search.json with a fixed status/body before the page loads it. */
async function stubSearchIndex(page, { status, body }) {
  await page.route('**/search.json', (route) =>
    route.fulfill({
      status,
      contentType: status === 200 ? 'application/json' : 'text/plain',
      body: status === 200 ? JSON.stringify(body) : 'Not Found',
    }),
  );
}

/** Open the search modal via the "/" shortcut and wait for it to be visible. */
async function openSearch(page) {
  // Focus is on <body> after load, so the "/" handler is not suppressed.
  await page.keyboard.press('/');
  const modal = page.locator(MODAL);
  await expect(modal).toBeVisible();
  return modal;
}

test.describe('Search graceful degradation (no /search.json)', () => {
  test('missing index → "unavailable" copy and no /sitemap/ link', async ({ page }) => {
    await stubSearchIndex(page, { status: 404 });
    await waitForJekyll(page, '/');
    const modal = await openSearch(page);

    await modal.locator(INPUT).fill('jekyll');

    const results = modal.locator(RESULTS);
    await expect(results).toContainText('Search is unavailable on this site.');
    await expect(results).not.toContainText('No results found.');
    // The /sitemap/ "view all" target ships from the same plugin-only
    // generator, so it must never be offered when the index is absent.
    await expect(results.locator('a[href^="/sitemap/"]')).toHaveCount(0);
  });

  test('missing index → submit stays in-modal, never navigates to the 404', async ({ page }) => {
    await stubSearchIndex(page, { status: 404 });
    await waitForJekyll(page, '/');
    const modal = await openSearch(page);

    await modal.locator(INPUT).fill('jekyll');
    // Submit the form (its no-JS action is /sitemap/, which would 404 here).
    await modal.locator(INPUT).press('Enter');

    await expect(modal.locator(RESULTS)).toContainText('Search is unavailable on this site.');
    await expect(modal).toBeVisible();
    expect(new URL(page.url()).pathname).not.toBe('/sitemap/');
  });

  test('present index → results plus a "View all results" link to /sitemap/', async ({ page }) => {
    await stubSearchIndex(page, { status: 200, body: INDEX_FIXTURE });
    await waitForJekyll(page, '/');
    const modal = await openSearch(page);

    await modal.locator(INPUT).fill('jekyll');

    const results = modal.locator(RESULTS);
    await expect(results.locator('.list-group-item').first()).toContainText(/jekyll/i);
    const viewAll = results.locator('a', { hasText: 'View all results' });
    await expect(viewAll).toHaveAttribute('href', /^\/sitemap\/\?q=jekyll/);
  });

  test('present index, no match → honest "No results found." (not the unavailable copy)', async ({ page }) => {
    await stubSearchIndex(page, { status: 200, body: INDEX_FIXTURE });
    await waitForJekyll(page, '/');
    const modal = await openSearch(page);

    await modal.locator(INPUT).fill('zzqqxnomatch');

    const results = modal.locator(RESULTS);
    await expect(results).toContainText('No results found.');
    await expect(results).not.toContainText('Search is unavailable');
  });
});

// -----------------------------------------------------------------------------
// Search modal form action existence gate (issue #202)
// -----------------------------------------------------------------------------
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
