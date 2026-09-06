// Feature: ZER0-067, ZER0-086
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
      try { localStorage.removeItem(key); sessionStorage.clear(); } catch (e) { /* private mode */ }
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
    await expect(page.locator('.wizard-file-tab[data-file^="pages/_posts/"][data-file$="first-light.md"]')).toHaveCount(1);
    await expect(page.locator('#palette-berry')).toBeChecked();
    await expect(page.locator('#radius-sharp')).toBeChecked();

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
