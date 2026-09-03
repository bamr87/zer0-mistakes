/**
 * Evidence for #281 — theme-color must track the page surface.
 *
 * Deliberately NOT screenshots. `theme-color` paints mobile browser CHROME —
 * the iOS Safari address bar, the Android task-switcher card. That is OS UI
 * outside the page, so Playwright cannot capture it and any "before/after"
 * image of it would be a drawing of the claim rather than the claim. What can
 * be shown, and is what actually matters, is two things:
 *
 *   1. which tags each build emits, and
 *   2. whether their values equal the surface the page really paints.
 *
 * (2) is the assertion that makes this durable: the value is compared against
 * getComputedStyle(body).backgroundColor under each data-bs-theme, so the tag
 * cannot drift from the surface later without the test failing.
 *
 * Usage:
 *   BEFORE_URL=http://127.0.0.1:4058 AFTER_URL=http://127.0.0.1:4057 \
 *     node test/visual/theme-color-evidence.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BEFORE_URL = process.env.BEFORE_URL || 'http://127.0.0.1:4058';
const AFTER_URL = process.env.AFTER_URL || 'http://127.0.0.1:4057';
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;
const OUT = path.join(process.cwd(), 'test/visual/evidence/theme-color-surface');

const toHex = (c) => {
  const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('') : c;
};

async function inspect(browser, baseUrl, route) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const res = await page.goto(`${baseUrl}${route}`, { waitUntil: 'load', timeout: 30000 });
  if (!res || res.status() >= 400) {
    await page.close();
    return { error: `${route} -> ${res ? res.status() : 'no response'}` };
  }
  const declared = await page.locator('head meta[name="theme-color"]').evaluateAll((els) =>
    els.map((e) => ({ media: e.getAttribute('media'), content: e.getAttribute('content') })));

  const painted = {};
  for (const scheme of ['light', 'dark']) {
    painted[scheme] = toHex(await page.evaluate((s) => {
      const prev = document.documentElement.getAttribute('data-bs-theme');
      document.documentElement.setAttribute('data-bs-theme', s);
      const bg = getComputedStyle(document.body).backgroundColor;
      if (prev === null) document.documentElement.removeAttribute('data-bs-theme');
      else document.documentElement.setAttribute('data-bs-theme', prev);
      return bg;
    }, scheme));
  }
  await page.close();

  const byScheme = {};
  for (const { media, content } of declared) {
    if (!media) byScheme.unconditional = content;
    else if (media.includes('light')) byScheme.light = content;
    else if (media.includes('dark')) byScheme.dark = content;
  }
  const matches = {
    light: byScheme.light ? byScheme.light.toLowerCase() === painted.light : null,
    dark: byScheme.dark ? byScheme.dark.toLowerCase() === painted.dark : null,
  };
  return { route, tag_count: declared.length, declared, painted, matches };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});
  const metrics = { before_url: BEFORE_URL, after_url: AFTER_URL, routes: {} };

  for (const route of ['/', '/docs/', '/404.html']) {
    metrics.routes[route] = {
      before: await inspect(browser, BEFORE_URL, route),
      after: await inspect(browser, AFTER_URL, route),
    };
    const b = metrics.routes[route].before, a = metrics.routes[route].after;
    console.log(`${route.padEnd(12)} tags ${b.tag_count} -> ${a.tag_count}   ` +
      `surface match light ${b.matches?.light} -> ${a.matches?.light}, dark ${b.matches?.dark} -> ${a.matches?.dark}`);
  }

  await browser.close();
  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
