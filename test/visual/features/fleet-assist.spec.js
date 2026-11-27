// =============================================================================
// fleet-assist.spec.js — the fleet page bridge (ZER0-089)
// =============================================================================
// Include: _includes/components/fleet-assist.html, mounted once by
// _layouts/root.html. Payload: assets/js/fleet-assist.js. Both are vendored
// from the bamr87/bamr87 assistant kit (templates/assistant); the hub holds
// the payload byte-identical, so nothing here edits it.
//
// <fleet-assist> lets a Claude Code session paired through the Harness Console
// see the page a developer has open. It is a developer tool: off unless a site
// sets fleet_assist.enabled, and then written in development only. The switch
// itself (enabled x deployed x environment) is covered where a site can be
// built per config: test/test_fleet_assist_gate.rb, run by test_core.sh on
// every PR. What needs a browser is here, in three parts:
//
//   1. Default (runs on the stock stack, _config.yml + _config_dev.yml, which
//      does not opt in): a page carries no tag and never fetches the payload.
//   2. Payload (always runs): the theme serves it at the path the include
//      emits and, written the way the include writes it, the tag upgrades in
//      the theme's page, shows its launcher on a loopback address and sends
//      nothing to the console until someone opens the panel.
//   3. Mounted (needs a stack that opts in; skipped otherwise): one tag per
//      page, naming this repo and the file behind the page. Run it with
//        printf 'fleet_assist:\n  enabled: true\n' > /tmp/assist-on.yml
//        bundle exec jekyll serve --config _config.yml,_config_dev.yml,/tmp/assist-on.yml
//        BASE_URL=http://127.0.0.1:4000 npx playwright test \
//          --config=test/playwright.config.js --project=smoke fleet-assist
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent } = require('../fixtures');

const TAG = 'fleet-assist';
const PAYLOAD = 'assets/js/fleet-assist.js';
const PAGES = ['/', '/docs/'];
// The console the payload pairs through unless the tag names another one.
const BROKER = /^https?:\/\/(127\.0\.0\.1|localhost):4001\//;
const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost)$/;

/** Record every request the page makes that matches `pattern`. */
function watch(page, pattern) {
  const seen = [];
  page.on('request', (req) => { if (pattern.test(req.url())) seen.push(req.url()); });
  return seen;
}

/** Does the stack under test opt in (fleet_assist.enabled)? */
async function optedIn(page) {
  return (await page.locator(TAG).count()) > 0;
}

test.describe('Fleet page bridge — off by default', () => {
  for (const route of PAGES) {
    test(`${route} carries no tag and never fetches the payload`, async ({ page }) => {
      const fetched = watch(page, /fleet-assist\.js/);
      await waitForJekyll(page, route);
      test.skip(await optedIn(page), 'this stack sets fleet_assist.enabled; see the "mounted" tests');

      await expect(page.locator(TAG)).toHaveCount(0);
      await expect(page.locator('script[src*="fleet-assist"]')).toHaveCount(0);
      expect(fetched).toEqual([]);
      expect(await page.evaluate(() => typeof window.FleetAssist)).toBe('undefined');
    });
  }
});

test.describe('Fleet page bridge — the payload the theme ships', () => {
  test('is served at the path the include emits', async ({ page }) => {
    const res = await page.request.get(`/${PAYLOAD}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/javascript/);
    expect(await res.text()).toContain("customElements.define('fleet-assist'");
  });

  test('upgrades the tag, shows its launcher on loopback and stays silent until opened', async ({ page }) => {
    const toBroker = watch(page, BROKER);
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');

    // On a stack that has not opted in, write what the include writes.
    if (!(await optedIn(page))) {
      await page.addScriptTag({ url: `/${PAYLOAD}` });
      await page.evaluate((name) => {
        const el = document.createElement(name);
        el.setAttribute('repo', 'bamr87/zer0-mistakes');
        el.setAttribute('framework', 'jekyll');
        el.setAttribute('env', 'development');
        document.body.appendChild(el);
      }, TAG);
    }

    await page.waitForFunction((name) => !!window.customElements.get(name), TAG);
    await expect(page.locator(TAG)).toHaveCount(1);

    // The panel is closed and nothing is shared until a person opens it.
    expect(await page.evaluate(() => window.FleetAssist.state()))
      .toEqual({ open: false, mode: expect.any(String), shared: false, paired: 0 });

    // A developer's loopback address gets the launcher; a deployed host does
    // not (there the tag waits for #fleet-assist), so only assert it here.
    if (LOOPBACK.test(new URL(page.url()).hostname)) {
      await expect(page.locator(TAG).getByRole('button', { name: /assistant/i })).toBeVisible();
    }

    // "No request of any kind until the panel is opened" is the kit's privacy
    // promise; a mount that broke it would have every dev page call the console.
    await page.waitForLoadState('networkidle');
    expect(toBroker).toEqual([]);
  });
});

test.describe('Fleet page bridge — mounted (opt-in stack)', () => {
  for (const route of PAGES) {
    test(`${route} has exactly one tag, naming the repo and the source file`, async ({ page }) => {
      await waitForJekyll(page, route);
      test.skip(!(await optedIn(page)), 'needs a stack started with fleet_assist.enabled: true (see the header)');

      const tag = page.locator(TAG);
      await expect(tag).toHaveCount(1);
      await expect(page.locator('script[src*="fleet-assist.js"]')).toHaveCount(1);
      await expect(page.locator('script[src*="fleet-assist.js"]')).toHaveAttribute('defer', '');

      // Repo comes from a single source (site.repository), never hardcoded.
      await expect(tag).toHaveAttribute('repo', 'bamr87/zer0-mistakes');
      await expect(tag).toHaveAttribute('framework', 'jekyll');
      await expect(tag).toHaveAttribute('env', 'development');
      expect(await tag.getAttribute('source'), 'the file a session would edit').toMatch(/\.(md|html)$/);
    });
  }
});
