// Screenshot the /features/ "Content Management" section (where ZER0-061 lives)
// into test/visual/evidence/features-card-escape/<label>.png.
// Usage: BASE_URL=... node test/visual/features-card-escape-evidence.mjs <label>
import { chromium } from '@playwright/test';
import fs from 'fs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const label = process.argv[2] || 'after';
const outDir = 'test/visual/evidence/features-card-escape';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
await page.goto(base + '/features/', { waitUntil: 'load' });

// Target the "Author Profiles System" card (ZER0-061) — the buggy `<key>` in
// its description swallows every card that follows, so a tall clip from its
// title makes the defect obvious.
const card = page.getByRole('heading', { name: /Author Profiles System/i }).first();
await card.scrollIntoViewIfNeeded();
const box = await card.boundingBox();
await page.screenshot({
  path: `${outDir}/${label}-author-profiles-card.png`,
  clip: { x: 0, y: Math.max(0, box.y - 20), width: 1100, height: 760 },
});

const strayKeys = await page.locator('key').count();
console.log(`[${label}] captured; stray <key> elements = ${strayKeys}`);
await browser.close();
