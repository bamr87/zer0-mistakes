/**
 * Before/after evidence for #373 — dead sidebar/TOC controls on layouts that
 * render no offcanvas.
 *
 * Unlike most evidence scripts here, this one cannot use `unfixCss`: the change
 * is Liquid, not CSS, so a single served site cannot show both states. It
 * instead drives TWO servers — one serving a build of the pre-fix ref, one
 * serving a build of this branch — and captures the same region from each.
 *
 * Usage:
 *   BEFORE_URL=http://127.0.0.1:4032 AFTER_URL=http://127.0.0.1:4031 \
 *     node test/visual/aria-controls-evidence.mjs
 *
 * Build the two sites first (the fix is server-rendered):
 *   git worktree add /tmp/before <pre-fix-ref>
 *   (cd /tmp/before && bundle exec jekyll build -d /tmp/site-before)
 *   bundle exec jekyll build -d /tmp/site-after
 *   then serve each directory on the ports above.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BEFORE_URL = process.env.BEFORE_URL || 'http://127.0.0.1:4032';
const AFTER_URL = process.env.AFTER_URL || 'http://127.0.0.1:4031';
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;
const OUT = path.join(process.cwd(), 'test/visual/evidence/dangling-aria-controls');

/** The two dangling ids had disjoint page sets, so both are represented. The
 *  third row is the control: a page that legitimately renders the offcanvas. */
const CASES = [
  {
    slug: 'navbar-toggle-fr-about',
    route: '/fr/about/theme/',
    viewport: { width: 375, height: 667 },
    clip: { x: 0, y: 0, width: 375, height: 120 },
    label: 'fr/about/theme/ — navbar (layout: admin, renders no #bdSidebar)',
  },
  {
    // 375px, NOT desktop: .bd-toc-fab is d-lg-none, so at >=lg the dead control
    // was in the DOM (dangling for assistive tech) but painted nothing. The
    // VISUAL half of this regression only exists below lg — a desktop crop
    // would have shown two identical empty rectangles.
    slug: 'toc-fab-404',
    route: '/404.html',
    viewport: { width: 375, height: 667 },
    clip: { x: 255, y: 480, width: 120, height: 130 },
    label: '404 @375px — TOC FAB (renders no #tocContents)',
  },
  {
    slug: 'control-docs-keeps-toggle',
    route: '/docs/',
    viewport: { width: 375, height: 667 },
    clip: { x: 0, y: 0, width: 375, height: 120 },
    label: 'docs/ — CONTROL: renders #bdSidebar, so the toggle must survive',
  },
];

async function measure(page) {
  return page.evaluate(() => {
    const dangling = [];
    for (const el of document.querySelectorAll('[aria-controls]')) {
      for (const id of (el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)) {
        if (!document.getElementById(id)) dangling.push(id);
      }
    }
    /** Painted size of each control, so the bundle distinguishes "removed from
     *  the DOM" from "removed from view" — they are different claims. */
    const painted = [...document.querySelectorAll('[aria-controls="bdSidebar"], [aria-controls="tocContents"]')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute('aria-controls'), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.w > 0 && x.h > 0);
    return {
      visible_offcanvas_controls: painted,
      aria_controls_total: document.querySelectorAll('[aria-controls]').length,
      dangling,
      has_bdSidebar_el: !!document.getElementById('bdSidebar'),
      has_tocContents_el: !!document.getElementById('tocContents'),
      bdSidebar_controls: document.querySelectorAll('[aria-controls="bdSidebar"]').length,
      tocContents_controls: document.querySelectorAll('[aria-controls="tocContents"]').length,
    };
  });
}

async function capture(browser, baseUrl, c, prefix) {
  const page = await browser.newPage({ viewport: c.viewport });
  const res = await page.goto(`${baseUrl}${c.route}`, { waitUntil: 'load', timeout: 30000 });
  if (!res || res.status() >= 400) {
    await page.close();
    return { skipped: `${c.route} -> ${res ? res.status() : 'no response'}` };
  }
  await page.waitForTimeout(600); // let deferred scripts settle
  await page.screenshot({ path: path.join(OUT, `${prefix}-${c.slug}.png`), clip: c.clip });
  const m = await measure(page);
  await page.close();
  return m;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});
  const metrics = { before_url: BEFORE_URL, after_url: AFTER_URL, cases: {} };

  for (const c of CASES) {
    const before = await capture(browser, BEFORE_URL, c, '01-before');
    const after = await capture(browser, AFTER_URL, c, '02-after');
    metrics.cases[c.slug] = { route: c.route, label: c.label, before, after };
    const b = before.dangling ? before.dangling.length : '?';
    const a = after.dangling ? after.dangling.length : '?';
    console.log(`${c.slug.padEnd(30)} dangling: ${b} -> ${a}`);
  }

  await browser.close();
  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
