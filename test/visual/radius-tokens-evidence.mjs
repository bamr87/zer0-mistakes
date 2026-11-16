// Feature: ZER0-081
// slug: 'radius-tokens'
/**
 * Radius tokens — evidence generator (#390 / T-035).
 * ============================================================================
 * The change swaps ~60 hard-coded `border-radius` literals in `_sass/` for the
 * `--zer0-radius-*` tokens they already equalled (0.375rem → var(--zer0-radius),
 * 50% → var(--zer0-radius-circle), …). It is meant to be invisible by default
 * and to make every rounded surface follow the tokens once someone overrides
 * them. A screenshot cannot show "identical", so this generator MEASURES both
 * halves of that claim on the four routes the change touches most:
 *
 *   1. IDENTICAL BY DEFAULT — every element (and painted ::before/::after) on
 *      each route, at a phone and a desktop width, has its four computed corner
 *      radii read on the base branch (BEFORE_URL) and on this branch
 *      (BASE_URL). The two maps must match element for element.
 *   2. TOKEN-DRIVEN NOW — each token is set to a sentinel no stylesheet uses
 *      (`--zer0-radius: 13px`, …) and the elements whose corners take the
 *      sentinel are counted. Literals ignore the override; tokens follow it,
 *      so the count rises from base to branch.
 *
 * The montage shows the payoff of (2) on three components: each at its
 * default, then on base and branch with every radius token set to 0. A corner
 * that stays round on base is a literal the override never reached.
 *
 * Usage (two servers: this branch and the base branch, both built with
 * _config.yml,_config_dev.yml):
 *   BASE_URL=http://localhost:4000 BEFORE_URL=http://localhost:4001 \
 *     node test/visual/radius-tokens-evidence.mjs
 * Without BEFORE_URL it records the branch alone (no comparison).
 * CHROMIUM_PATH overrides the browser executable outside the jammy image.
 *
 * Outputs (test/visual/evidence/radius-tokens/):
 *   01-token-override.png   component crops: default, then base vs branch with
 *                           every radius token set to 0
 *   metrics.json            per route × width: elements compared, mismatches,
 *                           token consumers before/after
 *   CHANGELOG-snippet.txt
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const AFTER = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const BEFORE = (process.env.BEFORE_URL || '').replace(/\/+$/, '');
const OUT = 'test/visual/evidence/radius-tokens';
const ROUTES = ['/', '/docs/', '/features/', '/setup/'];
const WIDTHS = [390, 1280];

// A value per token that no stylesheet in the theme uses, so a corner that
// reads it back can only have got it from the token.
const SENTINELS = {
  '--zer0-radius-sm': '11px',
  '--zer0-radius': '13px',
  '--zer0-radius-lg': '17px',
  '--zer0-radius-xl': '19px',
  '--zer0-radius-pill': '23px',
  '--zer0-radius-circle': '29%',
};

// The montage override: every radius token set to 0, so a corner that stays
// round is one that ignores the tokens. A site does this in its own
// user-overrides.css (the setup wizard's "Corners" step writes the same kind
// of :root block).
const SQUARE = ':root { --zer0-radius-sm: 0; --zer0-radius: 0; --zer0-radius-lg: 0; --zer0-radius-xl: 0; --zer0-radius-circle: 0; }';

// Components whose corners moved onto the tokens, cropped for the montage.
// `prepare` puts a hidden one on screen.
const CROPS = [
  { route: '/docs/', label: '/docs/ content table (--zer0-radius-lg)', selector: '.content-table-wrapper' },
  { route: '/setup/', label: '/setup/ wizard stepper (--zer0-radius-circle markers)', selector: '.wizard-stepper' },
  { route: '/', label: '/ search modal (--zer0-radius-xl)', selector: '#siteSearchModal .modal-content',
    prepare: async (page) => {
      await page.locator('.navbar-utility-controls .nav-search-button').first().click();
      await page.locator('#siteSearchModal.show').waitFor({ timeout: 5000 });
    } },
];

const BADGE_URL_RE = /(img\.shields\.io|badge\.fury\.io|github\.com\/.+\/badge\.svg)/;
const SEED_CONSENT = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0',
    }));
  } catch { /* storage blocked: the banner just shows */ }
};

// In-page: { key: "tl tr br bl" } for every element and painted pseudo-element
// with a non-zero corner. The key is a DOM path, so the same element on two
// builds of the same page lines up.
const COLLECT = () => {
  const path = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      let i = 1;
      for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i += 1;
      parts.unshift(`${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}:${i}`);
    }
    return parts.join('>');
  };
  const corners = (cs) => [cs.borderTopLeftRadius, cs.borderTopRightRadius,
    cs.borderBottomRightRadius, cs.borderBottomLeftRadius].join(' ');
  const out = {};
  for (const el of document.body.querySelectorAll('*')) {
    const key = path(el);
    const own = corners(getComputedStyle(el));
    if (own !== '0px 0px 0px 0px') out[key] = own;
    for (const pseudo of ['::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (cs.content === 'none' || cs.content === 'normal') continue;
      const v = corners(cs);
      if (v !== '0px 0px 0px 0px') out[key + pseudo] = v;
    }
  }
  return out;
};

// In-page: how many elements take each sentinel when it is set on :root.
const CONSUMERS = (sentinels) => {
  const root = document.documentElement;
  const all = [...document.body.querySelectorAll('*')];
  const result = {};
  for (const [token, value] of Object.entries(sentinels)) {
    root.style.setProperty(token, value);
    const want = value.endsWith('%') ? null : value;
    let n = 0;
    for (const el of all) {
      const cs = getComputedStyle(el);
      const c = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
      if (want ? c.includes(want) : c.some((v) => v.includes(value))) n += 1;
    }
    root.style.removeProperty(token);
    result[token] = n;
  }
  return result;
};

async function open(browser, base, route, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.addInitScript(SEED_CONSENT);
  await page.route(BADGE_URL_RE, (r) => r.abort());
  await page.route(/\/livereload\.js(\?|$)/, (r) => r.abort());
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  return page;
}

async function measure(browser, base, route, width) {
  const page = await open(browser, base, route, width);
  const radii = await page.evaluate(COLLECT);
  const consumers = await page.evaluate(CONSUMERS, SENTINELS);
  await page.close();
  return { radii, consumers };
}

// The compiled stylesheet, comment-free, one trimmed declaration per entry,
// with every radius token resolved the way the browser resolves it: a declared
// token to its value, an undeclared one (the old --zer0-radius-md) to its
// fallback. What remains between base and branch is what really changed.
function normalizeCss(text, tokens) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/var\((--zer0-radius[\w-]*)(?:\s*,\s*([^()]+))?\)/g,
      (m, name, fallback) => tokens[name] || (fallback ? fallback.trim() : m))
    .replace(/(^|[^\d.])\.(\d)/g, (m, before, digit) => `${before}0.${digit}`) // .125rem → 0.125rem
    .split('\n').map((s) => s.trim()).filter(Boolean);
}

// Multiset difference: lines only one side has, with counts.
function onlyIn(a, b) {
  const left = new Map();
  for (const l of b) left.set(l, (left.get(l) || 0) + 1);
  const out = new Map();
  for (const l of a) {
    const n = left.get(l) || 0;
    if (n) left.set(l, n - 1); else out.set(l, (out.get(l) || 0) + 1);
  }
  return [...out].map(([line, count]) => ({ line, count }));
}

async function compareCompiledCss(browser) {
  const page = await open(browser, AFTER, '/', 1280);
  const tokens = await page.evaluate((names) => Object.fromEntries(names.map((n) =>
    [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()])), Object.keys(SENTINELS));
  await page.close();
  const [before, after] = await Promise.all([BEFORE, AFTER].map(async (base) =>
    normalizeCss(await (await fetch(`${base}/assets/css/main.css`)).text(), tokens)));
  return {
    tokens,
    declarationsBefore: before.length,
    declarationsAfter: after.length,
    onlyBefore: onlyIn(before, after),
    onlyAfter: onlyIn(after, before),
  };
}

// One component, cropped at 2x, optionally with every radius token zeroed.
async function cropShot(browser, base, crop, { square }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.addInitScript(SEED_CONSENT);
  await page.route(BADGE_URL_RE, (r) => r.abort());
  await page.route(/\/livereload\.js(\?|$)/, (r) => r.abort());
  await page.goto(base + crop.route, { waitUntil: 'load' });
  if (square) await page.addStyleTag({ content: SQUARE });
  const el = page.locator(crop.selector).first();
  await el.waitFor({ state: 'attached', timeout: 10000 });
  if (crop.prepare) await crop.prepare(page);
  else await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await el.boundingBox();
  const pad = 10;
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
    width: Math.min(box.width + pad * 2, 900), height: Math.min(box.height + pad * 2, 260) };
  const img = await page.screenshot({ clip });
  await page.close();
  return { img, w: Math.round(clip.width) };
}

const main = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launch);
  const metrics = {
    slug: 'radius-tokens', after: AFTER, before: BEFORE || null, routes: ROUTES, widths: WIDTHS,
    sentinels: SENTINELS, results: [], totals: { compared: 0, mismatches: 0 },
  };

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const after = await measure(browser, AFTER, route, width);
      const row = { route, width, elementsWithRadius: Object.keys(after.radii).length,
        tokenConsumers: { after: after.consumers } };
      if (BEFORE) {
        const before = await measure(browser, BEFORE, route, width);
        const keys = new Set([...Object.keys(before.radii), ...Object.keys(after.radii)]);
        const mismatches = [];
        for (const k of keys) {
          if (before.radii[k] !== after.radii[k]) {
            mismatches.push({ element: k, before: before.radii[k] || 'none', after: after.radii[k] || 'none' });
          }
        }
        row.compared = keys.size;
        row.mismatches = mismatches;
        row.tokenConsumers.before = before.consumers;
        metrics.totals.compared += keys.size;
        metrics.totals.mismatches += mismatches.length;
      }
      metrics.results.push(row);
      const c = row.tokenConsumers;
      console.log(`  ${route} @${width}px  radii=${row.elementsWithRadius}` +
        (BEFORE ? `  compared=${row.compared}  mismatches=${row.mismatches.length}` : '') +
        `  --zer0-radius consumers ${BEFORE ? c.before['--zer0-radius'] + ' → ' : ''}${c.after['--zer0-radius']}`);
    }
  }

  if (BEFORE) {
    metrics.compiledCss = await compareCompiledCss(browser);
    console.log(`  main.css with radius tokens resolved: ${metrics.compiledCss.onlyBefore.length} line kinds only ` +
      `in base, ${metrics.compiledCss.onlyAfter.length} only in branch`);
    const rows = [];
    for (const crop of CROPS) {
      const plain = await cropShot(browser, AFTER, crop, { square: false });
      const before = await cropShot(browser, BEFORE, crop, { square: true });
      const after = await cropShot(browser, AFTER, crop, { square: true });
      rows.push(
        { label: `${crop.label}: default (base and branch measure identical)`, ...plain },
        { label: 'BEFORE (base), every --zer0-radius-* token set to 0: the hard-coded corners stay round', ...before },
        { label: 'AFTER (this PR), same override: the corners follow the tokens', ...after });
    }
    await montage(browser, {
      title: 'Radius tokens: default rendering unchanged, token overrides now reach these surfaces',
      note: `Default corner radii compared on ${ROUTES.join(' ')} at ${WIDTHS.join(' / ')}px: ` +
        `${metrics.totals.compared} element radii, ${metrics.totals.mismatches} differences. ` +
        `Override used below: ${SQUARE}`,
      rows, width: 1000,
    }, `${OUT}/01-token-override.png`);
  }

  fs.writeFileSync(`${OUT}/metrics.json`, `${JSON.stringify(metrics, null, 2)}\n`);
  fs.writeFileSync(`${OUT}/CHANGELOG-snippet.txt`,
    `<!-- CHANGELOG snippet — evidence: test/visual/evidence/radius-tokens/ -->\n` +
    `  (evidence: [\`test/visual/evidence/radius-tokens/\`](test/visual/evidence/radius-tokens/README.md)` +
    (BEFORE ? ` — ${metrics.totals.compared} element radii compared, ${metrics.totals.mismatches} changed)\n` : ')\n'));
  await browser.close();
  console.log(`[radius-tokens] done → ${OUT}/`);
  if (BEFORE && metrics.totals.mismatches) process.exitCode = 1;
};

main().catch((err) => { console.error(err); process.exit(1); });
