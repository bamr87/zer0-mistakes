// =============================================================================
// page-feedback.spec.js — the "Improve this page" capture widget
// =============================================================================
// Widget: _includes/components/page-feedback.html + assets/js/page-feedback.js
// (+ the early log buffer in _includes/core/console-capture.html).
//
// Replaces the old build-time "Copilot Agent" dropdown, which baked the whole
// issue body into <a href>s at build time and could NOT capture runtime logs.
// These smoke tests assert the runtime capture path end-to-end WITHOUT hitting
// GitHub: window.open is intercepted so we can inspect the pre-filled issue URL
// the widget builds. The AI-enrichment path is not exercised here (it needs the
// chat proxy running); the base layer under test works fully client-side.
//
// The issue BODY is built by FleetFeedbackCore in the vendored
// assets/js/fleet-feedback.js (bamr87/bamr87 templates/feedback) — the same
// builder the fleet's <fleet-feedback> web component uses — so these tests
// double as the theme's half of a cross-repo contract check: if the vendored
// core drifts, the marker and section assertions below fail here.
//
// Regressions this guards against:
//   - a dead/absent FAB (render-guard or mount regression)
//   - labels the repo doesn't have (the old `labels=ai-agent` silent-drop bug)
//   - repo owner/name drifting from site.repository
//   - the issue body losing its page context or the captured console logs
//   - the body losing the marker the issue pipeline reads
//   - a secret reaching the log preview unredacted
//   - the FAB losing its href and becoming dead when the script fails to load
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent } = require('../fixtures');

const FAB = '#pageFeedbackFab';
const MODAL = '#pageFeedbackModal';

test.describe('Page-feedback widget', () => {
  test.beforeEach(async ({ page }) => {
    // The consent banner is a full-width bar pinned to the bottom of the
    // viewport, on a layer above the FAB stack (--zer0-layer-cookie-banner
    // 1095 > --zer0-layer-fab-feedback 1051), so it swallows every click aimed
    // at the FAB. Every other spec that touches lower-screen chrome seeds the
    // choice the way a returning visitor would; this one never did.
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');
  });

  test('renders the FAB and the injected config / types / context', async ({ page }) => {
    await expect(page.locator(FAB)).toBeVisible();
    await expect(page.locator('#pageFeedbackConfig')).toBeAttached();
    await expect(page.locator('#pageFeedbackTypes')).toBeAttached();
    await expect(page.locator('#pageFeedbackContext')).toBeAttached();

    // Repo comes from a single source (site.repository) — never hardcoded.
    const cfg = JSON.parse(await page.locator('#pageFeedbackConfig').textContent());
    expect(cfg.repository).toBe('bamr87/zer0-mistakes');
    expect(cfg.defaultLabels).toContain('page-feedback');

    // At least one request type is rendered from _data/feedback_types.yml.
    expect(await page.locator('.pf-type').count()).toBeGreaterThan(0);

    // The modal exists but is closed until opened.
    await expect(page.locator(MODAL)).toBeHidden();
  });

  test('FAB opens the modal; Escape closes it', async ({ page }) => {
    await page.locator(FAB).click();
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/pf-overlay--open/);
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('role', 'dialog');

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('submit is gated on both a type and a description', async ({ page }) => {
    await page.locator(FAB).click();
    const submit = page.locator('#pfSubmit');
    await expect(submit).toBeDisabled();

    await page.locator('.pf-type[data-pf-type-id="fix-page"]').click();
    await expect(page.locator('.pf-type[data-pf-type-id="fix-page"]')).toHaveAttribute('aria-checked', 'true');
    await expect(submit).toBeDisabled(); // type chosen, still no description

    await page.locator('#pfDescription').fill('The code block overflows horizontally on mobile.');
    await expect(submit).toBeEnabled();
  });

  test('builds a correct pre-filled GitHub issue URL with real labels', async ({ page }) => {
    await page.locator(FAB).click();

    // Intercept window.open — page-feedback.js calls it at submit time, so
    // overriding it now (post-load) is enough; nothing navigates.
    await page.evaluate(() => {
      window.__pfOpened = null;
      window.open = (u) => { window.__pfOpened = u; return { opener: null, closed: false, focus() {} }; };
    });

    await page.locator('.pf-type[data-pf-type-id="fix-page"]').click();
    await page.locator('#pfDescription').fill('Broken link in the intro section.');
    await page.locator('#pfSubmit').click();

    const opened = await page.evaluate(() => window.__pfOpened);
    expect(opened).toBeTruthy();
    expect(opened).toContain('https://github.com/bamr87/zer0-mistakes/issues/new');

    const url = new URL(opened);
    const labels = url.searchParams.get('labels') || '';
    expect(labels.split(',')).toContain('page-feedback'); // marker label (exists in repo)
    expect(labels.split(',')).toContain('bug');            // fix-page → bug (exists in repo)

    expect(url.searchParams.get('title')).toContain('Report a problem');

    const body = url.searchParams.get('body') || '';
    expect(body).toContain('Broken link in the intro section.'); // the user's words
    expect(body).toContain('Page context');                      // the auto context table
    expect(body).toContain('Environment');
  });

  test('the body carries the fleet contract — section order and the pipeline marker', async ({ page }) => {
    await page.locator(FAB).click();
    await page.evaluate(() => {
      window.__pfOpened = null;
      window.open = (u) => { window.__pfOpened = u; return { opener: null, closed: false, focus() {} }; };
    });
    await page.locator('.pf-type[data-pf-type-id="improve-page"]').click();
    await page.locator('#pfDescription').fill('The intro reads as three paragraphs of preamble.');
    await page.locator('#pfSubmit').click();

    const body = new URL(await page.evaluate(() => window.__pfOpened)).searchParams.get('body');

    // The marker is what tells the issue pipeline this report is already
    // structured, so it does not re-template it. Losing it is silent.
    expect(body).toContain('<!-- fleet-feedback v1 type=improve-page -->');
    expect(body).toMatch(/_Filed from .+ via fleet-feedback v[\d.]+\._/);

    // Sections in the contract's order (UPS-FB-23).
    const order = ['## 📝 Description', '## 📄 Page context', '## 🔧 Environment'];
    let at = -1;
    for (const heading of order) {
      const found = body.indexOf(heading);
      expect(found, `${heading} missing or out of order`).toBeGreaterThan(at);
      at = found;
    }
  });

  test('the FAB is a real link, so it survives the script failing to load', async ({ page }) => {
    // The widget now delegates body assembly to a second script. If that one
    // 404s the FAB must still reach the issue form rather than becoming a
    // decorative circle — hence an anchor with an href, not a button.
    const href = await page.locator(FAB).getAttribute('href');
    expect(href).toContain('bamr87/zer0-mistakes/issues/new');
    expect(href).toContain('labels=page-feedback');
  });

  test('captures console output and offers it in the preview', async ({ page }) => {
    // console.warn, not console.log: the shared buffer deliberately hooks only
    // warn/error. At a 40-entry ring, debug chatter evicts the one line that
    // explains the failure — which is the line a report exists to carry.
    await page.evaluate(() => console.warn('PF_TEST_LOG_MARKER 42'));
    await page.locator(FAB).click();

    // Expand "What gets attached" and confirm the captured line is shown.
    await page.locator('#pfContextWrap > summary').click();
    await expect(page.locator('#pfLogsWrap')).toBeVisible();
    await expect(page.locator('#pfLogsPreview')).toContainText('PF_TEST_LOG_MARKER 42');

    // And it's opt-outable.
    await expect(page.locator('#pfIncludeLogs')).toBeChecked();
  });

  test('secrets in console output are redacted before they can be previewed', async ({ page }) => {
    // Credentials reach the console more often than anyone expects — an
    // Authorization header logged by a fetch wrapper, a signed URL in a 403.
    // Redaction happens on the way INTO the buffer, so there is no window in
    // which the raw value could be previewed, copied, or filed.
    await page.evaluate(() => {
      console.error('request failed: Authorization: Bearer sk-live-0123456789abcdef');
      console.warn('notify reader@example.com of the outage');
    });
    await page.locator(FAB).click();
    await page.locator('#pfContextWrap > summary').click();

    const preview = await page.locator('#pfLogsPreview').textContent();
    expect(preview).toContain('request failed');
    expect(preview).not.toContain('sk-live-0123456789abcdef');
    expect(preview).not.toContain('reader@example.com');
  });
});
