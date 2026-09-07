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
//         UI_AUDIT_ROUTES=/,/docs/ node test/ui-audit/sweep.mjs   (subset)
//
// Findings are data, not failures — a page with axe violations still exits 0
// (the nightly/critical tiers are the pass/fail gates). But a sweep that
// captured NOTHING is a broken harness rather than a clean audit, and exits 1:
// for six consecutive weeks every one of the 18 passes timed out, no screenshot
// was written, and the workflow reported success each time (#321). "Exit 0
// always" is what made total failure indistinguishable from a clean run.
//
// Two rules follow from #468, where that floor was not enough because only SOME
// measurements died (screenshots kept working, so the harness looked alive):
//
//   1. Every measurement is INDEPENDENT. Each records its own error on
//      `entry.errors.<name>`; a broken one costs exactly itself. One `try`
//      around the whole per-route body is what let a single library misuse
//      erase four working measurements on every route.
//   2. ABSENT IS NOT ZERO. A measurement that threw is reported as UNKNOWN,
//      never as a clean result, and one that failed on EVERY route is a harness
//      fault that exits 1 — the same floor as capturing nothing, applied per
//      measurement.
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
// UI_AUDIT_ROUTES narrows the list so a harness check can prove the sweep can
// capture at all without paying for the full 18-pass matrix (see
// test/ui-audit/check-audit-serve.sh). CI never sets it.
const DEFAULT_ROUTES = ['/', '/quickstart/', '/docs/', '/features/', '/about/', '/news/'];
const ROUTES = (process.env.UI_AUDIT_ROUTES || '')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);
if (ROUTES.length === 0) ROUTES.push(...DEFAULT_ROUTES);

// Fault injection, for the harness's own regression check only: names a
// measurement that must throw, so check-audit-serve.sh can PROVE a broken
// measurement costs exactly itself rather than asserting it by inspection.
// CI's audit never sets this.
const FAULT_INJECT = new Set(
  (process.env.UI_AUDIT_FAULT_INJECT || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

const slug = (s) => s.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';

async function main() {
  await mkdir(SCREEN_DIR, { recursive: true });
  const browser = await chromium.launch();
  // `capture` is the harness's own health, kept separate from findings so a
  // consumer can tell "the audit ran and found N things" from "the audit
  // captured nothing" — the distinction the sticky issue lacked (#321).
  const report = {
    base_url: BASE_URL,
    capture: { attempted: 0, captured: 0 },
    routes: [],
    // Distinct from broken_links.length: "0 broken out of 137 crawled" and "0
    // broken because the crawl never ran" are the same empty array otherwise,
    // and telling those apart is the whole point of this harness (#468).
    links_checked: 0,
    broken_links: [],
  };
  const seenLinks = new Set();

  // Discover one real article from the homepage so the sweep always includes
  // the article layout even as content changes.
  const probe = await browser.newPage();
  try {
    // Non-fatal: the discovered article route is a nice-to-have. A cold-start
    // timeout here killed the ENTIRE 2026-07-13 audit run (per-route gotos
    // below are try/caught; this probe wasn't). Longer timeout to absorb the
    // server's first-hit warm-up, and swallow failures — the sweep still
    // audits every static ROUTE and records per-route errors as findings.
    await probe
      .goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      .catch(() => null);
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
      // @axe-core/playwright REFUSES a page made by browser.newPage() and
      // throws "Please use browser.newContext()". That single misuse cost every
      // axe, console, overflow and link result on every route (#468).
      // reducedMotion is set on the context so it applies during load: a
      // continuous animation loop is what kept /features/ from ever reaching a
      // stable state for the screenshotter.
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
      });

      const entry = { route, viewport: vpName, status: null, errors: {} };
      report.capture.attempted += 1;

      // Every measurement is independent. One try around all of them is what
      // turned a single library misuse into a total blackout: the axe throw
      // discarded the screenshot, overflow, console and link data ALREADY
      // gathered for that route, and the report then rendered the absence as
      // "0 violations" (#468). A broken measurement must cost exactly itself.
      const measure = async (name, fn) => {
        try {
          await fn();
          return true;
        } catch (e) {
          entry.errors[name] = String(e).replace(/\s+/g, ' ').slice(0, 300);
          return false;
        }
      };

      // Navigation is the one genuine precondition: if the page never loaded
      // there is nothing to measure. Kept as `entry.error` so the existing
      // "load error" semantics (report.md, the workflow's counters) still hold.
      let loaded = true;
      try {
        const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'load', timeout: 30000 });
        entry.status = resp ? resp.status() : null;
        await page.waitForTimeout(1000); // let deferred scripts settle
      } catch (e) {
        entry.error = String(e).replace(/\s+/g, ' ').slice(0, 300);
        loaded = false;
      }

      if (loaded) {
        await measure('screenshot', async () => {
          const rel = path.join('screens', `${slug(route)}-${vpName}.png`);
          // Generous timeout: these are fullPage shots of pages tens of
          // thousands of pixels tall, which the default 30s does not cover.
          await page.screenshot({ path: path.join(OUT_DIR, rel), fullPage: true, timeout: 90000 });
          entry.screenshot = rel;
          report.capture.captured += 1;
        });

        await measure('overflow', async () => {
          entry.overflow = await page.evaluate(() => {
            const icb = document.documentElement.clientWidth;
            return {
              page_wider_than_viewport: document.documentElement.scrollWidth > icb + 1,
              scroll_width: document.documentElement.scrollWidth,
              viewport_width: icb,
            };
          });
        });

        await measure('axe', async () => {
          if (FAULT_INJECT.has('axe')) throw new Error('injected axe failure (UI_AUDIT_FAULT_INJECT)');
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
        });

        // Collect same-origin links once per route (desktop pass only).
        if (vpName === 'desktop') {
          await measure('links', async () => {
            const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
            for (const h of hrefs) {
              if (!h || !h.startsWith('/') || h.startsWith('//')) continue;
              seenLinks.add(h.split('#')[0]);
            }
          });
        }
      }

      // Console capture is wired up at page creation, so whatever was emitted
      // is data even when a later measurement failed — or when the page never
      // finished loading.
      entry.console_errors = consoleErrors;
      if (Object.keys(entry.errors).length === 0) delete entry.errors;

      await context.close();
      report.routes.push(entry);
    }
  }

  // Broken-internal-link pass over every unique same-origin href seen.
  const linkContext = await browser.newContext();
  const linkPage = await linkContext.newPage();
  for (const href of [...seenLinks].sort()) {
    if (!href) continue;
    report.links_checked += 1;
    try {
      const resp = await linkPage.request.get(`${BASE_URL}${href}`, { timeout: 15000 });
      if (resp.status() >= 400) report.broken_links.push({ href, status: resp.status() });
    } catch {
      report.broken_links.push({ href, status: 'unreachable' });
    }
  }
  await linkContext.close();
  await browser.close();

  // Human/agent-readable summary.
  const lines = ['# UI audit sweep', '', `Base: ${BASE_URL}`, ''];
  for (const r of report.routes) {
    const issues = [];
    const faults = [];
    if (r.error) faults.push(`load error: ${r.error}`);
    if (r.status && r.status >= 400) issues.push(`HTTP ${r.status}`);

    // A measurement that threw is a HARNESS fault, reported as unknown state.
    // It must never be summarised as a clean result — reporting a failed axe
    // scan as "0 violations" is the exact confusion this sweep was filing as
    // UI findings for weeks (#468). Absent is not zero.
    if (r.errors?.screenshot) faults.push(`screenshot FAILED — no visual evidence (${r.errors.screenshot})`);
    if (r.errors?.overflow) faults.push(`overflow check FAILED — layout state unknown (${r.errors.overflow})`);
    if (r.errors?.links) faults.push(`link collection FAILED — links from this route not crawled (${r.errors.links})`);

    if (r.errors?.axe) {
      faults.push(`axe scan FAILED — accessibility state UNKNOWN, not clean (${r.errors.axe})`);
    } else if (r.axe_violations?.length) {
      issues.push(`${r.axe_violations.length} axe violation type(s): ${r.axe_violations.map((v) => v.id).join(', ')}`);
    }

    if (r.overflow?.page_wider_than_viewport) {
      issues.push(`horizontal overflow (${r.overflow.scroll_width}px > ${r.overflow.viewport_width}px)`);
    }
    if (r.console_errors?.length) issues.push(`${r.console_errors.length} console error(s)`);

    const parts = [...faults, ...issues];
    lines.push(`- \`${r.route}\` @ ${r.viewport}: ${parts.length ? parts.join('; ') : 'clean'}`);
  }

  // "Broken: 0" is meaningless without the denominator — it is what a dead
  // crawl and a healthy site both print.
  lines.push('', `Internal links crawled: ${report.links_checked}; broken: ${report.broken_links.length}`);
  if (report.links_checked === 0) {
    lines.push('', '> [!CAUTION]', '> **No internal links were crawled**, so "broken: 0" means the check did', '> not run — not that every link is healthy.');
  }
  for (const b of report.broken_links) lines.push(`- \`${b.href}\` → ${b.status}`);

  // Per-measurement harness health. The capture floor below only fires when
  // NOTHING was captured; the 2026-09-07 run is why that was not enough —
  // screenshots succeeded on 18 of 21 passes, so the guard stayed quiet while
  // axe, overflow, console and links were blacked out on EVERY route, and the
  // report rendered the blackout as a mostly-healthy audit (#468).
  const MEASUREMENTS = ['screenshot', 'overflow', 'axe', 'links'];
  const loadedRoutes = report.routes.filter((r) => !r.error);
  report.harness = { measurement_errors: {}, blacked_out: [] };
  for (const m of MEASUREMENTS) {
    const eligible = m === 'links' ? loadedRoutes.filter((r) => r.viewport === 'desktop') : loadedRoutes;
    const failed = eligible.filter((r) => r.errors?.[m]).length;
    report.harness.measurement_errors[m] = { eligible: eligible.length, failed };
    if (eligible.length > 0 && failed === eligible.length) report.harness.blacked_out.push(m);
  }

  // Findings and faults are different things and are counted separately, so a
  // harness outage can never masquerade as a pile of UI problems.
  report.flagged = report.broken_links.length +
    report.routes.filter(
      (r) =>
        (r.status && r.status >= 400) ||
        r.overflow?.page_wider_than_viewport ||
        r.axe_violations?.length ||
        r.console_errors?.length
    ).length;
  report.harness_errors = report.routes.filter((r) => r.error || r.errors).length;

  if (report.harness.blacked_out.length) {
    lines.splice(
      1,
      0,
      '',
      '> [!CAUTION]',
      `> **${report.harness.blacked_out.join(', ')} failed on EVERY route.**`,
      '> Those measurements are ABSENT, not clean. Fix the harness before',
      '> reading anything below as a UI finding.'
    );
  }
  if (report.capture.captured === 0) {
    lines.splice(
      1,
      0,
      '',
      '> [!CAUTION]',
      `> **Captured 0 of ${report.capture.attempted} passes — these are not UI findings.**`,
      '> Every entry below is a capture failure. The harness is broken; the',
      '> results are void until it is green again.'
    );
  }
  await writeFile(path.join(OUT_DIR, 'report.md'), lines.join('\n') + '\n');
  // Written LAST, so report.json carries the harness/flagged rollups the
  // workflow and check-audit-serve.sh read. It used to be written before they
  // were computed, which would have shipped them as undefined.
  await writeFile(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  console.log(
    `Sweep complete: ${report.routes.length} route×viewport passes, ` +
      `${report.capture.captured} captured, ${report.flagged} flagged finding(s), ` +
      `${report.harness_errors} pass(es) with a harness error.`
  );

  // The capture floor. Findings are data; capturing nothing is a fault. Without
  // this the caller cannot tell "the UI is clean" from "the browser never
  // reached the site", which is exactly how #321 stayed green for six weeks.
  if (report.capture.attempted > 0 && report.capture.captured === 0) {
    console.error(
      `\nUI audit harness failure: 0 of ${report.capture.attempted} passes captured a screenshot.\n` +
        `Base URL was ${BASE_URL}. This is a harness fault, not a UI finding.`
    );
    process.exitCode = 1;
  }

  // The same floor, applied per measurement. A measurement that failed on every
  // eligible route produced no data at all, and "no data" reported as "clean"
  // is the failure mode this whole harness exists to prevent. #321 was caught
  // by the capture floor above; #468 slipped past it because only the OTHER
  // four measurements died.
  if (report.harness.blacked_out.length) {
    console.error(
      `\nUI audit harness failure: ${report.harness.blacked_out.join(', ')} failed on every route.\n` +
        `Those results are absent, not clean. This is a harness fault, not a UI finding.`
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
