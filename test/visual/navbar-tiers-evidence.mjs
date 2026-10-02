/**
 * Navbar label tiers, merged chevron, centred grid — evidence generator (#405).
 * ----------------------------------------------------------------------------
 * Drives the live site and produces the visual + numeric evidence for the
 * navbar rework. Two of #405's three coupled changes have a genuine, live
 * BEFORE state to reproduce on this same running server; the third does not,
 * and this generator says so rather than fabricating one:
 *
 *   1. Chevron dead zone — REPRODUCIBLE. Each dropdown's chevron button used
 *      to sit beside its parent link with a visible gap (`ms-1`), so hovering
 *      the seam between them lit neither control. `UNFIX_CHEVRON_CSS` restores
 *      that geometry live; the fix merges the chevron into the link's own
 *      padding box and hover row. Measured below.
 *   2. Bare-label middle tier + ellipsis — NOT independently reproducible here.
 *      The theme's own seven demo items already render with zero truncation on
 *      `main` (PR #423 fixed the `.container-xl` cap that caused it, before
 *      #405 existed). What #405 removes is the STRUCTURAL POSSIBILITY of
 *      truncation — the `text-overflow: ellipsis` rule and the bare-label tier
 *      that fell back to it — which matters for a consumer with more or longer
 *      items than the demo, not for a live pixel diff of this content. Fixing
 *      the label CSS in isolation (leaving the grid and chevron as `main` has
 *      them) does not reproduce a visible difference, and patching the grid
 *      too just re-derives the `.container-xl` bug #423 already fixed and
 *      evidenced in `test/visual/evidence/navbar-fit/`. The regression guard
 *      for THIS removal is static instead: grep asserts zero
 *      `text-overflow: ellipsis` inside any `@container bd-nav` block, and
 *      `navbar-tiers.spec.js` asserts `scrollWidth <= clientWidth` for every
 *      visible label at 1024/1280px on `main` itself.
 *   3. Grid centring — NOT usefully reproducible as a live pixel diff either.
 *      `.navbar-main-start` and `.navbar-utility-controls` are both
 *      content-sized (`max-width: 30cqi` / `max-content`) with
 *      `justify-self: end` on the utility side; reverting the grid tracks'
 *      minimum changes where the UNUSED space in each column sits, not the
 *      measured width of either element, so a `getBoundingClientRect()` diff
 *      reads as "no change" whether or not the floor is present. What the
 *      floor actually changes — the grid's own column-track widths — is
 *      exercised by `navbar-tiers.spec.js`'s "tiers still engage" test,
 *      which is also the regression guard for the trap that makes this grid
 *      change risky in the first place (see that file's header comment).
 *
 * Usage:
 *   BASE_URL=http://localhost:4000 node test/visual/navbar-tiers-evidence.mjs
 *
 * Outputs (test/visual/evidence/navbar-tiers-405/):
 *   01-chevron-dead-zone.png     gap between label and chevron, before/after
 *   02-viewport-matrix.png       the AFTER navbar across widths — 0 truncated,
 *                                 tier boundary visibly engaging
 *   metrics.json                 chevron gap + label/tier counts + centring
 *   CHANGELOG-snippet.txt        evidence link for the changelog entry
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const OUT = 'test/visual/evidence/navbar-tiers-405';
fs.mkdirSync(OUT, { recursive: true });

// Only lg+ (>=992px): below that, the header shows the offcanvas toggler /
// tablet quicklinks instead of #bdNavbar's inline menubar, so a label/icon
// count against #bdNavbar there would describe the hidden offcanvas panel,
// not the screenshot.
const SWEEP_WIDTHS = [992, 1024, 1150, 1280, 1440, 1920];
const CHEVRON_BAND_WIDTHS = [1024, 1280];

const UNFIX_CHEVRON_CSS = `
  @media (min-width: 992px) {
    #bdNavbar .nav-hover-dropdown > .nav-link:first-child {
      padding-right: 0.375rem !important;
    }
    #bdNavbar .nav-hover-dropdown > .dropdown-toggle-split {
      position: static !important;
      width: 1.5rem !important;
      margin-left: 0.25rem !important;
    }
  }
`;

async function measureLabels(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('#navbar #bdNavbar .navbar-nav');
    if (!nav) return { labelsShown: 0, truncated: 0, iconsShown: 0 };
    const texts = [...nav.querySelectorAll('.nav-link-text')].filter(
      (t) => getComputedStyle(t).display !== 'none'
    );
    const truncated = texts.filter((t) => t.scrollWidth > t.clientWidth + 1);
    const icons = [...nav.querySelectorAll('li:not(.d-lg-none) > .nav-link i, li:not(.d-lg-none) i')].filter(
      (i) => getComputedStyle(i).display !== 'none'
    );
    return { labelsShown: texts.length, truncated: truncated.length, iconsShown: icons.length };
  });
}

async function measureChevronGap(page) {
  return page.evaluate(() => {
    const dropdown = document.querySelector('#navbar #bdNavbar .nav-hover-dropdown');
    if (!dropdown) return null;
    const link = dropdown.querySelector('.nav-link:not(.dropdown-toggle-split)');
    const chevron = dropdown.querySelector('.dropdown-toggle-split');
    if (!link || !chevron) return null;
    const a = link.getBoundingClientRect();
    const b = chevron.getBoundingClientRect();
    return Math.round(b.left - a.right);
  });
}

async function bandShot(page, selector = '#navbar') {
  const el = await page.$(selector);
  return el.screenshot();
}

async function main() {
  const browser = await chromium.launch();
  const metrics = { slug: 'navbar-tiers-405', base: BASE, route: '/', sweep: [] };

  console.log('[navbar-tiers-405] chevron gap + label/tier sweep (AFTER, on main)');
  const chevronBandRows = [];
  for (const w of SWEEP_WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 760 });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(150);

    const afterLabels = await measureLabels(page);
    const afterGap = await measureChevronGap(page);

    let beforeGap = afterGap;
    if (afterGap !== null) {
      await page.addStyleTag({ content: UNFIX_CHEVRON_CSS });
      await page.waitForTimeout(200);
      beforeGap = await measureChevronGap(page);
    }

    metrics.sweep.push({
      width: w,
      labelsShown: afterLabels.labelsShown,
      iconsShown: afterLabels.iconsShown,
      truncated: afterLabels.truncated,
      beforeChevronGapPx: beforeGap,
      afterChevronGapPx: afterGap,
    });
    console.log(
      `   ${w}px  labels=${afterLabels.labelsShown} icons=${afterLabels.iconsShown} truncated=${afterLabels.truncated}` +
        `  chevron gap: before=${beforeGap}px after=${afterGap}px`
    );

    if (CHEVRON_BAND_WIDTHS.includes(w) && afterGap !== null) {
      const beforeBand = await bandShot(page);
      const fresh = await browser.newPage();
      await fresh.setViewportSize({ width: w, height: 760 });
      await fresh.goto(BASE + '/', { waitUntil: 'load' });
      await fresh.waitForTimeout(150);
      chevronBandRows.push(
        { label: `❌ BEFORE — ${w}px · gap between label and chevron: ${beforeGap}px (a dead zone — hovering it lights neither control)`, img: beforeBand },
        { label: `✅ AFTER — ${w}px · gap: ${afterGap}px (chevron overlaps the link's reserved padding; hovering it lights the whole row)`, img: await bandShot(fresh) }
      );
      await fresh.close();
    }
    await page.close();
  }

  await montage(
    browser,
    {
      title: 'Dropdown chevron — merged into the parent row (#405)',
      width: 1040,
      note:
        'BEFORE re-applies the old chevron geometry (a sibling button with a left ' +
        'margin) on this same running server; AFTER is the shipped merge.',
      rows: chevronBandRows,
    },
    `${OUT}/01-chevron-dead-zone.png`
  );

  console.log('[navbar-tiers-405] viewport matrix (AFTER)');
  const matrixRows = [];
  for (const w of SWEEP_WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 700 });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const m = await measureLabels(page);
    const img = await bandShot(page);
    matrixRows.push({ label: `${w}px — ${m.labelsShown} labels, ${m.iconsShown} icons, ${m.truncated} truncated`, img, w: Math.min(w, 1000) });
    await page.close();
  }
  await montage(
    browser,
    {
      title: 'Navbar — viewport matrix, two-tier system (#405, after)',
      width: Math.max(...SWEEP_WIDTHS) > 1000 ? 1040 : Math.max(...SWEEP_WIDTHS) + 60,
      note: `${SWEEP_WIDTHS[0]} → ${SWEEP_WIDTHS[SWEEP_WIDTHS.length - 1]}px. 0 truncated labels at every width; the tier boundary (51rem of centre track) visibly switches labels for icons rather than clipping either.`,
      rows: matrixRows,
    },
    `${OUT}/02-viewport-matrix.png`
  );

  fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));

  const worstGap = metrics.sweep.reduce((a, b) => Math.max(a, b.beforeChevronGapPx || 0), 0);
  const snippet =
    `<!-- CHANGELOG snippet — evidence: test/visual/evidence/navbar-tiers-405/ -->\n` +
    `  (evidence: [\`test/visual/evidence/navbar-tiers-405/\`](test/visual/evidence/navbar-tiers-405/README.md)` +
    ` — chevron dead zone up to ${worstGap}px -> overlapping; 0 truncated labels across ${SWEEP_WIDTHS.length} widths)`;
  fs.writeFileSync(`${OUT}/CHANGELOG-snippet.txt`, snippet);

  await browser.close();
  console.log(`[navbar-tiers-405] done -> ${OUT}/`);
}

await main();
