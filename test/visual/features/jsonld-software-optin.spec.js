// =============================================================================
// jsonld-software-optin.spec.js — the SoftwareApplication graph is opt-in and
// only ever describes THIS theme (2026-08 fleet audit, finding C1)
// =============================================================================
// _includes/content/jsonld-software.html used to render on EVERY consumer's
// homepage. Its payload is hardcoded to this theme — RubyGems download URL,
// this GitHub repo, MIT licence, the theme's feature list, and a Person node
// naming the theme's author as the site's publisher. Emitted from a consumer's
// homepage it asserts, in machine-readable form, that THAT site is this Ruby
// gem. The audit found it live on a consulting firm's homepage.
//
// It now requires `jsonld_software_application: true` in _config.yml, which
// this repo sets — so on the theme's own site the graph must still be present
// and correct. A consumer that never sets the flag gets nothing.
//
// This spec runs against the theme's own site (flag ON), so it locks in:
//   • the graph still renders where it IS truthful
//   • it is valid JSON (a malformed block is invisible to crawlers)
//   • it describes THIS theme, not whatever site.title happens to be
//   • the homepage-only gate still holds
// The flag-OFF half is a build-level assertion — two full builds compared in
// test/visual/evidence/jsonld-software-optin/ — because Playwright cannot
// rebuild the site with different config mid-run.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const THEME_REPO = 'https://github.com/bamr87/zer0-mistakes';

/** Collect every parsed application/ld+json payload on the current page. */
async function ldJsonPayloads(page) {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((text, i) => {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`ld+json block #${i} is not valid JSON: ${err.message}`);
    }
  });
}

/** Flatten @graph wrappers so we can look up nodes by @type. */
function graphNodes(payloads) {
  return payloads.flatMap((p) => (Array.isArray(p['@graph']) ? p['@graph'] : [p]));
}

test.describe('SoftwareApplication JSON-LD (opt-in, theme-owned)', () => {
  test('homepage emits exactly one valid SoftwareApplication graph', async ({ page }) => {
    await waitForJekyll(page, '/');

    const nodes = graphNodes(await ldJsonPayloads(page));
    const software = nodes.filter((n) => n['@type'] === 'SoftwareApplication');

    // This repo opts in, so exactly one must render. Zero means the gate
    // regressed closed; more than one means a duplicate include.
    expect(software).toHaveLength(1);
  });

  test('the graph describes THIS theme, not merely the site title', async ({ page }) => {
    await waitForJekyll(page, '/');

    const nodes = graphNodes(await ldJsonPayloads(page));
    const software = nodes.find((n) => n['@type'] === 'SoftwareApplication');
    expect(software).toBeTruthy();

    // These three fields are the reason the block is opt-in: they are true of
    // the theme and false of any other site. If this payload is ever made
    // generic, the opt-in gate should be revisited too.
    expect(software.codeRepository).toBe(THEME_REPO);
    expect(software.downloadUrl).toContain('rubygems.org/gems/jekyll-theme-zer0');
    expect(software.alternateName).toBe('jekyll-theme-zer0');
  });

  test('graph cross-references resolve to nodes that exist', async ({ page }) => {
    await waitForJekyll(page, '/');

    const nodes = graphNodes(await ldJsonPayloads(page));
    const software = nodes.find((n) => n['@type'] === 'SoftwareApplication');
    const ids = new Set(nodes.map((n) => n['@id']).filter(Boolean));

    // The WebPage node points `about` at #software and the software node points
    // `author`/`publisher` at #author. Gating the block must not leave a
    // dangling @id reference behind.
    const webpage = nodes.find((n) => n['@type'] === 'WebPage');
    if (webpage && webpage.about) {
      expect(ids.has(webpage.about['@id'])).toBe(true);
    }
    for (const ref of ['author', 'publisher']) {
      if (software[ref] && software[ref]['@id']) {
        expect(ids.has(software[ref]['@id'])).toBe(true);
      }
    }
  });

  test('the graph is homepage-only', async ({ page }) => {
    // The include is gated on permalink/url == "/" as well as the config flag.
    // An interior page must not carry the software graph.
    await waitForJekyll(page, '/about/');

    const nodes = graphNodes(await ldJsonPayloads(page));
    expect(nodes.filter((n) => n['@type'] === 'SoftwareApplication')).toHaveLength(0);
  });
});
