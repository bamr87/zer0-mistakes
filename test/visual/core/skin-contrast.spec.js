/**
 * Skin contrast — WCAG 2.1 SC 1.4.3 (4.5:1 for text) in every palette skin,
 * light and dark, plus the WCAG 2.5.8 target size of the sidebar toggles.
 *
 * Regression: #410 (T-042) and the weekly site-quality scans of the sites that
 * float on this theme (ai-world-view.github.io #35/#37/#38, year-of-ai.github.io
 * #141-#154). With the default `air` skin:
 *   - the current-page navbar link was the raw brand, #6fa8dc on the #f8f9fa
 *     navbar: 2.40:1 (the scans' "span.nav-link-text @ 2.4:1");
 *   - .btn-primary, .badge.bg-primary, .text-bg-primary and the current dropdown
 *     item kept Bootstrap's white text on the light brand: 2.53:1;
 *   - the gray count and tag badges were `bg-secondary text-body`: 3.29:1;
 *   - the chevron-only .nav-tree-toggle rendered 22px wide (axe target-size).
 *
 * METHOD. Like the cookie-modal test in accessibility.spec.js, the ratio is
 * computed here rather than read from axe alone: the skins paint
 * `body.zer0-bg-body::after` with an SVG, and axe reports text over a pseudo
 * element as `incomplete`, not as a violation. Translucent fills (rgba and
 * color-mix tints) are composited down to the first opaque ancestor. The
 * .btn-primary hover and active states are read from their --bs-btn-hover-* /
 * --bs-btn-active-* tokens through probe elements, so the result does not
 * depend on pointer timing or on the theme's hover ripple. The axe block then
 * runs `color-contrast` with the SVG background switched off, and requires axe
 * to have actually evaluated the specimen, so it cannot pass vacuously.
 *
 * Layers:
 *   1. Source: no `badge bg-secondary text-body|text-muted` and no
 *      text-body-tertiary in _layouts/ or _includes/ (no server needed).
 *   2. A specimen of every skin-coloured component, injected into a real page
 *      so the real cascade applies, measured for the 7 palette skins x 2 modes.
 *   3. The real navbar: the current-page link on /quickstart/ and the current
 *      dropdown item on /quickstart/machine-setup/, per skin and mode.
 *   4. The real sidebar: every chevron .nav-tree-toggle is at least 24x24.
 *
 * Run: npm run test:smoke  (or: npx playwright test --config=test/playwright.config.js
 *      --project=smoke test/visual/core/skin-contrast.spec.js)
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { VIEWPORTS, waitForJekyll } = require('../fixtures');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const AA = 4.5;
const MODES = ['light', 'dark'];

/** The skins with a zer0-skin-palette (contrast and dark only swap the SVG). */
function paletteSkins() {
  const scss = fs.readFileSync(path.join(REPO_ROOT, '_sass/theme/_skins.scss'), 'utf8');
  return [...scss.matchAll(/\[data-theme-skin="([a-z-]+)"\]\s*\{\s*@include zer0-skin-palette\(/g)].map((m) => m[1]);
}
const PALETTE_SKINS = paletteSkins();

// One element per skin-coloured rule the theme ships. `data-probe` names the
// rule in failure messages. The hover/active probes paint the button's own
// state tokens, which is exactly what :hover / :active resolve to.
const SPECIMEN = `
<div id="skin-contrast-specimen" class="bg-body p-3" style="position:relative;z-index:1">
  <p class="text-primary" data-probe=".text-primary">text-primary</p>
  <p><a href="#skin-contrast" class="link-primary" data-probe=".link-primary">link-primary</a></p>
  <div class="card"><div class="card-body">
    <a href="#skin-contrast" data-probe="a in .card (brand-tinted surface)">a link in a card</a>
  </div></div>
  <p>
    <a href="#skin-contrast" class="btn btn-primary" data-probe=".btn-primary">Primary</a>
    <span class="btn btn-primary" data-probe=".btn-primary:hover"
          style="color:var(--bs-btn-hover-color);background-color:var(--bs-btn-hover-bg)">Hover</span>
    <span class="btn btn-primary" data-probe=".btn-primary:active"
          style="color:var(--bs-btn-active-color);background-color:var(--bs-btn-active-bg)">Active</span>
    <a href="#skin-contrast" class="btn btn-outline-primary" data-probe=".btn-outline-primary">Outline</a>
    <span class="btn btn-outline-primary" data-probe=".btn-outline-primary:hover"
          style="color:var(--bs-btn-hover-color);background-color:var(--bs-btn-hover-bg)">Outline hover</span>
  </p>
  <p>
    <span class="badge bg-primary" data-probe=".badge.bg-primary">12</span>
    <a href="#skin-contrast" class="badge bg-primary text-decoration-none" data-probe="a.badge.bg-primary">category</a>
    <span class="badge text-bg-primary" data-probe=".text-bg-primary">12</span>
    <span class="badge text-bg-secondary" data-probe=".badge.text-bg-secondary">12</span>
  </p>
  <div class="alert alert-primary" data-probe=".alert-primary">Alert text</div>
  <ul class="nav nav-tabs"><li class="nav-item">
    <a class="nav-link active" href="#skin-contrast" data-probe=".nav-tabs .nav-link.active">Tab</a>
  </li></ul>
  <ol class="breadcrumb"><li class="breadcrumb-item active" aria-current="page" data-probe=".breadcrumb-item.active">Here</li></ol>
  <ul class="pagination">
    <li class="page-item"><a class="page-link" href="#skin-contrast" data-probe=".page-link">1</a></li>
    <li class="page-item active" aria-current="page"><a class="page-link" href="#skin-contrast" data-probe=".page-item.active .page-link">2</a></li>
  </ul>
  <div class="list-group">
    <a href="#skin-contrast" class="list-group-item list-group-item-action active" data-probe="a.list-group-item.active">Active item</a>
  </div>
  <div class="navbar bg-body-tertiary">
    <a class="nav-link active" href="#skin-contrast" data-probe=".navbar .nav-link.active">Active</a>
  </div>
  <div class="navbar-mobile-quicklinks">
    <a class="navbar-mobile-quicklinks__chip btn btn-sm btn-outline-secondary" href="#skin-contrast" aria-current="page"
       data-probe=".navbar-mobile-quicklinks__chip[aria-current]">Docs</a>
  </div>
  <nav class="nav-tree"><ul class="nav-tree-root list-unstyled">
    <li class="nav-tree-item" data-depth="0"><a class="nav-tree-link active" href="#skin-contrast" data-probe=".nav-tree-link.active">Current doc</a></li>
    <li class="nav-tree-item" data-depth="2"><a class="nav-tree-link active" aria-current="page" href="#skin-contrast" data-probe="depth-2 .nav-tree-link.active">Deep doc</a></li>
  </ul></nav>
  <nav class="nav-tree nav-tree--categories">
    <button type="button" class="btn btn-link nav-tree-toggle sidebar-categories-toggle" aria-expanded="true"
            data-probe=".sidebar-categories-toggle (open)">Category</button>
    <a class="nav-tree-link sidebar-categories-link active" aria-current="page" href="#skin-contrast"
       data-probe=".sidebar-categories-link.active">Current post</a>
  </nav>
  <ul class="dropdown-menu d-block position-static">
    <li><a class="dropdown-item" aria-current="page" href="#skin-contrast" data-probe=".dropdown-item[aria-current]">Current</a></li>
  </ul>
  <div class="bd-toc"><nav><a class="active" href="#skin-contrast" data-probe=".bd-toc a.active">Section</a></nav></div>
</div>`;
const SPECIMEN_PROBES = (SPECIMEN.match(/data-probe=/g) || []).length;

// Freeze transitions so a skin or mode switch repaints at once: computed
// colour mid-transition is the interpolated value, not the target.
const NO_TRANSITIONS = '*, *::before, *::after { transition: none !important; animation: none !important; }';

/**
 * In-page: WCAG 2.x contrast of each element's text against its effective
 * backdrop. Returns { probe, fg, bg, ratio } per element.
 */
function measureContrast(selector) {
  const parse = (value) => {
    const c = String(value).trim();
    let m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = c.match(/^color\(srgb\s+([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
    }
    return null;
  };
  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });
  // Composite every translucent fill from the element up to the first opaque one.
  const backdrop = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  return [...document.querySelectorAll(selector)].map((el) => {
    const bg = backdrop(el);
    const fg = over(parse(getComputedStyle(el).color), bg);
    return {
      probe: el.getAttribute('data-probe') || el.className,
      fg: hex(fg),
      bg: hex(bg),
      ratio: Math.round(ratio(fg, bg) * 100) / 100,
    };
  });
}

/** Switch skin and colour mode the way the runtime does: attributes on <html>. */
async function applySkin(page, skin, mode) {
  await page.evaluate(([s, m]) => {
    document.documentElement.setAttribute('data-theme-skin', s);
    document.documentElement.setAttribute('data-bs-theme', m);
  }, [skin, mode]);
}

const describeFailures = (rows) =>
  rows.map((r) => `  ${r.ratio}:1  ${r.fg} on ${r.bg}  ${r.probe}`).join('\n');

// ---------------------------------------------------------------------------
// 1. Source
// ---------------------------------------------------------------------------
test.describe('Skin contrast — markup', { tag: '@critical' }, () => {
  const htmlFiles = (dir) =>
    fs.readdirSync(dir, { recursive: true })
      .filter((f) => f.endsWith('.html'))
      .map((f) => path.join(dir, f));
  const FILES = [...htmlFiles(path.join(REPO_ROOT, '_layouts')), ...htmlFiles(path.join(REPO_ROOT, '_includes'))];

  test('gray badges use text-bg-secondary, not bg-secondary with a dark text utility', () => {
    // `bg-secondary text-body` was #212529 on #6c757d (3.29:1) and
    // `bg-secondary text-muted` lower still; text-bg-secondary is 4.69:1.
    const offenders = [];
    for (const file of FILES) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/class="[^"]*\bbadge\b[^"]*\bbg-secondary\b[^"]*\btext-(?:body|muted)\b/.test(line)) {
          offenders.push(`${path.relative(REPO_ROOT, file)}:${i + 1}`);
        }
      });
    }
    expect(offenders, 'use `badge text-bg-secondary` for gray badges').toEqual([]);
  });

  test('no text-body-tertiary in layouts or includes', () => {
    // --bs-tertiary-color is 3.12:1 on white and 4.09:1 on #212529, under AA
    // at every body and meta size the theme uses; text-body-secondary is
    // 6.76:1 / 7.31:1.
    const offenders = [];
    for (const file of FILES) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/\btext-body-tertiary\b/.test(line)) offenders.push(`${path.relative(REPO_ROOT, file)}:${i + 1}`);
      });
    }
    expect(offenders, 'use text-body-secondary').toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Specimen of every skin-coloured component
// ---------------------------------------------------------------------------
test.describe('Skin contrast — skin-coloured components reach 4.5:1', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await page.addStyleTag({ content: NO_TRANSITIONS });
    await page.evaluate((html) => {
      document.querySelector('#main-content').insertAdjacentHTML('afterbegin', html);
    }, SPECIMEN);
  });

  test('the palette skin list is read from _skins.scss', () => {
    expect(PALETTE_SKINS).toEqual(['air', 'aqua', 'dirt', 'neon', 'mint', 'plum', 'sunrise']);
  });

  for (const skin of PALETTE_SKINS) {
    for (const mode of MODES) {
      test(`${skin} / ${mode}`, async ({ page }) => {
        await applySkin(page, skin, mode);
        const rows = await page.evaluate(measureContrast, '#skin-contrast-specimen [data-probe]');
        expect(rows.length, 'every specimen element was measured').toBe(SPECIMEN_PROBES);
        const failing = rows.filter((r) => r.ratio < AA);
        expect(
          failing,
          `WCAG 1.4.3 needs ${AA}:1. Under ${skin} / ${mode}:\n${describeFailures(failing)}`
        ).toEqual([]);
      });
    }
  }

  // Second opinion from axe, with the skin's SVG background off so axe can
  // resolve the backdrop. axe must have decided (passed or failed) nearly every
  // specimen element, or this would pass without having looked at anything.
  for (const mode of MODES) {
    test(`axe color-contrast passes on the specimen in every skin (${mode})`, async ({ page }) => {
      const violations = [];
      for (const skin of PALETTE_SKINS) {
        await applySkin(page, skin, mode);
        await page.evaluate(() => document.documentElement.setAttribute('data-zer0-bg', 'off'));
        const results = await new AxeBuilder({ page })
          .include('#skin-contrast-specimen')
          .withRules(['color-contrast'])
          .analyze();
        const decided = [...results.passes, ...results.violations].flatMap((r) => r.nodes).length;
        expect(decided, `axe decided the ${skin} specimen`).toBeGreaterThanOrEqual(SPECIMEN_PROBES - 4);
        for (const v of results.violations) {
          for (const n of v.nodes) violations.push(`${skin}: ${n.html.split('\n')[0].trim()} — ${n.any.map((a) => a.message).join('; ')}`);
        }
      }
      expect(violations, `axe color-contrast (${mode}):\n${violations.join('\n')}`).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. The real navbar
// ---------------------------------------------------------------------------
test.describe('Skin contrast — the navbar current page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  for (const skin of PALETTE_SKINS) {
    test(`${skin}: current-page link and current dropdown item reach 4.5:1`, async ({ page }) => {
      const rows = [];

      // Top-level item: "Quick Start" is the current page on /quickstart/.
      await waitForJekyll(page, '/quickstart/');
      await page.addStyleTag({ content: NO_TRANSITIONS });
      const link = page.locator('#bdNavbar .nav-link[aria-current="page"] .nav-link-text');
      await expect(link, 'the navbar marks the current page').toHaveCount(1);
      await page.evaluate(() => document.querySelector('#bdNavbar .nav-link[aria-current="page"] .nav-link-text')
        .setAttribute('data-probe', '#bdNavbar .nav-link[aria-current] .nav-link-text'));
      for (const mode of MODES) {
        await applySkin(page, skin, mode);
        const [r] = await page.evaluate(measureContrast, '#bdNavbar [data-probe]');
        rows.push({ ...r, probe: `${r.probe} (${mode})` });
      }

      // Dropdown child: "Machine Setup" is current on /quickstart/machine-setup/.
      await waitForJekyll(page, '/quickstart/machine-setup/');
      await page.addStyleTag({ content: NO_TRANSITIONS });
      await expect(page.locator('#bdNavbar .dropdown-item[aria-current="page"]')).toHaveCount(1);
      await page.evaluate(() => document.querySelector('#bdNavbar .dropdown-item[aria-current="page"]')
        .setAttribute('data-probe', '#bdNavbar .dropdown-item[aria-current]'));
      for (const mode of MODES) {
        await applySkin(page, skin, mode);
        const [r] = await page.evaluate(measureContrast, '#bdNavbar [data-probe]');
        rows.push({ ...r, probe: `${r.probe} (${mode})` });
      }

      const failing = rows.filter((r) => r.ratio < AA);
      expect(failing, `WCAG 1.4.3 needs ${AA}:1. Under ${skin}:\n${describeFailures(failing)}`).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Sidebar toggle target size
// ---------------------------------------------------------------------------
test.describe('Sidebar nav-tree toggles meet the 24px target size', () => {
  // A URL-hierarchy tree with collapsed sections: each renders a chevron-only
  // `btn btn-sm btn-link nav-tree-toggle p-1` beside its section link.
  test('every visible .nav-tree-toggle is at least 24x24 (WCAG 2.5.8)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/docs/features/sidebar-page-tree/');
    const toggles = page.locator('aside.bd-sidebar .nav-tree-toggle');
    expect(await toggles.count(), 'the page tree renders section toggles').toBeGreaterThan(0);
    const small = [];
    for (const toggle of await toggles.all()) {
      if (!(await toggle.isVisible())) continue;
      const box = await toggle.boundingBox();
      if (box && (box.width < 24 || box.height < 24)) {
        small.push(`${Math.round(box.width)}x${Math.round(box.height)} ${await toggle.getAttribute('aria-controls')}`);
      }
    }
    expect(small, 'toggles under 24x24').toEqual([]);
  });
});
