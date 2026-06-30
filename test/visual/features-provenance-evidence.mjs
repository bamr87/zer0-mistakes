// =============================================================================
// features-provenance-evidence.mjs — after-only visual evidence for PR B.
//
// Provenance rendering on /features/ is a NEW capability (no "before" state),
// so this captures focused "after" shots: the reference-table Provenance column
// and a feature card's `PR #N · <commit>` line. Pair: features-provenance.spec.js.
//
// Usage: BASE_URL=http://localhost:4000 node test/visual/features-provenance-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const outDir = 'test/visual/evidence/features-provenance';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
const metrics = { slug: 'features-provenance', base, route: '/features/', shots: [] };

await page.goto(base + '/features/', { waitUntil: 'load' });

// 1) The All Features Reference table, scrolled to show the Provenance column.
const header = page.locator('table thead th', { hasText: 'Provenance' });
await header.scrollIntoViewIfNeeded();
const table = page.locator('.table-responsive').filter({ has: page.locator('th', { hasText: 'Provenance' }) }).first();
await table.screenshot({ path: `${outDir}/01-reference-table-provenance.png` });
metrics.shots.push('01-reference-table-provenance.png');

// 2) An AI-Powered feature card showing the inline provenance line.
const card = page.locator('.card', { has: page.locator('.text-muted a[href*="/pull/"], .text-muted a[href*="/commit/"]') }).first();
await card.scrollIntoViewIfNeeded();
await card.screenshot({ path: `${outDir}/02-feature-card-provenance.png` });
metrics.shots.push('02-feature-card-provenance.png');

// 3) Counts, as a quick machine-readable sanity record.
const prCount = await page.locator('a[href*="/pull/"]').count();
const commitCount = await page.locator('a[href*="/commit/"]').count();
metrics.pr_links = prCount;
metrics.commit_links = commitCount;

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
await browser.close();
console.log(`evidence written to ${outDir} (pr_links=${prCount}, commit_links=${commitCount})`);
