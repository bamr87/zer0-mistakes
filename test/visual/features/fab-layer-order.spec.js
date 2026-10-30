// =============================================================================
// fab-layer-order.spec.js — an open overlay covers every FAB
// =============================================================================
// Regression guard for issue #572 (found by the it-journey.dev theme canary).
//
// The FAB band used to live ABOVE the overlay surfaces: back-to-top 1050,
// feedback 1051, chat 1052, toc 1055, local-graph 1060 against backdrop 1040,
// offcanvas 1045 and modal 1055. With the search modal open, the TOC and
// local-graph FABs painted over the backdrop and `elementFromPoint` at their
// centres still returned the FAB icons; `fab-toc` tied with `modal` and won on
// DOM order because the FABs render after the footer.
//
// The band now sits between the header and the backdrop (1031-1039), which is
// what `_sass/tokens/_layers.scss`'s own header promises ("so FABs / banners /
// modals never overlap unintentionally"). This is a source contract over the
// token scale, so it needs no server.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../../..');
const SCSS = '_sass/tokens/_layers.scss';
const MIRROR = '_design-system/tokens/layers.css';

function tokens(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const out = {};
  for (const [, name, value] of src.matchAll(/--zer0-layer-([a-z0-9-]+):\s*(\d+)\s*;/g)) {
    out[name] = Number(value);
  }
  return out;
}

test.describe('FAB layer tokens sit below the overlay surfaces', () => {
  test('every FAB is above the header and below backdrop, offcanvas and modal', () => {
    const t = tokens(SCSS);
    const fabs = Object.entries(t).filter(([n]) => n.startsWith('fab-'));
    expect(fabs.length, 'FAB tokens found').toBeGreaterThanOrEqual(5);

    for (const [name, z] of fabs) {
      expect(z, `${name} must clear the fixed header`).toBeGreaterThan(t.header);
      // Strictly below: a tie is decided by DOM order, and the FABs render
      // after the footer, so a tie means the FAB wins (issue #572).
      expect(z, `${name} must sit below the backdrop`).toBeLessThan(t.backdrop);
      expect(z, `${name} must sit below the offcanvas`).toBeLessThan(t.offcanvas);
      expect(z, `${name} must sit below the modal`).toBeLessThan(t.modal);
    }
  });

  test('the overlay scale itself stays ordered', () => {
    const t = tokens(SCSS);
    expect(t.header).toBeLessThan(t.backdrop);
    expect(t.backdrop).toBeLessThan(t.offcanvas);
    expect(t.offcanvas).toBeLessThan(t.modal);
  });

  test('the design-system mirror carries the same FAB values', () => {
    const scss = tokens(SCSS);
    const mirror = tokens(MIRROR);
    for (const [name, z] of Object.entries(scss).filter(([n]) => n.startsWith('fab-'))) {
      expect(mirror[name], `mirror --zer0-layer-${name}`).toBe(z);
    }
  });

  test('no var() fallback re-introduces an above-the-overlay value', () => {
    const t = tokens(SCSS);
    const roots = ['_sass', '_includes', 'assets', 'templates'];
    const files = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(scss|css|html|js)$/.test(e.name)) files.push(full);
      }
    };
    for (const r of roots) {
      const dir = path.join(ROOT, r);
      if (fs.existsSync(dir)) walk(dir);
    }

    const offenders = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const [, name, fallback] of src.matchAll(/var\(--zer0-layer-(fab-[a-z0-9-]+),\s*(\d+)\s*\)/g)) {
        const z = Number(fallback);
        if (z >= t.backdrop || z !== t[name]) {
          offenders.push(`${path.relative(ROOT, f)}: --zer0-layer-${name} fallback ${z} (token is ${t[name]})`);
        }
      }
    }
    expect(offenders, 'stale FAB z-index fallbacks').toEqual([]);
  });
});
