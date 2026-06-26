# Navigation Data Schema Documentation
# ===================================
#
# This directory contains YAML navigation data files used by the sidebar
# and navbar components. All files follow a standardized schema.
#
# ## Schema Definition
#
# Each navigation item can have the following properties:
#
# ```yaml
# - title: string        # Required - Display text
#   url: string          # Optional - Link URL (relative to site root)
#   icon: string         # Optional - Bootstrap Icons class (e.g., "bi-folder")
#   description: string  # Optional - Tooltip or description text
#   expanded: boolean    # Optional - Default expanded state (default: false)
#   children: array      # Optional - Nested navigation items (recursive)
# ```
#
# ## Navigation Modes
#
# The sidebar supports three navigation modes set via `page.sidebar.nav`:
#
# 1. **auto** - Auto-generates from collection documents
# 2. **tree** - Uses YAML data from this directory
# 3. **categories** - Groups by Jekyll categories
#
# ## Available Files
#
# - main.yml      - Primary site navigation (navbar)
# - docs.yml      - Documentation section navigation
# - about.yml     - About section navigation
# - quickstart.yml - Quick start guide navigation
# - home.yml      - Homepage quick links
# - posts.yml     - Blog category navigation
#
# ## Example Usage
#
# In page front matter:
# ```yaml
# sidebar:
#   nav: docs  # Uses _data/navigation/docs.yml
# ```
#
# ## Navbar capacity & responsive constraints (main.yml)
#
# The top navbar adapts the `main.yml` items to the viewport automatically:
#
# - **≥ lg (992px+):** items render inline. The center track degrades in tiers
#   as it gets crowded — full labels → ellipsized labels → icon-only — before
#   anything is dropped.
# - **< lg:** the full menu moves into the slide-in offcanvas (hamburger), so
#   item count and label length never affect the bar itself there.
#
# Guidance:
# - Aim for **~6–7 top-level items**. More still work, but on compact desktops
#   (≈992–1200px) they collapse to icon-only and, past the track's capacity,
#   would clip. Group extras under `children:` dropdowns instead of adding more
#   top-level entries.
# - Long titles ellipsize rather than overflow; keep them short for legibility.
# - On local/dev hosts the navbar logs a `console.warn` ("[zer0-mistakes
#   navbar]") when items don't fit or page content overflows the viewport — your
#   cue that a config exceeds what the bar can show. (Silent in production.)
# - The theme also clips stray horizontal page overflow at the root, so an
#   over-stuffed nav or wide content can never make the fixed navbar look "cut
#   off". Wide tables/code keep their own local scroll. Regression-guarded by
#   test/visual/navbar-responsive.spec.js.
#
# ## Schema Validation
#
# Navigation YAML is validated at build time by _plugins/navigation_validator.rb
# Invalid schemas will produce build warnings.
#
# ## Migration Notes (v2.0)
#
# - Renamed `sublinks` to `children` for consistency with tree terminology
# - Added `expanded` property for default state
# - Navigation modes changed: dynamic→auto, searchCats→categories
