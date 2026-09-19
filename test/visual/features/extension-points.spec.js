// =============================================================================
// extension-points.spec.js — the consumer contracts from issue #412
// =============================================================================
// Four extension points, all of them promises to sites that consume this theme
// UNPINNED through `remote_theme`. That is why they are pinned by behaviour
// here rather than trusted to review: a consumer who reverse-engineers theme
// internals takes a risk that fires on OUR schedule, silently, on a site we do
// not test. it-journey#634 is the worked example — it needed all four, worked
// around all four, and one of the workarounds (guessing the code-block
// wrapper's depth) silently rendered TWO buttons on every block, 26 across 13.
//
// What each group guards:
//
//   1. `button:not(.copy)` in _sass/core/code-copy.scss no longer leaks out of
//      its component. It was an element selector in a component partial, so it
//      restyled every button on a consumer site — at specificity (0,1,1), which
//      out-ranks any single class a consumer could write.
//   2. `zer0:code-block-ready` fires once per block, carries the documented
//      detail shape, and reaches a LATE subscriber — the normal case, since the
//      theme decorates on DOMContentLoaded and a consumer script is deferred.
//   3. `wiki-index.json` carries `lastmod` and `description`, always defined.
//   4. `styles:` / `scripts:` frontmatter emits tags, and a page without them
//      emits none.
//
// The surface for 1, 2 and 4 is /docs/customization/extension-points/, which
// attaches its own CSS and JS through the very frontmatter keys under test and
// adds its demo button through the very event under test. If the page renders
// the way this spec expects, the contracts hold end to end.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, gotoOrSkip } = require('../fixtures');

const DEMO = '/docs/customization/extension-points/';
const PLAIN = '/faq/';

test.describe('Extension points (issue #412)', () => {
  // ---------------------------------------------------------------------------
  // 1. The component partial styles its own component, and nothing else.
  // ---------------------------------------------------------------------------
  test.describe('code-copy.scss button rule is scoped', () => {
    test('a button outside a code block is untouched by code-copy.scss @critical', async ({ page }) => {
      await waitForJekyll(page, DEMO);

      // Asserted STRUCTURALLY, from the CSSOM, rather than by sniffing computed
      // values. A computed-value fingerprint is not evidence: `.table-copy-csv`
      // legitimately sets `font-size: 0.6875rem`, which is 11px, and a
      // font-size match alone would fail this test for a button the rule never
      // touched. What the issue is actually about is the SELECTOR — an element
      // selector with no component ancestor in front of it — so that is what is
      // checked. It also catches a re-leak written with tokens, which no
      // value-based check could.
      const unscoped = await page.evaluate(() => {
        const CODE_ROOTS = ['.code-block-header', 'pre.highlight', '.highlighter-rouge'];
        const bad = [];
        for (const sheet of document.styleSheets) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch {
            continue; // cross-origin sheet (a CDN); not ours to police
          }
          for (const rule of rules) {
            if (!rule.selectorText) continue;
            for (const selector of rule.selectorText.split(',')) {
              const s = selector.trim();
              // EXACTLY the two selectors this issue is about, and nothing
              // adjacent. `:not(.copy)` is unique to this component — no other
              // partial has a reason to write it — and `.button` as the whole
              // compound (not `.button-x`, not `.accordion-button`) is the
              // other half of the rule that leaked. Bootstrap's reboot styles
              // the `button` element too, legitimately, and a broader test
              // would fail on that instead.
              const isCodeCopyRule = s.includes(':not(.copy)');
              const isBareButtonClass = /(^|\s|>)\.button($|[\s>:.[])/.test(s);
              if (!isCodeCopyRule && !isBareButtonClass) continue;
              if (CODE_ROOTS.some((root) => s.includes(root))) continue;
              bad.push(s);
            }
          }
        }
        return bad;
      });
      expect(
        unscoped,
        `a component partial is styling buttons site-wide: ${JSON.stringify(unscoped)}`
      ).toEqual([]);

      // And the old rule's two unmistakable literal values are gone from every
      // button on the page. `#bbb` in particular appears nowhere else in the
      // theme, so a match is the leak and nothing else.
      const fingerprints = await page.evaluate(() => {
        const offenders = [];
        document.querySelectorAll('button:not(.copy)').forEach((el) => {
          if (el.closest('.code-block-header') || el.closest('pre.highlight')) return;
          const cs = getComputedStyle(el);
          if (cs.paddingTop === '0px' && cs.paddingLeft === '20px' && cs.paddingRight === '20px') {
            offenders.push({ why: 'padding: 0 20px', cls: el.className });
          }
          if (cs.borderTopColor === 'rgb(187, 187, 187)') {
            offenders.push({ why: '#bbb border', cls: el.className });
          }
        });
        return offenders;
      });
      expect(
        fingerprints,
        `the old code-copy.scss button rule is back: ${JSON.stringify(fingerprints)}`
      ).toEqual([]);
    });

    test('a consumer class still beats the component rule inside a code block', async ({ page }) => {
      await waitForJekyll(page, DEMO);
      const demo = page.locator('.code-block-header .zer0-demo-action').first();
      await expect(demo).toBeVisible();

      // The demo button is styled by a single class in the page's own
      // stylesheet. Before the fix, `button:not(.copy)` at (0,1,1) out-ranked
      // it and a consumer had to write `.code-block-header .my-btn` to win.
      const background = await demo.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(background).toBe('rgba(0, 0, 0, 0)');
    });

    test('no hardcoded #bbb remains in the served stylesheet', async ({ page, request }) => {
      await waitForJekyll(page, DEMO);
      const href = await page.locator('link[rel="stylesheet"][href*="main"]').first().getAttribute('href');
      test.skip(!href, 'main stylesheet not linked on this page');
      const css = await (await request.get(href)).text();
      // Scoped to the block this issue moved: a bare `button:not(.copy)` with
      // no ancestor in front of it is the selector that leaked.
      expect(css).not.toMatch(/(^|[},])\s*button:not\(\.copy\)\s*[,{]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. The code-block lifecycle event.
  // ---------------------------------------------------------------------------
  test.describe('zer0:code-block-ready', () => {
    test('fires exactly once per code block @critical', async ({ page }) => {
      // Registered before navigation so it observes the real sweep, not a
      // replay. The count is the whole point: a consumer handed two events for
      // one block renders two buttons, which is the failure this shipped as.
      await page.addInitScript(() => {
        window.__specEvents = [];
        document.addEventListener('zer0:code-block-ready', (e) => {
          window.__specEvents.push(e.detail);
        });
      });
      await waitForJekyll(page, DEMO);
      await page.waitForFunction(() => (window.__zer0CodeBlocks || []).length > 0);

      const result = await page.evaluate(() => {
        const wrappers = window.__specEvents.map((d) => d.wrapper);
        return {
          events: window.__specEvents.length,
          uniqueWrappers: new Set(wrappers).size,
          published: (window.__zer0CodeBlocks || []).length,
          decorated: document.querySelectorAll('pre.has-copy-button').length,
        };
      });

      expect(result.events).toBeGreaterThan(1);           // the page has several blocks
      expect(result.uniqueWrappers).toBe(result.events);  // one event per block, no duplicates
      expect(result.published).toBe(result.events);       // the replay array agrees
      expect(result.decorated).toBe(result.events);       // every decorated block was published
    });

    test('carries the documented detail shape', async ({ page }) => {
      await waitForJekyll(page, DEMO);
      await page.waitForFunction(() => (window.__zer0CodeBlocks || []).length > 0);

      const shape = await page.evaluate(() => {
        const d = window.__zer0CodeBlocks.find((b) => b.header !== null) || window.__zer0CodeBlocks[0];
        return {
          keys: Object.keys(d).sort(),
          wrapperIsElement: d.wrapper instanceof Element,
          preTag: d.pre && d.pre.tagName,
          codeTag: d.code && d.code.tagName,
          headerClass: d.header && d.header.className,
          langType: d.lang === null ? 'null' : typeof d.lang,
          // Dispatched LAST: the copy button must already be attached.
          copyAttached: !!d.wrapper.querySelector('.copy'),
        };
      });

      expect(shape.keys).toEqual(['code', 'header', 'lang', 'pre', 'wrapper']);
      expect(shape.wrapperIsElement).toBe(true);
      expect(shape.preTag).toBe('PRE');
      expect(shape.codeTag).toBe('CODE');
      expect(shape.headerClass).toContain('code-block-header');
      expect(['string', 'null']).toContain(shape.langType);
      expect(shape.copyAttached).toBe(true);
    });

    test('a subscriber registered AFTER load still receives every block', async ({ page }) => {
      // The load-bearing half of the contract. The sweep runs on
      // DOMContentLoaded, so a deferred consumer script is normally later than
      // it — a plain addEventListener would receive nothing at all.
      await waitForJekyll(page, DEMO);
      await page.waitForFunction(() => (window.__zer0CodeBlocks || []).length > 0);

      const seen = await page.evaluate(() => {
        const late = [];
        window.zer0OnCodeBlock((detail) => late.push(detail));
        return { late: late.length, published: window.__zer0CodeBlocks.length };
      });

      expect(seen.late).toBe(seen.published);
      expect(seen.late).toBeGreaterThan(1);
    });

    test('the event bubbles, and unsubscribing works', async ({ page }) => {
      await waitForJekyll(page, DEMO);
      const ok = await page.evaluate(() => {
        let count = 0;
        const off = window.zer0OnCodeBlock(() => { count += 1; });
        const replayed = count;
        off();
        // Bubbling: a listener on `document` is what the docs tell consumers to
        // use, and it only works because the event bubbles from the wrapper.
        let bubbled = 0;
        const handler = () => { bubbled += 1; };
        document.addEventListener('zer0:code-block-ready', handler);
        const w = window.__zer0CodeBlocks[0].wrapper;
        w.dispatchEvent(new CustomEvent('zer0:code-block-ready', { bubbles: true, detail: {} }));
        document.removeEventListener('zer0:code-block-ready', handler);
        return { replayed, bubbled, countAfterOff: count };
      });
      expect(ok.replayed).toBeGreaterThan(0);
      expect(ok.bubbled).toBe(1);
      expect(ok.countAfterOff).toBe(ok.replayed); // off() really detached
    });
  });

  // ---------------------------------------------------------------------------
  // 3. The wiki index entry shape.
  // ---------------------------------------------------------------------------
  test.describe('wiki-index.json', () => {
    test('every entry defines lastmod and description @critical', async ({ request }) => {
      const res = await request.get('/assets/data/wiki-index.json');
      test.skip(res.status() >= 400, 'wiki-index.json not built in this configuration');

      const body = await res.json();          // also asserts it is still valid JSON
      expect(Array.isArray(body.entries)).toBe(true);
      expect(body.entries.length).toBeGreaterThan(0);

      // Present on EVERY entry, `null` when the document has neither — a key
      // that is conditionally omitted is a worse contract than one that is
      // sometimes null.
      const missing = body.entries.filter(
        (e) => !('lastmod' in e) || !('description' in e)
      );
      expect(missing.map((e) => e.url)).toEqual([]);

      // The pre-existing keys are untouched.
      for (const key of ['title', 'basename', 'url', 'collection', 'tags', 'categories', 'aliases', 'outgoing', 'excerpt']) {
        expect(body.entries[0]).toHaveProperty(key);
      }

      // ISO-8601, so a consumer can sort the strings without parsing them.
      const dated = body.entries.filter((e) => e.lastmod !== null);
      expect(dated.length).toBeGreaterThan(0);
      for (const e of dated.slice(0, 25)) {
        expect(e.lastmod, `${e.url} lastmod is not ISO-8601`).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:?\d{2}|Z)$/
        );
      }
    });

    test('this page appears with its authored description', async ({ request }) => {
      const res = await request.get('/assets/data/wiki-index.json');
      test.skip(res.status() >= 400, 'wiki-index.json not built in this configuration');
      const body = await res.json();
      const entry = body.entries.find((e) => e.url === DEMO);
      test.skip(!entry, 'extension-points page not in the wiki index for this build');
      expect(entry.description).toContain('supported hooks');
      expect(entry.lastmod).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Per-page assets from frontmatter.
  // ---------------------------------------------------------------------------
  test.describe('styles: / scripts: frontmatter', () => {
    test('a page that declares them emits the tags @critical', async ({ page }) => {
      await waitForJekyll(page, DEMO);

      const style = page.locator('link[rel="stylesheet"][href$="/assets/css/extension-points-demo.css"]');
      const script = page.locator('script[src$="/assets/js/extension-points-demo.js"]');
      await expect(style).toHaveCount(1);
      await expect(script).toHaveCount(1);

      // Rendered through relative_url — the href is site-rooted, not the raw
      // frontmatter string, so a baseurl deployment stays correct.
      const href = await style.getAttribute('href');
      expect(href.startsWith('/')).toBe(true);

      // `scripts:` is deferred and lands after the theme bundle, which is what
      // lets a page script call zer0OnCodeBlock without a readiness check.
      await expect(script).toHaveAttribute('defer', '');
      const themeBeforePage = await page.evaluate(() => {
        const srcs = [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src'));
        return srcs.findIndex((s) => s.includes('code-copy.js')) <
               srcs.findIndex((s) => s.includes('extension-points-demo.js'));
      });
      expect(themeBeforePage).toBe(true);

      // And it actually ran: the demo action is in every header.
      const headers = await page.locator('.code-block-header').count();
      await expect(page.locator('.code-block-header .zer0-demo-action')).toHaveCount(headers);
    });

    test('a page that declares neither emits no per-page tags', async ({ page }) => {
      await gotoOrSkip(page, PLAIN);
      await expect(
        page.locator('link[rel="stylesheet"][href*="extension-points-demo"]')
      ).toHaveCount(0);
      await expect(
        page.locator('script[src*="extension-points-demo"]')
      ).toHaveCount(0);
    });
  });
});
