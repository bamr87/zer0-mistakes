/**
 * ============================================================================
 * Books collection spec — book landing + story reading pages (ZER0-080)
 * ----------------------------------------------------------------------------
 * Behavioural/structural regression tests for the picture-book layouts:
 *
 *   - book.html        : cover hero, portrait cover frame, ordered TOC,
 *                        "Start reading" CTA → first chapter
 *   - book-story.html  : single H1, storybook reading surface (bounded
 *                        measure, serif, drop cap), illustration plates
 *                        contained at mobile widths, prev/next/contents
 *                        navigation wired from numeric `chapter:` order,
 *                        prompt colophon
 *
 * Runs against the theme's built-in demo book (pages/_books/zer0-tales/).
 * Forks without a books collection skip cleanly via gotoOrSkip().
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, gotoOrSkip } = require('../fixtures');

const BOOK_URL = '/books/zer0-tales/';
const STORY1_URL = '/books/zer0-tales/01-the-missing-pixel/';
const STORY2_URL = '/books/zer0-tales/02-the-checkpoint/';

test.describe('Books — landing page (book.html)', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('renders one h1 with the book title and a portrait cover frame', async ({ page }) => {
    await gotoOrSkip(page, BOOK_URL);

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('The Tales of Zer0');

    const cover = page.locator('.book-hero .book-cover-frame').first();
    await expect(cover).toBeVisible();
    const box = await cover.boundingBox();
    expect(box.height, 'cover frame keeps a portrait (3/4) aspect').toBeGreaterThan(box.width);
  });

  test('TOC lists every chapter in ascending numeric order', async ({ page }) => {
    await gotoOrSkip(page, BOOK_URL);

    const items = page.locator('.book-toc .book-toc-item');
    const count = await items.count();
    expect(count, 'demo book ships two stories').toBeGreaterThanOrEqual(2);

    const numbers = await page.locator('.book-toc .book-toc-number').allInnerTexts();
    const parsed = numbers.map((n) => parseInt(n, 10));
    const sorted = [...parsed].sort((a, b) => a - b);
    expect(parsed, 'chapter numbers render in reading order').toEqual(sorted);
  });

  test('"Start reading" links to the first chapter', async ({ page }) => {
    await gotoOrSkip(page, BOOK_URL);

    const cta = page.getByRole('link', { name: /start reading/i });
    await expect(cta).toBeVisible();
    const ctaHref = await cta.getAttribute('href');
    const firstChapterHref = await page
      .locator('.book-toc .book-toc-item')
      .first()
      .getAttribute('href');
    expect(ctaHref).toBe(firstChapterHref);
  });
});

test.describe('Books — story page (book-story.html)', { tag: '@critical' }, () => {
  test('reading surface is bounded, serif, and opens with a drop cap', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, STORY1_URL);

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    const content = page.locator('.book-story-content');
    await expect(content).toBeVisible();

    const metrics = await content.evaluate((el) => {
      const cs = getComputedStyle(el);
      const first = el.querySelector('p');
      const firstLetter = first ? getComputedStyle(first, '::first-letter') : null;
      return {
        width: el.getBoundingClientRect().width,
        rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
        fontFamily: cs.fontFamily,
        lineHeight: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
        dropCapFloat: firstLetter ? firstLetter.cssFloat || firstLetter.float : null,
      };
    });

    expect(metrics.width, 'measure stays at/below --zer0-book-measure (42rem)')
      .toBeLessThanOrEqual(42 * metrics.rootPx + 1);
    expect(metrics.fontFamily.toLowerCase()).toContain('serif');
    expect(metrics.lineHeight, 'read-aloud leading').toBeGreaterThanOrEqual(1.7);
    expect(metrics.dropCapFloat, 'opening paragraph gets the drop cap').toBe('left');
  });

  test('illustration plates render inside the page at phone width', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile || { width: 360, height: 740 });
    await gotoOrSkip(page, STORY1_URL);

    const plateImg = page.locator('.book-plate img').first();
    await expect(plateImg).toBeVisible();

    const contained = await page.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      return document.documentElement.scrollWidth <= cw + 1;
    });
    expect(contained, 'no sideways scroll at 360px').toBe(true);
  });

  test('story navigation follows chapter order (prev disabled on ch1, next → ch2, contents → book)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, STORY1_URL);

    const nav = page.locator('.book-story-nav');
    await expect(nav).toBeVisible();

    await expect(nav.locator('.post-nav-card--prev[aria-disabled="true"]'),
      'first story has no previous').toHaveCount(1);

    const nextHref = await nav.locator('a.post-nav-card--next').getAttribute('href');
    expect(nextHref).toContain(STORY2_URL);

    const contentsHref = await nav.getByRole('link', { name: /contents/i }).getAttribute('href');
    expect(contentsHref).toContain(BOOK_URL);
  });

  test('last chapter disables next and keeps contents link', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, STORY2_URL);

    const nav = page.locator('.book-story-nav');
    await expect(nav.locator('.post-nav-card--next[aria-disabled="true"]'),
      'last story has no next').toHaveCount(1);
    const prevHref = await nav.locator('a.post-nav-card--prev').getAttribute('href');
    expect(prevHref).toContain(STORY1_URL);
  });

  test('illustration-prompt colophon is present and collapsed by default', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, STORY1_URL);

    const colophon = page.locator('details.book-colophon');
    await expect(colophon).toHaveCount(1);
    await expect(colophon).not.toHaveAttribute('open', '');

    await colophon.locator('summary').click();
    await expect(colophon.locator('.book-colophon-prompt').first()).toBeVisible();
  });
});
