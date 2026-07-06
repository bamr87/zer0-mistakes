// =============================================================================
// sweep.mjs — deterministic UI/UX audit sweep (tier 1 of the ui-audit loop)
// =============================================================================
// Walks the theme's critical routes at three viewports against a running
// Jekyll site and captures, per route × viewport:
//   - a full-page screenshot            (output/screens/<route>-<viewport>.png)
//   - axe-core violations (WCAG 2.1 AA)
//   - console errors emitted during load
//   - horizontal-overflow state (page wider than the viewport)
// plus one global pass over every same-origin link found during the sweep
// (broken internal links). Everything lands in output/report.json +
// output/report.md for the ui-auditor agent (tier 2) and the workflow's
// sticky issue. No tokens are spent here — this tier is pure Playwright.
//
// Usage:  BASE_URL=http://127.0.0.1:4000 node test/ui-audit/sweep.mjs
// Exit code is always 0 unless the sweep itself crashes — findings are data,
// not failures (the nightly/critical tiers are the pass/fail gates).
// =============================================================================

import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const OUT_DIR = path.join('test', 'ui-audit', 'output');
const SCREEN_DIR = path.join(OUT_DIR, 'screens');

// The critical user journeys. One representative per surface — the point is
// breadth across what a visitor touches, not exhaustive route coverage.
const ROUTES = ['/', '/quickstart/', '/docs/', '/features/', '/about/', '/news/'];

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

const slug = (s) => s.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';

async function main() {
  await mkdir(SCREEN_DIR, { recursive: true });
  const browser = await chromium.launch();
  const report = { base_url: BASE_URL, routes: [], broken_links: [] };
  const seenLinks = new Set();

  // Discover one real article from the homepage so the sweep always includes
  // the article layout even as content changes.
  const probe = await browser.newPage();
  try {
    await probe.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const article = await probe
      .locator('a[href^="/posts/"]')
      .first()
      .getAttribute('href', { timeout: 5000 })
      .catch(() => null);
    if (article) ROUTES.push(article);
  } finally {
    await probe.close();
  }

  for (const route of ROUTES) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
      });

      const entry = { route, viewport: vpName, status: null };
      try {
        const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 30000 });
        entry.status = resp ? resp.status() : null;
        await page.waitForTimeout(1000); // let deferred scripts settle

        entry.screenshot = path.join('screens', `${slug(route)}-${vpName}.png`);
        await page.screenshot({ path: path.join(OUT_DIR, entry.screenshot), fullPage: true });

        entry.overflow = await page.evaluate(() => {
          const icb = document.documentElement.clientWidth;
          return {
            page_wider_than_viewport: document.documentElement.scrollWidth > icb + 1,
            scroll_width: document.documentElement.scrollWidth,
            viewport_width: icb,
          };
        });

        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .analyze();
        entry.axe_violations = axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        }));

        entry.console_errors = consoleErrors;

        // Collect same-origin links once per route (desktop pass only).
        if (vpName === 'desktop') {
          const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
          for (const h of hrefs) {
            if (!h || !h.startsWith('/') || h.startsWith('//')) continue;
            seenLinks.add(h.split('#')[0]);
          }
        }
      } catch (e) {
        entry.error = String(e).slice(0, 300);
      } finally {
        await page.close();
      }
      report.routes.push(entry);
    }
  }

  // Broken-internal-link pass over every unique same-origin href seen.
  const linkPage = await browser.newPage();
  for (const href of [...seenLinks].sort()) {
    if (!href) continue;
    try {
      const resp = await linkPage.request.get(`${BASE_URL}${href}`, { timeout: 15000 });
      if (resp.status() >= 400) report.broken_links.push({ href, status: resp.status() });
    } catch {
      report.broken_links.push({ href, status: 'unreachable' });
    }
  }
  await linkPage.close();
  await browser.close();

  await writeFile(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  // Human/agent-readable summary.
  const lines = ['# UI audit sweep', '', `Base: ${BASE_URL}`, ''];
  for (const r of report.routes) {
    const issues = [];
    if (r.error) issues.push(`load error: ${r.error}`);
    if (r.status && r.status >= 400) issues.push(`HTTP ${r.status}`);
    if (r.overflow?.page_wider_than_viewport) {
      issues.push(`horizontal overflow (${r.overflow.scroll_width}px > ${r.overflow.viewport_width}px)`);
    }
    if (r.axe_violations?.length) {
      issues.push(`${r.axe_violations.length} axe violation type(s): ${r.axe_violations.map((v) => v.id).join(', ')}`);
    }
    if (r.console_errors?.length) issues.push(`${r.console_errors.length} console error(s)`);
    lines.push(`- \`${r.route}\` @ ${r.viewport}: ${issues.length ? issues.join('; ') : 'clean'}`);
  }
  lines.push('', `Broken internal links: ${report.broken_links.length}`);
  for (const b of report.broken_links) lines.push(`- \`${b.href}\` → ${b.status}`);
  await writeFile(path.join(OUT_DIR, 'report.md'), lines.join('\n') + '\n');

  const flagged =
    report.broken_links.length +
    report.routes.filter(
      (r) => r.error || r.overflow?.page_wider_than_viewport || r.axe_violations?.length || r.console_errors?.length
    ).length;
  console.log(`Sweep complete: ${report.routes.length} route×viewport passes, ${flagged} flagged entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
