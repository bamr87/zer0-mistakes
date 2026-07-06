// =============================================================================
// obsidian-callouts.spec.js — Foldable Obsidian callouts are accessible toggles
// =============================================================================
// Regression coverage for PR #200. A `> [!type]+` / `> [!type]-` callout renders
// as an accessible disclosure: the title is a keyboard-operable
// `<button aria-expanded>` and the body shows/hides on activation. Previously a
// `-` callout's body was permanently hidden with no way to expand it.
//
// The callout is upgraded from a plain <blockquote> by the client-side resolver
// (assets/js/obsidian-wiki-links.js), so this runs in a real browser against the
// live "Live example" block in the syntax-reference doc. The Ruby-plugin parity
// path is unit-tested separately (test/test_ruby_converter.rb), and the resolver
// DOM shape in test/test_resolver.js.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const PAGE = '/docs/obsidian/syntax-reference/';

test.describe('Obsidian foldable callouts', () => {
  test('a collapsed [!type]- callout is a disclosure that expands on activation', async ({ page }) => {
    await waitForJekyll(page, PAGE);

    // The resolver upgrades the blockquote into a callout wrapper.
    const callout = page.locator('.obsidian-callout-note').first();
    await expect(callout).toBeVisible();
    await expect(callout).toHaveAttribute('data-collapsed', 'true');

    const toggle = callout.locator('.obsidian-callout-toggle');
    const body = callout.locator('.obsidian-callout-body');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(body).toBeHidden();

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(body).toBeVisible();
    await expect(callout).not.toHaveAttribute('data-collapsed', 'true');
  });

  test('an expanded [!type]+ callout starts open and collapses on activation', async ({ page }) => {
    await waitForJekyll(page, PAGE);

    const callout = page.locator('.obsidian-callout-tip').first();
    const toggle = callout.locator('.obsidian-callout-toggle');
    const body = callout.locator('.obsidian-callout-body');

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(body).toBeVisible();

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(body).toBeHidden();
  });

  test('the foldable title is a real <button> (keyboard operable)', async ({ page }) => {
    await waitForJekyll(page, PAGE);
    const toggle = page.locator('.obsidian-callout-tip .obsidian-callout-toggle');
    await expect(toggle).toBeVisible();
    expect((await toggle.evaluate((el) => el.tagName)).toLowerCase()).toBe('button');
  });
});
