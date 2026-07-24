// Evidence for the book-abc board-book layout (ZER0-081).
// After-only evidence (a new feature — there is no "before" state): captures the
// layout across a viewport matrix plus structural metrics, into
// test/visual/evidence/book-abc/.
//
// Usage (against a running site that has a book-abc page):
//   BASE_URL=http://localhost:4000 node test/visual/book-abc-evidence.mjs
//   BASE_URL=http://localhost:4000 ROUTE=/books/it-alphabet/ node test/visual/book-abc-evidence.mjs
//
// The theme's own demo book (pages/_books/abc-demo/) is the default route.
import { chromium } from '@playwright/test';
import fs from 'fs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const route = process.env.ROUTE || '/books/abc-demo/';
const outDir = 'test/visual/evidence/book-abc';
fs.mkdirSync(outDir, { recursive: true });

const WIDTHS = [320, 390, 768, 992, 1280];

// PW_EXECUTABLE_PATH lets a sandbox point at a prebuilt Chromium; CI leaves it
// unset and Playwright uses its own managed browser.
const browser = await chromium.launch({
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});
const metrics = { route: base + route, captured: [], structure: {} };

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const resp = await page.goto(base + route, { waitUntil: 'load' });
  if (!resp || resp.status() >= 400) {
    console.error(`! ${route} returned ${resp?.status() ?? 'no response'} — is the site serving a book-abc page?`);
    await page.close();
    continue;
  }

  // Structural metrics (captured once, at the widest viewport).
  if (width === WIDTHS[WIDTHS.length - 1]) {
    metrics.structure = await page.evaluate(() => ({
      letterCards: document.querySelectorAll('.abc-letter').length,
      placeholders: document.querySelectorAll('.abc-letter-placeholder').length,
      renderedImages: document.querySelectorAll('.abc-letter-img').length,
      jumpLinks: document.querySelectorAll('.abc-jump-link').length,
      boardSkin: (document.querySelector('.abc-board')?.className || '')
        .split(' ').find((c) => c.startsWith('abc-style--')) || null,
    }));
  }

  // Horizontal overflow at this width (0 = no sideways scroll).
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

  // JPEG (not PNG): these full-page captures of a 26-letter board are for human
  // review, not pixel-diffing, so lossy keeps the evidence dir light.
  const file = `${outDir}/board-${width}.jpg`;
  await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 72 });
  metrics.captured.push({ width, file, overflow });
  console.log(`captured ${file} (overflow=${overflow}px)`);
  await page.close();
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
console.log('wrote', `${outDir}/metrics.json`);
console.log('structure:', JSON.stringify(metrics.structure));
await browser.close();
