---
title: "UI/UX Component Spec"
description: "Single source of truth for every front-end UI/UX component in the zer0-mistakes theme — what it does, the files that implement it (SCSS / includes / layouts / JS / plugins), its API surface (classes, data-attributes, JS globals, events, CSS tokens), and its automated test coverage. Use it to define, test, and improve the UI."
date: 2026-01-25T03:38:33.000Z
lastmod: 2026-06-17T00:00:00.000Z
categories: [docs]
tags: [architecture, design, ui, testing, components]
author: bamr87
---

# UI/UX Component Spec

> **Single point of reference** for the theme's front-end. Every UI feature is catalogued with its purpose, source files, public API surface, and test coverage — so each component can be **defined**, **tested**, and **improved** from one place.

This document is generated from a full sweep of `_sass/**`, `_includes/**`, `_layouts/**`, `assets/js/**`, `_plugins/**`, and `test/**`. It covers **111 components** across 8 clusters, plus the test harness.

## How to use this doc

- **Quick scan:** the [Component Index](#component-index) lists every component with its primary source file, test, and coverage status.
- **Deep dive:** each cluster section gives per-component Purpose / Capabilities / Source / API surface / Tests / Gaps.
- **Test:** the [Testing Infrastructure](#testing-infrastructure--coverage) section explains how to run each tier and lists the biggest coverage gaps.
- **Improve:** the [Coverage Gaps & Roadmap](#coverage-gaps--improvement-roadmap) section aggregates every "improvement idea" into one backlog.

**Coverage legend:** 🟢 good (behavior + a11y asserted) · 🟡 partial (some assertions) · 🔴 none (no automated test).

## Architecture at a glance

The design framework is a layered SCSS + Liquid + ES-module system. `assets/css/main.scss` is the **single stylesheet assembly manifest**; `_sass/custom.scss` is a thin back-compat barrel.

```text
Design tokens      _sass/tokens/*          --zer0-* CSS custom properties (color, spacing,
                                           typography, shadow, motion, breakpoints, layers)
Theme layer        _sass/theme/*           color modes (light/dark/wizard), 9 skins (mixin),
                                           --bd-* docs-heritage colors, SVG backgrounds
Core scaffolding   _sass/core/*            navbar, nav-tree, sidebar, TOC, docs-layout,
                                           docs-code-examples, obsidian, syntax, code-copy
Components         _sass/components/*       cookie-banner, notes, callout, footer, search-modal,
                                           content-tables, theme-preview, ui-enhancements, …
Layouts            _sass/layouts/*          landing, section, navbar-extras, global-chrome
Markup             _includes/**, _layouts/** Liquid partials + page layouts (root → default → …)
Behavior           assets/js/**            ES modules under assets/js/modules/navigation|theme/,
                                           plus per-feature scripts (search, code-copy, obsidian, …)
Server             _plugins/**             obsidian links, search/sitemap, statistics, previews
```

Runtime theming flows: compiled `--zer0-*` defaults → `_includes/core/tokens-inline.html` (site `theme_color` + Appearance localStorage) → per-skin `[data-theme-skin]` overrides. Tests: a platform-independent Playwright **smoke** tier (runs on macOS) guards DOM/CSS/computed-token behavior; a Linux-baselined **snapshots** tier guards the 9 skins' pixels in CI.


---

## Component Index

Every catalogued component, its primary implementation file, primary test, and coverage. Jump to the cluster section for full detail.


### Global Chrome & Primary Navigation → [details](#global-chrome-primary-navigation)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Header / Site Shell | `_includes/core/header.html` | `styling.spec.js`, `ui-refresh.spec.js` | 🟡 partial |
| Branding (title/subtitle) | `_includes/core/branding.html` | `ui-refresh.spec.js`, `styling.spec.js` | 🟡 partial |
| Primary Navbar (menubar + dropdowns) | `_includes/navigation/navbar.html` | `ui-refresh.spec.js`, `styling.spec.js` | 🟡 partial |
| Navbar Mobile Quicklinks (tablet chips) | `_includes/navigation/navbar-mobile-quicklinks.html` | `ui-refresh.spec.js` | 🟡 partial |
| Head (document head / asset pipeline) | `_includes/core/head.html` | `styling.spec.js`, `test/test_quality.sh` | 🟡 partial |
| Footer | `_includes/core/footer.html` | `ui-refresh.spec.js` | 🟡 partial |
| Breadcrumbs | `_includes/navigation/breadcrumbs.html` | `layouts.spec.js` | 🟡 partial |
| Back-to-Top FAB | `_includes/core/footer.html` | — | 🔴 none |
| Auto-Hide Navbar | `assets/js/auto-hide-nav.js` | — | 🔴 none |
| Nanobar (scroll/load progress bar) | `_includes/components/nanobar.html` | — | 🔴 none |
| Offcanvas Sidebars & Unified Drawer | `_includes/navigation/sidebar-left.html` | `ui-refresh.spec.js` | 🟡 partial |
| Navbar Extras / FAB Stacking | `_sass/layouts/_navbar-extras.scss` | `ui-refresh.spec.js` | 🟡 partial |
| Navigation Orchestrator (index.js + config.js) | `assets/js/modules/navigation/index.js` | `styling.spec.js`, `layouts.spec.js` | 🟡 partial |
| Navbar Module (dropdowns/keyboard/tooltips) | `assets/js/modules/navigation/navbar.js` | — | 🔴 none |
| Scroll-Spy Module | `assets/js/modules/navigation/scroll-spy.js` | — | 🔴 none |
| Smooth-Scroll Module | `assets/js/modules/navigation/smooth-scroll.js` | — | 🔴 none |
| Keyboard Shortcuts Module | `assets/js/modules/navigation/keyboard.js` | `layouts.spec.js` | 🟡 partial |
| Swipe Gestures Module | `assets/js/modules/navigation/gestures.js` | — | 🔴 none |
| Focus Manager Module | `assets/js/modules/navigation/focus.js` | — | 🔴 none |
| Sidebar State Module | `assets/js/modules/navigation/sidebar-state.js` | — | 🔴 none |
| Sidebar Visibility Module | `assets/js/modules/navigation/sidebar-visibility.js` | `ui-refresh.spec.js` | 🟡 partial |
| TOC Visibility Module | `assets/js/modules/navigation/toc-visibility.js` | `ui-refresh.spec.js` | 🟡 partial |

### Sidebar, Table of Contents & Docs Layout → [details](#sidebar-table-of-contents-docs-layout)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Docs layout shell (.bd-layout/.bd-sidebar/.bd-main/.bd-toc) | `_sass/core/_docs-layout.scss` | `styling.spec.js`, `ui-refresh.spec.js` | 🟡 partial |
| Nav-tree sidebar (YAML tree mode) | `_includes/navigation/nav-tree.html` | — | 🔴 none |
| Sidebar categories (categories mode) | `_includes/navigation/sidebar-categories.html` | — | 🔴 none |
| Sidebar folders (auto mode) | `_includes/navigation/sidebar-folders.html` | — | 🔴 none |
| Section sidebar (topic navigation) | `_includes/navigation/section-sidebar.html` | `ui-refresh.spec.js` | 🟡 partial |
| Table of Contents (Liquid parser + sidebar-right) | `_includes/content/toc.html` | `ui-refresh.spec.js` | 🟡 partial |
| TOC FAB (mobile trigger) | `_includes/navigation/toc-fab.html` | `ui-refresh.spec.js` | 🟡 partial |
| TOC visibility toggle + persistence | `assets/js/modules/navigation/toc-visibility.js` | `ui-refresh.spec.js` | 🟡 partial |
| Scroll-spy (active heading highlight) | `assets/js/modules/navigation/scroll-spy.js` | — | 🔴 none |
| Page intro header (.bd-intro family) | `_includes/content/intro.html` | `ui-refresh.spec.js`, `layouts.spec.js` | 🟡 partial |
| Docs code-example chrome (.bd-example/.bd-clipboard) | `_sass/core/_docs-code-examples.scss` | — | 🔴 none |
| Content tables (styling + CSV copy) | `_sass/components/_content-tables.scss` | `ui-refresh.spec.js` | 🟡 partial |

### Landing, Home & Component Polish → [details](#landing-home-component-polish)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Landing layout | `_layouts/landing.html` | `layouts.spec.js` | 🟡 partial |
| Landing quick-links bar | `_includes/landing/landing-quick-links.html` | — | 🔴 none |
| Landing install cards | `_includes/landing/landing-install-cards.html` | — | 🔴 none |
| Home layout | `_layouts/home.html` | `layouts.spec.js` | 🟡 partial |
| Index layout | `_layouts/index.html` | — | 🔴 none |
| Welcome layout | `_layouts/welcome.html` | `layouts.spec.js` | 🟡 partial |
| Section include (components/section.html) | `_includes/components/section.html` | — | 🔴 none |
| Feature card include (components/feature-card.html) | `_includes/components/feature-card.html` | `ui-refresh.spec.js` | 🟡 partial |
| CTA button include (components/cta-button.html) | `_includes/components/cta-button.html` | `layouts.spec.js` | 🟡 partial |
| Info section / settings offcanvas (components/info-section.html) | `_includes/components/info-section.html` | — | 🔴 none |
| Bootstrap component polish (UI enhancements) | `_sass/components/_ui-enhancements.scss` | `ui-refresh.spec.js` | 🟡 partial |
| Share actions (LinkedIn/copy) | `assets/js/share-actions.js` | — | 🔴 none |
| Skeleton loader | `_sass/components/_skeleton.scss` | — | 🔴 none |
| Particles hero background | `assets/js/particles.js` | — | 🔴 none |

### Theming: Tokens, Color Modes, Skins & Customizers → [details](#theming-tokens-color-modes-skins-customizers)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Design Tokens (--zer0-* layer) | `_sass/tokens/_index.scss` | `styling.spec.js` | 🟡 partial |
| Runtime Token Injection (tokens-inline.html) | `_includes/core/tokens-inline.html` | — | 🔴 none |
| Color Modes (light/dark/wizard) | `_sass/theme/_color-modes.scss` | — | 🔴 none |
| Named Skins (9 data-theme-skin palettes) | `_sass/theme/_skins.scss` | `skins.spec.js` | 🟢 good |
| Appearance Panel (appearance.js) | `assets/js/modules/theme/appearance.js` | — | 🔴 none |
| Background Customizer (zer0Bg API + panels) | `assets/js/background-customizer.js` | `backgrounds.spec.js`, `skins.spec.js` | 🟢 good |
| Palette Generator (palette-generator.js) | `assets/js/palette-generator.js` | `theme-colors.spec.js` | 🟡 partial |
| Skin Editor (skin-editor.js) | `assets/js/skin-editor.js` | — | 🔴 none |
| Theme Customizer & Preview Gallery (admin UI) | `_includes/components/theme-customizer.html` | `theme-colors.spec.js` | 🟡 partial |

### Content & Collections → [details](#content-collections)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Note layout | `_layouts/note.html` | — | 🔴 none |
| Notebook layout | `_layouts/notebook.html` | — | 🔴 none |
| Notes & Notebooks index grids + difficulty badges | `pages/notes.md` | — | 🔴 none |
| Callout | `_includes/components/callout.html` | — | 🔴 none |
| Post navigation (prev/next cards) | `_sass/components/_post-navigation.scss` | — | 🔴 none |
| Code copy button | `assets/js/code-copy.js` | `ui-refresh.spec.js`, `accessibility.spec.js` | 🟡 partial |
| Syntax highlighting | `_sass/core/_syntax.scss` | — | 🔴 none |
| Author card | `_includes/components/author-card.html` | — | 🔴 none |
| Author E-E-A-T block | `_includes/components/author-eeat.html` | — | 🔴 none |
| Post card | `_includes/components/post-card.html` | — | 🔴 none |
| Post-type badge | `_includes/components/post-type-badge.html` | — | 🔴 none |
| Feature card | `_includes/components/feature-card.html` | — | 🔴 none |
| Preview image | `_includes/components/preview-image.html` | — | 🔴 none |
| Preview-image generator plugin | `_plugins/preview_image_generator.rb` | — | 🔴 none |
| Comments (Giscus) | `_includes/content/giscus.html` | — | 🔴 none |
| Share actions (LinkedIn enhancement) | `assets/js/share-actions.js` | — | 🔴 none |
| Posts pagination | `assets/js/posts-pagination.js` | `layouts.spec.js` | 🟡 partial |
| Article layout | `_layouts/article.html` | `layouts.spec.js` | 🟡 partial |
| Collection layout | `_layouts/collection.html` | — | 🔴 none |
| News layout | `_layouts/news.html` | — | 🔴 none |
| Tag layout | `_layouts/tag.html` | — | 🔴 none |

### Obsidian & Knowledge-Graph Features → [details](#obsidian-knowledge-graph-features)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Wiki-Links ([[Page]]) | `_plugins/obsidian_links.rb` | `test/test_obsidian.sh`, `test/test_ruby_converter.rb`, `test/test_resolver.js` | 🟡 partial |
| Embeds & Transclusion (![[…]]) | `_plugins/obsidian_links.rb` | `test/test_obsidian.sh`, `test/test_ruby_converter.rb`, `test/test_resolver.js` | 🟡 partial |
| Callouts (> [!type]) | `_plugins/obsidian_links.rb` | `test/test_obsidian.sh`, `test/test_ruby_converter.rb`, `test/test_resolver.js` | 🟡 partial |
| Inline Tags (#tag) | `_plugins/obsidian_links.rb` | `test/test_obsidian.sh`, `test/test_ruby_converter.rb`, `test/test_resolver.js` | 🟡 partial |
| Wiki Index (wiki-index.json) | `assets/data/wiki-index.json` | `test/test_obsidian.sh` | 🟡 partial |
| Full Knowledge Graph (graph page) | `assets/js/obsidian-graph.js` | — | 🔴 none |
| Local Graph (sidebar panel + FAB) | `assets/js/obsidian-local-graph.js` | — | 🔴 none |
| Backlinks Panel (Linked mentions) | `_includes/content/backlinks.html` | — | 🔴 none |

### Admin Tools & Dashboards → [details](#admin-tools-dashboards)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| Admin Shell (layout + sidebar nav + tabs) | `_layouts/admin.html` | `admin-layout.spec.js`, `admin-nav.spec.js`, `accessibility.spec.js`, `test/test_plugins.rb` | 🟢 good |
| Config Viewer | `_includes/components/config-viewer.html` | `config-viewer.spec.js`, `security.spec.js` | 🟡 partial |
| Config Editor | `_includes/components/config-editor.html` | `config-editor.spec.js` | 🟡 partial |
| Raw YAML / Config Sanitization | `pages/_about/settings/config.md` | `security.spec.js` | 🟡 partial |
| Environment Dashboard | `_includes/components/env-dashboard.html` | `env-dashboard.spec.js`, `admin-layout.spec.js`, `accessibility.spec.js` | 🟢 good |
| Environment Switcher | `_includes/components/env-switcher.html` | — | 🔴 none |
| Env-Var Helper (zer0-env-var) | `_includes/components/zer0-env-var.html` | — | 🔴 none |
| Navigation Editor | `_includes/components/nav-editor.html` | `admin-layout.spec.js`, `accessibility.spec.js` | 🟡 partial |
| Collection Manager | `_includes/components/collection-manager.html` | `admin-layout.spec.js`, `admin-nav.spec.js`, `accessibility.spec.js` | 🟡 partial |
| Analytics Dashboard | `_includes/components/analytics-dashboard.html` | `admin-layout.spec.js`, `admin-nav.spec.js`, `accessibility.spec.js` | 🟡 partial |
| Statistics Dashboard | `_layouts/stats.html` | `admin-layout.spec.js`, `accessibility.spec.js`, `test/test_plugins.rb` | 🟡 partial |
| Setup Wizard | `_layouts/setup.html` | — | 🔴 none |
| Setup Banner & Setup Check | `_includes/components/setup-banner.html` | — | 🔴 none |
| Dev Shortcuts | `_includes/components/dev-shortcuts.html` | — | 🔴 none |

### Widgets, Search & Integrations → [details](#widgets-search-integrations)

| Component | Primary source | Test | Coverage |
|---|---|---|---|
| AI Chat Assistant | `_includes/components/ai-chat.html` | `security.spec.js` | 🔴 none |
| Site Search (modal + index) | `_includes/components/search-modal.html` | — | 🔴 none |
| Cookie Consent | `_includes/components/cookie-consent.html` | — | 🔴 none |
| PostHog Analytics | `_includes/analytics/posthog.html` | `security.spec.js`, `test/test_quality.sh` | 🟡 partial |
| Google Analytics & Tag Manager | `_includes/analytics/google-analytics.html` | `security.spec.js` | 🔴 none |
| Mermaid Diagrams | `_includes/components/mermaid.html` | — | 🔴 none |
| Keyboard Shortcuts | `assets/js/modules/navigation/keyboard.js` | — | 🔴 none |
| Shortcuts Cheatsheet Modal | `_includes/components/shortcuts-modal.html` | — | 🔴 none |
| cheetsheet.js (Bootstrap demos) | `assets/js/cheetsheet.js` | — | 🔴 none |
| Halfmoon Theme Switcher | `_includes/components/halfmoon.html` | `styling.spec.js` | 🟡 partial |
| Misc Widgets (powered-by, showcase, js-cdn, svg) | `_includes/components/powered-by.html` | `styling.spec.js` | 🟡 partial |


---

## Global Chrome & Primary Navigation

The fixed top header (brand, primary menubar, utility controls, mobile/tablet shortcuts), the document `<head>`, the rich footer with FAB stack, breadcrumbs, scroll-progress nanobar, back-to-top, the offcanvas sidebars/drawers, and the ES-module navigation orchestrator that wires hover dropdowns, scroll-spy, keyboard shortcuts, gestures, focus management, and persisted sidebar/TOC visibility together form the persistent UI shell that appears on (nearly) every page.

### Header / Site Shell
- **Purpose:** The fixed-top `<header id="navbar">` banner that hosts the sidebar toggle, brand cluster, branding, tablet quicklinks, primary menubar, utility controls (Search/Settings), mobile menu toggle, and the optional in-navbar nanobar mount. It is the structural skeleton every other chrome component plugs into.
- **Capabilities:** `fixed-top` Bootstrap navbar; skip-to-content link (`#main-content`); responsive lg+ 3-column CSS grid `[brand | nav | utilities]` vs. `<lg` flex; conditional left-sidebar toggle (omitted when `page.sidebar: false` or no sidebar content); unified-drawer vs. legacy-offcanvas target switching via `site.navigation.unified_mobile_drawer`; conditional `#top-progress-target` nanobar mount when `site.nanobar.position == "navbar"`; container-query name `navbar-main` for progressive degradation.
- **Source:**
  - SCSS: `_sass/core/_navbar.scss` (the `#navbar` grid, fixed/auto-hide, brand degradation, mobile layout blocks at ln 865+); `_sass/layouts/_global-chrome.scss` (`.bottom-shadow`, sticky helpers, resets)
  - Markup: `_includes/core/header.html`, `_layouts/default.html` (consumer)
  - JS: `assets/js/auto-hide-nav.js` (sets body padding to `#navbar` height)
- **API surface:** ids `#navbar`, `#main-content`, `#top-progress-target`; classes `.navbar-main`, `.navbar-main-start`, `.navbar-brand-group`, `.navbar-home-links`, `.navbar-utility-controls`, `.bottom-shadow`, `.bd-navbar-toggle`, `.navbar-hidden`; container `container-name: navbar-main`; data-attr `data-bs-target` (toggles offcanvas/drawer); CSS vars `--bs-body-bg`, `--zer0-bp-*`
- **Tests:** `test/visual/styling.spec.js` — "desktop header and navbar render" (asserts `header#navbar`, `.navbar.navbar-expand-lg`, `nav.navbar-main` visible; brand link + img present); "mobile main navigation toggle is visible". `test/visual/ui-refresh.spec.js` — "main landmarks visible at {viewport}" asserts `header#navbar` visible across all 5 viewports; "skip link is focusable" asserts `a[href="#main-content"].visually-hidden-focusable` is attached + focusable.
- **Gaps / improvement ideas:** No test asserts the lg+ 3-column grid actually keeps the menubar from painting over Search/Settings (the stated reason for the grid). The nanobar `#top-progress-target` mount path is untested. Body padding from `auto-hide-nav.js` is computed in JS and never asserted, so a regression that drops it (content hidden under the fixed header) would pass CI.

### Branding (site title / subtitle)
- **Purpose:** Renders the clickable site title (and optional subtitle) inside the brand cluster, with responsive icon and ellipsis behavior.
- **Capabilities:** Title links to `/`; optional title icon shown only at sm–lg (`d-none d-sm-inline d-lg-none`); subtitle shown only at lg+ and only when `site.subtitle` is non-empty; `site-title-text` ellipsis at viewport breakpoints (60vw → 50vw → 40vw).
- **Source:**
  - SCSS: `_sass/core/_navbar.scss` (`.site-title-text` responsive `max-width`, `#navbar .site-title/.site-subtitle` ellipsis in the lg grid)
  - Markup: `_includes/core/branding.html`
- **API surface:** classes `.site-title`, `.site-subtitle`, `.site-title-text`, `.site-subtitle-text`, `.navbar-brand`; config `site.title`, `site.subtitle`, `site.title_icon`, `site.default_icon`
- **Tests:** `test/visual/ui-refresh.spec.js` — "mid desktop brand logo and title do not overlap" (asserts `.site-title-text` sits right of the logo, no overlap); "mobile shows site title and offcanvas toggler" (asserts `.site-title-text` visible). `test/visual/styling.spec.js` checks the `a.navbar-brand` logo image exists.
- **Gaps / improvement ideas:** Subtitle rendering/visibility (lg+ only, suppressed when empty) is untested. The title-icon breakpoint window (sm–lg only) is untested. There is a stale `d-lg-none` icon class string that duplicates `site.default_icon` (`{{ site.default_icon }} {{ site.default_icon }}-...`) — likely a typo that should be `{{ site.default_icon }} bi-{{ site.title_icon }}`; worth verifying the icon actually renders.

### Primary Navbar (menubar + dropdowns)
- **Purpose:** The primary menubar: inline at lg+, collapsing into the `#bdNavbar` offcanvas below lg, with split-button dropdowns, data-driven or auto-generated nav items, and mobile-only Home/Search/Settings rows.
- **Capabilities:** Data-driven from `_data/navigation/main.yml`, else auto-generated from `site.collections` (skips `pages`, honors `nav_exclude`); split dropdown (parent link navigates, chevron button toggles submenu); `dropdown-menu-end` alignment for last-two items; icon+label with container-query density tiers (full labels ≥38rem → icon-only <38rem); active state via `aria-current="page"` with an underline pseudo-element; mobile offcanvas adds Home/Search/Settings entries; tooltips on compact desktop (992–1199px).
- **Source:**
  - SCSS: `_sass/core/_navbar.scss` (split toggle, `@container bd-nav` density tiers, desktop dropdown animation, mobile accordion dropdowns, active states, `.nav-tooltip`)
  - Markup: `_includes/navigation/navbar.html`
  - JS: `assets/js/modules/navigation/navbar.js`
  - Plugin/data: `_data/navigation/main.yml`
- **API surface:** id `#bdNavbar`; classes `.nav-hover-dropdown`, `.dropdown-toggle-split`, `.nav-link-text`, `.bd-navbar-nav-viewport`, `.nav-tooltip`, `.navbar-nav`; data-attr `data-search-toggle`, `data-bs-toggle="offcanvas"`, `data-bs-target="#info-section"`; container `bd-nav` (`container-type: inline-size`); ARIA `aria-current`, `aria-expanded`, `aria-haspopup`; CSS vars `--bs-tertiary-bg`, `--bs-primary`, `--zer0-space-*`
- **Tests:** `test/visual/ui-refresh.spec.js` — "wide desktop shows full nav labels without ellipsis" (no `...` suffix; "Quick Start" visible); "mobile shows site title and offcanvas toggler". `test/visual/styling.spec.js` — "mobile main navigation toggle is visible" asserts `.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]`.
- **Gaps / improvement ideas:** Dropdown open/close (chevron click toggling `.show`), keyboard arrow/Home/End/Escape navigation, outside-click-close, and the icon-only `<38rem` tier are all untested behaviorally. Tooltip show/hide on compact desktop is untested. No test exercises the auto-generated (no `main.yml`) nav fallback path.

### Navbar Mobile Quicklinks (tablet chips)
- **Purpose:** Horizontal icon+label chip shortcuts shown only between md and lg (768–991px), filling the center band while the full menubar stays in the offcanvas.
- **Capabilities:** Renders only when `site.data.navigation.main` exists; shows first 5 top-level links; horizontal scroll with hidden scrollbars; `aria-current="page"` styling; label ellipsis at 5.5rem.
- **Source:**
  - SCSS: `_sass/layouts/_navbar-extras.scss` (`.navbar-mobile-quicklinks` and `__list/__chip/__label`)
  - Markup: `_includes/navigation/navbar-mobile-quicklinks.html`
  - Plugin/data: `_data/navigation/main.yml`
- **API surface:** classes `.navbar-mobile-quicklinks`, `.navbar-mobile-quicklinks__list`, `.navbar-mobile-quicklinks__chip`, `.navbar-mobile-quicklinks__label`; responsive `d-none d-md-flex d-lg-none`; CSS vars `--bs-primary`, `--bs-primary-bg-subtle`, `--bs-border-color-translucent`
- **Tests:** `test/visual/ui-refresh.spec.js` — "tablet shows mobile quicklink chips between md and lg" asserts `.navbar-mobile-quicklinks` visible and first `a.navbar-mobile-quicklinks__chip` visible at the tablet viewport.
- **Gaps / improvement ideas:** The `limit: 5` truncation and the horizontal-scroll overflow behavior with many links are untested. No assertion that the chips are hidden at md− or lg+ (only the in-window case is checked).

### Head (document head / asset pipeline)
- **Purpose:** Assembles the entire `<head>`: deferred theme scripts, conditional Mermaid/MathJax, nanobar include, SEO/structured-data, analytics (production-only), Bootstrap + Bootstrap Icons + `main.css`, and inline design-token overrides.
- **Capabilities:** Loads `auto-hide-nav.js`, `back-to-top.js`, `halfmoon.js`, `side-bar-folders.js`, `code-copy.js`, `table-copy.js`, `ui-enhancements.js` (all `defer`); GTM/GA gated on `jekyll.environment == "production"`; conditional Mermaid (`page.mermaid`), MathJax (`page.mathjax`), stats CSS; vendored (no-CDN) Bootstrap 5.3.3 + icons; `tokens-inline.html` emitted after `main.css` so config `theme_color` wins; optional `user-overrides.css` via `site.user_overrides`.
- **Source:**
  - SCSS: — (links the compiled `assets/css/main.css`)
  - Markup: `_includes/core/head.html`, `_includes/core/tokens-inline.html`, `_layouts/root.html` (host)
  - JS: deferred theme scripts (above); `_includes/components/nanobar.html`, `_includes/components/mermaid.html`
- **API surface:** `<link rel="stylesheet">` to `assets/vendor/bootstrap/...`, `assets/vendor/bootstrap-icons/...`, `assets/css/main.css`; config `site.user_overrides`, `site.google_analytics`, `page.mermaid`, `page.mathjax`; `window.MathJax` config object
- **Tests:** `test/visual/styling.spec.js` — "same-origin CSS assets return 200"; "HTML references compiled main stylesheet" (a `main*.css` link); "Bootstrap exposes CSS variables on :root"; "homepage does not reference common third-party CDNs for core assets" (bans jsDelivr/jQuery/Font Awesome/etc.). `test/test_quality.sh` checks semantic-HTML presence broadly.
- **Gaps / improvement ideas:** No test verifies the token-override cascade order (`tokens-inline` after `main.css`, `user-overrides.css` last). Production-only gating of GTM/GA is not asserted in any spec. The MathJax/Mermaid conditional loads are untested.

### Footer
- **Purpose:** The rich site footer: powered-by credits row with Info offcanvas trigger, a dark four-column block (site info / quick links / latest posts / social+RSS), a placeholder subscribe form, policy links, copyright, and the host for the FAB stack + back-to-top + local-graph panel.
- **Capabilities:** Powered-by links from `site.powered_by` (with trailing Info trigger to `#info-section`); quick links resolved from `site.footer_quick_links` or auto-detected against existing pages (avoids 404s); latest 3 posts (hidden when none); social links from `site.links` + RSS feed; disabled placeholder subscribe form; conditional Privacy/Terms links (only when pages exist) + Cookie Preferences modal trigger; FAB/back-to-top/local-graph excluded on a list of root-only layouts.
- **Source:**
  - SCSS: `_sass/components/_footer.scss`
  - Markup: `_includes/core/footer.html`
  - Plugin/data: `site.powered_by`, `site.links`, `site.data.ui-text`
- **API surface:** classes `.bd-footer`, `.footer-powered-by`, `.footer-powered-by-links`, `.powered-by-link`, `.footer-dark-block`, `.footer-nav-columns`, `.footer-latest-posts`, `.footer-subscribe-form`, `.footer-policy-links`; data-attr `data-bs-toggle="offcanvas"`/`"modal"` (`#info-section`, `#cookieSettingsModal`); CSS vars `--zer0-space-*`, `--bs-secondary-color`
- **Tests:** `test/visual/ui-refresh.spec.js` — "powered-by credits are real links" (hrefs truthy, not `#`); "footer nav columns use equal width at tablet". `test/visual/ui-refresh.spec.js` "main landmarks visible at {viewport}" asserts `footer.bd-footer` visible across viewports.
- **Gaps / improvement ideas:** The quick-links auto-detection (skip-when-page-missing) and conditional policy-link rendering are untested — a regression that surfaces 404 links would pass. The disabled subscribe form's accessibility (the `disabled` button + hint association) is unverified. Latest-posts hide-when-empty is untested.

### Breadcrumbs
- **Purpose:** Accessible breadcrumb trail with Schema.org `BreadcrumbList` microdata for rich results, rendered on non-home pages when `site.breadcrumbs` is enabled.
- **Capabilities:** Rendered only when `page.url != "/"` and `site.breadcrumbs`; i18n root label from `site.data.ui-text`; special handling for known sections (`posts,notebooks,notes,docs`) to avoid linking intermediate dirs lacking index pages; folder icon kept outside the `<ol>` for HTML validity; `aria-current="page"` on the leaf; `itemprop`/`itemscope` microdata throughout.
- **Source:**
  - SCSS: — (uses Bootstrap `.breadcrumb`)
  - Markup: `_includes/navigation/breadcrumbs.html`
  - Plugin/data: `site.data.ui-text` (`breadcrumbs_root`, `breadcrumbs_aria`)
- **API surface:** classes `.breadcrumbs`, `.breadcrumb`, `.breadcrumb-item`; ARIA `aria-label`, `aria-current="page"`; microdata `https://schema.org/BreadcrumbList` / `ListItem`, `itemprop="position|name|item"`
- **Tests:** `test/visual/layouts.spec.js` — "breadcrumbs `<nav>` exposes aria-label" (on `/about/`); "breadcrumbs are `<ol>` with `<li>` children (no orphan `<i>`)" (asserts the folder icon is not a direct `<ol>` child).
- **Gaps / improvement ideas:** The Schema.org microdata (`itemprop`/`position` sequencing) is not validated. The known-section special path (`/posts/YYYY/...` collapsing to Home › Posts › leaf) is untested. No test confirms breadcrumbs are suppressed on `/` or when `site.breadcrumbs` is off.

### Back-to-Top FAB
- **Purpose:** A floating button that appears after scrolling 200px and smooth-scrolls to the top of the page.
- **Capabilities:** Hidden by default (`display:none`); shown when `scrollY > 200`; smooth `scrollTo({top:0})`; sits at the bottom of the FAB stack (lowest z-index of the three FABs); hover lifts and brightens; uses unified `--zer0-layer-*`/`--zer0-space-fab-*` tokens.
- **Source:**
  - SCSS: `_sass/components/_back-to-top.scss`; FAB tokens in `_sass/tokens/_layers.scss`, `_spacing.scss`, `_shadow.scss`
  - Markup: `_includes/core/footer.html` (`#backToTopBtn`)
  - JS: `assets/js/back-to-top.js`
- **API surface:** id `#backToTopBtn`; CSS vars `--zer0-layer-fab-back-to-top` (1050), `--zer0-space-fab-offset`, `--zer0-shadow-fab`, `--zer0-color-primary`, `--zer0-motion-duration-fast`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** The 200px show/hide threshold, the smooth-scroll action, and the FAB stacking order (back-to-top below TOC/chat FABs) are entirely untested. The button uses inline `style="display:none"` toggled to `block` in JS — a no-JS or JS-error state leaves it permanently hidden with no fallback assertion.

### Auto-Hide Navbar
- **Purpose:** Hides the fixed header on scroll-down and reveals it on scroll-up to maximize reading space, while reserving body padding equal to the header height.
- **Capabilities:** Threshold 80px to hide, 3px delta to trigger, always-shown within 50px of top; `requestAnimationFrame`-throttled scroll; respects `prefers-reduced-motion` (disables transform transition); sets `body { padding-top }` to header height (debounced on resize); pauses (re-shows + unbinds scroll) while the `#bdNavbar` offcanvas is open; injects its own `#navbar.navbar-hidden { translateY(-100%) }` style if absent.
- **Source:**
  - SCSS: `_sass/core/_navbar.scss` (`#navbar.navbar-hidden`, `@media (prefers-reduced-motion)` block)
  - Markup: — (operates on `#navbar` from `header.html`)
  - JS: `assets/js/auto-hide-nav.js`
- **API surface:** id `#navbar`; class `.navbar-hidden`; injected style id `#navbar-autohide-styles`; events listened: `show.bs.offcanvas` / `hidden.bs.offcanvas` on `#bdNavbar`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** Hide-on-down / show-on-up, the body-padding compensation, reduced-motion handling, and the offcanvas-open pause are all untested — a meaningful surface for regressions (content jump, header overlapping content). There is duplicate transition/`navbar-hidden` logic split between this JS and `_navbar.scss`; consolidating would reduce drift risk.

### Nanobar (scroll/load progress bar)
- **Purpose:** A thin config-driven page-load progress bar that animates through configured percentage steps, mountable at top, bottom, or inline under the navbar.
- **Capabilities:** Fully config-driven via `site.nanobar.*` (color, background, height, position, z-index, steps, step delay, classname, id, target); three placement modes (`top`/`bottom`/`navbar`); injects CSS custom properties; bridges config to JS via `window.zer0Nanobar`; vendored library (`nanobar.min.js`) + `nanobar-init.js`; navbar mode mounts into `#top-progress-target`.
- **Source:**
  - SCSS: inline `<style id="nanobar-theme">` in the include (`.nanobar`, `.nanobar--bottom`, `.nanobar-mount`, `.nanobar--navbar`)
  - Markup: `_includes/components/nanobar.html`; mount point in `_includes/core/header.html`
  - JS: `assets/js/nanobar-init.js`, `assets/js/nanobar.min.js`
- **API surface:** `window.zer0Nanobar` (`classname`, `id`, `position`, `target`, `steps`, `stepDelay`); ids `#top-progress-bar`, `#top-progress-target`; classes `.nanobar`, `.nanobar--bottom`, `.nanobar--navbar`, `.nanobar-mount`; CSS vars `--nanobar-color`, `--nanobar-bg`, `--nanobar-height`, `--nanobar-z`; config `site.nanobar.*`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** No spec confirms the bar renders, animates steps, or honors the three position modes / the `#top-progress-target` mount. Bridging-config-to-JS (`window.zer0Nanobar`) and the `Nanobar` library presence guard are untested — silent failure (no progress bar) would not be caught.

### Offcanvas Sidebars & Unified Drawer
- **Purpose:** The mobile/offcanvas panels: left docs sidebar (`#bdSidebar`), right TOC (`#tocContents`), and the optional consolidated tabbed drawer (`#zer0UnifiedDrawer`) that merges Browse/Menu/Settings into one offcanvas.
- **Capabilities:** Left sidebar has 3 content modes (`auto` folder scan, `categories`, YAML `tree`); per-panel FOUC guard scripts apply hidden-preference classes pre-paint (`bd-sidebar-pref-hidden` / `bd-toc-pref-hidden`); desktop visibility toggles in panel headers; TOC parser invoked only when the page has h2–h4; unified drawer (opt-in via `navigation.unified_mobile_drawer`) uses Bootstrap nav-pills tabs and reuses the same nav data; shared offcanvas header chrome (48px close target, focus-visible outline) across sidebar/TOC/local-graph panels.
- **Source:**
  - SCSS: `_sass/core/_offcanvas-panels.scss` (shared header/title/close chrome); `_sass/core/_navbar.scss` (`#bdNavbar` offcanvas→inline at lg+)
  - Markup: `_includes/navigation/sidebar-left.html`, `sidebar-right.html`, `unified-drawer.html`, `nav-tree.html`, `sidebar-folders.html`, `sidebar-categories.html`
  - JS: `assets/js/modules/navigation/sidebar-visibility.js`, `toc-visibility.js`, `sidebar-state.js`
- **API surface:** ids `#bdSidebar`, `#tocContents`, `#zer0UnifiedDrawer`, `#TableOfContents`, `#info-section`; classes `.offcanvas-lg`, `.bd-sidebar-visibility-toggle`, `.bd-toc-visibility-toggle`, `.nav-tree`, `.zer0-unified-drawer`; html classes `bd-sidebar-pref-hidden`/`bd-toc-pref-hidden`; data-attr `data-bs-toggle="offcanvas"`/`"tab"`, `data-nav-tree`; config `page.sidebar.nav`, `site.navigation.unified_mobile_drawer`
- **Tests:** `test/visual/ui-refresh.spec.js` — "docs article exposes ToC on desktop" (asserts `.bd-toc, #tocContents` attached; `.bd-sidebar-visibility-toggle` / `.bd-toc-visibility-toggle` attached). The Bootstrap offcanvas open/close itself is exercised indirectly via the toggler tests in styling.spec.js.
- **Gaps / improvement ideas:** The unified-drawer tab switching, the three sidebar nav modes (auto/categories/tree), and the FOUC-guard hidden-preference path are untested. No spec asserts the desktop visibility toggle actually collapses the column (that lives in JS modules below). The TOC "only parse when headings exist" branch is untested.

### Navbar Extras / FAB Stacking
- **Purpose:** Centralizes the floating action button stack (TOC FAB, left-sidebar FAB) positioning and z-index so the FABs and back-to-top never overlap on small viewports.
- **Capabilities:** TOC FAB and sidebar FAB mirror each other on opposite edges; mobile stacking math lifts them above back-to-top (`offset + size + gap`); restore-mode FABs (`--restore` / `html.bd-*-pref-hidden`) shown only on mobile (desktop uses the in-header rail toggle); 3.5rem touch targets with hover lift; also styles the tablet quicklink chips.
- **Source:**
  - SCSS: `_sass/layouts/_navbar-extras.scss`; tokens in `_sass/tokens/_layers.scss` (`--zer0-layer-fab-*`), `_spacing.scss` (`--zer0-space-fab-*`)
  - Markup: `_includes/navigation/toc-fab.html`, `local-graph-fab.html` (rendered from `footer.html`)
  - JS: visibility driven by `toc-visibility.js` / `sidebar-visibility.js` (toggle `--restore` classes)
- **API surface:** classes `.bd-toc-fab`, `.bd-sidebar-fab`, `.bd-toc-toggle`, `.bd-sidebar-toggle`, `.bd-toc-fab--restore`, `.bd-sidebar-fab--restore`; ids `#tocFab`, `#sidebarFab`; CSS vars `--zer0-layer-fab-toc` (1055), `--zer0-layer-fab-back-to-top` (1050), `--zer0-layer-fab-local-graph` (1060), `--zer0-space-fab-offset/size/gap`
- **Tests:** `test/visual/ui-refresh.spec.js` — "mobile exposes sidebar FAB and ToC FAB" (asserts `#sidebarFab, .bd-sidebar-fab` visible and `#tocFab` attached at the mobile viewport).
- **Gaps / improvement ideas:** The actual stacking (FABs not overlapping back-to-top) is computed via CSS `calc()` but never asserted with bounding-box overlap checks — `fixtures.js` already provides `boxesOverlap`/`assertStackedVertically` helpers that could verify it. The restore-mode visibility transitions and the local-graph FAB are untested.

### Navigation Orchestrator (modules/navigation/index.js + config.js)
- **Purpose:** The ES-module entry point that constructs `window.zer0Navigation`, syncs breakpoints from CSS tokens, conditionally instantiates each sub-module, and exposes a public API (`scrollTo`, `expandTo`, `expandAll/collapseAll`, `getShortcuts`, `getModule`, `destroy`).
- **Capabilities:** Auto-inits on DOM-ready (waits for Bootstrap `load` if absent); `syncBreakpointsFromCss()` reads `--zer0-bp-*` so SCSS token overrides propagate to JS; instantiates TOC modules only if a `#TableOfContents` exists, sidebar-visibility only if a left sidebar + docs layout exist; dispatches `navigation:ready`/`navigation:destroyed`; loaded via `_includes/components/js-cdn.html` as `type="module"`.
- **Capabilities (config):** centralizes selectors, scroll-spy margins, smooth-scroll offset, keyboard key map, gesture thresholds, localStorage prefix `zer0-nav-`, and breakpoints; exports `isBelowBreakpoint`/`isAtOrAboveBreakpoint`.
- **Source:**
  - SCSS: — (consumes `--zer0-bp-*` from `_sass/tokens/_breakpoints.scss`)
  - Markup: `_includes/components/js-cdn.html` (module `<script>` loader)
  - JS: `assets/js/modules/navigation/index.js`, `assets/js/modules/navigation/config.js`
- **API surface:** `window.zer0Navigation` (`.init()`, `.getModule(name)`, `.getConfig()`, `.scrollTo()`, `.expandTo()`, `.expandAll()`, `.collapseAll()`, `.getShortcuts()`, `.destroy()`); events `navigation:ready`, `navigation:destroyed`; exported `config`, `syncBreakpointsFromCss`, `isBelowBreakpoint`, `isAtOrAboveBreakpoint`; CSS vars `--zer0-bp-sm/md/lg/xl/xxl`
- **Tests:** Indirect: `test/visual/styling.spec.js` and `layouts.spec.js` both assert `--zer0-bp-lg` resolves to a pixel value (the token `syncBreakpointsFromCss` reads). No test asserts `window.zer0Navigation` exists or that `navigation:ready` fires.
- **Gaps / improvement ideas:** No direct assertion that the orchestrator initializes (`window.zer0Navigation._initialized`) or that conditional module gating works. The Bootstrap-not-loaded fallback path is untested. Public API methods (`scrollTo`, `expandTo`) have no coverage.

### Navbar Module (hover dropdowns / mobile menu / focus trap / tooltips)
- **Purpose:** Sub-module ported from the legacy `navigation.js` IIFE that wires all `#bdNavbar` interactions: split-toggle dropdowns, keyboard nav, outside-click close, offcanvas link-close + reset, manual tooltips, focus trap, and responsive reset.
- **Capabilities:** Click-only dropdown toggle (hover-to-open deliberately disabled); full keyboard menu nav (Enter/Space/Arrow/Home/End/Escape/Tab); closes others on open; outside-click + offcanvas-hide reset; manual Bootstrap tooltips shown only on compact desktop (992–1199px) with 400/100ms delay; focus-first on offcanvas shown; debounced resize cleanup; listener bookkeeping for `destroy()`.
- **Source:**
  - SCSS: `_sass/core/_navbar.scss`
  - Markup: `_includes/navigation/navbar.html`
  - JS: `assets/js/modules/navigation/navbar.js`
- **API surface:** class `Navbar` (`.init()`, `.destroy()`); operates on `#bdNavbar`, `.nav-hover-dropdown`, `.dropdown-toggle-split`, `.dropdown-menu`; toggles `.show` + `aria-expanded`; tooltip `customClass: 'nav-tooltip'`; breakpoints from `config.breakpoints.lg/xl`
- **Tests:** No automated tests (behaviorally). Static markup that it drives is touched by the navbar render/toggle tests in `styling.spec.js`.
- **Gaps / improvement ideas:** None of the rich keyboard/dropdown/tooltip behavior is exercised by Playwright — a high-value gap given accessibility commitments. `_setupDropdownHoverDelay()` is a dead no-op left in place. `destroy()` only removes listeners tracked via `_on`, but the mobile/outside-click handlers are registered through `_on`, so this is mostly fine — still untested.

### Scroll-Spy Module
- **Purpose:** IntersectionObserver-based section tracking that highlights the corresponding TOC link and auto-scrolls the TOC to keep it visible.
- **Capabilities:** Observes headings referenced by `#TableOfContents a[href^="#"]`; activates the most-visible heading's link (`.active`); rootMargin `-80px` for the fixed header; auto-scrolls TOC container; dispatches `navigation:sectionChange`; `setActiveById`/`getActive` helpers; clean `destroy()`.
- **Source:**
  - JS: `assets/js/modules/navigation/scroll-spy.js` (config in `config.js`)
  - Markup: `_includes/navigation/sidebar-right.html` (`#TableOfContents`)
- **API surface:** class `ScrollSpy` (`.setActiveById()`, `.getActive()`, `.destroy()`); event `navigation:sectionChange`; toggles `.active` on TOC links; config `scrollSpy.rootMargin`, `scrollSpy.threshold`, selectors `toc`, `tocLinks`, `tocContainer`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** Active-link highlighting on scroll is untested. Note this is the theme's custom scroll-spy; `fixtures.gotoBeforeScrollSpy` disables Bootstrap's native ScrollSpy for admin pages, but the custom one has no positive coverage.

### Smooth-Scroll Module
- **Purpose:** Intercepts in-page TOC anchor clicks to smooth-scroll with a fixed-header offset, update the URL hash without a jump, and close the mobile TOC offcanvas.
- **Capabilities:** Offset of 80px; `history.pushState` hash update; focus management (`tabindex=-1` + `focus({preventScroll})`) for a11y; closes `#tocContents` offcanvas below lg; dispatches `navigation:scroll`; `scrollToElement`/`scrollToId` public methods.
- **Source:**
  - JS: `assets/js/modules/navigation/smooth-scroll.js`
  - Markup: `_includes/navigation/sidebar-right.html`
- **API surface:** class `SmoothScroll` (`.scrollToElement()`, `.scrollToId()`, `.destroy()`); event `navigation:scroll`; config `smoothScroll.offset`, `smoothScroll.behavior`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** The offset scroll, hash update, and mobile-offcanvas-close are untested. `destroy()` is a documented no-op (handlers aren't stored), so hot-reload/SPA cleanup would leak listeners — acceptable for full-page Jekyll but worth noting.

### Keyboard Shortcuts Module
- **Purpose:** Global keyboard navigation: prev/next section (`[`/`]`), focus search (`/`), toggle sidebar (`b`), toggle TOC (`t`), and open the shortcuts help modal (`?`).
- **Capabilities:** Ignores keystrokes in inputs/textareas/contenteditable (with a `typeof matches` guard against Document-target TypeErrors); `?` checked before `/` fallback so Shift+/ opens the modal not search; routes sidebar/TOC toggles through the visibility modules when present, else Bootstrap offcanvas; dispatches `navigation:keyboardNav`/`searchRequest`/`sidebarToggle`; `getShortcuts()` for the help modal.
- **Source:**
  - JS: `assets/js/modules/navigation/keyboard.js`
  - Markup: `_includes/components/shortcuts-modal.html` (`#zer0-shortcuts-modal`)
- **API surface:** class `KeyboardShortcuts` (`.getShortcuts()`, `.destroy()`); events `navigation:keyboardNav`, `navigation:searchRequest`, `navigation:sidebarToggle`; id `#zer0-shortcuts-modal`; config `keyboard.keys` (`[`, `]`, `/`, `b`, `t`)
- **Tests:** `test/visual/layouts.spec.js` — "pressing ? opens the shortcuts modal" (dispatches a synthetic `?` keydown and asserts `#zer0-shortcuts-modal` gets `.show`).
- **Gaps / improvement ideas:** Only the `?` shortcut is tested. `[`/`]` section nav, `/` search focus, and `b`/`t` toggles are untested. The input-field guard (don't hijack `b`/`t` while typing) is also unverified.

### Swipe Gestures Module
- **Purpose:** Touch gesture support: swipe from the left edge to open the docs sidebar, swipe from the right edge to open the TOC, on mobile only.
- **Capabilities:** 50px swipe threshold + 50px edge zone; horizontal-dominant swipe detection; only below lg; opens `#bdSidebar` / `#tocContents` via Bootstrap offcanvas; dispatches `navigation:swipe`; passive listeners; clean `destroy()`.
- **Source:**
  - JS: `assets/js/modules/navigation/gestures.js`
- **API surface:** class `SwipeGestures` (`.destroy()`); event `navigation:swipe` (`detail.direction`, `detail.sidebar`); config `gestures.enabled`, `gestures.threshold`, `gestures.edgeZone`; selectors `leftSidebar` (`#bdSidebar`), `rightSidebar` (`#tocContents`)
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** Edge-swipe opening of either sidebar is untested (Playwright can synthesize touch events). No guard differentiates an edge-swipe from a horizontal content scroll/swipe-carousel, which could cause accidental opens — worth a behavioral test.

### Focus Manager Module
- **Purpose:** Accessibility focus management: returns focus to the trigger when an offcanvas closes and adds a keyboard-navigation body class for focus-visible styling.
- **Capabilities:** On `hidden.bs.offcanvas`, finds the `[data-bs-target]`/`[href]` trigger and refocuses it (rAF-deferred); `keyboard-nav` body class toggled on Tab vs. mousedown; `focusFirst`/`focusLast`/`trapFocus` utilities (trapFocus returns a cleanup fn).
- **Source:**
  - JS: `assets/js/modules/navigation/focus.js`
- **API surface:** class `FocusManager` (`.returnFocus()`, `.focusFirst()`, `.focusLast()`, `.trapFocus()`, `.destroy()`); body class `keyboard-nav`; selector `offcanvas` (`.offcanvas`)
- **Tests:** No automated tests (the generic skip-link focus test in ui-refresh.spec.js is unrelated).
- **Gaps / improvement ideas:** Focus-return-to-trigger on offcanvas close (a real a11y requirement) is untested. The `keyboard-nav` body class toggle and `trapFocus` are unused-by-default utilities with no coverage.

### Sidebar State Module
- **Purpose:** Persists expanded/collapsed state of sidebar tree nodes across page loads via localStorage, and exposes expand/collapse helpers.
- **Capabilities:** Persists expanded node ids under `zer0-nav-expanded-nodes`; listens to Bootstrap `show/hide.bs.collapse` (only for nodes inside `.bd-sidebar`/`.nav-tree`); restores state on load (no animation); `expandAll`/`collapseAll`/`expandPathTo`/`isExpanded`/`getExpandedNodes`/`clearState`; dispatches `navigation:toggle`/`expandAll`/`collapseAll`/`stateCleared`.
- **Source:**
  - JS: `assets/js/modules/navigation/sidebar-state.js`
  - Markup: `_includes/navigation/nav-tree.html`, `sidebar-folders.html` (collapse nodes)
- **API surface:** class `SidebarState` (`.setExpanded()`, `.isExpanded()`, `.expandAll()`, `.collapseAll()`, `.expandPathTo()`, `.getExpandedNodes()`, `.clearState()`, `.destroy()`); events `navigation:toggle/expandAll/collapseAll/stateCleared`; storage key `zer0-nav-expanded-nodes`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** Persistence across reloads, restore-on-load, and `expandPathTo` (reveal a deep node) are untested — a regression that loses sidebar state would be invisible to CI.

### Sidebar Visibility Module
- **Purpose:** Collapses/restores the left docs sidebar column on desktop (and toggles the offcanvas on mobile), persisting the preference.
- **Capabilities:** Preference under `zer0-nav-sidebar-visible`; toggles layout classes `bd-layout--sidebar-collapsed`, `bd-sidebar--hidden`, `bd-sidebar-fab--restore`, and `html.bd-sidebar-pref-hidden` (FOUC-guarded); updates ARIA labels/`aria-expanded` on the in-header toggle and the restore FAB; mobile path opens/toggles the Bootstrap offcanvas; dispatches `navigation:sidebarVisibility`. Only instantiated when a `#bdSidebar` + `.bd-layout` (not `--no-sidebar`) exist.
- **Source:**
  - SCSS: `_sass/layouts/_navbar-extras.scss` (`.bd-sidebar-fab--restore`); `_sass/core/_docs-layout.scss` (collapsed-column rules)
  - Markup: `_includes/navigation/sidebar-left.html` (toggles + FOUC script)
  - JS: `assets/js/modules/navigation/sidebar-visibility.js`
- **API surface:** class `SidebarVisibility` (`.isVisible()`, `.setVisible()`, `.toggle()`, `.destroy()`); event `navigation:sidebarVisibility`; classes `bd-layout--sidebar-collapsed`, `bd-sidebar--hidden`, `bd-sidebar-fab--restore`, html `bd-sidebar-pref-hidden`; storage key `zer0-nav-sidebar-visible`; selectors `.bd-sidebar-visibility-toggle`, `.bd-sidebar-fab`
- **Tests:** `test/visual/ui-refresh.spec.js` — "docs article exposes ToC on desktop" asserts `.bd-sidebar-visibility-toggle` is attached (presence only, not toggle behavior).
- **Gaps / improvement ideas:** The collapse/restore action, preference persistence, FOUC-guard class, and the mobile offcanvas branch are untested. The `b` keyboard shortcut routes here but its end-to-end effect is unverified.

### TOC Visibility Module
- **Purpose:** Collapses/restores the right TOC column on desktop (and toggles the offcanvas on mobile), persisting the preference — the mirror of Sidebar Visibility.
- **Capabilities:** Preference under `zer0-nav-toc-visible`; toggles `bd-main--no-toc`, `bd-toc--hidden`, `bd-toc-fab--restore`, `html.bd-toc-pref-hidden`; updates ARIA on the in-header toggle and restore FAB; mobile opens/toggles `#tocContents`; dispatches `navigation:tocVisibility`. Only instantiated when `#tocContents` exists.
- **Source:**
  - SCSS: `_sass/core/_toc.scss`, `_sass/layouts/_navbar-extras.scss` (`.bd-toc-fab--restore`)
  - Markup: `_includes/navigation/sidebar-right.html` (toggles + FOUC script)
  - JS: `assets/js/modules/navigation/toc-visibility.js`
- **API surface:** class `TocVisibility` (`.isVisible()`, `.setVisible()`, `.toggle()`, `.destroy()`); event `navigation:tocVisibility`; classes `bd-main--no-toc`, `bd-toc--hidden`, `bd-toc-fab--restore`, html `bd-toc-pref-hidden`; storage key `zer0-nav-toc-visible`; selectors `.bd-toc-visibility-toggle`, `.bd-toc-fab`
- **Tests:** `test/visual/ui-refresh.spec.js` — "docs article exposes ToC on desktop" asserts `.bd-toc-visibility-toggle` is attached (presence only).
- **Gaps / improvement ideas:** Same as Sidebar Visibility — the actual hide/restore, persistence, FOUC class, and mobile branch (plus the `t` shortcut effect) are untested.

---

## Sidebar, Table of Contents & Docs Layout

The reading-page shell for content/docs pages: a CSS-grid `.bd-layout` (left `.bd-sidebar` nav + `.bd-main` holding `.bd-intro` hero, right `.bd-toc`, and `.bd-content` body), four interchangeable left-nav renderers (YAML tree, auto folders, categories, section topics), a Liquid-parsed sticky Table of Contents with scroll-spy + collapsible rails persisted to localStorage, and Bootstrap-docs-derived chrome for code examples and content tables.

### Docs layout shell (.bd-layout / .bd-sidebar / .bd-main / .bd-toc)
- **Purpose:** The responsive grid scaffold for every default-layout page: a left documentation sidebar, a main column, a right table-of-contents column, and the content body. Collapses to offcanvas drawers + FABs on mobile and to slim "rail" columns when the user hides a sidebar.
- **Capabilities:** CSS-grid areas `sidebar main` (desktop) and `intro/toc/content` inside `.bd-main`; sticky sidebar + TOC (`top: 5rem`, `height: calc(100vh - …)`); width grows past Bootstrap's 1320px cap on docs pages via `--zer0-layout-max-width-xl/xxl`; `--no-sidebar` modifier when no left nav content; collapsed/rail states (`bd-layout--sidebar-collapsed`, `bd-main--no-toc`, and pre-paint `html.bd-sidebar-pref-hidden` / `html.bd-toc-pref-hidden` FOUC guards) that animate `grid-template-columns` and fade out everything except the toggle-hosting headers; `prefers-reduced-motion` disables the transitions; mobile FABs (`#sidebarFab`/`.bd-sidebar-fab`, `#tocFab`/`.bd-toc-fab`).
- **Source:**
  - SCSS: `_sass/core/_docs-layout.scss`
  - Markup: `_layouts/default.html` (`.bd-layout`/`.bd-main`/`.bd-content` + sidebar FAB), `_includes/navigation/sidebar-left.html` (`#bdSidebar` offcanvas-lg, `.bd-sidebar-desktop-header`), `_includes/navigation/sidebar-right.html` (`#tocContents` offcanvas-lg + `#TableOfContents`)
  - JS: `assets/js/modules/navigation/toc-visibility.js` and `sidebar-visibility.js` toggle the `--no-toc`/rail state classes (config in `assets/js/modules/navigation/config.js`)
- **API surface:** classes `.bd-layout`, `.bd-layout--no-sidebar`, `.bd-layout--sidebar-collapsed`, `.bd-sidebar`, `.bd-sidebar-desktop-header`, `.bd-sidebar-fab`, `.bd-main`, `.bd-main--no-toc`, `.bd-toc`, `.bd-content`, `.bd-gutter`; ids `#bdSidebar`, `#tocContents`, `#sidebarFab`, `#tocFab`; html classes `bd-sidebar-pref-hidden`, `bd-toc-pref-hidden`; data-attrs on `<main>`: `data-bs-spy="scroll"`, `data-bs-target="#TableOfContents"`, `data-bs-offset="100"`, `data-bs-smooth-scroll`; CSS vars `--zer0-sidebar-width` (17rem), `--zer0-sidebar-toc-width` (12rem), `--zer0-sidebar-rail-width`/`--zer0-sidebar-toc-rail-width` (fallback 2.25rem only — undefined as tokens), `--zer0-layout-max-width-xl/xxl`, `--zer0-motion-duration-base/fast`, `--bd-sidebar-link-bg`
- **Tests:** `test/visual/styling.spec.js` — "default layout page exposes docs-layout regions" asserts `main.bd-main` and `.bd-content` are visible. `test/visual/ui-refresh.spec.js` — "docs article exposes ToC on desktop" asserts `.bd-toc, #tocContents` attached and the visibility toggles attached; "mobile exposes sidebar FAB and ToC FAB" asserts `#sidebarFab/.bd-sidebar-fab` visible and `#tocFab` attached. No test exercises the collapsed-rail transition or the FOUC pref guards.
- **Gaps / improvement ideas:** `--zer0-sidebar-rail-width` and `--zer0-sidebar-toc-rail-width` are consumed only via inline fallbacks and never defined in `_sass/tokens/` — promote them to real tokens for fork override. No automated coverage of the hide/show rail collapse, the `bd-*-pref-hidden` pre-paint guard, or keyboard reachability of the rail toggle when collapsed. `.bd-sidebar`/`.bd-toc` use `aria-controls` on offcanvas-lg containers that are static on desktop — consider verifying screen-reader semantics in the rail state where most content is `visibility: hidden`.

### Nav-tree sidebar (YAML "tree" mode)
- **Purpose:** Renders a hierarchical left-sidebar nav (up to 3 levels) from a `_data/navigation/*.yml` file selected by `page.sidebar.nav`. Used in the docs sidebar's "tree" mode.
- **Capabilities:** Bootstrap collapse-based expand/collapse with chevron rotation; per-item `icon`, `url`, `expanded` default state, and `children`; active-link highlighting via `page.url == item.url`; depth-based font weight/size styling (`data-depth="0|1|2"`); leaf items without URLs render as muted text; graceful "navigation not found" fallback; keyboard-focus outline under `.keyboard-nav`; dark-mode hover/active tints.
- **Source:**
  - SCSS: `_sass/core/_nav-tree.scss`
  - Markup: `_includes/navigation/nav-tree.html` (wrapped by `_includes/navigation/sidebar-left.html` in a `nav.nav-tree[data-nav-tree]`); `_includes/navigation/nav_list.html` is a deprecated thin wrapper that just delegates to nav-tree
  - Plugin/data: `_data/navigation/*.yml`
- **API surface:** classes `.nav-tree`, `.nav-tree-root`, `.nav-tree-item`, `.nav-tree-link`, `.nav-tree-toggle`, `.nav-tree-text`, `.nav-tree-children`, `.nav-tree-chevron`, `.active`, `.collapsed`; data-attrs `data-depth="0|1|2"`, `data-nav-tree`; Bootstrap `data-bs-toggle="collapse"` / `data-bs-target` / `aria-expanded` / `aria-controls`; CSS vars `--bs-body-color`, `--bs-primary`, `--bs-primary-bg-subtle`, `--bs-tertiary-bg`, `--bs-border-color`, `--bs-primary-rgb`
- **Tests:** No automated tests (no spec renders a tree-mode sidebar or asserts expand/collapse, active state, or chevron rotation).
- **Gaps / improvement ideas:** No coverage of collapse toggling, `aria-expanded` syncing, active-link resolution, or the "not found" fallback. The Level-1-with-children branch omits the `aria-controls`/`aria-label` that the root toggle has on its icon-only button (the root variant labels "Toggle … submenu"); align ARIA across depths. Slugified `item_id` collisions are possible if two items share a title — consider namespacing by depth/parent.

### Sidebar categories (categories mode)
- **Purpose:** Groups posts/pages by Jekyll category into collapsible "ghost-pill" headers in the left sidebar, each revealing its post links. Used in the docs sidebar's "categories" mode.
- **Capabilities:** Collapsible category groups (Bootstrap collapse, default collapsed); accent-bar ghost-pill header with hover/expanded tinting via `color-mix`; 2-line clamped post-title links; active link when `page.url == post.url`; reuses `.nav-tree`/`.nav-tree-link` structure scoped to `.nav-tree--categories`; dark-mode softer surfaces; uses `--zer0-*` design tokens throughout.
- **Source:**
  - SCSS: `_sass/core/_sidebar-categories.scss`, plus active-state shim in `_sass/core/_sidebar-extras.scss`
  - Markup: `_includes/navigation/sidebar-categories.html` (invoked by `sidebar-left.html` with `categories=site.categories | sort`)
- **API surface:** classes `.nav-tree--categories`, `.sidebar-categories`, `.sidebar-categories-heading`, `.sidebar-categories-group`, `.sidebar-categories-toggle` (+ `__icon`/`__label`/`__chevron`), `.sidebar-categories-posts`, `.sidebar-categories-link` (+ `__icon`/`__text`), `.active`; ids `#{cat-slug}-list`; `data-bs-toggle="collapse"`/`aria-expanded`/`aria-controls`; CSS vars `--zer0-color-ink`, `--zer0-color-ink-muted`, `--zer0-color-primary`, `--zer0-color-bg-elevated`, `--zer0-color-border-translucent`, `--zer0-text-sm`, `--zer0-space-*`, `--zer0-font-weight-*`, `--zer0-leading-*`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** No coverage of expand/collapse or active-state. Heading is an `<h2>` even when nested under the sidebar's own `<h2>` "Browse docs" — heading-order/landmark check advisable. The `-webkit-line-clamp` 2-line truncation has no non-WebKit fallback (acceptable but worth a fade). Active-state is defined in two places (`_sidebar-categories.scss` and the `_sidebar-extras.scss` shim) with slightly different backgrounds — consolidate to avoid drift.

### Sidebar folders (auto mode)
- **Purpose:** Auto-generates a left-sidebar document tree from the current collection's docs, grouped by folder path. Used in the docs sidebar's "auto" mode.
- **Capabilities:** Sorts collection docs by `path`, emits Bootstrap `list-group-flush` with `.folder` headers and `.file` link items; active item when `page.url == doc.url`; "no collection found" fallback. A companion script adds click + Enter/Space disclosure with `role="button"`, `tabindex="0"`, `aria-expanded`, `aria-controls`.
- **Source:**
  - SCSS: hover shim in `_sass/core/_sidebar-extras.scss` (`.bd-sidebar .list-group-item:hover`); otherwise Bootstrap list-group
  - Markup: `_includes/navigation/sidebar-folders.html` (invoked by `sidebar-left.html`, wrapped in `.list-group.nav-tree#sidebar-content[data-nav-tree]`)
  - JS: `assets/js/side-bar-folders.js` (loaded `defer` from `_includes/core/head.html`)
- **API surface:** classes `.folder`, `.file`, `.list-group`, `.list-group-flush`, `.list-group-item`, `.list-group-item-action`, `.active`, `.nested-list-group` (expected by JS); generated id `zer0-folder-…`; attrs `role="button"`, `tabindex`, `aria-expanded`, `aria-controls`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** **Dead-wiring bug:** `side-bar-folders.js` only activates when a `.folder` is immediately followed by an element with class `.nested-list-group`, but `sidebar-folders.html` emits a flat sibling list (`.folder` and `.file` `<li>`s in one `<ul>`) and never produces `.nested-list-group` — so the disclosure toggle is a no-op for real markup (folders are not collapsible). Either nest `.file` items under a `.nested-list-group` container per folder or rewrite the JS to target the flat structure. The folder-derivation Liquid (`current_path = doc.path | split:'/' | pop`) is fragile for deep trees. No tests cover any of this.

### Section sidebar (topic navigation)
- **Purpose:** A self-contained sticky topic sidebar for section/archive pages: a desktop card of topics (with article counts) plus a mobile offcanvas drawer, with in-page smooth-scroll and scroll-spy highlighting. Used by `_layouts/section.html`.
- **Capabilities:** Desktop sticky card (`top: 80px`) listing "All Articles" + up to 15 tag-derived topics with per-topic counts and a "View All Tags" footer when >15; section stats (total/topics/featured); mobile offcanvas variant; inline `<style>` + IIFE `<script>` providing smooth-scroll to `#anchor` sections and an IntersectionObserver scroll-spy (`rootMargin: -20% 0px -80% 0px`) toggling `.active`.
- **Source:**
  - SCSS: inline `<style>` block in the include (`.sidebar-nav .nav-link*`); no shared partial
  - Markup: `_includes/navigation/section-sidebar.html` (params `section_posts`, `sub_categories`, `page_title`, `sidebar_id`)
  - JS: inline IIFE in the include
- **API surface:** classes `.section-sidebar-desktop`, `.sidebar-nav`, `.nav-link`/`.active`, `.nav-text`, `.offcanvas`; ids `#{sidebar_id}` (default `sectionSidebar`), `#all-posts`, `#{tag-slug}`; data-attrs `data-section`, `data-bs-dismiss="offcanvas"`; CSS vars `--bs-primary-rgb`, `--bs-body-color`
- **Tests:** `test/visual/ui-refresh.spec.js` — "news section page loads with layout containment" asserts the section sidebar sits left of `#all-posts` (guards `.section-layout-sidebar` / `#all-posts`), but does not exercise this include's scroll-spy or topic counts directly.
- **Gaps / improvement ideas:** Ships its own inline CSS and JS rather than reusing `_sass`/`assets/js/modules` — duplicates the scroll-spy logic already in `modules/navigation/scroll-spy.js`. Smooth-scroll and scroll-spy here are not covered by any behavioral assertion. The active topic uses `<a>` without `aria-current`; add it for assistive tech. Hard-coded `top: 80px` should reference the navbar-height token.

### Table of Contents (Liquid TOC parser + sidebar-right)
- **Purpose:** Builds an "On this page" outline by parsing the rendered page HTML for `h1`–`h6` and emitting a nested list, rendered in the sticky right column / offcanvas. Only runs when the page actually contains `<h2>`/`<h3>`/`<h4>`.
- **Capabilities:** allejo/jekyll-toc Liquid parser with `h_min`/`h_max`, `sanitize`, `class`, `item_class`, `anchor_class`, `skip_no_ids`, ordered/unordered, `no_toc` skip, base_url; here invoked with `h_min=1 h_max=3 sanitize=true skip_no_ids=true class="list-group-flush" item_class="list-group-item"`; "No sections on this page" fallback; sticky desktop column with scrollable overflow; active-link border-left accent.
- **Source:**
  - SCSS: `_sass/core/_toc.scss` (`#TableOfContents`, `.toc`, `.toc-toggle`, `.toc-collapse`), plus `.bd-toc nav …` rules in `_sass/core/_docs-layout.scss` and the active shim in `_sass/core/_sidebar-extras.scss`
  - Markup: `_includes/content/toc.html` (parser), `_includes/navigation/sidebar-right.html` (`#tocContents` offcanvas + `nav#TableOfContents` wrapper + toggle button)
  - JS: scroll-spy via `assets/js/modules/navigation/scroll-spy.js`
- **API surface:** ids `#TableOfContents`, `#tocContents`, `#tocLabel`; classes `.bd-toc`, `.toc`, `.toc-collapse`, `.bd-toc-collapse`, `.list-group-flush`, `.list-group-item`, `.bd-toc-visibility-toggle`, `a.active`; `role="navigation"`, `aria-label="Table of Contents"`; CSS vars `--bd-toc-color`, `--bs-tertiary-bg`, `--bs-border-color`, `--bd-violet`/`--bd-violet-rgb`
- **Tests:** `test/visual/ui-refresh.spec.js` — "docs article exposes ToC on desktop" asserts `.bd-toc, #tocContents` is attached (presence only). No spec asserts the TOC parser output (heading nesting, anchor hrefs, the no-sections fallback) or active-link highlighting.
- **Gaps / improvement ideas:** Both `_sass/core/_toc.scss` (`.toc`/`#TableOfContents`) and `_docs-layout.scss` (`.bd-toc`) style the TOC, with overlapping/legacy `.toc` rules that the current markup (`.bd-toc`) doesn't use — prune the dead `.toc`/`.toc-collapse` ruleset or confirm a consumer. No behavioral test of the heading parser despite it being intricate Liquid. Consider asserting that TOC anchor `href`s resolve to real heading ids (the scroll-spy depends on this).

### TOC FAB (mobile trigger)
- **Purpose:** A fixed circular button on small screens that opens the TOC offcanvas (or restores the desktop-hidden TOC). Rendered from the footer so it shares the footer stacking context.
- **Capabilities:** Shown only when the page has an effective sidebar (`page.sidebar != false`, or non-featured/breaking default); `d-lg-none`; toggles the `#tocContents` offcanvas via `TocVisibility`; `aria-controls="tocContents"`, dynamic `aria-expanded`/`aria-label`.
- **Source:**
  - SCSS: FAB stacking in `_sass/layouts/_navbar-extras.scss` (referenced); `_sass/core/_sidebar-extras.scss` notes the move
  - Markup: `_includes/navigation/toc-fab.html` (included from `_includes/core/footer.html`)
  - JS: `assets/js/modules/navigation/toc-visibility.js` (`_fab`, `_fabToggle`, `bd-toc-fab--restore`)
- **API surface:** id `#tocFab`; classes `.bd-toc-fab`, `.bd-toc-toggle`, `.bd-toc-fab--restore`; attrs `aria-controls="tocContents"`, `aria-expanded`, `aria-label`
- **Tests:** `test/visual/ui-refresh.spec.js` — "mobile exposes sidebar FAB and ToC FAB" asserts `#tocFab` is attached at mobile viewport (presence only, behind a skip guard).
- **Gaps / improvement ideas:** No test that clicking the FAB opens/restores the TOC or that `aria-expanded` flips. The FAB's effective-sidebar logic is duplicated between `toc-fab.html` and `default.html` — extract to a shared include/variable.

### TOC visibility toggle (hide/show + persistence)
- **Purpose:** Lets desktop users collapse the right TOC column to a slim rail (and restore it), persisting the choice in localStorage; on mobile, toggles the TOC offcanvas. Paired with a pre-paint FOUC guard.
- **Capabilities:** Reads/writes `localStorage['zer0-nav-toc-visible']`; applies `bd-main--no-toc`, `bd-toc--hidden`, `bd-toc-fab--restore`, and `html.bd-toc-pref-hidden`; updates `aria-expanded`/`aria-label`/`title` on all toggles; mobile path uses Bootstrap Offcanvas; dispatches `navigation:tocVisibility` CustomEvent; breakpoint-aware via `isBelowBreakpoint('lg')`; `setVisible()`/`toggle()`/`isVisible()` API; focus management on restore.
- **Source:**
  - SCSS: rail/fade states in `_sass/core/_docs-layout.scss`
  - Markup: `.bd-toc-visibility-toggle` buttons in `_includes/navigation/sidebar-right.html`; FOUC guard `<script>` inline there
  - JS: `assets/js/modules/navigation/toc-visibility.js` (+ selectors in `config.js`)
- **API surface:** classes `.bd-toc-visibility-toggle`; html class `bd-toc-pref-hidden`; localStorage key `zer0-nav-toc-visible`; events `navigation:tocVisibility` (detail `{visible}`); selectors from config (`tocWrapper`, `tocFab`, `mainArea`, `rightSidebar`, `tocVisibilityToggle`)
- **Tests:** `test/visual/ui-refresh.spec.js` — "docs article exposes ToC on desktop" asserts the toggle is attached. No spec clicks the toggle, verifies persistence across reload, or checks the `aria-expanded` flip.
- **Gaps / improvement ideas:** No behavioral/persistence test for the core feature (toggle → reload → state retained). Console `console.log` left in production init. Consider asserting the `navigation:tocVisibility` event and that focus lands correctly after collapse/restore.

### Scroll-spy (active heading highlight)
- **Purpose:** Highlights the TOC link for the currently-visible heading using an IntersectionObserver, and auto-scrolls the TOC to keep the active link in view.
- **Capabilities:** Maps each `#TableOfContents a[href^="#"]` to its heading by id; observes headings with `rootMargin: -80px 0px -80px 0px`, `threshold: [0,0.25,0.5,0.75,1]`; picks the most-visible heading and toggles `.active`; auto-scrolls TOC container; `setActiveById()`/`getActive()`/`destroy()`; dispatches `navigation:sectionChange`; safe getters that warn-and-continue. (Note: a second, independent scroll-spy exists inline in `section-sidebar.html` for section pages.)
- **Source:**
  - SCSS: active styling via `.bd-toc nav a.active` (`_docs-layout.scss`) and `.bd-toc nav a.active` shim (`_sidebar-extras.scss`)
  - JS: `assets/js/modules/navigation/scroll-spy.js` (+ `config.js`); Bootstrap's own scrollspy also wired via `data-bs-spy="scroll"` on `<main>` in `default.html`
- **API surface:** events `navigation:sectionChange` (detail `{link, href}`); classes `.active`; CSS selectors `#TableOfContents a`, `.bd-toc .offcanvas-body` (config `tocLinks`/`tocContainer`); `data-bs-spy="scroll"` on `main.bd-main`
- **Tests:** No automated tests (no spec scrolls a docs page and asserts the active TOC link changes).
- **Gaps / improvement ideas:** Two competing active-link drivers — Bootstrap's `data-bs-spy="scroll"` on `<main>` and the custom IntersectionObserver — may fight over `.active`; verify/dedupe. No behavioral test of active-link tracking, the most-visible selection, or TOC auto-scroll. Console logging in init.

### Page intro header (.bd-intro family)
- **Purpose:** The full-bleed hero at the top of default-layout pages: title/subtitle/description over a darkened preview image, plus a frosted metadata footer (author, dates, category, difficulty, tags, reading time, source) and an action cluster (Share, Copilot Agent prompts, Edit on GitHub).
- **Capabilities:** Preview-image resolution with `assets_prefix` auto-prepend; author name/URL from `_data/authors.yml` or `site.author`; published vs. updated date logic (only shows "Updated" when it differs); most-specific category badge with link; difficulty/level badge with color variants (beginner/intermediate/advanced/expert); up to 5 tag chips + "+N"; reading-time estimate (`number_of_words / 200`); Share dropdown (Reddit/LinkedIn/X/Copy Link with `data-copy` + `js-linkedin-share`); Copilot Agent prompt dropdown that prefills a GitHub issue from `_data/prompts.yml` with page context + environment tables; Edit-on-GitHub link; frosted-glass footer with `backdrop-filter` + `@supports` fallback.
- **Source:**
  - SCSS: `_sass/core/_docs-layout.scss` (`.bd-intro*`, `.bd-intro-meta-*`, `.bd-intro-badge*`, `.bd-intro-actions`, `.copilot-agent-*`)
  - Markup: `_includes/content/intro.html` (included by `_layouts/default.html`, skipped for article/note layouts and `hide_intro`)
  - JS: `assets/js/ui-helpers.js` (`data-copy`, `.js-linkedin-share`) — referenced, not in this cluster
  - Plugin/data: `_data/authors.yml`, `_data/prompts.yml`
- **API surface:** classes `.bd-intro`, `.bd-intro-inner/-content/-title/-subtitle/-description`, `.bd-intro-meta-footer/-row/-item/-icon/-link/-bottom/-meta`, `.bd-intro-meta-item--tags/--source`, `.bd-intro-badge` (+ `--level-*`, `--tag`, `--more`), `.bd-intro-tag-list`, `.bd-intro-actions`, `.bd-intro-action-link`, `.copilot-agent-menu/-item*`, `.js-linkedin-share`; attrs `aria-label="Page metadata"`, `data-copy`, `data-share-url/-title/-description`; CSS vars `--bd-intro-min-height`, `--bd-intro-meta-footer-bg/-border`, `--bd-intro-meta-gap/-separator`, many `--zer0-text-*`/`--zer0-space-*`/`--zer0-font-weight-*`
- **Tests:** `test/visual/ui-refresh.spec.js` — "meta footer wraps actions and stacks below description" asserts `.bd-intro-meta-footer`, `.bd-intro-actions`, `.bd-intro-meta-row[aria-label]` visible, description stacked above footer, and ≥2 action buttons; "intro action buttons share consistent height" asserts non-dropdown `.bd-intro-actions .btn` heights differ ≤14px; "intro metadata row exposes aria-label" asserts the row's `aria-label` is non-empty. `test/visual/layouts.spec.js` — homepage/article single-h1 checks indirectly guard against duplicate intro H1s.
- **Gaps / improvement ideas:** No test of date logic (published vs. updated dedupe), category/difficulty badge resolution, tag overflow (+N), or reading-time computation. The hero uses a hardcoded inline `background` gradient with `#fff` text on an arbitrary preview image — color-contrast is unverified (the axe scans disable `color-contrast`). Copilot-Agent issue bodies embed full page+env context; no test asserts the generated `issue.new` URL encodes correctly.

### Docs code-example chrome (.bd-example / .bd-code-snippet / clipboard)
- **Purpose:** Bootstrap-docs-style framing for live component examples and their code snippets, plus AnchorJS heading links and ClipboardJS "Copy" buttons injected over highlighted code. Primarily used by the cheatsheet/style page.
- **Capabilities:** Bordered/rounded example + snippet containers with responsive bleed; spacing normalizers for nested components; example variants (row/cols/cssgrid/flex/ratios/offcanvas/zindex/placeholder); custom tooltip/popover demos; `.bd-clipboard`/`.btn-clipboard` + `.bd-edit`/`.btn-edit` (desktop-only) over `.highlight`; `.bd-placeholder-img(-lg)`; `scroll-margin-top: 80px` on focusable/heading targets. `docs.min.js` bundles AnchorJS (anchors on `.bd-content > h2..h5`), ClipboardJS (injects `.bd-clipboard` before each `div.highlight`, copies sibling, Bootstrap tooltip "Copied!"), Bootstrap tooltip/popover/toast/modal demo wiring, and an Algolia docs-search binding.
- **Source:**
  - SCSS: `_sass/core/_docs-code-examples.scss`
  - Markup: `_includes/docs/bootstrap-docs.html` (the `bd-cheatsheet` with `.bd-example`/`.bd-example-snippet`/`.bd-heading`)
  - JS: `assets/js/docs.min.js`
- **API surface:** classes `.bd-code-snippet`, `.bd-example`, `.bd-example-snippet`, `.bd-example-{row,cols,cssgrid,flex,ratios,offcanvas,zindex-levels,border-utils,…}`, `.bd-clipboard`, `.btn-clipboard`, `.bd-edit`, `.btn-edit`, `.highlight-toolbar`, `.bd-placeholder-img(-lg)`, `.bd-heading`; JS globals `window.anchors` (AnchorJS), `ClipboardJS`; CSS vars `--bd-example-padding`, `--bd-violet`/`--bd-violet-rgb`, `--bd-pre-bg`, `--bs-tooltip-*`/`--bs-popover-*`
- **Tests:** No automated tests target `.bd-example`/`.bd-clipboard`/AnchorJS. (The `code-blocks` specs in `ui-refresh.spec.js` test a *different* system — `.code-block-header`/`.code-line-numbers` from the rouge enhancer, not `docs.min.js`'s `.bd-clipboard`.)
- **Gaps / improvement ideas:** `docs.min.js` still carries an Algolia "bootstrap" docs-search binding (`apiKey`, `indexName:'bootstrap'`, getbootstrap.com URL rewrites) that is dead/irrelevant to this theme — strip it. Two parallel code-copy systems coexist (`docs.min.js` `.btn-clipboard` for `.bd-example` pages vs. the rouge `.code-block-header .copy` used in real content) — document which applies where, and add a behavioral copy test for at least the content path. `.bd-example::after { content: null }` is invalid CSS (should be `""`/`none`). No anchor-link or copy-button behavioral coverage.

### Content tables (markdown/HTML table styling + CSV copy)
- **Purpose:** Styles bare Kramdown and Bootstrap `.table` markup inside reading areas with a card-like, sticky-header, striped, hover-highlight look, and injects a per-table "Copy CSV" toolbar button.
- **Capabilities:** Token-driven striping/hover/sticky-header via `color-mix`; rounded card corners; horizontal scroll on mobile (`min-width: 36rem`); `code`/link/`strong` styling inside cells; scoped to `.bd-content`, `.landing-content-body`, `.post-content`, `.note-content`, `.notebook-content`, `.page-content` and excludes `#sitemapTable`/`#admin-content`; JS wraps each eligible table in `.content-table-wrapper` with a `.content-table-toolbar` + `.table-copy-csv` button that serializes thead/tbody/tfoot to CSV (proper quoting), copies via Clipboard API with `execCommand` fallback, shows a `zer0UI.showToast` and a transient "Copied!"/"Copy failed" state.
- **Source:**
  - SCSS: `_sass/components/_content-tables.scss`
  - Markup: generated by JS (`.content-table-wrapper`/`.content-table-toolbar`); `_includes/components/quick-index.html` is a separate small collection-index list (`<ul>` of pages in the current collection + optional `#categories` mount)
  - JS: `assets/js/table-copy.js` (loaded `defer` from `_includes/core/head.html`)
- **API surface:** classes `.content-table-wrapper`, `.content-table-toolbar`, `.table-copy-csv` (+ `.copied`), `.table-responsive`; ids excluded `#sitemapTable`, scope `#admin-content`; JS dep `window.zer0UI.showToast`; CSS vars `--zer0-table-stripe/-hover/-header-bg/-header-border`, `--zer0-color-*`, `--zer0-space-*`, `--zer0-shadow-focus`, `--zer0-motion-duration-fast`
- **Tests:** `test/visual/ui-refresh.spec.js` — "landing comparison table has toolbar and distinct header" waits for `.table-copy-csv`, asserts `.content-table-wrapper .table-copy-csv` is visible, and that thead vs. tbody background colors differ. Does not verify the actual CSV output or clipboard write.
- **Gaps / improvement ideas:** No test of CSV correctness (cell quoting, colspan handling — note `getTableMatrix` ignores `colspan`/`rowspan`, so merged cells produce misaligned CSV), the `execCommand` fallback path, or the failure/empty-table toast. `quick-index.html` is unstyled (`text-decoration`/active-state) and its `<p>Quick Index</p>` sits illegally inside a `<ul>` — fix the markup. Consider keyboard/`aria-live` announcement parity between toolbar copy and toast.

---

## Landing, Home & Component Polish

The marketing-facing surface of the theme: the data-driven landing layout (hero, feature cards, quick-links bar, install cards, get-started), the minimal home/index/welcome layouts, the reusable section/feature-card/cta-button/info-section includes, plus the cross-cutting Bootstrap "polish" layer (button ripples, card hover lift, hero/stagger animations, table/badge/link/form refinements) driven by `ui-enhancements.js`, `ui-helpers.js`, and `share-actions.js`, with a token-aware skeleton loader and an orphaned particles.js hero background.

### Landing layout
- **Purpose:** The data-driven marketing homepage shell — a hero with CTAs and image, a quick-links bar, the rendered Markdown body, a features grid, a get-started install section, and an author/E-E-A-T block. Gives first-time visitors a polished first impression and a clear path to install.
- **Capabilities:** Hero with `page.title`/`page.description` and up to three CTAs (primary/secondary/tertiary, tertiary URL falls back to `site.resources.github_repo`); inline `aspect-ratio` + `max-width` reserve the hero-image box pre-CSS to avoid layout jerk; eager/high-priority hero `<img>` with JS fade-in; placeholder `bi-code-square` card when no `hero_image`; data-driven features section (rendered only if `landing.features.items`); data-driven get-started section with install cards; suppression of a duplicate first body `<h1>` via SCSS (README-as-homepage pattern).
- **Source:**
  - SCSS: `_sass/layouts/_landing.scss`, `_sass/layouts/_global-chrome.scss` (`.min-vh-50`, `.landing-hero-media` shim), `_sass/components/_ui-enhancements.scss` (hero/stagger animations, `.bg-dark` quick-links)
  - Markup: `_layouts/landing.html`, `_includes/landing/landing-quick-links.html`, `_includes/landing/landing-install-cards.html`, `_includes/components/cta-button.html`, `_includes/components/author-eeat.html`
  - JS: `assets/js/ui-helpers.js` (`bindHeroImages`), `assets/js/ui-enhancements.js`
  - Plugin/data: `_data/landing.yml` (hero CTAs, features heading/lead/items, get_started)
- **API surface:** classes `.landing-hero`, `.landing-hero-copy`, `.landing-hero-media`, `.landing-hero-img`, `.is-loaded`, `.landing-content-body`, `.landing-feature-card`, `.landing-feature-icon`, `.zer0-bg-hero`, `.zer0-section`, `.min-vh-50`, ids `#features` / `#get-started`; CSS vars `--zer0-space-section`, `--zer0-color-bg-elevated`, `--zer0-color-border`, `--zer0-shadow-md`, `--zer0-color-primary`, `--zer0-color-primary-rgb`, `--zer0-motion-duration-base`, `--zer0-motion-ease-standard`; no custom data-attributes or events
- **Tests:** `test/visual/layouts.spec.js` — "homepage exposes exactly one accessible h1" (getByRole level 1 == 1, validates the `.landing-content-body > h1:first-of-type` display:none suppression), "features section renders from _data/landing.yml" (skips if no `#features`; asserts `#features` visible and `.landing-feature-card` count ≥ 1), "hero CTA buttons expose accessible names" (every `.landing-hero a.btn` has text or aria-label), "homepage axe scan completes" (< 25 violations). `test/visual/ui-refresh.spec.js` — "landing comparison table has toolbar and distinct header" exercises `.landing-content-body table`. Axe advisory scans across all viewports.
- **Gaps / improvement ideas:** No test asserts the hero image actually gains `.is-loaded` (the anti-jerk fade-in is unverified). The tertiary-CTA GitHub fallback and the no-`hero_image` placeholder branch are untested. The duplicate-H1 suppression relies on `display:none` on `:first-of-type` which would wrongly hide a legitimately-first body heading that is not a title repeat. Feature cards have no entrance-animation reduced-motion test. Consider extracting the inline hero style attributes into a class to satisfy stricter CSP.

### Landing quick-links bar
- **Purpose:** A dark full-width bar of four outline-light buttons (GitHub, RubyGems, Docker Hub, Fork Project) rendered directly under the hero for fast outbound navigation.
- **Capabilities:** Four equal-width responsive columns (`col-6 col-md-3`), each a `w-100` outline-light button with a Bootstrap icon; URLs sourced from `site.resources.*` with `site.github.repository_url` fallbacks; slide-down entrance animation and lift-on-hover from the polish layer.
- **Source:**
  - SCSS: `_sass/components/_ui-enhancements.scss` (`.bg-dark` slideDown + `.btn-outline-light` hover), `_sass/layouts/_landing.scss` (`.landing-quick-links` hover lift — note: the include does not currently emit the `.landing-quick-links` class)
  - Markup: `_includes/landing/landing-quick-links.html`
  - JS: — (styling-only)
  - Plugin/data: `site.resources` config
- **API surface:** classes `.bg-dark`, `.btn-outline-light`, `.btn-sm`, `.w-100`; the SCSS `.landing-quick-links` selector exists but no markup applies it; CSS vars `--zer0-color-bg-elevated`, `--zer0-color-border`, `--zer0-motion-duration-fast`
- **Tests:** No automated tests (no spec targets the quick-links bar specifically).
- **Gaps / improvement ideas:** Dead/mismatched selector — `.landing-quick-links` styling in `_landing.scss` never applies because the include emits `.bg-dark` instead; either add the class to the markup or remove the orphan rule. All four links open in the same tab semantics via `target="_blank" rel="noopener"` but there is no `visually-hidden` "opens in new tab" cue (unlike `cta-button.html`). No test verifies the four links resolve to non-`#` hrefs.

### Landing install cards
- **Purpose:** Three side-by-side install-method cards (Ruby Gem, Docker Image, Fork & Deploy) plus a Contributing-guide CTA, shown in the get-started section to convert visitors into users.
- **Capabilities:** Color-coded card headers (primary/info/secondary); copy-ready `<pre><code>` install snippets; smart fork-URL builder that appends `/fork` only when absent; ordered fork checklist; outbound buttons to RubyGems/Docker Hub/GitHub with `site.resources.*` fallbacks; top-border accent on hover via the polish layer.
- **Source:**
  - SCSS: `_sass/components/_ui-enhancements.scss` (`#get-started .card` top-border hover accent)
  - Markup: `_includes/landing/landing-install-cards.html`
  - JS: — (the snippets are not wired to the `data-copy` copy helper)
  - Plugin/data: `site.resources.rubygems`, `site.resources.docker`, `site.resources.github_fork`, `site.github.repository_url`, `site.resources.contributing`
- **API surface:** classes `.card`, `.card-header`, `.bg-primary`/`.bg-info`/`.bg-secondary`, `.btn-outline-primary`/`-info`/`-secondary`, id `#get-started`; CSS vars consumed via Bootstrap (`--bs-primary`, `--bs-info`, `--bs-secondary`)
- **Tests:** No automated tests (the get-started/install cards are not asserted by any spec).
- **Gaps / improvement ideas:** Install snippets are plain `<pre>` with no copy button despite `ui-helpers.js` providing a ready `data-copy` binding — a clear UX win going untested/unused. The `#get-started .card &.card-header.bg-primary ~ .card-body` SCSS selector is malformed (a `.card` is never also a `.card-header`), so those `~ .card-body` border rules never match. No test verifies the `/fork` URL-builder logic.

### Home layout
- **Purpose:** A minimal homepage container — optional `<h1>`, the page content, and an RSS subscribe link — for clean landing/showcase pages that supply their own structure.
- **Capabilities:** Optional title via `page.title` with `hide_title: true` to keep SEO title but suppress the visible `<h1>`; opt-out RSS link via `rss_subscribe: false`; bypasses sidebar for a distraction-free presentation.
- **Source:**
  - SCSS: — (uses `.page-heading`, `.rss-subscribe` from global typography)
  - Markup: `_layouts/home.html` (inherits `root.html`)
  - JS: —
- **API surface:** classes `.home`, `.page-heading`, `.rss-subscribe`; front matter `title`, `hide_title`, `rss_subscribe`
- **Tests:** Partially — `layouts.spec.js` "homepage exposes exactly one accessible h1" applies when `/` uses this layout; no test exercises `hide_title`/`rss_subscribe` toggles.
- **Gaps / improvement ideas:** The `hide_title` and `rss_subscribe:false` branches are untested. No automated check that the RSS link resolves to a valid `/feed.xml`.

### Index layout
- **Purpose:** A full-width fluid container intended for search/index/archive pages that need edge-to-edge content without the sidebar.
- **Capabilities:** `container-fluid` with responsive top/bottom padding; semantic `#search-index` wrapper; minimal structure to host search forms/results.
- **Source:**
  - SCSS: —
  - Markup: `_layouts/index.html` (inherits `root.html`)
  - JS: —
- **API surface:** id `#search-index`; classes `.container-fluid`, `.pt-5`, `.py-5`
- **Tests:** No automated tests target the index layout directly.
- **Gaps / improvement ideas:** Documented as a search-index layout but ships no search wiring of its own (search lives in the modal). The duplicate `pt-5 py-5` padding is redundant. Consider documenting/removing if effectively unused.

### Welcome layout
- **Purpose:** The first-run onboarding experience for freshly-installed remote-theme sites — shows a hero, a 3-file starter accordion, a config wizard, and next-step cards until the site is configured, then renders the user's content.
- **Capabilities:** Gating via `components/setup-check.html` (`site_needs_setup`); hero with "required/optional" file checklist and badges; Bootstrap accordion of `_config.yml`/`Gemfile`/`index.md` starters with syntax-highlighted snippets; embedded setup wizard (`setup/wizard.html`); next-steps cards; falls through to a centered content container once `site_configured`.
- **Source:**
  - SCSS: — (Bootstrap accordion/card/badge/alert utilities)
  - Markup: `_layouts/welcome.html`, `_includes/components/setup-check.html`, `_includes/setup/wizard.html`
  - JS: — (Bootstrap collapse/accordion bundle)
- **API surface:** ids `#minimal-starter`, `#setup-wizard`, `#starterAccordion`, `#starter-config`/`-gemfile`/`-index`; classes `.accordion`, `.accordion-item`, `.text-bg-*`, `.badge.rounded-pill`; config `site_configured`, plugin var `site_needs_setup`
- **Tests:** `test/visual/layouts.spec.js` — "welcome page has an h1 when present" (skips if `/welcome/` 404s; asserts ≥ 1 h1). Only the configured-or-unconfigured h1 presence is checked.
- **Gaps / improvement ideas:** The accordion interaction, wizard rendering, and the `site_needs_setup` gating branch are untested behaviorally. Next-step card links point to hardcoded GitHub README anchors that can rot. No reduced-motion or accessibility assertion on the accordion.

### Section include (components/section.html)
- **Purpose:** A reusable, token-aware section wrapper that standardizes vertical rhythm, container width, optional heading/lead block, and ARIA labelling across landing/content bands.
- **Capabilities:** Variants `default`/`muted`/`inverse`; spacing `tight`/`normal`/`loose` mapped to `--zer0-space-section`; configurable container class and heading level (2–6); auto-generated `id`+`-heading` and `aria-labelledby` (or `aria_label` override); heading/lead block skipped entirely when omitted so it can wrap pure content.
- **Source:**
  - SCSS: `_sass/layouts/_landing.scss` (`.zer0-section`, `--spacing-tight`, `--spacing-loose`)
  - Markup: `_includes/components/section.html`
  - JS: —
- **API surface:** classes `.zer0-section`, `.zer0-section--spacing-tight`, `.zer0-section--spacing-loose`, `.bg-body-tertiary` (muted), `.bg-primary.text-white` (inverse); params `id`, `variant`, `container`, `spacing`, `heading`, `heading_level`, `lead`, `aria_label`, `content`; CSS var `--zer0-space-section`
- **Tests:** No automated tests (no spec invokes the section component directly; the landing layout hand-rolls equivalent markup rather than calling this include).
- **Gaps / improvement ideas:** The landing layout does NOT use this component (its features/get-started sections inline the same structure), so the include is effectively unexercised — consider refactoring `landing.html` to call it, which would also bring test coverage. No test for the heading-level or aria-label override logic.

### Feature card include (components/feature-card.html)
- **Purpose:** Renders a single feature object from `_data/features.yml` as a Bootstrap card with icon, title, description, sub-feature list, id/version/tag badges, and optional docs/demo footer. Used by the features page and other registries — distinct from the landing layout's inline `.landing-feature-card`.
- **Capabilities:** Configurable border `style`, icon + icon color, `show_refs`, `compact` (hides sub-features), `features_limit`; renders `id`/`version`/tag badges; conditional `card-footer` with Documentation and Demo buttons.
- **Source:**
  - SCSS: `_sass/components/_ui-enhancements.scss` (`.card` hover lift, `.card-body i`/`.rounded-circle` icon animation, `.feature-categories .badge`)
  - Markup: `_includes/components/feature-card.html`
  - JS: —
  - Plugin/data: `_data/features.yml`
- **API surface:** classes `.card`, `.card-title`, `.card-text`, `.badge.bg-primary`/`.bg-secondary`/`.bg-light`, `.card-footer`, `.btn-outline-*`; params `feature`, `style`, `icon`, `icon_color`, `show_refs`, `compact`, `features_limit`
- **Tests:** `test/visual/ui-refresh.spec.js` — "feature category badges link to in-page anchors" exercises `.feature-categories a.badge[href^="#"]` on `/features/` (asserts the anchor target exists). The feature-card component's own structure/footer is not directly asserted.
- **Gaps / improvement ideas:** Note the naming collision: this `feature-card.html` is unrelated to the landing layout's `.landing-feature-card` (which is hand-coded). The `references` rendering branch (`show_refs`) and `compact` mode are untested. Demo-link guard `f.link != "/"` is brittle.

### CTA button include (components/cta-button.html)
- **Purpose:** A themed call-to-action `<a>` button used by the landing hero, normalizing variant/size, icon, relative-URL handling, and accessible external-link semantics.
- **Capabilities:** Variants `primary`/`secondary`/`outline`/`light`; sizes `sm`/`md`/`lg`; optional leading Bootstrap icon; smart URL handling (leaves absolute/`mailto:`/`tel:`/`#anchor` untouched, runs others through `relative_url`); `external` opens new tab with `rel="noopener noreferrer"` and a `visually-hidden` "(opens in a new tab)" cue; `aria_label` override.
- **Source:**
  - SCSS: — (Bootstrap `.btn-*` + the `.btn` ripple/hover polish; `.zer0-cta` has no dedicated rule)
  - Markup: `_includes/components/cta-button.html`
  - JS: `assets/js/ui-enhancements.js` (ripple), `assets/js/ui-enhancements.js` scroll-spy `.active` for `#anchor` CTAs
- **API surface:** classes `.btn`, `.zer0-cta` (marker only, unstyled), `.btn-primary`/`-secondary`/`-outline-light`/`-light`, `.btn-lg`/`-sm`; params `label`, `url`, `variant`, `size`, `icon`, `external`, `aria_label`
- **Tests:** `test/visual/layouts.spec.js` — "hero CTA buttons expose accessible names" asserts every `.landing-hero a.btn` has a non-empty accessible name (covers this component's output indirectly). No test targets `.zer0-cta` or the external-link cue.
- **Gaps / improvement ideas:** `.zer0-cta` is emitted but never styled — either a hook for future theming or dead markup; document or use it. The URL-normalization branches and the `external` visually-hidden cue are not directly asserted. Variant `outline` maps only to `btn-outline-light` (no dark/colored outline option).

### Info section / Settings offcanvas (components/info-section.html)
- **Purpose:** A unified right-side settings offcanvas with tabs for Settings, Environment, Developer, and Background — bundling search, theme toggle, build info, env switcher, breadcrumbs, dev shortcuts, page metadata, and background customization.
- **Capabilities:** Bootstrap offcanvas + nav-tabs with four panes; environment tab shows a Prod/Dev badge from `is_production`; collapsible "Theme & Build Info"; admin quick-links that render only when the target admin pages exist in the build (via `site.data.admin_page_urls` from a plugin); page-metadata table; embeds `searchbar`, `halfmoon`, `theme-info`, `env-switcher`, `breadcrumbs`, `dev-shortcuts`, `background-settings`.
- **Source:**
  - SCSS: — (Bootstrap offcanvas/tabs/table/badge utilities; table hover from `_ui-enhancements.scss`)
  - Markup: `_includes/components/info-section.html` (+ `env-detect`, `env-switcher`, `theme-info`, `halfmoon`, `dev-shortcuts`, `searchbar`, `background-settings`, `breadcrumbs`)
  - JS: Bootstrap bundle (offcanvas/tab/collapse)
  - Plugin/data: `_plugins/admin_page_urls.rb` → `site.data.admin_page_urls`
- **API surface:** ids `#info-section`, `#infoTabs`, `#settings-pane`/`#environment-pane`/`#developer-pane`/`#background-pane`, `#themeInfoCollapse`; classes `.offcanvas-end`, `.nav-tabs`, `.tab-pane`, `.list-group-flush`, `.table-sm.table-hover`; data-attributes `data-bs-toggle="tab|collapse|offcanvas"`, `data-bs-target`
- **Tests:** No automated tests target the info-section offcanvas (no spec opens it or asserts its tabs/admin-link gating).
- **Gaps / improvement ideas:** Entirely untested despite rich conditional logic (Prod/Dev badge, existence-gated admin links). No test that the offcanvas opens, that tabs switch, or that admin links only appear when pages exist. Accessibility of the tab roving-tabindex is unverified.

### Bootstrap component polish (UI enhancements)
- **Purpose:** A site-wide interaction/animation layer that elevates plain Bootstrap components — button ripple + hover lift, card hover lift with icon animation, hero/quick-links/feature-card entrance animations, and table/badge/link/form/code-block refinements.
- **Capabilities:** `.btn` ripple (CSS `::before` grow + JS-injected `.ripple` span), button translateY hover/active + `.btn-lg` sizing; `.card` translateY(-8px) hover with shadow and icon `scale/rotate`; hero `fadeInUp`/`fadeInRight` and image drop-shadow; `slideDown` quick-links; staggered `fadeInUp` for feature cards (`nth-child(1..3)`, matching the 3 shipped items); install-card top-border accent; table-row hover tint; badge hover scale + feature-category badge focus ring; link underline-on-hover; form-control focus glow + translateY; focus-visible outlines; smooth scroll with 80px navbar offset and `scroll-margin-top`; mobile/touch hover suppression + 44px tap targets; print optimizations.
- **Source:**
  - SCSS: `_sass/components/_ui-enhancements.scss`, `_sass/layouts/_global-chrome.scss`
  - Markup: applies globally to Bootstrap classes in all layouts/includes
  - JS: `assets/js/ui-enhancements.js` (ripples, scroll animations, image loading, scroll-spy), `assets/js/ui-helpers.js` (toast, clipboard, `data-copy`, hero fade-in)
- **API surface:** classes `.btn`, `.ripple`, `.card`, `.badge`, `.feature-categories`, `.table`, `.shadow-sm/.shadow/.shadow-lg` (overridden), `.animate-on-scroll`, `.nav-link.active`/`.btn.active`, `.loaded`; data-attributes `data-copy`; JS `window.zer0UI.showToast(message, {variant,duration})`, `window.zer0UI.copyToClipboard(text)`; keyframes `fadeInUp`/`fadeInRight`/`slideDown`/`ripple-animation`; CSS vars `--bs-primary(-rgb)`, `--bs-dark`, `--zer0-space-2`, `--zer0-layer-toast`
- **Tests:** `test/visual/ui-refresh.spec.js` — "intro action buttons share consistent height", "landing comparison table has toolbar and distinct header" (thead bg ≠ tbody bg), code-block header/copy tests, footer-link checks, axe advisory scans per viewport. No spec asserts the ripple element, card hover transform, badge hover, or the `window.zer0UI` toast/clipboard API.
- **Gaps / improvement ideas:** Heavy use of hardcoded `rgba(0,0,0,…)` shadows and `rgba(255,255,255,…)` ripple/gradient values instead of `--zer0-*` tokens — these do not adapt to dark mode (the rest of the system is token-driven). The global `.btn::before`/`.card:hover` transforms are unverified by tests and the JS ripple listener attaches to every `.btn` on load (no delegation; dynamically-added buttons miss it). `window.zer0UI.showToast`/`copyToClipboard` have no unit/behavioral test. `scroll-padding-top: 80px` is a magic number duplicated across rules.

### Share actions (LinkedIn/copy share)
- **Purpose:** Enhances LinkedIn share links and copy-share buttons by building a cleaned, de-duplicated article summary (title + description + excerpt + URL), copying it to the clipboard, and opening the LinkedIn share window — so users can paste a polished post.
- **Capabilities:** Extracts an excerpt from `[itemprop="articleBody"]`/`.bd-content`/`main`, normalizes whitespace, dedupes sections, truncates to a sentence ≤ 420 chars; async clipboard with graceful failure; opens share window then navigates; accessible `role="status"` toast notifications; binds via `.js-linkedin-share` and `.js-copy-share-link` with idempotency guards.
- **Source:**
  - SCSS: `_sass/components/_notes-index.scss` (`.share-buttons .btn-share` hover scale — note: separate Markup path)
  - Markup: `_includes/content/intro.html` (share dropdown), `_layouts/note.html` (`.btn-share.js-linkedin-share`)
  - JS: `assets/js/share-actions.js` (loaded non-deferred from `_includes/components/js-cdn.html`)
- **API surface:** classes `.js-linkedin-share`, `.js-copy-share-link`, `.btn-share`, `.share-buttons`; data-attributes `data-share-title`, `data-share-description`, `data-share-url`, `data-copy-text`, `data-copy-success`, `data-linkedin-share-bound`, `data-copy-bound`; no exported window namespace
- **Tests:** No automated tests (no spec triggers a `.js-linkedin-share`/`.js-copy-share-link` click or asserts clipboard/excerpt behavior).
- **Gaps / improvement ideas:** Excerpt extraction, dedupe, and sentence truncation are non-trivial pure functions with zero unit coverage — ideal candidates for a fast jsdom/unit test. Uses its own `notify()` toast (`z-index:1085`, hardcoded) instead of the shared `window.zer0UI.showToast` — duplicate notification systems should be consolidated. `openShareWindow` is called with two args but only accepts one (the `'_blank'` is ignored). The `.btn-share` SCSS border color `#dee2e6` is hardcoded, not dark-mode-safe.

### Skeleton loader
- **Purpose:** A token-aware shimmer placeholder for loading states that stays visible in both light and dark color modes.
- **Capabilities:** Animated 200%-width gradient between elevated and muted surface tokens; infinite 1.5s `zer0-skeleton-shimmer`; rounded corners and a `min-height: 1em` so empty placeholders have size.
- **Source:**
  - SCSS: `_sass/components/_skeleton.scss`
  - Markup: — (no include/layout currently emits `.skeleton`)
  - JS: —
- **API surface:** class `.skeleton`; keyframes `zer0-skeleton-shimmer`; CSS vars `--zer0-color-bg-elevated`, `--zer0-color-bg-muted`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** The `.skeleton` class is defined but used by no markup or JS in the repo — it is an orphaned utility shipped for consumers. Either document it as a public utility (with usage examples) or wire it into a real loading state (e.g., search results, lazy images) to justify its inclusion. No reduced-motion guard on the infinite shimmer animation (relies on the global motion reset).

### Particles hero background
- **Purpose:** An interactive canvas particle animation (particles.js fork) intended as a decorative hero/landing background.
- **Capabilities:** `particlesJS.load('particles-js', '/assets/particles.json', cb)` loader; full particles.js engine (circle/edge/triangle/polygon/star/image shapes, line-linking, hover grab/repulse/bubble, click push/remove, retina detection, density auto-particles, resize handling).
- **Source:**
  - SCSS: —
  - Markup: — (no layout/include renders `id="particles-js"`; only referenced in `_layouts/README.md` docs and `_data/features.yml`)
  - JS: `assets/js/particles.js` (loader call), `assets/js/particles-source.js` (engine; exposes `window.particlesJS`, `window.pJSDom`)
  - Plugin/data: `assets/particles.json` (config), `_data/features.yml` (documented feature entry)
- **API surface:** id `#particles-js` (expected container, not present); JS `window.particlesJS(id, config)`, `window.particlesJS.load(id, jsonPath, cb)`, `window.pJSDom`, `Object.deepExtend`, `window.requestAnimFrame`; no CSS vars
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** Fully orphaned in the current theme — neither script is loaded by any layout/include (`js-cdn.html`/`head.html` do not reference them), and no element with `id="particles-js"` exists, so `particles.js` would throw on a `null` container if ever loaded. The config (`particles.json`) and engine are dead weight unless re-wired. The fork has no reduced-motion respect (continuous animation) and the hover/click listeners run unconditionally — accessibility and battery concerns if revived. Decide: remove, or formally wire behind an opt-in landing flag with a reduced-motion guard.

---

## Theming: Tokens, Color Modes, Skins & Customizers

The theme's appearance is a four-layer system: a `--zer0-*` design-token base (aliased onto Bootstrap `--bs-*` / accent `--bd-*` vars), three `data-bs-theme` color modes (light/dark/wizard), nine named `data-theme-skin` palettes that re-wire Bootstrap components and SVG backgrounds, and a set of admin-page customizers (appearance panel, background customizer, palette generator, skin editor, theme/preview galleries) that mutate CSS variables at runtime and export YAML for `_config.yml`.

### Design Tokens (`--zer0-*` layer)
- **Purpose:** Single source of truth for color, spacing, typography, shadow, motion, breakpoint, and z-index decisions, exposed as `--zer0-*` CSS custom properties that default to Bootstrap/`--bd-*` values so existing styling keeps working.
- **Capabilities:** Semantic color roles (primary/secondary/accent/state/surfaces/ink/border/code/link) with `color-mix` translucent border; Bootstrap-mirrored spacing scale 0–5 plus FAB/sidebar/layout vars; fluid `clamp()` heading scale + font families/weights/line-heights; purpose-named shadow scale incl. `--zer0-shadow-fab`/`--zer0-shadow-focus`; motion durations/easings that collapse to `0.01ms` under `prefers-reduced-motion`; breakpoint px values for JS/inline use (not usable in `@media`); ordered z-index/layer scale for FABs, overlays, toasts, skip-link.
- **Source:**
  - SCSS: `_sass/tokens/_index.scss` (barrel), `_color.scss`, `_spacing.scss`, `_typography.scss`, `_shadow.scss`, `_motion.scss`, `_breakpoints.scss`, `_layers.scss`
  - Markup: — (consumed by all `_includes`/`_layouts` via compiled `assets/css/main.css`)
  - JS: — (read at runtime by appearance/customizer modules)
- **API surface:** CSS vars `--zer0-color-{primary,primary-rgb,secondary,accent,success,info,warning,danger,bg,bg-elevated,bg-muted,ink,ink-muted,border,border-translucent,code-bg,code-ink,link,link-hover}`; `--zer0-space-{0..5,section,container-x,fab-offset,fab-size,fab-gap}`, `--zer0-sidebar-width`, `--zer0-sidebar-toc-width`, `--zer0-layout-max-width-{xl,xxl}`; `--zer0-font-{sans,mono,weight-*}`, `--zer0-text-{base,sm,lg,h1..h6}`, `--zer0-leading-{tight,normal,loose}`; `--zer0-shadow-{xs,sm,md,lg,fab,focus}`; `--zer0-motion-{duration-fast/base/slow,ease-standard/in/out}`; `--zer0-bp-{sm,md,lg,xl,xxl}`; `--zer0-layer-{base,elevated,sticky,header,backdrop,fab-*,offcanvas,modal,popover,tooltip,toast,cookie-banner,skip-link}`
- **Tests:** `test/visual/styling.spec.js` — "`--zer0-color-primary` resolves on `:root`" (non-empty computed value) and "`--zer0-bp-lg` resolves to a pixel value" (matches `/^\d+px$/`); "Bootstrap exposes CSS variables on :root" asserts `--bs-primary` non-empty. Only color-primary and bp-lg of the whole token set are asserted; spacing/typography/shadow/motion/layer tokens untested.
- **Gaps / improvement ideas:** No test asserts `--bd-*`→`--zer0-*` aliasing actually resolves (e.g. `--zer0-color-code-ink`), nor that motion tokens collapse under reduced-motion. Breakpoint tokens duplicate `--bs-breakpoint-*` and the JS nav config — drift risk with no synchronization test. Consider a contract test enumerating every documented `--zer0-*` token and asserting it resolves on `:root`.

### Runtime Token Injection (`tokens-inline.html`)
- **Purpose:** Emits an in-`<head>` `<style>` + inline script that overrides `--zer0-color-*` tokens from `_config.yml` `theme_color` at compile time and restores user Appearance-panel overrides from `localStorage` before first paint (no flash of default palette).
- **Capabilities:** Conditionally emits only the `theme_color` keys present (main→primary, secondary, red→danger, yellow→warning, green→success, teal→info, blue→link, purple→accent); pre-paint script reads `localStorage["zer0-appearance"]` JSON and sets `--zer0-color-{primary,secondary,accent}` on `documentElement`; wrapped in try/catch for private-mode/quota safety.
- **Source:**
  - SCSS: —
  - Markup: `_includes/core/tokens-inline.html`
  - JS: inline `<script>` in the include (pairs with `assets/js/modules/theme/appearance.js`)
  - Plugin/data: `_config.yml` `theme_color`
- **API surface:** `<style id="zer0-tokens-inline">`; localStorage key `zer0-appearance` (`{primary,secondary,accent}`); writes CSS vars `--zer0-color-{primary,secondary,accent}`; Liquid `site.theme_color.{main,secondary,red,yellow,green,teal,blue,purple}`
- **Tests:** No automated tests. (`theme-colors.spec.js` covers the customizer YAML, not this config→token bridge or the pre-paint restore.)
- **Gaps / improvement ideas:** No test verifies that a configured `theme_color.main` actually overrides `--zer0-color-primary`, nor that the pre-paint localStorage restore runs before main.css (the core anti-flash guarantee). Key-name mapping (red→danger etc.) is undocumented in the UI and easy to mis-set. JSON-parse failure is silently swallowed — no console signal for debugging a corrupt pref.

### Color Modes (light / dark / wizard)
- **Purpose:** Bootstrap `data-bs-theme` color-scheme switching that retones `--bs-*`/`--bd-*` accent tokens for light, dark, and a custom blue "wizard" mode; user-selectable via the halfmoon dropdown (light/dark/auto), with wizard set via config/programmatically.
- **Capabilities:** `--bd-*` accent tokens (violet/purple/accent/toc/sidebar/callout/pre-bg) differ per light vs dark; wizard mode overrides body bg/color to blue + retones dropdowns and `.btn-secondary` using Sass color math; halfmoon toggle persists `localStorage["theme"]`, honors `prefers-color-scheme` for auto, updates active icon + `aria-pressed` + `aria-label`; Mermaid treats `wizard` like `dark`.
- **Source:**
  - SCSS: `_sass/theme/_color-modes.scss` (barrel), `_css-variables.scss` (`--bd-*` light/dark), `_wizard-mode.scss`
  - Markup: `_includes/components/halfmoon.html` (light/dark/auto dropdown), `_includes/components/mermaid.html` (wizard→dark)
  - JS: `assets/js/halfmoon.js`, `assets/js/modules/theme/appearance.js` (its own light/dark/auto button group)
- **API surface:** attributes `data-bs-theme="light|dark|wizard"`, `data-bs-theme-value`; localStorage `theme`; classes `.bd-theme-dropdown`/`.bd-theme-menu`; ids `#bd-theme`, `#bd-theme-text`; CSS vars `--bd-{purple,violet,accent,violet-rgb,accent-rgb,pink-rgb,teal-rgb,violet-bg,toc-color,sidebar-link-bg,callout-link,callout-code-color,pre-bg}`, plus `--bs-body-*`/`--bs-dropdown-*`/`--bs-btn-*` under wizard
- **Tests:** No dedicated mode-toggle spec. Indirect: `skins.spec.js` "skin restores after navigation" and the dark/contrast snapshots exercise dark surfaces; `theme-preview.js` reports resolved mode. No test asserts halfmoon click sets `data-bs-theme`, persists `localStorage["theme"]`, or that wizard mode renders.
- **Gaps / improvement ideas:** Wizard mode is defined in SCSS and read by Mermaid but is **not selectable from any UI** (halfmoon offers only light/dark/auto) — either expose it or document it as config-only. Two independent color-mode UIs (halfmoon dropdown vs appearance.js button group) both write `localStorage["theme"]` and can desync visually. No a11y/behavioral test for the toggle. `--bd-callout-link` is an RGB triin light/dark but consumed inconsistently.

### Named Skins (the 9 `data-theme-skin` palettes)
- **Purpose:** Nine named palettes (air/aqua/dirt/neon/mint/plum/sunrise + dark/contrast for backgrounds) that re-wire Bootstrap components and `--zer0-color-*` tokens plus SVG backgrounds, applied via a `data-theme-skin` attribute on `<html>`.
- **Capabilities:** `zer0-skin-palette` Sass mixin sets primary/accent/link tokens with WCAG-AA-tuned light & dark link colors, `color-mix` button hover/active and elevated-surface tints, focus ring, and component overrides (`.btn-primary`/`.btn-outline-primary`/`.alert-primary`/`.nav-tabs`/`.card`/`.list-group`/form-controls/pagination/breadcrumb/progress/`pre`/navbar/`.text-primary`/`.border-primary`/`.link-primary`); dark-mode link overrides nested under `&[data-bs-theme="dark"]`; runtime switching + localStorage persistence (see Background Customizer JS).
- **Source:**
  - SCSS: `_sass/theme/_skins.scss` (mixin + 7 palettes), `_sass/theme/_backgrounds.scss` (9 background sets)
  - Markup: applied on `<html data-theme-skin>` (server-rendered from `site.theme_skin`)
  - JS: `assets/js/background-customizer.js` (`zer0Bg.setSkin`)
  - Plugin/data: `_data/theme_skins.yml` (order + default), `_data/theme_backgrounds.yml` (per-skin colors/assets)
- **API surface:** attribute `data-theme-skin="air|aqua|contrast|dark|dirt|neon|mint|plum|sunrise"`; CSS vars `--zer0-color-{primary,primary-rgb,accent,border,link,link-hover,bg-elevated,bg-muted}`, `--bs-{primary,primary-rgb,link-color,link-hover-color}`, `--zer0-shadow-focus`; SCSS `@mixin zer0-skin-palette($brand,$brand-rgb,$accent,$accent-rgb,$link-light,$link-light-hover,$link-dark,$link-dark-hover)`
- **Tests:** `test/visual/skins.spec.js` — per-skin (all 9 from `fixtures.SKINS`): "sets `data-theme-skin` attribute", "persists skin to localStorage", "skin restores after navigation" (poll on `/faq/`), "homepage visual snapshot" (`homepage-<skin>.png`, `maxDiffPixels:150`); plus "`zer0Bg.currentSkin()` returns active skin" and "skin-change event fires with correct detail". Snapshots committed in `skins.spec.js-snapshots/homepage-*-chromium-linux.png`. Asserts attribute/persistence/visual but not per-component token values or contrast.
- **Gaps / improvement ideas:** **Inconsistency**: `_skins.scss` defines UI palettes for only 7 skins (no `contrast`, no `dark`), yet `_backgrounds.scss` and the customizer offer 9 — `contrast`/`dark` get SVG backgrounds but inherit default Bootstrap component colors. **Default-skin drift**: `theme_skins.yml` default is `air` and lists 7 skins, but `background-customizer.js`/`theme-customizer.js` fall back to `dark`, and the customizer/background includes hardcode a 9-string list — three sources of truth. No automated WCAG-contrast assertion despite carefully annotated AA ratios in the SCSS comments. Snapshots are linux-only (CI), so local runs can't compare baselines.

### Appearance Panel (`appearance.js`)
- **Purpose:** Opt-in runtime panel (inside the Settings offcanvas) for choosing color mode (light/dark/auto) and a custom primary color that overrides `--zer0-color-primary` live across the whole theme.
- **Capabilities:** Color-mode button group writing `data-bs-theme` + `localStorage["theme"]` (halfmoon-compatible); debounced `<input type=color>` primary picker persisting to `localStorage["zer0-appearance"]` and live-setting the token; Reset-to-defaults; robust hex coercion of arbitrary CSS colors (3/6-digit hex, rgb/rgba via a probe element); mounts into `[data-appearance-panel-host]` or `#info-section .offcanvas-body`; XSS-safe (never interpolates stored data into innerHTML).
- **Source:**
  - SCSS: `_sass/components/_theme-preview.scss` (`.zer0-appearance-panel` reset inside preview host)
  - Markup: injected into Settings offcanvas; gated by `site.appearance_panel`
  - JS: `assets/js/modules/theme/appearance.js`
- **API surface:** classes `.zer0-appearance-panel`; ids `#zer0-appearance-heading`, `#zer0-appearance-primary`; data-attrs `data-mode`, `data-appearance-panel-host`, `data-appearance-reset`; localStorage `zer0-appearance` (`{primary,secondary,accent}`) + `theme`; CSS var `--zer0-color-primary`; `aria-pressed`/`aria-labelledby`/`aria-describedby`
- **Tests:** No automated tests. (No spec mounts the appearance panel or asserts primary-color live override / mode persistence.)
- **Gaps / improvement ideas:** Entirely untested despite touching global tokens and localStorage. `writePrefs` stores `secondary`/`accent` (and `tokens-inline.html` restores them) but the panel UI only exposes `primary` — dead capability or missing controls. No visible feedback when localStorage is unavailable. Should have a behavioral test for: picker → `--zer0-color-primary` change, reset clears it, mode buttons sync `aria-pressed`.

### Background Customizer (`zer0Bg` API + panels)
- **Purpose:** Runtime engine and offcanvas/tab UI for switching the active skin, toggling fffuel-style layered SVG backgrounds on/off, and tuning gradient/texture/pattern opacity — all persisted to localStorage.
- **Capabilities:** `zer0Bg.setSkin/toggle/setOpacity/currentSkin` global API; restores skin + bg-enabled on load from localStorage (falls back to server attr, default `dark`); dispatches `zer0:skin-change` / `zer0:bg-toggle` events; CSS-driven layered `::before`/`::after` gradient+noise+pattern with per-skin asset URLs and `mix-blend-mode`; `[data-zer0-bg="off"]` kill switch; reduced-motion guard; two UI surfaces (floating-button offcanvas + Settings-tab variant) with skin buttons, enable switch, 3 opacity sliders, reset; config-driven opacity/blend override via `svg-background.html`.
- **Source:**
  - SCSS: `_sass/theme/_backgrounds.scss`, `_sass/theme/_background-mixins.scss`
  - Markup: `_includes/components/background-customizer.html`, `background-settings.html`, `svg-background.html`
  - JS: `assets/js/background-customizer.js`
  - Plugin/data: `_data/theme_backgrounds.yml`, `_config.yml` `theme_background`
- **API surface:** `window.zer0Bg.{setSkin(name),toggle(force?),setOpacity(layer,value),currentSkin()}`; events `zer0:skin-change`{skin}, `zer0:bg-toggle`{enabled}; attributes `data-theme-skin`, `data-zer0-bg="on|off"`, `data-skin`; localStorage `zer0-theme-skin`, `zer0-bg-enabled`; CSS vars `--zer0-bg-{gradient,pattern,noise,gradient-opacity,texture-opacity,pattern-opacity,blend,pattern-size,enabled}`; SCSS mixins `zer0-bg-{gradient,noise,pattern,layered}`; classes `.zer0-bg-{hero,body,surface,footer}`; ids `#zer0BgCustomizer`, `#zer0SkinButtons`, `#zer0BgToggle`, `#zer0{Gradient,Texture,Pattern}Opacity`, `#zer0BgReset`
- **Tests:** `test/visual/backgrounds.spec.js` — "toggle off/on sets `data-zer0-bg`", "toggle persists to localStorage" (`zer0-bg-enabled`), "bg-toggle event fires with correct detail", three "setOpacity(...) updates CSS variable" (gradient/texture/pattern, `toBeCloseTo`), "background state persists across navigation" (`/faq/`). Skin persistence covered in `skins.spec.js`. Tests assert API/attribute/var/persistence/events; the offcanvas/slider DOM wiring and visual layering are untested.
- **Gaps / improvement ideas:** The two near-identical include scripts (`background-customizer.html` vs `background-settings.html`) duplicate ~50 lines of slider/reset logic and both bind `#zer0SkinButtons`/`#zer0BgToggle` by shared ids — rendering both on one page would double-bind. `setOpacity` accepts the public layer name `texture` but no validation/logging when an unknown layer is passed. `--zer0-bg-enabled` CSS var exists but is unused (toggle uses the `[data-zer0-bg]` attribute). No test for the include UI controls or the `svg-background.html` config override.

### Palette Generator (`palette-generator.js`)
- **Purpose:** chroma.js-powered color-harmony generator and live Bootstrap CSS-variable editor on the Theme Customizer admin page, with WCAG contrast badges and combined YAML export.
- **Capabilities:** Six harmony algorithms (complementary/analogous/triadic/split-complementary/tetradic/monochromatic) + base-color scale; click-to-copy swatches with contrast ratio/AA-AAA labels; random base color; live editor for ~17 `--bs-*` vars (colors + sizing/typography ranges) writing to `documentElement` with auto `-rgb` variants; "apply palette" maps generated colors to semantic Bootstrap vars; reset-live; `window.rebuildFullYaml()` builds quoted `theme_skin`+`theme_color` YAML; re-reads computed styles on `data-bs-theme` change via MutationObserver; per-field stable ids with `<label for>` for a11y.
- **Source:**
  - SCSS: —
  - Markup: rendered into the Theme Customizer page (`/about/settings/theme/`), `_includes/components/theme-preview-gallery.html` adjacent
  - JS: `assets/js/palette-generator.js` (requires global `chroma`)
- **API surface:** `window.rebuildFullYaml()`; data-attrs `data-palette-color`, `data-live-var`, `data-live-text`, `data-live-val`, `data-unit`; ids `#palette-swatches`, `#palette-base-color`, `#palette-base-text`, `#palette-harmony`, `#palette-random`, `#palette-apply`, `#live-editor-fields`, `#live-reset`, `#theme-yaml-output`; live-edited vars `--bs-{primary,secondary,success,info,warning,danger,(+-rgb),body-bg,body-color,tertiary-bg,border-color,link-color,link-hover-color,border-radius,border-width,body-font-size,body-font-weight,body-line-height}`
- **Tests:** `test/visual/theme-colors.spec.js` — "page loads 200", "color picker inputs have valid #RRGGBB", "color picker change updates paired text input" (Color Editor tab), "YAML export quotes hex color values" (T-008 regression: every hex line must be quote-wrapped). Harmony algorithms, live `--bs-*` application, apply/reset, and contrast badges are not directly asserted (tests are tolerant/skip when elements absent).
- **Gaps / improvement ideas:** Harmony output and the live-editor→`--bs-*` application are untested — only YAML quoting and picker↔text sync are. `rebuildFullYaml` emits layout overrides as commented-out lines (`# border_radius:`), so range edits never round-trip into usable config. Hard dependency on global `chroma`; failure path only `console.warn`s. Two YAML builders (`theme-customizer.js` fallback and this) must stay quote-consistent — covered by one regression test but fragile.

### Skin Editor (`skin-editor.js`)
- **Purpose:** Colorffy-inspired editor on the Theme Customizer page for editing the 9 built-in skins or authoring custom ones by adjusting 3 gradient stops + SVG turbulence filter params, with live preview, auto-generated palettes, and SVG/CSS export.
- **Capabilities:** Built-in skin defs (stops + feTurbulence freq/oct/seed/scale/opacity + patternSize); live gradient/pattern SVG generation applied to `--zer0-bg-*`; chroma.js palettes (gradient scale, per-stop tints, surface, tonal surface, semantic success/warning/danger/info) with WCAG badges; save/delete custom skins to `localStorage["zer0-custom-skins"]`; random skin; reset to built-in (via `zer0Bg.setSkin`); export SVG files / copy CSS; toast feedback; re-syncs on `zer0:skin-change`; exposes `window.skinEditor`.
- **Source:**
  - SCSS: — (uses inline styles + Bootstrap utilities)
  - Markup: `pages/_about/settings/theme.md` (`#pane-skin-editor`, `#skin-editor-*` hosts)
  - JS: `assets/js/skin-editor.js` (requires global `chroma`; integrates `zer0Bg`)
- **API surface:** `window.skinEditor.{applyLive,resetLive,getState,BUILTIN_SKINS}`; ids `#pane-skin-editor`, `#skin-editor-{select,stops,preview,palettes,filters,save,delete,random,reset,apply,export-svg,export-css,toast}`, `#stop-{color,text,hex,preview}-{0..2}`, `#filter-{freq,oct,seed,scale,opacity,patternSize}`; localStorage `zer0-custom-skins`; CSS vars `--zer0-bg-{gradient,pattern,pattern-size}`; listens `zer0:skin-change`
- **Tests:** No automated tests. (No spec loads `#pane-skin-editor`; the skins specs use the runtime `zer0Bg` API, not this editor.)
- **Gaps / improvement ideas:** Entirely untested (largest theming JS file, ~28 KB). Builds swatch/scale HTML with inline `onclick="navigator.clipboard.writeText('<hex>')"` — brittle and CSP-unfriendly; prefer delegated listeners. Custom skins only override `--zer0-bg-*` (backgrounds), not the `--zer0-color-*` component palette, so a saved custom skin won't retint buttons/links like the built-ins. `BUILTIN_SKINS` stops are a 4th copy of skin colors (alongside `_skins.scss`, `_backgrounds.scss`, `theme_backgrounds.yml`). Save uses `prompt()`/`confirm()` (no UI test hook). No persistence of custom skins into the live `zer0Bg` skin list.

### Theme Customizer & Preview Gallery (admin UI)
- **Purpose:** The admin-page UI shell — a skin-card preview grid, a quick-select/mode controls bar, a full component preview gallery (style guide), and a compact theme/build info panel — that ties the runtime APIs together and drives YAML export.
- **Capabilities:** `theme-customizer.html` skin-card grid (gradient swatch + 3 color dots, keyboard-activatable) driven by `theme-customizer.js` (card/quick-bar click → `zer0Bg.setSkin`, highlight sync, YAML rebuild, copy/download `theme-config.yml`); `theme-controls-bar.html` embeds halfmoon mode toggle + `#quickSkinBar`; `theme-preview-gallery.html` renders Bootstrap components (typography/buttons/alerts/forms/etc.) for live skin/mode visual testing with section TOC + status readout via `theme-preview.js`; `theme-info.html` shows theme/Jekyll/env/build/repo + quick links.
- **Source:**
  - SCSS: `_sass/components/_theme-preview.scss`
  - Markup: `_includes/components/theme-customizer.html`, `theme-controls-bar.html`, `theme-preview-gallery.html`, `theme-info.html`; `pages/_about/settings/theme.md`, `.../theme-preview.md`
  - JS: `assets/js/theme-customizer.js`, `assets/js/theme-preview.js`
  - Plugin/data: `_data/theme_skins.yml`, `_data/theme_backgrounds.yml`
- **API surface:** classes `.skin-card`, `.theme-preview-{gallery,section,heading,toc,navbar,footer}`, `.theme-controls-bar`, `.theme-info-compact`; data-attrs `data-skin`, `data-quick-skin`, `data-color-key`, `data-color-text`, `data-bs-theme-value`; ids `#skin-grid`, `#quickSkinBar`, `#theme-yaml-output`, `#theme-copy-yaml`, `#theme-download-yaml`, `#theme-preview-active-{skin,mode}`, `#theme-preview-gallery`; events `zer0:skin-change`; CSS vars consumed `--zer0-space-5`, `--zer0-color-{border,bg-muted}`
- **Tests:** `test/visual/theme-colors.spec.js` exercises this page (`/about/settings/theme/`) — load 200, color pickers valid, picker↔text sync, YAML quoting; `theme-customizer.js`'s `rebuildYaml` fallback is the quoting code under test (T-008). `ADMIN_PAGES` in `fixtures.js` lists the Theme Customizer/Preview routes (used by admin-nav specs elsewhere). The card-grid click→skin apply, gallery rendering, and copy/download buttons are not directly asserted.
- **Gaps / improvement ideas:** Skin-source inconsistency surfaces here: `theme-customizer.html` iterates `theme_skins.yml.order` (7), but `theme-customizer.js`/`theme-preview.js` fall back to `'dark'` (not in that list) — UI can show a skin with no card. `theme-customizer.js` `updateSkinCardUI` rewrites footer via `outerHTML` (drops listeners/ids) — fragile. Copy/download buttons and keyboard activation of cards are untested. The gallery's note that Appearance/`theme_color` overrides may beat skin tokens is real precedence complexity with no test. Consider a single canonical skin manifest consumed by SCSS, JS, includes, and tests.

---

## Content & Collections

The components that render long-form and reference content in zer0-mistakes — note/notebook/article/collection/news/tag layouts, their index grids and difficulty badges, plus the supporting building blocks (callouts, post navigation, code copy + syntax highlighting, author/post/feature cards, preview images, comments, share actions, and client-side pagination).

### Note layout
- **Purpose:** Displays quick notes / cheatsheets / TILs with a compact, scannable header and metadata, related-by-tag notes, and prev/next navigation. Targets `_notes` collection items.
- **Capabilities:** compact header (author, date, reading-time computed at 200 wpm, last-modified); difficulty badge (`bg-success`/`bg-warning`/`bg-danger`); tag + category badge links; lead description; share buttons (X / LinkedIn via share-actions.js / email); related notes (up to 3, tag-overlap match); Giscus comments (gated `comments != false and site.giscus.enabled`); backlinks panel (`content/backlinks.html`); date-sorted prev/next pagination; Schema.org `Article` JSON-LD + microdata + microformats (`h-entry`, `p-name`, `dt-published`).
- **Source:**
  - SCSS: `_sass/components/_notes.scss`, difficulty badges in `_sass/components/_notes-index.scss`
  - Markup: `_layouts/note.html` (inherits `_layouts/default.html` → `root.html`)
  - JS: `assets/js/share-actions.js` (LinkedIn enhancement), `assets/js/code-copy.js`, `assets/js/table-copy.js`
  - Plugin/data: `_includes/content/backlinks.html`, `_includes/content/giscus.html`, `_data/authors.yml`
- **API surface:** classes `.note-article`, `.note-header`, `.note-title`, `.note-meta`, `.note-description`, `.note-content`, `.note-footer`, `.related-notes`, `.note-navigation`, `.reading-time`; `.js-linkedin-share` with `data-share-url`/`data-share-title`/`data-share-description`; CSS vars `--zer0-color-border`, `--zer0-color-ink-muted`, `--zer0-text-h2`, `--zer0-space-*`, `--zer0-shadow-md`, `--zer0-motion-*`. Front matter: `difficulty`, `share`, `comments`, `lastmod`, `tags`, `categories`.
- **Tests:** No automated tests directly target `note.html` (no `/notes/<slug>` spec). `test/visual/accessibility.spec.js` "code copy buttons are keyboard focusable" / "table CSV export button has accessible name" cover the `.note-content`-scoped enhancements only via generic content scopes. No shell suite.
- **Gaps / improvement ideas:** Untested layout entirely (single-H1, related-notes correctness, prev/next ordering). `.note-navigation .nav-link-note` styles exist in SCSS but the layout actually renders Bootstrap `.pagination`/`.page-link` markup — dead/mismatched CSS. Related-notes loop iterates `site.notes` in collection order while only checking `related_count < 3` inside the tag-match branch, so ordering is non-deterministic. Difficulty values map to color via inline `{% case %}` in the layout but `.badge-beginner/intermediate/advanced` classes (from `_notes-index.scss`) are never applied here — inconsistent with the index grid.

### Notebook layout
- **Purpose:** Renders Jupyter notebooks (`_notebooks` collection) converted to HTML, with kernel metadata, MathJax math, a download-original link, and related-by-tag notebooks.
- **Capabilities:** header (author, date, reading time, last-modified, "Jupyter Notebook" kernel marker when `jupyter_metadata` present); tag + category links; download original `.ipynb` (raw.githubusercontent URL built from `site.repository`/`site.branch`/`page.slug`); share buttons (X / LinkedIn / email — note: plain links, no share-actions enhancement); related notebooks (up to 3); Giscus comments; prev/next pagination; print + dark-mode styles; Schema.org `TechArticle` JSON-LD.
- **Source:**
  - SCSS: `_sass/notebooks.scss` (root partial, not under components)
  - Markup: `_layouts/notebook.html`
  - JS: `assets/js/code-copy.js`, MathJax (loaded in `_includes/core/head.html`)
  - Plugin/data: `_includes/content/giscus.html`, `_data/authors.yml`
- **API surface:** classes `.notebook-article`, `.notebook-header/-title/-meta/-description/-content/-footer/-navigation`, `.download-notebook`, `.related-notebooks`, plus Jupyter hooks `.jp-OutputArea`/`.output-area`/`.cell-output`, `.jp-Cell`/`.cell`, `.input-prompt`/`.output-prompt` (CSS `::before`/`::after` "In […]:" labels), `.MathJax_Display`. Mostly Bootstrap `--bs-*` vars (not `--zer0-*` tokens).
- **Tests:** No automated tests. Not in `UI_ROUTES`; no spec visits a notebook page.
- **Gaps / improvement ideas:** Styling uses raw `--bs-*` and hardcoded `rgba(0,0,0,.1)` shadows / `prefers-color-scheme` media query instead of the `--zer0-*` token system + `[data-bs-theme="dark"]` used elsewhere — dark mode won't follow the manual theme toggle, only OS preference. `.input-prompt`/`.output-prompt`/`.jp-*` classes assume nbconvert output that Jekyll's markdown pipeline does not emit, so most of this CSS is likely inert. Download link hardcodes the `pages/_notebooks/` path. LinkedIn share lacks the cleaned-summary enhancement that note/article get.

### Notes & Notebooks index grids + difficulty badges
- **Purpose:** Card-grid landing pages listing all notes (`/notes/`) and notebooks (`/notebooks/`) with client-side tag/difficulty filtering and difficulty badges.
- **Capabilities:** responsive `row-cols` card grid; filter button bar (notes: by tag; notebooks: by difficulty) toggling `display` via inline `<script>`; difficulty badge (inline Liquid color map); hover lift (`translateY(-4px)` + shadow); notebooks grid cards have a blue `border-left`; fade-out transition when `display:none`.
- **Source:**
  - SCSS: `_sass/components/_notes-index.scss` (`#notes-grid`, `#notebooks-grid`, `.badge-beginner/intermediate/advanced`, `.share-buttons`)
  - Markup: `pages/notes.md`, `pages/notebooks.md` (both `layout: default`, grids + filter JS inline)
- **API surface:** ids `#notes-grid`, `#notebooks-grid`; classes `.note-card`, `.notebook-card`, `.badge-beginner`, `.badge-intermediate`, `.badge-advanced`; data-attributes `data-filter`, `data-tags` (notes), `data-difficulty` (notebooks); CSS vars `--zer0-color-success/warning/danger` (with Bootstrap hex fallbacks). Difficulty default `intermediate` (notebooks only).
- **Tests:** No automated tests. `UI_ROUTES.notes` (`/notes/`) is defined in fixtures but no spec asserts against the grid, filters, or badges.
- **Gaps / improvement ideas:** Filtering logic is duplicated inline in two pages instead of a shared module; no debounce/empty-state-after-filter, no `aria-pressed`/`aria-controls` on filter buttons (a11y gap), and filtered-out cards remain in the tab/AX tree (`display:none` is used, which is fine, but no announce). `.badge-beginner` etc. classes are defined but the index markup uses `bg-success/warning/danger` directly — the dedicated badge classes are effectively unused. Notes filter does substring `tags.includes(filter)` which can mis-match overlapping tag names. No tests guard the difficulty color mapping or filter behavior.

### Callout
- **Purpose:** Bootstrap-docs-style info/note/warning/tip/danger aside block for use inside Markdown via `{% include %}`, with semantic colors driven by design tokens.
- **Capabilities:** five types (`note` default, `tip`, `info`, `warning`, `danger`) each mapping to an icon + token color; optional title; icon override; grid layout (icon + body); per-type color injected inline as `--zer0-callout-color`; `role="note"` aside; dark-mode-safe via tokens (no per-type CSS needed).
- **Source:**
  - SCSS: `_sass/components/_callout.scss`
  - Markup: `_includes/components/callout.html`
- **API surface:** classes `.zer0-callout`, `.zer0-callout--{type}`, `.zer0-callout__icon`, `.zer0-callout__body`, `.zer0-callout__title`, `.zer0-callout__content`; CSS var `--zer0-callout-color` (set inline to `var(--zer0-color-success|info|warning|danger|primary)`); include params `type`, `title`, `icon`, `content`. Renders `<aside role="note">`.
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** No visual or a11y spec exercises the five color variants or token wiring. `content` must be pre-rendered markup (Liquid `capture`), which is awkward for authors; no Markdown-native syntax (the Obsidian callout path is separate). Icon is `aria-hidden` but the type itself (e.g. "warning") is not announced — consider a visually-hidden type label. No test that `--zer0-callout-color` resolves per type.

### Post navigation (prev/next cards)
- **Purpose:** Previous/next article navigation rendered as two elevated, hover-lifting cards at the foot of an article. Pairs with the `post-navigation` block in `article.html`.
- **Capabilities:** card affordance with token shadow/border; hover elevation (`translateY(-2px)` + primary-tinted border); `:focus-visible` ring; disabled state (`--disabled`, dimmed, `pointer-events:none`); right-aligned next card; truncated titles (ellipsis); dark-mode shadow overrides; hover suppressed on coarse pointers.
- **Source:**
  - SCSS: `_sass/components/_post-navigation.scss`
  - Markup: `_layouts/article.html` (`nav.post-navigation`, uses `page.previous`/`page.next`)
- **API surface:** classes `.post-navigation`, `.post-nav-card`, `.post-nav-card--prev`, `.post-nav-card--next`, `.post-nav-card--disabled`, `.post-nav-card__body/__label/__title`; CSS vars `--zer0-color-bg-elevated`, `--zer0-color-border`, `--zer0-shadow-sm/md/focus`, `--zer0-color-primary(-rgb)`, `--zer0-motion-*`. `aria-disabled="true"` on disabled cards.
- **Tests:** No spec targets the prev/next cards specifically. `test/visual/layouts.spec.js` "article post has exactly one h1" navigates to an article but only counts H1s; it does not assert post-navigation markup, hover, focus, or disabled state.
- **Gaps / improvement ideas:** Hover/focus elevation and the disabled affordance are untested. Note layout has a parallel but different prev/next implementation (Bootstrap `.pagination`) — two divergent patterns for the same need; could be unified. No keyboard-focus-ring visual regression test.

### Code copy button
- **Purpose:** Progressive-enhancement script that adds a copy-to-clipboard button, a language header bar, and a line-number gutter to every code block, and makes blocks keyboard-focusable scroll regions.
- **Capabilities:** detects Rouge (`pre.highlight`) and standalone `pre code`; injects line-number gutter (separate DOM node, never copied); language label from `language-*` class (with `shell→bash`, `plaintext→text` remap); Copy button with clipboard write, "Copied!" 2s feedback, failure state; strips `#`-comment lines from copied text; WCAG 2.1.1 fix — adds `tabindex="0"`, `role="region"`, `aria-label` to scrollable `<pre>`; header-mounted button for Rouge blocks vs. absolute overlay for standalone; single-line variant centering.
- **Source:**
  - SCSS: `_sass/core/code-copy.scss`
  - JS: `assets/js/code-copy.js` (loaded `defer` in `_includes/core/head.html`)
- **API surface:** classes `.copy`, `.copy.copied`, `.copy-code`, `.code-block-header`, `.code-block-lang`, `.code-block-body`, `.code-block-body--single-line/--standalone`, `.code-line-numbers`, `.code-block--single-line`, `.has-copy-button`, `.has-code-header`, `.has-line-numbers`; CSS vars `--zer0-code-copy-width`, `--zer0-code-header-height`, `--zer0-code-accent-width`, `--zer0-code-gutter-width`; uses `navigator.clipboard.writeText`. No global JS API/events.
- **Tests:** `test/visual/ui-refresh.spec.js` "rouge blocks get header bar and line gutter after JS" (asserts `.code-block-header` visible + `.code-line-numbers` attached + header copy button visible) and "single-line rouge blocks place copy button in header bar". `test/visual/accessibility.spec.js` "code copy buttons are keyboard focusable" (focus → `toBeFocused`). All run against `UI_ROUTES.codeCopy` = `/docs/features/code-copy/`.
- **Gaps / improvement ideas:** No test of the actual copy action / clipboard content, the `#`-comment stripping, the "Copied!"→reset transition, or the failure path. `getCopyableCode` silently drops every line starting with `#`, which corrupts copied YAML/Python/shell-comment-bearing snippets — a correctness bug worth a regression test. `aria-label` is static "Copy code to clipboard"; copied-state change isn't announced (no `aria-live`).

### Syntax highlighting
- **Purpose:** Rouge token color theme for fenced code, with a GitHub-Light palette in light mode and a Material-Dark base16 palette under `[data-bs-theme="dark"]`.
- **Capabilities:** full Rouge token class coverage (comments, keywords, strings, names, generic diff `gi`/`gd` with background tints, numbers, operators); WCAG-AA-tuned light palette on `#f8f9fa`; dark overrides keyed off the manual theme attribute; `.hll` line-highlight; gist table reset.
- **Source:**
  - SCSS: `_sass/core/_syntax.scss`
- **API surface:** Rouge token classes under `.highlight` (`.c/.k/.s/.n/.o/.na/.nf/.gi/.gd/.hll`, …); dark variants under `[data-bs-theme="dark"] .highlight`; Sass `$base00..$base0f` palette vars (compile-time only).
- **Tests:** No spec asserts token colors or light/dark palette swaps. `test/visual/styling.spec.js` contains no syntax/code assertions.
- **Gaps / improvement ideas:** Palette is hardcoded hex rather than `--zer0-*` tokens, so it won't follow custom skins (only the binary light/dark split). Comment is dated ("`--bd-pre-bg`") — references a retired variable name. No visual-regression snapshot of a highlighted block in either mode to catch palette regressions.

### Author card
- **Purpose:** Reusable author profile display resolving an author key against `_data/authors.yml` (falling back to a plain name string), with three density styles.
- **Capabilities:** styles `inline` (avatar 24px + name), `compact` (48px + role + optional bio), `full` (80px card + bio + social buttons); avatar fallback to a primary-circle `bi-person`; social links (GitHub, X, LinkedIn, website, email) in full style; `show_bio`/`show_social` flags with per-style defaults.
- **Source:**
  - Markup: `_includes/components/author-card.html`
  - Plugin/data: `_data/authors.yml`
- **API surface:** classes `.author-inline`, `.author-card-compact`, `.author-card`, `.author-name`, `.author-social`; include params `author`, `style` (`inline|compact|full`), `show_bio`, `show_social`. No JS, no dedicated CSS partial (relies on Bootstrap utilities).
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** `article.html` re-implements the "full" author card inline (the About-the-Author block) instead of `{% include author-card.html style="full" %}` — duplicated markup that can drift. Avatar `src` uses `{{ site.baseurl }}/{{ site.public_folder }}{{ avatar }}` (different convention from `preview-image.html`'s assets-prefix logic) — two image-path conventions. No `loading="lazy"` on avatars. X social link missing `aria-label` in some branches (present in full, but inline/compact have no social).

### Author E-E-A-T block
- **Purpose:** Visible author-credibility block (Experience/Expertise/Authority/Trust) emitting Schema.org `Person` microdata for AI-engine optimization and SEO.
- **Capabilities:** two styles — `banner` (full-width bordered strip) and `card`; avatar with primary border + fallback; name/role/bio with `itemprop` name/jobTitle/description; social buttons with `itemprop="sameAs"`/`url`; defaults author to `bamr87`.
- **Source:**
  - Markup: `_includes/components/author-eeat.html`
  - Plugin/data: `_data/authors.yml`
- **API surface:** Bootstrap utility classes only (`.bg-body-secondary`, `.card`, `.rounded-circle`, …); microdata `itemscope itemtype="https://schema.org/Person"` + `itemprop` name/jobTitle/description/image/sameAs/url; include params `author_key`, `style` (`banner|card`). No `--zer0-*` vars, no JS.
- **Tests:** No automated tests (microdata not validated by any spec).
- **Gaps / improvement ideas:** Overlaps heavily with `author-card.html` (style="full") and the inline article author block — three author renderers. Hardcoded default `bamr87` baked into the component. No test that the `Person` JSON-LD/microdata is well-formed. Avatar lacks `loading="lazy"`.

### Post card
- **Purpose:** Canonical reusable blog-post card used across news, tag, section, and archive pages for consistent rendering.
- **Capabilities:** breaking badge (red, top-left), featured badge (gold star, top-right), contextual post-type badge (bottom-left), preview image with fallback, category badge linking to `/news/<cat>/`, title (`stretched-link`), subtitle, excerpt (truncate 120), author + date footer, reading time (`estimated_reading_time` or "2 min" fallback), up to 3 tag badges + "+N" overflow; toggle flags for each section.
- **Source:**
  - Markup: `_includes/components/post-card.html` (uses `post-type-badge.html` + `preview-image.html`)
  - Plugin/data: `site.teaser` fallback image
- **API surface:** classes `.post-card`, plus Bootstrap `.card h-100 border-0 shadow-sm`, `.stretched-link`, badge positioning utilities, `.z-1`; include params `post` (required), `show_category`, `show_excerpt`, `show_author`, `show_reading_time`, `show_post_type`, `card_class`. No dedicated SCSS (`.post-card` has no rules of its own in this cluster), no JS.
- **Tests:** No spec instantiates or asserts post-card structure/badges. (Used on `/tags/` and `/news/` which appear only indirectly in `ui-refresh.spec.js` section/grid checks that don't reach card internals.)
- **Gaps / improvement ideas:** Reading-time fallback is a hardcoded "2 min" string when `estimated_reading_time` is absent — misleading. `stretched-link` on the title combined with the separate image `<a>` and category `<a>` creates nested/competing click targets (the stretched-link will swallow the others) — an interaction bug. `.post-card` class exists but has no styling hook. No automated coverage of badge precedence (breaking vs featured vs post_type).

### Post-type badge
- **Purpose:** Maps a `post_type` value to a colored Bootstrap badge with icon; the single source of truth for article-type chips.
- **Capabilities:** types `featured` (gold star), `breaking` (red lightning), `opinion` (gray), `review` (blue half-star), `tutorial` (green book), `listicle` (primary list), `interview` (dark mic); `standard` renders nothing.
- **Source:**
  - Markup: `_includes/components/post-type-badge.html`
- **API surface:** Bootstrap badge classes (`.badge bg-warning/danger/secondary/info/success/primary/dark`); include param `post_type`. No JS/CSS/vars.
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** No fallback/`{% else %}` for unknown post_type values (silently renders nothing). `bg-info`/`bg-warning` badges use `text-dark` but `bg-secondary`/`bg-success` rely on default contrast — verify AA in all skins. No test of the case mapping. Callers re-check `post_type != "standard"` everywhere because the component emits empty output for standard — could centralize.

### Feature card
- **Purpose:** Data-driven card rendering a single feature from `_data/features.yml` (id, version, description, sub-features, references, docs/demo links).
- **Capabilities:** optional colored border (`style`), icon + icon-color, sub-feature list (limit configurable), references list (handles nested file arrays), id/version/tag badges, docs + demo footer buttons; compact mode hides sub-features.
- **Source:**
  - Markup: `_includes/components/feature-card.html`
  - Plugin/data: `_data/features.yml`
- **API surface:** Bootstrap `.card h-100 border-{style}`, `.badge`, `.btn btn-outline-*`; include params `feature` (required), `style`, `icon`, `icon_color`, `show_refs`, `compact`, `features_limit`. No JS/CSS vars.
- **Tests:** `test/visual/ui-refresh.spec.js` "feature category badges link to in-page anchors" tests the features page's `.feature-categories a.badge` (the page-level category nav), not this card component's internals. So effectively no direct coverage of feature-card.
- **Gaps / improvement ideas:** No test of the references-list nested-array branch or the docs/demo button conditionals. Tag badges use `.bg-light text-dark` (low contrast in dark mode). No `--zer0-*` token usage. Component assumes `f.version`/`f.id` always present.

### Preview image
- **Purpose:** Single consistent `<img>` renderer for preview/teaser images that auto-prepends the configured assets prefix and falls back to `site.teaser`.
- **Capabilities:** external-URL passthrough (`://`); auto-prefix `/assets` when `auto_prefix` (skips if already prefixed); `relative_url` normalization; `loading="lazy"` default; alt escaping; optional inline `style`.
- **Source:**
  - Markup: `_includes/components/preview-image.html`
  - Plugin/data: `_plugins/preview_image_generator.rb`, `site.preview_images.*` config, `site.teaser`
- **API surface:** include params `src`, `alt`, `class` (default `card-img-top`), `style`, `loading`; config keys `preview_images.assets_prefix`, `preview_images.auto_prefix`. No CSS/JS.
- **Tests:** No automated tests of the include's path logic.
- **Gaps / improvement ideas:** No `width`/`height` attributes → cumulative-layout-shift risk and no intrinsic ratio. The Ruby plugin's path-existence/normalization logic (`has_preview?`, `normalize_preview_path`, missing-preview index) is untested — a Ruby/RSpec or shell test would catch regressions in the assets-prefix candidates. The Liquid include and the Ruby plugin re-implement prefix logic separately (drift risk). No `decoding="async"`.

### Preview-image generator plugin
- **Purpose:** Jekyll plugin providing Liquid filters/tags + a build-time generator hook to track which collection documents are missing AI-generated preview images (actual generation is a separate shell script).
- **Capabilities:** filters `has_preview_image`, `preview_image_path`, `preview_filename`; tags `{% preview_image_status %}` (badge of missing count) and `{% preview_images_missing %}` (list-group of missing docs); builds a cached `preview_image_index` over configured collections (`posts`, `docs`, `quickstart` default) + posts; validates preview is an image path/URL and the file exists; `auto_generate` logs a not-implemented warning.
- **Source:**
  - Plugin/data: `_plugins/preview_image_generator.rb`; config `preview_images:` in `_config.yml`
- **API surface:** Liquid filters `| has_preview_image`, `| preview_image_path`, `| preview_filename`; tags `preview_image_status`, `preview_images_missing`; `site.data['preview_images_missing']`, `site.data['preview_image_index']`; defaults provider `openai`/`dall-e-3`, `output_dir: assets/images/previews`.
- **Tests:** No automated tests (no Ruby/RSpec spec under `test/` for this plugin).
- **Gaps / improvement ideas:** `has_preview?` regex `\.(png|jpe?g|gif|svg|webp)$` rejects query-string'd or extensionless URLs; non-HTTP external schemes unhandled. The status/missing tags emit raw HTML strings — untested, brittle. No coverage for the candidate-path resolution across `assets/` variants. `auto_generate` is dead (warns + does nothing).

### Comments (Giscus)
- **Purpose:** GitHub-Discussions-backed comment thread embedded at the foot of articles/notes/notebooks, themed to the reader's color scheme.
- **Capabilities:** loads `giscus.app/client.js` async; pathname-based strict thread mapping; reactions enabled; top input position; `preferred_color_scheme` theming; English; configured from `site.repository` + `site.giscus.{data-repo-id,data-category-id}`. Gated per-layout (`comments != false` and `site.giscus`/`site.giscus.enabled`).
- **Source:**
  - Markup: `_includes/content/giscus.html`
  - Plugin/data: `site.giscus` config in `_config.yml`
- **API surface:** `<script data-repo data-repo-id data-category-id data-mapping="pathname" data-strict="1" data-reactions-enabled="1" data-theme="preferred_color_scheme" …>`. No classes/vars.
- **Tests:** No automated tests (third-party iframe; specs don't load it).
- **Gaps / improvement ideas:** `data-theme="preferred_color_scheme"` follows OS preference, not the site's manual `[data-bs-theme]` toggle — comments mismatch the chosen theme. Inconsistent gating: `article.html` checks `site.giscus` truthiness while note/notebook check `site.giscus.enabled` — three layouts, two conditions. No graceful fallback/placeholder if Discussions is disabled. No `loading`/visibility deferral until scrolled into view.

### Share actions (LinkedIn enhancement)
- **Purpose:** Progressive enhancement for LinkedIn share links that copies a cleaned, de-duplicated article summary (title + description + excerpt + URL) to the clipboard before opening LinkedIn's share dialog.
- **Capabilities:** binds `.js-linkedin-share` and `.js-copy-share-link`; extracts excerpt from `[itemprop="articleBody"]`/`.bd-content`/`main` (paragraphs >40 chars, dedup vs description, truncate to sentence at 420 chars); opens share window first (popup-blocker friendly) then sets location; toast notification (`role="status"`, auto-dismiss 4s) on copy success/failure; idempotent binding via `data-*`-bound flags.
- **Source:**
  - JS: `assets/js/share-actions.js` (loaded non-defer in `_includes/components/js-cdn.html`)
  - Markup consumer: `_layouts/note.html` (`.js-linkedin-share`)
- **API surface:** classes/hooks `.js-linkedin-share`, `.js-copy-share-link`; data-attributes `data-share-url`, `data-share-title`, `data-share-description`, `data-copy-text`, `data-copy-success`, `data-linkedin-share-bound`, `data-copy-bound`; uses `navigator.clipboard.writeText`. No global API/events.
- **Tests:** No automated tests (no spec asserts the copy-then-open flow or toast).
- **Gaps / improvement ideas:** Only `note.html` uses `.js-linkedin-share`; `article.html` and `notebook.html` LinkedIn buttons are plain links that skip this enhancement — inconsistent. The toast has no close button and isn't focus-managed. Excerpt extraction can leak nav/footer text if `articleBody`/`.bd-content` aren't present (falls back to `main`/`body`). No test of dedup or the 420-char sentence truncation.

### Posts pagination
- **Purpose:** Client-side, hash-driven pagination for the posts archive — shows/hides `.post-item` slices and renders an accessible Bootstrap pager without server round-trips.
- **Capabilities:** reads `data-per-page`/`data-total`; URL-hash page state (`#page=N`) with `hashchange` + `history.replaceState`; condensed page range with ellipsis for >7 pages; prev/next with `aria-disabled`/`tabindex=-1` at bounds; active page exposes `aria-current="page"`; "Showing X–Y of N" + "Page X of Y" status text; smooth-scrolls grid into view on change.
- **Source:**
  - JS: `assets/js/posts-pagination.js` (loaded `defer` in `_includes/components/js-cdn.html`)
- **API surface:** root attr `data-posts-archive` with `data-per-page`, `data-total`; required ids `#posts-grid`, `#pagination-info`, `#posts-info`, `#pagination-controls`; item class `.post-item`; pager `data-page` attrs; `aria-current="page"` on active. No global API/events.
- **Tests:** `test/visual/layouts.spec.js` "Posts archive (/pages/) — pagination → active page exposes aria-current='page'" (visits `/pages/`, asserts `#pagination-controls .page-item.active .page-link` has `aria-current="page"`; skips if no archive/single page).
- **Gaps / improvement ideas:** Only the `aria-current` attribute is tested — the ellipsis range builder, prev/next disabling, hash navigation, and "Showing X–Y" math are untested. Pager `<a href="#">` items can jump the scroll position before `preventDefault` in edge cases. No "no results" handling. Page slicing relies on DOM order matching server sort.

### Article layout
- **Purpose:** Primary blog-post layout with eight `post_type` variations, rich metadata, related posts, prev/next cards, author bio, and comments. Maps `featured`/`breaking` booleans to post types.
- **Capabilities:** post-type variants (standard/featured/breaking/opinion/review/tutorial/listicle/interview) each with a tailored banner/box (breaking alert, featured hero image + display-4 title, opinion author box, review rating stars + pros/cons + verdict, tutorial outcomes, listicle quick-nav, interview notice); per-type sidebar resolution (featured/breaking → no sidebar unless overridden); reading time; category + tag badge links; inline About-the-Author block; related posts (tag overlap, max 3, excludes index/self); prev/next `.post-nav-card`s; Giscus; Schema.org `BlogPosting` + microformats. Review stars use `role="img"` + `aria-label` + `visually-hidden` score for a11y.
- **Source:**
  - SCSS: `_sass/components/_post-navigation.scss` (nav cards); type-variant styles elsewhere in `_sass`
  - Markup: `_layouts/article.html`; components `post-type-badge.html`, `preview-image.html`, `content/giscus.html`
  - Plugin/data: `_data/authors.yml`
- **API surface:** classes `.post`, `.post-header`, `.post-title`, `.post-meta`, `.post-content`, `.post-navigation` + `.post-nav-card*`, `.featured-hero`, `.opinion-author-box`, `.review-summary`, `.rating-score/-stars`, `.review-pros-cons`, `.tutorial-info`, `.listicle-nav`, `.interview-notice`, `.author-section`; front matter `post_type`, `sidebar`, `featured`, `breaking`, `rating`, `verdict`, `pros`, `cons`, `learning_outcomes`, `interviewee`, `sub-title`, `comments`.
- **Tests:** `test/visual/layouts.spec.js` "Article layout — single H1" (follows first `/posts/` link, asserts exactly one H1). No spec exercises the post_type variants, rating math, pros/cons, or related-posts logic.
- **Gaps / improvement ideas:** `{% if post_type == "review" and page.pros or page.cons %}` mixes `and`/`or` without grouping (same precedence trap the file fixed elsewhere) — pros/cons box can render for non-review types when `cons` is set. About-the-Author block is duplicated from `author-card.html` (style=full). Rating star math (`divided_by: 2`, `modulo: 2`) only yields full/half stars to 5 — no empty-star track. Only single-H1 is tested across all eight variants.

### Collection layout
- **Purpose:** Generic card-grid index for any Jekyll collection, driven by `page.collection` and `page.sort_order`.
- **Capabilities:** renders page content, then a 3-up responsive card grid of collection entries; preview image (fallback `site.teaser`); excerpt (truncate 160); last-modified footer; `itemprop` headline/description microdata; supports `sort_order` with optional `reverse`.
- **Source:**
  - Markup: `_layouts/collection.html` (uses `preview-image.html`)
- **API surface:** Bootstrap `.row row-cols-1 row-cols-md-3 g-4`, `.card h-100`, `.card-link`, `.post-meta`; id `#index-collection`; front matter `collection`, `sort_order` (`reverse` special-cased); `itemprop="headline|description"`.
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** Heading reads literal "Collection Index - {{ page.collection }}" (un-prettified key). Does not use `post-card.html` — a fourth bespoke card variant. `sort_order` reverse handling is brittle (`sort: nil` then conditional reverse). No empty-state. Cards have no badges/tags/author unlike `post-card.html`. No `width/height` on images (CLS).

### News layout
- **Purpose:** Magazine-style section front page for the `news` collection with hero, section nav, featured grid, per-category blocks, latest list, and footer widgets; supports `magazine` (default), `grid`, and `list` styles.
- **Capabilities:** hero (first breaking, else first featured) with badge + meta + CTA + preview image; section navigation; featured section (one large + four secondary); per-category `section-posts` blocks; `grid-section` / `list-section` alternates; latest section; page content; footer widgets + newsletter section; reuses `post-type-badge.html` + `preview-image.html` throughout; inline `<style>` for hero image responsiveness.
- **Source:**
  - Markup: `_layouts/news.html`; components `post-type-badge.html`, `preview-image.html`
  - Plugin/data: `site.og_image`/`site.teaser`
- **API surface:** classes `.hero-section`, `.section-nav`, `.featured-section`, `.section-posts`, `.grid-section`, `.list-section`, `.latest-section`, `.page-content`, `.footer-widgets`, `.newsletter-section`; front matter `section_style` (`magazine|grid|list`), `category`, post flags `breaking`/`featured`/`post_type`.
- **Tests:** `test/visual/ui-refresh.spec.js` "Section archive → news section page loads with layout containment" visits `UI_ROUTES.newsSection` (`/news/business/`) and asserts `.section-layout`/`#all-posts` containment — but that targets the **section.html** layout, not `news.html`; `news.html` itself has no direct spec.
- **Gaps / improvement ideas:** Large (660+ lines) with inline `<style>` and inline share `<script>` rather than partials — does not reuse `post-card.html`, re-implementing cards in 4+ places (drift + maintenance cost). Hero/featured image heights are inline `style="height:..."`. No tests for the breaking→featured hero fallback, the three section_styles, or the newsletter form. Share buttons here skip the share-actions.js LinkedIn enhancement.

### Tag layout
- **Purpose:** Tag-archive page listing all posts carrying `page.tag`, with breadcrumbs, count, post-card grid, and a related-tags cloud.
- **Capabilities:** breadcrumb nav; tag icon + title + pluralized count; optional description + page content; 3-up `post-card.html` grid; empty state with "Browse all tags" CTA; related-tags discovery (co-occurring tags, limit 12).
- **Source:**
  - Markup: `_layouts/tag.html` (uses `post-card.html`)
- **API surface:** classes `.tag-header`, `.tagged-posts`, `.related-tags`, Bootstrap `.breadcrumb`, `.row row-cols-*`; front matter `tag` (required), `title`, `description`; tag links `/tags/#<slug>`.
- **Tests:** No direct spec. (Uses `post-card.html`; no spec visits a `/tags/<tag>/` page.)
- **Gaps / improvement ideas:** Related-tags links point to `/tags/#<slug>` anchors that depend on a tags index page rendering those anchors — fragile cross-page contract, untested. Breadcrumb uses `<ol class="breadcrumb">` but lacks the `nav.breadcrumbs`+`aria-label` pattern the layouts spec checks for on other pages (a11y inconsistency). No automated coverage of count/pluralize or empty state.

---

## Obsidian & Knowledge-Graph Features

This cluster brings Obsidian-flavored Markdown (wiki-links, embeds/transclusion, callouts, inline tags) and a force-directed knowledge graph to the theme, via a dual-path design: a build-time Ruby plugin for vanilla-Jekyll forks and a client-side JS resolver/graph for the default GitHub-Pages `remote_theme` build, both consuming a single generated `wiki-index.json`.

### Wiki-Links ([[Page]])
- **Purpose:** Renders Obsidian `[[Page Title]]` references as resolved internal links so authors can cross-link content the way they do in Obsidian. Unresolved targets degrade to a visible "broken link" affordance instead of dead text.
- **Capabilities:** alias display `[[Page|Alias]]`; heading anchors `[[Page#Heading]]` (anchorized, shown as `Page › Heading`); block refs `[[Page^block-id]]` degraded to heading-style anchor; case-insensitive lookup by title / basename / front-matter `aliases` (normalized lowercase + collapsed whitespace, first-registration-wins); skips matches inside fenced/inline/indented code; `aria-current="page"` self-link marking; broken state styled distinctly; dual server (Ruby) + client (JS DOM-rewrite) paths producing identical HTML.
- **Source:**
  - SCSS: `_sass/core/_obsidian.scss` (`.wiki-link`, `.wiki-link-broken`)
  - Markup: rewritten in-body (no dedicated include); JS wired via `_includes/components/js-cdn.html`
  - JS: `assets/js/obsidian-wiki-links.js`
  - Plugin/data: `_plugins/obsidian_links.rb`, `assets/data/wiki-index.json`
- **API surface:** classes `.wiki-link`, `.wiki-link-broken`; data-attributes `data-wiki-target`; attribute `aria-current="page"`; JS `window.ObsidianResolver.{rewriteHtml,rewriteContainer,buildIndex,normalize}`, `window.__OBSIDIAN_INDEX__`, opt-out flag `window.__OBSIDIAN_DISABLE_CLIENT__`, config `window.OBSIDIAN_CONFIG.{wikiIndexUrl,attachmentsPath,tagBase}`; event `obsidian:ready` (`document`-level, `detail.count`/`detail.calloutCount`); CSS vars `--bs-primary-rgb`, `--bs-danger`, `--bs-danger-rgb`
- **Tests:** `test/test_obsidian.sh` orchestrates: `test/test_ruby_converter.rb` — `test_resolved_wiki_link`, `test_alias_wiki_link`, `test_alias_lookup_via_aliases`, `test_header_anchor`, `test_unresolved_wiki_link`, `test_wiki_link_inside_code_block_is_preserved`, `test_wiki_link_inside_inline_code_is_preserved`, `test_plain_markdown_unchanged`; `test/test_resolver.js` (JSDOM-free shim) mirrors these (resolved class+href, alias text, alias key, header anchor, broken class). No Playwright/visual coverage.
- **Gaps / improvement ideas:** No end-to-end browser test asserting the JS DOM-rewrite path actually fires on a rendered page (only the shim is tested); broken links use `href="#"` (clickable no-op, scrolls to top) rather than a `<span>` or `aria-disabled`; no a11y test that broken links are keyboard-discernible; the `cursor: help` broken state has no `aria-describedby`/tooltip for non-mouse users.

### Embeds & Transclusion (![[…]])
- **Purpose:** Renders `![[image.png]]` as an `<img>` and `![[Note Title]]` as an inline excerpt of another note, letting authors compose pages from reusable fragments.
- **Capabilities:** image embeds with width hint `![[img.png|400]]` or alt-text override; absolute (`/path`) vs. attachments-path-relative resolution; note transclusion (Ruby path emits a Liquid `transclude.html` include rendering a card with header/date/800-char body; JS path renders a header+excerpt block from the index); broken-embed warning alert; transclusion loop guarded (converter deliberately not re-run on embedded body); image extensions `.png .jpg .jpeg .gif .svg .webp .avif .bmp`.
- **Source:**
  - SCSS: `_sass/core/_obsidian.scss` (`.obsidian-embed-image`, `.obsidian-embed-note`, `.obsidian-embed-broken`)
  - Markup: `_includes/content/transclude.html`
  - JS: `assets/js/obsidian-wiki-links.js` (`renderImageEmbed`, `renderNoteEmbed`)
  - Plugin/data: `_plugins/obsidian_links.rb` (`render_image_embed`, `render_note_embed`), `assets/data/wiki-index.json` (`excerpt` field)
- **API surface:** classes `.obsidian-embed`, `.obsidian-embed-image`, `.obsidian-embed-note`, `.obsidian-embed-header`/`.obsidian-embed-excerpt` (JS) / `.obsidian-embed-source`/`.obsidian-embed-body`/`card` (Ruby include), `.obsidian-embed-broken`; img attrs `loading="lazy"`, optional `width`; Liquid include params `target`, `url`; CSS vars `--bs-primary`, `--bs-light-rgb`, `--bs-dark-rgb`
- **Tests:** `test/test_ruby_converter.rb` — `test_image_embed_with_width`, `test_image_embed_default_attachments_path`, `test_note_embed_resolved` (asserts `transclude.html` include + url), `test_note_embed_missing`. `test/test_resolver.js` — image embed `<img>`+width, note embed → `.obsidian-embed-note` block, missing note embed → broken alert. No Playwright coverage; the `transclude.html` Liquid include itself is not unit-tested (only that the converter emits the include tag).
- **Gaps / improvement ideas:** Markup divergence between the two paths is untested — Ruby produces a `<aside class="card">` with truncated 800-char `markdownify` body, JS produces a flat 240-char `excerpt` div; no test asserts visual/structural parity. No test that the Ruby transclude include correctly resolves vs. falls back to the broken alert. Image embeds lack width/height pairing (only `width`) so CLS is possible; no responsive `srcset`.

### Callouts (> [!type])
- **Purpose:** Converts Obsidian callout blockquotes (`> [!note] Title`) into themed Bootstrap alert cards with an icon, title, and body, giving authors admonition boxes.
- **Capabilities:** ~30 mapped types (note/abstract/summary/tldr/info/todo/tip/hint/important/success/check/done/question/help/faq/warning/caution/attention/failure/fail/missing/danger/error/bug/example/quote/cite) each mapped to a Bootstrap alert color + Bootstrap Icon; unknown type falls back to `note`/`alert-primary`; optional custom title (defaults to capitalized type); fold markers `[!type]+`/`[!type]-` with collapsed state; inner Markdown preserved (Ruby uses `markdown="1"` body span; JS moves blockquote children into the body div); Ruby path operates on raw markdown pre-kramdown, JS path rewrites the post-kramdown `<blockquote>`; works even when the wiki-index fetch fails (callouts need no index).
- **Source:**
  - SCSS: `_sass/core/_obsidian.scss` (`.obsidian-callout`, `.obsidian-callout-title`, `.obsidian-callout-body`)
  - JS: `assets/js/obsidian-wiki-links.js` (`rewriteCallouts`, `CALLOUT_TYPES`, `CALLOUT_HEAD_RE`)
  - Plugin/data: `_plugins/obsidian_links.rb` (`transform_callouts`, `CALLOUT_TYPES`)
- **API surface:** classes `.alert.alert-{color}`, `.obsidian-callout`, `.obsidian-callout-{type}`, `.obsidian-callout-title`, `.obsidian-callout-body`; data-attributes `data-obsidian-callout` (type, JS only / dedupe guard), `data-collapsed="true"`; `role="alert"`; icons `bi bi-*` (`aria-hidden="true"`); config `obsidian.callout_class_prefix` (Ruby, default `obsidian-callout`)
- **Tests:** `test/test_ruby_converter.rb` — `test_callout_note` (class + `alert-primary` + title + `role="alert"`), `test_callout_warning_with_fold_marker`, `test_callout_collapsed` (`data-collapsed="true"`), `test_callout_unknown_type_falls_back_to_note`. `test/test_resolver.js` — `rewriteCallouts` returns 1, `alert-warning obsidian-callout-warning`, title/body preserved, `role="alert"`, non-callout blockquote untouched. No Playwright coverage; collapse/fold has no interactive (click-to-expand) toggle test — and notably no JS toggles the collapsed state at all.
- **Gaps / improvement ideas:** `data-collapsed="true"` only hides the body via CSS (`display:none`) — there is no toggle UI/JS to expand it, so foldable callouts authored with `[!type]-` are permanently collapsed and their content is hidden from keyboard/SR users with no control. `role="alert"` on every callout is questionable a11y (asserts assertive live-region semantics for static prose); consider `role="note"`/region. No test covers the icon-only `aria-hidden` title accessibility. The two CALLOUT_TYPES maps (Ruby + JS) are duplicated and could drift.

### Inline Tags (#tag)
- **Purpose:** Turns Obsidian-style inline `#tag` mentions into linked tag badges pointing at the site's tag index.
- **Capabilities:** supports nested/slashed tags `#fixture/example`; 1–64 char limit; requires a leading letter; skips tags inside code spans/fences and (Ruby) avoids markdown-heading `#` and link-internal hashes via masking; slugifies the tag for the anchor; links to configurable tag base (`/tags/#slug`).
- **Source:**
  - SCSS: `_sass/core/_obsidian.scss` (`.obsidian-tag`)
  - JS: `assets/js/obsidian-wiki-links.js` (`TAG_RE`, tag branch of `rewriteHtml`)
  - Plugin/data: `_plugins/obsidian_links.rb` (`transform_inline_tags`, `INLINE_TAG_RE`)
- **API surface:** classes `.obsidian-tag`; config `obsidian.tag_base_url` (Ruby) / `window.OBSIDIAN_CONFIG.tagBase` (JS, default `/tags/`); CSS vars `--bs-secondary`, `--bs-secondary-rgb`, `--bs-primary`
- **Tests:** `test/test_ruby_converter.rb` — `test_inline_tag` (`.obsidian-tag>#obsidian`, `#fixture/example`), `test_tag_inside_code_skipped`. `test/test_resolver.js` — inline tag → `.obsidian-tag`, "hash followed by space is NOT a tag". No Playwright coverage.
- **Gaps / improvement ideas:** Tag links go to `/tags/#slug` but there is no test that the tags page anchor actually exists / resolves; risk of dangling fragment links. No a11y/contrast test for the badge. Ruby vs. JS tag regexes differ subtly (`INLINE_TAG_RE` lookbehind vs. JS leading-char capture) and are not cross-validated against the same fixtures.

### Wiki Index (wiki-index.json)
- **Purpose:** Build-time generated JSON map of every renderable doc/page (title, basename, url, collection, tags, categories, aliases, outgoing wiki-links, excerpt) that is the single source of truth feeding the client resolver, both graph views, and the backlinks logic.
- **Capabilities:** Liquid-generated at `/assets/data/wiki-index.json` (`layout: null`, `sitemap: false`); iterates all collection docs + `output_ext == .html` pages; strips fenced + inline code before extracting `[[…]]` targets; masks `![[…]]` embeds so they aren't double-counted; heuristically discards operator-heavy/Bash `[[ … ]]` test targets (`$`, `==`, `&&`, `-eq`, braces, quotes, leading `-`); de-dupes outgoing per page; 240-char excerpt; `generated_at` + `count`. Lookup keys normalized identically across Ruby/JS (`lowercase().trim().replace(/\s+/g,' ')`).
- **Source:**
  - Markup: `assets/data/wiki-index.json` (Liquid template, front-matter + body)
  - JS consumers: `obsidian-wiki-links.js`, `obsidian-graph.js`, `obsidian-local-graph.js`
  - Plugin/data: `_plugins/obsidian_links.rb` also builds an equivalent in-memory `Index` (server path); `_includes/content/backlinks.html` re-derives links independently in Liquid
- **API surface:** JSON schema `{ generated_at, count, entries[] }`, entry `{ title, basename, url, collection, tags, categories, aliases, outgoing, excerpt }`; fetched via `OBSIDIAN_CONFIG.wikiIndexUrl` / `OBSIDIAN_WIKI_INDEX_URL` / `data-index-url`; cache `force-cache` (resolver)
- **Tests:** `test/test_obsidian.sh` Layer 3 — runs `jekyll build` and validates the generated file with a Python schema check: top-level object, required `count`/`entries` keys, `entries` is an array, `count == len(entries)`, `count > 0`, and sample entry has `title`/`basename`/`url`. No assertion on `outgoing`/`aliases`/`excerpt` correctness or the code-stripping heuristic.
- **Gaps / improvement ideas:** The Bash-operator exclusion heuristic in the Liquid template is fragile and untested — false positives/negatives in `outgoing` directly corrupt both graphs; add fixtures asserting specific outgoing edges. The Ruby `Index` (server path), the Liquid index (client path), and the Liquid `backlinks.html` matcher are three independent implementations of "what links to what" that can drift; no cross-consistency test. Excerpt strips HTML but not Liquid/front-matter edge cases.

### Full Knowledge Graph (graph page)
- **Purpose:** A force-directed, interactive site-wide map (cytoscape.js) rendered on the `/docs/obsidian/graph/` page showing every page as a node and every `[[wiki-link]]` as a directed edge, including dangling links as red broken nodes.
- **Capabilities:** cose force layout; per-collection node colors (posts/docs/notes/notebooks/quickstart/about/hobbies/news/services + fallback page gray); node size mapped to degree; hub nodes (degree ≥ 12) stay labeled when zoomed out, others reveal labels past zoom 1.25 / on hover; hover highlights closed neighborhood and fades the rest; broken targets become dashed red nodes/edges; tap to navigate (Cmd/Ctrl-click → new tab); search box filters+fits matching nodes with live status; "Reset view" fit button; "Show orphans" toggle (hidden by default, re-runs layout); stats badges (pages/links/broken); light/dark theme resolution; cytoscape loaded from CDN only on this page; graceful failure alerts if cytoscape or data fail to load.
- **Source:**
  - SCSS: inline `<style>` in `_includes/obsidian/full-graph.html` (scoped `#obsidian-graph`, toolbar, legend, tips)
  - Markup: `_includes/obsidian/full-graph.html` (page body at `pages/_docs/obsidian/graph.md`)
  - JS: `assets/js/obsidian-graph.js`
  - Plugin/data: `assets/data/wiki-index.json`
- **API surface:** ids `#obsidian-graph`, `#obsidian-graph-stats`, `#obsidian-graph-search`, `#obsidian-graph-fit`, `#obsidian-graph-orphans`, `#obsidian-graph-status`; classes `.obsidian-graph-toolbar`, `.obsidian-graph-legend`, `.obsidian-graph-tips`; cytoscape classes `.faded`, `.highlighted`; JS `window.ObsidianGraph.{cy,byKey,entries}`, `window.OBSIDIAN_WIKI_INDEX_URL`; `role="img"`/`aria-live="polite"`/`role="status"`; CSS vars `--bs-border-color(-rgb)`, `--bs-body-bg(-rgb)`, `--bs-tertiary-bg`, `--bs-primary`, `--bs-secondary-color`, `--bs-border-radius(-lg)`
- **Tests:** No automated tests. Not referenced by any `test/visual/*.spec.js`, `test_obsidian.sh`, or unit suite — the graph rendering, search, orphans toggle, theming, and broken-node logic are entirely untested.
- **Gaps / improvement ideas:** Zero coverage of a fairly complex interactive component — add Playwright behavioral tests (graph mounts, stats populate, search filters, orphans toggle hides/shows, broken nodes render dashed/red) and a visual snapshot. Cytoscape canvas graph is fundamentally inaccessible (a single `role="img"` with a generic label, no text/table fallback or keyboard navigation of nodes). External CDN + SRI dependency is a single point of failure with only a generic error alert. Hardcoded collection color palette duplicated across full graph, local graph, and the page legend.

### Local Graph (sidebar panel + FAB)
- **Purpose:** Obsidian-style page-scoped "local graph" — a collapsible offcanvas side panel triggered by a floating action button that shows the current page plus its immediate wiki-link neighbors.
- **Capabilities:** BFS subgraph (default depth 1, configurable via `local_graph_depth` front matter / `data-depth`) following both outgoing and incoming links; current-page node highlighted ("you are here", orange border); current page matched by URL then title/basename/alias fallback (handles permalink/baseurl quirks); broken neighbor nodes; lazy single-load of cytoscape from CDN with SRI (shared with full graph page); panel auto-hides if the page isn't in the wiki-index or index fails to load; per-page node/link status text; "Full graph" link; resizes on offcanvas show + window resize; opt-out via `local_graph: false`; auto-disabled when sidebar is off (featured/breaking posts).
- **Source:**
  - SCSS: `_sass/core/_obsidian.scss` (`.obsidian-local-graph-fab`, `.obsidian-local-graph-toggle`, `.obsidian-local-graph-panel`, `.obsidian-local-graph-widget`, `#obsidian-local-graph`)
  - Markup: `_includes/navigation/local-graph.html` (panel), `_includes/navigation/local-graph-fab.html` (FAB) — both included from `_includes/core/footer.html`
  - JS: `assets/js/obsidian-local-graph.js`
  - Plugin/data: `assets/data/wiki-index.json`
- **API surface:** id `#obsidian-local-graph`; data-attributes `data-obsidian-local-graph-panel`, `data-obsidian-local-graph-toggle`, `data-obsidian-local-graph-status`, `data-depth`, `data-index-url`; Bootstrap offcanvas attrs `data-bs-toggle="offcanvas"`/`data-bs-target="#obsidianLocalGraphPanel"`; element prop `container.__obsidianLocalGraph` (cy instance); globals `window.__obsidianCytoscapeLoading`; events `shown.bs.offcanvas`, `resize`; front matter `local_graph`, `local_graph_depth`, `sidebar`; CSS vars `--zer0-space-fab-offset`, `--zer0-space-fab-size`, `--zer0-shadow-fab`, `--zer0-layer-fab-local-graph`, `--zer0-layer-offcanvas`, `--bs-offcanvas-*`, `--bs-tertiary-bg`, `--bs-border-color`, `--bs-border-radius-lg`; `role="img"`/`role="status"`
- **Tests:** No automated tests. The include, FAB, offcanvas wiring, BFS subgraph, current-page detection, and depth config have no unit, shell, or Playwright coverage.
- **Gaps / improvement ideas:** Entirely untested despite nontrivial BFS + permalink-fallback logic; add a JS unit test for `buildSubgraph`/`findCurrentEntry` and a Playwright test that the FAB opens the panel and the graph mounts. Same cytoscape inaccessibility as the full graph (canvas, `role="img"`). FAB z-index/offset coordination with other FABs (back-to-top, navbar-extras) relies on shared `--zer0-*` tokens but has no visual regression test guarding overlap. Duplicated `readTheme`/`collectionColor`/`buildLookup`/`normalize` logic across the two graph scripts and the resolver — candidate for a shared ES module under `assets/js/modules/`.

### Backlinks Panel (Linked mentions)
- **Purpose:** Renders an Obsidian-style "Linked mentions" section listing every page that wiki-links or permalink-references the current page, computed entirely at build time in Liquid.
- **Capabilities:** scans all collection docs + HTML pages; matches the current page's permalink in body, or its title/basename inside `[[…]]` (case-insensitive, whitespace-collapsed); skips self-refs and (unless `show_drafts`) drafts/unpublished; renders title, collection badge, and truncated description; count badge; on by default in `note` layout, opt-in (`backlinks: true`) in `default` layout, suppressible per page (`backlinks: false`).
- **Source:**
  - SCSS: `_sass/core/_obsidian.scss` (`.obsidian-backlinks`, `.obsidian-backlinks-list`, `.obsidian-backlink`, `.obsidian-backlink-link`, `.obsidian-backlink-excerpt`)
  - Markup: `_includes/content/backlinks.html`, included from `_layouts/note.html` and conditionally `_layouts/default.html`
  - Plugin/data: independent Liquid matcher (does not consume `wiki-index.json`)
- **API surface:** classes `.obsidian-backlinks`, `.obsidian-backlinks-list`, `.obsidian-backlink`, `.obsidian-backlink-link`, `.obsidian-backlink-excerpt`; ids `#backlinks-heading`; `aria-labelledby="backlinks-heading"`; front matter `backlinks` (true/false), `site.show_drafts`; icon `bi-link-45deg`; CSS vars `--bs-primary(-rgb)`
- **Tests:** No automated tests. Not exercised by `test_obsidian.sh`, the unit suites, or Playwright — the matching logic (permalink + `[[title]]`/`[[basename]]`) and draft filtering are unverified.
- **Gaps / improvement ideas:** Substring matching (`_body contains _self_url`, `[[title]]`) is prone to false positives (partial-title collisions, permalink-as-substring of another URL) and false negatives (aliases are not matched, unlike the wiki-index/plugin which do match aliases) — add fixtures. This is a third independent link-resolution implementation distinct from the Ruby `Index` and the JSON index; consider unifying on `wiki-index.json`'s `outgoing` to guarantee parity with the graphs. O(docs × content) Liquid scan on every page render has build-cost implications on large sites and is untested for performance.

---

## Admin Tools & Dashboards

A suite of dev-facing admin pages (all under `/about/` on the `admin`/`stats`/`setup` layouts) that surface, browse, edit, and export Jekyll configuration, navigation, collections, analytics, environment, and content statistics — plus a first-run setup wizard/banner. All rendering is build-time Liquid reading `site.*` / `site.data.*`; client JS adds search/filter, tabbed YAML export, copy-to-clipboard, and download. Secrets are sanitized before reaching the DOM. Most components are wired into pages in `pages/_about/settings/*.md` and exercised by `test/visual/*.spec.js` against the live Docker-served site.

### Admin Shell (layout + sidebar nav + tabs)
- **Purpose:** Dashboard-style chrome for every admin/settings page: breadcrumbs, icon+title header, optional action buttons, and a sticky/offcanvas data-driven sidebar. Gives config pages a non-article presentation.
- **Capabilities:** front-matter-driven (`icon`, `admin_nav`, `admin_section`, `admin_actions`); desktop sticky sidebar (`col-lg-3`) vs. mobile offcanvas toggle (`#adminSidebar`); active-link detection by URL or `admin_section`; dynamic sidebar badges (collections count, analytics On/Off, env Prod/Dev); external-link separator `<li><hr></li>`; placeholder-token resolution (`{github_user}`, `{repository_name}`); reusable `admin-tabs.html` renders a Bootstrap tablist from a pipe/colon-encoded `tabs` string; `admin_page_urls.rb` precomputes a pipe-delimited string of `/about/` page URLs once per build for cheap `contains` checks.
- **Source:**
  - SCSS: — (uses Bootstrap utilities + `nav.admin-sidebar`; no dedicated partial found)
  - Markup: `_layouts/admin.html`, `_includes/navigation/admin-nav.html`, `_includes/components/admin-tabs.html`
  - JS: — (Bootstrap offcanvas/tab/collapse only)
  - Plugin/data: `_plugins/admin_page_urls.rb`, `_data/navigation/admin.yml`
- **API surface:** classes `.admin-sidebar`, `.nav.nav-pills.flex-column`, `.nav-link.active`, `.nav-tabs`; ids `#adminSidebar`, `#admin-content`, `#{tab_prefix}Tabs`, `#tab-<id>`/`#pane-<id>`; data-attrs `data-bs-toggle="offcanvas|tab"`, `data-bs-target`; front matter `icon`/`admin_nav`/`admin_section`/`admin_actions`; site data `site.data.admin_page_urls`, `site.data.navigation.admin`. No JS globals/events/CSS vars.
- **Tests:** `test/visual/admin-layout.spec.js` — per-page (8 ADMIN_PAGES): 200 status, header+`h1.h3` title equals `pageTitle`, breadcrumb ≥3 items with active matching title, header icon `i.fs-2` visible, `#admin-content` visible, desktop sidebar visible + active link href matches URL, mobile toggle visible / desktop sidebar hidden / offcanvas opens and shows `.nav.nav-pills`, and no console errors. `test/visual/admin-nav.spec.js` — sidebar renders ≥ADMIN_PAGES links, each internal link returns 200, external links have `target="_blank"`+`rel~="noopener"`, exactly one active link per page, clicking "Theme Customizer" navigates. `test/visual/accessibility.spec.js` — every admin page passes axe WCAG 2.1 AA; `nav.admin-sidebar[aria-label]` present; tabs expose `aria-controls`→existing panel; `<hr>` is not a direct child of `<ul>`. `admin_page_urls.rb` unit-tested in `test/test_plugins.rb` (sorted pipe-delimited output, non-HTML exclusion, empty case), run by `test/test_core.sh`.
- **Gaps / improvement ideas:** `admin-tabs.html` include exists but the real config/navigation pages hand-roll their tablists instead of using it — either adopt it or mark it deprecated. The `admin-tabs` colon-split breaks if a tab label contains a colon. No test asserts `admin_actions` buttons render or that dynamic sidebar badges (collections/analytics/env) show correct values.

### Config Viewer
- **Purpose:** Read-only accordion browser of the live `_config.yml` (`site.*`) with per-value/per-section/full-config copy and instant search. The default "View Config" tab on `/about/config/`.
- **Capabilities:** accordion sections (Site Identity, GitHub, URLs, Personalization, Analytics, Collections, Plugins, Build & Markdown, Theme Colors swatches, Powered By); live search filtering rows + auto-hiding empty sections; expand-all/collapse-all; copy single value, copy section (rebuilt as `key: value` lines), copy full config (reads hidden `#cfg-full-yaml`); clear-search button; color swatches and tech badges.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/config-viewer.html` (wired by `pages/_about/settings/config.md`)
  - JS: `assets/js/config-utility.js` (`initSearch`, `initCopyButtons`, `initSectionCopy`, `initFullCopy`, `initExpandCollapse`)
  - Plugin/data: reads `site.*`; full-YAML/raw element sanitized in `config.md` via Liquid + `sanitize_config_filter.rb`
- **API surface:** classes `.cfg-row`, `.cfg-section`, `.cfg-copy-val`, `.cfg-copy-section`; ids `#cfg-search`, `#cfg-search-clear`, `#cfg-expand-all`, `#cfg-collapse-all`, `#cfg-copy-full`, `#cfg-full-yaml`, `#configAccordion`; data-attrs `data-key`, `data-value`, `data-section`. No JS globals/events/CSS vars.
- **Tests:** `test/visual/config-viewer.spec.js` — 200 status, accordion/cards render (>0), `#cfg-search` fill keeps content visible, no-results search doesn't crash; one `test.fixme` (section-copy hex-quoting regression, disabled). `test/visual/security.spec.js` — `#cfg-full-yaml` (if present) contains no `api_key:/secret:/password:/token:/phc_` patterns.
- **Gaps / improvement ideas:** Search/copy success paths are only smoke-tested — no assertion that filtering actually hides non-matching `.cfg-row`s, that section/full copy writes correct text to clipboard, or that expand/collapse toggles `.show`. The section-copy YAML does not quote special values (hex colors become YAML comments) — the regression test is `fixme`'d and unfixed. Per-value copy buttons (`.cfg-copy-val`) have icon-only content with only a `title` — verify accessible name.

### Config Editor
- **Purpose:** Form-based `_config.yml` builder with a live YAML preview pane plus copy/download. The "Edit & Export" tab on `/about/config/`, pre-populated from `site.*`.
- **Capabilities:** grouped form cards (Identity, GitHub, URLs/Deployment, Personalization, Analytics) with text/email/url/number/select/checkbox fields; live YAML rebuild on every input/change (`buildEditorYAML` with `yamlEscape`/`pad` alignment); description char-counter (160 max); theme-skin dropdown (9 skins); copy YAML; download `_config.yml` via Blob; emits a fixed plugins/build block.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/config-editor.html` (wired by `pages/_about/settings/config.md`)
  - JS: `assets/js/config-utility.js` (`initEditor`, `buildEditorYAML`, `yamlEscape`, `initCharCounters`)
  - Plugin/data: reads `site.*` to seed field values
- **API surface:** classes `.edit-field`; ids `#configEditor`, `#editor-yaml-preview`, `#editor-copy`, `#editor-download`, `#edit-title`/`#edit-founder`/`#edit-description`/`#edit-theme-skin`/`#edit-posthog-enabled` etc.; data-attrs `data-key` (dotted for `posthog.enabled`/`posthog.api_key`), `data-char-counter`. No globals/events/CSS vars.
- **Tests:** `test/visual/config-editor.spec.js` — Edit/Export tab activates and shows a panel, title field pre-populated (length>0), changing title updates YAML preview to contain "Test Site Title", skin dropdown has >1 option, a download button exists. Note: several locators (`input#cfg-title`, `select#cfg-skin`) do NOT match the actual ids (`#edit-title`, `#edit-theme-skin`), so those assertions hit the `test.skip()` fallback and silently pass without truly testing the editor.
- **Gaps / improvement ideas:** Spec selector drift (`#cfg-title`/`#cfg-skin` vs real `#edit-*` ids) means the editor's pre-population, live-preview, and skin-dropdown tests effectively no-op — fix the locators. No test of the download Blob content or copy action. `buildEditorYAML` quotes values via `yamlEscape` (good) but hardcodes `remote_theme` default to `bamr87/zer0-mistakes`; the email field uses `yamlEscape` even though `@` triggers quoting — verify generated YAML round-trips.

### Raw YAML / Config Sanitization
- **Purpose:** Shows the full `_config.yml` text in a copyable Raw-YAML tab and feeds the viewer's hidden copy element, with secrets redacted before they ever reach the DOM (defense for GitHub Pages where plugins are no-ops).
- **Capabilities:** pure-Liquid line filter in `config.md` redacts lines containing `api_key`/`secret`/`password`/`token`/`phc_` to `# [redacted]`; `sanitize_config_filter.rb` adds a `sanitize_config_yaml` Liquid filter (key-name regex → `[REDACTED]`, `phc_…` value masking) as plugin-side defense-in-depth; same sanitized capture reused for visible `#cfg-raw-yaml` and hidden `#cfg-full-yaml`; raw-tab copy button.
- **Source:**
  - SCSS: —
  - Markup: `pages/_about/settings/config.md` (capture + Raw tab + `#cfg-full-yaml`)
  - JS: inline `cfg-copy-raw` handler in `config.md`
  - Plugin/data: `_plugins/sanitize_config_filter.rb`
- **API surface:** ids `#cfg-raw-yaml` (`<code>`), `#cfg-full-yaml` (hidden `<pre>`), `#cfg-copy-raw`; Liquid filter `sanitize_config_yaml`; constants `SENSITIVE_KEY_RE`, `PHC_VALUE_RE`.
- **Tests:** `test/visual/security.spec.js` — `code#cfg-raw-yaml` must exist (count 1) and contain no `api_key:/secret:/password:/token:/phc_…/sk_…/ghp_…` patterns, and must include `remote_theme|theme_skin` (proves non-empty render); hidden `#cfg-full-yaml` likewise scrubbed; page HTML free of `ghp_{36}`/`sk_live_` patterns.
- **Gaps / improvement ideas:** `sanitize_config_filter.rb` has no direct Ruby unit test (only end-to-end DOM assertion) — add one for edge cases (indented keys, inline anchors like `&github_user`, multi-secret lines). The two redaction implementations (Liquid in `config.md` and the Ruby filter) duplicate the secret pattern list and can drift apart; consider centralizing the pattern set.

### Environment Dashboard
- **Purpose:** Full-page environment/build readout for `/about/settings/environment/`: Jekyll/Ruby versions, environment, build time, site config, theme/repository info, active plugins, and dev/prod URL comparison.
- **Capabilities:** four overview cards (Jekyll version, Ruby version, environment with success/warning styling, build time); Site Configuration and Theme & Repository tables; active-plugins grid (or empty state); URL-configuration table (`site.url`, `site.baseurl`, `jekyll.environment`, full base path); quick links to config + analytics dashboards.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/env-dashboard.html` (wired by `pages/_about/settings/environment.md`)
  - JS: —
  - Plugin/data: reads `jekyll.version`, `jekyll.environment`, `site.*` (`ruby_version` is a config key, not introspected)
- **API surface:** Bootstrap card/table classes only; conditional `border-success`/`border-warning` on environment card. No ids/data-attrs/globals/events/CSS vars.
- **Tests:** `test/visual/env-dashboard.spec.js` — 200 status; overview cards render (>0); Jekyll version matches `\d+\.\d+\.\d+` and content has no "undefined"; no `undefined`/`NaN`/`null` tokens in `#admin-content`; active-plugins list non-empty (or content mentions "plugin"); one `test.fixme` for Ruby version (blocked by github-pages safe mode). Also covered by admin-layout/admin-nav/accessibility per-page suites.
- **Gaps / improvement ideas:** Ruby version comes from a config key `site.ruby_version` (shows "?" if unset) and the version test is `fixme`'d — wire a safe-mode-compatible source or remove the card. No assertion that the URL-comparison table or theme/repository values are correct, only that no error tokens appear.

### Environment Switcher
- **Purpose:** Inline (info-panel) widget showing current environment, current page URL, and quick Prod/Dev/Source links with copy buttons. Used inside `info-section.html`, not a standalone admin page.
- **Capabilities:** env status card (Prod success / Dev warning) using `is_production` heuristic (treats localhost/127.0.0.1/0.0.0.0 URLs as dev even when `JEKYLL_ENV=production`); readonly current-URL input with copy; build-info tiles (build time, Jekyll version, raw `JEKYLL_ENV`); quick-links list (canonical prod origin via `site.domain_url`/`production_url`, dev `localhost:port`, GitHub source) with open-in-tab + copy; dismissible env tip alert; self-contained `copyToClipboard`/`copyUrl`/`showCopyFeedback` script.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/env-switcher.html`, depends on `_includes/components/env-detect.html` (sets `build_env`, `is_local_url`, `is_production`)
  - JS: inline (defines global `copyToClipboard(inputId, btn)`, `copyUrl(url, btn)`, `showCopyFeedback`)
  - Plugin/data: reads `jekyll.environment`/`jekyll.version`, `site.domain_url`/`production_url`/`url`/`baseurl`/`port`/`repository`/`branch`
- **API surface:** ids `#currentUrlInput`; JS globals `window.copyToClipboard`, `window.copyUrl`, `window.showCopyFeedback`; `onclick` handlers; CSS vars none.
- **Tests:** No automated tests (not directly asserted by any spec; only indirectly via pages that include `info-section.html`).
- **Gaps / improvement ideas:** Defines a global `copyToClipboard` that collides in name (different signature) with the module-scoped one in `config-utility.js` — risk if both ever load on one page. Inline `<script>` per-include can duplicate if the include renders twice. No test coverage of the prod/dev URL derivation or the local-URL-as-dev heuristic. Inline scripts also conflict with strict CSP via `onclick`.

### Env-Var Helper (zer0-env-var)
- **Purpose:** Standalone interactive table to define shell environment variables (GITHOME, GHUSER, etc.) and emit `export` statements; an onboarding/setup helper. Documented in `_includes/README.md` but not wired into any current page.
- **Capabilities:** editable key/value table with add/remove rows; Submit writes values to `sessionStorage`, builds an `export …` code block, and updates a `#repo-link` anchor to the user's GitHub repo.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/zer0-env-var.html`
  - JS: inline (addRow/removeRow/submit handlers)
  - Plugin/data: none (client-only)
- **API surface:** ids `#envTable`, `#addRow`, `#submit`, `#codeBlock`, `#repo-link` (external dependency — not defined in this include); classes `.removeRow`, `.copy`. No globals/events/CSS vars.
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** References `#repo-link` which this include never renders — submit will throw if the host page lacks it (no null guard), a latent JS error. Inputs lack `<label>`/`aria-label` (a11y). Builds `codeBlock.innerHTML` from user input as HTML spans (minor XSS/escaping smell). Appears orphaned (no page includes it) — confirm whether to wire into setup or remove.

### Navigation Editor
- **Purpose:** Read-only viewer + exporter for all `_data/navigation/*.yml` menu files on `/about/settings/navigation/`. Three tabs: Overview (tree), Edit Menus (selector stub), Export YAML.
- **Capabilities:** summary cards (file count, total top-level items, source dir); per-file accordion tree (`nav-editor.html`) with icons, urls, external badges, sub-item counts, and "not found" badges; overview cards (`nav-overview.html`) listing first 5 items per file + "N more"; YAML export blocks (`nav-export.html`) with file selector + copy; editor tab is a guided stub (no real editing — directs users to edit YAML in the repo); `nav-editor.js` copies the export, populates a placeholder YAML on file-select, and expands the matching accordion.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/nav-editor.html`, `_includes/components/nav-overview.html`, `_includes/components/nav-export.html` (page `pages/_about/settings/navigation.md`)
  - JS: `assets/js/nav-editor.js` (+ inline `showNavExport`/`copyNavExport` in nav-export.html)
  - Plugin/data: `_data/navigation/{main,home,about,docs,posts,quickstart,admin}.yml`
- **API surface:** ids `#navAccordion`, `#navAcc-<file>`, `#nav-file-select`, `#nav-copy-yaml`, `#nav-yaml-output`, `#exportNavSelect`, `#export-<name>`, `#export-pre-<name>`; classes `.nav-export-block`; JS globals `window.showNavExport`, `window.copyNavExport`; uses `bootstrap.Collapse.getOrCreateInstance`. No events/CSS vars.
- **Tests:** No dedicated spec; covered only by the per-page admin-layout/admin-nav/accessibility suites (200, layout, WCAG, tab ARIA roles). The "Edit Menus" tab and export/copy logic are untested.
- **Gaps / improvement ideas:** The "Edit Menus" tab is a non-functional stub (only an info alert) — either build real editing or relabel to avoid implying it edits. `nav-yaml-output` is populated with a placeholder comment by `nav-editor.js` rather than the real YAML rendered in `nav-export.html` (two parallel export mechanisms — `#nav-yaml-output` vs `.nav-export-block`); consolidate. The hardcoded `nav_files` list is duplicated across three includes — extract to one source. No assertion that copy writes the rendered YAML.

### Collection Manager
- **Purpose:** Jekyll collections overview on `/about/settings/collections/`: counts, output status, directories, permalinks, and per-collection defaults/recent docs.
- **Capabilities:** four summary cards (total collections, total documents, with-output count, collections dir); collections table (label, doc count badge, output check icon, directory, permalink or "default"); per-collection defaults accordion with output/directory/permalink + up to 5 recent document links and "N more".
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/collection-manager.html` (wired by `pages/_about/settings/collections.md`)
  - JS: —
  - Plugin/data: reads `site.collections`
- **API surface:** ids `#collDefaultsAccordion`, `#collDef-<slug>`; Bootstrap table/card/accordion/badge classes. No data-attrs/globals/events/CSS vars.
- **Tests:** No dedicated spec; covered by per-page admin-layout/admin-nav/accessibility suites (200, layout, sidebar badge shows collections count, WCAG). Table/accordion content not asserted.
- **Gaps / improvement ideas:** Name says "Manager" but it is read-only (no create/edit/delete) — relabel or extend. No test that the collections count card matches the sidebar dynamic badge or the actual `site.collections` size. Recent-docs links are not verified to resolve.

### Analytics Dashboard
- **Purpose:** PostHog/tracking configuration overview on `/about/settings/analytics/`: enablement, privacy/compliance settings, custom-event toggles, and links out to PostHog.
- **Capabilities:** four status cards (enabled, respect DNT, session recording, secure cookies); PostHog Configuration table (api_host, person_profiles, autocapture, pageview/pageleave capture, persistence); Privacy & Compliance table (DNT, session recording, cookies, cross-subdomain, mask text/inputs, IP anonymization); custom-event cards (downloads, external links, search, scroll depth) when configured; external links to PostHog dashboard + full config.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/analytics-dashboard.html` (wired by `pages/_about/settings/analytics.md`)
  - JS: —
  - Plugin/data: reads `site.posthog.*`
- **API surface:** Bootstrap card/table/badge classes; conditional `border-success`/`border-warning`. No ids/data-attrs/globals/events/CSS vars.
- **Tests:** No dedicated spec; covered by per-page admin-layout/admin-nav/accessibility suites (200, layout, sidebar shows On/Off analytics badge, WCAG). PostHog field rendering not directly asserted.
- **Gaps / improvement ideas:** Read-only config mirror — no live PostHog data (impressions/events), despite "Dashboard" naming. The status card shows raw `ph.enabled | default: false` text (prints "true"/"false"/"false") inconsistently with the badge styling below; normalize. No test that secret-shaped PostHog values (api_key) are absent here (they're not rendered, but worth a guard test).

### Statistics Dashboard
- **Purpose:** Full content-analytics portal at `/about/stats/` (layout `stats`): overview metrics, top categories/tags, tag cloud, quick facts/insights, and a no-data onboarding state. Data is regenerated on every build.
- **Capabilities:** header with rotating icon + last-updated/refresh; quick-jump button group (overview/categories/tags/metrics); four overview cards (posts, total content, categories, words with delimiter); categories & tags lists capped at 15 with "show N more" expand toggles (`stats.js`), activity/usage labels, summary footers (total/most/avg); tag cloud with size tiers (`fs-xl/lg/md/sm`) + tooltips; metrics column (content overview, top performers with progress bars, data-health completeness score + help modal); print/refresh actions; no-data state with generation instructions/troubleshooting; build-time JS animates progress bars, smooth-scroll, fade-in/IntersectionObserver; `content_statistics_generator.rb` runs `generate_statistics.rb` after init and reloads `site.data.content_statistics` (disable via `content_statistics.auto_generate: false`).
- **Source:**
  - SCSS: `assets/css/stats.css` (loaded only when `page.layout == 'stats'`)
  - Markup: `_layouts/stats.html`, `_includes/stats/{stats-header,stats-overview,stats-categories,stats-tags,stats-metrics,stats-no-data}.html`
  - JS: `assets/js/stats.js` (`toggleAllCategories`/`toggleAllTags`/`StatsDashboard`), plus inline init script in `stats.html`
  - Plugin/data: `_plugins/content_statistics_generator.rb`, `_data/content_statistics.yml`, `_data/generate_statistics.rb`
- **API surface:** ids `#overview`/`#categories`/`#tags`/`#metrics`/`#helpModal`; classes `.stats-card`, `.stats-taxonomy-list`, `.stats-taxonomy-link`, `.stats-category-extra`, `.stats-tag-extra`, `.stats-progress`, `.tag-cloud .fs-xl/lg/md/sm`, `.stats-icon-rotate`, `.fade-in`/`.slide-up`; data-attrs `data-width`, `data-hidden-count`, `aria-expanded`; JS globals `window.toggleAllCategories`, `window.toggleAllTags`, `window.StatsDashboard.VISIBLE_LIMIT` (=15); CSS uses `--bs-*` tokens (no `--zer0-*`).
- **Tests:** No dedicated `test/visual/stats*.spec.js`; the stats page IS in ADMIN_PAGES so admin-layout/admin-nav/accessibility cover it (200, header title "Site Statistics Portal", breadcrumb, WCAG, console errors). `content_statistics_generator.rb` helper `generator_script` unit-tested in `test/test_plugins.rb` (finds in source, falls back to theme root, nil when missing); run by `test/test_core.sh`. The expand toggles, tag-cloud sizing, completeness scoring, and no-data state have no behavioral assertions.
- **Gaps / improvement ideas:** `stats.css` is large with duplicated `@keyframes shimmer`, two `@media print` and two `prefers-reduced-motion` blocks, and many unused classes (`.stats-shimmer`, `.tag-shimmer`, `.fade-in-up`, `.bg-outline-success`) — dedupe/prune. The `stats.js` script tag is conditionally injected from BOTH stats-categories and stats-tags (guarded by category-count) — fragile loading; load it once in the layout. No test exercises `toggleAllCategories/Tags`, the progress-bar `data-width` animation, or the no-data branch. `data-width` width is only applied via JS, so progress bars are 0% without JS (no-JS fallback gap). Categories/tags `slugify` anchors to `/categories/`/`/tags/` aren't verified to exist.

### Setup Wizard
- **Purpose:** Multi-step interactive `_config.yml` generator (dev-only) on the `setup` layout: collect identity/URLs/collections/analytics, preview the generated YAML, then copy/download.
- **Capabilities:** 5 pill-tab steps (Identity, URLs, Collections, Analytics, Review) with Next/Back buttons that switch Bootstrap tabs; collection toggles; PostHog enable + key; social links; description char counter (160); `buildYAML` emits a full config (identity, GitHub with YAML anchors `&github_user`/`&github_repository`, URLs, collections + permalinks, defaults, build, plugins, analytics, social, exclude) with `yamlValue` quoting/`pad` alignment; live preview updates on tab change; download `_config.yml` via Blob; copy YAML.
- **Source:**
  - SCSS: —
  - Markup: `_layouts/setup.html`, `_includes/setup/wizard.html`
  - JS: `assets/js/setup-wizard.js` (`buildYAML`, `yamlValue`, `collectionPermalink`, download/copy/preview)
  - Plugin/data: none (client-only)
- **API surface:** ids `#setup-wizard`, `#wizardTabs`, `#tab-identity/urls/collections/analytics/review`, `#step-*`, `#yaml-preview`, `#btn-download`, `#btn-copy`/`#btn-copy-full`, `#desc-count`, `#cfg-title`…; classes `.cfg-field`, `.cfg-collection`, `.btn-next`, `.btn-prev`; data-attrs `data-key` (dotted for `posthog.*`), `data-col`, `data-next`/`data-prev`; layout front matter `setup_step`/`setup_total` drive a progress bar. No globals/events/CSS vars.
- **Tests:** No automated tests. (Not in ADMIN_PAGES; no spec targets the wizard, the setup layout, or `setup-wizard.js`.)
- **Gaps / improvement ideas:** Entirely untested despite generating a config users paste into their repo — add tests for step navigation, the description counter, collection toggles affecting `collections:`/`defaults:`, PostHog/social conditionals, and that `yamlValue` quotes special chars so the output is valid YAML (the README claims dev-only guarding but the include itself isn't guarded — verify). Step tabs aren't gated by validation (can skip required fields). Loads `setup-wizard.js` via a non-deferred `<script>` at include end.

### Setup Banner & Setup Check
- **Purpose:** Detect an unconfigured site (still on theme defaults) and show a dismissible "Almost there!" banner linking to the setup wizard; provides shared `site_needs_setup`/`site_is_user_repo` Liquid vars.
- **Capabilities:** `setup-check.html` sets `site_needs_setup` via explicit `site.site_configured` flag or heuristics (no owner founder/author/email, or title matches placeholder list like `zer0-mistakes`/`My Awesome Site`/empty) and `site_is_user_repo` (empty baseurl + `.github.io` url); `setup-banner.html` fast-exits when `site.site_configured` and otherwise renders `setup-banner-inner.html` via `include_cached` (one render reused across the whole build); inner banner is a dismissible top alert linking to `#setup-wizard`; the `setup` layout also shows a "Setup required" alert + progress indicator using the same check.
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/setup-banner.html`, `_includes/components/setup-banner-inner.html`, `_includes/components/setup-check.html`, consumed by `_layouts/setup.html`
  - JS: — (Bootstrap alert dismiss)
  - Plugin/data: reads `site.site_configured`/`title`/`founder`/`author`/`email`/`baseurl`/`url`
- **API surface:** ids `#setup-banner`; Liquid vars `site_needs_setup`, `site_is_user_repo`; classes `.alert.alert-primary.alert-dismissible`; data-attr `data-bs-dismiss="alert"`. No globals/events/CSS vars.
- **Tests:** No automated tests (no spec drives an unconfigured-site state; the homepage/admin WCAG runs occur on the already-configured repo where the banner is suppressed).
- **Gaps / improvement ideas:** The setup-layout "setup guide" link points at `/404.html` (placeholder) — fix to a real guide. Heuristic placeholder-title list will misfire if a real site legitimately uses one of those titles. No test covers the unconfigured branch — add a fixture build with default config to assert the banner renders and that a configured site suppresses it (the `include_cached` perf path especially). Dismissal isn't persisted, so the banner reappears every page load.

### Dev Shortcuts
- **Purpose:** Source-code quick-access links (View on GitHub, GitHub.dev, local VS Code, site config) shown in the info panel for the current page. Used inside `info-section.html`.
- **Capabilities:** GitHub blob link, GitHub.dev editor link, and a local `vscode://file…` link (only when not production and `site.local_git` is set), plus a `_config.yml` GitHub link; tooltips; computes the on-disk path from `site.local_git`/`repository_name`/`page.path`/`collections_dir`; gracefully degrades to an instructional message when `site.repository`/`site.branch` are unset (prevents broken `github.com//blob//` URLs).
- **Source:**
  - SCSS: —
  - Markup: `_includes/components/dev-shortcuts.html` (consumed by `_includes/components/info-section.html`)
  - JS: — (Bootstrap tooltips; `is_production` from `env-detect.html`)
  - Plugin/data: reads `site.repository`/`branch`/`collections_dir`/`local_git`/`repository_name`, `page.collection`/`page.path`
- **API surface:** classes `.dev-shortcuts`, `.btn-group-vertical`; data-attrs `data-bs-toggle="tooltip"`, `data-bs-placement`; depends on outer `is_production`. No ids/globals/events/CSS vars.
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** No coverage of the bare-site degradation branch or the production-gated `vscode://` link. The double `replace: "//"` path normalization is brittle for nested paths (won't collapse 3+ consecutive slashes). Relies on a parent-scope `is_production` variable being set (coupling to `info-section.html`) — document or guard.

---

## Widgets, Search & Integrations

Floating/embedded widgets and third-party integrations layered onto the theme: the Claude-powered AI chat assistant, site search (modal + index generator), consent-gated analytics (PostHog, GA, GTM), Mermaid diagrams, keyboard shortcuts and their cheatsheet, the Halfmoon theme switcher, and assorted small includes (cookie consent, powered-by, component showcase, vendor JS loader, SVG sprite). Most are wired into `_layouts/root.html` and `_includes/core/head.html`.

### AI Chat Assistant
- **Purpose:** Floating Claude-powered chat assistant grounded in the current page's content, with optional GitHub actions (open issue / propose PR) and a dev-only local page-edit mode, exposed to the model via Claude tool use.
- **Capabilities:** FAB toggle + slide-in panel (ARIA dialog, Escape/outside-click close, focus management); streaming SSE responses from the Claude Messages API in proxy mode (key server-side) or direct mode (key in page, dev only); strict page-grounding with configurable out-of-scope message; quick-action chips (report issue / suggest improvement / edit page); agentic tool loop (max 5 rounds, 40-message history cap) with tools `get_page_source`, `create_github_issue`, `create_pull_request` (proxy mode only), `update_page_content` (local edit); inline confirmation card before any create/edit; result/link/reload cards; send cooldown (1s); status-code error messages; conditional render (only when enabled AND a usable auth path exists); reduced-motion + mobile responsive.
- **Source:**
  - SCSS: — (scoped `<style>` block inside `_includes/components/ai-chat.html`; uses `--zer0-space-fab-*` and `--zer0-layer-fab-chat` tokens from `_sass/tokens/_spacing.scss`, `_layers.scss`)
  - Markup: `_includes/components/ai-chat.html` (included in `_layouts/root.html:103`)
  - JS: `assets/js/ai-chat.js`
  - Plugin/data: proxy `templates/deploy/chat-proxy/` (Cloudflare `worker.js`, Node `dev-proxy.mjs`, `page-store.mjs`); config via `site.ai_chat` in `_config.yml`/`_config_dev.yml`
- **API surface:** IDs `#aiChatToggle`, `#aiChatPanel`, `#aiChatMessages`, `#aiChatForm`, `#aiChatInput`, `#aiChatSend`, `#aiChatClose`, `#aiChatConfig`/`#aiChatPageContext`/`#aiChatPageContent` (JSON/text config blocks); classes `.ai-chat-toggle`, `.ai-chat-panel`, `.ai-chat-panel--open`, `.ai-chat-message--user/--assistant`, `.ai-chat-bubble`, `.ai-chat-chip`, `.ai-chat-action-card`(`--resolved`), `.ai-chat-typing`; data-attributes `data-prompt`; CSS vars `--zer0-space-fab-offset/-size/-gap`, `--zer0-layer-fab-chat`; no global `window.*` export (IIFE); tools `get_page_source`/`create_github_issue`/`create_pull_request`/`update_page_content`
- **Tests:** `test/visual/security.spec.js` — "page source does not contain common secret patterns" and "raw YAML tab does not expose API keys" assert no `ghp_`/`sk_live_` token patterns leak into the DOM (relevant to direct-mode key exposure), but do not exercise the chat widget itself. No behavioral test for the toggle, streaming, tool confirmations, or grounding. No CSP-header test despite scope wording.
- **Gaps / improvement ideas:** No automated coverage of the widget at all — add Playwright tests for toggle open/close, Escape, focus trap, `aria-hidden`/`aria-expanded` sync, the inline confirmation card, and out-of-scope handling. `renderAssistantMarkdown` builds HTML via regex on escaped text (links forced to `https?` + `rel=noopener`) — worth a unit test for injection edge cases. Direct mode embeds the Anthropic key in page source (documented as dev-only) — a build-time guard could fail production builds that ship `authMode: direct` with a non-empty key. The aria-live `role="log"` region is not asserted anywhere. No focus-trap (Tab can leave the open panel).

### Site Search (modal + index)
- **Purpose:** Site-wide search exposed as a Bootstrap modal that fetches a client-side `/search.json` index and renders ranked, highlighted results; falls back to a `/sitemap/` query page for "view all".
- **Capabilities:** Opens via `/` or Cmd/Ctrl+K shortcut, `navigation:searchRequest` event, or `[data-search-toggle]` buttons; mutually exclusive with the cookie settings modal and the `#info-section` offcanvas (closes them first to avoid stacked backdrops); debounced input (200ms); substring match over title/description/content; `<mark>` highlight with regex-escaped query; snippet extraction around the match; capped at 8 results + "View all results" link; focus + select on open, clears on close; prevents empty submissions; lazy-loads + caches the index (graceful empty-array fallback on fetch error). The `searchbar.html` include is a separate empty `#searchbox`/`#hits` container (legacy InstantSearch-style stub, no JS bound in this cluster).
- **Source:**
  - SCSS: `_sass/components/_search-modal.scss`
  - Markup: `_includes/components/search-modal.html` (`#siteSearchModal`, in `_layouts/root.html:70`), `_includes/components/searchbar.html`, `_includes/search-data.json`, `_layouts/search.html`
  - JS: `assets/js/search-modal.js` (loaded in `_includes/components/js-cdn.html`)
  - Plugin/data: `_plugins/search_and_sitemap_generator.rb` (auto-generates `/search.json` via the `search` layout and `/sitemap/`); `_data/ui-text.yml` for `search_placeholder_text`
- **API surface:** IDs `#siteSearchModal`, `#site-search-input`; classes `.search-modal`, `.search-results`, `.list-group-item`, `.nested-list-group`(`.show`), `.folder`; data-attributes `data-search-form`, `data-search-input`, `data-search-results`, `data-search-empty`, `data-search-toggle`; events listens to `navigation:searchRequest`; index URL `/search.json`; form action `/sitemap/?q=`; config `site.search.generate_index`, `site.search.content_length`, `site.sitemap_page.generate`
- **Tests:** No automated tests covering search behavior (open, debounce, highlight, result rendering, or modal exclusivity). `test/visual/styling.spec.js` indirectly verifies same-origin assets load but does not touch search.
- **Gaps / improvement ideas:** **Bug:** `_includes/navigation/unified-drawer.html:100` opens `data-bs-target="#search-modal"`, but the modal id is `siteSearchModal` — that drawer Search button is dead (works only via `data-search-toggle`/shortcut). Add Playwright coverage for `/` and Cmd/Ctrl+K opening, result highlighting, the empty/"no results" states, and the cookie-modal/offcanvas exclusivity logic. The `searchbar.html` stub renders unused `#searchbox`/`#hits` with no client code — confirm it is intentional or remove. Search is plain substring matching (no fuzzy/relevance ranking); consider weighting title matches. No `aria-live` announcement of result counts for screen readers.

### Cookie Consent
- **Purpose:** GDPR/CCPA-style consent banner + preferences modal that records granular consent (essential/analytics/marketing) in localStorage and drives PostHog opt-in/opt-out.
- **Capabilities:** Slide-up banner after a 1s delay for first-time visitors; "Accept All" / "Reject All" / "Manage Cookies" actions; preferences modal with toggles for analytics and marketing (essential always-on), provider disclosure `<details>`; 365-day consent expiry with re-prompt; persists to `localStorage` (`zer0-cookie-consent`); calls `posthog.opt_in_capturing()`/`opt_out_capturing()`; dispatches `cookieConsentChanged`; exposes `window.cookieManager`; transition-aware hide with reduced-motion/timeout fallback.
- **Source:**
  - SCSS: `_sass/components/_cookie-banner.scss` (banner); modal helper styles inline in the include
  - Markup: `_includes/components/cookie-consent.html` (in `_layouts/root.html:100`)
  - JS: inline `<script>` in the include
- **API surface:** IDs `#cookieConsent`, `#cookieSettingsModal`, `#acceptAllCookies`, `#rejectAllCookies`, `#rejectAllModal`, `#saveCookiePreferences`, `#analyticsCookies`, `#marketingCookies`; classes `.cookie-consent-banner`, `.cookie-banner-visible`, `.cookie-category`, `.cursor-pointer`; events dispatches `cookieConsentChanged`; globals `window.cookieManager` (`getConsent`, `setConsent`, `showBanner`, `hideBanner`, `hasConsent`), `window.cookieConsent`; CSS vars `--zer0-layer-cookie-banner`, `--zer0-color-bg-elevated/-muted/-ink/-border`, `--zer0-motion-duration-slow/-base`, `--zer0-motion-ease-standard`; storage key `zer0-cookie-consent`
- **Tests:** No automated tests for consent flow, persistence, expiry, or PostHog opt-in/out wiring.
- **Gaps / improvement ideas:** No coverage of the banner appearing for first visit, persistence across reloads, the 365-day expiry path, or that rejecting actually opts PostHog out. The marketing toggle is hard-coded to never persist `true` ("Accept All" keeps marketing false) — UI implies it's toggleable; align copy or implementation. `.cookie-category` uses a hard-coded `#dee2e6` border (not token-aware, breaks in dark mode) — migrate to `--bs-border-color`. Modal close after save/reject calls `bootstrap.Modal.getInstance(...).hide()` without a null guard. No `prefers-reduced-motion` test for the banner transition.

### PostHog Analytics
- **Purpose:** Privacy-first product analytics, loaded only in production and gated by consent + Do-Not-Track, with rich Jekyll-specific custom event tracking.
- **Capabilities:** Production-only render (`jekyll.environment == "production"` + `site.posthog.enabled`); respects `navigator.doNotTrack`; configurable autocapture/pageview/pageleave/session-recording with input masking + optional IP anonymization; registers page/site properties; custom events for downloads, external links, search, scroll depth (25/50/75/90), code/TOC/sidebar interactions; exposes `window.zer0Analytics` (track/identify/reset); dev fallback no-op stubs.
- **Source:**
  - Markup/JS: `_includes/analytics/posthog.html` (inline; in `_layouts/root.html:115`)
  - Plugin/data: `site.posthog.*` config; integrates with cookie-consent's `opt_in/out_capturing`
- **API surface:** globals `window.posthog`, `window.posthogConfig`, `window.zer0Analytics` (`track`, `identify`, `reset`); custom events `file_download`, `external_link_click`, `search_query`, `scroll_depth`, `code_interaction`, `toc_click`, `sidebar_navigation`; config keys `site.posthog.enabled/api_key/api_host/autocapture/capture_pageview/session_recording/privacy.*/custom_events.*`
- **Tests:** `test/visual/security.spec.js` — secret-pattern tests check that `phc_` PostHog keys and other secrets do not appear in the rendered DOM / config tabs. `test/test_quality.sh` `test_secure_configurations` greps templates for `Content-Security-Policy`/`X-Frame-Options`/`X-Content-Type-Options` (informational, not enforced). No test exercises PostHog loading or consent gating.
- **Gaps / improvement ideas:** Because the include only renders in production, the consent gate and DNT logic are effectively untested (the security spec runs against a dev-style build). Consider a build-fixture test asserting the production build emits the PostHog snippet only when `posthog.enabled` and never inlines a raw `phc_` key in non-production. Multiple `document.addEventListener('click', ...)` handlers are registered separately (minor; could be consolidated). `console.log` statements remain in production output.

### Google Analytics (gtag) & Google Tag Manager
- **Purpose:** Optional Google Analytics (gtag.js) and Google Tag Manager integrations, loaded only in production and skipped on local/dev hostnames.
- **Capabilities:** GA: injects `gtag/js?id=<site.google_analytics>` and runs `gtag('config', ...)`; GTM head: standard async loader (hard-coded container `GTM-NN8P7RZ`); GTM body: `<noscript>` iframe fallback; all three short-circuit on `localhost`/`127.0.0.1`/`0.0.0.0`/`[::1]`/`host.docker.internal`/`*.local`/`*.test` so a prod build served locally does not track.
- **Source:**
  - Markup/JS: `_includes/analytics/google-analytics.html` (in `head.html:123`, prod + `site.google_analytics` only), `_includes/analytics/google-tag-manager-head.html` (`head.html:34`, prod only), `_includes/analytics/google-tag-manager-body.html`
- **API surface:** globals `window.dataLayer`, `gtag`; config `site.google_analytics`; hard-coded GTM container id `GTM-NN8P7RZ`
- **Tests:** `test/visual/security.spec.js` secret-pattern checks indirectly guard against credential leakage. No dedicated analytics-loading test.
- **Gaps / improvement ideas:** GTM container id `GTM-NN8P7RZ` is hard-coded (theme author's own container) rather than read from `site.gtm_id` — a downstream fork inherits the author's GTM. Make it config-driven and gate GTM behind `if site.gtm_id`. GA/GTM are not consent-gated the way PostHog is (they load purely on production hostname check, bypassing the cookie banner) — wire them to `window.cookieManager.hasConsent('analytics')` for true GDPR compliance. No automated test confirms the local-hostname skip actually prevents script injection.

### Mermaid Diagrams
- **Purpose:** Client-side Mermaid.js diagram rendering (GitHub-Pages-safe, bundled locally) supporting both fenced ```mermaid blocks and `.mermaid` divs, theme-aware to Bootstrap's `data-bs-theme`.
- **Capabilities:** Loads bundled Mermaid v10 (`site.mermaid.src`); converts `code.language-mermaid`/`pre[data-language="mermaid"]` into `.mermaid` divs; light/dark theme variable sets keyed off `data-bs-theme` (treats `wizard` as dark, falls back to `prefers-color-scheme`); flowchart/sequence/gantt tuning; `securityLevel: loose`; MutationObserver re-renders on theme switch; loading placeholder, dark/light SVG overrides, responsive + print styles. Only active when `page.mermaid: true` (gated in `head.html`).
- **Source:**
  - SCSS: — (inline `<style>` in the include)
  - Markup/JS: `_includes/components/mermaid.html` (included in `_includes/core/head.html:54` when `page.mermaid`)
  - Plugin/data: `site.mermaid.src`; bundles `assets/vendor/font-awesome/css/all.min.css`
- **API surface:** classes `.mermaid`, `code.language-mermaid`, `pre[data-language="mermaid"]`; global `mermaid` (vendor); attribute observed `data-bs-theme`; config `site.mermaid.src`
- **Tests:** No automated tests for diagram conversion or theme re-rendering.
- **Gaps / improvement ideas:** `securityLevel: 'loose'` permits HTML in diagrams (XSS surface if user content is rendered) — document the trade-off or tighten to `'strict'` for untrusted content. The ~90-line theme config is duplicated between initial init and the MutationObserver re-render — extract to a shared `mermaid.initialize(...)` call. No test asserts that ```mermaid fences become rendered SVG, nor that a `data-bs-theme` toggle re-renders. `lineColor` is defined twice in the dark themeVariables object.

### Keyboard Shortcuts
- **Purpose:** Global keyboard navigation (ES module) for section paging, search, sidebar/TOC toggles, and opening the shortcuts help modal.
- **Capabilities:** Bindings `[`/`]` (prev/next TOC section), `/` (focus search or dispatch `navigation:searchRequest`), `b` (toggle left sidebar), `t` (toggle TOC), `?` (open `#zer0-shortcuts-modal`); ignores keystrokes while typing in inputs/textarea/select/contenteditable (with a `typeof matches` guard against Document-target TypeError); `?` checked before `/` fallback so Shift+/ opens help not search; integrates with `window.zer0Navigation` modules with Bootstrap Offcanvas fallback; dispatches `navigation:keyboardNav`/`sidebarToggle`/`searchRequest`; `getShortcuts()` + `destroy()`; toggleable via `config.keyboard.enabled`.
- **Source:**
  - JS: `assets/js/modules/navigation/keyboard.js` (orchestrated by `assets/js/modules/navigation/index.js`, loaded via `js-cdn.html`); config in `assets/js/modules/navigation/config.js`
- **API surface:** class `KeyboardShortcuts`; events dispatched `navigation:keyboardNav`, `navigation:sidebarToggle`, `navigation:searchRequest`; consumes `window.zer0Navigation.getModule('sidebarVisibility'|'tocVisibility')`; config `config.keyboard.enabled`, `config.keyboard.keys.*`, `config.selectors.tocLinks` (`#TableOfContents a`); target modal `#zer0-shortcuts-modal`; gate `site.navigation.keyboard_shortcuts`
- **Tests:** No automated tests for keybindings or the typing-guard.
- **Gaps / improvement ideas:** No coverage that `/` opens search, `?` opens the help modal (and not search), or that the input-focus guard suppresses shortcuts. The shortcut set in `config.keyboard.keys` and the `getShortcuts()` map omit `?` (help) and don't match the labels rendered in `shortcuts-modal.html` — single-source the list. `console.log` on init/destroy is noisy in production.

### Shortcuts Cheatsheet Modal
- **Purpose:** Static, i18n-able modal that documents the keyboard shortcuts, opened by pressing `?`.
- **Capabilities:** Bootstrap centered modal listing `/`, `[`, `]`, `b`, `t`, `?` with localized descriptions from `_data/ui-text.yml`; always present in the DOM (the `?` handler is a no-op if absent); labelled heading + close button.
- **Source:**
  - Markup: `_includes/components/shortcuts-modal.html` (in `_layouts/root.html:73`)
  - JS: opened by `assets/js/modules/navigation/keyboard.js`
  - Plugin/data: `_data/ui-text.yml` (`shortcuts_*` keys); gate `site.navigation.keyboard_shortcuts`
- **API surface:** ID `#zer0-shortcuts-modal` (title `#zer0-shortcuts-modal-title`); uses Bootstrap `.modal`/`data-bs-dismiss`; i18n keys `ui.shortcuts_title/_search/_prev_section/_next_section/_toggle_sidebar/_toggle_toc/_show_help`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** The hard-coded `<kbd>` list can drift from `config.keyboard.keys` (e.g. if a fork remaps keys) — generate from config or assert parity in a test. No Playwright test that `?` opens this modal. The comment says it renders only when `keyboard_shortcuts != false`, but the markup has no visible `{% if %}` guard in this file — verify the gate lives in the include site.

### cheetsheet.js (Bootstrap component demos)
- **Purpose:** Bootstrap-docs-style initializer that activates tooltips/popovers/toasts and wires aside-nav active-state on a cheatsheet/component-demo page.
- **Capabilities:** Instantiates `bootstrap.Tooltip` (delegated via `.tooltip-demo`), `bootstrap.Popover`, and auto-showing non-autohide `.toast`; neutralizes `href="#"`/`type="submit"` clicks; `setActiveItem()` syncs `.bd-aside` active link to the URL hash on load and `hashchange`.
- **Source:**
  - JS: `assets/js/cheetsheet.js` (note: filename misspelling preserved; not referenced in `js-cdn.html` — loaded only by specific demo pages)
- **API surface:** classes `.tooltip-demo`, `.toast`, `.bd-aside`; selectors `[data-bs-toggle="tooltip"]`, `[data-bs-toggle="popover"]`, `[href="#"]`, `[type="submit"]`; events `hashchange`; depends on global `bootstrap`
- **Tests:** No automated tests.
- **Gaps / improvement ideas:** `setActiveItem()` dereferences `link.parentNode.parentNode.previousElementSibling` and calls `.classList`/`.click()` without null guards — throws on markup that doesn't match the expected `.bd-aside` nesting. Filename "cheetsheet" is misspelled; consider renaming to `cheatsheet.js`. No usage in `js-cdn.html` means it's silently page-opt-in — document where it's loaded.

### Halfmoon Theme Switcher
- **Purpose:** Light/dark/auto color-mode toggler (Bootstrap dropdown) that persists the choice and applies `data-bs-theme`, adapted from Bootstrap's docs color-mode toggler.
- **Capabilities:** Reads/writes `localStorage('theme')`; `auto` follows `prefers-color-scheme` and live-updates on system change when not explicitly set; sets `data-bs-theme` on `<html>`; `showActiveTheme()` syncs the active icon, `aria-pressed`, and the toggle's `aria-label`; applies preferred theme before paint to avoid flash.
- **Source:**
  - Markup: `_includes/components/halfmoon.html` (dropdown; included by `info-section.html`, `theme-controls-bar.html`)
  - JS: `assets/js/halfmoon.js` (loaded in `_includes/core/head.html:42`)
- **API surface:** IDs `#bd-theme`, `#bd-theme-text`; classes `.bd-theme-dropdown`, `.bd-theme-menu`, `.theme-icon-active`; data-attribute `data-bs-theme-value` (`light`/`dark`/`auto`); attribute set `data-bs-theme`; storage key `theme`; SVG sprite refs `#sun-fill`/`#moon-stars-fill`/`#circle-half`/`#check2`
- **Tests:** No dedicated switcher test. `test/visual/styling.spec.js` asserts `--bs-primary`/`--zer0-color-primary` resolve (theme tokens load) but not the toggle. Theme-color/skin specs (`theme-colors.spec.js`, `skins.spec.js`) exercise color modes but not this dropdown.
- **Gaps / improvement ideas:** No coverage that clicking `light`/`dark`/`auto` flips `data-bs-theme`, persists, and updates `aria-pressed`/icon. The static markup hard-codes `dark` as the active item (`.active`, `aria-pressed="true"`) — if the stored/preferred theme is light, there is a brief mismatch until `showActiveTheme()` runs. `keyboard.js`/mermaid treat a `wizard` theme value as dark, but this switcher only offers light/dark/auto — document the `wizard` mode's origin.

### Misc Widgets (powered-by, component-showcase, js-cdn, svg)
- **Purpose:** Small supporting includes: footer/home "Powered By" credit cards, a live Bootstrap component demo gallery, the local vendor-JS loader, and an inline SVG icon sprite.
- **Capabilities:** **powered-by.html** — renders `site.powered_by` entries as Bootstrap cards (name, optional version, external link with `rel="nofollow noopener noreferrer"`, icon). **component-showcase.html** — parameterized (`sections=`) gallery of live Bootstrap 5.3 examples (alerts, buttons, badges, cards, accordion, tabs, progress, breadcrumbs, table, tooltips, list-group). **js-cdn.html** — loads bundled Bootstrap, the navigation ES-module orchestrator (cache-busted by `site.time`), UI helpers, posts-pagination, search-modal, share-actions, background-customizer, Obsidian wiki-links, and opt-in appearance/user-override scripts (no runtime CDN). **svg.html** — hidden `<svg>` sprite of Bootstrap-icon `<symbol>`s consumed by `<use href="#...">`.
- **Source:**
  - Markup: `_includes/components/powered-by.html`, `component-showcase.html`, `js-cdn.html` (in `root.html:111`), `svg.html` (in `root.html:57`)
  - JS: scripts referenced by `js-cdn.html` (`assets/js/*` + `assets/js/modules/navigation/index.js`)
  - Plugin/data: `site.powered_by`, `site.appearance_panel`, `site.user_overrides`, `site.obsidian.attachments_path`, `assets/data/wiki-index.json`
- **API surface:** powered-by: classes `.card`, config `site.powered_by[].name/version/url/icon`, `site.default_icon`. showcase: param `include.sections`, anchor ids `#showcase-*`. js-cdn: `window.OBSIDIAN_CONFIG`, gates `site.appearance_panel`/`site.user_overrides`, cache-bust `?v={site.time}`. svg: `<symbol id="...">` consumed via `<use href="#id">`.
- **Tests:** `test/visual/styling.spec.js` — "homepage does not reference common third-party CDNs for core assets" and "same-origin CSS assets return 200" validate the no-CDN posture that `js-cdn.html` enforces; "HTML references compiled main stylesheet" confirms asset wiring. No tests for `powered_by` rendering, the showcase gallery, or SVG sprite integrity.
- **Gaps / improvement ideas:** `styling.spec.js` bans CSS CDNs but does not assert that JS (`js-cdn.html`) is fully same-origin — extend the banned-CDN check to `<script src>` too. No test that every `<use href="#icon">` in the theme has a matching `<symbol>` in `svg.html` (broken icons fail silently). `component-showcase.html` is large (~22KB) and untested; a smoke test that each `sections=` value renders its anchor would catch regressions. `powered-by.html` has no empty-state when `site.powered_by` is unset.

---

## Testing Infrastructure & Coverage

The test harness has two halves: a **Playwright** behavioral/visual suite under `test/visual/` (driven by `test/playwright.config.js`) and a set of **Bash** theme/integration suites under `test/` (orchestrated by `test/test_runner.sh`). The canonical entrypoint is `scripts/bin/test`.

### How to run

Playwright tiers are exposed as **projects** in `test/playwright.config.js` (single config, no per-tier files). Defaults: `baseURL = http://127.0.0.1:4011` (override with `BASE_URL`), `workers: 1` / `fullyParallel: false` (predictable Jekyll load), `timeout: 45s`, snapshots committed to `test/visual/snapshots/`, screenshot tolerance `maxDiffPixels: 150` / `threshold: 0.2`. The runner script `test/test_playwright.sh` spawns a short-lived Jekyll server on `STYLING_PORT` (default `4011`) unless `BASE_URL` points at an existing one.

| Tier | Local command | CI invocation | Asserts | Platform caveat |
|---|---|---|---|---|
| **smoke** | `npm run test:smoke` | `.github/actions/playwright-tests` (`project: smoke`) | All specs **except** the pixel block (`grepInvert: /homepage visual snapshot/`) — DOM/CSS/layout/a11y behavior on Desktop Chrome | Platform-independent; runs on macOS. This is the gating tier. |
| **snapshots** | `npm run test:snapshots` | same action, `project: snapshots`, `continue-on-error: true`, path-filtered on `detect-changes.outputs.styling` | Pixel-perfect homepage screenshots for the **9 skins** (`skins.spec.js` `homepage visual snapshot` tests) | Baselines are **Linux-only** (`*-snapshots-linux.png`). They **predate the PR #108 UI overhaul and currently drift** large; non-blocking in CI. Running on macOS produces no matching baseline. |
| **regression** | `npm run test:regression` | manual / `workflow_dispatch` only | All specs across chromium + firefox + webkit | Cross-browser; not wired into push CI. |
| **update baselines** | `npm run test:update-snapshots` (or `UPDATE_SNAPSHOTS=1 ./test/test_playwright.sh`) | — | Regenerates the Linux skin baselines | Must run on Linux (or in CI/Docker) to produce valid `*-linux.png`. |
| **shell suites** | `./scripts/bin/test` (all) or `./test/test_runner.sh --suites <list>` | `./scripts/bin/test` + `test-suite` action | Theme structure, build, install, obsidian, etc. (below) | Platform-independent. |

The 9 committed baselines under `test/visual/snapshots/skins.spec.js-snapshots/` are all homepage-only: `homepage-{air,aqua,contrast,dark,dirt,mint,neon,plum,sunrise}-snapshots-linux.png`.

### Playwright specs

All live in `test/visual/`; shared helpers in `test/visual/fixtures.js` (`SKINS` [9], `VIEWPORTS` [mobile/tablet/midDesktop/desktop/wideDesktop], `ADMIN_PAGES` [8], `UI_ROUTES`, `waitForJekyll`, `setSkin`, `clearSkinStorage`, `gotoBeforeScrollSpy`, `gotoOrSkip`, `collectConsoleErrors`, `boxesOverlap`, `assertStackedVertically`). Counts are approximate — many tests are generated in loops over `ADMIN_PAGES`/`SKINS`/`VIEWPORTS`.

| Spec file | What it covers | ~#tests | Tier |
|---|---|---|---|
| `accessibility.spec.js` | axe-core WCAG 2.1 AA audits (homepage, FAQ, 8 admin pages = 0-violation); component checks (sidebar `aria-label`, color-input labels, tab ARIA roles, `<hr>`-in-`<li>`); skip-link/code-copy focusability; per-viewport advisory scans | ~22 | smoke |
| `admin-layout.spec.js` | Per admin page: 200 status, header+title, breadcrumbs, header icon, content area; desktop sidebar visible + active highlight; mobile toggle/offcanvas open; no console errors | ~55 (8 pages × loops) | smoke |
| `admin-nav.spec.js` | Sidebar renders all nav items; internal links → 200; external links have `target=_blank`/`rel=noopener`; active-state tracking; clicking a sidebar link navigates | ~12 | smoke |
| `backgrounds.spec.js` | `zer0Bg.toggle()` sets `data-zer0-bg`, localStorage persistence, `zer0:bg-toggle` event, `setOpacity()` CSS vars, persistence across navigation | 8 | smoke |
| `config-editor.spec.js` | `/about/config/` Edit & Export tab: tab activates, fields pre-populated, title→YAML preview, skin dropdown options, download button (guarded with `test.skip` if absent) | 5 | smoke |
| `config-viewer.spec.js` | `/about/config/` viewer: 200, accordion sections, search filter, no-results graceful; **section-copy YAML-quoting test is `test.fixme` (disabled)** | 4 (1 fixme) | smoke |
| `env-dashboard.spec.js` | `/about/settings/environment/`: 200, overview cards, Jekyll version present/valid, no `undefined`/`NaN`/`null`, non-empty plugin list; Ruby-version test is `test.fixme` | 5 (1 fixme) | smoke |
| `layouts.spec.js` | Layout structure: single `<h1>`, landing features from `_data/landing.yml`, hero CTA names, pagination `aria-current`, breadcrumb `<ol>`/`<li>`, article single-H1, **`?` opens shortcuts modal**, welcome H1, token wiring, axe smoke | ~12 | smoke |
| `security.spec.js` | `/about/config/` secret exposure: hidden `pre#cfg-full-yaml` sanitized, Raw-YAML tab has no API-key patterns (`phc_`/`sk_`/`ghp_`), page source has no token patterns | 3 | smoke |
| `skins.spec.js` | Per skin (9): `data-theme-skin` attr, localStorage persist, restore-after-nav, **homepage pixel snapshot**; plus `currentSkin()` + `skin-change` event | ~38 (attr tests=smoke; 9 snapshots=snapshots tier) | smoke + snapshots |
| `styling.spec.js` | Stylesheet plumbing: same-origin CSS = 200, `main.css` linked, `--bs-primary`/`--zer0-*` resolve, no banned CDNs; navbar/brand chrome render; docs-layout regions | ~9 | smoke |
| `theme-colors.spec.js` | `/about/settings/theme/` Color Editor: 200, color pickers have `#RRGGBB`, picker↔text-input sync, YAML export quotes hex | 4 | smoke |
| `ui-refresh.spec.js` | v1.8+ UI: navbar tiers/labels/brand overlap, mobile quicklinks, intro hero stacking/button heights, code-block header+gutter, content-table CSV toolbar, footer links/columns, docs ToC/FAB, section archive, feature badges, theme-preview, focus/landmark smoke across viewports | ~20 | smoke |

### Shell / theme suites

Routing lives in `test/test_runner.sh`. `--suites all` runs the six core suites; `--suites full` adds obsidian + both Playwright tiers. `playwright` → `PLAYWRIGHT_PROJECT=smoke`, `playwright_snapshots` → `PLAYWRIGHT_PROJECT=snapshots` (legacy aliases `styling`→`playwright`, `visual`→`playwright_snapshots`).

| Suite | What it checks |
|---|---|
| `test_core.sh` | Theme file structure/syntax, Jekyll config + build process, core dependencies, basic integration |
| `test_deployment.sh` | Local + remote install flows, Docker setup/serving, end-to-end deploy workflow (`--skip-docker`/`--skip-remote` honored) |
| `test_quality.sh` | Security scanning, accessibility/WCAG, cross-platform compatibility, performance benchmarks |
| `test_installation.sh` | Legacy `install.sh` CLI args, install modes (full/minimal), error handling, edge cases, upgrade + remote install |
| `test_installer.sh` | Installer regression matrix — every install profile exits 0 with expected agent files + deploy artifacts (`--ai` tier needs `OPENAI_API_KEY`) |
| `test_site_generation.sh` | Config-matrix generator: builds a site for each mode (full/minimal/remote_theme/gem) and validates generated content |
| `test_obsidian.sh` | 3 layers: Ruby `obsidian_links.rb` unit tests, JS `obsidian-wiki-links.js` resolver tests, and a `jekyll build` smoke that asserts `assets/data/wiki-index.json` is well-formed |
| `test_playwright.sh` | Boots/reuses Jekyll, runs the requested Playwright project (smoke default, or snapshots/regression via `PLAYWRIGHT_PROJECT`) |

`scripts/bin/test` (no suite arg, the way CI calls it) runs the **canonical script suites**: `scripts/test/lib` unit tests, `scripts/test/theme/validate`, `scripts/test/integration/*` (auto-version, mermaid), and the `test/test_install_*.sh` e2e suites.

### CI gating (`.github/workflows/ci.yml`, job `test`)

`detect-changes` emits a `styling` output (true when `test/visual/**` or `test/playwright.config.js` changed). Within the `test` matrix job:

1. **Theme suites** — `test-suite` action runs `core,deployment,quality,installation,installer,site_generation,obsidian` (`skip-docker`/`skip-remote`). **Blocking.**
2. **Script suites** — `./scripts/bin/test` (lib + theme validate + integration + installer e2e). **Blocking.**
3. **Playwright smoke** — `project: smoke`. **Blocking** — the real behavioral gate.
4. **Playwright snapshots** — `project: snapshots`, **`continue-on-error: true`**, runs only on styling changes. **Non-blocking**: uploads diff artifacts so drift stays visible but cannot fail the build. Drop `continue-on-error` once the Linux baselines are regenerated.

Cross-browser `regression-*` projects are **not** in push CI — manual/`workflow_dispatch` only.

### Biggest UI test-coverage gaps (no behavioral Playwright coverage)

Prioritized — interactive behaviors the smoke tier never exercises:

- **Search modal / `search.json`** — zero coverage. No test opens search, types a query, asserts results, or keyboard-navigates. **(High)**
- **AI chat widget** (`assets/js/ai-chat.js`) — zero coverage. No test opens the widget, sends a message, or exercises dev page-edit mode. **(High)**
- **Code-copy click → clipboard write** — copy buttons are only asserted *focusable/visible*; the one test that clicks copy and reads the clipboard (`config-viewer.spec.js`) is `test.fixme`. **(High)**
- **Navbar dropdown open/close + keyboard nav** — only label/brand layout and toggler *visibility* are checked; nothing clicks a dropdown open, asserts menu visibility, Escape-to-close, or arrow-key nav. **(High)**
- **Theme customizer "apply"** — picker↔text sync and YAML-quoting are tested, but no test applies a color and asserts the live `--zer0-*` var / preview updates; export paths are skip/`fixme`. **(Medium)**
- **Obsidian wiki-links / backlinks / callouts in rendered pages** — covered only by Ruby/JS unit tests; **no Playwright test** loads a page with `[[wiki-links]]`/embeds/callouts/backlinks and asserts client-side resolution. **(Medium)**
- **Keyboard-shortcuts modal completeness** — `?`-opens is tested; Escape-to-close, focus trapping, and that listed shortcuts fire are not. **(Medium)**
- **Background/skin controls as real UI** — tests drive the `window.zer0Bg` API directly; no test clicks the actual customizer toggle/slider/skin-swatch a user would use. **(Medium)**
- **ToC / sidebar FAB interaction** — FABs are asserted *visible* but never clicked to open/close the offcanvas; ScrollSpy ToC highlighting on scroll is untested. **(Low)**
- **Table CSV export click** — the `.table-copy-csv` button's existence/name is checked, but nothing clicks it and validates the produced CSV. **(Low)**

Net: coverage is strong on **static structure, admin-page rendering, accessibility audits, CSS-var/token wiring, and JS-API-level skin/background state**, but thin on **user-driven interactions** (clicks, typing, keyboard) for the search modal, AI chat, dropdowns, clipboard copy, and theme-apply — exactly the surfaces a UI overhaul is most likely to break.

---

## Coverage Gaps & Improvement Roadmap

**Coverage summary:** 🟢 4 good · 🟡 47 partial · 🔴 60 none (of 111 components).

### Untested components (🔴 none)
These have no automated behavioral coverage — highest-value targets for new Playwright smoke tests.

- **Back-to-Top FAB** (Global Chrome & Primary Navigation) — 200px show/hide threshold, smooth-scroll, and FAB stacking order entirely untested.
- **Auto-Hide Navbar** (Global Chrome & Primary Navigation) — Hide-on-down/show-on-up, body-padding compensation, reduced-motion, and offcanvas-pause all untested; logic duplicated JS/SCSS.
- **Nanobar (scroll/load progress bar)** (Global Chrome & Primary Navigation) — Render, step animation, and three position modes (top/bottom/navbar mount) all untested.
- **Navbar Module (dropdowns/keyboard/tooltips)** (Global Chrome & Primary Navigation) — Rich keyboard menu nav, click dropdowns, and compact-desktop tooltips wholly untested; dead _setupDropdownHoverDelay no-op.
- **Scroll-Spy Module** (Global Chrome & Primary Navigation) — IntersectionObserver active-link highlighting on scroll has no positive coverage.
- **Smooth-Scroll Module** (Global Chrome & Primary Navigation) — Offset scroll, hash pushState, and mobile-offcanvas-close untested; destroy() is a documented no-op leaking listeners.
- **Swipe Gestures Module** (Global Chrome & Primary Navigation) — Edge-swipe sidebar/TOC opening untested; no guard distinguishes edge-swipe from content swipe.
- **Focus Manager Module** (Global Chrome & Primary Navigation) — Focus-return-to-trigger on offcanvas close (a11y requirement) and keyboard-nav body class untested.
- **Sidebar State Module** (Global Chrome & Primary Navigation) — localStorage persistence, restore-on-load, and expandPathTo untested; lost state would be invisible to CI.
- **Nav-tree sidebar (YAML tree mode)** (Sidebar, Table of Contents & Docs Layout) — No coverage of collapse/aria-expanded/active state; inconsistent ARIA across depths; slug id collisions possible.
- **Sidebar categories (categories mode)** (Sidebar, Table of Contents & Docs Layout) — No expand/collapse or active-state test; active styling duplicated in two partials; nested h2 heading-order risk.
- **Sidebar folders (auto mode)** (Sidebar, Table of Contents & Docs Layout) — Dead wiring: JS needs .nested-list-group but the include emits a flat list, so folder disclosure never fires; untested.
- **Scroll-spy (active heading highlight)** (Sidebar, Table of Contents & Docs Layout) — No active-link test; competes with Bootstrap data-bs-spy on <main>; console.log in init.
- **Docs code-example chrome (.bd-example/.bd-clipboard)** (Sidebar, Table of Contents & Docs Layout) — No AnchorJS/clipboard test; dead Algolia bootstrap-docs search binding; .bd-example::after content:null invalid; two parallel copy systems.
- **Landing quick-links bar** (Landing, Home & Component Polish) — No tests; .landing-quick-links SCSS selector never applies (markup emits .bg-dark) — dead/mismatched rule
- **Landing install cards** (Landing, Home & Component Polish) — No tests; snippets lack data-copy buttons; #get-started .card.card-header ~ selector is malformed and never matches
- **Index layout** (Landing, Home & Component Polish) — No direct test; ships no search wiring of its own; duplicate pt-5/py-5 padding
- **Section include (components/section.html)** (Landing, Home & Component Polish) — Unused by landing.html (which inlines equivalent markup) so effectively unexercised; variant/heading-level logic untested
- **Info section / settings offcanvas (components/info-section.html)** (Landing, Home & Component Polish) — Entirely untested; Prod/Dev badge and existence-gated admin links have no behavioral coverage
- **Share actions (LinkedIn/copy)** (Landing, Home & Component Polish) — No tests; excerpt/dedupe/truncate pure functions uncovered; uses its own notify() toast instead of shared window.zer0UI.showToast; openShareWindow called with an unused 2nd arg
- **Skeleton loader** (Landing, Home & Component Polish) — Token-aware but orphaned — no markup or JS emits .skeleton; undocumented public utility, no reduced-motion guard
- **Particles hero background** (Landing, Home & Component Polish) — Fully orphaned — scripts not loaded by any layout/include, no #particles-js element exists; would throw on null container if revived; no reduced-motion respect
- **Runtime Token Injection (tokens-inline.html)** (Theming: Tokens, Color Modes, Skins & Customizers) — No test that theme_color config overrides --zer0-color-* or that the pre-paint localStorage restore runs before main.css.
- **Color Modes (light/dark/wizard)** (Theming: Tokens, Color Modes, Skins & Customizers) — Halfmoon toggle and wizard mode have no behavioral test; wizard is not selectable from any UI.
- **Appearance Panel (appearance.js)** (Theming: Tokens, Color Modes, Skins & Customizers) — Untested; UI exposes only primary though it persists/restores secondary+accent too.
- **Skin Editor (skin-editor.js)** (Theming: Tokens, Color Modes, Skins & Customizers) — Largest theming module, fully untested; custom skins only set --zer0-bg-* (not the component palette) and use inline onclick clipboard handlers.
- **Note layout** (Content & Collections) — Entire layout untested; .note-navigation SCSS (.nav-link-note) doesn't match the Bootstrap pagination markup actually rendered.
- **Notebook layout** (Content & Collections) — Uses --bs-* + prefers-color-scheme instead of --zer0 tokens/[data-bs-theme]; .jp-*/.input-prompt CSS is inert for Jekyll-rendered notebooks.
- **Notes & Notebooks index grids + difficulty badges** (Content & Collections) — Filter JS duplicated inline in two pages; filter buttons lack aria-pressed; .badge-beginner/intermediate/advanced defined but unused (markup uses bg-* directly).
- **Callout** (Content & Collections) — No spec for the five color variants/token wiring; type isn't announced to SR; requires pre-captured markup.
- **Post navigation (prev/next cards)** (Content & Collections) — Hover/focus/disabled states untested; note.html uses a different (Bootstrap pagination) prev/next pattern — divergent implementations.
- **Syntax highlighting** (Content & Collections) — Hardcoded hex palette (not --zer0 tokens) so skins don't affect it; no visual-regression snapshot of light/dark token colors.
- **Author card** (Content & Collections) — article.html re-implements the full card inline (duplication); avatar path convention differs from preview-image.html; no lazy loading.
- **Author E-E-A-T block** (Content & Collections) — Third author renderer overlapping author-card + inline article block; hardcoded default 'bamr87'; Person microdata unvalidated.
- **Post card** (Content & Collections) — stretched-link on title competes with image/category anchors (interaction bug); reading-time fallback is a hardcoded '2 min'; badge precedence untested.
- **Post-type badge** (Content & Collections) — No fallback for unknown post_type (renders nothing); case mapping untested; callers must externally re-check != 'standard'.
- **Feature card** (Content & Collections) — ui-refresh feature-badge test targets the page-level category nav, not this component; nested references branch + docs/demo buttons untested; bg-light tags low-contrast in dark.
- **Preview image** (Content & Collections) — No width/height (CLS risk); prefix logic duplicated between include and Ruby plugin; both untested.
- **Preview-image generator plugin** (Content & Collections) — No Ruby/shell test; has_preview? regex rejects extensionless/query-string URLs; auto_generate is dead code.
- **Comments (Giscus)** (Content & Collections) — data-theme=preferred_color_scheme ignores manual theme toggle; gating inconsistent (article checks site.giscus, note/notebook check .enabled).
- **Share actions (LinkedIn enhancement)** (Content & Collections) — Only note.html uses .js-linkedin-share; article/notebook LinkedIn buttons skip the enhancement; copy-then-open flow + toast + dedup untested.
- **Collection layout** (Content & Collections) — Bespoke card variant (doesn't reuse post-card); literal 'Collection Index - <key>' heading; no empty state; images lack width/height.
- **News layout** (Content & Collections) — ui-refresh section test targets section.html not news.html; 660+ lines with inline style/script, re-implements cards 4+ times instead of post-card; no variant tests.
- **Tag layout** (Content & Collections) — No spec visits /tags/<tag>/; related-tags anchors depend on a tags index contract (fragile); breadcrumb lacks the nav.breadcrumbs+aria-label pattern checked elsewhere.
- **Full Knowledge Graph (graph page)** (Obsidian & Knowledge-Graph Features) — No tests for a complex interactive cytoscape view; canvas graph is inaccessible (single role=img, no keyboard/text fallback).
- **Local Graph (sidebar panel + FAB)** (Obsidian & Knowledge-Graph Features) — BFS subgraph + permalink-fallback + offcanvas FAB wholly untested; same cytoscape inaccessibility as full graph.
- **Backlinks Panel (Linked mentions)** (Obsidian & Knowledge-Graph Features) — Liquid substring matcher (no alias support) untested and prone to false positives/negatives; a third independent link-resolution impl.
- **Environment Switcher** (Admin Tools & Dashboards) — Untested; defines global copyToClipboard colliding by name with config-utility.js; inline onclick conflicts with CSP.
- **Env-Var Helper (zer0-env-var)** (Admin Tools & Dashboards) — Orphaned (no page includes it); references undefined #repo-link with no null guard — latent JS error; inputs lack labels.
- **Setup Wizard** (Admin Tools & Dashboards) — Fully untested config generator; no step validation gating; verify include is actually dev-only guarded and yamlValue output is valid YAML.
- **Setup Banner & Setup Check** (Admin Tools & Dashboards) — Unconfigured-site branch untested; setup-layout 'setup guide' link points to /404.html; dismissal not persisted.
- **Dev Shortcuts** (Admin Tools & Dashboards) — Untested; double // path-normalization brittle for nested paths; relies on parent-scope is_production.
- **AI Chat Assistant** (Widgets, Search & Integrations) — Only indirect secret-leak checks; no behavioral/a11y test for toggle, streaming, tool confirmations, or focus trap.
- **Site Search (modal + index)** (Widgets, Search & Integrations) — No tests; plus a real bug — unified-drawer.html targets #search-modal but the id is siteSearchModal (dead button).
- **Cookie Consent** (Widgets, Search & Integrations) — No coverage of banner show, persistence, 365-day expiry, or PostHog opt-out; .cookie-category border hard-coded #dee2e6.
- **Google Analytics & Tag Manager** (Widgets, Search & Integrations) — GTM container GTM-NN8P7RZ hard-coded (not config-driven); GA/GTM not consent-gated like PostHog.
- **Mermaid Diagrams** (Widgets, Search & Integrations) — securityLevel:'loose' XSS surface; ~90-line theme config duplicated; no render/theme-switch test.
- **Keyboard Shortcuts** (Widgets, Search & Integrations) — No test for /, ?, or typing-guard; getShortcuts() map omits ? and diverges from shortcuts-modal labels.
- **Shortcuts Cheatsheet Modal** (Widgets, Search & Integrations) — Hard-coded <kbd> list can drift from config.keyboard.keys; no test that ? opens it.
- **cheetsheet.js (Bootstrap demos)** (Widgets, Search & Integrations) — setActiveItem() lacks null guards (throws on unexpected markup); filename misspelled; page-opt-in only.

### Partially covered components (🟡 partial)
Assert structure but miss key interactions/states.

- **Header / Site Shell** — Render + skip-link asserted, but lg+ 3-col grid anti-overlap and JS body-padding compensation untested.
- **Branding (title/subtitle)** — Title overlap/visibility tested; subtitle + title-icon breakpoints untested; possible duplicated default_icon class string typo.
- **Primary Navbar (menubar + dropdowns)** — Labels/toggle render asserted; dropdown open/close, keyboard nav, icon-only tier, and auto-gen fallback untested.
- **Navbar Mobile Quicklinks (tablet chips)** — In-window visibility tested; limit:5 truncation, scroll overflow, and md-/lg+ hiding untested.
- **Head (document head / asset pipeline)** — CSS 200s, main.css link, no-CDN asserted; token cascade order and prod-only analytics gating untested.
- **Footer** — Powered-by links + tablet columns tested; quick-link auto-detect, policy gating, and subscribe-form a11y untested.
- **Breadcrumbs** — aria-label + valid <ol> structure tested; Schema.org microdata and known-section special path unverified.
- **Offcanvas Sidebars & Unified Drawer** — Presence of ToC/toggles asserted; unified-drawer tabs, 3 sidebar nav modes, and FOUC-guard path untested.
- **Navbar Extras / FAB Stacking** — FAB presence on mobile asserted; non-overlap stacking math never verified despite available boxesOverlap helper.
- **Navigation Orchestrator (index.js + config.js)** — --zer0-bp-lg token (read by syncBreakpointsFromCss) asserted; window.zer0Navigation init and navigation:ready event untested.
- **Keyboard Shortcuts Module** — Only '?' help-modal shortcut tested; [/], '/', 'b', 't' and the input-field guard untested.
- **Sidebar Visibility Module** — Toggle presence asserted; collapse/restore action, persistence, FOUC class, and mobile branch untested.
- **TOC Visibility Module** — Toggle presence asserted; hide/restore, persistence, FOUC class, and mobile branch untested.
- **Docs layout shell (.bd-layout/.bd-sidebar/.bd-main/.bd-toc)** — Only region presence asserted; rail-collapse, FOUC pref guard, and rail-width tokens (undefined) untested.
- **Section sidebar (topic navigation)** — Only layout containment guarded; ships duplicate inline scroll-spy/CSS, no aria-current, hardcoded offsets, no behavioral test.
- **Table of Contents (Liquid parser + sidebar-right)** — Presence only; parser output/nesting/no-sections fallback untested; legacy .toc ruleset appears unused vs current .bd-toc markup.
- **TOC FAB (mobile trigger)** — Attachment-only assert; no click/open/aria-expanded test; effective-sidebar logic duplicated with default.html.
- **TOC visibility toggle + persistence** — Toggle attached but no persistence/aria/event test; console.log left in production init.
- **Page intro header (.bd-intro family)** — Footer/actions/aria-label asserted; date logic, badges, tag overflow, reading-time, hero contrast untested.
- **Content tables (styling + CSV copy)** — Toolbar presence + header bg asserted; CSV correctness/colspan/exec fallback untested; quick-index has invalid <p>-in-<ul> markup.
- **Landing layout** — H1-count + feature-card + CTA-name + axe asserted, but hero .is-loaded fade-in, tertiary GitHub fallback, and no-image placeholder untested
- **Home layout** — h1 count covered when / uses it; hide_title and rss_subscribe:false branches untested
- **Welcome layout** — Only h1-presence asserted; accordion, wizard, and site_needs_setup gating untested; hardcoded GitHub README anchor links
- **Feature card include (components/feature-card.html)** — Only category-badge anchors on /features/ asserted; show_refs and compact modes untested; name-collides with landing's .landing-feature-card
- **CTA button include (components/cta-button.html)** — Accessible-name asserted indirectly; .zer0-cta emitted but never styled; URL-normalization and external new-tab cue untested
- **Bootstrap component polish (UI enhancements)** — Table/button-height/code-block asserted; ripple, card hover, badge hover, and window.zer0UI toast/clipboard untested; many hardcoded rgba shadows not token/dark-mode-safe
- **Design Tokens (--zer0-* layer)** — Only --zer0-color-primary and --zer0-bp-lg asserted; spacing/typography/shadow/motion/layer tokens and --bd-* aliasing untested.
- **Palette Generator (palette-generator.js)** — YAML quoting + picker/text sync asserted; harmony algorithms, live --bs-* application, and layout-range round-trip (emitted commented-out) untested.
- **Theme Customizer & Preview Gallery (admin UI)** — Page-load + YAML-quoting tested via the customizer page; card-grid click-to-apply, copy/download buttons, keyboard activation, and skin-list source drift (order=7 vs fallback 'dark') untested.
- **Code copy button** — Header/gutter presence + keyboard focus asserted, but the copy action, comment-line stripping (drops #-lines, corrupts YAML/shell), and copied-state reset are untested/unannounced.
- **Posts pagination** — Only aria-current is asserted; ellipsis range builder, prev/next disabling, hash navigation, and showing-X-of-N math untested.
- **Article layout** — Only single-H1 tested; pros/cons condition mixes and/or without grouping (renders for non-reviews); About-the-Author duplicates author-card; 8 post_type variants untested.
- **Wiki-Links ([[Page]])** — Ruby + JS-shim unit coverage of HTML output, but no real-browser DOM-rewrite test and broken links use clickable href=# with no a11y.
- **Embeds & Transclusion (![[…]])** — Converter output tested; transclude.html Liquid include and Ruby/JS markup divergence (card vs flat excerpt) untested.
- **Callouts (> [!type])** — Type mapping/fold/collapse asserted in units, but foldable [!type]- has no expand toggle JS and role=alert a11y is untested.
- **Inline Tags (#tag)** — Tag rewrite + code-skip tested; tag anchor target (/tags/#slug) existence and badge a11y/contrast unverified.
- **Wiki Index (wiki-index.json)** — Build smoke validates JSON shape/count only; outgoing-edge extraction heuristic and Ruby/Liquid index parity untested.
- **Config Viewer** — Search/copy only smoke-tested; section-copy hex-quoting regression is fixme'd and unfixed.
- **Config Editor** — Spec locators (#cfg-title/#cfg-skin) don't match real ids (#edit-*), so editor tests silently skip — fix selectors.
- **Raw YAML / Config Sanitization** — sanitize_config_filter.rb has no Ruby unit test; duplicated secret patterns in Liquid + Ruby can drift.
- **Navigation Editor** — Edit Menus tab is a non-functional stub; two parallel export mechanisms; nav_files list duplicated across 3 includes.
- **Collection Manager** — Read-only despite 'Manager' name; table/accordion content not directly asserted.
- **Analytics Dashboard** — Config mirror only (no live PostHog data); raw true/false text vs badge styling inconsistent; field rendering not asserted.
- **Statistics Dashboard** — Expand toggles/tag-cloud/no-data branch untested; stats.css has duplicated keyframes + dead classes; progress bars 0% without JS.
- **PostHog Analytics** — Secret-pattern guard only; consent gate + DNT logic untested (production-only render); console.log left in.
- **Halfmoon Theme Switcher** — Tokens-load asserted but toggle behavior/persistence/aria-pressed untested; markup hard-codes dark active.
- **Misc Widgets (powered-by, showcase, js-cdn, svg)** — No-CDN posture checked for CSS only (not <script>); no SVG symbol/use integrity or showcase render test.


---

## Appendix: Coverage Completeness

Files in `_sass`, `_includes`, `_layouts`, `assets/js` not directly named by a component entry above, categorized so genuine UI blind-spots are separable from intentional exclusions:

**Covered elsewhere in this doc (barrels / scaffolding / architecture overview)**
- `_sass/core/_variables.scss` — Bootstrap `!default` override surface (see [Architecture](#architecture-at-a-glance))
- `_sass/core/_theme.scss` — theme barrel (`@import`s color-modes/wizard/css-variables/skins/backgrounds)
- `_sass/custom.scss` — thin custom-layer barrel (see [Architecture](#architecture-at-a-glance))
- `_sass/layouts/_section.scss` / `_layouts/section.html` — covered by the **Section include** entry
- `_layouts/root.html` — base HTML document (parent of `default.html`), covered structurally
- `_includes/components/searchbar.html` — inline search input, covered by the **Search modal** entry

**Accessibility utilities — UI-relevant, worth their own future entries**
- `_sass/utilities/_focus.scss` — global `:focus-visible` ring + `.zer0-skip-link` (token-based). Tested indirectly via `accessibility.spec.js` skip-link focusability.
- `_sass/utilities/_motion.scss` — global `prefers-reduced-motion` reset (canonical). No direct test that animations actually stop.

**Behavior scripts not yet itemized**
- `assets/js/back-to-top.js` — drives the **Back-to-Top FAB** (entry exists; JS path just not listed in its sources)
- `assets/js/navigation.js` — legacy navigation entry; verify whether superseded by `assets/js/modules/navigation/*`
- `assets/js/myScript.js` — unclear purpose; audit for dead code

**Non-UI (SEO / structured data / sitemap) — intentionally out of scope**
- `_includes/content/seo.html`, `jsonld-software.html`, `jsonld-faq.html`, `sitemap.html`, `_layouts/sitemap-collection.html`

_Generated by a multi-agent sweep of the codebase + tests. Regenerate when components are added or removed._

