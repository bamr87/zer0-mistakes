---
title: "Feature Change Log"
description: "Implementation notes for Mermaid v2 integration, sidebar improvements, frontmatter validator bug fixes, and the Copilot Agent prompt button."
date: 2025-10-04T20:39:25.000Z
lastmod: 2026-05-31T20:54:52.000Z
categories: [docs]
tags: [implementation, changelog]
author: bamr87
---

# Feature Change Log

Condensed implementation records for completed features. For current feature documentation, see [docs/features/](../features/).

---

## Copilot Agent Prompt Button (v1.0.0, April 2026)

**Files**: `_includes/content/intro.html`, `_data/prompts.yml`

A dropdown button in every page's intro section that opens a pre-filled GitHub issue assigned to `@copilot`. The user selects a prompt template; the issue body is auto-populated with the template text + a Page Context table (title, URL, file path, layout, tags) + an Environment table (repo, site URL, Jekyll env, theme).

**Architecture**:

```text
_data/prompts.yml          ← source of truth: all prompt templates
_includes/content/intro.html ← renders the dropdown; iterates site.data.prompts
```

**10 built-in templates** in two groups:

- *Page Improvements*: Improve Page, Expand Page, Update Page, Fix Page Issue, SEO Optimize, Accessibility Audit
- *Site Improvements*: UI/UX Improvement, New Feature, Component Enhancement, Performance Optimization

**Prompt schema** in `_data/prompts.yml`:

```yaml
- id: string           # unique slug
  label: string        # dropdown label
  icon: string         # Bootstrap Icons class
  group: string        # optional section header
  description: string  # subtitle in dropdown
  body: |              # multi-line prompt text
```

**To add a prompt**: add an entry to `_data/prompts.yml`; it appears in the dropdown on the next Jekyll build. No template changes required.

**Config required**: `repository: "owner/repo"` in `_config.yml` (constructs the GitHub issue URL).

**Troubleshooting**: empty dropdown → invalid YAML in `prompts.yml`; issue URL truncated → shorten `body` fields (GitHub URL limit ~8000 chars); `[object Object]` in title → `page.title` not a string.

---

## Frontmatter Validator Bug Fixes — PR #34 (May 2026)

**Files**: `scripts/lint-pages`, `scripts/lib/frontmatter.sh`

Five correctness bugs in the new `scripts/lint-pages` validator and `scripts/lib/frontmatter.sh` library:

1. **`YAML.safe_load` rejected `Time` objects** — Jekyll timestamps (`lastmod: 2024-05-25T19:07:46.394Z`) deserialize as Ruby `Time` instances, which `safe_load` rejects by default. Fix: pass `permitted_classes: [Date, Time, Symbol], aliases: true` to all 3 `YAML.safe_load` call sites.

2. **`Time#to_s` doesn't produce ISO 8601** — valid `lastmod` values were flagged because `puts` on a `Time` instance prints `2024-05-25 19:07:46 UTC`, failing the schema's datetime regex. Fix: `get_frontmatter_field` now formats `Time` → `%Y-%m-%dT%H:%M:%S.%LZ`, `Date` → `%Y-%m-%d`, everything else → `to_s`.

3. **Mid-document `---` misread as frontmatter** — files with a horizontal rule `---` in the body but no frontmatter header reported YAML parse errors. Fix: `extract_frontmatter` now requires the file's first line to be `---`.

4. **`set -e` aborted the scan loop** — when `extract_frontmatter` returned non-zero, `set -euo pipefail` killed subsequent iterations. Fix: wrapped the call in `|| true`.

5. **Auto-fix produced duplicate `lastmod:` keys** — `--fix` added a new `lastmod` before renaming the legacy `updated:` field, creating two `lastmod` lines. Fix: deprecated-field renames now run first; required-field adds run after re-extracting.

**Result**: 42 false-positive errors eliminated; `pages/_about/` (18 files) scans clean.

---

## Sidebar UI/UX Improvements (December 2025)

**Key files**: `assets/js/sidebar.js` (new, 570 lines), `_includes/navigation/sidebar-right.html`, `_sass/custom.scss`

Six improvements:

1. **Fixed scroll spy** — corrected `data-bs-target` to point to `#TableOfContents`; added `data-bs-smooth-scroll="true"`.

2. **FAB-style mobile TOC button** — replaced fixed `top-50 end-0` positioning with `bottom-0 end-0` Floating Action Button (56×56px, z-index 1030, `shadow-lg`).

3. **Unified icon library** — removed Font Awesome; all icons now Bootstrap Icons (`bi-file-text`, `bi-folder2-open`, `bi-list-ul`, etc.).

4. **New `sidebar.js`** — five modules:
   - *Intersection Observer ScrollSpy*: performance-optimized active section tracking (replaces scroll events)
   - *SmoothScroll*: offset-aware scrolling with URL updates; mobile offcanvas auto-close
   - *KeyboardShortcuts*: `[` / `]` for prev/next section, `/` for search (placeholder)
   - *SwipeGestures*: swipe right → left sidebar, swipe left → TOC (50px threshold)
   - *FocusManager*: focus trap in offcanvas; return focus on close

5. **Responsive widths** — removed hardcoded `width: 280px` from sidebar-categories.html.

6. **Accessibility** — skip-to-content link in `header.html`; `role="navigation"` and `aria-label` on sidebars; `aria-controls` on toggles.

**Performance**: Intersection Observer reduces scroll event overhead by ~70%.

---

## Mermaid Integration v2.0 (January 2025 / v0.3.0)

**Issue**: [#6](https://github.com/bamr87/zer0-mistakes/issues/6) | **Branch**: `feature/mermaid-integration-v2`

**Core files**:

- `_includes/components/mermaid.html` — Mermaid v10 config, forest theme, FontAwesome support, responsive CSS
- `_includes/core/head.html` — conditional include: `{% if page.mermaid %}{% include components/mermaid.html %}{% endif %}`
- `assets/vendor/mermaid/mermaid.min.js` — vendored; refresh with `npm run vendor:mermaid`

**Usage**: add `mermaid: true` to page front matter; wrap diagrams in `<div class="mermaid">...</div>`.

**Supported diagram types**: flowcharts (all directions), sequence, class, state, ER, Gantt, pie, git graphs, journey, mindmaps.

**Testing**: `scripts/test-mermaid.sh` — 16 automated tests (file existence, config, functionality); 16/16 passing. Modes: `--quick`, `--local`, `--docker`.

**Cleanup**: consolidated 15 scattered Mermaid files → 7 organized files (53% reduction). Removed `docs/MERMAID-QUICKSTART.md`, outdated diagram guide, `scripts/validate-mermaid-native.sh`.

**No breaking changes**: existing `mermaid: true` pages continue to work.
