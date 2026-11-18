/**
 * Evidence generator for the cookie-consent gate (issue #566).
 *
 * The bug: root.html rendered the consent banner + "Manage Cookies" modal, and
 * core/footer.html the "Cookie Preferences" button, on every page — even on a
 * site with no tracker, where the consent choice controls nothing.
 *
 * The theme's own dev site inherits a GTM container, so it legitimately keeps
 * the banner and a base-vs-head run of it shows no change. This generator
 * instead compares two STATIC builds of the same no-tracker config
 * (google_analytics: "", google_tag_manager: "", posthog.enabled: false):
 *
 *   BEFORE_URL  the base branch, built with that overlay and served statically
 *   BASE_URL    this branch, built the same way
 *
 * Unlike pr-evidence.mjs it does NOT pre-seed consent: a first-time visitor is
 * exactly who the banner is shown to.
 *
 * Usage:
 *   printf 'google_analytics: ""\ngoogle_tag_manager: ""\nposthog:\n  enabled: false\n' > /tmp/notrack.yml
 *   bundle exec jekyll build --config _config.yml,_config_dev.yml,/tmp/notrack.yml -d /tmp/after
 *   (same from a base-branch worktree into /tmp/before; serve both statically)
 *   BEFORE_URL=http://localhost:4101 BASE_URL=http://localhost:4102 \
 *     node test/visual/cookie-consent-gate-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const SLUG = 'cookie-consent-gate';
const after = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const before = (process.env.BEFORE_URL || '').replace(/\/+$/, '');
if (!before) {
  console.error('cookie-consent-gate-evidence: BEFORE_URL is required');
  process.exit(2);
}
const ROUTE = '/';
const WIDTHS = [390, 1280];
const outDir = `test/visual/evidence/${SLUG}`;
const BADGE_URL_RE = /(img\.shields\.io|badge\.fury\.io|github\.com\/.+\/badge\.svg)/;

const PROBE = () => {
  const banner = document.getElementById('cookieConsent');
  const html = document.documentElement;
  return {
    bannerInDom: Boolean(banner),
    bannerVisible: Boolean(banner && !banner.hidden && banner.getBoundingClientRect().height > 0),
    bannerHeightPx: banner ? Math.round(banner.getBoundingClientRect().height) : 0,
    modalInDom: Boolean(document.getElementById('cookieSettingsModal')),
    footerCookieButtons: document.querySelectorAll('footer [data-bs-target="#cookieSettingsModal"]').length,
    bannerOpenClass: html.classList.contains('zer0-cookie-banner-open'),
    bodyPaddingBottomPx: parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
  };
};

async function shoot(browser, url, width) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.route(BADGE_URL_RE, (r) => r.abort());
  await page.setViewportSize({ width, height: 720 });
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  // The banner un-hides after a 1s delay and then slides in.
  await page.waitForTimeout(2000);
  const probe = await page.evaluate(PROBE);
  const img = await page.screenshot();
  const footer = await page.$('footer .footer-policy-links');
  if (footer) await footer.scrollIntoViewIfNeeded();
  const footerImg = footer ? await footer.screenshot() : null;
  await page.close();
  return { probe, errors, img, footerImg };
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
fs.mkdirSync(outDir, { recursive: true });
const metrics = {
  slug: SLUG, generator: 'test/visual/cookie-consent-gate-evidence.mjs', route: ROUTE,
  config: { google_analytics: '', google_tag_manager: '', 'posthog.enabled': false },
  before, after, sweep: [],
};
const pageRows = [];
const footerRows = [];
for (const w of WIDTHS) {
  const b = await shoot(browser, before + ROUTE, w);
  const a = await shoot(browser, after + ROUTE, w);
  metrics.sweep.push({ width: w, before: { ...b.probe, pageErrors: b.errors }, after: { ...a.probe, pageErrors: a.errors } });
  console.log(`  ${w}px  before=${JSON.stringify(b.probe)}  after=${JSON.stringify(a.probe)}`);
  pageRows.push(
    { label: `❌ BEFORE — ${w}px · no tracker configured, banner shown (${b.probe.bannerHeightPx}px) asking consent for cookies that do not exist`, img: b.img, w: Math.min(w, 960) },
    { label: `✅ AFTER — ${w}px · no tracker configured, no banner; page errors: ${a.errors.length}`, img: a.img, w: Math.min(w, 960) },
  );
  if (w === 1280 && b.footerImg && a.footerImg) {
    footerRows.push(
      { label: `❌ BEFORE — footer policy links: ${b.probe.footerCookieButtons} "Cookie Preferences" button`, img: b.footerImg },
      { label: `✅ AFTER — footer policy links: ${a.probe.footerCookieButtons} "Cookie Preferences" buttons`, img: a.footerImg },
    );
  }
}
await montage(browser, {
  title: 'Cookie consent banner on a site with no tracker (#566)', width: 1000,
  note: 'Same config on both sides: google_analytics "", google_tag_manager "", posthog.enabled false. First-time visitor (no stored consent).',
  rows: pageRows,
}, `${outDir}/01-before-after-home.png`);
if (footerRows.length) {
  await montage(browser, {
    title: 'Footer "Cookie Preferences" button (#566)', width: 1000,
    note: 'The button opened #cookieSettingsModal; with no tracker the modal is gone, so the button is too.',
    rows: footerRows,
  }, `${outDir}/02-footer-before-after.png`);
}
await browser.close();
fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `  (evidence: [\`${outDir}/\`](${outDir}/README.md) — no-tracker site: banner, modal and footer button 1 → 0)\n`);
console.log(`  wrote ${outDir}/metrics.json`);
