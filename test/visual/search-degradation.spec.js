// =============================================================================
// search-degradation.spec.js — Search degrades gracefully without /search.json
// =============================================================================
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
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const MODAL = '#siteSearchModal';
const INPUT = '[data-search-input]';
const RESULTS = '[data-search-results]';

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
