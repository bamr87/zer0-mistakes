/**
 * Accessibility audits using axe-core.
 * Runs WCAG 2.1 AA checks across admin pages, homepage, and key components.
 * Catches specific PR #57 review issues: keyboard support, valid HTML, labels.
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const {
  ADMIN_PAGES,
  VIEWPORTS,
  UI_ROUTES,
  waitForJekyll,
  gotoOrSkip,
  dismissCookieConsent,
} = require('../fixtures');

test.describe('Accessibility — axe-core WCAG audits', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  // T-007 (2026-06-13): the four WCAG 2.1 AA violations below were resolved
  // and verified with a live axe-core run (0 violations on homepage, FAQ, and
  // admin pages). Fixes: dropped the redundant ARIA menubar/menuitem roles
  // (navbar.html), aria-label on the site-subtitle home link (branding.html),
  // listitem-preserving footer/admin separator (admin-nav.html), focusable
  // single-scroll code blocks (code-copy.js + code-copy.scss), and underlined
  // prose links (_docs-layout.scss).
  test('homepage passes WCAG 2.1 AA', { tag: '@critical' }, async ({ page }) => {
    await waitForJekyll(page, '/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(
      results.violations,
      `Accessibility violations on homepage:\n${formatViolations(results.violations)}`
    ).toEqual([]);
  });

  for (const adminPage of ADMIN_PAGES) {
    test(`${adminPage.title} passes WCAG 2.1 AA`, async ({ page }) => {
      await waitForJekyll(page, adminPage.url);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        results.violations,
        `Accessibility violations on ${adminPage.title}:\n${formatViolations(results.violations)}`
      ).toEqual([]);
    });
  }

  test('FAQ page passes WCAG 2.1 AA', async ({ page }) => {
    await waitForJekyll(page, '/faq/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(
      results.violations,
      `Accessibility violations on FAQ:\n${formatViolations(results.violations)}`
    ).toEqual([]);
  });
});

// Regression: #280. The page-level audits above never walked this subtree —
// the modal is closed on load, so a 1:1-contrast `text-dark` on the dark
// `bg-body` panel shipped to every consumer unnoticed.
//
// NOTE ON METHOD: axe's `color-contrast` rule cannot catch this, and it is
// worth understanding why before "simplifying" this test back into an axe
// call. The skin system paints `body.zer0-bg-body::after` with the active
// skin's SVG (e.g. /assets/backgrounds/noise/air.svg). axe refuses to resolve
// a background colour underneath a pseudo element, so every text node in the
// dialog is reported as `incomplete` ("Element's background color could not
// be determined due to a pseudo element") and `violations` comes back EMPTY —
// on the broken markup as well as the fixed markup. An axe-only assertion
// here passes vacuously. So we measure the contrast ratio ourselves, which is
// what WCAG 1.4.3 actually specifies.
test.describe('Accessibility — cookie preferences modal (dark mode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    // Pin dark explicitly. `color_mode_default: auto` means color-mode-init.html
    // resolves via prefers-color-scheme, so on a light-preference runner the
    // page would flip to light and the bug would not reproduce. localStorage
    // "theme" is the same override the Appearance panel writes, and it
    // outranks the config default.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'));
    // Keep the consent banner (z-index 1095) from covering the dialog.
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');
    await openDialog(page, '#cookieSettingsModal');
  });

  test('"Your Privacy Rights" text meets the 4.5:1 contrast minimum', async ({ page }) => {
    expect(await page.getAttribute('html', 'data-bs-theme')).toBe('dark');

    const measured = await page.$$eval(
      '#cookieSettingsModal .bg-body li',
      (items) => {
        const parse = (c) => {
          const m = String(c).match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(',').map((v) => parseFloat(v.trim()));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        // First ancestor (self included) painting an opaque background.
        const backdrop = (el) => {
          for (let n = el; n; n = n.parentElement) {
            const c = parse(getComputedStyle(n).backgroundColor);
            if (c && c.a === 1) return c;
          }
          return { r: 255, g: 255, b: 255, a: 1 };
        };
        // WCAG 2.1 relative luminance + contrast ratio.
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
        return items.map((el) => {
          const fg = parse(getComputedStyle(el).color);
          const bg = backdrop(el);
          return {
            text: (el.textContent || '').trim().slice(0, 48),
            fg: `rgb(${fg.r}, ${fg.g}, ${fg.b})`,
            bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
            ratio: Math.round(ratio(fg, bg) * 100) / 100,
          };
        });
      }
    );

    expect(measured.length, 'privacy-rights bullets should be present').toBeGreaterThan(0);
    const failing = measured.filter((m) => m.ratio < 4.5);
    expect(
      failing,
      'WCAG 1.4.3 (AA) requires >= 4.5:1 for body text. Failing bullets:\n' +
        failing.map((m) => `  ${m.ratio}:1  ${m.fg} on ${m.bg}  — "${m.text}"`).join('\n')
    ).toEqual([]);
  });

  // Broader net for the rest of the dialog. This one genuinely can pass
  // vacuously for contrast (see the note above), but it still guards the
  // structural rules — labels, names, roles, ARIA.
  test('cookie settings modal has no structural WCAG 2.1 AA violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('#cookieSettingsModal')
      .analyze();

    expect(
      results.violations,
      `Accessibility violations in the cookie settings modal (dark mode):\n${formatViolations(results.violations)}`
    ).toEqual([]);
  });
});

test.describe('Accessibility — specific component checks', () => {
  test('admin sidebar nav uses <nav> with aria-label', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/about/config/');
    const nav = page.locator('nav.admin-sidebar[aria-label]');
    await expect(nav).toBeVisible();
    const label = await nav.getAttribute('aria-label');
    expect(label.length).toBeGreaterThan(0);
  });

  test('color inputs have associated labels (regression)', async ({ page }) => {
    await waitForJekyll(page, '/about/settings/theme/');
    const colorInputs = page.locator('input[type="color"]');
    const count = await colorInputs.count();
    for (let i = 0; i < count; i++) {
      const input = colorInputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        expect(
          await label.count(),
          `Color input #${id} should have an associated <label>`
        ).toBeGreaterThanOrEqual(1);
      } else {
        // Input without id — should be wrapped in a label
        const parentLabel = input.locator('xpath=ancestor::label');
        expect(
          await parentLabel.count(),
          `Color input at index ${i} has no id and no wrapping <label>`
        ).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('tabs use proper ARIA roles', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    const tabList = page.locator('[role="tablist"]');
    if (await tabList.count() === 0) {
      test.skip();
      return;
    }
    const tabs = tabList.first().locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      // Each tab should have aria-controls pointing to a panel
      const controls = await tab.getAttribute('aria-controls');
      expect(controls, `Tab ${i} missing aria-controls`).toBeTruthy();
      // The controlled panel should exist
      const panel = page.locator(`#${controls}`);
      expect(await panel.count(), `Panel #${controls} not found`).toBe(1);
    }
  });

  test('admin nav <hr> is wrapped in <li> (regression: invalid HTML)', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    // Check that <hr> inside <ul> is properly wrapped
    const invalidHr = await page.evaluate(() => {
      const uls = document.querySelectorAll('nav.admin-sidebar ul');
      for (const ul of uls) {
        for (const child of ul.children) {
          if (child.tagName === 'HR') return true;
        }
      }
      return false;
    });
    expect(
      invalidHr,
      '<hr> must not be a direct child of <ul> — wrap in <li role="separator">'
    ).toBe(false);
  });
});

test.describe('Accessibility — UI refresh smoke', { tag: '@critical' }, () => {
  test('skip link is focusable and targets main content', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(skip).toBeFocused();
    await expect(page.locator('#main-content, main').first()).toBeAttached();
  });

  // Regression: issue #278. The test above asserts the target *exists* but never
  // activates the link, so it stayed green while the skip link did nothing in
  // Safari. <main> is not natively focusable — without tabindex="-1" a fragment
  // jump scrolls without moving keyboard focus, and the next Tab drops the user
  // back into the header nav (WCAG 2.4.1 Bypass Blocks).
  test('activating the skip link moves keyboard focus into main content', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const main = page.locator('#main-content');
    await expect(main).toBeAttached();

    // The attribute is the mechanism; assert it directly so a failure names the
    // cause rather than only the symptom.
    await expect(main).toHaveAttribute('tabindex', '-1');

    const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
    await skip.focus();
    await skip.press('Enter');

    // The symptom the user actually feels. Fails on an untabindexed <main>.
    await expect(main).toBeFocused();

    // …and the point of the skip link: the next Tab must leave the header chrome
    // behind. Guarded, because a route whose content holds nothing focusable
    // legitimately tabs on to the footer — that is not this bug.
    const hasFocusableContent = await main.evaluate((m) =>
      m.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .length > 0
    );
    if (hasFocusableContent) {
      await page.keyboard.press('Tab');
      const landedInMain = await page.evaluate(() => {
        const el = document.activeElement;
        const m = document.getElementById('main-content');
        return !!(el && m && m.contains(el));
      });
      expect(landedInMain, 'the Tab after a skip must land inside #main-content').toBe(true);
    }
  });

  test('skip-link target paints no focus ring, but content inside still does', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const main = page.locator('#main-content');
    const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
    await skip.focus();
    await skip.press('Enter');
    await expect(main).toBeFocused();

    // The container is a layout wrapper, not an interactive control — a ring
    // around the whole page body would be noise.
    const container = await main.evaluate((m) => {
      const s = getComputedStyle(m);
      return { width: s.outlineWidth, style: s.outlineStyle };
    });
    expect(
      container.style === 'none' || container.width === '0px',
      `#main-content must not paint a focus ring (got ${JSON.stringify(container)})`
    ).toBe(true);

    // The suppression must not leak to descendants. Tab (real keyboard modality,
    // so :focus-visible engages — a programmatic .focus() would not reliably
    // match it) and assert whatever we land on still shows an indicator.
    const hasFocusableContent = await main.evaluate((m) =>
      m.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .length > 0
    );
    if (!hasFocusableContent) {
      test.skip(true, 'No focusable element inside #main-content on this route');
      return;
    }

    await page.keyboard.press('Tab');
    const descendant = await page.evaluate(() => {
      const el = document.activeElement;
      const m = document.getElementById('main-content');
      if (!el || !m || !m.contains(el)) return null;
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, style: s.outlineStyle, shadow: s.boxShadow, tag: el.tagName };
    });
    if (!descendant) {
      test.skip(true, 'Tab did not land inside #main-content on this route');
      return;
    }
    const hasIndicator =
      (descendant.style !== 'none' && descendant.width !== '0px') ||
      (descendant.shadow && descendant.shadow !== 'none');
    expect(
      hasIndicator,
      `focused ${descendant.tag} inside #main-content must keep an indicator (got ${JSON.stringify(descendant)})`
    ).toBe(true);
  });

  test('intro metadata row has aria-label when present', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstart);

    const meta = page.locator('.bd-intro-meta-row[aria-label]');
    if ((await meta.count()) === 0) {
      test.skip(true, 'Intro metadata not on this page');
      return;
    }
    const label = await meta.getAttribute('aria-label');
    expect((label || '').length).toBeGreaterThan(0);
  });

  test('code copy buttons are keyboard focusable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.codeCopy);

    await page.waitForFunction(() =>
      document.querySelector('.bd-content .code-block-header .copy, .bd-content .copy')
    );
    const copyBtn = page.locator('.bd-content .code-block-header .copy, .bd-content .copy').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons on page');
      return;
    }
    await copyBtn.focus();
    await expect(copyBtn).toBeFocused();
  });

  test('table CSV export button has accessible name', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.home);

    // table-copy.js injects the button on DOMContentLoaded for any markdown
    // table in the content area. Homepages without a table (e.g. a hero/landing
    // page) never get one — wait briefly, then skip rather than block until the
    // test times out.
    const btn = page.locator('.table-copy-csv').first();
    await btn.waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
    if ((await btn.count()) === 0) {
      test.skip(true, 'No table copy button on this page');
      return;
    }
    const ariaLabel = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    const text = ((await btn.textContent()) || '').trim();
    expect((ariaLabel || title || text).length).toBeGreaterThan(0);
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`axe advisory scan at ${name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await waitForJekyll(page, UI_ROUTES.home);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();

      expect(
        results.violations.length,
        `High axe violation count at ${name}:\n${formatViolations(results.violations)}`
      ).toBeLessThan(20);
    });
  }
});

// Regression: #318. Half the theme's dialogs labelled themselves with a bare
// <h5>, so on a page running h1 -> h2 the first heading inside the dialog
// jumped two levels. The other half already used <h2 class="…-title h5">.
//
// The existing suite could not catch this for TWO independent reasons, and
// both have to be worked around here:
//   1. axe's `heading-order` rule is tagged ['cat.semantics','best-practice'],
//      NOT wcag2a/wcag2aa — so `.withTags(['wcag2a','wcag2aa'])` skips it
//      entirely. It must be opted in with `.withRules(['heading-order'])`.
//   2. The dialogs are closed on load, so their headings are hidden and axe
//      never evaluates them. Each one has to be opened first.
// A test that only fixes (1) or only fixes (2) passes vacuously.
const DIALOGS = [
  { url: '/', selector: '#siteSearchModal', kind: 'modal', source: 'components/search-modal.html' },
  { url: '/', selector: '#cookieSettingsModal', kind: 'modal', source: 'components/cookie-consent.html' },
  { url: '/', selector: '#info-section', kind: 'offcanvas', source: 'components/info-section.html' },
  { url: '/about/stats/', selector: '#helpModal', kind: 'modal', source: 'stats/stats-metrics.html' },
  { url: '/news/science/', selector: '#sectionSidebar', kind: 'offcanvas', source: 'navigation/section-sidebar.html' },
  { url: '/about/theme/', selector: '#adminSidebar', kind: 'offcanvas', source: '_layouts/admin.html' },
];

test.describe('Accessibility — dialog headings do not skip levels', () => {
  for (const dialog of DIALOGS) {
    test(`${dialog.selector} title keeps the heading order (${dialog.source})`, async ({ page }) => {
      // The admin sidebar offcanvas is .d-lg-none — only rendered at < lg.
      await page.setViewportSize(
        dialog.selector === '#adminSidebar' ? VIEWPORTS.mobile : VIEWPORTS.desktop
      );
      await dismissCookieConsent(page);
      await gotoOrSkip(page, dialog.url);

      await openDialog(page, dialog.selector, dialog.kind);

      // (a) The dialog-title contract. This is the assertion that actually
      // pins the bug for every dialog: a dialog is a fresh context, so its
      // title is a semantic <h2> sized down with .h5 — the pattern the six
      // already-correct dialogs use. Checked directly because axe cannot see
      // most of these; see (b).
      const title = await page
        .locator(`${dialog.selector} .${dialog.kind}-title`)
        .evaluate((el) => ({ tag: el.tagName.toLowerCase(), cls: el.className }));

      expect(
        title.tag,
        `${dialog.selector} (${dialog.source}) labels itself with <${title.tag} class="${title.cls}">. ` +
          `Dialog titles must be a semantic <h2 class="${dialog.kind}-title h5"> — ` +
          'a bare <h5> skips levels for anyone navigating by heading.'
      ).toBe('h2');
      expect(
        title.cls.split(/\s+/),
        `${dialog.selector} must keep the .h5 utility so the swap is visually inert`
      ).toContain('h5');

      // (b) axe's own heading-order rule, as a second opinion. NOTE: this
      // catches only the dialogs whose title happens to follow a
      // higher-level heading in DOM order — #cookieSettingsModal and
      // #adminSidebar today. #siteSearchModal and #info-section render
      // their title as the FIRST heading in the document (root.html emits
      // them ahead of the content), and axe never flags a leading heading;
      // #helpModal and #sectionSidebar follow same-level headings. So this
      // assertion is vacuous for four of the six and cannot replace (a).
      const results = await new AxeBuilder({ page })
        .withRules(['heading-order'])
        .analyze();

      // Scope to headings inside THIS dialog so an unrelated heading-order
      // problem in page content fails its own test, not this one.
      const inDialog = results.violations
        .flatMap((v) => v.nodes)
        .filter((n) => n.target.some((t) => String(t).includes(dialog.selector)));

      expect(
        inDialog.map((n) => n.html.trim().split('\n')[0]),
        `Dialog ${dialog.selector} (${dialog.source}) skips a heading level.`
      ).toEqual([]);
    });
  }
});

/**
 * Open a Bootstrap modal or offcanvas via its JS API and wait until shown.
 * Triggers vary per dialog (some live in the consent banner or a collapsed
 * navbar), so drive the component directly rather than clicking.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - e.g. '#siteSearchModal'
 * @param {'modal'|'offcanvas'} kind
 */
async function openDialog(page, selector, kind) {
  const Ctor = kind === 'offcanvas' ? 'Offcanvas' : 'Modal';
  await page.waitForFunction(
    (c) => typeof window.bootstrap?.[c] === 'function',
    Ctor
  );
  await page.evaluate(
    ([sel, ctor, evt]) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`Dialog ${sel} not found in the DOM`);
      return new Promise((resolve) => {
        el.addEventListener(evt, () => resolve(), { once: true });
        window.bootstrap[ctor].getOrCreateInstance(el).show();
      });
    },
    [selector, Ctor, kind === 'offcanvas' ? 'shown.bs.offcanvas' : 'shown.bs.modal']
  );
  await expect(page.locator(selector)).toBeVisible();
}

/** Format axe violations for readable error output. */
function formatViolations(violations) {
  if (!violations.length) return 'None';
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.html.substring(0, 100)}`).join('\n');
      return `[${v.impact}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}
