// Feature: ZER0-086
// =============================================================================
// site-builder-walkthrough.mjs — end-to-end Site Builder runs on random briefs
// =============================================================================
// Drives the wizard the way a first-time user would, in a real browser, with
// VIDEO recording on and a screenshot after every meaningful moment — for one
// or more randomly sampled site-build SCENARIOS (blog, docs, cookbook,
// portfolio, digital garden, blog + docs; see site-builder-scenarios.mjs):
//
//   connect → live prerequisite checks → type the brief and let Claude draft
//   the identity (accepting its confirmation card) → URLs → structure →
//   appearance → voice (Claude drafts the welcome post + about page) →
//   integrations → build: check target, write the project, docker compose up,
//   wait until the NEW site answers, assert its routes/title/skin, ask Claude a
//   framework question that needs read_theme_file, compose down.
//
// Because the inputs are random and the drafts come from a live model, every
// assertion is STRUCTURAL (a title exists, the description has a sane length,
// the expected files were generated, the site answers on its routes with the
// chosen skin) rather than a fixed transcript. The seed is printed and stored,
// so `SEED=<n> SCENARIO=<id>` replays a run exactly.
//
// This talks to the real Claude API through the local dev proxy (your Claude
// Code OAuth token) and really builds Jekyll sites with Docker, so a scenario
// takes 5–10 minutes and needs network access.
//
// Outputs (git-ignored): test/visual-results/site-builder-walkthrough/<stamp>/
//   report.md, report.json            pass/fail per assertion, per scenario
//   <scenario>/NN-*.png               screenshots
//   <scenario>/video-desktop.webm     the whole desktop run
//   <scenario>/video-mobile.webm      a short mobile pass (first scenario only)
//   <scenario>/run.json               timings, Claude replies, site facts
//
// Usage (theme on :4000, proxy on :8787 — see the run-zer0-mistakes skill):
//   BASE_URL=http://localhost:4000 node test/visual/site-builder-walkthrough.mjs
//   SCENARIO=cookbook SEED=42 node test/visual/site-builder-walkthrough.mjs
//   SCENARIO=all COUNT=6 SITE_PORT=4100 node test/visual/site-builder-walkthrough.mjs
//   SCENARIO=blog,docs node …            # explicit list
// Env: BASE_URL, SCENARIO (random|all|id[,id]), COUNT (default 1), SEED,
//      SITE_PORT (base; each scenario uses base + 10·i), OUT_DIR, SKIP_MOBILE=1,
//      KEEP_SITES=1 (leave the generated containers running).
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { buildScenario, chooseScenarioIds, makeRng } from './site-builder-scenarios.mjs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const BASE_PORT = Number(process.env.SITE_PORT) || 4100;
const SEED = Number(process.env.SEED) || (Date.now() % 1_000_000_007);
const COUNT = Math.max(1, Number(process.env.COUNT) || 1);
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = process.env.OUT_DIR || `test/visual-results/site-builder-walkthrough/${stamp}`;
fs.mkdirSync(OUT, { recursive: true });

const rng = makeRng(SEED);
const ids = chooseScenarioIds(process.env.SCENARIO || 'random', COUNT, rng);
console.log(`seed=${SEED} scenarios=${ids.join(',')} out=${OUT}`);

const t0 = Date.now();
const log = (msg) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);

// Init scripts re-run on EVERY navigation — including a LiveReload refresh the
// dev server may trigger mid-run — so this one must be idempotent and must not
// wipe the wizard's draft (that would reset the form in the middle of a
// scenario). Consent is seeded here; the draft/transcript are cleared exactly
// once, in freshWizard(), before the first real load.
const SEED_STORAGE = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0' }));
  } catch (e) { /* ignore */ }
};

async function freshWizard(page) {
  await page.goto(`${BASE}/setup/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try { localStorage.removeItem('zer0-setup-draft'); sessionStorage.removeItem('zer0-site-builder-transcript'); } catch (e) { /* ignore */ }
  });
  await page.goto(`${BASE}/setup/`, { waitUntil: 'networkidle' });
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status < 500) return { ok: true, status: r.status, seconds: +((Date.now() - started) / 1000).toFixed(1) };
    } catch (e) { /* not yet */ }
    await new Promise((res) => setTimeout(res, 3000));
  }
  return { ok: false, seconds: +((Date.now() - started) / 1000).toFixed(1) };
}

// -----------------------------------------------------------------------------
// One scenario, one browser context, one video.
// -----------------------------------------------------------------------------
async function runScenario(browser, sc, dir, { mobile }) {
  fs.mkdirSync(dir, { recursive: true });
  const run = { scenario: sc, startedAt: new Date().toISOString(), steps: [], claude: [], shots: [], pageErrors: [], checks: [] };
  const s0 = Date.now();
  let n = 0;
  const check = (name, ok, detail) => { run.checks.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail).slice(0, 300) }); log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail !== undefined ? ' — ' + String(detail).slice(0, 160) : ''}`); };
  const mark = (step, note) => { run.steps.push({ step, note, at: +((Date.now() - s0) / 1000).toFixed(1) }); log(`${sc.id}/${step}: ${note}`); };
  async function shot(page, name, opts) {
    n += 1;
    const file = `${String(n).padStart(2, '0')}-${name}.png`;
    await page.screenshot(Object.assign({ path: path.join(dir, file) }, opts || {})).catch((e) => log('shot failed ' + e.message));
    run.shots.push(file);
  }
  async function step(page, id) { await page.locator(`#tab-${id}`).click(); await page.waitForTimeout(400); }

  /** Wait for Claude's turn to end, accepting confirmation cards as they appear. */
  async function waitForClaude(page, label, timeoutMs = 240000) {
    const started = Date.now();
    let accepted = 0;
    let sawBusy = false;
    while (Date.now() - started < timeoutMs) {
      const card = page.locator('.sb-card:not(.sb-card--resolved):not(.sb-card--result) .btn-primary');
      if (await card.count()) {
        await page.waitForTimeout(600);
        await shot(page, `claude-card-${label}-${accepted + 1}`);
        await card.first().click();
        accepted += 1;
        await page.waitForTimeout(400);
        continue;
      }
      const busy = await page.evaluate(() => !!document.getElementById('sbTyping') || !!document.getElementById('sb-input')?.disabled);
      if (busy) sawBusy = true;
      if (!busy && sawBusy) break;
      if (!busy && Date.now() - started > 8000) break;
      await page.waitForTimeout(500);
    }
    const bubbles = page.locator('.sb-message--assistant .sb-bubble');
    const last = (await bubbles.count()) ? await bubbles.last().innerText() : '';
    const entry = { label, accepted, seconds: +((Date.now() - started) / 1000).toFixed(1), reply: last.slice(0, 700) };
    run.claude.push(entry);
    log(`claude/${label}: ${entry.seconds}s, ${accepted} card(s)`);
    return entry;
  }
  async function ask(page, text, label) {
    await page.locator('#sb-input').fill(text);
    await page.locator('#sb-send').click();
    return waitForClaude(page, label);
  }
  const composeWait = (page, timeout) => page.waitForFunction(() => /\[exit\]/.test(document.getElementById('wizard-terminal')?.textContent || ''), null, { timeout });
  const acceptCard = async (page) => { await page.waitForSelector('.sb-card:not(.sb-card--resolved) .btn-primary', { timeout: 15000 }); await page.locator('.sb-card:not(.sb-card--resolved) .btn-primary').first().click(); };

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  await page.addInitScript(SEED_STORAGE);
  page.on('pageerror', (e) => { run.pageErrors.push(e.message); log('PAGE ERROR ' + e.message); });

  try {
    // ── 1. Connect ───────────────────────────────────────────────────────
    await freshWizard(page);
    await page.waitForSelector('#setup-wizard');
    await page.waitForFunction(() => document.getElementById('siteBuilderPanel')?.getAttribute('data-state') === 'online', null, { timeout: 20000 }).catch(() => {});
    const online = (await page.locator('#siteBuilderPanel').getAttribute('data-state')) === 'online';
    check('proxy online', online);
    mark('connect', online ? 'online' : 'OFFLINE');
    await page.waitForTimeout(600);
    await shot(page, 'connect');
    if (!online) throw new Error('dev proxy offline — start node --env-file=.env templates/deploy/chat-proxy/dev-proxy.mjs');

    // ── 2. Prerequisites — live checks ───────────────────────────────────
    await page.locator('#step-connect .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator('#btn-run-checks').click();
    await page.waitForFunction(() => document.querySelectorAll('.prereq-item[data-state="unknown"]').length === 0, null, { timeout: 60000 }).catch(() => {});
    const states = await page.locator('.prereq-item').evaluateAll((els) => els.map((e) => ({ id: e.dataset.prereq, required: e.dataset.required === 'true', state: e.dataset.state })));
    run.prereqs = states;
    check('required prerequisites ready', states.filter((s) => s.required).every((s) => s.state === 'ok' || s.state === 'manual'), states.map((s) => `${s.id}=${s.state}`).join(' '));
    await shot(page, 'prereqs-checked');

    // ── 3. Identity — Claude drafts from the brief ───────────────────────
    await page.locator('#step-prereqs .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator('#cfg-brief').fill(sc.brief);
    await page.locator('#cfg-author').fill(sc.author);
    await page.locator('#cfg-email').fill(sc.email);
    await shot(page, 'identity-brief');
    await page.locator('#step-identity .sb-ask').click();
    let identity = await waitForClaude(page, 'identity');
    const claudeErrored = (r) => /something went wrong|revoked|rate limit|unavailable/i.test(r.reply || '');
    if (!identity.accepted && !claudeErrored(identity)) identity = await ask(page, 'Please apply those values to the wizard now with set_wizard_fields (title, subtitle, tagline, description).', 'identity-retry');
    let idf = await page.evaluate(() => ({ title: document.getElementById('cfg-title').value, subtitle: document.getElementById('cfg-subtitle').value, tagline: document.getElementById('cfg-tagline').value, description: document.getElementById('cfg-description').value }));
    run.identity = idf;
    run.claudeUnavailable = claudeErrored(identity);
    check('Claude applied identity fields', identity.accepted >= 1 && idf.title.trim().length > 0 && idf.title !== 'My Site', claudeErrored(identity) ? 'Claude error: ' + identity.reply.slice(0, 120) : JSON.stringify(idf));
    if (!idf.title.trim()) {
      // The agent is non-deterministic (and may be unavailable). Fall back to
      // deterministic values so the rest of the build is still exercised; the
      // check above already recorded that the agent did not deliver.
      await page.evaluate((f) => window.Zer0SetupWizard.applyFields(f, { source: 'walkthrough-fallback' }), sc.fallback);
      idf = await page.evaluate(() => ({ title: document.getElementById('cfg-title').value, subtitle: document.getElementById('cfg-subtitle').value, tagline: document.getElementById('cfg-tagline').value, description: document.getElementById('cfg-description').value }));
      run.identity = Object.assign({ fallback: true }, idf);
      log('identity: using deterministic fallback values');
    }
    check('description length 60–220', idf.description.length >= 60 && idf.description.length <= 220, `${idf.description.length} chars`);
    await shot(page, 'identity-drafted');

    // ── 4. URLs ──────────────────────────────────────────────────────────
    await page.locator('#step-identity .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator('#cfg-github-user').fill(sc.handle);
    await page.locator('#cfg-repo-name').fill(sc.repo);
    await page.locator('#btn-suggest-urls').click();
    await page.locator(`label[for="deploy-${sc.deployTarget}"]`).click();
    await page.locator('#cfg-permalink').selectOption(sc.permalink);
    await page.locator('#cfg-port').fill(String(sc.port));
    await page.locator('#cfg-port').dispatchEvent('input');
    await page.waitForTimeout(300);
    const urlv = await page.locator('#cfg-url').inputValue();
    const basev = await page.locator('#cfg-baseurl').inputValue();
    check('Suggest derived url/baseurl', urlv === `https://${sc.handle}.github.io` && basev === `/${sc.repo}`, `${urlv} ${basev}`);
    await shot(page, 'urls');

    // ── 5. Structure ─────────────────────────────────────────────────────
    await page.locator('#step-urls .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator(`label[for="site-type-${sc.siteType}"]`).click();
    await page.waitForTimeout(300);
    for (const item of sc.extraNav) {
      await page.locator('#btn-nav-add').click();
      const row = page.locator('#nav-editor .nav-row').last();
      await row.locator('.nav-title').fill(item.title);
      await row.locator('.nav-url').fill(item.url);
      await row.locator('.nav-icon').fill(item.icon);
    }
    const checked = await page.locator('.cfg-collection:checked').evaluateAll((els) => els.map((e) => e.dataset.col).sort());
    check('site type selected the expected collections', JSON.stringify(checked) === JSON.stringify(sc.collections.slice().sort()), checked.join(','));

    // ── 5b. Site plan — Claude designs it, or the deterministic fallback ─
    await page.locator('#step-structure .sb-ask').first().click();
    let planTurn = await waitForClaude(page, 'site-plan');
    let plan = await page.evaluate(() => window.Zer0SetupWizard.getPlan());
    const agentPlanned = planTurn.accepted >= 1 && plan.pages.length >= 3;
    check('Claude designed a site plan (landing + pages)', agentPlanned, claudeErrored(planTurn) ? 'Claude error: ' + planTurn.reply.slice(0, 120) : `${plan.pages.length} pages, template ${plan.landing.template}, hero ${plan.landing.hero ? 'custom' : 'default'}`);
    if (!agentPlanned) {
      const res = await page.evaluate((p) => window.Zer0SetupWizard.setPlan(p, { source: 'walkthrough-fallback' }), sc.fallbackPlan);
      check('fallback plan accepted by the schema validator', res.ok, res.ok ? 'ok' : (res.errors || []).join('; '));
      plan = await page.evaluate(() => window.Zer0SetupWizard.getPlan());
      log(`plan: fallback — template ${plan.landing.template}, nav ${plan.navigation.style}/${plan.navigation.sidebar}, palette ${plan.theme.palette.preset}, fonts ${plan.theme.fonts}, radius ${plan.theme.radius}, ${plan.pages.length} pages`);
    }
    run.plan = plan;
    const badPlan = await page.evaluate(() => window.Zer0SetupWizard.validatePlan({ landing: { template: 'nope' }, theme: { palette: { primary: 'red' } }, bogus: 1 }));
    check('schema validator rejects an invalid plan', badPlan.length >= 3, badPlan.join(' | ').slice(0, 200));
    await page.waitForTimeout(300);
    await shot(page, 'structure-plan');
    await page.locator('.wizard-file-tab[data-file="_data/navigation/main.yml"]').click();
    await page.waitForTimeout(300);
    await shot(page, 'structure');

    // ── 6. Appearance ────────────────────────────────────────────────────
    await page.locator('#step-structure .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator(`label[for="skin-${sc.skin}"]`).click();
    await page.locator('#btn-skin-preview').click();
    await page.waitForTimeout(500);
    check('skin preview applied to <html>', (await page.evaluate(() => document.documentElement.getAttribute('data-theme-skin'))) === sc.skin, sc.skin);
    await shot(page, `appearance-preview-${sc.skin}`);
    await page.locator('#btn-skin-preview').click();
    await page.locator('#cfg-color-mode').selectOption(sc.colorMode);
    if (sc.colorLock) await page.locator('#cfg-color-lock').check();
    if (!sc.backgrounds) await page.locator('#cfg-backgrounds').uncheck();
    await page.locator('.wizard-file-tab[data-file="_config.yml"]').click();
    await page.waitForTimeout(300);

    // ── 7. Voice — Claude drafts welcome post + about page ───────────────
    await page.locator('#step-appearance .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator(`label[for="tone-${sc.tone}"]`).click();
    await page.locator('#cfg-audience').selectOption(sc.audience);
    await page.locator('#step-voice .sb-ask').click();
    let voice = await waitForClaude(page, 'voice');
    if (!voice.accepted && !claudeErrored(voice)) voice = await ask(page, 'Please apply the welcome post and about page you wrote with set_wizard_fields (welcome_title, welcome_body, about_body).', 'voice-retry');
    let vf = await page.evaluate(() => ({ welcomeTitle: document.getElementById('cfg-welcome-title').value, welcomeChars: document.getElementById('cfg-welcome-body').value.length, aboutChars: document.getElementById('cfg-about-body').value.length }));
    run.voice = vf;
    check('Claude drafted welcome post and about page', voice.accepted >= 1 && vf.welcomeTitle.trim().length > 0 && vf.welcomeChars >= 300 && vf.aboutChars >= 150, claudeErrored(voice) ? 'Claude error: ' + voice.reply.slice(0, 120) : JSON.stringify(vf));
    if (!vf.welcomeChars) {
      await page.evaluate((f) => window.Zer0SetupWizard.applyFields(f, { source: 'walkthrough-fallback' }), sc.fallbackVoice);
      vf = await page.evaluate(() => ({ welcomeTitle: document.getElementById('cfg-welcome-title').value, welcomeChars: document.getElementById('cfg-welcome-body').value.length, aboutChars: document.getElementById('cfg-about-body').value.length }));
      run.voice = Object.assign({ fallback: true }, vf);
      log('voice: using deterministic fallback drafts');
    }
    await page.locator('.wizard-file-tab[data-file^="pages/_posts/"], .wizard-file-tab[data-file="pages/_about/index.md"]').first().click();
    await page.waitForTimeout(300);
    await shot(page, 'voice-drafted');

    // ── 8. Integrations ──────────────────────────────────────────────────
    await page.locator('#step-voice .btn-next').click();
    await page.waitForTimeout(300);
    for (const [id, on] of Object.entries(sc.integrations)) {
      const sw = page.locator(`#int-${id}`);
      if (await sw.count()) { if (on) await sw.check(); else await sw.uncheck(); }
    }
    if (sc.twitter) await page.locator('#cfg-twitter').fill(sc.twitter);
    await page.waitForTimeout(300);
    await shot(page, 'integrations');

    // ── 9. Build — write, compose up, verify ─────────────────────────────
    await page.locator('#step-integrations .btn-next').click();
    await page.waitForTimeout(300);
    await page.locator('#cfg-target').fill(sc.target);
    await page.locator('#cfg-target').dispatchEvent('input');
    await page.locator('#btn-target-check').click();
    await page.waitForTimeout(800);
    const targetNote = await page.locator('#target-resolved').innerText();
    if (/NOT empty/i.test(targetNote)) {
      // A replayed seed lands on the same folder name; replacing its files is
      // the intended behaviour for a rerun.
      await page.locator('#cfg-overwrite').check();
      log('target exists — overwrite enabled for this rerun');
    }
    const files = await page.locator('.wizard-file-tab').evaluateAll((els) => els.map((e) => e.dataset.file));
    run.files = files;
    const missing = sc.expectFiles.filter((exp) => !files.some((f) => (exp instanceof RegExp ? exp.test(f) : f === exp)));
    check('generated file set matches the site type', missing.length === 0, missing.length ? 'missing ' + missing.map(String).join(', ') : `${files.length} files`);
    // Plan-derived files.
    const planFiles = ['assets/css/user-overrides.css'];
    if (plan.landing.template !== 'minimal') planFiles.push('_data/landing.yml');
    if (plan.theme.fonts !== 'system') planFiles.push('_includes/custom/head.html');
    if (plan.navigation.sidebar === 'docs' && sc.collections.includes('docs')) planFiles.push('_data/navigation/docs.yml');
    const plannedPagePaths = plan.pages.filter((p) => sc.collections.includes(p.collection)).map((p) => (p.collection === 'posts' ? `pages/_posts/${p.date}-${p.slug}.md` : `pages/_${p.collection}/${p.slug}.md`));
    const missingPlan = planFiles.concat(plannedPagePaths).filter((f) => !files.includes(f));
    check('site plan produced its files (landing data, overrides css, fonts hook, nav tree, pages)', missingPlan.length === 0, missingPlan.length ? 'missing ' + missingPlan.join(', ') : `${planFiles.length + plannedPagePaths.length} plan files`);
    const cfgText = await page.evaluate(() => { const w = window.Zer0SetupWizard; return w ? w.getFile('_config.yml').content : ''; });
    check('_config.yml carries skin, colour mode and collections', cfgText.includes(`theme_skin               : "${sc.skin}"`) && cfgText.includes(`color_mode_default       : ${sc.colorMode}`) && sc.collections.every((c) => new RegExp(`^  ${c}:\\n    output: true`, 'm').test(cfgText)));
    // Real keys are long and alphanumeric; the `.env.example` placeholders
    // (`sk-ant-oat01-...`) are not.
    check('no credential-looking value in generated files', !/sk-ant-[A-Za-z0-9_-]{24,}|phc_[A-Za-z0-9]{20,}|gh[pou]_[A-Za-z0-9]{20,}/.test(await page.evaluate(() => window.Zer0SetupWizard.getFiles().map((f) => f.content).join('\n'))));
    await shot(page, 'build-ready');

    await page.locator('#btn-write-project').click();
    await page.waitForSelector('.sb-card:not(.sb-card--resolved) .btn-primary', { timeout: 15000 });
    await page.waitForTimeout(400);
    await shot(page, 'build-write-card');
    await page.locator('.sb-card:not(.sb-card--resolved) .btn-primary').first().click();
    await page.waitForSelector('.sb-card--result', { timeout: 30000 });
    const written = (await page.locator('.sb-card--result').last().innerText()).replace(/\s+/g, ' ');
    const m = written.match(/(\d+) written, (\d+) skipped/);
    check('every generated file was written', m && Number(m[1]) === files.length && Number(m[2]) === 0, written.slice(0, 160));
    await shot(page, 'build-written');

    await page.locator('#btn-compose-up').click();
    await acceptCard(page);
    const upStarted = Date.now();
    await composeWait(page, 15 * 60000);
    const upTail = await page.locator('#wizard-terminal').innerText();
    const upOk = /\[exit\] ok/.test(upTail);
    run.composeUp = { ok: upOk, seconds: +((Date.now() - upStarted) / 1000).toFixed(0), tail: upTail.slice(-1500) };
    check('docker compose up succeeded', upOk, upOk ? `${run.composeUp.seconds}s` : upTail.slice(-300));
    await page.waitForTimeout(500);
    await shot(page, `compose-up-${upOk ? 'ok' : 'failed'}`);

    let live = { ok: false, seconds: 0 };
    if (upOk) {
      live = await waitForHttp(`http://localhost:${sc.port}/`, 12 * 60000);
      run.live = live;
    }
    check('new site answers on its port', live.ok, live.ok ? `HTTP ${live.status} after ${live.seconds}s` : `not reachable (${live.seconds}s)`);

    await page.locator('#btn-compose-logs').click();
    await composeWait(page, 60000);
    run.composeLogsTail = (await page.locator('#wizard-terminal').innerText()).slice(-3000);
    await shot(page, 'compose-logs');
    await page.locator('#btn-check-live').click();
    await page.waitForTimeout(1200);
    await shot(page, 'is-it-live');

    // ── 10. Claude on the framework (needs read_theme_file) ──────────────
    const fw = await ask(page, 'Which theme layout renders the welcome post you generated, and where is that layout defined? Read the actual file before answering and cite the path.', 'framework-question');
    run.frameworkAnswer = fw.reply;
    check('Claude answered from theme source', /_layouts\//.test(fw.reply), fw.reply.slice(0, 160));
    if (run.claudeUnavailable) check('Claude credential valid (re-run `claude setup-token`, update .env, restart the proxy)', false, identity.reply.slice(0, 160));
    await shot(page, 'claude-framework-answer');

    // ── 11. The generated site itself ────────────────────────────────────
    if (live.ok) {
      const sitePage = await ctx.newPage();
      await sitePage.waitForTimeout(4000); // let the first full build settle
      await sitePage.goto(`http://localhost:${sc.port}/`, { waitUntil: 'networkidle', timeout: 180000 }).catch((e) => log('site home load: ' + e.message));
      await sitePage.waitForTimeout(1500);
      const facts = await sitePage.evaluate(() => ({
        title: document.title,
        skin: document.documentElement.getAttribute('data-theme-skin'),
        theme: document.documentElement.getAttribute('data-bs-theme'),
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        navLinks: [...document.querySelectorAll('nav a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('/')).slice(0, 20),
        landingTemplate: document.querySelector('[data-landing-template]')?.getAttribute('data-landing-template') || null,
        primary: getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim().toLowerCase(),
        bodyFont: getComputedStyle(document.body).fontFamily,
        fontLink: !!document.querySelector('link[href*="fonts.googleapis.com"]'),
        dropdowns: document.querySelectorAll('nav .dropdown-menu, nav [data-bs-toggle="dropdown"]').length,
      }));
      run.site = facts;
      // Plan → built site.
      if (plan.landing.template !== 'minimal') check('landing page renders the planned template', facts.landingTemplate === plan.landing.template, `data-landing-template=${facts.landingTemplate}`);
      const pal = plan.theme.palette;
      const wantPrimary = pal.preset === 'custom' ? pal.primary : (await page.evaluate((id) => (window.Zer0SetupWizard.catalog('palettes').find((p) => p.id === id) || {}).primary || null, pal.preset));
      if (wantPrimary) check('built site uses the planned palette primary colour', facts.primary === wantPrimary.toLowerCase(), `--bs-primary=${facts.primary} wanted ${wantPrimary}`);
      if (plan.theme.fonts !== 'system') check('built site loads the planned web fonts', facts.fontLink && /'?[A-Z][A-Za-z ]+'?,/.test(facts.bodyFont), `link=${facts.fontLink} body=${facts.bodyFont.slice(0, 60)}`);
      const plannedRoutes = plan.pages.filter((p) => sc.collections.includes(p.collection)).map((p) => (p.collection === 'posts' ? `/posts/${p.slug}/` : `/${p.collection}/${p.slug}/`));
      const plannedStatus = {};
      for (const r of plannedRoutes) { const res = await fetch(`http://localhost:${sc.port}${r}`).catch(() => null); plannedStatus[r] = res ? res.status : 'ERR'; }
      run.plannedRoutes = plannedStatus;
      const badPlanned = Object.entries(plannedStatus).filter(([, s]) => s !== 200);
      check('planned example pages answer 200', badPlanned.length === 0, badPlanned.length ? badPlanned.map(([r, s]) => `${r}=${s}`).join(' ') : `${plannedRoutes.length} pages`);
      // kramdown's smart quotes turn "Sam's" into "Sam’s" — compare with quotes normalised.
      const norm = (s) => String(s).toLowerCase().replace(/[‘’´`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
      check('site <title> carries the chosen title', norm(facts.title).includes(norm(idf.title).slice(0, 12)), facts.title);
      check('site uses the chosen skin', facts.skin === sc.skin, facts.skin);
      if (sc.colorMode !== 'auto') check('site uses the chosen colour mode', facts.theme === sc.colorMode, facts.theme);
      await shot(sitePage, 'new-site-home');
      await shot(sitePage, 'new-site-home-full', { fullPage: true });

      const routes = {};
      for (const route of sc.expectRoutes.concat(sc.sampleRoute ? [sc.sampleRoute] : [])) {
        const r = await fetch(`http://localhost:${sc.port}${route}`).catch(() => null);
        routes[route] = r ? r.status : 'ERR';
      }
      run.routes = routes;
      const bad = Object.entries(routes).filter(([, s]) => s !== 200);
      check('expected routes answer 200', bad.length === 0, bad.length ? bad.map(([r, s]) => `${r}=${s}`).join(' ') : Object.keys(routes).join(' '));

      // Screenshot the first collection page and a content page.
      const firstCol = sc.collections.find((c) => c !== 'about');
      if (firstCol) {
        await sitePage.goto(`http://localhost:${sc.port}/${firstCol}/`, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
        await sitePage.waitForTimeout(800);
        await shot(sitePage, `new-site-${firstCol}`);
      }
      const contentRoute = sc.sampleRoute || (sc.expectRoutes.find((r) => /getting-started|welcome-note/.test(r)));
      if (contentRoute) {
        await sitePage.goto(`http://localhost:${sc.port}${contentRoute}`, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
        await sitePage.waitForTimeout(800);
        await shot(sitePage, 'new-site-content');
      } else {
        const postLink = sitePage.locator('a[href*="/posts/"], a[href*="/20"]').first();
        if (await postLink.count()) { await postLink.click().catch(() => {}); await sitePage.waitForLoadState('networkidle').catch(() => {}); await sitePage.waitForTimeout(800); await shot(sitePage, 'new-site-post'); }
      }
      await sitePage.close();
    }

    // ── 12. Compose down ─────────────────────────────────────────────────
    if (upOk && process.env.KEEP_SITES !== '1') {
      await page.locator('#btn-compose-down').click();
      await acceptCard(page);
      await composeWait(page, 5 * 60000);
      check('docker compose down succeeded', /\[exit\] ok/.test(await page.locator('#wizard-terminal').innerText()));
      await page.waitForTimeout(500);
      await shot(page, 'compose-down');
    }
    check('no uncaught page errors in the wizard', run.pageErrors.length === 0, run.pageErrors.join(' | '));
  } catch (err) {
    run.error = err.message;
    check('scenario completed without a harness error', false, err.message);
    await shot(page, 'error').catch(() => {});
  }

  const video = page.video();
  await page.close().catch(() => {});
  await ctx.close().catch(() => {});
  if (video) { try { fs.renameSync(await video.path(), path.join(dir, 'video-desktop.webm')); } catch (e) { /* keep original name */ } }

  if (mobile) {
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, recordVideo: { dir, size: { width: 390, height: 844 } } });
    const mp = await mctx.newPage();
    await mp.addInitScript(SEED_STORAGE);
    await freshWizard(mp);
    await mp.waitForTimeout(1000);
    await shot(mp, 'mobile-connect');
    for (const id of ['prereqs', 'identity', 'appearance', 'build']) { await mp.locator(`#tab-${id}`).click(); await mp.waitForTimeout(400); await shot(mp, `mobile-${id}`); }
    run.mobileOverflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('no horizontal overflow on mobile', run.mobileOverflow === 0, `${run.mobileOverflow}px`);
    const mvideo = mp.video();
    await mp.close();
    await mctx.close();
    if (mvideo) { try { fs.renameSync(await mvideo.path(), path.join(dir, 'video-mobile.webm')); } catch (e) { /* ignore */ } }
  }

  run.finishedAt = new Date().toISOString();
  run.seconds = +((Date.now() - s0) / 1000).toFixed(1);
  run.passed = run.checks.filter((c) => c.ok).length;
  run.failed = run.checks.filter((c) => !c.ok).length;
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify(run, null, 2));
  return run;
}

// -----------------------------------------------------------------------------
// Orchestrate scenarios, write the report.
// -----------------------------------------------------------------------------
const browser = await chromium.launch();
const results = [];
try {
  for (let i = 0; i < ids.length; i += 1) {
    const sc = buildScenario(ids[i], rng, { port: BASE_PORT + i * 10 });
    if (process.env.DEPLOY_TARGET) sc.deployTarget = process.env.DEPLOY_TARGET; // force remote theme vs gem
    log(`▶ scenario ${i + 1}/${ids.length}: ${sc.id} — "${sc.brief.slice(0, 70)}…" author=${sc.author} skin=${sc.skin} tone=${sc.tone} port=${sc.port}`);
    const result = await runScenario(browser, sc, path.join(OUT, sc.id), { mobile: i === 0 && process.env.SKIP_MOBILE !== '1' });
    results.push(result);
    log(`■ ${sc.id}: ${result.passed} passed, ${result.failed} failed in ${result.seconds}s`);
  }
} finally {
  await browser.close();
}

const totalFailed = results.reduce((a, r) => a + r.failed, 0);
const lines = [];
lines.push(`# Site Builder end-to-end run — ${stamp}`);
lines.push('');
lines.push(`Seed \`${SEED}\` · scenarios: ${ids.join(', ')} · base ${BASE} · ${totalFailed === 0 ? '**all checks passed**' : `**${totalFailed} check(s) failed**`}`);
lines.push('');
lines.push('Replay exactly: `SEED=' + SEED + ' SCENARIO=' + ids.join(',') + ' node test/visual/site-builder-walkthrough.mjs`');
lines.push('');
for (const r of results) {
  const sc = r.scenario;
  lines.push(`## ${sc.label} (\`${sc.id}\`) — ${r.passed} passed, ${r.failed} failed, ${r.seconds}s`);
  lines.push('');
  lines.push(`- Brief: _${sc.brief}_`);
  lines.push(`- Inputs: author ${sc.author} (@${sc.handle}), tone ${sc.tone}, audience ${sc.audience}, skin ${sc.skin}, colour mode ${sc.colorMode}${sc.colorLock ? ' (locked)' : ''}, theme via ${sc.deployTarget}, permalink \`${sc.permalink}\`, integrations ${Object.entries(sc.integrations).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}, port ${sc.port}`);
  if (r.identity) lines.push(`- Claude's identity: **${r.identity.title}** — ${r.identity.subtitle || ''} · _${r.identity.tagline || ''}_ · ${r.identity.description}`);
  if (r.voice) lines.push(`- Claude's drafts: welcome "${r.voice.welcomeTitle}" (${r.voice.welcomeChars} chars), about (${r.voice.aboutChars} chars)`);
  if (r.site) lines.push(`- New site: title "${r.site.title}", skin ${r.site.skin}, theme ${r.site.theme}` + (r.live ? `, live after ${r.live.seconds}s` : ''));
  if (r.routes) lines.push(`- Routes: ${Object.entries(r.routes).map(([k, v]) => `${k} → ${v}`).join(', ')}`);
  lines.push('');
  lines.push('| Check | Result | Detail |');
  lines.push('| --- | --- | --- |');
  // Escape backslashes BEFORE pipes, or a detail ending in "\" would escape
  // the escape and break the table cell (CodeQL: incomplete string escaping).
  for (const c of r.checks) lines.push(`| ${c.name} | ${c.ok ? '✅' : '❌'} | ${c.detail.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`);
  lines.push('');
  lines.push(`Artifacts: \`${path.join(OUT, sc.id)}/\` — ${r.shots.length} screenshots, video-desktop.webm${fs.existsSync(path.join(OUT, sc.id, 'video-mobile.webm')) ? ', video-mobile.webm' : ''}`);
  if (r.error) lines.push(`\n> Harness error: ${r.error}`);
  lines.push('');
}
fs.writeFileSync(path.join(OUT, 'report.md'), lines.join('\n'));
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ seed: SEED, scenarios: ids, base: BASE, totalFailed, results }, null, 2));
console.log('\n' + lines.join('\n'));
console.log(`\nreport → ${path.join(OUT, 'report.md')}`);
process.exitCode = totalFailed ? 1 : 0;
