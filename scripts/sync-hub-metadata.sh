#!/usr/bin/env bash
# =============================================================================
# sync-hub-metadata.sh
# =============================================================================
#
# Thin wrapper around scripts/sync-hub-metadata.rb.
#
# Refreshes the org content hub dashboard data (_data/hub_index.yml and
# _data/navigation/hub.yml) from the GitHub API. Content stays in the source
# repos — nothing is cloned or copied here.
#
# Usage:
#   ./scripts/sync-hub-metadata.sh               # refresh dashboard data
#   ./scripts/sync-hub-metadata.sh --check       # validate registry/output only (CI/PR gate)
#   ./scripts/sync-hub-metadata.sh --dry-run     # print planned actions only
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec ruby "${SCRIPT_DIR}/sync-hub-metadata.rb" "$@"
