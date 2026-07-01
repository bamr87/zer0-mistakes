// =============================================================================
// sidebar-modes.spec.js — collection-aware left-sidebar mode resolution
// =============================================================================
// Regression coverage for the sidebar framework refactor (PR #273):
// _includes/navigation/sidebar-config.html resolves the effective nav mode
// (page front matter → collection `sidebar:` metadata → site.sidebar) and
// sidebar-nav.html renders it. Modes under test on the dev site:
//
//   - curated tree  : docs pages (`nav: docs`, and `nav: auto` resolving to
//                     _data/navigation/docs.yml) render nav-tree.html
//   - collection    : notes pages (`nav: auto`, no notes.yml data file) render
//                     the live collection tree (sidebar-folders.html) with the
//                     collection-metadata heading and aria-current active link
//   - categories    : /faq/ (pages default `nav: categories`) renders taxonomy
//                     groups with post-count badges and Bootstrap collapse
//   - none          : posts have `sidebar: true` (boolean, no nav) → right TOC
//                     only, no left column, no navbar sidebar toggle
//   - opt-out       : /sitemap/ sets `sidebar: false` → no #bdSidebar at all
//
// How these tests fail against the pre-refactor templates:
//   - "auto resolves to curated docs tree": pages relying on the (previously
//     unresolvable) `nav: tree` default rendered NO left column at all.
//   - "collection tree" assertions: the old sidebar-folders.html emitted a
//     flat non-collapsible list-group without the .sidebar-collection wrapper,
//     collection heading, or aria-current.
//   - "categories" badge/collapse assertions: the old sidebar-categories.html
//     had no count badges and always-collapsed groups.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, VIEWPORTS } = require('./fixtures');

// A docs page whose front matter sets `sidebar.nav: docs` explicitly.
const DOCS_EXPLICIT_TREE = '/docs/features/sidebar-navigation/';
// A docs page with NO sidebar in front matter — relies on the _config.yml
// docs default (`nav: auto`), which must resolve to the curated docs.yml tree.
const DOCS_AUTO_TREE = '/docs/obsidian/getting-started/';
// A notes page — `nav: auto` with no _data/navigation/notes.yml resolves to
// the live collection tree.
const NOTES_COLLECTION = '/notes/git-cheatsheet/';
// Categories mode via the pages-scope default.
const CATEGORIES_PAGE = '/faq/';
// `sidebar: false` opt-out.
const OPT_OUT_PAGE = '/sitemap/';

test.describe('Sidebar modes — resolution and rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('explicit nav: docs renders the curated tree in the left column', async ({ page }) => {
    await waitForJekyll(page, DOCS_EXPLICIT_TREE);
    const aside = page.locator('aside.bd-sidebar');
    await expect(aside).toHaveCount(1);
    // Curated _data/navigation/docs.yml → nav-tree.html markup.
    await expect(aside.locator('.nav-tree .nav-tree-root').first()).toBeAttached();
    await expect(aside.locator('.nav-tree-link').first()).toBeVisible();
  });

  test('nav: auto on a docs page resolves to the curated docs.yml tree', async ({ page }) => {
    await waitForJekyll(page, DOCS_AUTO_TREE);
    // Pre-refactor this page had NO left column (unresolvable `nav: tree`).
    const aside = page.locator('aside.bd-sidebar');
    await expect(aside).toHaveCount(1);
    // docs.yml top-level sections render as collapsible nav-tree items.
    await expect(aside.locator('[id^="nav-"]').first()).toBeAttached();
  });

  test('nav: auto on a notes page renders the live collection tree', async ({ page }) => {
    await waitForJekyll(page, NOTES_COLLECTION);
    const tree = page.locator('aside.bd-sidebar .sidebar-collection');
    await expect(tree).toHaveCount(1);
    // Heading comes from the collection metadata (title: Notes) in _config.yml.
    await expect(tree.locator('.sidebar-collection-heading')).toContainText('Notes');
    // The current page's link is active and exposed to AT via aria-current.
    const active = tree.locator('.nav-tree-link.active[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute('href', /\/notes\/git-cheatsheet\//);
    // Sibling notes are listed as depth-0 items (flat collection).
    const items = tree.locator('.nav-tree-item[data-depth="0"]');
    expect(await items.count()).toBeGreaterThan(1);
  });

  test('categories mode groups posts with count badges and working collapse', async ({ page }) => {
    await waitForJekyll(page, CATEGORIES_PAGE);
    const cats = page.locator('aside.bd-sidebar .sidebar-categories');
    await expect(cats).toHaveCount(1);
    const firstToggle = cats.locator('.sidebar-categories-toggle').first();
    await expect(firstToggle).toBeVisible();
    // Every term shows a numeric post-count badge.
    const badge = firstToggle.locator('.badge');
    await expect(badge).toHaveText(/^\d+$/);
    // Collapse wiring: toggling flips aria-expanded and reveals the post list.
    const targetId = await firstToggle.getAttribute('data-bs-target');
    const panel = page.locator(targetId);
    const wasExpanded = (await firstToggle.getAttribute('aria-expanded')) === 'true';
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-expanded', String(!wasExpanded));
    if (!wasExpanded) {
      await expect(panel).toBeVisible();
      await expect(panel.locator('.sidebar-categories-link').first()).toBeVisible();
    }
  });

  test('posts (sidebar: true, no nav) get a TOC but no left column or navbar toggle', async ({ page }) => {
    // Derive a real post URL from the Atom feed rather than hard-coding a date.
    const feed = await (await page.request.get('/feed.xml')).text();
    const entry = feed.match(/<entry>[\s\S]*?<link href="([^"]+)"/);
    expect(entry, 'feed.xml should contain at least one post entry').toBeTruthy();
    await waitForJekyll(page, new URL(entry[1]).pathname);
    await expect(page.locator('aside.bd-sidebar')).toHaveCount(0);
    await expect(page.locator('.bd-layout--no-sidebar')).toHaveCount(1);
    // Header must not render the mobile sidebar toggle when there is no nav.
    await expect(page.locator('header#navbar [aria-controls="bdSidebar"]')).toHaveCount(0);
    // The right TOC container still renders (sidebar enabled, nav-less).
    await expect(page.locator('#tocContents')).toHaveCount(1);
  });

  test('sidebar: false opts out of the sidebar entirely', async ({ page }) => {
    await waitForJekyll(page, OPT_OUT_PAGE);
    await expect(page.locator('#bdSidebar')).toHaveCount(0);
    await expect(page.locator('[aria-controls="bdSidebar"]')).toHaveCount(0);
  });

  test('desktop sidebar panel heading uses the configured title', async ({ page }) => {
    await waitForJekyll(page, DOCS_EXPLICIT_TREE);
    // site.sidebar.title default ("Browse docs") flows through sidebar-config.
    await expect(
      page.locator('.bd-sidebar-desktop-header').first()
    ).toContainText('Browse docs');
  });
});
