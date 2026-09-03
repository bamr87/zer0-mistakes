/**
 * Developer commentary must not be delivered to visitors.
 *
 * Regression: #375.
 *
 * Jekyll copies HTML comments into the rendered page verbatim; Liquid
 * `{% comment %}` blocks are stripped at build time. The theme documented its
 * includes and layouts with the former, so file paths, dependency lists and
 * design rationale went over the wire on every request.
 *
 * The number that justifies a test at this tier: an include's banner is
 * re-emitted at EVERY call site, not once. `post-card.html` renders 1,100
 * times on `/authors/default/`, so its 119-byte banner arrived 1,100 times.
 * Measured across a 415-page build before the fix: 47,898 comment bytes on the
 * average page in 344 blocks — 21.7% of all delivered HTML.
 *
 * WHY THIS IS NOT ONLY A SOURCE-LEVEL CHECK. `test_developer_doc_banners_are_liquid`
 * in test/test_core.sh greps _includes/ and _layouts/, which is the cheap tier
 * and catches the obvious reintroduction. It cannot see a banner that reaches
 * the page some other way — a vendored partial, a plugin, a consumer override,
 * a future include that greps clean but renders a comment. This test measures
 * what a visitor actually receives, which is the property that matters.
 *
 * NOTE ON PARSING: the scanning below deliberately uses `indexOf` slicing
 * rather than regular expressions over the fetched document. An unbounded
 * pattern applied to network-controlled input is a polynomial-backtracking
 * hazard (CodeQL js/polynomial-redos), and these pages are hundreds of
 * kilobytes.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, waitForJekyll } = require('../fixtures');

/**
 * Per-page ceiling for delivered comment bytes.
 *
 * Not zero, and not tight: page CONTENT may legitimately contain comments
 * (a docs page showing sample markup), and Google's copy-paste analytics
 * snippets keep their own boundary markers on purpose. The budget exists to
 * catch a banner regression — 344 blocks averaging 47,898 bytes — not to
 * police an author who writes a comment in a post. Anything under this is two
 * orders of magnitude below the defect.
 */
const COMMENT_BYTE_BUDGET = 4096;

/** Text that only ever appears in a developer doc banner. If any of these is
 *  delivered, a banner is shipping regardless of the byte total. */
const BANNER_MARKERS = [
  'Path: _includes/',
  'Path: _layouts/',
  'Template Logic:',
  'Dependencies:',
  '==================================================',
];

/** Walk the HTML comments without a regex. Returns their total byte length,
 *  count, and concatenated text for marker matching. */
function scanComments(html) {
  let bytes = 0, blocks = 0, text = '', i = 0;
  for (;;) {
    const a = html.indexOf('<!--', i);
    if (a === -1) break;
    const b = html.indexOf('-->', a + 4);
    if (b === -1) break;
    bytes += b + 3 - a;
    blocks += 1;
    text += html.slice(a + 4, b);
    i = b + 3;
  }
  return { bytes, blocks, text };
}

async function servedHtml(page, request, route) {
  await waitForJekyll(page, route);
  const res = await request.get(page.url());
  expect(res.ok(), `${route} should be served`).toBe(true);
  return (await res.body()).toString('utf8');
}

/** Both layout families are represented: routes inheriting `default` and
 *  routes inheriting `root` pull in different include sets, so a list covering
 *  only one of them would pass on a half-fixed build. */
const ROUTES = [
  { path: UI_ROUTES.home, why: 'home — inherits root' },
  { path: '/docs/', why: 'docs — inherits default; densest include set' },
  { path: '/404.html', why: '404 — inherits root' },
  { path: '/about/', why: 'about — admin family' },
];

test.describe('delivered HTML carries no developer commentary', { tag: '@critical' }, () => {
  for (const { path, why } of ROUTES) {
    test(`${path} stays under the comment budget (${why})`, async ({ page, request }) => {
      const html = await servedHtml(page, request, path);
      const { bytes, blocks } = scanComments(html);
      expect(
        bytes,
        `${path} delivers ${bytes} bytes of HTML comments in ${blocks} blocks. ` +
        `Developer banners belong in {% comment %} blocks, which Jekyll strips ` +
        `at build time (issue #375).`
      ).toBeLessThan(COMMENT_BYTE_BUDGET);
    });

    test(`${path} ships no doc-banner text (${why})`, async ({ page, request }) => {
      const html = await servedHtml(page, request, path);
      const { text } = scanComments(html);
      const found = BANNER_MARKERS.filter((m) => text.includes(m));
      expect(
        found,
        `${path} delivers developer doc-banner text to visitors. Convert the ` +
        `banner in the include or layout that emits it to a Liquid comment.`
      ).toEqual([]);
    });
  }

  test('a component rendered many times does not multiply its banner', async ({ page, request }) => {
    // The mechanism the fix is really about. An index page renders its card
    // component once per entry, so a banner inside that component is paid per
    // render. If comment payload scales with the number of cards, a banner is
    // back in a leaf include — which the per-page budget above might still
    // absorb on a short page.
    // /authors/default/ is the measured worst case: 1,098 comment blocks
    // before the fix, from post-card.html rendering once per entry.
    const html = await servedHtml(page, request, '/authors/default/');
    const { bytes } = scanComments(html);
    const cards = await page.locator('[class*="post-card"]').count();
    test.skip(cards < 5, '/authors/default/ does not render enough cards to test multiplication');
    expect(
      bytes / cards,
      `comment payload scales with the ${cards} cards on this page, which means ` +
      `a banner lives inside the repeated component`
    ).toBeLessThan(200);
  });
});
