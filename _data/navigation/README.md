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
