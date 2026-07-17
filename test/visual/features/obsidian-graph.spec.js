// =============================================================================
// obsidian-graph.spec.js — full-graph page wiki-index URL resolution (#294)
// =============================================================================
// Page: /docs/obsidian/graph/ (pages/_docs/obsidian/graph.md +
// _includes/obsidian/full-graph.html), renderer: assets/js/obsidian-graph.js.
//
// Bug pinned here: the graph resolved its index URL only from the legacy
// `window.OBSIDIAN_WIKI_INDEX_URL` global (which nothing in the theme sets),
// so it always fell back to a <base>-relative `assets/data/wiki-index.json`.
// That fallback drops the baseurl prefix on project sites (GitHub Pages at
// /reponame/) and 404s the fetch — the graph page rendered a "Failed to load
// graph data" alert instead of the graph. The fix makes the renderer read
// `window.OBSIDIAN_CONFIG.wikiIndexUrl`, the baseurl-aware value
// _includes/components/js-cdn.html actually emits (same chain as
// obsidian-wiki-links.js).
//
// The dev server serves at baseurl "" where the old fallback coincidentally
// produced the same URL, so the second test rewrites the emitted config to a
// sentinel URL: code that ignores OBSIDIAN_CONFIG.wikiIndexUrl (the pre-fix
// behaviour) requests the fallback path instead of the sentinel and fails
// here even without a baseurl.
//
// Before/after evidence (project-site baseurl build):
//   test/visual/evidence/obsidian-graph-index/ +
//   test/visual/obsidian-graph-index-evidence.mjs
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const GRAPH_PAGE = '/docs/obsidian/graph/';
const CONTAINER = '#obsidian-graph';
const STATS = '#obsidian-graph-stats';

/** Collect every wiki-index request pathname the page makes. */
function trackIndexRequests(page) {
  const paths = [];
  page.on('request', (req) => {
    if (req.url().includes('wiki-index')) paths.push(new URL(req.url()).pathname);
  });
  return paths;
}

test.describe('Obsidian graph — wiki-index URL resolution (#294)', () => {
  test('fetches the index from the emitted OBSIDIAN_CONFIG.wikiIndexUrl and renders', async ({ page }) => {
    const requested = trackIndexRequests(page);
    await waitForJekyll(page, GRAPH_PAGE);

    // js-cdn.html emits the baseurl-aware index URL during parse (inline,
    // before the deferred renderer runs) — the contract the fix relies on.
    const configUrl = await page.evaluate(() => (window.OBSIDIAN_CONFIG || {}).wikiIndexUrl);
    expect(configUrl).toBeTruthy();

    // The graph rendered from it: stats badges appear, no failure alert.
    await expect(page.locator(`${STATS} .badge`).first()).toBeVisible();
    await expect(page.locator(`${CONTAINER} .alert-danger`)).toHaveCount(0);
    await expect(page.locator(STATS)).toContainText(/[1-9]\d* pages/);
    await expect.poll(() => page.evaluate(() => !!window.ObsidianGraph)).toBe(true);

    // And the fetch target was exactly the emitted config value.
    expect(requested).toContain(new URL(configUrl, page.url()).pathname);
  });

  test('reads OBSIDIAN_CONFIG.wikiIndexUrl in priority over the <base>-relative fallback', async ({ page }) => {
    // Simulate a project-site deployment on the dev server: the emitted config
    // points at a sentinel URL (serving the real index) while the pre-fix
    // <base>-relative fallback path 404s — exactly the split a non-empty
    // baseurl produces. Pre-#294-fix code ignored OBSIDIAN_CONFIG, fetched the
    // fallback, got the 404, and rendered a failure alert — failing this test
    // even on the baseurl-less dev build, where both URLs otherwise coincide.
    const SENTINEL = '/assets/data/wiki-index.sentinel.json';
    const index = await (await page.request.get('/assets/data/wiki-index.json')).text();
    await page.route('**/wiki-index.sentinel.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: index }),
    );
    await page.route('**/assets/data/wiki-index.json', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' }),
    );
    await page.route(`**${GRAPH_PAGE}`, async (route) => {
      const resp = await route.fetch();
      const html = (await resp.text()).replace(
        /window\.OBSIDIAN_CONFIG\.wikiIndexUrl = "[^"]+";/,
        `window.OBSIDIAN_CONFIG.wikiIndexUrl = ${JSON.stringify(SENTINEL)};`,
      );
      await route.fulfill({ response: resp, body: html });
    });

    const requested = trackIndexRequests(page);
    await waitForJekyll(page, GRAPH_PAGE);

    // The full graph renders from the sentinel index — no failure alert.
    await expect(page.locator(`${STATS} .badge`).first()).toBeVisible();
    await expect(page.locator(STATS)).toContainText(/[1-9]\d* pages/);
    await expect(page.locator(`${CONTAINER} .alert-danger`)).toHaveCount(0);
    expect(requested).toContain(SENTINEL);
  });
});
