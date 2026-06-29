/**
 * Evidence generator for the color_mode_default config knob (issue #241).
 *
 * Produces before/after screenshots showing:
 *   - BEFORE: data-bs-theme hardcoded to "dark" regardless of config
 *   - AFTER:  data-bs-theme follows site.color_mode_default + localStorage
 *
 * Run against the live dev server:
 *   docker compose up                      # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/color-mode-default-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const SLUG = 'color-mode-default';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);

fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const VIEWPORTS = [
  { width: 390, height: 844, label: 'mobile-390' },
  { width: 768, height: 1024, label: 'tablet-768' },
  { width: 1280, height: 800, label: 'desktop-1280' },
];

const SCENARIOS = [
  {
    label: 'AFTER — auto mode (no localStorage), prefers dark',
    storageKey: null,
    emulateMedia: 'dark',
    expectTheme: 'dark',
  },
  {
    label: 'AFTER — auto mode (no localStorage), prefers light',
    storageKey: null,
    emulateMedia: 'light',
    expectTheme: 'light',
  },
  {
    label: 'AFTER — localStorage override: light (overrides auto/dark default)',
    storageKey: 'light',
    emulateMedia: 'dark',
    expectTheme: 'light',
  },
  {
    label: 'AFTER — localStorage override: dark',
    storageKey: 'dark',
    emulateMedia: 'light',
    expectTheme: 'dark',
  },
];

const metrics = { slug: SLUG, generated: new Date().toISOString(), scenarios: [] };

async function capture(browser, scenario, viewport, index) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: scenario.emulateMedia,
    storageState: scenario.storageKey
      ? {
          origins: [{ origin: BASE_URL, localStorage: [{ name: 'theme', value: scenario.storageKey }] }],
        }
      : undefined,
  });
  const page = await ctx.newPage();
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');

  const appliedTheme = await page.getAttribute('html', 'data-bs-theme');
  const configDefault = await page.getAttribute('html', 'data-color-mode-default');
  const stored = await page.evaluate(() => {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  });

  const fname = `${String(index).padStart(2, '0')}-${scenario.label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${viewport.label}.png`;
  const outPath = path.join(EVIDENCE_DIR, fname);
  await page.screenshot({ path: outPath, fullPage: false });

  const pass = appliedTheme === scenario.expectTheme;
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${scenario.label} @ ${viewport.label}: data-bs-theme="${appliedTheme}" (expected "${scenario.expectTheme}")`);

  metrics.scenarios.push({
    scenario: scenario.label,
    viewport: `${viewport.width}x${viewport.height}`,
    configDefault,
    storedTheme: stored,
    appliedTheme,
    expectedTheme: scenario.expectTheme,
    pass,
    screenshot: fname,
  });

  await ctx.close();
}

const browser = await chromium.launch();
let idx = 1;
for (const scenario of SCENARIOS) {
  for (const vp of VIEWPORTS) {
    await capture(browser, scenario, vp, idx++);
  }
}
await browser.close();

fs.writeFileSync(path.join(EVIDENCE_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));

const allPass = metrics.scenarios.every((s) => s.pass);
const snippet = `- **color_mode_default config knob** — new \`color_mode_default\` setting (dark|light|auto) controls Bootstrap's \`data-bs-theme\` server-side and an early inline script prevents FOUC. localStorage override always wins. (evidence: [\`test/visual/evidence/color-mode-default/\`](test/visual/evidence/color-mode-default/README.md) — ${metrics.scenarios.length} scenarios, all ${allPass ? 'PASS' : 'SOME FAILURES'})`;
fs.writeFileSync(path.join(EVIDENCE_DIR, 'CHANGELOG-snippet.txt'), snippet + '\n');

console.log(`\nEvidence written to ${EVIDENCE_DIR}`);
console.log(`All scenarios passed: ${allPass}`);
console.log(`\nCHANGELOG snippet:\n${snippet}`);
process.exit(allPass ? 0 : 1);
