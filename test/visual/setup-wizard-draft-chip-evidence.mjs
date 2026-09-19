// Feature: ZER0-067, ZER0-085
/**
 * Evidence for the Site Builder's 7px jump on first draft save (#265).
 * ============================================================================
 * The generic base-vs-head generator (pr-evidence.mjs) cannot show this one:
 * the defect is not a resting-state difference a screenshot catches, it is a
 * ONE-WAY TRANSITION that only happens after the wizard's 300ms save debounce
 * fires. So this generator drives the interaction on both sites and measures
 * the same elements either side of it:
 *
 *   1. load /setup/ cold and measure
 *   2. type into a field, wait past DRAFT_DEBOUNCE_MS for the "Draft saved"
 *      chip, and measure again
 *
 * On the BASE branch step 2 moves `.wizard-header` from 142px to 149px and
 * every Back/Next row 7px down with it — permanently, because showDraftChip()
 * cleared `hidden` and only `is-visible` is ever taken back. On HEAD nothing
 * moves, because the chip holds its box from first paint.
 *
 * Requires two live sites, the way scripts/ci/visual_evidence_autogen.py
 * stands them up:
 *   BASE_URL    the PR head        (default http://localhost:4000)
 *   BEFORE_URL  the base branch    (default http://localhost:4001)
 *
 * Output: test/visual/evidence/agent-issue-265/
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const env = process.env;
const slug = env.SLUG || 'agent-issue-265';
const head = (env.BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const base = (env.BEFORE_URL || 'http://localhost:4001').replace(/\/+$/, '');
const outDir = env.OUT_DIR || `test/visual/evidence/${slug}`;
const WIDTH = Number(env.WIDTH || 1280);

const SEED_CONSENT = () => {
  localStorage.setItem('zer0-cookie-consent', JSON.stringify({
    essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0',
  }));
};

// The numbers that decide the case, measured in the page rather than eyeballed.
const MEASURE = () => {
  const header = document.querySelector('.wizard-header');
  const panes = document.querySelector('#wizardTabContent');
  const chip = document.getElementById('wizard-draft-chip');
  const next = document.querySelector('#step-identity .btn-next');
  const round = (n) => (typeof n === 'number' ? Math.round(n) : null);
  return {
    headerHeight: header ? round(header.getBoundingClientRect().height) : null,
    panesTop: panes ? round(panes.getBoundingClientRect().top + window.scrollY) : null,
    panesHeight: panes ? round(panes.getBoundingClientRect().height) : null,
    nextTop: next ? round(next.getBoundingClientRect().top + window.scrollY) : null,
    chipDisplay: chip ? getComputedStyle(chip).display : null,
    chipVisibility: chip ? getComputedStyle(chip).visibility : null,
    chipHeight: chip ? round(chip.getBoundingClientRect().height) : null,
  };
};

/** Header band, which is where the movement happens. */
const band = (page) => page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: 420 } });

async function run(browser, url, label) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  await page.addInitScript(SEED_CONSENT);
  await page.goto(`${url}/setup/`, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(() => {
    try { localStorage.removeItem('zer0-setup-draft'); sessionStorage.clear(); } catch (e) { /* private mode */ }
  });
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});

  await page.locator('#tab-identity').click();
  await page.waitForSelector('#tab-identity.is-active');
  const cold = await page.evaluate(MEASURE);
  const coldImg = await band(page);

  // The interaction the bug needs: one keystroke, then past the 300ms debounce
  // and the 2s is-visible timer, so we measure the state the page SETTLES in.
  await page.locator('#cfg-title').fill('Draft chip evidence');
  await page.waitForTimeout(2600);
  const saved = await page.evaluate(MEASURE);
  const savedImg = await band(page);

  await page.close();
  console.log(`[${slug}] ${label}`);
  console.log(`   cold        ${JSON.stringify(cold)}`);
  console.log(`   after save  ${JSON.stringify(saved)}`);
  console.log(`   header moved ${saved.headerHeight - cold.headerHeight}px, ` +
    `Next moved ${saved.nextTop - cold.nextTop}px`);
  return { cold, saved, coldImg, savedImg };
}

const browser = await chromium.launch(env.CHROMIUM_PATH ? { executablePath: env.CHROMIUM_PATH } : {});
fs.mkdirSync(outDir, { recursive: true });

const before = await run(browser, base, 'BEFORE — base branch');
const after = await run(browser, head, 'AFTER — this PR');

const shift = (r) => ({
  header: r.saved.headerHeight - r.cold.headerHeight,
  panesTop: r.saved.panesTop - r.cold.panesTop,
  next: r.saved.nextTop - r.cold.nextTop,
});
const metrics = {
  slug,
  generator: 'test/visual/setup-wizard-draft-chip-evidence.mjs',
  route: '/setup/',
  width: WIDTH,
  base: head,
  before: base,
  before_branch: { ...before, coldImg: undefined, savedImg: undefined, shift: shift(before) },
  after_branch: { ...after, coldImg: undefined, savedImg: undefined, shift: shift(after) },
};
delete metrics.before_branch.coldImg;
delete metrics.before_branch.savedImg;
delete metrics.after_branch.coldImg;
delete metrics.after_branch.savedImg;
fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

const cap = (r) =>
  `header ${r.headerHeight}px · #wizardTabContent top ${r.panesTop}px · Next ${r.nextTop}px · ` +
  `chip display:${r.chipDisplay} visibility:${r.chipVisibility} height:${r.chipHeight}px`;

await montage(browser, {
  title: `#265 — the Site Builder moved ${shift(before).next}px the first time it saved a draft ` +
    `(${shift(after).next}px after this PR)`,
  // The magnitude is layout-dependent and the movement is not: the chip's box
  // grows the header's right-hand block from 19px to 26px, which costs 7px when
  // that block has already wrapped onto its own line (what CI measures, hence
  // `2029, 2036, …`) and a whole wrapped line when the extra 7px is what pushes
  // it over. Same one-way transition either way.
  note: `Same route, same width (${WIDTH}px), same browser. Each pair is the wizard cold, ` +
    'then after one keystroke has pushed it past the 300ms save debounce. The shift size ' +
    'depends on whether the header has already wrapped at this width; the shift itself is the bug.',
  width: 1080,
  rows: [
    { label: 'BEFORE — base branch · cold', img: before.coldImg, w: 1040, caption: cap(before.cold) },
    { label: 'BEFORE — base branch · after the draft saved', img: before.savedImg, w: 1040, caption: cap(before.saved) },
    { label: 'AFTER — this PR · cold', img: after.coldImg, w: 1040, caption: cap(after.cold) },
    { label: 'AFTER — this PR · after the draft saved', img: after.savedImg, w: 1040, caption: cap(after.saved) },
  ],
}, `${outDir}/01-draft-chip-before-after.png`);

fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  '<!-- CHANGELOG snippet — evidence: test/visual/evidence/' + slug + '/ -->\n' +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
  `first draft save moved the wizard ${shift(before).next}px on the base branch, ` +
  `${shift(after).next}px here)\n`
);
console.log(`  wrote ${outDir}/metrics.json + CHANGELOG-snippet.txt`);
console.log(`[${slug}] done → ${outDir}/`);

await browser.close();
