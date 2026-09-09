// Feature: ZER0-087
// =============================================================================
// site-builder-providers-evidence.mjs — evidence for the multi-provider,
// bring-your-own-token, open-session Site Builder (ZER0-087)
// =============================================================================
// What changed on the page (_includes/setup/wizard.html + claude-session.html
// + assets/js/site-builder.js): the Connect step grew provider cards (Claude /
// Grok), a token form, a model select, an image-renderer select and a session
// mode switch; the side panel became an "AI session" that names the connected
// provider; the Build step gained an existing-site picker and a jekyll build
// action. This kit captures:
//
//   01  BEFORE/AFTER of the Connect step — BEFORE from the base branch when
//       BEFORE_URL is set (the autogen lane serves it on :4001), else omitted
//   02  the Connect step with the proxy MOCKED online holding a Grok key:
//       "needs a token" for Claude, then Grok selected → "Grok connected", the
//       Grok model list, the session/open-mode chips
//   03  the Build step with the existing-site picker and jekyll build button
//   04  the mobile stack of the Connect step
//
// The proxy is mocked with page.route (same shape as the smoke spec) so the
// evidence needs no credential and no running dev proxy; the real proxy is
// exercised by test/test_providers.mjs and the manual walkthrough.
//
// Usage (server up — see the run-zer0-mistakes skill):
//   BASE_URL=http://localhost:4000 node test/visual/site-builder-providers-evidence.mjs
//   BEFORE_URL=http://localhost:4001 … for the base-branch BEFORE panel
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:4000').replace(/\/+$/, '');
const BEFORE = (process.env.BEFORE_URL || '').replace(/\/+$/, '');
const slug = 'site-builder-providers';
const outDir = process.env.OUT_DIR || `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// The site navbar is position:fixed; an element screenshot of a tall card
// scrolls the page and would bake the bar into the middle of the crop.
const HIDE_CHROME = 'header#navbar, .cookie-consent, #backToTopBtn { visibility: hidden !important; }';

const SEED = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0' }));
    localStorage.removeItem('zer0-setup-draft');
    localStorage.removeItem('zer0-site-builder-prefs');
    sessionStorage.removeItem('zer0-site-builder-transcript');
  } catch (e) { /* ignore */ }
};

function statusFor(provider) {
  const has = (id) => id === provider;
  return {
    ok: true,
    auth: has('xai') ? { provider: 'xai', label: 'Grok', vendor: 'xAI', kind: 'api_key', source: 'session', masked: '••••c3f9', model: 'grok-4.6', pinned: false } : { provider: 'anthropic', label: 'Claude', vendor: 'Anthropic', kind: 'oauth_static', source: 'env', masked: '••••ab12', model: 'claude-opus-4-8', pinned: false },
    providerPin: 'auto',
    providers: {
      anthropic: { id: 'anthropic', label: 'Claude', vendor: 'Anthropic', configured: has('anthropic'), kind: has('anthropic') ? 'oauth_static' : null, source: has('anthropic') ? 'env' : null, masked: has('anthropic') ? '••••ab12' : '', models: ['claude-opus-4-8', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'], defaultModel: 'claude-opus-4-8', model: 'claude-opus-4-8', pinned: false },
      xai: { id: 'xai', label: 'Grok', vendor: 'xAI', configured: has('xai'), kind: has('xai') ? 'api_key' : null, source: has('xai') ? 'session' : null, masked: has('xai') ? '••••c3f9' : '', models: ['grok-4.6', 'grok-4.5', 'grok-4.3'], defaultModel: 'grok-4.6', model: 'grok-4.6', pinned: false },
    },
    image: { providers: { xai: { id: 'xai', label: 'Grok Imagine', vendor: 'xAI', configured: has('xai'), source: has('xai') ? 'session' : null, masked: has('xai') ? '••••c3f9' : '', models: ['grok-imagine-image-2.0'], model: 'grok-imagine-image-2.0', aspectRatios: ['1:1', '16:9'], sizes: [] }, openai: { id: 'openai', label: 'OpenAI Images', vendor: 'OpenAI', configured: false, source: null, masked: '', models: ['gpt-image-2'], model: 'gpt-image-2', aspectRatios: [], sizes: [] } }, default: has('xai') ? 'xai' : null },
    credentials: { accepted: true, persistAllowed: true, envFile: '/Users/you/zer0-mistakes/.env' },
    checks: ['docker', 'git'],
    scaffold: { root: '/Users/you/sites', theme: '/Users/you/zer0-mistakes' },
    compose: ['up', 'ps', 'logs', 'down', 'config', 'build'],
    projectCommands: ['git-status', 'git-diff', 'git-log', 'git-init'],
    projects: [{ name: 'postgres-in-production', abs: '/Users/you/sites/postgres-in-production', site: true, compose: true, mtime: 2 }, { name: 'garden', abs: '/Users/you/sites/garden', site: true, compose: false, mtime: 1 }],
    maxTokensCap: 8192,
    localEdit: true,
    model: has('xai') ? 'grok-4.6' : 'claude-opus-4-8',
  };
}

async function mockProxy(page, provider) {
  await page.route('**/api/wizard/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (url.pathname.endsWith('/status')) return json(statusFor(provider));
    if (url.pathname.endsWith('/target')) { const b = route.request().postDataJSON(); return json({ ok: true, abs: '/Users/you/sites/' + b.target, exists: true, empty: false, root: '/Users/you/sites' }); }
    if (url.pathname.includes('/project/tree')) return json({ ok: true, path: '.', entries: ['_config.yml', '_config_dev.yml', 'docker-compose.yml', 'index.md', 'pages/', 'pages/_posts/2026-09-05-welcome.md', 'assets/', 'assets/css/user-overrides.css'], truncated: false });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS', 'access-control-allow-headers': 'content-type' } });
    return json({ ok: false, error: { message: 'not mocked' } });
  });
}

async function connectShot(page, base, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${base}/setup/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_CHROME });
  await page.waitForTimeout(600);
  const card = page.locator('#step-connect .card');
  return card.screenshot();
}

const browser = await chromium.launch();
const metrics = { slug, base: BASE, before: BEFORE || null, captured: [], connect: {}, build: {} };
let n = 0;
const next = () => String(++n).padStart(2, '0');
try {
  // 01 — Connect step, before (base branch) vs after (this PR), offline.
  const rows = [];
  if (BEFORE) {
    const pb = await browser.newPage();
    await pb.addInitScript(SEED);
    await pb.route('**/api/wizard/**', (r) => r.abort('connectionrefused'));
    rows.push({ label: 'BEFORE — base branch: one path only (Claude Code OAuth token in .env, proxy refuses to start without it)', img: await connectShot(pb, BEFORE, 1280), w: 780 });
    await pb.close();
  }
  const pa = await browser.newPage();
  await pa.addInitScript(SEED);
  await pa.route('**/api/wizard/**', (r) => r.abort('connectionrefused'));
  rows.push({ label: 'AFTER — this PR: Claude or Grok cards, bring-your-own token, model + image renderer, guided or open session (proxy offline → every control inert)', img: await connectShot(pa, BASE, 1280), w: 780 });
  metrics.connect.providerCards = await pa.locator('input[name="sb_provider"]').count();
  metrics.connect.modeOptions = await pa.locator('input[name="sb_mode"]').count();
  metrics.connect.tokenFieldType = await pa.locator('#sb-token').getAttribute('type');
  metrics.connect.offlineDisabled = await pa.locator('#sb-token:disabled, #sb-token-use:disabled, #sb-model:disabled, #sb-image-provider:disabled').count();
  await pa.close();
  const f1 = `${outDir}/${next()}-connect-before-after.png`;
  await montage(browser, { title: 'Site Builder · Connect step — bring your own AI provider', note: 'Offline state on both branches so the markup itself is compared.', rows, width: 860 }, f1);
  metrics.captured.push(f1);

  // 02 — Connect step with the proxy holding a Grok key: needs a token → Grok connected.
  const p2 = await browser.newPage();
  await p2.addInitScript(SEED);
  await mockProxy(p2, 'xai');
  await p2.setViewportSize({ width: 1440, height: 960 });
  await p2.goto(`${BASE}/setup/`, { waitUntil: 'networkidle' });
  await p2.addStyleTag({ content: HIDE_CHROME });
  await p2.waitForSelector('#siteBuilderPanel[data-state="online"]', { timeout: 10000 });
  await p2.waitForTimeout(300);
  // The only configured provider is picked automatically; select the keyless
  // one to show the "needs a token" state, then switch back.
  await p2.locator('label[for="sb-provider-anthropic"]').click();
  await p2.waitForSelector('#siteBuilderPanel[data-ready="false"]', { timeout: 5000 });
  await p2.waitForTimeout(200);
  const needs = await p2.locator('#step-connect .card').screenshot();
  metrics.connect.badgeBeforePick = await p2.locator('#sb-status-badge').textContent();
  await p2.locator('label[for="sb-provider-xai"]').click();
  await p2.waitForSelector('#siteBuilderPanel[data-ready="true"]', { timeout: 5000 });
  await p2.locator('label[for="sb-mode-open"]').click();
  await p2.waitForTimeout(300);
  const grok = await p2.locator('#step-connect .card').screenshot();
  const panel = await p2.locator('#siteBuilderPanel').screenshot();
  metrics.connect.badgeAfterPick = await p2.locator('#sb-status-badge').textContent();
  metrics.connect.models = await p2.locator('#sb-model option').evaluateAll((els) => els.map((o) => o.value));
  metrics.connect.openChips = await p2.locator('#sb-chips .sb-chip').count();
  await p2.close();
  const f2 = `${outDir}/${next()}-connect-grok-session.png`;
  await montage(browser, {
    title: 'Connect step with the dev proxy holding a Grok key (mocked)',
    note: `Badge before picking Grok: "${metrics.connect.badgeBeforePick}" · after: "${metrics.connect.badgeAfterPick}" · models: ${metrics.connect.models.join(', ')}`,
    rows: [
      { label: 'Proxy online; Claude selected but keyless → "needs a token", composer locked; the Grok card shows its masked session key', img: needs, w: 800 },
      { label: 'Grok selected + open session → Grok connected, Grok models, open-session prompts', img: grok, w: 800 },
      { label: 'The side panel names the provider and the mode; Stop replaces Send while a run is busy', img: panel, w: 420 },
    ],
    width: 880,
  }, f2);
  metrics.captured.push(f2);

  // 03 — Build step: existing-site picker + jekyll build, then a project opened.
  const p3 = await browser.newPage();
  await p3.addInitScript(SEED);
  await mockProxy(p3, 'anthropic');
  await p3.setViewportSize({ width: 1440, height: 960 });
  await p3.goto(`${BASE}/setup/`, { waitUntil: 'networkidle' });
  await p3.addStyleTag({ content: HIDE_CHROME });
  await p3.waitForSelector('#siteBuilderPanel[data-ready="true"]', { timeout: 10000 });
  await p3.locator('#tab-build').click();
  await p3.waitForTimeout(300);
  const buildBefore = await p3.locator('#step-build .card').screenshot();
  await p3.locator('#sb-project-select').selectOption('postgres-in-production');
  await p3.locator('#btn-project-open').click();
  await p3.waitForSelector('.sb-card--result', { timeout: 5000 });
  await p3.waitForTimeout(300);
  const buildAfter = await p3.locator('#step-build .card').screenshot();
  const panelAfter = await p3.locator('#siteBuilderPanel').screenshot();
  metrics.build.projects = await p3.locator('#sb-project-select option').count() - 1;
  metrics.build.target = await p3.locator('#cfg-target').inputValue();
  metrics.build.buildButton = await p3.locator('#btn-compose-build').isEnabled();
  await p3.close();
  const f3 = `${outDir}/${next()}-build-existing-site.png`;
  await montage(browser, {
    title: 'Build step — modify an existing site',
    note: `${metrics.build.projects} sites listed by the (mocked) proxy · Open → target "${metrics.build.target}" · jekyll build enabled: ${metrics.build.buildButton}`,
    rows: [
      { label: 'Existing-site picker above the project folder; jekyll build beside docker compose up', img: buildBefore, w: 800 },
      { label: 'After Open: the folder becomes the working project and the panel shows its file count with jekyll build / git status shortcuts', img: buildAfter, w: 800 },
      { label: 'Working-project card in the session panel', img: panelAfter, w: 420 },
    ],
    width: 880,
  }, f3);
  metrics.captured.push(f3);

  // 04 — mobile stack.
  const p4 = await browser.newPage();
  await p4.addInitScript(SEED);
  await p4.route('**/api/wizard/**', (r) => r.abort('connectionrefused'));
  await p4.setViewportSize({ width: 390, height: 844 });
  await p4.goto(`${BASE}/setup/`, { waitUntil: 'networkidle' });
  await p4.addStyleTag({ content: HIDE_CHROME });
  await p4.waitForTimeout(400);
  const mobile = await p4.locator('#step-connect .card').screenshot();
  metrics.connect.mobileOverflow = await p4.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await p4.close();
  const f4 = `${outDir}/${next()}-connect-mobile.png`;
  await montage(browser, { title: 'Connect step at 390px', note: `horizontal page overflow: ${metrics.connect.mobileOverflow}px`, rows: [{ label: 'Provider cards, token form and mode switch stack; nothing widens the page', img: mobile, w: 360 }], width: 420 }, f4);
  metrics.captured.push(f4);

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, `(evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — Connect step: ${metrics.connect.providerCards} provider cards, ${metrics.connect.modeOptions} session modes, token field is a password input inert offline; mocked proxy: "${metrics.connect.badgeBeforePick}" → "${metrics.connect.badgeAfterPick}"; Build: ${metrics.build.projects} existing sites listed, Open sets the target)\n`);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
