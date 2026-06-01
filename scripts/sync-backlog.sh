#!/usr/bin/env bash
# =============================================================================
# sync-backlog.sh
# =============================================================================
#
# Thin wrapper around scripts/sync-backlog.rb.
#
# Mirrors `_data/backlog.yml` (the tactical task queue) to GitHub Issues:
# open tasks become open issues; tasks marked `done` close their issue.
#
# Usage:
#   ./scripts/sync-backlog.sh             # create/update/close issues via gh
#   ./scripts/sync-backlog.sh --check     # validate schema only (CI/PR gate)
#   ./scripts/sync-backlog.sh --dry-run   # print intended gh calls only
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec ruby "${SCRIPT_DIR}/sync-backlog.rb" "$@"
