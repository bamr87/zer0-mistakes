# \_includes Directory Organization

This directory has been reorganized for better maintainability and clarity. Files are now grouped by functionality into subdirectories.

## Directory Structure

### `core/`

Essential layout components that form the foundation of the site:

- `head.html` - HTML document head with meta tags, scripts, and styles
- `favicon.html` - Favicon / browser-identity tags (icon links, apple-touch, manifest, theme-color) driven by the optional `favicon:` config block
- `header.html` - Main site header with navigation
- `footer.html` - Site footer (if exists)
- `branding.html` - Site branding and title display
- `i18n.html` - Resolves the per-page-language UI-string set into the `ui` variable (generated translations fall back to English)
- `hreflang.html` - `<link rel="alternate" hreflang>` tags for pages with machine-generated translations

### `navigation/`

All navigation-related components:

- `navbar.html` - Main navigation menu
- `sidebar-left.html` - Left sidebar panel (offcanvas shell around the resolved nav)
- `sidebar-config.html` - Resolves the effective sidebar mode/title/icon (page → collection → site); shared by layout, header, sidebar, and drawer
- `sidebar-nav.html` - Renders the resolved sidebar mode (dispatches to the includes below)
- `sidebar-right.html` - Right sidebar content
- `sidebar-folders.html` - "collection" mode: collapsible folder tree of a collection's documents
- `sidebar-categories.html` - "categories"/"tags" modes: posts grouped by taxonomy term
- `nav_list.html` - Manual navigation list rendering
- `breadcrumbs.html` - Navigation breadcrumbs

### `analytics/`

Analytics and tracking integrations:

- `google-analytics.html` - Google Analytics tracking
- `google-tag-manager-head.html` - GTM head section (emits nothing unless `google_tag_manager:` is set in `_config.yml`)
- `google-tag-manager-body.html` - GTM body section (same config gate)

### `components/`

Reusable UI components and widgets:

- `searchbar.html` - Deprecated search stub (superseded by `search-modal.html`)
- `language-toggle.html` - Navbar dropdown switching between the English original and its machine-generated translations
- `translation-notice.html` - Disclosure banner on machine-translated pages linking back to the English original
- `powered-by.html` - "Powered by" credits display
- `quick-index.html` - Quick page index
- `dev-shortcuts.html` - Developer shortcuts
- `info-section.html` - Settings offcanvas (Appearance / Site / Developer tabs)
- `admin-links.html` - Cached admin quick links for the settings offcanvas
- `halfmoon.html` - Light/dark/auto color-mode segmented control
- `zer0-env-var.html` - Environment variable configuration
- `svg.html` - SVG icon definitions
- `js-cdn.html` - CDN JavaScript libraries
- `preview-image.html` - Consistent preview image rendering with lazy loading
- `post-card.html` - Reusable post card component for listings
- `bookshelf.html` - Grid of every book in the `books` collection (home-page library)
- `book-card.html` - One book's portrait cover card (bookshelf tile)
- `book-toc.html` - Ordered story/chapter list for one book
- `book-nav.html` - Prev/next-story + contents navigation inside a book
- `book-plate.html` - Full-width illustration figure with optional caption for story pages

### `content/`

Content-specific features and enhancements:

- `seo.html` - SEO meta tags and structured data
- `toc.html` - Table of contents generation
- `giscus.html` - GitHub Discussions comment system
- `intro.html` - Page introduction section
- `sitemap.html` - Sitemap generation

### `landing/`

Landing page specific components:

- `landing-install-cards.html` - Installation method cards
- `landing-quick-links.html` - Quick links bar

### `docs/`

Documentation and reference materials:

- `bootstrap-docs.html` - Bootstrap documentation (moved from style.html)

## Usage

When including files in layouts or other templates, use the full path:

```liquid
{% include core/head.html %}
{% include navigation/sidebar-left.html %}
{% include components/search-modal.html %}
{% include analytics/google-analytics.html %}
```

## Benefits of This Organization

1. **Logical Grouping**: Related functionality is grouped together
2. **Easier Maintenance**: Finding and editing specific components is simpler
3. **Reduced Conflicts**: Clear separation reduces naming conflicts
4. **Better Documentation**: Each directory has a clear purpose
5. **Scalability**: Easy to add new components to appropriate directories

## Migration Notes

- All include paths in layouts have been updated to reflect the new structure
- The duplicate `toc` file has been removed
- Large Bootstrap documentation moved to `docs/` directory
- No functionality has been changed, only organization
