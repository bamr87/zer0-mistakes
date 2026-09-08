// Feature: ZER0-067, ZER0-086, ZER0-087
// =============================================================================
// setup-wizard.spec.js — Regression coverage for the Site Builder wizard
// =============================================================================
// The wizard (_includes/setup/wizard.html + assets/js/setup-wizard.js, with the
// Claude session in assets/js/site-builder.js) started life as a five-step
// _config.yml form (T-040 / #408) and is now a nine-step Site Builder that
// generates a whole project. Everything the old spec pinned still holds, plus
// the new surfaces:
//
//   1. The FILE PREVIEW is persistent — visible at every step — and the active
//      file (_config.yml by default) regenerates on input. Copy/Download are
//      enabled throughout; the file tabs switch the preview.
//   2. Back/Next never move vertically between steps (every pane shares one CSS
//      grid cell; the nav row is pinned with mt-auto).
//   3. The draft survives a reload (localStorage `zer0-setup-draft`, debounced
//      300ms, flushed on pagehide) and is cleared by "Start over".
//   4. Email/URL validate on blur, a bad value locks later steps, and the Build
//      step lists unfilled recommended fields.
//   5. Without the dev proxy the Claude panel is offline and every proxy-backed
//      button is disabled — the wizard never pretends to have powers it lacks.
//   6. Prerequisite rows flip state from the manual "Done" switch; the skin
//      preview toggle sets data-theme-skin on <html> and restores it.
//   7. The Connect step (ZER0-087) offers Claude and Grok with a bring-your-own
//      token form, a model select, an image renderer and two session modes;
//      with the proxy mocked as "Grok has a key" the panel connects AS GROK,
//      a pasted token goes ONCE to the localhost proxy and is cleared from the
//      page (never in localStorage/sessionStorage), the open session swaps the
//      suggested prompts and survives a reload, and the Build step lists the
//      proxy's existing sites and opens one as the working project.
//
// Note: /setup/ only renders the wizard when jekyll.environment is development
// or site.show_setup_wizard is set. Rather than skip blindly (which would hide a
// genuine breakage), each run asserts the page is EITHER the wizard or the
// explicit "development mode only" notice, and skips only in the latter case.
//
// The smoke server has no dev proxy on :8787 (CI never starts one), so the
// offline assertions are the ones that run here; the connected path is covered
// by the evidence run (test/visual/site-builder-evidence.mjs) and by
// test/test_wizard_store.mjs for the proxy sandbox itself.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { dismissCookieConsent } = require('../fixtures');

const WIZARD = '#setup-wizard';
const PANES = '#wizardTabContent';
const DRAFT_KEY = 'zer0-setup-draft';
const STEPS = ['connect', 'prereqs', 'identity', 'urls', 'structure', 'appearance', 'voice', 'integrations', 'build'];

/** Load /setup/, skipping (loudly) when the build gated the wizard off. */
async function openWizard(page) {
  await page.goto('/setup/');
  await page.waitForLoadState('domcontentloaded');
  const present = await page.locator(WIZARD).count();
  if (!present) {
    await expect(page.locator('body')).toContainText(/only available in development mode/i);
    test.skip(true, '/setup/ is gated off in this build (not a development env)');
  }
  await expect(page.locator(WIZARD)).toBeVisible();
}

/** Click through to a step by its stepper button id. */
async function goToStep(page, tabId) {
  await page.locator(`#${tabId}`).click();
  await expect(page.locator(`#${tabId}`)).toHaveClass(/is-active/);
}

test.describe('Site Builder wizard', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    // Never inherit a draft between tests — but clear it EXACTLY ONCE, on a
    // throwaway load (addInitScript would re-run on every reload and wipe the
    // draft the persistence test has just saved).
    // At 1280×720 the file tabs in the side column sit under the cookie
    // banner; a click there lands on the banner, not the tab. The fixture is
    // an init script, so it must be registered BEFORE the first navigation.
    await dismissCookieConsent(page);
    await page.goto('/setup/');
    await page.evaluate((key) => {
      try { localStorage.removeItem(key); localStorage.removeItem('zer0-site-builder-prefs'); sessionStorage.clear(); } catch (e) { /* private mode */ }
    }, DRAFT_KEY);
    await openWizard(page);
  });

  test('renders a nine-step vertical stepper that starts on Connect', async ({ page }) => {
    await expect(page.locator(`${WIZARD} .nav-pills#wizardTabs`)).toHaveCount(0);
    const stepper = page.locator('#wizardTabs');
    await expect(stepper).toHaveClass(/wizard-stepper/);
    await expect(stepper).toHaveAttribute('aria-orientation', 'vertical');
    await expect(stepper.locator('.wizard-step')).toHaveCount(STEPS.length);
    for (const id of STEPS) await expect(page.locator(`#tab-${id}`)).toHaveCount(1);

    await expect(page.locator('#wizardTabs .wizard-step.is-active')).toHaveCount(1);
    await expect(page.locator('#tab-connect')).toHaveClass(/is-active/);
    await expect(page.locator('#wizard-progress-text')).toHaveText(/Step 1 of 9/);
  });

  test('the file preview is live and visible at every step', async ({ page }) => {
    const preview = page.locator('#yaml-preview');
    const copy = page.locator('#btn-copy-full');
    const download = page.locator('#btn-download');

    for (const id of STEPS) {
      await goToStep(page, `tab-${id}`);
      await expect(preview).toBeVisible();
      await expect(copy).toBeEnabled();
      await expect(download).toBeEnabled();
    }

    // …and _config.yml regenerates on input, from the Identity step, without
    // visiting Build.
    await goToStep(page, 'tab-identity');
    await page.locator('#cfg-title').fill('Regression Title');
    await expect(preview).toContainText('Regression Title');
    await page.locator('#cfg-subtitle').fill('A subtitle from the test');
    await expect(preview).toContainText('A subtitle from the test');

    // The preview names its file, and the file tabs switch it.
    await expect(page.locator('.wizard-preview-code')).toHaveAttribute('data-file', '_config.yml');
    await page.locator('.wizard-file-tab[data-file="docker-compose.yml"]').click();
    await expect(page.locator('.wizard-preview-code')).toHaveAttribute('data-file', 'docker-compose.yml');
    await expect(preview).toContainText('docker compose up');
    await expect(preview).toContainText('Regression Title'); // the compose header carries the title
    await page.locator('.wizard-file-tab[data-file="_config.yml"]').click();
    await expect(preview).toContainText('title                    : "Regression Title"');
  });

  test('Back and Next never move vertically between steps', async ({ page }) => {
    const paneStacking = await page.locator(PANES).evaluate((el) => ({
      display: getComputedStyle(el).display,
      rows: getComputedStyle(el).gridTemplateRows.split(' ').length,
      cells: new Set(
        [...el.querySelectorAll('.tab-pane')].map(
          (p) => `${getComputedStyle(p).gridRowStart}/${getComputedStyle(p).gridColumnStart}`
        )
      ).size
    }));
    expect(paneStacking.display).toBe('grid');
    expect(paneStacking.rows).toBe(1);
    expect(paneStacking.cells, 'every pane must share one grid cell').toBe(1);

    const offsets = [];
    const heights = [];
    for (const id of STEPS.slice(0, -1)) { // Build has no Next
      await goToStep(page, `tab-${id}`);
      const next = page.locator(`#step-${id} .btn-next`);
      offsets.push(await next.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY)));
      heights.push(await page.locator(PANES).evaluate((el) => Math.round(el.getBoundingClientRect().height)));
    }
    const spread = Math.max(...offsets) - Math.min(...offsets);
    expect(spread, `Next button document-y offsets across steps: ${offsets.join(', ')}`).toBeLessThanOrEqual(1);
    expect(Math.max(...heights) - Math.min(...heights), `pane container heights across steps: ${heights.join(', ')}`).toBeLessThanOrEqual(1);
  });

  test('validates email and URL on blur, and clears the error on retype', async ({ page }) => {
    await goToStep(page, 'tab-identity');
    const email = page.locator('#cfg-email');
    await email.fill('not-an-email');
    await email.blur();
    await expect(email).toHaveClass(/is-invalid/);
    await expect(page.locator('#cfg-email-feedback')).toHaveText(/valid email/i);

    await email.fill('someone@example.com');
    await expect(email).not.toHaveClass(/is-invalid/);
    await email.blur();
    await expect(email).not.toHaveClass(/is-invalid/);

    await email.fill('');
    await email.blur();
    await expect(email).not.toHaveClass(/is-invalid/);

    await goToStep(page, 'tab-urls');
    const url = page.locator('#cfg-url');
    await url.fill('example.com');
    await url.blur();
    await expect(url).toHaveClass(/is-invalid/);
    await expect(page.locator('#cfg-url-feedback')).toHaveText(/https:\/\//i);
    await url.fill('https://example.com');
    await url.blur();
    await expect(url).not.toHaveClass(/is-invalid/);
  });

  test('a malformed field locks later steps but never blocks Back', async ({ page }) => {
    await goToStep(page, 'tab-identity');
    const email = page.locator('#cfg-email');
    await email.fill('nope');
    await email.blur();

    await expect(page.locator('#tab-urls')).toBeDisabled();
    await expect(page.locator('#tab-urls')).toHaveClass(/is-locked/);
    await expect(page.locator('#tab-build')).toBeDisabled();

    await email.fill('someone@example.com');
    await email.blur();
    await expect(page.locator('#tab-urls')).toBeEnabled();

    await goToStep(page, 'tab-urls');
    await goToStep(page, 'tab-structure');
    await page.locator('#step-structure .btn-prev').click();
    await expect(page.locator('#tab-urls')).toHaveClass(/is-active/);
  });

  test('Suggest derives url and baseurl from the GitHub fields', async ({ page }) => {
    await goToStep(page, 'tab-urls');
    await page.locator('#cfg-github-user').fill('octocat');
    await page.locator('#cfg-repo-name').fill('garden');
    await page.locator('#btn-suggest-urls').click();
    await expect(page.locator('#cfg-url')).toHaveValue('https://octocat.github.io');
    await expect(page.locator('#cfg-baseurl')).toHaveValue('/garden');
    await expect(page.locator('#yaml-preview')).toContainText('baseurl                  : "/garden"');

    // A <user>.github.io repo is a user site: empty base path.
    await page.locator('#cfg-repo-name').fill('octocat.github.io');
    await page.locator('#btn-suggest-urls').click();
    await expect(page.locator('#cfg-baseurl')).toHaveValue('');
  });

  test('site type preselects collections and rebuilds the navigation editor', async ({ page }) => {
    await goToStep(page, 'tab-structure');
    await page.locator('label[for="site-type-docs"]').click();
    await expect(page.locator('#col-docs')).toBeChecked();
    await expect(page.locator('#col-quickstart')).toBeChecked();
    await expect(page.locator('#col-posts')).not.toBeChecked();
    const urls = await page.locator('#nav-editor .nav-url').evaluateAll((els) => els.map((e) => e.value));
    expect(urls).toContain('/docs/');
    expect(urls).toContain('/quickstart/');
    expect(urls).not.toContain('/posts/');

    // Collections drive the generated file set: a docs index appears, the
    // welcome post disappears.
    await expect(page.locator('.wizard-file-tab[data-file="pages/docs.md"]')).toHaveCount(1);
    await expect(page.locator('.wizard-file-tab[data-file^="pages/_posts/"]')).toHaveCount(0);
  });

  test('the skin preview toggles data-theme-skin on <html> and restores it', async ({ page }) => {
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme-skin'));
    await goToStep(page, 'tab-appearance');
    await page.locator('label[for="skin-plum"]').click();
    await page.locator('#btn-skin-preview').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme-skin', 'plum');
    await expect(page.locator('#btn-skin-preview')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btn-skin-preview').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme-skin', before || 'air');
    await expect(page.locator('#yaml-preview')).toContainText('theme_skin               : "plum"');
  });

  test('lists unfilled recommended fields as warnings on Build', async ({ page }) => {
    await goToStep(page, 'tab-build');
    const warnings = page.locator('#wizard-review-warnings');
    await expect(warnings).toContainText(/recommended fields still empty/i);
    await expect(warnings.locator('li')).not.toHaveCount(0);

    const ids = await page.locator('[data-recommended]').evaluateAll((els) => els.map((el) => el.id));
    for (const id of ids) {
      const field = page.locator(`#${id}`);
      const pane = await field.evaluate((el) => el.closest('.tab-pane').id);
      await goToStep(page, pane.replace('step-', 'tab-'));
      const type = await field.getAttribute('type');
      await field.fill(type === 'email' ? 'someone@example.com' : type === 'url' ? 'https://example.com' : 'filled');
    }
    await goToStep(page, 'tab-build');
    await expect(warnings).toContainText(/every recommended field is filled in/i);
  });

  test('persists a draft across reload and clears it on Start over', async ({ page }) => {
    await goToStep(page, 'tab-identity');
    await page.locator('#cfg-title').fill('Draft Survives Reload');
    await goToStep(page, 'tab-urls');
    await page.locator('#cfg-github-user').fill('octocat');
    await goToStep(page, 'tab-structure');
    await page.locator('#col-notes').check();
    await goToStep(page, 'tab-appearance');
    await page.locator('label[for="skin-mint"]').click();

    await expect.poll(
      () => page.evaluate((k) => localStorage.getItem(k), DRAFT_KEY),
      { message: 'draft should be written to localStorage after the debounce' }
    ).toContain('Draft Survives Reload');
    await expect(page.locator('#wizard-draft-chip')).toHaveClass(/is-visible/);

    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();
    // The remembered step is restored too.
    await expect(page.locator('#tab-appearance')).toHaveClass(/is-active/);
    await expect(page.locator('#skin-mint')).toBeChecked();
    await goToStep(page, 'tab-identity');
    await expect(page.locator('#cfg-title')).toHaveValue('Draft Survives Reload');
    await goToStep(page, 'tab-urls');
    await expect(page.locator('#cfg-github-user')).toHaveValue('octocat');
    await goToStep(page, 'tab-structure');
    await expect(page.locator('#col-notes')).toBeChecked();
    await expect(page.locator('#yaml-preview')).toContainText('Draft Survives Reload');

    // Start over clears the draft and every answer.
    page.once('dialog', (d) => d.accept());
    await page.locator('#btn-reset').click();
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), DRAFT_KEY)).toBeNull();
    await expect(page.locator('#tab-connect')).toHaveClass(/is-active/);
    await goToStep(page, 'tab-identity');
    await expect(page.locator('#cfg-title')).toHaveValue('');
  });

  test('flushes a still-pending draft write when the page goes away', async ({ page }) => {
    await goToStep(page, 'tab-identity');
    await page.locator('#cfg-title').fill('Flushed On Unload');
    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();
    await goToStep(page, 'tab-identity');
    await expect(page.locator('#cfg-title')).toHaveValue('Flushed On Unload');
  });

  test('survives localStorage being unavailable', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('denied'); }
      });
    });
    await page.goto('/setup/');
    if (!(await page.locator(WIZARD).count())) test.skip(true, '/setup/ gated off');
    await goToStep(page, 'tab-identity');
    await page.locator('#cfg-title').fill('No Storage Here');
    await expect(page.locator('#yaml-preview')).toContainText('No Storage Here');
    await goToStep(page, 'tab-urls');
    await expect(page.locator('#step-urls')).toBeVisible();
  });

  test('without the dev proxy the Claude panel is offline and proxy actions are disabled', async ({ page }) => {
    // CI has no proxy; a developer's machine may. Force the offline path either
    // way so the assertion is about the wizard, not the environment.
    await page.route('**/api/wizard/**', (route) => route.abort('connectionrefused'));
    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();
    await page.waitForTimeout(400); // let the status probe fail and settle

    const panel = page.locator('#siteBuilderPanel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-state', 'offline');
    await expect(page.locator('#sb-status-badge')).toHaveText(/offline/i);
    await expect(page.locator('#sb-input')).toBeDisabled();
    await expect(page.locator('#sb-send')).toBeDisabled();
    await expect(page.locator('#connect-status')).toHaveAttribute('data-state', 'offline');
    // The how-to stays visible so the user knows what to run.
    await expect(page.locator('#connect-howto')).toBeVisible();
    await expect(page.locator('#connect-howto')).toContainText('claude setup-token');

    for (const id of ['btn-run-checks', 'btn-write-project', 'btn-compose-up', 'btn-compose-logs', 'btn-compose-down']) {
      await expect(page.locator(`#${id}`), `#${id} must be disabled offline`).toBeDisabled();
    }
    // No credential of any kind is present in the page.
    const configJson = await page.locator('#siteBuilderConfig').textContent();
    expect(configJson).not.toMatch(/sk-ant-|apiKey|api_key/);
  });

  test('the Connect step offers Claude and Grok, a token form and session modes — all inert offline', async ({ page }) => {
    await page.route('**/api/wizard/**', (route) => route.abort('connectionrefused'));
    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();
    await page.waitForTimeout(400);

    await expect(page.locator('#step-connect h2')).toHaveText(/Connect your AI/);
    await expect(page.locator('input[name="sb_provider"]')).toHaveCount(2);
    await expect(page.locator('#sb-provider-anthropic')).toBeChecked();
    await expect(page.locator('.sb-provider-state[data-provider="xai"]')).toHaveText(/proxy offline/i);
    await expect(page.locator('#sb-token')).toHaveAttribute('type', 'password');
    for (const id of ['sb-token', 'sb-token-use', 'sb-token-persist', 'sb-model', 'sb-image-provider']) {
      await expect(page.locator(`#${id}`), `#${id} must be disabled offline`).toBeDisabled();
    }
    await expect(page.locator('input[name="sb_mode"]')).toHaveCount(2);
    await expect(page.locator('#sb-mode-guided')).toBeChecked();
    // The "with Claude" buttons follow the provider; offline they still read Claude.
    await expect(page.locator('#step-identity .sb-ask .sb-provider-name')).toHaveText('Claude');
    const configJson = await page.locator('#siteBuilderConfig').textContent();
    expect(configJson).toMatch(/"provider"/);
    expect(configJson).not.toMatch(/sk-ant-|xai-|apiKey|api_key/);
  });

  /** A dev proxy that already holds a Grok key (and nothing for Claude). */
  async function mockProxyOnline(page, { provider = 'xai', projects = [] } = {}) {
    const captured = { credentials: [], targets: [] };
    const providers = {
      anthropic: { id: 'anthropic', label: 'Claude', vendor: 'Anthropic', configured: provider === 'anthropic', kind: provider === 'anthropic' ? 'oauth_static' : null, source: provider === 'anthropic' ? 'env' : null, masked: provider === 'anthropic' ? '••••ab12' : '', models: ['claude-opus-4-8', 'claude-opus-5'], defaultModel: 'claude-opus-4-8', model: 'claude-opus-4-8', pinned: false, tokenHint: '', console: '' },
      xai: { id: 'xai', label: 'Grok', vendor: 'xAI', configured: provider === 'xai', kind: provider === 'xai' ? 'api_key' : null, source: provider === 'xai' ? 'session' : null, masked: provider === 'xai' ? '••••c3f9' : '', models: ['grok-4.6', 'grok-4.5'], defaultModel: 'grok-4.6', model: 'grok-4.6', pinned: false, tokenHint: '', console: '' },
    };
    const status = {
      ok: true,
      auth: { provider, label: providers[provider].label, vendor: providers[provider].vendor, kind: providers[provider].kind, source: providers[provider].source, masked: providers[provider].masked, model: providers[provider].model, pinned: false },
      providerPin: 'auto',
      providers,
      image: { providers: { xai: { id: 'xai', label: 'Grok Imagine', vendor: 'xAI', configured: provider === 'xai', source: 'session', masked: '••••c3f9', models: ['grok-imagine-image-2.0'], model: 'grok-imagine-image-2.0', aspectRatios: ['1:1', '16:9'], sizes: [] }, openai: { id: 'openai', label: 'OpenAI Images', vendor: 'OpenAI', configured: false, source: null, masked: '', models: ['gpt-image-2'], model: 'gpt-image-2', aspectRatios: [], sizes: ['1024x1024'] } }, default: provider === 'xai' ? 'xai' : null },
      credentials: { accepted: true, persistAllowed: true, envFile: '/tmp/zer0/.env' },
      checks: ['docker', 'git'],
      scaffold: { root: '/tmp/zer0-sites', theme: '/tmp/zer0' },
      compose: ['up', 'ps', 'logs', 'down', 'config', 'build'],
      projectCommands: ['git-status', 'git-diff', 'git-log', 'git-init'],
      projects,
      maxTokensCap: 8192,
      localEdit: true,
      model: providers[provider].model,
    };
    // A developer's machine may have a real proxy on :8787 whose first answer
    // already shaped the page; the mock must start from a clean slate.
    await page.evaluate(() => { try { localStorage.removeItem('zer0-site-builder-prefs'); sessionStorage.removeItem('zer0-site-builder-transcript'); } catch (e) { /* ignore */ } });
    await page.route('**/api/wizard/**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const json = (body, statusCode = 200) => route.fulfill({ status: statusCode, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
      if (url.pathname.endsWith('/status')) return json(status);
      if (url.pathname.endsWith('/credentials')) {
        if (req.method() === 'POST') {
          const body = req.postDataJSON();
          captured.credentials.push(body);
          return json({ ok: true, provider: body.provider, kind: 'api_key', envKey: 'XAI_API_KEY', masked: '••••' + String(body.token).slice(-4), source: 'session', persisted: body.persist ? { file: '/tmp/zer0/.env', key: 'XAI_API_KEY' } : null });
        }
        return json({ ok: true, provider: url.searchParams.get('provider'), cleared: true });
      }
      if (url.pathname.endsWith('/projects')) return json({ ok: true, root: '/tmp/zer0-sites', projects });
      if (url.pathname.endsWith('/target')) { const body = req.postDataJSON(); captured.targets.push(body.target); return json({ ok: true, abs: '/tmp/zer0-sites/' + body.target, exists: true, empty: false, root: '/tmp/zer0-sites' }); }
      if (url.pathname.includes('/project/tree')) return json({ ok: true, path: '.', entries: ['_config.yml', 'docker-compose.yml', 'pages/', 'pages/_posts/2026-01-01-welcome.md'], truncated: false });
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS', 'access-control-allow-headers': 'content-type' } });
      return json({ error: { message: 'not mocked: ' + url.pathname } }, 404);
    });
    return captured;
  }

  test('with a proxy that holds a Grok key the panel connects as Grok and a pasted token goes once to localhost', async ({ page }) => {
    const captured = await mockProxyOnline(page, { provider: 'xai' });
    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();

    const panel = page.locator('#siteBuilderPanel');
    await expect(panel).toHaveAttribute('data-state', 'online');
    // With no remembered choice the only configured provider is picked for you.
    await expect(panel).toHaveAttribute('data-ready', 'true');
    await expect(panel).toHaveAttribute('data-provider', 'xai');
    await expect(page.locator('.sb-provider-state[data-provider="xai"]')).toHaveText(/session ••••c3f9/);
    await expect(page.locator('.sb-provider-state[data-provider="anthropic"]')).toHaveText(/needs a token/i);
    await expect(page.locator('#sb-token')).toBeEnabled();

    // A provider without a key is selectable but not ready — the badge says so
    // and the composer stays locked; nothing pretends to work.
    await page.locator('label[for="sb-provider-anthropic"]').click();
    await expect(panel).toHaveAttribute('data-ready', 'false');
    await expect(page.locator('#sb-status-badge')).toHaveText(/needs a token/i);
    await expect(page.locator('#sb-input')).toBeDisabled();
    await expect(page.locator('#sb-credential-status')).toContainText(/No Claude credential/);

    // Back to Grok: ready again, the model list is Grok's, labels follow.
    await page.locator('label[for="sb-provider-xai"]').click();
    await expect(panel).toHaveAttribute('data-ready', 'true');
    await expect(panel).toHaveAttribute('data-provider', 'xai');
    await expect(page.locator('#sb-status-badge')).toHaveText(/Grok connected/);
    await expect(page.locator('#sb-title')).toHaveText(/Grok session/);
    await expect(page.locator('#sb-input')).toBeEnabled();
    const models = await page.locator('#sb-model option').evaluateAll((els) => els.map((o) => o.value));
    expect(models).toContain('grok-4.6');
    expect(models).not.toContain('claude-opus-4-8');
    await expect(page.locator('#step-identity .sb-ask .sb-provider-name')).toHaveText('Grok');
    await expect(page.locator('#sb-messages')).toContainText(/Connected to/);
    // The generated site follows the provider.
    await goToStep(page, 'tab-integrations');
    await expect(page.locator('#cfg-ai-provider')).toHaveValue('xai');
    await page.locator('.wizard-file-tab[data-file="_config.yml"]').click();
    await expect(page.locator('#yaml-preview')).toContainText('provider: xai');

    // Paste a token: sent once, to the mocked localhost proxy, then cleared.
    await goToStep(page, 'tab-connect');
    await page.locator('#sb-token').fill('xai-playwright-token-0000c3f9');
    await page.locator('#sb-token-use').click();
    await expect.poll(() => captured.credentials.length).toBe(1);
    expect(captured.credentials[0]).toMatchObject({ provider: 'xai', token: 'xai-playwright-token-0000c3f9', persist: false, test: true });
    await expect(page.locator('#sb-token')).toHaveValue('');
    await expect(page.locator('#sb-credential-status')).toContainText(/Grok/);
    const storage = await page.evaluate(() => JSON.stringify({ l: { ...localStorage }, s: { ...sessionStorage } }));
    expect(storage).not.toContain('playwright-token');
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('zer0-site-builder-prefs') || '{}'));
    expect(prefs.provider).toBe('xai');
    expect(JSON.stringify(prefs)).not.toMatch(/token/i);
    const html = await page.content();
    expect(html).not.toContain('xai-playwright-token');
  });

  test('the open session swaps the suggested prompts, shows a mode badge and survives a reload', async ({ page }) => {
    await mockProxyOnline(page, { provider: 'anthropic' });
    await page.reload();
    await expect(page.locator('#siteBuilderPanel')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#sb-status-badge')).toHaveText(/Claude connected/);
    await expect(page.locator('#sb-chips .sb-chip').first()).toContainText(/run locally|generate for me|open session/i);

    await page.locator('label[for="sb-mode-open"]').click();
    await expect(page.locator('#siteBuilderPanel')).toHaveAttribute('data-mode', 'open');
    await expect(page.locator('#sb-mode-badge')).toHaveText(/open session/);
    await expect(page.locator('#sb-chips')).toContainText(/Build me a complete site/);
    await expect(page.locator('#sb-input')).toHaveAttribute('placeholder', /what to build or change/);

    await page.reload();
    await expect(page.locator('#siteBuilderPanel')).toHaveAttribute('data-mode', 'open');
    await expect(page.locator('#sb-mode-open')).toBeChecked();
    await page.locator('label[for="sb-mode-guided"]').click();
    await expect(page.locator('#siteBuilderPanel')).toHaveAttribute('data-mode', 'guided');
  });

  test('the Build step lists the proxy\'s existing sites and Open makes one the working project', async ({ page }) => {
    const captured = await mockProxyOnline(page, { provider: 'anthropic', projects: [{ name: 'demo-site', abs: '/tmp/zer0-sites/demo-site', site: true, compose: true, mtime: 1 }] });
    await page.reload();
    await expect(page.locator('#siteBuilderPanel')).toHaveAttribute('data-ready', 'true');
    await goToStep(page, 'tab-build');
    const select = page.locator('#sb-project-select');
    await expect(select).toBeEnabled();
    await select.selectOption('demo-site');
    await expect(page.locator('#btn-compose-build')).toBeEnabled();
    await page.locator('#btn-project-open').click();
    await expect.poll(() => captured.targets.length).toBe(1);
    expect(captured.targets[0]).toBe('demo-site');
    await expect(page.locator('#cfg-target')).toHaveValue('demo-site');
    await expect(page.locator('#target-resolved')).toContainText(/open it as a project/);
    await expect(page.locator('.sb-card--result').last()).toContainText(/Working project: demo-site/);
    await expect(page.locator('.sb-card--result').last()).toContainText(/4 files/);
  });

  test('prerequisite rows flip to done from the manual switch and the summary counts them', async ({ page }) => {
    await goToStep(page, 'tab-prereqs');
    const docker = page.locator('.prereq-item[data-prereq="docker"]');
    await expect(docker).toHaveAttribute('data-state', 'unknown');
    await expect(docker.locator('.prereq-state-badge')).toHaveText(/not checked/i);
    const summaryBefore = await page.locator('#prereq-summary').textContent();

    await page.locator('#prereq-docker').check();
    await expect(docker).toHaveAttribute('data-state', 'manual');
    await expect(docker.locator('.prereq-state-badge')).toHaveText(/done/i);
    const summaryAfter = await page.locator('#prereq-summary').textContent();
    expect(summaryAfter).not.toBe(summaryBefore);
    expect(summaryAfter).toMatch(/^1 of \d+ required ready/);

    // The OS picker swaps the visible install command.
    await page.locator('label[for="prereq-os-windows"]').click();
    await expect(docker.locator('.prereq-install .wizard-cmd[data-os="windows"]')).not.toHaveAttribute('hidden', '');
    await expect(docker.locator('.prereq-install .wizard-cmd[data-os="macos"]')).toHaveAttribute('hidden', '');
  });

  test('the site plan drives the generated files: pages, landing data, overrides, fonts hook', async ({ page }) => {
    await goToStep(page, 'tab-structure');
    // Planner: adding a page creates a real file in the preview set.
    await page.locator('#btn-page-add').click();
    await page.locator('#pages-planner .page-row').last().locator('.page-title').fill('Field Notes');
    await page.locator('#pages-planner .page-row').last().locator('.page-collection').selectOption('docs');
    await page.locator('#cfg-title').dispatchEvent('input'); // any input regenerates
    await expect(page.locator('#pages-count')).toHaveText('1');
    await expect(page.locator('.wizard-file-tab[data-file="pages/_docs/field-notes.md"]')).toHaveCount(1);

    // Landing template: hero (default) emits the landing engine + data file;
    // minimal drops both.
    await expect(page.locator('.wizard-file-tab[data-file="_data/landing.yml"]')).toHaveCount(1);
    await page.locator('.wizard-file-tab[data-file="index.md"]').click();
    await expect(page.locator('#yaml-preview')).toContainText('data-landing-template');
    await page.locator('label[for="landing-minimal"]').click();
    await expect(page.locator('.wizard-file-tab[data-file="_data/landing.yml"]')).toHaveCount(0);
    await page.locator('label[for="landing-docs-hub"]').click();
    await expect(page.locator('#landing-summary')).toContainText(/steps, cards, faq/);

    // Grouped navigation lists the planned page under its collection.
    await page.locator('label[for="nav-style-grouped"]').click();
    await page.locator('.wizard-file-tab[data-file="_data/navigation/main.yml"]').click();
    await expect(page.locator('#yaml-preview')).toContainText('children:');
    await expect(page.locator('#yaml-preview')).toContainText('/docs/field-notes/');

    // Docs sidebar mode emits the curated tree and wires it in _config.yml.
    await page.locator('#cfg-sidebar-mode').selectOption('docs');
    await expect(page.locator('.wizard-file-tab[data-file="_data/navigation/docs.yml"]')).toHaveCount(1);
    await page.locator('.wizard-file-tab[data-file="_config.yml"]').click();
    await expect(page.locator('#yaml-preview')).toContainText('nav: docs');

    // Appearance: palette + fonts + corners land in user-overrides.css and the head hook.
    await goToStep(page, 'tab-appearance');
    await page.locator('label[for="palette-ocean"]').click();
    await page.locator('#cfg-fonts').selectOption('inter');
    await page.locator('label[for="radius-round"]').click();
    await page.locator('.wizard-file-tab[data-file="assets/css/user-overrides.css"]').click();
    await expect(page.locator('#yaml-preview')).toContainText('--bs-primary: #0b6e99');
    await expect(page.locator('#yaml-preview')).toContainText("'Inter'");
    await expect(page.locator('#yaml-preview')).toContainText('--zer0-radius: 0.75rem');
    await expect(page.locator('.wizard-file-tab[data-file="_includes/custom/head.html"]')).toHaveCount(1);
    await page.locator('label[for="palette-custom"]').click();
    await expect(page.locator('#cfg-color-primary')).toBeVisible();

    // The preview toggle applies the overrides to this page and removes them again.
    await page.locator('#btn-skin-preview').click();
    await expect(page.locator('#wizard-preview-overrides')).toHaveCount(1);
    await page.locator('#btn-skin-preview').click();
    await expect(page.locator('#wizard-preview-overrides')).toHaveCount(0);
  });

  test('the plan API validates against the schema and round-trips through the draft', async ({ page }) => {
    const bad = await page.evaluate(() => window.Zer0SetupWizard.validatePlan({ landing: { template: 'nope' }, theme: { palette: { primary: 'red' }, fonts: 'comic' }, bogus: 1, pages: [{ collection: 'posts' }] }));
    expect(bad.join(' | ')).toMatch(/landing\.template/);
    expect(bad.join(' | ')).toMatch(/palette\.primary/);
    expect(bad.join(' | ')).toMatch(/fonts/);
    expect(bad.join(' | ')).toMatch(/bogus/);
    expect(bad.join(' | ')).toMatch(/title: required/);

    const res = await page.evaluate(() => window.Zer0SetupWizard.setPlan({
      landing: { template: 'showcase', hero: { headline: 'Hello there', ctas: [{ label: 'Go', url: '/posts/' }] }, sections: [{ type: 'quote', items: [{ quote: 'Ship it.', author: 'Me' }] }, { type: 'cta', heading: 'Join', cta: { label: 'Subscribe', url: '/feed.xml' } }] },
      theme: { palette: { preset: 'berry' }, radius: 'sharp' },
      pages: [{ collection: 'posts', slug: 'first-light', title: 'First Light', body: 'Body text.' }],
    }));
    expect(res.ok).toBe(true);
    await expect(page.locator('#landing-summary')).toContainText('Hello there');
    // A planned hero image reaches index.md — the plan schema offers
    // landing.hero.image, so the landing engine has to render it. And a LATER
    // partial hero patch (the shape an agent sends when it adds artwork after
    // writing the copy) must not drop the headline or the CTAs.
    const partial = await page.evaluate(() => window.Zer0SetupWizard.setPlan({ landing: { hero: { image: '/assets/images/hero.png' } } }));
    expect(partial.ok).toBe(true);
    const hero = await page.evaluate(() => window.Zer0SetupWizard.getPlan().landing.hero);
    expect(hero).toMatchObject({ headline: 'Hello there', image: '/assets/images/hero.png' });
    expect(hero.ctas).toHaveLength(1);
    await page.locator('.wizard-file-tab[data-file="index.md"]').click();
    await expect(page.locator('#yaml-preview')).toContainText('{% if hero.image %}');
    // An outlined CTA renders white-on-white unless the surface behind it is
    // dark, so the landing engine resolves the variant against the hero.
    await expect(page.locator('#yaml-preview')).toContainText('outline-light');
    const landing = await page.evaluate(() => window.Zer0SetupWizard.getFile('_data/landing.yml').content);
    expect(landing).toContain('image: "/assets/images/hero.png"');
    expect(landing).toContain('headline: "Hello there"');
    await expect(page.locator('.wizard-file-tab[data-file^="pages/_posts/"][data-file$="first-light.md"]')).toHaveCount(1);
    await expect(page.locator('#palette-berry')).toBeChecked();
    await expect(page.locator('#radius-sharp')).toBeChecked();

    // Generated content must never carry a FUTURE timestamp: Jekyll withholds
    // future-dated documents and GitHub Pages builds with the default
    // `future: false`, so a fixed "09:00Z" stamp made every post and note
    // invisible on a published site until 09:00 UTC.
    const stamps = await page.evaluate(() => window.Zer0SetupWizard.getFiles()
      .filter((f) => /^pages\/_(posts|notes)\//.test(f.path))
      .map((f) => ({ path: f.path, date: (f.content.match(/^date:\s*(\S+)/m) || [])[1] })));
    expect(stamps.length).toBeGreaterThan(0);
    for (const s of stamps) {
      expect(s.date, `${s.path} must carry a date`).toBeTruthy();
      expect(new Date(s.date).getTime(), `${s.path} is dated in the future (${s.date})`).toBeLessThanOrEqual(Date.now() + 1000);
    }

    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), DRAFT_KEY)).toContain('first-light');
    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();
    const after = await page.evaluate(() => window.Zer0SetupWizard.getPlan());
    expect(after.landing.template).toBe('showcase');
    expect(after.landing.hero.headline).toBe('Hello there');
    expect(after.pages.map((p) => p.slug)).toEqual(['first-light']);
    expect(after.theme.palette.preset).toBe('berry');
  });

  test('copy buttons and the bundle download are wired', async ({ page }) => {
    await goToStep(page, 'tab-build');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-download-all').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('zer0-site-bundle.sh');
    const bundlePath = await download.path();
    const fs = require('fs');
    const bundle = fs.readFileSync(bundlePath, 'utf8');
    expect(bundle).toMatch(/^#!\/usr\/bin\/env bash/);
    expect(bundle).toContain("cat > '_config.yml' <<'ZER0_EOF'");
    expect(bundle).toContain("cat > 'docker-compose.yml' <<'ZER0_EOF'");
    expect(bundle).toContain('docker compose up');
  });
});
