// =============================================================================
// sitemap-pagination.spec.js — the sitemap index keeps one page in the DOM
// =============================================================================
// Regression guard for a scan of it-journey.dev, whose /search/ page includes
// content/sitemap.html: all 431 rows were in the document AND the script
// eagerly built 431 cards for the hidden card view, about 19,900 elements
// before the visitor typed anything (Lighthouse dom-size). Rows still render
// server-side (no-JS, and the search modal's "View all results" ?q= link),
// but only one page of matches stays attached; "Show more" appends the next.
//
// Also pins the badge contrast fixes: the collection pill was white on
// bg-info (1.96:1) and tag chips were #0d6efd on the row (3.97:1).
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent } = require('../fixtures');

const PAGE = '/sitemap/';
const PAGE_SIZE = 50;

function contrast(fg, bg) {
  const lum = (c) => {
    const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const counts = (page) => page.evaluate(() => ({
  rows: document.querySelectorAll('#sitemapTableBody tr').length,
  cards: document.querySelectorAll('#sitemapCardsContainer .sitemap-card').length,
  total: parseInt(document.getElementById('totalPages').textContent, 10),
  shown: parseInt(document.getElementById('visibleCount').textContent, 10),
  matches: parseInt(document.getElementById('totalCount').textContent, 10),
  elements: document.querySelectorAll('*').length,
}));

test.describe('Sitemap index pagination', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
  });

  test('first load keeps one page of rows and no cards in the DOM', async ({ page }) => {
    await waitForJekyll(page, PAGE);
    await expect(page.locator('#visibleCount')).not.toHaveText('0');
    const c = await counts(page);
    test.skip(c.total <= PAGE_SIZE, 'index fits on one page in this build');

    expect(c.rows).toBe(PAGE_SIZE);
    expect(c.shown).toBe(PAGE_SIZE);
    expect(c.matches).toBe(c.total);
    expect(c.cards, 'card view is built lazily').toBe(0);
    // Each row is ~40 elements; with the rest held in memory the page must
    // stay well under what the full index alone would add.
    expect(c.elements).toBeLessThan(c.total * 40);

    const more = page.locator('#sitemapShowMoreBtn');
    await expect(more).toBeVisible();
    await more.click();
    const after = await counts(page);
    expect(after.rows).toBe(Math.min(2 * PAGE_SIZE, c.total));
    expect(after.shown).toBe(after.rows);
  });

  test('?q= filters across every row, not just the first page', async ({ page }) => {
    await waitForJekyll(page, `${PAGE}?q=jekyll`);
    await expect(page.locator('#searchBar')).toHaveValue('jekyll');
    const c = await counts(page);
    expect(c.matches).toBeGreaterThan(0);
    expect(c.matches).toBeLessThanOrEqual(c.total);
    expect(c.rows).toBe(Math.min(c.matches, PAGE_SIZE));
    const texts = await page.locator('#sitemapTableBody tr').evaluateAll((rows) =>
      rows.map((r) => [r.dataset.title, r.dataset.description, r.dataset.categories, r.dataset.tags, r.dataset.collection].join(' ').toLowerCase()));
    for (const t of texts) expect(t).toContain('jekyll');
    const more = page.locator('#sitemapShowMore');
    if (c.matches > PAGE_SIZE) await expect(more).toBeVisible();
    else await expect(more).toBeHidden();
  });

  test('card view renders one page of cards on first switch', async ({ page }) => {
    await waitForJekyll(page, PAGE);
    await page.locator('label[for="cardView"]').click();
    const c = await counts(page);
    expect(c.cards).toBe(Math.min(c.total, PAGE_SIZE));
    const first = page.locator('#sitemapCardsContainer .sitemap-card').first();
    await expect(first.locator('.card-title a')).toHaveAttribute('href', /^\//);
  });

  test('sorting by title orders the whole index', async ({ page }) => {
    await waitForJekyll(page, PAGE);
    const th = page.locator('#sitemapTable th.sitemap-col-title');
    await th.click();
    const order = await th.getAttribute('data-order');
    const all = await counts(page);
    const titles = await page.locator('#sitemapTableBody tr td:nth-child(2)').allTextContents();
    expect(titles.length).toBe(Math.min(all.total, PAGE_SIZE));
    const t = titles.map((s) => s.trim());
    const sorted = [...t].sort((a, b) => (order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
    expect(t).toEqual(sorted);
  });

  // The "Pages" pill is text-bg-primary, whose contrast follows the site's
  // own primary colour, so only the fixed-colour info pill is pinned here.
  test('collection pills and tag chips meet 4.5:1', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await waitForJekyll(page, PAGE);
    const collections = await page.locator('#collectionFilter option').evaluateAll((os) => os.map((o) => o.value).filter((v) => v && v !== 'pages'));
    test.skip(collections.length === 0, 'no collection documents in this build');
    await page.selectOption('#collectionFilter', collections.includes('posts') ? 'posts' : collections[0]);
    const pairs = await page.locator('#sitemapTableBody td:first-child .badge, #sitemapTableBody .badge.bg-outline-primary').evaluateAll((els) =>
      els.slice(0, 20).map((el) => {
        let bgEl = el;
        let bg = getComputedStyle(bgEl).backgroundColor;
        while (bgEl && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
          bgEl = bgEl.parentElement;
          bg = bgEl ? getComputedStyle(bgEl).backgroundColor : 'rgb(255, 255, 255)';
        }
        return { cls: el.className, fg: getComputedStyle(el).color, bg };
      }));
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(contrast(p.fg, p.bg), p.cls).toBeGreaterThanOrEqual(4.5);
    }
  });
});
