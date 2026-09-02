/**
 * <head> byte-budget and discoverability contract.
 *
 * Regression: #372 and #371.
 *
 * #372 — the HTML spec only looks for the character encoding declaration in
 * the first 1024 bytes of a document. `<meta charset>` used to sit in
 * `_includes/core/head.html` *below* Google Tag Manager, console-capture,
 * page-views, mermaid and nanobar, and below two multi-line HTML doc banners
 * that shipped verbatim to production — so it landed at byte ~4415. Past the
 * limit a browser stops looking and decodes with its locale default, which
 * mangles every non-ASCII byte until it re-parses. This theme ships UTF-8
 * throughout (fr/** translations, em-dashes, curly quotes), so that is a real
 * corruption risk, not a lint nit.
 *
 * The fix moved the tag to the very top of `_layouts/root.html` and converted
 * the banners above it to Liquid comments (stripped at build). This test
 * measures the *served bytes*, because that is the only thing the spec's rule
 * is about — a source-order assertion would have passed both before and after.
 *
 * #371 — jekyll-feed generates /feed.xml but emits no autodiscovery <link>
 * unless `feed_meta` is called, so the feed was undiscoverable to readers and
 * crawlers even though the footer linked it.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, waitForJekyll } = require('../fixtures');

// The spec's limit. Not a style preference — browsers genuinely stop scanning.
const CHARSET_BYTE_LIMIT = 1024;

/** Fetch the raw served bytes, not the DOM. The parser normalises <head> and
 *  hoists the charset, so page.content() cannot see this defect at all. */
async function rawHtml(page, request, route) {
  await waitForJekyll(page, route);
  const res = await request.get(page.url());
  expect(res.ok(), `${route} should be served`).toBe(true);
  return Buffer.from(await res.body());
}

test.describe('head contract — charset byte budget and feed discovery', { tag: '@critical' }, () => {
  test('charset is declared within the first 1024 bytes of the document', async ({ page, request }) => {
    const body = await rawHtml(page, request, UI_ROUTES.home);

    const idx = body.indexOf(Buffer.from('<meta charset'));
    expect(idx, '<meta charset> must be present in the served HTML').toBeGreaterThanOrEqual(0);
    expect(
      idx,
      `<meta charset> starts at byte ${idx}; the HTML spec only scans the first ` +
      `${CHARSET_BYTE_LIMIT} bytes. Something above it in _layouts/root.html is ` +
      `shipping bytes — check for HTML comments that should be Liquid comments.`
    ).toBeLessThan(CHARSET_BYTE_LIMIT);
  });

  test('exactly one charset declaration is emitted in <head>', async ({ page, request }) => {
    const body = await rawHtml(page, request, UI_ROUTES.home);
    const head = body.toString('utf8').match(/<head\b[\s\S]*?<\/head>/i);
    expect(head, 'page should have a <head>').not.toBeNull();

    // Strip HTML comments first: prose in a comment may legitimately mention
    // the tag, and counting those produced a false positive while developing.
    const withoutComments = head[0].replace(/<!--[\s\S]*?-->/g, '');
    const count = (withoutComments.match(/<meta\s+charset/gi) || []).length;
    expect(count, 'a second charset declaration is ignored by the parser and hides drift').toBe(1);
  });

  test('the Atom feed is discoverable from <head>', async ({ page, request }) => {
    const body = await rawHtml(page, request, UI_ROUTES.home);
    const head = body.toString('utf8').match(/<head\b[\s\S]*?<\/head>/i)[0];
    const links = head.match(/<link[^>]+application\/atom\+xml[^>]*>/gi) || [];

    expect(links.length, 'exactly one feed autodiscovery link belongs in <head>').toBe(1);
    expect(links[0], 'the link must carry rel="alternate"').toMatch(/rel=["']alternate["']/i);
    expect(links[0], 'the link must point at a feed path').toMatch(/href=["'][^"']*feed[^"']*["']/i);
  });

  test('the advertised feed URL actually serves a feed', async ({ page, request }) => {
    // A discoverable link to a 404 is worse than no link at all.
    const body = await rawHtml(page, request, UI_ROUTES.home);
    const head = body.toString('utf8').match(/<head\b[\s\S]*?<\/head>/i)[0];
    const href = head.match(/<link[^>]+application\/atom\+xml[^>]*href=["']([^"']+)["']/i)[1];

    const res = await request.get(new URL(href, page.url()).toString());
    expect(res.status(), `${href} should resolve`).toBe(200);
    expect(await res.text()).toContain('<feed');
  });
});
