// =============================================================================
// sidebar-modes-evidence.mjs — before/after evidence for the sidebar refactor
// =============================================================================
// The sidebar refactor (PR #273) is a DOM/template change, not a CSS fix, so
// the kit's `unfixCss` before-state cannot reproduce it on one server.
// Instead this script drives TWO builds of the site:
//
//   BEFORE_URL  a build of main            (default http://127.0.0.1:4012)
//   AFTER_URL   a build of the PR branch   (default http://127.0.0.1:4011)
//
// and composes labelled before/after montages with the shared `montage`
// helper from evidence-kit.mjs (reuse, don't reinvent), plus a metrics.json
// of structural counts per route/state.
//
// Usage:
//   python3 -m http.server 4012 --directory <main-build>   &
//   python3 -m http.server 4011 --directory _site           &
//   node test/visual/sidebar-modes-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import { montage } from './evidence-kit.mjs';
import fs from 'fs';

const BEFORE = process.env.BEFORE_URL || 'http://127.0.0.1:4012';
const AFTER = process.env.AFTER_URL || process.env.BASE_URL || 'http://127.0.0.1:4011';
const slug = 'sidebar-modes';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// Structural counts that summarize each state (also asserted by
// sidebar-modes.spec.js — these are the numbers behind the pictures).
const MEASURE = () => ({
  aside: document.querySelectorAll('aside.bd-sidebar').length,
  navToggle: document.querySelectorAll('header#navbar [aria-controls="bdSidebar"]').length,
  sidebarLinks: document.querySelectorAll('#bdSidebar .nav-tree-link, #bdSidebar .list-group-item a').length,
  collectionTree: document.querySelectorAll('.sidebar-collection').length,
  countBadges: document.querySelectorAll('.sidebar-categories .badge').length,
  activeAriaCurrent: document.querySelectorAll('#bdSidebar [aria-current="page"]').length,
});

const SCENES = [
  {
    key: 'docs-auto',
    route: '/docs/obsidian/getting-started/',
    caption: 'Docs page with no per-page nav (relies on the _config.yml default). BEFORE: the default `nav: tree` never resolved (no tree.yml) → no left column. AFTER: `nav: auto` resolves to the curated docs.yml tree.',
  },
  {
    key: 'notes-collection',
    route: '/notes/git-cheatsheet/',
    caption: 'Notes page (`nav: auto`, no curated notes.yml). BEFORE: flat non-collapsible list-group. AFTER: collection tree with the collection-metadata heading (Notes + icon) and aria-current active link.',
  },
  {
    key: 'categories',
    route: '/faq/',
    caption: 'Categories mode (pages-scope default). BEFORE: plain always-collapsed toggles. AFTER: post-count badges per term; the group containing the current page starts expanded.',
  },
  {
    key: 'homepage-guard',
    route: '/',
    caption: 'Homepage (landing layout — renders no #bdSidebar panel). Must be UNCHANGED: the shared resolver must not put a dead sidebar toggle in the navbar. Both bands should be identical.',
  },
];

const browser = await chromium.launch();
const metrics = { slug, before: BEFORE, after: AFTER, scenes: [] };
let n = 0;
const next = () => String(++n).padStart(2, '0');

async function grab(base, route, clip) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const m = await page.evaluate(MEASURE);
  const img = await page.screenshot({ clip });
  await page.close();
  return { m, img };
}

for (const scene of SCENES) {
  // Homepage scene shows the full navbar band; sidebar scenes show the
  // left column + start of the content area below the navbar.
  const clip = scene.key === 'homepage-guard'
    ? { x: 0, y: 0, width: 1280, height: 220 }
    : { x: 0, y: 0, width: 760, height: 720 };
  const before = await grab(BEFORE, scene.route, clip);
  const after = await grab(AFTER, scene.route, clip);
  metrics.scenes.push({ key: scene.key, route: scene.route, before: before.m, after: after.m });
  console.log(`[${scene.key}] before=${JSON.stringify(before.m)}`);
  console.log(`[${scene.key}]  after=${JSON.stringify(after.m)}`);
  await montage(browser, {
    title: `Sidebar modes — ${scene.key} (${scene.route})`,
    note: scene.caption,
    width: scene.key === 'homepage-guard' ? 1360 : 840,
    rows: [
      { label: `BEFORE — main @ ${scene.route}`, img: before.img },
      { label: `AFTER — PR #273 @ ${scene.route}`, img: after.img },
    ],
  }, `${outDir}/${next()}-${scene.key}.png`);
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md)` +
  ` — collection-aware sidebar modes, before/after across 4 routes)`);
console.log(`wrote ${outDir}/metrics.json + CHANGELOG-snippet.txt`);
await browser.close();
