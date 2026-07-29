/**
 * Evidence generator — mobile overlay stacking fix (.zer0-bg-body).
 *
 * Produces labelled BEFORE/AFTER screenshots + metrics.json for the three
 * consumer-reported mobile failures caused by the old child-elevation rule:
 *   1. #bdSidebar offcanvas trapped below the fixed header (close button
 *      not hit-testable),
 *   2. #bdNavbar offcanvas painting behind Bootstrap's backdrop (links not
 *      hit-testable),
 *   3. FABs losing `position: fixed` → 16px horizontal page scroll.
 *
 * Run with two builds of the site served statically:
 *   BEFORE_URL=http://127.0.0.1:4012 AFTER_URL=http://127.0.0.1:4013 \
 *     node test/visual/mobile-overlay-stacking-evidence.mjs
 *
 * (Each build: `bundle exec jekyll build --config _config.yml,_config_dev.yml`
 * at the respective commit, then e.g. `python3 -m http.server 4012 -d _site`.)
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SLUG = 'mobile-overlay-stacking';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const STATES = [
  { label: 'before', base: process.env.BEFORE_URL || 'http://127.0.0.1:4012' },
  { label: 'after', base: process.env.AFTER_URL || 'http://127.0.0.1:4013' },
];

const MOBILE = { width: 390, height: 844 };

const hitTest = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { found: false };
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return {
    found: true,
    hitTag: hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(/\s+/)[0] : null,
    hitInside: !!(hit && (hit === el || el.contains(hit))),
  };
};

const overflowProbe = () => {
  const fab = document.querySelector('.obsidian-local-graph-fab, .bd-toc-fab');
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    fabPosition: fab ? getComputedStyle(fab).position : null,
    mainZ: getComputedStyle(document.querySelector('main#main-content')).zIndex,
  };
};

const run = async () => {
  // CHROMIUM_PATH: use a system/pre-provisioned Chromium when the pinned
  // @playwright/test version has no downloaded browser of its own.
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const metrics = {};

  for (const state of STATES) {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    metrics[state.label] = {};

    // ── Scenario 1: docs sidebar offcanvas vs fixed header ──────────────
    await page.goto(`${state.base}/docs/`, { waitUntil: 'load' });
    const sidebarToggle = page
      .locator('.bd-sidebar-toggle:visible, button[aria-controls="bdSidebar"]:visible')
      .first();
    if ((await sidebarToggle.count()) > 0) {
      await sidebarToggle.click();
      await page.waitForTimeout(700);
      metrics[state.label].sidebarClose = await page.evaluate(
        hitTest,
        '#bdSidebar .offcanvas-header .btn-close'
      );
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `${state.label}-sidebar-offcanvas.png`),
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── Scenario 2: main-nav offcanvas vs backdrop ──────────────────────
    await page.goto(`${state.base}/`, { waitUntil: 'load' });
    const navToggle = page
      .locator('button[data-bs-target="#bdNavbar"]:visible, button[aria-controls="bdNavbar"]:visible')
      .first();
    if ((await navToggle.count()) > 0) {
      await navToggle.click();
      await page.waitForTimeout(700);
      metrics[state.label].navLink = await page.evaluate(
        hitTest,
        '#bdNavbar .offcanvas-body .nav-link'
      );
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `${state.label}-navbar-offcanvas.png`),
      });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── Scenario 3: horizontal overflow / FAB positioning ───────────────
    await page.goto(`${state.base}/docs/`, { waitUntil: 'load' });
    metrics[state.label].overflow = await page.evaluate(overflowProbe);
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, `${state.label}-docs-page.png`),
    });

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'metrics.json'),
    JSON.stringify(metrics, null, 2)
  );
  console.log(JSON.stringify(metrics, null, 2));

  const b = metrics.before || {};
  const a = metrics.after || {};
  const summary = [
    `sidebar close hit-testable:  before=${b.sidebarClose?.hitInside} (hit ${b.sidebarClose?.hitTag})  after=${a.sidebarClose?.hitInside} (hit ${a.sidebarClose?.hitTag})`,
    `nav link hit-testable:       before=${b.navLink?.hitInside} (hit ${b.navLink?.hitTag})  after=${a.navLink?.hitInside} (hit ${a.navLink?.hitTag})`,
    `main z-index:                before=${b.overflow?.mainZ}  after=${a.overflow?.mainZ}`,
    `scrollWidth (390 viewport):  before=${b.overflow?.scrollWidth}  after=${a.overflow?.scrollWidth}`,
  ].join('\n');
  console.log('\n' + summary);
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'summary.txt'), summary + '\n');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
