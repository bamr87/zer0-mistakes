// @ts-check
// breadcrumbs.spec.js — the BreadcrumbList microdata is VALID (issue #512)
//
// _includes/navigation/breadcrumbs.html marks the trail up as a schema.org
// BreadcrumbList. Since #204 (never link a section index that 404s), crumbs
// with no index page render as plain text — but they used to stay inside a
// full ListItem with no `item`. Google requires `item` on every ListItem
// except the last, so one unlinked middle crumb invalidated the whole list
// and the breadcrumb rich result was dropped.
//
// The fix keeps such crumbs VISIBLE but leaves them out of the structured
// list, renumbering positions contiguously. Giving them an `item` instead
// would point Search at the very 404 #204 removed from the page.
//
// Invariants asserted on every BreadcrumbList in the sample:
//   1. every itemListElement except the last has an [itemprop="item"] href;
//   2. positions run exactly 1..n in DOM order;
//   3. every structured item href returns 200.
// And the visible trail is unchanged: unlinked crumbs are still rendered.
//
// /about/settings/theme/ is the page that fails on the pre-fix include: the
// generic branch rendered "Settings" (no /about/settings/ index) as a
// ListItem without `item`.
//
// Tagged @critical so the PR gate (ci.yml → `critical` project) runs it:
// navigation is a critical-tier essential, and an untagged spec only runs in
// the nightly smoke tier — after a regression has already merged.
//
// Run: npx playwright test --config=test/playwright.config.js --project=critical test/visual/features/breadcrumbs.spec.js

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const LIST = 'ol[itemtype="https://schema.org/BreadcrumbList"]';

/** A deep page whose middle crumb has no index page (the #512 shape). */
const DEEP_UNLINKED = '/about/settings/theme/';

/** Discover a real published post URL from the live search index. */
async function firstPostUrl(page) {
  const index = await page.evaluate(async () => {
    const res = await fetch('/search.json');
    return res.ok ? res.json() : [];
  });
  const post = (Array.isArray(index) ? index : []).find((e) => (e.url || '').startsWith('/posts/'));
  return post ? post.url : null;
}

/** Read every BreadcrumbList on the page into plain data. Uses the DOM, not
 *  regex over fetched HTML (CodeQL js/polynomial-redos — see head-contract). */
async function readLists(page) {
  return page.locator(LIST).evaluateAll((lists) =>
    lists.map((ol) => {
      const scope = (el) => el.parentElement && el.parentElement.closest('[itemscope]');
      const items = Array.from(ol.querySelectorAll('[itemprop="itemListElement"]'))
        .filter((li) => scope(li) === ol);
      return {
        visible: Array.from(ol.querySelectorAll(':scope > li')).map((li) => ({
          text: (li.textContent || '').replace(/\s+/g, ' ').trim(),
          linked: !!li.querySelector('a[href]'),
        })),
        items: items.map((li) => {
          const own = (sel) => Array.from(li.querySelectorAll(sel)).find((el) => scope(el) === li);
          const item = own('[itemprop="item"]');
          const pos = own('meta[itemprop="position"]');
          return {
            href: item ? item.getAttribute('href') : null,
            position: pos ? Number(pos.getAttribute('content')) : null,
          };
        }),
      };
    }),
  );
}

async function assertValidLists(page, request, route) {
  await waitForJekyll(page, route);
  const lists = await readLists(page);
  expect(lists.length, `${route}: a BreadcrumbList should render`).toBeGreaterThan(0);

  for (const list of lists) {
    const { items } = list;
    expect(items.length, `${route}: list should have items`).toBeGreaterThan(0);

    items.slice(0, -1).forEach((it, i) => {
      expect(
        it.href,
        `${route}: ListItem ${i + 1} is not the last but has no itemprop="item" — ` +
        `Google drops the whole BreadcrumbList (issue #512)`,
      ).toBeTruthy();
    });

    expect(
      items.map((it) => it.position),
      `${route}: positions must run 1..n with no gaps`,
    ).toEqual(items.map((_, i) => i + 1));

    // Exactly the linked crumbs plus the leaf are structured: an unlinked
    // crumb is visible text only, never a ListItem.
    expect(
      items.length,
      `${route}: structured items should be the linked crumbs + the current page`,
    ).toBe(list.visible.filter((c) => c.linked).length + 1);

    for (const it of items) {
      if (!it.href) continue;
      const res = await request.get(new URL(it.href, page.url()).toString());
      expect(res.status(), `${route}: structured item ${it.href} must resolve`).toBe(200);
    }
  }
  return lists;
}

test.describe('Breadcrumb structured data (issue #512)', { tag: '@critical' }, () => {
  test('a deep page with an unlinked middle crumb has a valid BreadcrumbList', async ({ page, request }) => {
    const res = await page.request.get(DEEP_UNLINKED);
    test.skip(!res.ok(), `${DEEP_UNLINKED} not built`);

    const [list] = await assertValidLists(page, request, DEEP_UNLINKED);

    // The visible trail is unchanged: "Settings" still renders, still unlinked.
    const settings = list.visible.find((c) => c.text === 'Settings');
    expect(settings, 'the unlinked middle crumb must stay visible').toBeTruthy();
    expect(settings && settings.linked, 'a crumb with no index page must not be a link (#204)').toBe(false);
  });

  test('a post page has a valid BreadcrumbList', async ({ page, request }) => {
    await waitForJekyll(page, '/');
    const post = await firstPostUrl(page);
    test.skip(!post, 'no /posts/ entry in the search index');

    const [list] = await assertValidLists(page, request, post);
    // Home › Posts › leaf: 3 ListItems when the /posts/ index is built (Posts is
    // a link), 2 when it is not (Posts is plain text). Read it off the trail
    // rather than probing /posts/ — the dev server answers a directory listing
    // with 200 even when no index page exists.
    const posts = list.visible.find((c) => c.text === 'Posts');
    expect(posts, 'the Posts crumb must stay visible').toBeTruthy();
    expect(list.items.length).toBe(posts && posts.linked ? 3 : 2);
  });

  for (const route of ['/docs/features/code-copy/', '/quickstart/github-setup/']) {
    test(`${route} has a valid BreadcrumbList`, async ({ page, request }) => {
      const res = await page.request.get(route);
      test.skip(!res.ok(), `${route} not built`);
      await assertValidLists(page, request, route);
    });
  }
});
