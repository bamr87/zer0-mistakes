// =============================================================================
// fab-stack.spec.js — the bottom-left FAB stack never overlaps
// =============================================================================
// Left-side FAB stack (bottom → top):
//   slot 1  #pageFeedbackFab                 always on (global "Improve this page")
//   slot 2  #sidebarFab (.bd-sidebar-fab)    conditional (docs sidebar, <lg only)
//   slot 2  #obsidianLocalGraphFab           conditional (wiki-index pages) — at lg+,
//                                            or <lg on a page without #sidebarFab
//   slot 3  #obsidianLocalGraphFab           <lg when #sidebarFab is also present (#571)
//
// #571: the sidebar FAB and the graph FAB both resolved to slot 2 below lg, so
// the graph FAB (z-index 1060 > 1055) covered the sidebar FAB and the docs nav
// could not be opened by tap. The pairwise case at the bottom guards it.
//
// Regression guard for #288 / PR #289: the feedback FAB (added in #286) and the
// pre-existing Obsidian local-graph FAB were BOTH anchored at
// `bottom: 1rem; left: 1rem`, so they completely overlapped. The fix moves the
// slot-2 FABs to `bottom: calc(offset + size + gap)` — the same formula
// `.bd-toc-fab` uses to stack above `#backToTopBtn` on the right edge.
//
// These tests exercise the REAL, globally-loaded FAB positioning rules
// (`_sass/core/_obsidian.scss`, `_sass/layouts/_navbar-extras.scss`,
// `_sass/components/_page-feedback.scss`) against elements mounted in the real
// `.zer0-bg-body` elevation context (the reason the FAB rules must use an id
// selector — see the comment in _obsidian.scss). They are content-independent:
// the slot-2 FABs render conditionally, so rather than hunt for a page that
// happens to expose them, we mount an element carrying each FAB's production
// id/class next to the always-present feedback FAB and assert the shipped CSS
// lands it at slot 2, clear of slot 1. Both assertions FAIL on the pre-fix
// `bottom: 1rem` (identical to the feedback FAB → full overlap).
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent, boxesOverlap } = require('../fixtures');

const FEEDBACK = '#pageFeedbackFab';

/** Read an element's box + resolved `bottom` (px) in one hop. */
const PROBE = (feedbackSel, make) => {
  const fb = document.querySelector(feedbackSel);
  const parent = fb.parentElement; // <body class="zer0-bg-body"> — shared elevation context
  const read = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.x, y: r.y, width: r.width, height: r.height,
      bottomPx: parseFloat(getComputedStyle(el).bottom),
    };
  };
  const feedback = read(fb);
  const el = make(document, parent);
  const probe = read(el);
  const root = getComputedStyle(document.documentElement);
  const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const num = (v) => {
    v = v.trim();
    return v.endsWith('rem') ? parseFloat(v) * remPx : parseFloat(v);
  };
  const tokens = {
    offset: num(root.getPropertyValue('--zer0-space-fab-offset') || '1rem'),
    size: num(root.getPropertyValue('--zer0-space-fab-size') || '3.5rem'),
    gap: num(root.getPropertyValue('--zer0-space-fab-gap') || '0.75rem'),
  };
  el.remove();
  return { feedback, probe, tokens };
};

test.describe('Left-side FAB stack — no overlap', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');
    await expect(page.locator(FEEDBACK)).toBeVisible();
  });

  test('Obsidian local-graph FAB stacks at slot 2, clear of the feedback FAB', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { feedback, probe, tokens } = await page.evaluate((sel) => {
      const mk = (doc, parent) => {
        const d = doc.createElement('div');
        d.id = 'obsidianLocalGraphFab';
        d.className = 'obsidian-local-graph-fab';
        d.style.width = 'var(--zer0-space-fab-size, 3.5rem)';
        d.style.height = 'var(--zer0-space-fab-size, 3.5rem)';
        parent.appendChild(d);
        return d;
      };
      // Inline the probe helper so it runs in the page context.
      const fb = document.querySelector(sel);
      const parent = fb.parentElement;
      const read = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, bottomPx: parseFloat(getComputedStyle(el).bottom) };
      };
      const feedback = read(fb);
      const el = mk(document, parent);
      const probe = read(el);
      const rootCs = getComputedStyle(document.documentElement);
      const remPx = parseFloat(rootCs.fontSize) || 16;
      const num = (v) => { v = (v || '').trim(); return v.endsWith('rem') ? parseFloat(v) * remPx : parseFloat(v); };
      const tokens = {
        offset: num(rootCs.getPropertyValue('--zer0-space-fab-offset') || '1rem'),
        size: num(rootCs.getPropertyValue('--zer0-space-fab-size') || '3.5rem'),
        gap: num(rootCs.getPropertyValue('--zer0-space-fab-gap') || '0.75rem'),
      };
      el.remove();
      return { feedback, probe, tokens };
    }, FEEDBACK);

    // Feedback FAB sits at slot 1 (offset from the bottom edge).
    expect(Math.abs(feedback.bottomPx - tokens.offset)).toBeLessThanOrEqual(1);
    // Obsidian FAB sits at slot 2 = offset + size + gap.
    const slot2 = tokens.offset + tokens.size + tokens.gap;
    expect(Math.abs(probe.bottomPx - slot2)).toBeLessThanOrEqual(1);
    // Slot 2 is a full FAB-height above slot 1 → the boxes cannot overlap.
    expect(boxesOverlap(feedback, probe)).toBe(false);
    expect(probe.y + probe.height).toBeLessThanOrEqual(feedback.y + 1);
  });

  test('Docs-sidebar restore FAB stacks at slot 2 on mobile, clear of the feedback FAB', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 }); // <lg: restore FAB is visible here
    const { feedback, probe, tokens } = await page.evaluate((sel) => {
      const fb = document.querySelector(sel);
      const parent = fb.parentElement;
      const read = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, bottomPx: parseFloat(getComputedStyle(el).bottom) };
      };
      const feedback = read(fb);
      // Production markup for the restore-mode sidebar FAB (see _layouts/default.html
      // #sidebarFab + sidebar-visibility.js which adds --restore when hidden).
      const el = document.createElement('div');
      el.id = 'sidebarFab';
      el.className = 'position-fixed bd-sidebar-fab bd-sidebar-fab--restore';
      el.style.width = 'var(--zer0-space-fab-size, 3.5rem)';
      el.style.height = 'var(--zer0-space-fab-size, 3.5rem)';
      parent.appendChild(el);
      const probe = read(el);
      const rootCs = getComputedStyle(document.documentElement);
      const remPx = parseFloat(rootCs.fontSize) || 16;
      const num = (v) => { v = (v || '').trim(); return v.endsWith('rem') ? parseFloat(v) * remPx : parseFloat(v); };
      const tokens = {
        offset: num(rootCs.getPropertyValue('--zer0-space-fab-offset') || '1rem'),
        size: num(rootCs.getPropertyValue('--zer0-space-fab-size') || '3.5rem'),
        gap: num(rootCs.getPropertyValue('--zer0-space-fab-gap') || '0.75rem'),
      };
      el.remove();
      return { feedback, probe, tokens };
    }, FEEDBACK);

    const slot2 = tokens.offset + tokens.size + tokens.gap;
    expect(Math.abs(feedback.bottomPx - tokens.offset)).toBeLessThanOrEqual(1);
    expect(Math.abs(probe.bottomPx - slot2)).toBeLessThanOrEqual(1);
    expect(boxesOverlap(feedback, probe)).toBe(false);
  });

  test('Below lg, the local-graph FAB moves to slot 3 when the sidebar FAB is present (#571)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 }); // <lg: #sidebarFab is visible here
    const { sidebar, graph, hitInSidebar, tokens } = await page.evaluate((sel) => {
      const parent = document.querySelector(sel).parentElement;
      const read = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, bottomPx: parseFloat(getComputedStyle(el).bottom) };
      };
      const mount = (id, className) => {
        const el = document.createElement('div');
        el.id = id;
        el.className = className;
        el.style.width = 'var(--zer0-space-fab-size, 3.5rem)';
        el.style.height = 'var(--zer0-space-fab-size, 3.5rem)';
        parent.appendChild(el);
        return el;
      };
      // The page under test may already render its own #sidebarFab; park it so
      // the probe below is the only one (ids are unique in production).
      const existing = document.getElementById('sidebarFab');
      if (existing) existing.id = 'sidebarFab-parked';
      // Production ids/classes, together: _layouts/default.html #sidebarFab and
      // _includes/navigation/local-graph-fab.html #obsidianLocalGraphFab.
      const sb = mount('sidebarFab', 'position-fixed bd-sidebar-fab d-lg-none');
      const gr = mount('obsidianLocalGraphFab', 'obsidian-local-graph-fab');
      const sidebar = read(sb);
      const graph = read(gr);
      const hit = document.elementFromPoint(sidebar.x + sidebar.width / 2, sidebar.y + sidebar.height / 2);
      const hitInSidebar = !!hit && sb.contains(hit);
      const rootCs = getComputedStyle(document.documentElement);
      const remPx = parseFloat(rootCs.fontSize) || 16;
      const num = (v) => { v = (v || '').trim(); return v.endsWith('rem') ? parseFloat(v) * remPx : parseFloat(v); };
      const tokens = {
        offset: num(rootCs.getPropertyValue('--zer0-space-fab-offset') || '1rem'),
        size: num(rootCs.getPropertyValue('--zer0-space-fab-size') || '3.5rem'),
        gap: num(rootCs.getPropertyValue('--zer0-space-fab-gap') || '0.75rem'),
      };
      sb.remove();
      gr.remove();
      if (existing) existing.id = 'sidebarFab';
      return { sidebar, graph, hitInSidebar, tokens };
    }, FEEDBACK);

    const slot2 = tokens.offset + tokens.size + tokens.gap;
    const slot3 = tokens.offset + 2 * (tokens.size + tokens.gap);
    // The sidebar FAB keeps slot 2; the graph FAB yields to slot 3.
    expect(Math.abs(sidebar.bottomPx - slot2)).toBeLessThanOrEqual(1);
    expect(Math.abs(graph.bottomPx - slot3)).toBeLessThanOrEqual(1);
    expect(boxesOverlap(sidebar, graph)).toBe(false);
    // A tap at the sidebar FAB's centre reaches the sidebar FAB, not the graph FAB.
    expect(hitInSidebar).toBe(true);
  });
});
