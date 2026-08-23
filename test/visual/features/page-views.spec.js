// =============================================================================
// page-views.spec.js — the page-view counter (ZER0-083)
// =============================================================================
// Feature: _includes/components/page-views.html (badge)
//        + _includes/components/page-views-init.html (config, from core/head.html)
//        + assets/js/page-views.js (behaviour)
//
// The default provider is `local`: the count lives in the visitor's
// localStorage, so the whole feature is exercisable in a browser with no
// server, no network, and no third party — which is exactly what these tests
// do. Each Playwright test gets a fresh context, so storage starts empty.
//
// Regressions this guards against:
//   - the badge rendering "0 views" before a count exists (it must ship hidden)
//   - a dangling "•" separator in the article meta row when the badge is hidden
//   - session dedupe breaking, so a reload inflates the count
//   - the singular/plural label freezing on one form
//   - a privacy gate (DNT) silently doing nothing
//   - the config block drifting from _config.yml's page_views defaults
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, collectConsoleErrors } = require('../fixtures');

const CONFIG = '#pageViewsConfig';
const BADGE = '.page-views';
const COUNT = '.page-views [data-page-views-count]';
const LABEL = '.page-views [data-page-views-label]';

/**
 * Resolve a real article URL from the homepage rather than hardcoding a post
 * slug that content edits would rot. A homepage with no post links is itself a
 * regression, so this fails loudly instead of skipping.
 */
async function resolveArticleUrl(page) {
  await waitForJekyll(page, '/');
  const hrefs = await page.locator('a[href*="/posts/"]').evaluateAll((links) =>
    links.map((a) => new URL(a.href).pathname)
  );
  // A post permalink is /posts/:year/:month/:day/:slug/ — deeper than a
  // category or archive index, which is what the segment count filters out.
  const article = hrefs.find((path) => path.split('/').filter(Boolean).length >= 4);
  expect(article, 'homepage should link at least one article').toBeTruthy();
  return article;
}

test.describe('Page-view counter', () => {
  test('injects its config and behaviour on every page', async ({ page }) => {
    await waitForJekyll(page, '/');

    await expect(page.locator(CONFIG)).toBeAttached();
    const cfg = JSON.parse(await page.locator(CONFIG).textContent());

    // Defaults come from _config.yml → page_views; drift here means the
    // include stopped reading config and started inventing it.
    expect(cfg.enabled).toBe(true);
    expect(cfg.provider).toBe('local');
    expect(cfg.dedupe).toBe('session');
    expect(cfg.track).toBe(true);
    expect(cfg.respectDnt).toBe(true);
    expect(cfg.respectGpc).toBe(true);

    await expect(page.locator('script[src*="page-views.js"]')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => typeof window.zer0PageViews)).toBe('object');
  });

  test('records and displays the first view of an article', async ({ page }) => {
    const article = await resolveArticleUrl(page);
    await waitForJekyll(page, article);

    const badge = page.locator(BADGE).first();
    await expect(badge).toBeVisible();
    await expect(page.locator(COUNT).first()).toHaveText('1');
    // One view reads "1 view", not "1 views".
    await expect(page.locator(LABEL).first()).toHaveText('view');

    // The meta-row separator lives INSIDE the badge so it hides with it.
    await expect(badge.locator('.page-views__sep')).toBeVisible();

    const count = await page.evaluate(() => window.zer0PageViews.get());
    expect(count).toBe(1);
    const all = await page.evaluate(() => window.zer0PageViews.all());
    expect(all[article]).toBe(1);
  });

  test('does not inflate the count on a reload within one session', async ({ page }) => {
    const article = await resolveArticleUrl(page);
    await waitForJekyll(page, article);
    await expect(page.locator(COUNT).first()).toHaveText('1');

    await page.reload({ waitUntil: 'load' });
    await expect(page.locator(COUNT).first()).toHaveText('1');
  });

  test('counts a new session and switches the label to the plural', async ({ page }) => {
    const article = await resolveArticleUrl(page);
    await waitForJekyll(page, article);
    await expect(page.locator(COUNT).first()).toHaveText('1');

    // Same visitor (localStorage kept), new browser session (dedupe cleared).
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: 'load' });

    await expect(page.locator(COUNT).first()).toHaveText('2');
    await expect(page.locator(LABEL).first()).toHaveText('views');
  });

  test('Do Not Track suppresses recording and the badge stays hidden', async ({ page }) => {
    const article = await resolveArticleUrl(page);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'doNotTrack', { get: () => '1', configurable: true });
      // Start from no history, so "hidden" can only mean "nothing was recorded".
      try {
        localStorage.removeItem('zer0-page-views');
        sessionStorage.removeItem('zer0-page-views-session');
      } catch (err) {
        /* storage blocked — the assertion below still holds */
      }
    });
    await waitForJekyll(page, article);

    const badge = page.locator(BADGE).first();
    await expect(badge).toBeAttached();
    await expect(badge).toBeHidden();
    // No dangling bullet left behind in the meta row.
    await expect(badge.locator('.page-views__sep')).toBeHidden();
    expect(await page.evaluate(() => window.zer0PageViews.get())).toBeNull();
  });

  test('reset() clears the stored counts', async ({ page }) => {
    const article = await resolveArticleUrl(page);
    await waitForJekyll(page, article);
    await expect(page.locator(COUNT).first()).toHaveText('1');

    await page.evaluate(() => window.zer0PageViews.reset());
    await page.reload({ waitUntil: 'load' });

    await expect(page.locator(COUNT).first()).toHaveText('1');
    expect(await page.evaluate(() => window.zer0PageViews.get())).toBe(1);
  });

  test('runs clean — the counter logs no console errors', async ({ page }) => {
    // Scoped to this feature on purpose: an unrelated pre-existing error
    // elsewhere on the page should not fail the page-views spec.
    const errors = collectConsoleErrors(page);
    const article = await resolveArticleUrl(page);
    await waitForJekyll(page, article);
    await expect(page.locator(BADGE).first()).toBeVisible();

    const ours = errors.errors.filter((text) => /page-views|zer0PageViews/i.test(text));
    expect(ours, `page-views console errors:\n${ours.join('\n')}`).toEqual([]);
  });
});
