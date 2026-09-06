// Feature: ZER0-086
// =============================================================================
// site-builder-evidence.mjs — evidence for the Claude-guided Site Builder
// =============================================================================
// Captures the AFTER states of the new nine-step Site Builder at /setup/
// (_includes/setup/wizard.html + assets/js/setup-wizard.js + site-builder.js).
// The BEFORE was the five-step _config.yml form (PR #432); its shape is
// documented in test/visual/evidence/setup-wizard-nav-alignment/ and the README
// here, so this kit screenshots the substantive AFTER: the offline Connect
// step, a connected Claude panel when the dev proxy is up, the Prerequisites
// checklist, Structure with the navigation editor, Appearance skin cards, the
// Build step with its actions, and the mobile stack.
//
// Usage (server already up — see the run-zer0-mistakes skill):
//   BASE_URL=http://localhost:4000 node test/visual/site-builder-evidence.mjs
// With the dev proxy running on :8787 the connected states are captured too.
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const outDir = 'test/visual/evidence/site-builder';
fs.mkdirSync(outDir, { recursive: true });

const SEED_CONSENT = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({ necessary: true, analytics: false, timestamp: Date.now(), version: '1.0' }));
    localStorage.removeItem('zer0-setup-draft');
  } catch (e) { /* ignore */ }
};

const shot = (page, name, opts) => page.screenshot(Object.assign({ path: `${outDir}/${name}` }, opts || {}));
const step = async (page, id) => {
  await page.locator(`#tab-${id}`).click();
  await page.waitForTimeout(250);
};

const browser = await chromium.launch();
const metrics = { base: BASE, captured: [], steps: {}, proxy: null };
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.goto(`${BASE}/setup/`, { waitUntil: 'networkidle' });
  if (!(await page.locator('#setup-wizard').count())) {
    throw new Error('/setup/ did not render the wizard — build with _config_dev.yml');
  }
  await page.waitForTimeout(1200); // give the status probe time to settle

  metrics.proxy = await page.locator('#siteBuilderPanel').getAttribute('data-state');
  metrics.steps.count = await page.locator('#wizardTabs .wizard-step').count();

  // 01 — Connect step (offline or online depending on the proxy).
  await shot(page, `01-connect-${metrics.proxy}.png`, { fullPage: false });
  metrics.captured.push(`01-connect-${metrics.proxy}.png`);

  // 02 — Prerequisites with two manual toggles.
  await step(page, 'prereqs');
  await page.locator('#prereq-git').check();
  await page.locator('#prereq-gh').check();
  if (metrics.proxy === 'online') {
    await page.locator('#btn-run-checks').click();
    await page.waitForTimeout(6000);
  }
  await shot(page, '02-prerequisites.png');
  metrics.captured.push('02-prerequisites.png');
  metrics.steps.prereqSummary = await page.locator('#prereq-summary').textContent();

  // 03 — Identity filled, preview reflecting it.
  await step(page, 'identity');
  await page.locator('#cfg-brief').fill('A field guide to running PostgreSQL in production, written for backend engineers who suddenly own the database.');
  await page.locator('#cfg-title').fill('Postgres in Production');
  await page.locator('#cfg-subtitle').fill('Notes from the on-call rotation');
  await page.locator('#cfg-description').fill('Practical, battle-tested guidance on running PostgreSQL in production: backups, replication, upgrades, and the incidents that teach you.');
  await page.locator('#cfg-author').fill('Sam Rivera');
  await page.locator('#cfg-email').fill('sam@example.com');
  await page.waitForTimeout(300);
  await shot(page, '03-identity.png');
  metrics.captured.push('03-identity.png');

  // 04 — URLs with Suggest.
  await step(page, 'urls');
  await page.locator('#cfg-github-user').fill('samrivera');
  await page.locator('#cfg-repo-name').fill('postgres-in-production');
  await page.locator('#btn-suggest-urls').click();
  await page.waitForTimeout(300);
  await shot(page, '04-urls.png');
  metrics.captured.push('04-urls.png');
  metrics.steps.url = await page.locator('#cfg-url').inputValue();
  metrics.steps.baseurl = await page.locator('#cfg-baseurl').inputValue();

  // 05 — Structure: site type, navigation shape, landing template, page planner.
  await step(page, 'structure');
  await page.locator('label[for="site-type-mixed"]').click();
  await page.waitForTimeout(300);
  await shot(page, '05-structure.png');
  metrics.captured.push('05-structure.png');
  metrics.steps.navRows = await page.locator('#nav-editor .nav-row').count();

  // 05b — the site plan's structural half: a grouped navbar, the docs sidebar
  // tree, a docs-hub landing page, and two planned example pages.
  await page.locator('label[for="nav-style-grouped"]').click();
  await page.locator('#cfg-sidebar-mode').selectOption('docs');
  await page.locator('label[for="landing-docs-hub"]').click();
  for (const [collection, title] of [['docs', 'Backups and restores'], ['posts', 'The incident that taught us WAL']]) {
    await page.locator('#btn-page-add').click();
    const row = page.locator('#pages-planner .page-row').last();
    await row.locator('.page-collection').selectOption(collection);
    await row.locator('.page-title').fill(title);
  }
  await page.locator('#pages-planner').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, '05b-site-plan.png');
  metrics.captured.push('05b-site-plan.png');
  metrics.steps.plan = await page.evaluate(() => {
    const p = window.Zer0SetupWizard.getPlan();
    return { template: p.landing.template, nav: p.navigation.style, sidebar: p.navigation.sidebar, pages: p.pages.map((x) => `${x.collection}/${x.slug}`) };
  });

  // 05c — the landing data file the plan generates.
  await page.locator('.wizard-file-tab[data-file="_data/landing.yml"]').click();
  await page.waitForTimeout(250);
  await shot(page, '05c-landing-yml.png');
  metrics.captured.push('05c-landing-yml.png');

  // 06 — Appearance with the skin preview on.
  await step(page, 'appearance');
  await page.locator('label[for="skin-aqua"]').click();
  await page.locator('#btn-skin-preview').click();
  await page.waitForTimeout(400);
  await shot(page, '06-appearance-preview-aqua.png');
  metrics.captured.push('06-appearance-preview-aqua.png');
  metrics.steps.previewSkin = await page.evaluate(() => document.documentElement.getAttribute('data-theme-skin'));

  // 06b — the plan's theme overrides (palette · fonts · corners), which sit
  // below the fold on the skin shot. The live preview is still on, so the page
  // itself carries the palette and web font being chosen.
  await page.locator('label[for="palette-ocean"]').click();
  await page.locator('#cfg-fonts').selectOption('playfair-lato');
  await page.locator('label[for="radius-round"]').click();
  await page.locator('#cfg-fonts').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700); // let the web font load and repaint
  await shot(page, '06b-appearance-palette-fonts.png');
  metrics.captured.push('06b-appearance-palette-fonts.png');
  metrics.steps.overrides = await page.evaluate(() => ({
    primary: getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim(),
    body: getComputedStyle(document.body).fontFamily,
  }));

  // 06c — the stylesheet those choices generate.
  await page.locator('.wizard-file-tab[data-file="assets/css/user-overrides.css"]').click();
  await page.waitForTimeout(250);
  await shot(page, '06c-user-overrides-css.png');
  metrics.captured.push('06c-user-overrides-css.png');
  await page.locator('#btn-skin-preview').click();

  // 07 — Voice.
  await step(page, 'voice');
  await page.locator('label[for="tone-technical"]').click();
  await page.locator('#cfg-welcome-title').fill('Why another Postgres site?');
  await page.locator('#cfg-welcome-body').fill('Because most guides stop at `CREATE DATABASE`. This one starts at 3 a.m. when replication lag is climbing.');
  await page.waitForTimeout(300);
  // The planned example pages also live under pages/_posts/, so target the
  // welcome post by name rather than by prefix.
  await page.locator('.wizard-file-tab[data-file$="-welcome.md"]').first().click();
  await page.waitForTimeout(200);
  await shot(page, '07-voice-welcome-post.png');
  metrics.captured.push('07-voice-welcome-post.png');

  // 08 — Integrations.
  await step(page, 'integrations');
  await page.locator('#int-giscus').check();
  await page.waitForTimeout(200);
  await shot(page, '08-integrations.png');
  metrics.captured.push('08-integrations.png');

  // 09 — Build step (+ connected write/compose when the proxy is up).
  await step(page, 'build');
  await page.locator('.wizard-file-tab[data-file="_config.yml"]').click();
  await page.locator('#cfg-target').fill('postgres-in-production');
  if (metrics.proxy === 'online') {
    await page.locator('#btn-target-check').click();
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(200);
  await shot(page, '09-build.png');
  metrics.captured.push('09-build.png');
  metrics.steps.targetNote = await page.locator('#target-resolved').textContent();
  metrics.steps.files = await page.locator('.wizard-file-tab').evaluateAll((els) => els.map((e) => e.getAttribute('data-file')));

  if (metrics.proxy === 'online') {
    // Write the project through the proxy (confirmation card → Write project).
    await page.locator('#btn-write-project').click();
    await page.waitForTimeout(400);
    await shot(page, '10-write-confirmation-card.png');
    metrics.captured.push('10-write-confirmation-card.png');
    await page.locator('.sb-card .btn-primary').last().click();
    await page.waitForTimeout(1500);
    await shot(page, '11-project-written.png');
    metrics.captured.push('11-project-written.png');
    metrics.steps.writeCard = await page.locator('.sb-card--result').last().textContent();
  }

  // 12 — Mobile stack.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mobile.newPage();
  await mpage.addInitScript(SEED_CONSENT);
  await mpage.goto(`${BASE}/setup/#step-appearance`, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(600);
  metrics.mobileOverflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await shot(mpage, '12-mobile-appearance.png', { fullPage: false });
  metrics.captured.push('12-mobile-appearance.png');
  await mobile.close();

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
    `(evidence: [\`test/visual/evidence/site-builder/\`](test/visual/evidence/site-builder/README.md) — ${metrics.steps.count} steps, ${metrics.steps.files.length} generated files, proxy ${metrics.proxy}, mobile overflow ${metrics.mobileOverflow}px)\n`);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
