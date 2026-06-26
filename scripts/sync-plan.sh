#!/usr/bin/env bash
# =============================================================================
# sync-plan.sh
# =============================================================================
#
# Thin wrapper around scripts/sync-plan.rb.
#
# Validates (and optionally mirrors) `_data/roadmap_plan.yml` — the order-only
# plan artifact produced by the /issue-plan committee — against the backlog.
#
# Usage:
#   ./scripts/sync-plan.sh             # upsert the pinned tracking issue via gh
#   ./scripts/sync-plan.sh --check     # validate plan vs backlog (CI/PR gate)
#   ./scripts/sync-plan.sh --dry-run   # print the intended gh call only
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec ruby "${SCRIPT_DIR}/sync-plan.rb" "$@"
