// =============================================================================
// analytics-consent.spec.js — no analytics before the visitor says yes
// =============================================================================
// Regression guard for a re-test of it-journey.dev (a consumer that sets
// `posthog.privacy.require_consent`): on a fresh visit, before any banner
// choice, the browser fetched gtag.js and PostHog's array.js / config.js /
// surveys.js and set the `ph_<key>_posthog` cookie. Reject All changed nothing
// on that first load, so the banner's "We use cookies…" was not a choice.
//
// With consent required, both includes now wait for the `cookieConsentChanged`
// event the banner dispatches: nothing is requested and no ph_* cookie is set
// until Accept All, both load right after it (no reload), and Reject keeps
// them off. Sites without the flag are unaffected.
//
// Two parts:
//   1. Source contract (always runs): the gates exist in the includes.
//   2. Runtime (needs a PRODUCTION build with require_consent: true, where the
//      includes actually render; skipped on the dev server). Run it with e.g.
//        JEKYLL_ENV=production bundle exec jekyll build --config \
//          _config.yml,<override setting posthog.privacy.require_consent: true>
//        BASE_URL=http://127.0.0.1:4000 npx playwright test analytics-consent
//      The page is served under a non-local hostname, because both includes
//      skip loading on localhost/127.0.0.1. Script requests to Google/PostHog
//      are recorded and fulfilled with an empty body; nothing leaves the box.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ORIGIN = 'https://consent-test.zer0.example';
const ANALYTICS = /googletagmanager\.com|google-analytics\.com|posthog\.com/;

test.describe('Analytics wait for cookie consent — source contract', () => {
  test('PostHog loads only through the consent-gated boot', () => {
    const src = read('_includes/analytics/posthog.html');
    const boot = src.indexOf('var __phBoot = function');
    expect(boot, '__phBoot wrapper').toBeGreaterThan(-1);
    // The loader snippet and init both live inside __phBoot…
    expect(src.indexOf('/static/array.js')).toBeGreaterThan(boot);
    expect(src.indexOf('posthog.init(')).toBeGreaterThan(boot);
    // …which runs at once only with consent, otherwise on the banner's event.
    expect(src).toMatch(/if \(window\.__phHasAnalyticsConsent\) \{\s*__phBoot\(\);/);
    expect(src).toMatch(/addEventListener\('cookieConsentChanged'/);
  });

  test('Google Analytics honours the same consent flag', () => {
    const src = read('_includes/analytics/google-analytics.html');
    expect(src).toContain('site.posthog.privacy.require_consent');
    expect(src).toContain('site.google_analytics_require_consent');
    expect(src).toMatch(/if \(!requireConsent\) \{ load\(\); return; \}/);
    expect(src).toMatch(/addEventListener\('cookieConsentChanged'/);
    // gtag.js is only ever requested from load().
    const load = src.indexOf('function load()');
    expect(src.indexOf('googletagmanager.com/gtag/js')).toBeGreaterThan(load);
  });
});

async function openFresh(browser, baseURL) {
  const context = await browser.newContext();
  const hits = [];
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    const parsed = new URL(url);
    if (parsed.origin === ORIGIN) {
      const res = await fetch(baseURL.replace(/\/$/, '') + parsed.pathname + parsed.search);
      const headers = {};
      res.headers.forEach((v, k) => { if (!/^content-(encoding|length)$/.test(k)) headers[k] = v; });
      return route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    }
    if (ANALYTICS.test(url)) {
      hits.push(url);
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    }
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(ORIGIN + '/', { waitUntil: 'load' });
  const gated = await page.evaluate(() => !!(window.posthogConfig && window.posthogConfig.requireConsent));
  return { context, page, hits, gated };
}

const phCookies = async (context) =>
  (await context.cookies()).filter((c) => /^ph_/.test(c.name)).map((c) => c.name);

test.describe('Analytics wait for cookie consent — runtime', () => {
  test('nothing loads before a choice; Accept All loads both without a reload', async ({ browser, baseURL }) => {
    const { context, page, hits, gated } = await openFresh(browser, baseURL);
    test.skip(!gated, 'needs a production build with posthog.privacy.require_consent: true');

    // Past `load` + PostHog's idle-callback timeout (3 s).
    await page.waitForTimeout(4000);
    expect(hits, 'analytics requests before consent').toEqual([]);
    expect(await phCookies(context), 'ph_* cookies before consent').toEqual([]);
    expect(await page.evaluate(() => typeof window.posthog), 'no PostHog stub before consent').toBe('undefined');

    let navigations = 0;
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navigations += 1; });
    await page.locator('#cookieConsent.cookie-banner-visible').waitFor();
    await page.click('#acceptAllCookies');
    await expect.poll(() => hits.filter((u) => /posthog\.com\/static\/array\.js/.test(u)).length, { timeout: 10000 }).toBe(1);
    const hasGa = await page.evaluate(() =>
      [...document.scripts].some((s) => !s.src && s.textContent.includes('googletagmanager.com/gtag/js')));
    if (hasGa) {
      expect(hits.some((u) => /googletagmanager\.com\/gtag\/js/.test(u)), 'gtag.js after Accept').toBe(true);
    }
    expect(navigations, 'no reload').toBe(0);
    await context.close();
  });

  test('Reject All keeps analytics off', async ({ browser, baseURL }) => {
    const { context, page, hits, gated } = await openFresh(browser, baseURL);
    test.skip(!gated, 'needs a production build with posthog.privacy.require_consent: true');

    await page.locator('#cookieConsent.cookie-banner-visible').waitFor();
    await page.click('#rejectAllCookies');
    await page.waitForTimeout(4000);
    expect(hits, 'analytics requests after Reject').toEqual([]);
    expect(await phCookies(context)).toEqual([]);
    await context.close();
  });
});
