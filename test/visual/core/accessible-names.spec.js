/**
 * Accessible names for icon-only controls, and live-region announcements.
 *
 * Regression: #435 and #279.
 *
 * #435 — the footer's "Follow Us" social links and the RSS link render an
 * `<i>` that is `aria-hidden="true"` next to a `<span class="d-none d-md-inline">`
 * label. Below the `md` breakpoint the span is display:none, so it is removed
 * from the accessibility tree too — leaving the link with **no accessible name
 * at all**. A screen reader announced a bare "link". WCAG 2.4.4 / 4.1.2.
 *
 * The trap this test avoids: asserting at desktop width, where the label span
 * is visible and every link has a perfectly good name. The defect only exists
 * on small viewports, so that is where these assertions run.
 *
 * axe cannot be relied on here either — `link-name` fires on the *rendered*
 * tree, and whether it catches this depends on how the run resolves the
 * responsive utility class. The assertions below read the computed accessible
 * name directly, which is unambiguous.
 *
 * #279 — the search modal rewrites its results container without moving focus,
 * so a screen-reader user got silence. There is now a visually-hidden
 * `role="status"` region carrying a concise count. The results list itself is
 * deliberately NOT live: announcing eight titles and snippets per keystroke is
 * unusable.
 *
 * #573 — kramdown GFM task lists render `<input class="task-list-item-checkbox">`
 * with no `<label>`, so every box failed axe `label` (WCAG 1.3.1 / 4.1.2), kept
 * its list bullet, and sat flush against its text. ui-enhancements.js now points
 * each box at its item's own text with `aria-labelledby`; _ui-enhancements.scss
 * drops the bullet and spaces the box.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { VIEWPORTS, UI_ROUTES, waitForJekyll, gotoOrSkip } = require('../fixtures');

test.describe('Accessible names — footer icon links', { tag: '@critical' }, () => {
  test('every footer social/RSS link has an accessible name at mobile width', async ({ page }) => {
    // 375px — below `md`, where the label span is display:none.
    await page.setViewportSize(VIEWPORTS.mobile);
    await waitForJekyll(page, UI_ROUTES.home);

    const links = page.locator('.footer-dark-block a, footer a').filter({
      has: page.locator('i[aria-hidden="true"]'),
    });
    const count = await links.count();
    expect(count, 'the footer should render icon links to check').toBeGreaterThan(0);

    const nameless = [];
    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      if (!(await link.isVisible())) continue;
      // The computed accessible name, exactly as assistive tech resolves it.
      const name = (await link.evaluate((el) => {
        const aria = el.getAttribute('aria-label');
        if (aria && aria.trim()) return aria.trim();
        const title = el.getAttribute('title');
        // innerText excludes display:none descendants — which is the whole bug.
        return (el.innerText || '').trim() || (title || '').trim();
      })) || '';
      if (!name) nameless.push(await link.getAttribute('href'));
    }

    expect(
      nameless,
      `these footer links have no accessible name below the md breakpoint — the icon is ` +
      `aria-hidden and the label span is d-none, so a screen reader announces only "link"`
    ).toEqual([]);
  });

  test('the visible label is still the accessible name at desktop width', async ({ page }) => {
    // Guards WCAG 2.5.3 (Label in Name): the aria-label added for mobile must
    // not diverge from the text a sighted user reads at md+.
    await page.setViewportSize(VIEWPORTS.wideDesktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const links = page.locator('footer a[aria-label]').filter({
      has: page.locator('span:not(.visually-hidden)'),
    });
    const count = await links.count();
    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      if (!(await link.isVisible())) continue;
      const { label, text } = await link.evaluate((el) => ({
        label: (el.getAttribute('aria-label') || '').trim(),
        text: (el.innerText || '').trim(),
      }));
      if (!text) continue; // icon-only at this width is fine, nothing to match
      expect(
        label.toLowerCase(),
        `aria-label "${label}" must contain the visible text "${text}" (WCAG 2.5.3)`
      ).toContain(text.toLowerCase());
    }
  });
});

test.describe('Task lists — checkboxes are named and spaced (#573)', { tag: '@critical' }, () => {
  const TASKS = '/notes/markdown-tips/';

  test('each task-list checkbox is named by its own item text', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, TASKS);

    const boxes = page.locator('.task-list-item-checkbox');
    expect(await boxes.count(), 'the page should render task-list checkboxes').toBeGreaterThan(0);

    // Resolves only when the computed accessible name is the item's text.
    await expect(page.getByRole('checkbox', { name: 'Completed task', exact: true })).toHaveCount(1);
    await expect(page.getByRole('checkbox', { name: 'Incomplete task', exact: true })).toHaveCount(1);
  });

  test('a parent item is named by its own text, not its nested items', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, TASKS);

    const parent = page.locator('.task-list-item:has(> ul .task-list-item-checkbox)').first();
    await expect(parent, 'the page should render a nested task list').toHaveCount(1);
    await expect(
      parent.locator('> .task-list-item-checkbox, > p > .task-list-item-checkbox')
    ).toHaveAccessibleName('Another task');
    await expect(page.getByRole('checkbox', { name: 'Nested completed', exact: true })).toHaveCount(1);
  });

  test('axe reports no `label` violations on task lists', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, TASKS);

    const results = await new AxeBuilder({ page })
      .include('.task-list-item')
      .withRules(['label'])
      .analyze();
    expect(
      results.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' '))),
      'every task-list checkbox needs an accessible name'
    ).toEqual([]);
  });

  test('task-list items have no bullet and a gap between box and text', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, TASKS);

    const style = await page.locator('.task-list-item-checkbox').first().evaluate((box) => ({
      listStyle: getComputedStyle(box.closest('.task-list-item')).listStyleType,
      marginRight: parseFloat(getComputedStyle(box).marginRight),
    }));
    expect(style.listStyle, 'the item must not keep its bullet').toBe('none');
    expect(style.marginRight, 'the box must not sit flush against its text').toBeGreaterThan(0);
  });
});

test.describe('Search modal — results are announced', { tag: '@critical' }, () => {
  test('a polite status region exists and is not the results list itself', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const status = page.locator('[data-search-status]');
    await expect(status, 'search needs a live region to announce into').toHaveCount(1);
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');

    // The results container must NOT be live: eight titles plus snippets read
    // out on every keystroke is worse than silence.
    const results = page.locator('[data-search-results]');
    await expect(results).toHaveCount(1);
    expect(
      await results.getAttribute('aria-live'),
      'the results list must not itself be a live region'
    ).toBeNull();
  });

  test('the status region is visually hidden but in the accessibility tree', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const box = await page.locator('[data-search-status]').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { w: r.width, h: r.height, display: s.display, visibility: s.visibility };
    });
    // display:none / visibility:hidden would remove it from the a11y tree, so
    // the announcement would never be made. visually-hidden clips instead.
    expect(box.display, 'display:none would silence the region').not.toBe('none');
    expect(box.visibility, 'visibility:hidden would silence the region').not.toBe('hidden');
  });
});
