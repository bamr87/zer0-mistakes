// =============================================================================
// features-provenance.spec.js — Regression coverage for provenance rendering
// =============================================================================
// PR B added a `provenance:` block (PR/commit/issue) to every entry in
// _data/features.yml and surfaced it on /features/ via:
//   - a new "Provenance" column in the All Features Reference table
//   - a `PR #N · <commit>` line on each feature card (inline + feature-card.html)
// These tests pin that the links render with correct GitHub hrefs so a
// regression (renderer break, missing data, wrong base URL) fails CI.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const REPO = 'github.com/bamr87/zer0-mistakes';

test.describe('Feature registry provenance (/features/)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/features/');
  });

  test('reference table has a Provenance column', async ({ page }) => {
    const header = page.locator('table thead th', { hasText: 'Provenance' });
    await expect(header).toBeVisible();
  });

  test('a known feature exposes a PR link with the correct GitHub href', async ({ page }) => {
    // ZER0-060 (AI Chat Assistant) was introduced by PR #33.
    const prLink = page.locator(`a[href$="/pull/33"]`).first();
    await expect(prLink).toHaveAttribute('href', new RegExp(`${REPO.replace(/\./g, '\\.')}/pull/33$`));
  });

  test('commit links point at the repo commit endpoint', async ({ page }) => {
    const commitLink = page.locator('a[href*="/commit/"]').first();
    await expect(commitLink).toBeVisible();
    const href = await commitLink.getAttribute('href');
    expect(href).toMatch(new RegExp(`https://${REPO.replace(/\./g, '\\.')}/commit/[0-9a-f]{7,40}$`));
  });

  test('feature cards render a provenance line', async ({ page }) => {
    // The AI-Powered section cards use the inline provenance block.
    const provLine = page.locator('.card .text-muted a[href*="/pull/"], .card .text-muted a[href*="/commit/"]').first();
    await expect(provLine).toBeVisible();
  });
});
