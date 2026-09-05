// Feature: ZER0-013
/**
 * Mermaid diagram figures — ```mermaid fences rendered as accessible
 * <figure>s with a toolbar, theme-derived colours, and a graceful error state.
 *
 * Guards the behaviour in assets/js/mermaid-diagrams.js (loaded by
 * _includes/components/mermaid.html on pages with `mermaid: true`) and the
 * chrome in _sass/components/_mermaid.scss:
 *
 *   - every fence becomes a figure with a rendered SVG, and code-copy.js no
 *     longer decorates it with a copy button + line gutter;
 *   - a colour-mode switch RE-RENDERS every diagram from source. Before this
 *     component, the MutationObserver re-render cleared each `.mermaid` div
 *     without clearing Mermaid's `data-processed` flag or keeping the source,
 *     so toggling dark mode replaced every diagram with the SVG's leaked
 *     stylesheet text (issue reproduced on /quickstart/, /about/,
 *     /docs/ruby-101/) — the regression this spec exists for;
 *   - a skin change recolours diagrams (palette derives from --bs-primary);
 *   - a syntax error shows an error card and keeps the source on the page;
 *   - zoom resizes the SVG (real layout, viewport becomes scrollable);
 *   - fullscreen is a native <dialog> that traps focus, closes on Escape and
 *     returns focus to the opener;
 *   - no horizontal page overflow at phone widths, and on touch devices the
 *     toolbar sits above the diagram instead of covering it.
 */
const { test, expect } = require('@playwright/test');
const { waitForJekyll, gotoOrSkip, setSkin, dismissCookieConsent, collectConsoleErrors, assertNoConsoleErrors } = require('../fixtures');

// The feature's own docs page: 9 rendered diagrams of 8 types, one with an
// accTitle caption, one intentionally broken.
const DOCS = '/docs/features/mermaid-diagrams/';
// A content page with a single flowchart — the page the bug was reproduced on.
const QUICKSTART = '/quickstart/';

const FIGURE = 'figure.zer0-diagram';

/** Wait until every figure on the page has finished its render attempt. */
async function waitForDiagrams(page, minimum = 1) {
  await page.waitForFunction((min) => {
    const figs = Array.from(document.querySelectorAll('figure.zer0-diagram'));
    return figs.length >= min && figs.every((f) => !f.classList.contains('is-loading'));
  }, minimum, { timeout: 30000 });
}

/** Resolve on the next `zer0:diagrams-ready` after `trigger` runs in-page. */
function afterReRender(page, trigger) {
  return page.evaluate((fn) => new Promise((resolve) => {
    document.addEventListener('zer0:diagrams-ready', (e) => resolve(e.detail), { once: true });
    // eslint-disable-next-line no-new-func
    new Function(fn)();
  }), trigger);
}

/** Computed fill of the first flowchart node in the first rendered figure. */
function firstNodeFill(page) {
  return page.evaluate(() => {
    const fig = document.querySelector('figure.zer0-diagram.is-rendered');
    const shape = fig && fig.querySelector('svg .node rect, svg .node polygon, svg .node path');
    return shape ? getComputedStyle(shape).fill : null;
  });
}

test.describe('Mermaid diagram figures', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
  });

  test('ZER0-013 every ```mermaid fence renders as a figure with an SVG', { tag: '@critical' }, async ({ page }) => {
    const bag = collectConsoleErrors(page);
    await gotoOrSkip(page, DOCS);
    await waitForDiagrams(page, 9);

    // Nothing is left as a raw fence, and no legacy `.mermaid` div survives.
    await expect(page.locator('code.language-mermaid')).toHaveCount(0);
    await expect(page.locator('div.mermaid')).toHaveCount(0);

    const figures = page.locator(FIGURE);
    expect(await figures.count()).toBeGreaterThanOrEqual(9);

    const rendered = page.locator(`${FIGURE}.is-rendered`);
    expect(await rendered.count()).toBeGreaterThanOrEqual(8);
    // Every rendered figure holds exactly one SVG, and each diagram type is
    // tagged on the figure for styling/analytics.
    const perFigure = await rendered.evaluateAll((figs) => figs.map((f) => ({
      svgs: f.querySelectorAll('svg').length,
      type: f.getAttribute('data-zer0-diagram'),
    })));
    for (const f of perFigure) expect(f.svgs).toBe(1);
    const types = new Set(perFigure.map((f) => f.type));
    for (const t of ['flowchart', 'sequence', 'class', 'state', 'er', 'pie', 'gantt', 'git']) {
      expect(types, `diagram type ${t} rendered`).toContain(t);
    }

    // code-copy.js runs on DOMContentLoaded and decorates `pre code`; the
    // fences are converted before that pass, so no diagram carries its chrome.
    await expect(page.locator(`${FIGURE} button.copy, ${FIGURE} .code-line-numbers`)).toHaveCount(0);

    // Each SVG's stylesheet stays scoped to its own id. The Obsidian wiki-link
    // resolver used to walk into SVG <style> nodes (lower-case nodeName) and
    // rewrite every `#id` selector into a tag link, which unscoped the rules —
    // pie slices then took a sequence diagram's `path { fill }` and went grey.
    const pie = await page.locator('figure[data-zer0-diagram="pie"] svg path.pieCircle').first().evaluate((p) => ({
      attr: p.getAttribute('fill'), computed: getComputedStyle(p).fill,
      leakedRules: Array.from(document.styleSheets).reduce((n, ss) => {
        try { return n + Array.from(ss.cssRules).filter((r) => r.selectorText === 'path').length; } catch (e) { return n; }
      }, 0),
    }));
    const rgb = (hex) => `rgb(${hex.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16)).join(', ')})`;
    expect(pie.computed).toBe(rgb(pie.attr));
    expect(pie.leakedRules).toBe(0);
    const series = await page.evaluate(() => window.zer0Mermaid.palette().vars.pie1);
    expect(pie.attr.toLowerCase()).toBe(series.toLowerCase());

    // Mermaid's own logger is silenced (errors surface in the figure).
    assertNoConsoleErrors(expect, bag);
  });

  test('figures expose an accessible toolbar, focusable frame and accTitle caption', async ({ page }) => {
    await gotoOrSkip(page, DOCS);
    await waitForDiagrams(page, 9);

    const first = page.locator(`${FIGURE}.is-rendered`).first();
    const toolbar = first.locator('[role="toolbar"]');
    await expect(toolbar).toHaveAttribute('aria-label', /Diagram tools/);
    const labels = await toolbar.locator('button').evaluateAll((b) => b.map((x) => x.getAttribute('aria-label')));
    expect(labels).toEqual(expect.arrayContaining([
      'Zoom in', 'Zoom out', 'Reset zoom', 'View fullscreen', 'Copy diagram source', 'Download as SVG',
    ]));

    // The scrollable frame is keyboard-reachable and named (WCAG 2.1.1).
    const viewport = first.locator('.zer0-diagram__viewport');
    await expect(viewport).toHaveAttribute('tabindex', '0');
    await expect(viewport).toHaveAttribute('aria-label', /.+/);

    // accTitle → visible caption + SVG accessible name.
    const captioned = page.locator(`${FIGURE}:has(figcaption:not([hidden]))`).first();
    await expect(captioned.locator('figcaption')).toHaveText('Choose an install path');
    const svg = captioned.locator('svg');
    // Mermaid emits <title> + aria-labelledby for accTitle; the script adds
    // aria-label only when Mermaid did not name it. Either way it has a name.
    const named = await svg.evaluate((s) => !!(s.getAttribute('aria-labelledby') || s.getAttribute('aria-label')));
    expect(named).toBe(true);
    await expect(svg.locator('desc')).toContainText(/six install options/);
  });

  test('switching colour mode re-renders every diagram from source (regression)', { tag: '@critical' }, async ({ page }) => {
    await waitForJekyll(page, QUICKSTART);
    await waitForDiagrams(page, 1);

    const before = await page.locator(`${FIGURE}.is-rendered svg`).count();
    expect(before).toBeGreaterThan(0);
    const lightFill = await firstNodeFill(page);
    const lightDark = await page.evaluate(() => window.zer0Mermaid.palette().dark);
    expect(lightDark).toBe(false);

    // Flip to dark the way halfmoon.js does (attribute on <html>).
    const detail = await afterReRender(page, "document.documentElement.setAttribute('data-bs-theme','dark')");
    expect(detail.failed).toBe(0);
    await waitForDiagrams(page, 1);

    // The SVGs are still there (the old code left the div holding leaked
    // stylesheet text and no <svg>), the palette flipped, and the node fill
    // changed with it.
    await expect(page.locator(`${FIGURE}.is-rendered svg`)).toHaveCount(before);
    // innerText, not textContent: a healthy SVG carries its stylesheet in a
    // hidden <style>; the bug put that CSS on screen as body text.
    expect(await page.locator(FIGURE).first().evaluate((f) => f.innerText)).not.toContain('font-family');
    expect(await page.evaluate(() => window.zer0Mermaid.palette().dark)).toBe(true);
    const darkFill = await firstNodeFill(page);
    expect(darkFill).not.toBe(lightFill);

    // And back — a second switch must work too (no one-shot state).
    await afterReRender(page, "document.documentElement.setAttribute('data-bs-theme','light')");
    await waitForDiagrams(page, 1);
    await expect(page.locator(`${FIGURE}.is-rendered svg`)).toHaveCount(before);
    expect(await firstNodeFill(page)).toBe(lightFill);
  });

  test('a skin change recolours diagrams from the live tokens', async ({ page }) => {
    await waitForJekyll(page, QUICKSTART);
    await waitForDiagrams(page, 1);
    const before = await page.evaluate(() => window.zer0Mermaid.palette().vars.primaryBorderColor);

    const ready = page.evaluate(() => new Promise((resolve) => {
      document.addEventListener('zer0:diagrams-ready', () => resolve(true), { once: true });
    }));
    await setSkin(page, 'neon');
    await ready;
    await waitForDiagrams(page, 1);

    const after = await page.evaluate(() => window.zer0Mermaid.palette().vars.primaryBorderColor);
    const bsPrimary = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bs-primary').trim());
    expect(after).not.toBe(before);
    expect(after.toLowerCase()).toBe(bsPrimary.toLowerCase());
    // The rendered SVG carries the new brand as its node border.
    const stroke = await page.evaluate(() => {
      const shape = document.querySelector('figure.zer0-diagram.is-rendered svg .node rect, figure.zer0-diagram.is-rendered svg .node polygon');
      return shape ? getComputedStyle(shape).stroke : null;
    });
    const hex = (rgb) => '#' + rgb.match(/\d+/g).slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
    expect(hex(stroke)).toBe(after.toLowerCase());
  });

  test('a syntax error shows an error card and keeps the source on the page', async ({ page }) => {
    await gotoOrSkip(page, DOCS);
    await waitForDiagrams(page, 9);

    const broken = page.locator(`${FIGURE}.has-error`);
    await expect(broken).toHaveCount(1);
    await expect(broken.locator('.zer0-diagram__error-title')).toHaveText('This diagram could not be rendered');
    await expect(broken.locator('.zer0-diagram__error-message')).toContainText(/Parse error/);
    // The definition is still readable (and copyable) — nothing was lost.
    await expect(broken.locator('.zer0-diagram__source-text')).toContainText('A[Start] -> B[Broken arrow]');
    expect(await broken.evaluate((f) => window.zer0Mermaid.getSource(f))).toContain('Broken arrow');
    // Only copy makes sense without an SVG.
    await expect(broken.locator('button[aria-label="Copy diagram source"]')).toBeEnabled();
    await expect(broken.locator('button[aria-label="Zoom in"]')).toBeDisabled();
    await expect(broken.locator('button[aria-label="View fullscreen"]')).toBeDisabled();
    await expect(broken.locator('svg')).toHaveCount(0);
    // The error is a rendered state, not an exception: the figures after it
    // rendered normally.
    expect(await page.locator(`${FIGURE}.is-rendered`).count()).toBeGreaterThanOrEqual(8);
  });

  test('zoom controls resize the SVG and make the frame scrollable', async ({ page }) => {
    await waitForJekyll(page, QUICKSTART);
    await waitForDiagrams(page, 1);
    const fig = page.locator(`${FIGURE}.is-rendered`).first();
    await fig.scrollIntoViewIfNeeded();
    const svg = fig.locator('svg');
    const viewport = fig.locator('.zer0-diagram__viewport');

    const w0 = (await svg.boundingBox()).width;
    await expect(fig.locator('button[aria-label="Reset zoom"]')).toBeDisabled();

    await fig.hover();
    await fig.locator('button[aria-label="Zoom in"]').click();
    await fig.locator('button[aria-label="Zoom in"]').click();

    const w1 = (await svg.boundingBox()).width;
    expect(w1).toBeGreaterThan(w0 * 1.4);
    await expect(viewport).toHaveClass(/is-zoomed/);
    await expect(fig.locator('.zer0-diagram__zoom')).toHaveText('156%');
    // Real layout: the frame now scrolls instead of the page overflowing.
    const scroll = await viewport.evaluate((v) => ({ sw: v.scrollWidth, cw: v.clientWidth }));
    expect(scroll.sw).toBeGreaterThan(scroll.cw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

    await fig.locator('button[aria-label="Reset zoom"]').click();
    expect(Math.round((await svg.boundingBox()).width)).toBe(Math.round(w0));
    await expect(viewport).not.toHaveClass(/is-zoomed/);
  });

  test('keyboard: + / - / 0 zoom the focused diagram frame', async ({ page }) => {
    await waitForJekyll(page, QUICKSTART);
    await waitForDiagrams(page, 1);
    const fig = page.locator(`${FIGURE}.is-rendered`).first();
    await fig.scrollIntoViewIfNeeded();
    const viewport = fig.locator('.zer0-diagram__viewport');
    await viewport.focus();
    await page.keyboard.press('+');
    await expect(viewport).toHaveClass(/is-zoomed/);
    await expect(fig.locator('.zer0-diagram__zoom')).toHaveText('125%');
    await page.keyboard.press('-');
    await expect(viewport).not.toHaveClass(/is-zoomed/);
    await page.keyboard.press('+');
    await page.keyboard.press('0');
    await expect(viewport).not.toHaveClass(/is-zoomed/);
  });

  test('fullscreen opens a modal dialog, Escape closes it and returns focus', async ({ page }) => {
    await waitForJekyll(page, QUICKSTART);
    await waitForDiagrams(page, 1);
    const fig = page.locator(`${FIGURE}.is-rendered`).first();
    await fig.scrollIntoViewIfNeeded();
    await fig.hover();
    const open = fig.locator('button[aria-label="View fullscreen"]');
    await open.focus();
    await page.keyboard.press('Enter');

    const dialog = page.locator('dialog.zer0-diagram-lightbox');
    await expect(dialog).toHaveAttribute('open', '');
    await expect(dialog.locator('svg')).toHaveCount(1);
    await expect(fig.locator('svg')).toHaveCount(0); // the same SVG moved, not cloned
    await expect(dialog).toHaveAttribute('aria-labelledby', 'zer0-diagram-lightbox-title');
    await expect(dialog.locator('.zer0-diagram-lightbox__title')).toHaveText('Flowchart');
    // Focus is inside the dialog; the page cannot scroll behind it.
    expect(await page.evaluate(() => !!document.activeElement.closest('dialog.zer0-diagram-lightbox'))).toBe(true);
    await expect(page.locator('html')).toHaveClass(/zer0-diagram-lightbox-open/);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');
    await expect(fig.locator('svg')).toHaveCount(1);
    await expect(page.locator('html')).not.toHaveClass(/zer0-diagram-lightbox-open/);
    await expect(open).toBeFocused();
  });

  test.describe('clipboard', () => {
    test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

    test('copy puts the diagram source on the clipboard and confirms', async ({ page }) => {
      await waitForJekyll(page, QUICKSTART);
      await waitForDiagrams(page, 1);
      const fig = page.locator(`${FIGURE}.is-rendered`).first();
      await fig.scrollIntoViewIfNeeded();
      await fig.hover();
      const copy = fig.locator('button[aria-label="Copy diagram source"]');
      await copy.click();
      await expect(copy).toHaveClass(/is-success/);
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      expect(clip).toMatch(/^flowchart TD/);
      expect(clip).toContain("What's your goal?");
      await expect(copy).not.toHaveClass(/is-success/, { timeout: 4000 });
    });
  });

  for (const width of [320, 390]) {
    test(`no horizontal page overflow with diagrams at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await gotoOrSkip(page, DOCS);
      await waitForDiagrams(page, 9);
      const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
      expect(overflow).toBe(0);
      // Each figure fits its column; wide SVGs shrink to fit (useMaxWidth).
      const widest = await page.locator(`${FIGURE}.is-rendered`).evaluateAll((figs) => Math.max(...figs.map((f) => {
        const r = f.getBoundingClientRect();
        const p = f.parentElement.getBoundingClientRect();
        return r.right - p.right;
      })));
      expect(widest).toBeLessThanOrEqual(1);
    });
  }

  test.describe('touch devices', () => {
    // Touch emulation only (not a full device descriptor, which would pin the
    // browser type): isMobile + hasTouch make Chromium report (hover: none)
    // and (pointer: coarse), the media features the toolbar layout keys on.
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    test('the toolbar sits above the diagram instead of covering it', async ({ page }) => {
      await waitForJekyll(page, QUICKSTART);
      await waitForDiagrams(page, 1);
      const fig = page.locator(`${FIGURE}.is-rendered`).first();
      await fig.scrollIntoViewIfNeeded();
      const toolbar = fig.locator('.zer0-diagram__toolbar');
      await expect(toolbar).toBeVisible();
      expect(await toolbar.evaluate((t) => getComputedStyle(t).position)).toBe('static');
      const t = await toolbar.boundingBox();
      const s = await fig.locator('svg').boundingBox();
      expect(t.y + t.height).toBeLessThanOrEqual(s.y + 1);
      // Comfortable tap targets.
      const btn = await toolbar.locator('button').first().boundingBox();
      expect(btn.height).toBeGreaterThanOrEqual(34);
    });
  });
});
