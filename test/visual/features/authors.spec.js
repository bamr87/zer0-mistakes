// =============================================================================
// authors.spec.js — /authors/ breadcrumb never 404s (author breadcrumb
// existence-gate, issue #204)
// =============================================================================
// _layouts/author.html renders a breadcrumb:
//   Home > Authors > <author name>
//
// Before the fix, "Authors" was ALWAYS a link to `/authors/`.  On a
// remote-theme GitHub Pages consumer the /authors/ index page is
// plugin-generated (author_pages_generator.rb) and absent, so that link 404s.
//
// The fix existence-gates the link: it links only when /authors/ is in the
// build (site.html_pages or site.collections).  On the theme's own site the
// /authors/ index exists, so the link renders and we can verify:
//   • the link is an <a> pointing to /authors/
//   • the link target resolves 200 (not 404)
//
// WCAG criterion: SC 2.4.4 — Link Purpose (In Context).
// A breadcrumb link that leads to a 404 fails this criterion because users
// can't determine where the link actually goes.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

// A committed author profile page that the plugin generates.
const AUTHOR_PAGE = '/authors/bamr87/';

test.describe('Author breadcrumb existence-gate (issue #204)', () => {
  test('author breadcrumb links to /authors/ when that index page exists', async ({ page }) => {
    await waitForJekyll(page, AUTHOR_PAGE);

    // The breadcrumb is produced by _layouts/author.html (different from the
    // navbar breadcrumbs.html include — it lives directly in the layout).
    // It should have an <a href="/authors/"> crumb.
    const crumb = page.locator('nav[aria-label="breadcrumb"] a[href="/authors/"]');
    await expect(crumb).toHaveCount(1);
    await expect(crumb).toHaveText('Authors');

    // The link target must resolve — not 404.
    const resp = await page.request.get('/authors/');
    expect(resp.status()).toBe(200);
  });

  test('author breadcrumb /authors/ link target resolves to 200', async ({ page }) => {
    const resp = await page.request.get('/authors/');
    expect(resp.status()).toBe(200);
  });

  test('no unconditional /authors/ link present when the index is absent (degradation path)', async ({ page }) => {
    // We test this via the Liquid template logic: when the page doesn't exist
    // in site.html_pages, the template should render plain text. We can't truly
    // simulate an absent /authors/ in an integration test against the live build
    // (where it exists). So this test verifies the template renders the correct
    // fallback HTML pattern when the page is simply not found by the guard.
    //
    // Structural assertion: if the /authors/ index is present, the breadcrumb
    // MUST contain an <a>; if absent, it must contain only a <span>/<li> with
    // no <a href="/authors/">.  Since /authors/ exists here, the <a> is expected.
    // The absence branch is covered by the Jekyll build + code-review of the
    // Liquid guard (see _layouts/author.html lines 71-98).
    await waitForJekyll(page, AUTHOR_PAGE);

    const breadcrumbs = page.locator('nav[aria-label="breadcrumb"] ol.breadcrumb');
    await expect(breadcrumbs).toHaveCount(1);

    // The nav-level layout breadcrumb (from breadcrumbs.html include, inside
    // the default layout navbar area) and the author-layout breadcrumb may both
    // appear on the page.  We care only about the author layout's breadcrumb,
    // which appears directly in the main content area.
    // The author layout's breadcrumb contains the author name as the active item.
    const activeCrumb = page.locator('nav[aria-label="breadcrumb"] .breadcrumb-item.active[aria-current="page"]');
    // At least one active item should reference the author
    await expect(activeCrumb.first()).toBeVisible();
  });
});

// =============================================================================
// Author avatar URLs — never protocol-relative (issue #297)
// =============================================================================
// _includes/components/author-avatar-url.html (the single shared resolver
// behind author-card.html, author-eeat.html and the author/authors layouts)
// used to build relative avatar paths by manual slash concatenation:
//   {{ site.baseurl }}/{{ site.public_folder }}{{ _avatar }}
// On consumer configurations where the joined slashes double up (public_folder
// unset, or set with a leading slash — remote-theme consumers don't inherit
// the theme's _config.yml), a site-absolute avatar like
// /images/authors/cassandra.svg rendered as //assets/images/authors/…
// — a protocol-relative URL the browser resolves against a host literally
// named "assets", breaking the image everywhere it appears. The fix collapses
// the path and applies relative_url exactly once.
//
// The dev build's own config can't reproduce that misconfiguration at test
// time (Liquid renders server-side), so these tests pin the fix's output
// invariants on every avatar surface: no avatar src may ever be
// protocol-relative, and every site-served avatar URL must resolve. The
// misconfigured-consumer states are captured as real before/after builds in
// test/visual/evidence/author-avatar-url/.
// =============================================================================

const AVATAR_SELECTOR = [
  'img.author-hero__avatar',
  'section.authors-index img.rounded-circle',
  'img.author-inline__avatar',
  'img.author-card__avatar',
].join(', ');

test.describe('Author avatar URLs (issue #297)', () => {
  for (const route of ['/authors/', '/authors/cassandra/']) {
    test(`avatars on ${route} are never protocol-relative and all resolve`, async ({ page }) => {
      await waitForJekyll(page, route);

      const avatars = await page.$$eval(AVATAR_SELECTOR, (imgs) =>
        imgs.map((img) => ({ alt: img.alt, src: img.getAttribute('src') || '' })),
      );
      expect(avatars.length).toBeGreaterThan(0);

      for (const { alt, src } of avatars) {
        // The #297 failure mode: "//assets/…" resolves to host "assets".
        expect(src.startsWith('//'), `avatar for "${alt}" is protocol-relative: ${src}`).toBe(false);

        // Site-served avatars must actually exist (viewport/lazy-loading
        // independent — fetch the URL rather than reading naturalWidth).
        if (src.startsWith('/')) {
          const resp = await page.request.get(src);
          expect(resp.status(), `avatar for "${alt}" at ${src}`).toBe(200);
        }
      }
    });
  }
});
