#!/usr/bin/env bash
# =============================================================================
# provision-org-sites.sh
# =============================================================================
#
# Thin wrapper around scripts/provision-org-sites.rb.
#
# Rolls the GitHub Pages scaffold (templates/org-site/*) out to the org repos
# registered in _data/hub.yml so each publishes at https://<org>.github.io/<repo>/
# using this theme via remote_theme. Content never leaves the source repo.
#
# Usage:
#   ./scripts/provision-org-sites.sh --dry-run         # preview everything
#   ./scripts/provision-org-sites.sh                   # open scaffold PRs
#   ./scripts/provision-org-sites.sh --enable-pages    # PRs + enable Pages
#   ./scripts/provision-org-sites.sh --check           # validate registry + templates
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec ruby "${SCRIPT_DIR}/provision-org-sites.rb" "$@"
