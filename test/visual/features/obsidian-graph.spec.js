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

// =============================================================================
// Graph controls revamp — Obsidian-style Filters / Display / Forces panel
// =============================================================================
// The full-graph page ships a floating "Graph settings" card
// (_includes/obsidian/full-graph.html) whose controls drive the renderer via
// the public window.ObsidianGraph hook: per-collection toggles double as the
// legend, orphans are hidden by default, the Display sliders rescale nodes
// live, and everything persists to localStorage (zer0.obsidianGraph.v1).
// A zoom/fit/fullscreen button stack overlays the canvas.
// =============================================================================

test.describe('Obsidian graph — controls revamp', () => {
  /** Wait for the renderer to expose its public hook with a live instance. */
  async function waitForGraph(page) {
    await waitForJekyll(page, GRAPH_PAGE);
    await expect.poll(
      () => page.evaluate(() => !!(window.ObsidianGraph && window.ObsidianGraph.cy)),
      { timeout: 30000 },
    ).toBe(true);
  }

  test('renders the settings panel, zoom bar and generated collection filters', async ({ page }) => {
    await waitForGraph(page);

    // Floating controls card with the three accordion sections.
    await expect(page.locator('#obsidian-graph-controls .obsidian-graph-controls-toggle')).toBeVisible();
    for (const section of ['#obsidianGraphFilters', '#obsidianGraphDisplay', '#obsidianGraphForces']) {
      await expect(page.locator(section)).toHaveCount(1);
    }

    // Collection filters are generated from the index, with a count badge each.
    const filters = page.locator('#obsidian-graph-collections .obsidian-graph-collection-filter');
    expect(await filters.count()).toBeGreaterThan(1);
    await expect(filters.first().locator('.badge')).toHaveText(/^\d+$/);

    // Zoom / fit / fullscreen stack overlays the canvas.
    for (const id of ['#obsidian-graph-zoom-in', '#obsidian-graph-zoom-out', '#obsidian-graph-fit', '#obsidian-graph-fullscreen']) {
      await expect(page.locator(id)).toBeVisible();
    }
  });

  test('collection toggles filter nodes and persist to localStorage', async ({ page }) => {
    await waitForGraph(page);
    // Open the panel (Filters section is expanded by default inside it).
    await page.locator('#obsidian-graph-controls .obsidian-graph-controls-toggle').click();

    const visibleCount = () => page.evaluate(
      () => window.ObsidianGraph.cy.nodes().not('.obsidian-hidden').length,
    );
    const before = await visibleCount();
    expect(before).toBeGreaterThan(0);

    // Turn off the largest collection — the visible node count must drop.
    const first = page.locator('#obsidian-graph-collections input').first();
    await first.click();
    await expect.poll(visibleCount).toBeLessThan(before);

    // The choice is persisted for the next visit (the save is debounced, so poll).
    await expect.poll(() => page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('zer0.obsidianGraph.v1') || 'null');
      return saved ? Object.values(saved.collections) : [];
    })).toContain(false);

    // And Reset restores the stock view + defaults.
    await page.locator('#obsidian-graph-reset').click();
    await expect.poll(visibleCount).toBe(before);
  });

  test('orphans are hidden by default and the node-size slider rescales live', async ({ page }) => {
    await waitForGraph(page);

    // Default matches Obsidian: "Show orphans" off ⇒ degree-0 nodes hidden.
    const hiddenOrphans = await page.evaluate(() =>
      window.ObsidianGraph.cy.nodes()
        .filter((n) => (n.data('degree') || 0) === 0)
        .every((n) => n.hasClass('obsidian-hidden')));
    expect(hiddenOrphans).toBe(true);

    // Display slider: raising the multiplier grows rendered node width.
    await page.locator('#obsidian-graph-controls .obsidian-graph-controls-toggle').click();
    const widthOfBusiest = () => page.evaluate(() => {
      const nodes = window.ObsidianGraph.cy.nodes().not('.obsidian-hidden');
      return Math.max(...nodes.map((n) => n.width()));
    });
    const before = await widthOfBusiest();
    await page.evaluate(() => {
      const slider = document.getElementById('obsidian-graph-node-size');
      slider.value = '2';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(widthOfBusiest).toBeGreaterThan(before);
    // Leave defaults behind for the next test.
    await page.evaluate(() => localStorage.removeItem('zer0.obsidianGraph.v1'));
  });
});
