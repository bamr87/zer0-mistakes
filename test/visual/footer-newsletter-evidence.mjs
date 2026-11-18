/**
 * Evidence generator for the opt-in footer newsletter signup (issue #554).
 *
 * The bug: _includes/core/footer.html rendered a newsletter form on every page
 * of every site, whatever the config: a disabled email input, a disabled
 * "Subscribe" button whose tooltip was a setup note ("Configure a newsletter
 * endpoint in your site config"), and a "placeholder until you connect a
 * provider" caption.
 *
 * The fix renders the form only when a provider endpoint is configured, and
 * then as a working form. A base-vs-head run of the dev server shows only the
 * default state, so this compares three STATIC builds of the same dev config:
 *
 *   BEFORE_URL      the base branch, default config (the dead form)
 *   BASE_URL        this branch, default config (no form; policy links span the row)
 *   CONFIGURED_URL  this branch + `newsletter: { endpoint: https://example.com/subscribe }`
 *                   (optional; a working form, submitted once to prove it posts)
 *
 * Usage:
 *   printf 'newsletter:\n  endpoint: "https://example.com/subscribe"\n' > /tmp/newsletter.yml
 *   bundle exec jekyll build --config _config.yml,_config_dev.yml -d /tmp/after
 *   bundle exec jekyll build --config _config.yml,_config_dev.yml,/tmp/newsletter.yml -d /tmp/configured
 *   (the first build again from a base-branch worktree into /tmp/before; serve all three statically)
 *   BEFORE_URL=http://localhost:4101 BASE_URL=http://localhost:4102 CONFIGURED_URL=http://localhost:4103 \
 *     node test/visual/footer-newsletter-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const SLUG = 'footer-newsletter';
const trim = (u) => (u || '').replace(/\/+$/, '');
const after = trim(process.env.BASE_URL || 'http://localhost:4000');
const before = trim(process.env.BEFORE_URL);
const configured = trim(process.env.CONFIGURED_URL);
if (!before) {
  console.error('footer-newsletter-evidence: BEFORE_URL is required');
  process.exit(2);
}
const ROUTE = '/';
const WIDTHS = [390, 1280];
const ENDPOINT = 'https://example.com/subscribe';
const outDir = `test/visual/evidence/${SLUG}`;
const BADGE_URL_RE = /(img\.shields\.io|badge\.fury\.io|github\.com\/.+\/badge\.svg)/;

// A returning visitor: the fixed-bottom consent banner would otherwise sit
// over the footer crop (same seed as dismissCookieConsent in fixtures.js).
const SEED_CONSENT = () => {
  localStorage.setItem('zer0-cookie-consent', JSON.stringify({
    essential: true, analytics: false, marketing: false,
    timestamp: Date.now(), version: '1.0',
  }));
};

const PROBE = () => {
  const footer = document.querySelector('footer.bd-footer');
  const form = footer && footer.querySelector('.footer-subscribe-form');
  const input = footer && footer.querySelector('#footer-email');
  const button = form && form.querySelector('button');
  const policy = footer && footer.querySelector('.footer-policy-links');
  const text = footer ? footer.innerText : '';
  return {
    formRendered: Boolean(form),
    formAction: form ? form.getAttribute('action') : null,
    formMethod: form ? form.getAttribute('method') : null,
    formOnsubmit: form ? form.getAttribute('onsubmit') : null,
    inputDisabled: input ? input.disabled : null,
    inputRequired: input ? input.required : null,
    inputName: input ? input.getAttribute('name') : null,
    buttonType: button ? button.getAttribute('type') : null,
    buttonDisabled: button ? button.disabled : null,
    buttonTitle: button ? button.getAttribute('title') : null,
    placeholderCaptionVisible: /placeholder until you connect/i.test(text),
    disabledControls: footer ? footer.querySelectorAll('input:disabled, button:disabled').length : 0,
    policyClasses: policy ? policy.className : null,
    policyTextAlign: policy ? getComputedStyle(policy).textAlign : null,
  };
};

async function shoot(browser, url, width) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.addInitScript(SEED_CONSENT);
  await page.route(BADGE_URL_RE, (r) => r.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  // The FAB stacks (back-to-top, AI chat, page feedback, TOC, local graph)
  // are position:fixed at the bottom corners, right where the footer crop
  // lands; they are not what this evidence is about.
  await page.addStyleTag({
    content: '#backToTopBtn, #aiChatToggle, #pageFeedbackFab, #tocFab, #obsidianLocalGraphFab { display: none !important; }',
  });
  const probe = await page.evaluate(PROBE);
  const row = await page.$('footer .footer-subscribe-row');
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const block = await page.$('footer .footer-dark-block');
  const img = await block.screenshot();
  const rowImg = await row.screenshot();
  await page.close();
  return { probe, errors, img, rowImg };
}

// The configured form must actually submit: fill it, click Subscribe, and
// record the request the browser sends (fulfilled locally, nothing leaves).
async function submitOnce(browser, url) {
  const page = await browser.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.route(BADGE_URL_RE, (r) => r.abort());
  let sent = null;
  await page.route(`${ENDPOINT}*`, async (route) => {
    const req = route.request();
    sent = { url: req.url(), method: req.method(), body: req.postData() };
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>subscribed</p>' });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  const input = page.locator('footer #footer-email');
  const emptyBlocked = await input.evaluate((el) => !el.form.checkValidity());
  await input.fill('reader@example.com');
  await Promise.all([
    page.waitForURL(`${ENDPOINT}*`, { timeout: 15000 }),
    page.locator('footer .footer-subscribe-form button[type="submit"]').click(),
  ]);
  await page.close();
  return { emptySubmissionBlocked: emptyBlocked, request: sent };
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
fs.mkdirSync(outDir, { recursive: true });
const metrics = {
  slug: SLUG, generator: 'test/visual/footer-newsletter-evidence.mjs', route: ROUTE,
  config: { base: '_config.yml,_config_dev.yml', configured: { newsletter: { endpoint: ENDPOINT } } },
  before, after, configured: configured || null, sweep: [], submission: null,
};

const rows = [];
const closeUps = [];
for (const w of WIDTHS) {
  const b = await shoot(browser, before + ROUTE, w);
  const a = await shoot(browser, after + ROUTE, w);
  const c = configured ? await shoot(browser, configured + ROUTE, w) : null;
  metrics.sweep.push({
    width: w,
    before: { ...b.probe, pageErrors: b.errors },
    after: { ...a.probe, pageErrors: a.errors },
    ...(c ? { configured: { ...c.probe, pageErrors: c.errors } } : {}),
  });
  console.log(`  ${w}px  before=${JSON.stringify(b.probe)}`);
  console.log(`  ${w}px  after=${JSON.stringify(a.probe)}`);
  if (c) console.log(`  ${w}px  configured=${JSON.stringify(c.probe)}`);
  const iw = Math.min(w, 960);
  rows.push(
    { label: `❌ BEFORE — ${w}px · no provider configured: disabled input + disabled "Subscribe" (title: "${b.probe.buttonTitle}") and the placeholder caption`, img: b.img, w: iw },
    { label: `✅ AFTER — ${w}px · no provider configured: no form, ${a.probe.disabledControls} disabled controls, policy links span the row (text-align ${a.probe.policyTextAlign})`, img: a.img, w: iw },
  );
  if (c) {
    rows.push({ label: `✅ AFTER — ${w}px · newsletter.endpoint set: enabled form, method=${c.probe.formMethod}, action=${c.probe.formAction}, input required=${c.probe.inputRequired}`, img: c.img, w: iw });
  }
  if (w === 1280) {
    closeUps.push(
      { label: '❌ BEFORE — the dead form: disabled input and button, setup tooltip, placeholder caption; policy links squeezed right', img: b.rowImg },
      { label: '✅ AFTER — no provider: no form; the policy links take the whole row, centred', img: a.rowImg },
    );
    if (c) closeUps.push({ label: '✅ AFTER — newsletter.endpoint set: an enabled email field and a submit button', img: c.rowImg });
  }
}
if (configured) {
  metrics.submission = await submitOnce(browser, configured + ROUTE);
  console.log(`  submission=${JSON.stringify(metrics.submission)}`);
}

await montage(browser, {
  title: 'Footer newsletter signup is opt-in (#554)', width: 1000,
  note: 'Same dev config on every side (_config.yml,_config_dev.yml). BEFORE is the base branch; AFTER is this branch, alone and with newsletter.endpoint set. Returning visitor (consent stored).',
  rows,
}, `${outDir}/01-footer-before-after.png`);
await montage(browser, {
  title: 'Footer subscribe row at 1280px (#554)', width: 1000,
  note: 'Close-up of .footer-subscribe-row from the same three builds.',
  rows: closeUps,
}, `${outDir}/02-subscribe-row-1280.png`);
await browser.close();

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
const wide = metrics.sweep.find((s) => s.width === 1280);
const posted = metrics.submission && metrics.submission.request
  ? `; with newsletter.endpoint: an enabled form that ${metrics.submission.request.method}s the address`
  : '';
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `  (evidence: [\`${outDir}/\`](${outDir}/README.md) — default site: newsletter form ${Number(wide.before.formRendered)} → ${Number(wide.after.formRendered)}, disabled footer controls ${wide.before.disabledControls} → ${wide.after.disabledControls}${posted})\n`);
console.log(`  wrote ${outDir}/metrics.json`);
