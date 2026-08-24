// =============================================================================
// section-topic-controls.spec.js — Section sidebar topic controls
// =============================================================================
// Regression cover for the dead sub-topic anchors in the section sidebar.
//
// The bug: _includes/navigation/section-sidebar.html emitted
// <a href="#{{ subcat | slugify }}"> for every tag with >= 1 post, but the
// matching scroll target — <section id="{{ subcat | slugify }}"> at
// _layouts/section.html — is only emitted inside the `magazine` branch, and
// there only for the first 5 sub-categories that still have a post once the
// featured hero is excluded. So:
//
//   - grid / list sections emitted ONE DEAD ANCHOR PER TAG (no ids at all)
//   - magazine sections emitted dead anchors for tags 6..15, because the
//     sidebar iterated `limit: 15` while the layout rendered `limit: 5`
//
// A clean build of this repo's own demo site carried 64 such anchors. They are
// invalid markup, a dead click for keyboard and screen-reader users, and they
// left the sidebar's IntersectionObserver scrollspy unable to ever activate.
//
// The fix: an anchor is emitted only where a target provably exists (magazine,
// and only for the exact set the layout renders). Every other style renders
// <button data-filter="..."> instead, which the layout's existing [data-filter]
// handler already wires to the [data-tags] cards.
//
// These tests assert the invariant directly — every same-page anchor on a
// section page resolves to a real element — plus the control-type split and
// the filtering behaviour that replaced the anchors.
// =============================================================================

const { test, expect } = require('@playwright/test');

// The demo site covers all three styles; see pages/_posts/*/2000-01-01-index.md
const SECTION_PAGES = [
  { url: '/news/science/', style: 'grid' },
  { url: '/news/development/', style: 'grid' },
  { url: '/news/technology/', style: 'grid' },
  { url: '/news/business/', style: 'list' },
  { url: '/news/world/', style: 'magazine' },
  { url: '/news/tutorial/', style: 'magazine' },
];

test.describe('Section topic controls', () => {
  for (const { url, style } of SECTION_PAGES) {
    test(`${url} (${style}): every same-page anchor resolves`, async ({ page }) => {
      await page.goto(url);

      const dangling = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href^="#"]'))
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && h.length > 1)
          .filter((h) => {
            try {
              return document.querySelector(h) === null;
            } catch {
              return true; // unparseable selector counts as broken
            }
          }),
      );

      expect(dangling, `dangling anchors on ${url}`).toEqual([]);
    });

    test(`${url} (${style}): sidebar uses the control type its style supports`, async ({ page }) => {
      await page.goto(url);

      const links = await page.locator('.section-sidebar-desktop a.nav-link').count();
      const buttons = await page.locator('.section-sidebar-desktop button.nav-link').count();

      if (style === 'magazine') {
        // Scroll targets exist here, so topics are real anchors.
        expect(links).toBeGreaterThan(0);
        expect(buttons).toBe(0);
      } else {
        // No per-topic scroll targets exist; topics must be filter buttons.
        expect(buttons).toBeGreaterThan(0);
        expect(links).toBe(0);
      }
    });
  }

  test('magazine: every sidebar topic anchor has a matching <section id>', async ({ page }) => {
    await page.goto('/news/tutorial/');

    const { hrefs, ids } = await page.evaluate(() => ({
      hrefs: Array.from(document.querySelectorAll('.section-sidebar-desktop a.nav-link'))
        .map((a) => a.getAttribute('href'))
        .filter(Boolean),
      ids: Array.from(document.querySelectorAll('section[id]')).map((s) => s.id),
    }));

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(ids, `${href} has no matching <section id>`).toContain(href.slice(1));
    }
  });

  test('grid: sidebar topic button filters the card list', async ({ page }) => {
    await page.goto('/news/technology/');

    const cards = page.locator('[data-tags]');
    const totalCards = await cards.count();
    expect(totalCards).toBeGreaterThan(0);

    // :not() rather than .filter({ hasNot }) — hasNot excludes elements that
    // CONTAIN a match, and the "All Articles" button does not contain a
    // [data-filter="all"] descendant, it IS one. With hasNot this resolved to
    // the All button, so the test filtered by "all", every card stayed visible,
    // and the tag assertion below failed against an unfiltered list.
    const topicButton = page
      .locator('.section-sidebar-desktop button.nav-link[data-filter]:not([data-filter="all"])')
      .first();
    const filter = await topicButton.getAttribute('data-filter');
    expect(filter, 'expected at least one non-"all" topic control').not.toBe('all');

    await topicButton.click();

    // Only cards carrying that tag remain visible.
    const visible = await cards.evaluateAll(
      (els, f) => els.filter((el) => el.style.display !== 'none').map((el) => el.dataset.tags),
      filter,
    );
    expect(visible.length).toBeGreaterThan(0);
    for (const tags of visible) {
      // Whole-tag membership, not toContain: a substring check is the very bug
      // this pins — it passes for a card tagged "edge-ai" when filtering "ai".
      expect(String(tags).split(' ').filter(Boolean)).toContain(filter);
    }

    // The filtered count must agree with the topic's own badge. These are built
    // by two different mechanisms — the badge in Liquid, the filtering in JS —
    // and they silently disagreed while the filter matched substrings.
    const badge = await topicButton.locator('.badge').textContent();
    expect(visible.length).toBe(Number(badge.trim()));

    // The clicked control is marked active, and stays a nav-link (no pill
    // btn-* classes leak onto the sidebar).
    await expect(topicButton).toHaveClass(/active/);
    await expect(topicButton).not.toHaveClass(/btn-outline-secondary/);
  });

  test('grid: "All Articles" restores every card after filtering', async ({ page }) => {
    await page.goto('/news/technology/');

    const cards = page.locator('[data-tags]');
    const totalCards = await cards.count();

    // See the note on the previous test: hasNot did not exclude the All button.
    await page
      .locator('.section-sidebar-desktop button.nav-link[data-filter]:not([data-filter="all"])')
      .first()
      .click();

    const afterFilter = await cards.evaluateAll(
      (els) => els.filter((el) => el.style.display !== 'none').length,
    );
    expect(afterFilter).toBeLessThan(totalCards);

    await page.locator('.section-sidebar-desktop button.nav-link[data-filter="all"]').click();

    const afterReset = await cards.evaluateAll(
      (els) => els.filter((el) => el.style.display !== 'none').length,
    );
    expect(afterReset).toBe(totalCards);
  });

  test('list sections expose data-tags so their topic buttons can filter', async ({ page }) => {
    await page.goto('/news/business/');

    // Before the fix the list branch emitted no [data-tags] at all, which would
    // have made sidebar filter buttons inert.
    await expect(page.locator('[data-tags]').first()).toBeAttached();
  });
});
