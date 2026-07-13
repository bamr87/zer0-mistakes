// Feature: ZER0-004
// SVG → PNG rasterizer for the preview-image engine (scripts/lib/preview_generator.py).
// Last resort in the rasterizer chain (rsvg-convert → inkscape → magick → THIS):
// uses the repo's Playwright devDependency (the same Chromium that powers the
// visual test tiers) so contributors need no native image tooling installed.
//
// Usage:
//   node scripts/dev/rasterize-svg.js <in.svg> <out.png> [width] [height]
//
// Exit codes:
//   0  PNG written
//   1  rasterization failed (Chromium error, unreadable SVG, …)
//   2  usage error
//   3  @playwright/test not resolvable (caller should fall through / keep .svg)
const fs = require('fs');
const path = require('path');

const [svgPath, pngPath, widthArg, heightArg] = process.argv.slice(2);
if (!svgPath || !pngPath) {
  console.error('Usage: node scripts/dev/rasterize-svg.js <in.svg> <out.png> [width] [height]');
  process.exit(2);
}
const width = parseInt(widthArg, 10) || 1536;
const height = parseInt(heightArg, 10) || 1024;

let chromium;
try {
  ({ chromium } = require('@playwright/test'));
} catch (e) {
  console.error('rasterize-svg: @playwright/test not resolvable from ' + process.cwd());
  process.exit(3);
}

(async () => {
  const svg = fs.readFileSync(path.resolve(svgPath), 'utf8');
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    // Defense-in-depth: banner SVG must be self-contained, so block ALL
    // network fetches — an external reference that slipped past the engine's
    // sanitizer becomes a no-op instead of an SSRF/tracking request.
    await ctx.route('**/*', (route) => route.abort());
    const page = await ctx.newPage();
    // Inline the SVG in a zero-margin shim and stretch it to the viewport so the
    // screenshot is exactly width×height regardless of the SVG's own attributes.
    await page.setContent(
      `<!DOCTYPE html><html><head><style>
         html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden;background:#000}
         svg{display:block;width:${width}px;height:${height}px}
       </style></head><body>${svg}</body></html>`,
      { waitUntil: 'load', timeout: 30000 }
    );
    await page.screenshot({ path: path.resolve(pngPath), fullPage: false });
    await ctx.close();
    console.log('wrote', pngPath);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('rasterize-svg: ' + (err && err.message ? err.message : err));
  process.exit(1);
});
