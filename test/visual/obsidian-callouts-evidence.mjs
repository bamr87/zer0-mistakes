/**
 * Before/after evidence for foldable Obsidian callouts (PR #200).
 * ============================================================================
 * A `> [!type]-` callout renders as an accessible disclosure: the title is a
 * keyboard-operable `<button aria-expanded>` and the body shows/hides on
 * activation. Before this change a `-` callout's body was permanently hidden
 * with no way to expand it. This captures the real interaction on the live
 * "Live example" block in the syntax-reference doc: collapsed → activate →
 * expanded, plus the `+` callout that starts open.
 *
 * Run against `docker compose up`:
 *   BASE_URL=http://localhost:4000 node test/visual/obsidian-callouts-evidence.mjs
 *
 * Writes test/visual/evidence/obsidian-callouts/. See visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const slug = 'obsidian-callouts';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });
const PAGE = '/docs/obsidian/syntax-reference/';

async function readState(callout) {
  return callout.evaluate((el) => {
    const toggle = el.querySelector('.obsidian-callout-toggle');
    const body = el.querySelector('.obsidian-callout-body');
    return {
      ariaExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
      titleIsButton: toggle ? toggle.tagName.toLowerCase() === 'button' : false,
      bodyHidden: body ? body.hasAttribute('hidden') : null,
      dataCollapsed: el.getAttribute('data-collapsed'),
    };
  });
}

async function shoot(page, callout) {
  await callout.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  return callout.screenshot();
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 920, height: 760 });
await page.goto(base + PAGE, { waitUntil: 'load' });

const note = page.locator('.obsidian-callout-note').first(); // [!note]- collapsed
const tip = page.locator('.obsidian-callout-tip').first();    // [!tip]+  expanded
await note.waitFor({ state: 'visible' });

// Collapsed [!note]- : initial state, then activate to expand.
const noteCollapsedState = await readState(note);
const noteCollapsedImg = await shoot(page, note);
await note.locator('.obsidian-callout-toggle').click();
await page.waitForTimeout(150);
const noteExpandedState = await readState(note);
const noteExpandedImg = await shoot(page, note);

// Expanded [!tip]+ : starts open.
const tipOpenState = await readState(tip);
const tipOpenImg = await shoot(page, tip);

const metrics = {
  slug, base, route: PAGE, pr: 200,
  callouts: [
    { id: '[!note]- (foldable, collapsed)', collapsed: noteCollapsedState, afterActivate: noteExpandedState },
    { id: '[!tip]+ (foldable, expanded)', initial: tipOpenState },
  ],
};
fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

await montage(browser, {
  title: 'Obsidian foldable callout — accessible disclosure (PR #200)',
  width: 1000,
  note: 'A `> [!note]-` callout. The title is a real <button aria-expanded>; activating it reveals the body (previously a `-` callout body was permanently hidden).',
  rows: [
    { label: `❌ BEFORE activation — aria-expanded="${noteCollapsedState.ariaExpanded}", body hidden=${noteCollapsedState.bodyHidden}, data-collapsed="${noteCollapsedState.dataCollapsed}"`, img: noteCollapsedImg, w: 880 },
    { label: `✅ AFTER activation — aria-expanded="${noteExpandedState.ariaExpanded}", body hidden=${noteExpandedState.bodyHidden}, data-collapsed=${noteExpandedState.dataCollapsed === null ? 'removed' : noteExpandedState.dataCollapsed}`, img: noteExpandedImg, w: 880 },
  ],
}, `${outDir}/01-disclosure-before-after.png`);

await montage(browser, {
  title: 'Obsidian foldable callout — `+` starts expanded',
  width: 1000,
  note: 'A `> [!tip]+` callout renders open by default (aria-expanded="true"); activating it would collapse it.',
  rows: [{ label: `✅ [!tip]+ — aria-expanded="${tipOpenState.ariaExpanded}", body hidden=${tipOpenState.bodyHidden}, title is <button>=${tipOpenState.titleIsButton}`, img: tipOpenImg, w: 880 }],
}, `${outDir}/02-expanded-default.png`);

const snippet =
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
  `a foldable \`[!type]-\` callout is a keyboard <button aria-expanded>: activation flips aria-expanded false→true and reveals the body).`;
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);

await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
console.log(JSON.stringify(metrics.callouts, null, 2));
