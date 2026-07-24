/**
 * ============================================================================
 * book-abc layout spec — the "ABC & Language" board-book layout (ZER0-081)
 * ----------------------------------------------------------------------------
 * Structural / behavioural checks for _layouts/book-abc.html +
 * _includes/components/abc-letter.html, exercised against the theme's own demo
 * book at /books/abc-demo/ (pages/_books/abc-demo/index.md — 6 planned letters,
 * crayon-primary art style). Guards with gotoOrSkip so a fork without the demo
 * book stays green.
 *
 * These are behavioural/structural assertions (counts, classes, anchors,
 * overflow) rather than pixel snapshots, so they survive content edits.
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { gotoOrSkip, VIEWPORTS } = require('../fixtures');

const BOOK = '/books/abc-demo/';

test.describe('book-abc board-book layout', () => {
  test('renders one card per alphabet entry with the art-style skin', async ({ page }) => {
    await gotoOrSkip(page, BOOK);

    // The board carries the art_style skin class (crayon-primary in the demo).
    const board = page.locator('.abc-board');
    await expect(board).toHaveClass(/abc-style--crayon-primary/);

    // One card per letter; the demo declares A–F.
    const cards = page.locator('.abc-letter');
    await expect(cards).toHaveCount(6);

    // Each card has a big letter badge and a word.
    await expect(page.locator('.abc-letter-badge')).toHaveCount(6);
    await expect(page.locator('.abc-letter-word')).toHaveCount(6);

    // The letters are anchored for the A–Z quick-jump.
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
      await expect(page.locator(`#letter-${id}`)).toHaveCount(1);
    }
    await expect(page.locator('.abc-jump-link')).toHaveCount(6);
  });

  test('planned plates show a placeholder, never a broken image', async ({ page }) => {
    await gotoOrSkip(page, BOOK);

    // Every demo letter is `status: planned`, so each card shows the
    // "coming soon" placeholder and NO <img> is emitted (nothing to 404).
    await expect(page.locator('.abc-letter-placeholder')).toHaveCount(6);
    await expect(page.locator('.abc-letter-img')).toHaveCount(0);
    // The big letter is HTML typography (a glyph), not baked into art.
    await expect(page.locator('.abc-letter-glyph')).toHaveCount(6);
  });

  test('quick-jump links target the letter anchors', async ({ page }) => {
    await gotoOrSkip(page, BOOK);
    const first = page.locator('.abc-jump-link').first();
    await expect(first).toHaveAttribute('href', /#letter-a$/);
  });

  test('does not overflow the viewport horizontally on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile || { width: 390, height: 844 });
    await gotoOrSkip(page, BOOK);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    // A couple of px of sub-pixel rounding is fine; a real sideways scroll is not.
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
