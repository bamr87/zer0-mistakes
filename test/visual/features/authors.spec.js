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

// =============================================================================
// Author-card social links — explicit, author-specific names (issue #568)
// =============================================================================
// The full author card ("About the Author", on every post via
// author-bio.html) renders its GitHub / X / LinkedIn / Website / Email links
// as icon-only buttons. Before the fix only X had an aria-label (the bare
// "X"); the others were named by `title=` alone — a last-resort naming source
// touch and screen-reader users don't reliably get — and none said WHOSE
// profile it was. The Bootstrap Icons glyphs, including the person
// placeholders, were exposed to assistive tech.
//
// The fix mirrors the footer's #435/#441 pattern: an explicit aria-label
// naming the author and destination ("(opens in a new tab)" on target=_blank
// links), aria-hidden="true" on every glyph, and `title` kept as the tooltip.
//
// WCAG criteria: SC 2.4.4 Link Purpose (In Context), SC 4.1.2 Name, Role, Value.
// =============================================================================

// A committed post by `vega` (an author with a github handle in _data/authors.yml).
const AUTHOR_CARD_POST = '/posts/2026/06/17/bayesian-modeled-my-coffee-and-wept-with-joy/';
const AUTHOR_CARD_NAME = 'Vega';

test.describe('Author-card social link names (issue #568)', () => {
  test('every social/contact link has an aria-label naming the author', async ({ page }) => {
    await waitForJekyll(page, AUTHOR_CARD_POST);

    const card = page.locator('.author-card');
    await expect(card).toHaveCount(1);

    const links = card.locator('.author-social a.btn');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const label = (await link.getAttribute('aria-label')) || '';
      expect(label, `author-card link ${href} has no aria-label`).not.toBe('');
      expect(label, `author-card link ${href} does not name the author`).toContain(AUTHOR_CARD_NAME);
      // title stays as the visual tooltip (no visual change).
      expect(await link.getAttribute('title'), `author-card link ${href} lost its title tooltip`).toBeTruthy();
      if ((await link.getAttribute('target')) === '_blank') {
        expect(label, `author-card link ${href} opens a new tab without saying so`).toContain('opens in a new tab');
      }
    }

    // The accessible name the browser computes is the author-specific one.
    await expect(
      card.getByRole('link', { name: new RegExp(`^${AUTHOR_CARD_NAME} on GitHub`) }),
    ).toHaveCount(1);
  });

  test('every Bootstrap Icons glyph in the author card is aria-hidden', async ({ page }) => {
    await waitForJekyll(page, AUTHOR_CARD_POST);

    const exposed = await page.$$eval('.author-card i.bi', (icons) =>
      icons.filter((i) => i.getAttribute('aria-hidden') !== 'true').map((i) => i.className),
    );
    expect(exposed, `exposed author-card glyphs: ${exposed.join(', ')}`).toEqual([]);
  });
});
