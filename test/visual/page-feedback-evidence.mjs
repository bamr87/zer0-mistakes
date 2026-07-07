// =============================================================================
// page-feedback-evidence.mjs — evidence for the page-feedback capture widget
// =============================================================================
// Captures the AFTER states of the new runtime "Improve this page" widget
// (_includes/components/page-feedback.html + assets/js/page-feedback.js), which
// replaces the old build-time "Copilot Agent" dropdown in content/intro.html.
//
// The BEFORE was a build-time Liquid dropdown that baked the whole issue body
// into <a href>s and could NOT capture runtime logs — there is no runtime state
// to screenshot for it, so this kit documents it in the README and screenshots
// the substantive AFTER (FAB, modal, captured logs, AI panel, mobile sheet).
//
// Usage (server already up — see the run-zer0-mistakes skill):
//   BASE_URL=http://localhost:4055 node test/visual/page-feedback-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const outDir = 'test/visual/evidence/page-feedback';
fs.mkdirSync(outDir, { recursive: true });

// Pre-seed cookie consent so the banner doesn't dim the screenshots (this is
// presentation only — the widget already renders above the banner in real use).
const SEED_CONSENT = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      necessary: true, analytics: false, timestamp: Date.now(), version: '1.0',
    }));
  } catch (e) { /* ignore */ }
};

const shot = (page, name) => page.screenshot({ path: `${outDir}/${name}` });

const browser = await chromium.launch();
const metrics = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(SEED_CONSENT);

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  // A couple of realistic console lines the capture buffer will pick up.
  await page.evaluate(() => {
    console.warn('[demo] slow image decode on hero banner (312ms)');
    console.error('[demo] GET /assets/missing.svg 404 (Not Found)');
  });

  // 01 — the global FAB on a normal page.
  await shot(page, '01-fab.png');

  // Open the modal and choose a request type.
  await page.locator('#pageFeedbackFab').click();
  await page.waitForTimeout(300);
  await page.locator('.pf-type[data-pf-type-id="fix-page"]').click();
  await page.locator('#pfDescription').fill(
    "The hero image is slow to load and a decorative SVG 404s — see the captured console logs below.");
  await page.waitForTimeout(150);

  // 02 — modal open with a type + description.
  await shot(page, '02-modal-open.png');

  // 03 — "What gets attached" expanded: page context + captured console logs.
  await page.locator('#pfContextWrap > summary').click();
  await page.waitForTimeout(150);
  await page.locator('#pfLogsPreview').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await shot(page, '03-context-and-logs.png');

  // 04 — the optional AI review panel (wired to the chat proxy via Claude Code
  //      OAuth; "Analyze with AI" clarifies/prioritizes/labels before filing).
  const analyze = page.locator('#pfAnalyze');
  if (await analyze.count()) {
    await analyze.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await shot(page, '04-ai-panel.png');
  }

  // Capture the exact pre-filled issue URL the widget builds (intercept open).
  await page.evaluate(() => {
    window.__pfOpened = null;
    window.open = (u) => { window.__pfOpened = u; return { opener: null, closed: false, focus() {} }; };
  });
  await page.locator('#pfSubmit').click();
  const openedUrl = await page.evaluate(() => window.__pfOpened);

  // Structural metrics behind the pictures (the AFTER side the spec asserts).
  const cfg = JSON.parse(await page.locator('#pageFeedbackConfig').textContent());
  const types = JSON.parse(await page.locator('#pageFeedbackTypes').textContent());
  const u = new URL(openedUrl);
  metrics.repository = cfg.repository;
  metrics.mode = cfg.mode;
  metrics.aiAvailable = cfg.ai?.available ?? false;
  metrics.requestTypes = types.length;
  metrics.defaultLabels = cfg.defaultLabels;
  metrics.exampleType = 'fix-page';
  metrics.exampleLabels = (u.searchParams.get('labels') || '').split(',');
  metrics.exampleTitle = u.searchParams.get('title');
  metrics.issueUrlLength = openedUrl.length;
  metrics.bodyIncludesPageContext = /Page context/.test(u.searchParams.get('body') || '');
  metrics.bodyIncludesLogs = /Console.*logs/.test(u.searchParams.get('body') || '');

  // 04 — mobile bottom-sheet.
  const mctx = await browser.newContext({ viewport: { width: 375, height: 780 } });
  const mp = await mctx.newPage();
  await mp.addInitScript(SEED_CONSENT);
  await mp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await mp.locator('#pageFeedbackFab').click();
  await mp.waitForTimeout(300);
  await mp.locator('.pf-type[data-pf-type-id="improve-page"]').click();
  await mp.locator('#pfDescription').fill('Tighten the intro copy — it buries the lede.');
  await mp.waitForTimeout(150);
  await shot(mp, '05-mobile-sheet.png');

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
  fs.writeFileSync(`${outDir}/example-issue-url.txt`, openedUrl + '\n');
  console.log('page-feedback evidence written to', outDir);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
