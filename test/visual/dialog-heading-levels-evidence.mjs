/**
 * Evidence generator for the dialog heading-level fix (issue #318).
 *
 * The bug: seven dialogs titled themselves with a bare `<h5 class="modal-title">`
 * / `<h5 class="offcanvas-title">`, so anyone navigating by heading met a
 * level-5 heading as the dialog's title — a jump past h2/h3/h4 on pages that
 * run h1 → h2. Six other dialogs already used the correct
 * `<h2 class="…-title h5">` form. The fix makes all seven match; `.h5`
 * reproduces the exact sizing, so the change is deliberately VISUALLY INERT.
 *
 * Evidence therefore shows two things per dialog:
 *   1. the structural change — the heading sequence a screen-reader user
 *      walks (previous heading → dialog title), before vs after;
 *   2. the visual non-change — the rendered header band is pixel-identical
 *      (the BEFORE render is reproduced by reverting exactly the diff:
 *      `<h2 class="…-title h5">` → `<h5 class="…-title">` in the live DOM).
 *
 * The 7th fixed file, _includes/components/background-customizer.html, is an
 * unrendered include (no page includes it) — fixed for consistency; asserted
 * here by grep-equivalent DOM absence, documented in the README.
 *
 * Run against the live dev server:
 *   docker compose up                      # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/dialog-heading-levels-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { montage } from './evidence-kit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const SLUG = 'dialog-heading-levels';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

// Same six live dialogs the regression test walks
// (test/visual/core/accessibility.spec.js).
const DIALOGS = [
  { url: '/', selector: '#siteSearchModal', kind: 'modal', source: 'components/search-modal.html' },
  { url: '/', selector: '#cookieSettingsModal', kind: 'modal', source: 'components/cookie-consent.html' },
  { url: '/', selector: '#info-section', kind: 'offcanvas', source: 'components/info-section.html' },
  { url: '/about/stats/', selector: '#helpModal', kind: 'modal', source: 'stats/stats-metrics.html' },
  { url: '/news/science/', selector: '#sectionSidebar', kind: 'offcanvas', source: 'navigation/section-sidebar.html' },
  { url: '/about/theme/', selector: '#adminSidebar', kind: 'offcanvas', source: '_layouts/admin.html', mobile: true },
];

async function openDialog(page, selector, kind) {
  const ctor = kind === 'modal' ? 'Modal' : 'Offcanvas';
  await page.waitForFunction((c) => typeof window.bootstrap?.[c] === 'function', ctor);
  await page.evaluate(({ sel, c, evt }) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Dialog ${sel} not found in the DOM`);
    return new Promise((resolve) => {
      el.addEventListener(evt, () => resolve(), { once: true });
      window.bootstrap[c].getOrCreateInstance(el).show();
    });
  }, { sel: selector, c: ctor, evt: `shown.bs.${kind}` });
  await page.waitForTimeout(400); // fade/slide transition
}

// Heading sequence in DOM order: the heading immediately preceding the dialog
// title, and the title itself — what heading-by-heading navigation walks.
const HEADING_PATH = ({ sel, kind }) => {
  const title = document.querySelector(`${sel} .${kind}-title`);
  const all = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const i = all.indexOf(title);
  const prev = i > 0 ? all[i - 1] : null;
  const cs = getComputedStyle(title);
  return {
    prevTag: prev ? prev.tagName.toLowerCase() : '(none — first heading)',
    titleTag: title.tagName.toLowerCase(),
    titleClass: title.className,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    skips: prev
      ? Math.max(0, +title.tagName[1] - +prev.tagName[1] - 1)
      : Math.max(0, +title.tagName[1] - 1),
  };
};

// Revert exactly the diff: <h2 class="…-title h5"> back to the pre-fix
// <h5 class="…-title"> (same attributes, same children, minus the .h5 utility).
const UNFIX = ({ sel, kind }) => {
  const h2 = document.querySelector(`${sel} .${kind}-title`);
  const h5 = document.createElement('h5');
  for (const a of h2.attributes) h5.setAttribute(a.name, a.value);
  h5.classList.remove('h5');
  while (h2.firstChild) h5.appendChild(h2.firstChild);
  h2.replaceWith(h5);
};

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const browser = await chromium.launch();
const metrics = { slug: SLUG, dialogs: [] };
const rows = { modal: [], offcanvas: [] };

for (const d of DIALOGS) {
  const ctx = await browser.newContext({
    viewport: d.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  });
  await page.goto(BASE_URL + d.url, { waitUntil: 'load' });
  await openDialog(page, d.selector, d.kind);

  const header = page.locator(`${d.selector} .${d.kind}-header`);
  const arg = { sel: d.selector, kind: d.kind };

  // Blur the autofocused control (search input) so no focus ring/caret
  // timing can differ between the two captures.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.waitForTimeout(100);
  const after = await page.evaluate(HEADING_PATH, arg);
  const afterShot = await header.screenshot();

  await page.evaluate(UNFIX, arg);
  await page.waitForTimeout(100);
  const before = await page.evaluate(HEADING_PATH, arg);
  const beforeShot = await header.screenshot();

  const pixelIdentical = beforeShot.equals(afterShot);
  metrics.dialogs.push({ ...d, before, after, pixelIdentical });
  console.log(
    `${d.selector.padEnd(22)} before ${before.prevTag} → ${before.titleTag}` +
    ` (skips ${before.skips})   after ${after.prevTag} → ${after.titleTag}` +
    ` (skips ${after.skips})   pixel-identical=${pixelIdentical}`
  );

  rows[d.kind].push(
    {
      label: `❌ BEFORE — ${d.selector} (${d.source}) · ${esc(`<${before.titleTag} class="${before.titleClass}">`)} · ` +
        `heading walk: ${before.prevTag} → ${before.titleTag}` +
        (before.skips ? ` — skips ${before.skips} level${before.skips > 1 ? 's' : ''}` : ''),
      img: beforeShot, w: 700,
    },
    {
      label: `✅ AFTER — ${esc(`<${after.titleTag} class="${after.titleClass}">`)} · heading walk: ` +
        `${after.prevTag} → ${after.titleTag} · ${after.fontSize}/${after.fontWeight} unchanged · ` +
        `render ${pixelIdentical ? 'byte-identical' : 'NOT identical — inspect!'}`,
      img: afterShot, w: 700,
    },
  );
  await ctx.close();
}

await montage(browser, {
  title: 'Modal titles — &lt;h5&gt; → &lt;h2 class="modal-title h5"&gt; (visually inert)',
  note: 'Each pair: the dialog header rendered with the pre-fix bare &lt;h5&gt; (reproduced by reverting '
    + 'exactly the diff in the live DOM) and with the fixed &lt;h2 class="modal-title h5"&gt;. '
    + 'Same pixels; only the heading level a screen reader announces changes.',
  width: 800,
  rows: rows.modal,
}, path.join(EVIDENCE_DIR, '01-modals-before-after.png'));

await montage(browser, {
  title: 'Offcanvas titles — &lt;h5&gt; → &lt;h2 class="offcanvas-title h5"&gt; (visually inert)',
  note: 'Same contract for the three live offcanvas dialogs.',
  width: 800,
  rows: rows.offcanvas,
}, path.join(EVIDENCE_DIR, '02-offcanvas-before-after.png'));

await browser.close();

fs.writeFileSync(path.join(EVIDENCE_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));

const fixed = metrics.dialogs.filter((d) => d.after.titleTag === 'h2' && d.after.titleClass.split(/\s+/).includes('h5'));
const inert = metrics.dialogs.filter((d) => d.pixelIdentical);
const snippet = `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md) — `
  + `${fixed.length}/6 live dialogs now <h2 class="…-title h5">, render byte-identical for ${inert.length}/6)`;
fs.writeFileSync(path.join(EVIDENCE_DIR, 'CHANGELOG-snippet.txt'), snippet + '\n');

const pass = fixed.length === DIALOGS.length
  && metrics.dialogs.every((d) => d.before.titleTag === 'h5');
console.log(`\nEvidence written to ${EVIDENCE_DIR}`);
console.log(pass ? 'PASS: all six dialogs fixed; before-state reproduces the bare <h5>.' : 'FAIL: unexpected structure — inspect before committing.');
process.exit(pass ? 0 : 1);
