/**
 * <head> byte-budget and discoverability contract.
 *
 * Regression: #372 and #371.
 *
 * #372 — the HTML spec only looks for the character encoding declaration in
 * the first 1024 bytes of a document. `<meta charset>` used to sit in
 * `_includes/core/head.html` *below* Google Tag Manager, console-capture,
 * page-views, mermaid and nanobar, and below two multi-line HTML doc banners
 * that shipped verbatim to production — so it landed at byte ~26058. Past the
 * limit a browser stops looking and decodes with its locale default, which
 * mangles every non-ASCII byte until it re-parses. This theme ships UTF-8
 * throughout (fr/** translations, em-dashes, curly quotes), so that is a real
 * corruption risk, not a lint nit.
 *
 * The fix moved the tag to the very top of `_layouts/root.html` and converted
 * the banners above it to Liquid comments (stripped at build). This test
 * measures the *served bytes*, because that is the only thing the spec's rule
 * is about — a source-order assertion would have passed both before and after,
 * and `page.content()` cannot see it either since the parser normalises <head>
 * and hoists the charset.
 *
 * #371 — jekyll-feed generates /feed.xml but emits no autodiscovery <link>
 * unless `feed_meta` is called, so the feed was undiscoverable to readers and
 * crawlers even though the footer linked it.
 *
 * #281 — `theme-color` drives mobile browser chrome. It used to fall back to
 * `site.theme_color.main`, the brand ACCENT (#007bff here), so a dark-first
 * theme advertised a bright blue address bar; and being config-gated it
 * emitted nothing at all on remote_theme consumers, which do not inherit this
 * repo's _config.yml. It must track the page SURFACE, which is what the
 * computed-value assertion below pins down: comparing the meta to
 * getComputedStyle(body).backgroundColor means the tag cannot drift from the
 * surface again without failing.
 *
 * NOTE ON PARSING: the assertions below deliberately use `indexOf` slicing and
 * DOM locators rather than regular expressions over the fetched document.
 * Patterns of the shape `<link[^>]+...[^>]*>` applied to network-controlled
 * input are polynomial-backtracking hazards (CodeQL js/polynomial-redos), and
 * the DOM is the more accurate oracle for "is there a feed link" anyway.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, waitForJekyll } = require('../fixtures');

// The spec's limit. Not a style preference — browsers genuinely stop scanning.
const CHARSET_BYTE_LIMIT = 1024;

/** Fetch the raw served bytes, not the DOM. */
async function rawHtml(page, request, route) {
  await waitForJekyll(page, route);
  const res = await request.get(page.url());
  expect(res.ok(), `${route} should be served`).toBe(true);
  return Buffer.from(await res.body());
}

/** Slice out the <head> region by index. No regex: the input is a fetched
 *  document, and an unbounded pattern over it is a backtracking hazard. */
function headRegion(html) {
  const open = html.toLowerCase().indexOf('<head');
  const close = html.toLowerCase().indexOf('</head>');
  expect(open, 'document should have a <head>').toBeGreaterThanOrEqual(0);
  expect(close, 'document should close its <head>').toBeGreaterThan(open);
  return html.slice(open, close);
}

/** Strip HTML comments by scanning, not by regex. Prose inside a comment may
 *  legitimately mention a tag we are counting — that produced a false positive
 *  while developing this test. */
function stripComments(s) {
  let out = '';
  let i = 0;
  for (;;) {
    const start = s.indexOf('<!--', i);
    if (start === -1) return out + s.slice(i);
    out += s.slice(i, start);
    const end = s.indexOf('-->', start + 4);
    if (end === -1) return out;
    i = end + 3;
  }
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
    const head = stripComments(headRegion(body.toString('utf8'))).toLowerCase();

    // split() rather than a global regex — same count, no backtracking.
    const count = head.split('<meta charset').length - 1;
    expect(count, 'a second charset declaration is ignored by the parser and hides drift').toBe(1);
  });

  test('the Atom feed is discoverable from <head>', async ({ page }) => {
    await waitForJekyll(page, UI_ROUTES.home);

    // The DOM is the oracle a feed reader actually uses.
    const links = page.locator('head link[rel="alternate"][type="application/atom+xml"]');
    await expect(links, 'exactly one feed autodiscovery link belongs in <head>').toHaveCount(1);

    const href = await links.first().getAttribute('href');
    expect(href, 'the feed link must carry an href').toBeTruthy();
    expect(href.toLowerCase(), 'the link should point at a feed path').toContain('feed');
  });

  test('the advertised feed URL actually serves a feed', async ({ page, request }) => {
    // A discoverable link to a 404 is worse than no link at all.
    await waitForJekyll(page, UI_ROUTES.home);
    const href = await page
      .locator('head link[rel="alternate"][type="application/atom+xml"]')
      .first()
      .getAttribute('href');

    const res = await request.get(new URL(href, page.url()).toString());
    expect(res.status(), `${href} should resolve`).toBe(200);
    expect(await res.text()).toContain('<feed');
  });
});

/** rgb()/rgba() -> #rrggbb, so a meta attribute can be compared with a
 *  computed style. getComputedStyle always reports rgb; the meta is authored
 *  as hex. */
function toHex(color) {
  const m = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return color.toLowerCase();
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

test.describe('head contract — theme-color tracks the page surface', { tag: '@critical' }, () => {
  test('both scheme-aware theme-color tags are emitted', async ({ page }) => {
    // This site runs color_mode_default: auto, so the media pair is the
    // correct shape. A pinned site emits one tag on purpose -- see the
    // rationale in _includes/core/favicon.html.
    await waitForJekyll(page, UI_ROUTES.home);

    const metas = page.locator('head meta[name="theme-color"]');
    await expect(metas, 'an auto-mode site emits one tag per scheme').toHaveCount(2);
    await expect(
      page.locator('head meta[name="theme-color"][media="(prefers-color-scheme: light)"]')
    ).toHaveCount(1);
    await expect(
      page.locator('head meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')
    ).toHaveCount(1);
  });

  test('theme-color is never the brand accent', async ({ page }) => {
    // The specific regression: site.theme_color.main is #007bff, an accent
    // meant for links and buttons. Browser chrome is a surface.
    await waitForJekyll(page, UI_ROUTES.home);
    const values = await page
      .locator('head meta[name="theme-color"]')
      .evaluateAll((els) => els.map((e) => (e.getAttribute('content') || '').toLowerCase()));

    expect(values.length, 'there should be theme-color tags to check').toBeGreaterThan(0);
    expect(
      values.filter((v) => v === '#007bff'),
      'the brand accent must not be advertised as browser chrome (issue #281)'
    ).toEqual([]);
  });

  for (const scheme of ['light', 'dark']) {
    test(`the ${scheme} theme-color equals the computed body surface`, async ({ page }) => {
      await waitForJekyll(page, UI_ROUTES.home);

      // Count first. Reading an attribute off a locator that matches nothing
      // times out after 30s instead of saying what is wrong -- and "nothing is
      // emitted" is precisely the pre-fix state this test has to describe.
      const meta = page.locator(
        `head meta[name="theme-color"][media="(prefers-color-scheme: ${scheme})"]`
      );
      expect(
        await meta.count(),
        `no theme-color is declared for prefers-color-scheme: ${scheme}, so browser ` +
        `chrome cannot follow the page surface (issue #281)`
      ).toBe(1);
      const declared = await meta.getAttribute('content');

      // Force the matching Bootstrap theme and read what the page actually
      // paints. This is the assertion that stops the tag drifting: it is not
      // compared against a constant in this file, but against the surface.
      const painted = await page.evaluate((s) => {
        const prev = document.documentElement.getAttribute('data-bs-theme');
        document.documentElement.setAttribute('data-bs-theme', s);
        const bg = getComputedStyle(document.body).backgroundColor;
        if (prev === null) document.documentElement.removeAttribute('data-bs-theme');
        else document.documentElement.setAttribute('data-bs-theme', prev);
        return bg;
      }, scheme);

      expect(
        toHex(declared),
        `theme-color for ${scheme} is ${declared} but the page paints ${painted}. ` +
        `Browser chrome would not match the surface (issue #281).`
      ).toBe(toHex(painted));
    });
  }
});
